/**
 * Simple In-Memory Cache
 *
 * Caches forecast data by location key to reduce provider calls.
 * TTL: 30 minutes (1800 seconds)
 */

class Cache {
  constructor() {
    this.store = new Map();
  }

  /**
   * Generate cache key from coordinates
   * @param {number} lat - Rounded latitude
   * @param {number} lon - Rounded longitude
   * @returns {string}
   */
  makeKey(lat, lon) {
    return `${lat},${lon}`;
  }

  /**
   * Get cached value
   * @param {string} key
   * @returns {*|null}
   */
  get(key) {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set cache value with TTL
   * @param {string} key
   * @param {*} value
   * @param {number} ttlSeconds - Time to live in seconds (default 1800 = 30 min)
   */
  set(key, value, ttlSeconds = 1800) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.store.clear();
  }

  /**
   * Get cache size
   * @returns {number}
   */
  size() {
    return this.store.size;
  }
}

// Export singleton instance
module.exports = new Cache();
