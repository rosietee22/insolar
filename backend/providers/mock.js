const WeatherProvider = require('./base');

/**
 * Mock Weather Provider
 *
 * Returns hardcoded realistic weather data for Phase 1 testing.
 * Data simulates UK winter weather (10-15°C, variable rain).
 */
class MockProvider extends WeatherProvider {
  async getForecast(lat, lon) {
    // Round coordinates to 2 decimals for privacy
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLon = Math.round(lon * 100) / 100;

    // Generate 24 hours of forecast data
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);

    const hourlyData = [];

    for (let i = 0; i < 72; i++) {
      const timestamp = new Date(currentHour.getTime() + i * 3600000);

      // Generate realistic varying weather
      const hour = timestamp.getHours();

      // Temperature: cooler at night, warmer during day
      const baseTemp = 12;
      const tempVariation = Math.sin((hour - 6) * Math.PI / 12) * 3; // +3°C at 3pm, -3°C at 3am
      const temp_c = Math.round((baseTemp + tempVariation + Math.random() * 2 - 1) * 10) / 10;

      // Rain: more likely in morning and evening
      const rainBase = (hour < 9 || hour > 18) ? 40 : 20;
      const rain_probability = Math.min(100, Math.max(0, rainBase + Math.random() * 40 - 20));
      const rain_amount_mm = rain_probability > 50 ? Math.round(rain_probability / 50 * Math.random() * 2 * 10) / 10 : 0;

      // Cloud cover: correlates with rain
      const cloud_percent = Math.min(100, Math.max(20, rain_probability + Math.random() * 30 - 15));

      // Wind: varies throughout day
      const wind_speed_ms = Math.round((3 + Math.random() * 5) * 10) / 10;
      const wind_direction_deg = Math.floor(Math.random() * 360);

      // UV: low in winter, peaks midday
      const uv_index = (hour >= 11 && hour <= 15) ? Math.min(3, Math.floor(Math.random() * 3) + 1) : 0;

      hourlyData.push({
        timestamp: timestamp.toISOString(),
        temp_c,
        rain_probability: Math.round(rain_probability),
        rain_amount_mm,
        cloud_percent: Math.round(cloud_percent),
        wind_speed_ms,
        wind_direction_deg,
        uv_index
      });
    }

    return {
      schema_version: 1,
      location: {
        name: 'Mock Location',
        lat: roundedLat,
        lon: roundedLon,
        rounded_to: 2,
        source: 'gps'
      },
      generated_at: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      current: hourlyData[0],
      next_hour: hourlyData[1],
      hourly: hourlyData
    };
  }
}

module.exports = MockProvider;
