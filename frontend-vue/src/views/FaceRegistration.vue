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
                placeholder="กรอกรหัสนิสิต 10 หลัก"
                :class="{ 'error': studentCodeError }"
              >
              <div v-if="studentCodeError" class="error-message">
                {{ studentCodeError }}
              </div>
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
          <h3>ตรวจจับใบหน้า</h3>
          <div class="camera-container" ref="cameraContainer">
            <video ref="video" autoplay playsinline></video>
            <canvas ref="canvas" style="display: none;"></canvas>
            <canvas ref="overlay" class="face-overlay"></canvas>
            <div class="camera-overlay">
              <div class="face-frame"></div>
            </div>
          </div>
          
          <div class="camera-controls">
            <button 
              @click="startCamera" 
              :disabled="!isFormValid || isCameraActive || loading"
              class="btn btn-primary"
            >
              📷 เปิดกล้อง
            </button>
            <button 
              @click="registerFace" 
              :disabled="!isCameraActive || !isFaceDetected || loading"
              class="btn btn-success"
            >
              🎯 ลงทะเบียนใบหน้า
            </button>
            <button 
              @click="stopCamera" 
              :disabled="!isCameraActive"
              class="btn btn-secondary"
            >
              ⏹️ ปิดกล้อง
            </button>
          </div>
          
          <!-- Face Detection Status -->
          <div v-if="isCameraActive" class="face-status">
            <div v-if="isFaceDetected" class="status-success">
              ✅ ตรวจพบใบหน้า - พร้อมลงทะเบียน
            </div>
            <div v-else class="status-waiting">
              🔍 กำลังตรวจจับใบหน้า...
            </div>
          </div>
          
          <!-- Registration Progress -->
          <div v-if="loading" class="registration-progress">
            <div class="progress-spinner"></div>
            <p>{{ resultMessage }}</p>
          </div>
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
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { faceService } from '../services/face'
import { showNotification } from '../utils/helpers'

export default {
  name: 'FaceRegistration',
  setup() {
    const video = ref(null)
    const canvas = ref(null)
    const overlay = ref(null)
    const cameraContainer = ref(null)
    const isCameraActive = ref(false)
    const isFaceDetected = ref(false)
    const loading = ref(false)
    const resultMessage = ref('')
    const resultClass = ref('')
    
    let stream = null
    let faceDetectionInterval = null

    const studentForm = reactive({
      student_code: '',
      firstname: '',
      lastname: ''
    })

    // Check if form is valid
    const isFormValid = computed(() => {
      const hasStudentCode = studentForm.student_code.trim()
      const hasFirstName = studentForm.firstname.trim()
      const hasLastName = studentForm.lastname.trim()
      const isValidStudentCode = /^\d{10}$/.test(studentForm.student_code.trim())
      
      return hasStudentCode && hasFirstName && hasLastName && isValidStudentCode
    })

    // Student code validation error
    const studentCodeError = computed(() => {
      const code = studentForm.student_code.trim()
      if (!code) return ''
      if (!/^\d{10}$/.test(code)) {
        return 'รหัสนิสิตต้องเป็นตัวเลข 10 หลัก'
      }
      return ''
    })

    const startCamera = async () => {
      if (!isFormValid.value) {
        resultMessage.value = 'กรุณากรอกข้อมูลให้ครบก่อนเปิดกล้อง'
        resultClass.value = 'result-error'
        return
      }

      try {
        // Check if student already exists
        loading.value = true
        resultMessage.value = 'กำลังตรวจสอบข้อมูล...'
        resultClass.value = ''
        
        await faceService.checkStudentExists({
          student_code: studentForm.student_code,
          firstname: studentForm.firstname,
          lastname: studentForm.lastname
        })
        
        // If we get here, student doesn't exist (backend returns error if exists)
        
        // If student doesn't exist, proceed with camera
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
        isFaceDetected.value = false
        resultMessage.value = ''
        
        // Start face detection
        startFaceDetection()
        
      } catch (error) {
        console.error('Failed to start camera:', error)
        // Handle backend validation errors
        if (error.response?.data?.error) {
          resultMessage.value = error.response.data.error
        } else {
          resultMessage.value = error.message || 'ไม่สามารถเข้าถึงกล้องได้'
        }
        resultClass.value = 'result-error'
      } finally {
        loading.value = false
      }
    }

    const stopCamera = () => {
      isCameraActive.value = false
      isFaceDetected.value = false
      
      if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval)
        faceDetectionInterval = null
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        stream = null
      }
      
      if (video.value) {
        video.value.srcObject = null
      }
      
      // Clear overlay
      if (overlay.value) {
        const ctx = overlay.value.getContext('2d')
        ctx.clearRect(0, 0, overlay.value.width, overlay.value.height)
      }
    }

    const startFaceDetection = () => {
      if (!video.value || !overlay.value) return
      
      // Set canvas size
      overlay.value.width = video.value.videoWidth || 640
      overlay.value.height = video.value.videoHeight || 480
      
      let lastDetectionTime = 0
      const detectionInterval = 300 // เพิ่มเป็น 300ms เพื่อลดการประมวลผล
      let detectionCount = 0
      
      faceDetectionInterval = setInterval(async () => {
        if (!video.value || !overlay.value || !isCameraActive.value) return
        
        const now = Date.now()
        if (now - lastDetectionTime < detectionInterval) return
        lastDetectionTime = now
        
        detectionCount++
        
        try {
          // ใช้ TinyFaceDetectorOptions ที่เร็วขึ้น
          const detection = await faceapi.detectSingleFace(
            video.value, 
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 224, // ลดขนาด input
              scoreThreshold: 0.5 // เพิ่ม threshold
            })
          ).withFaceLandmarks().withFaceDescriptor()
          
          if (detection) {
            isFaceDetected.value = true
            drawFaceFrame(detection)
          } else {
            isFaceDetected.value = false
            clearFaceFrame()
          }
        } catch (error) {
          console.error('Face detection error:', error)
          isFaceDetected.value = false
          clearFaceFrame()
        }
      }, detectionInterval)
    }

    const drawFaceFrame = (detection) => {
      if (!overlay.value) return
      
      const ctx = overlay.value.getContext('2d')
      ctx.clearRect(0, 0, overlay.value.width, overlay.value.height)
      
      const { box } = detection.detection
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 3
      ctx.strokeRect(box.x, box.y, box.width, box.height)
      
      // Draw status text
      ctx.fillStyle = '#00ff00'
      ctx.font = '16px Arial'
      ctx.fillText('✅ ตรวจพบใบหน้า', 10, 30)
    }

    const clearFaceFrame = () => {
      if (!overlay.value) return
      
      const ctx = overlay.value.getContext('2d')
      ctx.clearRect(0, 0, overlay.value.width, overlay.value.height)
    }

    const validateForm = () => {
      if (!studentForm.student_code.trim()) {
        resultMessage.value = 'กรุณากรอกรหัสนิสิต'
        resultClass.value = 'result-error'
        return false
      }
      
      // Validate student code format (10 digits)
      if (!/^\d{10}$/.test(studentForm.student_code.trim())) {
        resultMessage.value = 'รหัสนิสิตต้องเป็นตัวเลข 10 หลัก'
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
      
      if (!isFaceDetected.value) {
        resultMessage.value = 'กรุณาวางใบหน้าในกรอบกล้อง'
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
        
        // Check if face is currently detected
        if (!isFaceDetected.value) {
          throw new Error('กรุณาวางใบหน้าในกรอบกล้องให้ชัดเจน')
        }
        
        // Capture current frame for face descriptor
        if (!video.value || !canvas.value) {
          throw new Error('ไม่สามารถเข้าถึงกล้องได้')
        }
        
        const context = canvas.value.getContext('2d')
        canvas.value.width = video.value.videoWidth
        canvas.value.height = video.value.videoHeight
        context.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height)
        
        // ใช้ข้อมูลจาก face detection ที่มีอยู่แล้ว
        console.log('Using existing face detection for registration...')
        
        // ใช้ TinyFaceDetectorOptions ที่เร็วขึ้นสำหรับการลงทะเบียน
        const detection = await faceapi.detectSingleFace(
          video.value, 
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5
          })
        ).withFaceLandmarks().withFaceDescriptor()
        
        if (!detection) {
          throw new Error('ไม่พบใบหน้า กรุณาวางใบหน้าในกรอบกล้องให้ชัดเจนและลองใหม่อีกครั้ง')
        }
        
        // Validate face descriptor
        if (!detection.descriptor || detection.descriptor.length !== 128) {
          throw new Error('ข้อมูลใบหน้าไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง')
        }
        
        console.log('Face descriptor length:', detection.descriptor.length)
        
        resultMessage.value = 'กำลังลงทะเบียนใบหน้า...'
        
        const formData = new FormData()
        formData.append('student_id', studentForm.student_code)
        formData.append('first_name', studentForm.firstname)
        formData.append('last_name', studentForm.lastname)
        formData.append('face_descriptor', JSON.stringify(Array.from(detection.descriptor)))
        
        await faceService.registerFace(formData)
        
        resultMessage.value = 'ลงทะเบียนใบหน้าสำเร็จ'
        resultClass.value = 'result-success'
        
        // Reset form
        Object.assign(studentForm, {
          student_code: '',
          firstname: '',
          lastname: ''
        })
        
        // Stop camera
        stopCamera()
        
        showNotification('ลงทะเบียนใบหน้าสำเร็จ', 'success')
        
      } catch (error) {
        console.error('Failed to register face:', error)
        // Handle backend validation errors
        if (error.response?.data?.message) {
          resultMessage.value = error.response.data.message
        } else if (error.response?.data?.error) {
          resultMessage.value = error.response.data.error
        } else {
          resultMessage.value = error.message || 'เกิดข้อผิดพลาดในการลงทะเบียนใบหน้า'
        }
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
            // Load required models
            Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
              faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
              faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]).then(() => {
              console.log('Face API models loaded successfully')
              resolve()
            }).catch(reject)
          }
          script.onerror = reject
          document.head.appendChild(script)
        })
      } else {
        // Models already loaded, just ensure they're available
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
          ])
          console.log('Face API models loaded successfully')
        } catch (error) {
          console.log('Models already loaded or loading failed:', error)
        }
      }
    })

    onUnmounted(() => {
      stopCamera()
    })

    return {
      video,
      canvas,
      overlay,
      cameraContainer,
      isCameraActive,
      isFaceDetected,
      loading,
      resultMessage,
      resultClass,
      studentForm,
      isFormValid,
      studentCodeError,
      startCamera,
      stopCamera,
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

.form-group input.error {
  border-color: #e74c3c;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 5px;
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

.face-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
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
  pointer-events: none;
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
  margin-bottom: 20px;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.face-status {
  text-align: center;
  padding: 15px;
  border-radius: 8px;
  font-weight: 600;
}

.status-success {
  background: #d5f4e6;
  color: #27ae60;
  border: 2px solid #27ae60;
}

.status-waiting {
  background: #fff3cd;
  color: #856404;
  border: 2px solid #ffc107;
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

.registration-progress {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-top: 20px;
}

.progress-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4285f4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
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