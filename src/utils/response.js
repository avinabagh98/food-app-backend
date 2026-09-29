/**
 * Standard Success Response Envelope
 */
function success(res, data = null, message = null, statusCode = 200) {
  const payload = { success: true };
  if (message) payload.message = message;
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
}

/**
 * Standard Error Response Envelope
 */
function error(res, message = 'An error occurred', statusCode = 500, details = null) {
  const payload = {
    success: false,
    message,
  };
  if (details && process.env.NODE_ENV === 'development') {
    payload.details = details;
  }
  return res.status(statusCode).json(payload);
}

module.exports = { success, error };
