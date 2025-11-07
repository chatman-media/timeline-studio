/**
 * LRU Cache for preview frames
 */

import { createLogger } from "@/lib/tauri-logger"
import type { Effect } from "../types"

const logger = createLogger({ module: "PreviewCache" })

interface CacheEntry {
  bitmap: ImageBitmap
  timestamp: number
  size: number
  lastAccessed: number
}

export class PreviewCache {
  private cache = new Map<string, CacheEntry>()
  private maxSizeBytes: number
  private currentSizeBytes = 0

  constructor(maxSizeMB = 100) {
    this.maxSizeBytes = maxSizeMB * 1024 * 1024
  }

  /**
   * Generate cache key from timestamp and effects
   */
  getCacheKey(timestamp: number, effects: Effect[]): string {
    const effectsHash = this.hashEffects(effects)
    return `${timestamp.toFixed(3)}_${effectsHash}`
  }

  /**
   * Hash effects configuration
   */
  private hashEffects(effects: Effect[]): string {
    const enabledEffects = effects
      .filter((e) => e.enabled)
      .map((e) => ({
        type: e.type,
        params: e.parameters,
        intensity: e.intensity,
      }))

    return this.simpleHash(JSON.stringify(enabledEffects))
  }

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash &= hash
    }
    return hash.toString(36)
  }

  /**
   * Get cached frame or compute new one
   */
  async getOrCompute(timestamp: number, effects: Effect[], compute: () => Promise<ImageBitmap>): Promise<ImageBitmap> {
    const key = this.getCacheKey(timestamp, effects)

    // Check if exists in cache
    const cached = this.cache.get(key)
    if (cached) {
      cached.lastAccessed = Date.now()
      this.cache.delete(key)
      this.cache.set(key, cached) // Move to end (LRU)
      return cached.bitmap
    }

    // Compute new frame
    const bitmap = await compute()

    // Add to cache
    const size = bitmap.width * bitmap.height * 4 // RGBA
    const entry: CacheEntry = {
      bitmap,
      timestamp,
      size,
      lastAccessed: Date.now(),
    }

    // Evict old entries if needed
    while (this.currentSizeBytes + size > this.maxSizeBytes && this.cache.size > 0) {
      this.evictOldest()
    }

    this.cache.set(key, entry)
    this.currentSizeBytes += size

    return bitmap
  }

  /**
   * Prefetch frames around current position
   */
  async prefetch(
    centerTimestamp: number,
    range: number,
    fps: number,
    effects: Effect[],
    compute: (timestamp: number) => Promise<ImageBitmap>,
  ): Promise<void> {
    const frameTime = 1 / fps
    const startTime = centerTimestamp - range
    const endTime = centerTimestamp + range

    const promises: Promise<void>[] = []

    for (let t = startTime; t <= endTime; t += frameTime) {
      const key = this.getCacheKey(t, effects)

      if (!this.cache.has(key)) {
        promises.push(
          compute(t)
            .then((bitmap) => {
              const size = bitmap.width * bitmap.height * 4
              const entry: CacheEntry = {
                bitmap,
                timestamp: t,
                size,
                lastAccessed: Date.now(),
              }

              if (this.currentSizeBytes + size <= this.maxSizeBytes) {
                this.cache.set(key, entry)
                this.currentSizeBytes += size
              }
            })
            .catch((err: unknown) => {
              logger.warn(`Failed to prefetch frame at ${t}:`, err)
            }),
        )
      }
    }

    await Promise.all(promises)
  }

  /**
   * Clear cache when effects change
   */
  invalidate(effects?: Effect[]): void {
    if (!effects) {
      // Clear entire cache
      this.cache.clear()
      this.currentSizeBytes = 0
      return
    }

    // Clear only entries with matching effects
    const effectsHash = this.hashEffects(effects)
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache) {
      if (key.endsWith(`_${effectsHash}`)) {
        keysToDelete.push(key)
        this.currentSizeBytes -= entry.size
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key)
    }
  }

  /**
   * Evict oldest entry (LRU)
   */
  private evictOldest(): void {
    const entryResult = this.cache.entries().next()
    if (!entryResult.done) {
      const [oldestKey, oldestEntry] = entryResult.value
      if (oldestKey && oldestEntry) {
        this.cache.delete(oldestKey)
        this.currentSizeBytes -= oldestEntry.size
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      entries: this.cache.size,
      sizeBytes: this.currentSizeBytes,
      sizeMB: this.currentSizeBytes / (1024 * 1024),
      maxSizeMB: this.maxSizeBytes / (1024 * 1024),
      fillPercentage: (this.currentSizeBytes / this.maxSizeBytes) * 100,
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.cache.clear()
    this.currentSizeBytes = 0
  }
}
