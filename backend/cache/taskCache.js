// =========================================================================
// Practical 9 – Shared Cache Module
// A single shared NodeCache instance (singleton) with a 60-second TTL.
// Using a singleton ensures all modules that require this file share the
// same in-memory store — just like the EventEmitter in Practical 10.
// =========================================================================

const NodeCache = require('node-cache');

// stdTTL: default Time-To-Live in seconds (60s is reasonable for tasks)
// checkperiod: how often (seconds) NodeCache auto-deletes expired keys
const cache = new NodeCache({ stdTTL: 60, checkperiod: 10 });

// ── Cache hit/miss counters (Supplementary Problem) ──────────────────────
let stats = { hits: 0, misses: 0 };

/**
 * Get a value from cache. Increments hit/miss counter automatically.
 * @param {string} key
 * @returns {any|undefined}
 */
cache.getWithStats = (key) => {
  const value = cache.get(key);
  if (value !== undefined) {
    stats.hits++;
    console.log(`[Cache] HIT  → key: "${key}" | hits: ${stats.hits}, misses: ${stats.misses}`);
  } else {
    stats.misses++;
    console.log(`[Cache] MISS → key: "${key}" | hits: ${stats.hits}, misses: ${stats.misses}`);
  }
  return value;
};

/**
 * Returns the current hit/miss stats.
 */
cache.getStats = () => ({ ...stats, keys: cache.keys() });

module.exports = cache;
