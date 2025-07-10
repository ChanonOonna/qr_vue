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
    document.getElementById('studentCode').addEventListener('input', (e) => {
      this.validateStudentCode(e.target.value);
    });
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
        this.showMessage('ไม่พบข้อมูลนี้ หรือ QR Token ไม่ถูกต้อง', 'error');
        this.sessionInfoSection.classList.add('hidden');
        this.hideLoading();
        return;
      }
      const session = await response.json();
      this.currentQrToken = qrToken;
      this.showSessionInfo(session);
      this.sessionInfoSection.classList.remove('hidden');
      this.hideLoading();
    } catch (error) {
      this.showMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
      this.sessionInfoSection.classList.add('hidden');
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
        this.showMessage('ไม่พบข้อมูลนี้ หรือ QR Token ไม่ถูกต้อง', 'error');
        this.sessionInfoSection.classList.add('hidden');
        this.hideLoading();
        return;
      }
      const session = await response.json();
      this.currentQrToken = qrToken;
      this.showSessionInfo(session);
      this.sessionInfoSection.classList.remove('hidden');
      this.hideLoading();
    } catch (error) {
      this.showMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
      this.sessionInfoSection.classList.add('hidden');
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
    this.showLoading();
    try {
      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_token: this.currentQrToken,
          student_id: studentCode,
          firstname: firstName,
          lastname: lastName,
          teacher_id: this.currentTeacherId // ส่ง teacher_id ไปด้วย
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

