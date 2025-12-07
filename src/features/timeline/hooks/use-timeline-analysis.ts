/**
 * Hook для управления вкладкой "Анализ" на таймлайне
 *
 * Предоставляет:
 * - Список всех анализов (текущих и завершенных)
 * - Фильтрацию по статусу и типу
 * - Выбор анализа для просмотра деталей
 * - Real-time обновления через Tauri events
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { container } from "@/core"
import type { UnlistenFn } from "@/core/ports"
import { createLogger } from "@/lib/tauri-logger"

import { useAIDirectorAnalysisV2 } from "@/features/ai-director/hooks/use-ai-director-analysis-v2"
import type {
  AnalyzerType,
  BatchAnalysisProgress,
  FileAnalysisProgress,
  FileAnalysisStatus,
} from "@/features/ai-director/types/analysis-progress"

const logger = createLogger("useTimelineAnalysis")

export interface AnalysisFilters {
  status: FileAnalysisStatus | "all"
  analyzerType: AnalyzerType | "all"
}

export interface UseTimelineAnalysisReturn {
  // State
  filesProgress: FileAnalysisProgress[]
  filteredFiles: FileAnalysisProgress[]
  selectedFileId: string | null
  selectedFile: FileAnalysisProgress | null
  filters: AnalysisFilters
  batchProgress: BatchAnalysisProgress | null
  isAnalyzing: boolean

  // Actions
  setSelectedFileId: (fileId: string | null) => void
  setFilters: (filters: Partial<AnalysisFilters>) => void
  clearFilters: () => void

  // Computed
  totalFiles: number
  completedFiles: number
  analyzingFiles: number
  failedFiles: number
  overallProgress: number
}

const DEFAULT_FILTERS: AnalysisFilters = {
  status: "all",
  analyzerType: "all",
}

/**
 * Hook для управления вкладкой анализа на таймлайне
 */
export function useTimelineAnalysis(): UseTimelineAnalysisReturn {
  const { filesProgress, batchProgress, isAnalyzing, overallProgress } = useAIDirectorAnalysisV2()

  // Local state
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<AnalysisFilters>(DEFAULT_FILTERS)

  // Subscribe to Tauri events for real-time updates
  useEffect(() => {
    const eventBus = container.getEventBus()
    const unlisteners: UnlistenFn[] = []

    // File progress events
    const unlistenFileStarted = eventBus.on("ai-director:file-started", (event) => {
      logger.info("File analysis started:", event.payload)
    })

    const unlistenFileCompleted = eventBus.on("ai-director:file-completed", (event) => {
      logger.info("File analysis completed:", event.payload)
    })

    const unlistenFileError = eventBus.on("ai-director:file-error", (event) => {
      logger.error("File analysis error:", event.payload)
    })

    unlisteners.push(unlistenFileStarted, unlistenFileCompleted, unlistenFileError)

    return () => {
      unlisteners.forEach((unlisten) => {
        if (typeof unlisten === "function") {
          unlisten()
        } else if (unlisten && typeof unlisten.then === "function") {
          unlisten.then((fn) => fn())
        }
      })
    }
  }, [])

  // Выбранный файл
  const selectedFile = useMemo(() => {
    if (!selectedFileId) return null
    return filesProgress.find((f) => f.fileId === selectedFileId || f.id === selectedFileId) || null
  }, [selectedFileId, filesProgress])

  // Фильтрация файлов
  const filteredFiles = useMemo(() => {
    let filtered = [...filesProgress]

    // Фильтр по статусу
    if (filters.status !== "all") {
      filtered = filtered.filter((file) => file.status === filters.status)
    }

    // Фильтр по типу анализатора
    if (filters.analyzerType !== "all") {
      filtered = filtered.filter((file) => file.analyzers.some((a) => a.type === filters.analyzerType))
    }

    return filtered
  }, [filesProgress, filters])

  // Computed statistics
  const totalFiles = filesProgress.length
  const completedFiles = filesProgress.filter((f) => f.status === "completed").length
  const analyzingFiles = filesProgress.filter((f) => f.status === "analyzing").length
  const failedFiles = filesProgress.filter((f) => f.status === "error").length

  // Actions
  const setFilters = useCallback((newFilters: Partial<AnalysisFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
  }, [])

  return {
    // State
    filesProgress,
    filteredFiles,
    selectedFileId,
    selectedFile,
    filters,
    batchProgress,
    isAnalyzing,

    // Actions
    setSelectedFileId,
    setFilters,
    clearFilters,

    // Computed
    totalFiles,
    completedFiles,
    analyzingFiles,
    failedFiles,
    overallProgress,
  }
}
