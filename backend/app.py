"""
BrihanMumbai Fix - Flask Backend (Monolith)
Handles: User auth, image upload, AI classification, complaint generation, MongoDB
"""

# ============================================================================
# IMPORTS
# ============================================================================
import os
import json
import time
import ipaddress
from datetime import datetime, timedelta
from functools import wraps
from collections import defaultdict
import threading
import html
import re

from flask import Flask, request, jsonify, make_response, abort, g
from flask_cors import CORS
from dotenv import load_dotenv

import bcrypt
import jwt
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
import cloudinary
import cloudinary.uploader
from groq import Groq
import requests

# ============================================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================================
load_dotenv()

# ============================================================================
# FLASK APP INITIALIZATION
# ============================================================================
app = Flask(__name__)

# ============================================================================
# CORS CONFIGURATION
# ============================================================================
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# Configure CORS to allow both old Vite (5173) and new Next.js (3000) frontends
# Plus production Vercel URL when deployed
allowed_origins = [
    'https://brihanmumbai-fix.vercel.app',  # Production
    'http://localhost:3000',                 # Next.js dev (primary)
    'http://localhost:5173',                 # Old Vite dev (for transition safety)
    FRONTEND_URL,                            # From .env
]

CORS(app, 
     origins=allowed_origins,
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
     expose_headers=['Set-Cookie']
)

# ============================================================================
# MONGODB CONNECTION
# ============================================================================
MONGO_URI = os.getenv('MONGO_URI')
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is required")

client = MongoClient(MONGO_URI)
db = client['brihanmumbai_fix']

# Collections
users_collection = db.users
complaints_collection = db.complaints
admins_collection = db.admins  # Admin panel collection

# ============================================================================
# CLOUDINARY CONFIGURATION
# ============================================================================
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# ============================================================================
# GEMINI AI CONFIG
# ============================================================================
import google.generativeai as genai

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Fallback chain: each model has its own separate RPD quota even on same key.
# Real limits as of April 2026 from Google AI Studio:
# gemini-2.5-flash      → 20 RPD  (best vision quality)
# gemini-2.5-flash-lite → 20 RPD  (same key, separate bucket)
# gemini-3.1-flash-lite → 500 RPD (best RPD, good vision)
# groq llama vision     → generous free tier (final fallback)
GEMINI_CONFIGS = [
    {'api_key': GEMINI_API_KEY, 'model': 'gemini-3.1-flash-lite-preview', 'label': 'gemini-3.1-flash-lite-preview'},
    {'api_key': GEMINI_API_KEY, 'model': 'gemini-2.5-flash-lite', 'label': 'gemini-2.5-flash-lite'},
    {'api_key': GEMINI_API_KEY, 'model': 'gemini-2.5-flash', 'label': 'gemini-2.5-flash'},
]

# ============================================================================
# GROQ AI CLIENT
# ============================================================================
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
groq_client = Groq(api_key=GROQ_API_KEY)

# ============================================================================
# JWT SECRET
# ============================================================================
JWT_SECRET = os.getenv('JWT_SECRET')
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable is required")

# ============================================================================
# SECURITY MIDDLEWARE LAYER
# ============================================================================

# ──── Section A: Security Headers Middleware ────────────────────────────

@app.after_request
def add_security_headers(response):
    """Add security headers to every response."""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    # Remove server fingerprint
    response.headers.pop('Server', None)
    response.headers.pop('X-Powered-By', None)
    return response


# ──── Section B: Rate Limiting (in-memory, no Redis needed) ────────────

# Thread-safe in-memory rate limiter
_rate_limit_store = defaultdict(list)
_rate_limit_lock = threading.Lock()
TRUSTED_PROXY_IPS = {
    ip.strip() for ip in os.getenv('TRUSTED_PROXY_IPS', '').split(',') if ip.strip()
}

def rate_limit(max_requests: int, window_seconds: int):
    """
    Decorator that limits requests per IP.
    Usage: @rate_limit(max_requests=10, window_seconds=60)
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            def _normalize_ip(ip_value):
                if not ip_value:
                    return ''
                candidate = str(ip_value).strip()
                if not candidate or len(candidate) > 64:
                    return ''

                # Handle common host:port forms
                if candidate.count(':') == 1 and '.' in candidate:
                    host, port = candidate.rsplit(':', 1)
                    if port.isdigit():
                        candidate = host
                if candidate.startswith('[') and ']:' in candidate:
                    candidate = candidate[1:candidate.index(']:')]
                elif candidate.startswith('[') and candidate.endswith(']'):
                    candidate = candidate[1:-1]

                try:
                    ipaddress.ip_address(candidate)
                    return candidate
                except ValueError:
                    return ''

            remote_ip = _normalize_ip(request.remote_addr) or '0.0.0.0'
            trust_x_forwarded_for = False
            try:
                remote_ip_obj = ipaddress.ip_address(remote_ip)
                trust_x_forwarded_for = (
                    remote_ip in TRUSTED_PROXY_IPS
                    or remote_ip_obj.is_loopback
                    or remote_ip_obj.is_private
                )
            except ValueError:
                trust_x_forwarded_for = remote_ip in TRUSTED_PROXY_IPS

            ip = remote_ip
            if trust_x_forwarded_for:
                xff = request.headers.get('X-Forwarded-For', '')
                if xff:
                    forwarded_ip = _normalize_ip(xff.split(',')[0])
                    if forwarded_ip:
                        ip = forwarded_ip
            
            key = f"{f.__name__}:{ip}"
            now = time.time()
            
            with _rate_limit_lock:
                # Remove timestamps outside the window
                _rate_limit_store[key] = [
                    t for t in _rate_limit_store[key] 
                    if now - t < window_seconds
                ]
                
                if len(_rate_limit_store[key]) >= max_requests:
                    return error('Too many requests. Please slow down.', 429)
                
                _rate_limit_store[key].append(now)
            
            return f(*args, **kwargs)
        return wrapper
    return decorator


# ──── Section C: Input Sanitization Helpers ────────────────────────────

ALLOWED_TEXT_PATTERN = re.compile(r'[<>{}|\[\]\\]')

def sanitize_string(value: str, max_length: int = 500) -> str:
    """
    Sanitize a string input:
    - Strip leading/trailing whitespace
    - Escape HTML entities
    - Remove dangerous characters
    - Enforce max length
    """
    if not isinstance(value, str):
        return ''
    value = value.strip()
    value = html.escape(value)                    # &, <, >, ", ' → entities
    value = ALLOWED_TEXT_PATTERN.sub('', value)   # remove remaining dangerous chars
    return value[:max_length]


def sanitize_email(value: str) -> str:
    """Validate and sanitize email format."""
    if not isinstance(value, str):
        return ''
    value = value.strip().lower()[:254]
    email_pattern = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
    if not email_pattern.match(value):
        return ''
    return value


def get_safe_body() -> dict:
    """
    Safely parse JSON body. Returns empty dict on failure.
    Rejects requests with body larger than 100KB to prevent memory attacks.
    """
    if request.content_length and request.content_length > 102400:  # 100KB
        abort(413, 'Request body too large')
    try:
        data = request.get_json(force=False, silent=True)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


# ──── Section C.1: NoSQL Injection Prevention ────────────────────────────

def safe_object_id(id_string: str) -> ObjectId:
    """
    Safely convert string to MongoDB ObjectId.
    Raises 400 error if the string is not a valid ObjectId format.
    Prevents NoSQL injection via malformed ID strings.
    """
    try:
        return ObjectId(str(id_string)[:24])  # ObjectId is always 24 hex chars
    except (InvalidId, TypeError, ValueError):
        abort(400, 'Invalid ID format')


def safe_mongo_string(value: str) -> str:
    """
    Prevent NoSQL operator injection in string fields.
    MongoDB operators start with $ — strip any $ from user input.
    """
    if not isinstance(value, str):
        return ''
    # Remove $ operators that could be used for NoSQL injection
    return re.sub(r'\$', '', value)[:500]


# ──── Section D: File Upload Validation ────────────────────────────────

try:
    import magic
except ImportError:
    magic = None

ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB


def validate_upload(file) -> tuple:
    """
    Validate uploaded file:
    - Check file exists
    - Check size limit
    - Check MIME type from file content (not just extension)
    - Return (is_valid, error_message)
    """
    if not file:
        return False, 'No file provided'
    
    file.seek(0, 2)  # Seek to end
    size = file.tell()
    file.seek(0)     # Reset
    
    if size > MAX_FILE_SIZE_BYTES:
        return False, 'File too large. Maximum size is 5MB'
    
    if size == 0:
        return False, 'File is empty'
    
    # Read first 2048 bytes to detect real MIME type
    header = file.read(2048)
    file.seek(0)
    
    if magic:
        try:
            detected_mime = magic.from_buffer(header, mime=True)
            if detected_mime not in ALLOWED_MIME_TYPES:
                return False, f'Invalid file type. Only JPEG, PNG, WebP allowed'
        except Exception:
            # If magic fails, fall back to extension check only
            filename = getattr(file, 'filename', '')
            ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
            if ext not in {'jpg', 'jpeg', 'png', 'webp'}:
                return False, 'Invalid file type'
    else:
        # Fallback: extension check only if magic not available
        filename = getattr(file, 'filename', '')
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        if ext not in {'jpg', 'jpeg', 'png', 'webp'}:
            return False, 'Invalid file type'
    
    return True, ''

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def generate_token(user_id: str, role: str = 'user') -> str:
    """Generate JWT token with hardened security checks.
    
    Args:
        user_id: User or admin ID
        role: 'user' or 'admin' (default: 'user')
    
    Returns:
        JWT token string
    
    Raises:
        ValueError if JWT_SECRET is not strong enough
    """
    if not JWT_SECRET or len(JWT_SECRET) < 32:
        raise ValueError('JWT_SECRET must be at least 32 characters long')
    
    payload = {
        'user_id': str(user_id),
        'role': role,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
    return token


def verify_token(request):
    """
    Hardened JWT verification. Reads from Authorization header first,
    then falls back to bmf_token cookie. This supports both:
    - Direct API calls with Authorization: Bearer <token>
    - Browser requests where httpOnly cookie is sent automatically
    
    Priority:
    1. Authorization header
    2. bmf_token cookie (httpOnly, set by Flask on login)
    
    Args:
        request: Flask request object
    
    Returns:
        str: user_id if successful
        Raises: abort(401) or abort(403) on any failure
    """
    token = None

    # Priority 1: Authorization header
    auth_header = request.headers.get('Authorization', '')
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            token = parts[1]
        else:
            abort(401, 'Invalid Authorization header format')

    # Priority 2: httpOnly cookie fallback
    if not token:
        token = request.cookies.get('bmf_token')

    if not token:
        abort(401, 'Authentication required')

    # Reject tokens that are obviously too long (possible attack vector)
    if len(token) > 2048:
        abort(401, 'Invalid token')

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=['HS256'],  # explicit — never allow 'none' algorithm
            options={
                'require': ['user_id', 'exp', 'role'],  # all 3 must be present
                'verify_exp': True
            }
        )
    except jwt.ExpiredSignatureError:
        abort(401, 'Token has expired. Please log in again.')
    except jwt.InvalidTokenError:
        abort(401, 'Invalid token')

    user_id = payload.get('user_id')
    if not user_id or not isinstance(user_id, str):
        abort(401, 'Malformed token payload')

    return user_id


def verify_admin(request):
    """
    Verify admin JWT token and check admin role.
    Reads from Authorization header first, then falls back to bmf_admin_token cookie.
    
    Priority:
    1. Authorization header
    2. bmf_admin_token cookie (httpOnly, set by Flask on admin login)
    
    Args:
        request: Flask request object
    
    Returns:
        str: user_id if successful and user is admin
        Raises: abort(401) if not authenticated, abort(403) if not admin
    """
    token = None

    # Priority 1: Authorization header
    auth_header = request.headers.get('Authorization', '')
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            token = parts[1]
        else:
            abort(401, 'Invalid Authorization header format')

    # Priority 2: httpOnly cookie fallback
    if not token:
        token = request.cookies.get('bmf_admin_token')

    if not token:
        abort(401, 'Authentication required')

    # Reject tokens that are obviously too long (possible attack vector)
    if len(token) > 2048:
        abort(401, 'Invalid token')

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=['HS256'],
            options={
                'require': ['user_id', 'exp', 'role'],
                'verify_exp': True
            }
        )
    except jwt.ExpiredSignatureError:
        abort(401, 'Token has expired. Please log in again.')
    except jwt.InvalidTokenError:
        abort(401, 'Invalid token')

    # Check admin role
    role = payload.get('role', '')
    if role != 'admin':
        abort(403, 'Admin access required')

    user_id = payload.get('user_id')
    if not user_id or not isinstance(user_id, str):
        abort(401, 'Malformed token payload')

    return user_id


def error(message, code=400):
    """Return standardized error response"""
    return jsonify({'error': message}), code


def success(data, code=200):
    """Return standardized success response"""  
    return jsonify(data), code


def get_cookie_security_options(req):
    """
    Use secure cookie settings in production, but allow local HTTP development.
    - localhost / 127.0.0.1: secure=False, SameSite=Lax
    - production domains: secure=True, SameSite=None
    """
    host = (req.host.split(':')[0].lower() if req and req.host else '')
    is_local = host in ('localhost', '127.0.0.1')
    return {
        'secure': not is_local,
        'samesite': 'None' if not is_local else 'Lax'
    }


# ============================================================================
# MUMBAI BMC WARD DEPARTMENTS DATA
# ============================================================================

WARD_DEPARTMENTS = {
    "A-Ward": {
        "email": "ward_a@mcgm.gov.in",
        "phone": "022-22693333",
        "office": "Churchgate/Fort Municipal Office"
    },
    "B-Ward": {
        "email": "ward_b@mcgm.gov.in",
        "phone": "022-23455678",
        "office": "Mandvi/Masjid Municipal Office"
    },
    "C-Ward": {
        "email": "ward_c@mcgm.gov.in",
        "phone": "022-23456789",
        "office": "Mumbadevi/Bhuleshwar Municipal Office"
    },
    "D-Ward": {
        "email": "ward_d@mcgm.gov.in",
        "phone": "022-23678901",
        "office": "Malabar Hill/Gamdevi Municipal Office"
    },
    "E-Ward": {
        "email": "ward_e@mcgm.gov.in",
        "phone": "022-23789012",
        "office": "Byculla/Mazagaon Municipal Office"
    },
    "F/N-Ward": {
        "email": "ward_fn@mcgm.gov.in",
        "phone": "022-24567890",
        "office": "Sion/Dharavi Municipal Office"
    },
    "F/S-Ward": {
        "email": "ward_fs@mcgm.gov.in",
        "phone": "022-24678901",
        "office": "Sewri/Wadala Municipal Office"
    },
    "G/N-Ward": {
        "email": "ward_gn@mcgm.gov.in",
        "phone": "022-23890123",
        "office": "Grant Road/Tardeo Municipal Office"
    },
    "G/S-Ward": {
        "email": "ward_gs@mcgm.gov.in",
        "phone": "022-24901234",
        "office": "Worli/Lower Parel Municipal Office"
    },
    "H/E-Ward": {
        "email": "ward_he@mcgm.gov.in",
        "phone": "022-26012345",
        "office": "Santacruz/Kurla Link Municipal Office"
    },
    "H/W-Ward": {
        "email": "ward_hw@mcgm.gov.in",
        "phone": "022-26123456",
        "office": "Bandra/Khar Municipal Office"
    },
    "K/E-Ward": {
        "email": "ward_ke@mcgm.gov.in",
        "phone": "022-28234567",
        "office": "Andheri East Municipal Office"
    },
    "K/W-Ward": {
        "email": "ward_kw@mcgm.gov.in",
        "phone": "022-26345678",
        "office": "Andheri West/Versova Municipal Office"
    },
    "L-Ward": {
        "email": "ward_l@mcgm.gov.in",
        "phone": "022-25456789",
        "office": "Kurla Municipal Office"
    },
    "M/E-Ward": {
        "email": "ward_me@mcgm.gov.in",
        "phone": "022-25567890",
        "office": "Govandi/Mankhurd Municipal Office"
    },
    "M/W-Ward": {
        "email": "ward_mw@mcgm.gov.in",
        "phone": "022-25678901",
        "office": "Chembur Municipal Office"
    },
    "N-Ward": {
        "email": "ward_n@mcgm.gov.in",
        "phone": "022-25789012",
        "office": "Ghatkopar Municipal Office"
    },
    "P/N-Ward": {
        "email": "ward_pn@mcgm.gov.in",
        "phone": "022-28890123",
        "office": "Goregaon Municipal Office"
    },
    "P/S-Ward": {
        "email": "ward_ps@mcgm.gov.in",
        "phone": "022-28901234",
        "office": "Malad Municipal Office"
    },
    "R/C-Ward": {
        "email": "ward_rc@mcgm.gov.in",
        "phone": "022-28012345",
        "office": "Borivali Municipal Office"
    },
    "R/N-Ward": {
        "email": "ward_rn@mcgm.gov.in",
        "phone": "022-28123456",
        "office": "Dahisar Municipal Office"
    },
    "R/S-Ward": {
        "email": "ward_rs@mcgm.gov.in",
        "phone": "022-28234568",
        "office": "Kandivali Municipal Office"
    },
    "S-Ward": {
        "email": "ward_s@mcgm.gov.in",
        "phone": "022-25678902",
        "office": "Mulund Municipal Office"
    },
    "T-Ward": {
        "email": "ward_t@mcgm.gov.in",
        "phone": "022-25789013",
        "office": "Mulund East Municipal Office"
    },
    "General": {
        "email": "complaints@mcgm.gov.in",
        "phone": "022-22694727",
        "office": "BMC Head Office, Mumbai"
    }
}

# ============================================================================
# HEALTH CHECK
# ============================================================================
START_TIME = time.time()

@app.route('/health')
def health():
    uptime_seconds = int(time.time() - START_TIME)
    return jsonify({
        "status": "ok",
        "uptime_seconds": uptime_seconds
    }), 200


# ============================================================================
# AUTHENTICATION ROUTES  
# ============================================================================

@app.route('/api/auth/register', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=900)
def register():
    """Register a new user"""
    try:
        data = get_safe_body()
        
        # Extract and sanitize fields
        name = sanitize_string(data.get('name', ''), max_length=100)
        email = sanitize_email(data.get('email', ''))
        password = data.get('password', '')
        
        # Validate inputs
        if not name:
            return error('Name is required', 400)
        if not email:
            return error('Invalid email address', 400)
        if not password or len(password) < 8:
            return error('Password must be at least 8 characters', 400)
        if len(password) > 128:
            return error('Password too long', 400)
        
        # Check if email already exists
        existing_user = users_collection.find_one({'email': email.lower()})
        if existing_user:
            return error('Email already registered', 409)
        
        # Hash password with bcrypt (cost factor 12)
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12))
        
        # Insert user into database
        user_doc = {
            'name': name,
            'email': email.lower(),
            'password_hash': password_hash,
            'created_at': datetime.utcnow()
        }
        
        result = users_collection.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Generate JWT token
        token = generate_token(user_id)
        
        # Create response data
        response_data = {
            'user': {
                'id': user_id,
                'name': name,
                'email': email.lower()
            },
            'token': token  # Include for debugging
        }
        
        response = make_response(jsonify(response_data), 201)
        
        # Set HTTP-only cookie (secure in production, local-safe in dev)
        cookie_options = get_cookie_security_options(request)
        response.set_cookie(
            'bmf_token',
            token,
            max_age=7*24*60*60,  # 7 days in seconds
            httponly=True,
            secure=cookie_options['secure'],
            samesite=cookie_options['samesite']
        )
        
        return response
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


@app.route('/api/auth/login', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=900)
def login():
    """Login existing user"""
    try:
        data = get_safe_body()
        
        # Extract and sanitize fields
        email = sanitize_email(data.get('email', ''))
        password = data.get('password', '')
        
        # Validate input
        if not email or not password:
            return error('Email and password required', 400)
        
        # Find user by email
        user = users_collection.find_one({'email': email})
        if not user:
            return error('User not found', 404)
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash']):
            return error('Invalid credentials', 401)
        
        # Generate JWT token
        user_id = str(user['_id'])
        token = generate_token(user_id)
        
        # Create response data
        response_data = {
            'user': {
                'id': user_id,
                'name': user['name'],
                'email': user['email']
            },
            'token': token  # Include for debugging
        }
        
        response = make_response(jsonify(response_data), 200)
        
        # Set HTTP-only cookie (secure in production, local-safe in dev)
        cookie_options = get_cookie_security_options(request)
        response.set_cookie(
            'bmf_token',
            token,
            max_age=7*24*60*60,  # 7 days in seconds
            httponly=True,
            secure=cookie_options['secure'],
            samesite=cookie_options['samesite']
        )
        
        return response
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """Get current authenticated user's information"""
    try:
        user_id = verify_token(request)
        user = users_collection.find_one({'_id': safe_object_id(user_id)})
        if not user:
            return error('User not found', 404)
        return success({
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'created_at': user['created_at'].isoformat()
        }, 200)
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout user by clearing cookie"""
    response = make_response(jsonify({
        'success': True,
        'message': 'Logged out successfully'
    }), 200)
    
    # Clear the authentication cookie (match active cookie policy)
    cookie_options = get_cookie_security_options(request)
    response.set_cookie(
        'bmf_token',
        '',
        max_age=0,
        httponly=True,
        secure=cookie_options['secure'],
        samesite=cookie_options['samesite']
    )
    
    return response


# ============================================================================
# ADMIN AUTHENTICATION ROUTES
# ============================================================================

@app.route('/api/admin/login', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=900)
def admin_login():
    """Admin login (searches users collection with role='admin')"""
    try:
        data = get_safe_body()
        
        # Extract and sanitize fields
        email = sanitize_email(data.get('email', ''))
        password = data.get('password', '')
        
        # Validate input
        if not email or not password:
            return error('Email and password are required', 400)
        
        # Find admin by email AND role='admin' in users collection
        admin = users_collection.find_one({
            'email': email,
            'role': 'admin'
        })
        
        if not admin:
            return error('Invalid admin credentials', 401)
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), admin['password_hash']):
            return error('Invalid admin credentials', 401)
        
        # Generate JWT token with role='admin'
        admin_id = str(admin['_id'])
        token = generate_token(admin_id, role='admin')
        
        # Create response data
        response_data = {
            'admin': {
                'id': admin_id,
                'name': admin['name'],
                'email': admin['email']
            },
            'token': token  # Include for debugging
        }
        
        response = make_response(jsonify(response_data), 200)
        
        # Set HTTP-only cookie for admin (secure in production, local-safe in dev)
        cookie_options = get_cookie_security_options(request)
        response.set_cookie(
            'bmf_admin_token',
            token,
            max_age=7*24*60*60,  # 7 days in seconds
            httponly=True,
            secure=cookie_options['secure'],
            samesite=cookie_options['samesite']
        )
        
        return response
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


@app.route('/api/admin/me', methods=['GET'])
def get_current_admin():
    """Get current authenticated admin's information"""
    try:
        # Verify admin token
        result = verify_admin(request)
        
        # If result is error response tuple, return it
        if isinstance(result, tuple):
            return result
        
        admin_id = result
        
        # Fetch admin from database
        admin = users_collection.find_one({'_id': safe_object_id(admin_id)})
        
        if not admin:
            return error('Admin not found', 404)
        
        # Return admin information
        return success({
            'id': str(admin['_id']),
            'name': admin['name'],
            'email': admin['email'],
            'role': 'admin'
        }, 200)
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    """Logout admin by clearing cookie"""
    response = make_response(jsonify({
        'success': True,
        'message': 'Admin logged out successfully'
    }), 200)
    
    # Clear the admin authentication cookie (match active cookie policy)
    cookie_options = get_cookie_security_options(request)
    response.set_cookie(
        'bmf_admin_token',
        '',
        max_age=0,
        httponly=True,
        secure=cookie_options['secure'],
        samesite=cookie_options['samesite']
    )
    
    return response


# ============================================================================
# ADMIN COMPLAINT MANAGEMENT ROUTES
# ============================================================================

@app.route('/api/admin/complaints', methods=['GET'])
def admin_get_complaints():
    """Get all complaints with filters and pagination (admin only)"""
    try:
        # Verify admin token
        result = verify_admin(request)
        if isinstance(result, tuple):
            return result
        
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        status = safe_mongo_string(request.args.get('status', ''))
        issue_type = safe_mongo_string(request.args.get('issue_type', ''))
        ward = safe_mongo_string(request.args.get('ward', ''))
        search = safe_mongo_string(request.args.get('search', ''))
        
        # Build filter dynamically
        filter_dict = {}
        if status:
            filter_dict['status'] = status
        if issue_type:
            filter_dict['issue_type'] = issue_type
        if ward:
            filter_dict['ward_number'] = ward
        if search:
            filter_dict['location'] = {'$regex': search, '$options': 'i'}
        
        # Get total count
        total = complaints_collection.count_documents(filter_dict)
        
        # Calculate pagination
        skip = (page - 1) * limit
        import math
        pages = math.ceil(total / limit) if limit > 0 else 0
        
        # Query complaints with pagination
        complaints_cursor = complaints_collection.find(filter_dict).sort('created_at', -1).skip(skip).limit(limit)
        
        # Fetch complaints and join user info
        complaints_list = []
        for complaint in complaints_cursor:
            # Fetch user info
            user = users_collection.find_one({'_id': safe_object_id(str(complaint['user_id']))})
            
            # Build complaint dict with user info
            complaint_dict = {
                'id': str(complaint['_id']),
                'user_id': str(complaint['user_id']),
                'user_name': user['name'] if user else 'Unknown',
                'user_email': user['email'] if user else 'Unknown',
                'image_url': complaint.get('image_url', ''),
                'issue_type': complaint.get('issue_type', ''),
                'severity': complaint.get('severity', ''),
                'description': complaint.get('description', ''),
                'department': complaint.get('department', ''),
                'location': complaint.get('location', ''),
                'ward_number': complaint.get('ward_number', ''),
                'latitude': complaint.get('latitude'),
                'longitude': complaint.get('longitude'),
                'complaint_text': complaint.get('complaint_text', ''),
                'status': complaint.get('status', 'Submitted'),
                'created_at': complaint['created_at'].isoformat() if complaint.get('created_at') else None,
                'updated_at': complaint['updated_at'].isoformat() if complaint.get('updated_at') else None
            }
            complaints_list.append(complaint_dict)
        
        return success({
            'complaints': complaints_list,
            'total': total,
            'page': page,
            'limit': limit,
            'pages': pages
        }, 200)
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


@app.route('/api/admin/complaints/<complaint_id>', methods=['GET'])
def admin_get_complaint(complaint_id):
    """Get single complaint by ID (admin only)"""
    try:
        # Verify admin token
        result = verify_admin(request)
        if isinstance(result, tuple):
            return result
        
        # Find complaint - safe_object_id already handles exceptions
        complaint = complaints_collection.find_one({'_id': safe_object_id(complaint_id)})
        
        if not complaint:
            return error('Complaint not found', 404)
        
        # Fetch user info
        user = users_collection.find_one({'_id': safe_object_id(str(complaint['user_id']))})
        
        # Build response with user info
        complaint_dict = {
            'id': str(complaint['_id']),
            'user_id': str(complaint['user_id']),
            'user_name': user['name'] if user else 'Unknown',
            'user_email': user['email'] if user else 'Unknown',
            'image_url': complaint.get('image_url', ''),
            'issue_type': complaint.get('issue_type', ''),
            'severity': complaint.get('severity', ''),
            'description': complaint.get('description', ''),
            'department': complaint.get('department', ''),
            'location': complaint.get('location', ''),
            'ward_number': complaint.get('ward_number', ''),
            'latitude': complaint.get('latitude'),
            'longitude': complaint.get('longitude'),
            'complaint_text': complaint.get('complaint_text', ''),
            'status': complaint.get('status', 'Submitted'),
            'created_at': complaint['created_at'].isoformat() if complaint.get('created_at') else None,
            'updated_at': complaint['updated_at'].isoformat() if complaint.get('updated_at') else None
        }
        
        return success(complaint_dict, 200)
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


@app.route('/api/admin/complaints/<complaint_id>/status', methods=['PATCH'])
def admin_update_complaint_status(complaint_id):
    """Update complaint status (admin only)"""
    try:
        # Verify admin token
        result = verify_admin(request)
        if isinstance(result, tuple):
            return result
        
        # Get status from request body
        data = request.get_json()
        new_status = data.get('status', '').strip()
        
        # Validate status
        valid_statuses = ['Submitted', 'In Progress', 'Resolved', 'Rejected']
        if new_status not in valid_statuses:
            return error(f'Invalid status. Must be one of: {", ".join(valid_statuses)}', 400)
        
        # Update complaint
        updated_at = datetime.utcnow()
        result = complaints_collection.update_one(
            {'_id': safe_object_id(complaint_id)},
            {'$set': {
                'status': new_status,
                'updated_at': updated_at
            }}
        )
        
        if result.matched_count == 0:
            return error('Complaint not found', 404)
        
        return success({
            'success': True,
            'complaint_id': complaint_id,
            'new_status': new_status,
            'updated_at': updated_at.isoformat()
        }, 200)
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


@app.route('/api/admin/stats', methods=['GET'])
def admin_get_stats():
    """Get aggregate statistics (admin only)"""
    try:
        # Verify admin token
        result = verify_admin(request)
        if isinstance(result, tuple):
            return result
        
        # Total complaints
        total = complaints_collection.count_documents({})
        
        # By status
        submitted = complaints_collection.count_documents({'status': 'Submitted'})
        in_progress = complaints_collection.count_documents({'status': 'In Progress'})
        resolved = complaints_collection.count_documents({'status': 'Resolved'})
        rejected = complaints_collection.count_documents({'status': 'Rejected'})
        
        # By issue type
        issue_types = [
            'Pothole',
            'Garbage/Waste',
            'Water Leakage',
            'Broken Streetlight',
            'Damaged Footpath',
            'Open Drain',
            'Illegal Construction',
            'Other'
        ]
        by_issue_type = {}
        for issue_type in issue_types:
            by_issue_type[issue_type] = complaints_collection.count_documents({'issue_type': issue_type})
        
        # By severity
        by_severity = {
            'Low': complaints_collection.count_documents({'severity': 'Low'}),
            'Medium': complaints_collection.count_documents({'severity': 'Medium'}),
            'High': complaints_collection.count_documents({'severity': 'High'}),
            'Critical': complaints_collection.count_documents({'severity': 'Critical'})
        }
        
        return success({
            'total': total,
            'submitted': submitted,
            'in_progress': in_progress,
            'resolved': resolved,
            'rejected': rejected,
            'by_issue_type': by_issue_type,
            'by_severity': by_severity
        }, 200)
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


# ============================================================================
# IMAGE ANALYSIS ROUTE
# ============================================================================

def analyze_image_with_fallback(image_url: str) -> dict:
    """
    Tries Gemini models in order (each has its own RPD quota).
    If all 3 Gemini models hit their daily limit, falls back to Groq vision.
    Returns structured dict always — never raises to the route.
    """

    VISION_PROMPT = """You are a civic issue classifier for Mumbai's BMC.
Analyze the image and return ONLY valid JSON with this exact structure:
{
  "issue_type": "<one of: Pothole, Garbage/Waste, Water Leakage, Broken Streetlight, Damaged Footpath, Open Drain, Illegal Construction, Other>",
  "severity": "<one of: Low, Medium, High, Critical>",
  "description": "<2-3 sentence factual description of what you see>",
  "department": "<one of: Roads Department, Solid Waste Management, Water Supply, Street Lighting, Storm Water Drain, Building Proposal, General>",
  "confidence": <integer 0-100>
}
Return only the JSON. No markdown, no explanation. If not a civic issue, set issue_type to Other."""

    DEFAULT_RESULT = {
        'issue_type': 'Other',
        'severity': 'Medium',
        'description': 'Image could not be analyzed automatically. Please describe the issue manually.',
        'department': 'General',
        'confidence': 0,
        'model_used': 'none'
    }

    def parse_json_response(raw_text: str) -> dict:
        """Parse model output JSON from plain text, fenced blocks, or mixed output."""
        text = (raw_text or '').strip()
        if not text:
            raise json.JSONDecodeError('Empty model response', raw_text or '', 0)

        # 1) Prefer fenced ```json ... ``` payloads when present.
        fenced_match = re.search(r'```(?:json)?\s*(.*?)\s*```', text, flags=re.IGNORECASE | re.DOTALL)
        if fenced_match:
            fenced_text = fenced_match.group(1).strip()
            try:
                return json.loads(fenced_text)
            except json.JSONDecodeError:
                pass

        # 2) Try direct JSON parse.
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # 3) Fallback: extract first JSON object from extra prose.
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start:end + 1].strip())

        raise json.JSONDecodeError('No JSON object found in model response', text, 0)

    # ── Try Gemini models ──────────────────────────────────────
    import urllib.request, base64

    def build_gemini_url(model_id: str, api_key: str) -> str:
        return (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model_id}:generateContent?key={api_key}"
        )

    def guess_mime_type(url: str) -> str:
        ext = url.split('.')[-1].lower().split('?')[0]
        media_type_map = {'jpg': 'jpeg', 'jpeg': 'jpeg', 'png': 'png', 'webp': 'webp'}
        return f"image/{media_type_map.get(ext, 'jpeg')}"

    for config in GEMINI_CONFIGS:
        if not config['api_key']:
            print(f"[AI Fallback] Skipping {config['label']}: missing API key")
            continue
        print(f"[AI] Attempting Gemini model: {config['label']}")
        response = None
        try:
            with urllib.request.urlopen(image_url, timeout=10) as resp:
                image_bytes = resp.read()
            print(f"[AI] Cloudinary image download succeeded for {config['label']}")

            payload = {
                'contents': [{
                    'parts': [
                        {'text': VISION_PROMPT},
                        {
                            'inline_data': {
                                'mime_type': guess_mime_type(image_url),
                                'data': base64.b64encode(image_bytes).decode('utf-8')
                            }
                        }
                    ]
                }],
                'generationConfig': {
                    'temperature': 0.1,
                    'maxOutputTokens': 512
                }
            }

            response = requests.post(
                build_gemini_url(config['model'], config['api_key']),
                json=payload,
                timeout=(5, 20)
            )
            if response.status_code != 200:
                print(
                    f"[AI Fallback] {config['label']} HTTP {response.status_code}: "
                    f"{response.text[:500]}"
                )
                continue

            data = response.json()
            raw_text = (
                data.get('candidates', [{}])[0]
                .get('content', {})
                .get('parts', [{}])[0]
                .get('text', '')
            )
            result = parse_json_response(raw_text)
            result['model_used'] = config['label']
            print(f"[AI] Success with {config['label']}")
            print(f"[AI] Final model_used: {result['model_used']}")
            return result

        except json.JSONDecodeError as e:
            raw_text = response.text if response is not None else ''
            print(f"[AI Fallback] {config['label']} JSON decode failed: {type(e).__name__}: {e}")
            if raw_text:
                print(f"[AI Fallback] {config['label']} raw response: {raw_text}")
            continue

        except Exception as e:
            err = str(e).lower()
            print(f"[AI Fallback] {config['label']} exception: {type(e).__name__}: {e}")
            is_quota_error = any(x in err for x in [
                '429', 'quota', 'rate_limit', 'resource_exhausted',
                'too many', 'daily limit', 'exceeded'
            ])
            if is_quota_error:
                print(f"[AI Fallback] {config['label']} quota hit, trying next...")
                continue
            else:
                # Non-quota error (network, auth, etc) — also try next
                print(f"[AI Fallback] {config['label']} error: {e}, trying next...")
                continue

    # ── All Gemini models exhausted → try Groq vision ─────────
    if GROQ_API_KEY:
        try:
            import base64, urllib.request

            with urllib.request.urlopen(image_url, timeout=10) as resp:
                image_b64 = base64.b64encode(resp.read()).decode('utf-8')

            # Detect extension from Cloudinary URL for media_type
            ext = image_url.split('.')[-1].lower().split('?')[0]
            media_type_map = {'jpg': 'jpeg', 'jpeg': 'jpeg', 'png': 'png', 'webp': 'webp'}
            media_type = f"image/{media_type_map.get(ext, 'jpeg')}"

            groq_response = groq_client.chat.completions.create(
                model='meta-llama/llama-4-scout-17b-16e-instruct',
                messages=[{
                    'role': 'user',
                    'content': [
                        {
                            'type': 'image_url',
                            'image_url': {
                                'url': f"data:{media_type};base64,{image_b64}"
                            }
                        },
                        {
                            'type': 'text',
                            'text': VISION_PROMPT
                        }
                    ]
                }],
                max_tokens=512,
                temperature=0.1
            )

            raw = groq_response.choices[0].message.content
            result = parse_json_response(raw)
            result['model_used'] = 'groq:llama-4-scout'
            print("[AI] Success with Groq fallback")
            print(f"[AI] Final model_used: {result['model_used']}")
            return result

        except json.JSONDecodeError as e:
            print(f"[AI Fallback] Groq JSON decode failed: {type(e).__name__}: {e}")
        except Exception as e:
            print(f"[AI Fallback] Groq also failed: {type(e).__name__}: {e}")

    # ── All options failed ─────────────────────────────────────
    print("[AI] All models exhausted, returning default")
    print(f"[AI] Final model_used: {DEFAULT_RESULT['model_used']}")
    return DEFAULT_RESULT


@app.route('/api/analyze-image', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=3600)
def analyze_image():
    """Analyze civic issue image using Gemini AI with fallback chain"""
    try:
        # Authenticate user
        user_id = verify_token(request)
        
        # Validate file with security checks
        file = request.files.get('image')
        is_valid, err_msg = validate_upload(file)
        if not is_valid:
            return error(err_msg, 400)
        
        # Upload image to Cloudinary
        try:
            upload_result = cloudinary.uploader.upload(
                file,
                folder="brihanmumbai"
            )
            image_url = upload_result['secure_url']
        except Exception as e:
            print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
            return error('An internal error occurred. Please try again.', 500)
        
        # Analyze image with fallback chain
        try:
            print(f"🔍 Starting image analysis for: {image_url}")
            analysis = analyze_image_with_fallback(image_url)
            
            # Return analysis result with model info
            return success({
                'image_url': image_url,
                'issue_type': analysis.get('issue_type', 'Other'),
                'severity': analysis.get('severity', 'Medium'),
                'description': analysis.get('description', 'Civic issue detected'),
                'department': analysis.get('department', 'General'),
                'confidence': analysis.get('confidence', 0),
                'model_used': analysis.get('model_used', 'unknown')
            }, 200)
            
        except Exception as e:
            print(f"❌ Analysis error: {str(e)}")
            # Return default result on any error
            return success({
                'image_url': image_url,
                'issue_type': 'Other',
                'severity': 'Medium',
                'description': f'Unable to analyze image: {str(e)}',
                'department': 'General',
                'confidence': 0,
                'model_used': 'error'
            }, 200)
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


# ============================================================================
# COMPLAINT ROUTES
# ============================================================================

@app.route('/api/complaints', methods=['POST'])
@rate_limit(max_requests=30, window_seconds=3600)
def create_complaint():
    """Create a new complaint with Groq-generated formal text"""
    try:
        # Authenticate user
        user_id = verify_token(request)
        
        # Get request data safely
        data = get_safe_body()
        
        # Validate required fields
        image_url = data.get('image_url', '').strip()
        issue_type = data.get('issue_type', '').strip()
        location = sanitize_string(data.get('location', ''), max_length=300)
        
        if not image_url:
            return error('image_url is required', 400)
        if not image_url.startswith('https://res.cloudinary.com/'):
            return error('Invalid image URL', 400)
        if not issue_type:
            return error('issue_type is required', 400)
        if not location:
            return error('location is required', 400)
        
        # Extract other fields
        severity = data.get('severity', 'Medium')
        description = data.get('description', '')
        department = data.get('department', 'General')
        ward_number = sanitize_string(data.get('ward_number', 'N/A'), max_length=20)
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        additional_details = sanitize_string(data.get('additional_details', ''), max_length=1000)
        
        # Generate formal complaint text with Groq
        try:
            user_prompt = f"""Write a formal, concise complaint letter for this civic issue:
Issue Type: {issue_type}
Severity: {severity}
Location: {location}, Ward {ward_number}
Department: {department}
Description: {description}

The letter should:
- Start with 'To, The {department}, BMC Ward {ward_number}'
- Be 3 short paragraphs (under 150 words total)
- State the issue clearly, mention public inconvenience, request urgent action
- End with 'Regards, A Concerned Citizen of Mumbai'
- Be formal and factual, no emotional language"""
            
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a formal complaint writer for Mumbai citizens filing BMC complaints."
                    },
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=300
            )
            
            complaint_text = chat_completion.choices[0].message.content.strip()
            
        except Exception as e:
            # Fallback complaint text if Groq fails
            complaint_text = f"""To, The {department}, BMC Ward {ward_number}

Subject: Complaint regarding {issue_type} at {location}

I am writing to bring to your attention a {issue_type.lower()} issue at {location} in Ward {ward_number}. {description}

This issue is causing significant inconvenience to residents and pedestrians in the area. I request you to take urgent action to resolve this matter at the earliest.

Regards,
A Concerned Citizen of Mumbai"""
        
        # Build complaint document
        complaint_doc = {
            'user_id': safe_object_id(user_id),
            'image_url': image_url,
            'issue_type': issue_type,
            'severity': severity,
            'description': description,
            'department': department,
            'location': location,
            'ward_number': ward_number,
            'latitude': latitude,
            'longitude': longitude,
            'additional_details': additional_details,
            'complaint_text': complaint_text,
            'status': 'Submitted',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Insert into database
        result = complaints_collection.insert_one(complaint_doc)
        complaint_id = str(result.inserted_id)
        
        # Return created complaint
        complaint_doc['_id'] = complaint_id
        complaint_doc['user_id'] = user_id
        complaint_doc['created_at'] = complaint_doc['created_at'].isoformat()
        complaint_doc['updated_at'] = complaint_doc['updated_at'].isoformat()
        
        return success(complaint_doc, 201)
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


@app.route('/api/complaints', methods=['GET'])
def get_complaints():
    """Get all complaints for authenticated user with pagination"""
    try:
        # Authenticate user
        user_id = verify_token(request)
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        # Calculate skip
        skip = (page - 1) * limit
        
        # Find complaints for this user
        query = {'user_id': safe_object_id(user_id)}
        total = complaints_collection.count_documents(query)
        
        complaints_cursor = complaints_collection.find(query).sort('created_at', -1).skip(skip).limit(limit)
        
        # Convert to list and format
        complaints = []
        for complaint in complaints_cursor:
            complaint['_id'] = str(complaint['_id'])
            complaint['user_id'] = str(complaint['user_id'])
            complaint['created_at'] = complaint['created_at'].isoformat()
            complaint['updated_at'] = complaint['updated_at'].isoformat()
            complaints.append(complaint)
        
        return success({
            'complaints': complaints,
            'total': total,
            'page': page,
            'limit': limit
        }, 200)
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


@app.route('/api/complaints/<complaint_id>', methods=['GET'])
def get_complaint(complaint_id):
    """Get single complaint by ID (only if user owns it)"""
    try:
        # Authenticate user
        user_id = verify_token(request)
        
        # Find complaint by ID and user_id (security check)
        complaint = complaints_collection.find_one({
            '_id': safe_object_id(complaint_id),
            'user_id': safe_object_id(user_id)
        })
        
        if not complaint:
            return error('Complaint not found', 404)
        
        # Format response
        complaint['_id'] = str(complaint['_id'])
        complaint['user_id'] = str(complaint['user_id'])
        complaint['created_at'] = complaint['created_at'].isoformat()
        complaint['updated_at'] = complaint['updated_at'].isoformat()
        
        return success(complaint, 200)
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


@app.route('/api/complaints/<complaint_id>/status', methods=['PATCH'])
def update_complaint_status(complaint_id):
    """Update complaint status"""
    try:
        # Authenticate user
        user_id = verify_token(request)
        
        # Get new status
        data = request.get_json()
        new_status = data.get('status', '').strip()
        
        # Validate status
        valid_statuses = ['Submitted', 'In Progress', 'Resolved', 'Rejected']
        if new_status not in valid_statuses:
            return error(f'Invalid status. Must be one of: {", ".join(valid_statuses)}', 400)
        
        # Update complaint
        result = complaints_collection.update_one(
            {
                '_id': safe_object_id(complaint_id),
                'user_id': safe_object_id(user_id)
            },
            {
                '$set': {
                    'status': new_status,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return error('Complaint not found', 404)
        
        # Fetch and return updated complaint
        complaint = complaints_collection.find_one({
            '_id': safe_object_id(complaint_id),
            'user_id': safe_object_id(user_id)
        })
        
        complaint['_id'] = str(complaint['_id'])
        complaint['user_id'] = str(complaint['user_id'])
        complaint['created_at'] = complaint['created_at'].isoformat()
        complaint['updated_at'] = complaint['updated_at'].isoformat()
        
        return success(complaint, 200)
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


# ============================================================================
# COMMUNITY FEED ROUTE
# ============================================================================

@app.route('/api/feed/preview', methods=['GET'])
@rate_limit(max_requests=120, window_seconds=60)
def get_feed_preview():
    """Public preview of 4 most recent complaints — no auth required"""
    try:
        complaints_cursor = complaints_collection.find({}).sort('created_at', -1).limit(4)
        posts = []
        for complaint in complaints_cursor:
            try:
                user = users_collection.find_one(
                    {'_id': safe_object_id(str(complaint['user_id']))},
                    {'name': 1}
                )
                citizen_name = user['name'] if user else 'Anonymous'
                posts.append({
                    'id': str(complaint['_id']),
                    'citizen_name': citizen_name,
                    'image_url': complaint.get('image_url', ''),
                    'issue_type': complaint.get('issue_type', ''),
                    'severity': complaint.get('severity', ''),
                    'location': complaint.get('location', ''),
                    'ward_number': complaint.get('ward_number', ''),
                    'latitude': complaint.get('latitude'),
                    'longitude': complaint.get('longitude'),
                    'status': complaint.get('status', 'Submitted'),
                    'created_at': complaint['created_at'].isoformat() if complaint.get('created_at') else None
                })
            except Exception:
                continue
        return success({'posts': posts, 'total': len(posts)}, 200)
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


@app.route('/api/feed', methods=['GET'])
@rate_limit(max_requests=60, window_seconds=60)
def get_community_feed():
    """Get community feed of all complaints (paginated)"""
    try:
        # Verify user token - now returns user_id directly, or aborts on error
        user_id = verify_token(request)
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 12))
        
        # Calculate pagination
        skip = (page - 1) * limit
        
        # Get total count
        total = complaints_collection.count_documents({})
        
        # If no complaints, return empty feed
        if total == 0:
            return success({
                'posts': [],
                'total': 0,
                'page': page,
                'limit': limit,
                'has_more': False
            }, 200)
        
        # Query complaints with pagination, sorted by newest first
        complaints_cursor = complaints_collection.find({}).sort('created_at', -1).skip(skip).limit(limit)
        
        # Build feed posts with user names
        posts = []
        
        for complaint in complaints_cursor:
            try:
                # Fetch citizen name from users collection
                user = users_collection.find_one({'_id': safe_object_id(str(complaint['user_id']))}, {'name': 1})
                citizen_name = user['name'] if user else 'Anonymous'
                
                # Build lean post object
                post = {
                    'id': str(complaint['_id']),
                    'citizen_name': citizen_name,
                    'image_url': complaint.get('image_url', ''),
                    'issue_type': complaint.get('issue_type', ''),
                    'severity': complaint.get('severity', ''),
                    'location': complaint.get('location', ''),
                    'ward_number': complaint.get('ward_number', ''),
                    'latitude': complaint.get('latitude'),
                    'longitude': complaint.get('longitude'),
                    'status': complaint.get('status', 'Submitted'),
                    'created_at': complaint['created_at'].isoformat() if complaint.get('created_at') else None
                }
                posts.append(post)
            except Exception as post_error:
                # Skip individual post errors to avoid breaking the entire feed
                continue
        
        # Calculate has_more
        has_more = (page * limit) < total
        
        return success({
            'posts': posts,
            'total': total,
            'page': page,
            'limit': limit,
            'has_more': has_more
        }, 200)
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


# ============================================================================
# WARD INFORMATION ROUTE
# ============================================================================

@app.route('/api/ward-info', methods=['GET'])
def get_ward_info():
    """Get contact information for a specific BMC ward"""
    try:
        ward = request.args.get('ward', '').strip()
        
        if not ward:
            return error('Ward parameter is required', 400)
        
        # Look up ward info
        ward_info = WARD_DEPARTMENTS.get(ward)
        
        # If ward not found, return General contact info
        if not ward_info:
            ward_info = WARD_DEPARTMENTS.get('General')
            return success({
                'ward': 'General',
                **ward_info,
                'message': f'Specific info for "{ward}" not found. Showing general BMC contact.'
            }, 200)
        
        return success({
            'ward': ward,
            **ward_info
        }, 200)
        
    except Exception as e:
        print(f'[ERROR] {request.path}: {type(e).__name__}: {e}')
        return error('An internal error occurred. Please try again.', 500)


# ============================================================================
# MONGODB SCHEMA DOCUMENTATION & INDEX SETUP
# ============================================================================

"""
USERS COLLECTION SCHEMA:
{
  _id: ObjectId,
  name: str,
  email: str (unique),
  password_hash: str (bcrypt),
  created_at: datetime
}

COMPLAINTS COLLECTION SCHEMA:
{
  _id: ObjectId,
  user_id: ObjectId (ref to users),
  image_url: str (cloudinary URL),
  issue_type: str,
  severity: str (Low/Medium/High/Critical),
  description: str,
  department: str,
  location: str,
  ward_number: str,
  latitude: float or None,
  longitude: float or None,
  additional_details: str (optional, user-provided extra context),
  complaint_text: str (Groq generated),
  status: str (Submitted/In Progress/Resolved/Rejected),
  created_at: datetime,
  updated_at: datetime
}
"""

def setup_database_indexes():
    """Create database indexes for optimal query performance"""
    try:
        # Users collection indexes
        users_collection.create_index('email', unique=True, name='email_unique_idx')
        print("[OK] Users indexes created: email (unique)")
        
        # Complaints collection indexes
        complaints_collection.create_index('user_id', name='user_id_idx')
        complaints_collection.create_index([('created_at', -1)], name='created_at_desc_idx')
        complaints_collection.create_index(
            [('user_id', 1), ('status', 1)], 
            name='user_status_compound_idx'
        )
        print("[OK] Complaints indexes created: user_id, created_at (desc), user_id+status (compound)")
        
    except Exception as e:
        print(f"[WARN] Could not create indexes: {str(e)}")

# Initialize database indexes on startup
setup_database_indexes()


# ============================================================================
# GLOBAL ERROR HANDLERS
# ============================================================================

@app.errorhandler(400)
def bad_request(e):
    return jsonify({'error': str(e.description) if e.description else 'Bad request'}), 400

@app.errorhandler(401)
def unauthorized(e):
    return jsonify({'error': str(e.description) if e.description else 'Unauthorized'}), 401

@app.errorhandler(403)
def forbidden(e):
    return jsonify({'error': str(e.description) if e.description else 'Forbidden'}), 403

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'error': 'Method not allowed'}), 405

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'Request too large'}), 413

@app.errorhandler(429)
def too_many_requests(e):
    return jsonify({'error': 'Too many requests. Please slow down.'}), 429

@app.errorhandler(500)
def internal_error(e):
    # NEVER send internal error details to client in production
    print(f"[Internal Error] {e}")  # logs to Render console only
    return jsonify({'error': 'An internal error occurred. Please try again.'}), 500

@app.errorhandler(Exception)
def unhandled_exception(e):
    # Catch any unhandled exception — log it but never expose it
    print(f"[Unhandled Exception] {type(e).__name__}: {e}")
    return jsonify({'error': 'An unexpected error occurred.'}), 500


# ============================================================================
# RUN SERVER
# ============================================================================
if __name__ == '__main__':
    app.run(debug=True, port=5000)
