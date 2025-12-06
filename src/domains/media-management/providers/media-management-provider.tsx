/**
 * Media Management Domain Provider
 *
 * Централизованный провайдер для Media Management домена
 * Использует MediaManagementOrchestrator для единого управления состоянием
 */

// Debug logs removed for performance optimization

import { createContext, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { getMediaManagementOrchestrator } from "../services/media-management-orchestrator"
import type { MediaImportOptions, MediaInfo, MediaManagementService } from "../types"

const logger = createLogger("MediaManagementProvider")

interface MediaManagementContextValue extends MediaManagementService {
  mediaPool: Map<string, MediaInfo>
  fileOperationsState: any
  mediaImportState: any
  isReady: boolean
  isLoading: boolean
  error: string | null
  removeMedia: (mediaId: string) => Promise<void>
  removeMultipleMedia: (mediaIds: string[]) => Promise<void>
}

export const MediaManagementContext = createContext<MediaManagementContextValue | null>(null)

interface MediaManagementProviderProps {
  children: ReactNode
}

export function MediaManagementProvider({ children }: MediaManagementProviderProps) {
  // Используем orchestrator вместо прямого управления состоянием
  const orchestrator = useMemo(() => {
    try {
      logger.infoSync("[MediaManagementProvider] Creating orchestrator instance")
      const instance = getMediaManagementOrchestrator()
      logger.infoSync("[MediaManagementProvider] Orchestrator created", {
        hasMediaPool: instance.getMediaPool().size > 0,
        poolSize: instance.getMediaPool().size,
      })
      return instance
    } catch (error) {
      logger.errorSync("ERROR creating orchestrator", { error: String(error) })
      throw error
    }
  }, [])

  // Локальное состояние для React-реактивности (синхронизируется с orchestrator)
  const [mediaPool, setMediaPool] = useState<Map<string, MediaInfo>>(() => {
    return orchestrator.getMediaPool()
  })
  const [isLoading, setIsLoading] = useState(() => orchestrator.isMediaLoading())
  const [error, setError] = useState<string | null>(() => orchestrator.getError())
  const [fileOperationsState, setFileOperationsState] = useState(() => orchestrator.getFileOperationsState())
  const [mediaImportState, setMediaImportState] = useState(() => orchestrator.getMediaImportState())

  // Подписка на изменения состояния операций с файлами
  useEffect(() => {
    const unsubscribeFileOps = orchestrator.subscribeToFileOperations((state) => {
      setFileOperationsState(state.context)
    })

    const unsubscribeImport = orchestrator.subscribeToMediaImport((state) => {
      setMediaImportState(state.context)
    })

    return () => {
      unsubscribeFileOps.unsubscribe()
      unsubscribeImport.unsubscribe()
    }
  }, [orchestrator])

  // Периодическая синхронизация состояния с orchestrator
  // (для mediaPool, isLoading, error которые не имеют подписок)
  // ОПТИМИЗИРОВАНО: используем refs для сравнения и обновляем только при изменениях
  const prevLoadingRef = useRef(isLoading)
  const prevErrorRef = useRef(error)

  useEffect(() => {
    const syncState = () => {
      const newMediaPool = orchestrator.getMediaPool()
      const newIsLoading = orchestrator.isMediaLoading()
      const newError = orchestrator.getError()

      // Обновляем только если изменилось
      setMediaPool((prev) => {
        if (prev.size !== newMediaPool.size) return newMediaPool
        // Проверяем содержимое только если размеры одинаковые
        for (const [key, value] of newMediaPool) {
          if (!prev.has(key) || prev.get(key) !== value) return newMediaPool
        }
        return prev
      })

      // ОПТИМИЗИРОВАНО: обновляем isLoading только при изменении
      if (prevLoadingRef.current !== newIsLoading) {
        prevLoadingRef.current = newIsLoading
        setIsLoading(newIsLoading)
      }

      // ОПТИМИЗИРОВАНО: обновляем error только при изменении
      if (prevErrorRef.current !== newError) {
        prevErrorRef.current = newError
        setError(newError)
      }
    }

    // Первоначальная синхронизация
    syncState()

    // ОПТИМИЗИРОВАНО: увеличен интервал до 1000ms (было 500ms)
    const interval = setInterval(syncState, 1000)

    return () => clearInterval(interval)
  }, [orchestrator])

  // Сервис делегирует все операции orchestrator
  const importFiles = useCallback(
    async (files: string[], options: MediaImportOptions = {}) => {
      logger.infoSync("[MediaManagementProvider] Importing files via orchestrator", { filesCount: files.length })
      const result = await orchestrator.importFiles(files, options)
      // Синхронизируем состояние после операции
      setMediaPool(orchestrator.getMediaPool())
      setIsLoading(orchestrator.isMediaLoading())
      setError(orchestrator.getError())
      return result
    },
    [orchestrator],
  )

  const selectMediaFiles = useCallback(async () => {
    return orchestrator.selectMediaFiles()
  }, [orchestrator])

  const selectAudioFiles = useCallback(async () => {
    return orchestrator.selectAudioFiles()
  }, [orchestrator])

  const selectMediaDirectory = useCallback(async () => {
    const result = await orchestrator.selectMediaDirectory()
    // Синхронизируем состояние после операции
    setMediaPool(orchestrator.getMediaPool())
    return result
  }, [orchestrator])

  const getMediaInfo = useCallback(
    async (path: string) => {
      return orchestrator.getMediaInfo(path)
    },
    [orchestrator],
  )

  const extractMetadata = useCallback(
    async (path: string) => {
      setIsLoading(true)
      try {
        const result = await orchestrator.extractMetadata(path)
        setMediaPool(orchestrator.getMediaPool())
        return result
      } finally {
        setIsLoading(orchestrator.isMediaLoading())
        setError(orchestrator.getError())
      }
    },
    [orchestrator],
  )

  const removeMedia = useCallback(
    async (mediaId: string) => {
      logger.infoSync("[MediaManagementProvider] Removing media via orchestrator", { mediaId })
      await orchestrator.removeMedia(mediaId)
      // Синхронизируем состояние после операции
      setMediaPool(orchestrator.getMediaPool())
    },
    [orchestrator],
  )

  const removeMultipleMedia = useCallback(
    async (mediaIds: string[]) => {
      logger.infoSync("[MediaManagementProvider] Removing multiple media via orchestrator", { count: mediaIds.length })
      await orchestrator.removeMultipleMedia(mediaIds)
      // Синхронизируем состояние после операции
      setMediaPool(orchestrator.getMediaPool())
    },
    [orchestrator],
  )

  const mediaManagementService: MediaManagementService = useMemo(
    () => ({
      importFiles,
      selectMediaFiles,
      selectAudioFiles,
      selectMediaDirectory,
      getMediaInfo,
      extractMetadata,
    }),
    [importFiles, selectMediaFiles, selectAudioFiles, selectMediaDirectory, getMediaInfo, extractMetadata],
  )

  // Преобразование fileOperationsState для совместимости с существующим API
  const formattedFileOperationsState = useMemo(() => {
    const operations = [
      ...fileOperationsState.activeOperations,
      ...fileOperationsState.completedOperations,
      ...fileOperationsState.failedOperations,
    ]
    return {
      operations,
      hasActiveOperations: fileOperationsState.activeOperations.length > 0,
      completedOperations: fileOperationsState.completedOperations,
      failedOperations: fileOperationsState.failedOperations,
    }
  }, [fileOperationsState])

  // Преобразование mediaImportState для совместимости с существующим API
  // MediaImportContext имеет поля: files, options, operations, currentOperation, totalProgress, errors
  const formattedMediaImportState = useMemo(() => {
    // Определяем status на основе состояния контекста
    let status: "idle" | "importing" | "completed" | "failed" = "idle"

    if (mediaImportState.currentOperation) {
      status = "importing"
    } else if (mediaImportState.errors && mediaImportState.errors.length > 0) {
      status = "failed"
    } else if (mediaImportState.totalProgress >= 100 && mediaImportState.operations?.length > 0) {
      status = "completed"
    }

    return {
      status,
      isImporting: status === "importing",
      isCompleted: status === "completed",
      isFailed: status === "failed",
    }
  }, [mediaImportState])

  const value: MediaManagementContextValue = useMemo(
    () => ({
      ...mediaManagementService,
      mediaPool,
      fileOperationsState: formattedFileOperationsState,
      mediaImportState: formattedMediaImportState,
      isReady: true,
      isLoading,
      error,
      removeMedia,
      removeMultipleMedia,
    }),
    [
      mediaManagementService,
      mediaPool,
      formattedFileOperationsState,
      formattedMediaImportState,
      isLoading,
      error,
      removeMedia,
      removeMultipleMedia,
    ],
  )

  return <MediaManagementContext.Provider value={value}>{children}</MediaManagementContext.Provider>
}
