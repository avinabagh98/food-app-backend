const express = require('express');
const router = express.Router();
const adminOrderController = require('../../controllers/admin/order.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

router.use(verifyToken);
router.use(requireRole('admin', 'manager'));

router.get('/', adminOrderController.listOrders);
router.get('/:id', adminOrderController.getOrder);
router.patch('/:id/accept', adminOrderController.acceptOrder);
router.patch('/:id/reject', adminOrderController.rejectOrder);
router.patch('/:id/status', adminOrderController.updateStatus);
router.post('/:id/assign-rider', adminOrderController.assignRider);
router.patch('/:id/cancel', adminOrderController.cancelOrder);

module.exports = router;
