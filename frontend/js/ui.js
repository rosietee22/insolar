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
export function showOfflineWarning() {
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
 * Map forecast condition text to icon filename
 */
function getForecastIcon(condition) {
  const c = condition.toLowerCase();
  if (c.includes('rain likely') || c.includes('rain expected')) return 'rain';
  if (c.includes('chance of rain')) return 'drizzle';
  if (c.includes('cloudy') && !c.includes('partly')) return 'cloudy';
  if (c.includes('partly cloudy')) return 'partly-cloudy-day';
  if (c.includes('overcast')) return 'cloudy';
  return 'clear-day';
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
  const theme = buildTheme({
    is_day: current.is_day,
    timestamp: current.timestamp,
    rain_probability: current.rain_probability,
    cloud_percent: current.cloud_percent,
    temp_c: current.temp_c,
  });
  applyTheme(theme);

  // Update mobile browser theme color
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.baseFrom);

  // Update location display
  updateLocationDisplay(data.location);

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
  // Use API-provided sun times if available, fall back to hourly estimation
  const estimated = estimateSunriseSunset(hourly);
  const sunrise = data.sun?.sunrise ? new Date(data.sun.sunrise) : estimated.sunrise;
  const sunset = data.sun?.sunset ? new Date(data.sun.sunset) : estimated.sunset;
  const nextSunrise = data.sun?.tomorrow_sunrise ? new Date(data.sun.tomorrow_sunrise) : estimated.nextSunrise;
  const isNight = estimated.isNight;
  const now = new Date();

  // Adjust sunset/sunrise for edge cases
  let adjustedSunset = sunset;
  if (isNight && sunset > now) {
    // Sunset already passed - use today's sunset time
    adjustedSunset = new Date(sunset);
    if (adjustedSunset > now) {
      adjustedSunset.setDate(adjustedSunset.getDate() - 1);
    }
  }
  let adjustedNextSunrise = nextSunrise;
  if (adjustedNextSunrise <= adjustedSunset) {
    adjustedNextSunrise = new Date(nextSunrise);
    adjustedNextSunrise.setDate(adjustedNextSunrise.getDate() + 1);
  }

  // Light Window elements
  const lightWindowTitle = document.getElementById('light-window-title');
  const lightStrip = document.getElementById('light-strip');
  const lightDot = document.getElementById('light-dot');
  const lightLabelLeft = document.getElementById('light-label-left');
  const lightLabelRight = document.getElementById('light-label-right');
  const lightLegend = document.getElementById('light-legend');

  // Get current UV index
  const uvIndex = current.uv_index || 0;

  // Render scrollable 12-hour strip
  const hourlyStripEl = document.getElementById('hourly-strip');
  if (hourlyStripEl) {
    const next12 = hourly.slice(0, 12);

    hourlyStripEl.innerHTML = next12.map((hour, index) => {
      const showRain = hour.rain_probability > 15;
      const isNow = index === 0;

      return `
        <div class="hourly-item${isNow ? ' now' : ''}">
          <span class="hourly-time">${isNow ? 'Now' : formatHourShort(hour.timestamp)}</span>
          <img src="/icons/weather/${getWeatherIconName(hour.rain_probability, hour.cloud_percent, hour.is_day)}.svg"
               class="hourly-icon" alt="">
          <span class="hourly-temp">${Math.round(hour.temp_c)}°</span>
          <span class="hourly-rain">${showRain ? `${hour.rain_probability}%` : ''}</span>
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
      lightLegend.textContent = '';
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
        uvColor = '#C4654D'; // clay
      } else if (uvIndex >= 6) {
        uvText = 'UV ' + uvIndex + ' · Wear sunscreen';
        uvColor = '#C4654D'; // clay
      } else if (uvIndex >= 3) {
        uvText = 'UV ' + uvIndex + ' · Wear sunscreen';
        uvColor = '';
      } else if (uvIndex > 0) {
        uvText = 'UV ' + uvIndex + ' · Low';
        uvColor = '';
      } else {
        uvText = 'UV Low';
        uvColor = '';
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
        <img src="/icons/weather/${getForecastIcon(day.condition)}.svg" class="forecast-day-icon" alt="">
        <span class="forecast-day-condition">${day.condition}</span>
        <span class="forecast-day-temps"><span class="low">${day.low}°</span> / ${day.high}°</span>
      </div>
    `).join('');
  }

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
 * Render bird activity strip
 * @param {Object} activity - { curve, current, dawn_peak, dusk_peak }
 */
export function renderBirdStrip(activity) {
  if (!activity) return;

  const strip = document.getElementById('bird-strip');
  const dot = document.getElementById('bird-dot');
  const labelLeft = document.getElementById('bird-label-left');
  const labelRight = document.getElementById('bird-label-right');
  const legend = document.getElementById('bird-legend');

  if (!strip || !dot) return;

  // Build gradient from activity curve
  const stops = activity.curve.map(point => {
    const pct = Math.round((point.hour / 23) * 100);
    const intensity = point.score / 100;
    if (intensity > 0.6) {
      return `rgba(168,180,255,${intensity}) ${pct}%`;
    } else if (intensity > 0.3) {
      return `rgba(4,16,241,${intensity * 0.8}) ${pct}%`;
    } else {
      return `rgba(20,17,21,${1 - intensity * 0.5}) ${pct}%`;
    }
  });
  strip.style.background = `linear-gradient(90deg, ${stops.join(', ')})`;

  // Position dot at current hour
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const dotPosition = (currentHour / 24) * 100;
  dot.style.left = `${dotPosition}%`;

  // Dot glow based on activity level
  dot.className = 'bird-dot';
  if (activity.current.level === 'high') {
    dot.classList.add('activity-high');
  } else if (activity.current.level === 'moderate') {
    dot.classList.add('activity-moderate');
  } else {
    dot.classList.add('activity-low');
  }

  // Labels
  if (labelLeft) {
    labelLeft.textContent = `dawn ${formatHourLabel(activity.dawn_peak.hour)}`;
  }
  if (labelRight) {
    labelRight.textContent = `dusk ${formatHourLabel(activity.dusk_peak.hour)}`;
  }
  if (legend) {
    legend.textContent = activity.current.level.toUpperCase();
    if (activity.current.level === 'high') {
      legend.style.color = '#A8B4FF';
    } else {
      legend.style.color = 'var(--text-secondary)';
    }
  }
}

/**
 * Format hour as label (e.g. "6am", "5pm")
 */
function formatHourLabel(hour) {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
}

/**
 * Generate conversational bird headline (mirrors generateHeroSentence style)
 */
function generateBirdHeadline(activity) {
  if (!activity?.current) return 'Bird activity.';
  const { level, hour } = activity.current;
  const dawnHour = activity.dawn_peak?.hour ?? 6;
  const duskHour = activity.dusk_peak?.hour ?? 17;

  // High activity right now
  if (level === 'high') {
    if (hour >= 5 && hour <= 8) return 'Peak bird hour.';
    if (hour >= 16 && hour <= 19) return 'Peak bird hour.';
    return 'Lots of birds about.';
  }

  // Moderate activity
  if (level === 'moderate') {
    if (hour < dawnHour) return `Bird hour at ${formatHourLabel(dawnHour)}.`;
    if (hour >= 12 && hour <= 15) return `Birds back at ${formatHourLabel(duskHour)}.`;
    return 'Some birds about.';
  }

  // Low activity
  if (hour >= 20 || hour <= 3) return 'Not many birds at night.';
  if (hour < dawnHour) return `Bird hour at ${formatHourLabel(dawnHour)}.`;
  if (hour > duskHour) return 'Birds done for today.';
  return 'Quiet for birds right now.';
}

/**
 * Generate bird meta line (mirrors hero-meta style)
 */
function generateBirdMeta(activity, speciesCount) {
  const parts = [];
  if (activity?.current?.level) {
    parts.push(`${activity.current.level} activity`);
  }
  if (speciesCount > 0) {
    parts.push(`${speciesCount} species nearby`);
  }
  return parts.join(' / ');
}

/**
 * Show bird toggle button
 */
export function showBirdToggle() {
  const btn = document.getElementById('bird-toggle-btn');
  if (btn) btn.classList.remove('hidden');
}

/**
 * Render the full bird view content
 * @param {Object} birdData - Full bird data from API
 * @param {Object} activity - Activity curve data
 */
export function renderBirdView(birdData, activity) {
  if (!birdData) return;

  // Render activity strip
  renderBirdStrip(activity);

  // Hero section
  const headlineEl = document.getElementById('bird-hero-headline');
  const metaEl = document.getElementById('bird-hero-meta');
  if (headlineEl && activity) {
    headlineEl.textContent = generateBirdHeadline(activity);
  }
  if (metaEl) {
    const speciesCount = birdData.total_species_count || birdData.all_species?.length || 0;
    metaEl.textContent = generateBirdMeta(activity, speciesCount);
  }

  // Notable species
  const notableEl = document.getElementById('bird-notable');
  if (notableEl && birdData.notable_species && birdData.notable_species.length > 0) {
    const names = birdData.notable_species.map(s => s.common_name).join(', ');
    notableEl.innerHTML = `
      <div class="bird-notable-title">What to look for</div>
      <div class="bird-notable-list">${names}</div>
    `;
  }

  // Species list
  const listEl = document.getElementById('bird-species-list');
  if (listEl) {
    if (!birdData.all_species || birdData.all_species.length === 0) {
      listEl.innerHTML = `
        <div class="bird-species-header">Recent sightings (${birdData.observation_radius_km || 5}km)</div>
        <div class="bird-empty-state">No bird sightings reported nearby today.</div>
      `;
    } else {
      const seen = new Map();
      for (const s of birdData.all_species) {
        if (!seen.has(s.species_code)) {
          seen.set(s.species_code, s);
        }
      }
      const unique = Array.from(seen.values());
      unique.sort((a, b) => new Date(b.observed_at) - new Date(a.observed_at));

      // Only show sightings from the last 12 hours
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const recent = unique.filter(s => new Date(s.observed_at) >= twelveHoursAgo);

      const rows = (recent.length > 0 ? recent : unique.slice(0, 5)).map(s => {
        const time = new Date(s.observed_at);
        const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
        return `
          <div class="bird-species-row">
            <span class="bird-species-name">${s.common_name}</span>
            <span class="bird-species-count">${s.how_many}</span>
            <span class="bird-species-time">${timeStr}</span>
          </div>
        `;
      }).join('');

      listEl.innerHTML = `
        <div class="bird-species-header">Recent sightings (${birdData.observation_radius_km || 5}km)</div>
        ${rows}
      `;
    }
  }

  // Freshness
  const freshnessText = document.getElementById('bird-freshness-text');
  if (freshnessText && birdData.generated_at) {
    freshnessText.textContent = `Bird data · ${formatRelativeTime(birdData.generated_at)}`;
  }
}

/**
 * Toggle between weather and bird views
 * @param {string} view - 'weather' or 'birds'
 */
export function setView(view) {
  const middleGroup = document.querySelector('.middle-group');
  const bottomGroup = document.querySelector('.bottom-group');
  const birdView = document.getElementById('bird-view');
  const toggleBtn = document.getElementById('bird-toggle-btn');
  const birdIcon = toggleBtn?.querySelector('.bird-icon');
  const weatherIcon = toggleBtn?.querySelector('.weather-icon-toggle');
  const weatherFooter = document.getElementById('freshness');
  const birdFooter = document.getElementById('bird-freshness');

  if (view === 'birds') {
    if (middleGroup) middleGroup.classList.add('hidden');
    if (bottomGroup) bottomGroup.classList.add('hidden');
    if (weatherFooter) weatherFooter.classList.add('hidden');
    if (birdView) birdView.classList.remove('hidden');
    if (birdFooter) birdFooter.classList.remove('hidden');
    // Swap icon: show sun (back to weather), hide bird
    if (birdIcon) birdIcon.classList.add('hidden');
    if (weatherIcon) weatherIcon.classList.remove('hidden');
    if (toggleBtn) toggleBtn.title = 'Back to weather';
  } else {
    if (middleGroup) middleGroup.classList.remove('hidden');
    if (bottomGroup) bottomGroup.classList.remove('hidden');
    if (weatherFooter) weatherFooter.classList.remove('hidden');
    if (birdView) birdView.classList.add('hidden');
    if (birdFooter) birdFooter.classList.add('hidden');
    // Swap icon: show bird, hide sun
    if (birdIcon) birdIcon.classList.remove('hidden');
    if (weatherIcon) weatherIcon.classList.add('hidden');
    if (toggleBtn) toggleBtn.title = 'Bird activity';
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
