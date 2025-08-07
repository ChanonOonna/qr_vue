<template>
  <div class="scan-container">
    <div class="scan-card">
      <!-- Header -->
      <div class="scan-header">
        <h1>📱 เช็คชื่อเข้าชั้นเรียน</h1>
        <p>สแกน QR Code และยืนยันตัวตนด้วยใบหน้า</p>
      </div>

      <div class="scan-content">
        <!-- QR Code Scanning Section -->
        <div class="scan-section">
          <h3>🔍 สแกน QR Code</h3>
          
          <!-- Camera Container -->
          <div class="camera-container" ref="cameraContainer">
            <video ref="video" autoplay muted playsinline></video>
            <div class="scan-overlay">
              <div class="scan-frame"></div>
            </div>
          </div>

          <!-- Scan Controls -->
          <div class="scan-controls">
            <button 
              v-if="!isScanning" 
              @click="startScanning" 
              class="btn btn-primary"
              :disabled="loading"
            >
              📷 เริ่มสแกน QR Code
            </button>
            <button 
              v-else 
              @click="stopScanning" 
              class="btn btn-secondary"
            >
              ⏹️ หยุดสแกน
            </button>
          </div>

          <!-- Manual QR Token Input -->
          <div class="manual-input">
            <h4>หรือกรอก QR Token เอง</h4>
            <div class="input-group">
              <input 
                v-model="manualToken" 
                type="text" 
                placeholder="กรอก QR Token"
                @keyup.enter="submitManualToken"
                :disabled="loading"
              >
              <button 
                @click="submitManualToken" 
                class="btn btn-primary"
                :disabled="loading || !manualToken.trim()"
              >
                ส่ง
              </button>
            </div>
          </div>
        </div>

        <!-- Session Info Section -->
        <div v-if="sessionInfo" class="session-info-section">
          <h3>📚 ข้อมูลวิชา</h3>
          <div class="session-details">
            <div class="detail-row">
              <span class="label">รหัสวิชา:</span>
              <span class="value">{{ sessionInfo.subject_code }}</span>
            </div>
            <div class="detail-row">
              <span class="label">ชื่อวิชา:</span>
              <span class="value">{{ sessionInfo.subject_name }}</span>
            </div>
            <div class="detail-row">
              <span class="label">อาจารย์:</span>
              <span class="value">{{ sessionInfo.teacher_code }}</span>
            </div>
            <div class="detail-row">
              <span class="label">กลุ่ม:</span>
              <span class="value">{{ sessionInfo.class_group }}</span>
            </div>
            <div class="detail-row">
              <span class="label">เวลาเริ่ม:</span>
              <span class="value">{{ formatDateTime(sessionInfo.start_time) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">เวลาสาย:</span>
              <span class="value">{{ formatDateTime(sessionInfo.start_time, sessionInfo.late_minute) }}</span>
            </div>
          </div>
        </div>

        <!-- Student Info Form -->
        <div v-if="sessionInfo" class="student-form-section">
          <h3>👤 ข้อมูลนักเรียน</h3>
          <form @submit.prevent="submitStudentInfo" class="student-form">
            <div class="form-group">
              <label for="studentCode">รหัสนิสิต *</label>
              <input 
                id="studentCode"
                v-model="studentForm.student_code" 
                type="text" 
                required
                :disabled="loading"
                placeholder="กรอกรหัสนิสิต"
              >
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">ชื่อ *</label>
                <input 
                  id="firstName"
                  v-model="studentForm.firstname" 
                  type="text" 
                  required
                  :disabled="loading"
                  placeholder="กรอกชื่อ"
                >
              </div>
              <div class="form-group">
                <label for="lastName">นามสกุล *</label>
                <input 
                  id="lastName"
                  v-model="studentForm.lastname" 
                  type="text" 
                  required
                  :disabled="loading"
                  placeholder="กรอกนามสกุล"
                >
              </div>
            </div>

            <button 
              type="submit" 
              class="btn btn-success"
              :disabled="loading || !isFormValid"
            >
              {{ loading ? 'กำลังประมวลผล...' : 'ส่งข้อมูล' }}
            </button>
          </form>
        </div>

        <!-- Face Verification Modal -->
        <div v-if="showFaceModal" class="face-modal">
          <div class="face-modal-content">
            <h3>📸 ยืนยันตัวตนด้วยใบหน้า</h3>
            
            <div class="face-camera-container">
              <video ref="faceVideo" autoplay muted playsinline></video>
              <canvas id="faceCanvas" class="face-canvas"></canvas>
              <div class="face-overlay">
                <div class="face-frame"></div>
              </div>
            </div>

            <div class="liveness-instructions">
              <p>กรุณาทำตามนี้:</p>
              <div class="instruction-details">
                <p class="instruction-note">ขยับหัว 2 ครั้ง • กระพริบตา 3 ครั้ง • ยิ้ม 1 ครั้ง</p>
              </div>
              <ul>
                <li :class="{ completed: livenessState.headMovement.done }">
                  <span class="action-text">ขยับหัว</span>
                  <span class="progress-text">({{ livenessState.headMovement.completed }}/{{ livenessState.headMovement.required }})</span>
                </li>
                <li :class="{ completed: livenessState.blink.done }">
                  <span class="action-text">กระพริบตา</span>
                  <span class="progress-text">({{ livenessState.blink.completed }}/{{ livenessState.blink.required }})</span>
                </li>
                <li :class="{ completed: livenessState.smile.done }">
                  <span class="action-text">ยิ้ม</span>
                  <span class="progress-text">({{ livenessState.smile.completed }}/{{ livenessState.smile.required }})</span>
                </li>
              </ul>
            </div>

            <div class="face-controls">
              <button @click="startFaceVerification" class="btn btn-primary" :disabled="loading">
                {{ loading ? 'กำลังโหลดโมเดล...' : 'เริ่มยืนยันใบหน้า' }}
              </button>
              <button @click="cancelFaceVerification" class="btn btn-secondary">
                ยกเลิก
              </button>
            </div>
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { attendanceService } from '../services/attendance'
import { formatDateTime, showNotification } from '../utils/helpers'

export default {
  name: 'ScanQR',
  setup() {
    // Refs
    const video = ref(null)
    const faceVideo = ref(null)
    const cameraContainer = ref(null)
    
    // State
    const isScanning = ref(false)
    const loading = ref(false)
    const manualToken = ref('')
    const sessionInfo = ref(null)
    const resultMessage = ref('')
    const resultClass = ref('')
    const showFaceModal = ref(false)
    
    // Face verification state
    const livenessState = reactive({
      headMovement: { required: 2, completed: 0, done: false },
      blink: { required: 3, completed: 0, done: false },
      smile: { required: 1, completed: 0, done: false }
    })
    
    // Form data
    const studentForm = reactive({
      student_code: '',
      firstname: '',
      lastname: ''
    })
    
    // Streams
    let qrStream = null
    let faceStream = null
    let scanInterval = null
    let faceInterval = null
    
    // Computed
    const isFormValid = computed(() => {
      return studentForm.student_code.trim() && 
             studentForm.firstname.trim() && 
             studentForm.lastname.trim()
    })
    
    // Methods
    const startScanning = async () => {
      try {
        isScanning.value = true
        resultMessage.value = ''
        
        // Check camera support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('อุปกรณ์ของคุณไม่รองรับการใช้งานกล้อง')
        }
        
        // Request camera access
        qrStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        })
        
        if (video.value) {
          video.value.srcObject = qrStream
        }
        
        // Start scanning
        scanInterval = setInterval(scanQRCode, 1000)
        
      } catch (error) {
        console.error('Failed to start camera:', error)
        resultMessage.value = 'ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง'
        resultClass.value = 'result-error'
        isScanning.value = false
      }
    }

    const stopScanning = () => {
      isScanning.value = false
      
      if (scanInterval) {
        clearInterval(scanInterval)
        scanInterval = null
      }
      
      if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop())
        qrStream = null
      }
      
      if (video.value) {
        video.value.srcObject = null
      }
    }

    const scanQRCode = () => {
      if (!video.value || !isScanning.value) return
      
      // Check if jsQR is loaded
      if (typeof jsQR === 'undefined') {
        console.log('jsQR not loaded yet, retrying...')
        setTimeout(scanQRCode, 100)
        return
      }
      
      // Check if video is ready
      if (video.value.videoWidth === 0 || video.value.videoHeight === 0) {
        console.log('Video not ready yet, retrying...')
        setTimeout(scanQRCode, 100)
        return
      }
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      canvas.width = video.value.videoWidth
      canvas.height = video.value.videoHeight
      
      context.drawImage(video.value, 0, 0, canvas.width, canvas.height)
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      
      // Use jsQR to detect QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      
      if (code) {
        console.log('QR Code detected:', code.data)
        stopScanning()
        processQRCode(code.data)
      }
    }

    const processQRCode = async (qrData) => {
      try {
        loading.value = true
        resultMessage.value = ''
        
        // Extract QR token from the data
        const qrToken = qrData.trim()
        console.log('QR Token scanned:', qrToken)
        
        // Get session info using QR token
        const response = await attendanceService.getSessionByToken(qrToken)
        console.log('Session response:', response)
        sessionInfo.value = response.session
        
        resultMessage.value = 'พบ QR Code แล้ว กรุณากรอกข้อมูลนักเรียน'
        resultClass.value = 'result-success'
        
      } catch (error) {
        console.error('Failed to process QR code:', error)
        console.error('Error response:', error.response?.data)
        resultMessage.value = error.response?.data?.error || 'QR Code ไม่ถูกต้องหรือหมดอายุแล้ว'
        resultClass.value = 'result-error'
      } finally {
        loading.value = false
      }
    }

    const submitManualToken = async () => {
      if (!manualToken.value.trim()) {
        resultMessage.value = 'กรุณากรอก QR Token'
        resultClass.value = 'result-error'
        return
      }
      
      await processQRCode(manualToken.value.trim())
    }

    const submitStudentInfo = async () => {
      try {
        // Validate form
        if (!isFormValid.value) {
          resultMessage.value = 'กรุณากรอกข้อมูลนิสิตให้ครบถ้วน'
          resultClass.value = 'result-error'
          return
        }
        
        loading.value = true
        resultMessage.value = ''
        
        // Step 1: Validate student data with backend
        const validationData = {
          qr_token: manualToken.value || sessionInfo.value.qr_token,
          student_id: studentForm.student_code,
          firstname: studentForm.firstname,
          lastname: studentForm.lastname
        }
        
        // Call backend to validate student data
        const validationResult = await attendanceService.validateStudentData(validationData)
        
        // If validation passes, show face verification modal
        showFaceModal.value = true
        
      } catch (error) {
        console.error('Failed to submit student info:', error)
        resultMessage.value = error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล'
        resultClass.value = 'result-error'
        loading.value = false
      }
    }

    const startFaceVerification = async () => {
      try {
        // Check if face-api models are loaded
        if (typeof faceapi === 'undefined') {
          throw new Error('Face API not loaded')
        }
        
        // Ensure models are loaded
        if (!faceapi.nets.tinyFaceDetector.isLoaded) {
          console.log('Loading face detection models...')
          await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        }
        if (!faceapi.nets.faceLandmark68Net.isLoaded) {
          await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        }
        if (!faceapi.nets.faceExpressionNet.isLoaded) {
          await faceapi.nets.faceExpressionNet.loadFromUri('/models')
        }
        if (!faceapi.nets.faceRecognitionNet.isLoaded) {
          await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        }
        
        console.log('All models loaded, starting face verification...')
        
        // Reset liveness state
        Object.assign(livenessState, {
          headMovement: { required: 2, completed: 0, done: false },
          blink: { required: 3, completed: 0, done: false },
          smile: { required: 1, completed: 0, done: false }
        })
        
        // Reset trackers
        window.headMovementTracker = null
        window.blinkTracker = null
        window.smileTracker = null
        
        // Start face camera
        faceStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        })
        
        if (faceVideo.value) {
          faceVideo.value.srcObject = faceStream
        }
        
        // Start liveness detection with higher frequency
        faceInterval = setInterval(detectLiveness, 100) // 10 FPS for better detection
        
      } catch (error) {
        console.error('Failed to start face verification:', error)
        resultMessage.value = 'ไม่สามารถเริ่มการยืนยันใบหน้าได้: ' + error.message
        resultClass.value = 'result-error'
        cancelFaceVerification()
      }
    }

    const detectLiveness = async () => {
      if (!faceVideo.value || typeof faceapi === 'undefined') return
      
      try {
        // Detect face with landmarks and expressions
        const detection = await faceapi.detectSingleFace(faceVideo.value, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions()
          .withFaceDescriptor()
        
        if (detection) {
          // Draw face frame on canvas
          drawFaceFrame(detection)
          
          // Head movement detection - track face position changes
          const landmarks = detection.landmarks
          const nose = landmarks.getNose()[3] // Center of nose
          
          if (!livenessState.headMovement.done) {
            // Track head movement by monitoring nose position
            if (!window.headMovementTracker) {
              window.headMovementTracker = {
                positions: [],
                lastCheck: Date.now()
              }
            }
            
            const now = Date.now()
            window.headMovementTracker.positions.push({
              x: nose.x,
              y: nose.y,
              time: now
            })
            
            // Keep only last 2 seconds of data
            window.headMovementTracker.positions = window.headMovementTracker.positions.filter(
              pos => now - pos.time < 2000
            )
            
            // Check if there's significant movement
            if (window.headMovementTracker.positions.length > 10) {
              const firstPos = window.headMovementTracker.positions[0]
              const lastPos = window.headMovementTracker.positions[window.headMovementTracker.positions.length - 1]
              const distance = Math.sqrt(
                Math.pow(lastPos.x - firstPos.x, 2) + Math.pow(lastPos.y - firstPos.y, 2)
              )
              
              if (distance > 30) { // Threshold for head movement
                livenessState.headMovement.completed++
                window.headMovementTracker.positions = [] // Reset for next movement
                if (livenessState.headMovement.completed >= livenessState.headMovement.required) {
                  livenessState.headMovement.done = true
                }
              }
            }
          }
          
          // Blink detection using Eye Aspect Ratio (EAR)
          const leftEye = landmarks.getLeftEye()
          const rightEye = landmarks.getRightEye()
          const leftEAR = calculateEyeAspectRatio(leftEye)
          const rightEAR = calculateEyeAspectRatio(rightEye)
          const avgEAR = (leftEAR + rightEAR) / 2
          
          if (!livenessState.blink.done) {
            if (!window.blinkTracker) {
              window.blinkTracker = {
                lastEAR: avgEAR,
                blinkCount: 0,
                lastBlinkTime: 0
              }
            }
            
            // Detect blink when EAR drops below threshold
            if (avgEAR < 0.25 && window.blinkTracker.lastEAR >= 0.25) {
              const now = Date.now()
              // Prevent multiple detections of the same blink
              if (now - window.blinkTracker.lastBlinkTime > 500) {
                livenessState.blink.completed++
                window.blinkTracker.lastBlinkTime = now
                if (livenessState.blink.completed >= livenessState.blink.required) {
                  livenessState.blink.done = true
                }
              }
            }
            window.blinkTracker.lastEAR = avgEAR
          }
          
          // Smile detection with expression analysis
          const expressions = detection.expressions
          if (!livenessState.smile.done) {
            if (!window.smileTracker) {
              window.smileTracker = {
                lastHappy: expressions.happy,
                smileCount: 0,
                lastSmileTime: 0
              }
            }
            
            // Detect smile when happy expression increases significantly
            if (expressions.happy > 0.6 && window.smileTracker.lastHappy <= 0.6) {
              const now = Date.now()
              // Prevent multiple detections of the same smile
              if (now - window.smileTracker.lastSmileTime > 1000) {
                livenessState.smile.completed++
                window.smileTracker.lastSmileTime = now
                if (livenessState.smile.completed >= livenessState.smile.required) {
                  livenessState.smile.done = true
                }
              }
            }
            window.smileTracker.lastHappy = expressions.happy
          }
          
          // Check if all liveness checks are complete
          if (livenessState.headMovement.done && livenessState.blink.done && livenessState.smile.done) {
            await completeFaceVerification(detection)
          }
        } else {
          // No face detected
          clearFaceFrame()
          // Reset trackers when no face is detected
          window.headMovementTracker = null
          window.blinkTracker = null
          window.smileTracker = null
        }
      } catch (error) {
        console.error('Liveness detection error:', error)
      }
    }

    const drawFaceFrame = (detection) => {
      const canvas = document.getElementById('faceCanvas')
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      const { box } = detection.detection
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw green frame around detected face
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 3
      ctx.strokeRect(box.x, box.y, box.width, box.height)
      
      // Add status text
      ctx.fillStyle = '#00ff00'
      ctx.font = '16px Arial'
      ctx.fillText('✅ ตรวจพบใบหน้า', 10, 30)
      
      // Add debug information
      const landmarks = detection.landmarks
      const expressions = detection.expressions
      const leftEye = landmarks.getLeftEye()
      const rightEye = landmarks.getRightEye()
      const leftEAR = calculateEyeAspectRatio(leftEye)
      const rightEAR = calculateEyeAspectRatio(rightEye)
      const avgEAR = (leftEAR + rightEAR) / 2
      
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Arial'
      ctx.fillText(`EAR: ${avgEAR.toFixed(3)} (Blink: <0.25)`, 10, 50)
      ctx.fillText(`Happy: ${expressions.happy.toFixed(3)} (Smile: >0.6)`, 10, 65)
      
      // Show head movement status
      if (window.headMovementTracker) {
        const positions = window.headMovementTracker.positions
        if (positions.length > 0) {
          const firstPos = positions[0]
          const lastPos = positions[positions.length - 1]
          const distance = Math.sqrt(
            Math.pow(lastPos.x - firstPos.x, 2) + Math.pow(lastPos.y - firstPos.y, 2)
          )
          ctx.fillText(`Movement: ${distance.toFixed(1)} (Need: >30)`, 10, 80)
        }
      }
    }

    const clearFaceFrame = () => {
      const canvas = document.getElementById('faceCanvas')
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Add error text
      ctx.fillStyle = '#ff0000'
      ctx.font = '16px Arial'
      ctx.fillText('❌ ไม่พบใบหน้า', 10, 30)
    }

    const calculateEAR = (leftEye, rightEye) => {
      // Calculate Eye Aspect Ratio (EAR)
      const leftEAR = calculateEyeAspectRatio(leftEye)
      const rightEAR = calculateEyeAspectRatio(rightEye)
      return (leftEAR + rightEAR) / 2
    }

    const calculateEyeAspectRatio = (eye) => {
      // Calculate the ratio of eye height to width
      const height = Math.sqrt(
        Math.pow(eye[1].y - eye[5].y, 2) + Math.pow(eye[1].x - eye[5].x, 2)
      ) + Math.sqrt(
        Math.pow(eye[2].y - eye[4].y, 2) + Math.pow(eye[2].x - eye[4].x, 2)
      )
      
      const width = Math.sqrt(
        Math.pow(eye[0].y - eye[3].y, 2) + Math.pow(eye[0].x - eye[3].x, 2)
      )
      
      return height / (2.0 * width)
    }

    const completeFaceVerification = async (detection) => {
      try {
        // Stop face detection
        if (faceInterval) {
          clearInterval(faceInterval)
          faceInterval = null
        }
        
        // Generate face descriptor
        const faceDescriptor = detection.descriptor ? Array.from(detection.descriptor) : null
        
        if (!faceDescriptor) {
          throw new Error('ไม่สามารถสแกนใบหน้าได้ กรุณาลองใหม่')
        }
        
        // Validate face descriptor
        if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
          throw new Error('เกิดข้อผิดพลาดในการอ่านข้อมูลใบหน้า')
        }
        
        // Submit check-in with face data
        const checkInData = {
          qr_token: manualToken.value || sessionInfo.value.qr_token,
          student_id: studentForm.student_code,
          firstname: studentForm.firstname,
          lastname: studentForm.lastname,
          face_descriptor: JSON.stringify(faceDescriptor)
        }
        
        const result = await attendanceService.checkIn(checkInData)
        
        // Success
        resultMessage.value = `เช็คชื่อสำเร็จ! สถานะ: ${result.status}`
        resultClass.value = 'result-success'
        
        // Reset form
        Object.assign(studentForm, {
          student_code: '',
          firstname: '',
          lastname: ''
        })
        
        sessionInfo.value = null
        manualToken.value = ''
        showFaceModal.value = false
        
        showNotification('เช็คชื่อสำเร็จ', 'success')
        
      } catch (error) {
        console.error('Face verification failed:', error)
        resultMessage.value = error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการยืนยันใบหน้า'
        resultClass.value = 'result-error'
        cancelFaceVerification()
      } finally {
        loading.value = false
      }
    }

    const cancelFaceVerification = () => {
      showFaceModal.value = false
      loading.value = false
      
      if (faceInterval) {
        clearInterval(faceInterval)
        faceInterval = null
      }
      
      if (faceStream) {
        faceStream.getTracks().forEach(track => track.stop())
        faceStream = null
      }
      
      if (faceVideo.value) {
        faceVideo.value.srcObject = null
      }
    }

    // Lifecycle
    onMounted(async () => {
      // Load jsQR library
      if (typeof jsQR === 'undefined') {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = '/js/jsQR.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }
      
      // Load face-api.js and models
      if (typeof faceapi === 'undefined') {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = '/js/face-api.min.js'
          script.onload = () => {
            // Initialize face-api with CPU backend
            console.log('Face API loaded, setting CPU backend...')
            
            // Force CPU backend to avoid WebGL issues
            if (typeof faceapi !== 'undefined' && faceapi.env) {
              try {
                faceapi.env.setBackend('cpu')
                console.log('CPU backend set successfully')
              } catch (e) {
                console.log('CPU backend setting failed, continuing with default:', e)
              }
            }
            
            // Load all required models
            Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
              faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
              faceapi.nets.faceExpressionNet.loadFromUri('/models'),
              faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]).then(() => {
              console.log('All face-api models loaded successfully')
              resolve()
            }).catch(reject)
          }
          script.onerror = reject
          document.head.appendChild(script)
        })
      } else {
        // Models already loaded, just ensure they're available
        try {
          // Force CPU backend if not already set
          if (typeof faceapi !== 'undefined' && faceapi.env) {
            try {
              faceapi.env.setBackend('cpu')
              console.log('CPU backend set successfully')
            } catch (e) {
              console.log('CPU backend setting failed, continuing with default:', e)
            }
          }
          
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceExpressionNet.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
          ])
          console.log('All face-api models loaded successfully')
        } catch (error) {
          console.log('Models already loaded or loading failed:', error)
        }
      }
    })

    onUnmounted(() => {
      stopScanning()
      cancelFaceVerification()
    })

    return {
      // Refs
      video,
      faceVideo,
      cameraContainer,
      
      // State
      isScanning,
      loading,
      manualToken,
      sessionInfo,
      resultMessage,
      resultClass,
      showFaceModal,
      livenessState,
      studentForm,
      
      // Computed
      isFormValid,
      
      // Methods
      startScanning,
      stopScanning,
      submitManualToken,
      submitStudentInfo,
      startFaceVerification,
      cancelFaceVerification,
      formatDateTime
    }
  }
}
</script>

<style scoped>
.scan-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.scan-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

.scan-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 40px 20px;
}

.scan-header h1 {
  font-size: 2rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.scan-header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.scan-content {
  padding: 40px 30px;
}

.scan-section {
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 1px solid #e1e8ed;
}

.scan-section h3 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.camera-container {
  position: relative;
  width: 100%;
  height: 300px;
  background: #f8f9fa;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
}

.scan-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.scan-frame {
  width: 200px;
  height: 200px;
  border: 3px solid #4285f4;
  border-radius: 10px;
  position: relative;
}

.scan-frame::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border: 2px solid rgba(66, 133, 244, 0.3);
  border-radius: 10px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.face-camera-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.face-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.face-modal-content video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-instruction {
  margin-top: 15px;
  font-size: 0.9rem;
  opacity: 0.8;
}

.scan-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.btn {
  padding: 12px 25px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  white-space: nowrap;
}

.btn-primary {
  background: #4285f4;
  color: white;
  box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: #3367d6;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(66, 133, 244, 0.4);
}

.btn-primary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: #e74c3c;
  color: white;
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
}

.btn-secondary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-success {
  background: #27ae60;
  color: white;
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
}

.btn-success:hover:not(:disabled) {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
}

.btn-success:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.manual-input {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #e1e8ed;
}

.manual-input h4 {
  color: #333;
  margin-bottom: 15px;
  text-align: center;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.input-group input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
}

.input-group input:focus {
  outline: none;
  border-color: #4285f4;
}

.session-info-section {
  margin-top: 30px;
}

.session-details {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #333;
}

.detail-row .label {
  font-weight: 600;
}

.detail-row .value {
  font-weight: 400;
}

.student-form-section {
  margin-top: 30px;
}

.student-form {
  margin-top: 20px;
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

.face-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.face-modal-content {
  background: white;
  border-radius: 15px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  position: relative;
}

.face-modal-content h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.8rem;
}

.face-camera-container {
  position: relative;
  width: 100%;
  height: 300px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.face-overlay {
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
  width: 200px;
  height: 200px;
  border: 3px solid #4285f4;
  border-radius: 10px;
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
  border-radius: 10px;
  animation: pulse 2s infinite;
}

.liveness-instructions {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.liveness-instructions p {
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.instruction-details {
  margin-bottom: 20px;
}

.instruction-note {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
  margin-bottom: 0;
}

.liveness-instructions ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  gap: 30px;
}

.liveness-instructions li {
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  font-weight: 600;
  color: #555;
  border: 2px solid #e1e8ed;
  transition: all 0.3s ease;
  min-width: 120px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.liveness-instructions li.completed {
  color: #27ae60;
  background: #d5f4e6;
  border-color: #27ae60;
  transform: scale(1.05);
}

.action-text {
  font-size: 1rem;
  font-weight: 600;
}

.progress-text {
  font-size: 0.8rem;
  font-weight: 500;
  opacity: 0.8;
}

.face-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
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

.result-info {
  background: #d6eaf8;
  color: #3498db;
  border: 2px solid #3498db;
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

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .scan-container {
    padding: 10px;
  }
  
  .scan-content {
    padding: 20px 15px;
  }
  
  .camera-container {
    height: 250px;
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .face-modal-content {
    width: 95%;
    padding: 20px;
  }
  
  .face-camera-container {
    height: 250px;
  }
  
  .btn {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
}
</style> 