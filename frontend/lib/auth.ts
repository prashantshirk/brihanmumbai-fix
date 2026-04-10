/**
 * Auth helpers — SaaS-grade token handling.
 * 
 * SECURITY MODEL:
 * - Flask sets httpOnly cookies (bmf_token, bmf_admin_token) on login
 * - JavaScript CANNOT read httpOnly cookies — this is intentional
 * - We store only non-sensitive user info (name, email) in sessionStorage
 * - Token is NEVER stored in JS-accessible storage
 * - Next.js middleware reads the httpOnly cookie server-side for route protection
 * - All API calls use credentials:'include' so cookies are sent automatically
 */

export interface StoredUser {
  id: string
  name: string
  email: string
}

// ── Session keys (user info only, NOT tokens) ──────────────────────────────
const USER_INFO_KEY = 'bmf_user_info'
const ADMIN_INFO_KEY = 'bmf_admin_info'

// ── Save user info after login ─────────────────────────────────────────────
// Called after successful login. Flask already set the httpOnly cookie.
// We only store non-sensitive info in sessionStorage for UI purposes.
export function saveUserSession(user: StoredUser): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(user))
}

export function saveAdminSession(admin: StoredUser): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(admin))
}

// ── Get stored user info ───────────────────────────────────────────────────
export function getUser(): StoredUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(USER_INFO_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getAdmin(): StoredUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(ADMIN_INFO_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// ── Check if user appears logged in (client-side hint only) ───────────────
// This is NOT a security check — it's only used for UI rendering decisions.
// Real security enforcement is done by the middleware (server-side).
// If sessionStorage is empty (e.g. new tab), the middleware will catch it.
export function hasUserSession(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(USER_INFO_KEY) !== null
}

export function hasAdminSession(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(ADMIN_INFO_KEY) !== null
}

// ── Logout ─────────────────────────────────────────────────────────────────
// ALWAYS call the backend logout endpoint — it clears the httpOnly cookie.
// Then clear our sessionStorage user info.
export async function logout(): Promise<void> {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(USER_INFO_KEY)
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
      { method: 'POST', credentials: 'include' }
    )
  } catch {
    // Cookie will expire naturally even if this fails
  }
  window.location.href = '/'
}

export async function logoutAdmin(): Promise<void> {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(ADMIN_INFO_KEY)
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/logout`,
      { method: 'POST', credentials: 'include' }
    )
  } catch {}
  window.location.href = '/admin/login'
}
