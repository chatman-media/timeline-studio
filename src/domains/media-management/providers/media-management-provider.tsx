/**
 * Media Management Domain Provider
 *
 * Централизованный провайдер для Media Management домена
 * Использует event-driven архитектуру для синхронизации с backend
 */

import { createContext, type ReactNode, useEffect, useState } from "react"
import { AppCommands } from "@/domains/project-management/machines/app-machine"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectEvent } from "@/types/generated/state-types-extensions"
import {
  handleMediaBackendEvent,
  type MediaManagementContext as MediaContext,
} from "../machines/backend-event-handlers"
import {
  getMediaFiles,
  restorePreviewCache,
  selectAudioFile,
  selectMediaDirectory,
  selectMediaFile,
} from "../services/media-api"
import { getMediaMetadataService } from "../services/media-metadata-service"
import type { MediaImportOptions, MediaInfo, MediaManagementService, MediaType } from "../types"

const logger = createLogger("MediaManagementProvider")

interface MediaManagementContextValue extends MediaManagementService {
  mediaPool: Map<string, MediaInfo>
  fileOperationsState: any
  mediaImportState: any
  isReady: boolean
  isLoading: boolean
  error: string | null
}

export const MediaManagementContext = createContext<MediaManagementContextValue | null>(null)

interface MediaManagementProviderProps {
  children: ReactNode
}

export function MediaManagementProvider({ children }: MediaManagementProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mediaPool, setMediaPool] = useState<Map<string, MediaInfo>>(new Map())
  const [fileOperations, setFileOperations] = useState<any[]>([])
  const [mediaImportStatus, setMediaImportStatus] = useState<"idle" | "importing" | "completed" | "failed">("idle")

  const backendSync = getBackendSync()
  const metadataService = getMediaMetadataService()

  // Восстановление кэша превью при старте приложения
  useEffect(() => {
    const initPreviewCache = async () => {
      try {
        const restoredCount = await restorePreviewCache()
        if (restoredCount > 0) {
          logger.info(`Preview cache restored: ${restoredCount} thumbnails loaded from disk`)
        }
      } catch (error) {
        // Не критичная ошибка - продолжаем работу без кэша
        logger.error("Failed to restore preview cache", { error })
      }
    }

    initPreviewCache()
  }, [])

  // Загрузка начального состояния при монтировании
  useEffect(() => {
    const unsubscribeState = backendSync.onStateChange((state: any) => {
      logger.info("Loading initial media state from backend")

      const initialMediaPool = new Map<string, MediaInfo>()

      // Загружаем из project.media_pool
      if (state.project?.media_pool?.items) {
        const mediaPoolItems = state.project.media_pool.items
        Object.entries(mediaPoolItems).forEach(([mediaId, mediaItem]: [string, any]) => {
          initialMediaPool.set(mediaId, {
            id: mediaId,
            path: mediaItem.path,
            name: mediaItem.name,
            type: mediaItem.media_type as MediaType,
            duration: mediaItem.duration ?? undefined,
            thumbnailPath: mediaItem.thumbnail ?? undefined,
            // Load metadata with codec for H.265 detection
            metadata: mediaItem.metadata?.codec
              ? {
                  type: mediaItem.media_type as "Video" | "Audio" | "Image",
                  codec: mediaItem.metadata.codec,
                }
              : undefined,
          })
        })
      }

      // Загружаем из imported_media (временное хранилище)
      if (state.imported_media) {
        Object.entries(state.imported_media).forEach(([mediaId, mediaItem]: [string, any]) => {
          if (!initialMediaPool.has(mediaId)) {
            initialMediaPool.set(mediaId, {
              id: mediaId,
              path: mediaItem.path,
              name: mediaItem.name,
              type: mediaItem.media_type as MediaType,
              duration: mediaItem.duration ?? undefined,
              thumbnailPath: mediaItem.thumbnail ?? undefined,
              // Load metadata with codec for H.265 detection
              metadata: mediaItem.metadata?.codec
                ? {
                    type: mediaItem.media_type as "Video" | "Audio" | "Image",
                    codec: mediaItem.metadata.codec,
                  }
                : undefined,
            })
          }
        })
      }

      logger.info("Initial media pool loaded", { count: initialMediaPool.size })
      setMediaPool(initialMediaPool)

      // Обновляем fileOperations для совместимости
      const operations = Array.from(initialMediaPool.values()).map((mediaInfo) => ({
        id: mediaInfo.id || mediaInfo.path,
        path: mediaInfo.path,
        status: "completed" as const,
        result: mediaInfo,
        progress: 100,
      }))
      setFileOperations(operations)
    })

    return () => {
      unsubscribeState()
    }
  }, [backendSync])

  // Event-driven синхронизация через backend события
  useEffect(() => {
    const unsubscribe = backendSync.onEvent((event: ProjectEvent) => {
      // Используем функциональное обновление для актуального состояния
      setMediaPool((currentMediaPool) => {
        // Создаем контекст для event handler с актуальным состоянием
        const context: MediaContext = {
          mediaPool: currentMediaPool,
          isLoading: false,
          error: null,
        }

        // Обрабатываем событие
        const updates = handleMediaBackendEvent(context, event)

        // Если есть обновления mediaPool, возвращаем новое значение
        if (updates.mediaPool !== undefined) {
          logger.info("Media pool updated via event", {
            eventType: event.type,
            oldCount: currentMediaPool.size,
            newCount: updates.mediaPool.size,
          })

          // Обновляем fileOperations для совместимости
          const operations = Array.from(updates.mediaPool.values()).map((mediaInfo) => ({
            id: mediaInfo.id || mediaInfo.path,
            path: mediaInfo.path,
            status: "completed" as const,
            result: mediaInfo,
            progress: 100,
          }))
          setFileOperations(operations)

          // Обновляем isLoading если есть в updates
          if (updates.isLoading !== undefined) {
            setIsLoading(updates.isLoading)
          }

          return updates.mediaPool
        }

        // Обрабатываем isLoading/error даже если mediaPool не изменился
        if (updates.isLoading !== undefined) {
          setIsLoading(updates.isLoading)
        }
        if (updates.error !== undefined) {
          setError(updates.error)
        }

        // Если обновлений mediaPool нет, возвращаем текущее состояние
        return currentMediaPool
      })
    })

    return () => {
      unsubscribe()
    }
  }, [backendSync]) // Только backendSync в зависимостях - избегаем лишних переподписок

  // Вспомогательная функция для определения типа медиа по пути файла
  const getMediaTypeFromPath = (filePath: string): MediaType => {
    const ext = filePath.split(".").pop()?.toLowerCase() || ""

    const videoExts = ["mp4", "avi", "mkv", "mov", "webm", "m4v", "3gp", "flv"]
    const audioExts = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"]
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "tiff"]

    if (videoExts.includes(ext)) return "Video"
    if (audioExts.includes(ext)) return "Audio"
    if (imageExts.includes(ext)) return "Image"

    return "Unknown"
  }

  const mediaManagementService: MediaManagementService = {
    importFiles: async (files: string[], _options: MediaImportOptions) => {
      logger.info("[Media Management] Importing files", { filesCount: files.length })
      setIsLoading(true)
      setError(null)
      setMediaImportStatus("importing")

      try {
        // Импортируем каждый файл через BackendSync
        const importResults: any[] = []

        for (const filePath of files) {
          try {
            // Определяем тип медиа на основе расширения файла
            const mediaType = getMediaTypeFromPath(filePath)

            // Используем AddMedia команду для импорта
            const result = await backendSync.executeCommand(AppCommands.addMedia(filePath, mediaType))

            if (result) {
              importResults.push(result)
            }
          } catch (importError) {
            logger.error("Failed to import file", { filePath, importError })
            // Продолжаем импорт остальных файлов даже если один не удался
          }
        }

        setMediaImportStatus("completed")
        setIsLoading(false)
        return importResults
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Import failed"
        logger.error("[Media Management] Import failed:", { error: errorMessage })
        setError(errorMessage)
        setMediaImportStatus("failed")
        setIsLoading(false)
        throw error
      }
    },

    selectMediaFiles: async () => {
      return selectMediaFile()
    },

    selectAudioFiles: async () => {
      return selectAudioFile()
    },

    selectMediaDirectory: async () => {
      try {
        const directory = await selectMediaDirectory()
        if (!directory) {
          return null
        }

        // Получаем все медиафайлы из выбранной директории
        const files = await getMediaFiles(directory)

        // Автоматически импортируем файлы из директории
        if (files.length > 0) {
          await mediaManagementService.importFiles(files, {})
        }

        return directory
      } catch (error) {
        logger.error("Failed to select directory", { error })
        throw error
      }
    },

    getMediaInfo: async (path: string) => {
      try {
        // Ищем в локальном media pool (синхронизирован через события)
        const mediaEntry = Array.from(mediaPool.entries()).find(([, media]) => media.path === path)

        if (mediaEntry) {
          const [mediaId, mediaInfo] = mediaEntry
          // Добавляем id если его еще нет
          return mediaInfo.id ? mediaInfo : { ...mediaInfo, id: mediaId }
        }

        // Если не найдено локально, возвращаем базовую информацию
        const name = path.split("/").pop() || path
        const mediaType = getMediaTypeFromPath(path)

        return {
          path,
          name,
          type: mediaType,
        }
      } catch (error) {
        logger.error("[Media Management] Failed to get media info:", { error: error })
        // В случае ошибки возвращаем базовую информацию
        const name = path.split("/").pop() || path
        const mediaType = getMediaTypeFromPath(path)

        return {
          path,
          name,
          type: mediaType,
        }
      }
    },

    extractMetadata: async (path: string) => {
      try {
        setIsLoading(true)
        setError(null)

        const metadata = await metadataService.extractMetadata(path)

        // Обновляем метаданные в backend через UpdateMedia команду
        // Backend отправит MediaUpdated событие, которое обновит локальный state
        if (metadata) {
          const mediaInfo = Array.from(mediaPool.values()).find((media) => media.path === path)

          if (mediaInfo) {
            // Находим media ID в pool и обновляем через команду
            const mediaId = Array.from(mediaPool.entries()).find(([, media]) => media.path === path)?.[0]

            if (mediaId) {
              await backendSync.executeCommand(AppCommands.updateMedia(mediaId, {}))
              // НЕ обновляем state напрямую - ждем события MediaUpdated
            }
          }
        }

        setIsLoading(false)
        return metadata
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Metadata extraction failed"
        logger.error("[Media Management] Metadata extraction failed:", { error: errorMessage })
        setError(errorMessage)
        setIsLoading(false)
        throw error
      }
    },
  }

  const value: MediaManagementContextValue = {
    ...mediaManagementService,
    mediaPool,
    fileOperationsState: {
      operations: fileOperations,
      hasActiveOperations: fileOperations.some((op) => op.status === "in_progress"),
      completedOperations: fileOperations.filter((op) => op.status === "completed"),
      failedOperations: fileOperations.filter((op) => op.status === "failed"),
    },
    mediaImportState: {
      status: mediaImportStatus,
      isImporting: mediaImportStatus === "importing",
      isCompleted: mediaImportStatus === "completed",
      isFailed: mediaImportStatus === "failed",
    },
    isReady: true,
    isLoading,
    error,
  }

  return <MediaManagementContext.Provider value={value}>{children}</MediaManagementContext.Provider>
}
