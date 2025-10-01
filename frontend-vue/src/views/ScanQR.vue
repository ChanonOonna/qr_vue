<template>
  <div class="scan-container">
    <div class="scan-card">
      <!-- Header -->
      <div class="scan-header">
        <button @click="goBack" class="back-btn">
           กลับ
        </button>
        <h1> เช็คชื่อเข้าชั้นเรียน</h1>
        <p>สแกน QR Code และยืนยันตัวตนด้วยใบหน้า</p>
      </div>

      <div class="scan-content">
        <!-- QR Code Scanning Section -->
        <div class="scan-section">
          <h3> สแกน QR Code</h3>
          
          <!-- Camera Container -->
          <div class="camera-container" ref="cameraContainer">
            <video ref="video" autoplay muted playsinline></video>
            <canvas ref="overlay" class="face-overlay"></canvas>
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
               เริ่มสแกน QR Code
            </button>
            <button 
              v-else 
              @click="stopScanning" 
              class="btn btn-secondary"
            >
               หยุดสแกน
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
          <h3> ข้อมูลวิชา</h3>
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
          <h3> ข้อมูลนักเรียน</h3>
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

        <!-- Result Message -->
        <div v-if="resultMessage" :class="['result-message', resultClass]">
          {{ resultMessage }}
        </div>

      </div>
    </div>

    <!-- Face Verification Modal -->
    <div v-if="showFaceVerificationModal" class="modal-overlay" @click="closeFaceVerificationModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3> ยืนยันตัวตนด้วยใบหน้า</h3>
          <button @click="closeFaceVerificationModal" class="close-btn">✕</button>
        </div>
        
        <div class="modal-body">
          <!-- Camera for Face Detection -->
          <div class="face-camera-container">
            <video ref="faceVideo" autoplay muted playsinline></video>
            <canvas ref="faceOverlay" class="face-detection-overlay"></canvas>
            <div class="face-instruction-overlay">
              <div class="face-frame"></div>
            </div>
          </div>

          <!-- Verification Status -->
          <div class="verification-status">
            <div class="status-item" :class="{ completed: livenessChecks.blink }">
              <span class="status-icon"></span>
              <span class="status-text">กระพริบตา</span>
              <span class="status-check"></span>
              <div class="status-count">
                {{ blinkCount }}/{{ requiredBlinkCount }} ครั้ง
              </div>
            </div>
            <div class="status-item" :class="{ completed: livenessChecks.smile }">
              <span class="status-icon"></span>
              <span class="status-text">ยิ้ม</span>
              <span class="status-check"></span>
              <div class="status-count">
                {{ smileCount }}/{{ requiredSmileCount }} ครั้ง
              </div>
            </div>
            <div class="status-item" :class="{ completed: livenessChecks.headMovement }">
              <span class="status-icon"></span>
              <span class="status-text">ขยับศีรษะ</span>
              <span class="status-check"></span>
              <div class="status-count">
                {{ headMovementCount }}/{{ requiredHeadMovementCount }} ครั้ง
              </div>
            </div>
          </div>
          
          <!-- Instructions -->
          <div class="verification-instructions">
            <p v-if="!(livenessChecks.blink && livenessChecks.smile && livenessChecks.headMovement)">
              กรุณาทำตามคำแนะนำเพื่อยืนยันตัวตน:
            </p>
            
            <!-- Error: not found face / positioning -->
            <p v-if="noFaceDetected" class="instruction error">
              {{ noFaceMessage }}
            </p>
            
            <p v-if="!livenessChecks.blink && !noFaceDetected" class="instruction">
               กรุณากระพริบตา 3 ครั้ง
            </p>
            <p v-if="!livenessChecks.smile && livenessChecks.blink && !noFaceDetected" class="instruction">
               กรุณายิ้มให้กล้อง 2 ครั้ง
            </p>
            <p v-if="!livenessChecks.headMovement && livenessChecks.smile && !noFaceDetected" class="instruction">
               กรุณาขยับศีรษะไปซ้าย-ขวา 2 ครั้ง
            </p>
            <p v-if="livenessChecks.blink && livenessChecks.smile && livenessChecks.headMovement" class="instruction success">
               ยืนยันตัวตนสำเร็จ! กรุณากดปุ่ม "ยืนยันใบหน้า"
            </p>

            <!-- Error: backend face mismatch -->
            <div v-if="modalError" class="modal-error">
              {{ modalError }}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button 
            @click="closeFaceVerificationModal" 
            class="btn btn-secondary"
            :disabled="loading"
          >
            ยกเลิก
          </button>
          <button 
            @click="submitWithFaceVerification" 
            class="btn btn-success"
            :disabled="loading || !(livenessChecks.blink && livenessChecks.smile && livenessChecks.headMovement)"
          >
            ยืนยันใบหน้า
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { attendanceService } from '../services/attendance'
import { faceService } from '../services/face'
import { formatDateTime, showNotification } from '../utils/helpers'

export default {
  name: 'ScanQR',
  setup() {
    const router = useRouter()
    
    // Refs
    const video = ref(null)
    const cameraContainer = ref(null)
    const overlay = ref(null)
    const faceVideo = ref(null)
    const faceOverlay = ref(null)
    
    // State
    const isScanning = ref(false)
    const loading = ref(false)
    const manualToken = ref('')
    const sessionInfo = ref(null)
    const resultMessage = ref('')
    const resultClass = ref('')
    const showFaceVerificationModal = ref(false)
    const faceVerificationComplete = ref(false)
    const modalError = ref('')
    
    // Face detection state
    const isFaceDetected = ref(false)
    const faceDetectionInterval = ref(null)
    const livenessChecks = reactive({
      blink: false,
      smile: false,
      headMovement: false
    })
    
    // Liveness detection state
    const eyeAspectRatioHistory = ref([])
    const smileHistory = ref([])
    const headPositionHistory = ref([])
    const lastBlinkTime = ref(0)
    const lastSmileTime = ref(0)
    const lastHeadMovementTime = ref(0)
    
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
    
    // Computed
    const isFormValid = computed(() => {
      return studentForm.student_code.trim() && 
             studentForm.firstname.trim() && 
             studentForm.lastname.trim()
    })
    
    // เพิ่มตัวนับจำนวนครั้ง
    const blinkCount = ref(0)
    const smileCount = ref(0)
    const headMovementCount = ref(0)

    // จำนวนครั้งที่ต้องการ
    const requiredBlinkCount = 3
    const requiredSmileCount = 2
    const requiredHeadMovementCount = 2
    
    // เพิ่มตัวแปรสำหรับการแจ้งเตือน
    const noFaceDetected = ref(false)
    const noFaceMessage = ref('')
    
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
      
      if (faceDetectionInterval.value) {
        clearInterval(faceDetectionInterval.value)
        faceDetectionInterval.value = null
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
        const response = await attendanceService.getPublicSessionInfo(qrToken)
        sessionInfo.value = { ...response, qr_token: qrToken }
        
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

    const startFaceVerification = async () => {
      try {
        showFaceVerificationModal.value = true
        loading.value = true
        resultMessage.value = 'กำลังเริ่มการยืนยันใบหน้า...'
        resultClass.value = 'result-info'
        modalError.value = ''
        
        // Load face-api.js models if not loaded
        if (typeof faceapi === 'undefined') {
          await loadFaceApiModels()
        }
        
        // Start camera for face detection
        faceStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        })
        
        if (faceVideo.value) {
          faceVideo.value.srcObject = faceStream
        }
        
        // Start face detection
        startFaceDetection()
        
        loading.value = false
        
      } catch (error) {
        console.error('Failed to start face verification:', error)
        resultMessage.value = 'ไม่สามารถเริ่มการยืนยันใบหน้าได้'
        resultClass.value = 'result-error'
        loading.value = false
      }
    }

    const closeFaceVerificationModal = () => {
      showFaceVerificationModal.value = false
      
      // Reset face detection alerts
      noFaceDetected.value = false
      noFaceMessage.value = ''
      modalError.value = ''
      
      // Reset liveness checks
      Object.assign(livenessChecks, {
        blink: false,
        smile: false,
        headMovement: false
      })
      
      // Reset counters
      blinkCount.value = 0
      smileCount.value = 0
      headMovementCount.value = 0
      
      // Reset histories
      eyeAspectRatioHistory.value = []
      smileHistory.value = []
      headPositionHistory.value = []
      
      // Reset times
      lastBlinkTime.value = 0
      lastSmileTime.value = 0
      lastHeadMovementTime.value = 0
      
      // Stop face detection
      if (faceDetectionInterval.value) {
        clearInterval(faceDetectionInterval.value)
        faceDetectionInterval.value = null
      }
      
      // Stop face camera
      if (faceStream) {
        faceStream.getTracks().forEach(track => track.stop())
        faceStream = null
      }
      
      if (faceVideo.value) {
        faceVideo.value.srcObject = null
      }
      
      // Clear overlay
      if (faceOverlay.value) {
        const ctx = faceOverlay.value.getContext('2d')
        ctx.clearRect(0, 0, faceOverlay.value.width, faceOverlay.value.height)
      }
    }

    const loadFaceApiModels = async () => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = '/js/face-api.min.js'
        script.onload = async () => {
          try {
            await Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
              faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
              faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
              faceapi.nets.faceExpressionNet.loadFromUri('/models')
            ])
            console.log('Face API models loaded successfully')
            resolve()
          } catch (error) {
            reject(error)
          }
        }
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    const startFaceDetection = () => {
      if (!faceVideo.value || !faceOverlay.value) return
      
      // รอให้ video โหลดเสร็จก่อน
      const setupCanvas = () => {
        if (faceVideo.value.videoWidth > 0 && faceVideo.value.videoHeight > 0) {
          // ตั้ง Canvas size ให้ตรงกับ Video size
          faceOverlay.value.width = faceVideo.value.videoWidth
          faceOverlay.value.height = faceVideo.value.videoHeight
          
          // ตั้ง Canvas style size ให้ตรงกับ container
          faceOverlay.value.style.width = '100%'
          faceOverlay.value.style.height = '100%'
        }
      }
      
      // ตั้ง Canvas ทันที
      setupCanvas()
      
      // ตั้ง Canvas อีกครั้งเมื่อ video ready
      faceVideo.value.addEventListener('loadedmetadata', setupCanvas)
      
      let lastDetectionTime = 0
      const detectionInterval = 200
      let noFaceCount = 0 // เพิ่มตัวนับ
      
      faceDetectionInterval.value = setInterval(async () => {
        if (!faceVideo.value || !faceOverlay.value) return
        
        const now = Date.now()
        if (now - lastDetectionTime < detectionInterval) return
        lastDetectionTime = now
        
        try {
          const detection = await faceapi.detectSingleFace(
            faceVideo.value, 
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 224,
              scoreThreshold: 0.5
            })
          ).withFaceLandmarks().withFaceExpressions()
          
          if (detection) {
            isFaceDetected.value = true
            noFaceDetected.value = false
            noFaceMessage.value = ''
            noFaceCount = 0
            drawFaceFrame(detection)
            checkLiveness(detection)
          } else {
            isFaceDetected.value = false
            noFaceCount++
            clearFaceFrame()
            
            // แจ้งเตือนเมื่อไม่พบใบหน้า 3 วินาที
            if (noFaceCount > 15) { // 15 * 200ms = 3 วินาที
              noFaceDetected.value = true
              noFaceMessage.value = 'ไม่พบใบหน้า กรุณาตำแหน่งใบหน้าให้อยู่ในกรอบ'
            }
          }
        } catch (error) {
          console.error('Face detection error:', error)
          isFaceDetected.value = false
          clearFaceFrame()
        }
      }, detectionInterval)
    }

    // Draw face frame plot
    const drawFaceFrame = (detection) => {
      if (!faceOverlay.value) return
      
      const ctx = faceOverlay.value.getContext('2d')
      ctx.clearRect(0, 0, faceOverlay.value.width, faceOverlay.value.height)
      
      const { box } = detection.detection
      
      // คำนวณ scale factor
      const scaleX = faceOverlay.value.width / faceVideo.value.videoWidth
      const scaleY = faceOverlay.value.height / faceVideo.value.videoHeight
      
      // ปรับขนาดกรอบให้ตรงกับ video
      const scaledBox = {
        x: box.x * scaleX,
        y: box.y * scaleY,
        width: box.width * scaleX,
        height: box.height * scaleY
      }
      
      ctx.strokeStyle = '#4285f4'
      ctx.lineWidth = 3
      const adjustedY = Math.max(0, scaledBox.y - scaledBox.height * 0.25)
      ctx.strokeRect(scaledBox.x, adjustedY, scaledBox.width, scaledBox.height)
    }

    const clearFaceFrame = () => {
      if (!faceOverlay.value) return
      const ctx = faceOverlay.value.getContext('2d')
      ctx.clearRect(0, 0, faceOverlay.value.width, faceOverlay.value.height)
    }

    const checkLiveness = (detection) => {
      if (!detection.landmarks || !detection.expressions) return
      
      // Check blink detection
      checkBlink(detection.landmarks)
      
      // Check smile detection
      checkSmile(detection.expressions)
      
      // Check head movement
      checkHeadMovement(detection.landmarks)
    }

    const checkBlink = (landmarks) => {
      if (livenessChecks.blink) return
      
      // Calculate Eye Aspect Ratio (EAR) for both eyes
      const leftEye = landmarks.positions.slice(36, 42)
      const rightEye = landmarks.positions.slice(42, 48)
      
      const leftEAR = calculateEAR(leftEye)
      const rightEAR = calculateEAR(rightEye)
      const avgEAR = (leftEAR + rightEAR) / 2
      
      eyeAspectRatioHistory.value.push(avgEAR)
      
      // Keep only last 5 frames
      if (eyeAspectRatioHistory.value.length > 5) {
        eyeAspectRatioHistory.value.shift()
      }
      
      // Check for blink (EAR drops below threshold)
      if (eyeAspectRatioHistory.value.length >= 2) {
        const recentEAR = eyeAspectRatioHistory.value.slice(-2)
        const avgRecentEAR = recentEAR.reduce((a, b) => a + b) / recentEAR.length
        
        if (avgRecentEAR < 0.3 && Date.now() - lastBlinkTime.value > 300) {
          blinkCount.value++
          lastBlinkTime.value = Date.now()
          console.log('Blink detected!', blinkCount.value)
          
          // ตรวจสอบว่ากระพริบครบแล้วหรือยัง
          if (blinkCount.value >= requiredBlinkCount) {
            livenessChecks.blink = true
          }
        }
      }
    }

    const calculateEAR = (eyePoints) => {
      // Calculate vertical eye distances
      const vertical1 = Math.sqrt(
        Math.pow(eyePoints[1].x - eyePoints[5].x, 2) + 
        Math.pow(eyePoints[1].y - eyePoints[5].y, 2)
      )
      const vertical2 = Math.sqrt(
        Math.pow(eyePoints[2].x - eyePoints[4].x, 2) + 
        Math.pow(eyePoints[2].y - eyePoints[4].y, 2)
      )
      
      // Calculate horizontal eye distance
      const horizontal = Math.sqrt(
        Math.pow(eyePoints[0].x - eyePoints[3].x, 2) + 
        Math.pow(eyePoints[0].y - eyePoints[3].y, 2)
      )
      
      return (vertical1 + vertical2) / (2 * horizontal)
    }

    const checkSmile = (expressions) => {
      if (livenessChecks.smile) return
      
      const smileConfidence = expressions.happy
      smileHistory.value.push(smileConfidence)
      
      // Keep only last 5 frames
      if (smileHistory.value.length > 5) {
        smileHistory.value.shift()
      }
      
      // Check for sustained smile
      if (smileHistory.value.length >= 2) {
        const recentSmiles = smileHistory.value.slice(-2)
        const avgSmile = recentSmiles.reduce((a, b) => a + b) / recentSmiles.length
        
        if (avgSmile > 0.1 && Date.now() - lastSmileTime.value > 200) {
          smileCount.value++
          lastSmileTime.value = Date.now()
          console.log('Smile detected!', smileCount.value)
          
          // ตรวจสอบว่ายิ้มครบแล้วหรือยัง
          if (smileCount.value >= requiredSmileCount) {
            livenessChecks.smile = true
          }
        }
      }
    }

    const checkHeadMovement = (landmarks) => {
      if (livenessChecks.headMovement) return
      
      // Use nose tip position for head movement detection
      const noseTip = landmarks.positions[30]
      const currentPosition = { x: noseTip.x, y: noseTip.y }
      
      headPositionHistory.value.push(currentPosition)
      
      // Keep only last 10 frames
      if (headPositionHistory.value.length > 10) {
        headPositionHistory.value.shift()
      }
      
      // Check for significant head movement
      if (headPositionHistory.value.length >= 5) {
        const firstPos = headPositionHistory.value[0]
        const lastPos = headPositionHistory.value[headPositionHistory.value.length - 1]
        
        const movement = Math.sqrt(
          Math.pow(lastPos.x - firstPos.x, 2) + 
          Math.pow(lastPos.y - firstPos.y, 2)
        )
        
        if (movement > 30 && Date.now() - lastHeadMovementTime.value > 1000) {
          headMovementCount.value++
          lastHeadMovementTime.value = Date.now()
          console.log('Head movement detected!', headMovementCount.value)
          
          // ตรวจสอบว่าขยับครบแล้วหรือยัง
          if (headMovementCount.value >= requiredHeadMovementCount) {
            livenessChecks.headMovement = true
          }
        }
      }
    }

    const skipFaceVerification = () => {
      closeFaceVerificationModal()
      faceVerificationComplete.value = true
      resultMessage.value = 'ข้ามการยืนยันใบหน้าแล้ว กรุณาส่งข้อมูล'
      resultClass.value = 'result-info'
    }

    const submitStudentInfo = async () => {
      try {
        // Validate form
        if (!isFormValid.value) {
          resultMessage.value = 'กรุณากรอกข้อมูลนิสิตให้ครบถ้วน'
          resultClass.value = 'result-error'
          return
        }
        
        // Ensure qr token exists
        const qrTokenToUse = manualToken.value || sessionInfo.value?.qr_token
        if (!qrTokenToUse) {
          resultMessage.value = 'ไม่พบ QR Token กรุณาสแกนใหม่หรือลองอีกครั้ง'
          resultClass.value = 'result-error'
          return
        }

        // 1) Check duplicate submission for this session and student
        try {
          const duplicateResp = await attendanceService.checkDuplicateSubmission({
            qr_token: qrTokenToUse,
            student_code: studentForm.student_code,
            firstname: studentForm.firstname,
            lastname: studentForm.lastname
          })
          if (duplicateResp?.duplicate) {
            resultMessage.value = 'มีการลงทะเบียนแล้ว'
            resultClass.value = 'result-error'
            return
          }
        } catch (e) {
          console.error('Duplicate submission check failed:', e)
          // Continue, but surface a gentle message
        }

        // 2) Validate student face enrollment exists in studentface
        try {
          const faceValidate = await attendanceService.validateFaceEnrollment({
            student_id: studentForm.student_code,
            firstname: studentForm.firstname,
            lastname: studentForm.lastname
          })
          if (!faceValidate?.found) {
            resultMessage.value = 'ไม่พบนักเรียนนี้ในระบบลงทะเบียนใบหน้า กรุณาไปลงทะเบียนใบหน้ากับอาจารย์ก่อน'
            resultClass.value = 'result-error'
            return
          }
        } catch (e) {
          console.error('Face enrollment validation failed:', e)
          resultMessage.value = 'ตรวจสอบการลงทะเบียนใบหน้าล้มเหลว กรุณาลองใหม่'
          resultClass.value = 'result-error'
          return
        }
        
        // Show face verification modal
        await startFaceVerification()
        
      } catch (error) {
        console.error('Failed to start face verification:', error)
        resultMessage.value = 'ไม่สามารถเริ่มการยืนยันใบหน้าได้'
        resultClass.value = 'result-error'
      }
    }

    // Function to get client IP address
    const getClientIP = async () => {
      try {
        // Method 1: Try to get IP from a public service
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        console.log('Public IP:', data.ip)
        return data.ip
      } catch (error) {
        console.warn('Failed to get public IP:', error)
        try {
          // Method 2: Try another service
          const response = await fetch('https://ipapi.co/json/')
          const data = await response.json()
          console.log('Backup IP:', data.ip)
          return data.ip
        } catch (error2) {
          console.warn('Failed to get IP from backup service:', error2)
          // Method 3: Fallback to unknown
          return 'unknown'
        }
      }
    }

    const submitWithFaceVerification = async () => {
      try {
        loading.value = true
        resultMessage.value = ''
        modalError.value = ''
        
        // Get face descriptor from current detection
        let faceDescriptor = null
        if (faceVideo.value) {
          try {
            const detection = await faceapi.detectSingleFace(
              faceVideo.value, 
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 224,
                scoreThreshold: 0.5
              })
            ).withFaceLandmarks().withFaceDescriptor()
            
            if (detection && detection.descriptor) {
              faceDescriptor = JSON.stringify(Array.from(detection.descriptor))
              console.log('Face descriptor captured:', faceDescriptor.substring(0, 50) + '...')
            }
          } catch (error) {
            console.error('Failed to get face descriptor:', error)
            modalError.value = 'ไม่สามารถดึงข้อมูลใบหน้าได้ กรุณาลองใหม่'
            loading.value = false
            return
          }
        }
        
        if (!faceDescriptor) {
          modalError.value = 'ไม่พบใบหน้า กรุณาตำแหน่งใบหน้าให้อยู่ในกรอบ'
          loading.value = false
          return
        }
        
        // Get client IP address
        const clientIP = await getClientIP()
        
        // Submit check-in data
        const checkInData = {
          qr_token: manualToken.value || sessionInfo.value.qr_token,
          student_id: studentForm.student_code,
          firstname: studentForm.firstname,
          lastname: studentForm.lastname,
          face_descriptor: faceDescriptor,
          ip_address: clientIP
        }
        
        const result = await attendanceService.checkIn(checkInData)
        
        // Success
        resultMessage.value = `เช็คชื่อสำเร็จ! สถานะ: ${result.status}`
        resultClass.value = 'result-success'
        
        // Close modal
        closeFaceVerificationModal()
        
        // Reset form
        Object.assign(studentForm, {
          student_code: '',
          firstname: '',
          lastname: ''
        })
        
        sessionInfo.value = null
        manualToken.value = ''
        faceVerificationComplete.value = false
        
        // Reset liveness checks
        Object.assign(livenessChecks, {
          blink: false,
          smile: false,
          headMovement: false
        })
        
        showNotification('เช็คชื่อสำเร็จ', 'success')
        
      } catch (error) {
        console.error('Failed to submit student info:', error)
        console.error('Error response:', error.response?.data)
        
        // Close modal and show error message on main page
        closeFaceVerificationModal()
        resultMessage.value = error.response?.data?.error || 'เกิดข้อผิดพลาดในการตรวจสอบใบหน้า กรุณาลองใหม่'
        resultClass.value = 'result-error'
      } finally {
        loading.value = false
      }
    }

    const goBack = () => {
      router.push('/')
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
      
      // Watch for liveness checks completion
      // ลบบรรทัดนี้
      // watch(allLivenessChecksComplete, (newVal) => {
      //   if (newVal && showFaceVerificationModal.value) {
      //     console.log('All liveness checks completed! Auto-submitting in 2 seconds...')
      //     // Auto submit after 2 seconds
      //     setTimeout(() => {
      //       submitWithFaceVerification()
      //     }, 2000)
      //   }
      // })
    })

    onUnmounted(() => {
      stopScanning()
      closeFaceVerificationModal()
    })

    return {
      // Refs
      video,
      cameraContainer,
      overlay,
      faceVideo,
      faceOverlay,
      
      // State
      isScanning,
      loading,
      manualToken,
      sessionInfo,
      resultMessage,
      resultClass,
      studentForm,
      showFaceVerificationModal,
      faceVerificationComplete,
      isFaceDetected,
      livenessChecks,
      noFaceDetected,
      noFaceMessage,
      modalError,
      
      // Computed
      isFormValid,
      // ลบบรรทัดนี้
      // allLivenessChecksComplete,
      
      // Methods
      startScanning,
      stopScanning,
      submitManualToken,
      submitStudentInfo,
      startFaceVerification,
      closeFaceVerificationModal,
      skipFaceVerification,
      submitWithFaceVerification,
      formatDateTime,
      goBack,
      blinkCount,
      smileCount,
      headMovementCount,
      requiredBlinkCount,
      requiredSmileCount,
      requiredHeadMovementCount,
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
  position: relative;
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

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
  z-index: 10;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
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

.face-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
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
  z-index: 1;
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
  transition: all 0.2s ease;
  border: none;
  white-space: nowrap;
}

.btn-primary {
  background: #4285f4;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3367d6;
}

.btn-primary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e74c3c;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #c0392b;
}

.btn-secondary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #229954;
}

.btn-success:disabled {
  background: #95a5a6;
  cursor: not-allowed;
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: modalSlideUp 0.3s ease-out;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #e1e8ed;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
  z-index: 10; /* เพิ่ม z-index */
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  padding: 30px;
}

.face-camera-container {
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

.face-detection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.face-instruction-overlay {
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
  z-index: 1;
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

.verification-status {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  border-radius: 10px;
  background: #fff;
  border: 2px solid #e1e8ed;
  transition: all 0.3s ease;
  min-width: 100px;
}

.status-item.completed {
  background: #d5f4e6;
  border-color: #27ae60;
  color: #27ae60;
}

.status-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.status-text {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 5px;
}

.status-check {
  font-size: 1.2rem;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.status-item.completed .status-check {
  opacity: 1;
}

.status-count {
  font-size: 0.8rem;
  color: #666;
  margin-top: 5px;
  font-weight: 500;
}

.status-item.completed .status-count {
  color: #27ae60;
  font-weight: 600;
}

.verification-instructions {
  text-align: center;
  margin-bottom: 20px;
}

.verification-instructions p {
  margin: 10px 0;
  font-size: 1.1rem;
}

.instruction {
  color: #666;
  font-weight: 500;
}

.instruction.success {
  color: #27ae60;
  font-weight: 600;
}

.instruction.error {
  color: #e74c3c;
  font-weight: 600;
  background: #fadbd8;
  padding: 10px;
  border-radius: 8px;
  border: 2px solid #e74c3c;
}

.modal-footer {
  padding: 20px 30px;
  border-top: 1px solid #e1e8ed;
  text-align: center;
  background: #f8f9fa;
  border-radius: 0 0 20px 20px;
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
  
  .verification-status {
    flex-direction: column;
    gap: 10px;
  }
  
  .status-item {
    min-width: auto;
  }
  
  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 15px 20px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .modal-footer {
    padding: 15px 20px;
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
  
  .btn {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
}
.modal-error {
  background: #fdecea;
  color: #d93025;
  border: 2px solid #d93025;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  margin-top: 12px;
}
</style> 
