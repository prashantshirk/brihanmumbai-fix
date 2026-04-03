import { Navigate } from 'react-router-dom'

/**
 * AdminProtectedRoute - Route guard for admin-only pages
 * Checks for valid admin data in localStorage (server verifies cookie)
 */
function AdminProtectedRoute({ children }) {
  // Since we can't access HTTP-only cookies in JS, we check for admin data
  // The server will verify the actual auth cookie
  const adminData = localStorage.getItem('bmf_admin')
  
  // Check if admin data exists
  if (adminData) {
    try {
      const admin = JSON.parse(adminData)
      if (!admin.id) {
        // Invalid admin data
        localStorage.removeItem('bmf_admin')
        return <Navigate to="/admin/login" replace />
      }
    } catch (e) {
      // Invalid JSON
      localStorage.removeItem('bmf_admin')
      return <Navigate to="/admin/login" replace />
    }
  } else {
    return <Navigate to="/admin/login" replace />
  }
  
  return children
}

export default AdminProtectedRoute
