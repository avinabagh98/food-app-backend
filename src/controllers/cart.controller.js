const cartService = require('../services/cart.service');
const { success } = require('../utils/response');
const { AppError } = require('../utils/errors');

exports.getCart = async (req, res, next) => {
  try {
    const cartData = await cartService.getCart(req.user.userId);
    return success(res, cartData);
  } catch (err) {
    next(err);
  }
};

exports.addItem = async (req, res, next) => {
  try {
    const { menuItemId, quantity } = req.body;

    // Manual Validation
    if (!menuItemId) {
      return next(new AppError('menuItemId is required', 400));
    }
    if (quantity !== undefined && (typeof quantity !== 'number' || quantity <= 0)) {
      return next(new AppError('Quantity must be a positive number', 400));
    }

    const item = await cartService.addItem(req.user.userId, menuItemId, quantity || 1);
    return success(res, item, 'Item added to cart');
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (!cartItemId) {
      return next(new AppError('cartItemId is required', 400));
    }
    if (quantity === undefined || typeof quantity !== 'number') {
      return next(new AppError('Quantity must be a number', 400));
    }

    await cartService.updateItemQuantity(req.user.userId, cartItemId, quantity);
    return success(res, null, 'Quantity updated');
  } catch (err) {
    next(err);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    const { cartItemId } = req.params;
    if (!cartItemId) {
      return next(new AppError('cartItemId is required', 400));
    }

    await cartService.removeItem(req.user.userId, cartItemId);
    return success(res, null, 'Item removed from cart');
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    await cartService.clearCart(req.user.userId);
    return success(res, null, 'Cart cleared');
  } catch (err) {
    next(err);
  }
};
