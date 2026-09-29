const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const menuRoutes = require('./menu.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const userRoutes = require('./user.routes');
const restaurantRoutes = require('./restaurant.routes');
const adminRoutes = require('./admin');

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/user', userRoutes);
router.use('/restaurant', restaurantRoutes);
router.use('/admin', adminRoutes);

// Rider routes would be mounted here too once implemented
// router.use('/rider', require('./rider'));

module.exports = router;
