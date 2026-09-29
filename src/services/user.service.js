const pool = require('../db/pool');
const { AppError } = require('../utils/errors');

class UserService {
  /**
   * Update user profile details
   */
  async updateProfile(userId, updateData) {
    const { name, email } = updateData;

    // Only update provided fields
    const fields = [];
    const values = [];

    if (name) {
      fields.push('name = ?');
      values.push(name);
    }
    if (email) {
      fields.push('email = ?');
      values.push(email);
    }

    if (fields.length === 0) {
      throw new AppError('No fields provided for update', 400);
    }

    values.push(userId);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await pool.execute(sql, values);

    if (result.affectedRows === 0) {
      throw new AppError('User not found', 404);
    }

    // Return updated user
    const [rows] = await pool.execute('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
    return rows[0];
  }

  /**
   * Get all addresses for a user
   */
  async getUserAddresses(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return rows;
  }

  /**
   * Add a new address for a user
   */
  async addAddress(userId, addressData) {
    const { label, address_details, latitude, longitude, is_default = 0 } = addressData;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      if (is_default) {
        await conn.execute(
          'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
          [userId]
        );
      }

      const sql = 'INSERT INTO user_addresses (user_id, label, address_details, latitude, longitude, is_default) VALUES (?, ?, ?, ?, ?, ?)';
      const [result] = await conn.execute(sql, [userId, label, address_details, latitude, longitude, is_default]);

      await conn.commit();

      const [rows] = await conn.execute('SELECT * FROM user_addresses WHERE id = ?', [result.insertId]);
      return rows[0];
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(userId, addressId, updateData) {
    const { label, address_details, is_default } = updateData;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Verify ownership
      const [rows] = await conn.execute(
        'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
        [addressId, userId]
      );

      if (rows.length === 0) {
        throw new AppError('Address not found or not authorized', 404);
      }

      if (is_default) {
        await conn.execute(
          'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
          [userId]
        );
      }

      const fields = [];
      const values = [];
      if (label) { fields.push('label = ?'); values.push(label); }
      if (address_details) { fields.push('address_details = ?'); values.push(address_details); }
      if (latitude !== undefined) { fields.push('latitude = ?'); values.push(latitude); }
      if (longitude !== undefined) { fields.push('longitude = ?'); values.push(longitude); }
      if (is_default !== undefined) { fields.push('is_default = ?'); values.push(is_default); }

      if (fields.length === 0) {
        throw new AppError('No fields provided for update', 400);
      }

      values.push(addressId);
      const sql = `UPDATE user_addresses SET ${fields.join(', ')} WHERE id = ?`;
      await conn.execute(sql, values);

      await conn.commit();

      const [updated] = await conn.execute('SELECT * FROM user_addresses WHERE id = ?', [addressId]);
      return updated[0];
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(userId, addressId) {
    // Verify ownership first
    const [rows] = await pool.execute(
      'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );

    if (rows.length === 0) {
      throw new AppError('Address not found or not authorized', 404);
    }

    await pool.execute('DELETE FROM user_addresses WHERE id = ?', [addressId]);
    return true;
  }
}

module.exports = new UserService();
