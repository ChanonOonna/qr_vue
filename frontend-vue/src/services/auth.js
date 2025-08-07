import api from './api'

// Environment variables
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3001';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const authService = {
  // Check authentication status
  async checkAuthStatus() {
    try {
      const response = await api.get('/user')
      return response.data
    } catch (error) {
      // Handle rate limiting
      if (error.response?.status === 429) {
        console.warn('Rate limited, waiting before retry...')
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        // Don't retry, just throw the error
      }
      throw error
    }
  },

  // Login (redirect to Auth0)
  login() {
    window.location.href = `${BACKEND_URL}/login`
  },

  // Logout
  async logout() {
    try {
      await api.get('/logout')
      window.location.href = `${FRONTEND_URL}/`
    } catch (error) {
      console.error('Logout failed:', error)
      window.location.href = `${FRONTEND_URL}/`
    }
  },

  // Update teacher code
  async updateTeacherCode(teacherCode) {
    try {
      const response = await api.post('/user/teacher-code', { teacher_code: teacherCode })
      return response.data
    } catch (error) {
      throw error
    }
  }
} 