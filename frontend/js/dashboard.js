// Dashboard functionality for QR Attendance System
class DashboardManager {
  constructor() {
    this.userInfo = null;
    this.qrSessions = [];
    this.currentView = 'main';
    this.currentSessionId = null;
    this.sessionIdToDelete = null; // สำหรับ modal ลบ
    this.init();
  }

  async init() {
    console.log('Dashboard initializing...');
    this.showLoading();
    try {
      await this.loadUserInfo();
      await this.loadDashboardData();
      this.setupEventListeners();
      this.showMainView();
      console.log('Dashboard initialized successfully');
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      this.showError('เกิดข้อผิดพลาดในการโหลด Dashboard');
    } finally {
      this.hideLoading();
    }
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
        this.redirectToLogin();
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
      this.redirectToLogin();
    }
  }

  async loadDashboardData() {
    try {
      // Load QR sessions
      const sessionsResponse = await fetch('/api/qrcode/sessions', {
        credentials: 'include'
      });
      
      if (sessionsResponse.ok) {
        this.qrSessions = await sessionsResponse.json();
      }
      
      // Update statistics with QR sessions count
      this.updateStatistics({
        overall: {
          total_sessions: this.qrSessions.length
        }
      });
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      throw error; // Re-throw to be caught by init()
    }
  }

  updateUserDisplay() {
    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-name');
    const userTeacherCode = document.querySelector('.user-teacher-code');
    
    if (this.userInfo && userAvatar) {
      userAvatar.textContent = this.userInfo.name.charAt(0).toUpperCase();
    }
    
    if (this.userInfo && userName) {
      userName.textContent = this.userInfo.name;
    }
    
    if (this.userInfo && userTeacherCode) {
      userTeacherCode.textContent = this.userInfo.teacher_code || 'ไม่ระบุ';
    }
  }

  updateStatistics(stats) {
    const totalSessions = document.getElementById('totalSessions');

    if (totalSessions) {
      totalSessions.textContent = stats.overall.total_sessions || this.qrSessions.length || 0;
    }
  }

  setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Create QR button
    const createQRBtn = document.getElementById('createQRBtn');
    if (createQRBtn) {
      createQRBtn.addEventListener('click', () => this.showCreateQR());
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshDashboard());
    }

    // Export attendance button
    const exportAttendanceBtn = document.getElementById('exportAttendanceBtn');
    if (exportAttendanceBtn) {
      exportAttendanceBtn.addEventListener('click', () => this.exportAttendance());
    }

    // Refresh attendance button
    const refreshAttendanceBtn = document.getElementById('refreshAttendanceBtn');
    if (refreshAttendanceBtn) {
      refreshAttendanceBtn.addEventListener('click', () => this.refreshAttendance());
    }

    // Form submission
    const qrForm = document.getElementById('qrForm');
    if (qrForm) {
      qrForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createQRCode();
      });
    }
    
    // Create QR submit button
    const createQRSubmitBtn = document.getElementById('createQRSubmitBtn');
    if (createQRSubmitBtn) {
      createQRSubmitBtn.addEventListener('click', () => this.createQRCode());
    }

    // Register Face button
    const registerFaceBtn = document.getElementById('registerFaceBtn');
    if (registerFaceBtn) {
      registerFaceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/foraddface';
      });
    }
  }

  showMainView() {
    console.log('Showing main view...');
    this.currentView = 'main';
    this.currentSessionId = null;
    this.hideAllSections();
    this.renderQRSessionsList();
    console.log('Main view displayed');
  }

  showCreateQR() {
    console.log('Redirecting to create-qr.html...');
    window.location.href = 'create-qr.html';
  }

  async refreshDashboard() {
    console.log('Refreshing dashboard...');
    this.showLoading();
    try {
      await this.loadDashboardData();
      this.showMainView();
      this.showSuccess('อัปเดตข้อมูลแล้ว');
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
      this.showError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      this.hideLoading();
    }
  }

  async showSessionDetail(sessionId) {
    this.currentView = 'detail';
    this.currentSessionId = sessionId;
    this.hideAllSections();
    
    try {
      this.showLoading();
      
      // Load session details
      const sessionResponse = await fetch(`/api/qrcode/sessions/${sessionId}`, {
        credentials: 'include'
      });
      
      if (!sessionResponse.ok) {
        throw new Error('Failed to load session details');
      }
      
      const session = await sessionResponse.json();
      
      // Load attendance data
      const attendanceResponse = await fetch(`/api/attendance/session/${sessionId}`, {
        credentials: 'include'
      });
      
      if (!attendanceResponse.ok) {
        throw new Error('Failed to load attendance data');
      }
      
      const attendance = await attendanceResponse.json();
      
      this.renderSessionDetail(session, attendance);
      this.hideLoading();
    } catch (error) {
      console.error('Failed to load session detail:', error);
      this.showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      this.hideLoading();
    }
  }

  renderQRSessionsList() {
    const container = document.querySelector('.dashboard-content');
    const sessionsSection = document.createElement('div');
    sessionsSection.className = 'qr-section';
    sessionsSection.innerHTML = `
      <h2>📋 รายการ QR Code ทั้งหมด</h2>
      <div class="qr-sessions-grid">
        ${this.qrSessions.map(session => this.createSessionCard(session)).join('')}
      </div>
    `;
    container.appendChild(sessionsSection);

    // เพิ่ม event listener ให้ปุ่มดู/ลบหลัง render
    sessionsSection.querySelectorAll('.session-card').forEach(card => {
      const sessionId = card.getAttribute('data-session-id');
      const btnEye = card.querySelector('.btn-eye');
      const btnTrash = card.querySelector('.btn-trash');
      if (btnEye) {
        btnEye.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showSessionDetail(sessionId);
        });
      }
      if (btnTrash) {
        btnTrash.addEventListener('click', (e) => {
          e.stopPropagation();
          this.confirmDeleteSession(sessionId);
        });
      }
    });
    // Modal event listeners (run once)
    if (!this._modalSetup) {
      const modal = document.getElementById('deleteModal');
      const cancelBtn = document.getElementById('modalCancelBtn');
      const confirmBtn = document.getElementById('modalConfirmBtn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          modal.classList.add('hidden');
          this.sessionIdToDelete = null;
        });
      }
      if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
          if (this.sessionIdToDelete) {
            await this.deleteSession(this.sessionIdToDelete);
            modal.classList.add('hidden');
            this.sessionIdToDelete = null;
          }
        });
      }
      this._modalSetup = true;
    }
  }

  createSessionCard(session) {
    const createdDate = session.created_at ? new Date(session.created_at).toLocaleDateString('th-TH') : '-';
    const createdTime = session.created_at ? new Date(session.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-';
    const expireDate = session.expire_time ? new Date(session.expire_time).toLocaleDateString('th-TH') : '-';
    const expireTime = session.expire_time ? new Date(session.expire_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-';
    const lateMinute = session.late_minute !== undefined ? session.late_minute : '-';
    
    // กำหนดสถานะตามเวลา
    let statusText = 'หมดอายุ';
    let statusClass = 'inactive';
    const now = new Date();
    const start = new Date(session.start_time);
    const expire = session.expire_time ? new Date(session.expire_time) : null;
    if (expire && now > expire) {
      statusText = 'หมดเวลา';
      statusClass = 'expired';
    } else if (now < start) {
      statusText = 'ยังไม่ถึงเวลา';
      statusClass = 'notyet';
    } else if ((!expire || now <= expire) && now >= start && session.is_active) {
      statusText = 'ใช้งาน';
      statusClass = 'active';
    }
    
    return `
      <div class="session-card ${statusClass}" data-session-id="${session.id}">
        <div class="session-header">
          <h3>${session.subject_code} - ${session.subject_name}</h3>
          <span class="status-badge ${statusClass}">${statusText}</span>
          <div class="session-actions" style="display:flex;gap:8px;align-items:center;">
            <button class="btn btn-small btn-eye" title="ดูรายละเอียด">👁️</button>
            <button class="btn btn-small btn-trash" title="ลบ QR Code">🗑️</button>
          </div>
        </div>
        <div class="session-info">
          <p><strong>กลุ่ม:</strong> ${session.class_group}</p>
          <p><strong>เวลาสร้าง:</strong> ${createdDate} ${createdTime}</p>
          <p><strong>หมดอายุ:</strong> ${expireDate} ${expireTime}</p>
        </div>
        <div class="session-stats">
          <div class="stat">
            <span class="stat-number">${session.total_attendance || 0}</span>
            <span class="stat-label">นักเรียน</span>
          </div>
          <div class="stat">
            <span class="stat-number present">${session.present_count || 0}</span>
            <span class="stat-label">มา</span>
          </div>
          <div class="stat">
            <span class="stat-number late">${session.late_count || 0}</span>
            <span class="stat-label">สาย</span>
          </div>
        </div>
      </div>
    `;
  }

  renderSessionDetail(session, attendance) {
    const container = document.querySelector('.dashboard-content');
    const detailSection = document.createElement('div');
    detailSection.className = 'qr-section';
    
    const startDate = new Date(session.start_time).toLocaleDateString('th-TH');
    const startTime = new Date(session.start_time).toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Generate QR Code image URL
    // const qrCodeUrl = `http://localhost:3000/api/qrcode/sessions/${session.id}/qr-code`;
    const scanUrl = `http://localhost:3000/scan`;
    
    const createdDate = session.created_at ? new Date(session.created_at).toLocaleDateString('th-TH') : '-';
    const createdTime = session.created_at ? new Date(session.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-';
    const expireDate = session.expire_time ? new Date(session.expire_time).toLocaleDateString('th-TH') : '-';
    const expireTime = session.expire_time ? new Date(session.expire_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-';
    const lateMinute = session.late_minute !== undefined ? session.late_minute : '-';
    
    // กำหนดสถานะตามเวลา (เหมือนกับใน createSessionCard)
    let statusText = 'หมดอายุ';
    let statusClass = 'inactive';
    const now = new Date();
    const start = new Date(session.start_time);
    const expire = session.expire_time ? new Date(session.expire_time) : null;
    if (expire && now > expire) {
      statusText = 'หมดเวลา';
      statusClass = 'expired';
    } else if (now < start) {
      statusText = 'ยังไม่ถึงเวลา';
      statusClass = 'notyet';
    } else if ((!expire || now <= expire) && now >= start && session.is_active) {
      statusText = 'ใช้งาน';
      statusClass = 'active';
    }
    
    detailSection.innerHTML = `
      <div class="session-detail-header">
        <button class="btn btn-secondary btn-back-main">
          ← กลับไปหน้าหลัก
        </button>
        <h2>${session.subject_code} - ${session.subject_name}</h2>
      </div>
      
      <div class="session-info-grid">
        <div class="info-card">
          <h4>📚 ข้อมูลวิชา</h4>
          <p><strong>รหัสวิชา:</strong> ${session.subject_code}</p>
          <p><strong>ชื่อวิชา:</strong> ${session.subject_name}</p>
          <p><strong>กลุ่ม:</strong> ${session.class_group} เวลาสร้าง: ${createdDate} ${createdTime}</p>
          <p><strong>เวลาเริ่มเช็คชื่อ:</strong> ${startTime}</p>
          <p><strong>หมดอายุ:</strong> ${expireDate} ${expireTime}</p>
          <p><strong>นาทีที่ถือว่าสาย:</strong> ${lateMinute} นาที</p>
          <p><strong>สถานะ:</strong> <span class="status-${statusClass}">${statusText}</span></p>
        </div>
        
        <div class="info-card">
          <h4>📊 สถิติการเช็คชื่อ</h4>
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-number">${attendance.length}</span>
              <span class="stat-label">นักเรียนทั้งหมด</span>
            </div>
            <div class="stat-item">
              <span class="stat-number present">${attendance.filter(a => a.status === 'มา').length}</span>
              <span class="stat-label">มา</span>
            </div>
            <div class="stat-item">
              <span class="stat-number late">${attendance.filter(a => a.status === 'สาย').length}</span>
              <span class="stat-label">สาย</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="qr-code-section">
        <div class="info-card">
          <h4>📱 QR Code สำหรับเช็คชื่อ</h4>
          <div class="qr-display">
            <div class="qr-code-container">
              <img src="${session.qr_code_image}" alt="QR Code" class="qr-code-image" id="qrCodeImage" style="cursor:zoom-in;">
            </div>
            <div class="qr-info">
              <div class="qr-token-section">
                <label><strong>QR Token:</strong></label>
                <div class="token-display">
                  <input type="text" value="${session.qr_token}" readonly class="token-input" id="qrToken">
                  <button class="btn btn-small btn-copy-token">📋 คัดลอก</button>
                </div>
              </div>
              <div class="qr-link-section">
                <label><strong>ลิงก์สำหรับนักเรียน:</strong></label>
                <div class="link-display">
                  <input type="text" value="${scanUrl}" readonly class="link-input" id="scanUrl">
                  <button class="btn btn-small btn-copy-link">📋 คัดลอก</button>
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
      <!-- Modal QR Code Popup -->
      <div id="qrModal" class="qr-modal" style="display:none;position:fixed;z-index:9999;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);justify-content:center;align-items:center;">
        <div style="position:relative;max-width:90vw;max-height:90vh;">
          <img id="qrModalImg" src="${session.qr_code_image}" alt="QR Code" style="width:60vw;max-width:600px;max-height:80vh;display:block;margin:auto;box-shadow:0 0 24px #000;border-radius:12px;">
          <button id="closeQrModal" style="position:absolute;top:8px;right:8px;font-size:2rem;background:#fff;border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;">&times;</button>
        </div>
      </div>
      <div class="attendance-table">
        <div class="table-header">
          <h3>👥 รายการเช็คชื่อ</h3>
          <div class="table-actions">
            <button class="btn btn-success btn-refresh-attendance" data-session-id="${session.id}">
              🔄 รีเฟรช
            </button>
            <button class="btn btn-primary btn-export-attendance" data-session-id="${session.id}">
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
              ${attendance.map(record => this.createAttendanceRow(record)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    container.appendChild(detailSection);
    // เพิ่ม event listener ให้ปุ่มกลับหน้าหลัก (CSP safe)
    const backBtn = detailSection.querySelector('.btn-back-main');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.showMainView());
    }
    // เพิ่ม event listener ให้ปุ่มคัดลอก (CSP safe)
    const copyTokenBtn = detailSection.querySelector('.btn-copy-token');
    if (copyTokenBtn) {
      copyTokenBtn.addEventListener('click', () => this.copyToken());
    }
    const copyLinkBtn = detailSection.querySelector('.btn-copy-link');
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', () => this.copyLink());
    }
    // เพิ่ม event listener ให้ปุ่มรีเฟรชและ Export (CSP safe)
    const refreshBtn = detailSection.querySelector('.btn-refresh-attendance');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshAttendance(session.id));
    }
    const exportBtn = detailSection.querySelector('.btn-export-attendance');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportAttendance(session.id));
    }
    // เพิ่ม event listener ให้ปุ่มบันทึกในตาราง (CSP safe)
    detailSection.querySelectorAll('.btn-save-attendance').forEach(btn => {
      const attendanceId = btn.getAttribute('data-attendance-id');
      btn.addEventListener('click', () => this.saveAttendance(attendanceId));
    });
    // เพิ่ม event listener ให้ input fields (CSP safe)
    detailSection.querySelectorAll('.score-input, .notes-input').forEach(input => {
      const attendanceId = input.getAttribute('data-attendance-id');
      input.addEventListener('change', () => {
        const scoreInput = document.getElementById(`score-${attendanceId}`);
        const notesInput = document.getElementById(`notes-${attendanceId}`);
        if (scoreInput && notesInput) {
          this.updateScore(attendanceId, scoreInput.value, notesInput.value);
        }
      });
    });
    // เพิ่ม event listener ให้รูป QR Code สำหรับ popup modal
    const qrImg = detailSection.querySelector('#qrCodeImage');
    const qrModal = detailSection.querySelector('#qrModal');
    const qrModalImg = detailSection.querySelector('#qrModalImg');
    const closeQrModal = detailSection.querySelector('#closeQrModal');
    if (qrImg && qrModal && qrModalImg && closeQrModal) {
      qrImg.addEventListener('click', () => {
        qrModal.style.display = 'flex';
      });
      closeQrModal.addEventListener('click', () => {
        qrModal.style.display = 'none';
      });
      qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) qrModal.style.display = 'none';
      });
    }
  }

  createAttendanceRow(record) {
    const checkinTime = new Date(record.checkin_time).toLocaleString('th-TH');
    const statusClass = record.status === 'มา' ? 'present' : record.status === 'สาย' ? 'late' : 'absent';
    
    return `
      <tr>
        <td>${record.student_code}</td>
        <td>${record.firstname} ${record.lastname}</td>
        <td>${checkinTime}</td>
        <td><span class="status-${statusClass}">${record.status}</span></td>
        <td>
          <input type="number" class="score-input" value="${record.extra_score || 0}" 
                 min="0" max="100"
                 id="score-${record.id}"
                 data-attendance-id="${record.id}">
        </td>
        <td>
          <input type="text" class="notes-input" value="${record.notes || ''}" 
                 id="notes-${record.id}"
                 data-attendance-id="${record.id}">
        </td>
        <td>
          <button class="btn btn-small btn-save-attendance" data-attendance-id="${record.id}">
            💾 บันทึก
          </button>
        </td>
      </tr>
    `;
  }

  async createQRCode() {
    const qrForm = document.getElementById('qrForm');
    if (!qrForm) {
      console.warn('QR form not found - redirecting to create-qr.html');
      this.showCreateQR();
      return;
    }
    
    const formData = new FormData(qrForm);
    const data = {
      subject_code: formData.get('subjectCode'),
      subject_name: formData.get('subjectName'),
      teacher_code: formData.get('teacherCode'),
      class_group: formData.get('classGroup'),
      year: parseInt(formData.get('year')),
      semester: parseInt(formData.get('semester')),
      start_time: formData.get('startTime'),
      late_minute: parseInt(formData.get('lateMinute')),
      expire_minutes: parseInt(formData.get('expireTime'))
    };

    try {
      this.showLoading();
      
      const response = await fetch('/api/qrcode/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        this.showQRCode(result);
        await this.loadDashboardData(); // Refresh the list
      } else {
        const error = await response.json();
        this.showError(error.error || 'เกิดข้อผิดพลาดในการสร้าง QR Code');
      }
    } catch (error) {
      console.error('Failed to create QR code:', error);
      this.showError('เกิดข้อผิดพลาดในการสร้าง QR Code');
    } finally {
      this.hideLoading();
    }
  }

  showQRCode(result) {
    const qrDisplay = document.getElementById('qrDisplay');
    const qrCode = document.getElementById('qrCode');
    const qrToken = document.getElementById('qrToken');
    
    if (qrDisplay && qrCode && qrToken) {
      qrCode.innerHTML = `<img src="${result.qr_code_image}" alt="QR Code" style="max-width: 200px;">`;
      qrToken.textContent = result.qr_token;
      qrDisplay.classList.remove('hidden');
    } else {
      console.warn('QR display elements not found');
    }
  }

  async updateScore(attendanceId, extraScore, notes) {
    try {
      const response = await fetch(`/api/attendance/${attendanceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          extra_score: parseInt(extraScore) || 0,
          notes: notes || ''
        })
      });

      if (response.ok) {
        // Show success message
        this.showSuccess('อัปเดตคะแนนเรียบร้อยแล้ว');
      } else {
        const error = await response.json();
        this.showError(error.error || 'เกิดข้อผิดพลาดในการอัปเดตคะแนน');
      }
    } catch (error) {
      console.error('Failed to update score:', error);
      this.showError('เกิดข้อผิดพลาดในการอัปเดตคะแนน');
    }
  }

  async exportAttendance(sessionId) {
    try {
      const response = await fetch(`/api/attendance/export/${sessionId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        // สร้างลิงก์ดาวน์โหลดไฟล์ .xlsx
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        // ดึงชื่อไฟล์จาก header
        const disposition = response.headers.get('Content-Disposition');
        let filename = 'attendance.xlsx';
        if (disposition && disposition.includes('filename=')) {
          filename = disposition.split('filename=')[1].replace(/"/g, '');
        }
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        this.showError('เกิดข้อผิดพลาดในการ export ข้อมูล');
      }
    } catch (error) {
      console.error('Failed to export attendance:', error);
      this.showError('เกิดข้อผิดพลาดในการ export ข้อมูล');
    }
  }

  copyToken() {
    const tokenInput = document.getElementById('qrToken');
    if (tokenInput) {
      tokenInput.select();
      document.execCommand('copy');
      this.showSuccess('คัดลอก QR Token แล้ว');
    }
  }

  copyLink() {
    const linkInput = document.getElementById('scanUrl');
    if (linkInput) {
      linkInput.select();
      document.execCommand('copy');
      this.showSuccess('คัดลอกลิงก์แล้ว');
    }
  }

  async refreshAttendance(sessionId) {
    try {
      this.showLoading();
      
      // Reload attendance data
      const attendanceResponse = await fetch(`/api/attendance/session/${sessionId}`, {
        credentials: 'include'
      });
      
      if (attendanceResponse.ok) {
        const attendance = await attendanceResponse.json();
        
        // Update the attendance table
        const tbody = document.querySelector('.attendance-table tbody');
        if (tbody) {
          tbody.innerHTML = attendance.map(record => this.createAttendanceRow(record)).join('');
        }
        
        this.showSuccess('อัปเดตข้อมูลการเช็คชื่อแล้ว');
      } else {
        this.showError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      }
    } catch (error) {
      console.error('Failed to refresh attendance:', error);
      this.showError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      this.hideLoading();
    }
  }

  async saveAttendance(attendanceId) {
    const scoreInput = document.getElementById(`score-${attendanceId}`);
    const notesInput = document.getElementById(`notes-${attendanceId}`);
    
    if (!scoreInput || !notesInput) {
      this.showError('ไม่พบข้อมูลที่ต้องการบันทึก');
      return;
    }
    
    const extraScore = parseInt(scoreInput.value) || 0;
    const notes = notesInput.value || '';
    
    await this.updateScore(attendanceId, extraScore, notes);
  }

  downloadExcel(data) {
    // Create CSV content
    const headers = Object.keys(data.attendance[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.attendance.map(row =>
        headers.map(header => {
          let value = row[header] || '';
          // ถ้าเป็นรหัสนักเรียน ให้ใส่ ' นำหน้า
          if (header === 'รหัสนักเรียน') value = `'${value}`;
          // escape double quote
          value = String(value).replace(/"/g, '""');
          return `"${value}"`;
        }).join(',')
      )
    ].join('\n');

    // เพิ่ม BOM เพื่อรองรับภาษาไทยใน Excel
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${data.session.subject_code}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  hideAllSections() {
    const sections = document.querySelectorAll('.qr-section');
    sections.forEach(section => section.remove());
    
    // Check if elements exist before accessing them
    const createQRSection = document.getElementById('createQRSection');
    if (createQRSection) {
      createQRSection.classList.add('hidden');
    }
    
    const qrDisplay = document.getElementById('qrDisplay');
    if (qrDisplay) {
      qrDisplay.classList.add('hidden');
    }
  }

  showLoading() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
      loadingState.classList.remove('hidden');
      console.log('Loading state shown');
    } else {
      console.warn('Loading state element not found');
    }
  }

  hideLoading() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
      loadingState.classList.add('hidden');
      console.log('Loading state hidden');
    } else {
      console.warn('Loading state element not found');
    }
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showInfo(message) {
    this.showNotification(message, 'info');
  }

  showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3-5 seconds based on type
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
      notification.classList.add('hide');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, duration);
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

  redirectToLogin() {
    window.location.href = '/';
  }

  // เพิ่มฟังก์ชันยืนยันและลบ QR session
  async confirmDeleteSession(sessionId) {
    this.sessionIdToDelete = sessionId;
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('hidden');
  }

  async deleteSession(sessionId) {
    try {
      const response = await fetch(`/api/qrcode/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        this.showSuccess('ลบ QR Code สำเร็จ');
        // ลบ card ออกจาก DOM ทันที
        const card = document.querySelector(`.session-card[data-session-id='${sessionId}']`);
        if (card) card.remove();
      } else {
        const error = await response.json();
        this.showError(error.error || 'เกิดข้อผิดพลาดในการลบ QR Code');
      }
    } catch (error) {
      this.showError('เกิดข้อผิดพลาดในการลบ QR Code');
    }
  }
}

// Initialize dashboard when page loads
let dashboard;

// Initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    dashboard = new DashboardManager();
  });
} else {
  dashboard = new DashboardManager();
}

// Global functions for onclick handlers
window.showCreateQR = function() {
  if (dashboard) {
    dashboard.showCreateQR();
  } else {
    console.log('Redirecting to create-qr.html...');
    window.location.href = 'create-qr.html';
  }
};

window.showMainView = function() {
  if (dashboard) {
    dashboard.showMainView();
  } else {
    console.error('Dashboard not initialized');
    alert('ระบบกำลังโหลด กรุณาลองใหม่อีกครั้ง');
  }
};

window.showSessionDetail = function(sessionId) {
  if (dashboard) {
    dashboard.showSessionDetail(sessionId);
  } else {
    console.error('Dashboard not initialized');
    alert('ระบบกำลังโหลด กรุณาลองใหม่อีกครั้ง');
  }
};

window.createQRCode = function() {
  if (dashboard) {
    dashboard.createQRCode();
  } else {
    console.error('Dashboard not initialized');
    alert('ระบบกำลังโหลด กรุณาลองใหม่อีกครั้ง');
  }
};

window.copyToken = function() {
  if (dashboard) {
    dashboard.copyToken();
  } else {
    console.error('Dashboard not initialized');
    alert('ระบบกำลังโหลด กรุณาลองใหม่อีกครั้ง');
  }
};

window.copyLink = function() {
  if (dashboard) {
    dashboard.copyLink();
  } else {
    console.error('Dashboard not initialized');
    alert('ระบบกำลังโหลด กรุณาลองใหม่อีกครั้ง');
  }
};

window.refreshAttendance = function(sessionId) {
  if (dashboard) {
    dashboard.refreshAttendance(sessionId);
  } else {
    console.error('Dashboard not initialized');
    alert('ระบบกำลังโหลด กรุณาลองใหม่อีกครั้ง');
  }
};

window.saveAttendance = function(attendanceId) {
  if (dashboard) {
    dashboard.saveAttendance(attendanceId);
  } else {
    console.error('Dashboard not initialized');
    alert('ระบบกำลังโหลด กรุณาลองใหม่อีกครั้ง');
  }
};

// Global function for refresh dashboard (calls the class method)
window.refreshDashboard = function() {
  if (dashboard) {
    dashboard.refreshDashboard();
  } else {
    console.error('Dashboard not initialized');
    alert('ระบบกำลังโหลด กรุณาลองใหม่อีกครั้ง');
  }
};

window.exportAttendance = function() {
  if (dashboard) {
    // Get current session ID if available
    const currentSessionId = dashboard.currentSessionId;
    if (currentSessionId) {
      dashboard.exportAttendance(currentSessionId);
    } else {
      dashboard.showError('กรุณาเลือก QR Session ก่อน');
    }
  } else {
    console.error('Dashboard not initialized');
    alert('ระบบกำลังโหลด กรุณาลองใหม่อีกครั้ง');
  }
};

window.logout = function() {
  if (dashboard) {
    dashboard.logout();
  } else {
    console.error('Dashboard not initialized');
    window.location.href = '/';
  }
}; 