import { useCallback, useState } from "react"

import {
  generateRestorationReport,
  type ProjectRestorationResult,
  restoreProjectMedia as restoreProjectMediaService,
} from "@/features/media/services/media-restoration-service"
import type { MediaFile } from "@/features/media/types/media"
import type { SavedMediaFile, SavedMusicFile } from "@/features/media/types/saved-media"
import { useModal } from "@/features/modals/services"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "UseMediaRestoration" })

/**
 * Состояние процесса восстановления
 */
export interface RestorationState {
  isRestoring: boolean
  progress: number
  currentFile?: string
  phase: "scanning" | "restoring" | "user_input" | "completed" | "error"
  error?: string
}

/**
 * Хук для управления восстановлением медиафайлов при открытии проекта
 */
export function useMediaRestoration() {
  const [state, setState] = useState<RestorationState>({
    isRestoring: false,
    progress: 0,
    phase: "completed",
  })

  const [restorationResult, setRestorationResult] = useState<ProjectRestorationResult | null>(null)
  const [showMissingFilesDialog, setShowMissingFilesDialog] = useState(false)

  const { closeModal } = useModal()

  /**
   * Обновляет состояние восстановления
   */
  const updateState = useCallback((updates: Partial<RestorationState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  /**
   * Восстанавливает медиафайлы проекта
   */
  const restoreProjectMedia = useCallback(
    async (
      mediaFiles: SavedMediaFile[],
      musicFiles: SavedMusicFile[],
      projectPath: string,
      options?: {
        autoResolve?: boolean // Автоматически пытаться найти файлы без участия пользователя
        showDialog?: boolean // Показывать диалог для отсутствующих файлов
      },
    ): Promise<{
      restoredMedia: MediaFile[]
      restoredMusic: MediaFile[]
      needsUserInput: boolean
      result: ProjectRestorationResult
    }> => {
      try {
        updateState({
          isRestoring: true,
          progress: 0,
          phase: "scanning",
          error: undefined,
        })

        // Фаза 1: Автоматическое восстановление
        logger.info("Начинаем автоматическое восстановление медиафайлов...")

        const result = await restoreProjectMediaService(mediaFiles, musicFiles, projectPath)

        setRestorationResult(result)

        updateState({
          progress: 80,
          phase: "restoring",
        })

        // Проверяем, есть ли отсутствующие файлы
        let needsUserInput = false

        if (result.missingFiles.length > 0) {
          if (options?.showDialog !== false) {
            // Показываем диалог для обработки отсутствующих файлов
            needsUserInput = true
            setShowMissingFilesDialog(true)

            updateState({
              progress: 90,
              phase: "user_input",
            })
          } else if (options?.autoResolve) {
            logger.info(`Пропускаем ${result.missingFiles.length} отсутствующих файлов (автоматический режим)`)
          }
        }

        if (!needsUserInput) {
          updateState({
            progress: 100,
            phase: "completed",
            isRestoring: false,
          })
        }

        // Генерируем отчет
        const report = generateRestorationReport(result)
        logger.info("Отчет о восстановлении", { report })

        return {
          restoredMedia: result.restoredMedia,
          restoredMusic: result.restoredMusic,
          needsUserInput,
          result,
        }
      } catch (error) {
        logger.error("Ошибка при восстановлении медиафайлов", { error })

        updateState({
          isRestoring: false,
          phase: "error",
          error: String(error),
        })

        throw error
      }
    },
    [updateState],
  )

  /**
   * Обрабатывает результат диалога отсутствующих файлов
   */
  const handleMissingFilesResolution = useCallback(
    async (
      resolved: Array<{
        file: SavedMediaFile
        newPath?: string
        action: "found" | "remove"
      }>,
    ): Promise<{
      foundFiles: MediaFile[]
      removedFiles: SavedMediaFile[]
    }> => {
      const foundFiles: MediaFile[] = []
      const removedFiles: SavedMediaFile[] = []

      for (const resolution of resolved) {
        if (resolution.action === "found" && resolution.newPath) {
          // Создаем восстановленный MediaFile
          const restoredFile: MediaFile = {
            id: resolution.file.id,
            name: resolution.file.name,
            path: resolution.newPath,
            type: resolution.file.isVideo
              ? ("video" as any)
              : resolution.file.isAudio
                ? ("audio" as any)
                : ("image" as any),
            isVideo: resolution.file.isVideo,
            isAudio: resolution.file.isAudio,
            isImage: resolution.file.isImage,
            size: resolution.file.size,
            duration: resolution.file.metadata.duration,
            startTime: resolution.file.metadata.startTime,
            createdAt: resolution.file.metadata.createdAt ? new Date(resolution.file.metadata.createdAt) : undefined,
            probeData: resolution.file.metadata.probeData || {
              streams: [],
              format: {},
            },
            isLoadingMetadata: false,
          }

          foundFiles.push(restoredFile)
        } else if (resolution.action === "remove") {
          removedFiles.push(resolution.file)
        }
      }

      // Закрываем диалог и завершаем восстановление
      setShowMissingFilesDialog(false)
      closeModal()
      updateState({
        progress: 100,
        phase: "completed",
        isRestoring: false,
      })

      return { foundFiles, removedFiles }
    },
    [updateState, closeModal],
  )

  /**
   * Отменяет диалог отсутствующих файлов
   */
  const cancelMissingFilesDialog = useCallback(() => {
    setShowMissingFilesDialog(false)
    closeModal()
    updateState({
      progress: 100,
      phase: "completed",
      isRestoring: false,
    })
  }, [updateState, closeModal])

  /**
   * Сбрасывает состояние восстановления
   */
  const resetRestoration = useCallback(() => {
    setState({
      isRestoring: false,
      progress: 0,
      phase: "completed",
    })
    setRestorationResult(null)
    setShowMissingFilesDialog(false)
  }, [])

  /**
   * Получает статистику последнего восстановления
   */
  const getRestorationStats = useCallback(() => {
    return restorationResult?.stats || null
  }, [restorationResult])

  /**
   * Получает список отсутствующих файлов
   */
  const getMissingFiles = useCallback(() => {
    return restorationResult?.missingFiles || []
  }, [restorationResult])

  /**
   * Получает список перемещенных файлов
   */
  const getRelocatedFiles = useCallback(() => {
    return restorationResult?.relocatedFiles || []
  }, [restorationResult])

  /**
   * Получает отчет о восстановлении
   */
  const getRestorationReport = useCallback(() => {
    if (!restorationResult) return null
    return generateRestorationReport(restorationResult)
  }, [restorationResult])

  return {
    // Состояние
    state,
    restorationResult,
    showMissingFilesDialog,

    // Основные функции
    restoreProjectMedia,
    handleMissingFilesResolution,
    cancelMissingFilesDialog,
    resetRestoration,

    // Геттеры
    getRestorationStats,
    getMissingFiles,
    getRelocatedFiles,
    getRestorationReport,

    // Утилиты
    isRestoring: state.isRestoring,
    progress: state.progress,
    currentPhase: state.phase,
    error: state.error,
  }
}
