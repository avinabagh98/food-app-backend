const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// All routes in this file require authentication
router.use(verifyToken);

router.patch('/me', UserController.updateMe);

router.get('/addresses', UserController.getAddresses);
router.post('/addresses', UserController.addAddress);
router.put('/addresses/:id', UserController.updateAddress);
router.delete('/addresses/:id', UserController.deleteAddress);

module.exports = router;
