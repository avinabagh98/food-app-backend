const menuService = require('../services/menu.service');
const { success } = require('../utils/response');

/**
 * Handler to get all active categories.
 */
async function getCategories(req, res, next) {
  try {
    const categories = await menuService.getCategories();
    return success(res, categories, 'Categories fetched successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * Handler to get available menu items, optionally filtered by category.
 */
async function getItems(req, res, next) {
  try {
    const categoryId = req.query.category_id;
    const items = await menuService.getItems(categoryId);
    return success(res, items, 'Menu items fetched successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * Handler to get details of a specific menu item.
 */
async function getItem(req, res, next) {
  try {
    const { id } = req.params;
    const item = await menuService.getItemById(id);
    return success(res, item, 'Item details fetched successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategories,
  getItems,
  getItem,
};
