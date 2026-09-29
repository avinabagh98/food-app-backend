const adminOrderService = require("../../services/admin/order.service")
const { success, error } = require('../../utils/response');

async function listOrders(req, res, next) {
  try {
    const orders = await adminOrderService.listOrders(req.query);
    return success(res, orders, 'Orders retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await adminOrderService.getOrderDetail(id);
    return success(res, order, 'Order details retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function acceptOrder(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminOrderService.acceptOrder(id);
    return success(res, result, 'Order confirmed');
  } catch (err) {
    next(err);
  }
}

async function rejectOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) {
      return error(res, 'Rejection reason is required', 400);
    }
    const result = await adminOrderService.rejectOrder(id, reason);
    return success(res, result, 'Order rejected');
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return error(res, 'New status is required', 400);
    }
    const result = await adminOrderService.updateStatus(id, status);
    return success(res, result, 'Order status updated');
  } catch (err) {
    next(err);
  }
}

async function assignRider(req, res, next) {
  try {
    const { id } = req.params;
    const { riderId } = req.body;
    if (!riderId) {
      return error(res, 'Rider ID is required', 400);
    }
    const result = await adminOrderService.assignRider(id, riderId, req.user.userId);
    return success(res, result, 'Rider assigned successfully');
  } catch (err) {
    next(err);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) {
      return error(res, 'Cancellation reason is required', 400);
    }
    const result = await adminOrderService.cancelOrder(id, reason);
    return success(res, result, 'Order cancelled');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listOrders,
  getOrder,
  acceptOrder,
  rejectOrder,
  updateStatus,
  assignRider,
  cancelOrder,
};
