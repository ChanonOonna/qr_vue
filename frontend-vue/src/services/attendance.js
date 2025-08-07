import api from './api'

export const attendanceService = {
  // Get attendance for a session
  async getAttendance(sessionId) {
    try {
      const response = await api.get(`/attendance/session/${sessionId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get session by QR token
  async getSessionByToken(qrToken) {
    try {
      const response = await api.get(`/qrcode/sessions/token/${qrToken}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Validate student data before face verification
  async validateStudentData(validationData) {
    try {
      const response = await api.post('/attendance/validate-student', validationData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Student check-in
  async checkIn(checkInData) {
    try {
      const response = await api.post('/attendance/checkin', checkInData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Update attendance record
  async updateAttendance(attendanceId, updateData) {
    try {
      const response = await api.put(`/attendance/${attendanceId}`, updateData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Export attendance to Excel
  async exportAttendance(sessionId) {
    try {
      const response = await api.get(`/attendance/session/${sessionId}/export`, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      throw error
    }
  }
} 