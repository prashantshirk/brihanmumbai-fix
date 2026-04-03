import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, Home, FileText } from 'lucide-react'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Read user from localStorage
  const userString = localStorage.getItem('bmf_user')
  const user = userString ? JSON.parse(userString) : null

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('bmf_token')
    localStorage.removeItem('bmf_user')
    
    // Close mobile menu if open
    setMobileMenuOpen(false)
    
    // Navigate to login
    navigate('/login')
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const isActive = (path) => location.pathname === path

  // Don't show navbar on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null
  }

  // Don't show navbar if not logged in
  if (!user) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white font-heading font-bold text-sm">BMF</span>
            </div>
            <span className="font-heading font-bold text-xl text-dark hidden sm:block">
              BrihanMumbai Fix
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Submit Complaint Link */}
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors relative ${
                isActive('/')
                  ? 'text-primary'
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              <Home size={18} />
              <span>Submit Complaint</span>
              {isActive('/') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
              )}
            </Link>

            {/* Dashboard Link */}
            <Link
              to="/dashboard"
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors relative ${
                isActive('/dashboard')
                  ? 'text-primary'
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              <FileText size={18} />
              <span>Dashboard</span>
              {isActive('/dashboard') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
              )}
            </Link>

            {/* User Info and Logout */}
            <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
              <span className="text-sm text-gray-700">
                Hi, <span className="font-semibold">{user.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {/* User Info */}
            <div className="pb-3 border-b border-gray-200">
              <p className="text-sm text-gray-600">Logged in as</p>
              <p className="text-base font-semibold text-dark">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>

            {/* Submit Complaint Link */}
            <Link
              to="/"
              onClick={closeMobileMenu}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive('/')
                  ? 'bg-red-50 text-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Home size={20} />
              <span>Submit Complaint</span>
            </Link>

            {/* Dashboard Link */}
            <Link
              to="/dashboard"
              onClick={closeMobileMenu}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive('/dashboard')
                  ? 'bg-red-50 text-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText size={20} />
              <span>Dashboard</span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-white bg-primary rounded-lg hover:bg-red-600 transition-colors mt-2"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
