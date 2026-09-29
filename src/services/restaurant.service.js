const pool = require('../db/pool');
const { AppError } = require('../utils/errors');

class RestaurantService {
  async getRestaurantDetails() {
    const [rows] = await pool.execute('SELECT * FROM restaurant_details LIMIT 1');
    if (rows.length === 0) {
      throw new AppError('Restaurant details not configured', 404);
    }
    return rows[0];
  }

  async updateRestaurantDetails(updateData) {
    const { name, phone, email, address_details, latitude, longitude, delivery_radius_km } = updateData;

    const fields = [];
    const values = [];

    if (name) { fields.push('name = ?'); values.push(name); }
    if (phone) { fields.push('phone = ?'); values.push(phone); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (address_details) { fields.push('address_details = ?'); values.push(address_details); }
    if (latitude !== undefined) { fields.push('latitude = ?'); values.push(latitude); }
    if (longitude !== undefined) { fields.push('longitude = ?'); values.push(longitude); }
    if (delivery_radius_km !== undefined) { fields.push('delivery_radius_km = ?'); values.push(delivery_radius_km); }

    if (fields.length === 0) {
      throw new AppError('No fields provided for update', 400);
    }

    const sql = `UPDATE restaurant_details SET ${fields.join(', ')} WHERE id = 1`;
    const [result] = await pool.execute(sql, values);

    if (result.affectedRows === 0) {
      throw new AppError('Restaurant configuration not found', 404);
    }

    const [rows] = await pool.execute('SELECT * FROM restaurant_details WHERE id = 1');
    return rows[0];
  }
}

module.exports = new RestaurantService();
