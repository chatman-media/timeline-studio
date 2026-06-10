/**
 * React Hook для Performance Monitor
 * Предоставляет доступ к метрикам производительности видеоплеера
 */

import { useEffect, useState } from "react"
import {
  globalPerformanceMonitor,
  type PerformanceMetrics,
  type SyncRecord,
} from "@timeline-studio/core/services/video-player-performance-monitor"

export interface UsePerformanceMonitorOptions {
  /** Включить автоматическое обновление метрик */
  autoRefresh?: boolean
  /** Интервал обновления (ms) */
  refreshInterval?: number
}

export interface UsePerformanceMonitorReturn {
  /** Текущие метрики производительности */
  metrics: PerformanceMetrics
  /** Детальная история синхронизаций */
  syncRecords: SyncRecord[]
  /** Статистика по типам команд */
  commandTypeStats: Record<string, { count: number; avgDuration: number; failureRate: number }>
  /** Статус здоровья */
  health: {
    isHealthy: boolean
    issues: string[]
    warnings: string[]
  }
  /** Сводный отчет */
  summaryReport: string
  /** Сбросить все метрики */
  reset: () => void
  /** Вручную обновить метрики */
  refresh: () => void
}

/**
 * Hook для доступа к Performance Monitor
 */
export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}): UsePerformanceMonitorReturn {
  const { autoRefresh = true, refreshInterval = 1000 } = options

  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => globalPerformanceMonitor.getMetrics())
  const [syncRecords, setSyncRecords] = useState<SyncRecord[]>(() => globalPerformanceMonitor.getSyncRecords())
  const [commandTypeStats, setCommandTypeStats] = useState(() => globalPerformanceMonitor.getCommandTypeStats())
  const [health, setHealth] = useState(() => globalPerformanceMonitor.getHealthStatus())
  const [summaryReport, setSummaryReport] = useState(() => globalPerformanceMonitor.getSummaryReport())

  // Функция для обновления всех метрик
  const refresh = () => {
    setMetrics(globalPerformanceMonitor.getMetrics())
    setSyncRecords(globalPerformanceMonitor.getSyncRecords())
    setCommandTypeStats(globalPerformanceMonitor.getCommandTypeStats())
    setHealth(globalPerformanceMonitor.getHealthStatus())
    setSummaryReport(globalPerformanceMonitor.getSummaryReport())
  }

  // Функция для сброса метрик
  const reset = () => {
    globalPerformanceMonitor.reset()
    refresh()
  }

  // Автоматическое обновление метрик
  useEffect(() => {
    if (!autoRefresh) return

    const intervalId = setInterval(refresh, refreshInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [autoRefresh, refreshInterval])

  return {
    metrics,
    syncRecords,
    commandTypeStats,
    health,
    summaryReport,
    reset,
    refresh,
  }
}
