const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

// All cart routes require authentication and the 'customer' role
router.use(verifyToken, requireRole('customer'));

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:cartItemId', cartController.updateItem);
router.delete('/items/:cartItemId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
