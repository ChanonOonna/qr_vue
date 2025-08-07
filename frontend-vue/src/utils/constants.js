// API Endpoints
export const API_ENDPOINTS = {
  USER: '/api/user',
  LOGIN: '/login',
  LOGOUT: '/logout',
  QR_SESSIONS: '/api/qrcode/sessions',
  ATTENDANCE: '/api/attendance',
  FACE_REGISTRATION: '/api/attendance/student/register'
}

// Session Status
export const SESSION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
  NOT_YET: 'notyet'
}

// Attendance Status
export const ATTENDANCE_STATUS = {
  PRESENT: 'มา',
  LATE: 'สาย',
  ABSENT: 'ขาด'
}

// Default Values
export const DEFAULT_VALUES = {
  LATE_MINUTE: 15,
  EXPIRE_TIME: 120,
  YEAR: new Date().getFullYear(),
  SEMESTER: 1
}

// Form Validation
export const VALIDATION = {
  MIN_LATE_MINUTE: 1,
  MAX_LATE_MINUTE: 60,
  MIN_EXPIRE_TIME: 30,
  MAX_EXPIRE_TIME: 480,
  MIN_YEAR: 2020,
  MAX_YEAR: 2030
}

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
}

// Notification Duration (ms)
export const NOTIFICATION_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 3000,
  WARNING: 4000
} 