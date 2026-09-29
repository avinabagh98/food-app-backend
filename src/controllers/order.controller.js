const orderService = require('../services/order.service');
const { success, error } = require('../utils/response');

/**
 * Order Controller
 * Request handlers for checkout and order history.
 */
const orderController = {
  /**
   * Handles checkout request.
   */
  async checkout(req, res, next) {
    try {
      const { address_id, special_instructions } = req.body;

      if (!address_id) {
        return error(res, 'Address ID is required.', 400);
      }

      const userId = req.user.userId;
      const result = await orderService.checkout(userId, address_id, special_instructions);

      return success(res, result, 'Order placed successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Lists orders for the authenticated customer.
   */
  async listOrders(req, res, next) {
    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      const orders = await orderService.listOrders(userId, limit, offset);
      return success(res, { orders }, 'Order history retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Returns details of a specific order.
   */
  async getOrder(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const order = await orderService.getOrderDetail(userId, id);
      return success(res, order, 'Order details retrieved successfully');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = orderController;
