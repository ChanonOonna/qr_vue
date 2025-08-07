<template>
  <div class="face-registration-container">
    <div class="face-registration-card">
      <div class="face-registration-header">
        <h1>🧑‍💻 ลงทะเบียนใบหน้า</h1>
        <p>สำหรับนักเรียน</p>
      </div>

      <div class="face-registration-content">
        <!-- Student Info Form -->
        <div class="student-info-section">
          <h3>ข้อมูลนักเรียน</h3>
          <form @submit.prevent="handleSubmit" class="student-form">
            <div class="form-group">
              <label for="studentCode">รหัสนิสิต *</label>
              <input 
                v-model="studentForm.student_code" 
                type="text" 
                id="studentCode" 
                required 
                placeholder="กรอกรหัสนิสิต"
              >
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">ชื่อ *</label>
                <input 
                  v-model="studentForm.firstname" 
                  type="text" 
                  id="firstName" 
                  required 
                  placeholder="กรอกชื่อ"
                >
              </div>
              <div class="form-group">
                <label for="lastName">นามสกุล *</label>
                <input 
                  v-model="studentForm.lastname" 
                  type="text" 
                  id="lastName" 
                  required 
                  placeholder="กรอกนามสกุล"
                >
              </div>
            </div>
          </form>
        </div>

        <!-- Camera Section -->
        <div class="camera-section">
          <h3>ถ่ายภาพใบหน้า</h3>
          <div class="camera-container" ref="cameraContainer">
            <video ref="video" autoplay playsinline></video>
            <canvas ref="canvas" style="display: none;"></canvas>
            <div class="camera-overlay">
              <div class="face-frame"></div>
            </div>
          </div>
          
          <div class="camera-controls">
            <button 
              @click="startCamera" 
              :disabled="isCameraActive || loading"
              class="btn btn-primary"
            >
              📷 เปิดกล้อง
            </button>
            <button 
              @click="captureFace" 
              :disabled="!isCameraActive || loading"
              class="btn btn-success"
            >
              📸 ถ่ายภาพ
            </button>
            <button 
              @click="stopCamera" 
              :disabled="!isCameraActive"
              class="btn btn-secondary"
            >
              ⏹️ ปิดกล้อง
            </button>
          </div>
        </div>

        <!-- Captured Image -->
        <div v-if="capturedImage" class="captured-image-section">
          <h3>ภาพที่ถ่าย</h3>
          <div class="captured-image">
            <img :src="capturedImage" alt="Captured face" />
          </div>
          <button @click="retakePhoto" class="btn btn-secondary">
            📷 ถ่ายใหม่
          </button>
        </div>

        <!-- Submit Button -->
        <div v-if="capturedImage" class="submit-section">
          <button 
            @click="registerFace" 
            :disabled="loading"
            class="btn btn-primary btn-large"
          >
            🎯 ลงทะเบียนใบหน้า
          </button>
        </div>

        <!-- Result Message -->
        <div v-if="resultMessage" class="result-message" :class="resultClass">
          {{ resultMessage }}
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>กำลังประมวลผล...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { faceService } from '../services/face'
import { showNotification } from '../utils/helpers'

export default {
  name: 'FaceRegistration',
  setup() {
    const video = ref(null)
    const canvas = ref(null)
    const cameraContainer = ref(null)
    const isCameraActive = ref(false)
    const loading = ref(false)
    const capturedImage = ref('')
    const resultMessage = ref('')
    const resultClass = ref('')
    
    let stream = null

    const studentForm = reactive({
      student_code: '',
      firstname: '',
      lastname: ''
    })

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        })
        
        if (video.value) {
          video.value.srcObject = stream
        }
        
        isCameraActive.value = true
        resultMessage.value = ''
        
      } catch (error) {
        console.error('Failed to start camera:', error)
        resultMessage.value = 'ไม่สามารถเข้าถึงกล้องได้'
        resultClass.value = 'result-error'
      }
    }

    const stopCamera = () => {
      isCameraActive.value = false
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        stream = null
      }
      
      if (video.value) {
        video.value.srcObject = null
      }
    }

    const captureFace = () => {
      if (!video.value || !canvas.value) return
      
      const context = canvas.value.getContext('2d')
      canvas.value.width = video.value.videoWidth
      canvas.value.height = video.value.videoHeight
      
      context.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height)
      
      capturedImage.value = canvas.value.toDataURL('image/jpeg', 0.8)
    }

    const retakePhoto = () => {
      capturedImage.value = ''
      resultMessage.value = ''
    }

    const validateForm = () => {
      if (!studentForm.student_code.trim()) {
        resultMessage.value = 'กรุณากรอกรหัสนิสิต'
        resultClass.value = 'result-error'
        return false
      }
      
      if (!studentForm.firstname.trim()) {
        resultMessage.value = 'กรุณากรอกชื่อ'
        resultClass.value = 'result-error'
        return false
      }
      
      if (!studentForm.lastname.trim()) {
        resultMessage.value = 'กรุณากรอกนามสกุล'
        resultClass.value = 'result-error'
        return false
      }
      
      if (!capturedImage.value) {
        resultMessage.value = 'กรุณาถ่ายภาพใบหน้า'
        resultClass.value = 'result-error'
        return false
      }
      
      return true
    }

    const registerFace = async () => {
      if (!validateForm()) return
      
      try {
        loading.value = true
        resultMessage.value = ''
        
        // Convert base64 image to blob
        const response = await fetch(capturedImage.value)
        const blob = await response.blob()
        
        const formData = new FormData()
        formData.append('student_code', studentForm.student_code)
        formData.append('firstname', studentForm.firstname)
        formData.append('lastname', studentForm.lastname)
        formData.append('face_image', blob, 'face.jpg')
        
        await faceService.registerFace(formData)
        
        resultMessage.value = 'ลงทะเบียนใบหน้าสำเร็จ'
        resultClass.value = 'result-success'
        
        // Reset form
        Object.assign(studentForm, {
          student_code: '',
          firstname: '',
          lastname: ''
        })
        capturedImage.value = ''
        
        showNotification('ลงทะเบียนใบหน้าสำเร็จ', 'success')
        
      } catch (error) {
        console.error('Failed to register face:', error)
        resultMessage.value = error.message || 'เกิดข้อผิดพลาดในการลงทะเบียนใบหน้า'
        resultClass.value = 'result-error'
      } finally {
        loading.value = false
      }
    }

    const handleSubmit = (e) => {
      e.preventDefault()
      // Form validation is handled in registerFace
    }

    onMounted(async () => {
      // Load face-api.js if not already loaded
      if (typeof faceapi === 'undefined') {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = '/js/face-api.min.js'
          script.onload = () => {
            // Set face-api to use CPU backend instead of WebGL
            if (typeof faceapi !== 'undefined') {
              faceapi.env.setBrowserEnv()
              faceapi.env.setBackend('cpu')
            }
            resolve()
          }
          script.onerror = reject
          document.head.appendChild(script)
        })
      } else {
        // Set face-api to use CPU backend
        faceapi.env.setBrowserEnv()
        faceapi.env.setBackend('cpu')
      }
    })

    onUnmounted(() => {
      stopCamera()
    })

    return {
      video,
      canvas,
      cameraContainer,
      isCameraActive,
      loading,
      capturedImage,
      resultMessage,
      resultClass,
      studentForm,
      startCamera,
      stopCamera,
      captureFace,
      retakePhoto,
      registerFace,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.face-registration-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.face-registration-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

.face-registration-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 40px 20px;
}

.face-registration-header h1 {
  font-size: 2rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.face-registration-header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.face-registration-content {
  padding: 40px 30px;
}

.student-info-section {
  margin-bottom: 30px;
}

.student-info-section h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.3rem;
  font-weight: 600;
}

.student-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
}

.form-group {
  margin-bottom: 20px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.camera-section {
  margin-bottom: 30px;
}

.camera-section h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.3rem;
  font-weight: 600;
}

.camera-container {
  position: relative;
  width: 100%;
  height: 400px;
  background: #f8f9fa;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}

video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
}

.camera-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.face-frame {
  width: 250px;
  height: 250px;
  border: 3px solid #4285f4;
  border-radius: 50%;
  position: relative;
}

.face-frame::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border: 2px solid rgba(66, 133, 244, 0.3);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.camera-controls {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
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

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #229954;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
  transform: translateY(-2px);
}

.btn-large {
  padding: 15px 30px;
  font-size: 1.1rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.captured-image-section {
  margin-bottom: 30px;
  text-align: center;
}

.captured-image-section h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.3rem;
  font-weight: 600;
}

.captured-image {
  margin-bottom: 20px;
}

.captured-image img {
  max-width: 300px;
  max-height: 300px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.submit-section {
  text-align: center;
  margin-bottom: 20px;
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
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .camera-controls {
    flex-direction: column;
  }
  
  .camera-container {
    height: 300px;
  }
  
  .face-frame {
    width: 200px;
    height: 200px;
  }
}
</style> 