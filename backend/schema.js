/**
 * JSON Schema for Weather API Response
 * Version 1
 */

// Validate a single hourly forecast object
function validateHourlyData(hourly) {
  const required = ['timestamp', 'temp_c', 'rain_probability', 'rain_amount_mm',
                    'cloud_percent', 'wind_speed_ms', 'wind_direction_deg', 'uv_index'];

  for (const field of required) {
    if (hourly[field] === undefined || hourly[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Type and range validation
  if (typeof hourly.temp_c !== 'number') throw new Error('temp_c must be a number');
  if (typeof hourly.rain_probability !== 'number' || hourly.rain_probability < 0 || hourly.rain_probability > 100) {
    throw new Error('rain_probability must be a number between 0-100');
  }
  if (typeof hourly.rain_amount_mm !== 'number' || hourly.rain_amount_mm < 0) {
    throw new Error('rain_amount_mm must be a non-negative number');
  }
  if (typeof hourly.cloud_percent !== 'number' || hourly.cloud_percent < 0 || hourly.cloud_percent > 100) {
    throw new Error('cloud_percent must be a number between 0-100');
  }
  if (typeof hourly.wind_speed_ms !== 'number' || hourly.wind_speed_ms < 0) {
    throw new Error('wind_speed_ms must be a non-negative number');
  }
  if (typeof hourly.wind_direction_deg !== 'number' || hourly.wind_direction_deg < 0 || hourly.wind_direction_deg >= 360) {
    throw new Error('wind_direction_deg must be a number between 0-359');
  }
  if (typeof hourly.uv_index !== 'number' || hourly.uv_index < 0) {
    throw new Error('uv_index must be a non-negative number');
  }
}

// Validate full forecast response
function validateForecast(data) {
  // Check schema version
  if (data.schema_version !== 1) {
    throw new Error('Invalid or missing schema_version');
  }

  // Validate location
  if (!data.location || typeof data.location !== 'object') {
    throw new Error('Missing or invalid location object');
  }
  if (typeof data.location.lat !== 'number' || typeof data.location.lon !== 'number') {
    throw new Error('lat and lon must be numbers');
  }
  if (data.location.lat < -90 || data.location.lat > 90) {
    throw new Error('lat must be between -90 and 90');
  }
  if (data.location.lon < -180 || data.location.lon > 180) {
    throw new Error('lon must be between -180 and 180');
  }

  // Validate timestamps
  if (!data.generated_at || !data.timezone) {
    throw new Error('Missing generated_at or timezone');
  }

  // Validate current and next_hour
  if (!data.current || typeof data.current !== 'object') {
    throw new Error('Missing or invalid current object');
  }
  if (!data.next_hour || typeof data.next_hour !== 'object') {
    throw new Error('Missing or invalid next_hour object');
  }

  validateHourlyData(data.current);
  validateHourlyData(data.next_hour);

  // Validate hourly array (24-72 hours)
  if (!Array.isArray(data.hourly) || data.hourly.length < 24) {
    throw new Error('hourly must be an array with at least 24 items');
  }

  data.hourly.forEach((hourly, index) => {
    try {
      validateHourlyData(hourly);
    } catch (err) {
      throw new Error(`Invalid hourly data at index ${index}: ${err.message}`);
    }
  });

  return true;
}

module.exports = {
  validateForecast,
  validateHourlyData
};
