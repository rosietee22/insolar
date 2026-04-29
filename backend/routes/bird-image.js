/**
 * Bird Image Service
 * Resolves eBird species codes to CC-licensed photos from
 * Wikimedia Commons or iNaturalist, with photographer attribution.
 */

const express = require('express');
const router = express.Router();
const cache = require('../cache');

const META_TTL = 2592000;    // 30 days
const IMG_TTL = 2592000;     // 30 days
const NOT_FOUND_TTL = 86400; // 1 day for misses

const USER_AGENT = 'SunbirdApp/1.0 (https://sunbird.today; rosiethomasemail@gmail.com)';

function isOpenLicense(license) {
  if (!license) return false;
  const s = license.toLowerCase();
  if (s.includes('public domain') || s === 'pd') return true;
  if (s.includes('cc0') || s.includes('cc-zero')) return true;
  if (s.includes('cc by-sa') || s.includes('cc-by-sa')) return true;
  if ((s.includes('cc by') || s.includes('cc-by')) && !s.includes('nc') && !s.includes('nd')) return true;
  if (s.includes('gfdl')) return true;
  return false;
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeLicense(raw) {
  if (!raw) return 'Public Domain';
  const s = raw.toLowerCase();
  if (s.includes('cc0') || s.includes('cc-zero')) return 'CC0 1.0';
  if (s === 'pd' || s.includes('public domain')) return 'Public Domain';
  return raw.replace(/^cc\s/i, 'CC ');
}

/**
 * Try Wikimedia Commons via the Wikipedia article's main image.
 */
async function tryWikimedia(scientificName) {
  try {
    const wikiTitle = scientificName.replace(/ /g, '_');
    const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&piprop=original&format=json&redirects=1`;

    const pageRes = await fetch(pageUrl, { headers: { 'Api-User-Agent': USER_AGENT } });
    if (!pageRes.ok) return null;

    const pageData = await pageRes.json();
    const pages = pageData.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    if (!page || page.missing !== undefined || !page.pageimage) return null;

    const filename = page.pageimage;

    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json`;

    const commonsRes = await fetch(commonsUrl, { headers: { 'Api-User-Agent': USER_AGENT } });
    if (!commonsRes.ok) return null;

    const commonsData = await commonsRes.json();
    const commonsPages = commonsData.query?.pages;
    if (!commonsPages) return null;

    const commonsPage = Object.values(commonsPages)[0];
    if (!commonsPage || commonsPage.missing !== undefined) return null;

    const info = commonsPage.imageinfo?.[0];
    if (!info) return null;

    const ext = info.extmetadata || {};
    const licenseRaw = ext.LicenseShortName?.value || '';

    if (!isOpenLicense(licenseRaw)) return null;

    const fullUrl = info.thumburl || info.url;
    const thumbUrl = fullUrl.replace(/\/\d+px-/, '/320px-');

    return {
      source: 'wikimedia',
      thumbUrl,
      fullUrl,
      photographer: stripHtml(ext.Artist?.value) || 'Unknown',
      license: normalizeLicense(licenseRaw),
      licenseUrl: ext.LicenseUrl?.value || '',
      sourceUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename)}`,
    };
  } catch (err) {
    console.error('Wikimedia lookup failed:', err.message);
    return null;
  }
}

/**
 * Try iNaturalist for a research-grade, openly-licensed photo.
 */
async function tryINaturalist(scientificName) {
  try {
    const searchUrl = `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(scientificName)}&quality_grade=research&photos=true&photo_license=cc0,cc-by,cc-by-sa&per_page=1&order_by=votes`;

    const res = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;

    const data = await res.json();
    const obs = data.results?.[0];
    if (!obs?.photos?.length) return null;

    const photo = obs.photos[0];
    if (!photo.url) return null;

    const thumbUrl = photo.url.replace('square', 'medium');
    const fullUrl = photo.url.replace('square', 'large');

    const attribution = photo.attribution || '';
    const nameMatch = attribution.match(/\(c\)\s*(.+?),/i) || attribution.match(/©\s*(.+?),/i);
    const photographer = nameMatch ? nameMatch[1].trim() : 'Unknown';

    const licenseMap = {
      'cc0': { name: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
      'cc-by': { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
      'cc-by-sa': { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
    };
    const licenseInfo = licenseMap[photo.license_code] || { name: photo.license_code || 'CC', url: '' };

    return {
      source: 'inaturalist',
      thumbUrl,
      fullUrl,
      photographer,
      license: licenseInfo.name,
      licenseUrl: licenseInfo.url,
      sourceUrl: obs.uri || `https://www.inaturalist.org/observations/${obs.id}`,
    };
  } catch (err) {
    console.error('iNaturalist lookup failed:', err.message);
    return null;
  }
}

/**
 * Resolve speciesCode + scientificName → image metadata.
 * Results are cached for 30 days (or 1 day for misses).
 */
async function resolveImageMeta(speciesCode, scientificName) {
  const cacheKey = `bird-meta:${speciesCode}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached === 'none' ? null : cached;

  if (!scientificName) {
    cache.set(cacheKey, 'none', NOT_FOUND_TTL);
    return null;
  }

  let meta = await tryWikimedia(scientificName);
  if (!meta) meta = await tryINaturalist(scientificName);

  if (meta) {
    cache.set(cacheKey, meta, META_TTL);
    return meta;
  }

  cache.set(cacheKey, 'none', NOT_FOUND_TTL);
  return null;
}

function placeholderSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <rect width="320" height="320" fill="#E8E4DA"/>
  <g transform="translate(110, 120) scale(4.2)">
    <path d="M1 14 C5 7, 11 5, 15 9 C17 6, 21 5, 23 6.5 C21 8, 18 10, 15 12.5 C11 11, 6 12, 1 14Z" fill="#D0CCC4"/>
  </g>
</svg>`;
}

/**
 * GET /:speciesCode?sci=Scientific+Name&size=320|1200
 */
router.get('/:speciesCode', async (req, res) => {
  const { speciesCode } = req.params;
  const scientificName = req.query.sci || '';
  const size = req.query.size === '1200' ? 'full' : 'thumb';

  if (!/^[a-zA-Z0-9]{1,10}$/.test(speciesCode)) {
    return res.status(400).json({ error: 'Invalid species code' });
  }

  try {
    const meta = await resolveImageMeta(speciesCode, scientificName);

    if (!meta) {
      res.set('Content-Type', 'image/svg+xml');
      res.set('Cache-Control', 'public, max-age=86400');
      return res.send(placeholderSvg());
    }

    const imageUrl = size === 'full' ? meta.fullUrl : meta.thumbUrl;
    const imgCacheKey = `bird-img:${speciesCode}:${size}`;
    let imgCached = cache.get(imgCacheKey);

    if (!imgCached) {
      const imageRes = await fetch(imageUrl, { headers: { 'User-Agent': USER_AGENT } });

      if (!imageRes.ok) {
        res.set('Content-Type', 'image/svg+xml');
        res.set('Cache-Control', 'public, max-age=86400');
        return res.send(placeholderSvg());
      }

      const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
      const buffer = Buffer.from(await imageRes.arrayBuffer());
      imgCached = { contentType, buffer };
      cache.set(imgCacheKey, imgCached, IMG_TTL);
    }

    res.set('Content-Type', imgCached.contentType);
    res.set('Cache-Control', 'public, max-age=2592000');
    res.send(imgCached.buffer);

  } catch (error) {
    console.error('Bird image error:', error.message);
    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(placeholderSvg());
  }
});

/**
 * GET /:speciesCode/info?sci=Scientific+Name
 * Returns attribution metadata for the species image.
 */
router.get('/:speciesCode/info', async (req, res) => {
  const { speciesCode } = req.params;
  const scientificName = req.query.sci || '';

  if (!/^[a-zA-Z0-9]{1,10}$/.test(speciesCode)) {
    return res.status(400).json({ error: 'Invalid species code' });
  }

  try {
    const meta = await resolveImageMeta(speciesCode, scientificName);

    if (!meta) {
      return res.json({
        source: 'placeholder',
        photographer: null,
        license: null,
        licenseUrl: null,
        sourceUrl: null,
      });
    }

    res.set('Cache-Control', 'public, max-age=2592000');
    res.json({
      source: meta.source,
      photographer: meta.photographer,
      license: meta.license,
      licenseUrl: meta.licenseUrl,
      sourceUrl: meta.sourceUrl,
    });

  } catch (error) {
    console.error('Bird image info error:', error.message);
    res.status(500).json({ error: 'Attribution lookup failed' });
  }
});

module.exports = router;
