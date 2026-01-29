/**
 * Weather Theme System
 * Dynamic gradients and colors based on weather conditions and time of day
 */

// Semantic gradient definitions - bold, distinct colours
const GRADIENTS = {
  clearDay: { from: '#87CEEB', to: '#E0F4FF', textColor: '#1A1A2E', isDark: false },      // Sky blue
  goldenHour: { from: '#FF9966', to: '#FF5E62', textColor: '#FFFFFF', isDark: true },     // Coral sunset
  cloudy: { from: '#6B7B8C', to: '#8899A6', textColor: '#FFFFFF', isDark: true },         // Cool slate
  rainyLight: { from: '#4A6670', to: '#5A7A85', textColor: '#FFFFFF', isDark: true },     // Teal-slate
  rainyHeavy: { from: '#3A5A64', to: '#4A6A74', textColor: '#FFFFFF', isDark: true },     // Deep teal
  nightClear: { from: '#1A1A2E', to: '#2C3E50', textColor: '#FFFFFF', isDark: true },     // Deep indigo
  nightCloudy: { from: '#2C3E50', to: '#34495E', textColor: '#FFFFFF', isDark: true },
  stormy: { from: '#4A5568', to: '#2D3748', textColor: '#FFFFFF', isDark: true },         // Storm grey
  frost: { from: '#A8D8EA', to: '#CAE9F5', textColor: '#1A1A2E', isDark: false }           // Ice blue
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
 * Select gradient based on weather + time + temperature
 * @param {string} weatherType
 * @param {string} timePeriod
 * @param {number} temp_c - Optional temperature for frost detection
 * @returns {Object} gradient definition
 */
export function selectGradient(weatherType, timePeriod, temp_c = null) {
  // Frost gradient for very cold clear days
  if (temp_c !== null && temp_c < 3 && weatherType === 'clear' && timePeriod !== TIME_PERIODS.NIGHT) {
    return GRADIENTS.frost;
  }
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
    root.style.setProperty('--icon-filter', 'invert(1)');
  } else {
    root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.2)');
    root.style.setProperty('--icon-filter', 'none');
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

  // Check time of day for context
  const hour = new Date().getHours();
  const isEvening = hour >= 17 || hour < 5;
  const isMorning = hour >= 5 && hour < 12;

  // Priority-based editorial headlines
  if (rain_probability > 70) {
    if (isMorning) return 'Wet start to the day.';
    if (isEvening) return 'A rainy evening ahead.';
    return 'Grab an umbrella.';
  }
  if (rainComing) {
    return 'Dry for now, rain on the way.';
  }
  if (rainStopping) {
    return 'Rain easing off soon.';
  }
  if (rain_probability > 40) {
    return 'Keep an eye on the sky.';
  }
  if (wind_speed_ms > 10) {
    if (temp_c < 8) return 'Biting wind out there.';
    return 'Hold onto your hat.';
  }
  if (cloud_percent > 80 && warming) {
    return 'Grey skies, warming later.';
  }
  if (cloud_percent > 80 && temp_c < 10) {
    if (isMorning) return 'Cold morning under thick cloud.';
    return 'Low cloud hanging around.';
  }
  if (cloud_percent > 70) {
    if (rain_probability < 20) return 'Dry, but dull.';
    return 'Overcast and grey.';
  }
  if (cooling && cloud_percent > 40) {
    return 'Clouds building, cooling off.';
  }
  if (cooling) {
    return `Turning cooler later.`;
  }
  if (warming) {
    if (isMorning) return 'Chilly now, milder later.';
    return `Warming up nicely.`;
  }
  if (cloud_percent > 30) {
    if (is_day) return 'Patches of sun.';
    return 'Partly cloudy tonight.';
  }
  if (is_day) {
    if (temp_c > 20) return 'Beautiful day ahead.';
    return 'Clear and bright.';
  }
  return 'A clear night.';
}

// Export gradients for default theme
export { GRADIENTS };
