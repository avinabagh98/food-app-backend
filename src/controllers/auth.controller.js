const otpService = require('../services/otp.service');
const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');
const pool = require('../db/pool');

// Basic E.164 phone regex (e.g. +919876543210 or 10-15 digits)
const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;

/**
 * POST /api/auth/send-otp
 */
async function sendOtp(req, res, next) {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim())) {
      return error(res, 'Invalid phone number format. Please provide 10-15 digits with optional country code.', 400);
    }

    const otpCode = await otpService.sendOtp(phone.trim());

    return success(res, { otpCode: otpCode.code }, 'OTP sent successfully. Valid for 5 minutes.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/verify-otp
 */
async function verifyOtp(req, res, next) {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return error(res, 'Phone and OTP are required.', 400);
    }

    const cleanPhone = phone.trim();
    const cleanOtp = String(otp).trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return error(res, 'OTP must be a 6-digit number.', 400);
    }

    // 1. Verify OTP
    await otpService.verifyOtp(cleanPhone, cleanOtp);

    // 2. Fetch or create user
    const user = await authService.upsertUserByPhone(cleanPhone);

    // 3. Issue tokens
    const tokens = await authService.generateTokenPair(user);

    return success(res, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    }, 'Authentication successful.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return error(res, 'Refresh token is required.', 400);
    }

    const result = await authService.refreshAccessToken(refreshToken);

    return success(res, result, 'Access token refreshed successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.userId;

    await authService.logoutUser(userId, refreshToken);

    return success(res, null, 'Logged out successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Helper endpoint to inspect current user's profile and token validity
 */
async function getMe(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, phone, email, role, is_active, created_at
       FROM users WHERE id = ?`,
      [req.user.userId]
    );

    if (rows.length === 0) {
      return error(res, 'User not found.', 404);
    }

    return success(res, { user: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
  refresh,
  logout,
  getMe,
};
