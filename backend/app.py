"""
BrihanMumbai Fix - Flask Backend (Monolith)
Handles: User auth, image upload, AI classification, complaint generation, MongoDB
"""

# ============================================================================
# IMPORTS
# ============================================================================
import os
import json
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from dotenv import load_dotenv

import bcrypt
import jwt
from pymongo import MongoClient
import cloudinary
import cloudinary.uploader
from groq import Groq

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
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

# Configure CORS properly for production
CORS(app, 
     origins=['https://brihanmumbai-fix.vercel.app', 'http://localhost:5173', FRONTEND_URL],
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
# GEMINI AI CLIENT (Using REST API directly)
# ============================================================================
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")

# Updated to latest model: gemini-2.5-flash-lite (gemini-1.5-flash is deprecated)
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={GEMINI_API_KEY}"

# ============================================================================
# GROQ AI CLIENT
# ============================================================================
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is required")

groq_client = Groq(api_key=GROQ_API_KEY)

# ============================================================================
# JWT SECRET
# ============================================================================
JWT_SECRET = os.getenv('JWT_SECRET')
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable is required")

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def generate_token(user_id, role='user'):
    """Generate JWT token for authentication (expires in 7 days)
    Args:
        user_id: User or admin ID
        role: 'user' or 'admin' (default: 'user')
    """
    payload = {
        'user_id': str(user_id),
        'role': role,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
    return token


def verify_token(request, required_role=None):
    """Verify JWT token from request cookies and return user_id and role
    Args:
        request: Flask request object
        required_role: Optional role to check ('user', 'admin')
    Returns:
        tuple: (user_id, role) if successful
        Flask response: error response if failed
    """
    # Try cookies first, then fallback to Authorization header for debugging
    token = request.cookies.get('bmf_token') or request.cookies.get('bmf_admin_token')
    
    # Fallback to Authorization header if no cookie (for debugging)
    if not token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
    
    if not token:
        return error('Authentication required', 401)
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = payload['user_id']
        role = payload.get('role', 'user')  # Default to 'user' for backward compatibility
        
        # Check required role if specified
        if required_role and role != required_role:
            return error(f'Access denied. {required_role} role required', 403)
        
        return user_id, role
        
    except jwt.ExpiredSignatureError:
        return error('Token has expired', 401)
    except jwt.InvalidTokenError:
        return error('Invalid token', 401)


def verify_admin(request):
    """Verify admin JWT token from request cookies and return admin_id
    Args:
        request: Flask request object
    Returns:
        str: admin_id if successful
        Flask response: error response if failed (401 unauthorized, 403 forbidden)
    """
    token = request.cookies.get('bmf_admin_token')
    
    # Fallback to Authorization header if no cookie
    if not token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
    
    if not token:
        return error('Admin authentication required', 401)
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = payload['user_id']
        role = payload.get('role', 'user')
        
        # Check if role is admin
        if role != 'admin':
            return error('Forbidden: Admin access only', 403)
        
        return user_id
        
    except jwt.ExpiredSignatureError:
        return error('Token has expired', 401)
    except jwt.InvalidTokenError:
        return error('Invalid token', 401)


def error(message, code=400):
    """Return standardized error response"""
    return jsonify({'error': message}), code


def success(data, code=200):
    """Return standardized success response"""  
    return jsonify(data), code


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
# AUTHENTICATION ROUTES
# ============================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Extract fields
        email = data.get('email', '').strip()
        password = data.get('password', '')
        name = data.get('name', '').strip()
        
        # Validate email format
        if not email or '@' not in email or '.' not in email.split('@')[1]:
            return error('Invalid email format', 400)
        
        # Validate password (minimum 8 characters)
        if not password or len(password) < 8:
            return error('Password must be at least 8 characters', 400)
        
        # Validate name
        if not name:
            return error('Name is required', 400)
        
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
        
        # Set secure HTTP-only cookie
        response.set_cookie(
            'bmf_token',
            token,
            max_age=7*24*60*60,  # 7 days in seconds
            httponly=True,
            secure=True,  # Always secure in production (HTTPS)
            samesite='None'  # Allow cross-site cookies for production
        )
        
        return response
        
    except Exception as e:
        return error(f'Registration failed: {str(e)}', 500)


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login existing user"""
    try:
        data = request.get_json()
        
        # Extract fields
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Validate input
        if not email or not password:
            return error('Email and password are required', 400)
        
        # Find user by email
        user = users_collection.find_one({'email': email.lower()})
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
        
        # Set secure HTTP-only cookie
        response.set_cookie(
            'bmf_token',
            token,
            max_age=7*24*60*60,  # 7 days in seconds
            httponly=True,
            secure=True,  # Always secure in production (HTTPS)
            samesite='None'  # Allow cross-site cookies for production
        )
        
        return response
        
    except Exception as e:
        return error(f'Login failed: {str(e)}', 500)


@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """Get current authenticated user's information"""
    try:
        # Verify token and get user_id
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return error('Authorization header is missing', 401)
        
        try:
            # Expected format: "Bearer <token>"
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return error('Token has expired', 401)
        except jwt.InvalidTokenError:
            return error('Invalid token', 401)
        except IndexError:
            return error('Invalid authorization header format', 401)
        
        # Fetch user from database
        from bson import ObjectId
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return error('User not found', 404)
        
        # Return user information
        return success({
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'created_at': user['created_at'].isoformat()
        }, 200)
        
    except Exception as e:
        return error(f'Failed to fetch user: {str(e)}', 500)


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout user by clearing cookie"""
    response = make_response(jsonify({
        'success': True,
        'message': 'Logged out successfully'
    }), 200)
    
    # Clear the authentication cookie
    response.set_cookie(
        'bmf_token',
        '',
        max_age=0,
        httponly=True,
        secure=True,
        samesite='None'
    )
    
    return response


# ============================================================================
# ADMIN AUTHENTICATION ROUTES
# ============================================================================

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Admin login (searches users collection with role='admin')"""
    try:
        data = request.get_json()
        
        # Extract fields
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Validate input
        if not email or not password:
            return error('Email and password are required', 400)
        
        # Find admin by email AND role='admin' in users collection
        admin = users_collection.find_one({
            'email': email.lower(),
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
        
        # Set secure HTTP-only cookie for admin
        response.set_cookie(
            'bmf_admin_token',
            token,
            max_age=7*24*60*60,  # 7 days in seconds
            httponly=True,
            secure=True,  # Always secure in production (HTTPS)
            samesite='None'  # Allow cross-site cookies for production
        )
        
        return response
        
    except Exception as e:
        return error(f'Admin login failed: {str(e)}', 500)


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
        from bson import ObjectId
        admin = users_collection.find_one({'_id': ObjectId(admin_id)})
        
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
        return error(f'Failed to fetch admin: {str(e)}', 500)


@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    """Logout admin by clearing cookie"""
    response = make_response(jsonify({
        'success': True,
        'message': 'Admin logged out successfully'
    }), 200)
    
    # Clear the admin authentication cookie
    response.set_cookie(
        'bmf_admin_token',
        '',
        max_age=0,
        httponly=True,
        secure=True,
        samesite='None'
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
        status = request.args.get('status', '').strip()
        issue_type = request.args.get('issue_type', '').strip()
        ward = request.args.get('ward', '').strip()
        search = request.args.get('search', '').strip()
        
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
        from bson import ObjectId
        complaints_list = []
        for complaint in complaints_cursor:
            # Fetch user info
            user = users_collection.find_one({'_id': ObjectId(complaint['user_id'])})
            
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
        return error(f'Failed to fetch complaints: {str(e)}', 500)


@app.route('/api/admin/complaints/<complaint_id>', methods=['GET'])
def admin_get_complaint(complaint_id):
    """Get single complaint by ID (admin only)"""
    try:
        # Verify admin token
        result = verify_admin(request)
        if isinstance(result, tuple):
            return result
        
        # Find complaint
        from bson import ObjectId
        try:
            complaint = complaints_collection.find_one({'_id': ObjectId(complaint_id)})
        except:
            return error('Invalid complaint ID format', 400)
        
        if not complaint:
            return error('Complaint not found', 404)
        
        # Fetch user info
        user = users_collection.find_one({'_id': ObjectId(complaint['user_id'])})
        
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
        return error(f'Failed to fetch complaint: {str(e)}', 500)


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
        from bson import ObjectId
        try:
            updated_at = datetime.utcnow()
            result = complaints_collection.update_one(
                {'_id': ObjectId(complaint_id)},
                {'$set': {
                    'status': new_status,
                    'updated_at': updated_at
                }}
            )
        except:
            return error('Invalid complaint ID format', 400)
        
        if result.matched_count == 0:
            return error('Complaint not found', 404)
        
        return success({
            'success': True,
            'complaint_id': complaint_id,
            'new_status': new_status,
            'updated_at': updated_at.isoformat()
        }, 200)
        
    except Exception as e:
        return error(f'Failed to update complaint status: {str(e)}', 500)


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
        return error(f'Failed to fetch statistics: {str(e)}', 500)


# ============================================================================
# IMAGE ANALYSIS ROUTE
# ============================================================================

@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    """Analyze civic issue image using Gemini AI"""
    try:
        # Authenticate user
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return error('Authorization header is missing', 401)
        
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return error('Token has expired', 401)
        except jwt.InvalidTokenError:
            return error('Invalid token', 401)
        except IndexError:
            return error('Invalid authorization header format', 401)
        
        # Validate file exists
        if 'image' not in request.files:
            return error('No image file provided', 400)
        
        file = request.files['image']
        
        if file.filename == '':
            return error('No file selected', 400)
        
        # Validate file type
        allowed_extensions = {'jpg', 'jpeg', 'png', 'webp'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_extensions:
            return error('Invalid file type. Only jpg, jpeg, png, webp allowed', 400)
        
        # Upload image to Cloudinary
        try:
            upload_result = cloudinary.uploader.upload(
                file,
                folder="brihanmumbai"
            )
            image_url = upload_result['secure_url']
        except Exception as e:
            return error(f'Image upload failed: {str(e)}', 500)
        
        # Analyze image with Gemini AI
        try:
            print(f"🔍 Starting Gemini analysis for image: {image_url}")
            
            system_prompt = """You are a civic issue classifier for Mumbai's BMC (Brihanmumbai Municipal Corporation).
Analyze the image and return ONLY valid JSON with this exact structure:
{
  "issue_type": "<one of: Pothole, Garbage/Waste, Water Leakage, Broken Streetlight, Damaged Footpath, Open Drain, Illegal Construction, Other>",
  "severity": "<one of: Low, Medium, High, Critical>",
  "description": "<2-3 sentence factual description of what you see>",
  "department": "<one of: Roads Department, Solid Waste Management, Water Supply, Street Lighting, Storm Water Drain, Building Proposal, General>",
  "confidence": <number 0-100>
}
Do not include any text outside the JSON. If not a civic issue, set issue_type to Other."""
            
            # Download image from Cloudinary URL to send to Gemini
            import requests
            print(f"📥 Downloading image from Cloudinary...")
            image_response = requests.get(image_url)
            image_data = image_response.content
            print(f"✅ Image downloaded: {len(image_data)} bytes")
            
            # Determine mime type
            mime_type = 'image/jpeg'
            if file_ext == 'png':
                mime_type = 'image/png'
            elif file_ext == 'webp':
                mime_type = 'image/webp'
            
            # Generate content with Gemini using image bytes
            import PIL.Image
            import io
            import base64
            
            print(f"🖼️ Converting to PIL Image...")
            img = PIL.Image.open(io.BytesIO(image_data))
            print(f"✅ PIL Image created: {img.size}, mode: {img.mode}")
            
            # Convert image to base64 for Gemini REST API
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG')
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            print(f"🤖 Calling Gemini API via REST...")
            
            # Call Gemini REST API directly
            gemini_payload = {
                "contents": [{
                    "parts": [
                        {"text": system_prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": image_base64
                            }
                        }
                    ]
                }]
            }
            
            gemini_response = requests.post(
                GEMINI_API_URL,
                json=gemini_payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if gemini_response.status_code != 200:
                raise Exception(f"Gemini API error: {gemini_response.status_code} - {gemini_response.text}")
            
            gemini_data = gemini_response.json()
            gemini_text = gemini_data['candidates'][0]['content']['parts'][0]['text'].strip()
            
            print(f"✅ Gemini response received: {len(gemini_text)} chars")
            print(f"📄 Gemini raw response: {gemini_text[:200]}...")
            
            # Parse JSON (remove markdown code blocks if present)
            if gemini_text.startswith('```'):
                # Remove ```json and ``` markers
                gemini_text = gemini_text.replace('```json', '').replace('```', '').strip()
            
            analysis_data = json.loads(gemini_text)
            
            # Return analysis result
            return success({
                'image_url': image_url,
                'issue_type': analysis_data.get('issue_type', 'Other'),
                'severity': analysis_data.get('severity', 'Medium'),
                'description': analysis_data.get('description', 'Civic issue detected'),
                'department': analysis_data.get('department', 'General'),
                'confidence': analysis_data.get('confidence', 0)
            }, 200)
            
        except Exception as e:
            # Gemini analysis failed - log error and return default values
            print(f"❌ GEMINI ERROR: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            
            return success({
                'image_url': image_url,
                'issue_type': 'Other',
                'severity': 'Medium',
                'description': f'Unable to analyze image: {str(e)}',
                'department': 'General',
                'confidence': 0
            }, 200)
        
    except Exception as e:
        return error(f'Image analysis failed: {str(e)}', 500)


# ============================================================================
# COMPLAINT ROUTES
# ============================================================================

@app.route('/api/complaints', methods=['POST'])
def create_complaint():
    """Create a new complaint with Groq-generated formal text"""
    try:
        # Authenticate user
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return error('Authorization header is missing', 401)
        
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return error('Token has expired', 401)
        except jwt.InvalidTokenError:
            return error('Invalid token', 401)
        except IndexError:
            return error('Invalid authorization header format', 401)
        
        # Get request data
        data = request.get_json()
        
        # Validate required fields
        image_url = data.get('image_url', '').strip()
        issue_type = data.get('issue_type', '').strip()
        location = data.get('location', '').strip()
        
        if not image_url:
            return error('image_url is required', 400)
        if not issue_type:
            return error('issue_type is required', 400)
        if not location:
            return error('location is required', 400)
        
        # Extract other fields
        severity = data.get('severity', 'Medium')
        description = data.get('description', '')
        department = data.get('department', 'General')
        ward_number = data.get('ward_number', 'N/A')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
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
        from bson import ObjectId
        
        complaint_doc = {
            'user_id': ObjectId(user_id),
            'image_url': image_url,
            'issue_type': issue_type,
            'severity': severity,
            'description': description,
            'department': department,
            'location': location,
            'ward_number': ward_number,
            'latitude': latitude,
            'longitude': longitude,
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
        return error(f'Failed to create complaint: {str(e)}', 500)


@app.route('/api/complaints', methods=['GET'])
def get_complaints():
    """Get all complaints for authenticated user with pagination"""
    try:
        # Authenticate user
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return error('Authorization header is missing', 401)
        
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return error('Token has expired', 401)
        except jwt.InvalidTokenError:
            return error('Invalid token', 401)
        except IndexError:
            return error('Invalid authorization header format', 401)
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        # Calculate skip
        skip = (page - 1) * limit
        
        # Find complaints for this user
        from bson import ObjectId
        
        query = {'user_id': ObjectId(user_id)}
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
        return error(f'Failed to fetch complaints: {str(e)}', 500)


@app.route('/api/complaints/<complaint_id>', methods=['GET'])
def get_complaint(complaint_id):
    """Get single complaint by ID (only if user owns it)"""
    try:
        # Authenticate user
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return error('Authorization header is missing', 401)
        
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return error('Token has expired', 401)
        except jwt.InvalidTokenError:
            return error('Invalid token', 401)
        except IndexError:
            return error('Invalid authorization header format', 401)
        
        # Find complaint by ID and user_id (security check)
        from bson import ObjectId
        
        complaint = complaints_collection.find_one({
            '_id': ObjectId(complaint_id),
            'user_id': ObjectId(user_id)
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
        return error(f'Failed to fetch complaint: {str(e)}', 500)


@app.route('/api/complaints/<complaint_id>/status', methods=['PATCH'])
def update_complaint_status(complaint_id):
    """Update complaint status"""
    try:
        # Authenticate user
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return error('Authorization header is missing', 401)
        
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return error('Token has expired', 401)
        except jwt.InvalidTokenError:
            return error('Invalid token', 401)
        except IndexError:
            return error('Invalid authorization header format', 401)
        
        # Get new status
        data = request.get_json()
        new_status = data.get('status', '').strip()
        
        # Validate status
        valid_statuses = ['Submitted', 'In Progress', 'Resolved', 'Rejected']
        if new_status not in valid_statuses:
            return error(f'Invalid status. Must be one of: {", ".join(valid_statuses)}', 400)
        
        # Update complaint
        from bson import ObjectId
        
        result = complaints_collection.update_one(
            {
                '_id': ObjectId(complaint_id),
                'user_id': ObjectId(user_id)
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
            '_id': ObjectId(complaint_id),
            'user_id': ObjectId(user_id)
        })
        
        complaint['_id'] = str(complaint['_id'])
        complaint['user_id'] = str(complaint['user_id'])
        complaint['created_at'] = complaint['created_at'].isoformat()
        complaint['updated_at'] = complaint['updated_at'].isoformat()
        
        return success(complaint, 200)
        
    except Exception as e:
        return error(f'Failed to update complaint: {str(e)}', 500)


# ============================================================================
# COMMUNITY FEED ROUTE
# ============================================================================

@app.route('/api/feed', methods=['GET'])
def get_community_feed():
    """Get community feed of all complaints (paginated)"""
    try:
        # Verify user token
        result = verify_token(request)
        if isinstance(result, tuple):
            return result
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 12))
        
        # Calculate pagination
        skip = (page - 1) * limit
        
        # Get total count
        total = complaints_collection.count_documents({})
        
        # Query complaints with pagination, sorted by newest first
        complaints_cursor = complaints_collection.find({}).sort('created_at', -1).skip(skip).limit(limit)
        
        # Build feed posts with user names
        from bson import ObjectId
        posts = []
        
        for complaint in complaints_cursor:
            # Fetch citizen name from users collection
            user = users_collection.find_one({'_id': ObjectId(complaint['user_id'])}, {'name': 1})
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
        return error(f'Failed to fetch community feed: {str(e)}', 500)


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
        return error(f'Failed to fetch ward info: {str(e)}', 500)


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
        print("✅ Users indexes created: email (unique)")
        
        # Complaints collection indexes
        complaints_collection.create_index('user_id', name='user_id_idx')
        complaints_collection.create_index([('created_at', -1)], name='created_at_desc_idx')
        complaints_collection.create_index(
            [('user_id', 1), ('status', 1)], 
            name='user_status_compound_idx'
        )
        print("✅ Complaints indexes created: user_id, created_at (desc), user_id+status (compound)")
        
    except Exception as e:
        print(f"⚠️  Warning: Could not create indexes: {str(e)}")

# Initialize database indexes on startup
setup_database_indexes()


# ============================================================================
# RUN SERVER
# ============================================================================
if __name__ == '__main__':
    app.run(debug=True, port=5000)
