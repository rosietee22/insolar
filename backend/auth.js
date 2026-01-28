/**
 * Simple Bearer Token Authentication Middleware
 *
 * Checks Authorization header for valid API_SECRET.
 * Single-user flow: no user management needed.
 */

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Missing Authorization header',
      message: 'Include "Authorization: Bearer <token>" in request headers'
    });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Invalid Authorization format',
      message: 'Use format: "Authorization: Bearer <token>"'
    });
  }

  const token = parts[1];
  const validToken = process.env.API_SECRET;

  if (!validToken) {
    console.error('ERROR: API_SECRET not set in environment variables');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'API_SECRET not configured'
    });
  }

  if (token !== validToken) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Provided token does not match'
    });
  }

  // Token valid, proceed
  next();
}

module.exports = authMiddleware;
