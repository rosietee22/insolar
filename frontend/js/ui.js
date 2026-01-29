/**
 * UI Renderer - Poster-like Editorial Design
 */

import {
  buildTheme,
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
 * Get descriptive wind term from speed in m/s
 * Based on simplified Beaufort scale
 */
function getWindDescription(speedMs) {
  if (speedMs < 0.5) return 'Calm';
  if (speedMs < 3) return 'Light breeze';
  if (speedMs < 6) return 'Gentle breeze';
  if (speedMs < 9) return 'Moderate wind';
  if (speedMs < 12) return 'Fresh wind';
  if (speedMs < 15) return 'Strong wind';
  return 'Very strong wind';
}

/**
 * Get weather icon source path
 */
function getWeatherIconSrc(rain_probability, cloud_percent, is_day) {
  const iconName = getWeatherIconName(rain_probability, cloud_percent, is_day);
  return `/icons/weather/${iconName}.svg`;
}

/**
 * Get condition key for deduplication
 */
function getConditionKey(rain_probability, cloud_percent, is_day) {
  return getWeatherIconName(rain_probability, cloud_percent, is_day);
}

/**
 * Get weather icon filename based on conditions and time of day
 * @param {number} rain_probability
 * @param {number} cloud_percent
 * @param {boolean} is_day - From API (based on actual sunrise/sunset)
 * @returns {string} Icon filename (without path)
 */
function getWeatherIconName(rain_probability, cloud_percent, is_day) {
  const isNight = !is_day;

  if (rain_probability > 60) return 'rain-heavy';
  if (rain_probability > 30) return 'rain';
  if (rain_probability > 10) return 'drizzle';
  if (cloud_percent > 80) return 'cloudy';
  if (cloud_percent > 30) return isNight ? 'partly-cloudy-night' : 'partly-cloudy-day';
  return isNight ? 'clear-night' : 'clear-day';
}

/**
 * Get weather icon HTML (SVG img tag)
 * Falls back to emoji if SVG not found
 * @param {number} rain_probability
 * @param {number} cloud_percent
 * @param {boolean} is_day
 * @returns {string} HTML string
 */
function getWeatherIcon(rain_probability, cloud_percent, is_day) {
  const iconName = getWeatherIconName(rain_probability, cloud_percent, is_day);
  // Returns img tag - falls back gracefully if file missing
  return `<img src="/icons/weather/${iconName}.svg" alt="${iconName}" class="weather-icon" onerror="this.style.display='none';this.nextSibling.style.display='inline'"><span style="display:none">${getWeatherEmojiFallback(rain_probability, cloud_percent, is_day)}</span>`;
}

/**
 * Fallback emoji for when SVG icons aren't available
 */
function getWeatherEmojiFallback(rain_probability, cloud_percent, is_day) {
  const isNight = !is_day;
  if (rain_probability > 60) return '🌧️';
  if (rain_probability > 30) return '🌦️';
  if (rain_probability > 10) return '🌤️';
  if (cloud_percent > 80) return '☁️';
  if (cloud_percent > 30) return isNight ? '🌙' : '⛅';
  return isNight ? '🌙' : '☀️';
}


/**
 * Estimate sunrise/sunset times from hourly is_day transitions
 * @param {Array} hourly - Hourly forecast data
 * @returns {Object} { sunrise: Date, sunset: Date, nextSunrise: Date, isNight: boolean }
 */
function estimateSunriseSunset(hourly) {
  let sunrise = null;
  let sunset = null;
  let nextSunrise = null;
  const now = new Date();
  const today = now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toDateString();

  // Check if currently night (first hour is_day = false)
  const currentlyNight = hourly[0] && !hourly[0].is_day;

  for (let i = 1; i < hourly.length; i++) {
    const prev = hourly[i - 1];
    const curr = hourly[i];
    const currDate = new Date(curr.timestamp);
    const dateStr = currDate.toDateString();

    // Night to day transition = sunrise
    if (!prev.is_day && curr.is_day) {
      if (!nextSunrise) {
        nextSunrise = new Date(curr.timestamp);
      }
      if (dateStr === today && !sunrise) {
        sunrise = new Date(curr.timestamp);
      }
    }
    // Day to night transition = sunset
    if (prev.is_day && !curr.is_day) {
      if (!sunset) {
        sunset = new Date(curr.timestamp);
      }
    }
  }

  // If currently night and no sunset found in future data, estimate it was earlier today
  if (currentlyNight && !sunset) {
    // Sunset already happened - estimate based on typical winter time
    sunset = new Date(now);
    const hour = now.getHours();
    // If evening (after 4pm), sunset was probably around 4-5pm
    if (hour >= 16) {
      sunset.setHours(16, 30, 0, 0);
    } else {
      // Early morning before sunrise
      sunset.setDate(sunset.getDate() - 1);
      sunset.setHours(16, 30, 0, 0);
    }
  }

  // Fallback defaults
  if (!sunrise) {
    sunrise = new Date(now);
    sunrise.setHours(7, 30, 0, 0);
  }
  if (!sunset) {
    sunset = new Date(now);
    sunset.setHours(16, 30, 0, 0);
  }
  if (!nextSunrise) {
    nextSunrise = new Date(tomorrow);
    nextSunrise.setHours(7, 30, 0, 0);
  }

  // Determine if it's currently night based on actual API data
  const isNight = currentlyNight;

  return { sunrise, sunset, nextSunrise, isNight };
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
 * Generate Key Moments - only for UNUSUAL weather events
 * @param {Array} hourly - Hourly forecast data
 * @returns {Array} Array of moment objects (empty if nothing unusual)
 */
function generateKeyMoments(hourly) {
  const moments = [];

  // Look for significant weather events in next 12 hours
  const next12 = hourly.slice(0, 12);

  // 1. Heavy rain starting (>60% probability)
  let currentlyRaining = next12[0]?.rain_probability > 50;
  
  for (let i = 1; i < next12.length; i++) {
    const hour = next12[i];
    const isHeavyRain = hour.rain_probability >= 60;

    if (!currentlyRaining && isHeavyRain) {
      moments.push({
        time: formatHourShort(hour.timestamp),
        text: `Heavy rain expected`,
        detail: `${hour.rain_probability}% chance`
      });
      break;
    }
  }

  // 2. Strong wind warning (>10 m/s)
  const strongWindHour = next12.find((h, i) => i > 0 && h.wind_speed_ms > 10 && next12[i - 1].wind_speed_ms <= 10);
  if (strongWindHour) {
    moments.push({
      time: formatHourShort(strongWindHour.timestamp),
      text: `Strong winds expected`,
      detail: `${Math.round(strongWindHour.wind_speed_ms)} m/s`
    });
  }

  // 3. Rapid temperature drop (>8° in next few hours)
  const currentTemp = next12[0]?.temp_c || 0;
  const coldestHour = next12.slice(1).find(h => currentTemp - h.temp_c >= 8);
  if (coldestHour) {
    moments.push({
      time: formatHourShort(coldestHour.timestamp),
      text: `Temperature dropping sharply`,
      detail: `Down to ${Math.round(coldestHour.temp_c)}°`
    });
  }

  return moments.slice(0, 2);
}

/**
 * Get multi-day forecast data
 * @param {Array} hourly - Hourly forecast data
 * @param {number} numDays - Number of days to get
 * @returns {Array}
 */
function getMultiDayForecast(hourly, numDays = 3) {
  const days = [];
  const now = new Date();
  const dayNames = ['Today', 'Tomorrow'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 1; i <= numDays; i++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + i);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dayHours = hourly.filter(h => {
      const d = new Date(h.timestamp);
      return d >= targetDate && d < nextDate;
    });
    
    if (dayHours.length === 0) continue;
    
    const temps = dayHours.map(h => h.temp_c);
    const maxRain = Math.max(...dayHours.map(h => h.rain_probability));
    const avgCloud = dayHours.reduce((sum, h) => sum + h.cloud_percent, 0) / dayHours.length;
    
    let condition = 'Clear';
    if (maxRain > 50) condition = 'Rain likely';
    else if (maxRain > 25) condition = 'Chance of rain';
    else if (avgCloud > 70) condition = 'Cloudy';
    else if (avgCloud > 30) condition = 'Partly cloudy';
    
    const name = i === 1 ? 'Tomorrow' : weekDays[targetDate.getDay()];
    
    days.push({
      name,
      low: Math.round(Math.min(...temps)),
      high: Math.round(Math.max(...temps)),
      condition,
      maxRain,
      avgCloud
    });
  }
  
  return days;
}

/**
 * Get tomorrow's forecast data
 * @param {Array} hourly - Hourly forecast data
 * @returns {Object|null}
 */
function getTomorrowData(hourly) {
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

  let condition = 'Clear skies';
  if (maxRain > 50) condition = 'Rain expected';
  else if (maxRain > 25) condition = 'Chance of rain';
  else if (avgCloud > 70) condition = 'Overcast';
  else if (avgCloud > 30) condition = 'Partly cloudy';

  return {
    low: Math.round(Math.min(...temps)),
    high: Math.round(Math.max(...temps)),
    condition,
    icon: getWeatherIcon(maxRain, avgCloud, true),
    hours: tomorrowHours
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

  // Apply weather theme (three-layer system: season + condition + solar)
  const theme = buildTheme({
    is_day: current.is_day,
    timestamp: current.timestamp,
    rain_probability: current.rain_probability,
    cloud_percent: current.cloud_percent,
    temp_c: current.temp_c
  });
  applyTheme(theme);

  // Update mobile browser theme color
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.baseFrom);

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

  // Hero meta (rain / wind on same line, centered)
  const heroMeta = document.getElementById('hero-meta');
  if (heroMeta) {
    const parts = [];
    if (current.rain_probability > 0) {
      parts.push(`${current.rain_probability}% chance of rain`);
    }
    parts.push(getWindDescription(current.wind_speed_ms));
    heroMeta.textContent = parts.join(' / ');
  }

  // Render Light Window
  const { sunrise, sunset, nextSunrise, isNight } = estimateSunriseSunset(hourly);
  const now = new Date();

  // Adjust sunset/sunrise for edge cases
  let adjustedSunset = sunset;
  if (isNight && sunset > now) {
    adjustedSunset = new Date(now);
    adjustedSunset.setHours(16, 30, 0, 0);
  }
  let adjustedNextSunrise = nextSunrise;
  if (adjustedNextSunrise <= adjustedSunset) {
    adjustedNextSunrise = new Date(nextSunrise);
    adjustedNextSunrise.setDate(adjustedNextSunrise.getDate() + 1);
  }

  // Light Window elements
  const lightWindowTitle = document.getElementById('light-window-title');
  const lightHours = document.getElementById('light-hours');
  const lightStrip = document.getElementById('light-strip');
  const lightDot = document.getElementById('light-dot');
  const lightLabelLeft = document.getElementById('light-label-left');
  const lightLabelRight = document.getElementById('light-label-right');
  const lightLegend = document.getElementById('light-legend');

  // Get current UV index
  const uvIndex = current.uv_index || 0;

  // Render next 6 hours (no "NOW" - hero handles that)
  if (lightHours) {
    const nextHours = hourly.slice(1, 7);
    
    // Check for repeating conditions to fade duplicate icons
    let lastCondition = null;
    
    lightHours.innerHTML = nextHours.map((hour, index) => {
      const showRain = hour.rain_probability > 25;
      
      return `
        <div class="light-hour">
          <span class="light-hour-time">${formatHourShort(hour.timestamp)}</span>
          <span class="light-hour-temp">${Math.round(hour.temp_c)}°</span>
          <img src="${getWeatherIconSrc(hour.rain_probability, hour.cloud_percent, hour.is_day)}" 
               class="light-hour-icon" 
               alt="">
          ${showRain ? `<span class="light-hour-rain">${hour.rain_probability}%</span>` : ''}
        </div>
      `;
    }).join('');
  }

  // Light strip and dot
  if (isNight) {
    // Night mode
    if (lightWindowTitle) lightWindowTitle.textContent = 'UNTIL SUNRISE';
    if (lightStrip) lightStrip.classList.add('night');
    if (lightDot) {
      lightDot.classList.add('night');
      lightDot.className = 'light-dot night';
    }
    if (lightLabelLeft) lightLabelLeft.textContent = formatTime(adjustedSunset);
    if (lightLabelRight) lightLabelRight.textContent = formatTime(adjustedNextSunrise);
    if (lightLegend) {
      lightLegend.textContent = 'UV 0';
      lightLegend.style.color = 'var(--text-secondary)';
    }

    // Calculate night progress
    const nightLength = adjustedNextSunrise.getTime() - adjustedSunset.getTime();
    const elapsed = now.getTime() - adjustedSunset.getTime();
    const progress = Math.min(100, Math.max(0, Math.round((elapsed / nightLength) * 100)));
    if (lightDot) lightDot.style.left = `${progress}%`;
  } else {
    // Day mode
    if (lightWindowTitle) lightWindowTitle.textContent = 'DAYLIGHT & UV';
    if (lightStrip) lightStrip.classList.remove('night');
    if (lightLabelLeft) lightLabelLeft.textContent = formatTime(sunrise);
    if (lightLabelRight) lightLabelRight.textContent = formatTime(sunset);
    // UV legend text and color
    if (lightLegend) {
      let uvText, uvColor;
      if (uvIndex >= 11) {
        uvText = 'UV ' + uvIndex + ' · Extreme';
        uvColor = '#9B59B6'; // purple
      } else if (uvIndex >= 8) {
        uvText = 'UV ' + uvIndex + ' · Wear sunscreen';
        uvColor = '#E74C3C'; // red
      } else if (uvIndex >= 6) {
        uvText = 'UV ' + uvIndex + ' · Wear sunscreen';
        uvColor = '#E67E22'; // orange
      } else if (uvIndex >= 3) {
        uvText = 'UV ' + uvIndex + ' · Wear sunscreen';
        uvColor = '#F1C40F'; // yellow
      } else if (uvIndex > 0) {
        uvText = 'UV ' + uvIndex + ' · Low';
        uvColor = '#27AE60'; // green
      } else {
        uvText = 'UV Low';
        uvColor = 'var(--text-secondary)';
      }
      lightLegend.textContent = uvText;
      lightLegend.style.color = uvColor;
    }

    // UV glow class
    if (lightDot) {
      lightDot.classList.remove('night', 'uv-0', 'uv-low', 'uv-moderate', 'uv-high', 'uv-very-high');
      if (uvIndex === 0) lightDot.classList.add('uv-0');
      else if (uvIndex <= 2) lightDot.classList.add('uv-low');
      else if (uvIndex <= 5) lightDot.classList.add('uv-moderate');
      else if (uvIndex <= 7) lightDot.classList.add('uv-high');
      else lightDot.classList.add('uv-very-high');
    }

    // Calculate day progress
    const progress = calculateSolarProgress(sunrise, sunset);
    if (lightDot) lightDot.style.left = `${progress}%`;
  }

  // Render Key Moments (only if unusual weather)
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
      momentsEl.style.display = '';
    } else {
      momentsEl.innerHTML = '';
      momentsEl.style.display = 'none';
    }
  }

  // Render 3-Day Forecast (use API daily data if available, fallback to hourly calculation)
  const forecastDaysEl = document.getElementById('forecast-days');
  if (forecastDaysEl) {
    const days = data.daily && data.daily.length > 0 ? data.daily : getMultiDayForecast(hourly, 3);
    forecastDaysEl.innerHTML = days.map(day => `
      <div class="forecast-day">
        <span class="forecast-day-name">${day.name}</span>
        <img src="${getWeatherIconSrc(day.maxRain, day.avgCloud, true)}" class="forecast-day-icon" alt="">
        <span class="forecast-day-condition">${day.condition}</span>
        <span class="forecast-day-temps"><span class="low">${day.low}°</span> / ${day.high}°</span>
      </div>
    `).join('');
  }

  // Update freshness indicator
  updateFreshness(data.generated_at);

  // Start time updater
  startTimeUpdater();
}

// Time updater interval
let timeUpdateInterval = null;

/**
 * Toggle tomorrow section expansion
 */
window.toggleTomorrow = function() {
  const tomorrowEl = document.getElementById('tomorrow');
  if (tomorrowEl) {
    tomorrowEl.classList.toggle('expanded');
  }
};

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
