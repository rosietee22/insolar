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

const ILLUSTRATION_PATTERNS = /\b(illustration|drawing|sketch|painting|cartoon|diagram|map|range map|stamp|engraving|plate|lithograph|art\b)/i;

/**
 * Score a Commons image candidate. Returns -1 to reject.
 */
function scoreCommonsImage(info, ext) {
  if (!info.mime?.startsWith('image/jpeg')) return -1;
  if (info.width < 800 || info.height < 600) return -1;

  const ratio = info.width / info.height;
  if (ratio < 0.5 || ratio > 3) return -1;

  const licenseRaw = ext.LicenseShortName?.value || '';
  if (!isOpenLicense(licenseRaw)) return -1;

  const desc = (ext.ImageDescription?.value || '').toLowerCase();
  const cats = (ext.Categories?.value || '').toLowerCase();
  const title = (info.descriptionurl || '').toLowerCase();
  const combined = `${desc} ${cats} ${title}`;
  if (ILLUSTRATION_PATTERNS.test(combined)) return -1;

  let score = 0;

  const assessments = (ext.Assessments?.value || '').toLowerCase();
  if (assessments.includes('featured')) score += 10;
  if (assessments.includes('quality')) score += 5;
  if (assessments.includes('valued')) score += 3;

  if (cats.includes('photograph')) score += 2;

  score += Math.min(info.width, 4000) / 1000;

  if (ratio >= 1.0 && ratio <= 1.8) score += 2;

  return score;
}

function buildWikimediaMeta(info, ext) {
  const fullUrl = info.thumburl || info.url;
  const thumbUrl = fullUrl.replace(/\/\d+px-/, '/320px-');
  return {
    source: 'wikimedia',
    thumbUrl,
    fullUrl,
    photographer: stripHtml(ext.Artist?.value) || 'Unknown',
    license: normalizeLicense(ext.LicenseShortName?.value || ''),
    licenseUrl: ext.LicenseUrl?.value || '',
    sourceUrl: info.descriptionurl || '',
  };
}

/**
 * Search Commons directly for quality photos of the species.
 */
async function searchCommonsPhotos(scientificName) {
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent('"' + scientificName + '"')}&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata|mime|size&iiurlwidth=1200&format=json`;

  const res = await fetch(searchUrl, { headers: { 'Api-User-Agent': USER_AGENT } });
  if (!res.ok) return null;

  const data = await res.json();
  const pages = data.query?.pages;
  if (!pages) return null;

  const candidates = Object.values(pages)
    .map(page => {
      const info = page.imageinfo?.[0];
      if (!info) return null;
      const ext = info.extmetadata || {};
      const score = scoreCommonsImage(info, ext);
      if (score < 0) return null;
      return { info, ext, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) return null;
  return buildWikimediaMeta(candidates[0].info, candidates[0].ext);
}

/**
 * Fallback: get the Wikipedia article's main image from Commons.
 */
async function tryWikipediaArticleImage(scientificName) {
  const wikiTitle = scientificName.replace(/ /g, '_');
  const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&piprop=original&format=json&redirects=1`;

  const pageRes = await fetch(pageUrl, { headers: { 'Api-User-Agent': USER_AGENT } });
  if (!pageRes.ok) return null;

  const pageData = await pageRes.json();
  const page = Object.values(pageData.query?.pages || {})[0];
  if (!page || page.missing !== undefined || !page.pageimage) return null;

  const filename = page.pageimage;
  if (/\.(svg|gif|png)$/i.test(filename)) return null;

  const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|extmetadata|mime|size&iiurlwidth=1200&format=json`;

  const commonsRes = await fetch(commonsUrl, { headers: { 'Api-User-Agent': USER_AGENT } });
  if (!commonsRes.ok) return null;

  const commonsPage = Object.values((await commonsRes.json()).query?.pages || {})[0];
  const info = commonsPage?.imageinfo?.[0];
  if (!info) return null;

  const ext = info.extmetadata || {};
  if (scoreCommonsImage(info, ext) < 0) return null;

  return buildWikimediaMeta(info, ext);
}

async function safeCall(fn, label) {
  try { return await fn(); } catch (err) {
    console.error(`${label} failed:`, err.message);
    return null;
  }
}

/**
 * Try iNaturalist for a research-grade, openly-licensed photo.
 * Fetches multiple candidates and picks the most-voted.
 */
async function tryINaturalist(scientificName) {
  try {
    const searchUrl = `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(scientificName)}&quality_grade=research&photos=true&photo_license=cc0,cc-by,cc-by-sa&per_page=5&order_by=votes`;

    const res = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.results?.length) return null;

    const licenseMap = {
      'cc0': { name: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
      'cc-by': { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
      'cc-by-sa': { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
    };

    const target = scientificName.toLowerCase();
    for (const obs of data.results) {
      const taxon = (obs.taxon?.name || '').toLowerCase();
      if (taxon !== target && !taxon.startsWith(target + ' ')) continue;

      const photo = obs.photos?.[0];
      if (!photo?.url) continue;

      const licenseInfo = licenseMap[photo.license_code];
      if (!licenseInfo) continue;

      const thumbUrl = photo.url.replace('square', 'medium');
      const fullUrl = photo.url.replace('square', 'large');

      const attribution = photo.attribution || '';
      const nameMatch = attribution.match(/\(c\)\s*(.+?),/i) || attribution.match(/©\s*(.+?),/i);
      const photographer = nameMatch ? nameMatch[1].trim() : 'Unknown';

      return {
        source: 'inaturalist',
        thumbUrl,
        fullUrl,
        photographer,
        license: licenseInfo.name,
        licenseUrl: licenseInfo.url,
        sourceUrl: obs.uri || `https://www.inaturalist.org/observations/${obs.id}`,
      };
    }

    return null;
  } catch (err) {
    console.error('iNaturalist lookup failed:', err.message);
    return null;
  }
}

/**
 * Resolve speciesCode + scientificName → image metadata.
 * Runs all sources in parallel; prefers Wikipedia article image (curated),
 * then Commons search, then iNaturalist as last resort.
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

  const [wikiResult, commonsResult, inatResult] = await Promise.allSettled([
    safeCall(() => tryWikipediaArticleImage(scientificName), 'Wikipedia image'),
    safeCall(() => searchCommonsPhotos(scientificName), 'Commons search'),
    safeCall(() => tryINaturalist(scientificName), 'iNaturalist'),
  ]);

  const wiki = wikiResult.status === 'fulfilled' ? wikiResult.value : null;
  const commons = commonsResult.status === 'fulfilled' ? commonsResult.value : null;
  const inat = inatResult.status === 'fulfilled' ? inatResult.value : null;

  const meta = wiki || commons || inat;

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
module.exports.resolveImageMeta = resolveImageMeta;
