<template>
  <div class="dashboard">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="dashboard-title">📚 QR Attendance Dashboard</div>
      <div class="user-info">
        <div class="user-avatar">
          {{ userInitial }}
        </div>
        <div class="user-details">
          <span class="user-name">{{ authStore.userInfo?.name || 'ครู' }}</span>
          <span class="user-teacher-code">รหัส: {{ authStore.userInfo?.teacher_code || 'ไม่ระบุ' }}</span>
        </div>
        <button @click="handleLogout" class="logout-btn">ออกจากระบบ</button>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- Statistics -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ totalSessions }}</div>
          <div class="stat-label">QR Sessions</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="goToCreateQR" class="btn btn-primary">
          📱 สร้าง QR Code ใหม่
        </button>
        <button @click="refreshDashboard" class="btn btn-success">
          🔄 รีเฟรช
        </button>
        <button @click="goToFaceRegistration" class="btn btn-secondary">
          🧑‍💻 ลงทะเบียนใบหน้านักเรียน
        </button>
      </div>

      <!-- QR Sessions List -->
      <div v-if="!qrStore.loading && qrStore.qrSessions.length > 0" class="qr-section">
        <h2>📋 รายการ QR Code ทั้งหมด</h2>
        <div class="qr-sessions-grid">
          <div 
            v-for="session in qrStore.qrSessions" 
            :key="session.id"
            class="session-card"
            :class="getSessionStatusClass(getSessionStatus(session))"
          >
            <div class="session-header">
              <h3>{{ session.subject_code }} - {{ session.subject_name }}</h3>
              <span class="status-badge" :class="getSessionStatusClass(getSessionStatus(session))">
                {{ getSessionStatusText(getSessionStatus(session)) }}
              </span>
              <div class="session-actions">
                <button @click="viewSessionDetail(session.id)" class="btn btn-small btn-eye" title="ดูรายละเอียด">
                  👁️
                </button>
                <button @click="confirmDeleteSession(session.id)" class="btn btn-small btn-trash" title="ลบ QR Code">
                  🗑️
                </button>
              </div>
            </div>
            <div class="session-info">
              <p><strong>กลุ่ม:</strong> {{ session.class_group }}</p>
              <p><strong>เวลาสร้าง:</strong> {{ formatDateTime(session.created_at) }}</p>
              <p><strong>หมดอายุ:</strong> {{ formatDateTime(session.expire_time) }}</p>
            </div>
            <div class="session-stats">
              <div class="stat">
                <span class="session-stat-number">{{ session.total_attendance || 0 }}</span>
                <span class="stat-label">นักเรียน</span>
              </div>
              <div class="stat">
                <span class="session-stat-number present">{{ session.present_count || 0 }}</span>
                <span class="stat-label">มา</span>
              </div>
              <div class="stat">
                <span class="session-stat-number late">{{ session.late_count || 0 }}</span>
                <span class="stat-label">สาย</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="qrStore.loading" class="loading">
        <div class="spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>

      <!-- Error State -->
      <div v-if="qrStore.error" class="error">
        <p>{{ qrStore.error }}</p>
      </div>

      <!-- Empty State -->
      <div v-if="!qrStore.loading && qrStore.qrSessions.length === 0" class="qr-section">
        <h2>📋 รายการ QR Code</h2>
        <p>ยังไม่มี QR Code ที่สร้างไว้</p>
        
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <p>คุณต้องการลบ QR Code นี้หรือไม่?</p>
        <div class="modal-actions">
          <button @click="cancelDelete" class="btn btn-secondary">ยกเลิก</button>
          <button @click="confirmDelete" class="btn btn-danger">ลบ</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'
import { useQRStore } from '../stores/qr'
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { 
  formatDateTime, 
  showNotification,
  getSessionStatus,
  getSessionStatusText,
  getSessionStatusClass
} from '../utils/helpers'
import faceModelsService from '../services/faceModels'

export default {
  name: 'Dashboard',
  setup() {
    const authStore = useAuthStore()
    const qrStore = useQRStore()
    const router = useRouter()
    
    const showDeleteModal = ref(false)
    const sessionToDelete = ref(null)

    const userInitial = computed(() => {
      const name = authStore.userInfo?.name || ''
      return name.charAt(0).toUpperCase()
    })

    const totalSessions = computed(() => {
      return qrStore.totalSessions
    })

    const handleLogout = async () => {
      try {
        await authStore.logout()
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    const goToCreateQR = () => {
      router.push('/create-qr')
    }

    const goToFaceRegistration = () => {
      router.push('/face-registration')
    }

    const refreshDashboard = async () => {
      try {
        await qrStore.loadQRSessions()
        showNotification('อัปเดตข้อมูลแล้ว', 'success')
      } catch (error) {
        showNotification('เกิดข้อผิดพลาดในการอัปเดตข้อมูล', 'error')
      }
    }

    const viewSessionDetail = (sessionId) => {
      router.push(`/dashboard/session/${sessionId}`)
    }

    const confirmDeleteSession = (sessionId) => {
      sessionToDelete.value = sessionId
      showDeleteModal.value = true
    }

    const cancelDelete = () => {
      showDeleteModal.value = false
      sessionToDelete.value = null
    }

    const confirmDelete = async () => {
      if (sessionToDelete.value) {
        try {
          console.log('Dashboard - Before delete - Total sessions:', qrStore.totalSessions)
          await qrStore.deleteQRSession(sessionToDelete.value)
          
          // Wait for Vue to update the DOM
          await nextTick()
          
          console.log('Dashboard - After delete - Total sessions:', qrStore.totalSessions)
          showNotification('ลบ QR Code สำเร็จ', 'success')
        } catch (error) {
          showNotification('เกิดข้อผิดพลาดในการลบ QR Code', 'error')
        }
      }
      cancelDelete()
    }

    onMounted(async () => {
      try {
        // Load face models in background after successful login
        if (authStore.isAuthenticated) {
          console.log('🔄 Loading face models in background...')
          
          // Load models in background (don't block UI)
          faceModelsService.loadModels()
            .then(() => {
              console.log('✅ Face models loaded successfully in Dashboard')
            })
            .catch((error) => {
              console.error('❌ Failed to load face models in Dashboard:', error)
              // Don't show error to user - models will be loaded when needed
            })
        }
        
        // Load QR sessions
        await qrStore.loadQRSessions()
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      }
    })

    return {
      authStore,
      qrStore,
      userInitial,
      totalSessions,
      showDeleteModal,
      handleLogout,
      goToCreateQR,
      goToFaceRegistration,
      refreshDashboard,
      viewSessionDetail,
      confirmDeleteSession,
      cancelDelete,
      confirmDelete,
      getSessionStatus,
      getSessionStatusText,
      getSessionStatusClass,
      formatDateTime
    }
  }
}
</script>

<style scoped>
/* Additional styles for session actions */
.session-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-eye, .btn-trash {
      padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

/* Status badge styles */
.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-badge.expired {
  background: #f8d7da;
  color:rgb(196, 31, 47);
  border: 1px solid #f5c6cb;
}

.status-badge.notyet {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-badge.inactive {
  background: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

/* Session card status styles */
.session-card.active {
  border-left: 4px solid #28a745;
}

.session-card.expired {
  border-left: 4px solid rgb(196, 31, 47);;
}

.session-card.notyet {
  border-left: 4px solid #ffc107;
}

.session-card.inactive {
  border-left: 4px solid #6c757d;
}
</style> 