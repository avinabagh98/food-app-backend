const express = require('express');
const router = express.Router();
const RestaurantController = require('../controllers/restaurant.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

// Public: Get restaurant details
router.get('/', verifyToken, RestaurantController.getRestaurant);

// Admin: Update restaurant details
router.put('/admin', verifyToken, requireRole('admin'), RestaurantController.updateRestaurant);

module.exports = router;
