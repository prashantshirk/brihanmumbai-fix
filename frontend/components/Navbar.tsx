'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { hasUserSession, getUser, logout } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Menu, X, MapPin, LogOut, LayoutDashboard, FileText, Users } from 'lucide-react'

export default function Navbar() {
  const [mounted, setMounted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    const loggedIn = hasUserSession()
    setIsLoggedIn(loggedIn)
    if (loggedIn) {
      const user = getUser()
      setUserName(user?.name?.split(' ')[0] || '')
    }
  }, [pathname]) // Re-check on every route change

  async function handleLogout() {
    await logout() // Calls backend to clear httpOnly cookie, then redirects to /
  }

  // Don't render until mounted — prevents hydration mismatch
  if (!mounted) return null

  const isLandingPage = !isLoggedIn

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <MapPin className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">BrihanMumbai Fix</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {isLandingPage ? (
              // ── Landing page nav (not logged in) ──────────────────────
              <>
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
                <a href="#community" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Community</a>
                <Link href="/login">
                  <Button size="sm">Login</Button>
                </Link>
              </>
            ) : (
              // ── App nav (logged in) ────────────────────────────────────
              <>
                <Link
                  href="/report"
                  className={`flex items-center gap-1.5 text-sm transition-colors ${pathname === '/report' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <FileText className="h-4 w-4" />
                  Report Issue
                </Link>
                <Link
                  href="/feed"
                  className={`flex items-center gap-1.5 text-sm transition-colors ${pathname === '/feed' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Users className="h-4 w-4" />
                  Community Feed
                </Link>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 text-sm transition-colors ${pathname === '/dashboard' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <div className="flex items-center gap-3 ml-4 border-l border-border pl-4">
                  <span className="text-sm text-muted-foreground">Hi, {userName}</span>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1.5">
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-4 flex flex-col gap-3">
            {isLandingPage ? (
              <>
                <a href="#features" className="text-sm px-2 py-1.5 text-muted-foreground" onClick={() => setMobileOpen(false)}>Features</a>
                <a href="#how-it-works" className="text-sm px-2 py-1.5 text-muted-foreground" onClick={() => setMobileOpen(false)}>How it works</a>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full mt-2">Login</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/report" className="text-sm px-2 py-1.5" onClick={() => setMobileOpen(false)}>Report Issue</Link>
                <Link href="/feed" className="text-sm px-2 py-1.5" onClick={() => setMobileOpen(false)}>Community Feed</Link>
                <Link href="/dashboard" className="text-sm px-2 py-1.5" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <Button variant="outline" className="w-full mt-2" onClick={() => { setMobileOpen(false); handleLogout() }}>
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
