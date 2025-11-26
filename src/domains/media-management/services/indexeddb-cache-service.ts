import { clear as clearStore, createStore, del, entries, get, set, type UseStore } from "idb-keyval"

import type { RecognitionFrame, SubtitleFrame, TimelineFrame } from "@/domains/video-editing/services/compiler"

/**
 * Типы для различных кэшей
 */
export interface CachedPreview {
  fileId: string
  thumbnail: string
  timestamp: number
  size: number
}

export interface CachedFrames {
  fileId: string
  frames: TimelineFrame[]
  timestamp: number
  size: number
}

export interface CachedRecognition {
  fileId: string
  frames: RecognitionFrame[]
  timestamp: number
  size: number
}

export interface CachedSubtitles {
  fileId: string
  frames: SubtitleFrame[]
  timestamp: number
  size: number
}

/**
 * Статистика кэша
 */
export interface CacheStatistics {
  previewCache: {
    count: number
    size: number
  }
  frameCache: {
    count: number
    size: number
  }
  recognitionCache: {
    count: number
    size: number
  }
  subtitleCache: {
    count: number
    size: number
  }
  totalSize: number
}

/**
 * Сервис для работы с IndexedDB кэшем
 */
export class IndexedDBCacheService {
  private static instance: IndexedDBCacheService | null = null

  // Отдельные хранилища для разных типов данных
  private previewStore: UseStore
  private frameStore: UseStore
  private recognitionStore: UseStore
  private subtitleStore: UseStore

  // Максимальный размер кэша в байтах (500MB)
  private readonly MAX_CACHE_SIZE = 500 * 1024 * 1024

  // Время жизни кэша в миллисекундах (30 дней)
  private readonly CACHE_TTL = 30 * 24 * 60 * 60 * 1000

  private constructor() {
    // Создаем отдельные хранилища для разных типов данных
    this.previewStore = createStore("timeline-studio-preview-cache", "preview-store")
    this.frameStore = createStore("timeline-studio-frame-cache", "frame-store")
    this.recognitionStore = createStore("timeline-studio-recognition-cache", "recognition-store")
    this.subtitleStore = createStore("timeline-studio-subtitle-cache", "subtitle-store")
  }

  /**
   * Получить экземпляр сервиса (singleton)
   */
  public static getInstance(): IndexedDBCacheService {
    if (!IndexedDBCacheService.instance) {
      IndexedDBCacheService.instance = new IndexedDBCacheService()
    }
    return IndexedDBCacheService.instance
  }

  /**
   * Сохранить превью в кэш
   */
  public async cachePreview(fileId: string, thumbnail: string): Promise<void> {
    const size = this.estimateStringSize(thumbnail)
    const cached: CachedPreview = {
      fileId,
      thumbnail,
      timestamp: Date.now(),
      size,
    }

    await set(fileId, cached, this.previewStore)
    await this.cleanupIfNeeded()
  }

  /**
   * Получить превью из кэша
   */
  public async getCachedPreview(fileId: string): Promise<string | null> {
    const cached = await get<CachedPreview>(fileId, this.previewStore)

    if (!cached) return null

    // Проверяем TTL
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      await del(fileId, this.previewStore)
      return null
    }

    return cached.thumbnail
  }

  /**
   * Сохранить кадры timeline в кэш
   */
  public async cacheTimelineFrames(fileId: string, frames: TimelineFrame[]): Promise<void> {
    const size = this.estimateObjectSize(frames)
    const cached: CachedFrames = {
      fileId,
      frames,
      timestamp: Date.now(),
      size,
    }

    await set(fileId, cached, this.frameStore)
    await this.cleanupIfNeeded()
  }

  /**
   * Получить кадры timeline из кэша
   */
  public async getCachedTimelineFrames(fileId: string): Promise<TimelineFrame[] | null> {
    const cached = await get<CachedFrames>(fileId, this.frameStore)

    if (!cached) return null

    // Проверяем TTL
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      await del(fileId, this.frameStore)
      return null
    }

    return cached.frames
  }

  /**
   * Сохранить результаты распознавания в кэш
   */
  public async cacheRecognitionFrames(fileId: string, frames: RecognitionFrame[]): Promise<void> {
    const size = this.estimateObjectSize(frames)
    const cached: CachedRecognition = {
      fileId,
      frames,
      timestamp: Date.now(),
      size,
    }

    await set(fileId, cached, this.recognitionStore)
    await this.cleanupIfNeeded()
  }

  /**
   * Получить результаты распознавания из кэша
   */
  public async getCachedRecognitionFrames(fileId: string): Promise<RecognitionFrame[] | null> {
    const cached = await get<CachedRecognition>(fileId, this.recognitionStore)

    if (!cached) return null

    // Проверяем TTL
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      await del(fileId, this.recognitionStore)
      return null
    }

    return cached.frames
  }

  /**
   * Сохранить кадры субтитров в кэш
   */
  public async cacheSubtitleFrames(fileId: string, frames: SubtitleFrame[]): Promise<void> {
    const size = this.estimateObjectSize(frames)
    const cached: CachedSubtitles = {
      fileId,
      frames,
      timestamp: Date.now(),
      size,
    }

    await set(fileId, cached, this.subtitleStore)
    await this.cleanupIfNeeded()
  }

  /**
   * Получить кадры субтитров из кэша
   */
  public async getCachedSubtitleFrames(fileId: string): Promise<SubtitleFrame[] | null> {
    const cached = await get<CachedSubtitles>(fileId, this.subtitleStore)

    if (!cached) return null

    // Проверяем TTL
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      await del(fileId, this.subtitleStore)
      return null
    }

    return cached.frames
  }

  /**
   * Получить статистику кэша
   */
  public async getCacheStatistics(): Promise<CacheStatistics> {
    const stats: CacheStatistics = {
      previewCache: { count: 0, size: 0 },
      frameCache: { count: 0, size: 0 },
      recognitionCache: { count: 0, size: 0 },
      subtitleCache: { count: 0, size: 0 },
      totalSize: 0,
    }

    // Подсчет превью
    const previewEntries = await entries<string, CachedPreview>(this.previewStore)
    for (const [, cached] of previewEntries) {
      stats.previewCache.count++
      stats.previewCache.size += cached.size
    }

    // Подсчет кадров timeline
    const frameEntries = await entries<string, CachedFrames>(this.frameStore)
    for (const [, cached] of frameEntries) {
      stats.frameCache.count++
      stats.frameCache.size += cached.size
    }

    // Подсчет результатов распознавания
    const recognitionEntries = await entries<string, CachedRecognition>(this.recognitionStore)
    for (const [, cached] of recognitionEntries) {
      stats.recognitionCache.count++
      stats.recognitionCache.size += cached.size
    }

    // Подсчет кадров субтитров
    const subtitleEntries = await entries<string, CachedSubtitles>(this.subtitleStore)
    for (const [, cached] of subtitleEntries) {
      stats.subtitleCache.count++
      stats.subtitleCache.size += cached.size
    }

    // Общий размер
    stats.totalSize =
      stats.previewCache.size + stats.frameCache.size + stats.recognitionCache.size + stats.subtitleCache.size

    return stats
  }

  /**
   * Удалить конкретное превью из кэша
   */
  public async deletePreview(fileId: string): Promise<void> {
    await del(fileId, this.previewStore)
  }

  /**
   * Очистить кэш превью
   */
  public async clearPreviewCache(): Promise<void> {
    await clearStore(this.previewStore)
  }

  /**
   * Очистить кэш кадров
   */
  public async clearFrameCache(): Promise<void> {
    await clearStore(this.frameStore)
  }

  /**
   * Очистить кэш распознавания
   */
  public async clearRecognitionCache(): Promise<void> {
    await clearStore(this.recognitionStore)
  }

  /**
   * Очистить кэш субтитров
   */
  public async clearSubtitleCache(): Promise<void> {
    await clearStore(this.subtitleStore)
  }

  /**
   * Очистить весь кэш
   */
  public async clearAllCache(): Promise<void> {
    await Promise.all([
      this.clearPreviewCache(),
      this.clearFrameCache(),
      this.clearRecognitionCache(),
      this.clearSubtitleCache(),
    ])
  }

  /**
   * Очистить устаревшие записи
   */
  public async cleanupExpiredCache(): Promise<void> {
    const now = Date.now()

    // Очистка превью
    const previewEntries = await entries<string, CachedPreview>(this.previewStore)
    for (const [key, cached] of previewEntries) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        await del(key, this.previewStore)
      }
    }

    // Очистка кадров
    const frameEntries = await entries<string, CachedFrames>(this.frameStore)
    for (const [key, cached] of frameEntries) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        await del(key, this.frameStore)
      }
    }

    // Очистка распознавания
    const recognitionEntries = await entries<string, CachedRecognition>(this.recognitionStore)
    for (const [key, cached] of recognitionEntries) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        await del(key, this.recognitionStore)
      }
    }

    // Очистка субтитров
    const subtitleEntries = await entries<string, CachedSubtitles>(this.subtitleStore)
    for (const [key, cached] of subtitleEntries) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        await del(key, this.subtitleStore)
      }
    }
  }

  /**
   * Проверить и очистить кэш при необходимости
   */
  private async cleanupIfNeeded(): Promise<void> {
    const stats = await this.getCacheStatistics()

    if (stats.totalSize > this.MAX_CACHE_SIZE) {
      // Удаляем самые старые записи, пока не освободим достаточно места
      await this.removeOldestEntries(stats.totalSize - this.MAX_CACHE_SIZE * 0.8)
    }
  }

  /**
   * Удалить самые старые записи
   */
  private async removeOldestEntries(bytesToFree: number): Promise<void> {
    let freedBytes = 0

    // Собираем все записи со всех хранилищ
    const allEntries: Array<{ key: string; timestamp: number; size: number; store: UseStore }> = []

    // Превью
    const previewEntries = await entries<string, CachedPreview>(this.previewStore)
    for (const [key, cached] of previewEntries) {
      allEntries.push({ key, timestamp: cached.timestamp, size: cached.size, store: this.previewStore })
    }

    // Кадры
    const frameEntries = await entries<string, CachedFrames>(this.frameStore)
    for (const [key, cached] of frameEntries) {
      allEntries.push({ key, timestamp: cached.timestamp, size: cached.size, store: this.frameStore })
    }

    // Распознавание
    const recognitionEntries = await entries<string, CachedRecognition>(this.recognitionStore)
    for (const [key, cached] of recognitionEntries) {
      allEntries.push({ key, timestamp: cached.timestamp, size: cached.size, store: this.recognitionStore })
    }

    // Субтитры
    const subtitleEntries = await entries<string, CachedSubtitles>(this.subtitleStore)
    for (const [key, cached] of subtitleEntries) {
      allEntries.push({ key, timestamp: cached.timestamp, size: cached.size, store: this.subtitleStore })
    }

    // Сортируем по времени (старые первые)
    allEntries.sort((a, b) => a.timestamp - b.timestamp)

    // Удаляем пока не освободим нужное количество
    for (const entry of allEntries) {
      if (freedBytes >= bytesToFree) break

      await del(entry.key, entry.store)
      freedBytes += entry.size
    }
  }

  /**
   * Оценить размер строки в байтах
   */
  private estimateStringSize(str: string): number {
    return new Blob([str]).size
  }

  /**
   * Оценить размер объекта в байтах
   */
  private estimateObjectSize(obj: any): number {
    const str = JSON.stringify(obj)
    return this.estimateStringSize(str)
  }
}

// Экспортируем singleton экземпляр
export const indexedDBCacheService = IndexedDBCacheService.getInstance()
