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
  clearDay:      { from: '#FDF9F0', to: '#EDE6D6', text: PALETTE.ink,   secondary: '#9B9994',   muted: 'rgba(43,46,58,0.32)',   glow: GLOW.sunlight, rain: '#8898B8', strip: STRIP.sunlight, bird: BIRD.day, bloom: 'radial-gradient(circle at 35% 28%, rgba(255,236,200,0.55), transparent 60%)' },
  partlyCloudy:  { from: '#F3F4F1', to: '#DDD9CF', text: PALETTE.ink,   secondary: '#9B9994',   muted: 'rgba(43,46,58,0.40)',   glow: GLOW.diffused, rain: '#8898B8', strip: STRIP.sunlight, bird: BIRD.day, veil: 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.15), transparent 60%)' },
  partlyCloudyNight: { from: '#363A52', to: '#2A2D44', text: '#DAD8E0', secondary: 'rgba(218,216,224,0.50)', muted: 'rgba(218,216,224,0.38)', glow: GLOW.diffused, rain: '#9AA4C8', strip: STRIP.night, bird: BIRD.night, bloom: 'radial-gradient(circle at 35% 30%, rgba(200,200,220,0.10), transparent 55%)', veil: 'radial-gradient(circle at 40% 30%, rgba(200,200,220,0.06), transparent 60%)' },
  clearNight:    { from: '#2E3148', to: '#222538', text: '#DAD8E0',     secondary: 'rgba(218,216,224,0.45)', muted: 'rgba(218,216,224,0.35)', glow: GLOW.halo,     rain: '#9AA4C8', strip: STRIP.night, bird: BIRD.night, bloom: 'radial-gradient(circle at 40% 30%, rgba(232,230,240,0.12), transparent 55%)' },
  overcast:      { from: '#DDDBD6', to: '#B8B5AF', text: PALETTE.ink,   secondary: '#9B9994',   muted: 'rgba(43,46,58,0.38)',   glow: GLOW.fog,      rain: '#8896B4', strip: STRIP.overcast, bird: BIRD.overcast },
  rain:          { from: '#74767E', to: '#787880', text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.45)', muted: 'rgba(240,237,234,0.35)', glow: GLOW.fog,      rain: '#A0AACC', strip: STRIP.rain, bird: BIRD.overcast, bloom: 'radial-gradient(circle at 30% 35%, rgba(240,237,234,0.14), transparent 55%)' },
  storm:         { from: '#A99890', to: '#6A5E6E', text: PALETTE.pearl, secondary: 'rgba(240,237,234,0.48)', muted: 'rgba(240,237,234,0.38)', glow: GLOW.ember, rain: '#D4BEB0', strip: STRIP.rain, bird: BIRD.warm },
  snow:          { from: '#F6F8FA', to: '#DCD9D4', text: PALETTE.ink,   secondary: '#9B9994',   muted: 'rgba(43,46,58,0.32)',   glow: GLOW.sunlight, rain: '#7B96B8', strip: STRIP.sunlight, bird: BIRD.day },
  fog:           { from: '#C8C5C0', to: PALETTE.pearl, text: PALETTE.ink, secondary: '#9B9994',  muted: 'rgba(43,46,58,0.30)',   glow: GLOW.fog,      rain: '#7B96B8', strip: STRIP.sunlight, bird: BIRD.overcast },
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
  const { rain_probability, cloud_percent, wind_speed_ms, condition_type } = current;

  const hour = locationHour ?? new Date().getHours();
  const month = locationMonth ?? new Date().getMonth();

  const isMorning   = hour >= 6  && hour <= 11;
  const isMidday    = hour >= 12 && hour <= 13;
  const isAfternoon = hour >= 14 && hour <= 17;
  const isDusk      = hour >= 18 && hour <= 20;
  const isNight     = hour >= 21 || hour <= 5;

  const isSpring = isSouthern
    ? (month >= 8 && month <= 10)
    : (month >= 2 && month <= 4);

  const isStorm     = condition_type === 'THUNDERSTORM';
  const isHighWind  = wind_speed_ms > 10;
  const isHeavyRain = rain_probability > 60;
  const isLightRain = rain_probability >= 30 && rain_probability <= 60;
  const isSnow      = condition_type === 'SNOW' || condition_type === 'SNOW_SHOWERS';
  const isFog       = condition_type === 'FOG' || condition_type === 'LIGHT_FOG';
  const isClear     = cloud_percent < 50;
  const isCloudy    = cloud_percent >= 50;

  const pickFallback = hour % 2 === 1;

  if (isStorm || isHighWind) return 'Windy and rough. Little flying today.';
  if (isHeavyRain)           return 'Heavy rain. Little to see until it passes.';
  if (isSnow)                return 'Snowy. Feeders busy if you keep them.';
  if (isFog)                 return 'Foggy. Sound carries further than usual.';

  if (isLightRain) return 'Light rain. Quieter than usual.';

  if (isClear && isMorning && isSpring) return 'Spring morning. Chorus is at its best.';

  if (isMorning) {
    if (isClear)  return pickFallback ? 'Bright start. Plenty around.'
                                      : 'Sunny morning. Good time to listen.';
    if (isCloudy) return pickFallback ? 'Overcast morning. Still plenty around.'
                                      : 'Mild and grey. Chorus is quieter today.';
  }
  if (isMidday) {
    if (isClear)  return 'Sun is high. Activity drops at midday.';
    if (isCloudy) return 'Cloudy and still. Quieter hour.';
  }
  if (isAfternoon) {
    if (isClear)  return pickFallback ? 'Bright afternoon. Activity picking up.'
                                      : 'Clear afternoon. Watch the hedges.';
    if (isCloudy) return 'Grey afternoon. Hedges are the best bet.';
  }
  if (isDusk) {
    if (isClear)  return pickFallback ? 'Evening sun. Watch for flights at roost.'
                                      : 'Light is fading. Final calls of the day.';
    if (isCloudy) return 'Dull evening. Listen for the last calls.';
    return 'Light is fading. Final calls of the day.';
  }
  if (isNight) {
    if (isClear)  return 'Clear night. Listen for owls.';
    if (isCloudy) return 'Quiet night. Little activity until dawn.';
  }

  return 'Quiet for now. Check back later.';
}
