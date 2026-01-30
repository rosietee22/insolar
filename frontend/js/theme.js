/**
 * Weather Theme System
 * Luminous, scientific, museum-poster palette
 * Sunlight diffusion, matte pigments, field-guide energy
 * Max 2 pigments + white per screen
 */

// ==================== PALETTE ====================
// Restrained pigments — mineral, printed, sun-bleached
export const PALETTE = {
  sky:     '#F6FAFF',      // Sky White — high-key base
  ice:     '#DCEBFA',      // Ice Blue — cool gradient
  dusk:    '#3A3D55',      // Dusk Indigo — lifted, warm
  stone:   '#B8B6B3',      // Warm Stone — fog/overcast
  clay:    '#A8796B',      // Muted Clay — desaturated warmth
  pearl:   '#F0EDEA',      // Pearl White — snow/neutral
  ink:     '#1A2A3A',      // Soft Ink — dark text
};

// ==================== GLOW (atmospheric diffusion, not spotlight) ====================
const GLOW = {
  sunlight: { color: '#FFFDF7', glow: 'rgba(255,253,247,0.55)' },
  halo:     { color: '#E8E6F0', glow: 'rgba(232,230,240,0.50)' },
  fog:      { color: '#F0EDEA', glow: 'rgba(240,237,234,0.45)' },
  ember:    { color: '#F0DCC8', glow: 'rgba(240,220,200,0.40)' },
  none:     { color: '#F6FAFF', glow: 'rgba(246,250,255,0)' },
};

// Chalk cobalt — mineral, dusty, printed ultramarine
const ACCENT = '#2F5EEA';
const ACCENT_FILTER = 'brightness(0) saturate(100%) invert(32%) sepia(60%) saturate(1800%) hue-rotate(215deg) brightness(92%) contrast(90%)';

// ==================== WEATHER THEMES ====================
// Philosophy: meteorological instrument, museum poster, printed ink on textured paper
export const WEATHER_THEMES = {
  // Pale winter sun, sky glare, washed paper — luminous and airy
  clearDay:      { from: '#FEFCF0', to: '#F5EDDA', text: PALETTE.ink,   secondary: 'rgba(26,42,58,0.45)',   glow: GLOW.sunlight, rain: '#8EACC8' },
  // Cooler version of clear day — grey-blue veil, same lightness
  partlyCloudy:  { from: '#FAF8EE', to: '#EBE6D8', text: PALETTE.ink,   secondary: 'rgba(26,42,58,0.42)',   glow: GLOW.sunlight, rain: '#8EACC8' },
  // Lifted indigo, warm undertone — dusk not nightclub
  clearNight:    { from: '#353850', to: '#2A2D42', text: '#E0DEE8',     secondary: 'rgba(224,222,232,0.45)', glow: GLOW.halo,     rain: '#9AA4C8' },
  // Overcast — warm grey blanket
  overcast:      { from: '#A5A3A0', to: '#6B6870', text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.48)', glow: GLOW.fog,      rain: '#8896B4' },
  // Rain — dark blue-grey, warmer, less saturated
  rain:          { from: '#4A4E5E', to: '#3A3E50', text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.45)', glow: GLOW.fog,      rain: '#A0AACC' },
  // Storm — muted clay to warm indigo, not neon
  storm:         { from: '#8B7368', to: PALETTE.dusk, text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.48)', glow: GLOW.ember, rain: '#D4BEB0' },
  // Snow — cold pale, untouched
  snow:          { from: '#FAFCFF', to: '#E0DDD9', text: PALETTE.ink,   secondary: 'rgba(26,42,58,0.45)',   glow: GLOW.sunlight, rain: '#7B96B8' },
  // Fog — warm diffusion
  fog:           { from: '#D5D2CF', to: PALETTE.pearl, text: PALETTE.ink, secondary: 'rgba(26,42,58,0.40)',  glow: GLOW.fog,      rain: '#7B96B8' },
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
    root.style.setProperty('--accent-color', ACCENT);
    root.style.setProperty('--accent-filter', ACCENT_FILTER);
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
