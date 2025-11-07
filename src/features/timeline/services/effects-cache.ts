/**
 * Улучшенный кеш для эффектов на основе PreviewCache
 * Адаптирован для работы с AppliedEffect из timeline
 */

import { createLogger } from "@/lib/tauri-logger"
import type { AppliedEffect } from "../types"

const logger = createLogger("EffectsCache")

interface CacheEntry {
  bitmap: ImageBitmap
  timestamp: number
  size: number
  lastAccessed: number
}

export class EffectsCache {
  private cache = new Map<string, CacheEntry>()
  private maxSizeBytes: number
  private currentSizeBytes = 0
  private hits = 0
  private misses = 0

  constructor(maxSizeMB = 100) {
    this.maxSizeBytes = maxSizeMB * 1024 * 1024
  }

  /**
   * Сохранить кадр в кеш
   */
  async set(key: string, canvas: HTMLCanvasElement | ImageBitmap): Promise<void> {
    try {
      // Создаем ImageBitmap если передан canvas
      const bitmap = canvas instanceof ImageBitmap ? canvas : await createImageBitmap(canvas)

      const size = bitmap.width * bitmap.height * 4 // RGBA

      // Проверяем, помещается ли в кеш
      while (this.currentSizeBytes + size > this.maxSizeBytes && this.cache.size > 0) {
        this.evictOldest()
      }

      const entry: CacheEntry = {
        bitmap,
        timestamp: Date.now(),
        size,
        lastAccessed: Date.now(),
      }

      this.cache.set(key, entry)
      this.currentSizeBytes += size
    } catch (error) {
      logger.warn("Failed to cache frame:", { error })
    }
  }

  /**
   * Получить кадр из кеша
   */
  get(key: string): ImageBitmap | null {
    const entry = this.cache.get(key)

    if (entry) {
      // Обновляем время доступа и перемещаем в конец (LRU)
      entry.lastAccessed = Date.now()
      this.cache.delete(key)
      this.cache.set(key, entry)

      this.hits++
      return entry.bitmap
    }

    this.misses++
    return null
  }

  /**
   * Проверить наличие в кеше
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Генерировать ключ кеша
   */
  static generateKey(timestamp: number, effects: AppliedEffect[]): string {
    const enabledEffects = effects
      .filter((e) => e.enabled)
      .map((e) => ({
        id: e.effectId,
        params: e.customParams,
        // keyframes: e.keyframes,
      }))

    // Простой хеш на основе JSON
    const effectsHash = EffectsCache.simpleHash(JSON.stringify(enabledEffects))
    return `${timestamp.toFixed(3)}_${effectsHash}`
  }

  /**
   * Простая хеш-функция
   */
  private static simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash &= hash
    }
    return hash.toString(36)
  }

  /**
   * Удалить самую старую запись (LRU)
   */
  private evictOldest(): void {
    const firstEntry = this.cache.entries().next()
    if (!firstEntry.done) {
      const [key, entry] = firstEntry.value
      this.cache.delete(key)
      this.currentSizeBytes -= entry.size

      // Освобождаем память
      entry.bitmap.close?.()
    }
  }

  /**
   * Очистить весь кеш
   */
  invalidate(): void {
    // Освобождаем ImageBitmap ресурсы
    for (const entry of this.cache.values()) {
      entry.bitmap.close?.()
    }

    this.cache.clear()
    this.currentSizeBytes = 0
    this.hits = 0
    this.misses = 0
  }

  /**
   * Получить статистику кеша
   */
  getStats() {
    const hitRate = this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0

    return {
      entries: this.cache.size,
      sizeBytes: this.currentSizeBytes,
      sizeMB: this.currentSizeBytes / (1024 * 1024),
      maxSizeMB: this.maxSizeBytes / (1024 * 1024),
      fillPercentage: (this.currentSizeBytes / this.maxSizeBytes) * 100,
      hits: this.hits,
      misses: this.misses,
      hitRate,
    }
  }

  /**
   * Предзагрузка кадров вокруг текущей позиции
   */
  async prefetch(
    centerTimestamp: number,
    range: number,
    fps: number,
    effects: AppliedEffect[],
    renderFrame: (timestamp: number) => Promise<HTMLCanvasElement | ImageBitmap | null>,
  ): Promise<void> {
    const frameTime = 1 / fps
    const startTime = Math.max(0, centerTimestamp - range)
    const endTime = centerTimestamp + range

    const promises: Promise<void>[] = []

    for (let t = startTime; t <= endTime; t += frameTime) {
      const key = EffectsCache.generateKey(t, effects)

      if (!this.has(key)) {
        promises.push(
          renderFrame(t)
            .then((result) => {
              if (result) {
                return this.set(key, result)
              }
            })
            .catch((error) => {
              logger.warn(`Failed to prefetch frame at ${t}:`, error)
            }),
        )
      }
    }

    await Promise.all(promises)
  }

  /**
   * Очистить ресурсы
   */
  dispose(): void {
    this.invalidate()
  }
}
