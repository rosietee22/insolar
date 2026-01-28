/**
 * Weather Theme System
 * Dynamic gradients and colors based on weather conditions and time of day
 */

// Gradient definitions
const GRADIENTS = {
  clearDay: { from: '#FFE4B5', to: '#87CEEB', textColor: '#1A1A2E', isDark: false },
  goldenHour: { from: '#FFB347', to: '#FFCC33', textColor: '#1A1A2E', isDark: false },
  cloudy: { from: '#B8C6D9', to: '#DFE6ED', textColor: '#1A1A2E', isDark: false },
  rainyLight: { from: '#89ABD9', to: '#B8CDE6', textColor: '#1A1A2E', isDark: false },
  rainyHeavy: { from: '#5B7BA3', to: '#8FABC7', textColor: '#FFFFFF', isDark: true },
  nightClear: { from: '#1A1A2E', to: '#16213E', textColor: '#FFFFFF', isDark: true },
  nightCloudy: { from: '#2D3436', to: '#4A5568', textColor: '#FFFFFF', isDark: true },
  stormy: { from: '#4A5568', to: '#6B7B8C', textColor: '#FFFFFF', isDark: true }
};

// Time period constants
const TIME_PERIODS = {
  NIGHT: 'night',
  GOLDEN_MORNING: 'goldenMorning',
  DAY: 'day',
  GOLDEN_EVENING: 'goldenEvening'
};

/**
 * Determine time period from API is_day flag and timestamp
 * Uses is_day from Google Weather API (based on actual sunrise/sunset)
 * @param {boolean} is_day - From API
 * @param {string|Date} timestamp - For golden hour detection
 * @returns {string} TIME_PERIODS value
 */
export function getTimePeriod(is_day, timestamp) {
  // Night determined by actual sunrise/sunset from API
  if (!is_day) return TIME_PERIODS.NIGHT;

  // Golden hour is still time-based for gradient aesthetics
  const date = new Date(timestamp);
  const hour = date.getHours();

  if (hour >= 6 && hour < 8) return TIME_PERIODS.GOLDEN_MORNING;
  if (hour >= 18 && hour < 20) return TIME_PERIODS.GOLDEN_EVENING;
  return TIME_PERIODS.DAY;
}

/**
 * Determine weather type from conditions
 * @param {number} rainProbability
 * @param {number} cloudPercent
 * @returns {string} weather type key
 */
export function getWeatherType(rainProbability, cloudPercent) {
  if (rainProbability > 70) return 'heavyRain';
  if (rainProbability > 60) return 'storm';
  if (rainProbability > 30) return 'lightRain';
  if (cloudPercent > 70) return 'cloudy';
  if (cloudPercent > 30) return 'partlyCloudy';
  return 'clear';
}

/**
 * Select gradient based on weather + time
 * @param {string} weatherType
 * @param {string} timePeriod
 * @returns {Object} gradient definition
 */
export function selectGradient(weatherType, timePeriod) {
  // Night variations
  if (timePeriod === TIME_PERIODS.NIGHT) {
    if (weatherType === 'cloudy' || weatherType === 'partlyCloudy') {
      return GRADIENTS.nightCloudy;
    }
    if (weatherType === 'heavyRain' || weatherType === 'storm' || weatherType === 'lightRain') {
      return GRADIENTS.nightCloudy;
    }
    return GRADIENTS.nightClear;
  }

  // Golden hour
  if (timePeriod === TIME_PERIODS.GOLDEN_MORNING || timePeriod === TIME_PERIODS.GOLDEN_EVENING) {
    if (weatherType === 'heavyRain' || weatherType === 'storm') {
      return GRADIENTS.rainyHeavy;
    }
    if (weatherType === 'lightRain') {
      return GRADIENTS.rainyLight;
    }
    return GRADIENTS.goldenHour;
  }

  // Day variations
  switch (weatherType) {
    case 'heavyRain':
      return GRADIENTS.rainyHeavy;
    case 'storm':
      return GRADIENTS.stormy;
    case 'lightRain':
      return GRADIENTS.rainyLight;
    case 'cloudy':
      return GRADIENTS.cloudy;
    case 'partlyCloudy':
      return GRADIENTS.cloudy;
    default:
      return GRADIENTS.clearDay;
  }
}

/**
 * Apply theme to document
 * @param {Object} gradient
 */
export function applyTheme(gradient) {
  const root = document.documentElement;
  root.style.setProperty('--gradient-from', gradient.from);
  root.style.setProperty('--gradient-to', gradient.to);
  root.style.setProperty('--text-primary', gradient.textColor);
  root.style.setProperty('--text-secondary',
    gradient.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,46,0.6)');

  // Update glass styles based on theme darkness
  if (gradient.isDark) {
    root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.08)');
    root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.15)');
  } else {
    root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.2)');
  }
}

/**
 * Generate hero sentence based on conditions
 * @param {Object} current - Current weather data
 * @param {Array} hourly - Hourly forecast
 * @returns {string}
 */
export function generateHeroSentence(current, hourly) {
  const { rain_probability, cloud_percent, temp_c, wind_speed_ms } = current;

  // Check for incoming rain in next 2 hours
  const next2Hours = hourly.slice(1, 3);
  const rainComing = next2Hours.some(h => h.rain_probability > 50) && rain_probability < 30;
  const rainStopping = rain_probability > 50 &&
    hourly.slice(2, 4).every(h => h.rain_probability < 30);

  // Temperature trend (compare next 6 hours)
  const futureHours = hourly.slice(1, 7);
  const avgFutureTemp = futureHours.reduce((sum, h) => sum + h.temp_c, 0) / futureHours.length;
  const cooling = avgFutureTemp < temp_c - 3;
  const warming = avgFutureTemp > temp_c + 3;

  // Priority-based sentence selection
  if (rain_probability > 70) {
    return 'Heavy rain. Take an umbrella.';
  }
  if (rainComing) {
    return 'Rain starting soon.';
  }
  if (rainStopping) {
    return 'Rain clearing shortly.';
  }
  if (rain_probability > 40) {
    return 'Chance of rain today.';
  }
  if (wind_speed_ms > 10) {
    return 'Windy conditions.';
  }
  if (cooling) {
    return 'Cooling down later.';
  }
  if (warming) {
    return 'Warming up today.';
  }
  if (cloud_percent > 70) {
    return 'Overcast skies.';
  }
  if (cloud_percent > 30) {
    return 'Partly cloudy.';
  }
  return 'Clear skies ahead.';
}

// Export gradients for default theme
export { GRADIENTS };
