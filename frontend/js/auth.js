// Authentication handling for QR Attendance System
class AuthManager {
  constructor() {
    this.loginBtn = document.getElementById('loginBtn');
    this.errorDiv = document.getElementById('error');
    this.loadingDiv = document.getElementById('loading');
    
    this.init();
  }

  init() {
    // Check if user is already authenticated
    this.checkAuthStatus();
    
    // Add event listeners
    if (this.loginBtn) {
      this.loginBtn.addEventListener('click', () => this.login());
    }
  }

  async checkAuthStatus() {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const user = await response.json();
        this.redirectToDashboard();
      } else {
        this.showLoginForm();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      this.showLoginForm();
    }
  }

  async login() {
    this.showLoading();
    this.hideError();
    
    try {
      // Redirect to Auth0 login
      window.location.href = '/login';
    } catch (error) {
      console.error('Login failed:', error);
      this.showError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
      this.hideLoading();
    }
  }

  async logout() {
    try {
      await fetch('/logout', {
        method: 'GET',
        credentials: 'include'
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/';
    }
  }

  redirectToDashboard() {
    window.location.href = '/dashboard';
  }

  showLoginForm() {
    if (this.loginBtn) {
      this.loginBtn.style.display = 'flex';
    }
    this.hideLoading();
  }

  showLoading() {
    if (this.loadingDiv) {
      this.loadingDiv.style.display = 'block';
    }
    if (this.loginBtn) {
      this.loginBtn.disabled = true;
      this.loginBtn.style.opacity = '0.6';
    }
  }

  hideLoading() {
    if (this.loadingDiv) {
      this.loadingDiv.style.display = 'none';
    }
    if (this.loginBtn) {
      this.loginBtn.disabled = false;
      this.loginBtn.style.opacity = '1';
    }
  }

  showError(message) {
    if (this.errorDiv) {
      this.errorDiv.textContent = message;
      this.errorDiv.style.display = 'block';
    }
  }

  hideError() {
    if (this.errorDiv) {
      this.errorDiv.textContent = '';
      this.errorDiv.style.display = 'none';
    }
  }
}

// Dashboard functionality moved to dashboard.js
// This class is now defined in dashboard.js to avoid conflicts

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  
  if (currentPath === '/' || currentPath === '/index.html') {
    new AuthManager();
  }
  // Dashboard initialization is handled in dashboard.js
});

// Global logout function
window.logout = function() {
  fetch('/logout', {
    method: 'GET',
    credentials: 'include'
  }).then(() => {
    window.location.href = '/';
  }).catch(() => {
    window.location.href = '/';
  });
};
