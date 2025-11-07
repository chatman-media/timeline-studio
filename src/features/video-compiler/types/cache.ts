/**
 * Типы для системы кэширования video-compiler
 */

export interface VideoCompilerCacheStats {
  total_entries: number
  preview_hits: number
  preview_misses: number
  metadata_hits: number
  metadata_misses: number
  cache_hits: number
  cache_misses: number
  memory_usage: CacheMemoryUsage
  cache_size_mb: number
  total_size_mb: number
  preview_cache: {
    entries: number
    size_mb: number
  }
  cache_efficiency: number
}

export interface CacheMemoryUsage {
  preview_bytes: number
  metadata_bytes: number
  render_bytes: number
  total_bytes: number
  totalSize: number
  fileCount: number
  oldestEntry: string
  newestEntry: string
}

export interface PreviewCacheEntry {
  file_path: string
  timestamp: number
  quality: number
  image_data: Uint8Array
  created_at: string
  last_accessed: string
  access_count: number
}

export interface MetadataCacheEntry {
  file_path: string
  metadata: any
  created_at: string
  last_accessed: string
}

export interface CacheSettings {
  max_memory_mb: number
  max_entries: number
  auto_cleanup: boolean
  cleanup_threshold_percent: number
}
