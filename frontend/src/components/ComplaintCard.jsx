import { MapPin, Calendar, Building2, Info } from 'lucide-react'

function ComplaintCard({ complaint, onViewDetails }) {
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Get severity badge color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-500 text-white'
      case 'In Progress': return 'bg-yellow-500 text-white'
      case 'Resolved': return 'bg-green-500 text-white'
      case 'Rejected': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Image with Status Badge */}
      <div className="relative aspect-video bg-gray-100">
        <img
          src={complaint.image_url}
          alt={complaint.issue_type}
          className="w-full h-full object-cover"
        />
        {/* Status Badge - Top Right */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
          {complaint.status}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Issue Type and Severity */}
        <div className="mb-3">
          <h3 className="text-lg font-heading font-bold text-dark mb-2">
            {complaint.issue_type}
          </h3>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(complaint.severity)}`}>
            {complaint.severity} Severity
          </span>
        </div>

        {/* Location */}
        <div className="flex items-start text-sm text-gray-600 mb-2">
          <MapPin size={16} className="mr-2 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{complaint.location}</span>
        </div>

        {/* Department */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Building2 size={16} className="mr-2 flex-shrink-0" />
          <span className="line-clamp-1">{complaint.department}</span>
        </div>

        {/* Date */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Calendar size={16} className="mr-2 flex-shrink-0" />
          <span>{formatDate(complaint.created_at)}</span>
        </div>

        {/* View Details Button */}
        <button
          onClick={() => onViewDetails(complaint)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
        >
          <Info size={16} />
          <span>View Details</span>
        </button>
      </div>
    </div>
  )
}

export default ComplaintCard
