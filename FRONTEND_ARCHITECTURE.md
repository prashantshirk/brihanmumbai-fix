# BrihanMumbai Fix - Detailed Frontend Architecture & Deep Dive

**Document:** FRONTEND_ARCHITECTURE.md  
**Date:** April 10, 2026  
**Scope:** Next.js 16 Frontend (brihanmumbai-fix/frontend/)  
**Audience:** Developers, architects, new team members  

---

## Table of Contents

1. [Frontend Overview](#frontend-overview)
2. [Migration History: Vite → Next.js 16](#migration-history-vite--nextjs-16)
3. [File Structure & Organization](#file-structure--organization)
4. [Core Configuration](#core-configuration)
5. [Pages Deep Dive](#pages-deep-dive)
6. [Components Architecture](#components-architecture)
7. [Library Functions](#library-functions)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Styling & Design System](#styling--design-system)
10. [State Management](#state-management)
11. [Removed & Disabled Features](#removed--disabled-features)
12. [Known Issues & Limitations](#known-issues--limitations)
13. [Development Workflow](#development-workflow)

---

## Frontend Overview

### Purpose
The BrihanMumbai Fix frontend is a Next.js 16 application that provides a user interface for:
- **Citizens:** Report civic issues (potholes, water leaks, garbage, etc.)
- **Admins:** Manage and track complaints

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js App Router | 16.2.0 | File-based routing, Server/Client components |
| Language | TypeScript | 5.7.3 | Type safety, IDE support |
| Styling | Tailwind CSS | 4.2.0 | Utility-first CSS framework |
| UI Components | shadcn/ui | Latest | Composable, accessible components |
| Forms | React Hook Form | 7.54.1 | Lightweight form state management |
| Icons | Lucide React | 0.564.0 | SVG icon library |
| Package Manager | pnpm | 10.x | Fast, disk-efficient package manager |
| Deployment | Vercel | N/A | Serverless hosting + Edge Runtime |
| Themes | next-themes | 0.4.6 | Dark mode support |

### Key Statistics

```
Total .tsx Files:  73 (including 29 shadcn/ui components)
Total .ts Files:   8 (lib functions, utilities, hooks)
App Pages:         10 (home, login, register, report, dashboard, feed, track, admin)
Landing Components: 9 (header, hero, features, cta, footer, stats, etc)
UI Components:     29 (shadcn prebuilt + custom)
LOC (Lines of Code): ~8000+ (excluding node_modules and auto-generated)

Current Size:
- node_modules: ~800MB
- .next build: ~200MB
- Source code: ~2MB
```

---

## Migration History: Vite → Next.js 16

### Why Migrate?

**Vite React Issues:**
- Manual routing with react-router-dom (more boilerplate)
- Client-side rendering only (no SSR, bad SEO)
- Separate backend server needed for assets
- Deployment required custom setup

**Next.js 16 Benefits:**
- File-based routing (automatic, simpler)
- Server Components by default (better performance)
- Built-in API routes (not used here, using Flask)
- Vercel deployment (one-click, automatic)
- TypeScript out-of-the-box
- Incremental Static Regeneration (ISR)
- Edge Runtime support

### What Changed

#### 1. Routing
**Before (Vite React):**
```javascript
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'

<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
</Routes>
```

**After (Next.js 16):**
```
app/
  page.tsx          ← /
  login/page.tsx    ← /login
  register/page.tsx ← /register
  report/page.tsx   ← /report
```

#### 2. Navigation
**Before:**
```javascript
import { useNavigate } from 'react-router-dom'
const navigate = useNavigate()
navigate('/dashboard')
```

**After:**
```javascript
import { useRouter } from 'next/navigation'
const router = useRouter()
router.push('/dashboard')
```

#### 3. Links
**Before:**
```javascript
<Link to="/report">Report Issue</Link>
```

**After:**
```javascript
<Link href="/report">Report Issue</Link>
```

#### 4. Component Pattern
**Before (All client-side):**
```javascript
function Page() {
  const [data, setData] = useState(null)
  useEffect(() => { fetchData() }, [])
  return <div>{data}</div>
}
```

**After (Server + Client):**
```typescript
// Server Component (default)
export default function Page() {
  // No hooks, no browser APIs
  return <div>{data}</div>
}

// Client Component (when needed)
'use client'
import { useState, useEffect } from 'react'
export default function Page() {
  // Can use hooks, browser APIs
}
```

#### 5. HTTP Client
**Before (Axios):**
```javascript
import axios from 'axios'
axios.post('/api/login', { email, password })
```

**After (Fetch + TypeScript):**
```typescript
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  return res.json() as Promise<T>
}
```

#### 6. Environment Variables
**Before (.env):**
```
REACT_APP_API_URL=http://localhost:5000
```

**After (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Note:** Must use `NEXT_PUBLIC_` prefix to expose to browser.

#### 7. Project Structure
**Before:**
```
src/
  components/
  pages/
  utils/
  api.js
  App.jsx
  index.js
public/
```

**After:**
```
app/
  layout.tsx
  page.tsx
  [routes]/
components/
  ui/
  landing/
lib/
  api.ts
  auth.ts
public/
```

---

## File Structure & Organization

### Complete Directory Tree

```
brihanmumbai-fix/frontend/
│
├── app/                                    # Next.js App Router (file-based routing)
│   ├── layout.tsx                         # Root layout (Server Component)
│   ├── page.tsx                           # Home page (Server Component)
│   ├── globals.css                        # Global styles
│   │
│   ├── login/
│   │   └── page.tsx                       # Login form (Client Component)
│   │
│   ├── register/
│   │   └── page.tsx                       # Register form (Client Component)
│   │
│   ├── report/
│   │   └── page.tsx                       # 3-step complaint form (Client Component)
│   │                                        │ Step 1: Upload image
│   │                                        │ Step 2: Review AI analysis
│   │                                        │ Step 3: Confirm & submit
│   │
│   ├── dashboard/
│   │   └── page.tsx                       # User's complaints (Client Component)
│   │                                        (Currently shows mock data)
│   │
│   ├── feed/
│   │   └── page.tsx                       # Community feed (Client Component)
│   │                                        (Currently shows mock data)
│   │
│   ├── track/
│   │   └── page.tsx                       # Track complaint by ID (Client Component)
│   │                                        (Currently mock data)
│   │
│   └── admin/
│       ├── login/
│       │   └── page.tsx                   # Admin login (Client Component)
│       │
│       ├── page.tsx                       # Admin dashboard (Client Component)
│       │                                    (Shows stats, complaint list)
│       │
│       └── complaints/
│           └── [id]/
│               └── page.tsx               # Admin complaint detail (Client Component)
│
├── components/                             # Reusable UI components
│   ├── ui/                                # shadcn/ui components (auto-generated)
│   │   ├── button.tsx                     # Button variants
│   │   ├── card.tsx                       # Card container
│   │   ├── input.tsx                      # Text input
│   │   ├── dialog.tsx                     # Modal dialog
│   │   ├── table.tsx                      # Data table
│   │   ├── badge.tsx                      # Status badge
│   │   ├── tabs.tsx                       # Tabbed interface
│   │   ├── textarea.tsx                   # Multi-line text
│   │   ├── select.tsx                     # Dropdown select
│   │   ├── skeleton.tsx                   # Loading skeleton
│   │   ├── alert.tsx                      # Alert box
│   │   ├── avatar.tsx                     # User avatar
│   │   ├── progress.tsx                   # Progress bar
│   │   └── 20+ more...
│   │
│   ├── landing/                           # Landing page sections
│   │   ├── header.tsx                     # Top navigation (Client Component)
│   │   ├── hero.tsx                       # Hero section (Server Component)
│   │   ├── features.tsx                   # Features grid (Server Component)
│   │   ├── how-it-works.tsx              # How it works steps (Server Component)
│   │   ├── issue-categories.tsx          # Issue type grid (Server Component)
│   │   ├── stats.tsx                      # Statistics section (Server Component)
│   │   ├── testimonials.tsx              # User testimonials (Server Component)
│   │   ├── cta.tsx                        # Call-to-action (Server Component)
│   │   └── footer.tsx                     # Footer (Server Component)
│   │
│   ├── Navbar.tsx                         # Navigation bar (Client Component)
│   │                                        (Shows when logged in)
│   │
│   └── theme-provider.tsx                 # Theme wrapper (Client Component)
│
├── lib/                                    # Utility functions & helpers
│   ├── api.ts                             # API client (TypeScript)
│   │                                        - apiFetch<T>() helper
│   │                                        - authAPI group
│   │                                        - complaintAPI group
│   │                                        - feedAPI group
│   │                                        - adminAPI group
│   │
│   ├── auth.ts                            # Authentication helpers
│   │                                        - saveUserSession()
│   │                                        - getUser()
│   │                                        - isLoggedIn()
│   │                                        - logout()
│   │                                        - saveAdminSession()
│   │                                        - isAdminLoggedIn()
│   │                                        - logoutAdmin()
│   │
│   └── utils.ts                           # General utilities
│
├── hooks/                                  # Custom React hooks
│   ├── use-toast.ts                       # Toast notification hook
│   └── use-mobile.ts                      # Mobile detection hook
│
├── styles/                                 # CSS files (empty, using Tailwind)
│   └── globals.css                        # (Actually in app/globals.css)
│
├── public/                                 # Static files
│   └── images/                            # Image storage
│       └── (empty - pothole image not uploaded)
│
├── .env.local                             # Local dev environment vars
│   └── NEXT_PUBLIC_API_URL=http://localhost:5000
│
├── .env.example                           # Template for env vars
│
├── next.config.mjs                        # Next.js build config
│
├── vercel.json                            # Vercel deployment config
│
├── tsconfig.json                          # TypeScript configuration
│
├── tailwind.config.ts                     # Tailwind configuration
│
├── postcss.config.mjs                     # PostCSS configuration
│
├── package.json                           # Dependencies & scripts
│
├── pnpm-lock.yaml                         # Dependency lock file
│
├── components.json                        # shadcn/ui configuration
│
├── .gitignore                             # Git ignore rules
│
├── next-env.d.ts                          # Next.js type definitions
│
└── middleware.ts.disabled                 # AUTH MIDDLEWARE (DISABLED)
                                            ⚠️ Not running - deprecated
                                            ⚠️ All routes currently public
```

### File Counts

```
Total Files:           ~120
├── .tsx files:        73
├── .ts files:         8  
├── Config files:      6
└── Others:           33

By Category:
├── Pages:            10
├── Components:       73 (including shadcn)
├── Lib functions:     3
├── Hooks:            2
└── Config:           6
```

---

## Core Configuration

### next.config.mjs

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript: Ignore errors during build (not ideal, should fix them)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Images: Disable optimization (Sharp library issues)
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

**Why `unoptimized: true`?**
- Sharp library requires native compilation
- pnpm blocks build scripts for security
- With unoptimized: true, Next.js skips image optimization
- Note: ⚠️ Not using <Image> component anyway (using <img> or gradients)

### vercel.json

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "devCommand": "pnpm dev",
  "framework": "nextjs"
}
```

**Why Explicit Config?**
- Tells Vercel to use pnpm (not npm/yarn)
- Specifies Next.js framework for optimizations
- Ensures correct build process

### tsconfig.json Key Settings

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./*"]  ← Import alias: @/components, @/lib
    }
  }
}
```

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ef4444',    // Red accent
        secondary: '#22c55e',  // Green (CTA buttons)
        accent: '#f97316',     // Orange
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

---

## Pages Deep Dive

### 1. app/page.tsx - Home/Landing Page

**Type:** Server Component (no 'use client')  
**Route:** `/`  
**Authentication:** ❌ Public  
**Lines:** ~27  

**Structure:**
```typescript
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />           ← Navigation (Client Component)
      <main>
        <Hero />           ← Hero section with gradient
        <Stats />          ← Statistics
        <Features />       ← Feature list
        <HowItWorks />     ← Step-by-step guide
        <IssueCategories /> ← Issue types
        <Testimonials />    ← User reviews
        <CTA />            ← Call-to-action
      </main>
      <Footer />           ← Footer links
    </div>
  )
}
```

**Current Status:** ✅ Working (fully static)  
**Data Flow:** No API calls, pure static content

---

### 2. app/login/page.tsx - User Login

**Type:** Client Component ('use client')  
**Route:** `/login`  
**Authentication:** ❌ Public  
**Lines:** ~150+  
**State Variables:** email, password, isLoading, error, mounted  

**Current Behavior:**
```typescript
// Mock implementation
const handleSubmit = async (e) => {
  e.preventDefault()
  setError("")
  
  if (!email || !password) {
    setError("Please fill in all fields")
    return
  }
  
  setIsLoading(true)
  
  // Simulate login delay
  await new Promise((resolve) => setTimeout(resolve, 1500))
  
  // Mock successful login (NO BACKEND CALL)
  setIsLoading(false)
  router.push("/dashboard")  ← Redirects without validation!
}
```

**What Should Happen:**
```typescript
// Real implementation (NOT DONE)
const handleSubmit = async (e) => {
  e.preventDefault()
  
  try {
    const response = await authAPI.login(email, password)
    saveUserSession(response.token, response.user)
    router.push("/dashboard")
  } catch (error) {
    setError(error.message)
  }
}
```

**Issues:**
- ⚠️ Mock implementation - no backend validation
- ⚠️ Anyone can "login" without credentials
- ⚠️ No actual token stored
- ⚠️ No user data persisted

**Form Fields:**
- Email (text input)
- Password (password input)
- "Sign in" button
- "Create account" link

---

### 3. app/register/page.tsx - User Registration

**Type:** Client Component ('use client')  
**Route:** `/register`  
**Authentication:** ❌ Public  
**Lines:** ~150+  
**State Variables:** name, email, password, confirmPassword, isLoading, error  

**Current Behavior:** Same as login - simulates delay then redirects

**What Should Happen:**
```typescript
const response = await authAPI.register(name, email, password)
saveUserSession(response.token, response.user)
router.push("/dashboard")
```

**Issues:**
- ⚠️ Mock implementation (same as login)
- ⚠️ No validation on backend
- ⚠️ Passwords not actually stored
- ⚠️ Email uniqueness not checked

---

### 4. app/report/page.tsx - Report Issue (3-Step Form)

**Type:** Client Component ('use client')  
**Route:** `/report`  
**Authentication:** ⚠️ Should be protected, currently public  
**Lines:** ~350+  
**Step Flow:** 1 (Upload) → 2 (Review) → 3 (Confirm/Success)  

**State Variables:**
```typescript
const [step, setStep] = useState(1)
const [imageFile, setImageFile] = useState<File | null>(null)
const [imagePreview, setImagePreview] = useState<string | null>(null)
const [isAnalyzing, setIsAnalyzing] = useState(false)
const [isDragging, setIsDragging] = useState(false)
const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
const [location, setLocation] = useState("")
const [ward, setWard] = useState("")
const [additionalDetails, setAdditionalDetails] = useState("")
const [complaintId, setComplaintId] = useState("")
const [copied, setCopied] = useState(false)
```

**Step 1: Upload Image**
```
┌──────────────────────────────────────┐
│ Drag & drop OR click to upload       │
│ Image preview (max 5MB)              │
│ "Analyze" button                     │
└──────────────────────────────────────┘
```

**Current Code (Mock):**
```typescript
const handleAnalyze = async () => {
  if (!imageFile) return
  
  setIsAnalyzing(true)
  
  // Simulate AI analysis
  await new Promise((resolve) => setTimeout(resolve, 2000))
  
  // Mock result
  const mockAnalysis = {
    issueType: "Pothole",
    severity: "High",
    department: "Roads & Infrastructure",
    confidence: 94,
    description: "...",
  }
  
  setAnalysis(mockAnalysis)
  setStep(2)
}
```

**What Should Happen:**
```typescript
const handleAnalyze = async () => {
  const formData = new FormData()
  formData.append('image', imageFile)
  formData.append('location', location)
  formData.append('ward_number', ward)
  
  const result = await complaintAPI.analyzeImage(formData)
  setAnalysis(result)
  setStep(2)
}
```

**Step 2: Review Analysis**
- Shows extracted fields (editable)
- Allows user to modify AI results
- Image preview
- "Back" & "Next" buttons

**Step 3: Confirm & Submit**
- Shows complaint letter
- Display complaint ID
- Copy button
- "Submit Another" button

**Issues:**
- ⚠️ No real image upload to Cloudinary
- ⚠️ No AI analysis call
- ⚠️ No complaint submission to backend
- ⚠️ Mock complaint ID generated locally
- ⚠️ Not protected by authentication

---

### 5. app/dashboard/page.tsx - User Dashboard

**Type:** Client Component ('use client')  
**Route:** `/dashboard`  
**Authentication:** ⚠️ Should be protected, currently public  
**Lines:** ~400+  

**Current State:** Mock data only

```typescript
// Mock data (lines 41-80)
const mockComplaints = [
  {
    id: "BMF-K7X2A9-P4QM",
    issueType: "Pothole",
    severity: "High",
    location: "Link Road, near Andheri Station",
    ward: "K/W-Ward",
    status: "In Progress",
    department: "Roads & Infrastructure",
    submittedAt: "2024-01-15T10:30:00Z",
  },
  // ... more mock items
]
```

**Tabs:**
1. **All** - All user complaints
2. **Submitted** - Recent submissions
3. **In Progress** - Being handled
4. **Resolved** - Completed

**Features:**
- Search by complaint ID or location
- Filter by status
- Pagination
- Table view with: Image, Issue Type, Location, Status, Date
- Click row to view details

**What Should Happen:**
```typescript
const [complaints, setComplaints] = useState([])

useEffect(() => {
  complaintAPI.list(1, 10)
    .then(data => setComplaints(data.complaints))
}, [])
```

**Issues:**
- ⚠️ Always shows mock data
- ⚠️ API call never made
- ⚠️ No real user data fetched
- ⚠️ Search/filter only works on mock data

---

### 6. app/feed/page.tsx - Community Feed

**Type:** Client Component ('use client')  
**Route:** `/feed`  
**Authentication:** ⚠️ Should be protected, currently public  
**Lines:** ~350+  

**Current State:** Mock community feed

```typescript
const mockFeedPosts = [
  {
    id: "1",
    issueType: "Pothole",
    severity: "High",
    location: "Link Road, Andheri West",
    ward: "K/W-Ward",
    status: "In Progress",
    citizenName: "Priya S.",
    submittedAt: "2024-01-16T08:30:00Z",
    imageUrl: "/api/placeholder/400/300",
    description: "Large pothole near the bus stop causing traffic issues",
  },
  // ... more mock items
]
```

**Features:**
- Grid layout of recent complaints
- Filter by issue type
- Sort by date, severity
- Pagination
- Each card shows: Image, Type, Severity, Location, Status, Submitter

**What Should Happen:**
```typescript
const [posts, setPosts] = useState([])

useEffect(() => {
  feedAPI.getPosts(1, 12)
    .then(data => setPosts(data.posts))
}, [])
```

**Issues:**
- ⚠️ Mock data only
- ⚠️ No API call to backend
- ⚠️ Filter/sort doesn't work correctly
- ⚠️ Always shows same hardcoded posts

---

### 7. app/track/page.tsx - Track Complaint

**Type:** Client Component ('use client')  
**Route:** `/track`  
**Authentication:** ⚠️ Should be protected, currently public  
**Lines:** ~200+  

**Current State:** Mock complaint tracking

**Features:**
- Input field to search complaint ID
- Shows complaint details
- Timeline of status changes
- Location map (if available)

**What Should Happen:**
```typescript
const handleSearch = async (id: string) => {
  const complaint = await complaintAPI.getOne(id)
  setComplaint(complaint)
}
```

**Issues:**
- ⚠️ Mock data only
- ⚠️ Search doesn't actually query backend
- ⚠️ Timeline is hardcoded

---

### 8. app/admin/login/page.tsx - Admin Login

**Type:** Client Component ('use client')  
**Route:** `/admin/login`  
**Authentication:** ❌ Public  
**Lines:** ~120+  

**Similar to user login but:**
- Separate token key: `bmf_admin_token`
- Should call `adminAPI.login()`
- Currently mock implementation
- Redirects to `/admin` on success

---

### 9. app/admin/page.tsx - Admin Dashboard

**Type:** Client Component ('use client')  
**Route:** `/admin`  
**Authentication:** ⚠️ Should be protected, currently public  
**Lines:** ~450+  

**Features:**
- Statistics cards (total, submitted, in progress, resolved, rejected)
- Complaints table with filters
- Search by ID, location, citizen name
- Filter by status, severity, department
- Pagination
- Action buttons: View, Edit status

**Mock Data:**
```typescript
const mockStats = {
  total: 523,
  submitted: 45,
  in_progress: 128,
  resolved: 312,
  rejected: 38,
  by_issue_type: { ... },
  by_severity: { ... }
}
```

**What Should Happen:**
```typescript
useEffect(() => {
  adminAPI.getStats()
    .then(data => setStats(data))
  adminAPI.getComplaints({ page: 1, limit: 50 })
    .then(data => setComplaints(data.complaints))
}, [])
```

**Issues:**
- ⚠️ Mock stats only
- ⚠️ No API calls
- ⚠️ Status updates not functional
- ⚠️ Filters only work on mock data

---

### 10. app/admin/complaints/[id]/page.tsx - Admin Complaint Detail

**File Status:** ⚠️ Path doesn't exist yet

**Route:** `/admin/complaints/[id]`  
**Expected Type:** Client Component  
**Expected Authentication:** ⚠️ Protected (admin only)  

**Should Include:**
- Full complaint details
- Image with annotation tools
- Status change dropdown
- Assignment options
- Notes/comments
- History of changes

**Needs Creation:** This page needs to be created.

---

## Components Architecture

### Landing Components

#### components/landing/header.tsx
**Type:** Client Component ('use client')  
**Purpose:** Top navigation bar  
**States:** Uses router, localStorage, pathname for active links  

**Key Code:**
```typescript
'use client'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { getUser, logout } from '@/lib/auth'

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const user = getUser()
  
  const isActive = (href: string) => pathname === href
  
  const handleLogout = () => {
    logout()
    router.push('/login')
  }
  
  return (
    <header className="sticky top-0 bg-white shadow">
      {/* Desktop Navigation */}
      <nav className="hidden md:flex">
        <Link href="/">Home</Link>
        <Link href="/feed">Community Feed</Link>
        <Link href="/dashboard">Dashboard</Link>
        
        {user ? (
          <>
            <span>{user.name}</span>
            <Button onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <Button onClick={() => router.push('/login')}>Login</Button>
        )}
      </nav>
      
      {/* Mobile Navigation */}
      <nav className="md:hidden">
        {/* Mobile menu */}
      </nav>
    </header>
  )
}
```

**Changes from Vite Version:**
- ✅ Removed react-router `useNavigate` hook
- ✅ Uses `useRouter` from 'next/navigation'
- ✅ Uses `usePathname` for active link detection (no `NavLink` component)
- ✅ All `to=` props changed to `href=`

---

#### components/landing/hero.tsx
**Type:** Server Component  
**Purpose:** Hero section with CTA  

**Key Features:**
- Background gradient: `bg-gradient-to-b from-primary/10 to-accent/10`
- Headline: "Make Mumbai Better"
- Subheadline: Feature benefits
- CTA Button: "Report Issue" → redirects to `/login` (was `/report`)
- Optional: Pothole image (not uploaded, using gradient)

**Code Snippet:**
```typescript
export function Hero() {
  return (
    <section className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-accent/10"></div>
      
      <div className="relative container py-24">
        <h1 className="text-4xl font-bold">Ready to Make Mumbai Better?</h1>
        <p className="text-lg text-muted-foreground mt-4">...</p>
        
        <Link href="/login" className="inline-flex items-center gap-2">
          <Button>Report Issue</Button>
          <ArrowRight />
        </Link>
      </div>
    </section>
  )
}
```

---

#### components/landing/features.tsx
**Type:** Server Component  
**Features:** Grid of feature cards

```typescript
const features = [
  {
    icon: <Upload />,
    title: "Easy Reporting",
    description: "Upload photos and let AI do the analysis"
  },
  {
    icon: <Zap />,
    title: "AI Powered",
    description: "Automatic issue detection and categorization"
  },
  {
    icon: <BarChart3 />,
    title: "Track Progress",
    description: "Monitor your complaint status in real-time"
  },
  // More features...
]
```

---

#### components/landing/cta.tsx
**Type:** Server Component  
**Purpose:** Call-to-action section

**Changes:**
- ✅ Removed "Report an Issue Now" button (went directly to /report)
- ✅ Kept "Create Free Account" button
- ✅ Updated copy to match account-first flow

**Key Code:**
```typescript
export function CTA() {
  return (
    <section className="py-16">
      <h2>Ready to Make Mumbai Better?</h2>
      
      <div className="flex gap-4">
        {/* Removed: "Report an Issue Now" button */}
        
        <Link href="/register">
          <Button className="bg-secondary">
            Create Free Account
            <ArrowRight />
          </Button>
        </Link>
      </div>
    </section>
  )
}
```

---

#### components/landing/stats.tsx, features.tsx, testimonials.tsx, footer.tsx, how-it-works.tsx, issue-categories.tsx
**Type:** All Server Components  
**Purpose:** Static content sections  
**Status:** ✅ All working, fully static  

---

### UI Components (shadcn/ui)

All 29 UI components are from shadcn/ui and auto-generated via `shadcn-ui/cli`.

**Key Components Used:**

| Component | File | Purpose |
|-----------|------|---------|
| Button | button.tsx | CTA buttons, form submit |
| Card | card.tsx | Container for content |
| Input | input.tsx | Text input fields |
| Dialog | dialog.tsx | Modal dialogs |
| Table | table.tsx | Data tables |
| Badge | badge.tsx | Status indicators |
| Tabs | tabs.tsx | Tabbed interfaces |
| Select | select.tsx | Dropdown selection |
| Textarea | textarea.tsx | Multi-line text |
| Alert | alert.tsx | Alert messages |
| Avatar | avatar.tsx | User profiles |
| Progress | progress.tsx | Progress bars |
| And 17 more... | — | Various components |

**All components:**
- 100% accessible (WCAG 2.1)
- Built on Radix UI
- Fully themeable
- TypeScript typed
- Use Tailwind CSS

---

### Custom Components

#### components/Navbar.tsx
**Type:** Client Component ('use client')  
**Purpose:** Main navigation bar (shown when logged in)  

**Shows:**
- App logo
- Navigation links: Submit Complaint, Community Feed, Dashboard
- User name + profile dropdown
- Logout button

**Code:**
```typescript
'use client'
import { useRouter } from 'next/navigation'
import { getUser, logout } from '@/lib/auth'

export function Navbar() {
  const router = useRouter()
  const user = getUser()
  
  if (!user) return null
  
  const handleLogout = () => {
    logout()
    router.push('/login')
  }
  
  return (
    <nav className="sticky top-0 bg-white shadow">
      {/* Navigation */}
    </nav>
  )
}
```

---

#### components/theme-provider.tsx
**Type:** Client Component ('use client')  
**Purpose:** next-themes provider for dark mode  

```typescript
'use client'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {children}
    </ThemeProvider>
  )
}
```

---

## Library Functions

### lib/api.ts - API Client

**Purpose:** Centralized TypeScript API client  
**Size:** ~250 lines  
**Key Feature:** Generic `apiFetch<T>()` helper with automatic JWT injection  

#### Type Definitions

```typescript
export interface User {
  id: string
  name: string
  email: string
  created_at?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Complaint {
  _id: string
  user_id: string
  image_url: string
  issue_type: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  description: string
  department: string
  location: string
  ward_number: string
  latitude?: number
  longitude?: number
  complaint_text: string
  status: 'Submitted' | 'In Progress' | 'Resolved' | 'Rejected'
  created_at: string
  updated_at: string
  model_used?: string
}

export interface AnalysisResult {
  image_url: string
  issue_type: string
  severity: string
  description: string
  department: string
  confidence: number
  model_used: string
}

export interface FeedPost {
  _id: string
  citizen_name: string
  image_url: string
  issue_type: string
  severity: string
  location: string
  ward_number: string
  status: string
  created_at: string
}

export interface AdminStats {
  total: number
  submitted: number
  in_progress: number
  resolved: number
  rejected: number
  by_issue_type: Record<string, number>
  by_severity: Record<string, number>
}
```

#### Core Helper: apiFetch<T>()

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function getToken(admin = false): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(admin ? 'bmf_admin_token' : 'bmf_token') || ''
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  admin = false
): Promise<T> {
  // 1. Get token from localStorage
  const token = getToken(admin)
  const headers: HeadersInit = { ...options.headers }
  
  // 2. Add Content-Type (except for FormData)
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json'
  }
  
  // 3. Add Authorization header if token exists
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  
  // 4. Make request
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  
  // 5. Handle 401 Unauthorized
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(admin ? 'bmf_admin_token' : 'bmf_token')
      localStorage.removeItem(admin ? 'bmf_admin' : 'bmf_user')
      window.location.href = admin ? '/admin/login' : '/login'
    }
    throw new Error('Unauthorized')
  }
  
  // 6. Handle other errors
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  
  // 7. Return typed response
  return res.json() as Promise<T>
}
```

#### API Groups

**authAPI:**
```typescript
export const authAPI = {
  register: (name: string, email: string, password: string) =>
    apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiFetch<User>('/api/auth/me'),
}
```

**complaintAPI:**
```typescript
export const complaintAPI = {
  analyzeImage: (formData: FormData) =>
    apiFetch<AnalysisResult>('/api/analyze-image', {
      method: 'POST',
      body: formData,
    }),

  create: (data: Partial<Complaint>) =>
    apiFetch<Complaint>('/api/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (page = 1, limit = 10) =>
    apiFetch<{
      complaints: Complaint[]
      total: number
      page: number
      limit: number
    }>(`/api/complaints?page=${page}&limit=${limit}`),

  getOne: (id: string) => apiFetch<Complaint>(`/api/complaints/${id}`),

  updateStatus: (id: string, status: string) =>
    apiFetch<Complaint>(`/api/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}
```

**feedAPI:**
```typescript
export const feedAPI = {
  getPosts: (page = 1, limit = 12) =>
    apiFetch<{ posts: FeedPost[]; total: number; has_more: boolean }>(
      `/api/feed?page=${page}&limit=${limit}`
    ),
}
```

**adminAPI:**
```typescript
export const adminAPI = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; admin: User }>(
      '/api/admin/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      true  ← Uses admin token
    ),

  me: () =>
    apiFetch<User & { role: string }>('/api/admin/me', {}, true),

  getComplaints: (params: Record<string, string | number>) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== '' && v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString()

    return apiFetch<{
      complaints: (Complaint & { user_name: string; user_email: string })[]
      total: number
      page: number
      pages: number
    }>(`/api/admin/complaints?${qs}`, {}, true)
  },

  getComplaint: (id: string) =>
    apiFetch<Complaint & { user_name: string; user_email: string }>(
      `/api/admin/complaints/${id}`,
      {},
      true
    ),

  updateStatus: (id: string, status: string) =>
    apiFetch<{ success: boolean; new_status: string }>(
      `/api/admin/complaints/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      true
    ),

  getStats: () => apiFetch<AdminStats>('/api/admin/stats', {}, true),
}
```

---

### lib/auth.ts - Authentication Helpers

**Purpose:** Session management, localStorage, cookies  
**Size:** ~100 lines  
**Exports:** 10 functions  

#### Interfaces

```typescript
export interface StoredUser {
  id: string
  name: string
  email: string
}
```

#### Functions

**saveUserSession(token, user)**
```typescript
export function saveUserSession(token: string, user: StoredUser) {
  // 1. Save token to localStorage
  localStorage.setItem('bmf_token', token)
  
  // 2. Save user data to localStorage
  localStorage.setItem('bmf_user', JSON.stringify(user))
  
  // 3. Set cookie for middleware auth (7 days)
  document.cookie = `bmf_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
}
```

**getUser()**
```typescript
export function getUser(): StoredUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('bmf_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
```

**isLoggedIn()**
```typescript
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('bmf_token')
}
```

**logout()**
```typescript
export function logout() {
  localStorage.removeItem('bmf_token')
  localStorage.removeItem('bmf_user')
  // Clear cookie
  document.cookie = 'bmf_token=; path=/; max-age=0'
}
```

**Admin versions:**
```typescript
export function saveAdminSession(token: string, admin: StoredUser) { ... }
export function getAdmin(): StoredUser | null { ... }
export function isAdminLoggedIn(): boolean { ... }
export function logoutAdmin() { ... }
```

---

## Data Flow Diagrams

### 1. User Registration Flow

```
FRONTEND (React Hook Form)
        │
        ▼
   handleSubmit()
        │
        ├─ Validate: name, email, password
        │
        ├─ Call authAPI.register(name, email, password)
        │
        └─→ apiFetch<AuthResponse>('/api/auth/register', {...})
                     │
                     ▼
           BACKEND (Flask)
                     │
           POST /api/auth/register
                     │
           ├─ Validate input (not empty, email format)
           │
           ├─ Check email uniqueness
           │  └─ 409 Conflict if exists
           │
           ├─ Hash password with bcrypt
           │
           ├─ Insert into MongoDB (users collection)
           │
           ├─ Generate JWT token (exp: 24h)
           │
           └─ Return { token, user }
                     │
                     ▼
           FRONTEND: Response handler
                     │
           ├─ saveUserSession(token, user)
           │  ├─ localStorage.setItem('bmf_token', token)
           │  ├─ localStorage.setItem('bmf_user', JSON.stringify(user))
           │  └─ document.cookie = `bmf_token=...`
           │
           └─ router.push('/dashboard')
```

### 2. Complaint Submission (3-Step) Flow

```
FRONTEND: Step 1 - Upload Image
        │
        ├─ User selects/drags image
        │
        ├─ Validate: format, size < 5MB
        │
        ├─ Show preview
        │
        └─ User clicks "Analyze"
                │
                ▼
        Prepare FormData
        ├─ image: <File>
        ├─ location: string
        └─ ward_number: string
                │
                ▼
        Call complaintAPI.analyzeImage(formData)
        ├─ apiFetch('/api/analyze-image', { method: 'POST', body: formData })
        │
        └─→ BACKEND: POST /api/analyze-image
                     │
            ├─ Upload image to Cloudinary → URL
            │
            ├─ Send to Gemini AI:
            │  ├─ Prompt: "Analyze this civic issue..."
            │  └─ Return: issue_type, severity, department, description
            │
            ├─ Handle AI failures:
            │  ├─ Gemini 2.5-flash fails
            │  ├─ Try Gemini 2.5-flash-lite
            │  ├─ Try Gemini 3.1-flash-lite
            │  └─ Try Groq Llama Vision (fallback)
            │
            └─ Return { image_url, issue_type, severity, ... }
                     │
                     ▼
        FRONTEND: Step 2 - Review Analysis
                │
        ├─ Display AI results (editable)
        │
        ├─ User can modify:
        │  ├─ Issue type
        │  ├─ Severity
        │  └─ Description
        │
        └─ User clicks "Submit"
                │
                ▼
        Call complaintAPI.create(complaintData)
        ├─ apiFetch('/api/complaints', { method: 'POST', body: JSON.stringify(data) })
        │
        └─→ BACKEND: POST /api/complaints
                     │
            ├─ Validate all fields required
            │
            ├─ Sanitize description (HTML escape)
            │
            ├─ Insert into MongoDB (complaints collection)
            │
            └─ Return { _id, status: 'Submitted', ... }
                     │
                     ▼
        FRONTEND: Step 3 - Success
                │
        ├─ Display complaint ID
        │
        ├─ Allow copy to clipboard
        │
        └─ Offer "Submit Another" or "View Dashboard"
```

### 3. Authentication Check Flow

```
Any Protected Page (e.g., /dashboard)
        │
        ├─ Component mounts
        │
        └─ useEffect: isLoggedIn() check
                │
                ├─ Read localStorage['bmf_token']
                │
                ├─ Token exists?
                │  ├─ YES: Render page
                │  └─ NO: Redirect to /login
                │
                └─ Token valid?
                   ├─ YES: Load data via API
                   └─ NO: Clear storage, redirect to /login
```

---

## Styling & Design System

### Global Styles (app/globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #ef4444;    /* Red accent */
  --secondary: #22c55e;  /* Green for CTA */
  --accent: #f97316;     /* Orange */
  --background: #ffffff;
  --foreground: #000000;
  --muted: #737373;
}

body {
  font-family: 'DM Sans', 'Syne', sans-serif;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

### Color Scheme

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | Red | #ef4444 | Links, accents, highlights |
| Secondary | Green | #22c55e | CTA buttons, submit |
| Accent | Orange | #f97316 | Secondary highlights |
| Background | White | #ffffff | Page background |
| Foreground | Black | #000000 | Text |
| Muted | Gray | #737373 | Disabled, secondary text |

### Typography

**Fonts:**
- **Headline:** Syne (bold, geometric)
- **Body:** DM Sans (regular, readable)

**Font Sizes:**
- H1: 2.5rem (40px)
- H2: 2rem (32px)
- H3: 1.5rem (24px)
- Body: 1rem (16px)
- Small: 0.875rem (14px)

**Line Heights:**
- Tight: 1.2
- Normal: 1.5
- Relaxed: 1.75

---

## State Management

### Local State (useState)

All state management uses React's built-in `useState` hook (no Redux/Zustand).

**Examples:**

**Login Form:**
```typescript
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState("")
```

**Report Form:**
```typescript
const [step, setStep] = useState(1)
const [imageFile, setImageFile] = useState<File | null>(null)
const [imagePreview, setImagePreview] = useState<string | null>(null)
const [isAnalyzing, setIsAnalyzing] = useState(false)
const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
```

**Dashboard:**
```typescript
const [complaints, setComplaints] = useState<Complaint[]>([])
const [loading, setLoading] = useState(true)
const [page, setPage] = useState(1)
const [filter, setFilter] = useState("all")
```

### Side Effects (useEffect)

Minimal side effects currently since most pages use mock data.

```typescript
useEffect(() => {
  // Fetch data on mount
  fetchComplaints()
}, [])

useEffect(() => {
  // Refetch when page changes
  fetchComplaints()
}, [page])
```

### localStorage

**User Session:**
```
bmf_token:        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
bmf_user:         '{"id":"507f","name":"John","email":"john@..."}'

bmf_admin_token:  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
bmf_admin:        '{"id":"507f","name":"Admin","email":"..."}'
```

### URL State

**Query Parameters (for filtering, pagination):**
```
/dashboard?page=2&status=in-progress
/feed?page=1&issue_type=Pothole
/track?id=BMF-K7X2A9
```

---

## Removed & Disabled Features

### 1. middleware.ts (DISABLED)

**File:** `middleware.ts.disabled`  
**Status:** ⚠️ Disabled - renamed to prevent execution  

**Why Disabled:**
- Next.js 16 deprecated middleware pattern on Vercel Edge Runtime
- Caused 404/500 errors during Vercel deployment
- Edge Runtime cannot execute middleware the old way

**What It Was:**
```typescript
'use client' error if uncommented!
import { NextRequest, NextResponse } from 'next/server'
import { isLoggedIn } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  const protectedRoutes = [
    '/dashboard',
    '/feed',
    '/report',
    '/track',
    '/admin',
  ]
  
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('bmf_token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard', '/feed', '/report', '/track', '/admin/:path*'],
}
```

**Impact:** All routes are now public (authentication not enforced).

### 2. React Router Imports (REMOVED)

**Old Pattern (Vite React):**
```typescript
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Navigate } from 'react-router-dom'

const navigate = useNavigate()
navigate('/dashboard')

<Link to="/login">Login</Link>
```

**New Pattern (Next.js 16):**
```typescript
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const router = useRouter()
router.push('/dashboard')

<Link href="/login">Login</Link>
```

**All Changed:**
- ✅ app/layout.tsx
- ✅ app/page.tsx
- ✅ app/login/page.tsx
- ✅ app/register/page.tsx
- ✅ app/report/page.tsx
- ✅ app/dashboard/page.tsx
- ✅ app/feed/page.tsx
- ✅ app/track/page.tsx
- ✅ app/admin/page.tsx
- ✅ app/admin/login/page.tsx
- ✅ components/Navbar.tsx
- ✅ components/landing/header.tsx
- ✅ All other components

### 3. Axios HTTP Client (REPLACED)

**Old (Vite React):**
```typescript
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.get('/api/complaints')
apiClient.post('/api/auth/login', data)
```

**New (Next.js 16 with native Fetch):**
```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

async function apiFetch<T>(path: string, options = {}, admin = false): Promise<T> {
  const token = getToken(admin)
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  }
  
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  
  if (res.status === 401) {
    // Clear session & redirect
  }
  
  return res.json()
}
```

**Benefits:**
- No external dependency (axios removed)
- Fully typed with TypeScript generics
- Better error handling
- Native to all modern browsers

### 4. Mock Authentication Forms

**Current State:** Forms animate and redirect, but don't call API.

**Login (app/login/page.tsx, line 37-42):**
```typescript
const handleSubmit = useCallback(async (e: React.FormEvent) => {
  e.preventDefault()
  setError("")
  
  if (!email || !password) {
    setError("Please fill in all fields")
    return
  }
  
  setIsLoading(true)
  
  // ⚠️ MOCK: Simulates API delay but doesn't authenticate
  await new Promise((resolve) => setTimeout(resolve, 1500))
  
  // ⚠️ MOCK: Redirects without validation
  setIsLoading(false)
  router.push("/dashboard")  // NO JWT SAVED!
}, [mounted, email, password, router])
```

**What Should Happen:**
```typescript
try {
  const response = await authAPI.login(email, password)
  saveUserSession(response.token, response.user)
  router.push("/dashboard")
} catch (error) {
  setError(error.message)
}
```

### 5. Mock Data in Pages

**Dashboard (app/dashboard/page.tsx, lines 41-80):**
```typescript
const mockComplaints = [
  {
    id: "BMF-K7X2A9-P4QM",
    issueType: "Pothole",
    severity: "High",
    location: "Link Road, near Andheri Station",
    // ... mock fields
  },
  // ... more mock items
]
```

**Never Fetches Real Data:**
```typescript
// Should be:
useEffect(() => {
  complaintAPI.list(page, 10)
    .then(data => setComplaints(data.complaints))
}, [page])

// Actually is:
// Just renders mockComplaints directly
```

### 6. Report Form (No Backend Integration)

**app/report/page.tsx, Line 105-124:**

```typescript
const handleAnalyze = async () => {
  if (!imageFile) return
  
  setIsAnalyzing(true)
  
  // ⚠️ MOCK: Simulates 2 second delay
  await new Promise((resolve) => setTimeout(resolve, 2000))
  
  // ⚠️ MOCK: Hardcoded analysis (never calls AI)
  const mockAnalysis: AnalysisResult = {
    issueType: "Pothole",
    severity: "High",
    department: "Roads & Infrastructure",
    confidence: 94,
    description: "Large pothole detected on road surface...",
  }
  
  setAnalysis(mockAnalysis)
  setIsAnalyzing(false)
  setStep(2)
}
```

**What Should Happen:**
```typescript
const handleAnalyze = async () => {
  if (!imageFile || !location || !ward) return
  
  const formData = new FormData()
  formData.append('image', imageFile)
  formData.append('location', location)
  formData.append('ward_number', ward)
  
  try {
    const result = await complaintAPI.analyzeImage(formData)
    setAnalysis(result)
    setStep(2)
  } catch (error) {
    setError(error.message)
  }
}
```

---

## Known Issues & Limitations

### 1. ⚠️ Authentication Not Enforced

**Issue:** Routes are publicly accessible (middleware disabled)

**Current:**
```
/dashboard        ← Anyone can access
/feed             ← Anyone can access
/report           ← Anyone can access
/admin            ← Anyone can access
/admin/complaints/[id] ← Anyone can access
```

**Should Be:**
```
/dashboard        ← Only logged-in users
/feed             ← Only logged-in users
/report           ← Only logged-in users
/admin            ← Only admin users
/admin/complaints/[id] ← Only admin users
```

**Fix:** Re-implement middleware or add route-level auth guards.

### 2. ⚠️ Forms Are Mock

**Issue:** Login, register, report forms don't connect to backend

**Affected Pages:**
- `/login`
- `/register`
- `/report` (3-step form)
- `/admin/login`

**Current Behavior:** Simulate delay, then redirect (no validation)

**Fix:** Wire forms to API calls:
```typescript
const response = await authAPI.login(email, password)
saveUserSession(response.token, response.user)
```

### 3. ⚠️ Dashboard/Feed Show Mock Data

**Issue:** Pages never fetch real data

**Affected Pages:**
- `/dashboard` (never calls `complaintAPI.list()`)
- `/feed` (never calls `feedAPI.getPosts()`)
- `/admin` (never calls `adminAPI.getComplaints()`)

**Current:** Hard-coded mock complaints

**Fix:** Add useEffect to fetch data on mount

### 4. ⚠️ Image Upload Not Implemented

**Issue:** No actual image upload to Cloudinary

**File:** `app/report/page.tsx`

**Current:** Form accepts file but never uploads

**What Happens:**
1. User selects image ✅
2. Image preview shows ✅
3. User clicks "Analyze" ✅
4. ❌ Image never sent to Cloudinary
5. ❌ AI analysis never called
6. ❌ Complaint never submitted

**Fix:** Implement image upload in `complaintAPI.analyzeImage()`

### 5. ⚠️ TypeScript Build Errors (Ignored)

**Issue:** `typescript: { ignoreBuildErrors: true }` in next.config.mjs

**Risk:** Type errors not caught at build time

**Should Fix:** Remove this line and fix actual TypeScript errors

```javascript
// next.config.mjs (line 3-5)
typescript: {
  ignoreBuildErrors: true,  // ⚠️ BAD PRACTICE
}
```

### 6. ⚠️ Pothole Image Never Uploaded

**Issue:** Hero section tries to load image that doesn't exist

**File:** `components/landing/hero.tsx`

**Current:** Using gradient background instead

**Fix:** Download pothole image from Unsplash/Pexels and place at:
```
frontend/public/images/pothole-road-india.jpg
```

Then uncomment Image code:
```typescript
<Image 
  src="/images/pothole-road-india.jpg"
  alt="Pothole on road"
  width={400}
  height={300}
/>
```

### 7. ⚠️ Admin Complaint Detail Page Missing

**File:** `app/admin/complaints/[id]/page.tsx` (doesn't exist)

**Route:** `/admin/complaints/[id]`

**Needs:** Full page implementation to view/edit single complaint

### 8. ⚠️ No Error Boundaries

**Issue:** No error boundary components to catch React errors

**Risk:** App crashes on unexpected errors

**Fix:** Create error.tsx and add Error Boundary components

### 9. ⚠️ No Loading States

**Issue:** Data fetching pages show no loading skeleton

**Affected:** `/dashboard`, `/feed`, `/admin`

**Fix:** Add `<Skeleton />` components while data loads

### 10. ⚠️ Environment Variables Not Set on Vercel

**Issue:** `NEXT_PUBLIC_API_URL` not configured in Vercel dashboard

**Current:** Defaults to `http://localhost:5000` (won't work on Vercel)

**Fix:** Set in Vercel Project Settings:
```
NEXT_PUBLIC_API_URL = https://api.yourdomain.com
```

---

## Development Workflow

### Local Setup

```bash
# 1. Install dependencies
cd frontend
pnpm install

# 2. Create .env.local
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:5000

# 3. Start dev server
pnpm dev
# Runs on http://localhost:3000 (different from old Vite on :5173!)

# 4. Start backend in separate terminal
cd ../backend
python app.py
# Runs on http://localhost:5000
```

### Build for Production

```bash
# Build (generates .next folder)
pnpm build

# Test production build locally
pnpm start
# Runs on http://localhost:3000 with production settings
```

### Deployment to Vercel

```bash
# 1. Push to GitHub
git add -A
git commit -m "..."
git push

# 2. Vercel auto-deploys (or go to vercel.com to reconnect)

# 3. Check deployment
https://brihanmumbai-fix.vercel.app
```

---

## Summary

**Current State:**
- ✅ Frontend deployed on Vercel (https://brihanmumbai-fix.vercel.app)
- ✅ All pages created and UI complete
- ✅ TypeScript migration complete
- ✅ shadcn/ui components integrated
- ✅ Responsive design working
- ⚠️ Mock data used everywhere
- ⚠️ No authentication enforcement
- ⚠️ No API integration (all hardcoded)
- ⚠️ Middleware disabled

**Next Steps to Production:**
1. Re-implement authentication (middleware or route guards)
2. Wire login/register forms to backend API
3. Implement data fetching for dashboard/feed/admin
4. Test all flows end-to-end
5. Deploy backend (to Render, Railway, or similar)
6. Update environment variables
7. Add error boundaries and loading states
8. Performance optimization
9. Security audit
10. User testing

---

**Document Generated:** April 10, 2026  
**Version:** 1.0 (Complete Frontend Deep Dive)  
**Total Lines:** 2000+  
**Files Analyzed:** 73 .tsx + 8 .ts = 81 files  

