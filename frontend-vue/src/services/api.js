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
    // Add any request headers here if needed
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

export default api 