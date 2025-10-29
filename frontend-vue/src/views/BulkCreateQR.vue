<template>
  <div class="bulk-create-qr-content">
    <div class="bulk-create-qr-card">
      <div class="bulk-create-qr-header">
        <div class="bulk-create-qr-title">📚 สร้าง QR Code หลายครั้ง</div>
        <div class="bulk-create-qr-subtitle">สร้าง QR Code สำหรับหลายคาบเรียนในครั้งเดียว</div>
      </div>
      <div class="bulk-create-qr-form">
        <div class="teacher-info">
          <div class="teacher-name">ชื่อ: {{ authStore.userInfo?.name || 'ครู' }}</div>
          <div class="teacher-code">รหัสครู: {{ authStore.userInfo?.teacher_code || 'ไม่ระบุ' }}</div>
        </div>

        <form @submit.prevent="handleSubmit">
          <!-- Basic Info Section -->
          <div class="form-section">
            <h3>📋 ข้อมูลพื้นฐาน</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="subjectCode">รหัสวิชา *</label>
                <input type="text" id="subjectCode" v-model="formData.subjectCode" placeholder="เช่น 012345" required />
              </div>
              <div class="form-group">
                <label for="subjectName">ชื่อวิชา *</label>
                <input type="text" id="subjectName" v-model="formData.subjectName"
                  placeholder="เช่น การเขียนโปรแกรม" required />
              </div>
              <div class="form-group">
                <label for="classIdentifier">กลุ่มชั้นเรียน *</label>
                <input type="text" id="classIdentifier" v-model="formData.classIdentifier"
                  placeholder="หมู่เรียน" required />
              </div>
              <div class="form-group">
                <label for="academicYear">ปีการศึกษา *</label>
                <input type="number" id="academicYear" v-model="formData.academicYear" min="2020" max="2050"
                  placeholder="เช่น 2025" required />
              </div>
              <div class="form-group">
                <label for="semester">ภาคเรียน *</label>
                <select v-model="formData.semester" id="semester" required>
                  <option value="" disabled>เลือกภาคเรียน</option>
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                  <option value="3">ภาคเรียนฤดูร้อน</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Schedule Settings -->
          <div class="form-section">
            <h3>📅 กำหนดการเรียน</h3>
            <div class="schedule-options">
              <div class="option-group">
                <label class="radio-label">
                  <input type="radio" v-model="scheduleType" value="weekly" @change="updateSchedulePreview" />
                  <div class="radio-content">
                    <i class="fas fa-calendar-week radio-icon"></i>
                    <div class="radio-text">
                      <span class="radio-title">เรียนทุกสัปดาห์</span>
                      <span class="radio-description">สร้างตารางเรียนแบบซ้ำทุกสัปดาห์</span>
                    </div>
                  </div>
                </label>
              </div>
              <div class="option-group">
                <label class="radio-label">
                  <input type="radio" v-model="scheduleType" value="custom" @change="updateSchedulePreview" />
                  <div class="radio-content">
                    <i class="fas fa-calendar-alt radio-icon"></i>
                    <div class="radio-text">
                      <span class="radio-title">กำหนดเอง</span>
                      <span class="radio-description">สร้างตารางเรียนแบบกำหนดเอง</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            <!-- Date Range - Only show for weekly schedule -->
            <div v-if="scheduleType === 'weekly'" class="form-date">
              <div class="form-group">
                <label for="startDate">วันที่เริ่มต้น *</label>
                <input type="date" id="startDate" v-model="weeklySchedule.startDate" class="form-control" required />
              </div>
              <div class="form-group">
                <label for="endDate">วันที่สิ้นสุด *</label>
                <input type="date" id="endDate" v-model="weeklySchedule.endDate" class="form-control" required />
              </div>
            </div>

            <div class="form-group">
              <!-- Date Validation Error - Only show for weekly schedule -->
              <div v-if="scheduleType === 'weekly' && weeklyDateError" class="error-messages-date">
                <div class="error-header">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span>พบข้อผิดพลาดในการกำหนดวันที่:</span>
                </div>
                <ul class="error-list">
                  <li class="error-item">{{ weeklyDateError }}</li>
                </ul>
              </div>
            </div>

            <!-- Weekly Schedule -->
            <div v-if="scheduleType === 'weekly'" class="weekly-schedule">
              <div class="weekly-schedule-layout">
                <!-- Left Column: Day Selection -->
                <div class="day-selection-column">
                  <div class="form-group">
                    <label>เลือกวันเรียน *</label>
                    <div class="day-selection">
                      <label v-for="(day, index) in dayOptions" :key="index" class="day-checkbox">
                        <input type="checkbox" :value="day.value" v-model="weeklySchedule.selectedDays"
                          @change="updateSchedulePreview" />
                        <span class="day-label">{{ day.label }}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Right Column: Time Settings for Selected Days -->
                <div class="time-settings-column">
                  <div v-if="weeklySchedule.selectedDays.length > 0" class="form-group">
                    <label>กำหนดเวลาสำหรับแต่ละวัน *</label>
                    <div class="schedule-days">
                      <div v-for="dayValue in weeklySchedule.selectedDays" :key="dayValue" class="day-schedule-item">
                        <div class="day-header">
                          <h4>{{ getDayName(dayValue) }}</h4>
                        </div>
                        <div class="time-settings">
                          <div class="time-row">
                            <div class="time-input-group">
                              <label class="time-label">เวลาเริ่มเช็คชื่อ</label>
                              <input type="time" :value="getDayStartTime(dayValue)"
                                @input="setDayStartTime(dayValue, $event.target.value)" class="form-control time-field"
                                required />
                            </div>
                            <div class="time-input-group">
                              <label class="time-label">เวลาหมดอายุ</label>
                              <input type="time" :value="getDayEndTime(dayValue)"
                                @input="setDayEndTime(dayValue, $event.target.value)" class="form-control time-field"
                                required />
                            </div>
                          </div>
                          <div class="time-input-group">
                            <label class="time-label">นาทีที่ถือว่าสาย *</label>
                            <input type="number" :value="getDayLateMinute(dayValue)"
                              @input="setDayLateMinute(dayValue, parseInt($event.target.value))"
                              class="form-control time-field" min="0" step="1" placeholder="0" required />
                          </div>
                        </div>

                        <!-- Session Duration Info for each day -->
                        <div v-if="getDayDuration(dayValue)" class="session-duration-info">
                          <div class="duration-item">
                            <span class="duration-label">⏱️ เวลาทั้งหมด:</span>
                            <span class="duration-value">{{ getDayDuration(dayValue) }} นาที</span>
                          </div>
                          <div class="duration-item">
                            <span class="duration-label">⚠️ นาทีที่ถือว่าสาย:</span>
                            <span class="duration-value" :class="{ 'warning': isDayLateTimeInvalid(dayValue) }">
                              {{ getDayLateMinute(dayValue) }} นาที
                            </span>
                          </div>
                          <div v-if="isDayLateTimeInvalid(dayValue)" class="duration-warning">
                            ⚠️ นาทีที่ถือว่าสายต้องไม่มากกว่าเวลาทั้งหมด
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Time Validation Error -->
              <div v-if="weeklyTimeErrors.length > 0" class="error-messages-time">
                <div class="error-header">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span>พบข้อผิดพลาดในการกำหนดเวลา:</span>
                </div>
                <ul class="error-list">
                  <li v-for="error in weeklyTimeErrors" :key="error" class="error-item">
                    {{ error }}
                  </li>
                </ul>

              </div>
            </div>

            <!-- Custom Schedule -->
            <div v-if="scheduleType === 'custom'" class="custom-schedule">
              <div class="schedule-list">
                <div v-for="(session, index) in customSessions" :key="index" class="session-item">
                  <div class="session-header">
                    <h4>คาบที่ {{ index + 1 }}</h4>
                    <button type="button" @click="removeSession(index)" class="btn btn-danger btn-sm"
                      v-if="customSessions.length > 1">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                  <div class="form-grid">
                    <div class="form-group">
                      <label>วัน-เวลาเริ่ม *</label>
                      <input 
                        type="datetime-local" 
                        v-model="session.startDateTime" 
                        class="form-control" 
                        required 
                        @change="validateCustomSessionTime(index)"
                      />
                    </div>
                    <div class="form-group">
                      <label>วัน-เวลาหมดอายุ *</label>
                      <input 
                        type="datetime-local" 
                        v-model="session.endDateTime" 
                        class="form-control" 
                        :class="{ 'error-field': isCustomSessionTimeInvalid(session) }"
                        required 
                        @change="validateCustomSessionTime(index)"
                      />
                      <div v-if="isCustomSessionTimeInvalid(session)" class="field-error-message">
                        ⚠️ วัน-เวลาหมดอายุต้องมากกว่าวัน-เวลาเริ่ม กรุณาแก้ไขให้ถูกต้อง
                      </div>
                    </div>
                    <div class="form-group">
                      <label>นาทีที่ถือว่าสาย *</label>
                      <input type="number" v-model.number="session.lateMinute" class="form-control" min="0" step="1"
                        placeholder="0" required />
                    </div>
                    <div class="form-group">
                      <label>หมายเหตุ</label>
                      <input type="text" v-model="session.notes" class="form-control" placeholder="เช่น สอบกลางภาค" />
                    </div>
                  </div>

                  <!-- Session Duration Info -->
                  <div v-if="session.startDateTime && session.endDateTime" class="session-duration-info">
                    <div class="duration-item">
                      <span class="duration-label">⏱️ เวลาทั้งหมด:</span>
                      <span class="duration-value">{{ getSessionDuration(session) }} นาที</span>
                    </div>
                    <div class="duration-item">
                      <span class="duration-label">⚠️ นาทีที่ถือว่าสาย:</span>
                      <span class="duration-value">{{ getSessionLateMinute(session) }} นาที</span>
                    </div>
                  </div>
                </div>
              </div>
              <button type="button" @click="addSession" class="btn btn-outline">
                <i class="fas fa-plus"></i> เพิ่มคาบเรียน
              </button>

              <!-- Error Messages for Custom Sessions -->
              <div v-if="customSessionErrors.length > 0" class="error-messages-custom">
                <div class="error-header">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span>พบข้อผิดพลาดในการกำหนดเวลา:</span>
                </div>
                <ul class="error-list">
                  <li v-for="error in customSessionErrors" :key="error" class="error-item">
                    {{ error }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Schedule Preview -->
          <div v-if="schedulePreview.length > 0" class="form-section">
            <h3>👀 ตัวอย่างกำหนดการ</h3>
            <div class="preview-container">
              <div class="preview-stats">
                <span class="stat-item">
                  <i class="fas fa-calendar"></i>
                  จำนวนคาบ: {{ schedulePreview.length }} คาบ
                </span>
              </div>
              <div class="preview-list">
                <div v-for="(session, index) in schedulePreview.slice(0, 10)" :key="index" class="preview-item">
                  <div class="preview-number">{{ index + 1 }}</div>
                  <div class="preview-content">
                    <div class="preview-date">
                      {{ scheduleType === 'weekly' ? formatDate(session.date) : formatDate(session.startDateTime) }}
                    </div>
                    <div class="preview-time">
                      {{ scheduleType === 'weekly' ? `${formatTime(session.startTime)} - ${formatTime(session.endTime)}` :
                        `${formatTime(session.startDateTime)} - ${formatTime(session.endDateTime)}` }}
                    </div>
                    <div class="preview-duration">
                      <i class="fas fa-clock"></i>
                      ระยะเวลา: {{ getSessionDuration(session) }} นาที
                    </div>
                    <div class="preview-late">
                      <i class="fas fa-exclamation-triangle"></i>
                      นาทีที่ถือว่าสาย: {{ getSessionLateMinute(session) }} นาที
                    </div>
                    <div v-if="session.notes" class="preview-notes">{{ session.notes }}</div>
                  </div>
                </div>
                <div v-if="schedulePreview.length > 10" class="preview-more">
                  และอีก {{ schedulePreview.length - 10 }} คาบ...
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="goBack" class="btn-cancel">
              ❌ ยกเลิก
            </button>
            <button type="submit" :disabled="!canSubmit || loading" class="btn-create">
              🎯 {{ loading ? 'กำลังสร้าง...' : `สร้าง QR Code ${schedulePreview.length} คาบ` }}
            </button>
          </div>
        </form>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>{{ loadingMessage }}</p>
        </div>
      </div>
    </div>


    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>🎉 สร้าง QR Code สำเร็จ!</h3>
        </div>
        <div class="modal-body">
          <p>สร้าง QR Code จำนวน <strong>{{ createdSessions.length }}</strong> คาบเรียบร้อยแล้ว</p>
        </div>
        <div class="modal-footer">
          <button @click="goToDashboard" class="btn btn-primary">
            <i class="fas fa-tachometer-alt"></i> ไปที่ Dashboard
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { qrcodeService } from '../services/qrcode'

export default {
  name: 'BulkCreateQR',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()

    // Reactive data
    const loading = ref(false)
    const error = ref('')
    const showSuccessModal = ref(false)
    const createdSessions = ref([])
    const progress = ref(0)
    const loadingMessage = ref('')

    // Form data
    const formData = reactive({
      subjectCode: '',
      subjectName: '',
      classIdentifier: '',
      academicYear: '',
      semester: '',
      sessionDuration: 50
    })

    // Schedule settings
    const scheduleType = ref('weekly')

    const weeklySchedule = reactive({
      startDate: '',
      endDate: '',
      selectedDays: [], // วันที่เลือก
      daySettings: {} // การตั้งค่าสำหรับแต่ละวัน {1: {startTime: '08:00', endTime: '09:00', lateMinute: 10}}
    })

    // ตัวเลือกวันในสัปดาห์
    const dayOptions = [
      { value: 1, label: 'จันทร์' },
      { value: 2, label: 'อังคาร' },
      { value: 3, label: 'พุธ' },
      { value: 4, label: 'พฤหัสบดี' },
      { value: 5, label: 'ศุกร์' },
      { value: 6, label: 'เสาร์' },
      { value: 0, label: 'อาทิตย์' }
    ]

    const customSessions = ref([
      {
        startDateTime: '',
        endDateTime: '',
        lateMinute: 0,
        notes: ''
      }
    ])

    // Computed properties
    const userInitial = computed(() => {
      const name = authStore.userInfo?.name || 'ครู'
      return name.charAt(0).toUpperCase()
    })

    const schedulePreview = computed(() => {
      if (scheduleType.value === 'weekly') {
        const sessions = generateWeeklySchedule()
        console.log('schedulePreview computed - weekly sessions:', sessions)
        return sessions
      } else {
        const sessions = customSessions.value.filter(session =>
          session.startDateTime && session.endDateTime
        )
        console.log('schedulePreview computed - custom sessions:', sessions)
        return sessions
      }
    })

    const canSubmit = computed(() => {
      if (!formData.subjectCode || !formData.subjectName || !formData.classIdentifier || 
          !formData.academicYear || !formData.semester) {
        return false
      }

      if (scheduleType.value === 'weekly') {
        return weeklySchedule.startDate && weeklySchedule.endDate &&
          weeklySchedule.selectedDays.length > 0 &&
          !weeklyDateError.value &&
          weeklyTimeErrors.value.length === 0 &&
          weeklySchedule.selectedDays.every(day => {
            const settings = weeklySchedule.daySettings[day]
            return settings && settings.startTime && settings.endTime && settings.lateMinute !== undefined
          })
      } else {
        return hasValidCustomSessions.value && customSessionErrors.value.length === 0
      }
    })

    // Validation for custom sessions
    const isValidCustomSession = (session) => {
      if (!session.startDateTime || !session.endDateTime) return false

      const startTime = new Date(session.startDateTime)
      const endTime = new Date(session.endDateTime)

      // Check if dates are valid
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return false

      // Check if end time is after start time
      if (endTime <= startTime) return false

      // Check if late minute is valid
      if (session.lateMinute === undefined || session.lateMinute < 0) return false

      // Check if late minute exceeds session duration
      const sessionDuration = Math.round((endTime - startTime) / (1000 * 60))
      if (session.lateMinute > sessionDuration) return false

      return true
    }

    const hasValidCustomSessions = computed(() => {
      return customSessions.value.some(session => isValidCustomSession(session))
    })

    const customSessionErrors = computed(() => {
      const errors = []
      customSessions.value.forEach((session, index) => {
        if (session.startDateTime && session.endDateTime) {
          const startTime = new Date(session.startDateTime)
          const endTime = new Date(session.endDateTime)

          if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
            if (endTime <= startTime) {
              errors.push(`คาบที่ ${index + 1}: วัน-เวลาหมดอายุต้องมากกว่าหรือเท่ากับวัน-เวลาเริ่ม`)
            } else {
              // Check if late minute exceeds session duration
              const sessionDuration = Math.round((endTime - startTime) / (1000 * 60))
              if (session.lateMinute > sessionDuration) {
                errors.push(`คาบที่ ${index + 1}: นาทีที่ถือว่าสาย (${session.lateMinute}) ต้องไม่มากกว่าเวลาทั้งหมด (${sessionDuration} นาที)`)
              }
            }
          }
        }
      })
      return errors
    })

    // Weekly Schedule Date Validation
    const weeklyDateError = computed(() => {
      if (!weeklySchedule.startDate || !weeklySchedule.endDate) {
        return null
      }

      const startDate = new Date(weeklySchedule.startDate)
      const endDate = new Date(weeklySchedule.endDate)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'วันที่ไม่ถูกต้อง'
      }

      if (endDate < startDate) {
        return 'วันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้น'
      }

      if (endDate.getTime() === startDate.getTime()) {
        return 'วันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้นอย่างน้อย 1 วัน'
      }

      return null
    })

    // Weekly Schedule Time Validation
    const weeklyTimeErrors = computed(() => {
      const errors = []

      if (!weeklySchedule.startDate || !weeklySchedule.endDate) {
        return errors
      }

      const startDate = new Date(weeklySchedule.startDate)
      const endDate = new Date(weeklySchedule.endDate)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return errors
      }

      // Check if selected days are within the date range
      if (weeklySchedule.selectedDays.length > 0) {
        const daysInRange = []
        let currentDate = new Date(startDate)
        
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay()
          daysInRange.push(dayOfWeek) // Keep as number, not string
          currentDate.setDate(currentDate.getDate() + 1)
        }

        const unavailableDays = weeklySchedule.selectedDays.filter(day => 
          !daysInRange.includes(Number(day)) // Convert to number for comparison
        )

        if (unavailableDays.length > 0) {
          const unavailableDayNames = unavailableDays.map(day => getDayName(day)).join(', ')
          errors.push(`วัน ${unavailableDayNames} ไม่อยู่ในช่วงวันที่ที่กำหนด กรุณาปรับช่วงวันที่หรือยกเลิกการเลือกวันเหล่านี้`)
        }
      }

      // Check each selected day
      weeklySchedule.selectedDays.forEach(dayValue => {
        const daySettings = weeklySchedule.daySettings[dayValue]
        if (daySettings && daySettings.startTime && daySettings.endTime) {
          const dayName = getDayName(dayValue)

          // Compare time strings directly (HH:MM format)
          if (daySettings.endTime <= daySettings.startTime) {
            errors.push(`${dayName}: เวลาหมดอายุต้องมากกว่าเวลาเริ่มเช็คชื่อ`)
          }
        }
      })

      return errors
    })

    // Calculate actual session duration
    const actualSessionDuration = computed(() => {
      if (schedulePreview.value.length === 0) return 0

      if (scheduleType.value === 'weekly') {
        // For weekly schedule, calculate from first session
        const firstSession = schedulePreview.value[0]
        if (firstSession && firstSession.startTime && firstSession.endTime) {
          const startTime = new Date(firstSession.startTime)
          const endTime = new Date(firstSession.endTime)
          return Math.round((endTime - startTime) / (1000 * 60)) // Convert to minutes
        }
      } else {
        // For custom schedule, calculate from first session
        const firstSession = schedulePreview.value[0]
        if (firstSession && firstSession.startDateTime && firstSession.endDateTime) {
          const startTime = new Date(firstSession.startDateTime)
          const endTime = new Date(firstSession.endDateTime)
          return Math.round((endTime - startTime) / (1000 * 60)) // Convert to minutes
        }
      }

      return 0
    })

    // Methods
    const getDayName = (dayValue) => {
      const day = dayOptions.find(d => d.value.toString() === dayValue.toString())
      return day ? day.label : ''
    }

    const getDayStartTime = (dayValue) => {
      return weeklySchedule.daySettings[dayValue]?.startTime || ''
    }

    const setDayStartTime = (dayValue, time) => {
      if (!weeklySchedule.daySettings[dayValue]) {
        weeklySchedule.daySettings[dayValue] = {}
      }
      weeklySchedule.daySettings[dayValue].startTime = time
      updateSchedulePreview()
    }

    const getDayEndTime = (dayValue) => {
      return weeklySchedule.daySettings[dayValue]?.endTime || ''
    }

    const setDayEndTime = (dayValue, time) => {
      if (!weeklySchedule.daySettings[dayValue]) {
        weeklySchedule.daySettings[dayValue] = {}
      }
      weeklySchedule.daySettings[dayValue].endTime = time
      updateSchedulePreview()
    }

    const getDayLateMinute = (dayValue) => {
      return weeklySchedule.daySettings[dayValue]?.lateMinute || 0
    }

    const setDayLateMinute = (dayValue, minute) => {
      if (!weeklySchedule.daySettings[dayValue]) {
        weeklySchedule.daySettings[dayValue] = {}
      }
      weeklySchedule.daySettings[dayValue].lateMinute = minute || 0
      updateSchedulePreview()
    }

    const getDayDuration = (dayValue) => {
      const settings = weeklySchedule.daySettings[dayValue]
      if (!settings || !settings.startTime || !settings.endTime) return null

      const startTime = new Date(`2000-01-01T${settings.startTime}`)
      const endTime = new Date(`2000-01-01T${settings.endTime}`)
      const durationMinutes = Math.floor((endTime - startTime) / (1000 * 60))

      return durationMinutes > 0 ? durationMinutes : null
    }

    const isDayLateTimeInvalid = (dayValue) => {
      const duration = getDayDuration(dayValue)
      if (!duration) return false
      const lateMinute = getDayLateMinute(dayValue)
      return lateMinute > duration
    }

    const generateWeeklySchedule = () => {
      if (!weeklySchedule.startDate || !weeklySchedule.endDate ||
        !weeklySchedule.selectedDays.length) {
        console.log('generateWeeklySchedule: ข้อมูลไม่ครบ', {
          startDate: weeklySchedule.startDate,
          endDate: weeklySchedule.endDate,
          selectedDays: weeklySchedule.selectedDays
        })
        return []
      }

      const startDate = new Date(weeklySchedule.startDate)
      const endDate = new Date(weeklySchedule.endDate)
      const sessions = []

      console.log('generateWeeklySchedule: เริ่มสร้างตารางเรียน', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        selectedDays: weeklySchedule.selectedDays,
        daySettings: weeklySchedule.daySettings
      })
      
      console.log('selectedDays mapping:', weeklySchedule.selectedDays.map(day => ({
        dayValue: day,
        dayName: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'][day],
        settings: weeklySchedule.daySettings[day]
      })))

      // สร้าง sessions สำหรับทุกวันที่เลือกในแต่ละสัปดาห์
      let currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay()
        console.log(`ตรวจสอบวันที่: ${currentDate.toISOString().split('T')[0]} (วัน${dayOfWeek})`)

        // ตรวจสอบว่าวันปัจจุบันอยู่ในรายการวันที่เลือกหรือไม่
        if (weeklySchedule.selectedDays.includes(dayOfWeek)) {
          console.log(`พบวันที่ตรงกัน: ${currentDate.toISOString().split('T')[0]} (วัน${dayOfWeek})`)
          const daySettings = weeklySchedule.daySettings[dayOfWeek]
          console.log('การตั้งค่าวัน:', daySettings)
          if (daySettings && daySettings.startTime && daySettings.endTime) {
            // สร้างวันที่และเวลาจาก date และ time แยกกัน (ใช้ local time)
            const sessionStartTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 
              parseInt(daySettings.startTime.split(':')[0]), parseInt(daySettings.startTime.split(':')[1]))
            const sessionEndTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 
              parseInt(daySettings.endTime.split(':')[0]), parseInt(daySettings.endTime.split(':')[1]))

            console.log('สร้าง session:', {
              date: currentDate.toISOString().split('T')[0],
              startTimeInput: daySettings.startTime,
              endTimeInput: daySettings.endTime,
              sessionStartTime: sessionStartTime.toISOString(),
              sessionEndTime: sessionEndTime.toISOString(),
              sessionStartTimeLocal: sessionStartTime.toLocaleString('th-TH'),
              sessionEndTimeLocal: sessionEndTime.toLocaleString('th-TH')
            })

            // สร้าง time string โดยตรงจาก local time (ไม่ใช้ toISOString)
            const startTimeStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}T${daySettings.startTime}:00`
            const endTimeStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}T${daySettings.endTime}:00`
            
            console.log('สร้าง time string:', {
              date: currentDate.toISOString().split('T')[0],
              dayOfWeek: dayOfWeek,
              dayName: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'][dayOfWeek],
              startTimeInput: daySettings.startTime,
              endTimeInput: daySettings.endTime,
              startTimeStr: startTimeStr,
              endTimeStr: endTimeStr
            })
            
            sessions.push({
              date: currentDate.toISOString().split('T')[0],
              startTime: startTimeStr,
              endTime: endTimeStr,
              lateMinute: daySettings.lateMinute || 0,
              notes: ''
            })
          }
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      return sessions
    }

    const updateSchedulePreview = () => {
      // Trigger reactivity
    }

    const addSession = () => {
      customSessions.value.push({
        startDateTime: '',
        endDateTime: '',
        lateMinute: 0,
        notes: ''
      })
    }

    const removeSession = (index) => {
      customSessions.value.splice(index, 1)
    }

    const validateCustomSessionTime = (index) => {
      // Just trigger reactivity - let user fix the time manually
      updateSchedulePreview()
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'ยังไม่ได้กำหนด'
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง'
        return date.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        })
      } catch (error) {
        return 'วันที่ไม่ถูกต้อง'
      }
    }

    const formatTime = (dateTimeString) => {
      if (!dateTimeString) return '--:--'
      try {
        const date = new Date(dateTimeString)
        if (isNaN(date.getTime())) return '--:--'
        
        // Format time in local timezone (Thailand)
        return date.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Bangkok'
        })
      } catch (error) {
        return '--:--'
      }
    }

    const getSessionDuration = (session) => {
      if (scheduleType.value === 'weekly') {
        if (session.startTime && session.endTime) {
          const startTime = new Date(session.startTime)
          const endTime = new Date(session.endTime)
          return Math.round((endTime - startTime) / (1000 * 60)) // Convert to minutes
        }
      } else {
        if (session.startDateTime && session.endDateTime) {
          const startTime = new Date(session.startDateTime)
          const endTime = new Date(session.endDateTime)
          return Math.round((endTime - startTime) / (1000 * 60)) // Convert to minutes
        }
      }
      return 0
    }

    const getSessionLateMinute = (session) => {
      if (scheduleType.value === 'weekly') {
        // For weekly schedule, get lateMinute from the day settings
        const dayOfWeek = new Date(session.startTime).getDay()
        const daySettings = weeklySchedule.daySettings[dayOfWeek]
        return daySettings ? (daySettings.lateMinute || 0) : 0
      } else {
        // For custom schedule, get lateMinute directly from session
        return session.lateMinute || 0
      }
    }

    const isCustomSessionLateTimeInvalid = (session) => {
      if (!session.startDateTime || !session.endDateTime || session.lateMinute === undefined) {
        return false
      }

      const startTime = new Date(session.startDateTime)
      const endTime = new Date(session.endDateTime)

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return false
      }

      const sessionDuration = Math.round((endTime - startTime) / (1000 * 60))
      return session.lateMinute > sessionDuration
    }

    const isCustomSessionTimeInvalid = (session) => {
      if (!session.startDateTime || !session.endDateTime) {
        return false
      }

      const startTime = new Date(session.startDateTime)
      const endTime = new Date(session.endDateTime)

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return false
      }

      return endTime <= startTime
    }

    const handleSubmit = async () => {
      if (!canSubmit.value) return

      loading.value = true
      progress.value = 0
      createdSessions.value = []

        try {
          const sessions = schedulePreview.value
          const totalSessions = sessions.length

          // Debug: แสดงข้อมูลรวมทั้งหมดก่อนเริ่มส่ง
          console.log('=== ข้อมูลรวมทั้งหมด ===')
          console.log('จำนวนคาบที่จะสร้าง:', totalSessions)
          console.log('ข้อมูลฟอร์ม:', formData)
          console.log('ข้อมูลตารางเรียน:', sessions)
          console.log('ประเภทตารางเรียน:', scheduleType.value)
          console.log('ข้อมูล weeklySchedule:', weeklySchedule)
          console.log('วันที่เลือก:', weeklySchedule.selectedDays)
          console.log('การตั้งค่าวัน:', weeklySchedule.daySettings)
          console.log('canSubmit:', canSubmit.value)
          console.log('weeklyDateError:', weeklyDateError.value)
          console.log('weeklyTimeErrors:', weeklyTimeErrors.value)
          console.log('========================')

          for (let i = 0; i < sessions.length; i++) {
          const session = sessions[i]
          loadingMessage.value = `กำลังสร้างคาบที่ ${i + 1}/${totalSessions}...`

          // Use the predefined times from session
          let startTime, endTime

          if (scheduleType.value === 'weekly') {
            // ใช้ string โดยตรง ไม่แปลงเป็น Date object
            startTime = session.startTime
            endTime = session.endTime
            
            // Debug: Log the weekly session times
            console.log('Weekly session times:', {
              sessionStartTime: session.startTime,
              sessionEndTime: session.endTime,
              startTime: startTime,
              endTime: endTime
            })
          } else {
            // For custom sessions, ใช้ string โดยตรง ไม่แปลงเป็น Date object
            startTime = session.startDateTime
            endTime = session.endDateTime
            
            // Debug: Log the custom session times
            console.log('Custom session times:', {
              startDateTimeInput: session.startDateTime,
              endDateTimeInput: session.endDateTime,
              startTime: startTime,
              endTime: endTime
            })
          }

          // Create session data according to the required format
          const sessionData = {
            subject_code: formData.subjectCode,        // รหัสวิชาที่กรอก
            subject_name: formData.subjectName,        // ชื่อวิชาที่กรอก
            class_group: formData.classIdentifier,    // กลุ่มชั้นเรียน ที่กรอก
            year: parseInt(formData.academicYear),     // ปีการศึกษา ที่กรอก(แปลงเป็น integer)
            semester: parseInt(formData.semester),     // ภาคเรียน ที่เลือก(แปลงเป็น integer)
            start_time: startTime, // ใช้ string โดยตรง ไม่แปลงเป็น Date
            late_minute: parseInt(session.lateMinute || 0), // นาทีที่ถือว่าสาย (แปลงเป็น integer)
            expire_time: endTime, // ใช้ string โดยตรง ไม่แปลงเป็น Date
            teacher_code: authStore.userInfo?.teacher_code // รหัสครู (จาก auth store)
          }

          // Debug: แสดงข้อมูลใน console ก่อนส่ง
          console.log(`=== คาบที่ ${i + 1}/${totalSessions} ===`)
          console.log('ข้อมูลที่จะส่งไปยัง API:', sessionData)
          console.log('ข้อมูลต้นฉบับ:', session)
          console.log('เวลาที่ส่ง:', {
            startTime: startTime,
            endTime: endTime
          })
          console.log('วันที่และวันในสัปดาห์:', {
            date: session.date,
            dayOfWeek: scheduleType.value === 'weekly' ? new Date(session.startTime).getDay() : new Date(session.startDateTime).getDay(),
            dayName: scheduleType.value === 'weekly' ? 
              ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'][new Date(session.startTime).getDay()] :
              ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'][new Date(session.startDateTime).getDay()]
          })
          console.log('สถานะ Authentication:', {
            isAuthenticated: authStore.isAuthenticated,
            userInfo: authStore.userInfo,
            teacherCode: authStore.userInfo?.teacher_code,
            userId: authStore.userInfo?.id,
            email: authStore.userInfo?.email
          })
          console.log('Cookies:', document.cookie)
          console.log('=====================================')

          // Create QR session using the same service as CreateQR.vue
          const response = await qrcodeService.createQRSession(sessionData)

          if (response) {
            createdSessions.value.push(response)
          }

          progress.value = Math.round(((i + 1) / totalSessions) * 100)
        }

        loading.value = false
        showSuccessModal.value = true

      } catch (error) {
        console.error('Error creating bulk sessions:', error)
        loading.value = false
        alert('เกิดข้อผิดพลาดในการสร้าง QR Code')
      }
    }

    const goBack = () => {
      router.push('/dashboard')
    }

    const goToDashboard = () => {
      router.push('/dashboard')
    }

    const closeSuccessModal = () => {
      showSuccessModal.value = false
      createdSessions.value = []
    }

    // Initialize
    onMounted(() => {
      // Set default start date to today
      const today = new Date()
      weeklySchedule.startDate = today.toISOString().split('T')[0]
    })

    return {
      authStore,
      loading,
      error,
      showSuccessModal,
      createdSessions,
      progress,
      loadingMessage,
      formData,
      scheduleType,
      weeklySchedule,
      dayOptions,
      customSessions,
      userInitial,
      schedulePreview,
      getDayName,
      getDayStartTime,
      setDayStartTime,
      getDayEndTime,
      setDayEndTime,
      getDayLateMinute,
      setDayLateMinute,
      getDayDuration,
      isDayLateTimeInvalid,
      canSubmit,
      hasValidCustomSessions,
      customSessionErrors,
      weeklyDateError,
      weeklyTimeErrors,
      actualSessionDuration,
      updateSchedulePreview,
      addSession,
      removeSession,
      validateCustomSessionTime,
      formatDate,
      formatTime,
      getSessionDuration,
      getSessionLateMinute,
      isCustomSessionLateTimeInvalid,
      isCustomSessionTimeInvalid,
      handleSubmit,
      goBack,
      goToDashboard,
      closeSuccessModal
    }
  }
}
</script>

<style scoped>
.bulk-create-qr-content {
  padding: 30px;
  max-width: 900px;
  margin: 0 auto;
}

.bulk-create-qr-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

.bulk-create-qr-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 30px;
  text-align: center;
}

.bulk-create-qr-title {
  font-size: 2rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.bulk-create-qr-subtitle {
  font-size: 1rem;
  opacity: 0.9;
}

.bulk-create-qr-form {
  padding: 40px 30px;
}

.teacher-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  text-align: center;
}

.teacher-name,
.teacher-code {
  font-size: 1rem;
  color: #333;
  font-weight: 600;
  margin-bottom: 5px;
}

.form-section {
  margin-bottom: 30px;
}

.form-section h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.form-group {
  margin-bottom: 22px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 13px;
  border: 2px solid #e1e8ed;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4285f4;
  background: white;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #999;
}

/* Schedule Options */
.schedule-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 25px;
}

.option-group {
  display: flex;
  align-items: stretch;
}

.radio-label {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #ffffff;
  position: relative;
}

.radio-label:hover {
  border-color: #3b82f6;
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.radio-label input[type="radio"] {
  margin: 0;
  margin-right: 15px;
  width: 20px;
  height: 20px;
  accent-color: #3b82f6;
}

.radio-label input[type="radio"]:checked+.radio-content {
  color: #3b82f6;
}

.radio-label input[type="radio"]:checked~* {
  color: #3b82f6;
}

.radio-content {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.radio-icon {
  font-size: 24px;
  color: #6b7280;
  transition: color 0.3s ease;
}

.radio-label:hover .radio-icon {
  color: #3b82f6;
}

.radio-label input[type="radio"]:checked+.radio-content .radio-icon {
  color: #3b82f6;
}

.radio-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.radio-title {
  font-weight: 600;
  font-size: 16px;
  color: #374151;
  transition: color 0.3s ease;
}

.radio-description {
  font-size: 14px;
  color: #6b7280;
  transition: color 0.3s ease;
}

.radio-label:hover .radio-title {
  color: #3b82f6;
}

.radio-label:hover .radio-description {
  color: #4b5563;
}

.radio-label input[type="radio"]:checked+.radio-content .radio-title {
  color: #3b82f6;
}

.radio-label input[type="radio"]:checked+.radio-content .radio-description {
  color: #1d4ed8;
}

/* Form Date - Horizontal Layout */
.form-date {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-date .form-group {
  flex: 1;
  margin-bottom: 0;
}

/* Weekly Schedule Layout */
.weekly-schedule-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 30px;
  border-radius: 16px;
  border: 2px solid #e1e8ed;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  justify-content: center;
}

.day-selection-column {
  flex: 0 0 45%;
  background: #ffffff;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px solid #e1e8ed;
}

.time-settings-column {
  flex: 0 0 55%;
  
  padding: 25px;
  
}

/* Day Selection */
.day-selection {
  width: 100%;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.schedule-days {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 8px;
}

.day-schedule-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  padding: 24px;
  border: 2px solid #e1e8ed;
  border-radius: 12px;
  background: #ffffff;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.day-schedule-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.day-schedule-item:hover {
  background: #f8f9fa;
  border-color: #4285f4;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 133, 244, 0.15);
}

.day-schedule-item:hover::before {
  opacity: 1;
}

.day-header {
  position: relative;
  z-index: 1;
  width: 100%;
}



.day-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  width: 100%;
  flex-shrink: 0;
  padding: 16px 20px;
  border: 2px solid #e1e8ed;
  border-radius: 12px;
  background: #ffffff;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.day-checkbox::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.day-checkbox:hover {
  border-color: #4285f4;
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(66, 133, 244, 0.15);
}

.day-checkbox:hover::before {
  opacity: 0.3;
}

.day-checkbox:has(input[type="checkbox"]:checked) {
  border-color: #4285f4;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  box-shadow: 0 6px 20px rgba(66, 133, 244, 0.25);
  transform: translateY(-1px);
}

.day-checkbox:has(input[type="checkbox"]:checked)::before {
  opacity: 1;
}

.day-checkbox input[type="checkbox"] {
  margin: 0;
  width: 20px;
  height: 20px;
  accent-color: #4285f4;
  position: relative;
  z-index: 1;
  cursor: pointer;
}

.day-label {
  font-size: 1.1rem;
  color: #333;
  font-weight: 600;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;
}

.day-checkbox:has(input[type="checkbox"]:checked) .day-label {
  color: #1976d2;
  font-weight: 700;
}

.time-settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  position: relative;
  z-index: 1;
  width: 100%;
}

.time-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.time-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.time-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
  position: relative;
}

.time-label::after {
  content: ' *';
  color: #e74c3c;
  font-weight: 800;
}

.time-field {
  padding: 14px 16px;
  border: 2px solid #e1e8ed;
  border-radius: 10px;
  font-size: 1rem;
  background: #ffffff;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.time-field:focus {
  outline: none;
  border-color: #4285f4;
  box-shadow: 0 0 0 4px rgba(66, 133, 244, 0.1), 0 4px 15px rgba(66, 133, 244, 0.2);
  transform: translateY(-1px);
}

.time-field:hover:not(:focus) {
  border-color: #4285f4;
  box-shadow: 0 2px 12px rgba(66, 133, 244, 0.1);
}

.day-schedule-item:has(input[type="checkbox"]:checked) {
  background: #e3f2fd;
  border-color: #4285f4;
}

.day-schedule-item:has(input[type="checkbox"]:checked) .day-label {
  color: #4285f4;
}

/* Session Duration Info Styles */
.session-duration-info {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #e1e8ed;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  position: relative;
  z-index: 1;
  width: 100%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.session-duration-info::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(66, 133, 244, 0.05) 0%, rgba(25, 118, 210, 0.05) 100%);
  border-radius: 10px;
  z-index: -1;
}

.duration-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(66, 133, 244, 0.1);
}

.duration-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.duration-label {
  font-weight: 700;
  color: #333;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.duration-value {
  font-weight: 800;
  color: #4285f4;
  font-size: 1.1rem;
  background: rgba(66, 133, 244, 0.1);
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid rgba(66, 133, 244, 0.2);
}

.duration-value.warning {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
  border-color: rgba(231, 76, 60, 0.2);
}

.duration-warning {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  color: #721c24;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  margin-top: 12px;
  border: 2px solid #f5c6cb;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
}

/* Custom Schedule */
.schedule-list {
  margin-bottom: 20px;
}

.session-item {
  border: 2px solid #e1e8ed;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 15px;
  background: #f8f9fa;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.session-header h4 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

/* Error Messages */
.error-messages-date {
  margin-top: 20px;
  padding: 15px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
}

.error-messages-time {
  margin-top: 20px;
  padding: 15px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
}

.error-messages-custom {
  margin-top: 20px;
  padding: 15px;
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 8px;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 10px;
}

.error-messages-date .error-header {
  color: #721c24;
}

.error-messages-time .error-header {
  color: #856404;
}

.error-messages-custom .error-header {
  color: #0c5460;
}

.error-header i {
  font-size: 16px;
}

.error-list {
  margin: 0;
  padding-left: 20px;
}

.error-item {
  margin-bottom: 5px;
  font-size: 14px;
}

.error-messages-date .error-item {
  color: #721c24;
}

.error-messages-time .error-item {
  color: #856404;
}

.error-messages-custom .error-item {
  color: #0c5460;
}

.error-item:last-child {
  margin-bottom: 0;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-outline {
  background: transparent;
  color: #4285f4;
  border: 2px solid #4285f4;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-outline:hover {
  background: #4285f4;
  color: white;
}

/* Schedule Preview */
.preview-container {
  background: #f8f9fa;
  border: 2px solid #e1e8ed;
  border-radius: 10px;
  padding: 20px;
}

.preview-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.preview-list {
  max-height: 300px;
  overflow-y: auto;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  border-bottom: 1px solid #e1e8ed;
}

.preview-number {
  width: 30px;
  height: 30px;
  background: #4285f4;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
}

.preview-content {
  flex: 1;
}

.preview-date {
  font-weight: 500;
  color: #333;
}

.preview-time {
  color: #666;
  font-size: 14px;
}

.preview-duration {
  color: #3b82f6;
  font-size: 13px;
  font-weight: 500;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.preview-duration i {
  font-size: 12px;
}

.preview-late {
  color: #f59e0b;
  font-size: 13px;
  font-weight: 500;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.preview-late i {
  font-size: 12px;
}

.preview-notes {
  color: #999;
  font-size: 12px;
  font-style: italic;
}

.preview-more {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 10px;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
  justify-content: flex-end;
}

.btn-cancel {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 13px 22px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #c0392b;
  transform: translateY(-2px);
}

.btn-create {
  background: #4285f4;
  color: white;
  border: none;
  padding: 13px 22px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3);
}

.btn-create:hover:not(:disabled) {
  background: #3367d6;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(66, 133, 244, 0.4);
}

.btn-create:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  margin-top: 15px;
  font-size: 0.9rem;
  min-height: 20px;
}

.loading {
  text-align: center;
  margin-top: 20px;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4285f4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.loading p {
  color: #666;
  font-size: 0.9rem;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Error Field Styles */
.error-field {
  border-color: #e74c3c !important;
  background-color: #fdf2f2 !important;
}

.error-field:focus {
  border-color: #e74c3c !important;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1) !important;
}

.field-error-message {
  color: #e74c3c;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 5px;
  padding: 5px 8px;
  background-color: #fdf2f2;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

/* Success Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px 20px 0 20px;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-body {
  padding: 20px;
}


.modal-footer {
  padding: 0 20px 20px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Responsive Design */
/* Desktop/Laptop (≥768px) - Default styles already defined above */

/* Tablet (376px - 768px) */
@media (max-width: 768px) and (min-width: 376px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .schedule-options {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .radio-label {
    padding: 15px;
  }

  .radio-content {
    gap: 12px;
  }

  .radio-icon {
    font-size: 20px;
  }

  .radio-title {
    font-size: 15px;
  }

  .radio-description {
    font-size: 13px;
  }

  .day-schedule-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .day-checkbox {
    min-width: auto;
    width: 100%;
    padding: 10px 12px;
  }

  .weekly-schedule-layout {
    flex-direction: column;
    gap: 20px;
  }

  .day-selection-column,
  .time-settings-column {
    flex: 1;
  }

  .day-selection {
    width: 100%;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .time-settings {
    flex-direction: column;
    width: 100%;
  }

  .time-row {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .time-input-group {
    width: 100%;
  }

  .form-actions {
    flex-direction: column;
  }

  .preview-stats {
    flex-direction: column;
    gap: 10px;
  }
}

/* iPhone 11 และมือถือเล็ก (≤375px) */
@media (max-width: 375px) {
  .bulk-create-container {
    padding: 10px;
  }
  
  .bulk-create-header {
    padding: 20px 15px;
  }
  
  .header-text h1 {
    font-size: 1.5rem;
  }
  
  .header-text p {
    font-size: 1rem;
  }
  
  .btn-back {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }
  
  .bulk-create-content {
    padding: 20px 15px;
  }
  
  .form-section h3 {
    font-size: 1.1rem;
    margin-bottom: 15px;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    font-size: 0.9rem;
    margin-bottom: 6px;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 10px 12px;
    font-size: 0.9rem;
  }
  
  .schedule-options {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .radio-label {
    padding: 12px;
  }
  
  .radio-content {
    gap: 10px;
  }
  
  .radio-icon {
    font-size: 18px;
  }
  
  .radio-title {
    font-size: 14px;
  }
  
  .radio-description {
    font-size: 12px;
  }
  
  .day-schedule-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .day-checkbox {
    min-width: auto;
    width: 100%;
    padding: 8px 10px;
    font-size: 0.85rem;
  }
  
  .weekly-schedule-layout {
    flex-direction: column;
    gap: 15px;
  }
  
  .day-selection-column,
  .time-settings-column {
    flex: 1;
  }
  
  .day-selection {
    width: 100%;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .time-settings {
    flex-direction: column;
    width: 100%;
  }
  
  .time-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .time-input-group {
    width: 100%;
  }
  
  .time-input-group label {
    font-size: 0.85rem;
  }
  
  .time-input-group input {
    padding: 8px 10px;
    font-size: 0.85rem;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .btn {
    padding: 10px 16px;
    font-size: 0.85rem;
    width: 100%;
    justify-content: center;
  }
  
  .preview-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .preview-stat {
    padding: 10px;
  }
  
  .preview-stat-number {
    font-size: 1.2rem;
  }
  
  .preview-stat-label {
    font-size: 0.8rem;
  }
  
  .loading {
    padding: 20px 15px;
  }
  
  .loading p {
    font-size: 0.9rem;
  }
}
</style>
