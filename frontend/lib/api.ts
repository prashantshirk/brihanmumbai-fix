import { saveUserSession, saveAdminSession } from '@/lib/auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ── Types ──────────────────────────────────────────────────────────────────

export interface User { id: string; name: string; email: string; created_at?: string }
export interface AuthResponse { user: User; token?: string }

export interface Complaint {
  _id?: string
  id?: string
  user_id?: string
  image_url: string
  issue_type: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  description: string
  department: string
  location: string
  ward_number: string
  latitude?: number | null
  longitude?: number | null
  complaint_text?: string
  additional_details?: string
  status: 'Submitted' | 'In Progress' | 'Resolved' | 'Rejected'
  created_at?: string
  updated_at?: string
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
  id?: string
  _id?: string
  citizen_name: string
  image_url: string
  issue_type: string
  severity: string
  location: string
  ward_number: string
  latitude?: number | null
  longitude?: number | null
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

// ── Core fetch wrapper ─────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData

  const headers: HeadersInit = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // Always send httpOnly cookies cross-origin
  })

  if (res.status === 401) {
    // Token expired or missing — middleware will redirect on next navigation
    // Clear any stale session info
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bmf_user_info')
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }

  if (res.status === 403) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bmf_admin_info')
      window.location.href = '/admin/login'
    }
    throw new Error('Forbidden')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Request failed with status ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ── Auth API ───────────────────────────────────────────────────────────────

export const authAPI = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const data = await apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    // Flask set httpOnly cookie. Save user info (not token) for UI.
    saveUserSession(data.user)
    return data
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const data = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    saveUserSession(data.user)
    return data
  },

  me: (): Promise<User> =>
    apiFetch<User>('/api/auth/me'),
}

// ── Complaint API ──────────────────────────────────────────────────────────

export const complaintAPI = {
  analyzeImage: (formData: FormData): Promise<AnalysisResult> =>
    apiFetch<AnalysisResult>('/api/analyze-image', {
      method: 'POST',
      body: formData,
    }),

  create: (data: Partial<Complaint>): Promise<Complaint> =>
    apiFetch<Complaint>('/api/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (page = 1, limit = 10): Promise<{
    complaints: Complaint[]
    total: number
    page: number
    limit: number
  }> =>
    apiFetch(`/api/complaints?page=${page}&limit=${limit}`),

  getOne: (id: string): Promise<Complaint> =>
    apiFetch(`/api/complaints/${id}`),

  updateStatus: (id: string, status: string): Promise<Complaint> =>
    apiFetch(`/api/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}

// ── Feed API ───────────────────────────────────────────────────────────────

export const feedAPI = {
  // Public — no auth needed. Uses plain fetch (no credentials).
  preview: async (): Promise<{ posts: FeedPost[]; total: number }> => {
    const res = await fetch(`${BASE_URL}/api/feed/preview`)
    if (!res.ok) return { posts: [], total: 0 }
    return res.json()
  },

  // Protected — sends cookie automatically.
  getPosts: (page = 1, limit = 12): Promise<{
    posts: FeedPost[]
    total: number
    has_more: boolean
  }> =>
    apiFetch(`/api/feed?page=${page}&limit=${limit}`),
}

// ── Admin API ──────────────────────────────────────────────────────────────

export const adminAPI = {
  login: async (email: string, password: string) => {
    const data = await apiFetch<{ admin: User; token?: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    saveAdminSession(data.admin)
    return data
  },

  me: (): Promise<User & { role: string }> =>
    apiFetch('/api/admin/me'),

  getComplaints: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== '' && v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString()
    return apiFetch<{
      complaints: (Complaint & { user_name: string; user_email: string })[]
      total: number
      page: number
      pages: number
    }>(`/api/admin/complaints${qs ? '?' + qs : ''}`)
  },

  getComplaint: (id: string) =>
    apiFetch<Complaint & { user_name: string; user_email: string }>(
      `/api/admin/complaints/${id}`
    ),

  updateStatus: (id: string, status: string) =>
    apiFetch<{ success: boolean; new_status: string }>(
      `/api/admin/complaints/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) }
    ),

  getStats: (): Promise<AdminStats> =>
    apiFetch('/api/admin/stats'),
}

// ── Ward API ───────────────────────────────────────────────────────────────

export const wardAPI = {
  getInfo: (ward: string) =>
    apiFetch<{ email: string; phone: string; office: string }>(
      `/api/ward-info?ward=${encodeURIComponent(ward)}`
    ),
}
