const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../utils/errors');
const RestaurantService = require('./restaurant.service');

/**
 * Order Service
 * Handles business logic for order checkout and history.
 */
const orderService = {
  /**
   * Calculates distance between two points using Haversine formula.
   * Returns distance in kilometers.
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Converts a customer's cart into an order.
   * Executes as an atomic transaction.
   */
  async checkout(userId, addressId, specialInstructions = null) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Validate delivery address and distance
      const [addrRows] = await conn.execute(
        'SELECT address_details, latitude, longitude FROM user_addresses WHERE id = ? AND user_id = ?',
        [addressId, userId]
      );

      if (addrRows.length === 0) {
        throw new AppError('Selected address not found.', 404);
      }
      const userAddress = addrRows[0];

      // Fetch restaurant location and delivery radius
      const restaurant = await RestaurantService.getRestaurantDetails();
      const distance = this.calculateDistance(
        userAddress.latitude,
        userAddress.longitude,
        restaurant.latitude,
        restaurant.longitude
      );

      if (restaurant.delivery_radius_km && distance > restaurant.delivery_radius_km) {
        throw new AppError('Out of delivery zone', 400);
      }

      // 2. Get the user's cart
      const [carts] = await conn.execute(
        'SELECT id FROM carts WHERE user_id = ?',
        [userId]
      );

      if (carts.length === 0) {
        throw new AppError('Cart not found. Please add items to your cart first.', 400);
      }

      const cartId = carts[0].id;

      // 3. Fetch cart items joined with menu items for validation and snapshotting
      const [cartItems] = await conn.execute(
        `SELECT ci.quantity, mi.id as menu_item_id, mi.name, mi.price, mi.is_available, mi.stock_quantity
         FROM cart_items ci
         JOIN menu_items mi ON ci.menu_item_id = mi.id
         WHERE ci.cart_id = ?`,
        [cartId]
      );

      if (cartItems.length === 0) {
        throw new AppError('Your cart is empty.', 400);
      }

      // 4. Validation & Total Calculation
      let subtotal = 0;
      const orderItemsToCreate = [];

      for (const item of cartItems) {
        if (!item.is_available) {
          throw new AppError(`Item ${item.name} is currently unavailable.`, 400);
        }

        if (item.stock_quantity !== null && item.stock_quantity < item.quantity) {
          throw new AppError(`Insufficient stock for ${item.name}.`, 400);
        }

        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;

        orderItemsToCreate.push({
          menu_item_id: item.menu_item_id,
          name_snapshot: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: itemSubtotal,
        });
      }

      // 5. Calculate Totals using environment variables
      const taxPercentage = parseFloat(process.env.TAX_PERCENTAGE) || 0;
      const deliveryFee = parseFloat(process.env.DELIVERY_FEE) || 0;
      const taxAmount = subtotal * (taxPercentage / 100);
      const totalAmount = subtotal + taxAmount + deliveryFee;

      // 6. Create Order
      const orderId = uuidv4();
      await conn.execute(
        `INSERT INTO orders (id, user_id, status, delivery_address, subtotal, tax_amount, delivery_fee, total_amount, special_instructions)
         VALUES (?, ?, 'PENDING', ?, ?, ?, ?, ?, ?)`,
        [orderId, userId, userAddress.address_details, subtotal, taxAmount, deliveryFee, totalAmount, specialInstructions]
      );

      // 7. Create Order Items & Decrement Stock
      for (const item of orderItemsToCreate) {
        // Insert into order_items
        await conn.execute(
          `INSERT INTO order_items (order_id, menu_item_id, name_snapshot, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.menu_item_id, item.name_snapshot, item.quantity, item.unit_price, item.subtotal]
        );

        // Decrement stock if it's limited
        const [updateResult] = await conn.execute(
          `UPDATE menu_items SET stock_quantity = stock_quantity - ?
           WHERE id = ? AND stock_quantity >= ?`,
          [item.quantity, item.menu_item_id, item.quantity]
        );

        if (updateResult.affectedRows === 0) {
          throw new AppError(`Stock changed for ${item.name_snapshot} during checkout.`, 400);
        }
      }

      // 8. Clear Cart
      await conn.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

      await conn.commit();

      return {
        orderId,
        totalAmount,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Lists orders for a specific user.
   */
  async listOrders(userId, limit = 10, offset = 0) {
    const [orders] = await pool.execute(
      'SELECT id, status, total_amount, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, String(limit), String(offset)]
    );
    return orders;
  },

  /**
   * Returns full details of a specific order including its items.
   */
  async getOrderDetail(userId, orderId) {
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      throw new AppError('Order not found.', 404);
    }

    const order = orders[0];

    const [items] = await pool.execute(
      'SELECT menu_item_id, name_snapshot, quantity, unit_price, subtotal FROM order_items WHERE order_id = ?',
      [orderId, userId]
    );

    return {
      ...order,
      items,
    };
  },
};

module.exports = orderService;
