/**
 * Bird Activity Module
 * Handles bird data fetching, caching, and client-side activity model.
 */

import { getBirdData } from './api.js';

// Bump when the cached response's shape or contents change, so browsers
// holding data from an older deploy discard it rather than rendering it.
// v2: thumbnail URLs are now requested from Commons rather than built by
// rewriting a width, and v1 entries hold URLs that return 400.
const CACHE_VERSION = 2;
const BIRD_CACHE_KEY = `bird_data_v${CACHE_VERSION}`;
const BIRD_CACHE_LOC_KEY = `bird_data_loc_v${CACHE_VERSION}`;
const BIRD_CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes

// Drop entries written by earlier cache versions.
try {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('bird_data') && key !== BIRD_CACHE_KEY && key !== BIRD_CACHE_LOC_KEY) {
      localStorage.removeItem(key);
    }
  }
} catch {
  // Storage unavailable (private mode, blocked cookies)
}

let featureAvailable = null; // null = unknown, true/false after first check

/**
 * Check if bird feature is available (API key configured)
 */
export function isBirdFeatureAvailable() {
  return featureAvailable;
}

/**
 * Load bird data with caching. Needs only coordinates, so it can run
 * alongside the forecast request. The activity curve is computed by the
 * caller, once the location's timezone and weather are known.
 * @param {number} lat
 * @param {number} lon
 * @param {number|null} locationHour - Hour at the location, for time-of-day scoring
 * @returns {Promise<Object|null>} Bird data or null
 */
export async function loadBirdData(lat, lon, locationHour = null) {
  const locKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const sameLocation = localStorage.getItem(BIRD_CACHE_LOC_KEY) === locKey;

  const cached = sameLocation ? getCachedBirdData() : null;
  if (cached) {
    const age = Date.now() - new Date(cached.generated_at).getTime();
    if (age < BIRD_CACHE_MAX_AGE) {
      featureAvailable = true;
      return cached;
    }
  }

  try {
    const data = await getBirdData(lat, lon, locationHour);
    cacheBirdData(data, locKey);
    featureAvailable = true;
    return data;
  } catch (error) {
    if (error.message === 'Bird data unavailable') {
      featureAvailable = false;
      return null;
    }
    console.error('Bird data fetch error:', error);
    return cached || null;
  }
}

/**
 * Cache bird data to localStorage
 */
function cacheBirdData(data, locKey) {
  try {
    localStorage.setItem(BIRD_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(BIRD_CACHE_LOC_KEY, locKey);
  } catch (e) {
    console.error('Bird cache write error:', e);
  }
}

/**
 * Clear bird data cache to force a fresh fetch
 */
export function clearBirdCache() {
  localStorage.removeItem(BIRD_CACHE_KEY);
  localStorage.removeItem(BIRD_CACHE_LOC_KEY);
}

/**
 * Get cached bird data from localStorage
 */
export function getCachedBirdData() {
  try {
    const cached = localStorage.getItem(BIRD_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

// ==================== ACTIVITY MODEL ====================

/**
 * Calculate activity score for a specific hour
 */
function scoreHour(hour, weather, month) {
  let score = 50;
  let label = 'Not much about';

  if (hour >= 5 && hour <= 7) {
    score += 30;
    label = 'Best time to spot birds';
  } else if (hour === 8) {
    score += 20;
    label = 'Great for spotting';
  } else if (hour >= 9 && hour <= 11) {
    score += 10;
    label = 'Good chance of sightings';
  } else if (hour >= 12 && hour <= 14) {
    score -= 5;
    label = 'Fewer birds around';
  } else if (hour >= 15 && hour <= 16) {
    score += 10;
    label = 'Birds picking up again';
  } else if (hour >= 17 && hour <= 18) {
    score += 20;
    label = 'Lots of activity';
  } else if (hour === 19) {
    score += 5;
    label = 'Last chance today';
  } else {
    score -= 20;
    label = 'Not much about';
  }

  if (weather.rain_probability > 60) {
    score -= 20;
    if (score < 40) label = 'Rain keeping birds hidden';
  } else if (weather.rain_probability > 30) {
    score -= 10;
  }

  if (weather.wind_speed_ms > 10) {
    score -= 15;
    if (score < 40) label = 'Too windy for most birds';
  } else if (weather.wind_speed_ms > 6) {
    score -= 5;
  }

  if ([2, 3, 4].includes(month)) score += 15;
  else if ([8, 9].includes(month)) score += 10;
  else if ([11, 0, 1].includes(month)) score -= 5;

  if (weather.temp_c >= 10 && weather.temp_c <= 22) score += 5;
  if (weather.temp_c < 0) score -= 10;
  if (weather.temp_c > 30) score -= 10;

  if (weather.cloud_percent > 30 && weather.cloud_percent < 70 && weather.rain_probability < 20) {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));
  return { score, label };
}

/**
 * Calculate 24-hour activity curve (client-side)
 * @param {Object} weather - Current weather
 * @returns {Object} { curve, current, dawn_peak, dusk_peak }
 */
export function calculateActivityCurve(weather = {}, { hour: locHour, month: locMonth } = {}) {
  const now = new Date();
  const month = locMonth ?? now.getMonth();
  const currentHour = locHour ?? now.getHours();

  const w = {
    temp_c: weather.temp_c ?? 10,
    rain_probability: weather.rain_probability ?? 0,
    wind_speed_ms: weather.wind_speed_ms ?? 0,
    cloud_percent: weather.cloud_percent ?? 50,
  };

  const curve = [];
  let dawnPeak = { hour: 6, score: 0 };
  let duskPeak = { hour: 17, score: 0 };

  for (let h = 0; h < 24; h++) {
    const { score, label } = scoreHour(h, w, month);
    curve.push({ hour: h, score, label });

    if (h >= 5 && h <= 9 && score > dawnPeak.score) {
      dawnPeak = { hour: h, score };
    }
    if (h >= 15 && h <= 19 && score > duskPeak.score) {
      duskPeak = { hour: h, score };
    }
  }

  const current = curve[currentHour];
  const level = current.score >= 70 ? 'high' : current.score >= 40 ? 'moderate' : 'low';

  return {
    curve,
    current: { ...current, level },
    dawn_peak: dawnPeak,
    dusk_peak: duskPeak,
  };
}
