const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

// All order routes require authentication and 'customer' role
router.use(verifyToken);
router.use(requireRole('customer'));

router.post('/checkout', orderController.checkout);
router.get('/', orderController.listOrders);
router.get('/:id', orderController.getOrder);

module.exports = router;
