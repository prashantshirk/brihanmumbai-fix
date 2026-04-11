import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// JWT_SECRET must be in frontend/.env.local and Vercel env vars
// It is the SAME secret as Flask's JWT_SECRET
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || ''
)

async function verifyJWT(token: string): Promise<{ user_id: string; role: string } | null> {
  if (!token || token.length > 2048) return null
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    })
    if (!payload.user_id || !payload.role) return null
    return {
      user_id: payload.user_id as string,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}

function sanitizeRedirectPath(rawRedirect: string | null): string {
  if (rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) {
    return rawRedirect
  }
  return '/dashboard'
}

function createUserLoginRedirect(request: NextRequest): URL {
  const loginUrl = new URL('/login', request.url)
  const originalPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
  loginUrl.searchParams.set('redirect', originalPath)
  return loginUrl
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Admin routes ─────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminToken = request.cookies.get('bmf_admin_token')?.value
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    const payload = await verifyJWT(adminToken)
    if (!payload || payload.role !== 'admin') {
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('bmf_admin_token')
      return response
    }
    return NextResponse.next()
  }

  // ── User protected routes ─────────────────────────────────────────
  const protectedPaths = ['/report', '/dashboard', '/feed', '/track']
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )

  if (isProtected) {
    const userToken = request.cookies.get('bmf_token')?.value
    if (!userToken) {
      return NextResponse.redirect(createUserLoginRedirect(request))
    }
    const payload = await verifyJWT(userToken)
    if (!payload || payload.role !== 'user') {
      const response = NextResponse.redirect(createUserLoginRedirect(request))
      response.cookies.delete('bmf_token')
      return response
    }
    return NextResponse.next()
  }

  // ── Redirect logged-in users away from auth pages ─────────────────
  const authOnlyPaths = ['/login', '/register']
  if (authOnlyPaths.includes(pathname)) {
    const redirectTarget = sanitizeRedirectPath(
      request.nextUrl.searchParams.get('redirect')
    )
    const userToken = request.cookies.get('bmf_token')?.value
    if (userToken) {
      const payload = await verifyJWT(userToken)
      if (payload?.role === 'user') {
        return NextResponse.redirect(new URL(redirectTarget, request.url))
      }
    }
    const adminToken = request.cookies.get('bmf_admin_token')?.value
    if (adminToken) {
      const payload = await verifyJWT(adminToken)
      if (payload?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
  }

  // ── Redirect logged-in admins away from admin login ───────────────
  if (pathname === '/admin/login') {
    const adminToken = request.cookies.get('bmf_admin_token')?.value
    if (adminToken) {
      const payload = await verifyJWT(adminToken)
      if (payload?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      const response = NextResponse.next()
      response.cookies.delete('bmf_admin_token')
      return response
    }
  }

  // ── Root / redirect for logged-in users ──────────────────────────
  if (pathname === '/') {
    const userToken = request.cookies.get('bmf_token')?.value
    if (userToken) {
      const payload = await verifyJWT(userToken)
      if (payload?.role === 'user') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/report/:path*',
    '/dashboard/:path*',
    '/feed/:path*',
    '/track/:path*',
    '/admin/:path*',
  ],
}
