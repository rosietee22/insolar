/**
 * Main App Logic
 */

import { getForecast, searchCity } from './api.js';
import { getGPSLocation, getCachedLocation, setCityLocation } from './location.js';
import {
  showLoading,
  showError,
  showOfflineWarning,
  hideOfflineWarning,
  renderApp,
  updateFreshness,
  initLastUpdated
} from './ui.js';
// Charts removed in Option A layout redesign

// Cache keys
const FORECAST_CACHE_KEY = 'weather_forecast';
const CACHE_MAX_AGE = 60 * 60 * 1000; // 60 minutes

/**
 * Initialize app
 */
async function init() {
  console.log('Insolar initializing...');

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
  document.getElementById('update-location-btn').addEventListener('click', showLocationOptions);
  document.getElementById('retry-btn').addEventListener('click', retry);
  document.getElementById('allow-location-btn').addEventListener('click', requestGPS);
  document.getElementById('use-city-btn').addEventListener('click', showCitySearch);
  document.getElementById('search-city-btn').addEventListener('click', handleCitySearch);
  document.getElementById('cancel-search-btn').addEventListener('click', hideCitySearch);
  
  // Location options popup
  document.getElementById('refresh-location-btn').addEventListener('click', refreshGPSLocation);
  document.getElementById('cancel-location-btn').addEventListener('click', hideLocationOptions);

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
 * Request GPS location
 */
async function requestGPS() {
  hideLocationPrompt();
  showLoading();

  try {
    const location = await getGPSLocation();
    console.log('Got GPS location:', location);
    await loadForecast(location);
  } catch (error) {
    console.error('GPS error:', error.message);
    showError(`${error.message}. Try searching by city instead.`);
    setTimeout(showLocationPrompt, 2000);
  }
}

/**
 * Show city search modal
 */
function showCitySearch() {
  hideLocationPrompt();
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

/**
 * Display forecast data
 * @param {Object} forecast - Forecast data
 */
function displayForecast(forecast) {
  renderApp(forecast);
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
 * Refresh GPS location from options popup
 */
async function refreshGPSLocation() {
  hideLocationOptions();
  showLoading();

  try {
    const location = await getGPSLocation();
    console.log('Updated location:', location);
    await loadForecast(location);
  } catch (error) {
    console.error('Location update error:', error.message);
    showError(error.message);
  }
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
