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
   * @param {number} maxResults
   * @returns {Promise<Array>} Raw eBird observations
   */
  async getRecentObservations(lat, lon, maxResults = 50) {
    if (!this.isAvailable()) {
      throw new Error('eBird API key not configured');
    }

    const url = `${this.baseUrl}/data/obs/geo/recent?lat=${lat}&lng=${lon}&maxResults=${maxResults}&back=1`;

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
    return rawObs.map(obs => ({
      common_name: obs.comName,
      scientific_name: obs.sciName,
      how_many: obs.howMany || 1,
      observed_at: obs.obsDt,
      location_name: obs.locName,
      species_code: obs.speciesCode,
    }));
  }

  /**
   * Deduplicate and select notable species
   * Prefers most recently observed, deduplicates by species code
   * @param {Array} species - Transformed species list
   * @param {number} count - Number to select
   * @returns {Array} Notable species
   */
  selectNotableSpecies(species, count = 3) {
    const seen = new Map();

    for (const s of species) {
      if (!seen.has(s.species_code)) {
        seen.set(s.species_code, s);
      }
    }

    // Sort by most recent observation
    const unique = Array.from(seen.values());
    unique.sort((a, b) => new Date(b.observed_at) - new Date(a.observed_at));

    return unique.slice(0, count);
  }
}

module.exports = EBirdProvider;
