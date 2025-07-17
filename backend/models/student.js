const { pool } = require('../db');

class Student {
  static async create(studentData) {
    const {
      firstname,
      lastname,
      student_code,
      class_group,
      year = new Date().getFullYear()
    } = studentData;

    // Generate student ID if not provided
    const studentId = `ST${Date.now()}`;

    // ตรวจสอบว่ามี student_code นี้อยู่แล้วหรือยัง
    const [existing] = await pool.execute('SELECT id FROM students WHERE student_code = ?', [student_code]);
    if (existing.length > 0) {
      // ถ้ามีอยู่แล้ว ไม่ต้อง insert ซ้ำ
      return null;
    }

    const query = `
      INSERT INTO students (id, firstname, lastname, student_code, class_group, year)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
      await pool.execute(query, [studentId, firstname, lastname, student_code, class_group, year]);
      return studentId;
    } catch (error) {
      throw new Error(`Failed to create student: ${error.message}`);
    }
  }

  static async getById(studentId) {
    const query = `
      SELECT * FROM students WHERE id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows[0];
    } catch (error) {
      throw new Error(`Failed to get student: ${error.message}`);
    }
  }

  static async getByCode(studentCode) {
    const query = `
      SELECT * FROM students WHERE student_code = ?
    `;

    try {
      const [rows] = await pool.execute(query, [studentCode]);
      return rows[0];
    } catch (error) {
      throw new Error(`Failed to get student by code: ${error.message}`);
    }
  }

  static async getAll() {
    const query = `
      SELECT * FROM students ORDER BY firstname, lastname
    `;

    try {
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get all students: ${error.message}`);
    }
  }

  static async getByClass(classGroup) {
    const query = `
      SELECT * FROM students WHERE class_group = ? ORDER BY firstname, lastname
    `;

    try {
      const [rows] = await pool.execute(query, [classGroup]);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get students by class: ${error.message}`);
    }
  }

  static async delete(studentId) {
    const query = `
      DELETE FROM students WHERE id = ?
    `;

    try {
      await pool.execute(query, [studentId]);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete student: ${error.message}`);
    }
  }

  static async bulkCreate(students) {
    const query = `
      INSERT INTO students (id, firstname, lastname, student_code, class_group, year)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      firstname = VALUES(firstname),
      lastname = VALUES(lastname),
      class_group = VALUES(class_group),
      year = VALUES(year),
      updated_at = CURRENT_TIMESTAMP
    `;

    try {
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      for (const student of students) {
        const studentId = student.id || `ST${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await connection.execute(query, [
          studentId,
          student.firstname,
          student.lastname,
          student.student_code,
          student.class_group,
          student.year || new Date().getFullYear()
        ]);
      }

      await connection.commit();
      connection.release();
      return true;
    } catch (error) {
      throw new Error(`Failed to bulk create students: ${error.message}`);
    }
  }
}

module.exports = Student; 