const express = require('express');
const router = express.Router();
const orderRoutes = require('./order.routes');

router.use('/orders', orderRoutes);

module.exports = router;
