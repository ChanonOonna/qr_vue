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
      statusDiv.textContent = 'กรุณาวางใบหน้าในกรอบกล้อง';
      container.appendChild(statusDiv);

      const btnRow = document.createElement('div');
      btnRow.style.marginTop = '10px';
      btnRow.style.display = 'flex';
      btnRow.style.gap = '10px';

      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = 'ยืนยันใบหน้า';
      confirmBtn.className = 'btn';
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
        statusDiv.textContent = 'ไม่สามารถเปิดกล้องได้';
        confirmBtn.disabled = true;
      }

      confirmBtn.onclick = async () => {
        statusDiv.textContent = 'กำลังตรวจจับใบหน้า...';
        try {
          // ใช้ face-api.js ตรวจจับใบหน้า
          if (window.faceapi) {
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
            const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
            if (!detection) {
              statusDiv.textContent = '❌ ไม่พบใบหน้า กรุณาวางใบหน้าในกรอบกล้อง';
              return;
            }
            const faceDescriptor = Array.from(detection.descriptor);
            // ปิดกล้องและ popup
            if (stream) stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(popup);
            resolve(faceDescriptor);
          } else {
            statusDiv.textContent = 'face-api.js ไม่พร้อมใช้งาน';
          }
        } catch (e) {
          statusDiv.textContent = 'เกิดข้อผิดพลาดในการตรวจจับใบหน้า';
        }
      };
      cancelBtn.onclick = () => {
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

// Initialize scanner when page loads
let scanner;
document.addEventListener('DOMContentLoaded', () => {
  scanner = new QRScanner();
});

// Global functions for onclick handlers (kept for backward compatibility)
window.startScan = function() {
  if (scanner) scanner.startScan();
};

window.submitManual = function() {
  if (scanner) scanner.submitManual();
};

