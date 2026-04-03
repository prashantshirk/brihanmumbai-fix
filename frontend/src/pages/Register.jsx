import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../api'

function Register() {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error for this field when user types
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      })
    }
  }

  const validate = () => {
    const newErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const response = await authAPI.register(
        formData.name,
        formData.email,
        formData.password
      )
      
      // Save user to localStorage (UI state only, not auth token)
      localStorage.setItem('bmf_user', JSON.stringify(response.user))
      
      // Navigate to home
      navigate('/')
    } catch (err) {
      setErrors({
        general: err.response?.data?.error || 'Registration failed. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Mumbai Skyline SVG at bottom */}
      <div className="absolute bottom-0 left-0 right-0 opacity-10">
        <svg viewBox="0 0 1440 120" className="w-full h-32">
          <path fill="#E53935" d="M0,60 L48,55 L96,50 L144,58 L192,48 L240,52 L288,45 L336,55 L384,50 L432,45 L480,52 L528,48 L576,55 L624,50 L672,45 L720,52 L768,48 L816,55 L864,50 L912,45 L960,52 L1008,48 L1056,55 L1104,50 L1152,45 L1200,52 L1248,48 L1296,55 L1344,50 L1392,45 L1440,52 L1440,120 L0,120 Z" />
        </svg>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-3">
            <span className="text-white font-heading font-bold text-xl">BMF</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-dark mb-1">BrihanMumbai Fix</h1>
          <p className="text-gray-600 text-sm">Report civic issues, make Mumbai better</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-2xl font-heading font-semibold text-dark mb-6">Create your account</h2>

          {/* General Error Message */}
          {errors.general && (
            <div className="bg-red-50 border-l-4 border-primary text-primary px-4 py-3 rounded">
              <p className="text-sm">{errors.general}</p>
            </div>
          )}

          {/* Full Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:border-primary focus:ring-0 transition-colors bg-transparent outline-none"
              placeholder="John Doe"
            />
            {errors.name && <p className="text-primary text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:border-primary focus:ring-0 transition-colors bg-transparent outline-none"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-primary text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:border-primary focus:ring-0 transition-colors bg-transparent outline-none"
              placeholder="At least 8 characters"
            />
            {errors.password && <p className="text-primary text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:border-primary focus:ring-0 transition-colors bg-transparent outline-none"
              placeholder="Re-enter password"
            />
            {errors.confirmPassword && <p className="text-primary text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-6"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>

          {/* Login Link */}
          <p className="text-center text-gray-600 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Register
