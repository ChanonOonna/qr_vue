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

  // Check if student can register face (no QR token needed)
  async checkStudentForRegistration(studentData) {
    try {
      const response = await api.post('/attendance/student/check', studentData)
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

  // Register student face
  async registerFace(faceData) {
    try {
      const response = await api.post('/attendance/student/register', faceData)
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
  },

  // Validate if student has face registration (in studentface)
  async validateFaceEnrollment({ student_id, firstname, lastname }) {
    try {
      const response = await api.post('/attendance/validate-face', {
        student_id,
        firstname,
        lastname
      })
      return response.data // { found: boolean }
    } catch (error) {
      throw error
    }
  },

  // Check duplicate submission for this QR session and student
  async checkDuplicateSubmission({ qr_token, student_code, firstname, lastname }) {
    try {
      const response = await api.post('/attendance/check-duplicate-submission', {
        qr_token,
        student_code,
        firstname,
        lastname
      })
      return response.data // { duplicate: boolean }
    } catch (error) {
      throw error
    }
  }
} 