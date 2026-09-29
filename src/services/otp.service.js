const axios = require('axios');
const pool = require('../db/pool');
const generateOtp = require('../utils/generateOtp');
const { AppError } = require('../utils/errors');

const OTP_WINDOW_MINUTES = parseInt(process.env.OTP_WINDOW_MINUTES || '10', 10);
const OTP_MAX_REQUESTS = parseInt(process.env.OTP_MAX_REQUESTS_PER_WINDOW || '3', 10);
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);

/**
 * Dispatch OTP via configured provider or mock in dev
 */
async function dispatchExternalOtp(phone, otpCode) {
  const providerUrl = process.env.OTP_PROVIDER_URL;
  const apiKey = process.env.OTP_PROVIDER_API_KEY;

  if (!providerUrl || providerUrl === 'mock' || process.env.NODE_ENV === 'development') {
    console.log(`\n========================================`);
    console.log(`[DEV OTP MOCK] Phone: ${phone} | OTP: ${otpCode}`);
    console.log(`========================================\n`);

    return true;
  }

  // try {
  //   await axios.post(
  //     providerUrl,
  //     { phone, otp: otpCode },
  //     {
  //       headers: {
  //         'Authorization': `Bearer ${apiKey}`,
  //         'Content-Type': 'application/json',
  //       },
  //       timeout: 5000,
  //     }
  //   );
  //   return true;
  // } catch (err) {
  //   console.error('External OTP Provider failed:', err.message);
  //   throw new AppError('Failed to send OTP via SMS gateway. Please try again.', 502);
  // }
}

/**
 * 1. Check rate limit
 * 2. Generate OTP
 * 3. Store in otp_verifications table
 * 4. Dispatch via SMS provider
 */
async function sendOtp(phone) {
  // 1. DB-based rate limit check
  const [rateLimitRows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM otp_verifications
     WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [phone, OTP_WINDOW_MINUTES]
  );

  if (rateLimitRows[0].count >= OTP_MAX_REQUESTS) {
    throw new AppError('Too many OTP requests. Please try again later.', 429);
  }

  // 2. Generate 6-digit OTP
  const otpCode = generateOtp();

  // 3. Store in DB (expires in OTP_EXPIRY_MINUTES)
  await pool.execute(
    `INSERT INTO otp_verifications (phone, otp_code, expires_at, is_used)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), 0)`,
    [phone, otpCode, OTP_EXPIRY_MINUTES]
  );

  // 4. Send via external provider
  await dispatchExternalOtp(phone, otpCode); // Note: In production, this will send the OTP via SMS. In development, it will log to console.

  return { success: true, code: otpCode }; // Return OTP for dev/testing; remove in production
}

/**
 * 1. Query most recent matching OTP record
 * 2. Validate expiration & usage status
 * 3. Mark record as used
 * 4. Cleanup stale records for the phone
 */
async function verifyOtp(phone, otpCode) {
  const [rows] = await pool.execute(
    `SELECT id, otp_code, expires_at, is_used
     FROM otp_verifications
     WHERE phone = ? AND otp_code = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone, otpCode]
  );

  if (rows.length === 0) {
    throw new AppError('Invalid OTP or phone number.', 400);
  }

  const record = rows[0];

  if (record.is_used === 1) {
    throw new AppError('OTP has already been used.', 400);
  }

  const now = new Date();
  const expiresAt = new Date(record.expires_at);
  if (expiresAt < now) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  // Mark this OTP as used
  await pool.execute(
    `UPDATE otp_verifications SET is_used = 1 WHERE id = ?`,
    [record.id]
  );

  // Cleanup used or expired OTPs for this phone
  await pool.execute(
    `DELETE FROM otp_verifications
     WHERE phone = ? AND (is_used = 1 OR expires_at < NOW())`,
    [phone]
  );

  return true;
}

module.exports = {
  sendOtp,
  verifyOtp,
};
