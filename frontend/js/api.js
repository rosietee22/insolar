/**
 * API Client for Weather Backend
 * Auth is handled via HTTP-only session cookie (set by server on page load)
 */

const API_BASE = window.location.origin;

/**
 * Fetch weather forecast for given coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Forecast data
 */
export async function getForecast(lat, lon) {
  const url = `${API_BASE}/api/forecast?lat=${lat}&lon=${lon}`;

  try {
    const response = await fetch(url, {
      credentials: 'same-origin',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Session expired — reload the page');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach server');
    }
    throw error;
  }
}

/**
 * Fetch bird observation data for given coordinates
 * @param {number} lat
 * @param {number} lon
 * @param {Object} weather - { temp_c, rain_probability, wind_speed_ms, cloud_percent }
 * @returns {Promise<Object>} Bird data
 */
export async function getBirdData(lat, lon, weather = {}) {
  const params = new URLSearchParams({ lat, lon });
  if (weather.temp_c !== undefined) params.set('temp_c', weather.temp_c);
  if (weather.rain_probability !== undefined) params.set('rain', weather.rain_probability);
  if (weather.wind_speed_ms !== undefined) params.set('wind', weather.wind_speed_ms);
  if (weather.cloud_percent !== undefined) params.set('cloud', weather.cloud_percent);

  const url = `${API_BASE}/api/birds?${params}`;

  try {
    const response = await fetch(url, {
      credentials: 'same-origin',
    });

    if (!response.ok) {
      if (response.status === 503) {
        throw new Error('Bird data unavailable');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach server');
    }
    throw error;
  }
}

/**
 * Search for a city by name
 * @param {string} query - City name
 * @returns {Promise<Object>} Location data {lat, lon, name}
 */
export async function searchCity(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('City search failed');
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error('City not found');
    }

    const result = data.results[0];
    return {
      lat: result.latitude,
      lon: result.longitude,
      name: result.name,
      country: result.country
    };

  } catch (error) {
    throw new Error(`City search error: ${error.message}`);
  }
}
