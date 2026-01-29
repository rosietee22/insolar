/**
 * Weather Theme System
 * Museum-poster inspired palette with seasonal bases, condition overlays, and solar glow
 * Three-layer approach: Season + Condition + Solar time
 * Limited to 2-3 pigments per screen
 */

// ==================== SEASONAL PALETTES ====================
const SEASONS = {
  winter: {
    primary: '#1E3A5F',     // Arctic Cobalt
    secondary: '#4A7C9B',   // Glacier Blue
    highlight: '#E8E4DF',   // Pearl
    nightPrimary: '#1E1B4B', // Midnight Indigo
    nightSecondary: '#312E81'
  },
  spring: {
    primary: '#0891B2',     // Cyan
    secondary: '#4ADE80',   // Chlorophyll
    highlight: '#FEF7E8',   // Warm Cream
    nightPrimary: '#0D4A4A', // Deep Teal
    nightSecondary: '#134E4A'
  },
  summer: {
    primary: '#1D4ED8',     // Ultramarine
    secondary: '#FBBF24',   // Sun Gold
    highlight: '#FAF5F0',   // Linen
    nightPrimary: '#312E81', // Navy Violet
    nightSecondary: '#1E1B4B'
  },
  autumn: {
    primary: '#1E3A4C',     // Petrol Blue
    secondary: '#C2410C',   // Rust
    highlight: '#9CA3AF',   // Smoke
    nightPrimary: '#2D1F3D', // Charcoal Plum
    nightSecondary: '#1E1B4B'
  }
};

// ==================== CONDITION OVERLAYS ====================
const CONDITIONS = {
  clear: { color1: '#1E40AF', color2: '#3B82F6', opacity: 0.3 },       // Cobalt Veil
  overcast: { color1: '#6B7280', color2: '#9CA3AF', opacity: 0.5 },    // Stone Grey
  rain: { color1: '#134E4A', color2: '#0F172A', opacity: 0.6 },        // Teal Black
  fog: { color1: '#D4C4B5', color2: '#E7E0D8', opacity: 0.4 },         // Milky Taupe
  storm: { color1: '#581C87', color2: '#1E1B4B', opacity: 0.7 },       // Bruised Purple
  snow: { color1: '#E0F2FE', color2: '#BAE6FD', opacity: 0.35 }        // Electric Ice
};

// ==================== SOLAR GLOW ====================
const SOLAR = {
  dawn: { color: '#FDBA74', glow: 'rgba(253,186,116,0.4)' },           // Dawn Peach
  noon: { color: '#FEF3C7', glow: 'rgba(254,243,199,0.5)' },           // Noon White-Gold
  dusk: { color: '#F97316', glow: 'rgba(249,115,22,0.4)' },            // Dusk Amber
  night: { color: '#7C3AED', glow: 'rgba(124,58,237,0.3)' }            // Night Ultraviolet
};

// Time period constants
const TIME_PERIODS = {
  NIGHT: 'night',
  DAWN: 'dawn',
  DAY: 'day',
  DUSK: 'dusk'
};

/**
 * Get current season based on date (Northern Hemisphere)
 * @param {Date} date
 * @returns {string} season key
 */
export function getSeason(date = new Date()) {
  const month = date.getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'spring';   // Mar-May
  if (month >= 5 && month <= 7) return 'summer';   // Jun-Aug
  if (month >= 8 && month <= 10) return 'autumn';  // Sep-Nov
  return 'winter';                                  // Dec-Feb
}

/**
 * Determine time period from timestamp and sunrise/sunset times
 * Uses actual sunrise/sunset for accurate solar positioning
 * @param {boolean} is_day - From API
 * @param {string|Date} timestamp
 * @param {string|Date} sunrise - Optional sunrise time
 * @param {string|Date} sunset - Optional sunset time
 * @returns {string} TIME_PERIODS value
 */
export function getTimePeriod(is_day, timestamp, sunrise = null, sunset = null) {
  if (!is_day) return TIME_PERIODS.NIGHT;

  const now = new Date(timestamp);
  
  // If we have sunrise/sunset, use them for accurate dawn/dusk detection
  if (sunrise && sunset) {
    const sunriseTime = new Date(sunrise);
    const sunsetTime = new Date(sunset);
    
    // Dawn: 30 min before to 90 min after sunrise
    const dawnStart = new Date(sunriseTime.getTime() - 30 * 60 * 1000);
    const dawnEnd = new Date(sunriseTime.getTime() + 90 * 60 * 1000);
    
    // Dusk: 90 min before to 30 min after sunset
    const duskStart = new Date(sunsetTime.getTime() - 90 * 60 * 1000);
    const duskEnd = new Date(sunsetTime.getTime() + 30 * 60 * 1000);
    
    if (now >= dawnStart && now <= dawnEnd) return TIME_PERIODS.DAWN;
    if (now >= duskStart && now <= duskEnd) return TIME_PERIODS.DUSK;
    return TIME_PERIODS.DAY;
  }
  
  // Fallback to fixed hours if no sunrise/sunset available
  const hour = now.getHours();
  if (hour >= 5 && hour < 8) return TIME_PERIODS.DAWN;
  if (hour >= 16 && hour < 19) return TIME_PERIODS.DUSK;
  return TIME_PERIODS.DAY;
}

/**
 * Get solar glow based on time period
 * @param {string} timePeriod
 * @returns {Object} solar definition
 */
export function getSolarGlow(timePeriod) {
  switch (timePeriod) {
    case TIME_PERIODS.DAWN: return SOLAR.dawn;
    case TIME_PERIODS.DUSK: return SOLAR.dusk;
    case TIME_PERIODS.NIGHT: return SOLAR.night;
    default: return SOLAR.noon;
  }
}

/**
 * Determine weather condition for overlay
 * @param {number} rainProbability
 * @param {number} cloudPercent
 * @param {number} temp_c
 * @returns {string} condition key
 */
export function getCondition(rainProbability, cloudPercent, temp_c = 10) {
  if (temp_c < 2 && rainProbability > 30) return 'snow';
  if (rainProbability > 70) return 'storm';
  if (rainProbability > 30) return 'rain';
  if (cloudPercent > 85) return 'fog';
  if (cloudPercent > 50) return 'overcast';
  return 'clear';
}

/**
 * Get condition overlay
 * @param {string} condition
 * @returns {Object} condition overlay definition
 */
export function getConditionOverlay(condition) {
  return CONDITIONS[condition] || CONDITIONS.clear;
}

/**
 * Build complete theme from three layers: Season + Condition + Solar
 * @param {Object} params
 * @returns {Object} Complete theme object
 */
export function buildTheme({ is_day, timestamp, rain_probability, cloud_percent, temp_c, sunrise, sunset }) {
  const season = getSeason(new Date(timestamp));
  const seasonPalette = SEASONS[season];
  const timePeriod = getTimePeriod(is_day, timestamp, sunrise, sunset);
  const condition = getCondition(rain_probability, cloud_percent, temp_c);
  const conditionOverlay = getConditionOverlay(condition);
  const solar = getSolarGlow(timePeriod);
  
  const isNight = timePeriod === TIME_PERIODS.NIGHT;
  
  // Select base colours (night uses hue-shifted variants)
  const baseFrom = isNight ? seasonPalette.nightPrimary : seasonPalette.primary;
  const baseTo = isNight ? seasonPalette.nightSecondary : seasonPalette.secondary;
  const textColor = seasonPalette.highlight;
  
  return {
    season,
    condition,
    timePeriod,
    isNight,
    // Base gradient
    baseFrom,
    baseTo,
    // Condition overlay
    overlayColor1: conditionOverlay.color1,
    overlayColor2: conditionOverlay.color2,
    overlayOpacity: conditionOverlay.opacity,
    // Solar glow
    solarColor: solar.color,
    solarGlow: solar.glow,
    // Text
    textColor,
    textSecondary: isNight ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.75)'
  };
}

/**
 * Apply theme to document (three-layer system)
 * @param {Object} theme - From buildTheme()
 */
export function applyTheme(theme) {
  const root = document.documentElement;
  
  // Base gradient
  root.style.setProperty('--gradient-from', theme.baseFrom);
  root.style.setProperty('--gradient-to', theme.baseTo);
  
  // Condition overlay
  root.style.setProperty('--overlay-color1', theme.overlayColor1);
  root.style.setProperty('--overlay-color2', theme.overlayColor2);
  root.style.setProperty('--overlay-opacity', theme.overlayOpacity);
  
  // Solar glow
  root.style.setProperty('--solar-color', theme.solarColor);
  root.style.setProperty('--solar-glow', theme.solarGlow);
  
  // Text
  root.style.setProperty('--text-primary', theme.textColor);
  root.style.setProperty('--text-secondary', theme.textSecondary);

  // Glass and icon styles (always dark theme for museum-poster look)
  root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.08)');
  root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.12)');
  root.style.setProperty('--icon-filter', 'invert(1)');
  
  // Add data attributes for CSS hooks
  root.dataset.season = theme.season;
  root.dataset.condition = theme.condition;
  root.dataset.period = theme.timePeriod;
}

// Keep old functions for backwards compatibility
export function getWeatherType(rainProbability, cloudPercent) {
  return getCondition(rainProbability, cloudPercent);
}

export function selectGradient(weatherType, timePeriod, temp_c = null) {
  // Legacy wrapper - returns basic gradient object
  const season = getSeason();
  const seasonPalette = SEASONS[season];
  const isNight = timePeriod === TIME_PERIODS.NIGHT;
  
  return {
    from: isNight ? seasonPalette.nightPrimary : seasonPalette.primary,
    to: isNight ? seasonPalette.nightSecondary : seasonPalette.secondary,
    textColor: seasonPalette.highlight,
    isDark: true
  };
}

/**
 * Generate hero sentence based on conditions
 * @param {Object} current - Current weather data
 * @param {Array} hourly - Hourly forecast
 * @returns {string}
 */
export function generateHeroSentence(current, hourly) {
  const { rain_probability, cloud_percent, temp_c, wind_speed_ms, is_day } = current;

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

// Export palettes for external use
export { SEASONS, CONDITIONS, SOLAR };
