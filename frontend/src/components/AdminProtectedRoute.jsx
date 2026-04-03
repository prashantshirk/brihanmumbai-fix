import { Navigate } from 'react-router-dom'

/**
 * AdminProtectedRoute - Route guard for admin-only pages
 * Checks for valid admin token and role in localStorage
 */
function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem('bmf_admin_token')
  const adminData = localStorage.getItem('bmf_admin')
  
  // Check if token exists
  if (!token) {
    return <Navigate to="/admin/login" replace />
  }
  
  // Check if admin data exists and has admin role
  if (adminData) {
    try {
      const admin = JSON.parse(adminData)
      if (admin.role !== 'admin' && !admin.id) {
        // Invalid admin data
        localStorage.removeItem('bmf_admin_token')
        localStorage.removeItem('bmf_admin')
        return <Navigate to="/admin/login" replace />
      }
    } catch (e) {
      // Invalid JSON
      localStorage.removeItem('bmf_admin_token')
      localStorage.removeItem('bmf_admin')
      return <Navigate to="/admin/login" replace />
    }
  } else {
    return <Navigate to="/admin/login" replace />
  }
  
  return children
}

export default AdminProtectedRoute
