import { useCallback, useEffect, useRef, useState } from "react"
import { appDirectoriesService } from "@/domains/project-management/services/app-directories-service"
import { useMediaFiles, useMusicFiles } from "@/features/app-state/hooks"
import { type MediaFile, MediaType } from "@/features/media/types/media"
import { createLogger } from "@/lib/tauri-logger"
import { getMediaExtensions, getMusicExtensions } from "../utils/validation"

const logger = createLogger({ module: "UseAutoLoadMedia" })

/**
 * Хук для автозагрузки медиа и музыкальных файлов
 * Оптимизированная версия с debouncing и мемоизацией
 */
export function useAutoLoadMedia() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedCount, setLoadedCount] = useState({ media: 0, music: 0 })

  const { addMediaFile } = useMediaFiles()
  const { updateMusicFiles } = useMusicFiles()

  // Debouncing refs
  const loadTimeoutRef = useRef<NodeJS.Timeout>(null)
  const lastLoadTimeRef = useRef<number>(0)

  // Кэш для результатов сканирования
  const scanCacheRef = useRef(new Map<string, string[]>())
  const CACHE_DURATION = 10 * 60 * 1000 // 10 минут

  /**
   * Проверяет, работаем ли мы в Tauri окружении
   */
  const isTauriEnvironment = useCallback(() => {
    return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window && window.__TAURI_INTERNALS__ !== null
  }, [])

  // Используем экспортированные функции для расширений
  const mediaExtensions = getMediaExtensions()
  const musicExtensions = getMusicExtensions()

  /**
   * Быстрое сканирование директории с кэшированием
   */
  const scanDirectory = useCallback(
    async (dirPath: string, extensions?: string[]): Promise<string[]> => {
      const cacheKey = `${dirPath}:${extensions?.join(",") || "all"}`
      const cached = scanCacheRef.current.get(cacheKey)

      // Проверяем кэш
      if (cached && Date.now() - lastLoadTimeRef.current < CACHE_DURATION) {
        return cached
      }

      try {
        if (!isTauriEnvironment()) {
          return []
        }

        const { exists, readDir } = await import("@tauri-apps/plugin-fs")

        const dirExists = await exists(dirPath)
        if (!dirExists) {
          return []
        }

        const entries = await readDir(dirPath)
        const targetExtensions = extensions || []

        const files = entries
          .filter((entry: any) => {
            if (!entry.isFile) return false
            const name = entry.name.toLowerCase()
            return targetExtensions.some((ext) => name.endsWith(ext.toLowerCase()))
          })
          .map((entry: any) => `${dirPath}/${entry.name}`)

        // Сохраняем в кэш
        scanCacheRef.current.set(cacheKey, files)
        return files
      } catch (error) {
        logger.error("Error scanning directory", { error, dirPath })
        return []
      }
    },
    [isTauriEnvironment],
  )

  /**
   * Быстрая обработка медиа файлов
   */
  const processMediaFiles = useCallback(
    async (filePaths: string[]): Promise<MediaFile[]> => {
      if (!isTauriEnvironment() || filePaths.length === 0) {
        return []
      }

      try {
        const { invoke } = await import("@tauri-apps/api/core")
        const processedFiles: MediaFile[] = []

        // Обрабатываем файлы пакетами по 5 для оптимизации
        const BATCH_SIZE = 5
        for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
          const batch = filePaths.slice(i, i + BATCH_SIZE)

          const batchResults = await Promise.allSettled(
            batch.map(async (filePath) => {
              try {
                const processed = await invoke<{
                  id: string
                  path: string
                  name: string
                  size: number
                  metadata?: {
                    duration?: number
                    width?: number
                    height?: number
                    has_audio?: boolean
                    has_video?: boolean
                  }
                }>("process_media_file_simple", {
                  filePath,
                  generateThumbnail: false, // Отключаем генерацию thumbnail для скорости
                })

                const fileName = processed.name
                const isVideo = processed.metadata?.has_video || /\.(mp4|avi|mov|mkv|webm)$/i.test(fileName)
                const isAudio = processed.metadata?.has_audio || /\.(mp3|wav|ogg|m4a|aac)$/i.test(fileName)
                const isImage = !isVideo && !isAudio && /\.(jpg|jpeg|png|gif|bmp)$/i.test(fileName)

                // Determine media type
                let type: MediaType
                if (isVideo) {
                  type = MediaType.Video
                } else if (isAudio && !isVideo) {
                  type = MediaType.Audio
                } else if (isImage) {
                  type = MediaType.StillImage
                } else {
                  type = MediaType.Unknown
                }

                return {
                  id: processed.id,
                  name: processed.name,
                  path: processed.path,
                  type,
                  size: processed.size,
                  duration: processed.metadata?.duration,
                  isVideo,
                  isAudio: isAudio && !isVideo,
                  isImage,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  source: "browser" as const,
                } as MediaFile
              } catch (error) {
                // Создаем fallback объект
                const fileName = filePath.split("/").pop() || filePath.split("\\").pop() || ""
                const isVideo = /\.(mp4|avi|mov|mkv|webm)$/i.test(fileName)
                const isAudio = /\.(mp3|wav|ogg|m4a|aac)$/i.test(fileName)
                const isImage = /\.(jpg|jpeg|png|gif|bmp)$/i.test(fileName)

                // Determine media type for fallback
                let type: MediaType
                if (isVideo) {
                  type = MediaType.Video
                } else if (isAudio) {
                  type = MediaType.Audio
                } else if (isImage) {
                  type = MediaType.StillImage
                } else {
                  type = MediaType.Unknown
                }

                return {
                  id: `file-${Date.now()}-${Math.random()}`,
                  name: fileName,
                  path: filePath,
                  type,
                  size: 0,
                  isVideo,
                  isAudio,
                  isImage,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  source: "browser" as const,
                } as MediaFile
              }
            }),
          )

          // Добавляем только успешно обработанные файлы
          batchResults.forEach((result) => {
            if (result.status === "fulfilled") {
              processedFiles.push(result.value)
            }
          })
        }

        return processedFiles
      } catch (error) {
        logger.error("Error processing media files", { error })
        return []
      }
    },
    [isTauriEnvironment],
  )

  /**
   * Основная функция загрузки медиа
   */
  const loadMediaFiles = useCallback(async () => {
    // Debouncing - не загружаем чаще чем раз в 500мс
    if (Date.now() - lastLoadTimeRef.current < 500) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Определяем директории
      let mediaDir = "public/media"
      let musicDir = "public/music"

      if (isTauriEnvironment()) {
        try {
          await appDirectoriesService.createAppDirectories()
          mediaDir = appDirectoriesService.getMediaSubdirectory("videos")
          musicDir = appDirectoriesService.getMediaSubdirectory("music")
        } catch (error) {
          logger.warn("Failed to get app directories", { error })
        }
      }

      // Сканируем файлы параллельно
      const [mediaFiles, musicFiles] = await Promise.all([
        scanDirectory(mediaDir, mediaExtensions),
        scanDirectory(musicDir, musicExtensions),
      ])

      // Обрабатываем файлы
      const [processedMedia, processedMusic] = await Promise.all([
        processMediaFiles(mediaFiles),
        processMediaFiles(musicFiles),
      ])

      // Обновляем состояние только если есть изменения
      if (processedMedia.length > 0) {
        // Добавляем медиа файлы по одному
        for (const media of processedMedia) {
          const mediaType = media.isVideo ? "Video" : media.isAudio ? "Audio" : "Image"
          await addMediaFile(media.path, mediaType).catch((err) => {
            logger.error("Failed to add media file:", { path: media.path, error: err })
          })
        }
      }
      if (processedMusic.length > 0) {
        void updateMusicFiles(processedMusic)
      }

      setLoadedCount({
        media: processedMedia.length,
        music: processedMusic.length,
      })

      lastLoadTimeRef.current = Date.now()

      logger.info("Media files loaded", {
        mediaCount: processedMedia.length,
        musicCount: processedMusic.length,
        context: "useAutoLoadMedia",
      })
    } catch (error) {
      logger.error("Error loading media files", { error })
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [
    isTauriEnvironment,
    scanDirectory,
    processMediaFiles,
    addMediaFile,
    updateMusicFiles,
    mediaExtensions,
    musicExtensions,
  ])

  /**
   * Debounced загрузка
   */
  const debouncedLoad = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }

    loadTimeoutRef.current = setTimeout(() => {
      void loadMediaFiles()
    }, 300) // 300мс debounce
  }, [loadMediaFiles])

  // Запускаем загрузку при монтировании
  useEffect(() => {
    // ВРЕМЕННО ОТКЛЮЧЕНО: Автоматическая загрузка медиа из директорий проекта
    // TODO: Восстановить функциональность, когда потребуется
    /*
    // Проверяем, не является ли проект новым (только что созданным)
    const currentProject = state?.context?.currentProject || null
    const isNewProject = currentProject?.isNew && currentProject?.path === null

    if (isNewProject) {
      logger.info("[useAutoLoadMedia] Skipping auto-load for new project")
      return
    }

    // Запускаем загрузку только один раз при монтировании
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }

    loadTimeoutRef.current = setTimeout(() => {
      void loadMediaFiles()
    }, 300) // 300мс debounce

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
    */

    // Логируем, что автозагрузка отключена
    logger.info("Auto-loading is disabled", { context: "useAutoLoadMedia" })
  }, []) // Убираем зависимости, так как эффект теперь не активен

  // Функция для очистки кэша
  const clearCache = useCallback(() => {
    scanCacheRef.current.clear()
    lastLoadTimeRef.current = 0
  }, [])

  return {
    isLoading,
    error,
    loadedCount,
    reload: debouncedLoad,
    clearCache,
  }
}
