import { invoke } from "@tauri-apps/api/core"
import { useCallback, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { indexedDBCacheService } from "../services/indexeddb-cache-service"
import type { MediaPreviewData, ThumbnailData } from "../types/preview"

const logger = createLogger("MediaPreview")

export interface UseMediaPreviewOptions {
  onThumbnailGenerated?: (fileId: string, thumbnail: ThumbnailData) => void
  onError?: (error: string) => void
}

export function useMediaPreview(options: UseMediaPreviewOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getPreviewData = useCallback(
    async (fileId: string): Promise<MediaPreviewData | null> => {
      try {
        // Сначала проверяем IndexedDB кэш
        const cachedThumbnail = await indexedDBCacheService.getCachedPreview(fileId)
        if (cachedThumbnail) {
          logger.debugSync("Preview found in IndexedDB cache", { fileId })
          // Возвращаем в формате MediaPreviewData
          return {
            file_id: fileId,
            file_path: "", // Путь не сохраняется в кэше
            browser_thumbnail: {
              path: "", // Путь не сохраняется в кэше
              base64_data: cachedThumbnail,
              timestamp: 0,
              width: 0,
              height: 0,
            },
            last_updated: new Date().toISOString(),
            timeline_previews: [],
            recognition_frames: [],
          } as unknown as MediaPreviewData
        }

        // Если нет в кэше, запрашиваем с бэкенда
        const data = await invoke<MediaPreviewData | null>("get_media_preview_data", { fileId })

        // Сохраняем в кэш, если есть данные превью
        if (data?.browser_thumbnail?.base64_data) {
          await indexedDBCacheService.cachePreview(fileId, data.browser_thumbnail.base64_data)
          logger.debugSync("Preview cached in IndexedDB", { fileId })
        }

        return data
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to get preview data"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return null
      }
    },
    [options],
  )

  const generateThumbnail = useCallback(
    async (
      fileId: string,
      filePath: string,
      width: number,
      height: number,
      timestamp = 0,
    ): Promise<ThumbnailData | null> => {
      try {
        setIsGenerating(true)
        setError(null)

        const thumbnail = await invoke<ThumbnailData>("generate_media_thumbnail", {
          fileId,
          filePath,
          width,
          height,
          timestamp,
        })

        // Сохраняем в кэш, если есть base64 данные
        if (thumbnail?.base64_data) {
          await indexedDBCacheService.cachePreview(fileId, thumbnail.base64_data)
          logger.debugSync("Generated thumbnail cached in IndexedDB", { fileId })
        }

        // Notify callback if provided
        if (options.onThumbnailGenerated) {
          options.onThumbnailGenerated(fileId, thumbnail)
        }

        return thumbnail
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to generate thumbnail"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return null
      } finally {
        setIsGenerating(false)
      }
    },
    [options],
  )

  const clearPreviewData = useCallback(
    async (fileId: string): Promise<boolean> => {
      try {
        // Очищаем данные на бэкенде
        await invoke("clear_media_preview_data", { fileId })

        // Очищаем конкретное превью из IndexedDB кэша
        await indexedDBCacheService.deletePreview(fileId)

        logger.debugSync("Preview data cleared", { fileId })
        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to clear preview data"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return false
      }
    },
    [options],
  )

  const getFilesWithPreviews = useCallback(async (): Promise<string[]> => {
    try {
      const files = await invoke<string[]>("get_files_with_previews")
      return files
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to get files with previews"
      setError(errorMsg)
      options.onError?.(errorMsg)
      return []
    }
  }, [options])

  const savePreviewData = useCallback(
    async (path: string): Promise<boolean> => {
      try {
        await invoke("save_preview_data", { path })
        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to save preview data"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return false
      }
    },
    [options],
  )

  const loadPreviewData = useCallback(
    async (path: string): Promise<boolean> => {
      try {
        await invoke("load_preview_data", { path })
        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load preview data"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return false
      }
    },
    [options],
  )

  /**
   * Восстановить кэш превью с диска
   * Сканирует директорию кэша и загружает информацию о существующих thumbnail файлах
   * Вызывается при старте приложения для быстрой загрузки существующих превью
   */
  const restorePreviewCache = useCallback(async (): Promise<number> => {
    try {
      const restoredCount = await invoke<number>("restore_preview_cache")
      logger.debugSync(`Preview cache restored: ${restoredCount} thumbnails`)
      return restoredCount
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to restore preview cache"
      logger.errorSync("Failed to restore preview cache", { error: errorMsg })
      // Не устанавливаем ошибку в state - это не критично
      return 0
    }
  }, [])

  /**
   * Проверить есть ли кэшированный thumbnail на диске
   */
  const hasCachedThumbnail = useCallback(async (fileId: string, width: number, height: number): Promise<boolean> => {
    try {
      return await invoke<boolean>("has_cached_thumbnail", { fileId, width, height })
    } catch {
      return false
    }
  }, [])

  /**
   * Получить путь к кэшированному thumbnail
   */
  const getCachedThumbnailPath = useCallback(async (fileId: string, width: number, height: number): Promise<string> => {
    try {
      return await invoke<string>("get_cached_thumbnail_path", { fileId, width, height })
    } catch {
      return ""
    }
  }, [])

  const getAllFilesWithPreviews = useCallback(async (): Promise<string[]> => {
    return getFilesWithPreviews()
  }, [getFilesWithPreviews])

  const saveTimelineFrames = useCallback(
    async (
      fileId: string,
      frames: Array<{ timestamp: number; base64_data: string; is_keyframe: boolean }>,
    ): Promise<boolean> => {
      try {
        await invoke("save_timeline_frames", { fileId, frames })
        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to save timeline frames"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return false
      }
    },
    [options],
  )

  const getTimelineFrames = useCallback(
    async (fileId: string): Promise<Array<{ timestamp: number; base64_data: string; is_keyframe: boolean }>> => {
      try {
        const frames = await invoke<Array<{ timestamp: number; base64_data: string; is_keyframe: boolean }>>(
          "get_timeline_frames",
          { fileId },
        )
        return frames
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to get timeline frames"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return []
      }
    },
    [options],
  )

  return {
    // Data operations
    getPreviewData,
    generateThumbnail,
    clearPreviewData,
    getAllFilesWithPreviews,
    getFilesWithPreviews,
    savePreviewData,
    loadPreviewData,
    saveTimelineFrames,
    getTimelineFrames,

    // Cache operations
    restorePreviewCache,
    hasCachedThumbnail,
    getCachedThumbnailPath,

    // State
    isGenerating,
    error,
  }
}
