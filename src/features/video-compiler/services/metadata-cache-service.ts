/**
 * Сервис для работы с кэшем метаданных медиафайлов
 */

import { invoke } from "@tauri-apps/api/core"

import type { CacheMemoryUsage } from "../types/cache"

/**
 * Получить метаданные файла из кэша
 */
export async function getCachedMetadata(filePath: string): Promise<MediaMetadata | null> {
  try {
    return await invoke<MediaMetadata | null>("get_cached_metadata", { filePath })
  } catch (error) {
    console.error("Failed to get cached metadata:", error)
    return null
  }
}

/**
 * Сохранить метаданные файла в кэш
 */
export async function cacheMediaMetadata(filePath: string, metadata: MediaMetadata): Promise<void> {
  try {
    await invoke("cache_media_metadata", { filePath, metadata })
  } catch (error) {
    console.error("Failed to cache metadata:", error)
    throw error
  }
}

/**
 * Получить использование памяти кэшем
 */
export async function getCacheMemoryUsage(): Promise<CacheMemoryUsage> {
  try {
    return await invoke<CacheMemoryUsage>("get_cache_memory_usage")
  } catch (error) {
    console.error("Failed to get cache memory usage:", error)
    throw error
  }
}

/**
 * Пакетное кэширование метаданных
 */
export async function cacheMultipleMetadata(files: Array<{ path: string; metadata: MediaMetadata }>): Promise<void> {
  // Кэшируем файлы параллельно небольшими батчами
  const batchSize = 10
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)
    await Promise.all(batch.map(({ path, metadata }) => cacheMediaMetadata(path, metadata)))
  }
}

/**
 * Проверить есть ли метаданные в кэше для списка файлов
 */
export async function checkCachedFiles(filePaths: string[]): Promise<{
  cached: string[]
  notCached: string[]
}> {
  const cached: string[] = []
  const notCached: string[] = []

  // Проверяем файлы параллельно
  const results = await Promise.all(
    filePaths.map(async (path) => {
      const metadata = await getCachedMetadata(path)
      return { path, isCached: metadata !== null }
    }),
  )

  results.forEach(({ path, isCached }) => {
    if (isCached) {
      cached.push(path)
    } else {
      notCached.push(path)
    }
  })

  return { cached, notCached }
}

/**
 * Инвалидировать кэш для файла (при изменении файла)
 */
export async function invalidateFileCache(filePath: string): Promise<void> {
  // Пока нет отдельной команды для удаления конкретного файла из кэша,
  // но можно переписать метаданные с новой временной меткой
  // или дождаться автоматической инвалидации по TTL
  console.log(`Cache invalidation requested for: ${filePath}`)
}
