import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../api'
import AdminStatsCards from '../../components/AdminStatsCards'
import AdminFilterBar from '../../components/AdminFilterBar'
import AdminComplaintsTable from '../../components/AdminComplaintsTable'
import { 
  Shield, 
  LogOut, 
  RefreshCw, 
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

function AdminDashboard() {
  const navigate = useNavigate()
  
  // State
  const [complaints, setComplaints] = useState([])
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    issue_type: '',
    ward: '',
    search: '',
    page: 1,
    limit: 20
  })
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(new Set())
  const [error, setError] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  // Get admin info on mount
  useEffect(() => {
    const adminData = localStorage.getItem('bmf_admin')
    if (adminData) {
      try {
        setAdmin(JSON.parse(adminData))
      } catch (e) {
        console.error('Failed to parse admin data:', e)
      }
    }
  }, [])

  // Load data on mount and when filters change
  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [statsData, complaintsData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getComplaints(filters)
      ])
      
      setStats(statsData)
      setComplaints(complaintsData.complaints || [])
      setTotalPages(complaintsData.pages || 1)
      setTotalCount(complaintsData.total || 0)
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err.response?.data?.error || 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadData()
  }

  const handleLogout = () => {
    localStorage.removeItem('bmf_admin_token')
    localStorage.removeItem('bmf_admin')
    navigate('/admin/login')
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleStatusChange = async (complaintId, newStatus) => {
    // Add to updating set
    setIsUpdating(prev => new Set([...prev, complaintId]))
    
    try {
      await adminAPI.updateStatus(complaintId, newStatus)
      
      // Update local state
      setComplaints(prev => prev.map(complaint => 
        complaint.id === complaintId 
          ? { ...complaint, status: newStatus, updated_at: new Date().toISOString() }
          : complaint
      ))
      
      // Re-fetch stats (counts changed)
      const updatedStats = await adminAPI.getStats()
      setStats(updatedStats)
      
    } catch (err) {
      console.error('Failed to update status:', err)
      // Show error message (you could use a toast library here)
      alert(err.response?.data?.error || 'Failed to update complaint status')
    } finally {
      // Remove from updating set
      setIsUpdating(prev => {
        const newSet = new Set(prev)
        newSet.delete(complaintId)
        return newSet
      })
    }
  }

  const handleViewDetail = (complaintId) => {
    navigate(`/admin/complaints/${complaintId}`)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }))
    }
  }

  const getPageRange = () => {
    const start = (filters.page - 1) * filters.limit + 1
    const end = Math.min(filters.page * filters.limit, totalCount)
    return { start, end }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleLogout = async () => {
    try {
      // Call API to clear admin cookie
      await adminAPI.logout()
      
      // Clear admin UI state
      localStorage.removeItem('bmf_admin')
      
      // Navigate to admin login
      navigate('/admin/login')
    } catch (error) {
      console.error('Admin logout failed:', error)
      // Force logout anyway by clearing local state and redirecting
      localStorage.removeItem('bmf_admin')
      navigate('/admin/login')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Admin Navbar */}
      <nav className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-red-600/10 p-2 rounded-lg border border-red-600/20">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">BrihanMumbai Fix</h1>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Admin Portal</p>
              </div>
            </div>

            {/* Admin Info + Logout */}
            <div className="flex items-center gap-4">
              {admin && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{admin.name}</p>
                  <p className="text-xs text-slate-400">{admin.email}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Complaints Dashboard</h1>
            <p className="text-slate-400 text-sm">
              Last refreshed at {formatTime(lastRefreshed)}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Error loading data</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <AdminStatsCards stats={stats} />

        {/* Filter Bar */}
        <AdminFilterBar
          filters={filters}
          onChange={handleFiltersChange}
          totalCount={totalCount}
          isLoading={isLoading}
        />

        {/* Complaints Table */}
        <AdminComplaintsTable
          complaints={complaints}
          onStatusChange={handleStatusChange}
          isUpdating={isUpdating}
          onViewDetail={handleViewDetail}
        />

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Results Info */}
              <div className="text-sm text-slate-400">
                {totalCount > 0 ? (
                  <>
                    Showing <span className="font-semibold text-white">{getPageRange().start}</span>
                    {' '}-{' '}
                    <span className="font-semibold text-white">{getPageRange().end}</span>
                    {' '}of{' '}
                    <span className="font-semibold text-white">{totalCount.toLocaleString()}</span>
                    {' '}complaint{totalCount !== 1 ? 's' : ''}
                  </>
                ) : (
                  'No complaints found'
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1 || isLoading}
                    className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:block">Previous</span>
                  </button>
                  
                  <span className="px-4 py-2 text-sm text-slate-300">
                    Page {filters.page} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page >= totalPages || isLoading}
                    className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:block">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
