<template>
  <div class="attendance-summary-background">
  <div class="attendance-summary">
    <!-- Header Section -->
    <div class="attendance-summary-header">
      <div class="header-content">
        <button @click="goToDashboard" class="btn-back">
          <i class="fas fa-arrow-left"></i> กลับ
        </button>
        <div class="header-text">
          <div class="attendance-summary-title">📊 สรุปการเข้าเรียน</div>
          <div class="attendance-summary-subtitle">ดูสถิติการเข้าเรียนในแต่ละคาบเรียนและรายวิชา</div>
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="filter-card">
      <div class="filter-row">
        <!-- <div class="filter-group">
          <label for="startDate">วันที่เริ่มต้น:</label>
          <input 
            type="date" 
            id="startDate" 
            v-model="filters.startDate" 
            class="form-control"
            @change="applyFilters"
          />
        </div>
        <div class="filter-group">
          <label for="endDate">วันที่สิ้นสุด:</label>
          <input 
            type="date" 
            id="endDate" 
            v-model="filters.endDate" 
            class="form-control"
            @change="applyFilters"
          />
        </div> -->
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
          <label for="academicYearFilter">ปีการศึกษา:</label>
          <select 
            id="academicYearFilter" 
            v-model="filters.academicYear" 
            class="form-control"
            @change="onAcademicYearChange"
          >
            <option value="">ทุกปีการศึกษา</option>
            <option v-for="year in filteredAcademicYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label for="semesterFilter">ภาคเรียน:</label>
          <select 
            id="semesterFilter" 
            v-model="filters.semester" 
            class="form-control"
            @change="onSemesterChange"
          >
            <option value="">ทุกภาคเรียน</option>
            <option v-for="semester in filteredSemesters" :key="semester" :value="semester">
              {{ semester }}
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

    <!-- Loading State -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    </div>

    <!-- QR Sessions Table -->
    <div v-if="!loading && filteredQRSessions.length > 0" class="attendance-table">
      <div class="table-header">
        <h3>📋 รายการ QR Code ทั้งหมด</h3>
        <div class="table-actions">
          <button @click="refreshAttendanceData" class="btn btn-secondary" :disabled="loadingAttendance">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loadingAttendance }"></i> 
            {{ loadingAttendance ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล' }}
          </button>
          <button @click="clearSelection" class="btn btn-outline" v-if="selectedSessions.length > 0">
            <i class="fas fa-times"></i> ล้างการเลือก
          </button>
        </div>
      </div>
      <div class="table-content">
        <table>
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  :checked="isAllSelected" 
                  @change="toggleSelectAll"
                  class="select-all-checkbox"
                >
                เลือกทั้งหมด
              </th>
              <th>รหัสวิชา</th>
              <th>ชื่อวิชา</th>
              <th>หมู่เรียน</th>
              <th>ปีการศึกษา</th>
              <th>ภาคเรียน</th>
              <th>เวลาเริ่ม</th>
              <th>เวลาหมดอายุ</th>
              <th>นาทีที่ถือว่าสาย</th>
              <th>สถานะ</th>
              <th>รวม</th>
              <th>มา</th>
              <th>สาย</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in filteredQRSessions" :key="session.id">
              <td>
                <input 
                  type="checkbox" 
                  :value="session.id"
                  v-model="selectedSessions"
                  class="session-checkbox"
                >
              </td>
              <td>{{ session.subject_code }}</td>
              <td>{{ session.subject_name }}</td>
              <td>{{ session.class_group }}</td>
              <td>{{ session.year }}</td>
              <td>{{ session.semester }}</td>
              <td>{{ formatDateTime(session.start_time) }}</td>
              <td>{{ formatDateTime(session.expire_time) }}</td>
              <td>{{ session.late_minute }} นาที</td>
              <td>
                <span :class="`status-${getSessionStatusClass(getSessionStatus(session))}`">
                  {{ getSessionStatusText(getSessionStatus(session)) }}
                </span>
              </td>
              <td class="attendance-count">{{ getAttendanceCount(session.id) }}</td>
              <td class="present-count">{{ getPresentCount(session.id) }}</td>
              <td class="late-count">{{ getLateCount(session.id) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Student Attendance Details Table -->
    <div v-if="!loading && selectedSessions.length > 0" class="student-attendance-table">
      <div class="table-header">
        <h3>👥 รายชื่อนักเรียนที่ลงทะเบียนเข้าเรียน</h3>
        <div class="table-actions">
          <button @click="exportStudentAttendance" class="btn btn-primary">
            <i class="fas fa-download"></i> Export รายชื่อนักเรียน
          </button>
          <button @click="refreshStudentAttendance" class="btn btn-secondary" :disabled="loadingStudentAttendance">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loadingStudentAttendance }"></i> 
            {{ loadingStudentAttendance ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล' }}
          </button>
        </div>
      </div>
      <div class="table-content">
        <table>
          <thead>
            <tr>
              <th>รหัสนักเรียน</th>
              <th>ชื่อ</th>
              <th>นามสกุล</th>
              <th v-for="session in selectedSessionsData" :key="session.id" class="session-date-header">
                {{ formatDateOnly(session.start_time) }}
              </th>
              <th class="extra-score-header">คะแนนพิเศษรวม</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in studentAttendanceData" :key="student.id">
              <td class="student-code">{{ student.student_code }}</td>
              <td class="student-name">{{ student.first_name }}</td>
              <td class="student-surname">{{ student.last_name }}</td>
              <td v-for="session in selectedSessionsData" :key="session.id" class="attendance-status">
                <span :class="getAttendanceStatusClass(student.id, session.id)">
                  {{ getAttendanceStatusText(student.id, session.id) }}
                </span>
              </td>
              <td class="extra-score-total">{{ getTotalExtraScore(student.id) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredQRSessions.length === 0" class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-chart-line"></i>
      </div>
      <h3 v-if="qrSessions.length === 0">ไม่มีข้อมูล QR Code</h3>
      <h3 v-else>ไม่พบ QR Code ที่ตรงกับตัวกรองที่เลือก</h3>
      <p v-if="qrSessions.length === 0">ยังไม่มี QR Code ที่สร้างไว้</p>
      <p v-else>ลองเปลี่ยนตัวกรองหรือล้างตัวกรองเพื่อดูข้อมูลทั้งหมด</p>
      <button @click="clearFilters" class="btn btn-primary">
        <i class="fas fa-refresh"></i> ล้างตัวกรอง
      </button>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeConfirmModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>⚠️ ยืนยันการ Export</h3>
          <button @click="closeConfirmModal" class="close-btn">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="confirmation-message">
            <p>{{ confirmMessage }}</p>
            <div class="selected-info">
              <h4>ข้อมูลที่เลือก:</h4>
              <ul>
                <li v-for="subject in uniqueSubjects" :key="subject">
                  📚 {{ subject }}
                </li>
                <li v-if="uniqueClassGroups.length > 1">
                  🏫 หมู่เรียน: {{ uniqueClassGroups.join(', ') }}
                </li>
                <li v-if="uniqueSemesters.length > 1">
                  📅 ภาคเรียน: {{ uniqueSemesters.join(', ') }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeConfirmModal" class="btn btn-secondary">
            ยกเลิก
          </button>
          <button @click="confirmExport" class="btn btn-primary">
            ✅ ยืนยัน Export
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { qrcodeService } from '../services/qrcode'
import { attendanceService } from '../services/attendance'
import { useAuthStore } from '../stores/auth'
import { useQRStore } from '../stores/qr'
import { 
  formatDateTime, 
  showNotification,
  getSessionStatus,
  getSessionStatusText,
  getSessionStatusClass
} from '../utils/helpers'

export default {
  name: 'AttendanceSummary',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const qrStore = useQRStore()
    
    // Reactive data
    const loading = ref(false)
    const loadingAttendance = ref(false)
    const loadingStudentAttendance = ref(false)
    const subjects = ref([])
    const subjectCodes = ref([])
    const classGroups = ref([])
    const academicYears = ref([])
    const semesters = ref([])
    const allQRSessionData = ref([]) // เก็บข้อมูลทั้งหมดจาก QR sessions
    const qrSessions = ref([]) // เก็บข้อมูล QR Sessions ทั้งหมด
    const selectedSessions = ref([]) // เก็บ ID ของ sessions ที่เลือก
    const attendanceData = ref({}) // เก็บข้อมูล attendance ของแต่ละ session
    const studentAttendanceData = ref([]) // เก็บข้อมูลรายชื่อนักเรียนและสถานะการเข้าเรียน
    
    // Modal state
    const showConfirmModal = ref(false)
    const confirmMessage = ref('')
    const uniqueSubjects = ref([])
    const uniqueClassGroups = ref([])
    const uniqueSemesters = ref([])
    
    // Filters
    const filters = reactive({
      startDate: '',
      endDate: '',
      subjectCode: '',
      subjectName: '',
      classGroup: '',
      academicYear: '',
      semester: ''
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
        .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
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
        .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
        .sort()
    })
    
    const filteredClassGroups = computed(() => {
      if (!filters.subjectCode && !filters.subjectName && !filters.academicYear && !filters.semester) {
        return classGroups.value
      }
      
      let filteredData = allQRSessionData.value
      
      if (filters.subjectCode) {
        filteredData = filteredData.filter(item => item.subject_code === filters.subjectCode)
      }
      
      if (filters.subjectName) {
        filteredData = filteredData.filter(item => item.subject_name === filters.subjectName)
      }
      
      if (filters.academicYear) {
        filteredData = filteredData.filter(item => item.year == filters.academicYear)
      }
      
      if (filters.semester) {
        filteredData = filteredData.filter(item => item.semester == filters.semester)
      }
      
      return filteredData
        .map(item => item.class_group)
        .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
        .sort()
    })
    
    const filteredAcademicYears = computed(() => {
      if (!filters.subjectCode && !filters.subjectName && !filters.classGroup && !filters.semester) {
        return academicYears.value
      }
      
      let filteredData = allQRSessionData.value
      
      if (filters.subjectCode) {
        filteredData = filteredData.filter(item => item.subject_code === filters.subjectCode)
      }
      
      if (filters.subjectName) {
        filteredData = filteredData.filter(item => item.subject_name === filters.subjectName)
      }
      
      if (filters.classGroup) {
        filteredData = filteredData.filter(item => item.class_group === filters.classGroup)
      }
      
      if (filters.semester) {
        filteredData = filteredData.filter(item => item.semester == filters.semester)
      }
      
      return filteredData
        .map(item => item.year)
        .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
        .sort()
    })
    
    const filteredSemesters = computed(() => {
      if (!filters.subjectCode && !filters.subjectName && !filters.classGroup && !filters.academicYear) {
        return semesters.value
      }
      
      let filteredData = allQRSessionData.value
      
      if (filters.subjectCode) {
        filteredData = filteredData.filter(item => item.subject_code === filters.subjectCode)
      }
      
      if (filters.subjectName) {
        filteredData = filteredData.filter(item => item.subject_name === filters.subjectName)
      }
      
      if (filters.classGroup) {
        filteredData = filteredData.filter(item => item.class_group === filters.classGroup)
      }
      
      if (filters.academicYear) {
        filteredData = filteredData.filter(item => item.year == filters.academicYear)
      }
      
      return filteredData
        .map(item => item.semester)
        .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
        .sort()
    })
    
    // Filtered QR sessions based on filters
    const filteredQRSessions = computed(() => {
      let sessions = qrSessions.value
      
      if (filters.subjectCode) {
        sessions = sessions.filter(session => session.subject_code === filters.subjectCode)
      }
      
      if (filters.subjectName) {
        sessions = sessions.filter(session => session.subject_name === filters.subjectName)
      }
      
      if (filters.classGroup) {
        sessions = sessions.filter(session => session.class_group === filters.classGroup)
      }
      
      if (filters.academicYear) {
        sessions = sessions.filter(session => session.year == filters.academicYear)
      }
      
      if (filters.semester) {
        sessions = sessions.filter(session => session.semester == filters.semester)
      }
      
      return sessions
    })
    
    // Check if all sessions are selected
    const isAllSelected = computed(() => {
      return filteredQRSessions.value.length > 0 && 
             selectedSessions.value.length === filteredQRSessions.value.length
    })
    
    // Get selected sessions data (sorted by start_time)
    const selectedSessionsData = computed(() => {
      return qrSessions.value
        .filter(session => selectedSessions.value.includes(session.id))
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    })
    
    // Methods
    const loadQRSessionSubjects = async () => {
      try {
        const response = await qrcodeService.getQRSessionSubjects()
        if (response.success) {
          const qrSubjects = response.data
          
          // เก็บข้อมูลทั้งหมดไว้สำหรับการกรอง
          allQRSessionData.value = qrSubjects
          
          // Extract unique values (สำหรับการแสดงผลเริ่มต้น)
          const uniqueSubjects = [...new Set(qrSubjects.map(item => item.subject_name).filter(Boolean))]
          const uniqueSubjectCodes = [...new Set(qrSubjects.map(item => item.subject_code).filter(Boolean))]
          const uniqueClassGroups = [...new Set(qrSubjects.map(item => item.class_group).filter(Boolean))]
          const uniqueAcademicYears = [...new Set(qrSubjects.map(item => item.year).filter(Boolean))]
          const uniqueSemesters = [...new Set(qrSubjects.map(item => item.semester).filter(Boolean))]
          
          subjects.value = uniqueSubjects.sort()
          subjectCodes.value = uniqueSubjectCodes.sort()
          classGroups.value = uniqueClassGroups.sort()
          academicYears.value = uniqueAcademicYears.sort()
          semesters.value = uniqueSemesters.sort()
          
          console.log('QR Session Subjects:', qrSubjects)
          console.log('Unique Subjects:', uniqueSubjects)
          console.log('Unique Subject Codes:', uniqueSubjectCodes)
          console.log('Unique Class Groups:', uniqueClassGroups)
          console.log('Unique Academic Years:', uniqueAcademicYears)
          console.log('Unique Semesters:', uniqueSemesters)
        }
      } catch (error) {
        console.error('Error loading QR session subjects:', error)
      }
    }
    
    const loadData = async () => {
      loading.value = true
      try {
        // Load QR Sessions
        await qrStore.loadQRSessions()
        qrSessions.value = qrStore.qrSessions
        
        // Load attendance data for sessions that don't have data yet (smart loading)
        await loadAttendanceData()
        
      } catch (error) {
        console.error('Error loading data:', error)
        
        // Handle rate limiting error
        if (error.response && error.response.status === 429) {
          showNotification('คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่', 'warning')
        } else {
          showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
        }
      } finally {
        loading.value = false
      }
    }
    
    const applyFilters = () => {
      // ไม่ต้องโหลดข้อมูลใหม่ เพราะใช้ computed properties
      // filteredQRSessions จะอัปเดตอัตโนมัติเมื่อ filters เปลี่ยน
    }
    
    // ฟังก์ชันสำหรับอัปเดต checkbox ที่เลือกให้ตรงกับข้อมูลที่กรองแล้ว
    const updateSelectedSessionsAfterFilter = () => {
      // เก็บเฉพาะ session ที่ยังอยู่ใน filteredQRSessions
      const validSessionIds = filteredQRSessions.value.map(session => session.id)
      selectedSessions.value = selectedSessions.value.filter(sessionId => 
        validSessionIds.includes(sessionId)
      )
    }
    
    // Methods for handling filter changes
    const onSubjectCodeChange = () => {
      // เมื่อเลือกรหัสวิชา ให้รีเซ็ตวิชาและหมู่เรียนถ้าไม่สอดคล้องกัน
      if (filters.subjectCode) {
        const validSubjects = allQRSessionData.value
          .filter(item => item.subject_code === filters.subjectCode)
          .map(item => item.subject_name)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const validClassGroups = allQRSessionData.value
          .filter(item => item.subject_code === filters.subjectCode)
          .map(item => item.class_group)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        // ถ้าวิชาที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.subjectName && !validSubjects.includes(filters.subjectName)) {
          filters.subjectName = ''
        }
        
        // ถ้าหมู่เรียนที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.classGroup && !validClassGroups.includes(filters.classGroup)) {
          filters.classGroup = ''
        }
      }
      
      // อัปเดต checkbox ที่เลือกให้ตรงกับข้อมูลที่กรองแล้ว
      updateSelectedSessionsAfterFilter()
      
      applyFilters()
    }
    
    const onSubjectNameChange = () => {
      // เมื่อเลือกวิชา ให้รีเซ็ตรหัสวิชาและหมู่เรียนถ้าไม่สอดคล้องกัน
      if (filters.subjectName) {
        const validSubjectCodes = allQRSessionData.value
          .filter(item => item.subject_name === filters.subjectName)
          .map(item => item.subject_code)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const validClassGroups = allQRSessionData.value
          .filter(item => item.subject_name === filters.subjectName)
          .map(item => item.class_group)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        // ถ้ารหัสวิชาที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.subjectCode && !validSubjectCodes.includes(filters.subjectCode)) {
          filters.subjectCode = ''
        }
        
        // ถ้าหมู่เรียนที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.classGroup && !validClassGroups.includes(filters.classGroup)) {
          filters.classGroup = ''
        }
      }
      
      // อัปเดต checkbox ที่เลือกให้ตรงกับข้อมูลที่กรองแล้ว
      updateSelectedSessionsAfterFilter()
      
      applyFilters()
    }
    
    const onClassGroupChange = () => {
      // เมื่อเลือกหมู่เรียน ให้รีเซ็ตรหัสวิชาและวิชาถ้าไม่สอดคล้องกัน
      if (filters.classGroup) {
        const validSubjectCodes = allQRSessionData.value
          .filter(item => item.class_group === filters.classGroup)
          .map(item => item.subject_code)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const validSubjects = allQRSessionData.value
          .filter(item => item.class_group === filters.classGroup)
          .map(item => item.subject_name)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const validAcademicYears = allQRSessionData.value
          .filter(item => item.class_group === filters.classGroup)
          .map(item => item.year)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const validSemesters = allQRSessionData.value
          .filter(item => item.class_group === filters.classGroup)
          .map(item => item.semester)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        // ถ้ารหัสวิชาที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.subjectCode && !validSubjectCodes.includes(filters.subjectCode)) {
          filters.subjectCode = ''
        }
        
        // ถ้าวิชาที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.subjectName && !validSubjects.includes(filters.subjectName)) {
          filters.subjectName = ''
        }
        
        // ถ้าปีการศึกษาที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.academicYear && !validAcademicYears.includes(filters.academicYear)) {
          filters.academicYear = ''
        }
        
        // ถ้าภาคเรียนที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.semester && !validSemesters.includes(filters.semester)) {
          filters.semester = ''
        }
      }
      
      // อัปเดต checkbox ที่เลือกให้ตรงกับข้อมูลที่กรองแล้ว
      updateSelectedSessionsAfterFilter()
      
      applyFilters()
    }
    
    const onAcademicYearChange = () => {
      // เมื่อเลือกปีการศึกษา ให้รีเซ็ตฟิลด์อื่นถ้าไม่สอดคล้องกัน
      if (filters.academicYear) {
        const validSubjectCodes = allQRSessionData.value
          .filter(item => item.year == filters.academicYear)
          .map(item => item.subject_code)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const validSubjects = allQRSessionData.value
          .filter(item => item.year == filters.academicYear)
          .map(item => item.subject_name)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const validClassGroups = allQRSessionData.value
          .filter(item => item.year == filters.academicYear)
          .map(item => item.class_group)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const validSemesters = allQRSessionData.value
          .filter(item => item.year == filters.academicYear)
          .map(item => item.semester)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        // ถ้ารหัสวิชาที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.subjectCode && !validSubjectCodes.includes(filters.subjectCode)) {
          filters.subjectCode = ''
        }
        
        // ถ้าวิชาที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.subjectName && !validSubjects.includes(filters.subjectName)) {
          filters.subjectName = ''
        }
        
        // ถ้าหมู่เรียนที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.classGroup && !validClassGroups.includes(filters.classGroup)) {
          filters.classGroup = ''
        }
        
        // ถ้าภาคเรียนที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.semester && !validSemesters.includes(filters.semester)) {
          filters.semester = ''
        }
      }
      
      // อัปเดต checkbox ที่เลือกให้ตรงกับข้อมูลที่กรองแล้ว
      updateSelectedSessionsAfterFilter()
      
      applyFilters()
    }
    
    const onSemesterChange = () => {
      // เมื่อเลือกภาคเรียน ให้รีเซ็ตฟิลด์อื่นถ้าไม่สอดคล้องกัน
      if (filters.semester) {
        const validSubjectCodes = allQRSessionData.value
          .filter(item => item.semester == filters.semester)
          .map(item => item.subject_code)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const validSubjects = allQRSessionData.value
          .filter(item => item.semester == filters.semester)
          .map(item => item.subject_name)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const validClassGroups = allQRSessionData.value
          .filter(item => item.semester == filters.semester)
          .map(item => item.class_group)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        const validAcademicYears = allQRSessionData.value
          .filter(item => item.semester == filters.semester)
          .map(item => item.year)
          .filter((value, index, self) => self.indexOf(value) === index)
        
        // ถ้ารหัสวิชาที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.subjectCode && !validSubjectCodes.includes(filters.subjectCode)) {
          filters.subjectCode = ''
        }
        
        // ถ้าวิชาที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.subjectName && !validSubjects.includes(filters.subjectName)) {
          filters.subjectName = ''
        }
        
        // ถ้าหมู่เรียนที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.classGroup && !validClassGroups.includes(filters.classGroup)) {
          filters.classGroup = ''
        }
        
        // ถ้าปีการศึกษาที่เลือกไม่อยู่ในรายการที่ถูกต้อง ให้รีเซ็ต
        if (filters.academicYear && !validAcademicYears.includes(filters.academicYear)) {
          filters.academicYear = ''
        }
      }
      
      // อัปเดต checkbox ที่เลือกให้ตรงกับข้อมูลที่กรองแล้ว
      updateSelectedSessionsAfterFilter()
      
      applyFilters()
    }
    
    const refreshData = async () => {
      loading.value = true
      try {
        // โหลดเฉพาะ QR Sessions ใหม่ ไม่ต้องโหลด attendance data ซ้ำ
        await qrStore.loadQRSessions()
        qrSessions.value = qrStore.qrSessions
        
        // โหลดข้อมูล subjects ใหม่สำหรับ dropdown
        await loadQRSessionSubjects()
        
        showNotification('อัปเดตข้อมูลเรียบร้อยแล้ว', 'success')
      } catch (error) {
        console.error('Error refreshing data:', error)
        showNotification('เกิดข้อผิดพลาดในการอัปเดตข้อมูล', 'error')
      } finally {
        loading.value = false
      }
    }
    
    const refreshAttendanceData = async () => {
      loadingAttendance.value = true
      try {
        // Clear existing attendance data to force reload
        attendanceData.value = {}
        await loadAttendanceData()
        showNotification('อัปเดตข้อมูลการเข้าเรียนเรียบร้อยแล้ว', 'success')
      } catch (error) {
        console.error('Error refreshing attendance data:', error)
        showNotification('เกิดข้อผิดพลาดในการอัปเดตข้อมูล', 'error')
      } finally {
        loadingAttendance.value = false
      }
    }
    
    const clearFilters = () => {
      filters.startDate = ''
      filters.endDate = ''
      filters.subjectCode = ''
      filters.subjectName = ''
      filters.classGroup = ''
      filters.academicYear = ''
      filters.semester = ''
      // ไม่ต้องโหลดข้อมูลใหม่ เพียงแค่ล้างตัวกรอง
    }
    
    // Checkbox methods
    const toggleSelectAll = () => {
      if (isAllSelected.value) {
        // Unselect all
        selectedSessions.value = []
      } else {
        // Select all filtered sessions
        selectedSessions.value = filteredQRSessions.value.map(session => session.id)
      }
    }
    
    const clearSelection = () => {
      selectedSessions.value = []
    }
    
    // Attendance count methods
    const getAttendanceCount = (sessionId) => {
      const attendance = attendanceData.value[sessionId] || []
      return attendance.length
    }
    
    const getPresentCount = (sessionId) => {
      const attendance = attendanceData.value[sessionId] || []
      return attendance.filter(a => a.status === 'มา').length
    }
    
    const getLateCount = (sessionId) => {
      const attendance = attendanceData.value[sessionId] || []
      return attendance.filter(a => a.status === 'สาย').length
    }

    // Student Attendance Methods
    const loadStudentAttendanceData = async () => {
      if (selectedSessions.value.length === 0) {
        studentAttendanceData.value = []
        return
      }

      loadingStudentAttendance.value = true
      try {
        // Get all unique students from selected sessions
        const allStudents = new Map()
        
        for (const sessionId of selectedSessions.value) {
          const attendance = attendanceData.value[sessionId] || []
          attendance.forEach(record => {
            if (!allStudents.has(record.student_id)) {
              allStudents.set(record.student_id, {
                id: record.student_id,
                student_code: record.student_code,
                first_name: record.firstname,
                last_name: record.lastname,
                attendance: {},
                extra_scores: {}
              })
            }
            allStudents.get(record.student_id).attendance[sessionId] = record.status
            allStudents.get(record.student_id).extra_scores[sessionId] = record.extra_score || 0
          })
        }

        // Convert to array and sort by student_code
        studentAttendanceData.value = Array.from(allStudents.values())
          .sort((a, b) => a.student_code.localeCompare(b.student_code))

        console.log('Student attendance data loaded:', studentAttendanceData.value)
      } catch (error) {
        console.error('Error loading student attendance data:', error)
        showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูลนักเรียน', 'error')
      } finally {
        loadingStudentAttendance.value = false
      }
    }

    const getAttendanceStatusText = (studentId, sessionId) => {
      const student = studentAttendanceData.value.find(s => s.id === studentId)
      if (!student || !student.attendance[sessionId]) {
        return 'ขาด'
      }
      return student.attendance[sessionId]
    }

    const getAttendanceStatusClass = (studentId, sessionId) => {
      const status = getAttendanceStatusText(studentId, sessionId)
      switch (status) {
        case 'มา':
          return 'status-present'
        case 'สาย':
          return 'status-late'
        case 'ขาด':
          return 'status-absent'
        default:
          return 'status-unknown'
      }
    }

    const formatDateOnly = (dateTime) => {
      return new Date(dateTime).toLocaleDateString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    const getTotalExtraScore = (studentId) => {
      const student = studentAttendanceData.value.find(s => s.id === studentId)
      if (!student || !student.extra_scores) {
        return 0
      }
      
      const totalScore = Object.values(student.extra_scores).reduce((sum, score) => sum + (score || 0), 0)
      return totalScore
    }

    const refreshStudentAttendance = async () => {
      await loadStudentAttendanceData()
      showNotification('อัปเดตข้อมูลนักเรียนเรียบร้อยแล้ว', 'success')
    }

    const exportStudentAttendance = async () => {
      try {
        if (studentAttendanceData.value.length === 0) {
          showNotification('ไม่มีข้อมูลนักเรียนสำหรับ Export', 'warning')
          return
        }

        // ตรวจสอบว่ามีหลายวิชา/หมู่เรียน/ภาคเรียนหรือไม่
        const subjects = [...new Set(selectedSessionsData.value.map(session => 
          `${session.subject_code} - ${session.subject_name}`
        ))]
        
        const classGroups = [...new Set(selectedSessionsData.value.map(session => 
          session.class_group
        ))]
        
        const semesters = [...new Set(selectedSessionsData.value.map(session => 
          session.semester
        ))]

        // ถ้ามีหลายวิชา หรือหลายหมู่เรียน หรือหลายภาคเรียน ให้แสดง modal
        if (subjects.length > 1 || classGroups.length > 1 || semesters.length > 1) {
          let message = 'ยืนยันใช่ไหมที่จะสร้างรายชื่อ '
          
          if (subjects.length > 1) {
            message += `"${subjects.join(' + ')}"`
          } else {
            message += `"${subjects[0]}"`
          }
          
          if (classGroups.length > 1) {
            message += ` หมู่เรียน: ${classGroups.join(', ')}`
          }
          
          if (semesters.length > 1) {
            message += ` ภาคเรียน: ${semesters.join(', ')}`
          }
          
          // แสดง modal แทน confirm
          confirmMessage.value = message
          uniqueSubjects.value = subjects
          uniqueClassGroups.value = classGroups
          uniqueSemesters.value = semesters
          showConfirmModal.value = true
          return
        }

        // ถ้าไม่ต้องแสดง modal ให้ export ทันที
        performExport()
      } catch (error) {
        console.error('Error exporting student attendance:', error)
        showNotification('เกิดข้อผิดพลาดในการ Export ข้อมูลนักเรียน', 'error')
      }
    }
    
    const loadAttendanceData = async () => {
      try {
        // Check if we already have attendance data for all sessions
        const sessionsNeedingData = qrSessions.value.filter(session => 
          !attendanceData.value[session.id]
        )
        
        if (sessionsNeedingData.length === 0) {
          console.log('All attendance data already loaded')
          return
        }
        
        console.log(`Loading attendance data for ${sessionsNeedingData.length} sessions using bulk API`)
        
        // Get session IDs
        const sessionIds = sessionsNeedingData.map(session => session.id)
        
        try {
          // Use bulk API to get all attendance data at once
          const response = await attendanceService.getBulkAttendance(sessionIds)
          
          if (response.success) {
            // Process the bulk data
            const bulkData = response.data
            
            // Update attendance data for each session
            sessionIds.forEach(sessionId => {
              attendanceData.value[sessionId] = bulkData[sessionId] || []
            })
            
            console.log(`Successfully loaded attendance data for ${sessionsNeedingData.length} sessions`)
            console.log(`Total attendance records: ${response.count}`)
          } else {
            throw new Error(response.error || 'Failed to load bulk attendance data')
          }
        } catch (error) {
          console.error('Error loading bulk attendance data:', error)
          
          // Fallback: load data individually if bulk fails
          console.log('Falling back to individual loading...')
          await loadAttendanceDataIndividually(sessionsNeedingData)
        }
        
      } catch (error) {
        console.error('Error loading attendance data:', error)
      }
    }

    // Fallback method for individual loading (keep the old logic)
    const loadAttendanceDataIndividually = async (sessionsNeedingData) => {
      for (let i = 0; i < sessionsNeedingData.length; i++) {
        const session = sessionsNeedingData[i]
        try {
          const response = await qrStore.loadSessionDetail(session.id)
          attendanceData.value[session.id] = qrStore.attendance || []
          
          // Add delay between requests to avoid rate limiting
          if (i < sessionsNeedingData.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200)) // 200ms delay
          }
        } catch (error) {
          console.error(`Error loading attendance for session ${session.id}:`, error)
          attendanceData.value[session.id] = []
          
          // Handle rate limiting error
          if (error.response && error.response.status === 429) {
            console.log('Rate limit reached, waiting before retry...')
            await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
          }
        }
      }
    }
    
    const exportSummary = async () => {
      try {
        // Export selected sessions data or all filtered data if none selected
        const exportData = selectedSessions.value.length > 0 ? selectedSessionsData.value : filteredQRSessions.value
        
        if (exportData.length === 0) {
          showNotification('ไม่มีข้อมูลสำหรับ Export', 'warning')
          return
        }
        
        // Create CSV content with UTF-8 BOM for Thai support
        const headers = [
          'รหัสคาบ',
          'รหัสวิชา', 
          'ชื่อวิชา',
          'หมู่เรียน',
          'ปีการศึกษา',
          'ภาคเรียน',
          'เวลาเริ่ม',
          'เวลาหมดอายุ',
          'นาทีที่ถือว่าสาย',
          'สถานะ'
        ]
        
        // Add UTF-8 BOM for proper Thai character support
        const csvContent = [
          '\uFEFF', // UTF-8 BOM
          headers.join(','),
          ...exportData.map(session => [
            session.id,
            `"${session.subject_code}"`,
            `"${session.subject_name}"`,
            `"${session.class_group}"`,
            session.year,
            session.semester,
            `"${formatDateTime(session.start_time)}"`,
            `"${formatDateTime(session.expire_time)}"`,
            session.late_minute,
            `"${getSessionStatusText(getSessionStatus(session))}"`
          ].join(','))
        ].join('\n')
        
        // Create and download file with proper encoding
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `สรุปการเข้าเรียน_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        showNotification('Export ข้อมูลเรียบร้อยแล้ว', 'success')
        
      } catch (error) {
        console.error('Error exporting summary:', error)
        showNotification('เกิดข้อผิดพลาดในการ Export ข้อมูล', 'error')
      }
    }
    
    const exportSessions = () => {
      exportSummary()
    }
    
    const viewSessionDetail = (sessionId) => {
      router.push(`/session/${sessionId}`)
    }
    
    const confirmDeleteSession = (sessionId) => {
      if (confirm('คุณต้องการลบ QR Code นี้หรือไม่?')) {
        deleteSession(sessionId)
      }
    }
    
    const deleteSession = async (sessionId) => {
      try {
        await qrStore.deleteQRSession(sessionId)
        showNotification('ลบ QR Code เรียบร้อยแล้ว', 'success')
        
        // ลบ session ออกจากข้อมูลที่มีอยู่แทนการโหลดใหม่
        qrSessions.value = qrSessions.value.filter(session => session.id !== sessionId)
        delete attendanceData.value[sessionId]
        
        // ลบออกจาก selectedSessions ถ้ามี
        const index = selectedSessions.value.indexOf(sessionId)
        if (index > -1) {
          selectedSessions.value.splice(index, 1)
        }
        
      } catch (error) {
        console.error('Error deleting session:', error)
        showNotification('เกิดข้อผิดพลาดในการลบ QR Code', 'error')
      }
    }
    
    const formatDateTime = (dateTime) => {
      return new Date(dateTime).toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    const getRateClass = (rate) => {
      if (rate >= 80) return 'rate-excellent'
      if (rate >= 60) return 'rate-good'
      if (rate >= 40) return 'rate-fair'
      return 'rate-poor'
    }

    const goToDashboard = () => {
      router.push('/dashboard')
    }
    
    // Modal functions
    const closeConfirmModal = () => {
      showConfirmModal.value = false
      confirmMessage.value = ''
      uniqueSubjects.value = []
      uniqueClassGroups.value = []
      uniqueSemesters.value = []
    }
    
    const confirmExport = () => {
      closeConfirmModal()
      // ทำการ export จริง
      performExport()
    }
    
    const performExport = () => {
      try {
        // สร้างชื่อไฟล์ตามรหัสวิชา_ชื่อวิชา_หมู่เรียน_ปีการศึกษา
        const firstSession = selectedSessionsData.value[0]
        const fileName = `${firstSession.subject_code}_${firstSession.subject_name}_${firstSession.class_group}_${firstSession.year}`

        // Create CSV content with UTF-8 BOM for Thai support
        const headers = ['รหัสนักเรียน', 'ชื่อ', 'นามสกุล']
        selectedSessionsData.value.forEach(session => {
          headers.push(formatDateOnly(session.start_time))
        })
        headers.push('คะแนนพิเศษรวม')

        // Add UTF-8 BOM for proper Thai character support
        const csvContent = [
          '\uFEFF', // UTF-8 BOM
          headers.join(','),
          ...studentAttendanceData.value.map(student => {
            const row = [
              `"${student.student_code}"`, // ข้อความ
              `"${student.first_name}"`,   // ข้อความ
              `"${student.last_name}"`    // ข้อความ
            ]
            selectedSessionsData.value.forEach(session => {
              row.push(`"${getAttendanceStatusText(student.id, session.id)}"`) // ข้อความ
            })
            row.push(getTotalExtraScore(student.id)) // ตัวเลข (ไม่ใส่ quotes)
            return row.join(',')
          })
        ].join('\n')

        // Create and download file with proper encoding
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        showNotification('Export ข้อมูลนักเรียนเรียบร้อยแล้ว', 'success')
      } catch (error) {
        console.error('Error exporting student attendance:', error)
        showNotification('เกิดข้อผิดพลาดในการ Export ข้อมูลนักเรียน', 'error')
      }
    }
    
    // Lifecycle
    onMounted(async () => {
      // โหลดข้อมูล subjects จาก QR sessions ก่อน เพื่อสร้าง dropdown options
      await loadQRSessionSubjects()
      // จากนั้นโหลดข้อมูล attendance summary
      await loadData()
    })

    // Watch for changes in selectedSessions to load student attendance data
    watch(selectedSessions, async (newSessions) => {
      if (newSessions.length > 0) {
        await loadStudentAttendanceData()
      } else {
        studentAttendanceData.value = []
      }
    }, { immediate: true })
    
    return {
      loading,
      loadingAttendance,
      loadingStudentAttendance,
      subjects,
      subjectCodes,
      classGroups,
      academicYears,
      semesters,
      allQRSessionData,
      qrSessions,
      selectedSessions,
      attendanceData,
      studentAttendanceData,
      filteredSubjectCodes,
      filteredSubjects,
      filteredClassGroups,
      filteredAcademicYears,
      filteredSemesters,
      filteredQRSessions,
      isAllSelected,
      selectedSessionsData,
      filters,
      loadQRSessionSubjects,
      applyFilters,
      updateSelectedSessionsAfterFilter,
      onSubjectCodeChange,
      onSubjectNameChange,
      onClassGroupChange,
      onAcademicYearChange,
      onSemesterChange,
      clearFilters,
      refreshData,
      refreshAttendanceData,
      refreshStudentAttendance,
      toggleSelectAll,
      clearSelection,
      getAttendanceCount,
      getPresentCount,
      getLateCount,
      loadAttendanceData,
      loadStudentAttendanceData,
      getAttendanceStatusText,
      getAttendanceStatusClass,
      formatDateOnly,
      getTotalExtraScore,
      exportSummary,
      exportStudentAttendance,
      exportSessions,
      viewSessionDetail,
      confirmDeleteSession,
      deleteSession,
      formatDateTime,
      getSessionStatus,
      getSessionStatusText,
      getSessionStatusClass,
      goToDashboard,
      showConfirmModal,
      confirmMessage,
      uniqueSubjects,
      uniqueClassGroups,
      uniqueSemesters,
      closeConfirmModal,
      confirmExport
    }
  }
}
</script>

<style scoped>

.attendance-summary-background {
    background: #f8f9fa;
    min-height: 100vh;
    display: block;
    padding: 0;
}
.attendance-summary {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header Section */
.attendance-summary-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 30px;
  border-radius: 20px;
  margin-bottom: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.btn-back {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.header-text {
  flex: 1;
  text-align: center;
}

.attendance-summary-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  pointer-events: none;
}

.attendance-summary-title {
  font-size: 2rem;
  margin-bottom: 10px;
  font-weight: 700;
  position: relative;
  z-index: 1;
}

.attendance-summary-subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.header-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

/* Filter Section */
.filter-card {
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.filter-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
  pointer-events: none;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  align-items: end;
  position: relative;
  z-index: 1;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 150px;
  position: relative;
  z-index: 1;
}

.filter-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  font-size: 0.95rem;
}

.form-control {
  padding: 13px;
  border: 2px solid #e1e8ed;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.form-control:focus {
  outline: none;
  border-color: #4285f4;
  background: white;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

/* QR Sessions Section */
.qr-section {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e5e7eb;
}

.section-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 700;
}

.section-actions {
  display: flex;
  gap: 10px;
}

/* Attendance Table */
.attendance-table {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin: 0 0 30px 0;
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
}

.attendance-table::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.01) 0%, rgba(118, 75, 162, 0.01) 100%);
  pointer-events: none;
  z-index: 0;
}

/* Student Attendance Table */
.student-attendance-table {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin: 0 0 30px 0;
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
}

.student-attendance-table::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.01) 0%, rgba(118, 75, 162, 0.01) 100%);
  pointer-events: none;
  z-index: 0;
}

.table-header {
  background: linear-gradient(135deg, #4285f4 0%, #1976d2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.table-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  pointer-events: none;
}

.table-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.table-actions {
  display: flex;
  gap: 15px;
  position: relative;
  z-index: 1;
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
  background: #ffffff;
  color: #4285f4;
  border: 2px solid #4285f4;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  background: #4285f4;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
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

/* Center checkbox column */
th:first-child,
td:first-child {
  text-align: center;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
}

/* Checkbox styles */
.select-all-checkbox,
.session-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4285f4;
}

.select-all-checkbox {
  margin-right: 8px;
}

.session-checkbox {
  margin: 0 auto;
  display: block;
}

/* Attendance count styles */
.attendance-count,
.present-count,
.late-count {
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
}

.attendance-count {
  color: #374151;
}

.present-count {
  color: #27ae60;
}

.late-count {
  color: #f39c12;
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

.status-upcoming {
  color: #f39c12;
  font-weight: 600;
}

.status-inactive {
  color: #95a5a6;
  font-weight: 600;
}

/* Student Attendance Status */
.status-present {
  background: #d4edda;
  color: #155724;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

.status-late {
  background: #fff3cd;
  color: #856404;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

.status-absent {
  background: #f8d7da;
  color: #721c24;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

.status-unknown {
  background: #e2e3e5;
  color: #383d41;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

/* Student Table Specific Styles */
.session-date-header {
  text-align: center;
  font-weight: 600;
  background: rgba(66, 133, 244, 0.1);
  color: #1976d2;
}

.extra-score-header {
  text-align: center;
  font-weight: 600;
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
}

.student-code {
  font-family: monospace;
  font-weight: 600;
  color: #333;
}

.student-name,
.student-surname {
  font-weight: 500;
  color: #333;
}

.attendance-status {
  text-align: center;
}

.extra-score-total {
  text-align: center;
  font-weight: 700;
  color: #15803d;
  background: rgba(34, 197, 94, 0.05);
}

/* Loading State */
.loading-section {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin: 30px 0;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.loading-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
  pointer-events: none;
}

.loading-spinner {
  color: #667eea;
  position: relative;
  z-index: 1;
}

.loading-spinner i {
  font-size: 2rem;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.loading-spinner p {
  position: relative;
  z-index: 1;
  color: #6b7280;
  font-size: 1rem;
}

/* Sessions Summary */
.sessions-summary {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e5e7eb;
}

.section-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 700;
}

.table-container {
  overflow-x: auto;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
}

.summary-table th,
.summary-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.summary-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.summary-table td {
  color: #1f2937;
  font-size: 0.9rem;
}

.session-id {
  font-family: monospace;
  font-weight: 600;
  color: #667eea;
}

.attendance-rate span {
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
}

.rate-excellent { background: #dcfce7; color: #166534; }
.rate-good { background: #dbeafe; color: #1e40af; }
.rate-fair { background: #fef3c7; color: #92400e; }
.rate-poor { background: #fee2e2; color: #991b1b; }

/* Subject Summary */
.subject-summary {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  overflow: hidden;
}

.subject-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 30px;
}

.subject-card {
  border: 2px solid #e1e8ed;
  border-radius: 15px;
  padding: 25px;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.subject-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  border-color: #4285f4;
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.subject-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 700;
}

.subject-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-label {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.stat-value {
  font-weight: 700;
  font-size: 1rem;
}

.stat-value.present { color: #10b981; }
.stat-value.late { color: #f59e0b; }
.stat-value.absent { color: #ef4444; }

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin: 30px 0;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.empty-state::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
  pointer-events: none;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 30px;
  color: #d1d5db;
  position: relative;
  z-index: 1;
}

.empty-state h3 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 1.5rem;
  font-weight: 700;
  position: relative;
  z-index: 1;
}

.empty-state p {
  margin: 0 0 30px 0;
  color: #6b7280;
  font-size: 1rem;
  position: relative;
  z-index: 1;
}

/* Buttons */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4285f4;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3367d6;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(66, 133, 244, 0.3);
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(107, 114, 128, 0.3);
}

.btn-outline {
  background: #ffffff;
  color: #ef4444;
  border: 2px solid #ef4444;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-outline:hover:not(:disabled) {
  background: #ef4444;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.9rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: modalSlideUp 0.3s ease-out;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #e1e8ed;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  border-radius: 20px 20px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  padding: 30px;
}

.confirmation-message {
  text-align: center;
}

.confirmation-message p {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
}

.selected-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  border-left: 4px solid #f39c12;
  text-align: left;
}

.selected-info h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1rem;
  font-weight: 600;
}

.selected-info ul {
  margin: 0;
  padding-left: 20px;
}

.selected-info li {
  margin: 8px 0;
  color: #666;
  font-size: 0.95rem;
}

.modal-footer {
  padding: 20px 30px;
  border-top: 1px solid #e1e8ed;
  text-align: center;
  background: #f8f9fa;
  border-radius: 0 0 20px 20px;
  display: flex;
  gap: 15px;
  justify-content: center;
}

.modal-footer .btn {
  min-width: 120px;
}

/* Responsive Design */
/* Desktop/Laptop (≥768px) - Default styles already defined above */

/* Tablet (376px - 768px) */
@media (max-width: 768px) and (min-width: 376px) {
  .attendance-summary-header {
    padding: 30px 20px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 20px;
  }
  
  .btn-back {
    align-self: flex-start;
  }
  
  .attendance-summary-title {
    font-size: 1.5rem;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .filter-card {
    padding: 20px;
  }
  
  .filter-row {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .attendance-table {
    margin: 0 0 15px 0;
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

/* iPhone 11 และมือถือเล็ก (≤375px) */
@media (max-width: 375px) {
  .attendance-summary-header {
    padding: 20px 15px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 15px;
  }
  
  .btn-back {
    align-self: flex-start;
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }
  
  .attendance-summary-title {
    font-size: 1.3rem;
  }
  
  .header-subtitle {
    font-size: 0.9rem;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  
  .btn {
    padding: 8px 16px;
    font-size: 0.85rem;
    width: 100%;
    justify-content: center;
  }
  
  .filter-card {
    padding: 15px;
    margin-bottom: 15px;
  }
  
  .filter-row {
    grid-template-columns: 1fr;
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
  
  .attendance-table {
    margin: 0 0 10px 0;
  }
  
  .table-header {
    flex-direction: column;
    gap: 10px;
    padding: 15px;
  }
  
  .table-title {
    font-size: 1.1rem;
  }
  
  .table-actions {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  
  .table-actions .btn {
    width: 100%;
    padding: 6px 12px;
    font-size: 0.8rem;
  }
  
  .table-content {
    max-height: 300px;
  }
  
  th, td {
    padding: 8px 6px;
    font-size: 0.8rem;
  }
  
  .checkbox-cell {
    width: 40px;
  }
  
  .checkbox-cell input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }
  
  /* Modal สำหรับมือถือเล็ก */
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-width: 100%;
    max-height: 95vh;
    border-radius: 15px;
  }
  
  .modal-header {
    padding: 15px 20px;
  }
  
  .modal-header h3 {
    font-size: 1.2rem;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .modal-footer {
    padding: 15px 20px;
    flex-direction: column;
    gap: 10px;
  }
  
  .modal-footer .btn {
    width: 100%;
    min-width: auto;
  }
  
  /* Empty state สำหรับมือถือเล็ก */
  .empty-state {
    padding: 30px 20px;
  }
  
  .empty-state h3 {
    font-size: 1.2rem;
  }
  
  .empty-state p {
    font-size: 0.9rem;
  }
}
</style>
