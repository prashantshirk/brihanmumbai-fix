import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { adminAPI } from '../../api'
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'

function AdminLogin() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await adminAPI.login(formData.email, formData.password)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Admin Portal Card */}
        <div className="bg-[#1E293B] rounded-2xl border border-slate-700 shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-red-600/10 p-4 rounded-full border border-red-600/20">
                <Shield className="w-12 h-12 text-red-600" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white uppercase tracking-[0.3em] mb-2">
              Admin Portal
            </h1>
            <p className="text-slate-400 text-sm">
              BrihanMumbai Fix — Internal Dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-600/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition"
                placeholder="admin@brihanmumbai.gov.in"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>

          {/* Warning Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              Authorized personnel only.<br />
              Unauthorized access is prohibited.
            </p>
          </div>
        </div>

        {/* User Login Link */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-slate-400 hover:text-white transition inline-flex items-center gap-1"
          >
            <span>←</span>
            <span>User Login</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
