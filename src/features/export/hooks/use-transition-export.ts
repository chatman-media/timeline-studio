/**
 * Хук для экспорта переходов через FFmpeg
 * Интегрируется с TransitionExportService и управляет состоянием экспорта
 */

import { useCallback, useMemo, useRef, useState } from "react"
import type { TimelineProject } from "@/features/timeline/types/timeline"
import { logError, logInfo } from "@/lib/tauri-logger"

import { TransitionExportService } from "../services/transition-export-service"
import type { ExportSettings } from "../types/export-types"
import type {
  TransitionExportResult,
  TransitionExportSettings,
  TransitionExportStatus,
} from "../types/transition-export-types"

interface UseTransitionExportState {
  isExporting: boolean
  progress: number
  currentTransition?: string
  error?: string
  result?: TransitionExportResult
  statuses: Map<string, TransitionExportStatus>
}

interface UseTransitionExportOptions {
  onProgress?: (status: TransitionExportStatus) => void
  onComplete?: (result: TransitionExportResult) => void
  onError?: (error: string) => void
  enableOptimizations?: boolean
}

export function useTransitionExport(options: UseTransitionExportOptions = {}) {
  logInfo("[useTransitionExport] Инициализация хука", { options })

  const { onProgress, onComplete, onError, enableOptimizations = true } = options

  const [state, setState] = useState<UseTransitionExportState>({
    isExporting: false,
    progress: 0,
    statuses: new Map(),
  })

  const serviceRef = useRef<TransitionExportService | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Получаем instance сервиса
  const service = useMemo(() => {
    if (!serviceRef.current) {
      serviceRef.current = TransitionExportService.getInstance()

      // Применяем настройки оптимизации
      if (enableOptimizations) {
        serviceRef.current.updateOptimizationSettings({
          enableTransitionCache: true,
          enableParallelProcessing: true,
          maxWorkers: navigator.hardwareConcurrency || 4,
          adaptiveQuality: true,
          enableFallbacks: true,
        })
      }
    }
    return serviceRef.current
  }, [enableOptimizations])

  // Очистить состояние
  const clearState = useCallback(() => {
    setState({
      isExporting: false,
      progress: 0,
      statuses: new Map(),
    })
    service.clearStatuses()
  }, [service])

  // Обработчик прогресса
  const handleProgress = useCallback(
    (status: TransitionExportStatus) => {
      setState((prev) => {
        const newStatuses = new Map(prev.statuses)
        newStatuses.set(status.transitionId, status)

        // Вычисляем общий прогресс
        const totalTransitions = newStatuses.size
        const completedTransitions = Array.from(newStatuses.values()).filter(
          (s) => s.status === "completed" || s.status === "failed",
        ).length

        const overallProgress = totalTransitions > 0 ? Math.round((completedTransitions / totalTransitions) * 100) : 0

        return {
          ...prev,
          progress: overallProgress,
          currentTransition: status.status === "processing" ? status.transitionId : prev.currentTransition,
          statuses: newStatuses,
        }
      })

      // Вызываем callback
      onProgress?.(status)
    },
    [onProgress],
  )

  // Проверка поддержки переходов в проекте
  const hasTransitions = useCallback((project: TimelineProject): boolean => {
    const allTracks = [...project.sections.flatMap((s) => s.tracks), ...project.globalTracks]

    return allTracks.some((track) => track.transitions && track.transitions.length > 0)
  }, [])

  // Получение информации о переходах
  const getTransitionInfo = useCallback(
    (project: TimelineProject) => {
      const transitionInfos = service.extractTransitionsFromProject(project)

      return {
        totalTransitions: transitionInfos.length,
        gpuAccelerated: transitionInfos.filter((t) => t.gpuAccelerated).length,
        estimatedTime: transitionInfos.reduce((acc, t) => acc + t.duration, 0),
        complexity: transitionInfos.reduce((acc, t) => {
          // Простая оценка сложности
          let complexity = 1
          if (t.gpuAccelerated) complexity += 1
          if (t.customParameters && Object.keys(t.customParameters).length > 0) complexity += 1
          if (t.shaderType !== "basic") complexity += 1
          return acc + complexity
        }, 0),
      }
    },
    [service],
  )

  // Основная функция экспорта
  const exportTransitions = useCallback(
    async (
      project: TimelineProject,
      exportSettings: ExportSettings | TransitionExportSettings,
      clipPaths: Map<string, string>,
    ): Promise<TransitionExportResult | null> => {
      // Проверяем наличие переходов
      if (!hasTransitions(project)) {
        onError?.("В проекте нет переходов для экспорта")
        return null
      }

      // Проверяем, что экспорт не запущен
      if (state.isExporting) {
        onError?.("Экспорт уже выполняется")
        return null
      }

      try {
        // Создаем AbortController для отмены
        abortControllerRef.current = new AbortController()

        // Обновляем состояние
        setState((prev) => ({
          ...prev,
          isExporting: true,
          progress: 0,
          error: undefined,
          result: undefined,
        }))

        // Запускаем экспорт
        const result = await service.exportTransitions(project, exportSettings, clipPaths, handleProgress)

        // Обновляем состояние с результатом
        setState((prev) => ({
          ...prev,
          isExporting: false,
          progress: 100,
          result,
        }))

        // Вызываем callback
        onComplete?.(result)

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка"

        logError("[useTransitionExport] Ошибка экспорта переходов", error)

        setState((prev) => ({
          ...prev,
          isExporting: false,
          error: errorMessage,
        }))

        onError?.(errorMessage)
        return null
      }
    },
    [state.isExporting, service, hasTransitions, handleProgress, onComplete, onError],
  )

  // Отмена экспорта
  const cancelExport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setState((prev) => ({
      ...prev,
      isExporting: false,
      error: "Экспорт отменен пользователем",
    }))
  }, [])

  // Получение статуса конкретного перехода
  const getTransitionStatus = useCallback(
    (transitionId: string): TransitionExportStatus | undefined => {
      return state.statuses.get(transitionId) || service.getExportStatus(transitionId)
    },
    [state.statuses, service],
  )

  // Получение статистики экспорта
  const getExportStats = useCallback(() => {
    const statuses = Array.from(state.statuses.values())

    return {
      total: statuses.length,
      completed: statuses.filter((s) => s.status === "completed").length,
      failed: statuses.filter((s) => s.status === "failed").length,
      processing: statuses.filter((s) => s.status === "processing").length,
      pending: statuses.filter((s) => s.status === "pending").length,
      averageTime:
        statuses.filter((s) => s.renderTimeMs).reduce((acc, s) => acc + (s.renderTimeMs || 0), 0) /
          statuses.filter((s) => s.renderTimeMs).length || 0,
      totalSize: statuses.reduce((acc, s) => acc + (s.outputSizeBytes || 0), 0),
    }
  }, [state.statuses])

  // Обновление настроек оптимизации
  const updateOptimizationSettings = useCallback(
    (settings: Parameters<TransitionExportService["updateOptimizationSettings"]>[0]) => {
      service.updateOptimizationSettings(settings)
    },
    [service],
  )

  return {
    // Состояние
    isExporting: state.isExporting,
    progress: state.progress,
    currentTransition: state.currentTransition,
    error: state.error,
    result: state.result,
    statuses: state.statuses,

    // Функции
    exportTransitions,
    cancelExport,
    clearState,

    // Утилиты
    hasTransitions,
    getTransitionInfo,
    getTransitionStatus,
    getExportStats,
    updateOptimizationSettings,
  }
}

export type UseTransitionExportReturn = ReturnType<typeof useTransitionExport>
