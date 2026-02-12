const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth');
const cache = require('../cache');
const EBirdProvider = require('../providers/ebird');
const { calculateActivityCurve } = require('../bird-activity');

const provider = new EBirdProvider();

if (provider.isAvailable()) {
  console.log('eBird provider configured');
} else {
  console.log('eBird provider not configured (set EBIRD_API_KEY for bird data)');
}

/**
 * GET /api/birds?lat=X&lon=Y&hour=H&temp_c=X&rain=X&wind=X&cloud=X
 *
 * Fetch bird observations and activity for given coordinates.
 * hour = location hour (0-23), used for time-of-day relevance scoring.
 * Weather params are optional (used for activity model).
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    if (!provider.isAvailable()) {
      return res.status(503).json({
        error: 'Bird data unavailable',
        message: 'eBird API key not configured'
      });
    }

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

    if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'lat must be -90 to 90, lon must be -180 to 180'
      });
    }

    const roundedLat = Math.round(latNum * 1000) / 1000;
    const roundedLon = Math.round(lonNum * 1000) / 1000;

    const locationHour = req.query.hour !== undefined
      ? Math.max(0, Math.min(23, parseInt(req.query.hour, 10) || 0))
      : null;

    // Check cache for raw observations (6-hour TTL)
    const cacheKey = `birds-raw:${cache.makeKey(roundedLat, roundedLon)}`;
    let cached = cache.get(cacheKey);

    if (!cached) {
      // Fetch from eBird: start tight (3km, 5 days), widen if sparse
      console.log(`Fetching bird data for ${roundedLat},${roundedLon}...`);
      let rawObs = await provider.getRecentObservations(roundedLat, roundedLon, { dist: 3 });
      let observations = provider.transformObservations(rawObs);
      let radius = 3;

      const uniqueCount = new Set(observations.map(s => s.species_code)).size;
      if (uniqueCount < 5) {
        console.log(`Only ${uniqueCount} species at 3km, widening to 10km...`);
        rawObs = await provider.getRecentObservations(roundedLat, roundedLon, { dist: 10 });
        observations = provider.transformObservations(rawObs);
        radius = 10;
      }

      cached = { observations, radius };
      cache.set(cacheKey, cached, 21600); // 6 hours
    }

    // Score and sort by time-of-day relevance (dynamic, not cached)
    const scored = provider.deduplicateAndScore(cached.observations, locationHour);
    const notableSpecies = provider.selectNotableSpecies(scored);

    const activity = calculateActivityCurve({
      temp_c: parseFloat(req.query.temp_c) || 10,
      rain_probability: parseFloat(req.query.rain) || 0,
      wind_speed_ms: parseFloat(req.query.wind) || 0,
      cloud_percent: parseFloat(req.query.cloud) || 50,
    });

    res.json({
      generated_at: new Date().toISOString(),
      location: { lat: roundedLat, lon: roundedLon },
      notable_species: notableSpecies,
      all_species: scored,
      total_species_count: scored.length,
      observation_radius_km: cached.radius,
      activity,
      cached: !!cache.get(cacheKey),
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
