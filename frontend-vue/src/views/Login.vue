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
        
        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>
        
        <div v-if="authStore.loading" class="loading">
          <div class="spinner"></div>
          <p>กำลังเข้าสู่ระบบ...</p>
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
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'Login',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()

    const handleLogin = async () => {
      try {
        await authStore.login()
      } catch (error) {
        console.error('Login failed:', error)
      }
    }

    onMounted(async () => {
      // Don't check auth on login page - let user click login button
      // Auth check is handled by router guards
    })

    return {
      authStore,
      handleLogin
    }
  }
}
</script>

<style scoped>
/* Styles are already included in main.css */
</style> 