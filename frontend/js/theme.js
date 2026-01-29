/**
 * Weather Theme System
 * Abstract museum-poster palette: 5 pigments + white glow
 * 2 hues + glow per screen maximum
 */

// ==================== PALETTE ====================
export const PALETTE = {
  cobalt: '#0410F1',       // Electric Cobalt
  chartreuse: '#C2F970',   // Acid Chartreuse
  ink: '#141115',           // Ink Black
  stone: '#7D7C7A',         // Stone Grey
  sienna: '#A33B20',        // Burnt Sienna
  pearl: '#F0EDEA',         // Pearl White
};

// ==================== GLOW (always white-based) ====================
const GLOW = {
  bright:  { color: PALETTE.pearl, glow: 'rgba(240,237,234,0.5)' },
  faint:   { color: PALETTE.pearl, glow: 'rgba(240,237,234,0.2)' },
  diffuse: { color: PALETTE.pearl, glow: 'rgba(240,237,234,0.3)' },
  sharp:   { color: PALETTE.pearl, glow: 'rgba(240,237,234,0.6)' },
  none:    { color: PALETTE.pearl, glow: 'rgba(240,237,234,0)' },
};

// ==================== WEATHER THEMES ====================
export const WEATHER_THEMES = {
  clearDay:   { from: PALETTE.cobalt,  to: PALETTE.ink,    text: PALETTE.pearl, secondary: 'rgba(194,249,112,0.7)', glow: GLOW.bright },
  clearNight: { from: PALETTE.ink,     to: '#0A0D3A',      text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.5)', glow: GLOW.none },
  overcast:   { from: '#9E9B98',        to: '#3A3540',       text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.55)', glow: GLOW.faint },
  rain:       { from: PALETTE.ink,     to: PALETTE.cobalt,  text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.55)', glow: GLOW.diffuse },
  storm:      { from: PALETTE.sienna,  to: PALETTE.ink,     text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.6)', glow: GLOW.sharp },
  snow:       { from: PALETTE.pearl,   to: PALETTE.stone,   text: PALETTE.ink,   secondary: 'rgba(20,17,21,0.6)', glow: GLOW.bright },
  fog:        { from: PALETTE.stone,   to: PALETTE.pearl,   text: PALETTE.ink,   secondary: 'rgba(20,17,21,0.5)', glow: GLOW.diffuse },
};

/**
 * Determine weather condition from data
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
 * Map condition + day/night to a WEATHER_THEMES key
 */
function getThemeKey(condition, is_day) {
  if (condition === 'clear') return is_day ? 'clearDay' : 'clearNight';
  if (condition === 'overcast') return 'overcast';
  if (condition === 'rain') return 'rain';
  if (condition === 'storm') return 'storm';
  if (condition === 'snow') return 'snow';
  if (condition === 'fog') return 'fog';
  return is_day ? 'clearDay' : 'clearNight';
}

/**
 * Build theme from weather data
 */
export function buildTheme({ is_day, timestamp, rain_probability, cloud_percent, temp_c }) {
  const condition = getCondition(rain_probability, cloud_percent, temp_c);
  const key = getThemeKey(condition, is_day);
  const theme = WEATHER_THEMES[key];
  const isDarkText = theme.text === PALETTE.ink;

  return {
    condition,
    themeKey: key,
    isNight: !is_day,
    // Gradient
    baseFrom: theme.from,
    baseTo: theme.to,
    // Glow
    solarColor: theme.glow.color,
    solarGlow: theme.glow.glow,
    // Text
    textColor: theme.text,
    textSecondary: theme.secondary,
    // For icon filter and glass
    isDarkText,
  };
}

/**
 * Apply theme to document
 */
export function applyTheme(theme) {
  const root = document.documentElement;

  // Base gradient
  root.style.setProperty('--gradient-from', theme.baseFrom);
  root.style.setProperty('--gradient-to', theme.baseTo);

  // Glow
  root.style.setProperty('--solar-color', theme.solarColor);
  root.style.setProperty('--solar-glow', theme.solarGlow);

  // Text
  root.style.setProperty('--text-primary', theme.textColor);
  root.style.setProperty('--text-secondary', theme.textSecondary);

  // Glass and icon styles
  if (theme.isDarkText) {
    // Light background (snow/fog) — dark text, no icon invert
    root.style.setProperty('--glass-bg', 'rgba(0, 0, 0, 0.06)');
    root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.1)');
    root.style.setProperty('--icon-filter', 'none');
  } else {
    // Dark background — light text, invert icons
    root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.08)');
    root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.12)');
    root.style.setProperty('--icon-filter', 'invert(1)');
  }

  // Data attributes for CSS hooks
  root.dataset.condition = theme.condition;
  root.dataset.theme = theme.themeKey;
}

/**
 * Generate hero sentence based on conditions
 */
export function generateHeroSentence(current, hourly) {
  const { rain_probability, cloud_percent, temp_c, wind_speed_ms, is_day } = current;

  const next2Hours = hourly.slice(1, 3);
  const rainComing = next2Hours.some(h => h.rain_probability > 50) && rain_probability < 30;
  const rainStopping = rain_probability > 50 &&
    hourly.slice(2, 4).every(h => h.rain_probability < 30);

  const futureHours = hourly.slice(1, 7);
  const avgFutureTemp = futureHours.reduce((sum, h) => sum + h.temp_c, 0) / futureHours.length;
  const cooling = avgFutureTemp < temp_c - 3;
  const warming = avgFutureTemp > temp_c + 3;

  const hour = new Date().getHours();
  const isEvening = hour >= 17 || hour < 5;
  const isMorning = hour >= 5 && hour < 12;

  if (rain_probability > 70) {
    if (isMorning) return 'Wet start to the day.';
    if (isEvening) return 'A rainy evening ahead.';
    return 'Grab an umbrella.';
  }
  if (rainComing) return 'Dry for now, rain on the way.';
  if (rainStopping) return 'Rain easing off soon.';
  if (rain_probability > 40) return 'Keep an eye on the sky.';
  if (wind_speed_ms > 10) {
    if (temp_c < 8) return 'Biting wind out there.';
    return 'Hold onto your hat.';
  }
  if (cloud_percent > 80 && warming) return 'Grey skies, warming later.';
  if (cloud_percent > 80 && temp_c < 10) {
    if (isMorning) return 'Cold morning under thick cloud.';
    return 'Low cloud hanging around.';
  }
  if (cloud_percent > 70) {
    if (rain_probability < 20) return 'Dry, but dull.';
    return 'Overcast and grey.';
  }
  if (cooling && cloud_percent > 40) return 'Clouds building, cooling off.';
  if (cooling) return 'Turning cooler later.';
  if (warming) {
    if (isMorning) return 'Chilly now, milder later.';
    return 'Warming up nicely.';
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
