import api from './api'

export const qrcodeService = {
  // Get all QR sessions
  async getQRSessions() {
    try {
      const response = await api.get('/qrcode/sessions')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Create new QR session
  async createQRSession(sessionData) {
    try {
      const response = await api.post('/qrcode/sessions', sessionData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get QR session by ID
  async getQRSession(sessionId) {
    try {
      const response = await api.get(`/qrcode/sessions/${sessionId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Delete QR session
  async deleteQRSession(sessionId) {
    try {
      const response = await api.delete(`/qrcode/sessions/${sessionId}`)
      return response.data
    } catch (error) {
      throw error
    }
  }
} 