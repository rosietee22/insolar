/**
 * Abstract Weather Provider Interface
 *
 * All weather data providers must implement the getForecast method.
 * This allows easy swapping between mock data (Phase 1) and Earth-2 (Phase 2).
 */

class WeatherProvider {
  /**
   * Fetch weather forecast for given coordinates
   *
   * @param {number} lat - Latitude (-90 to 90)
   * @param {number} lon - Longitude (-180 to 180)
   * @returns {Promise<Object>} Forecast data matching schema v1
   */
  async getForecast(lat, lon) {
    throw new Error('WeatherProvider.getForecast() must be implemented by subclass');
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getName() {
    return this.constructor.name;
  }
}

module.exports = WeatherProvider;
