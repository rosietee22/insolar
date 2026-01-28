/**
 * UI Renderer
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
  const timeEl = document.getElementById('offline-time');
  timeEl.textContent = formatRelativeTime(timestamp);
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
 * Get weather emoji based on conditions and time of day
 * @param {number} rain_probability
 * @param {number} cloud_percent
 * @param {boolean} is_day - From API (based on actual sunrise/sunset)
 * @returns {string}
 */
function getWeatherEmoji(rain_probability, cloud_percent, is_day) {
  const isNight = !is_day;

  if (rain_probability > 60) return '🌧️';
  if (rain_probability > 30) return isNight ? '🌧️' : '🌦️';  // 🌦️ has sun peeking through
  if (cloud_percent > 70) return '☁️';
  if (cloud_percent > 30) return isNight ? '☁️' : '⛅';  // ⛅ has sun peeking through
  return isNight ? '🌙' : '☀️';
}

/**
 * Group hours into time blocks (This Evening, Overnight, etc.)
 * @param {Array} hourly - Hourly forecast data
 * @returns {Array} Array of time blocks
 */
function groupIntoTimeBlocks(hourly) {
  const blocks = [];
  const now = new Date();

  // Skip the first few hours (shown in the strip)
  const startIndex = Math.min(6, hourly.length);
  const remaining = hourly.slice(startIndex);

  if (remaining.length === 0) return blocks;

  // Group by time of day
  let currentBlock = null;

  remaining.forEach(hour => {
    const date = new Date(hour.timestamp);
    const hourNum = date.getHours();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

    let blockName;
    if (hourNum >= 18 || hourNum < 0) {
      blockName = isToday ? 'This Evening' : (isTomorrow ? 'Tomorrow Evening' : 'Evening');
    } else if (hourNum >= 0 && hourNum < 6) {
      blockName = 'Overnight';
    } else if (hourNum >= 6 && hourNum < 12) {
      blockName = isTomorrow ? 'Tomorrow Morning' : 'Morning';
    } else {
      blockName = isTomorrow ? 'Tomorrow Afternoon' : 'Afternoon';
    }

    if (!currentBlock || currentBlock.name !== blockName) {
      currentBlock = { name: blockName, hours: [] };
      blocks.push(currentBlock);
    }

    currentBlock.hours.push(hour);
  });

  // Calculate summary for each block
  blocks.forEach(block => {
    const temps = block.hours.map(h => h.temp_c);
    const maxRain = Math.max(...block.hours.map(h => h.rain_probability));
    block.tempRange = `${Math.round(Math.min(...temps))}°–${Math.round(Math.max(...temps))}°`;
    block.maxRain = maxRain;
    block.icon = getWeatherEmoji(maxRain, block.hours[0].cloud_percent, block.hours[0].is_day);
  });

  return blocks;
}

/**
 * Render main app with forecast data
 * @param {Object} data - Forecast data
 */
export function renderApp(data) {
  hide('loading');
  hide('error');
  show('content');

  // Apply weather theme
  const current = data.current;
  const timePeriod = getTimePeriod(current.is_day, current.timestamp);
  const weatherType = getWeatherType(current.rain_probability, current.cloud_percent);
  const gradient = selectGradient(weatherType, timePeriod);
  applyTheme(gradient);

  // Update mobile browser theme color
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', gradient.from);

  // Update location display
  updateLocationDisplay(data.location);

  // Render Hero Section
  document.getElementById('hero-sentence').textContent = generateHeroSentence(current, data.hourly);
  document.getElementById('hero-temp').textContent = `${Math.round(current.temp_c)}°`;
  document.getElementById('hero-details').innerHTML = `
    ${current.rain_probability > 0 ? `${current.rain_probability}% rain · ` : ''}Wind ${Math.round(current.wind_speed_ms)} m/s
  `;

  // Render Hours Strip (next 6 hours)
  const hoursStrip = document.getElementById('hours-strip');
  const stripHours = data.hourly.slice(0, 6);
  hoursStrip.innerHTML = stripHours.map((hour, index) => `
    <div class="hour-pill${index === 0 ? ' now' : ''}">
      <div class="hour-pill-time">${index === 0 ? 'Now' : formatHourShort(hour.timestamp)}</div>
      <div class="hour-pill-icon">${getWeatherEmoji(hour.rain_probability, hour.cloud_percent, hour.is_day)}</div>
      <div class="hour-pill-temp">${Math.round(hour.temp_c)}°</div>
      ${hour.rain_probability > 0 ? `<div class="hour-pill-rain">${hour.rain_probability}%</div>` : ''}
    </div>
  `).join('');

  // Render Time-blocked Forecast Sections
  const timeBlocks = groupIntoTimeBlocks(data.hourly);
  const forecastSections = document.getElementById('forecast-sections');
  forecastSections.innerHTML = timeBlocks.map((block, index) => `
    <div class="forecast-block${index === 0 ? ' expanded' : ''}" data-block="${index}">
      <div class="forecast-block-header" onclick="toggleForecastBlock(${index})">
        <span class="forecast-block-title">${block.name}</span>
        <span class="forecast-block-summary">
          ${block.icon} ${block.tempRange}
          ${block.maxRain > 20 ? `<span>${block.maxRain}%</span>` : ''}
          <svg class="forecast-block-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>
      <div class="forecast-block-content">
        <div class="forecast-block-hours">
          ${block.hours.map(hour => `
            <div class="forecast-hour">
              <span class="forecast-hour-time">${formatHourShort(hour.timestamp)}</span>
              <span class="forecast-hour-icon">${getWeatherEmoji(hour.rain_probability, hour.cloud_percent, hour.is_day)}</span>
              <span class="forecast-hour-temp">${Math.round(hour.temp_c)}°</span>
              <span class="forecast-hour-rain">${hour.rain_probability > 0 ? `${hour.rain_probability}%` : ''}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');

  // Update freshness indicator
  updateFreshness(data.generated_at);
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
 * Toggle forecast block expansion (called from onclick)
 */
window.toggleForecastBlock = function(index) {
  const block = document.querySelector(`[data-block="${index}"]`);
  if (block) {
    block.classList.toggle('expanded');
  }
};

/**
 * Update location display
 * @param {Object} location - Location object with lat, lon, name, etc.
 */
export function updateLocationDisplay(location) {
  const locationEl = document.getElementById('location-display');

  if (!locationEl) return;

  // If location has a name (from city search), show it
  if (location.name) {
    locationEl.textContent = location.name;
  } else {
    // Show rounded coordinates for GPS
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
