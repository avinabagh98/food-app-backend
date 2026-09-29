const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const hashToken = require('../utils/hashToken');
const { AppError } = require('../utils/errors');

/**
 * Find existing user by phone or create a new customer record
 */
async function upsertUserByPhone(phone) {
  const [existing] = await pool.execute(
    `SELECT id, name, phone, email, role, is_active
     FROM users WHERE phone = ?`,
    [phone]
  );

  if (existing.length > 0) {
    const user = existing[0];
    if (user.is_active === 0) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }
    // Update updated_at timestamp
    await pool.execute(`UPDATE users SET updated_at = NOW() WHERE id = ?`, [user.id]);
    return user;
  }

  // Self-registration: default role is 'customer'
  const newUserId = uuidv4();
  const defaultName = `User ${phone.slice(-4)}`;

  await pool.execute(
    `INSERT INTO users (id, name, phone, role, is_active)
     VALUES (?, ?, ?, 'customer', 1)`,
    [newUserId, defaultName, phone]
  );

  return {
    id: newUserId,
    name: defaultName,
    phone,
    email: null,
    role: 'customer',
    is_active: 1,
  };
}

/**
 * Issue new access + refresh token pair and persist hashed refresh token in MySQL
 */
async function generateTokenPair(user) {
  const accessPayload = {
    userId: user.id,
    role: user.role,
    phone: user.phone,
  };

  const accessToken = signAccessToken(accessPayload);
  const refreshToken = signRefreshToken({ userId: user.id });

  // Store hashed refresh token in database (valid for 7 days)
  const hashedToken = hashToken(refreshToken);
  await pool.execute(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
    [user.id, hashedToken]
  );

  return { accessToken, refreshToken };
}

/**
 * Verify refresh token, ensure DB record exists, check user status, and return fresh access token
 */
async function refreshAccessToken(rawRefreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const hashedToken = hashToken(rawRefreshToken);

  const [rows] = await pool.execute(
    `SELECT rt.id, rt.user_id, rt.expires_at, u.name, u.phone, u.role, u.is_active
     FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.token_hash = ?`,
    [hashedToken]
  );

  if (rows.length === 0) {
    throw new AppError('Refresh token not found or revoked.', 401);
  }

  const tokenRecord = rows[0];

  if (new Date(tokenRecord.expires_at) < new Date()) {
    // Delete expired record
    await pool.execute(`DELETE FROM refresh_tokens WHERE id = ?`, [tokenRecord.id]);
    throw new AppError('Refresh token has expired.', 401);
  }

  if (tokenRecord.is_active === 0) {
    throw new AppError('User account is deactivated.', 403);
  }

  const newAccessToken = signAccessToken({
    userId: tokenRecord.user_id,
    role: tokenRecord.role,
    phone: tokenRecord.phone,
  });

  return { accessToken: newAccessToken };
}

/**
 * Revoke refresh token on logout
 */
async function logoutUser(userId, rawRefreshToken) {
  if (!rawRefreshToken) {
    // Revoke all refresh tokens for this user
    await pool.execute(`DELETE FROM refresh_tokens WHERE user_id = ?`, [userId]);
    return true;
  }

  const hashedToken = hashToken(rawRefreshToken);
  await pool.execute(
    `DELETE FROM refresh_tokens WHERE user_id = ? AND token_hash = ?`,
    [userId, hashedToken]
  );
  return true;
}

module.exports = {
  upsertUserByPhone,
  generateTokenPair,
  refreshAccessToken,
  logoutUser,
};
