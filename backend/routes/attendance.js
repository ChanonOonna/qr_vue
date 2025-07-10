const express = require('express');
const Attendance = require('../models/attendance');
const QRCodeSession = require('../models/qrcodeSession');
const { requireTeacher } = require('../auth');

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
    res.json({ message: 'Attendance updated successfully' });
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

// Student check-in (for QR scanning)
router.post('/checkin', async (req, res) => {
  try {
    const { qr_token, student_id, firstname, lastname } = req.body;
    
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
    
    // Check if student already checked in
    const existingAttendance = await Attendance.checkExistingAttendance(session.id, student_id);
    if (existingAttendance) {
      return res.status(400).json({ error: 'มีการเช็คชื่อในรอบนี้แล้ว' });
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
    } else {
      // Update existing student info using create with ON DUPLICATE KEY UPDATE
      await Student.create({
        student_code: student_id,
        firstname,
        lastname,
        class_group: session.class_group
      });
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

    // เพิ่มบันทึกลง student_submissions
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
    
    res.json({
      session: {
        subject_code: session.subject_code,
        subject_name: session.subject_name,
        class_group: session.class_group,
        start_time: session.start_time
      },
      attendance: exportData
    });
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

module.exports = router;
