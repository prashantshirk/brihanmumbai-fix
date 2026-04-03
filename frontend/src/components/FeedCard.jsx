import { 
  MapPin, 
  Navigation, 
  Construction, 
  Trash2, 
  Droplets, 
  Lightbulb, 
  AlertTriangle, 
  Waves, 
  Building2, 
  CircleDot 
} from 'lucide-react'

function FeedCard({ post }) {
  // Get issue type icon
  const getIssueIcon = (issueType) => {
    const iconMap = {
      'Pothole': Construction,
      'Garbage/Waste': Trash2,
      'Water Leakage': Droplets,
      'Broken Streetlight': Lightbulb,
      'Damaged Footpath': AlertTriangle,
      'Open Drain': Waves,
      'Illegal Construction': Building2,
      'Other': CircleDot
    }
    return iconMap[issueType] || CircleDot
  }

  // Get severity badge styling
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'Low': return 'bg-green-600/90 text-white'
      case 'Medium': return 'bg-yellow-600/90 text-white'
      case 'High': return 'bg-orange-600/90 text-white'
      case 'Critical': return 'bg-red-600/90 text-white'
      default: return 'bg-gray-600/90 text-white'
    }
  }

  // Get status badge styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Submitted': return 'bg-transparent border border-slate-400 text-slate-600 dark:text-slate-400'
      case 'In Progress': return 'bg-yellow-500 text-white border-0'
      case 'Resolved': return 'bg-green-500 text-white border-0'
      case 'Rejected': return 'bg-red-500 text-white border-0'
      default: return 'bg-gray-500 text-white border-0'
    }
  }

  // Generate avatar color based on first character
  const getAvatarColor = (name) => {
    if (!name) return 'bg-slate-500'
    const char = name.charAt(0).toUpperCase()
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'
    ]
    return colors[char.charCodeAt(0) % colors.length]
  }

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Handle map click
  const openInMaps = () => {
    if (post.latitude && post.longitude) {
      window.open(`https://www.google.com/maps?q=${post.latitude},${post.longitude}`, '_blank')
    }
  }

  // Check if coordinates exist
  const hasCoordinates = post.latitude && post.longitude

  // Get issue icon component
  const IssueIcon = getIssueIcon(post.issue_type)

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      
      {/* Image Section */}
      <div className="relative aspect-video w-full">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={`${post.issue_type} reported by ${post.citizen_name}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <IssueIcon className="w-12 h-12 text-slate-400" />
          </div>
        )}
        
        {/* Severity Badge Overlay */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityStyle(post.severity)}`}>
            {post.severity}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        
        {/* Row 1 - Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IssueIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="font-semibold text-slate-900 dark:text-white text-sm">
              {post.issue_type}
            </span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(post.status)}`}>
            {post.status}
          </span>
        </div>

        {/* Row 2 - Citizen */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(post.citizen_name)}`}>
              {getInitials(post.citizen_name)}
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {post.citizen_name || 'Anonymous'}
            </span>
          </div>
          <hr className="border-slate-200 dark:border-slate-700" />
        </div>

        {/* Row 3 - Location */}
        <div className="flex items-start justify-between gap-2">
          {/* Left - Location Text */}
          <div className="flex items-start gap-1.5 flex-1 min-w-0">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {post.location}
              </p>
              {post.ward_number && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {post.ward_number}
                </p>
              )}
            </div>
          </div>

          {/* Right - Coordinates Button */}
          <div className="flex-shrink-0">
            {hasCoordinates ? (
              <button
                onClick={openInMaps}
                title="Open in Google Maps"
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500 transition-colors duration-200"
              >
                <Navigation className="w-4 h-4" />
              </button>
            ) : (
              <div className="p-1.5 rounded-full cursor-not-allowed">
                <Navigation className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              </div>
            )}
          </div>
        </div>

        {/* Row 4 - Footer */}
        <div className="flex justify-end pt-1">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {formatDate(post.created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default FeedCard