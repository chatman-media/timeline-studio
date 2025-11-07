/**
 * Media Management Domain Provider
 *
 * Централизованный провайдер для Media Management домена
 * Перенесено на BackendSync для централизованного управления состоянием
 */

import { createContext, type ReactNode, useEffect, useState } from "react"
import { AppCommands } from "@/domains/project-management/machines/app-machine"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { selectAudioFile, selectMediaFile } from "@/features/media/services/media-api"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectState } from "@/types/generated/tauri-bindings"
import { getMediaMetadataService } from "../services/media-metadata-service"
import type { MediaImportOptions, MediaManagementService, MediaType } from "../types"

const logger = createLogger("MediaManagementProvider")


interface MediaManagementContextValue extends MediaManagementService {
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
  const [fileOperations, setFileOperations] = useState<any[]>([])
  const [mediaImportStatus, setMediaImportStatus] = useState<"idle" | "importing" | "completed" | "failed">("idle")

  const backendSync = getBackendSync()
  const metadataService = getMediaMetadataService()

  // Подписка на изменения backend состояния
  useEffect(() => {
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      // Обновляем состояние на основе backend
      if (state.project?.media_files) {
        // Обновляем список медиа файлов
        setFileOperations(
          state.project.media_files.map((file) => ({
            id: file.id,
            path: file.path,
            status: "completed",
            result: file,
            progress: 100,
          })),
        )
      }
    })

    return () => {
      unsubscribe()
    }
  }, [backendSync])

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
      logger.info("[Media Management] Importing", { files.length })
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

    getMediaInfo: async (path: string) => {
      try {
        // Пытаемся получить информацию из backend состояния
        const backendState = await backendSync.getProjectState()
        const mediaFile = backendState?.project?.media_files?.find((file) => file.path === path)

        if (mediaFile) {
          return {
            path: mediaFile.path,
            name: mediaFile.name,
            type: mediaFile.media_type,
            duration: mediaFile.duration,
            size: mediaFile.size,
            thumbnail_path: mediaFile.thumbnail_path,
          }
        }

        // Если файл не найден в backend, возвращаем базовую информацию
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
        if (metadata) {
          const backendState = await backendSync.getProjectState()
          const mediaFile = backendState?.project?.media_files?.find((file) => file.path === path)

          if (mediaFile) {
            await backendSync.executeCommand(AppCommands.updateMedia(mediaFile.id, { metadata }))
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
