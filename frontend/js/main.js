/**
 * Main App Logic
 */

import { getForecast, searchCity } from './api.js';
import { 
  getGPSLocation, 
  getApproximateLocation,
  getCachedLocation, 
  setCityLocation,
  detectInAppBrowser,
  isSecureContext,
  wasGPSDenied,
  clearGPSDenied
} from './location.js';
import {
  showLoading,
  showError,
  showOfflineWarning,
  hideOfflineWarning,
  renderApp,
  updateFreshness,
  initLastUpdated,
  renderBirdStrip,
  showBirdToggle,
  renderBirdView,
  setView,
  setTimezone,
  setLocationLat,
  locationNow
} from './ui.js';
import { initColourPicker, setWeatherData, applySavedOverrides } from './colour-picker.js';
import { loadBirdData, toggleView, getCurrentView, calculateActivityCurve, isBirdFeatureAvailable, clearBirdCache } from './birds.js';

// Cache keys
const FORECAST_CACHE_KEY = 'weather_forecast';
const CACHE_MAX_AGE = 60 * 60 * 1000; // 60 minutes

/**
 * Initialize app
 */
async function init() {
  console.log('Sunbird initializing...');

  // Register service worker with auto-update checking
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration);
      
      // Check for updates on every page load
      registration.update();
      
      // Listen for new service worker waiting to activate
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available - auto-refresh
            console.log('New version available, refreshing...');
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        });
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Check online/offline status
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Initialize UI event listeners
  document.getElementById('refresh-btn').addEventListener('click', refresh);
  document.getElementById('bird-refresh-btn')?.addEventListener('click', refreshBirds);
  document.getElementById('update-location-btn').addEventListener('click', showLocationOptions);
  document.getElementById('retry-btn').addEventListener('click', retry);
  
  // Location prompt buttons
  document.getElementById('allow-location-btn').addEventListener('click', handleUseMyLocation);
  document.getElementById('use-approximate-btn')?.addEventListener('click', handleUseApproximate);
  document.getElementById('use-city-btn').addEventListener('click', showCitySearch);
  document.getElementById('search-city-btn').addEventListener('click', handleCitySearch);
  document.getElementById('cancel-search-btn').addEventListener('click', hideCitySearch);
  
  // Location options popup
  document.getElementById('refresh-location-btn').addEventListener('click', handleUseMyLocation);
  document.getElementById('use-approximate-btn-modal')?.addEventListener('click', handleUseApproximateFromOptions);
  document.getElementById('search-location-btn').addEventListener('click', showCitySearchFromOptions);
  document.getElementById('cancel-location-btn').addEventListener('click', hideLocationOptions);
  
  // Location fallback buttons
  document.getElementById('fallback-approximate-btn')?.addEventListener('click', handleUseApproximate);
  document.getElementById('fallback-search-btn')?.addEventListener('click', showCitySearch);
  document.getElementById('fallback-retry-btn')?.addEventListener('click', handleUseMyLocation);
  
  // Bird toggle
  document.getElementById('bird-toggle-btn').addEventListener('click', handleBirdToggle);

  // Initialize colour picker
  initColourPicker();

  // Check for context issues on startup
  checkLocationContext();

  // Try to load cached forecast first
  const cachedForecast = getCachedForecast();
  const cachedLocation = getCachedLocation();

  if (cachedForecast && cachedLocation) {
    console.log('Found cached forecast');
    displayForecast(cachedForecast);

    // Check if stale (> 60 min)
    const age = Date.now() - new Date(cachedForecast.generated_at).getTime();
    if (age > CACHE_MAX_AGE) {
      console.log('Cached forecast is stale, refreshing...');
      await loadForecast(cachedLocation);
    } else {
      console.log('Cached forecast is fresh');
    }
  } else {
    // No cache: request location
    await requestLocation();
  }
}

/**
 * Request location (GPS or city search)
 */
async function requestLocation() {
  console.log('Requesting location...');

  const cachedLocation = getCachedLocation();

  if (cachedLocation) {
    console.log('Using cached location:', cachedLocation);
    await loadForecast(cachedLocation);
  } else {
    // Show location permission prompt
    showLocationPrompt();
  }
}

/**
 * Show location permission prompt
 */
function showLocationPrompt() {
  document.getElementById('location-prompt').classList.remove('hidden');
}

/**
 * Hide location permission prompt
 */
function hideLocationPrompt() {
  document.getElementById('location-prompt').classList.add('hidden');
}

/**
 * Check location context (HTTPS, in-app browser) and show warnings
 */
function checkLocationContext() {
  const { isInApp, appName } = detectInAppBrowser();
  const warningEl = document.getElementById('location-warning');
  
  if (!isSecureContext()) {
    if (warningEl) {
      warningEl.textContent = 'Location requires a secure connection.';
      warningEl.classList.remove('hidden');
    }
    return;
  }
  
  if (isInApp) {
    if (warningEl) {
      warningEl.textContent = `Location may be blocked in ${appName}. Open in Safari or Chrome.`;
      warningEl.classList.remove('hidden');
    }
  }
}

/**
 * Handle "Use my location" button - tries GPS first, falls back gracefully
 */
async function handleUseMyLocation() {
  hideLocationPrompt();
  hideLocationOptions();
  showLoading();
  
  // Clear previous denial flag when user explicitly taps
  clearGPSDenied();

  try {
    const location = await getGPSLocation();
    console.log('Got GPS location:', location);
    await loadForecast(location);
  } catch (error) {
    console.error('GPS error:', error.message);
    
    // GPS failed - show fallback options instead of error
    showLocationFallback(error.message);
  }
}

/**
 * Show fallback options when GPS fails
 */
function showLocationFallback(errorMessage) {
  const fallbackEl = document.getElementById('location-fallback');
  const fallbackMsgEl = document.getElementById('fallback-message');
  
  if (fallbackEl) {
    if (fallbackMsgEl) {
      fallbackMsgEl.textContent = errorMessage.includes('denied') 
        ? 'Location access was denied.' 
        : 'Could not get your precise location.';
    }
    fallbackEl.classList.remove('hidden');
  } else {
    // Fallback if element doesn't exist - show prompt
    showLocationPrompt();
  }
}

/**
 * Hide location fallback
 */
function hideLocationFallback() {
  const fallbackEl = document.getElementById('location-fallback');
  if (fallbackEl) fallbackEl.classList.add('hidden');
}

/**
 * Handle "Use approximate location" button
 */
async function handleUseApproximate() {
  hideLocationPrompt();
  hideLocationFallback();
  showLoading();

  try {
    const location = await getApproximateLocation();
    console.log('Got approximate location:', location);
    await loadForecast(location);
  } catch (error) {
    console.error('Approximate location error:', error.message);
    showError('Could not determine location. Please search instead.');
    setTimeout(showCitySearch, 2000);
  }
}

/**
 * Handle approximate location from options modal
 */
async function handleUseApproximateFromOptions() {
  hideLocationOptions();
  await handleUseApproximate();
}

/**
 * Show city search modal
 */
function showCitySearch() {
  hideLocationPrompt();
  hideLocationFallback();
  document.getElementById('city-search-modal').classList.remove('hidden');
  document.getElementById('city-input').focus();
}

/**
 * Hide city search modal
 */
function hideCitySearch() {
  document.getElementById('city-search-modal').classList.add('hidden');
  document.getElementById('city-input').value = '';
}

/**
 * Handle city search
 */
async function handleCitySearch() {
  const input = document.getElementById('city-input');
  const query = input.value.trim();

  if (!query) {
    alert('Please enter a city name');
    return;
  }

  hideCitySearch();
  showLoading();

  try {
    const result = await searchCity(query);
    console.log('Found city:', result);

    const location = setCityLocation(result.lat, result.lon, result.name, result.country);
    await loadForecast(location);
  } catch (error) {
    console.error('City search error:', error.message);
    showError(error.message);
  }
}

/**
 * Load forecast for given location
 * @param {Object} location - {lat, lon}
 */
async function loadForecast(location) {
  showLoading();
  hideOfflineWarning();

  try {
    const forecast = await getForecast(location.lat, location.lon);
    console.log('Loaded forecast:', forecast);

    // Cache forecast
    cacheForecast(forecast);

    // Display
    displayForecast(forecast);

  } catch (error) {
    console.error('Forecast fetch error:', error);

    // Try to show cached forecast if available
    const cachedForecast = getCachedForecast();
    if (cachedForecast) {
      console.log('Network failed, showing cached forecast');
      displayForecast(cachedForecast);
      showOfflineWarning(cachedForecast.generated_at);
    } else {
      showError(error.message);
    }
  }
}

// Store current weather for bird activity calculations
let currentWeatherData = null;
let currentBirdData = null;

/**
 * Display forecast data
 * @param {Object} forecast - Forecast data
 */
function displayForecast(forecast) {
  // Set location timezone and latitude before any rendering
  if (forecast.timezone) setTimezone(forecast.timezone);
  const loc = getCachedLocation();
  if (loc?.lat != null) setLocationLat(loc.lat);

  renderApp(forecast);
  // Store weather data for colour picker live re-theming
  if (forecast.current) {
    setWeatherData(forecast.current);
    applySavedOverrides();
    currentWeatherData = forecast.current;
    // Load bird data in background
    loadBirdsInBackground(forecast);
  }
}

/**
 * Load bird data in the background (non-blocking)
 */
async function loadBirdsInBackground(forecast) {
  const location = getCachedLocation();
  if (!location) return;

  const weather = {
    temp_c: forecast.current.temp_c,
    rain_probability: forecast.current.rain_probability,
    wind_speed_ms: forecast.current.wind_speed_ms,
    cloud_percent: forecast.current.cloud_percent,
  };

  const locNow = locationNow();
  const locTime = { hour: locNow.getHours(), month: locNow.getMonth() };

  try {
    const birdData = await loadBirdData(location.lat, location.lon, weather, locTime);

    if (isBirdFeatureAvailable() === false) {
      // No API key configured — hide bird UI
      return;
    }

    if (birdData) {
      currentBirdData = birdData;
      const activity = birdData.activity || calculateActivityCurve(weather, locTime);

      // Show bird toggle and pre-render bird view
      showBirdToggle();
      renderBirdView(birdData, activity);
    }
  } catch (error) {
    console.error('Background bird load failed:', error);
  }
}

/**
 * Handle bird toggle button
 */
function handleBirdToggle() {
  const newView = toggleView();
  setView(newView);
}

/**
 * Refresh forecast
 */
async function refresh() {
  const location = getCachedLocation();

  if (!location) {
    showError('No location available. Please allow location access.');
    return;
  }

  await loadForecast(location);
}

/**
 * Refresh bird data (clears cache and re-fetches)
 */
async function refreshBirds() {
  const location = getCachedLocation();
  if (!location || !currentWeatherData) return;

  clearBirdCache();

  const weather = {
    temp_c: currentWeatherData.temp_c,
    rain_probability: currentWeatherData.rain_probability,
    wind_speed_ms: currentWeatherData.wind_speed_ms,
    cloud_percent: currentWeatherData.cloud_percent,
  };

  const locNow = locationNow();
  const locTime = { hour: locNow.getHours(), month: locNow.getMonth() };

  try {
    const birdData = await loadBirdData(location.lat, location.lon, weather, locTime);
    if (birdData) {
      currentBirdData = birdData;
      const activity = birdData.activity || calculateActivityCurve(weather, locTime);
      renderBirdView(birdData, activity);
    }
  } catch (error) {
    console.error('Bird refresh failed:', error);
  }
}

/**
 * Show location options popup
 */
function showLocationOptions() {
  document.getElementById('location-options-modal').classList.remove('hidden');
}

/**
 * Hide location options popup
 */
function hideLocationOptions() {
  document.getElementById('location-options-modal').classList.add('hidden');
}


/**
 * Show city search from location options
 */
function showCitySearchFromOptions() {
  hideLocationOptions();
  document.getElementById('city-search-modal').classList.remove('hidden');
  document.getElementById('city-input').focus();
}

/**
 * Retry after error
 */
async function retry() {
  const location = getCachedLocation();

  if (location) {
    await loadForecast(location);
  } else {
    await requestLocation();
  }
}

/**
 * Handle online event
 */
async function handleOnline() {
  console.log('Back online');
  hideOfflineWarning();

  // Auto-refresh if stale
  const cachedForecast = getCachedForecast();
  if (cachedForecast) {
    const age = Date.now() - new Date(cachedForecast.generated_at).getTime();
    if (age > CACHE_MAX_AGE) {
      console.log('Auto-refreshing on reconnect');
      await refresh();
    }
  }
}

/**
 * Handle offline event
 */
function handleOffline() {
  console.log('Gone offline');
  const cachedForecast = getCachedForecast();
  if (cachedForecast) {
    showOfflineWarning(cachedForecast.generated_at);
  }
}

/**
 * Cache forecast in localStorage
 * @param {Object} forecast
 */
function cacheForecast(forecast) {
  try {
    localStorage.setItem(FORECAST_CACHE_KEY, JSON.stringify(forecast));
    localStorage.setItem('last_updated', forecast.generated_at);
  } catch (error) {
    console.error('Cache storage error:', error);
  }
}

/**
 * Get cached forecast from localStorage
 * @returns {Object|null}
 */
function getCachedForecast() {
  try {
    const cached = localStorage.getItem(FORECAST_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
