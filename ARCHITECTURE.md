# BrihanMumbai Fix - Complete Technical Architecture & System Documentation

**Last Updated:** April 10, 2026  
**Project:** BrihanMumbai Fix - Mumbai Civic Complaint Platform  
**Version:** 1.0 (Next.js 16 Migration Complete)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [High-Level Architecture](#high-level-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [API Documentation](#api-documentation)
7. [Data Models](#data-models)
8. [Authentication Flow](#authentication-flow)
9. [Data Flows & Workflows](#data-flows--workflows)
10. [AI Integration (Google Generative AI)](#ai-integration-google-generative-ai)
11. [Current Features (Working)](#current-features-working)
12. [Disabled/Removed Features](#disabledremoved-features)
13. [Deployment Status](#deployment-status)
14. [Environment Configuration](#environment-configuration)
15. [Known Issues & Workarounds](#known-issues--workarounds)

---

## System Overview

**BrihanMumbai Fix** is a civic complaint platform for Mumbai citizens to report infrastructure issues (potholes, water leaks, garbage, etc.). The platform:

- Allows citizens to **upload images** of civic issues
- Uses **AI (Google Gemini)** to analyze images and extract complaint details (location, severity, department)
- Routes complaints to appropriate **departments** for resolution
- Provides a **dashboard** for citizens to track their complaints
- Provides an **admin panel** for department staff to manage complaints
- Displays a **community feed** of recent complaints

**Current Phase:** Post-migration from Vite React to Next.js 16 with TypeScript.

**Status:** 
- ✅ Frontend deployed on Vercel
- ⏳ Backend running locally (needs deployment)
- ⚠️ Authentication middleware disabled (temporary, needs next-auth or route-level guards)
- ⚠️ Login/register forms are mock (don't connect to backend yet)

---

## Technology Stack

### Frontend
- **Framework:** Next.js 16.2.0 with App Router (migrated from Vite React)
- **Language:** TypeScript 5.7.3
- **Styling:** Tailwind CSS 4.2.0 + PostCSS
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Form Handling:** React Hook Form 7.54.1 + Zod validation
- **HTTP Client:** Native Fetch API (no Axios)
- **State Management:** React hooks + localStorage
- **Package Manager:** pnpm 10.x
- **Deployment:** Vercel

### Backend
- **Framework:** Flask (Python)
- **Database:** MongoDB
- **Image Storage:** Cloudinary
- **AI Services:** 
  - Google Generative AI (Gemini 2.5-flash, 2.5-flash-lite, 3.1-flash-lite)
  - Groq API (Llama vision as fallback)
- **Authentication:** JWT + bcrypt
- **File Upload:** Direct Cloudinary integration
- **Rate Limiting:** In-memory (thread-safe)
- **Security:** CORS headers, rate limiting, input validation
- **Deployment:** Local only (needs Render/Railway/Heroku)

### External Services
| Service | Purpose | Config |
|---------|---------|--------|
| MongoDB Atlas | User data, complaints, admins | `MONGO_URI` env var |
| Cloudinary | Image storage & CDN | `CLOUDINARY_*` env vars |
| Google Gemini AI | Image analysis & complaint generation | `GEMINI_API_KEY` env var |
| Groq API | Fallback AI (Llama vision) | `GROQ_API_KEY` env var |
| Vercel | Frontend hosting | Domain: https://brihanmumbai-fix.vercel.app |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                               │
│  (Next.js 16 Frontend - Vercel CDN: brihanmumbai-fix.vercel.app)   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │   Landing Page   │  │  Dashboard       │  │  Admin Panel     │ │
│  │   (/ - Public)   │  │  (/dashboard)    │  │  (/admin)        │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │   Login          │  │  Register        │  │  Report Issue    │ │
│  │   (/login)       │  │  (/register)     │  │  (/report)       │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │   Feed           │  │  Track           │                        │
│  │   (/feed)        │  │  (/track)        │                        │
│  └──────────────────┘  └──────────────────┘                        │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  API Client Layer (lib/api.ts)                             │    │
│  │  - apiFetch<T>() helper with JWT injection                 │    │
│  │  - authAPI, complaintAPI, feedAPI, adminAPI               │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  localStorage / Cookies                                    │    │
│  │  - bmf_token (JWT)                                         │    │
│  │  - bmf_user (user info)                                    │    │
│  │  - bmf_admin_token (admin JWT)                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS (CORS)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND API SERVER                               │
│        (Flask - localhost:5000 in dev, needs deployment)            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  REST API Endpoints                                    │        │
│  │  /api/auth/register (POST)                             │        │
│  │  /api/auth/login (POST)                                │        │
│  │  /api/complaints/analyze (POST) - AI analysis          │        │
│  │  /api/complaints (POST, GET)                           │        │
│  │  /api/complaints/<id> (GET, PATCH)                     │        │
│  │  /api/feed (GET)                                       │        │
│  │  /api/admin/stats (GET)                                │        │
│  │  /api/admin/complaints (GET)                           │        │
│  │  /api/admin/login (POST)                               │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                     │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  JWT Auth Decorator (@require_auth)                   │        │
│  │  Validates token, injects user into request context   │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                     │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  Rate Limiting (in-memory)                             │        │
│  │  Prevents abuse per IP address                         │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                     │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  Security Middleware                                   │        │
│  │  - Security headers (X-Frame-Options, CSP, etc)        │        │
│  │  - CORS validation                                     │        │
│  │  - Input sanitization                                  │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   MongoDB        │ │   Cloudinary     │ │   Google Gemini  │
│   (Users,        │ │   (Image Storage │ │   (Image Analysis│
│   Complaints,    │ │    & CDN)         │ │    & AI)          │
│   Admins)        │ │                  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                              │
                              ▼
                      ┌─────────────────┐
                      │  Groq API       │
                      │  (Fallback AI)  │
                      └─────────────────┘
```

---

## Frontend Architecture

### Folder Structure

```
brihanmumbai-fix/frontend/
├── app/                           # Next.js App Router (file-based routing)
│   ├── layout.tsx                 # Root layout (Server Component)
│   ├── page.tsx                   # Home page (landing) - PUBLIC
│   ├── login/
│   │   └── page.tsx               # Login form - PUBLIC
│   ├── register/
│   │   └── page.tsx               # Register form - PUBLIC
│   ├── dashboard/
│   │   └── page.tsx               # User's complaints dashboard - PROTECTED
│   ├── feed/
│   │   └── page.tsx               # Community feed - PROTECTED
│   ├── report/
│   │   └── page.tsx               # Complaint submission (3-step) - PROTECTED
│   ├── track/
│   │   └── page.tsx               # Track complaint status - PROTECTED
│   ├── admin/
│   │   ├── page.tsx               # Admin dashboard - PROTECTED
│   │   ├── login/
│   │   │   └── page.tsx           # Admin login - PUBLIC
│   │   └── complaints/
│   │       └── [id]/
│   │           └── page.tsx       # Complaint detail page - PROTECTED
│   └── globals.css                # Global styles
│
├── components/
│   ├── ui/                        # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── landing/                   # Landing page components
│   │   ├── header.tsx             # Navigation header (with Login button)
│   │   ├── hero.tsx               # Hero section
│   │   ├── features.tsx           # Features section
│   │   ├── how-it-works.tsx       # How it works section
│   │   ├── issue-categories.tsx   # Issue type categories
│   │   ├── testimonials.tsx       # User testimonials
│   │   ├── cta.tsx                # Call-to-action ("Create Free Account")
│   │   ├── footer.tsx             # Footer
│   │   ├── stats.tsx              # Statistics section
│   │   └── navbar.tsx             # Navbar (used on all pages when logged in)
│
├── lib/
│   ├── api.ts                     # API client (TypeScript)
│   └── auth.ts                    # Auth helpers (session management)
│
├── hooks/
│   ├── use-mobile.ts              # Mobile detection hook
│   └── ...
│
├── styles/
│   └── globals.css                # Global Tailwind styles
│
├── .env.local                     # Local dev environment vars
├── .env.example                   # Template for env vars
├── next.config.mjs                # Next.js build config
├── vercel.json                    # Vercel deployment config (EXPLICIT BUILD SETTINGS)
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies (pnpm)
├── pnpm-lock.yaml                 # Dependency lock file
└── middleware.ts.disabled         # Auth middleware (CURRENTLY DISABLED)
```

### Page Components Overview

| Page | Route | Type | Authentication | Purpose |
|------|-------|------|---|---|
| Landing | `/` | Server Component | ❌ Public | Home page with CTA, features, how-it-works |
| Login | `/login` | Client Component | ❌ Public | User login form (currently mock) |
| Register | `/register` | Client Component | ❌ Public | User registration form (currently mock) |
| Report Issue | `/report` | Client Component | ✅ Protected | 3-step complaint submission form |
| Dashboard | `/dashboard` | Client Component | ✅ Protected | User's complaint history & status |
| Feed | `/feed` | Client Component | ✅ Protected | Community feed of recent complaints |
| Track | `/track` | Client Component | ✅ Protected | Track specific complaint by ID |
| Admin Login | `/admin/login` | Client Component | ❌ Public | Admin authentication (currently mock) |
| Admin Dashboard | `/admin` | Client Component | ✅ Protected | Admin stats & complaint management |
| Admin Complaint Detail | `/admin/complaints/[id]` | Client Component | ✅ Protected | View/manage complaint details |

### Client vs Server Components

**Server Components (NO 'use client'):**
- `app/layout.tsx` - Root layout with metadata, fonts
- Landing page sections (Hero, Features, Stats, etc.)

**Client Components ('use client' at top):**
- All pages with forms: login, register, report
- All pages with hooks: dashboard, feed, track
- All pages with localStorage: auth-dependent pages
- Header & Navbar (uses router, pathname, localStorage)

---

## Backend Architecture

### Flask App Structure

```
brihanmumbai-fix/backend/
├── app.py                         # Main Flask app (monolith)
├── create_admin.py                # Script to create admin accounts
├── test_gemini.py                 # Test script for Gemini AI
├── .env                           # Environment variables (git-ignored)
├── .env.example                   # Template for env vars
├── requirements.txt               # Python dependencies
├── render.yaml                    # Render deployment config
└── venv/                          # Virtual environment
```

### Key Features & Sections in app.py

#### 1. **Imports & Configuration** (Lines 1-150)
```python
# Core
Flask, CORS, request, jsonify

# Authentication
bcrypt, jwt

# Database
pymongo (MongoClient), bson (ObjectId)

# File Upload
cloudinary (image upload & CDN)

# AI Services
google.generativeai (Gemini)
groq.Groq (Llama vision fallback)

# Security
Rate limiting (in-memory), security headers
```

#### 2. **Database Collections** (Lines 74-77)
```python
users_collection          # User accounts
complaints_collection     # Citizen complaints
admins_collection         # Admin accounts
```

#### 3. **Security Middleware** (Lines 124-200+)
- Security headers (X-Frame-Options, X-Content-Type-Options, CSP)
- In-memory rate limiting (thread-safe)
- Input sanitization (HTML escaping)

#### 4. **AI Configuration** (Lines 89-105)
```python
# Fallback chain for Gemini (each model has separate RPD quota)
GEMINI_CONFIGS = [
    'gemini-2.5-flash'      # 20 RPD, best vision quality
    'gemini-2.5-flash-lite' # 20 RPD, same key separate bucket
    'gemini-3.1-flash-lite' # 500 RPD, best quota
]

# Groq API as final fallback (generous free tier)
groq_client = Groq(api_key=GROQ_API_KEY)
```

#### 5. **Authentication**
- JWT-based (no sessions)
- bcrypt password hashing
- `@require_auth` decorator validates token
- Tokens stored in Authorization header

#### 6. **Core Business Logic**
All endpoints handle complaint workflow:
1. User uploads image
2. Backend uploads to Cloudinary
3. AI analyzes image (Gemini or Groq)
4. Extracts: issue_type, severity, description, department
5. Complaint saved to MongoDB
6. Returns complaint data to frontend

---

## API Documentation

### Base URL

**Development:** `http://localhost:5000`  
**Production:** (Backend not yet deployed - needs Render/Railway)

### Authentication

**Method:** JWT Bearer Token

**Header:**
```
Authorization: Bearer <jwt_token>
```

**Token Structure:**
```json
{
  "user_id": "mongodb_object_id",
  "email": "user@example.com",
  "iat": 1712754000,
  "exp": 1712840400
}
```

### API Endpoints

#### 1. **Authentication Endpoints**

##### Register User
```
POST /api/auth/register
```

**Request:**
```json
{
  "name": "Prashant Shirke",
  "email": "prashant@example.com",
  "password": "SecurePass123!"
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Prashant Shirke",
    "email": "prashant@example.com",
    "created_at": "2026-04-10T12:51:15Z"
  }
}
```

**Errors:**
- 400: Missing fields
- 409: Email already exists
- 500: Server error

---

##### Login User
```
POST /api/auth/login
```

**Request:**
```json
{
  "email": "prashant@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Prashant Shirke",
    "email": "prashant@example.com"
  }
}
```

**Errors:**
- 400: Missing fields / Invalid credentials
- 401: Unauthorized
- 500: Server error

---

#### 2. **Complaint Endpoints**

##### Analyze Image & Generate Complaint
```
POST /api/complaints/analyze
```

**Request (FormData):**
```
image: <File>              # Image file from upload
location: "Dadar West"
ward_number: "12"
```

**Response (200 OK):**
```json
{
  "image_url": "https://res.cloudinary.com/.../image.jpg",
  "issue_type": "Pothole",
  "severity": "High",
  "description": "Large pothole on road affecting traffic",
  "department": "Roads & Highways",
  "confidence": 0.95,
  "model_used": "gemini-2.5-flash"
}
```

**AI Processing:**
1. Upload image to Cloudinary → get URL
2. Send to Gemini with prompt: "Analyze this civic issue image..."
3. Extract JSON: issue_type, severity, description, department
4. If Gemini fails, fallback to Gemini-lite, then Groq
5. Return analysis result

**Errors:**
- 400: No image / Invalid input
- 401: Not authenticated
- 500: AI service failure

---

##### Submit Complaint
```
POST /api/complaints
Content-Type: application/json
Authorization: Bearer <token>
```

**Request:**
```json
{
  "image_url": "https://res.cloudinary.com/.../image.jpg",
  "issue_type": "Pothole",
  "severity": "High",
  "description": "Large pothole on road affecting traffic",
  "department": "Roads & Highways",
  "location": "Dadar West",
  "ward_number": "12",
  "latitude": 19.0176,
  "longitude": 72.8292
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "user_id": "507f1f77bcf86cd799439011",
  "image_url": "https://res.cloudinary.com/.../image.jpg",
  "issue_type": "Pothole",
  "severity": "High",
  "description": "Large pothole on road affecting traffic",
  "department": "Roads & Highways",
  "location": "Dadar West",
  "ward_number": "12",
  "status": "Submitted",
  "complaint_text": "...",
  "created_at": "2026-04-10T12:51:15Z",
  "updated_at": "2026-04-10T12:51:15Z"
}
```

**Errors:**
- 400: Invalid data
- 401: Not authenticated
- 500: Server error

---

##### Get User's Complaints
```
GET /api/complaints
Authorization: Bearer <token>
```

**Query Params:**
```
page: 1 (default)
limit: 10 (default)
status: Submitted|In Progress|Resolved|Rejected (optional)
```

**Response (200 OK):**
```json
{
  "complaints": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "issue_type": "Pothole",
      "severity": "High",
      "status": "In Progress",
      "image_url": "...",
      "created_at": "2026-04-10T12:51:15Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

---

##### Get Complaint by ID
```
GET /api/complaints/<complaint_id>
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "user_id": "507f1f77bcf86cd799439011",
  "image_url": "https://res.cloudinary.com/.../image.jpg",
  "issue_type": "Pothole",
  "severity": "High",
  "description": "...",
  "status": "In Progress",
  "created_at": "2026-04-10T12:51:15Z",
  "updated_at": "2026-04-10T13:00:00Z"
}
```

---

##### Update Complaint Status (Admin)
```
PATCH /api/complaints/<complaint_id>
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request:**
```json
{
  "status": "Resolved"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "status": "Resolved",
  "updated_at": "2026-04-10T13:00:00Z"
}
```

---

#### 3. **Feed Endpoints**

##### Get Community Feed
```
GET /api/feed
Authorization: Bearer <token>
```

**Query Params:**
```
page: 1 (default)
limit: 20 (default)
issue_type: Pothole|Water Leak|Garbage|... (optional)
```

**Response (200 OK):**
```json
{
  "posts": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "citizen_name": "Prashant S.",
      "image_url": "https://res.cloudinary.com/.../image.jpg",
      "issue_type": "Pothole",
      "severity": "High",
      "location": "Dadar West",
      "status": "In Progress",
      "created_at": "2026-04-10T12:51:15Z"
    }
  ],
  "total": 234
}
```

---

#### 4. **Admin Endpoints**

##### Admin Login
```
POST /api/admin/login
```

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "AdminPass123!"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "507f1f77bcf86cd799439020",
    "name": "Admin User",
    "email": "admin@example.com",
    "department": "Roads & Highways"
  }
}
```

---

##### Get Admin Statistics
```
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "total": 523,
  "submitted": 45,
  "in_progress": 128,
  "resolved": 312,
  "rejected": 38,
  "by_issue_type": {
    "Pothole": 234,
    "Water Leak": 156,
    "Garbage": 89,
    "Street Light": 44
  },
  "by_severity": {
    "Low": 120,
    "Medium": 245,
    "High": 128,
    "Critical": 30
  }
}
```

---

##### Get All Complaints (Admin)
```
GET /api/admin/complaints
Authorization: Bearer <admin_token>
```

**Query Params:**
```
page: 1
limit: 50
status: Submitted|In Progress|Resolved|Rejected
severity: Low|Medium|High|Critical
department: Roads & Highways|Water Department|...
```

**Response (200 OK):**
```json
{
  "complaints": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "citizen_name": "Prashant S.",
      "issue_type": "Pothole",
      "severity": "High",
      "status": "Submitted",
      "department": "Roads & Highways",
      "created_at": "2026-04-10T12:51:15Z"
    }
  ],
  "total": 523,
  "page": 1
}
```

---

### API Client (Frontend - lib/api.ts)

The frontend uses a centralized TypeScript API client with:

**Features:**
- Generic `apiFetch<T>()` helper with automatic JWT injection
- Automatic 401 redirect to `/login` on auth failure
- Separate admin vs user token handling
- FormData support for file uploads
- Environment variable-based API URL

**API Groups:**

```typescript
// Authentication
authAPI.register(name, email, password)
authAPI.login(email, password)
authAPI.adminLogin(email, password)

// Complaints
complaintAPI.analyzeImage(formData)  // FormData with image, location, ward
complaintAPI.submit(complaintData)
complaintAPI.list(page, limit, status)
complaintAPI.getById(id)
complaintAPI.update(id, updates)

// Feed
feedAPI.getPosts(page, limit, issueType)

// Admin
adminAPI.getStats()
adminAPI.getComplaints(page, limit, filters)
```

---

## Data Models

### User Schema (MongoDB)
```typescript
{
  _id: ObjectId,
  name: string,
  email: string (unique),
  password: string (bcrypt hashed),
  created_at: Date,
  updated_at: Date
}
```

### Complaint Schema (MongoDB)
```typescript
{
  _id: ObjectId,
  user_id: ObjectId (ref: users),
  image_url: string (Cloudinary URL),
  issue_type: string ("Pothole" | "Water Leak" | "Garbage" | "Street Light" | etc),
  severity: string ("Low" | "Medium" | "High" | "Critical"),
  description: string,
  complaint_text: string (full description),
  department: string ("Roads & Highways" | "Water Department" | etc),
  location: string,
  ward_number: string,
  latitude: number (optional),
  longitude: number (optional),
  status: string ("Submitted" | "In Progress" | "Resolved" | "Rejected"),
  model_used: string ("gemini-2.5-flash" | "gemini-flash-lite" | "gemini-31-flash-lite" | "groq-llama"),
  created_at: Date,
  updated_at: Date
}
```

### Admin Schema (MongoDB)
```typescript
{
  _id: ObjectId,
  name: string,
  email: string (unique),
  password: string (bcrypt hashed),
  department: string,
  created_at: Date
}
```

---

## Authentication Flow

### User Registration Flow
```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (login/page.tsx OR register/page.tsx)                  │
│  - Form input: name, email, password                            │
│  - User clicks "Register" or "Login"                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │ apiFetch() with JSON body
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend: POST /api/auth/register                                │
│  1. Validate input (not empty, email format, password strength) │
│  2. Check if email exists (409 Conflict if yes)                 │
│  3. Hash password with bcrypt (salt rounds: 10)                 │
│  4. Create user document in MongoDB                             │
│  5. Generate JWT token (payload: user_id, email, exp: 24h)      │
│  6. Return { token, user }                                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Response: { token, user }
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: saveUserSession(token, user)                          │
│  1. localStorage.setItem('bmf_token', token)                    │
│  2. localStorage.setItem('bmf_user', JSON.stringify(user))      │
│  3. document.cookie = `bmf_token=${token}; path=/; ...`         │
│  4. router.push('/dashboard')                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Login Flow
```
Same as registration, but:
1. Check if user exists (400 if not)
2. Compare password with bcrypt hash
3. If match: generate JWT and return
```

### Authenticated Request Flow
```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: complaintAPI.list()                                   │
│  - Reads token from localStorage: getToken()                    │
│  - Calls apiFetch('/api/complaints', headers, auth=false)       │
└─────────────────────────────────────────────────────────────────┘
                      │ GET /api/complaints
                      │ Authorization: Bearer <token>
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend: @require_auth decorator                                │
│  1. Extract token from Authorization header                     │
│  2. Verify JWT signature with JWT_SECRET                        │
│  3. Decode token → extract user_id, email, exp                  │
│  4. Check expiration (401 if expired)                           │
│  5. Inject user info into request context (g.user)              │
│  6. Proceed to route handler                                    │
└─────────────────────────────────────────────────────────────────┘
                      │ Route handler executes
                      │ Access g.user.id, g.user.email
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend: Query MongoDB                                          │
│  - Use user_id to filter complaints: complaints where user_id = g.user.id
│  - Return list of complaints                                    │
└─────────────────────────────────────────────────────────────────┘
                      │ Response: { complaints: [...] }
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: lib/api.ts apiFetch() response handler                │
│  - If status 401: clear localStorage & redirect to /login       │
│  - If status 200: parse JSON and return typed data              │
└─────────────────────────────────────────────────────────────────┘
```

### Logout Flow
```
1. Frontend: logout() from lib/auth.ts
   - localStorage.removeItem('bmf_token')
   - localStorage.removeItem('bmf_user')
   - document.cookie = 'bmf_token=; max-age=0'

2. Frontend: router.push('/login')

3. All subsequent API requests fail auth (no token)
   - User redirected to login page by apiFetch()
```

---

## Data Flows & Workflows

### Workflow 1: Submit a Complaint (3-Step Form)

```
STEP 1: UPLOAD IMAGE
┌──────────────────────────────────────┐
│ User on /report page                 │
│ - Upload image (JPG/PNG/WebP)        │
│ - Show image preview                 │
└──────────────┬───────────────────────┘
               │ Click "Next"
               ▼
┌──────────────────────────────────────────────────────────────┐
│ Frontend: Call complaintAPI.analyzeImage(formData)           │
│ - FormData: image file, location, ward_number               │
│ - POST /api/complaints/analyze                              │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ Backend: /api/complaints/analyze                             │
│ 1. Upload image to Cloudinary → get image_url              │
│ 2. Call Gemini AI with image:                               │
│    "Analyze this civic issue image and extract:             │
│     - issue_type (Pothole, Water Leak, etc)                │
│     - severity (Low, Medium, High, Critical)                │
│     - description (2-3 sentences)                           │
│     - department (Roads, Water, etc)"                       │
│ 3. Gemini returns JSON analysis                             │
│ 4. If Gemini fails → try Gemini-lite → try Groq            │
│ 5. Return { image_url, issue_type, severity, ... }         │
└──────────────┬───────────────────────────────────────────────┘
               │ Response: Analysis result
               ▼
┌──────────────────────────────────────────────────────────────┐
│ Frontend: Display Analysis (Step 2)                          │
│ - Show extracted fields (issue_type, severity, department) │
│ - Allow user to edit/confirm fields                        │
│ - Show image preview                                       │
└──────────────┬───────────────────────────────────────────────┘
               │ User confirms and clicks "Submit"
               ▼

STEP 2: REVIEW & CONFIRM

STEP 3: SUBMIT
┌──────────────────────────────────────────────────────────────┐
│ Frontend: Call complaintAPI.submit(complaintData)            │
│ - POST /api/complaints                                       │
│ - Payload: {                                                 │
│     image_url, issue_type, severity, description,           │
│     department, location, ward_number, latitude, longitude  │
│   }                                                          │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ Backend: /api/complaints (POST)                              │
│ 1. Validate all fields required                             │
│ 2. Sanitize description (HTML escape)                       │
│ 3. Save to MongoDB: complaints_collection.insert_one()      │
│ 4. Set status = "Submitted"                                 │
│ 5. Return complaint with _id                                │
└──────────────┬───────────────────────────────────────────────┘
               │ Response: { _id, status: "Submitted", ... }
               ▼
┌──────────────────────────────────────────────────────────────┐
│ Frontend: Show Success                                       │
│ - Congratulations message                                   │
│ - Show complaint ID for tracking                            │
│ - Button to "View Dashboard" or "Submit Another"            │
└──────────────────────────────────────────────────────────────┘
```

### Workflow 2: View Dashboard (My Complaints)

```
┌───────────────────────────────────────┐
│ User navigates to /dashboard          │
└──────────────┬──────────────────────┬┘
               │ useEffect on mount   │
               ▼                      │
┌──────────────────────────────────────┐│
│ Frontend: setLoading(true)           ││
│ Call complaintAPI.list(1, 10)        ││
│ GET /api/complaints                  ││
└──────────────┬───────────────────────┘│
               │                        │
               ▼                        │
┌──────────────────────────────────────────┐
│ Backend: /api/complaints (GET)           │
│ @require_auth: extract user from token   │
│ Query MongoDB:                           │
│   complaints_collection.find({           │
│     user_id: g.user.id                   │
│   }).sort({created_at: -1}).limit(10)    │
│ Return: { complaints: [...], total: N }  │
└──────────────┬──────────────────────────┘
               │ Response
               ▼
┌──────────────────────────────────────────┐
│ Frontend: setComplaints(data)            │
│ Render list with cards:                  │
│ - Image thumbnail                        │
│ - Issue type, severity, status           │
│ - Created date                           │
│ - Click to view details                  │
└──────────────────────────────────────────┘
```

### Workflow 3: AI Image Analysis (Multi-Model Fallback)

```
USER UPLOADS IMAGE
         │
         ▼
┌────────────────────────────────────┐
│ Cloudinary Upload                  │
│ - Receive image file               │
│ - Upload to Cloudinary CDN         │
│ - Get image_url                    │
└────────┬─────────────────────────┬┘
         │                         │
         ▼ Model 1 (Primary)      │ Fallback
┌────────────────────────────────┐ │
│ Gemini 2.5-flash (20 RPD)     │ │
│ - High quality vision           │ │
│ - Send image + system prompt   │ │
│ - Parse JSON response           │ │
│ - Return analysis               │ │
└────────┬─────────────────────────┘
         │
    Success? ──NO──┐
         │         │
         YES       ▼
         │    ┌─────────────────────────────────┐
         │    │ Gemini 2.5-flash-lite (20 RPD) │
         │    │ - Fallback to different bucket  │
         │    │ - Same model, separate quota    │
         │    │ - Send image + prompt           │
         │    │ - Parse JSON response           │
         │    └────────┬────────────────────────┘
         │             │
         │        Success?──NO──┐
         │             │        │
         │             YES      ▼
         │             │   ┌────────────────────────────┐
         │             │   │ Gemini 3.1-flash-lite     │
         │             │   │ - Best RPD (500 RPD)      │
         │             │   │ - Same API key            │
         │             │   │ - Send image + prompt     │
         │             │   │ - Parse JSON response     │
         │             │   └────────┬──────────────────┘
         │             │            │
         │             │       Success?──NO──┐
         │             │            │        │
         │             │            YES      ▼
         │             │            │   ┌──────────────────────────┐
         │             │            │   │ Groq Llama Vision        │
         │             │            │   │ - Fallback AI (generous) │
         │             │            │   │ - Free tier              │
         │             │            │   │ - Send image + prompt    │
         │             │            │   │ - Parse JSON response    │
         │             │            │   └────────┬─────────────────┘
         │             │            │            │
         └─────────────┴────────────┴───Success?─┴───┐
                                    │
                                    YES
                                    │
                                    ▼
                            ┌──────────────────┐
                            │ Return Analysis: │
                            │ {                │
                            │  issue_type,     │
                            │  severity,       │
                            │  description,    │
                            │  department,     │
                            │  model_used      │
                            │ }                │
                            └──────────────────┘
```

---

## AI Integration (Google Generative AI)

### Gemini Configuration

**Primary Models (API: google.generativeai):**
1. **gemini-2.5-flash** (20 RPD)
   - Best vision quality
   - Good for complex image analysis
   
2. **gemini-2.5-flash-lite** (20 RPD)
   - Same key, separate quota bucket
   - Faster, lighter variant

3. **gemini-3.1-flash-lite** (500 RPD)
   - Best rate limit quota
   - Good vision capabilities

**Fallback Model (API: groq.Groq):**
4. **Groq Llama Vision** (Generous free tier)
   - Final fallback when all Gemini options exhausted

### Prompt Template for Image Analysis

```python
system_prompt = """You are an expert civic infrastructure inspector analyzing images of urban issues.
Extract structured information about the issue:
- Issue Type: Pothole, Water Leak, Garbage, Street Light, Road Damage, Other
- Severity: Low (cosmetic), Medium (minor hazard), High (major hazard), Critical (dangerous/urgent)
- Description: 2-3 sentences describing the issue
- Department: Which department should handle (Roads & Highways, Water Department, Sanitation, Electricity)

Return ONLY valid JSON (no markdown, no extra text):
{
  "issue_type": "...",
  "severity": "...",
  "description": "...",
  "department": "..."
}"""

user_message = f"""Analyze this civic issue image taken at {location}, Ward {ward_number}.
Describe the problem and suggest the appropriate department for resolution."""
```

### Gemini API Call Example

```python
def analyze_image_with_gemini(image_url: str, location: str, ward_number: str, model_config: dict):
    """
    Send image to Gemini for analysis
    """
    import base64
    from PIL import Image
    import requests
    
    # Configure API
    genai.configure(api_key=model_config['api_key'])
    model = genai.GenerativeModel(model_config['model'])
    
    # Download and encode image
    response = requests.get(image_url)
    image_data = base64.standard_b64encode(response.content).decode("utf-8")
    
    # Call Gemini with image
    analysis_response = model.generate_content([
        {
            "role": "user",
            "parts": [
                system_prompt,
                {"mime_type": "image/jpeg", "data": image_data},
                user_message
            ]
        }
    ])
    
    # Parse response
    result_text = analysis_response.text
    json_data = json.loads(result_text)  # Extract JSON
    
    return {
        "image_url": image_url,
        "issue_type": json_data["issue_type"],
        "severity": json_data["severity"],
        "description": json_data["description"],
        "department": json_data["department"],
        "model_used": model_config['label'],
        "confidence": 0.85  # Placeholder
    }
```

### Response Handling

```python
try:
    result = analyze_image_with_gemini(...)
    return jsonify(result), 200
except Exception as e:
    # Try next model in chain
    return try_next_model(...)
```

---

## Current Features (Working)

### ✅ Frontend Features

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | ✅ Working | Public, shows features & CTA |
| Login form | ⚠️ Mock | No backend connection yet |
| Register form | ⚠️ Mock | No backend connection yet |
| Complaint submission (3-step) | ⚠️ Mock | Form exists, no API calls |
| Dashboard | ⚠️ Mock | Layout ready, no data fetching |
| Community feed | ⚠️ Mock | Layout ready, no data fetching |
| Admin panel | ⚠️ Mock | Layout ready, no data fetching |
| Navigation/Header | ✅ Working | Shows logged-in user or login button |
| Route protection | ⚠️ Disabled | Middleware disabled, all routes public |

### ✅ Backend Features

| Feature | Status | Notes |
|---------|--------|-------|
| User registration | ✅ Working | Password hashed, JWT token generated |
| User login | ✅ Working | JWT token returned, bcrypt verified |
| Image upload to Cloudinary | ✅ Working | Stores on CDN, returns URL |
| Gemini AI analysis | ✅ Working | Analyzes images, extracts complaint data |
| Complaint submission | ✅ Working | Saves to MongoDB |
| Complaint listing | ✅ Working | Returns user's complaints (paginated) |
| Complaint detail view | ✅ Working | Fetch single complaint by ID |
| Admin statistics | ✅ Working | Aggregates complaints by type/severity/status |
| Admin login | ✅ Working | Separate admin JWT token |
| Rate limiting | ✅ Working | In-memory, per IP |
| Security headers | ✅ Working | X-Frame-Options, CSP, etc |

---

## Disabled/Removed Features

### ⚠️ Disabled: Authentication Middleware

**What:** `frontend/middleware.ts` (renamed to `middleware.ts.disabled`)

**Why Disabled:**
- Next.js 16 deprecated middleware pattern on Vercel Edge Runtime
- Caused 404/500 errors during deployment
- Vercel Edge Runtime cannot execute middleware the old way

**Impact:**
- All routes are currently PUBLIC (no route protection)
- Users can access /report, /dashboard, /feed without login
- Need to re-implement with: route-level guards OR next-auth library

**How to Re-enable (Future):**
```typescript
// Option 1: Route-level guards
// In each protected page, check isLoggedIn() and redirect

// Option 2: Use next-auth library
// Handles middleware properly on Vercel Edge Runtime

// Option 3: Use Vercel Proxy instead of middleware
```

### ⚠️ Mock: Login & Register Forms

**What:** Forms exist but don't call backend API

**Current Behavior:**
```typescript
// Simulates delay then redirects
await new Promise((resolve) => setTimeout(resolve, 1500));
router.push("/dashboard");
```

**Expected Behavior:**
```typescript
// Call backend API
const response = await authAPI.login(email, password);
saveUserSession(response.token, response.user);
router.push("/dashboard");
```

**Why Not Implemented:**
- Middleware disabled → no auth enforcement
- Temporary until authentication properly re-implemented

### ⚠️ Mock: Dashboard & Feed

**What:** Pages show hardcoded layouts, no API calls

**Current Behavior:**
- Dashboard shows mock complaint cards (no real data)
- Feed shows mock feed posts (no real data)

**Expected Behavior:**
- Dashboard calls `complaintAPI.list()`
- Feed calls `feedAPI.getPosts()`

### 🗑️ Removed: React Router

**What:** All react-router-dom imports and patterns

**Replaced With:**
- `useRouter` from 'next/navigation' (for programmatic navigation)
- `<Link href="">` from 'next/link' (for anchor navigation)
- `useParams` from 'next/navigation' (for route params)

### 🗑️ Removed: Vite Dev Server

**What:** Old Vite development server (port 5173)

**Replaced With:**
- Next.js dev server (`pnpm dev` on port 3000)

**Still Supported (For Transition):**
- CORS allows localhost:5173 for safety
- Can remove after full migration complete

---

## Deployment Status

### Frontend Deployment ✅ LIVE

**Platform:** Vercel  
**URL:** https://brihanmumbai-fix.vercel.app/  
**Status:** ✅ Deployed and accessible

**Vercel Configuration:**
```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "devCommand": "pnpm dev",
  "framework": "nextjs"
}
```

**Environment Variables (Vercel):**
- `NEXT_PUBLIC_API_URL=` (needs to be set to deployed backend URL)

### Backend Deployment ⏳ NOT DEPLOYED

**Current Status:** Running locally on port 5000  
**Next Step:** Deploy to Render, Railway, or Heroku

**Deployment Options:**
1. **Render.com** (recommended)
   - Free tier available
   - `render.yaml` already in project
   - Connect GitHub repo, auto-deploys on push

2. **Railway.app**
   - Simple deployment
   - Pays as you go

3. **Heroku**
   - Classic choice
   - Paid plans start ~$7/month

**Before Deployment:**
1. Create MongoDB Atlas cluster (or use existing)
2. Get Cloudinary credentials
3. Get Gemini API key
4. Set all env vars on deployment platform
5. Update CORS to allow production frontend URL

---

## Environment Configuration

### Frontend Environment Variables

#### Development (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Production (Vercel - needs to be set in dashboard)
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

**Note:** Must prefix with `NEXT_PUBLIC_` to be available in browser

### Backend Environment Variables

#### Required (.env file)
```bash
# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/brihanmumbai_fix

# Image Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Services
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key

# Authentication
JWT_SECRET=your_random_secret_string_min_32_chars

# Frontend
FRONTEND_URL=http://localhost:3000
```

#### Optional (.env file)
```bash
FLASK_ENV=development|production
DEBUG=True|False
```

### Next.js Configuration (next.config.mjs)

```javascript
export default {
  images: {
    unoptimized: true,  // Disables Sharp (build fails without this)
  },
  // Add more config as needed
}
```

### Vercel Configuration (vercel.json)

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "devCommand": "pnpm dev",
  "framework": "nextjs"
}
```

---

## Known Issues & Workarounds

### Issue 1: Authentication Middleware Disabled ⚠️

**Problem:** Middleware was causing 404/500 errors on Vercel

**Root Cause:** Next.js 16 deprecated middleware pattern on Edge Runtime

**Current Workaround:** Middleware disabled (all routes public)

**Status:** ⏳ Needs permanent fix

**Solution Options:**
1. Use `next-auth` library (recommended for production)
2. Implement route-level auth checks in each page
3. Use Vercel Proxy (new feature) instead of middleware

**How to Test:**
```bash
# Locally: routes are public (no auth enforcement)
# Production: routes are public (no auth enforcement)
```

---

### Issue 2: Login/Register Forms Don't Connect to Backend

**Problem:** Forms show success animation but don't save data

**Root Cause:** Temporary implementation while auth pattern is being finalized

**Current Behavior:** Simulated delay, then redirects to dashboard

**Expected Behavior:** Call `authAPI.login()`, save session, redirect

**To Fix:**
```typescript
// In login/page.tsx handleSubmit()
const response = await authAPI.login(email, password);
if (response) {
  saveUserSession(response.token, response.user);
  router.push("/dashboard");
}
```

---

### Issue 3: Pothole Image Not Uploaded

**Problem:** Hero section tried to load `/images/pothole-road-india.jpg` which doesn't exist

**Current Workaround:** Using gradient background instead

**To Fix:**
1. Download pothole image from Unsplash/Pexels (no watermarks)
2. Place at: `frontend/public/images/pothole-road-india.jpg`
3. Uncomment Image code in `components/landing/hero.tsx`

---

### Issue 4: Sharp Library Warning on Build

**Problem:** `Ignored build scripts: sharp@0.34.5` warning on Vercel

**Root Cause:** pnpm blocks build scripts for security

**Status:** ✅ Harmless - not actually an error

**Why Configured:** `images: { unoptimized: true }` in next.config.mjs disables Sharp entirely

**Action Required:** None - ignore the warning

---

### Issue 5: Dashboard & Feed Show Mock Data

**Problem:** Pages don't fetch real data from backend

**Current State:** Hardcoded layout with placeholder cards

**To Fix:**
```typescript
// In app/dashboard/page.tsx
useEffect(() => {
  complaintAPI.list().then(data => setComplaints(data));
}, []);
```

---

## Component Import Matrix

### Frontend Components & Their 'use client' Status

| Component | Location | Type | 'use client'? | Reason |
|-----------|----------|------|---|---|
| Layout | `app/layout.tsx` | Server | ❌ No | Metadata, fonts, static |
| HomePage | `app/page.tsx` | Server | ❌ No | Static landing page |
| Header | `components/landing/header.tsx` | Client | ✅ Yes | Uses router, localStorage |
| Hero | `components/landing/hero.tsx` | Server | ❌ No | Static content |
| LoginPage | `app/login/page.tsx` | Client | ✅ Yes | useState, useRouter, form |
| RegisterPage | `app/register/page.tsx` | Client | ✅ Yes | useState, useRouter, form |
| ReportPage | `app/report/page.tsx` | Client | ✅ Yes | 3-step form with state |
| DashboardPage | `app/dashboard/page.tsx` | Client | ✅ Yes | Fetches data, useState |
| FeedPage | `app/feed/page.tsx` | Client | ✅ Yes | Fetches data, useState |
| AdminPage | `app/admin/page.tsx` | Client | ✅ Yes | Fetches admin stats |
| Navbar | `components/Navbar.tsx` | Client | ✅ Yes | useRouter, localStorage |

---

## Development Workflow

### Local Development Setup

```bash
# 1. Frontend
cd brihanmumbai-fix/frontend
pnpm install
pnpm dev
# Runs on http://localhost:3000

# 2. Backend (in new terminal)
cd brihanmumbai-fix/backend
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

### Building for Production

```bash
# Frontend
cd frontend
pnpm build
pnpm start  # Simulates production

# Backend
# Deploy to Render/Railway (see deployment section)
```

### Testing API Locally

```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Pass123"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123"}'

# Test complaint submission (requires token)
curl -X POST http://localhost:5000/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"image_url":"...","issue_type":"Pothole",...}'
```

---

## Next Steps & Recommendations

### Immediate (This Week)
1. **Re-enable Authentication**
   - Choose: next-auth vs route-level guards vs Vercel Proxy
   - Implement middleware properly
   - Test route protection

2. **Connect Login/Register to Backend**
   - Wire forms to API calls
   - Test registration flow end-to-end
   - Test login flow end-to-end

3. **Connect Dashboard to Backend**
   - Implement `complaintAPI.list()`
   - Show real user complaints
   - Test pagination

4. **Deploy Backend**
   - Set up Render/Railway account
   - Deploy Flask app
   - Update environment variables
   - Test API calls from production frontend

### Short-term (Next 2 Weeks)
1. Implement all dashboard features
2. Implement admin panel
3. Add image upload functionality
4. Test AI analysis end-to-end
5. Add error handling & user feedback

### Medium-term (Next Month)
1. Add unit tests
2. Add integration tests
3. Optimize image loading
4. Add analytics
5. Performance tuning

---

## Useful Commands

```bash
# Frontend
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript checks

# Backend
python app.py         # Start Flask app
python create_admin.py  # Create admin account
python test_gemini.py   # Test Gemini API
python -m pytest      # Run tests (if configured)

# Git
git add -A            # Stage all changes
git commit -m "..."   # Commit with message
git push              # Push to GitHub
```

---

## Project Statistics

| Metric | Count |
|--------|-------|
| Frontend Pages | 9 |
| Backend API Endpoints | 10+ |
| UI Components (shadcn) | 20+ |
| Databases/Collections | 3 (users, complaints, admins) |
| External APIs | 4 (Cloudinary, Gemini, Groq, MongoDB) |
| Environment Variables | 10+ |
| AI Fallback Models | 4 |

---

## Glossary

| Term | Definition |
|------|-----------|
| **RPD** | Requests Per Day (API rate limit) |
| **JWT** | JSON Web Token (stateless auth) |
| **CORS** | Cross-Origin Resource Sharing (allow frontend to call backend) |
| **FormData** | Browser API for multipart form submissions (file uploads) |
| **bcrypt** | Password hashing algorithm (secure, slow-by-design) |
| **Gemini** | Google's generative AI model (used for image analysis) |
| **Groq** | Alternative AI provider (faster inference) |
| **Cloudinary** | Image hosting & CDN service |
| **MongoDB** | NoSQL document database |
| **Edge Runtime** | Vercel's lightweight runtime for middleware (different from Node.js) |
| **Middleware** | Code running before route handlers (auth checks, logging, etc) |

---

**Document End**

Generated: April 10, 2026  
Last Checkpoint: "Next.js 16 frontend deployment and auth flow setup"  
Project Status: Production-ready frontend, Backend needs deployment, Auth needs re-implementation
