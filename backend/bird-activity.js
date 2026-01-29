/**
 * Bird Activity Model
 * Predicts bird activity levels based on time, weather, and season.
 * Runs server-side and is mirrored client-side for instant recalculation.
 */

/**
 * Calculate activity score for a specific hour
 * @param {number} hour - Hour of day (0-23)
 * @param {Object} weather - { temp_c, rain_probability, wind_speed_ms, cloud_percent }
 * @param {number} month - Month (0-11)
 * @returns {Object} { score, label }
 */
function scoreHour(hour, weather, month) {
  let score = 50;
  let label = 'Not much about';

  // TIME OF DAY (biggest factor)
  if (hour >= 5 && hour <= 7) {
    score += 30;
    label = 'Best time to spot birds';
  } else if (hour === 8) {
    score += 20;
    label = 'Great for spotting';
  } else if (hour >= 9 && hour <= 11) {
    score += 10;
    label = 'Good chance of sightings';
  } else if (hour >= 12 && hour <= 14) {
    score -= 5;
    label = 'Fewer birds around';
  } else if (hour >= 15 && hour <= 16) {
    score += 10;
    label = 'Birds picking up again';
  } else if (hour >= 17 && hour <= 18) {
    score += 20;
    label = 'Lots of activity';
  } else if (hour === 19) {
    score += 5;
    label = 'Last chance today';
  } else {
    score -= 20;
    label = 'Not much about';
  }

  // WEATHER PENALTIES
  if (weather.rain_probability > 60) {
    score -= 20;
    if (score < 40) label = 'Rain keeping birds hidden';
  } else if (weather.rain_probability > 30) {
    score -= 10;
  }

  if (weather.wind_speed_ms > 10) {
    score -= 15;
    if (score < 40) label = 'Too windy for most birds';
  } else if (weather.wind_speed_ms > 6) {
    score -= 5;
  }

  // SEASON
  if ([2, 3, 4].includes(month)) score += 15;      // Spring migration
  else if ([8, 9].includes(month)) score += 10;     // Autumn migration
  else if ([11, 0, 1].includes(month)) score -= 5;  // Winter

  // TEMPERATURE
  if (weather.temp_c >= 10 && weather.temp_c <= 22) score += 5;
  if (weather.temp_c < 0) score -= 10;
  if (weather.temp_c > 30) score -= 10;

  // Light overcast + dry is good for birding
  if (weather.cloud_percent > 30 && weather.cloud_percent < 70 && weather.rain_probability < 20) {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));

  return { score, label };
}

/**
 * Generate 24-hour activity curve
 * @param {Object} weather - Current weather conditions
 * @returns {Object} { curve, current, dawn_peak, dusk_peak }
 */
function calculateActivityCurve(weather = {}) {
  const now = new Date();
  const month = now.getMonth();
  const currentHour = now.getHours();

  const w = {
    temp_c: weather.temp_c ?? 10,
    rain_probability: weather.rain_probability ?? 0,
    wind_speed_ms: weather.wind_speed_ms ?? 0,
    cloud_percent: weather.cloud_percent ?? 50,
  };

  // Generate score for each hour
  const curve = [];
  let dawnPeak = { hour: 6, score: 0 };
  let duskPeak = { hour: 17, score: 0 };

  for (let h = 0; h < 24; h++) {
    const { score, label } = scoreHour(h, w, month);
    curve.push({ hour: h, score, label });

    // Track dawn peak (5-9am)
    if (h >= 5 && h <= 9 && score > dawnPeak.score) {
      dawnPeak = { hour: h, score };
    }
    // Track dusk peak (15-19pm)
    if (h >= 15 && h <= 19 && score > duskPeak.score) {
      duskPeak = { hour: h, score };
    }
  }

  const current = curve[currentHour];
  const level = current.score >= 70 ? 'high' : current.score >= 40 ? 'moderate' : 'low';

  return {
    curve,
    current: { ...current, level },
    dawn_peak: dawnPeak,
    dusk_peak: duskPeak,
  };
}

module.exports = { calculateActivityCurve, scoreHour };
