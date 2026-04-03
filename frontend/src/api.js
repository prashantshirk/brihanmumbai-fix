import axios from 'axios'

// ============================================================================
// AXIOS INSTANCE CONFIGURATION
// ============================================================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
})

// ============================================================================
// REQUEST INTERCEPTOR - Attach Auth Token
// ============================================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bmf_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ============================================================================
// RESPONSE INTERCEPTOR - Handle 401 Errors
// ============================================================================

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear authentication data
      localStorage.removeItem('bmf_token')
      localStorage.removeItem('bmf_user')
      
      // Redirect to login
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
   * @returns {Promise} - { token, user }
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
   * @returns {Promise} - { token, user }
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

// Export axios instance for custom requests
export default api
