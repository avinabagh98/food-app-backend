const { error } = require('../utils/response');

/**
 * Require one of the specified roles.
 * Example: requireRole('admin') or requireRole('admin', 'manager')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return error(res, 'Unauthorized. Role information not found.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(
        res,
        `Forbidden. Requires one of the following roles: ${allowedRoles.join(', ')}`,
        403
      );
    }

    next();
  };
}

module.exports = { requireRole };
