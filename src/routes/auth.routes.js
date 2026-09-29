const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Public routes
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/refresh', authController.refresh);

// Protected routes (require valid access token)
router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
