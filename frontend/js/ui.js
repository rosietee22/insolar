/**
 * UI Renderer - Poster-like Editorial Design
 */

import {
  getTimePeriod,
  getWeatherType,
  selectGradient,
  applyTheme,
  generateHeroSentence
} from './theme.js';

/**
 * Show/hide elements
 */
export function show(id) {
  document.getElementById(id)?.classList.remove('hidden');
}

export function hide(id) {
  document.getElementById(id)?.classList.add('hidden');
}

/**
 * Show loading state
 */
export function showLoading() {
  hide('error');
  hide('content');
  hide('offline-warning');
  show('loading');
}

/**
 * Show error state
 * @param {string} message - Error message
 */
export function showError(message) {
  hide('loading');
  hide('content');
  const errorEl = document.getElementById('error');
  errorEl.querySelector('.error-message').textContent = message;
  show('error');
}

/**
 * Show offline warning with timestamp
 * @param {string} timestamp - Last updated timestamp
 */
export function showOfflineWarning(timestamp) {
  show('offline-warning');
}

/**
 * Hide offline warning
 */
export function hideOfflineWarning() {
  hide('offline-warning');
}

/**
 * Format relative time (e.g., "2 minutes ago")
 * @param {string|number} timestamp - ISO string or timestamp
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

/**
 * Format hour short (e.g., "2pm")
 * @param {string} timestamp - ISO timestamp
 * @returns {string}
 */
function formatHourShort(timestamp) {
  const date = new Date(timestamp);
  const hour = date.getHours();
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
}

/**
 * Format time as HH:MM
 */
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}

/**
 * Get weather emoji based on conditions and time of day
 * @param {number} rain_probability
 * @param {number} cloud_percent
 * @param {boolean} is_day - From API (based on actual sunrise/sunset)
 * @returns {string}
 */
function getWeatherEmoji(rain_probability, cloud_percent, is_day) {
  const isNight = !is_day;

  if (rain_probability > 60) return '🌧️';
  if (rain_probability > 30) return isNight ? '🌧️' : '🌦️';
  if (cloud_percent > 70) return '☁️';
  if (cloud_percent > 30) return isNight ? '☁️' : '⛅';
  return isNight ? '🌙' : '☀️';
}

/**
 * Estimate sunrise/sunset times from hourly is_day transitions
 * @param {Array} hourly - Hourly forecast data
 * @returns {Object} { sunrise: Date, sunset: Date }
 */
function estimateSunriseSunset(hourly) {
  let sunrise = null;
  let sunset = null;
  const now = new Date();
  const today = now.toDateString();

  for (let i = 1; i < hourly.length; i++) {
    const prev = hourly[i - 1];
    const curr = hourly[i];
    const currDate = new Date(curr.timestamp);

    // Only look at today's data
    if (currDate.toDateString() !== today) continue;

    // Night to day transition = sunrise
    if (!prev.is_day && curr.is_day && !sunrise) {
      sunrise = new Date(curr.timestamp);
    }
    // Day to night transition = sunset
    if (prev.is_day && !curr.is_day && !sunset) {
      sunset = new Date(curr.timestamp);
    }
  }

  // Fallback defaults if transitions not found in data
  if (!sunrise) {
    sunrise = new Date(now);
    sunrise.setHours(6, 30, 0, 0);
  }
  if (!sunset) {
    sunset = new Date(now);
    sunset.setHours(18, 30, 0, 0);
  }

  return { sunrise, sunset };
}

/**
 * Calculate solar progress (0-100) based on current time vs sunrise/sunset
 */
function calculateSolarProgress(sunrise, sunset) {
  const now = new Date();

  // Before sunrise
  if (now < sunrise) return 0;
  // After sunset
  if (now > sunset) return 100;

  // During day
  const dayLength = sunset - sunrise;
  const elapsed = now - sunrise;
  return Math.round((elapsed / dayLength) * 100);
}

/**
 * Generate Key Moments - narrative insights about weather changes
 * @param {Array} hourly - Hourly forecast data
 * @returns {Array} Array of moment objects
 */
function generateKeyMoments(hourly) {
  const moments = [];
  const now = new Date();

  // Look for significant weather events in next 12 hours
  const next12 = hourly.slice(0, 12);

  // 1. Rain starting/stopping
  let rainStartHour = null;
  let rainStopHour = null;
  let currentlyRaining = next12[0]?.rain_probability > 40;

  for (let i = 1; i < next12.length; i++) {
    const hour = next12[i];
    const isRaining = hour.rain_probability > 40;

    if (!currentlyRaining && isRaining && !rainStartHour) {
      rainStartHour = hour;
    }
    if (currentlyRaining && !isRaining && !rainStopHour) {
      rainStopHour = hour;
    }
  }

  if (rainStartHour) {
    moments.push({
      time: formatHourShort(rainStartHour.timestamp),
      text: `Rain likely to start`,
      detail: `${rainStartHour.rain_probability}% chance, ${Math.round(rainStartHour.temp_c)}°`
    });
  }

  if (rainStopHour) {
    moments.push({
      time: formatHourShort(rainStopHour.timestamp),
      text: `Rain expected to clear`,
      detail: `Dropping to ${rainStopHour.rain_probability}%`
    });
  }

  // 2. Temperature peak/trough
  const temps = next12.map(h => h.temp_c);
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const tempRange = maxTemp - minTemp;

  if (tempRange >= 3) {
    const peakHour = next12.find(h => h.temp_c === maxTemp);
    if (peakHour && new Date(peakHour.timestamp) > now) {
      moments.push({
        time: formatHourShort(peakHour.timestamp),
        text: `Warmest at ${Math.round(maxTemp)}°`,
        detail: getWeatherEmoji(peakHour.rain_probability, peakHour.cloud_percent, peakHour.is_day)
      });
    }
  }

  // 3. Wind picking up
  const windyHour = next12.find((h, i) => i > 0 && h.wind_speed_ms > 8 && next12[i - 1].wind_speed_ms <= 8);
  if (windyHour) {
    moments.push({
      time: formatHourShort(windyHour.timestamp),
      text: `Wind picks up`,
      detail: `${Math.round(windyHour.wind_speed_ms)} m/s`
    });
  }

  // Limit to 3 most relevant moments
  return moments.slice(0, 3);
}

/**
 * Get tomorrow's forecast summary
 * @param {Array} hourly - Hourly forecast data
 * @returns {Object|null}
 */
function getTomorrowSummary(hourly) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const tomorrowHours = hourly.filter(h => {
    const d = new Date(h.timestamp);
    return d >= tomorrow && d < tomorrowEnd;
  });

  if (tomorrowHours.length === 0) return null;

  const temps = tomorrowHours.map(h => h.temp_c);
  const maxRain = Math.max(...tomorrowHours.map(h => h.rain_probability));
  const avgCloud = tomorrowHours.reduce((sum, h) => sum + h.cloud_percent, 0) / tomorrowHours.length;
  const midday = tomorrowHours.find(h => new Date(h.timestamp).getHours() === 12) || tomorrowHours[Math.floor(tomorrowHours.length / 2)];

  let condition = 'Clear skies';
  if (maxRain > 50) condition = 'Rain expected';
  else if (maxRain > 25) condition = 'Chance of rain';
  else if (avgCloud > 70) condition = 'Overcast';
  else if (avgCloud > 30) condition = 'Partly cloudy';

  return {
    low: Math.round(Math.min(...temps)),
    high: Math.round(Math.max(...temps)),
    condition,
    icon: getWeatherEmoji(maxRain, avgCloud, true)
  };
}

/**
 * Render main app with forecast data
 * @param {Object} data - Forecast data
 */
export function renderApp(data) {
  hide('loading');
  hide('error');
  show('content');

  const current = data.current;
  const hourly = data.hourly;

  // Apply weather theme
  const timePeriod = getTimePeriod(current.is_day, current.timestamp);
  const weatherType = getWeatherType(current.rain_probability, current.cloud_percent);
  const gradient = selectGradient(weatherType, timePeriod);
  applyTheme(gradient);

  // Update mobile browser theme color
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', gradient.from);

  // Update location display
  updateLocationDisplay(data.location);

  // Update current time
  const timeEl = document.getElementById('current-time');
  if (timeEl) {
    timeEl.textContent = formatTime(new Date());
  }

  // Render Hero Section
  document.getElementById('hero-headline').textContent = generateHeroSentence(current, hourly);
  document.getElementById('hero-temp').textContent = `${Math.round(current.temp_c)}°`;

  // Hero meta
  const heroMeta = document.getElementById('hero-meta');
  if (heroMeta) {
    const parts = [];
    if (current.rain_probability > 0) parts.push(`${current.rain_probability}% rain`);
    parts.push(`Wind ${Math.round(current.wind_speed_ms)} m/s`);
    if (current.uv_index > 0 && current.is_day) parts.push(`UV ${current.uv_index}`);
    heroMeta.textContent = parts.join(' · ');
  }

  // Render Solar Arc
  const { sunrise, sunset } = estimateSunriseSunset(hourly);
  const sunriseEl = document.getElementById('sunrise-time');
  const sunsetEl = document.getElementById('sunset-time');
  const solarProgress = document.getElementById('solar-progress');
  const solarMarker = document.getElementById('solar-marker');

  if (sunriseEl) sunriseEl.textContent = formatTime(sunrise);
  if (sunsetEl) sunsetEl.textContent = formatTime(sunset);

  const progress = calculateSolarProgress(sunrise, sunset);
  if (solarProgress) solarProgress.style.width = `${progress}%`;
  if (solarMarker) solarMarker.style.left = `${progress}%`;

  // Render Hourly Strip (next 12 hours)
  const hourlyStrip = document.getElementById('hourly-strip');
  if (hourlyStrip) {
    const stripHours = hourly.slice(0, 12);
    hourlyStrip.innerHTML = stripHours.map((hour, index) => `
      <div class="hour-item${index === 0 ? ' now' : ''}">
        <div class="hour-time">${index === 0 ? 'Now' : formatHourShort(hour.timestamp)}</div>
        <div class="hour-icon">${getWeatherEmoji(hour.rain_probability, hour.cloud_percent, hour.is_day)}</div>
        <div class="hour-temp">${Math.round(hour.temp_c)}°</div>
        ${hour.rain_probability > 0 ? `<div class="hour-rain">${hour.rain_probability}%</div>` : ''}
      </div>
    `).join('');
  }

  // Render Key Moments
  const momentsEl = document.getElementById('moments');
  if (momentsEl) {
    const moments = generateKeyMoments(hourly);
    if (moments.length > 0) {
      momentsEl.innerHTML = moments.map(m => `
        <div class="moment">
          <div class="moment-time">${m.time}</div>
          <div class="moment-text">${m.text}</div>
          ${m.detail ? `<div class="moment-detail">${m.detail}</div>` : ''}
        </div>
      `).join('');
    } else {
      momentsEl.innerHTML = `
        <div class="moment">
          <div class="moment-time">Next 12 hours</div>
          <div class="moment-text">No significant changes expected</div>
        </div>
      `;
    }
  }

  // Render Tomorrow Glance
  const tomorrowEl = document.getElementById('tomorrow');
  if (tomorrowEl) {
    const tomorrow = getTomorrowSummary(hourly);
    if (tomorrow) {
      tomorrowEl.innerHTML = `
        <div class="tomorrow-label">Tomorrow</div>
        <div class="tomorrow-summary">
          <span class="tomorrow-icon">${tomorrow.icon}</span>
          <span>${tomorrow.condition}</span>
          <span class="tomorrow-temps">${tomorrow.low}° / ${tomorrow.high}°</span>
        </div>
      `;
    } else {
      tomorrowEl.innerHTML = '';
    }
  }

  // Update freshness indicator
  updateFreshness(data.generated_at);

  // Start time updater
  startTimeUpdater();
}

// Time updater interval
let timeUpdateInterval = null;

/**
 * Start updating current time every minute
 */
function startTimeUpdater() {
  if (timeUpdateInterval) clearInterval(timeUpdateInterval);

  timeUpdateInterval = setInterval(() => {
    const timeEl = document.getElementById('current-time');
    if (timeEl) {
      timeEl.textContent = formatTime(new Date());
    }
  }, 60000);
}

/**
 * Update freshness indicator
 * @param {string} timestamp - ISO timestamp
 */
export function updateFreshness(timestamp) {
  const freshnessEl = document.getElementById('freshness');
  const textEl = document.getElementById('freshness-text');

  if (!freshnessEl || !textEl) return;

  const date = new Date(timestamp);
  const now = new Date();
  const diffMins = Math.floor((now - date) / 60000);

  // Update text
  textEl.textContent = `Updated ${formatRelativeTime(timestamp)}`;

  // Update freshness class
  freshnessEl.classList.remove('stale', 'old');
  if (diffMins > 60) {
    freshnessEl.classList.add('old');
  } else if (diffMins > 15) {
    freshnessEl.classList.add('stale');
  }

  // Store for refresh
  localStorage.setItem('last_updated', timestamp);
}

/**
 * Update location display
 * @param {Object} location - Location object with lat, lon, name, etc.
 */
export function updateLocationDisplay(location) {
  const locationEl = document.getElementById('location-display');

  if (!locationEl) return;

  if (location.name) {
    locationEl.textContent = location.name;
  } else {
    locationEl.textContent = `${location.lat}°, ${location.lon}°`;
  }
}

/**
 * Initialize freshness from cache
 */
export function initLastUpdated() {
  const cached = localStorage.getItem('last_updated');
  if (cached) {
    updateFreshness(cached);
  }
}
