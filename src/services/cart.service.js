const pool = require('../db/pool');
const { AppError } = require('../utils/errors');

/**
 * Helper to get existing cart ID or create a new one for the user.
 * Accepts an optional connection for transactions.
 */
async function getOrCreateCart(userId, conn = pool) {
  const [rows] = await conn.execute('SELECT id FROM carts WHERE user_id = ?', [userId]);

  if (rows.length > 0) {
    return rows[0].id;
  }

  const [result] = await conn.execute('INSERT INTO carts (user_id) VALUES (?)', [userId]);
  return result.insertId;
}

/**
 * Fetches the cart and its items for a user.
 */
async function getCart(userId) {
  const cartId = await getOrCreateCart(userId);

  const [items] = await pool.execute(
    `SELECT ci.id, ci.menu_item_id as menuItemId, ci.quantity, ci.price_at_time as priceAtTime, mi.name, mi.price, mi.image_path as image
     FROM cart_items ci
     JOIN menu_items mi ON ci.menu_item_id = mi.id
     WHERE ci.cart_id = ?`,
    [cartId]
  );

  // Calculate summary
  const subtotal = items.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0);

  // Using constants for charges as they aren't in DB yet
  const taxPercentage = parseFloat(process.env.TAX_PERCENTAGE) || 0;
  const deliveryFee = parseFloat(process.env.DELIVERY_FEE) || 0;
  const taxAmount = subtotal * (taxPercentage / 100);
  const totalAmount = subtotal + taxAmount + deliveryFee;

  return {
    cartId,
    items,
    summary: {
      subtotal: subtotal.toFixed(2),
      deliveryCharge: deliveryFee.toFixed(2),
      govtTax: taxPercentage.toFixed(2),
      total: totalAmount.toFixed(2)
    }
  };
}

/**
 * Adds a menu item to the user's cart.
 * Uses a transaction to ensure consistency across menu check, cart creation, and item addition.
 */
async function addItem(userId, menuItemId, quantity = 1) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Verify menu item exists and is available
    const [miRows] = await conn.execute(
      'SELECT price FROM menu_items WHERE id = ? AND is_available = 1',
      [menuItemId]
    );

    if (miRows.length === 0) {
      throw new AppError('Item is not available or does not exist', 400);
    }

    const priceAtTime = miRows[0].price;
    const cartId = await getOrCreateCart(userId, conn);

    // 2. Insert or update quantity
    await conn.execute(
      `INSERT INTO cart_items (cart_id, menu_item_id, quantity, price_at_time)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + ?, price_at_time = VALUES(price_at_time)`,
      [cartId, menuItemId, quantity, priceAtTime, quantity]
    );

    await conn.commit();

    // Fetch updated state after commit
    const [itemRows] = await pool.execute(
      'SELECT * FROM cart_items WHERE cart_id = ? AND menu_item_id = ?',
      [cartId, menuItemId]
    );

    return itemRows[0];
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Updates the quantity of a specific item in the cart.
 */
async function updateItemQuantity(userId, cartItemId, quantity) {
  if (quantity <= 0) {
    return await removeItem(userId, cartItemId);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const cartId = await getOrCreateCart(userId, conn);
    const [rows] = await conn.execute(
      'SELECT id FROM cart_items WHERE id = ? AND cart_id = ?',
      [cartItemId, cartId]
    );

    if (rows.length === 0) {
      throw new AppError('Item not found in your cart', 404);
    }

    await conn.execute(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, cartItemId]
    );

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Removes a specific item from the cart.
 */
async function removeItem(userId, cartItemId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const cartId = await getOrCreateCart(userId, conn);

    const [rows] = await conn.execute(
      'SELECT id FROM cart_items WHERE id = ? AND cart_id = ?',
      [cartItemId, cartId]
    );

    if (rows.length === 0) {
      throw new AppError('Item not found in your cart', 404);
    }

    await conn.execute('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Clears all items from the user's cart.
 */
async function clearCart(userId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const cartId = await getOrCreateCart(userId, conn);
    await conn.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart
};
