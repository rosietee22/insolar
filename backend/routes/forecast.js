const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth');
const cache = require('../cache');
const { validateForecast } = require('../schema');
const MockProvider = require('../providers/mock');
const GoogleWeatherProvider = require('../providers/google-weather');

// Initialize provider based on available API keys
// Priority: Google Weather (AI-powered) > Mock (fallback)
let provider;
if (process.env.GOOGLE_WEATHER_API_KEY && process.env.GOOGLE_WEATHER_API_KEY !== 'your_google_api_key_here') {
  provider = new GoogleWeatherProvider();
  console.log('Using Google Weather provider (WeatherNext AI)');
} else {
  provider = new MockProvider();
  console.log('Using Mock provider (set GOOGLE_WEATHER_API_KEY for real data)');
}

/**
 * GET /api/forecast?lat=X&lon=Y
 *
 * Fetch weather forecast for given coordinates.
 * Requires Bearer token authentication.
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    // Validate query parameters
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Both lat and lon query parameters are required'
      });
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      return res.status(400).json({
        error: 'Invalid parameters',
        message: 'lat and lon must be valid numbers'
      });
    }

    if (latNum < -90 || latNum > 90) {
      return res.status(400).json({
        error: 'Invalid latitude',
        message: 'lat must be between -90 and 90'
      });
    }

    if (lonNum < -180 || lonNum > 180) {
      return res.status(400).json({
        error: 'Invalid longitude',
        message: 'lon must be between -180 and 180'
      });
    }

    // Round coordinates to 3 decimals for better accuracy (~100m)
    const roundedLat = Math.round(latNum * 1000) / 1000;
    const roundedLon = Math.round(lonNum * 1000) / 1000;

    // Check cache
    const cacheKey = cache.makeKey(roundedLat, roundedLon);
    let forecast = cache.get(cacheKey);

    if (forecast) {
      console.log(`Cache hit for ${cacheKey}`);
      return res.json({
        ...forecast,
        cached: true,
        cache_key: cacheKey
      });
    }

    // Cache miss: fetch from provider
    console.log(`Cache miss for ${cacheKey}, fetching from ${provider.getName()}...`);
    forecast = await provider.getForecast(roundedLat, roundedLon);

    // Validate schema
    try {
      validateForecast(forecast);
    } catch (validationError) {
      console.error('Schema validation failed:', validationError.message);
      return res.status(500).json({
        error: 'Invalid forecast data',
        message: validationError.message
      });
    }

    // Cache for 5 minutes (current conditions update every 15–30 min upstream)
    cache.set(cacheKey, forecast, 300);

    // Return forecast
    res.json({
      ...forecast,
      cached: false,
      cache_key: cacheKey
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
