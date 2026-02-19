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

// Bird strip: activity visualization colours per lighting condition
const BIRD = {
  day:      { dormant: '#D0CCC4', active: '#C4A860', glow: 'rgba(196,168,96,0.40)' },    // Warm stone → gold on light bg
  night:    { dormant: '#2E2D38', active: '#7A7468', glow: 'rgba(122,116,104,0.35)' },    // Muted warm on dark bg
  overcast: { dormant: '#8A8680', active: '#B0A488', glow: 'rgba(176,164,136,0.35)' },    // Grey stone → warm on mid bg
  warm:     { dormant: '#4A3E38', active: '#C8A078', glow: 'rgba(200,160,120,0.40)' },    // Earthy for storm
};

export const WEATHER_THEMES = {
  clearDay:      { from: '#FDF9F0', to: '#EDE6D6', text: PALETTE.ink,   secondary: 'rgba(43,46,58,0.42)',   muted: 'rgba(43,46,58,0.32)',   glow: GLOW.sunlight, rain: '#8898B8', strip: STRIP.sunlight, bird: BIRD.day, bloom: 'radial-gradient(circle at 35% 28%, rgba(255,236,200,0.55), transparent 60%)' },
  partlyCloudy:  { from: '#F3F4F1', to: '#DDD9CF', text: PALETTE.ink,   secondary: 'rgba(43,46,58,0.55)',   muted: 'rgba(43,46,58,0.40)',   glow: GLOW.diffused, rain: '#8898B8', strip: STRIP.sunlight, bird: BIRD.day, veil: 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.15), transparent 60%)' },
  partlyCloudyNight: { from: '#363A52', to: '#2A2D44', text: '#DAD8E0', secondary: 'rgba(218,216,224,0.50)', muted: 'rgba(218,216,224,0.38)', glow: GLOW.diffused, rain: '#9AA4C8', strip: STRIP.night, bird: BIRD.night, bloom: 'radial-gradient(circle at 35% 30%, rgba(200,200,220,0.10), transparent 55%)', veil: 'radial-gradient(circle at 40% 30%, rgba(200,200,220,0.06), transparent 60%)' },
  clearNight:    { from: '#2E3148', to: '#222538', text: '#DAD8E0',     secondary: 'rgba(218,216,224,0.45)', muted: 'rgba(218,216,224,0.35)', glow: GLOW.halo,     rain: '#9AA4C8', strip: STRIP.night, bird: BIRD.night, bloom: 'radial-gradient(circle at 40% 30%, rgba(232,230,240,0.12), transparent 55%)' },
  overcast:      { from: '#DDDBD6', to: '#B8B5AF', text: PALETTE.ink,   secondary: 'rgba(43,46,58,0.48)',   muted: 'rgba(43,46,58,0.38)',   glow: GLOW.fog,      rain: '#8896B4', strip: STRIP.overcast, bird: BIRD.overcast },
  rain:          { from: '#74767E', to: '#787880', text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.45)', muted: 'rgba(240,237,234,0.35)', glow: GLOW.fog,      rain: '#A0AACC', strip: STRIP.rain, bird: BIRD.overcast, bloom: 'radial-gradient(circle at 30% 35%, rgba(240,237,234,0.14), transparent 55%)' },
  storm:         { from: '#A99890', to: '#6A5E6E', text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.48)', muted: 'rgba(240,237,234,0.38)', glow: GLOW.ember, rain: '#D4BEB0', strip: STRIP.rain, bird: BIRD.warm },
  snow:          { from: '#F6F8FA', to: '#DCD9D4', text: PALETTE.ink,   secondary: 'rgba(43,46,58,0.42)',   muted: 'rgba(43,46,58,0.32)',   glow: GLOW.sunlight, rain: '#7B96B8', strip: STRIP.sunlight, bird: BIRD.day },
  fog:           { from: '#C8C5C0', to: PALETTE.pearl, text: PALETTE.ink, secondary: 'rgba(43,46,58,0.40)',  muted: 'rgba(43,46,58,0.30)',   glow: GLOW.fog,      rain: '#7B96B8', strip: STRIP.sunlight, bird: BIRD.overcast },
};

/**
 * Determine weather condition from data
 */
function getCondition(rainProbability, cloudPercent, temp_c = 10, wind_speed_ms = 0, condition_type = null) {
  // Use actual weather condition from API when available
  if (condition_type === 'FOG' || condition_type === 'LIGHT_FOG') return 'fog';
  if (condition_type === 'THUNDERSTORM' || condition_type === 'HAIL') return 'storm';
  if (condition_type === 'HEAVY_RAIN') return 'rain';
  if (condition_type === 'DRIZZLE') return 'overcast';
  if (condition_type === 'SNOW' || condition_type === 'SNOW_SHOWERS') {
    if (temp_c < 4) return 'snow';
  }

  // Fallback to heuristics
  if (temp_c < 2 && rainProbability > 30) return 'snow';
  if (rainProbability > 70 && wind_speed_ms > 8) return 'storm';
  if (rainProbability > 30) return 'rain';
  if (cloudPercent > 85) return 'overcast';
  if (cloudPercent > 50) return 'overcast';
  if (cloudPercent > 30) return 'partlyCloudy';
  return 'clear';
}

/**
 * Map condition + day/night to a WEATHER_THEMES key
 */
function getThemeKey(condition, is_day) {
  if (condition === 'clear') return is_day ? 'clearDay' : 'clearNight';
  if (condition === 'partlyCloudy') return is_day ? 'partlyCloudy' : 'partlyCloudyNight';
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
export function buildTheme({ is_day, timestamp, rain_probability, cloud_percent, temp_c, wind_speed_ms = 0, condition_type = null }) {
  const condition = getCondition(rain_probability, cloud_percent, temp_c, wind_speed_ms, condition_type);
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
    textMuted: theme.muted,
    // Rain accent
    rainColor: theme.rain,
    // Light strip
    stripEdge: theme.strip.edge,
    stripMid: theme.strip.mid,
    // Hero bloom and atmospheric veil
    bloom: theme.bloom || `radial-gradient(circle, ${theme.glow.glow} 0%, transparent 70%)`,
    veil: theme.veil || 'none',
    // Bird strip
    birdDormant: theme.bird.dormant,
    birdActive: theme.bird.active,
    birdGlow: theme.bird.glow,
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
  root.style.setProperty('--text-muted', theme.textMuted);

  // Rain accent
  root.style.setProperty('--rain-color', theme.rainColor);

  // Light strip
  root.style.setProperty('--light-strip-edge', theme.stripEdge);
  root.style.setProperty('--light-strip-mid', theme.stripMid);

  // Hero bloom and atmospheric veil
  root.style.setProperty('--hero-bloom', theme.bloom);
  root.style.setProperty('--veil', theme.veil);

  // Bird strip
  root.style.setProperty('--bird-dormant', theme.birdDormant);
  root.style.setProperty('--bird-active', theme.birdActive);
  root.style.setProperty('--bird-glow', theme.birdGlow);

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
export function generateHeroSentence(current, hourly, { locationHour, locationMonth, isSouthern } = {}) {
  const { rain_probability, cloud_percent, temp_c, wind_speed_ms, is_day, condition_type } = current;

  const next2Hours = hourly.slice(1, 3);
  const rainComing = next2Hours.some(h => h.rain_probability > 50) && rain_probability < 30;
  const rainStopping = rain_probability > 50 &&
    hourly.slice(2, 4).every(h => h.rain_probability < 30);

  const futureHours = hourly.slice(1, 7);
  const avgFutureTemp = futureHours.reduce((sum, h) => sum + h.temp_c, 0) / futureHours.length;
  const cooling = avgFutureTemp < temp_c - 3;
  const warming = avgFutureTemp > temp_c + 3;

  const hour = locationHour ?? new Date().getHours();
  const isEvening = hour >= 17 || hour < 5;
  const isMorning = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 17;
  const month = locationMonth ?? new Date().getMonth();
  const isSummer = isSouthern ? (month >= 11 || month <= 1) : (month >= 5 && month <= 7);
  const isWinter = isSouthern ? (month >= 5 && month <= 7) : (month >= 11 || month <= 1);

  // Specific API conditions first
  if (condition_type === 'THUNDERSTORM') return 'Thunder in the air.';
  if (condition_type === 'HAIL') return 'Hail expected. Stay indoors.';
  if (condition_type === 'FOG') {
    if (isMorning) return 'Foggy start. Should lift.';
    return 'Visibility down in fog.';
  }
  if (condition_type === 'LIGHT_FOG') {
    if (isMorning) return 'Mist clinging on this morning.';
    return 'Light mist in the air.';
  }
  if (condition_type === 'SNOW' || condition_type === 'SNOW_SHOWERS') {
    if (isMorning) return 'Snow falling this morning.';
    return 'Snow on the ground.';
  }
  if (condition_type === 'DRIZZLE') return 'Fine drizzle. Not much else.';

  // Rain scenarios
  if (rain_probability > 70) {
    if (isMorning) return 'Wet start to the day.';
    if (isAfternoon) return 'Rain set in for the afternoon.';
    if (isEvening) return 'A rainy evening ahead.';
    return 'Grab an umbrella.';
  }
  if (rainComing) {
    if (isMorning) return 'Dry window closing. Rain by lunch.';
    return 'Dry for now, rain on the way.';
  }
  if (rainStopping) {
    if (isMorning) return 'Rain clearing through the morning.';
    return 'Rain easing off soon.';
  }
  if (rain_probability > 40) return 'Keep an eye on the sky.';

  // Wind
  if (wind_speed_ms > 12) {
    if (temp_c < 5) return 'Raw and windy out there.';
    if (temp_c < 10) return 'Biting wind out there.';
    return 'Blustery conditions.';
  }
  if (wind_speed_ms > 8) {
    if (temp_c < 8) return 'A cold breeze with some bite.';
    return 'Hold onto your hat.';
  }

  // Snow heuristic
  if (temp_c < 2 && rain_probability > 30) {
    if (isMorning) return 'Cold enough for snow.';
    return 'Sleet or snow possible.';
  }

  // Overcast
  if (cloud_percent > 80 && warming) return 'Grey skies, warming later.';
  if (cloud_percent > 80 && temp_c < 5) {
    if (isMorning) return 'Bitter start under heavy cloud.';
    return 'Cold and grey. Not shifting.';
  }
  if (cloud_percent > 80 && temp_c < 10) {
    if (isMorning) return 'Cold morning under thick cloud.';
    return 'Low cloud hanging around.';
  }
  if (cloud_percent > 70) {
    if (rain_probability < 20) return 'Dry, but dull.';
    return 'Overcast and grey.';
  }

  // Temperature trends
  if (cooling && cloud_percent > 40) return 'Clouds building, cooling off.';
  if (cooling) {
    if (isEvening) return 'Getting cold tonight.';
    return 'Turning cooler later.';
  }
  if (warming) {
    if (isMorning && isWinter) return 'Chilly now, milder later.';
    if (isMorning) return 'Warming up through the morning.';
    return 'Warming up nicely.';
  }

  // Partly cloudy
  if (cloud_percent > 30) {
    if (is_day) return 'Patches of sun.';
    return 'Partly cloudy tonight.';
  }

  // Clear
  if (is_day) {
    if (temp_c > 25 && isSummer) return 'Hot and clear.';
    if (temp_c > 20) return 'Beautiful day ahead.';
    if (temp_c < 5 && isWinter) return 'Cold but bright.';
    if (isMorning) return 'Clear skies this morning.';
    return 'Clear and bright.';
  }
  if (temp_c < 2) return 'Clear and frosty tonight.';
  return 'A clear night.';
}
