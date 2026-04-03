import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

export default App
