'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getUser, isLoggedIn, logout } from '@/lib/auth'
import { LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    // Only run on client
    const checkAuth = () => {
      setLoggedIn(isLoggedIn())
      const userData = getUser()
      setUser(userData)
    }

    checkAuth()
  }, [])

  const isActive = (href: string) => pathname === href

  const handleLogout = () => {
    logout()
    setLoggedIn(false)
    setUser(null)
    router.push('/login')
  }

  // Don't render navbar on auth pages
  if (pathname?.includes('/admin')) {
    return null
  }

  // Don't render navbar if not logged in
  if (!loggedIn) {
    return null
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:bg-red-600 transition-colors">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="font-heading font-bold text-dark hidden sm:inline">
              BrihanMumbai Fix
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`font-medium transition-colors ${
                isActive('/') ? 'text-primary border-b-2 border-primary' : 'text-gray-700 hover:text-primary'
              }`}
            >
              Submit Complaint
            </Link>
            <Link
              href="/feed"
              className={`font-medium transition-colors ${
                isActive('/feed') ? 'text-primary border-b-2 border-primary' : 'text-gray-700 hover:text-primary'
              }`}
            >
              Community Feed
            </Link>
            <Link
              href="/dashboard"
              className={`font-medium transition-colors ${
                isActive('/dashboard') ? 'text-primary border-b-2 border-primary' : 'text-gray-700 hover:text-primary'
              }`}
            >
              Dashboard
            </Link>
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <p className="font-medium text-sm text-dark">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary hover:text-red-600"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 hover:text-primary transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-3 border-t border-gray-200 pt-4">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Submit Complaint
            </Link>
            <Link
              href="/feed"
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/feed') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Community Feed
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </Link>

            {user && (
              <div className="px-4 py-3 border-t border-gray-200 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-dark">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleLogout()
                    setIsOpen(false)
                  }}
                  className="w-full text-primary"
                >
                  <LogOut size={18} className="mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
