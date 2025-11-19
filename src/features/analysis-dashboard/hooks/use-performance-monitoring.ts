"use client"

/**
 * usePerformanceMonitoring Hook
 * Мониторинг системных ресурсов и производительности анализа
 */

import { useEffect, useState } from "react"
import type { FileAnalysisProgress } from "@/features/ai-director"
import { createLogger } from "@/lib/tauri-logger"
import type { PerformanceMetricsData } from "../components/performance-metrics"

const logger = createLogger("usePerformanceMonitoring")

interface UsePerformanceMonitoringOptions {
  /** Интервал обновления метрик в миллисекундах */
  updateInterval?: number
  /** Включить мониторинг системных ресурсов */
  enableSystemMonitoring?: boolean
  /** Включить расчет ETA */
  enableETA?: boolean
}

interface PerformanceMonitoringResult {
  metrics: PerformanceMetricsData
  isMonitoring: boolean
  startMonitoring: () => void
  stopMonitoring: () => void
}

/**
 * Hook для мониторинга производительности системы и анализа
 *
 * @example
 * ```tsx
 * const { metrics, isMonitoring } = usePerformanceMonitoring({
 *   filesProgress,
 *   updateInterval: 1000,
 *   enableETA: true
 * })
 *
 * return <PerformanceMetrics data={metrics} />
 * ```
 */
export function usePerformanceMonitoring(
  filesProgress: FileAnalysisProgress[] = [],
  options: UsePerformanceMonitoringOptions = {},
): PerformanceMonitoringResult {
  const {
    updateInterval = 2000, // обновлять каждые 2 секунды
    enableSystemMonitoring = false, // отключено по умолчанию (требует Tauri API)
    enableETA = true,
  } = options

  const [metrics, setMetrics] = useState<PerformanceMetricsData>({})
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)

  // Расчет метрик анализа
  const calculateAnalysisMetrics = () => {
    if (filesProgress.length === 0) return undefined

    const completedFiles = filesProgress.filter((f) => f.status === "completed")
    const analyzingFiles = filesProgress.filter((f) => f.status === "analyzing")
    const totalFiles = filesProgress.length

    // Расчет среднего времени обработки
    const completedWithDuration = completedFiles.filter((f) => f.duration)
    const avgProcessingTime =
      completedWithDuration.length > 0
        ? completedWithDuration.reduce((sum, f) => sum + (f.duration || 0), 0) / completedWithDuration.length / 1000
        : 0

    // Расчет общего времени
    const totalProcessingTime =
      filesProgress.filter((f) => f.duration).reduce((sum, f) => sum + (f.duration || 0), 0) / 1000

    // Расчет ETA
    let eta: number | undefined
    if (enableETA && avgProcessingTime > 0 && analyzingFiles.length > 0) {
      const remainingFiles = totalFiles - completedFiles.length
      eta = remainingFiles * avgProcessingTime

      // Учитываем текущий прогресс активных файлов
      const activeProgress = analyzingFiles.reduce((sum, f) => sum + f.progress, 0) / analyzingFiles.length
      if (activeProgress > 0) {
        eta = eta * ((100 - activeProgress) / 100)
      }
    }

    return {
      filesProcessed: completedFiles.length,
      totalFiles,
      avgProcessingTime,
      totalProcessingTime,
      eta,
    }
  }

  // Получение системных метрик
  const getSystemMetrics = async () => {
    if (!enableSystemMonitoring) return {}

    try {
      // TODO: Интеграция с Tauri API для получения системных метрик
      // const { invoke } = await import("@tauri-apps/api/core")
      // const systemInfo = await invoke("get_system_info")

      // Заглушка для демонстрации
      // В реальной реализации нужно вызвать Tauri команду
      return {
        cpu: {
          usage: Math.random() * 100, // Mock data
          cores: navigator.hardwareConcurrency || 4,
        },
        memory: {
          used: 2048, // Mock data
          total: 16384, // Mock data
        },
        gpu: {
          usage: 0, // GPU не используется в базовой версии
          name: undefined,
        },
      }
    } catch (error) {
      logger.errorSync("Failed to get system metrics", error as Record<string, unknown>)
      return {}
    }
  }

  // Обновление метрик
  const updateMetrics = async () => {
    const analysisMetrics = calculateAnalysisMetrics()
    const systemMetrics = await getSystemMetrics()

    setMetrics({
      ...systemMetrics,
      analysis: analysisMetrics,
    })
  }

  // Запуск мониторинга
  const startMonitoring = () => {
    if (isMonitoring) return

    logger.infoSync("Starting performance monitoring", { updateInterval, enableSystemMonitoring, enableETA })
    setIsMonitoring(true)

    // Первое обновление сразу
    updateMetrics()

    // Периодическое обновление
    const id = setInterval(() => {
      updateMetrics()
    }, updateInterval)

    setIntervalId(id)
  }

  // Остановка мониторинга
  const stopMonitoring = () => {
    if (!isMonitoring) return

    logger.infoSync("Stopping performance monitoring")
    setIsMonitoring(false)

    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
  }

  // Автоматический запуск/остановка при изменении filesProgress
  useEffect(() => {
    const hasActiveFiles = filesProgress.some((f) => f.status === "analyzing")

    if (hasActiveFiles && !isMonitoring) {
      startMonitoring()
    } else if (!hasActiveFiles && isMonitoring) {
      // Последнее обновление после завершения
      updateMetrics()
      stopMonitoring()
    }

    // Cleanup on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [filesProgress])

  // Обновление метрик при изменении filesProgress (даже если не мониторим)
  useEffect(() => {
    if (!isMonitoring) {
      updateMetrics()
    }
  }, [filesProgress])

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  }
}

/**
 * Simplified hook для получения только analysis метрик без системных ресурсов
 */
export function useAnalysisMetrics(filesProgress: FileAnalysisProgress[] = []) {
  const { metrics } = usePerformanceMonitoring(filesProgress, {
    enableSystemMonitoring: false,
    enableETA: true,
    updateInterval: 1000,
  })

  return metrics.analysis
}
