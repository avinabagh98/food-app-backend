const { error } = require('../utils/response');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('[Error Details]:', err);
  }

  return error(res, message, statusCode, err.stack);
}

module.exports = errorHandler;
