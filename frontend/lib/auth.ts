/**
 * Authentication Helpers for BrihanMumbai Fix
 * Only call from 'use client' components
 */

export interface StoredUser {
  id: string
  name: string
  email: string
}

/**
 * Save user session (token + user data)
 * Also sets cookie for middleware auth
 */
export function saveUserSession(token: string, user: StoredUser) {
  localStorage.setItem('bmf_token', token)
  localStorage.setItem('bmf_user', JSON.stringify(user))
  // Set cookie for middleware (7 days)
  document.cookie = `bmf_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
}

/**
 * Save admin session (token + admin data)
 * Also sets cookie for middleware auth
 */
export function saveAdminSession(token: string, admin: StoredUser) {
  localStorage.setItem('bmf_admin_token', token)
  localStorage.setItem('bmf_admin', JSON.stringify(admin))
  // Set cookie for middleware (7 days)
  document.cookie = `bmf_admin_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
}

/**
 * Get logged-in user from localStorage
 */
export function getUser(): StoredUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('bmf_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Get logged-in admin from localStorage
 */
export function getAdmin(): StoredUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('bmf_admin')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('bmf_token')
}

/**
 * Check if admin is logged in
 */
export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('bmf_admin_token')
}

/**
 * Logout user
 * Clears localStorage and cookie
 */
export function logout() {
  localStorage.removeItem('bmf_token')
  localStorage.removeItem('bmf_user')
  // Clear cookie
  document.cookie = 'bmf_token=; path=/; max-age=0'
}

/**
 * Logout admin
 * Clears localStorage and cookie
 */
export function logoutAdmin() {
  localStorage.removeItem('bmf_admin_token')
  localStorage.removeItem('bmf_admin')
  // Clear cookie
  document.cookie = 'bmf_admin_token=; path=/; max-age=0'
}
