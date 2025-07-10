const { pool } = require('../db');

class StudentSubmission {
  static async create(submissionData) {
    const {
      student_id, teacher_id, qr_session_id, firstname, lastname,
      ip_address, user_agent
    } = submissionData;

    const query = `
      INSERT INTO student_submissions
      (student_id, teacher_id, qr_session_id, submission_time, firstname, lastname, data_type, ip_address, user_agent)
      VALUES (?, ?, ?, NOW(), ?, ?, 'attendance', ?, ?)
    `;
    await pool.execute(query, [
      student_id, teacher_id, qr_session_id, firstname, lastname,
      ip_address, user_agent
    ]);
  }
}

module.exports = StudentSubmission; 