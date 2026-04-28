/**
 * Location Handler (GPS + Approximate + City Search)
 * Graceful fallback strategy for mobile compatibility
 */

const LOCATION_KEY = 'weather_location';
const PERMISSION_DENIED_KEY = 'weather_gps_denied';

/**
 * Round coordinates to N decimals for privacy
 * @param {number} coord - Coordinate value
 * @param {number} decimals - Number of decimal places (default 3, ~100m accuracy)
 * @returns {number}
 */
function roundCoord(coord, decimals = 3) {
  const multiplier = Math.pow(10, decimals);
  return Math.round(coord * multiplier) / multiplier;
}

/**
 * Detect if running in an in-app browser (Instagram, TikTok, Gmail, etc.)
 * @returns {Object} { isInApp: boolean, appName: string|null }
 */
export function detectInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || '';
  
  const inAppPatterns = [
    { pattern: /FBAN|FBAV/i, name: 'Facebook' },
    { pattern: /Instagram/i, name: 'Instagram' },
    { pattern: /Twitter/i, name: 'Twitter' },
    { pattern: /TikTok/i, name: 'TikTok' },
    { pattern: /Snapchat/i, name: 'Snapchat' },
    { pattern: /LinkedIn/i, name: 'LinkedIn' },
    { pattern: /Pinterest/i, name: 'Pinterest' },
    { pattern: /GSA\//i, name: 'Google App' }, // Google Search App
    { pattern: /Line\//i, name: 'LINE' },
    { pattern: /WeChat|MicroMessenger/i, name: 'WeChat' },
    { pattern: /Telegram/i, name: 'Telegram' },
  ];
  
  for (const { pattern, name } of inAppPatterns) {
    if (pattern.test(ua)) {
      return { isInApp: true, appName: name };
    }
  }
  
  return { isInApp: false, appName: null };
}

/**
 * Check if the page is served over HTTPS
 * @returns {boolean}
 */
export function isSecureContext() {
  return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
}

/**
 * Check if GPS permission was previously denied
 * @returns {boolean}
 */
export function wasGPSDenied() {
  return localStorage.getItem(PERMISSION_DENIED_KEY) === 'true';
}

/**
 * Mark GPS as denied (to avoid repeated prompts)
 */
function markGPSDenied() {
  localStorage.setItem(PERMISSION_DENIED_KEY, 'true');
}

/**
 * Clear GPS denied flag (e.g., when user explicitly tries again)
 */
export function clearGPSDenied() {
  localStorage.removeItem(PERMISSION_DENIED_KEY);
}

/**
 * Log location event for debugging
 */
function logLocationEvent(event, data = {}) {
  const { isInApp, appName } = detectInAppBrowser();
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    platform: navigator.platform,
    userAgent: navigator.userAgent.substring(0, 100),
    isSecure: isSecureContext(),
    isInApp,
    appName,
    ...data
  };
  console.log('[Location]', event, logData);
}

/**
 * Request GPS location via progressive watch.
 * Resolves with the first acceptable fix (<= 100m), then continues
 * watching for up to 15s, calling onRefine with better positions.
 * @param {Object} options
 * @param {Function} [options.onRefine] - Called with a refined location object
 * @returns {Promise<Object>} {lat, lon, accuracy, source: 'gps'}
 */
export function getGPSLocation(options = {}) {
  const { onRefine } = options;
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      logLocationEvent('gps_not_supported');
      reject(new Error('Geolocation not supported'));
      return;
    }

    logLocationEvent('gps_requesting');

    let watchId = null;
    let hardTimeoutId = null;
    let resolved = false;
    let bestAccuracy = Infinity;
    const watchStartedAt = Date.now();

    function cleanup() {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (hardTimeoutId !== null) {
        clearTimeout(hardTimeoutId);
        hardTimeoutId = null;
      }
    }

    function buildLocation(position) {
      return {
        lat: roundCoord(position.coords.latitude, 4),
        lon: roundCoord(position.coords.longitude, 4),
        accuracy: position.coords.accuracy,
        source: 'gps',
        timestamp: Date.now()
      };
    }

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        const elapsed = Date.now() - watchStartedAt;

        if (!resolved && accuracy <= 100) {
          resolved = true;
          bestAccuracy = accuracy;
          const location = buildLocation(position);
          localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
          logLocationEvent('gps_success', { lat: location.lat, lon: location.lon, accuracy });
          resolve(location);
        } else if (resolved && accuracy < bestAccuracy && accuracy <= 100) {
          bestAccuracy = accuracy;
          const location = buildLocation(position);
          localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
          logLocationEvent('gps_refined', { lat: location.lat, lon: location.lon, accuracy });
          if (typeof onRefine === 'function') {
            onRefine(location);
          }
        }

        if (accuracy <= 30 || elapsed >= 15000) {
          cleanup();
        }
      },
      (error) => {
        cleanup();
        if (!resolved) {
          let message = 'Location unavailable';
          let errorCode = 'unknown';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'GPS permission denied';
              errorCode = 'denied';
              markGPSDenied();
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location unavailable';
              errorCode = 'unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location timed out';
              errorCode = 'timeout';
              break;
          }

          logLocationEvent('gps_failed', { errorCode, message });
          reject(new Error(message));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 600000
      }
    );

    hardTimeoutId = setTimeout(() => {
      if (!resolved) {
        cleanup();
        logLocationEvent('gps_failed', { errorCode: 'timeout', message: 'Location timed out' });
        reject(new Error('Location timed out'));
      }
    }, 15000);
  });
}

/**
 * Get approximate location from IP address
 * @returns {Promise<Object>} {lat, lon, city, source: 'approximate'}
 */
export async function getApproximateLocation() {
  logLocationEvent('approximate_requesting');
  
  try {
    const response = await fetch('/api/location/approximate');
    
    if (!response.ok) {
      throw new Error('Approximate location failed');
    }
    
    const data = await response.json();
    
    const location = {
      lat: data.lat,
      lon: data.lon,
      city: data.city,
      country: data.country,
      source: 'approximate',
      timestamp: Date.now()
    };
    
    // Cache location
    localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
    logLocationEvent('approximate_success', { city: data.city, country: data.country });
    
    return location;
    
  } catch (error) {
    logLocationEvent('approximate_failed', { error: error.message });
    throw new Error('Could not determine approximate location');
  }
}

/**
 * Get cached location from localStorage
 * @returns {Object|null} {lat, lon, source, timestamp} or null
 */
export function getCachedLocation() {
  try {
    const cached = localStorage.getItem(LOCATION_KEY);
    if (!cached) return null;

    const location = JSON.parse(cached);

    // Validate structure
    if (typeof location.lat !== 'number' || typeof location.lon !== 'number') {
      return null;
    }

    return location;
  } catch (error) {
    console.error('Error reading cached location:', error);
    return null;
  }
}

/**
 * Store city search result as location
 * @param {number} lat
 * @param {number} lon
 * @param {string} name - City name
 * @param {string} country - Country name
 */
export function setCityLocation(lat, lon, name, country) {
  const location = {
    lat: roundCoord(lat),
    lon: roundCoord(lon),
    source: 'city_search',
    name,
    country,
    timestamp: Date.now()
  };

  localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
  return location;
}
