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

// Get bulk attendance data for multiple sessions
router.post('/bulk', requireTeacher, async (req, res) => {
  try {
    const { sessionIds } = req.body;
    
    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'sessionIds array is required'
      });
    }
    
    console.log(`Getting bulk attendance for ${sessionIds.length} sessions`);
    
    // Get attendance data for all sessions at once
    const bulkAttendance = await Attendance.getBulkBySessionIds(sessionIds, req.user.id);
    
    // Format the response to group by session ID
    const formattedData = {};
    let totalCount = 0;
    
    bulkAttendance.forEach(record => {
      const sessionId = record.qr_session_id;
      if (!formattedData[sessionId]) {
        formattedData[sessionId] = [];
      }
      formattedData[sessionId].push(record);
      totalCount++;
    });
    
    // Ensure all requested session IDs have an entry (even if empty)
    sessionIds.forEach(sessionId => {
      if (!formattedData[sessionId]) {
        formattedData[sessionId] = [];
      }
    });
    
    res.json({
      success: true,
      data: formattedData,
      count: totalCount,
      sessions: sessionIds.length
    });
  } catch (error) {
    console.error('Error getting bulk attendance:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get bulk attendance data' 
    });
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

// Input validation helper functions
const validateStudentData = (student_id, firstname, lastname) => {
  const errors = [];
  
  // Validate student_id
  if (!student_id || typeof student_id !== 'string') {
    errors.push('รหัสนิสิตไม่ถูกต้อง');
  } else if (student_id.trim().length < 5 || student_id.trim().length > 20) {
    errors.push('รหัสนิสิตต้องมี 5-20 ตัวอักษร');
  } else if (!/^[a-zA-Z0-9]+$/.test(student_id.trim())) {
    errors.push('รหัสนิสิตต้องเป็นตัวอักษรและตัวเลขเท่านั้น');
  }
  
  // Validate firstname
  if (!firstname || typeof firstname !== 'string') {
    errors.push('ชื่อไม่ถูกต้อง');
  } else if (firstname.trim().length < 1 || firstname.trim().length > 50) {
    errors.push('ชื่อต้องมี 1-50 ตัวอักษร');
  } else if (!/^[a-zA-Zก-๙\s]+$/.test(firstname.trim())) {
    errors.push('ชื่อต้องเป็นตัวอักษรเท่านั้น');
  }
  
  // Validate lastname
  if (!lastname || typeof lastname !== 'string') {
    errors.push('นามสกุลไม่ถูกต้อง');
  } else if (lastname.trim().length < 1 || lastname.trim().length > 50) {
    errors.push('นามสกุลต้องมี 1-50 ตัวอักษร');
  } else if (!/^[a-zA-Zก-๙\s]+$/.test(lastname.trim())) {
    errors.push('นามสกุลต้องเป็นตัวอักษรเท่านั้น');
  }
  
  return errors;
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>\"'&]/g, '');
};

// Validate student data before face verification
router.post('/validate-student', async (req, res) => {
  try {
    const { qr_token, student_id, firstname, lastname } = req.body;
    
    // Basic required fields check
    if (!qr_token || !student_id || !firstname || !lastname) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลนิสิตให้ครบถ้วน' });
    }
    
    // Input validation
    const validationErrors = validateStudentData(student_id, firstname, lastname);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'ข้อมูลไม่ถูกต้อง',
        details: validationErrors
      });
    }
    
    // Sanitize inputs
    const sanitizedStudentId = sanitizeInput(student_id);
    const sanitizedFirstname = sanitizeInput(firstname);
    const sanitizedLastname = sanitizeInput(lastname);
    
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
    const existingAttendance = await Attendance.checkExistingAttendanceByFullInfo(session.id, sanitizedStudentId, sanitizedFirstname, sanitizedLastname);
    if (existingAttendance) {
      return res.status(400).json({ error: 'มีการเช็คชื่อในรอบนี้แล้ว' });
    }
    
    // Check if student exists in face registration
    const { pool } = require('../db');
    const [faceRows] = await pool.execute(
      'SELECT * FROM studentface WHERE student_id = ? AND first_name = ? AND last_name = ?',
      [sanitizedStudentId, sanitizedFirstname, sanitizedLastname]
    );
    
    if (faceRows.length === 0) {
      return res.status(400).json({ 
        error: 'ไม่พบนักเรียนนี้ในระบบลงทะเบียนใบหน้า กรุณาติดต่ออาจารย์' 
      });
    }
    
    // Validation passed
    res.json({ 
      valid: true,
      message: 'ข้อมูลนักเรียนถูกต้อง สามารถดำเนินการยืนยันใบหน้าได้',
      session: {
        id: session.id,
        subject_code: session.subject_code,
        subject_name: session.subject_name,
        teacher_code: session.teacher_code,
        class_group: session.class_group,
        start_time: session.start_time,
        late_minute: session.late_minute
      },
      student: {
        student_id: sanitizedStudentId,
        firstname: sanitizedFirstname,
        lastname: sanitizedLastname
      }
    });
    
  } catch (error) {
    console.error('Error in validate-student:', error);
    
    // Better error handling with specific error types
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในโครงสร้างฐานข้อมูล' });
    } else if (error.code === 'ECONNREFUSED') {
      res.status(500).json({ error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' });
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      res.status(500).json({ error: 'ไม่มีสิทธิ์เข้าถึงฐานข้อมูล' });
    } else {
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล กรุณาลองใหม่' });
    }
  }
});

// Check if student already exists in face registration
router.post('/student/check', async (req, res) => {
  try {
    const { student_code, firstname, lastname } = req.body;
    
    // Validate required fields
    if (!student_code || !firstname || !lastname) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    
    // Validate student code format (10 digits)
    if (!/^\d{10}$/.test(student_code)) {
      return res.status(400).json({ error: 'รหัสนิสิตต้องเป็นตัวเลข 10 หลัก' });
    }
    
    // Check if student already exists in studentface table
    const { pool } = require('../db');
    
    // First check if student code already exists (regardless of name)
    const [existingCodeRows] = await pool.execute(
      'SELECT * FROM studentface WHERE student_id = ?',
      [student_code]
    );
    
    if (existingCodeRows.length > 0) {
      return res.status(400).json({ 
        error: 'รหัสนิสิตนี้ถูกใช้ลงทะเบียนไปแล้ว กรุณาใช้รหัสนิสิตอื่น' 
      });
    }
    
    // Then check if the same name combination already exists
    const [existingNameRows] = await pool.execute(
      'SELECT * FROM studentface WHERE first_name = ? AND last_name = ?',
      [firstname, lastname]
    );
    
    if (existingNameRows.length > 0) {
      return res.status(400).json({ 
        error: 'ชื่อและนามสกุลนี้ถูกใช้ลงทะเบียนไปแล้ว กรุณาใช้ชื่ออื่น' 
      });
    }
    
    res.json({ 
      exists: false, 
      message: 'สามารถลงทะเบียนใบหน้าได้' 
    });
    
  } catch (error) {
    console.error('Error checking student existence:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
  }
});

// Student check-in (for QR scanning)
router.post('/checkin', async (req, res) => {
  try {
    const { qr_token, student_id, firstname, lastname, face_descriptor, ip_address } = req.body;
    
    // Basic required fields check
    if (!qr_token || !student_id || !firstname || !lastname) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    
    // Input validation
    const validationErrors = validateStudentData(student_id, firstname, lastname);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'ข้อมูลไม่ถูกต้อง',
        details: validationErrors
      });
    }
    
    // Sanitize inputs
    const sanitizedStudentId = sanitizeInput(student_id);
    const sanitizedFirstname = sanitizeInput(firstname);
    const sanitizedLastname = sanitizeInput(lastname);
    
    // Validate face_descriptor if provided
    if (face_descriptor && typeof face_descriptor !== 'string') {
      return res.status(400).json({ error: 'ข้อมูลใบหน้าไม่ถูกต้อง' });
    }
    
    // Get client IP address (from frontend or fallback to server IP)
    const clientIP = ip_address || req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    console.log('Client IP from frontend:', ip_address);
    console.log('Client IP fallback:', clientIP);
    
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
    
    // Add: block before start_time
    const nowForStartCheck = new Date();
    const startTimeForStartCheck = new Date(session.start_time);
    if (nowForStartCheck < startTimeForStartCheck) {
      return res.status(400).json({ error: 'ยังไม่ถึงเวลาเริ่มเช็คชื่อ' });
    }
    
    // Check if student already checked in (by id, firstname, lastname)
    const existingAttendance = await Attendance.checkExistingAttendanceByFullInfo(session.id, sanitizedStudentId, sanitizedFirstname, sanitizedLastname);
    if (existingAttendance) {
      return res.status(400).json({ error: 'มีการเช็คชื่อในรอบนี้แล้ว' });
    }
    
    // ตรวจสอบกับฐานข้อมูล studentface (แค่เช็คว่ามีข้อมูล)
    const { pool } = require('../db');
    console.log('DEBUG FACE:', sanitizedStudentId, sanitizedFirstname, sanitizedLastname);
    const [faceRows] = await pool.execute(
      'SELECT * FROM studentface WHERE student_id = ? AND first_name = ? AND last_name = ?',
      [sanitizedStudentId, sanitizedFirstname, sanitizedLastname]
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
    let student = await Student.getByCode(sanitizedStudentId);
    
    if (!student) {
      // Create new student
      const newStudentId = await Student.create({
        student_code: sanitizedStudentId,
        firstname: sanitizedFirstname,
        lastname: sanitizedLastname,
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
    const [existingSubRows] = await pool.execute(`
      SELECT * FROM qr_sessions
      INNER JOIN student_submissions ON qr_sessions.id = student_submissions.qr_session_id
      INNER JOIN students ON students.id = student_submissions.student_id
      WHERE qr_sessions.qr_token = ?
        AND students.student_code = ?
        AND student_submissions.firstname = ?
        AND student_submissions.lastname = ?
    `, [qr_token, sanitizedStudentId, sanitizedFirstname, sanitizedLastname]);
    if (existingSubRows.length > 0) {
      return res.status(400).json({ error: 'มีการลงทะเบียนแล้ว' });
    }
    // ถ้ายังไม่มี ให้ insert
    const StudentSubmission = require('../models/studentSubmission');
    await StudentSubmission.create({
      student_id: student.id,
      teacher_id: session.teacher_id,
      qr_session_id: session.id,
      firstname: sanitizedFirstname,
      lastname: sanitizedLastname,
      ip_address: clientIP, // ใช้ IP ที่ส่งมาจาก frontend
      user_agent: req.headers['user-agent']
    });
    
    res.json({
      message: 'Check-in successful',
      status,
      checkin_time: now,
      ip_address: clientIP
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    
    // Better error handling with specific error types
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'มีการเช็คชื่อในรอบนี้แล้ว' });
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในโครงสร้างฐานข้อมูล' });
    } else if (error.code === 'ECONNREFUSED') {
      res.status(500).json({ error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' });
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      res.status(500).json({ error: 'ไม่มีสิทธิ์เข้าถึงฐานข้อมูล' });
    } else {
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเช็คชื่อ กรุณาลองใหม่' });
    }
  }
});

// ลงทะเบียนใบหน้านักเรียน (ป้องกันซ้ำ)
router.post('/student/register', async (req, res) => {
  console.log('Received registration request:', req.body)
  
  const { student_id, first_name, last_name, face_descriptor } = req.body;
  
  // Basic required fields check
  if (!student_id || !first_name || !last_name || !face_descriptor) {
    console.log('Missing required fields:', { student_id, first_name, last_name, face_descriptor: !!face_descriptor })
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });
  }
  
  // Input validation
  const validationErrors = validateStudentData(student_id, first_name, last_name);
  if (validationErrors.length > 0) {
    return res.status(400).json({ 
      success: false,
      message: 'ข้อมูลไม่ถูกต้อง',
      details: validationErrors
    });
  }
  
  // Sanitize inputs
  const sanitizedStudentId = sanitizeInput(student_id);
  const sanitizedFirstname = sanitizeInput(first_name);
  const sanitizedLastname = sanitizeInput(last_name);
  
  // Validate face_descriptor
  if (typeof face_descriptor !== 'string' || face_descriptor.length < 100) {
    return res.status(400).json({ success: false, message: 'ข้อมูลใบหน้าไม่ถูกต้อง' });
  }
  
  try {
    const { pool } = require('../db');
    
    // 1. เช็ค student_id ซ้ำ (เหมือนเดิม)
    const [rows] = await pool.execute('SELECT * FROM studentface WHERE student_id = ?', [sanitizedStudentId]);
    if (rows.length > 0) {
      console.log('Student already exists:', sanitizedStudentId)
      return res.status(400).json({ success: false, message: 'นักเรียนคนนี้ลงทะเบียนไปแล้ว' });
    }

    // 2. เช็คชื่อและนามสกุลซ้ำ
    const [nameRows] = await pool.execute('SELECT * FROM studentface WHERE first_name = ? AND last_name = ?', [sanitizedFirstname, sanitizedLastname]);
    if (nameRows.length > 0) {
      console.log('Name combination already exists:', sanitizedFirstname, sanitizedLastname)
      return res.status(400).json({ success: false, message: 'ชื่อและนามสกุลนี้ถูกใช้ลงทะเบียนไปแล้ว' });
    }

    // 3. เช็คใบหน้าซ้ำ (เฉพาะเมื่อมีข้อมูลใน DB)
    const [faceRows] = await pool.execute('SELECT student_id, face_descriptor FROM studentface WHERE face_descriptor IS NOT NULL');
    
    if (faceRows.length > 0) {
    const newDescriptor = JSON.parse(face_descriptor);
      console.log('Checking against', faceRows.length, 'existing faces')

      // ฟังก์ชันคำนวณ L2 distance
    const l2Distance = (a, b) => {
      let sum = 0;
      for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
      }
      return Math.sqrt(sum);
    };

      // เปรียบเทียบกับทุก descriptor ใน DB
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
        if (dist < 0.5) { // threshold 0.5
          console.log('Duplicate face detected, distance:', dist, 'for student:', row.student_id)
        return res.status(400).json({ success: false, message: 'ใบหน้านี้ถูกใช้ลงทะเบียนไปแล้วกับรหัสอื่น' });
        }
      }
    }

    // 4. ถ้าไม่ซ้ำ ให้ insert
    await pool.execute(
      'INSERT INTO studentface (student_id, first_name, last_name, face_descriptor) VALUES (?, ?, ?, ?)',
      [sanitizedStudentId, sanitizedFirstname, sanitizedLastname, face_descriptor]
    );
    console.log('Registration successful for student:', sanitizedStudentId)
    res.json({ success: true, message: 'ลงทะเบียนสำเร็จ' });
  } catch (error) {
    console.error('Error in /student/register:', error);
    
    // Better error handling with specific error types
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, message: 'ข้อมูลซ้ำ กรุณาตรวจสอบอีกครั้ง' });
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในโครงสร้างฐานข้อมูล' });
    } else if (error.code === 'ECONNREFUSED') {
      res.status(500).json({ success: false, message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' });
    } else {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่' });
    }
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
    
    // Clean filename to avoid invalid characters in header
    const cleanSubjectCode = session.subject_code.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `attendance_${cleanSubjectCode}_${today}.xlsx`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
    // เช็คหมดเวลา
    const expireTime = new Date(session.expire_time);
    if (now > expireTime) {
      return res.status(400).json({ error: 'QR session has expired' });
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
      teacher_id: session.teacher_id,
      start_time: session.start_time,
      expire_time: session.expire_time,
      late_minute: session.late_minute
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

// ==================== สรุปการเข้าเรียน ====================

// ดึงข้อมูลสรุปการเข้าเรียนแต่ละคาบเรียน
router.get('/session-summary/:sessionId', requireTeacher, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    // ตรวจสอบว่า session นี้เป็นของครูคนนี้หรือไม่
    const session = await QRCodeSession.getById(sessionId);
    if (!session || session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const summary = await Attendance.getSessionSummary(sessionId);
    
    if (!summary) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting session summary:', error);
    res.status(500).json({ error: 'Failed to get session summary' });
  }
});

// ดึงข้อมูลสรุปการเข้าเรียนทั้งหมดของครู
router.get('/all-sessions-summary', requireTeacher, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const teacherId = req.user.id;
    
    const summaries = await Attendance.getAllSessionsSummary(teacherId, startDate, endDate);
    
    res.json({
      success: true,
      data: summaries,
      total: summaries.length
    });
  } catch (error) {
    console.error('Error getting all sessions summary:', error);
    res.status(500).json({ error: 'Failed to get all sessions summary' });
  }
});

// ดึงข้อมูลสรุปการเข้าเรียนรายวิชา
router.get('/subject-summary', requireTeacher, async (req, res) => {
  try {
    const { subjectName } = req.query;
    const teacherId = req.user.id;
    
    const summaries = await Attendance.getSubjectSummary(teacherId, subjectName);
    
    res.json({
      success: true,
      data: summaries,
      total: summaries.length
    });
  } catch (error) {
    console.error('Error getting subject summary:', error);
    res.status(500).json({ error: 'Failed to get subject summary' });
  }
});

// Export สรุปการเข้าเรียนทั้งหมดเป็น Excel
router.get('/export-summary', requireTeacher, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const teacherId = req.user.id;
    
    const summaries = await Attendance.getAllSessionsSummary(teacherId, startDate, endDate);
    
    // จัดรูปแบบข้อมูลสำหรับ Excel
    const exportData = summaries.map(summary => ({
      'รหัสคาบ': summary.session_id,
      'วิชา': summary.subject_name,
      'ชั้นเรียน': summary.class_name,
      'กลุ่ม': summary.class_group,
      'เวลาเริ่ม': new Date(summary.start_time).toLocaleString('th-TH'),
      'เวลาสิ้นสุด': new Date(summary.end_time).toLocaleString('th-TH'),
      'จำนวนนักเรียนทั้งหมด': summary.total_students,
      'มา': summary.present_count,
      'สาย': summary.late_count,
      'ขาด': summary.absent_count,
      'อัตราการมาเรียน (%)': summary.attendance_rate
    }));
    
    // สร้าง Excel file
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'สรุปการเข้าเรียน');
    
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // ตั้งชื่อไฟล์
    const today = new Date().toISOString().split('T')[0];
    const filename = `attendance_summary_${today}.xlsx`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error('Error exporting summary:', error);
    res.status(500).json({ error: 'Failed to export summary data' });
  }
});

module.exports = router;
