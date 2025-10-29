import axios from 'axios'

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 10000
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Debug: Log request details
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      withCredentials: config.withCredentials,
      cookies: document.cookie,
      headers: config.headers
    })
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Don't redirect automatically, let components handle it
      console.log('Unauthorized request')
    } else if (error.response?.status === 429) {
      console.warn('Rate limited by server')
    }
    return Promise.reject(error)
  }
)

// API functions
export const getAllowedDomains = async () => {
  try {
    const response = await api.get('/allowed-domains')
    return response.data.domains
  } catch (error) {
    console.error('Error fetching allowed domains:', error)
    return ['@ku.th'] // fallback
  }
}

export default api 