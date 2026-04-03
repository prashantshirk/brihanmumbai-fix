import { useState } from 'react'
import { FileText, Loader2, Eye } from 'lucide-react'

function AdminComplaintsTable({ 
  complaints = [], 
  onStatusChange, 
  isUpdating = new Set(), 
  onViewDetail 
}) {
  const [flashingRows, setFlashingRows] = useState(new Set())

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await onStatusChange(complaintId, newStatus)
      
      // Flash green on successful update
      setFlashingRows(prev => new Set([...prev, complaintId]))
      setTimeout(() => {
        setFlashingRows(prev => {
          const newSet = new Set(prev)
          newSet.delete(complaintId)
          return newSet
        })
      }, 1000)
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted': return 'text-blue-400 bg-blue-500/10'
      case 'In Progress': return 'text-yellow-400 bg-yellow-500/10'
      case 'Resolved': return 'text-green-400 bg-green-500/10'
      case 'Rejected': return 'text-red-400 bg-red-500/10'
      default: return 'text-slate-400 bg-slate-500/10'
    }
  }

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-600 text-white'
      case 'High': return 'bg-orange-600 text-white'
      case 'Medium': return 'bg-yellow-600 text-white'
      case 'Low': return 'bg-green-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const truncateText = (text, maxLines = 2) => {
    if (!text) return ''
    const words = text.split(' ')
    const maxWords = maxLines * 8 // Approximate 8 words per line
    if (words.length <= maxWords) return text
    return words.slice(0, maxWords).join(' ') + '...'
  }

  // Empty state
  if (complaints.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-16 text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-6" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No complaints found</h3>
          <p className="text-slate-500 text-sm">Try adjusting the filters to see more results</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-12">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-16">
                Photo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Issue
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Citizen
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Reported
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {complaints.map((complaint, index) => (
              <tr 
                key={complaint.id} 
                className={`
                  transition-all duration-300
                  ${index % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}
                  ${flashingRows.has(complaint.id) ? 'bg-green-500/20' : ''}
                  hover:bg-slate-800/50
                `}
              >
                {/* Row Number */}
                <td className="px-4 py-4 text-sm text-slate-400 font-mono">
                  {index + 1}
                </td>

                {/* Photo Thumbnail */}
                <td className="px-4 py-4">
                  {complaint.image_url ? (
                    <img
                      src={complaint.image_url}
                      alt="Issue"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-500" />
                    </div>
                  )}
                </td>

                {/* Issue Type + Severity */}
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{complaint.issue_type}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge(complaint.severity)}`}>
                      {complaint.severity}
                    </span>
                  </div>
                </td>

                {/* User Info */}
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{complaint.user_name}</p>
                    <p className="text-xs text-slate-400">{complaint.user_email}</p>
                  </div>
                </td>

                {/* Location */}
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-300">{complaint.ward_number}</p>
                    <p className="text-xs text-slate-400 leading-tight">
                      {truncateText(complaint.location, 2)}
                    </p>
                  </div>
                </td>

                {/* Date */}
                <td className="px-4 py-4 text-sm text-slate-400">
                  {formatDate(complaint.created_at)}
                </td>

                {/* Status Dropdown */}
                <td className="px-4 py-4">
                  {isUpdating.has(complaint.id) ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg border border-slate-600">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      <span className="text-xs text-slate-400">Updating...</span>
                    </div>
                  ) : (
                    <select
                      value={complaint.status}
                      onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                      className={`
                        px-3 py-1 rounded-lg border border-slate-600 text-xs font-medium
                        focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                        transition-all duration-200
                        ${getStatusColor(complaint.status)}
                      `}
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  <button
                    onClick={() => onViewDetail(complaint.id)}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4 p-4">
        {complaints.map((complaint, index) => (
          <div 
            key={complaint.id} 
            className={`
              bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4 transition-all duration-300
              ${flashingRows.has(complaint.id) ? 'border-green-500/50 bg-green-500/5' : ''}
            `}
          >
            {/* Header Row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-mono">#{index + 1}</span>
                {complaint.image_url ? (
                  <img
                    src={complaint.image_url}
                    alt="Issue"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-600"
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white text-sm">{complaint.issue_type}</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge(complaint.severity)}`}>
                    {complaint.severity}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onViewDetail(complaint.id)}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </button>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 gap-3 text-sm">
              {/* User */}
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Citizen</p>
                <p className="text-white font-medium">{complaint.user_name}</p>
                <p className="text-slate-400 text-xs">{complaint.user_email}</p>
              </div>

              {/* Location */}
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Location</p>
                <p className="text-slate-300 font-medium">{complaint.ward_number}</p>
                <p className="text-slate-400 text-xs">{truncateText(complaint.location, 2)}</p>
              </div>

              {/* Date & Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Reported</p>
                  <p className="text-slate-300 text-xs">{formatDate(complaint.created_at)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Status</p>
                  {isUpdating.has(complaint.id) ? (
                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-700 rounded border border-slate-600">
                      <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                      <span className="text-xs text-slate-400">Updating</span>
                    </div>
                  ) : (
                    <select
                      value={complaint.status}
                      onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                      className={`
                        px-2 py-1 rounded border border-slate-600 text-xs font-medium
                        focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                        ${getStatusColor(complaint.status)}
                      `}
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminComplaintsTable