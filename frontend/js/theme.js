/**
 * Weather Theme System
 * Luminous, scientific, museum-poster palette
 * Sunlight diffusion, matte pigments, field-guide energy
 * Max 2 pigments + white per screen
 */

// ==================== PALETTE ====================
export const PALETTE = {
  sky:     '#F6FAFF',      // Sky White — high-key base
  ice:     '#DCEBFA',      // Ice Blue — cool gradient
  dusk:    '#2A2D52',      // Dusk Indigo — chromatic dark
  stone:   '#B8B6B3',      // Warm Stone — fog/overcast
  clay:    '#C4654D',      // Warm Clay — storm accent
  pearl:   '#F0EDEA',      // Pearl White — snow/neutral
  ink:     '#1A2A3A',      // Soft Ink — dark text
};

// ==================== GLOW (sunlight diffusion, not spotlight) ====================
const GLOW = {
  sunlight: { color: '#FFFDF7', glow: 'rgba(255,253,247,0.60)' },
  halo:     { color: '#E8E6F0', glow: 'rgba(232,230,240,0.55)' },
  fog:      { color: '#F0EDEA', glow: 'rgba(240,237,234,0.50)' },
  ember:    { color: '#FFE8D0', glow: 'rgba(255,232,208,0.45)' },
  none:     { color: '#F6FAFF', glow: 'rgba(246,250,255,0)' },
};

// ==================== WEATHER THEMES ====================
export const WEATHER_THEMES = {
  clearDay:      { from: '#FFFBF0',     to: '#FAE8C8',     text: PALETTE.ink,   secondary: 'rgba(26,42,58,0.50)',   glow: GLOW.sunlight, rain: '#7BA3D4' },
  partlyCloudy:  { from: '#F5F2ED',     to: '#E8E3D8',     text: PALETTE.ink,   secondary: 'rgba(26,42,58,0.45)',   glow: GLOW.sunlight, rain: '#7BA3D4' },
  clearNight:    { from: '#2A2D52',     to: '#1E2145',     text: '#E8E6F0',     secondary: 'rgba(232,230,240,0.50)', glow: GLOW.halo,     rain: '#A0AAD4' },
  overcast:      { from: '#A5A3A0',     to: '#5D5A65',     text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.50)', glow: GLOW.fog,      rain: '#8896B4' },
  rain:       { from: '#3B425F',     to: '#2F3A66',     text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.50)', glow: GLOW.fog,      rain: '#A8B8D8' },
  storm:      { from: PALETTE.clay,  to: PALETTE.dusk,  text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.55)', glow: GLOW.ember,    rain: '#FFD4C8' },
  snow:       { from: '#FAFCFF',     to: '#E0DDD9',     text: PALETTE.ink,   secondary: 'rgba(26,42,58,0.50)',   glow: GLOW.sunlight, rain: '#5B7DB8' },
  fog:        { from: '#D5D2CF',     to: PALETTE.pearl,  text: PALETTE.ink,   secondary: 'rgba(26,42,58,0.45)',   glow: GLOW.fog,      rain: '#5B7DB8' },
};

/**
 * Determine weather condition from data
 */
function getCondition(rainProbability, cloudPercent, temp_c = 10) {
  if (temp_c < 2 && rainProbability > 30) return 'snow';
  if (rainProbability > 70) return 'storm';
  if (rainProbability > 30) return 'rain';
  if (cloudPercent > 85) return 'fog';
  if (cloudPercent > 50) return 'overcast';
  if (cloudPercent > 30) return 'partlyCloudy';
  return 'clear';
}

/**
 * Map condition + day/night to a WEATHER_THEMES key
 */
function getThemeKey(condition, is_day) {
  if (condition === 'clear') return is_day ? 'clearDay' : 'clearNight';
  if (condition === 'partlyCloudy') return is_day ? 'partlyCloudy' : 'clearNight';
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
    // Rain accent
    rainColor: theme.rain,
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

  // Rain accent
  root.style.setProperty('--rain-color', theme.rainColor);

  // Glass, icon, and accent styles
  if (theme.isDarkText) {
    // Light background — dark text, cobalt accent, no icon invert
    root.style.setProperty('--glass-bg', 'rgba(0, 0, 0, 0.06)');
    root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.1)');
    root.style.setProperty('--icon-filter', 'none');
    root.style.setProperty('--accent-color', '#0000FF');
    root.style.setProperty('--accent-filter', 'brightness(0) saturate(100%) invert(11%) sepia(100%) saturate(7461%) hue-rotate(245deg) brightness(96%) contrast(144%)');
  } else {
    // Dark background — light text, accent matches text, invert icons
    root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.08)');
    root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.12)');
    root.style.setProperty('--icon-filter', 'invert(1)');
    root.style.setProperty('--accent-color', theme.textColor);
    root.style.setProperty('--accent-filter', 'invert(1)');
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
