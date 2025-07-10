const { pool } = require('../db');

class QRCodeSession {
  static async create(sessionData) {
    const {
      teacher_id,
      subject_code,
      subject_name,
      teacher_code,
      class_group,
      year,
      semester,
      start_time,
      late_minute,
      expire_time,
      qr_token,
      qr_code_image
    } = sessionData;

    const query = `
      INSERT INTO qr_sessions 
      (teacher_id, subject_code, subject_name, teacher_code, class_group, year, semester, start_time, late_minute, expire_time, qr_token, qr_code_image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.execute(query, [
        teacher_id,
        subject_code,
        subject_name,
        teacher_code,
        class_group,
        year,
        semester,
        start_time,
        late_minute,
        expire_time,
        qr_token,
        qr_code_image
      ]);

      return result.insertId;
    } catch (error) {
      throw new Error(`Failed to create QR session: ${error.message}`);
    }
  }

  static async getByTeacher(teacherId) {
    const query = `
      SELECT 
        qs.*,
        COUNT(sa.id) as total_attendance,
        COUNT(CASE WHEN sa.status = 'มา' THEN 1 END) as present_count,
        COUNT(CASE WHEN sa.status = 'สาย' THEN 1 END) as late_count,
        COUNT(CASE WHEN sa.status = 'ขาด' THEN 1 END) as absent_count
      FROM qr_sessions qs
      LEFT JOIN student_attendance sa ON qs.id = sa.qr_session_id
      WHERE qs.teacher_id = ?
      GROUP BY qs.id
      ORDER BY qs.created_at DESC
    `;

    try {
      const [rows] = await pool.execute(query, [teacherId]);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get QR sessions: ${error.message}`);
    }
  }

  static async getById(sessionId) {
    const query = `
      SELECT * FROM qr_sessions WHERE id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [sessionId]);
      return rows[0];
    } catch (error) {
      throw new Error(`Failed to get QR session: ${error.message}`);
    }
  }

  static async getByToken(token) {
    const query = `
      SELECT qs.*, t.email as teacher_email
      FROM qr_sessions qs
      JOIN teachers t ON t.id = qs.teacher_id
      WHERE qs.qr_token = ? AND qs.is_active = TRUE
    `;

    try {
      const [rows] = await pool.execute(query, [token]);
      return rows[0];
    } catch (error) {
      throw new Error(`Failed to get QR session by token: ${error.message}`);
    }
  }

  static async deactivate(sessionId) {
    const query = `
      UPDATE qr_sessions SET is_active = FALSE WHERE id = ?
    `;

    try {
      await pool.execute(query, [sessionId]);
      return true;
    } catch (error) {
      throw new Error(`Failed to deactivate QR session: ${error.message}`);
    }
  }

  static async delete(sessionId) {
    const query = `
      DELETE FROM qr_sessions WHERE id = ?
    `;

    try {
      await pool.execute(query, [sessionId]);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete QR session: ${error.message}`);
    }
  }
}

module.exports = QRCodeSession;
