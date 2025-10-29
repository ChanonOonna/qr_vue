<template>
  <div class="create-qr-content">
    <div class="create-qr-card">
      <div class="create-qr-header">
        <div class="create-qr-title">📱 สร้าง QR Code ใหม่</div>
      </div>
      <div class="create-qr-form">
        <div class="teacher-info">
          <div class="teacher-email">อีเมล: {{ authStore.userInfo?.email || '-' }}</div>
          <div class="teacher-code">รหัสครู: {{ authStore.userInfo?.teacher_code || '-' }}</div>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="subjectCode">รหัสวิชา *</label>
            <input 
              v-model="form.subject_code" 
              type="text" 
              id="subjectCode" 
              required 
              placeholder="เช่น 012345"
            >
          </div>
          
          <div class="form-group">
            <label for="subjectName">ชื่อวิชา *</label>
            <input 
              v-model="form.subject_name" 
              type="text" 
              id="subjectName" 
              required 
              placeholder="เช่น การเขียนโปรแกรม"
            >
          </div>
          
          <div class="form-group">
            <label for="classGroup">กลุ่มชั้นเรียน *</label>
            <input 
              v-model="form.class_group" 
              type="text" 
              id="classGroup" 
              required 
              placeholder="หมู่เรียน"
            >
          </div>
          
          <div class="form-group">
            <label for="year">ปีการศึกษา *</label>
            <input 
              v-model="form.year" 
              type="number" 
              id="year" 
              required 
              min="2020" 
              max="2030"
            >
          </div>
          
          <div class="form-group">
            <label for="semester">ภาคเรียน *</label>
            <select v-model="form.semester" id="semester" required>
              <option value="1">ภาคเรียนที่ 1</option>
              <option value="2">ภาคเรียนที่ 2</option>
              <option value="3">ภาคเรียนฤดูร้อน</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="startTime">เวลาเริ่มเรียน *</label>
            <input 
              v-model="form.start_time" 
              type="datetime-local" 
              id="startTime" 
              required
            >
          </div>
          
          <div class="form-group">
            <label for="lateMinute">นาทีที่ถือว่าสาย *</label>
            <input 
              v-model.number="form.late_minute" 
              type="number" 
              id="lateMinute" 
              required 
              min="0" 
              step="1"
              @input="validateLateMinute"
              placeholder="0+ นาที"
            >
          </div>
          
          <div class="form-group">
            <label for="expireTime">เวลาหมดอายุ *</label>
            <input 
              v-model="form.expire_time" 
              type="datetime-local" 
              id="expireTime" 
              required
            >
          </div>
          
          <!-- Session Duration Info -->
          <div v-if="sessionDuration" class="session-duration-info">
            <div class="duration-item">
              <span class="duration-label">⏱️ เวลาทั้งหมด:</span>
              <span class="duration-value">{{ sessionDuration }} นาที</span>
            </div>
            <div class="duration-item">
              <span class="duration-label">⚠️ นาทีที่ถือว่าสาย:</span>
              <span class="duration-value" :class="{ 'warning': isLateTimeInvalid }">
                {{ form.late_minute }} นาที
              </span>
            </div>
            <div v-if="isLateTimeInvalid" class="duration-warning">
              ⚠️ นาทีที่ถือว่าสายต้องไม่มากกว่าเวลาทั้งหมด
            </div>
          </div>
          
          <div class="form-group">
            <label for="description">รายละเอียดเพิ่มเติม</label>
            <textarea 
              v-model="form.description" 
              id="description" 
              rows="2" 
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="handleCancel" class="btn-cancel">
              ❌ ยกเลิก
            </button>
            <button type="submit" :disabled="qrStore.loading" class="btn-create">
              🎯 สร้าง QR Code
            </button>
          </div>
        </form>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div v-if="qrStore.loading" class="loading">
          <div class="spinner"></div>
          <p>กำลังสร้าง QR Code...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'
import { useQRStore } from '../stores/qr'
import { useRouter } from 'vue-router'
import { ref, reactive, onMounted, computed } from 'vue'
import { DEFAULT_VALUES, VALIDATION } from '../utils/constants'
import { showNotification } from '../utils/helpers'

export default {
  name: 'CreateQR',
  setup() {
    const authStore = useAuthStore()
    const qrStore = useQRStore()
    const router = useRouter()
    
    const error = ref('')

    // Computed properties for session duration
    const sessionDuration = computed(() => {
      if (!form.start_time || !form.expire_time) return null
      
      const startTime = new Date(form.start_time)
      const expireTime = new Date(form.expire_time)
      const durationMinutes = Math.floor((expireTime - startTime) / (1000 * 60))
      
      return durationMinutes > 0 ? durationMinutes : null
    })

    const isLateTimeInvalid = computed(() => {
      if (!sessionDuration.value) return false
      return form.late_minute > sessionDuration.value
    })

    // Validate late minute input
    const validateLateMinute = () => {
      // Ensure it's a positive number
      if (form.late_minute < 0) {
        form.late_minute = 0
      }
      
      // Ensure it's an integer
      form.late_minute = Math.floor(form.late_minute)
    }

    const form = reactive({
      subject_code: '',
      subject_name: '',
      class_group: '',
      year: DEFAULT_VALUES.YEAR,
      semester: DEFAULT_VALUES.SEMESTER,
      start_time: '',
      late_minute: DEFAULT_VALUES.LATE_MINUTE,
      expire_time: '',
      description: ''
    })

    const validateForm = () => {
      if (!form.subject_code.trim()) {
        error.value = 'กรุณากรอกรหัสวิชา'
        return false
      }
      
      if (!form.subject_name.trim()) {
        error.value = 'กรุณากรอกชื่อวิชา'
        return false
      }
      
      if (!form.class_group.trim()) {
        error.value = 'กรุณากรอกกลุ่มชั้นเรียน'
        return false
      }
      
      if (!form.start_time) {
        error.value = 'กรุณาเลือกเวลาเริ่มเรียน'
        return false
      }
      
      if (!form.expire_time) {
        error.value = 'กรุณาเลือกเวลาหมดอายุ'
        return false
      }
      
      if (new Date(form.start_time) >= new Date(form.expire_time)) {
        error.value = 'เวลาหมดอายุต้องมากกว่าเวลาเริ่มเรียน'
        return false
      }
      
      // Calculate total session duration in minutes
      const startTime = new Date(form.start_time)
      const expireTime = new Date(form.expire_time)
      const totalDurationMinutes = Math.floor((expireTime - startTime) / (1000 * 60))
      
      if (form.late_minute < 0) {
        error.value = 'นาทีที่ถือว่าสายต้องไม่น้อยกว่า 0'
        return false
      }
      
      // Check if late_minute is greater than total session duration
      if (form.late_minute > totalDurationMinutes) {
        error.value = `นาทีที่ถือว่าสาย (${form.late_minute} นาที) ต้องไม่มากกว่าเวลาทั้งหมดของเซสชัน (${totalDurationMinutes} นาที)`
        return false
      }
      
      return true
    }

    const handleSubmit = async () => {
      error.value = ''
      
      if (!validateForm()) {
        return
      }
      
      try {
        // Convert datetime-local values to proper format for backend
        const startTime = new Date(form.start_time)
        const expireTime = new Date(form.expire_time)
        
        // Debug: Log the time conversion
        console.log('CreateQR time conversion:', {
          startTimeInput: form.start_time,
          expireTimeInput: form.expire_time,
          startTimeISO: startTime.toISOString(),
          expireTimeISO: expireTime.toISOString(),
          startTimeLocal: startTime.toLocaleString('th-TH'),
          expireTimeLocal: expireTime.toLocaleString('th-TH'),
          timezoneOffset: startTime.getTimezoneOffset()
        })
        
        const sessionData = {
          ...form,
          year: parseInt(form.year),
          semester: parseInt(form.semester),
          late_minute: parseInt(form.late_minute),
          teacher_code: authStore.userInfo?.teacher_code,
          start_time: form.start_time, // ใช้ string โดยตรง ไม่แปลงเป็น Date
          expire_time: form.expire_time // ใช้ string โดยตรง ไม่แปลงเป็น Date
        }
        
        const newSession = await qrStore.createQRSession(sessionData)
        showNotification('สร้าง QR Code สำเร็จ', 'success')
        router.push('/dashboard')
      } catch (error) {
        console.error('Failed to create QR session:', error)
        error.value = error.message || 'เกิดข้อผิดพลาดในการสร้าง QR Code'
      }
    }

    const handleCancel = () => {
      router.push('/dashboard')
    }

    onMounted(() => {
      // Set default start time to current time (Thailand timezone)
      const now = new Date()
      
      // Convert to Thailand timezone (UTC+7)
      const thailandTime = new Date(now.getTime() + (7 * 60 * 60 * 1000))
      form.start_time = thailandTime.toISOString().slice(0, 16)
      
      // Set default expire time to start time + 2 hours
      const expireTime = new Date(thailandTime)
      expireTime.setHours(expireTime.getHours() + 2)
      form.expire_time = expireTime.toISOString().slice(0, 16)
    })

    return {
      authStore,
      qrStore,
      form,
      error,
      sessionDuration,
      isLateTimeInvalid,
      validateLateMinute,
      handleSubmit,
      handleCancel
    }
  }
}
</script>

<style scoped>
.create-qr-content {
  padding: 30px;
  max-width: 600px;
  margin: 0 auto;
}

.create-qr-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

.create-qr-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 30px;
  text-align: center;
}

.create-qr-title {
  font-size: 2rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.create-qr-form {
  padding: 40px 30px;
}

.teacher-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  text-align: center;
}

.teacher-email, .teacher-code {
  font-size: 1rem;
  color: #333;
  font-weight: 600;
  margin-bottom: 5px;
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

.form-group input, .form-group select, .form-group textarea {
  width: 100%;
  padding: 13px;
  border: 2px solid #e1e8ed;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none;
  border-color: #4285f4;
  background: white;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

/* Session Duration Info Styles */
.session-duration-info {
  background: #f8f9fa;
  border: 2px solid #e1e8ed;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 22px;
}

.duration-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.duration-item:last-child {
  margin-bottom: 0;
}

.duration-label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.duration-value {
  font-weight: 700;
  color: #4285f4;
  font-size: 1rem;
}

.duration-value.warning {
  color: #e74c3c;
}

.duration-warning {
  background: #f8d7da;
  color: #721c24;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 8px;
  border: 1px solid #f5c6cb;
}

.input-hint {
  display: block;
  margin-top: 5px;
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
}

.form-group input::placeholder, .form-group textarea::placeholder {
  color: #999;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

/* Responsive Design */
/* Desktop/Laptop (≥768px) - Default styles already defined above */

/* Tablet (376px - 768px) */
@media (max-width: 768px) and (min-width: 376px) {
  .create-qr-content {
    padding: 20px;
    max-width: 100%;
  }
  
  .create-qr-card {
    border-radius: 15px;
  }
  
  .create-qr-header {
    padding: 30px 25px;
  }
  
  .create-qr-title {
    font-size: 1.7rem;
  }
  
  .create-qr-form {
    padding: 30px 25px;
  }
  
  .teacher-info {
    padding: 15px;
    margin-bottom: 25px;
  }
  
  .teacher-email, .teacher-code {
    font-size: 0.95rem;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    font-size: 0.9rem;
  }
  
  .form-group input, .form-group select, .form-group textarea {
    padding: 12px;
    font-size: 0.95rem;
  }
  
  .session-duration-info {
    padding: 12px;
    margin-bottom: 20px;
  }
  
  .duration-label {
    font-size: 0.85rem;
  }
  
  .duration-value {
    font-size: 0.95rem;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .btn-cancel, .btn-create {
    padding: 12px 20px;
    font-size: 0.95rem;
    width: 100%;
    justify-content: center;
  }
}

/* iPhone 11 และมือถือเล็ก (≤375px) */
@media (max-width: 375px) {
  .create-qr-content {
    padding: 10px;
    max-width: 100%;
  }
  
  .create-qr-card {
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  
  .create-qr-header {
    padding: 25px 20px;
  }
  
  .create-qr-title {
    font-size: 1.4rem;
    margin-bottom: 8px;
  }
  
  .create-qr-form {
    padding: 25px 20px;
  }
  
  .teacher-info {
    padding: 12px;
    margin-bottom: 20px;
    border-radius: 8px;
  }
  
  .teacher-email, .teacher-code {
    font-size: 0.9rem;
    margin-bottom: 4px;
  }
  
  .form-group {
    margin-bottom: 18px;
  }
  
  .form-group label {
    font-size: 0.85rem;
    margin-bottom: 6px;
  }
  
  .form-group input, .form-group select, .form-group textarea {
    padding: 10px 12px;
    font-size: 0.9rem;
    border-radius: 8px;
  }
  
  .session-duration-info {
    padding: 10px;
    margin-bottom: 18px;
    border-radius: 8px;
  }
  
  .duration-item {
    margin-bottom: 6px;
  }
  
  .duration-label {
    font-size: 0.8rem;
  }
  
  .duration-value {
    font-size: 0.9rem;
  }
  
  .duration-warning {
    font-size: 0.8rem;
    padding: 6px 10px;
    margin-top: 6px;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
  }
  
  .btn-cancel, .btn-create {
    padding: 10px 16px;
    font-size: 0.9rem;
    width: 100%;
    justify-content: center;
    border-radius: 8px;
  }
  
  .error-message {
    font-size: 0.85rem;
    margin-top: 12px;
  }
  
  .loading {
    margin-top: 15px;
  }
  
  .spinner {
    width: 25px;
    height: 25px;
    border-width: 2px;
  }
  
  .loading p {
    font-size: 0.85rem;
  }
}
</style> 