import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminAPI } from '../../api'
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  Mail, 
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Copy,
  Loader2,
  Building2
} from 'lucide-react'

function AdminComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadComplaint()
  }, [id])

  const loadComplaint = async () => {
    setLoading(true)
    setError('')
    
    try {
      const data = await adminAPI.getComplaint(id)
      setComplaint(data)
      setSelectedStatus(data.status)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load complaint')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (selectedStatus === complaint.status) return

    setUpdating(true)
    setUpdateMessage('')
    
    try {
      await adminAPI.updateStatus(id, selectedStatus)
      setComplaint(prev => ({ 
        ...prev, 
        status: selectedStatus, 
        updated_at: new Date().toISOString() 
      }))
      setUpdateMessage('Status updated successfully!')
      setTimeout(() => setUpdateMessage(''), 3000)
    } catch (err) {
      setUpdateMessage(`Error: ${err.response?.data?.error || 'Failed to update status'}`)
      setSelectedStatus(complaint.status) // Reset to original status
      setTimeout(() => setUpdateMessage(''), 5000)
    } finally {
      setUpdating(false)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-600 text-white'
      case 'High': return 'bg-orange-600 text-white'
      case 'Medium': return 'bg-yellow-600 text-white'
      case 'Low': return 'bg-green-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'In Progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Resolved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-slate-400">Loading complaint details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-600/30 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!complaint) return null

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Complaints</span>
        </button>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Column - 60% */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Complaint Image */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {complaint.image_url ? (
                <img
                  src={complaint.image_url}
                  alt="Complaint"
                  className="w-full h-auto max-h-96 object-cover"
                />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500">No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Analysis Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">AI Analysis</h2>
              
              {/* Issue Type & Severity */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-lg">
                  {complaint.issue_type}
                </span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getSeverityColor(complaint.severity)}`}>
                  {complaint.severity} Priority
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">
                  Description
                </h3>
                <p className="text-white leading-relaxed">
                  {complaint.description}
                </p>
              </div>

              {/* Department */}
              <div className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg">
                <Building2 className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">Assigned Department</p>
                  <p className="text-white font-medium">{complaint.department}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 40% */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Citizen Info Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Reported By</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {getInitials(complaint.user_name)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{complaint.user_name}</p>
                    <p className="text-slate-400 text-sm">{complaint.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>Reported on {formatDate(complaint.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Ward & Address</p>
                  <p className="font-medium text-blue-400">{complaint.ward_number}</p>
                  <p className="text-white">{complaint.location}</p>
                </div>
                
                {complaint.latitude && complaint.longitude && (
                  <a
                    href={`https://maps.google.com/?q=${complaint.latitude},${complaint.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>View on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Status Update Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Status Management</h3>
              
              {/* Current Status */}
              <div className="mb-4">
                <p className="text-slate-400 text-sm mb-2">Current Status</p>
                <span className={`inline-block px-4 py-2 rounded-lg border font-medium ${getStatusColor(complaint.status)}`}>
                  {complaint.status}
                </span>
              </div>

              {/* Status Update */}
              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Update to:</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    disabled={updating}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating || selectedStatus === complaint.status}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Update Status</span>
                    </>
                  )}
                </button>

                {/* Update Message */}
                {updateMessage && (
                  <div className={`p-3 rounded-lg text-sm ${
                    updateMessage.includes('Error') 
                      ? 'bg-red-900/20 border border-red-600/30 text-red-400'
                      : 'bg-green-900/20 border border-green-600/30 text-green-400'
                  }`}>
                    {updateMessage}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500">
                Last updated: {formatDate(complaint.updated_at)}
              </div>
            </div>

            {/* Complaint Text Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Generated Complaint Letter</h3>
                <button
                  onClick={() => copyToClipboard(complaint.complaint_text)}
                  className={`flex items-center gap-2 px-3 py-1 text-sm rounded-lg transition ${
                    copied 
                      ? 'bg-green-600 text-white' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              
              <blockquote className="bg-slate-800 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <pre className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {complaint.complaint_text}
                </pre>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminComplaintDetail
