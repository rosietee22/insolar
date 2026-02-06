/**
 * Weather Theme System
 * Luminous, scientific, museum-poster palette
 * Sunlight diffusion, matte pigments, field-guide energy
 * Max 2 pigments + white per screen
 */

// ==================== PALETTE ====================
// Restrained pigments — mineral, printed, sun-bleached
export const PALETTE = {
  sky:     '#F8F6F0',      // Warm bone — light base
  ice:     '#E8E4DA',      // Warm grey — cool gradient
  dusk:    '#363950',      // Deep slate — dark state
  stone:   '#9B9994',      // Darker stone — fog/overcast
  clay:    '#8B6F63',      // Deep earth — warm accent
  pearl:   '#F0EDEA',      // Pearl white — glow/highlight
  ink:     '#2B2E3A',      // Warm graphite — dark text
};

// ==================== GLOW (atmospheric diffusion, not spotlight) ====================
const GLOW = {
  sunlight: { color: '#FFFDF7', glow: 'rgba(255,253,247,0.55)' },
  diffused: { color: '#FFFDF7', glow: 'rgba(255,253,247,0.25)' },
  halo:     { color: '#E8E6F0', glow: 'rgba(232,230,240,0.50)' },
  fog:      { color: '#F0EDEA', glow: 'rgba(240,237,234,0.45)' },
  ember:    { color: '#F0DCC8', glow: 'rgba(240,220,200,0.40)' },
  none:     { color: '#F8F6F0', glow: 'rgba(248,246,240,0)' },
};

// Chalk cobalt — mineral, dusty, printed ultramarine
export const ACCENT = '#2F5EEA';
const ACCENT_FILTER = 'brightness(0) saturate(100%) invert(32%) sepia(60%) saturate(1800%) hue-rotate(215deg) brightness(92%) contrast(90%)';

// ==================== WEATHER THEMES ====================
// Philosophy: meteorological instrument, museum poster, printed ink on textured paper
// Light strip: symmetric gradient (edge → mid → edge)
const STRIP = {
  sunlight: { edge: '#C4B899', mid: '#F5E8B0' },   // Warm gold — clear/sunny
  night:    { edge: '#2A2D52', mid: '#5D5A7A' },    // Deep blue — after dark
  overcast: { edge: '#7A7670', mid: '#A8A090' },    // Muted stone — diffused daylight
  rain:     { edge: '#5A5750', mid: '#7A7468' },     // Dark subdued — wet conditions
};

export const WEATHER_THEMES = {
  clearDay:      { from: '#FDF9F0', to: '#EDE6D6', text: PALETTE.ink,   secondary: 'rgba(43,46,58,0.42)',   glow: GLOW.sunlight, rain: '#8898B8', strip: STRIP.sunlight, bloom: 'radial-gradient(circle at 35% 28%, rgba(255,236,200,0.55), transparent 60%)' },
  partlyCloudy:  { from: '#F3F4F1', to: '#DDD9CF', text: PALETTE.ink,   secondary: 'rgba(43,46,58,0.55)',   glow: GLOW.diffused, rain: '#8898B8', strip: STRIP.sunlight, veil: 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.15), transparent 60%)' },
  clearNight:    { from: '#2E3148', to: '#222538', text: '#DAD8E0',     secondary: 'rgba(218,216,224,0.45)', glow: GLOW.halo,     rain: '#9AA4C8', strip: STRIP.night },
  overcast:      { from: '#918F8C', to: '#5A5860', text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.48)', glow: GLOW.fog,      rain: '#8896B4', strip: STRIP.overcast },
  rain:          { from: '#42454F', to: '#32353F', text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.45)', glow: GLOW.fog,      rain: '#A0AACC', strip: STRIP.rain },
  storm:         { from: '#6E5B50', to: PALETTE.dusk, text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.48)', glow: GLOW.ember, rain: '#D4BEB0', strip: STRIP.rain },
  snow:          { from: '#F6F8FA', to: '#DCD9D4', text: PALETTE.ink,   secondary: 'rgba(43,46,58,0.42)',   glow: GLOW.sunlight, rain: '#7B96B8', strip: STRIP.sunlight },
  fog:           { from: '#C8C5C0', to: PALETTE.pearl, text: PALETTE.ink, secondary: 'rgba(43,46,58,0.40)',  glow: GLOW.fog,      rain: '#7B96B8', strip: STRIP.sunlight },
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
    // Light strip
    stripEdge: theme.strip.edge,
    stripMid: theme.strip.mid,
    // Hero bloom and atmospheric veil
    bloom: theme.bloom || `radial-gradient(circle, ${theme.glow.glow} 0%, transparent 70%)`,
    veil: theme.veil || 'none',
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

  // Light strip
  root.style.setProperty('--light-strip-edge', theme.stripEdge);
  root.style.setProperty('--light-strip-mid', theme.stripMid);

  // Hero bloom and atmospheric veil
  root.style.setProperty('--hero-bloom', theme.bloom);
  root.style.setProperty('--veil', theme.veil);

  // Glass, icon, and accent styles
  // Always use cobalt accent for brand consistency (toggle icons, hero temp)
  root.style.setProperty('--accent-color', ACCENT);
  root.style.setProperty('--accent-filter', ACCENT_FILTER);

  if (theme.isDarkText) {
    // Light background — dark text, no icon invert
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
