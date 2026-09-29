const { verifyAccessToken } = require('../config/jwt');
const { error } = require('../utils/response');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Access denied. Bearer token missing.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    // Attach decoded user info to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      phone: decoded.phone,
    };
    next();
  } catch (err) {
    console.log("----", err);

    return error(res, 'Invalid or expired access token.', 401);
  }
}

module.exports = { verifyToken };
