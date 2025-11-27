/**
 * Media Management Domain Provider
 *
 * Централизованный провайдер для Media Management домена
 * Использует MediaManagementOrchestrator для единого управления состоянием
 */

import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
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
}

export const MediaManagementContext = createContext<MediaManagementContextValue | null>(null)

interface MediaManagementProviderProps {
  children: ReactNode
}

export function MediaManagementProvider({ children }: MediaManagementProviderProps) {
  console.log("🔵 [MediaManagementProvider] COMPONENT MOUNTING")

  // Используем orchestrator вместо прямого управления состоянием
  const orchestrator = useMemo(() => {
    console.log("🔵 [MediaManagementProvider] Creating orchestrator instance")
    logger.infoSync("[MediaManagementProvider] Creating orchestrator instance")
    const instance = getMediaManagementOrchestrator()
    logger.infoSync("[MediaManagementProvider] Orchestrator created", {
      hasMediaPool: instance.getMediaPool().size > 0,
      poolSize: instance.getMediaPool().size,
    })
    return instance
  }, [])

  // Локальное состояние для React-реактивности (синхронизируется с orchestrator)
  const [mediaPool, setMediaPool] = useState<Map<string, MediaInfo>>(() => orchestrator.getMediaPool())
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
      setIsLoading(newIsLoading)
      setError(newError)
    }

    // Первоначальная синхронизация
    syncState()

    // Синхронизация каждые 500ms для отслеживания изменений
    const interval = setInterval(syncState, 500)

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
    }),
    [mediaManagementService, mediaPool, formattedFileOperationsState, formattedMediaImportState, isLoading, error],
  )

  return <MediaManagementContext.Provider value={value}>{children}</MediaManagementContext.Provider>
}
