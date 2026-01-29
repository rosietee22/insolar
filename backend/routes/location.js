/**
 * Location API Routes
 * Provides IP-based approximate location when GPS fails
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/location/approximate
 * Returns approximate location based on IP address
 * Uses ip-api.com (free, no API key required, 45 req/min limit)
 */
router.get('/approximate', async (req, res) => {
  try {
    // Get client IP (handle proxies/load balancers)
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     req.headers['x-real-ip'] || 
                     req.socket.remoteAddress || 
                     '';
    
    // Skip localhost/private IPs - use a default location
    const isPrivateIP = clientIP === '127.0.0.1' || 
                        clientIP === '::1' || 
                        clientIP.startsWith('192.168.') ||
                        clientIP.startsWith('10.') ||
                        clientIP.startsWith('172.');
    
    if (isPrivateIP) {
      // Development fallback - London
      console.log('[Location] Private IP detected, using London fallback');
      return res.json({
        lat: 51.51,
        lon: -0.13,
        city: 'London',
        country: 'United Kingdom',
        source: 'approximate',
        accuracy: 'city'
      });
    }

    // Query ip-api.com for geolocation
    const response = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,message,country,city,lat,lon`);
    const data = await response.json();

    if (data.status !== 'success') {
      console.warn('[Location] IP lookup failed:', data.message);
      // Fallback to London if IP lookup fails
      return res.json({
        lat: 51.51,
        lon: -0.13,
        city: 'London',
        country: 'United Kingdom',
        source: 'approximate',
        accuracy: 'fallback'
      });
    }

    console.log(`[Location] IP lookup: ${data.city}, ${data.country} for ${clientIP}`);

    res.json({
      lat: Math.round(data.lat * 100) / 100, // Round to 2 decimals (~1km)
      lon: Math.round(data.lon * 100) / 100,
      city: data.city,
      country: data.country,
      source: 'approximate',
      accuracy: 'city'
    });

  } catch (error) {
    console.error('[Location] Approximate location error:', error.message);
    
    // Always return something usable
    res.json({
      lat: 51.51,
      lon: -0.13,
      city: 'London',
      country: 'United Kingdom',
      source: 'approximate',
      accuracy: 'fallback',
      error: 'IP lookup failed'
    });
  }
});

module.exports = router;
