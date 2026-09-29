const pool = require('../../db/pool');
const { AppError } = require('../../utils/errors');

const VALID_TRANSITIONS = {
  'PENDING': ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  'CONFIRMED': ['PREPARING', 'CANCELLED'],
  'PREPARING': ['READY_FOR_PICKUP', 'CANCELLED'],
  'READY_FOR_PICKUP': ['OUT_FOR_DELIVERY', 'CANCELLED'],
  'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
  'DELIVERED': [],
  'REJECTED': [],
  'CANCELLED': [],
};

async function assertTransition(currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(`Cannot transition order from ${currentStatus} to ${newStatus}`, 400);
  }
}

const adminOrderService = {
  async listOrders(filters = {}) {
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const values = [];

    if (filters.status) {
      sql += ' AND status = ?';
      values.push(filters.status);
    }

    if (filters.date) {
      sql += ' AND DATE(created_at) = ?';
      values.push(filters.date);
    }

    const [rows] = await pool.execute(sql, values);
    return rows;
  },

  async getOrderDetail(orderId) {
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      throw new AppError('Order not found', 404);
    }
    const order = orders[0];

    const [items] = await pool.execute(
      'SELECT menu_item_id, name_snapshot, quantity, unit_price, subtotal FROM order_items WHERE order_id = ?',
      [orderId]
    );

    const [user] = await pool.execute('SELECT id, name, phone, email FROM users WHERE id = ?', [order.user_id]);

    const [assignment] = await pool.execute(
      'SELECT * FROM rider_assignments WHERE order_id = ?',
      [orderId]
    );

    return {
      ...order,
      customer: user[0] || null,
      items,
      assignment: assignment[0] || null,
    };
  },

  async acceptOrder(orderId) {
    const [orders] = await pool.execute('SELECT status FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) throw new AppError('Order not found', 404);

    if (orders[0].status !== 'PENDING') {
      throw new AppError('Order is not in PENDING state', 400);
    }

    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', ['CONFIRMED', orderId]);
    return { message: 'Order confirmed' };
  },

  async rejectOrder(orderId, reason) {
    const [orders] = await pool.execute('SELECT status FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) throw new AppError('Order not found', 404);

    if (orders[0].status !== 'PENDING') {
      throw new AppError('Order is not in PENDING state', 400);
    }

    await pool.execute(
      'UPDATE orders SET status = ?, rejection_reason = ? WHERE id = ?',
      ['REJECTED', reason, orderId]
    );
    return { message: 'Order rejected' };
  },

  async updateStatus(orderId, newStatus) {
    const [orders] = await pool.execute('SELECT status FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) throw new AppError('Order not found', 404);

    await assertTransition(orders[0].status, newStatus);

    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [newStatus, orderId]);
    return { message: `Order status updated to ${newStatus}` };
  },

  async cancelOrder(orderId, reason) {
    const [orders] = await pool.execute('SELECT status FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) throw new AppError('Order not found', 404);

    // Can cancel any order that isn't terminal (REJECTED, DELIVERED)
    if (['REJECTED', 'DELIVERED'].includes(orders[0].status)) {
      throw new AppError(`Cannot cancel order in ${orders[0].status} state`, 400);
    }

    await pool.execute(
      'UPDATE orders SET status = ?, rejection_reason = ? WHERE id = ?',
      ['CANCELLED', reason, orderId]
    );
    return { message: 'Order cancelled' };
  },

  async assignRider(orderId, riderId, assignedBy) {
    // Verify rider exists and has rider role
    const [riders] = await pool.execute('SELECT id FROM users WHERE id = ? AND role = ?', [riderId, 'rider']);
    if (riders.length === 0) {
      throw new AppError('Invalid rider or user not assigned as rider', 400);
    }

    // Check if order already assigned
    const [assignments] = await pool.execute('SELECT id FROM rider_assignments WHERE order_id = ?', [orderId]);
    if (assignments.length > 0) {
      throw new AppError('Order already assigned to a rider', 400);
    }

    await pool.execute(
      'INSERT INTO rider_assignments (order_id, rider_id, assigned_by, assigned_at, status) VALUES (?, ?, ?, NOW(), ?)',
      [orderId, riderId, assignedBy, 'ASSIGNED']
    );

    return { message: 'Rider assigned successfully' };
  },
};

module.exports = adminOrderService;
