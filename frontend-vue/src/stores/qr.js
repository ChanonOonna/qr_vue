import { defineStore } from 'pinia'
import { qrcodeService } from '../services/qrcode'
import { attendanceService } from '../services/attendance'

export const useQRStore = defineStore('qr', {
  state: () => ({
    qrSessions: [],
    currentSession: null,
    attendance: [],
    loading: false,
    error: null
  }),

  getters: {
    totalSessions: (state) => state.qrSessions.length,
    activeSessions: (state) => state.qrSessions.filter(session => session.is_active),
    sessionById: (state) => (id) => state.qrSessions.find(session => session.id === id)
  },

  actions: {
    async loadQRSessions() {
      this.loading = true
      this.error = null
      
      try {
        const sessions = await qrcodeService.getQRSessions()
        this.qrSessions = sessions
      } catch (error) {
        console.error('Failed to load QR sessions:', error)
        this.error = error.message || 'Failed to load QR sessions'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createQRSession(sessionData) {
      this.loading = true
      this.error = null
      
      try {
        const newSession = await qrcodeService.createQRSession(sessionData)
        this.qrSessions.push(newSession)
        return newSession
      } catch (error) {
        console.error('Failed to create QR session:', error)
        this.error = error.message || 'Failed to create QR session'
        throw error
      } finally {
        this.loading = false
      }
    },

    async loadSessionDetail(sessionId) {
      this.loading = true
      this.error = null
      
      try {
        const [session, attendance] = await Promise.all([
          qrcodeService.getQRSession(sessionId),
          attendanceService.getAttendance(sessionId)
        ])
        
        this.currentSession = session
        this.attendance = attendance
      } catch (error) {
        console.error('Failed to load session detail:', error)
        this.error = error.message || 'Failed to load session detail'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteQRSession(sessionId) {
      this.loading = true
      this.error = null
      
      try {
        console.log('Deleting session:', sessionId)
        console.log('Before delete - Total sessions:', this.qrSessions.length)
        
        await qrcodeService.deleteQRSession(sessionId)
        
        // Filter out the deleted session
        const beforeFilter = this.qrSessions.length
        this.qrSessions = this.qrSessions.filter(session => session.id !== sessionId)
        const afterFilter = this.qrSessions.length
        
        console.log('After delete - Total sessions:', this.qrSessions.length)
        console.log('Filtered out sessions:', beforeFilter - afterFilter)
        
        if (this.currentSession && this.currentSession.id === sessionId) {
          this.currentSession = null
          this.attendance = []
        }
      } catch (error) {
        console.error('Failed to delete QR session:', error)
        this.error = error.message || 'Failed to delete QR session'
        throw error
      } finally {
        this.loading = false
      }
    },

    async refreshAttendance(sessionId) {
      this.loading = true
      this.error = null
      
      try {
        const attendance = await attendanceService.getAttendance(sessionId)
        this.attendance = attendance
      } catch (error) {
        console.error('Failed to refresh attendance:', error)
        this.error = error.message || 'Failed to refresh attendance'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateAttendanceRecord(attendanceId, extraScore, notes) {
      this.loading = true
      this.error = null
      
      try {
        const updateData = {
          extra_score: extraScore,
          notes: notes
        }
        
        const response = await attendanceService.updateAttendance(attendanceId, updateData)
        
        // Update the attendance record in the store
        const index = this.attendance.findIndex(record => record.id === attendanceId)
        if (index !== -1 && response.record) {
          this.attendance[index] = { ...this.attendance[index], ...response.record }
        }
        
        return response.record
      } catch (error) {
        console.error('Failed to update attendance record:', error)
        this.error = error.message || 'Failed to update attendance record'
        throw error
      } finally {
        this.loading = false
      }
    },

    async exportAttendance(sessionId) {
      this.loading = true
      this.error = null
      
      try {
        const blob = await attendanceService.exportAttendance(sessionId)
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `attendance_${sessionId}_${new Date().toISOString().split('T')[0]}.xlsx`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Failed to export attendance:', error)
        this.error = error.message || 'Failed to export attendance'
        throw error
      } finally {
        this.loading = false
      }
    },

    clearCurrentSession() {
      this.currentSession = null
      this.attendance = []
    },

    clearError() {
      this.error = null
    }
  }
}) 