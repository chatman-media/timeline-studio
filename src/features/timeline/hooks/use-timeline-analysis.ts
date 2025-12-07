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

import { analysisStorageService } from "@/domains/ai-services/services/analysis-storage-service"
import { useAIDirectorAnalysisV2 } from "@/features/ai-director/hooks/use-ai-director-analysis-v2"
import type {
  AnalyzerType,
  BatchAnalysisProgress,
  FileAnalysisProgress,
  FileAnalysisStatus,
} from "@/features/ai-director/types/analysis-progress"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("UseTimelineAnalysis")

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
  const [savedAnalyses, setSavedAnalyses] = useState<FileAnalysisProgress[]>([])

  // Загрузка сохраненных анализов при монтировании
  useEffect(() => {
    const loadSavedAnalyses = async () => {
      try {
        logger.info("Загрузка сохраненных анализов из storage")

        const analyzedVideos = await analysisStorageService.getAnalyzedVideos()
        logger.info(`Найдено сохраненных анализов: ${analyzedVideos.length}`)

        const analyses: FileAnalysisProgress[] = []

        for (const videoPath of analyzedVideos) {
          // Загружаем comprehensive analysis для каждого видео
          const result = await analysisStorageService.loadComprehensiveAnalysis(videoPath)

          if (result.success && result.data) {
            const fileName = videoPath.split('/').pop() || videoPath.split('\\').pop() || videoPath

            // Создаем FileAnalysisProgress из сохраненного анализа
            const fileProgress: FileAnalysisProgress = {
              id: result.data.analysis_id,
              fileId: result.data.analysis_id,
              fileName,
              filePath: videoPath,
              status: "completed" as FileAnalysisStatus,
              progress: 100,
              analyzers: [],
              stats: {
                totalAnalyzers: 0,
                completedAnalyzers: 0,
                failedAnalyzers: 0,
              },
              startTime: result.data.started_at,
              endTime: result.data.completed_at,
              duration: result.data.duration,
            }

            analyses.push(fileProgress)
          }
        }

        setSavedAnalyses(analyses)
        logger.info(`Загружено сохраненных анализов: ${analyses.length}`)
      } catch (error) {
        logger.error("Ошибка загрузки сохраненных анализов", { error })
      }
    }

    void loadSavedAnalyses()
  }, [])

  // Объединяем текущие и сохраненные анализы
  const allFilesProgress = useMemo(() => {
    // Создаем Map для дедупликации по fileId/id
    const filesMap = new Map<string, FileAnalysisProgress>()

    // Сначала добавляем текущие анализы (они имеют приоритет)
    for (const file of filesProgress) {
      const key = file.fileId || file.id
      filesMap.set(key, file)
    }

    // Затем добавляем сохраненные (только если их еще нет)
    for (const file of savedAnalyses) {
      const key = file.fileId || file.id
      if (!filesMap.has(key)) {
        filesMap.set(key, file)
      }
    }

    return Array.from(filesMap.values())
  }, [filesProgress, savedAnalyses])

  // Real-time updates are handled by useAIDirectorAnalysisV2

  // Выбранный файл
  const selectedFile = useMemo(() => {
    if (!selectedFileId) return null
    return allFilesProgress.find((f) => f.fileId === selectedFileId || f.id === selectedFileId) || null
  }, [selectedFileId, allFilesProgress])

  // Фильтрация файлов
  const filteredFiles = useMemo(() => {
    let filtered = [...allFilesProgress]

    // Фильтр по статусу
    if (filters.status !== "all") {
      filtered = filtered.filter((file) => file.status === filters.status)
    }

    // Фильтр по типу анализатора
    if (filters.analyzerType !== "all") {
      filtered = filtered.filter((file) => file.analyzers.some((a) => a.type === filters.analyzerType))
    }

    return filtered
  }, [allFilesProgress, filters])

  // Computed statistics
  const totalFiles = allFilesProgress.length
  const completedFiles = allFilesProgress.filter((f) => f.status === "completed").length
  const analyzingFiles = allFilesProgress.filter((f) => f.status === "analyzing").length
  const failedFiles = allFilesProgress.filter((f) => f.status === "error").length

  // Actions
  const setFilters = useCallback((newFilters: Partial<AnalysisFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
  }, [])

  return {
    // State
    filesProgress: allFilesProgress,
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
