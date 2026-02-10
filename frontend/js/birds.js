/**
 * Bird Activity Module
 * Handles bird data fetching, caching, view toggling, and client-side activity model.
 */

import { getBirdData } from './api.js';

const BIRD_CACHE_KEY = 'bird_data';
const BIRD_CACHE_MAX_AGE = 3 * 60 * 60 * 1000; // 3 hours

let currentView = 'weather';
let featureAvailable = null; // null = unknown, true/false after first check

/**
 * Get current view state
 */
export function getCurrentView() {
  return currentView;
}

/**
 * Toggle between weather and birds view
 * @returns {string} New view name
 */
export function toggleView() {
  currentView = currentView === 'weather' ? 'birds' : 'weather';
  return currentView;
}

/**
 * Check if bird feature is available (API key configured)
 */
export function isBirdFeatureAvailable() {
  return featureAvailable;
}

/**
 * Load bird data with caching
 * @param {number} lat
 * @param {number} lon
 * @param {Object} currentWeather - Current weather conditions
 * @returns {Promise<Object|null>} Bird data or null
 */
export async function loadBirdData(lat, lon, currentWeather = {}, locationTime = {}) {
  // Try cache first
  const cached = getCachedBirdData();
  if (cached) {
    const age = Date.now() - new Date(cached.generated_at).getTime();
    if (age < BIRD_CACHE_MAX_AGE) {
      // Recalculate activity client-side with fresh weather
      cached.activity = calculateActivityCurve(currentWeather, locationTime);
      featureAvailable = true;
      return cached;
    }
  }

  try {
    const data = await getBirdData(lat, lon, currentWeather);
    cacheBirdData(data);
    featureAvailable = true;
    return data;
  } catch (error) {
    if (error.message === 'Bird data unavailable') {
      featureAvailable = false;
      return null;
    }
    console.error('Bird data fetch error:', error);
    // Return stale cached data if available
    if (cached) {
      cached.activity = calculateActivityCurve(currentWeather, locationTime);
      return cached;
    }
    return null;
  }
}

/**
 * Cache bird data to localStorage
 */
function cacheBirdData(data) {
  try {
    localStorage.setItem(BIRD_CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Bird cache write error:', e);
  }
}

/**
 * Clear bird data cache to force a fresh fetch
 */
export function clearBirdCache() {
  localStorage.removeItem(BIRD_CACHE_KEY);
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

// ==================== CLIENT-SIDE ACTIVITY MODEL ====================

/**
 * Calculate activity score for a specific hour
 * Mirrors backend/bird-activity.js
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
