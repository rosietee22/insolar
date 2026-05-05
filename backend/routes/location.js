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
                        /^172\.(1[6-9]|2\d|3[01])\./.test(clientIP);
    
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

/**
 * GET /api/location/autocomplete?q=query
 * Returns place suggestions from Google Places Autocomplete
 */
router.get('/autocomplete', async (req, res) => {
  const query = req.query.q;
  if (!query || query.length < 2) {
    return res.json({ suggestions: [] });
  }

  const apiKey = process.env.GOOGLE_WEATHER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Autocomplete not configured' });
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input: query,
        includedPrimaryTypes: ['(cities)'],
      }),
    });

    if (!response.ok) {
      console.error('[Location] Autocomplete API error:', response.status);
      return res.json({ suggestions: [] });
    }

    const data = await response.json();
    const suggestions = (data.suggestions || [])
      .filter(s => s.placePrediction)
      .slice(0, 5)
      .map(s => ({
        description: s.placePrediction.text?.text || '',
        placeId: s.placePrediction.placeId,
      }));

    res.json({ suggestions });
  } catch (error) {
    console.error('[Location] Autocomplete error:', error.message);
    res.json({ suggestions: [] });
  }
});

/**
 * GET /api/location/place?id=placeId
 * Returns lat/lon for a Google Place ID
 */
router.get('/place', async (req, res) => {
  const placeId = req.query.id;
  if (!placeId) {
    return res.status(400).json({ error: 'Missing place ID' });
  }

  const apiKey = process.env.GOOGLE_WEATHER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Place lookup not configured' });
  }

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?fields=displayName,location&key=${apiKey}`,
      { headers: { 'X-Goog-FieldMask': 'displayName,location' } }
    );

    if (!response.ok) {
      console.error('[Location] Place details error:', response.status);
      return res.status(502).json({ error: 'Place lookup failed' });
    }

    const data = await response.json();
    const name = data.displayName?.text || '';
    const lat = data.location?.latitude;
    const lon = data.location?.longitude;

    if (lat == null || lon == null) {
      return res.status(404).json({ error: 'Place not found' });
    }

    res.json({ name, lat, lon });
  } catch (error) {
    console.error('[Location] Place details error:', error.message);
    res.status(500).json({ error: 'Place lookup failed' });
  }
});

module.exports = router;
