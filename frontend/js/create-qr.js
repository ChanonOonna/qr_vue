// Create QR Code functionality
class CreateQRManager {
  constructor() {
    this.teacherId = null;
    this.teacherCode = null;
    this.init();
  }

  async init() {
    await this.loadTeacherInfo();
    this.setupEventListeners();
  }

  async loadTeacherInfo() {
    try {
      const response = await fetch('/api/user', { credentials: 'include' });
      if (response.ok) {
        const user = await response.json();
        this.teacherId = user.id;
        this.teacherCode = user.teacher_code;
        document.getElementById('teacherEmail').textContent = `อีเมล: ${user.email || '-'}`;
        document.getElementById('teacherCode').textContent = `รหัสครู: ${user.teacher_code || '-'}`;
      } else {
        window.location.href = '/';
      }
    } catch (e) {
      window.location.href = '/';
    }
  }

  setupEventListeners() {
    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.goBack());
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Form submission
    const qrForm = document.getElementById('createQRForm');
    if (qrForm) {
      qrForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitForm();
      });
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.goBack());
    }

    // Back to dashboard button
    const backToDashboardBtn = document.getElementById('backToDashboardBtn');
    if (backToDashboardBtn) {
      backToDashboardBtn.addEventListener('click', () => this.goToDashboard());
    }

    // Download QR button
    const downloadQRBtn = document.getElementById('downloadQRBtn');
    if (downloadQRBtn) {
      downloadQRBtn.addEventListener('click', () => this.downloadQR());
    }
  }

  setDefaultValues() {
    // Set default start time to 5 minutes from now
    const now = new Date();
    const startTime = new Date(now.getTime() + 5 * 60 * 1000);
    const startTimeInput = document.getElementById('startTime');
    if (startTimeInput) {
      startTimeInput.value = startTime.toISOString().slice(0, 16);
    }

    // Set default year to current year
    const yearInput = document.getElementById('year');
    if (yearInput) {
      yearInput.value = new Date().getFullYear();
    }
  }

  async submitForm() {
    const subjectCode = document.getElementById('subjectCode').value.trim();
    const subjectName = document.getElementById('subjectName').value.trim();
    const classGroup = document.getElementById('classGroup').value.trim();
    const year = document.getElementById('year').value.trim();
    const semester = document.getElementById('semester').value.trim();
    const startTime = document.getElementById('startTime').value;
    const lateMinute = document.getElementById('lateMinute').value.trim();
    const expireTime = document.getElementById('expireTime').value;
    const description = document.getElementById('description').value.trim();

    // Validate
    if (!subjectCode || !subjectName || !classGroup || !year || !semester || !startTime || !lateMinute || !expireTime) {
      this.showError('กรุณากรอกข้อมูลให้ครบทุกช่องที่จำเป็น');
      return;
    }
    if (!this.teacherId || !this.teacherCode) {
      this.showError('ไม่พบข้อมูลครู');
      return;
    }
    this.showLoading();
    this.hideError();
    try {
      const payload = {
        teacher_id: this.teacherId,
        teacher_code: this.teacherCode,
        subject_code: subjectCode,
        subject_name: subjectName,
        class_group: classGroup,
        year: parseInt(year),
        semester: parseInt(semester),
        start_time: startTime,
        late_minute: parseInt(lateMinute),
        expire_time: expireTime,
        description: description
      };
      const res = await fetch('/api/qrcode/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        const err = await res.json();
        this.showError(err.error || 'เกิดข้อผิดพลาดในการสร้าง QR Code');
      }
    } catch (e) {
      this.showError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      this.hideLoading();
    }
  }

  showQRCode(result) {
    const qrDisplaySection = document.getElementById('qrDisplaySection');
    const qrCodeDiv = document.getElementById('qrCode');
    const qrTokenDiv = document.getElementById('qrToken');
    const qrUrlDiv = document.getElementById('qrUrl');
    const expireTimeDisplay = document.getElementById('expireTimeDisplay');

    if (qrDisplaySection && qrCodeDiv && qrTokenDiv && qrUrlDiv) {
      // Generate QR code using QRCode.js library
      if (typeof QRCode !== 'undefined') {
        qrCodeDiv.innerHTML = '';
        new QRCode(qrCodeDiv, {
          text: result.scan_url,
          width: 200,
          height: 200,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      } else {
        // Fallback if QRCode library is not available
        qrCodeDiv.innerHTML = `
          <div style="background: #f0f0f0; padding: 20px; border-radius: 10px; text-align: center;">
            <p>QR Code จะแสดงที่นี่</p>
            <p>Scan URL: ${result.scan_url}</p>
          </div>
        `;
      }

      // Display token
      qrTokenDiv.textContent = `Token: ${result.token}`;

      // Display scan URL
      qrUrlDiv.textContent = `Scan URL: ${result.scan_url}`;

      // Display expire time
      if (expireTimeDisplay) {
        expireTimeDisplay.textContent = result.expire_time || 120;
      }

      // Show the QR display section
      qrDisplaySection.classList.add('show');

      // Hide the form section
      const qrFormSection = document.querySelector('.qr-form-section');
      if (qrFormSection) {
        qrFormSection.style.display = 'none';
      }

      // Scroll to QR display
      qrDisplaySection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  downloadQR() {
    const qrCodeDiv = document.getElementById('qrCode');
    if (qrCodeDiv && qrCodeDiv.querySelector('canvas')) {
      const canvas = qrCodeDiv.querySelector('canvas');
      const link = document.createElement('a');
      link.download = 'qr-code.png';
      link.href = canvas.toDataURL();
      link.click();
    } else {
      alert('ไม่สามารถดาวน์โหลด QR Code ได้');
    }
  }

  goBack() {
    window.history.back();
  }

  goToDashboard() {
    window.location.href = 'dashboard.html';
  }

  logout() {
    window.location.href = '/';
  }

  showLoading() {
    const loadingDiv = document.getElementById('loading');
    const createBtn = document.getElementById('createBtn');
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (createBtn) {
      createBtn.disabled = true;
      createBtn.textContent = 'กำลังสร้าง...';
    }
  }

  hideLoading() {
    const loadingDiv = document.getElementById('loading');
    const createBtn = document.getElementById('createBtn');
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (createBtn) {
      createBtn.disabled = false;
      createBtn.textContent = '🎯 สร้าง QR Code';
    }
  }

  showError(msg) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
      errorDiv.textContent = msg;
      errorDiv.style.display = 'block';
    }
  }

  hideError() {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
      errorDiv.textContent = '';
      errorDiv.style.display = 'none';
    }
  }
}

// Global functions for onclick handlers (kept for compatibility)
window.goBack = function() {
  if (createQRManager) {
    createQRManager.goBack();
  } else {
    window.history.back();
  }
};

window.logout = function() {
  if (createQRManager) {
    createQRManager.logout();
  } else {
    window.location.href = '/';
  }
};

// Initialize when page loads
let createQRManager;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    createQRManager = new CreateQRManager();
  });
} else {
  createQRManager = new CreateQRManager();
}

function toMySQLDateTime(dt) {
  // dt: '2024-07-10T11:00'
  if (!dt) return null;
  return dt.replace('T', ' ') + ':00';
} 