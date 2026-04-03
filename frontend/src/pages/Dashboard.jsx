import { useState, useEffect } from 'react'
import { complaintAPI } from '../api'
import ComplaintCard from '../components/ComplaintCard'
import { 
  FileText, AlertCircle, TrendingUp, CheckCircle2, 
  Clock, ChevronLeft, ChevronRight, X, Copy, Check,
  Inbox
} from 'lucide-react'

function Dashboard() {
  const [complaints, setComplaints] = useState([])
  const [filteredComplaints, setFilteredComplaints] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalComplaints, setTotalComplaints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState('All')
  
  // Modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [copied, setCopied] = useState(false)
  
  const limit = 10

  // Fetch complaints on mount and page change
  useEffect(() => {
    fetchComplaints()
  }, [currentPage])

  // Apply filter when complaints or active filter changes
  useEffect(() => {
    applyFilter()
  }, [complaints, activeFilter])

  const fetchComplaints = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await complaintAPI.list(currentPage, limit)
      setComplaints(response.complaints)
      setTotalComplaints(response.total)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch complaints')
    } finally {
      setLoading(false)
    }
  }

  const applyFilter = () => {
    if (activeFilter === 'All') {
      setFilteredComplaints(complaints)
    } else {
      setFilteredComplaints(complaints.filter(c => c.status === activeFilter))
    }
  }

  // Calculate stats
  const stats = {
    total: complaints.length,
    submitted: complaints.filter(c => c.status === 'Submitted').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length
  }

  // Handle view details
  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint)
  }

  const closeModal = () => {
    setSelectedComplaint(null)
    setCopied(false)
  }

  const handleCopyComplaint = () => {
    if (selectedComplaint?.complaint_text) {
      navigator.clipboard.writeText(selectedComplaint.complaint_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Pagination
  const totalPages = Math.ceil(totalComplaints / limit)
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  return (
    <div className="min-h-screen bg-secondary py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-heading font-bold text-dark">My Complaints</h1>
            <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-semibold">
              {totalComplaints}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Submitted */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Submitted</p>
                <p className="text-3xl font-heading font-bold text-dark">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-heading font-bold text-dark">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          {/* Resolved */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Resolved</p>
                <p className="text-3xl font-heading font-bold text-dark">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {['All', 'Submitted', 'In Progress', 'Resolved'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                activeFilter === filter
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-primary text-primary px-4 py-3 rounded flex items-start">
            <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading complaints...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredComplaints.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <Inbox className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-heading font-bold text-dark mb-2">
              No complaints yet
            </h3>
            <p className="text-gray-600 mb-6">
              {activeFilter === 'All' 
                ? "You haven't submitted any complaints yet. Report an issue to get started!"
                : `No complaints with status "${activeFilter}"`
              }
            </p>
            {activeFilter === 'All' && (
              <a
                href="/"
                className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Submit Your First Complaint
              </a>
            )}
          </div>
        )}

        {/* Complaints Grid */}
        {!loading && filteredComplaints.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {filteredComplaints.map((complaint) => (
                <ComplaintCard
                  key={complaint._id}
                  complaint={complaint}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!canGoPrevious}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                  <span>Previous</span>
                </button>
                
                <span className="text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!canGoNext}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal - Complaint Details */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold text-dark">Complaint Details</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Image */}
              <div className="rounded-xl overflow-hidden">
                <img
                  src={selectedComplaint.image_url}
                  alt={selectedComplaint.issue_type}
                  className="w-full"
                />
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Issue Type</p>
                  <p className="font-semibold text-dark">{selectedComplaint.issue_type}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Severity</p>
                  <p className="font-semibold text-dark">{selectedComplaint.severity}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Status</p>
                  <p className="font-semibold text-dark">{selectedComplaint.status}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Department</p>
                  <p className="font-semibold text-dark">{selectedComplaint.department}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                  <p className="text-xs text-gray-600 mb-1">Location</p>
                  <p className="font-semibold text-dark">{selectedComplaint.location}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Ward</p>
                  <p className="font-semibold text-dark">{selectedComplaint.ward_number}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Submitted</p>
                  <p className="font-semibold text-dark">
                    {new Date(selectedComplaint.created_at).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-2">Description</p>
                <p className="text-sm text-gray-700">{selectedComplaint.description}</p>
              </div>

              {/* Complaint Letter */}
              {selectedComplaint.complaint_text && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-dark">Formal Complaint Letter</h3>
                    <button
                      onClick={handleCopyComplaint}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                    >
                      {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                      {selectedComplaint.complaint_text}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
