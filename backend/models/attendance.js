const { pool } = require('../db');

class Attendance {
  static async create(attendanceData) {
    const {
      qr_session_id,
      student_id,
      checkin_time,
      status,
      extra_score,
      notes
    } = attendanceData;

    const query = `
      INSERT INTO student_attendance 
      (qr_session_id, student_id, checkin_time, status, extra_score, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      checkin_time = VALUES(checkin_time),
      status = VALUES(status),
      extra_score = VALUES(extra_score),
      notes = VALUES(notes)
    `;

    try {
      const [result] = await pool.execute(query, [
        qr_session_id,
        student_id,
        checkin_time,
        status,
        extra_score || 0,
        notes
      ]);

      return result.insertId || result.updateId;
    } catch (error) {
      throw new Error(`Failed to create attendance: ${error.message}`);
    }
  }

  static async getBySession(sessionId) {
    const query = `
      SELECT 
        sa.*,
        s.firstname,
        s.lastname,
        s.student_code,
        s.class_group
      FROM student_attendance sa
      JOIN students s ON sa.student_id = s.id
      WHERE sa.qr_session_id = ?
      ORDER BY sa.checkin_time ASC
    `;

    try {
      const [rows] = await pool.execute(query, [sessionId]);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get attendance by session: ${error.message}`);
    }
  }

  static async getBulkBySessionIds(sessionIds, teacherId) {
    if (!sessionIds || sessionIds.length === 0) {
      return [];
    }

    // Create placeholders for the IN clause
    const placeholders = sessionIds.map(() => '?').join(',');
    
    const query = `
      SELECT 
        sa.*,
        s.firstname,
        s.lastname,
        s.student_code,
        s.class_group
      FROM student_attendance sa
      JOIN students s ON sa.student_id = s.id
      JOIN qr_sessions qs ON sa.qr_session_id = qs.id
      WHERE sa.qr_session_id IN (${placeholders})
        AND qs.teacher_id = ?
      ORDER BY sa.qr_session_id, sa.checkin_time ASC
    `;

    try {
      const [rows] = await pool.execute(query, [...sessionIds, teacherId]);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get bulk attendance by session IDs: ${error.message}`);
    }
  }

  static async updateScore(attendanceId, extraScore, notes) {
    const query = `
      UPDATE student_attendance 
      SET extra_score = ?, notes = ?
      WHERE id = ?
    `;

    try {
      await pool.execute(query, [extraScore, notes, attendanceId]);
      return true;
    } catch (error) {
      throw new Error(`Failed to update attendance score: ${error.message}`);
    }
  }

  static async getById(attendanceId) {
    const query = `
      SELECT 
        sa.*,
        s.firstname,
        s.lastname,
        s.student_code,
        s.class_group
      FROM student_attendance sa
      JOIN students s ON sa.student_id = s.id
      WHERE sa.id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [attendanceId]);
      return rows[0];
    } catch (error) {
      throw new Error(`Failed to get attendance by id: ${error.message}`);
    }
  }

  static async getStatsByTeacher(teacherId) {
    const query = `
      SELECT 
        COUNT(DISTINCT qs.id) as total_sessions,
        COUNT(sa.id) as total_attendance,
        COUNT(CASE WHEN sa.status = 'มา' THEN 1 END) as present_count,
        COUNT(CASE WHEN sa.status = 'สาย' THEN 1 END) as late_count,
        COUNT(CASE WHEN sa.status = 'ขาด' THEN 1 END) as absent_count
      FROM qr_sessions qs
      LEFT JOIN student_attendance sa ON qs.id = sa.qr_session_id
      WHERE qs.teacher_id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [teacherId]);
      return rows[0];
    } catch (error) {
      throw new Error(`Failed to get attendance stats: ${error.message}`);
    }
  }

  static async getTodayStats(teacherId) {
    const query = `
      SELECT 
        COUNT(CASE WHEN sa.status = 'มา' THEN 1 END) as present_today,
        COUNT(CASE WHEN sa.status = 'สาย' THEN 1 END) as late_today,
        COUNT(CASE WHEN sa.status = 'ขาด' THEN 1 END) as absent_today
      FROM qr_sessions qs
      LEFT JOIN student_attendance sa ON qs.id = sa.qr_session_id
      WHERE qs.teacher_id = ? 
      AND DATE(sa.checkin_time) = CURDATE()
    `;

    try {
      const [rows] = await pool.execute(query, [teacherId]);
      return rows[0];
    } catch (error) {
      throw new Error(`Failed to get today's stats: ${error.message}`);
    }
  }

  static async checkExistingAttendance(sessionId, studentId) {
    const query = `
      SELECT * FROM student_attendance 
      WHERE qr_session_id = ? AND student_id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [sessionId, studentId]);
      return rows[0];
    } catch (error) {
      throw new Error(`Failed to check existing attendance: ${error.message}`);
    }
  }

  static async checkExistingAttendanceByFullInfo(sessionId, studentId, firstname, lastname) {
    const query = `
      SELECT sa.*
      FROM student_attendance sa
      JOIN students s ON sa.student_id = s.id
      WHERE sa.qr_session_id = ? AND sa.student_id = ? AND s.firstname = ? AND s.lastname = ?
    `;
    try {
      const [rows] = await pool.execute(query, [sessionId, studentId, firstname, lastname]);
      return rows[0];
    } catch (error) {
      throw new Error(`Failed to check existing attendance by full info: ${error.message}`);
    }
  }

  // ฟังก์ชันสำหรับดึงข้อมูลสรุปการเข้าเรียนแต่ละคาบเรียน
  static async getSessionSummary(sessionId) {
    const query = `
      SELECT 
        qs.id as session_id,
        qs.subject_name,
        qs.class_name,
        qs.class_group,
        qs.start_time,
        qs.end_time,
        qs.created_at,
        COUNT(sa.id) as total_students,
        COUNT(CASE WHEN sa.status = 'มา' THEN 1 END) as present_count,
        COUNT(CASE WHEN sa.status = 'สาย' THEN 1 END) as late_count,
        COUNT(CASE WHEN sa.status = 'ขาด' THEN 1 END) as absent_count,
        ROUND(
          (COUNT(CASE WHEN sa.status = 'มา' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(sa.id), 0)), 2
        ) as attendance_rate
      FROM qr_sessions qs
      LEFT JOIN student_attendance sa ON qs.id = sa.qr_session_id
      WHERE qs.id = ?
      GROUP BY qs.id, qs.subject_name, qs.class_name, qs.class_group, 
               qs.start_time, qs.end_time, qs.created_at
    `;

    try {
      const [rows] = await pool.execute(query, [sessionId]);
      return rows[0];
    } catch (error) {
      throw new Error(`Failed to get session summary: ${error.message}`);
    }
  }

  // ฟังก์ชันสำหรับดึงข้อมูลสรุปการเข้าเรียนทั้งหมดของครู
  static async getAllSessionsSummary(teacherId, startDate = null, endDate = null) {
    let query = `
      SELECT 
        qs.id as session_id,
        qs.subject_name,
        qs.class_name,
        qs.class_group,
        qs.start_time,
        qs.end_time,
        qs.created_at,
        COUNT(sa.id) as total_students,
        COUNT(CASE WHEN sa.status = 'มา' THEN 1 END) as present_count,
        COUNT(CASE WHEN sa.status = 'สาย' THEN 1 END) as late_count,
        COUNT(CASE WHEN sa.status = 'ขาด' THEN 1 END) as absent_count,
        ROUND(
          (COUNT(CASE WHEN sa.status = 'มา' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(sa.id), 0)), 2
        ) as attendance_rate
      FROM qr_sessions qs
      LEFT JOIN student_attendance sa ON qs.id = sa.qr_session_id
      WHERE qs.teacher_id = ?
    `;
    
    const params = [teacherId];
    
    if (startDate) {
      query += ` AND DATE(qs.start_time) >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND DATE(qs.start_time) <= ?`;
      params.push(endDate);
    }
    
    query += `
      GROUP BY qs.id, qs.subject_name, qs.class_name, qs.class_group, 
               qs.start_time, qs.end_time, qs.created_at
      ORDER BY qs.start_time DESC
    `;

    try {
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get all sessions summary: ${error.message}`);
    }
  }

  // ฟังก์ชันสำหรับดึงข้อมูลสรุปการเข้าเรียนรายวิชา
  static async getSubjectSummary(teacherId, subjectName = null) {
    let query = `
      SELECT 
        qs.subject_name,
        COUNT(DISTINCT qs.id) as total_sessions,
        COUNT(sa.id) as total_attendance,
        COUNT(CASE WHEN sa.status = 'มา' THEN 1 END) as present_count,
        COUNT(CASE WHEN sa.status = 'สาย' THEN 1 END) as late_count,
        COUNT(CASE WHEN sa.status = 'ขาด' THEN 1 END) as absent_count,
        ROUND(
          (COUNT(CASE WHEN sa.status = 'มา' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(sa.id), 0)), 2
        ) as overall_attendance_rate
      FROM qr_sessions qs
      LEFT JOIN student_attendance sa ON qs.id = sa.qr_session_id
      WHERE qs.teacher_id = ?
    `;
    
    const params = [teacherId];
    
    if (subjectName) {
      query += ` AND qs.subject_name = ?`;
      params.push(subjectName);
    }
    
    query += `
      GROUP BY qs.subject_name
      ORDER BY qs.subject_name
    `;

    try {
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get subject summary: ${error.message}`);
    }
  }
}

module.exports = Attendance;
