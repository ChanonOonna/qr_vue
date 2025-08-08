import api from './api'

export const faceService = {
  // Check if student already exists
  async checkStudentExists(studentData) {
    try {
      const response = await api.post('/attendance/student/check', studentData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Register student face
  async registerFace(faceData) {
    try {
      // Convert FormData to JSON object
      const jsonData = {
        student_id: faceData.get('student_id'),
        first_name: faceData.get('first_name'),
        last_name: faceData.get('last_name'),
        face_descriptor: faceData.get('face_descriptor')
      }
      
      console.log('Sending to backend:', jsonData)
      console.log('Face descriptor type:', typeof jsonData.face_descriptor)
      console.log('Face descriptor length:', jsonData.face_descriptor ? jsonData.face_descriptor.length : 'undefined')
      
      const response = await api.post('/attendance/student/register', jsonData)
      return response.data
    } catch (error) {
      console.error('Backend error response:', error.response?.data)
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