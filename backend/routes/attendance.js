const express = require('express');
const Attendance = require('../models/attendance');
const QRCodeSession = require('../models/qrcodeSession');
const { requireTeacher } = require('../auth');
const XLSX = require('xlsx');

const router = express.Router();

// Get attendance for a specific QR session
router.get('/session/:sessionId', requireTeacher, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    // Check if session belongs to teacher
    const session = await QRCodeSession.getById(sessionId);
    if (!session || session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const attendance = await Attendance.getBySession(sessionId);
    res.json(attendance);
  } catch (error) {
    console.error('Error getting attendance:', error);
    res.status(500).json({ error: 'Failed to get attendance' });
  }
});

// Update attendance score and notes
router.put('/:attendanceId', requireTeacher, async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { extra_score, notes } = req.body;
    
    // Validate that the attendance belongs to a session owned by the teacher
    const { pool } = require('../db');
    const query = `
      SELECT sa.*, qs.teacher_id 
      FROM student_attendance sa
      JOIN qr_sessions qs ON sa.qr_session_id = qs.id
      WHERE sa.id = ?
    `;
    
    const [rows] = await pool.execute(query, [attendanceId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    if (rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await Attendance.updateScore(attendanceId, extra_score || 0, notes || '');
    
    // Get updated record
    const updatedRecord = await Attendance.getById(attendanceId);
    res.json({ 
      message: 'Attendance updated successfully',
      record: updatedRecord
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

// Get attendance statistics for teacher
router.get('/stats', requireTeacher, async (req, res) => {
  try {
    const stats = await Attendance.getStatsByTeacher(req.user.id);
    const todayStats = await Attendance.getTodayStats(req.user.id);
    
    res.json({
      overall: stats,
      today: todayStats
    });
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    res.status(500).json({ error: 'Failed to get attendance statistics' });
  }
});

// Validate student data before face verification
router.post('/validate-student', async (req, res) => {
  try {
    const { qr_token, student_id, firstname, lastname } = req.body;
    
    if (!qr_token || !student_id || !firstname || !lastname) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลนิสิตให้ครบถ้วน' });
    }
    
    // Get QR session by token
    const session = await QRCodeSession.getByToken(qr_token);
    if (!session) {
      return res.status(404).json({ error: 'Invalid QR code or session expired' });
    }
    
    // Check if session is still active
    if (!session.is_active) {
      return res.status(400).json({ error: 'QR session is no longer active' });
    }
    
    // Check if session has expired
    if (new Date() > new Date(session.expire_time)) {
      return res.status(400).json({ error: 'QR session has expired' });
    }
    
    // Check if student already checked in
    const existingAttendance = await Attendance.checkExistingAttendanceByFullInfo(session.id, student_id, firstname, lastname);
    if (existingAttendance) {
      return res.status(400).json({ error: 'มีการเช็คชื่อในรอบนี้แล้ว' });
    }
    
    // Check if student exists in face registration
    const { pool } = require('../db');
    const [faceRows] = await pool.execute(
      'SELECT * FROM studentface WHERE student_id = ? AND first_name = ? AND last_name = ?',
      [student_id, firstname, lastname]
    );
    
    if (faceRows.length === 0) {
      return res.status(400).json({ 
        error: 'ไม่พบนักเรียนนี้ในระบบลงทะเบียนใบหน้า กรุณาติดต่ออาจารย์' 
      });
    }
    
    // Validation passed
    res.json({ 
      message: 'ข้อมูลนักเรียนถูกต้อง สามารถดำเนินการยืนยันใบหน้าได้',
      session: session,
      student: {
        student_id,
        firstname,
        lastname
      }
    });
    
  } catch (error) {
    console.error('Error validating student data:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
  }
});

// Student check-in (for QR scanning)
router.post('/checkin', async (req, res) => {
  try {
    const { qr_token, student_id, firstname, lastname, face_descriptor } = req.body;
    
    if (!qr_token || !student_id || !firstname || !lastname) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get QR session by token
    const session = await QRCodeSession.getByToken(qr_token);
    if (!session) {
      return res.status(404).json({ error: 'Invalid QR code or session expired' });
    }
    
    // Check if session is still active
    if (!session.is_active) {
      return res.status(400).json({ error: 'QR session is no longer active' });
    }
    
    // Check if session has expired
    if (new Date() > new Date(session.expire_time)) {
      return res.status(400).json({ error: 'QR session has expired' });
    }
    
    // Check if student already checked in (by id, firstname, lastname)
    const existingAttendance = await Attendance.checkExistingAttendanceByFullInfo(session.id, student_id, firstname, lastname);
    if (existingAttendance) {
      return res.status(400).json({ error: 'มีการเช็คชื่อในรอบนี้แล้ว' });
    }
    
    // ตรวจสอบกับฐานข้อมูล studentface
    const { pool } = require('../db');
    console.log('DEBUG FACE:', student_id, firstname, lastname);
    const [faceRows] = await pool.execute(
      'SELECT * FROM studentface WHERE student_id = ? AND first_name = ? AND last_name = ?',
      [student_id, firstname, lastname]
    );
    if (faceRows.length === 0) {
      return res.status(400).json({ error: 'ไม่พบนักเรียนนี้ในระบบลงทะเบียนใบหน้า กรุณาลงทะเบียนที่หน้า /face-registration' });
    }

    // ตรวจสอบ face_descriptor ถ้ามีการส่งมา
    if (face_descriptor) {
      try {
        const newDescriptor = JSON.parse(face_descriptor);
        
        // Validate face descriptor format
        if (!Array.isArray(newDescriptor) || newDescriptor.length !== 128) {
          return res.status(400).json({ error: 'Invalid face descriptor format' });
        }
        
        const registeredDescriptor = JSON.parse(faceRows[0].face_descriptor);
        
        // Validate registered descriptor
        if (!Array.isArray(registeredDescriptor) || registeredDescriptor.length !== 128) {
          return res.status(400).json({ error: 'Invalid registered face descriptor format' });
        }
        
        // ฟังก์ชันคำนวณ L2 distance
        const l2Distance = (a, b) => {
          let sum = 0;
          for (let i = 0; i < a.length; i++) {
            sum += (a[i] - b[i]) ** 2;
          }
          return Math.sqrt(sum);
        };
        
        // เปรียบเทียบ face descriptor
        const distance = l2Distance(newDescriptor, registeredDescriptor);
        console.log('Face distance:', distance);
        
        const THRESHOLD = 0.5;
        if (distance > THRESHOLD) {
          return res.status(400).json({ error: 'ใบหน้าที่สแกนไม่ตรงกับข้อมูลที่ลงทะเบียนไว้ กรุณาลองใหม่' });
        }
        
        // ตรวจสอบการใช้งานใบหน้าซ้ำกับรหัสอื่น
        const [duplicateFaces] = await pool.execute(
          'SELECT * FROM studentface WHERE student_id != ? AND face_descriptor IS NOT NULL',
          [student_id]
        );
        
        for (const row of duplicateFaces) {
          if (!row.face_descriptor) continue;
          
          let dbDescriptor;
          try {
            dbDescriptor = JSON.parse(row.face_descriptor);
          } catch (e) {
            continue;
          }
          
          if (!Array.isArray(dbDescriptor) || dbDescriptor.length !== newDescriptor.length) continue;
          
          const dist = l2Distance(newDescriptor, dbDescriptor);
          if (dist < THRESHOLD) {
            return res.status(400).json({ 
              error: 'ใบหน้านี้ถูกใช้ลงทะเบียนไปแล้วกับรหัสอื่น' 
            });
          }
        }
        
      } catch (e) {
        console.error('Error comparing face descriptors:', e);
        return res.status(400).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบใบหน้า' });
      }
    } else {
      return res.status(400).json({ error: 'กรุณาสแกนใบหน้าเพื่อยืนยันตัวตน' });
    }
    
    // Determine status based on time
    const now = new Date();
    const startTime = new Date(session.start_time);
    const lateTime = new Date(startTime.getTime() + (session.late_minute * 60 * 1000));
    
    let status = 'มา';
    if (now > lateTime) {
      status = 'สาย';
    }
    
    // Create or update student record
    const Student = require('../models/student');
    let student = await Student.getByCode(student_id);
    
    if (!student) {
      // Create new student
      const newStudentId = await Student.create({
        student_code: student_id,
        firstname,
        lastname,
        class_group: session.class_group
      });
      student = await Student.getById(newStudentId);
    }
    
    // Create attendance record
    const attendanceData = {
      qr_session_id: session.id,
      student_id: student.id,
      checkin_time: now,
      status,
      extra_score: 0,
      notes: ''
    };
    
    await Attendance.create(attendanceData);

    // เพิ่มบันทึกลง student_submissions เฉพาะถ้ายังไม่มีข้อมูลนี้
    // 1. หา qr_session_id จาก session.id
    // 2. หา student_id จาก student.id
    // 3. เช็คว่ามี submission นี้อยู่แล้วหรือยัง
    const [existingSubRows] = await pool.execute(`
      SELECT * FROM qr_sessions
      INNER JOIN student_submissions ON qr_sessions.id = student_submissions.qr_session_id
      INNER JOIN students ON students.id = student_submissions.student_id
      WHERE qr_sessions.qr_token = ?
        AND students.student_code = ?
        AND student_submissions.firstname = ?
        AND student_submissions.lastname = ?
    `, [qr_token, student_id, firstname, lastname]);
    if (existingSubRows.length > 0) {
      return res.status(400).json({ error: 'มีการลงทะเบียนแล้ว' });
    }
    // ถ้ายังไม่มี ให้ insert
    const StudentSubmission = require('../models/studentSubmission');
    await StudentSubmission.create({
      student_id: student.id,
      teacher_id: session.teacher_id,
      qr_session_id: session.id,
      firstname,
      lastname,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    res.json({
      message: 'Check-in successful',
      status,
      checkin_time: now
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    res.status(500).json({ error: 'Failed to process check-in' });
  }
});

// ลงทะเบียนใบหน้านักเรียน (ป้องกันซ้ำ)
router.post('/student/register', async (req, res) => {
  const { student_id, first_name, last_name, face_descriptor } = req.body;
  if (!student_id || !first_name || !last_name || !face_descriptor) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });
  }
  try {
    const { pool } = require('../db');
    // 1. เช็ค student_id ซ้ำ (เหมือนเดิม)
    const [rows] = await pool.execute('SELECT * FROM studentface WHERE student_id = ?', [student_id]);
    if (rows.length > 0) {
      return res.status(400).json({ success: false, message: 'นักเรียนคนนี้ลงทะเบียนไปแล้ว' });
    }

    // 2. ดึง face_descriptor ทั้งหมด
    const [faceRows] = await pool.execute('SELECT student_id, face_descriptor FROM studentface');
    const newDescriptor = JSON.parse(face_descriptor);

    // 3. ฟังก์ชันคำนวณ L2 distance
    const l2Distance = (a, b) => {
      let sum = 0;
      for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
      }
      return Math.sqrt(sum);
    };

    // 4. เปรียบเทียบกับทุก descriptor ใน DB
    for (const row of faceRows) {
      if (!row.face_descriptor) continue;
      let dbDescriptor;
      try {
        dbDescriptor = JSON.parse(row.face_descriptor);
      } catch (e) {
        continue;
      }
      if (!Array.isArray(dbDescriptor) || dbDescriptor.length !== newDescriptor.length) continue;
      const dist = l2Distance(newDescriptor, dbDescriptor);
      if (dist < 0.5) { // threshold 0.5 (ปรับได้)
        return res.status(400).json({ success: false, message: 'ใบหน้านี้ถูกใช้ลงทะเบียนไปแล้วกับรหัสอื่น' });
      }
    }

    // 5. ถ้าไม่ซ้ำ ให้ insert
    await pool.execute(
      'INSERT INTO studentface (student_id, first_name, last_name, face_descriptor) VALUES (?, ?, ?, ?)',
      [student_id, first_name, last_name, face_descriptor]
    );
    res.json({ success: true, message: 'ลงทะเบียนสำเร็จ' });
  } catch (error) {
    console.error('Error in /student/register:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลงทะเบียน' });
  }
});

// Export attendance data (for Excel download)
router.get('/export/:sessionId', requireTeacher, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    // Check if session belongs to teacher
    const session = await QRCodeSession.getById(sessionId);
    if (!session || session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const attendance = await Attendance.getBySession(sessionId);
    // Format data for Excel export
    const exportData = attendance.map(record => ({
      'รหัสนักเรียน': record.student_code,
      'ชื่อ': record.firstname,
      'นามสกุล': record.lastname,
      'กลุ่มชั้น': record.class_group,
      'เวลาเช็คชื่อ': new Date(record.checkin_time).toLocaleString('th-TH'),
      'สถานะ': record.status,
      'คะแนนเพิ่มเติม': record.extra_score,
      'หมายเหตุ': record.notes
    }));
    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(exportData);
    // Force column A (รหัสนักเรียน) to be text
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const cellAddress = { c: 0, r: R }; // column 0 = A
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      if (ws[cellRef]) ws[cellRef].z = '@';
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${session.subject_code}_${today}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({ error: 'Failed to export attendance data' });
  }
});

// GET session info by qr_token (public)
router.get('/session-info/:qr_token', async (req, res) => {
  try {
    const session = await QRCodeSession.getByToken(req.params.qr_token);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    // เช็คว่ายังไม่ถึงเวลาเริ่มเช็คชื่อ
    const now = new Date();
    const startTime = new Date(session.start_time);
    if (now < startTime) {
      return res.status(400).json({ error: 'ยังไม่ถึงเวลาเริ่มเช็คชื่อ' });
    }
    res.json({
      teacher_code: session.teacher_code,
      description: session.description,
      subject_code: session.subject_code,
      subject_name: session.subject_name,
      class_group: session.class_group,
      year: session.year,
      semester: session.semester,
      email: session.teacher_email,
      teacher_id: session.teacher_id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get session info' });
  }
});

// Validate student face registration
router.post('/validate-face', async (req, res) => {
  const { student_id, firstname, lastname } = req.body;
  const { pool } = require('../db');
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM studentface WHERE student_id = ? AND first_name = ? AND last_name = ?',
      [student_id.trim(), firstname.trim(), lastname.trim()]
    );
    if (rows.length > 0) {
      res.json({ found: true });
    } else {
      res.json({ found: false });
    }
  } catch (error) {
    res.status(500).json({ found: false, error: 'Database error' });
  }
});

// Check duplicate submission in student_submissions
router.post('/check-duplicate-submission', async (req, res) => {
  const { qr_token, student_code, firstname, lastname } = req.body;
  const { pool } = require('../db');
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM qr_sessions
      INNER JOIN student_submissions ON qr_sessions.id = student_submissions.qr_session_id
      INNER JOIN students ON students.id = student_submissions.student_id
      WHERE qr_sessions.qr_token = ?
        AND students.student_code = ?
        AND student_submissions.firstname = ?
        AND student_submissions.lastname = ?
    `, [qr_token, student_code, firstname, lastname]);
    if (rows.length > 0) {
      res.json({ duplicate: true });
    } else {
      res.json({ duplicate: false });
    }
  } catch (error) {
    res.status(500).json({ duplicate: false, error: 'Database error' });
  }
});

module.exports = router;
