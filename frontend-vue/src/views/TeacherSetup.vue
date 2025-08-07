<template>
  <div class="teacher-setup-container">
    <div class="teacher-setup-card">
      <div class="teacher-setup-header">
        <h1>⚙️ ตั้งค่ารหัสครู</h1>
        <p>สำหรับการสร้าง QR Code</p>
      </div>

      <div class="teacher-setup-content">
        <div class="teacher-info">
          <h3>ข้อมูลครู</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>อีเมล:</label>
              <span>{{ authStore.userInfo?.email || '-' }}</span>
            </div>
            <div class="info-item">
              <label>ชื่อ:</label>
              <span>{{ authStore.userInfo?.name || '-' }}</span>
            </div>
            <div class="info-item">
              <label>รหัสครูปัจจุบัน:</label>
              <span>{{ authStore.userInfo?.teacher_code || 'ยังไม่ได้ตั้งค่า' }}</span>
            </div>
          </div>
        </div>

        <div class="setup-form">
          <h3>ตั้งค่ารหัสครู</h3>
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="teacherCode">รหัสครู *</label>
              <input 
                v-model="teacherCode" 
                type="text" 
                id="teacherCode" 
                required 
                placeholder="กรอกรหัสครู เช่น T001"
                maxlength="10"
              >
              <small>รหัสครูจะใช้ในการสร้าง QR Code และระบุตัวตนของครู</small>
            </div>
            
            <div class="form-actions">
              <button 
                type="button" 
                @click="goBack" 
                class="btn btn-secondary"
              >
                ← กลับ
              </button>
              <button 
                type="submit" 
                :disabled="authStore.loading"
                class="btn btn-primary"
              >
                💾 บันทึก
              </button>
            </div>
          </form>
        </div>

        <!-- Result Message -->
        <div v-if="resultMessage" class="result-message" :class="resultClass">
          {{ resultMessage }}
        </div>

        <!-- Loading -->
        <div v-if="authStore.loading" class="loading">
          <div class="spinner"></div>
          <p>กำลังบันทึกข้อมูล...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { showNotification } from '../utils/helpers'

export default {
  name: 'TeacherSetup',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    
    const teacherCode = ref('')
    const resultMessage = ref('')
    const resultClass = ref('')

    const handleSubmit = async () => {
      if (!teacherCode.value.trim()) {
        resultMessage.value = 'กรุณากรอกรหัสครู'
        resultClass.value = 'result-error'
        return
      }
      
      try {
        await authStore.updateTeacherCode(teacherCode.value.trim())
        resultMessage.value = 'บันทึกรหัสครูสำเร็จ'
        resultClass.value = 'result-success'
        showNotification('บันทึกรหัสครูสำเร็จ', 'success')
        
        // Redirect to dashboard after successful update
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
        
      } catch (error) {
        console.error('Failed to update teacher code:', error)
        resultMessage.value = error.message || 'เกิดข้อผิดพลาดในการบันทึกรหัสครู'
        resultClass.value = 'result-error'
      }
    }

    const goBack = () => {
      router.push('/dashboard')
    }

    onMounted(() => {
      // Pre-fill with existing teacher code if available
      if (authStore.userInfo?.teacher_code) {
        teacherCode.value = authStore.userInfo.teacher_code
      }
    })

    return {
      authStore,
      teacherCode,
      resultMessage,
      resultClass,
      handleSubmit,
      goBack
    }
  }
}
</script>

<style scoped>
.teacher-setup-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.teacher-setup-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

.teacher-setup-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 40px 20px;
}

.teacher-setup-header h1 {
  font-size: 2rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.teacher-setup-header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.teacher-setup-content {
  padding: 40px 30px;
}

.teacher-info {
  margin-bottom: 30px;
}

.teacher-info h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.3rem;
  font-weight: 600;
}

.info-grid {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e1e8ed;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 600;
  color: #333;
  min-width: 120px;
}

.info-item span {
  color: #666;
  font-weight: 500;
}

.setup-form {
  margin-bottom: 30px;
}

.setup-form h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.3rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #4285f4;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #4285f4;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3367d6;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.result-message {
  padding: 20px;
  border-radius: 10px;
  margin-top: 20px;
  text-align: center;
  font-weight: 600;
}

.result-success {
  background: #d5f4e6;
  color: #27ae60;
  border: 2px solid #27ae60;
}

.result-error {
  background: #fadbd8;
  color: #e74c3c;
  border: 2px solid #e74c3c;
}

.loading {
  text-align: center;
  padding: 20px;
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

@media (max-width: 768px) {
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style> 