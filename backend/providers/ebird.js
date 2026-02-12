/**
 * eBird API Provider
 * Fetches recent bird observations from the Cornell Lab of Ornithology
 */

class EBirdProvider {
  constructor() {
    this.apiKey = process.env.EBIRD_API_KEY;
    this.baseUrl = 'https://api.ebird.org/v2';
  }

  /**
   * Check if provider is configured
   */
  isAvailable() {
    return !!(this.apiKey && this.apiKey !== 'your_ebird_api_key_here');
  }

  /**
   * Fetch recent observations near coordinates
   * @param {number} lat
   * @param {number} lon
   * @param {Object} opts - { dist, back, maxResults }
   * @returns {Promise<Array>} Raw eBird observations
   */
  async getRecentObservations(lat, lon, { dist = 3, back = 5, maxResults = 100 } = {}) {
    if (!this.isAvailable()) {
      throw new Error('eBird API key not configured');
    }

    const url = `${this.baseUrl}/data/obs/geo/recent?lat=${lat}&lng=${lon}&maxResults=${maxResults}&back=${back}&dist=${dist}`;

    const response = await fetch(url, {
      headers: { 'X-eBirdApiToken': this.apiKey }
    });

    if (!response.ok) {
      throw new Error(`eBird API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Transform raw eBird data to our schema
   * @param {Array} rawObs - Raw eBird observations
   * @returns {Array} Transformed species list
   */
  transformObservations(rawObs) {
    return rawObs.map(obs => {
      // eBird obsDt is local time at observation location: "YYYY-MM-DD HH:mm"
      const timePart = obs.obsDt?.split(' ')[1];
      const obsHour = timePart ? parseInt(timePart.split(':')[0], 10) : null;

      return {
        common_name: obs.comName,
        scientific_name: obs.sciName,
        how_many: obs.howMany || 1,
        observed_at: obs.obsDt,
        obs_hour: obsHour,
        location_name: obs.locName,
        species_code: obs.speciesCode,
      };
    });
  }

  /**
   * Circular hour distance (wraps around midnight)
   */
  hourDistance(h1, h2) {
    const diff = Math.abs(h1 - h2);
    return Math.min(diff, 24 - diff);
  }

  /**
   * Deduplicate species, keeping the observation closest to locationHour.
   * If locationHour is null, falls back to most recent observation.
   * @param {Array} species - Transformed species list
   * @param {number|null} locationHour - Current hour at location (0-23)
   * @returns {Array} Deduplicated species sorted by time-of-day relevance
   */
  deduplicateAndScore(species, locationHour = null) {
    const byCode = new Map();

    for (const s of species) {
      const existing = byCode.get(s.species_code);

      if (!existing) {
        byCode.set(s.species_code, s);
      } else if (locationHour !== null && s.obs_hour !== null) {
        // Keep the observation closest to the current time of day
        const existingDist = existing.obs_hour !== null
          ? this.hourDistance(existing.obs_hour, locationHour)
          : 24;
        const newDist = this.hourDistance(s.obs_hour, locationHour);
        if (newDist < existingDist) {
          byCode.set(s.species_code, s);
        }
      }
    }

    const unique = Array.from(byCode.values());

    if (locationHour !== null) {
      // Sort by time-of-day proximity (closest first)
      unique.sort((a, b) => {
        const distA = a.obs_hour !== null ? this.hourDistance(a.obs_hour, locationHour) : 24;
        const distB = b.obs_hour !== null ? this.hourDistance(b.obs_hour, locationHour) : 24;
        return distA - distB;
      });
    } else {
      // Fallback: sort by most recent
      unique.sort((a, b) => new Date(b.observed_at) - new Date(a.observed_at));
    }

    return unique;
  }

  /**
   * Select notable species (top N by time-of-day relevance)
   * @param {Array} scored - Deduplicated & sorted species
   * @param {number} count - Number to select
   * @returns {Array} Notable species
   */
  selectNotableSpecies(scored, count = 3) {
    return scored.slice(0, count);
  }
}

module.exports = EBirdProvider;
