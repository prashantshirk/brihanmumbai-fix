import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'

function AdminFilterBar({ filters, onChange, totalCount, isLoading }) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '')

  // Debounce search input
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onChange({ ...filters, search: searchTerm, page: 1 })
      }
    }, 400)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, filters, onChange])

  // Update local search state when filters prop changes
  useEffect(() => {
    setSearchTerm(filters.search || '')
  }, [filters.search])

  const handleFilterChange = (key, value) => {
    onChange({
      ...filters,
      [key]: value,
      page: 1 // Reset to first page when filtering
    })
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    onChange({
      status: '',
      issue_type: '',
      ward: '',
      search: '',
      page: 1
    })
  }

  const hasActiveFilters = filters.status || filters.issue_type || filters.ward || filters.search

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Rejected', label: 'Rejected' }
  ]

  const issueTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'Pothole', label: 'Pothole' },
    { value: 'Garbage/Waste', label: 'Garbage/Waste' },
    { value: 'Water Leakage', label: 'Water Leakage' },
    { value: 'Broken Streetlight', label: 'Broken Streetlight' },
    { value: 'Damaged Footpath', label: 'Damaged Footpath' },
    { value: 'Open Drain', label: 'Open Drain' },
    { value: 'Illegal Construction', label: 'Illegal Construction' },
    { value: 'Other', label: 'Other' }
  ]

  const wardOptions = [
    { value: '', label: 'All Wards' },
    { value: 'A-Ward', label: 'A-Ward' },
    { value: 'B-Ward', label: 'B-Ward' },
    { value: 'C-Ward', label: 'C-Ward' },
    { value: 'D-Ward', label: 'D-Ward' },
    { value: 'E-Ward', label: 'E-Ward' },
    { value: 'F/N-Ward', label: 'F/N-Ward' },
    { value: 'F/S-Ward', label: 'F/S-Ward' },
    { value: 'G/N-Ward', label: 'G/N-Ward' },
    { value: 'G/S-Ward', label: 'G/S-Ward' },
    { value: 'H/E-Ward', label: 'H/E-Ward' },
    { value: 'H/W-Ward', label: 'H/W-Ward' },
    { value: 'K/E-Ward', label: 'K/E-Ward' },
    { value: 'K/W-Ward', label: 'K/W-Ward' },
    { value: 'L-Ward', label: 'L-Ward' },
    { value: 'M/E-Ward', label: 'M/E-Ward' },
    { value: 'M/W-Ward', label: 'M/W-Ward' },
    { value: 'N-Ward', label: 'N-Ward' },
    { value: 'P/N-Ward', label: 'P/N-Ward' },
    { value: 'P/S-Ward', label: 'P/S-Ward' },
    { value: 'R/C-Ward', label: 'R/C-Ward' },
    { value: 'R/N-Ward', label: 'R/N-Ward' },
    { value: 'R/S-Ward', label: 'R/S-Ward' },
    { value: 'S-Ward', label: 'S-Ward' },
    { value: 'T-Ward', label: 'T-Ward' },
    { value: 'General', label: 'General' }
  ]

  return (
    <div className="sticky top-16 z-10 bg-slate-800 border-b border-slate-700 p-4 space-y-4">
      {/* Main Filter Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input - Left Side */}
        <div className="flex-1 lg:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {/* Loading indicator in search */}
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Filter Dropdowns - Right Side */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            disabled={isLoading}
            className="px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Issue Type Filter */}
          <select
            value={filters.issue_type || ''}
            onChange={(e) => handleFilterChange('issue_type', e.target.value)}
            disabled={isLoading}
            className="px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
          >
            {issueTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Ward Filter */}
          <select
            value={filters.ward || ''}
            onChange={(e) => handleFilterChange('ward', e.target.value)}
            disabled={isLoading}
            className="px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[130px]"
          >
            {wardOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count and Clear Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* Results Count */}
        <div className="text-sm text-slate-400">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
              <span>Loading complaints...</span>
            </div>
          ) : (
            <span>
              <span className="font-semibold text-white">{totalCount?.toLocaleString() || 0}</span>
              {' '}complaint{totalCount !== 1 ? 's' : ''} found
            </span>
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && !isLoading && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 self-start sm:self-auto"
          >
            <X className="w-4 h-4" />
            <span>Clear all filters</span>
          </button>
        )}
      </div>

      {/* Active Filters Tags (Optional Enhancement) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-full">
              Status: {filters.status}
              <button
                onClick={() => handleFilterChange('status', '')}
                className="hover:text-blue-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.issue_type && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs rounded-full">
              Type: {filters.issue_type}
              <button
                onClick={() => handleFilterChange('issue_type', '')}
                className="hover:text-orange-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.ward && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs rounded-full">
              Ward: {filters.ward}
              <button
                onClick={() => handleFilterChange('ward', '')}
                className="hover:text-purple-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full">
              Search: "{filters.search}"
              <button
                onClick={() => {
                  setSearchTerm('')
                  handleFilterChange('search', '')
                }}
                className="hover:text-green-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminFilterBar