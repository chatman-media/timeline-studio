/**
 * Хук для работы с кэшем метаданных медиафайлов
 */

import { useCallback, useEffect, useState } from "react"
import type { MediaMetadata } from "../../../domains/shared/types"

import {
  cacheMediaMetadata,
  cacheMultipleMetadata,
  checkCachedFiles,
  getCachedMetadata,
  getCacheMemoryUsage,
} from "../services/metadata-cache-service"

import type { CacheMemoryUsage } from "../types/cache"

interface UseMetadataCacheReturn {
  // Получение метаданных
  getMetadata: (filePath: string) => Promise<MediaMetadata | null>
  // Сохранение метаданных
  saveMetadata: (filePath: string, metadata: MediaMetadata) => Promise<void>
  // Пакетное сохранение
  saveMultipleMetadata: (files: Array<{ path: string; metadata: MediaMetadata }>) => Promise<void>
  // Проверка наличия в кэше
  checkCached: (filePaths: string[]) => Promise<{
    cached: string[]
    notCached: string[]
  }>
  // Получение информации об использовании памяти
  getMemoryUsage: () => Promise<CacheMemoryUsage>
  // Состояние загрузки
  isLoading: boolean
  // Ошибка
  error: Error | null
}

export function useMetadataCache(): UseMetadataCacheReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getMetadata = useCallback(async (filePath: string) => {
    try {
      setError(null)
      return await getCachedMetadata(filePath)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to get metadata")
      setError(error)
      throw error
    }
  }, [])

  const saveMetadata = useCallback(async (filePath: string, metadata: MediaMetadata) => {
    try {
      setError(null)
      await cacheMediaMetadata(filePath, metadata)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to save metadata")
      setError(error)
      throw error
    }
  }, [])

  const saveMultipleMetadata = useCallback(async (files: Array<{ path: string; metadata: MediaMetadata }>) => {
    try {
      setError(null)
      setIsLoading(true)
      await cacheMultipleMetadata(files)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to save multiple metadata")
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const checkCached = useCallback(async (filePaths: string[]) => {
    try {
      setError(null)
      setIsLoading(true)
      return await checkCachedFiles(filePaths)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to check cached files")
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getMemoryUsage = useCallback(async () => {
    try {
      setError(null)
      return await getCacheMemoryUsage()
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to get memory usage")
      setError(error)
      throw error
    }
  }, [])

  return {
    getMetadata,
    saveMetadata,
    saveMultipleMetadata,
    checkCached,
    getMemoryUsage,
    isLoading,
    error,
  }
}

/**
 * Хук для автоматического кэширования метаданных при загрузке
 */
export function useAutoMetadataCache(files: Array<{ path: string; needsMetadata?: boolean }> | undefined) {
  const { checkCached, saveMetadata } = useMetadataCache()
  const [cachedStatus, setCachedStatus] = useState<Map<string, boolean>>(new Map())

  // Проверяем какие файлы уже в кэше при монтировании
  useEffect(() => {
    if (!files || files.length === 0) return

    const checkCache = async () => {
      const paths = files.map((f) => f.path)
      const { cached } = await checkCached(paths)

      const status = new Map<string, boolean>()
      paths.forEach((path) => {
        status.set(path, cached.includes(path))
      })
      setCachedStatus(status)
    }

    void checkCache()
  }, [files, checkCached])

  // Функция для кэширования метаданных файла
  const cacheFileMetadata = useCallback(
    async (filePath: string, metadata: MediaMetadata) => {
      try {
        await saveMetadata(filePath, metadata)
        setCachedStatus((prev) => new Map(prev).set(filePath, true))
      } catch (error) {
        console.error(`Failed to cache metadata for ${filePath}:`, error)
      }
    },
    [saveMetadata],
  )

  return {
    cachedStatus,
    cacheFileMetadata,
    isCached: (filePath: string) => cachedStatus.get(filePath) ?? false,
  }
}
