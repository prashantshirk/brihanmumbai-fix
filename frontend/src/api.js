import axios from 'axios'

// ============================================================================
// AXIOS INSTANCE CONFIGURATION
// ============================================================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true  // Include cookies in requests
})

// ============================================================================
// REQUEST INTERCEPTOR - No auth headers needed (cookies handle this)
// ============================================================================

// No request interceptor needed - cookies are sent automatically

// ============================================================================
// RESPONSE INTERCEPTOR - Handle 401 Errors
// ============================================================================

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear user data from localStorage (for UI state only)
      localStorage.removeItem('bmf_user')
      
      // Redirect to login (cookie cleared by server)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const authAPI = {
  /**
   * Register a new user
   * @param {string} name - User's full name
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise} - { user }
   */
  register: async (name, email, password) => {
    const response = await api.post('/api/auth/register', {
      name,
      email,
      password
    })
    return response.data
  },

  /**
   * Login existing user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise} - { user }
   */
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', {
      email,
      password
    })
    return response.data
  },

  /**
   * Get current authenticated user
   * @returns {Promise} - { id, name, email, created_at }
   */
  me: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  /**
   * Logout user (clear cookie)
   * @returns {Promise} - { success, message }
   */
  logout: async () => {
    const response = await api.post('/api/auth/logout')
    return response.data
  }
}

// ============================================================================
// COMPLAINT API
// ============================================================================

export const complaintAPI = {
  /**
   * Analyze image with Gemini AI
   * @param {FormData} formData - FormData with image file
   * @returns {Promise} - { image_url, issue_type, severity, description, department, confidence }
   */
  analyzeImage: async (formData) => {
    const response = await api.post('/api/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  /**
   * Create a new complaint
   * @param {Object} data - Complaint data
   * @returns {Promise} - Created complaint object
   */
  create: async (data) => {
    const response = await api.post('/api/complaints', data)
    return response.data
  },

  /**
   * Get list of user's complaints with pagination
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise} - { complaints, total, page, limit }
   */
  list: async (page = 1, limit = 10) => {
    const response = await api.get('/api/complaints', {
      params: { page, limit }
    })
    return response.data
  },

  /**
   * Get single complaint by ID
   * @param {string} id - Complaint ID
   * @returns {Promise} - Complaint object
   */
  getOne: async (id) => {
    const response = await api.get(`/api/complaints/${id}`)
    return response.data
  },

  /**
   * Update complaint status
   * @param {string} id - Complaint ID
   * @param {string} status - New status (Submitted, In Progress, Resolved, Rejected)
   * @returns {Promise} - Updated complaint object
   */
  updateStatus: async (id, status) => {
    const response = await api.patch(`/api/complaints/${id}/status`, {
      status
    })
    return response.data
  }
}

// ============================================================================
// WARD API
// ============================================================================

export const wardAPI = {
  /**
   * Get ward contact information
   * @param {string} ward - Ward name (e.g., "H/W-Ward")
   * @returns {Promise} - { ward, email, phone, office }
   */
  getInfo: async (ward) => {
    const response = await api.get('/api/ward-info', {
      params: { ward }
    })
    return response.data
  }
}

// ============================================================================
// ADMIN API (Separate Auth System)
// ============================================================================

// Create separate axios instance for admin routes
const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true  // Include cookies in requests
})

// Admin response interceptor - Handle 401/403 errors
adminApi.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear admin data from localStorage (for UI state only)
      localStorage.removeItem('bmf_admin')
      
      // Redirect to admin login (cookie cleared by server)
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

export const adminAPI = {
  /**
   * Admin login
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @returns {Promise} - { admin }
   */
  login: async (email, password) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/login`,
      { email, password },
      { withCredentials: true }  // Include cookies
    )
    
    // Save admin info to localStorage (UI state only, not auth token)
    const { admin } = response.data.data
    localStorage.setItem('bmf_admin', JSON.stringify(admin))
    
    return response.data
  },

  /**
   * Admin logout
   * @returns {Promise} - { success, message }
   */
  logout: async () => {
    const response = await adminApi.post('/api/admin/logout')
    return response.data
  },

  /**
   * Get current authenticated admin
   * @returns {Promise} - { id, name, email, role }
   */
  me: async () => {
    const response = await adminApi.get('/api/admin/me')
    return response.data
  },

  /**
   * Get all complaints with filters and pagination
   * @param {Object} params - { page, limit, status, issue_type, ward, search }
   * @returns {Promise} - { complaints, total, page, limit, pages }
   */
  getComplaints: async (params = {}) => {
    // Build query string, skip empty params
    const queryParams = {}
    if (params.page) queryParams.page = params.page
    if (params.limit) queryParams.limit = params.limit
    if (params.status) queryParams.status = params.status
    if (params.issue_type) queryParams.issue_type = params.issue_type
    if (params.ward) queryParams.ward = params.ward
    if (params.search) queryParams.search = params.search
    
    const response = await adminApi.get('/api/admin/complaints', {
      params: queryParams
    })
    return response.data
  },

  /**
   * Get single complaint by ID
   * @param {string} id - Complaint ID
   * @returns {Promise} - Complaint object with user info
   */
  getComplaint: async (id) => {
    const response = await adminApi.get(`/api/admin/complaints/${id}`)
    return response.data
  },

  /**
   * Update complaint status
   * @param {string} id - Complaint ID
   * @param {string} status - New status (Submitted, In Progress, Resolved, Rejected)
   * @returns {Promise} - { success, complaint_id, new_status, updated_at }
   */
  updateStatus: async (id, status) => {
    const response = await adminApi.patch(`/api/admin/complaints/${id}/status`, {
      status
    })
    return response.data
  },

  /**
   * Get admin dashboard statistics
   * @returns {Promise} - { total, submitted, in_progress, resolved, rejected, by_issue_type, by_severity }
   */
  getStats: async () => {
    const response = await adminApi.get('/api/admin/stats')
    return response.data
  }
}

// ============================================================================
// COMMUNITY FEED API
// ============================================================================

export const feedAPI = {
  /**
   * Get community feed posts (paginated)
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Posts per page (default: 12)
   * @returns {Promise} - { posts, total, page, limit, has_more }
   */
  getPosts: async (page = 1, limit = 12) => {
    const response = await api.get('/api/feed', {
      params: { page, limit }
    })
    return response.data
  }
}

// Export axios instance for custom requests
export default api
