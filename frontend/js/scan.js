// QR Code Scanner functionality
class QRScanner {
  constructor() {
    this.video = document.getElementById('video');
    this.scanBtn = document.getElementById('scanBtn');
    this.cameraContainer = document.getElementById('cameraContainer');
    this.resultMessage = document.getElementById('resultMessage');
    this.loading = document.getElementById('loading');
    this.sessionInfoSection = document.getElementById('sessionInfoSection');
    this.sessionInfoDetails = document.getElementById('sessionInfoDetails');
    this.studentInfoForm = document.getElementById('studentInfoForm');
    this.qrTokenInput = document.getElementById('qrToken');
    this.submitManualBtn = document.getElementById('submitManualBtn');
    this.submitStudentInfoBtn = document.getElementById('submitStudentInfoBtn');
    this.currentQrToken = null;
    this.currentTeacherId = null; // เพิ่มตัวแปรนี้
    
    this.stream = null;
    this.isScanning = false;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkCameraSupport();
  }

  setupEventListeners() {
    // Enter key for manual input
    this.qrTokenInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleQrTokenInput();
      }
    });
    if (this.submitManualBtn) {
      this.submitManualBtn.addEventListener('click', () => this.handleQrTokenInput());
    }
    if (this.scanBtn) {
      this.scanBtn.addEventListener('click', () => this.startScan());
    }
    if (this.studentInfoForm) {
      this.studentInfoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitStudentInfo();
      });
    }

    // Student code input
    // document.getElementById('studentCode').addEventListener('input', (e) => {
    //   this.validateStudentCode(e.target.value);
    // });
  }

  async checkCameraSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.showMessage('อุปกรณ์ของคุณไม่รองรับการใช้งานกล้อง', 'error');
      this.scanBtn.disabled = true;
      return false;
    }
    return true;
  }

  async startScan() {
    if (this.isScanning) {
      this.stopScan();
      return;
    }

    try {
      this.showLoading();
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      this.video.srcObject = this.stream;
      this.video.play();
      this.isScanning = true;
      this.scanBtn.textContent = '🛑 หยุดสแกน';
      this.scanBtn.style.background = '#e74c3c';
      // Start QR code detection
      this.detectQRCode();
      this.hideLoading();
    } catch (error) {
      console.error('Camera access failed:', error);
      this.showMessage('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง', 'error');
      this.hideLoading();
    }
  }

  stopScan() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.isScanning = false;
    this.scanBtn.textContent = '📷 เริ่มสแกน QR Code';
    this.scanBtn.style.background = '#4285f4';
  }

  async detectQRCode() {
    if (!this.isScanning) return;

    try {
      // Create canvas to capture video frame
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = this.video.videoWidth;
      canvas.height = this.video.videoHeight;
      context.drawImage(this.video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // ใช้ jsQR ตรวจจับ QR
      const qrCode = jsQR(imageData.data, canvas.width, canvas.height);
      if (qrCode && qrCode.data) {
        this.processQRCode(qrCode.data);
        return;
      }
      // Continue scanning
      requestAnimationFrame(() => this.detectQRCode());
    } catch (error) {
      requestAnimationFrame(() => this.detectQRCode());
    }
  }

  async processQRCode(qrToken) {
    this.stopScan();
    this.showLoading();
    try {
      // เรียก API เพื่อดึงข้อมูล session
      const response = await fetch(`/api/attendance/session-info/${qrToken}`);
      if (!response.ok) {
        let errorMsg = 'ไม่พบข้อมูลนี้ หรือ QR Token ไม่ถูกต้อง';
        try {
          const err = await response.json();
          if (err && err.error === 'ยังไม่ถึงเวลาเริ่มเช็คชื่อ') {
            errorMsg = err.error;
          }
        } catch {}
        this.showMessage(errorMsg, 'error');
        this.sessionInfoSection.classList.add('hidden');
        this.studentInfoForm.classList.add('hidden');
        this.hideLoading();
        return;
      }
      const session = await response.json();
      this.currentQrToken = qrToken;
      this.showSessionInfo(session);
      this.sessionInfoSection.classList.remove('hidden');
      this.studentInfoForm.classList.remove('hidden');
      this.hideLoading();
    } catch (error) {
      this.showMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
      this.sessionInfoSection.classList.add('hidden');
      this.studentInfoForm.classList.add('hidden');
      this.hideLoading();
    }
  }

  async handleQrTokenInput() {
    const qrToken = this.qrTokenInput.value.trim();
    if (!qrToken) {
      this.showMessage('กรุณากรอก QR Token', 'error');
      return;
    }
    this.showLoading();
    try {
      // เรียก API เพื่อดึงข้อมูล session
      const response = await fetch(`/api/attendance/session-info/${qrToken}`);
      if (!response.ok) {
        let errorMsg = 'ไม่พบข้อมูลนี้ หรือ QR Token ไม่ถูกต้อง';
        try {
          const err = await response.json();
          if (err && err.error === 'ยังไม่ถึงเวลาเริ่มเช็คชื่อ') {
            errorMsg = err.error;
          }
        } catch {}
        this.showMessage(errorMsg, 'error');
        this.sessionInfoSection.classList.add('hidden');
        this.studentInfoForm.classList.add('hidden');
        this.hideLoading();
        return;
      }
      const session = await response.json();
      this.currentQrToken = qrToken;
      this.showSessionInfo(session);
      this.sessionInfoSection.classList.remove('hidden');
      this.studentInfoForm.classList.remove('hidden');
      this.hideLoading();
    } catch (error) {
      this.showMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
      this.sessionInfoSection.classList.add('hidden');
      this.studentInfoForm.classList.add('hidden');
      this.hideLoading();
    }
  }

  showSessionInfo(session) {
    this.currentTeacherId = session.teacher_id || null; // เก็บ teacher_id
    this.sessionInfoDetails.innerHTML = `
      <div><b>Teacher Email:</b> ${session.email || '-'}</div>
      <div><b>Teacher Code:</b> ${session.teacher_code || '-'}</div>
      <div><b>Description:</b> ${session.description || '-'}</div>
      <div><b>Subject Code:</b> ${session.subject_code || '-'}</div>
      <div><b>Subject Name:</b> ${session.subject_name || '-'}</div>
      <div><b>Class Group:</b> ${session.class_group || '-'}</div>
      <div><b>Year:</b> ${session.year || '-'}</div>
      <div><b>Semester:</b> ${session.semester || '-'}</div>
    `;
    // reset student form
    document.getElementById('studentCode').value = '';
    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
  }

  async validateStudentFace(studentCode, firstName, lastName) {
    const response = await fetch('/api/attendance/validate-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentCode,
        firstname: firstName,
        lastname: lastName
      })
    });
    const result = await response.json();
    return result.found;
  }
//ตรวจสอบชื่อนักเรียนว่ามีการลงทะเบียนใบหน้าไหม
  async checkDuplicateSubmission(qrToken, studentCode, firstName, lastName) {
    const response = await fetch('/api/attendance/check-duplicate-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qr_token: qrToken,
        student_code: studentCode,
        firstname: firstName,
        lastname: lastName
      })
    });
    const result = await response.json();
    return result.duplicate;
  }
//
  async submitStudentInfo() {
    const studentCode = document.getElementById('studentCode').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    if (!studentCode || !firstName || !lastName) {
      this.showMessage('กรุณากรอกข้อมูลนิสิตให้ครบถ้วน', 'error');
      return;
    }
    if (!this.currentQrToken) {
      this.showMessage('QR Token ไม่ถูกต้อง', 'error');
      return;
    }
    if (!this.currentTeacherId) {
      this.showMessage('ไม่พบข้อมูล teacher_id', 'error');
      return;
    }
    // เช็ค studentface ก่อน
    this.showLoading();
    const found = await this.validateStudentFace(studentCode, firstName, lastName);
    if (!found) {
      this.showMessage('ไม่พบนักเรียนนี้ในระบบลงทะเบียนใบหน้า', 'error');
      this.hideLoading();
      return;
    }
    // เช็คซ้ำใน student_submissions ก่อน
    const isDuplicate = await this.checkDuplicateSubmission(this.currentQrToken, studentCode, firstName, lastName);
    if (isDuplicate) {
      this.showMessage('มีการลงทะเบียนแล้ว', 'error');
      this.hideLoading();
      return;
    }
    // ถ้าไม่ซ้ำ ให้เปิด popup กล้องเพื่อยืนยันใบหน้า
    try {
      const faceDescriptor = await this.openFaceVerificationPopup();
      if (!faceDescriptor) {
        this.showMessage('กรุณาสแกนใบหน้าให้ชัดเจน', 'error');
        this.hideLoading();
        return;
      }
      // ส่งข้อมูลไป backend พร้อม face_descriptor
      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_token: this.currentQrToken,
          student_id: studentCode,
          firstname: firstName,
          lastname: lastName,
          face_descriptor: JSON.stringify(faceDescriptor),
          teacher_id: this.currentTeacherId
        })
      });
      const result = await response.json();
      if (response.ok) {
        this.showMessage(`เช็คชื่อสำเร็จ! สถานะ: ${result.status}`, 'success');
        this.sessionInfoSection.classList.add('hidden');
        this.resetForm();
      } else {
        this.showMessage(result.error || 'เกิดข้อผิดพลาดในการเช็คชื่อ', 'error');
      }
    } catch (error) {
      this.showMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // เพิ่มฟังก์ชัน popup กล้องเพื่อยืนยันใบหน้า
  async openFaceVerificationPopup() {
    return new Promise(async (resolve) => {
      // สร้าง popup
      const popup = document.createElement('div');
      popup.style.position = 'fixed';
      popup.style.top = '0';
      popup.style.left = '0';
      popup.style.width = '100vw';
      popup.style.height = '100vh';
      popup.style.background = 'rgba(0,0,0,0.7)';
      popup.style.display = 'flex';
      popup.style.alignItems = 'center';
      popup.style.justifyContent = 'center';
      popup.style.zIndex = '9999';

      const container = document.createElement('div');
      container.style.background = '#fff';
      container.style.padding = '24px';
      container.style.borderRadius = '12px';
      container.style.boxShadow = '0 2px 12px #0003';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';

      const video = document.createElement('video');
      video.width = 320;
      video.height = 240;
      video.autoplay = true;
      video.style.borderRadius = '10px';
      video.style.boxShadow = '0 2px 8px #0002';
      container.appendChild(video);

      const statusDiv = document.createElement('div');
      statusDiv.style.margin = '12px 0';
      statusDiv.style.fontSize = '15px';
      statusDiv.style.whiteSpace = 'pre-line'; // หรือ 'pre-wrap'
      statusDiv.innerHTML = 'กรุณาวางใบหน้าในกรอบกล้อง<br>กรุณาทำตามนี้: ขยับหัว กระพริบตา ยิ้ม อย่างละ 1 ครั้ง';
      container.appendChild(statusDiv);

      const btnRow = document.createElement('div');
      btnRow.style.marginTop = '10px';
      btnRow.style.display = 'flex';
      btnRow.style.gap = '10px';

      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = 'ยืนยันใบหน้า';
      confirmBtn.className = 'btn';
      confirmBtn.disabled = true; // เริ่มต้นปิดไว้
      btnRow.appendChild(confirmBtn);

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'ยกเลิก';
      cancelBtn.className = 'btn';
      btnRow.appendChild(cancelBtn);

      container.appendChild(btnRow);
      popup.appendChild(container);
      document.body.appendChild(popup);

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await video.play();
      } catch (e) {
        showStatus('ไม่สามารถเปิดกล้องได้', 'error');
        confirmBtn.disabled = true;
        return;
      }
      let livenessCheckPassed = false;
      // ฟังก์ชันแสดงสถานะแบบ verify.js
      function showStatus(msg, type) {
        statusDiv.textContent = msg;
        statusDiv.className = 'status ' + (type || '');
      }

      // --- Liveness Detection Logic (นำมาจาก verify.js) ---
      const requiredBlinks = 3;
      const requiredHeadMoves = 2;
      const requiredSmiles = 1;
      let blinkCount = 0;
      let headMoveCount = 0;
      let smileDetected = false;
      let lastHeadPosition = null;
      let previousEyeAspectRatio = null;

      // Euclidean distance
      const euclideanDistance = (pt1, pt2) => {
        return Math.sqrt((pt1.x - pt2.x) ** 2 + (pt1.y - pt2.y) ** 2);
      };
      // EAR calculation
      const calculateEAR = (eye) => {
        if (!eye || eye.length < 6) return 0;
        const A = euclideanDistance(eye[1], eye[5]);
        const B = euclideanDistance(eye[2], eye[4]);
        const C = euclideanDistance(eye[0], eye[3]);
        if (C === 0 || isNaN(C)) return 0;
        const ear = (A + B) / (2.0 * C);
        if (isNaN(ear)) return 0;
        return ear;
      };
      // Detect blink
      const detectBlink = (landmarks) => {
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        if (!leftEye || !rightEye || leftEye.length < 6 || rightEye.length < 6) return false;
        const leftEAR = calculateEAR(leftEye);
        const rightEAR = calculateEAR(rightEye);
        if (leftEAR === 0 || rightEAR === 0) return false;
        const avgEAR = (leftEAR + rightEAR) / 2.0;
        const EAR_THRESHOLD = 0.32;
        let blinked = false;
        if (previousEyeAspectRatio !== null && previousEyeAspectRatio > EAR_THRESHOLD && avgEAR < EAR_THRESHOLD) {
          blinkCount++;
          blinked = true;
        }
        previousEyeAspectRatio = avgEAR;
        return blinked;
      };
      // Detect smile
      const detectSmile = (expressions) => {
        const happyScore = expressions.happy;
        const threshold = 0.1;
        return happyScore > threshold;
      };
      // Detect head movement
      const detectHeadMovement = (landmarks) => {
        const nose = landmarks.getNose()[3];
        if (lastHeadPosition) {
          const distance = euclideanDistance(nose, lastHeadPosition);
          const threshold = 30;
          if (distance > threshold) {
            headMoveCount++;
            lastHeadPosition = nose;
            return true;
          }
        } else {
          lastHeadPosition = nose;
        }
        return false;
      };
      // --- End Liveness Logic ---

      // แสดงคำแนะนำแบบ verify.js
      showStatus('📋 คำแนะนำ: กระพริบตา 3 ครั้ง, ขยับหัว 2 ครั้ง, ยิ้ม 1 ครั้ง', '');
      setTimeout(() => {
        showStatus('🎯 เริ่มต้น: วางใบหน้าในกรอบกล้อง และเริ่มทำตามคำแนะนำ', '');
      }, 1200);

      // ฟังก์ชันตรวจสอบ liveness
      const checkLiveness = async () => {
        if (!window.faceapi) {
          showStatus('face-api.js ไม่พร้อมใช้งาน', 'error');
          return;
        }
        try {
          const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();
          if (!detection) {
            showStatus('❌ ไม่พบใบหน้า กรุณาวางใบหน้าในกรอบกล้อง', 'error');
            return;
          }
          // ตรวจจับแต่ละ action
          detectBlink(detection.landmarks);
          detectHeadMovement(detection.landmarks);
          if (detectSmile(detection.expressions)) {
            smileDetected = true;
          }
          // อัปเดตสถานะแบบ verify.js
          showStatus(
            `👁️ กระพริบตา: ${blinkCount}/${requiredBlinks}${blinkCount >= requiredBlinks ? ' ✅' : ''}, ` +
            `🤸 ขยับหัว: ${headMoveCount}/${requiredHeadMoves}${headMoveCount >= requiredHeadMoves ? ' ✅' : ''}, ` +
            `😊 ยิ้ม: ${smileDetected ? '✓ ✅' : '✗'}`,
            ''
          );
          // ตรวจสอบว่าผ่าน liveness check ทั้งหมดหรือยัง
          if (blinkCount >= requiredBlinks && headMoveCount >= requiredHeadMoves && smileDetected && !livenessCheckPassed) {
            livenessCheckPassed = true;
            showStatus('🎉 ✅ ผ่านการตรวจสอบ Liveness ทั้งหมด!', 'success');
            confirmBtn.disabled = false;
          }
        } catch (e) {
          showStatus('เกิดข้อผิดพลาดในการตรวจสอบ Liveness', 'error');
        }
      };

      // เริ่มการตรวจจับ liveness
      const livenessInterval = setInterval(checkLiveness, 100);

      confirmBtn.onclick = async () => {
        if (!livenessCheckPassed) {
          showStatus('กรุณาทำการตรวจสอบให้ครบก่อน', 'error');
          return;
        }

        showStatus('กำลังตรวจจับใบหน้า...', '');
        try {
          // ใช้ face-api.js ตรวจจับใบหน้า (ไม่ต้องโหลดโมเดลซ้ำ)
          if (window.faceapi) {
            const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptor();
              
            if (!detection) {
              showStatus('❌ ไม่พบใบหน้า กรุณาวางใบหน้าในกรอบกล้อง', 'error');
              return;
            }
            
            const faceDescriptor = Array.from(detection.descriptor);
            // ปิดกล้องและ popup
            clearInterval(livenessInterval);
            if (stream) stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(popup);
            resolve(faceDescriptor);
          } else {
            showStatus('face-api.js ไม่พร้อมใช้งาน', 'error');
          }
        } catch (e) {
          showStatus('เกิดข้อผิดพลาดในการตรวจจับใบหน้า', 'error');
        }
      };
      
      cancelBtn.onclick = () => {
        clearInterval(livenessInterval);
        if (stream) stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(popup);
        resolve(null);
      };
    });
  }

  /*
  async validateStudentCode(studentCode) {
    if (studentCode.length < 9) return;
    
    try {
      const response = await fetch(`/api/users/students/code/${studentCode}`);
      
      if (response.ok) {
        const student = await response.json();
        document.getElementById('firstName').value = student.firstname || '';
        document.getElementById('lastName').value = student.lastname || '';
        this.showMessage(`พบข้อมูลนักเรียน: ${student.firstname} ${student.lastname}`, 'info');
      }
    } catch (error) {
      // Student not found, which is normal for new students
    }
  }
  */

  resetForm() {
    document.getElementById('studentCode').value = '';
    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('qrToken').value = '';
  }

  showMessage(message, type) {
    this.resultMessage.textContent = message;
    this.resultMessage.className = `result-message result-${type}`;
    this.resultMessage.classList.remove('hidden');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      this.resultMessage.classList.add('hidden');
    }, 5000);
  }

  showLoading() {
    this.loading.classList.remove('hidden');
  }

  hideLoading() {
    this.loading.classList.add('hidden');
  }
}

// เพิ่มฟังก์ชันโหลดโมเดล face-api.js
async function loadFaceApiModels() {
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('models/'),
      faceapi.nets.faceLandmark68Net.loadFromUri('models/'),
      faceapi.nets.faceRecognitionNet.loadFromUri('models/'),
      faceapi.nets.faceExpressionNet.loadFromUri('models/'),
      faceapi.nets.ageGenderNet.loadFromUri('models/'),
      // faceapi.nets.tinyYolov2.loadFromUri('models/'), // ลบบรรทัดนี้ออก
    ]);
  } catch (e) {
    alert('เกิดข้อผิดพลาดในการโหลดโมเดล face-api.js: ' + e);
  }
}

// Initialize scanner when page loads
let scanner;
document.addEventListener('DOMContentLoaded', async () => {
  await loadFaceApiModels(); // โหลดโมเดลให้เสร็จก่อน
  scanner = new QRScanner();
});

// Global functions for onclick handlers (kept for backward compatibility)
window.startScan = function() {
  if (scanner) scanner.startScan();
};

window.submitManual = function() {
  if (scanner) scanner.submitManual();
};

