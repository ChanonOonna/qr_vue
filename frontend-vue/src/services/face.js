import api from './api'

export const faceService = {
  // Register student face
  async registerFace(faceData) {
    try {
      const response = await api.post('/attendance/student/register', faceData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Verify face
  async verifyFace(faceData) {
    try {
      const response = await api.post('/attendance/face/verify', faceData)
      return response.data
    } catch (error) {
      throw error
    }
  }
} 