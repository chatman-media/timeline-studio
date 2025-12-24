import { Database } from "bun:sqlite"
import { createLogger } from "../utils/logger"
import { CacheError } from "../utils/errors"

const logger = createLogger("CacheService")

export interface CacheEntry<T> {
  value: T
  expires: number
}

/**
 * Dual-layer cache service using SQLite for persistence and Map for speed
 * Bun's built-in SQLite provides native performance without serialization overhead
 */
export class CacheService {
  private readonly db: Database
  private readonly memoryCache: Map<string, CacheEntry<unknown>>
  private readonly maxSize: number

  constructor(dbPath: string, maxSize: number = 1000) {
    this.maxSize = maxSize
    this.memoryCache = new Map()

    try {
      // Initialize SQLite database using bun:sqlite
      this.db = new Database(dbPath, { create: true })

      // Create cache table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          expires INTEGER NOT NULL
        )
      `)

      // Create index on expires column for faster cleanup
      this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires)
      `)

      // Clean up expired entries on startup
      this.cleanup()

      logger.info("Cache service initialized", {
        dbPath,
        maxSize,
      })
    } catch (error) {
      throw new CacheError("Failed to initialize cache service", error)
    }
  }

  /**
   * Get value from cache (checks memory first, then SQLite)
   */
  get<T>(key: string): T | undefined {
    // 1. Check memory cache first
    const cached = this.memoryCache.get(key) as CacheEntry<T> | undefined

    if (cached && cached.expires > Date.now()) {
      logger.trace("Memory cache hit", { key })
      return cached.value
    }

    // 2. Check SQLite if not in memory or expired
    try {
      const row = this.db
        .query("SELECT value FROM cache WHERE key = ? AND expires > ?")
        .get(key, Date.now()) as { value: string } | null

      if (row) {
        const value = JSON.parse(row.value) as T

        // Load into memory for faster access next time
        this.memoryCache.set(key, {
          value,
          expires: Date.now() + 1800000, // 30 minutes
        })

        logger.trace("SQLite cache hit", { key })
        return value
      }
    } catch (error) {
      logger.warn("Failed to get from cache", { key, error })
    }

    logger.trace("Cache miss", { key })
    return undefined
  }

  /**
   * Set value in cache (stores in both memory and SQLite)
   */
  set<T>(key: string, value: T, ttl: number = 1800000): void {
    const expires = Date.now() + ttl
    const serialized = JSON.stringify(value)

    try {
      // Save to memory
      this.memoryCache.set(key, { value, expires })

      // Enforce max size (LRU eviction)
      if (this.memoryCache.size > this.maxSize) {
        // Remove oldest entries
        const toDelete = this.memoryCache.size - this.maxSize
        let deleted = 0

        for (const [key] of this.memoryCache) {
          if (deleted >= toDelete) break
          this.memoryCache.delete(key)
          deleted++
        }
      }

      // Persist to SQLite
      this.db.run(
        "INSERT OR REPLACE INTO cache (key, value, expires) VALUES (?, ?, ?)",
        [key, serialized, expires]
      )

      logger.trace("Cache set", { key, ttl })
    } catch (error) {
      logger.warn("Failed to set cache", { key, error })
      throw new CacheError("Failed to set cache value", error)
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  /**
   * Delete key from cache
   */
  delete(key: string): void {
    try {
      this.memoryCache.delete(key)
      this.db.run("DELETE FROM cache WHERE key = ?", [key])

      logger.trace("Cache delete", { key })
    } catch (error) {
      logger.warn("Failed to delete from cache", { key, error })
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      this.memoryCache.clear()
      this.db.run("DELETE FROM cache")

      logger.info("Cache cleared")
    } catch (error) {
      logger.warn("Failed to clear cache", { error })
      throw new CacheError("Failed to clear cache", error)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { memorySize: number; dbSize: number } {
    try {
      const result = this.db
        .query("SELECT COUNT(*) as count FROM cache")
        .get() as { count: number } | null

      return {
        memorySize: this.memoryCache.size,
        dbSize: result?.count || 0,
      }
    } catch (error) {
      logger.warn("Failed to get cache stats", { error })
      return {
        memorySize: this.memoryCache.size,
        dbSize: 0,
      }
    }
  }

  /**
   * Clean up expired entries from SQLite
   */
  private cleanup(): void {
    try {
      const now = Date.now()
      const result = this.db.run("DELETE FROM cache WHERE expires < ?", [now])

      if (result.changes > 0) {
        logger.debug("Cleaned up expired cache entries", {
          count: result.changes,
        })
      }
    } catch (error) {
      logger.warn("Failed to cleanup expired cache entries", { error })
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    try {
      this.cleanup()
      this.db.close()

      logger.info("Cache service closed")
    } catch (error) {
      logger.warn("Error closing cache service", { error })
    }
  }
}
