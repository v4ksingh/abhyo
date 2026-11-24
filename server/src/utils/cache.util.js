/**
 * High-Performance In-Memory Cache with TTL & Pattern Invalidation
 * Designed for Abhyo LMS & Olympiad Platform
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
    this.lastWarmedAt = null;

    // Automatic garbage collection for expired keys every 60 seconds
    this.gcTimer = setInterval(() => {
      this.purgeExpired();
    }, 60 * 1000);

    // Prevent GC timer from holding the Node.js event loop open
    if (this.gcTimer.unref) {
      this.gcTimer.unref();
    }
  }

  /**
   * Store a key with TTL (in seconds)
   */
  set(key, value, ttlSeconds = 300) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt, createdAt: Date.now() });
    return true;
  }

  /**
   * Retrieve a key from cache
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key) {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Cache-Aside pattern helper: returns cached value or executes fetchFn and caches result
   */
  async wrap(key, ttlSeconds, fetchFn) {
    const cached = this.get(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const freshData = await fetchFn();
    if (freshData !== null && freshData !== undefined) {
      this.set(key, freshData, ttlSeconds);
    }
    return freshData;
  }

  /**
   * Delete a specific key
   */
  del(key) {
    return this.store.delete(key);
  }

  /**
   * Invalidate multiple keys by pattern (e.g. 'categories:*', 'tests:*', or regex)
   */
  delByPattern(pattern) {
    let count = 0;
    const regex = pattern instanceof RegExp
      ? pattern
      : new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all cached keys
   */
  clear() {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Purge expired entries to reclaim memory
   */
  purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Telemetry stats for Admin Dashboard & Health Monitoring
   */
  getStats() {
    this.purgeExpired();
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? ((this.hits / totalRequests) * 100).toFixed(1) : 0;
    
    const keysSummary = [];
    for (const [key, entry] of this.store.entries()) {
      const remainingSeconds = entry.expiresAt ? Math.max(0, Math.round((entry.expiresAt - Date.now()) / 1000)) : 'Never';
      keysSummary.push({ key, remainingSeconds });
    }

    return {
      totalKeys: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      lastWarmedAt: this.lastWarmedAt,
      keys: keysSummary,
    };
  }
}

// Export singleton instance
module.exports = new MemoryCache();
