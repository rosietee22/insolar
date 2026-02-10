/**
 * Authentication Middleware
 *
 * Accepts either:
 *  1. Session cookie (sb_session) — set automatically when page loads
 *  2. Bearer token in Authorization header — for dev/external API use
 */
const crypto = require('crypto');

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach(pair => {
    const [key, ...rest] = pair.trim().split('=');
    if (key) cookies[key] = rest.join('=');
  });
  return cookies;
}

function authMiddleware(req, res, next) {
  const validToken = process.env.API_SECRET;

  if (!validToken) {
    console.error('ERROR: API_SECRET not set in environment variables');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'API_SECRET not configured'
    });
  }

  // 1. Check session cookie (set when page is served)
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.sb_session) {
    const expected = crypto.createHmac('sha256', validToken).update('sunbird-session').digest('hex');
    if (cookies.sb_session === expected) {
      return next();
    }
  }

  // 2. Fall back to Bearer token (dev/API use)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer' && parts[1] === validToken) {
      return next();
    }
  }

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Valid session or API token required'
  });
}

module.exports = authMiddleware;
