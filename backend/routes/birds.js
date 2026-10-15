const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth');
const cache = require('../cache');
const EBirdProvider = require('../providers/ebird');
const { resolveImageMeta } = require('./bird-image');

const provider = new EBirdProvider();

if (provider.isAvailable()) {
  console.log('eBird provider configured');
} else {
  console.log('eBird provider not configured (set EBIRD_API_KEY for bird data)');
}

/**
 * GET /api/birds?lat=X&lon=Y&hour=H
 *
 * Fetch bird observations for given coordinates.
 * hour = location hour (0-23), used for time-of-day relevance scoring.
 * The activity curve is computed client-side, where the location's
 * timezone is known.
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

    // Check cache for raw observations (2-hour TTL)
    const cacheKey = `birds-raw:${cache.makeKey(roundedLat, roundedLon)}`;
    let cached = cache.get(cacheKey);

    if (!cached) {
      // Fetch from eBird: start tight (3km, 2 days), widen if sparse
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
      cache.set(cacheKey, cached, 7200); // 2 hours
    }

    // Score and sort by time-of-day relevance (dynamic, not cached)
    const scored = provider.deduplicateAndScore(cached.observations, locationHour);
    const notableSpecies = provider.selectNotableSpecies(scored);

    // Only notable species show a thumbnail on load. Every other species
    // resolves its image on demand via /api/bird-image when the user expands
    // its row, so pre-resolving them here just blocks this response.
    const seen = new Set();
    const unique = notableSpecies.filter(s => {
      if (seen.has(s.species_code)) return false;
      seen.add(s.species_code);
      return true;
    });

    const imageMetas = await Promise.allSettled(
      unique.map(s => resolveImageMeta(s.species_code, s.scientific_name))
    );

    const imageMap = {};
    unique.forEach((s, i) => {
      const result = imageMetas[i];
      if (result.status === 'fulfilled' && result.value) {
        // Sources without a CORS header have to be served via our own proxy
        // route rather than linked directly from the page.
        const proxied = (extra = '') =>
          `/api/bird-image/${encodeURIComponent(s.species_code)}`
          + `?sci=${encodeURIComponent(s.scientific_name || '')}${extra}`;

        imageMap[s.species_code] = {
          thumb: result.value.proxyOnly ? proxied() : result.value.thumbUrl,
          full: result.value.proxyOnly ? proxied('&size=1200') : result.value.fullUrl,
          photographer: result.value.photographer,
          license: result.value.license,
          licenseUrl: result.value.licenseUrl,
          source: result.value.source,
          sourceUrl: result.value.sourceUrl,
        };
      }
    });

    res.json({
      generated_at: new Date().toISOString(),
      location: { lat: roundedLat, lon: roundedLon },
      notable_species: notableSpecies,
      all_species: scored,
      total_species_count: scored.length,
      observation_radius_km: cached.radius,
      images: imageMap,
      cached: !!cache.get(cacheKey),
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
