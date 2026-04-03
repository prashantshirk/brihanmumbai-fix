import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
  // Since we can't access HTTP-only cookies in JS, we check for user data
  // The server will verify the actual auth cookie
  const user = localStorage.getItem('bmf_user')
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

export default ProtectedRoute
