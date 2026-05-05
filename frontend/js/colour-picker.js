/**
 * On-page Colour Picker
 * Allows live editing of the Sunbird palette
 */

import { PALETTE, applyTheme, buildTheme } from './theme.js';

const STORAGE_KEY = 'insolar_palette_overrides';

let currentOverrides = {};
let lastWeatherData = null;

/**
 * Load overrides from localStorage
 */
function loadOverrides() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      currentOverrides = JSON.parse(stored);
    }
  } catch (e) {
    currentOverrides = {};
  }
}

/**
 * Save overrides to localStorage
 */
function saveOverrides() {
  try {
    if (Object.keys(currentOverrides).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOverrides));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Get effective palette (defaults + overrides)
 */
export function getEffectivePalette() {
  return { ...PALETTE, ...currentOverrides };
}

/**
 * Check if user has custom overrides
 */
export function hasOverrides() {
  return Object.keys(currentOverrides).length > 0;
}

/**
 * Apply palette overrides to the live theme
 */
function applyOverrides() {
  if (!lastWeatherData) return;

  const palette = getEffectivePalette();

  // Rebuild theme with overridden palette values
  const { is_day, rain_probability, cloud_percent, temp_c, wind_speed_ms, condition_type, timestamp } = lastWeatherData;
  const theme = buildTheme({ is_day, timestamp, rain_probability, cloud_percent, temp_c, wind_speed_ms, condition_type });

  // Override the gradient colours based on custom palette
  // Map the theme's original PALETTE refs to the custom values
  const paletteMap = {
    [PALETTE.sky]: palette.sky,
    [PALETTE.ice]: palette.ice,
    [PALETTE.dusk]: palette.dusk,
    [PALETTE.stone]: palette.stone,
    [PALETTE.clay]: palette.clay,
    [PALETTE.pearl]: palette.pearl,
    [PALETTE.ink]: palette.ink,
    '#1E2145': palette.dusk, // night deep maps to dusk override
  };

  theme.baseFrom = paletteMap[theme.baseFrom] || theme.baseFrom;
  theme.baseTo = paletteMap[theme.baseTo] || theme.baseTo;
  theme.textColor = paletteMap[theme.textColor] || theme.textColor;
  theme.solarColor = palette.pearl;
  theme.solarGlow = `rgba(${hexToRgb(palette.pearl)},0.55)`;

  applyTheme(theme);
}

/**
 * Convert hex to "r,g,b" string
 */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

/**
 * Store weather data for live re-theming
 */
export function setWeatherData(data) {
  lastWeatherData = data;
}

/**
 * Initialize colour picker
 */
export function initColourPicker() {
  loadOverrides();

  const paletteBtn = document.getElementById('palette-btn');
  if (paletteBtn) paletteBtn.addEventListener('click', () => {
    window.location.href = '/colour-lab.html';
  });
}

/**
 * Apply saved overrides on load (call after initial theme is set)
 */
export function applySavedOverrides() {
  if (hasOverrides() && lastWeatherData) {
    applyOverrides();
  }
}
