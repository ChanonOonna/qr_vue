<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo">
        <h1>📚 QR Attendance</h1>
        <p>ระบบเช็คชื่อด้วยคิวอาร์โค้ด</p>
      </div>
      
      <div class="login-form">
        <h2>เข้าสู่ระบบสำหรับครู</h2>
        <p class="subtitle">กรุณาเข้าสู่ระบบด้วยบัญชี Google ของมหาวิทยาลัยเกษตรศาสตร์</p>
        
        <button 
          @click="handleLogin" 
          :disabled="authStore.loading"
          class="login-btn"
        >
          <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" class="google-icon">
          เข้าสู่ระบบด้วย Google (@ku.th)
        </button>
        
        <!-- Student Section -->
        <div class="student-section">
          <p>สำหรับนักเรียน</p>
          <button 
            @click="goToScanQR" 
            class="student-btn"
          >
            📱 เช็คชื่อเข้าชั้นเรียน
          </button>
        </div>
        
        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>
        
        <div v-if="authStore.loading" class="loading">
          <div class="spinner"></div>
          <p>กำลังเข้าสู่ระบบ...</p>
        </div>

        <!-- Face Models Loading Status -->
        <div v-if="modelsLoading" class="models-loading">
          <div class="spinner"></div>
          <p>กำลังโหลดโมเดลใบหน้า...</p>
          <p class="models-note">(จะโหลดครั้งเดียวและเก็บไว้ในแคช)</p>
        </div>
      </div>
      
      <div class="footer">
        <p>สำหรับครูเท่านั้น • ต้องใช้บัญชี @ku.th</p>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import faceModelsService from '../services/faceModels'

export default {
  name: 'Login',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    const modelsLoading = ref(false)

    const handleLogin = async () => {
      try {
        await authStore.login()
        
        // After successful login, load face models in background
        if (authStore.isAuthenticated) {
          modelsLoading.value = true
          
          // Load models in background (don't block UI)
          faceModelsService.loadModels()
            .then(() => {
              console.log('✅ Face models loaded after login')
            })
            .catch((error) => {
              console.error('❌ Failed to load face models:', error)
              // Don't show error to user - models will be loaded when needed
            })
            .finally(() => {
              modelsLoading.value = false
            })
        }
      } catch (error) {
        console.error('Login failed:', error)
      }
    }

    const goToScanQR = () => {
      router.push('/scanqr')
    }

    onMounted(async () => {
      // Don't check auth on login page - let user click login button
      // Auth check is handled by router guards
    })

    return {
      authStore,
      modelsLoading,
      handleLogin,
      goToScanQR
    }
  }
}
</script>

<style scoped>
/* Styles are already included in main.css */

.student-section {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 2px solid #e1e8ed;
  text-align: center;
}

.student-section p {
  color: #666;
  font-size: 1rem;
  margin-bottom: 15px;
  font-weight: 500;
}

.student-btn {
  background: #27ae60;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.student-btn:hover {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.student-btn:active {
  transform: translateY(0);
}

.models-loading {
  margin-top: 20px;
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.models-loading .spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #4285f4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

.models-note {
  font-size: 0.8rem;
  color: #666;
  margin-top: 5px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 