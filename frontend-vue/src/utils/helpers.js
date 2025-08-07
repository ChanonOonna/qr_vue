import { SESSION_STATUS, ATTENDANCE_STATUS } from './constants'

// Date and Time Helpers
export const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('th-TH')
}

export const formatTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleTimeString('th-TH', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

export const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('th-TH')
}

// Thailand timezone helpers
export const getThailandTime = () => {
  const now = new Date()
  return new Date(now.getTime() + (7 * 60 * 60 * 1000)) // UTC+7
}

export const toThailandTime = (date) => {
  if (!date) return null
  return new Date(date.getTime() + (7 * 60 * 60 * 1000)) // UTC+7
}

export const formatThailandDateTime = (date) => {
  if (!date) return '-'
  const thailandDate = toThailandTime(new Date(date))
  return thailandDate.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const toISOStringThailand = (date) => {
  if (!date) return ''
  const thailandDate = toThailandTime(new Date(date))
  return thailandDate.toISOString().slice(0, 16)
}

// Session Status Helpers
export const getSessionStatus = (session) => {
  if (!session) return SESSION_STATUS.INACTIVE
  
  const now = new Date()
  const start = new Date(session.start_time)
  const expire = session.expire_time ? new Date(session.expire_time) : null
  
  if (expire && now > expire) {
    return SESSION_STATUS.EXPIRED
  } else if (now < start) {
    return SESSION_STATUS.NOT_YET
  } else if ((!expire || now <= expire) && now >= start && session.is_active) {
    return SESSION_STATUS.ACTIVE
  }
  
  return SESSION_STATUS.INACTIVE
}

export const getSessionStatusText = (status) => {
  const statusMap = {
    [SESSION_STATUS.ACTIVE]: 'ใช้งาน',
    [SESSION_STATUS.INACTIVE]: 'ไม่ใช้งาน',
    [SESSION_STATUS.EXPIRED]: 'หมดเวลา',
    [SESSION_STATUS.NOT_YET]: 'ยังไม่ถึงเวลา'
  }
  return statusMap[status] || 'ไม่ทราบสถานะ'
}

export const getSessionStatusClass = (status) => {
  const classMap = {
    [SESSION_STATUS.ACTIVE]: 'active',
    [SESSION_STATUS.INACTIVE]: 'inactive',
    [SESSION_STATUS.EXPIRED]: 'expired',
    [SESSION_STATUS.NOT_YET]: 'notyet'
  }
  return classMap[status] || 'inactive'
}

// Attendance Status Helpers
export const getAttendanceStatusClass = (status) => {
  const classMap = {
    [ATTENDANCE_STATUS.PRESENT]: 'present',
    [ATTENDANCE_STATUS.LATE]: 'late',
    [ATTENDANCE_STATUS.ABSENT]: 'absent'
  }
  return classMap[status] || 'absent'
}

// Statistics Helpers
export const calculateAttendanceStats = (attendance) => {
  if (!attendance || !Array.isArray(attendance)) {
    return { total: 0, present: 0, late: 0, absent: 0 }
  }
  
  return {
    total: attendance.length,
    present: attendance.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length,
    late: attendance.filter(a => a.status === ATTENDANCE_STATUS.LATE).length,
    absent: attendance.filter(a => a.status === ATTENDANCE_STATUS.ABSENT).length
  }
}

// Copy to Clipboard Helper
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

// Download File Helper
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Form Validation Helpers
export const validateRequired = (value) => {
  return value && value.trim().length > 0
}

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateNumber = (value, min, max) => {
  const num = parseInt(value)
  return !isNaN(num) && num >= min && num <= max
}

// Notification Helper
export const showNotification = (message, type = 'info', duration = 3000) => {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification')
  existingNotifications.forEach(notification => notification.remove())
  
  // Create notification element
  const notification = document.createElement('div')
  notification.className = `notification ${type}`
  notification.textContent = message
  
  document.body.appendChild(notification)
  
  // Remove after duration
  setTimeout(() => {
    notification.classList.add('hide')
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 300)
  }, duration)
}

// Debounce Helper
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle Helper
export const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
} 