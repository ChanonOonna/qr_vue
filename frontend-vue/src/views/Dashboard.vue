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
        <button @click="goToBulkCreateQR" class="btn btn-warning">
          📚 สร้าง QR Code หลายครั้ง
        </button>
        <button @click="goToAttendanceSummary" class="btn btn-info">
          📊 สรุปการเข้าเรียน
        </button>
        <button @click="refreshDashboard" class="btn btn-success">
          🔄 รีเฟรช
        </button>
        <button @click="goToFaceRegistration" class="btn btn-secondary">
          🧑‍💻 ลงทะเบียนใบหน้านักเรียน
        </button>
      </div>
      

      <!-- Filter Section -->
      <div class="filter-card">
        <div class="filter-row">
          <div class="filter-group">
            <label for="subjectCode">รหัสวิชา:</label>
            <select 
              id="subjectCode" 
              v-model="filters.subjectCode" 
              class="form-control"
              @change="onSubjectCodeChange"
            >
              <option value="">ทุกรหัสวิชา</option>
              <option v-for="subjectCode in filteredSubjectCodes" :key="subjectCode" :value="subjectCode">
                {{ subjectCode }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label for="subjectFilter">วิชา:</label>
            <select 
              id="subjectFilter" 
              v-model="filters.subjectName" 
              class="form-control"
              @change="onSubjectNameChange"
            >
              <option value="">ทุกวิชา</option>
              <option v-for="subject in filteredSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label for="classGroupFilter">หมู่เรียน:</label>
            <select 
              id="classGroupFilter" 
              v-model="filters.classGroup" 
              class="form-control"
              @change="onClassGroupChange"
            >
              <option value="">ทุกหมู่เรียน</option>
              <option v-for="classGroup in filteredClassGroups" :key="classGroup" :value="classGroup">
                {{ classGroup }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <button @click="clearFilters" class="btn btn-outline">
              <i class="fas fa-times"></i> ล้างตัวกรอง
            </button>
          </div>
        </div>
      </div>

      <!-- QR Sessions List -->
      <div v-if="!qrStore.loading && filteredQRSessions.length > 0" class="qr-section">
        <h2>📋 รายการ QR Code ทั้งหมด</h2>
        <div class="qr-sessions-grid">
          <div 
            v-for="session in filteredQRSessions" 
            :key="session.id"
            class="session-card"
            :class="getSessionStatusClass(getSessionStatus(session))"
          >
            <div class="session-header">
              <div class="session-title-info">
              <h3>{{ session.subject_code }} - {{ session.subject_name }}</h3>
              <span class="status-badge" :class="getSessionStatusClass(getSessionStatus(session))">
                {{ getSessionStatusText(getSessionStatus(session)) }}
              </span>
              </div>
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
              <p><strong>เวลาเริ่มเช็คชื่อ:</strong> {{ formatDateTime(session.start_time) }}</p>
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
      <div v-if="!qrStore.loading && filteredQRSessions.length === 0" class="qr-section">
        <h2>📋 รายการ QR Code</h2>
        <p v-if="qrStore.qrSessions.length === 0">ยังไม่มี QR Code ที่สร้างไว้</p>
        <p v-else>ไม่พบ QR Code ที่ตรงกับตัวกรองที่เลือก</p>
        
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
import { ref, computed, onMounted, nextTick, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { 
  formatDateTime, 
  showNotification,
  getSessionStatus,
  getSessionStatusText,
  getSessionStatusClass
} from '../utils/helpers'
import { qrcodeService } from '../services/qrcode'

export default {
  name: 'Dashboard',
  setup() {
    const authStore = useAuthStore()
    const qrStore = useQRStore()
    const router = useRouter()
    
    const showDeleteModal = ref(false)
    const sessionToDelete = ref(null)
    
    // Filter data
    const subjects = ref([])
    const subjectCodes = ref([])
    const classGroups = ref([])
    const allQRSessionData = ref([])
    
    // Filters
    const filters = reactive({
      subjectCode: '',
      subjectName: '',
      classGroup: ''
    })
    
    // Computed properties for filtered dropdowns
    const filteredSubjectCodes = computed(() => {
      if (!filters.subjectName && !filters.classGroup) {
        return subjectCodes.value
      }
      
      let filteredData = allQRSessionData.value
      
      if (filters.subjectName) {
        filteredData = filteredData.filter(item => item.subject_name === filters.subjectName)
      }
      
      if (filters.classGroup) {
        filteredData = filteredData.filter(item => item.class_group === filters.classGroup)
      }
      
      return filteredData
        .map(item => item.subject_code)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort()
    })
    
    const filteredSubjects = computed(() => {
      if (!filters.subjectCode && !filters.classGroup) {
        return subjects.value
      }
      
      let filteredData = allQRSessionData.value
      
      if (filters.subjectCode) {
        filteredData = filteredData.filter(item => item.subject_code === filters.subjectCode)
      }
      
      if (filters.classGroup) {
        filteredData = filteredData.filter(item => item.class_group === filters.classGroup)
      }
      
      return filteredData
        .map(item => item.subject_name)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort()
    })
    
    const filteredClassGroups = computed(() => {
      if (!filters.subjectCode && !filters.subjectName) {
        return classGroups.value
      }
      
      let filteredData = allQRSessionData.value
      
      if (filters.subjectCode) {
        filteredData = filteredData.filter(item => item.subject_code === filters.subjectCode)
      }
      
      if (filters.subjectName) {
        filteredData = filteredData.filter(item => item.subject_name === filters.subjectName)
      }
      
      return filteredData
        .map(item => item.class_group)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort()
    })
    
    // Filtered QR sessions based on filters
    const filteredQRSessions = computed(() => {
      let sessions = qrStore.qrSessions
      
      if (filters.subjectCode) {
        sessions = sessions.filter(session => session.subject_code === filters.subjectCode)
      }
      
      if (filters.subjectName) {
        sessions = sessions.filter(session => session.subject_name === filters.subjectName)
      }
      
      if (filters.classGroup) {
        sessions = sessions.filter(session => session.class_group === filters.classGroup)
      }
      
      return sessions
    })

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

    const goToAttendanceSummary = () => {
      router.push('/attendance-summary')
    }

    const goToBulkCreateQR = () => {
      router.push('/bulk-create-qr')
    }

    const refreshDashboard = async () => {
      try {
        // โหลดเฉพาะ QR Sessions ใหม่ ไม่ต้องโหลด subjects ซ้ำ
        await qrStore.loadQRSessions()
        
        // อัปเดตข้อมูล subjects สำหรับ dropdown ถ้าจำเป็น
        await loadQRSessionSubjects()
        
        showNotification('อัปเดตข้อมูลแล้ว', 'success')
      } catch (error) {
        console.error('Error refreshing dashboard:', error)
        showNotification('เกิดข้อผิดพลาดในการอัปเดตข้อมูล', 'error')
      }
    }
    
    // Methods for handling filter changes
    const onSubjectCodeChange = () => {
      if (filters.subjectCode) {
        const validSubjects = allQRSessionData.value
          .filter(item => item.subject_code === filters.subjectCode)
          .map(item => item.subject_name)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const validClassGroups = allQRSessionData.value
          .filter(item => item.subject_code === filters.subjectCode)
          .map(item => item.class_group)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        if (filters.subjectName && !validSubjects.includes(filters.subjectName)) {
          filters.subjectName = ''
        }
        
        if (filters.classGroup && !validClassGroups.includes(filters.classGroup)) {
          filters.classGroup = ''
        }
      }
    }
    
    const onSubjectNameChange = () => {
      if (filters.subjectName) {
        const validSubjectCodes = allQRSessionData.value
          .filter(item => item.subject_name === filters.subjectName)
          .map(item => item.subject_code)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const validClassGroups = allQRSessionData.value
          .filter(item => item.subject_name === filters.subjectName)
          .map(item => item.class_group)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        if (filters.subjectCode && !validSubjectCodes.includes(filters.subjectCode)) {
          filters.subjectCode = ''
        }
        
        if (filters.classGroup && !validClassGroups.includes(filters.classGroup)) {
          filters.classGroup = ''
        }
      }
    }
    
    const onClassGroupChange = () => {
      if (filters.classGroup) {
        const validSubjectCodes = allQRSessionData.value
          .filter(item => item.class_group === filters.classGroup)
          .map(item => item.subject_code)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const validSubjects = allQRSessionData.value
          .filter(item => item.class_group === filters.classGroup)
          .map(item => item.subject_name)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        if (filters.subjectCode && !validSubjectCodes.includes(filters.subjectCode)) {
          filters.subjectCode = ''
        }
        
        if (filters.subjectName && !validSubjects.includes(filters.subjectName)) {
          filters.subjectName = ''
        }
      }
    }
    
    const clearFilters = () => {
      filters.subjectCode = ''
      filters.subjectName = ''
      filters.classGroup = ''
    }
    
    // Load QR session subjects for filter dropdowns
    const loadQRSessionSubjects = async () => {
      try {
        const response = await qrcodeService.getQRSessionSubjects()
        if (response.success) {
          const qrSubjects = response.data
          
          allQRSessionData.value = qrSubjects
          
          const uniqueSubjects = [...new Set(qrSubjects.map(item => item.subject_name).filter(Boolean))]
          const uniqueSubjectCodes = [...new Set(qrSubjects.map(item => item.subject_code).filter(Boolean))]
          const uniqueClassGroups = [...new Set(qrSubjects.map(item => item.class_group).filter(Boolean))]
          
          subjects.value = uniqueSubjects.sort()
          subjectCodes.value = uniqueSubjectCodes.sort()
          classGroups.value = uniqueClassGroups.sort()
        }
      } catch (error) {
        console.error('Error loading QR session subjects:', error)
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
        // Load QR session subjects for filters
        await loadQRSessionSubjects()
        
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
      subjects,
      subjectCodes,
      classGroups,
      allQRSessionData,
      filteredSubjectCodes,
      filteredSubjects,
      filteredClassGroups,
      filteredQRSessions,
      filters,
      handleLogout,
      goToCreateQR,
      goToFaceRegistration,
      goToAttendanceSummary,
      goToBulkCreateQR,
      refreshDashboard,
      onSubjectCodeChange,
      onSubjectNameChange,
      onClassGroupChange,
      clearFilters,
      loadQRSessionSubjects,
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
/* Filter Section Styles */
.filter-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-row {
  display: flex;
  gap: 20px;
  align-items: end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 150px;
}

.filter-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
}

.filter-group .form-control {
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.filter-group .form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.btn-outline {
  background: white;
  color: #007bff;
  border: 2px solid #007bff;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-outline:hover {
  background: #007bff;
  color: white;
}

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

/* Additional button styles */
.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background: #e0a800;
}

/* Responsive Design */
/* Desktop/Laptop (≥768px) - Default styles already defined above */

/* Tablet (376px - 768px) */
@media (max-width: 768px) and (min-width: 376px) {
  .dashboard-header {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }
  
  .user-info {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .action-buttons {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .filter-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .qr-sessions-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .session-card {
    padding: 20px;
  }
  
  .session-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .session-actions {
    align-self: stretch;
    justify-content: space-between;
  }
  
  .session-stats {
    flex-direction: row;
    justify-content: space-around;
  }
}

/* iPhone 11 และมือถือเล็ก (≤375px) */
@media (max-width: 375px) {
  .dashboard-container {
    padding: 5px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 15px;
    padding: 15px 10px;
  }
  
  .dashboard-title {
    font-size: 1.3rem;
  }
  
  .user-info {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .user-avatar {
    width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }
  
  .user-name {
    font-size: 0.9rem;
  }
  
  .user-teacher-code {
    font-size: 0.8rem;
  }
  
  .logout-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
    width: 100%;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    margin: 0 5px;
  }
  
  .stat-card {
    padding: 12px;
    margin: 0 5px;
  }
  
  .stat-number {
    font-size: 1.8rem;
  }
  
  .stat-label {
    font-size: 0.9rem;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
    gap: 8px;
    margin: 0 5px;
  }
  
  .btn {
    padding: 10px 16px;
    font-size: 0.85rem;
    width: 100%;
    justify-content: center;
  }
  
  .filter-card {
    padding: 12px;
    margin: 0 5px 15px 5px;
  }
  
  .filter-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .filter-group label {
    font-size: 0.9rem;
    margin-bottom: 6px;
  }
  
  .form-control {
    padding: 8px 10px;
    font-size: 0.9rem;
  }
  
  .btn-outline {
    padding: 8px 12px;
    font-size: 0.85rem;
    width: 100%;
  }
  
  .qr-sessions-grid {
    grid-template-columns: 1fr;
    gap: 10px;
    margin: 0 5px;
  }
  
  .session-card {
    padding: 12px;
    margin: 0 5px;
  }
  
  .session-title-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }
  
  .session-header h3 {
    font-size: 1rem;
  }
  
  .status-badge {
    font-size: 0.7rem;
    padding: 3px 8px;
  }
  
  .session-actions {
    gap: 6px;
  }
  
  .btn-small {
    padding: 6px 10px;
    font-size: 0.8rem;
  }
  
  .session-info p {
    font-size: 0.85rem;
    margin: 5px 0;
  }
  
  .session-stats {
    flex-direction: row;
    justify-content: space-around;
    gap: 10px;
  }
  
  .stat {
    text-align: center;
  }
  
  .session-stat-number {
    font-size: 1.2rem;
  }
  
  .stat-label {
    font-size: 0.8rem;
  }
  
  /* Modal สำหรับมือถือเล็ก */
  .modal {
    padding: 10px;
  }
  
  .modal-content {
    max-width: 100%;
    border-radius: 15px;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .modal-actions .btn {
    width: 100%;
  }
  
  /* Loading และ Error states */
  .loading, .error {
    padding: 15px 10px;
    margin: 0 5px;
  }
  
  .loading p, .error p {
    font-size: 0.85rem;
  }
}
</style> 