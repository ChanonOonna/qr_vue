// Main.js - Common utilities and initialization
(function() {
  'use strict';

  // Common utility functions
  window.utils = {
    // Format date to Thai locale
    formatDate: function(date) {
      return new Date(date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // Show notification
    showNotification: function(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      
      // Add styles
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
      `;

      // Set background color based on type
      switch(type) {
        case 'success':
          notification.style.backgroundColor = '#27ae60';
          break;
        case 'error':
          notification.style.backgroundColor = '#e74c3c';
          break;
        case 'warning':
          notification.style.backgroundColor = '#f39c12';
          break;
        default:
          notification.style.backgroundColor = '#3498db';
      }

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
    },

    // Copy text to clipboard
    copyToClipboard: function(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.showNotification('คัดลอกแล้ว', 'success');
        }).catch(() => {
          this.fallbackCopyToClipboard(text);
        });
      } else {
        this.fallbackCopyToClipboard(text);
      }
    },

    // Fallback copy method
    fallbackCopyToClipboard: function(text) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        this.showNotification('คัดลอกแล้ว', 'success');
      } catch (err) {
        this.showNotification('ไม่สามารถคัดลอกได้', 'error');
      }
      
      document.body.removeChild(textArea);
    },

    // Validate email format
    isValidEmail: function(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    // Generate random token
    generateToken: function(length = 8) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  };

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Initialize common functionality
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Main.js initialized');
    
    // Add loading states to all buttons
    const buttons = document.querySelectorAll('button[type="submit"], .btn');
    buttons.forEach(button => {
      button.addEventListener('click', function() {
        if (!this.disabled) {
          const originalText = this.innerHTML;
          this.innerHTML = 'กำลังโหลด...';
          this.disabled = true;
          
          // Re-enable after 3 seconds if not handled by specific handlers
          setTimeout(() => {
            if (this.disabled) {
              this.innerHTML = originalText;
              this.disabled = false;
            }
          }, 3000);
        }
      });
    });
  });

})();
