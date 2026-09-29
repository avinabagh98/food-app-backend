const pool = require('../db/pool');
const { AppError } = require('../utils/errors');

/**
 * Fetches all active menu categories sorted by sort_order.
 * @returns {Promise<Array>} List of categories.
 */
async function getCategories() {
  const query = `
    SELECT id, name, description, sort_order
    FROM categories
    WHERE is_active = 1
    ORDER BY sort_order ASC
  `;
  const [rows] = await pool.execute(query);
  return rows;
}

/**
 * Fetches available menu items.
 * @param {string|number|null} categoryId - Optional category ID to filter by.
 * @returns {Promise<Array>} List of menu items.
 */
async function getItems(categoryId = null) {
  let query = `
    SELECT id, name, description, price, image_path, is_veg
    FROM menu_items
    WHERE is_available = 1
  `;
  const params = [];

  if (categoryId) {
    query += ' AND category_id = ?';
    params.push(categoryId);
  }

  const [rows] = await pool.execute(query, params);
  return rows;
}

/**
 * Fetches details of a single menu item by ID.
 * @param {string} id - UUID of the menu item.
 * @returns {Promise<Object>} The menu item.
 * @throws {AppError} If item not found or unavailable.
 */
async function getItemById(id) {
  const query = `
    SELECT *
    FROM menu_items
    WHERE id = ? AND is_available = 1
  `;
  const [rows] = await pool.execute(query, [id]);

  if (rows.length === 0) {
    throw new AppError('Item not found or unavailable', 404);
  }

  return rows[0];
}

module.exports = {
  getCategories,
  getItems,
  getItemById,
};
