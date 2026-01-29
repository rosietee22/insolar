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
 * GET /api/birds?lat=X&lon=Y&temp_c=X&rain=X&wind=X&cloud=X
 *
 * Fetch bird observations and activity for given coordinates.
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

    // Check cache (6-hour TTL for bird data)
    const cacheKey = `birds:${cache.makeKey(roundedLat, roundedLon)}`;
    let birdData = cache.get(cacheKey);

    if (birdData) {
      // Recalculate activity with fresh weather params
      const activity = calculateActivityCurve({
        temp_c: parseFloat(req.query.temp_c) || 10,
        rain_probability: parseFloat(req.query.rain) || 0,
        wind_speed_ms: parseFloat(req.query.wind) || 0,
        cloud_percent: parseFloat(req.query.cloud) || 50,
      });

      return res.json({
        ...birdData,
        activity,
        cached: true,
      });
    }

    // Cache miss: fetch from eBird
    console.log(`Fetching bird data for ${roundedLat},${roundedLon}...`);
    const rawObs = await provider.getRecentObservations(roundedLat, roundedLon);
    const allSpecies = provider.transformObservations(rawObs);
    const notableSpecies = provider.selectNotableSpecies(allSpecies);

    const activity = calculateActivityCurve({
      temp_c: parseFloat(req.query.temp_c) || 10,
      rain_probability: parseFloat(req.query.rain) || 0,
      wind_speed_ms: parseFloat(req.query.wind) || 0,
      cloud_percent: parseFloat(req.query.cloud) || 50,
    });

    const uniqueCount = new Set(allSpecies.map(s => s.species_code)).size;

    birdData = {
      generated_at: new Date().toISOString(),
      location: { lat: roundedLat, lon: roundedLon },
      notable_species: notableSpecies,
      all_species: allSpecies,
      total_species_count: uniqueCount,
      observation_radius_km: 25,
    };

    // Cache for 6 hours (21600 seconds)
    cache.set(cacheKey, birdData, 21600);

    res.json({
      ...birdData,
      activity,
      cached: false,
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
