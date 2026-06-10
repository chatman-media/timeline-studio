import { clear as clearStore, createStore, del, entries, get, set, type UseStore } from "idb-keyval"

export interface CachedPreview {
  fileId: string
  thumbnail: string
  timestamp: number
  size: number
}

export interface CachedFrames {
  fileId: string
  frames: any[]
  timestamp: number
  size: number
}

export interface CachedRecognition {
  fileId: string
  frames: any[]
  timestamp: number
  size: number
}

export interface CachedSubtitles {
  fileId: string
  frames: any[]
  timestamp: number
  size: number
}

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

export class IndexedDBCacheService {
  private static instance: IndexedDBCacheService | null = null

  private previewStore: UseStore
  private frameStore: UseStore
  private recognitionStore: UseStore
  private subtitleStore: UseStore

  private readonly MAX_CACHE_SIZE = 500 * 1024 * 1024
  private readonly CACHE_TTL = 30 * 24 * 60 * 60 * 1000

  private constructor() {
    this.previewStore = createStore("timeline-studio-preview-cache", "preview-store")
    this.frameStore = createStore("timeline-studio-frame-cache", "frame-store")
    this.recognitionStore = createStore("timeline-studio-recognition-cache", "recognition-store")
    this.subtitleStore = createStore("timeline-studio-subtitle-cache", "subtitle-store")
  }

  public static getInstance(): IndexedDBCacheService {
    if (!IndexedDBCacheService.instance) {
      IndexedDBCacheService.instance = new IndexedDBCacheService()
    }
    return IndexedDBCacheService.instance
  }

  public async cachePreview(fileId: string, thumbnail: string): Promise<void> {
    const size = this.estimateStringSize(thumbnail)
    await set(fileId, { fileId, thumbnail, timestamp: Date.now(), size }, this.previewStore)
    await this.cleanupIfNeeded()
  }

  public async getCachedPreview(fileId: string): Promise<string | null> {
    const cached = await get<CachedPreview>(fileId, this.previewStore)
    if (!cached) return null

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      await del(fileId, this.previewStore)
      return null
    }

    return cached.thumbnail
  }

  public async cacheTimelineFrames(fileId: string, frames: any[]): Promise<void> {
    const size = this.estimateObjectSize(frames)
    await set(fileId, { fileId, frames, timestamp: Date.now(), size }, this.frameStore)
    await this.cleanupIfNeeded()
  }

  public async getCachedTimelineFrames(fileId: string): Promise<any[] | null> {
    const cached = await get<CachedFrames>(fileId, this.frameStore)
    if (!cached) return null

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      await del(fileId, this.frameStore)
      return null
    }

    return cached.frames
  }

  public async cacheRecognitionFrames(fileId: string, frames: any[]): Promise<void> {
    const size = this.estimateObjectSize(frames)
    await set(fileId, { fileId, frames, timestamp: Date.now(), size }, this.recognitionStore)
    await this.cleanupIfNeeded()
  }

  public async getCachedRecognitionFrames(fileId: string): Promise<any[] | null> {
    const cached = await get<CachedRecognition>(fileId, this.recognitionStore)
    if (!cached) return null

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      await del(fileId, this.recognitionStore)
      return null
    }

    return cached.frames
  }

  public async cacheSubtitleFrames(fileId: string, frames: any[]): Promise<void> {
    const size = this.estimateObjectSize(frames)
    await set(fileId, { fileId, frames, timestamp: Date.now(), size }, this.subtitleStore)
    await this.cleanupIfNeeded()
  }

  public async getCachedSubtitleFrames(fileId: string): Promise<any[] | null> {
    const cached = await get<CachedSubtitles>(fileId, this.subtitleStore)
    if (!cached) return null

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      await del(fileId, this.subtitleStore)
      return null
    }

    return cached.frames
  }

  public async getCacheStatistics(): Promise<CacheStatistics> {
    const stats: CacheStatistics = {
      previewCache: { count: 0, size: 0 },
      frameCache: { count: 0, size: 0 },
      recognitionCache: { count: 0, size: 0 },
      subtitleCache: { count: 0, size: 0 },
      totalSize: 0,
    }

    const previewEntries = await entries<string, CachedPreview>(this.previewStore)
    for (const [, cached] of previewEntries) {
      stats.previewCache.count++
      stats.previewCache.size += cached.size
    }

    const frameEntries = await entries<string, CachedFrames>(this.frameStore)
    for (const [, cached] of frameEntries) {
      stats.frameCache.count++
      stats.frameCache.size += cached.size
    }

    const recognitionEntries = await entries<string, CachedRecognition>(this.recognitionStore)
    for (const [, cached] of recognitionEntries) {
      stats.recognitionCache.count++
      stats.recognitionCache.size += cached.size
    }

    const subtitleEntries = await entries<string, CachedSubtitles>(this.subtitleStore)
    for (const [, cached] of subtitleEntries) {
      stats.subtitleCache.count++
      stats.subtitleCache.size += cached.size
    }

    stats.totalSize =
      stats.previewCache.size + stats.frameCache.size + stats.recognitionCache.size + stats.subtitleCache.size

    return stats
  }

  public async deletePreview(fileId: string): Promise<void> {
    await del(fileId, this.previewStore)
  }

  public async clearPreviewCache(): Promise<void> {
    await clearStore(this.previewStore)
  }

  public async clearFrameCache(): Promise<void> {
    await clearStore(this.frameStore)
  }

  public async clearRecognitionCache(): Promise<void> {
    await clearStore(this.recognitionStore)
  }

  public async clearSubtitleCache(): Promise<void> {
    await clearStore(this.subtitleStore)
  }

  public async clearAllCache(): Promise<void> {
    await Promise.all([
      this.clearPreviewCache(),
      this.clearFrameCache(),
      this.clearRecognitionCache(),
      this.clearSubtitleCache(),
    ])
  }

  public async cleanupExpiredCache(): Promise<void> {
    const now = Date.now()
    await this.cleanupExpiredStore<CachedPreview>(this.previewStore, now)
    await this.cleanupExpiredStore<CachedFrames>(this.frameStore, now)
    await this.cleanupExpiredStore<CachedRecognition>(this.recognitionStore, now)
    await this.cleanupExpiredStore<CachedSubtitles>(this.subtitleStore, now)
  }

  private async cleanupExpiredStore<T extends { timestamp: number }>(store: UseStore, now: number): Promise<void> {
    const storeEntries = await entries<string, T>(store)
    for (const [key, cached] of storeEntries) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        await del(key, store)
      }
    }
  }

  private async cleanupIfNeeded(): Promise<void> {
    const stats = await this.getCacheStatistics()

    if (stats.totalSize > this.MAX_CACHE_SIZE) {
      await this.removeOldestEntries(stats.totalSize - this.MAX_CACHE_SIZE * 0.8)
    }
  }

  private async removeOldestEntries(bytesToFree: number): Promise<void> {
    let freedBytes = 0
    const allEntries: Array<{ key: string; timestamp: number; size: number; store: UseStore }> = []

    const previewEntries = await entries<string, CachedPreview>(this.previewStore)
    for (const [key, cached] of previewEntries) {
      allEntries.push({ key, timestamp: cached.timestamp, size: cached.size, store: this.previewStore })
    }

    const frameEntries = await entries<string, CachedFrames>(this.frameStore)
    for (const [key, cached] of frameEntries) {
      allEntries.push({ key, timestamp: cached.timestamp, size: cached.size, store: this.frameStore })
    }

    const recognitionEntries = await entries<string, CachedRecognition>(this.recognitionStore)
    for (const [key, cached] of recognitionEntries) {
      allEntries.push({ key, timestamp: cached.timestamp, size: cached.size, store: this.recognitionStore })
    }

    const subtitleEntries = await entries<string, CachedSubtitles>(this.subtitleStore)
    for (const [key, cached] of subtitleEntries) {
      allEntries.push({ key, timestamp: cached.timestamp, size: cached.size, store: this.subtitleStore })
    }

    allEntries.sort((a, b) => a.timestamp - b.timestamp)

    for (const entry of allEntries) {
      if (freedBytes >= bytesToFree) break

      await del(entry.key, entry.store)
      freedBytes += entry.size
    }
  }

  private estimateStringSize(str: string): number {
    return new Blob([str]).size
  }

  private estimateObjectSize(obj: any): number {
    return this.estimateStringSize(JSON.stringify(obj))
  }
}

export const indexedDBCacheService = IndexedDBCacheService.getInstance()
