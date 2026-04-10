import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const userToken = request.cookies.get('bmf_token')?.value
  const adminToken = request.cookies.get('bmf_admin_token')?.value

  // Admin routes — require admin token
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // User protected routes — require user token
  const protectedRoutes = ['/dashboard', '/feed', '/report', '/track']
  if (protectedRoutes.includes(pathname)) {
    if (!userToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard', '/feed', '/report', '/track', '/admin', '/admin/:path*'],
}
