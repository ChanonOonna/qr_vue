// Setup Teacher Code functionality
class SetupTeacherCodeManager {
  constructor() {
    this.userInfo = null;
    this.init();
  }

  init() {
    console.log('Setup Teacher Code page initializing...');
    this.loadUserInfo();
    this.setupEventListeners();
    console.log('Setup Teacher Code page initialized');
  }

  async loadUserInfo() {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        this.userInfo = await response.json();
        this.updateUserDisplay();
      } else {
        this.showError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
      this.showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  }

  updateUserDisplay() {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    
    if (this.userInfo && userName) {
      userName.textContent = this.userInfo.name || 'ไม่ระบุชื่อ';
    }
    
    if (this.userInfo && userEmail) {
      userEmail.textContent = this.userInfo.email || 'ไม่ระบุอีเมล';
    }
  }

  setupEventListeners() {
    const form = document.getElementById('teacherCodeForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitTeacherCode();
      });
    }

    // Auto-format teacher code input
    const teacherCodeInput = document.getElementById('teacherCode');
    if (teacherCodeInput) {
      teacherCodeInput.addEventListener('input', (e) => {
        // Convert to uppercase and remove special characters
        let value = e.target.value.toUpperCase();
        value = value.replace(/[^A-Z0-9]/g, '');
        e.target.value = value;
      });
    }

    const createQRForm = document.getElementById('createQRForm');
    if (createQRForm) {
      createQRForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitForm();
      });
    }
  }

  async submitTeacherCode() {
    const teacherCodeInput = document.getElementById('teacherCode');
    const setupBtn = document.getElementById('setupBtn');
    
    if (!teacherCodeInput || !setupBtn) {
      return;
    }

    const teacherCode = teacherCodeInput.value.trim();
    
    if (!teacherCode) {
      this.showError('กรุณากรอกรหัสครู');
      return;
    }

    // Validate teacher code format
    if (!/^[A-Z0-9]+$/.test(teacherCode)) {
      this.showError('รหัสครูต้องประกอบด้วยตัวอักษรและตัวเลขเท่านั้น');
      return;
    }

    try {
      this.showLoading();
      this.hideError();

      const response = await fetch('/api/user/teacher-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          teacher_code: teacherCode
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.showSuccess('บันทึกรหัสครูเรียบร้อยแล้ว');
        
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการบันทึกรหัสครู');
      }

    } catch (error) {
      console.error('Failed to submit teacher code:', error);
      this.showError(error.message || 'เกิดข้อผิดพลาดในการบันทึกรหัสครู');
    } finally {
      this.hideLoading();
    }
  }

  showLoading() {
    const loadingDiv = document.getElementById('loading');
    const setupBtn = document.getElementById('setupBtn');
    
    if (loadingDiv) {
      loadingDiv.style.display = 'block';
    }
    
    if (setupBtn) {
      setupBtn.disabled = true;
      setupBtn.textContent = 'กำลังบันทึก...';
    }
  }

  hideLoading() {
    const loadingDiv = document.getElementById('loading');
    const setupBtn = document.getElementById('setupBtn');
    
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
    
    if (setupBtn) {
      setupBtn.disabled = false;
      setupBtn.textContent = '✅ บันทึกรหัสครู';
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
      errorDiv.textContent = message;
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

  showSuccess(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #27ae60;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  }
}

// Initialize when page loads
let setupManager;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupManager = new SetupTeacherCodeManager();
  });
} else {
  setupManager = new SetupTeacherCodeManager();
} 