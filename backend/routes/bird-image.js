/**
 * Bird Image Proxy
 * Resolves eBird species codes to Macaulay Library photos
 * and proxies the image bytes with long-lived cache headers.
 */

const express = require('express');
const router = express.Router();
const cache = require('../cache');

const ML_SEARCH_URL = 'https://search.macaulaylibrary.org/api/v1/search';
const ML_CDN_URL = 'https://cdn.download.ams.birds.cornell.edu/api/v1/asset';

/**
 * GET /api/bird-image/:speciesCode?size=320|1200
 * Proxies a top-rated photo for the given eBird species code.
 */
router.get('/:speciesCode', async (req, res) => {
  const { speciesCode } = req.params;
  // CDN supports specific breakpoints: 320, 640, 1200
  const size = req.query.size === '1200' ? '1200' : '320';

  // Validate: eBird species codes are short alphanumeric strings
  if (!/^[a-zA-Z0-9]{1,10}$/.test(speciesCode)) {
    return res.status(400).json({ error: 'Invalid species code' });
  }

  try {
    // Step 1: Resolve speciesCode → assetId (cached 30 days)
    const assetCacheKey = `bird-asset:${speciesCode}`;
    let assetId = cache.get(assetCacheKey);

    if (assetId === undefined || assetId === null) {
      const searchUrl = `${ML_SEARCH_URL}?taxonCode=${speciesCode}&mediaType=photo&sort=rating_rank_desc&count=1`;
      const searchRes = await fetch(searchUrl);

      if (!searchRes.ok) {
        console.error(`Macaulay search failed for ${speciesCode}: ${searchRes.status}`);
        return res.status(502).json({ error: 'Image search failed' });
      }

      const searchData = await searchRes.json();
      const results = searchData.results?.content;

      if (!results || results.length === 0) {
        cache.set(assetCacheKey, 'none', 2592000); // 30 days
        return res.status(404).json({ error: 'No image found' });
      }

      assetId = String(results[0].assetId);
      cache.set(assetCacheKey, assetId, 2592000); // 30 days
    }

    if (assetId === 'none') {
      return res.status(404).json({ error: 'No image found' });
    }

    // Step 2: Fetch image from CDN and proxy
    const imageUrl = `${ML_CDN_URL}/${assetId}/${size}`;
    const imageRes = await fetch(imageUrl);

    if (!imageRes.ok) {
      console.error(`CDN fetch failed for asset ${assetId}: ${imageRes.status}`);
      return res.status(502).json({ error: 'Image fetch failed' });
    }

    const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=2592000'); // 30 days

    const buffer = await imageRes.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Bird image proxy error:', error.message);
    res.status(500).json({ error: 'Image proxy error' });
  }
});

module.exports = router;
