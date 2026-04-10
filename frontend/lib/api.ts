/**
 * API Client for BrihanMumbai Fix Frontend
 * Replaces old src/api.js with TypeScript + Next.js compatibility
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

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
  latitude?: number
  longitude?: number
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

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

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
  const token = getToken(admin)
  const headers: HeadersInit = {
    ...options.headers,
  }

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json'
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(admin ? 'bmf_admin_token' : 'bmf_token')
      localStorage.removeItem(admin ? 'bmf_admin' : 'bmf_user')
      window.location.href = admin ? '/admin/login' : '/login'
    }
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }

  return res.json() as Promise<T>
}

// ─────────────────────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Complaint API
// ─────────────────────────────────────────────────────────────

export const complaintAPI = {
  analyzeImage: (formData: FormData) =>
    apiFetch<AnalysisResult>('/api/analyze-image', {
      method: 'POST',
      body: formData, // FormData — no Content-Type header (fetch sets boundary)
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

// ─────────────────────────────────────────────────────────────
// Feed API
// ─────────────────────────────────────────────────────────────

export const feedAPI = {
  getPosts: (page = 1, limit = 12) =>
    apiFetch<{ posts: FeedPost[]; total: number; has_more: boolean }>(
      `/api/feed?page=${page}&limit=${limit}`
    ),
}

// ─────────────────────────────────────────────────────────────
// Ward API
// ─────────────────────────────────────────────────────────────

export const wardAPI = {
  getInfo: (ward: string) =>
    apiFetch<{ email: string; phone: string; office: string }>(
      `/api/ward-info?ward=${encodeURIComponent(ward)}`
    ),
}

// ─────────────────────────────────────────────────────────────
// Admin API
// ─────────────────────────────────────────────────────────────

export const adminAPI = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; admin: User }>(
      '/api/admin/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      true
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
