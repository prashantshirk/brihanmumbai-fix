import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { feedAPI } from '../api'
import FeedCard from '../components/FeedCard'
import { Camera, AlertCircle, Loader2, Plus } from 'lucide-react'

function Feed() {
  const navigate = useNavigate()
  
  // State
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  // Load initial feed
  useEffect(() => {
    loadInitialFeed()
  }, [])

  const loadInitialFeed = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await feedAPI.getPosts(1, 12)
      setPosts(data.posts || [])
      setHasMore(data.has_more || false)
      setTotal(data.total || 0)
      setPage(1)
    } catch (err) {
      console.error('Failed to load feed:', err)
      setError('Failed to load feed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMorePosts = async () => {
    if (!hasMore || isLoadingMore) return
    
    setIsLoadingMore(true)
    setError(null)
    
    try {
      const nextPage = page + 1
      const data = await feedAPI.getPosts(nextPage, 12)
      
      // Append new posts to existing ones
      setPosts(prev => [...prev, ...(data.posts || [])])
      setHasMore(data.has_more || false)
      setTotal(data.total || 0)
      setPage(nextPage)
    } catch (err) {
      console.error('Failed to load more posts:', err)
      setError('Failed to load more posts. Please try again.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleRetry = () => {
    loadInitialFeed()
  }

  const handleReportIssue = () => {
    navigate('/')
  }

  // Skeleton Card Component
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-video w-full bg-slate-200 dark:bg-slate-700" />
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="w-16 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
        
        {/* Citizen row */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        
        {/* Location row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-3/4 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
        
        {/* Footer */}
        <div className="flex justify-end">
          <div className="w-16 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Community Feed
          </h1>
          <p className="text-lg text-black mb-4">
            See what Mumbaikars are reporting across the city
          </p>
          {total > 0 && (
            <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-full text-sm font-medium">
              {total.toLocaleString()} complaint{total !== 1 ? 's' : ''} reported
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : (
          <>
            {/* Empty State */}
            {posts.length === 0 ? (
              <div className="text-center py-16">
                <Camera className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No complaints yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Be the first to report a civic issue
                </p>
                <button
                  onClick={handleReportIssue}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>Report an Issue</span>
                </button>
              </div>
            ) : (
              <>
                {/* Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {posts.map((post) => (
                    <FeedCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Load More / End Message */}
                <div className="text-center">
                  {hasMore ? (
                    <button
                      onClick={loadMorePosts}
                      disabled={isLoadingMore}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Loading more...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Load more</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      You've seen all {total.toLocaleString()} complaint{total !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Feed