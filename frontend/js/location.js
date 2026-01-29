/**
 * Location Handler (GPS + City Search)
 */

const LOCATION_KEY = 'weather_location';

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
 * Request GPS location from browser
 * @returns {Promise<Object>} {lat, lon, source: 'gps'}
 */
export function getGPSLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = roundCoord(position.coords.latitude);
        const lon = roundCoord(position.coords.longitude);

        const location = {
          lat,
          lon,
          source: 'gps',
          timestamp: Date.now()
        };

        // Cache location
        localStorage.setItem(LOCATION_KEY, JSON.stringify(location));

        resolve(location);
      },
      (error) => {
        let message = 'GPS permission denied';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'GPS permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location unavailable';
            break;
          case error.TIMEOUT:
            message = 'GPS timeout';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: false, // Save battery
        timeout: 10000, // 10 seconds
        maximumAge: 0 // No cache
      }
    );
  });
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

/**
 * Clear cached location
 */
export function clearLocation() {
  localStorage.removeItem(LOCATION_KEY);
}
