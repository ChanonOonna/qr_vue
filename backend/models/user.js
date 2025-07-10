const { pool } = require('../db');

class User {
  static async createOrUpdate(userData) {
    const {
      id,
      name,
      email,
      auth0_id
    } = userData;

    const query = `
      INSERT INTO teachers (id, name, email, auth0_id)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      email = VALUES(email),
      updated_at = CURRENT_TIMESTAMP
    `;

    try {
      await pool.execute(query, [id, name, email, auth0_id]);
      return id;
    } catch (error) {
      throw new Error(`Failed to create/update user: ${error.message}`);
    }
  }

  static async getById(userId) {
    const query = `
      SELECT * FROM teachers WHERE id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [userId]);
      return rows[0];
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  static async getByAuth0Id(auth0Id) {
    const query = `
      SELECT * FROM teachers WHERE auth0_id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [auth0Id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Failed to get user by Auth0 ID: ${error.message}`);
    }
  }

  static async getByEmail(email) {
    const query = `
      SELECT * FROM teachers WHERE email = ?
    `;

    try {
      const [rows] = await pool.execute(query, [email]);
      return rows[0];
    } catch (error) {
      throw new Error(`Failed to get user by email: ${error.message}`);
    }
  }
}

module.exports = User;
