const WeatherProvider = require('./base');

/**
 * Google Weather API Provider
 *
 * Uses Google's WeatherNext AI model (successor to GenCast)
 * Same AI that powers Google Weather app and Pixel Weather
 *
 * API Docs: https://developers.google.com/maps/documentation/weather/overview
 */
class GoogleWeatherProvider extends WeatherProvider {
  constructor() {
    super();
    this.apiKey = process.env.GOOGLE_WEATHER_API_KEY;
    this.baseUrl = 'https://weather.googleapis.com/v1';
  }

  async getForecast(lat, lon) {
    if (!this.apiKey || this.apiKey === 'your_google_api_key_here') {
      throw new Error('GOOGLE_WEATHER_API_KEY not configured. Get one at: https://developers.google.com/maps/documentation/weather/get-api-key');
    }

    // Round coordinates to 3 decimals for better accuracy (~100m)
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLon = Math.round(lon * 1000) / 1000;

    // Fetch weather, daily forecast, and location name in parallel
    const [weatherData, dailyData, locationName] = await Promise.all([
      this.fetchWeather(roundedLat, roundedLon),
      this.fetchDailyForecast(roundedLat, roundedLon),
      this.reverseGeocode(roundedLat, roundedLon)
    ]);

    if (!weatherData.forecastHours || weatherData.forecastHours.length === 0) {
      throw new Error('No forecast data returned from Google Weather API');
    }

    // Transform Google's format to our schema
    const hourlyData = weatherData.forecastHours.map(hour => this.transformHour(hour));
    
    // Transform daily forecast (next 3 days, skip today)
    const dailyForecast = dailyData?.forecastDays?.slice(1, 4).map(day => this.transformDay(day)) || [];

    // Get timezone from the first hour's UTC offset
    const utcOffsetSeconds = parseInt(weatherData.forecastHours[0].displayDateTime?.utcOffset?.replace('s', '') || '0');
    const timezone = this.getTimezoneFromOffset(utcOffsetSeconds);

    return {
      schema_version: 1,
      location: {
        name: locationName,
        lat: roundedLat,
        lon: roundedLon,
        rounded_to: 2,
        source: 'gps'
      },
      generated_at: new Date().toISOString(),
      timezone: timezone,
      current: hourlyData[0],
      next_hour: hourlyData[1],
      hourly: hourlyData,
      daily: dailyForecast
    };
  }

  async fetchWeather(lat, lon) {
    const url = `${this.baseUrl}/forecast/hours:lookup?` + new URLSearchParams({
      key: this.apiKey,
      'location.latitude': lat,
      'location.longitude': lon,
      hours: 24
    });

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Weather API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async fetchDailyForecast(lat, lon) {
    try {
      const url = `${this.baseUrl}/forecast/days:lookup?` + new URLSearchParams({
        key: this.apiKey,
        'location.latitude': lat,
        'location.longitude': lon,
        days: 5
      });

      const response = await fetch(url);
      if (!response.ok) return null;
      return response.json();
    } catch (err) {
      console.warn('Daily forecast fetch failed:', err.message);
      return null;
    }
  }

  transformDay(day) {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const date = new Date(day.interval?.startTime || new Date());
    const dayName = date.toDateString() === new Date(Date.now() + 86400000).toDateString() 
      ? 'Tomorrow' 
      : weekDays[date.getDay()];

    const maxRain = day.daytimeForecast?.precipitation?.probability?.percent || 0;
    const avgCloud = this.estimateCloudCover(day.daytimeForecast?.weatherCondition?.type);

    let condition = 'Clear';
    if (maxRain > 50) condition = 'Rain likely';
    else if (maxRain > 25) condition = 'Chance of rain';
    else if (avgCloud > 70) condition = 'Cloudy';
    else if (avgCloud > 30) condition = 'Partly cloudy';

    return {
      name: dayName,
      low: Math.round(day.minTemperature?.degrees || 0),
      high: Math.round(day.maxTemperature?.degrees || 0),
      condition,
      maxRain,
      avgCloud
    };
  }

  async reverseGeocode(lat, lon) {
    try {
      // Use OpenStreetMap Nominatim (free, no API key needed)
      const url = `https://nominatim.openstreetmap.org/reverse?` + new URLSearchParams({
        lat: lat,
        lon: lon,
        format: 'json',
        zoom: 16  // Neighbourhood level
      });

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WeatherPWA/1.0'  // Required by Nominatim
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      // Extract most specific location name (borough/suburb first)
      const address = data.address || {};
      const name = address.suburb ||
                   address.neighbourhood ||
                   address.borough ||
                   address.quarter ||
                   address.town ||
                   address.village ||
                   address.city ||
                   address.municipality ||
                   data.name;

      return name || null;
    } catch (err) {
      // Don't fail the whole request if geocoding fails
      console.warn('Reverse geocoding failed:', err.message);
      return null;
    }
  }

  transformHour(hour) {
    // Extract temperature (convert to Celsius if needed)
    let temp_c = hour.temperature?.degrees || 0;
    if (hour.temperature?.unit === 'FAHRENHEIT') {
      temp_c = (temp_c - 32) * 5 / 9;
    }

    // Extract rain probability and amount
    const rain_probability = hour.precipitation?.probability?.percent || 0;
    const rain_amount_mm = hour.precipitation?.qpf?.quantity || 0;

    // Extract wind data
    const wind_direction_deg = hour.wind?.direction?.degrees || 0;
    // Google returns speed in km/h or m/s depending on config, convert to m/s
    let wind_speed_ms = hour.wind?.speed?.value || 0;
    if (hour.wind?.speed?.unit === 'KILOMETERS_PER_HOUR') {
      wind_speed_ms = wind_speed_ms / 3.6;
    } else if (hour.wind?.speed?.unit === 'MILES_PER_HOUR') {
      wind_speed_ms = wind_speed_ms * 0.44704;
    }

    // UV index
    const uv_index = hour.uvIndex || 0;

    // Cloud cover - estimate from weather condition if not directly available
    const cloud_percent = this.estimateCloudCover(hour.weatherCondition?.type);

    // Build timestamp from interval
    const timestamp = hour.interval?.startTime || new Date().toISOString();

    // isDaytime from Google API (based on actual sunrise/sunset)
    const is_day = hour.isDaytime ?? true;

    return {
      timestamp,
      temp_c: Math.round(temp_c * 10) / 10,
      rain_probability: Math.round(rain_probability),
      rain_amount_mm: Math.round(rain_amount_mm * 10) / 10,
      cloud_percent: Math.round(cloud_percent),
      wind_speed_ms: Math.round(wind_speed_ms * 10) / 10,
      wind_direction_deg: Math.round(wind_direction_deg),
      uv_index: Math.round(uv_index),
      is_day
    };
  }

  estimateCloudCover(conditionType) {
    // Map Google weather condition types to approximate cloud cover
    const cloudMap = {
      'CLEAR': 0,
      'MOSTLY_CLEAR': 15,
      'PARTLY_CLOUDY': 40,
      'MOSTLY_CLOUDY': 70,
      'CLOUDY': 90,
      'OVERCAST': 100,
      'FOG': 100,
      'LIGHT_FOG': 80,
      'DRIZZLE': 80,
      'RAIN': 85,
      'RAIN_SHOWERS': 75,
      'HEAVY_RAIN': 95,
      'SNOW': 90,
      'SNOW_SHOWERS': 80,
      'THUNDERSTORM': 95,
      'HAIL': 90
    };

    return cloudMap[conditionType] ?? 50;
  }

  getTimezoneFromOffset(offsetSeconds) {
    // Convert offset seconds to timezone string
    // This is a simplification - in production you might use a proper timezone lookup
    const hours = Math.abs(offsetSeconds) / 3600;
    const sign = offsetSeconds >= 0 ? '+' : '-';
    return `UTC${sign}${hours}`;
  }
}

module.exports = GoogleWeatherProvider;
