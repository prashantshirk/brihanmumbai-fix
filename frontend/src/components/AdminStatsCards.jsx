import { Clipboard, Inbox, Clock, CheckCircle } from 'lucide-react'

function AdminStatsCards({ stats }) {
  if (!stats) return null

  // Calculate max count for issue types to determine bar widths
  const issueTypeCounts = Object.values(stats.by_issue_type || {})
  const maxIssueCount = Math.max(...issueTypeCounts, 1)

  const statCards = [
    {
      title: 'Total Complaints',
      value: stats.total,
      icon: Clipboard,
      color: 'blue',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-t-blue-500',
      iconColor: 'text-blue-500'
    },
    {
      title: 'Submitted',
      value: stats.submitted,
      icon: Inbox,
      color: 'gray',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-t-slate-500',
      iconColor: 'text-slate-500'
    },
    {
      title: 'In Progress',
      value: stats.in_progress,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-t-yellow-500',
      iconColor: 'text-yellow-500'
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-t-green-500',
      iconColor: 'text-green-500'
    }
  ]

  const getIssueTypeBarColor = (index) => {
    const colors = [
      'bg-red-500',
      'bg-orange-500', 
      'bg-yellow-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500'
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="space-y-8">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className={`bg-slate-800 border border-slate-700 rounded-xl p-6 ${card.borderColor} border-t-2 ${card.bgColor}`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-slate-400 text-sm font-medium">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {card.value?.toLocaleString() || 0}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Issue Types Breakdown */}
      {stats.by_issue_type && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Issues by Type</h3>
          <div className="space-y-4">
            {Object.entries(stats.by_issue_type).map(([issueType, count], index) => {
              const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : '0.0'
              const barWidth = maxIssueCount > 0 ? (count / maxIssueCount) * 100 : 0
              
              return (
                <div key={issueType} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">
                      {issueType}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-semibold">
                        {count.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 min-w-[3rem] text-right">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getIssueTypeBarColor(index)}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Show message if no data */}
          {Object.keys(stats.by_issue_type).length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No complaint data available</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminStatsCards