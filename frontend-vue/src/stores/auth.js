import { defineStore } from 'pinia'
import { authService } from '../services/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    authChecked: false
  }),

  getters: {
    userInfo: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
    isLoading: (state) => state.loading,
    hasError: (state) => state.error !== null
  },

  actions: {
    async checkAuthStatus() {
      // Prevent multiple auth checks
      if (this.authChecked && !this.isAuthenticated) {
        return
      }
      
      // Add delay to prevent rate limiting
      if (this.loading) {
        return
      }
      
      this.loading = true
      this.error = null
      
      try {
        const user = await authService.checkAuthStatus()
        this.user = user
        this.isAuthenticated = true
        this.authChecked = true
      } catch (error) {
        console.error('Auth check failed:', error)
        this.user = null
        this.isAuthenticated = false
        this.error = error.message || 'Authentication failed'
        this.authChecked = true
      } finally {
        this.loading = false
      }
    },

    async login() {
      this.loading = true
      this.error = null
      
      try {
        authService.login()
      } catch (error) {
        console.error('Login failed:', error)
        this.error = error.message || 'Login failed'
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      
      try {
        await authService.logout()
        this.user = null
        this.isAuthenticated = false
        this.error = null
        this.authChecked = false
      } catch (error) {
        console.error('Logout failed:', error)
        // Still clear the state even if logout request fails
        this.user = null
        this.isAuthenticated = false
        this.authChecked = false
      } finally {
        this.loading = false
      }
    },

    async updateTeacherCode(teacherCode) {
      this.loading = true
      this.error = null
      
      try {
        const result = await authService.updateTeacherCode(teacherCode)
        if (this.user) {
          this.user.teacher_code = teacherCode
        }
        return result
      } catch (error) {
        console.error('Update teacher code failed:', error)
        this.error = error.message || 'Failed to update teacher code'
        throw error
      } finally {
        this.loading = false
      }
    },

    clearError() {
      this.error = null
    }
  }
}) 