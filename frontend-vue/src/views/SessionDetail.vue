<template>
<div class ="main_background">
  <div class="session-detail-content">
    <!-- Header Bar -->
    <div class="dashboard-header">
      <div class="dashboard-title">📚 QR Attendance Dashboard</div>
      <div class="user-info">
        <div class="user-avatar">{{ userInitial }}</div>
        <div class="user-details">
          <span class="user-name">{{ authStore.userInfo?.name || 'ครู' }}</span>
          <span class="user-teacher-code">รหัส: {{ authStore.userInfo?.teacher_code || 'ไม่ระบุ' }}</span>
        </div>
        <button @click="goBack" class="logout-btn">ออกจากระบบ</button>
      </div>
    </div>

    <div class="session-detail-card">
      <!-- Session Header -->
      <div class="session-detail-header">
        <button @click="goBack" class="btn-back-main">
          ← กลับไปหน้าหลัก
        </button>
        <h2>{{ session?.subject_code }} - {{ session?.subject_name }}</h2>
      </div>
      
      <!-- Session Info Grid -->
      <div class="session-info-grid">
        <!-- Subject Information -->
        <div class="info-card">
          <h4>📚 ข้อมูลวิชา</h4>
          <p><strong>รหัสวิชา:</strong> {{ session?.subject_code }}</p>
          <p><strong>ชื่อวิชา:</strong> {{ session?.subject_name }}</p>
          <p><strong>กลุ่ม:</strong> {{ session?.class_group }}</p>
          <p><strong>เวลาสร้าง:</strong> {{ formatDateTime(session?.created_at) }}</p>
          <p><strong>เวลาเริ่มเช็คชื่อ:</strong> {{ formatDateTime(session?.start_time) }}</p>
          <p><strong>หมดอายุ:</strong> {{ formatDateTime(session?.expire_time) }}</p>
          <p><strong>นาทีที่ถือว่าสาย:</strong> {{ session?.late_minute }} นาที</p>
          <p><strong>สถานะ:</strong> 
            <span :class="`status-${getSessionStatusClass(getSessionStatus(session))}`">
              {{ getSessionStatusText(getSessionStatus(session)) }}
            </span>
          </p>
        </div>
        
        <!-- Attendance Statistics -->
        <div class="info-card">
          <h4>📊 สถิติการเช็คชื่อ</h4>
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-number">{{ attendance.length }}</span>
              <span class="stat-label">นักเรียนทั้งหมด</span>
            </div>
            <div class="stat-item">
              <span class="stat-number present">{{ presentCount }}</span>
              <span class="stat-label">มา</span>
            </div>
            <div class="stat-item">
              <span class="stat-number late">{{ lateCount }}</span>
              <span class="stat-label">สาย</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- QR Code Section -->
      <div class="qr-code-section">
        <div class="info-card">
          <h4>📱 QR Code สำหรับเช็คชื่อ</h4>
          <div class="qr-display">
            <div class="qr-code-container">
              <img 
                :src="session?.qr_code_image" 
                alt="QR Code" 
                class="qr-code-image" 
                @click="showQRModal"
                style="cursor: zoom-in;"
              >
            </div>
            <div class="qr-info">
              <div class="qr-token-section">
                <label><strong>QR Token:</strong></label>
                <div class="token-display">
                  <input 
                    type="text" 
                    :value="session?.qr_token" 
                    readonly 
                    class="token-input" 
                    ref="qrTokenInput"
                  >
                  <button @click="copyToken" class="btn btn-small btn-copy-token">
                    📋 คัดลอก
                  </button>
                </div>
              </div>
              <div class="qr-link-section">
                <label><strong>ลิงก์สำหรับนักเรียน:</strong></label>
                <div class="link-display">
                  <input 
                    type="text" 
                    :value="scanUrl" 
                    readonly 
                    class="link-input" 
                    ref="scanUrlInput"
                  >
                  <button @click="copyLink" class="btn btn-small btn-copy-link">
                    📋 คัดลอก
                  </button>
                </div>
              </div>
              <div class="qr-instructions">
                <p><strong>วิธีใช้งาน:</strong></p>
                <ol>
                  <li>แสดง QR Code ให้นักเรียนสแกน</li>
                  <li>หรือให้นักเรียนไปที่ลิงก์ด้านบน</li>
                  <li>นักเรียนกรอก QR Token เพื่อเช็คชื่อ</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- QR Code Modal -->
      <div v-if="showModal" class="qr-modal" @click="hideQRModal">
        <div class="qr-modal-content" @click.stop>
          <img 
            :src="session?.qr_code_image" 
            alt="QR Code" 
            class="qr-modal-image"
          >
          <button @click="hideQRModal" class="qr-modal-close">&times;</button>
        </div>
      </div>
      
      <!-- Attendance Table -->
      <div class="attendance-table">
        <div class="table-header">
          <h3>รายการเช็คชื่อ</h3>
          <div class="table-actions">
            <button @click="refreshAttendance" class="btn btn-success btn-refresh-attendance">
              🔄 รีเฟรช
            </button>
            <button @click="exportAttendance" class="btn btn-primary btn-export-attendance">
              📥 Export Excel
            </button>
          </div>
        </div>
        <div class="table-content">
          <table>
            <thead>
              <tr>
                <th>รหัสนักเรียน</th>
                <th>ชื่อ-นามสกุล</th>
                <th>เวลาเช็คชื่อ</th>
                <th>สถานะ</th>
                <th>คะแนนเพิ่มเติม</th>
                <th>หมายเหตุ</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="attendance.length === 0">
                <td colspan="7" class="empty-message">
                  ยังไม่มีนักเรียนเช็คชื่อ
                </td>
              </tr>
              <tr v-for="record in attendance" :key="record.id">
                <td>{{ record.student_code }}</td>
                <td>{{ record.firstname }} {{ record.lastname }}</td>
                <td>{{ formatDateTime(record.checkin_time) }}</td>
                <td>
                  <span :class="`status-${getAttendanceStatusClass(record.status)}`">
                    {{ record.status }}
                  </span>
                </td>
                <td>
                  <input 
                    type="number" 
                    class="score-input" 
                    :value="record.extra_score || 0" 
                    min="0" 
                    max="100"
                    @change="updateScore(record.id, $event.target.value, record.notes || '')"
                  >
                </td>
                <td>
                  <input 
                    type="text" 
                    class="notes-input" 
                    :value="record.notes || ''" 
                    @change="updateScore(record.id, record.extra_score || 0, $event.target.value)"
                  >
                </td>
                <td>
                  <button @click="saveAttendance(record.id)" class="btn btn-small btn-save-attendance">
                    💾 บันทึก
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { useRouter, useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { useQRStore } from '../stores/qr'
import { useAuthStore } from '../stores/auth'
import { 
  formatDateTime, 
  getSessionStatus, 
  getSessionStatusText, 
  getSessionStatusClass,
  getAttendanceStatusClass,
  showNotification 
} from '../utils/helpers'

export default {
  name: 'SessionDetail',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const qrStore = useQRStore()
    const authStore = useAuthStore()
    
    const session = ref(null)
    const attendance = ref([])
    const showModal = ref(false)
    const qrTokenInput = ref(null)
    const scanUrlInput = ref(null)
    
    // Get sessionId from route params
    const sessionId = route.params.sessionId
    
    const userInitial = computed(() => {
      const name = authStore.userInfo?.name || ''
      return name.charAt(0).toUpperCase()
    })
    
    const scanUrl = computed(() => {
      return `${window.location.origin}/scan`
    })
    
    const presentCount = computed(() => {
      return attendance.value.filter(a => a.status === 'มา').length
    })
    
    const lateCount = computed(() => {
      return attendance.value.filter(a => a.status === 'สาย').length
    })
    
    const goBack = () => {
      router.push('/dashboard')
    }
    
    const loadSessionDetail = async () => {
      try {
        await qrStore.loadSessionDetail(sessionId)
        session.value = qrStore.currentSession
        attendance.value = qrStore.attendance
      } catch (error) {
        console.error('Failed to load session detail:', error)
        showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
      }
    }
    
    const refreshAttendance = async () => {
      try {
        await qrStore.refreshAttendance(sessionId)
        attendance.value = qrStore.attendance
        showNotification('อัปเดตข้อมูลการเช็คชื่อแล้ว', 'success')
      } catch (error) {
        console.error('Failed to refresh attendance:', error)
        showNotification('เกิดข้อผิดพลาดในการอัปเดตข้อมูล', 'error')
      }
    }
    
    const exportAttendance = async () => {
      try {
        await qrStore.exportAttendance(sessionId)
        showNotification('ส่งออกข้อมูลสำเร็จ', 'success')
      } catch (error) {
        console.error('Failed to export attendance:', error)
        showNotification('เกิดข้อผิดพลาดในการส่งออกข้อมูล', 'error')
      }
    }
    
    const copyToken = async () => {
      if (qrTokenInput.value) {
        qrTokenInput.value.select()
        document.execCommand('copy')
        showNotification('คัดลอก QR Token แล้ว', 'success')
      }
    }
    
    const copyLink = async () => {
      if (scanUrlInput.value) {
        scanUrlInput.value.select()
        document.execCommand('copy')
        showNotification('คัดลอกลิงก์แล้ว', 'success')
      }
    }
    
    const showQRModal = () => {
      showModal.value = true
    }
    
    const hideQRModal = () => {
      showModal.value = false
    }
    
    const updateScore = async (attendanceId, extraScore, notes) => {
      try {
        await qrStore.updateAttendanceRecord(attendanceId, parseInt(extraScore) || 0, notes || '')
        showNotification('อัปเดตคะแนนเรียบร้อยแล้ว', 'success')
      } catch (error) {
        console.error('Failed to update score:', error)
        showNotification('เกิดข้อผิดพลาดในการอัปเดตคะแนน', 'error')
      }
    }
    
    const saveAttendance = async (attendanceId) => {
      const record = attendance.value.find(a => a.id === attendanceId)
      if (record) {
        await updateScore(attendanceId, record.extra_score || 0, record.notes || '')
      }
    }
    
    onMounted(() => {
      loadSessionDetail()
    })
    
    return {
      authStore,
      session,
      attendance,
      showModal,
      qrTokenInput,
      scanUrlInput,
      scanUrl,
      presentCount,
      lateCount,
      userInitial,
      goBack,
      refreshAttendance,
      exportAttendance,
      copyToken,
      copyLink,
      showQRModal,
      hideQRModal,
      updateScore,
      saveAttendance,
      formatDateTime,
      getSessionStatus,
      getSessionStatusText,
      getSessionStatusClass,
      getAttendanceStatusClass
    }
  }
}
</script>

<style scoped>
.main_background {
  
}

.session-detail-content {
  padding: 0;
  margin: 0;
  background: #f8f9fa;
  min-height: 100vh;
  width: 100%;
}

/* Dashboard Header */
.dashboard-header {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.dashboard-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-teacher-code {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.2rem;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #c0392b;
}

.session-detail-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 30px;
  margin-bottom: 0px;

}

.session-detail-header {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px 30px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.btn-back-main {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.btn-back-main:hover {
  background: #7f8c8d;
}

.session-detail-header h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
}

.session-info-grid {
  display: grid;
  gap: 20px;
  padding: 30px;
}

.info-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.info-card h4 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.info-card p {
  margin: 8px 0;
  color: #666;
  font-size: 0.95rem;
}

.info-card strong {
  color: #333;
}

.stats-row {
  display: flex;
  gap: 20px;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  color: #4285f4;
  margin-bottom: 10px;
}

.stat-number.present {
  color: #27ae60;
}

.stat-number.late {
  color: #f39c12;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.qr-code-section {
  padding: 0 30px 30px;
}

.qr-display {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
  align-items: start;
}

.qr-code-container {
  text-align: center;
}

.qr-code-image {
  max-width: 100%;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.qr-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.qr-token-section, .qr-link-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.token-display, .link-display {
  display: flex;
  gap: 10px;
}

.token-input, .link-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.9rem;
  background: #f8f9fa;
  transition: border-color 0.3s ease;
}

.token-input:focus, .link-input:focus {
  outline: none;
  border-color: #4285f4;
}

.btn-copy-token, .btn-copy-link {
  padding: 12px 24px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-copy-token:hover, .btn-copy-link:hover {
  background: #3367d6;
  transform: translateY(-2px);
}

.qr-instructions {
  background: #e8f4fd;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #4285f4;
}

.qr-instructions p {
  margin: 0 0 10px 0;
  font-weight: 600;
  color: #333;
}

.qr-instructions ol {
  margin: 0;
  padding-left: 20px;
}

.qr-instructions li {
  margin: 5px 0;
  color: #666;
}

/* QR Modal */
.qr-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.qr-modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.qr-modal-image {
  width: 60vw;
  max-width: 600px;
  max-height: 80vh;
  display: block;
  margin: auto;
  box-shadow: 0 0 24px #000;
  border-radius: 12px;
}

.qr-modal-close {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 2rem;
  background: #fff;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Attendance Table */
.attendance-table {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin: 0 30px 30px;
}

.table-header {
  background: #4285f4;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.table-actions {
  display: flex;
  gap: 15px;
}

.btn {
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

.btn-primary {
  background: #4285f4;
  color: white;
}

.btn-primary:hover {
  background: #3367d6;
  transform: translateY(-2px);
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover {
  background: #229954;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.8rem;
}

.table-content {
  max-height: 400px;
  overflow-y: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #e1e8ed;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
}

.status-present {
  color: #27ae60;
  font-weight: 600;
}

.status-late {
  color: #f39c12;
  font-weight: 600;
}

.status-absent {
  color: #e74c3c;
  font-weight: 600;
}

.score-input, .notes-input {
  padding: 12px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.score-input:focus, .notes-input:focus {
  outline: none;
  border-color: #4285f4;
}

.score-input {
  width: 80px;
  text-align: center;
}

.btn-save-attendance {
  padding: 6px 12px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.btn-save-attendance:hover {
  background: #229954;
}

/* Status badges */
.status-active {
  color: #27ae60;
  font-weight: 600;
}

.status-expired {
  color: #e74c3c;
  font-weight: 600;
}

.status-notyet {
  color: #f39c12;
  font-weight: 600;
}

.status-inactive {
  color: #95a5a6;
  font-weight: 600;
}

.hidden {
  display: none;
}

.loading {
  text-align: center;
  padding: 40px;
}

.error {
  color: #e74c3c;
  text-align: center;
  padding: 20px;
}

.empty-message {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 40px;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 15px 20px;
    flex-direction: column;
    gap: 15px;
  }
  
  .session-detail-header {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .session-info-grid {
    grid-template-columns: 1fr;
  }
  
  .qr-display {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .stats-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .table-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .table-actions {
    flex-direction: column;
  }
  
  .table-content {
    max-height: 400px;
  }
  
  th, td {
    padding: 10px;
    font-size: 0.9rem;
  }
}
</style> 