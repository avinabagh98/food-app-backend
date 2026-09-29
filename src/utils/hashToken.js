const crypto = require('crypto');

/**
 * Hash a string (e.g. refresh token) using SHA-256
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = hashToken;
