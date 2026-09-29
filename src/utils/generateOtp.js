const crypto = require('crypto');

/**
 * Generate a 6-digit numeric OTP (100000 - 999999)
 */
function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

module.exports = generateOtp;
