/**
 * Performance Metrics для Project Management Domain
 *
 * Отслеживает метрики производительности:
 * - Command execution time
 * - State update frequency
 * - Memory usage tracking
 */

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("PerformanceMetrics")

export interface CommandMetric {
  commandType: string
  executionTime: number
  timestamp: number
  success: boolean
  error?: string
}

export interface StateUpdateMetric {
  eventType: string
  timestamp: number
  processingTime: number
}

export interface MemorySnapshot {
  timestamp: number
  heapUsed: number
  heapTotal: number
  external: number
}

export interface PerformanceReport {
  // Command metrics
  totalCommands: number
  successfulCommands: number
  failedCommands: number
  averageCommandTime: number
  slowestCommand: CommandMetric | null
  fastestCommand: CommandMetric | null

  // State update metrics
  totalStateUpdates: number
  averageStateUpdateTime: number
  stateUpdatesPerSecond: number

  // Memory metrics
  currentMemoryUsage: number
  peakMemoryUsage: number
  averageMemoryUsage: number

  // Time range
  startTime: number
  endTime: number
  duration: number
}

/**
 * Performance Metrics Tracker
 */
export class PerformanceMetricsTracker {
  private commandMetrics: CommandMetric[] = []
  private stateUpdateMetrics: StateUpdateMetric[] = []
  private memorySnapshots: MemorySnapshot[] = []
  private startTime: number = Date.now()

  // Настройки
  private maxMetricsSize = 1000 // Максимум 1000 записей
  private memorySnapshotInterval: NodeJS.Timeout | null = null

  constructor() {
    logger.info("[PerformanceMetricsTracker] Initialized")
    this.startMemoryTracking()
  }

  /**
   * Записать метрику выполнения команды
   */
  recordCommand(metric: CommandMetric) {
    this.commandMetrics.push(metric)

    // Ограничиваем размер массива
    if (this.commandMetrics.length > this.maxMetricsSize) {
      this.commandMetrics.shift()
    }

    // Логируем медленные команды
    if (metric.executionTime > 1000) {
      logger.warn("[PerformanceMetricsTracker] Slow command detected:", {
        command: metric.commandType,
        executionTime: metric.executionTime,
      })
    }
  }

  /**
   * Записать метрику обновления состояния
   */
  recordStateUpdate(metric: StateUpdateMetric) {
    this.stateUpdateMetrics.push(metric)

    // Ограничиваем размер массива
    if (this.stateUpdateMetrics.length > this.maxMetricsSize) {
      this.stateUpdateMetrics.shift()
    }

    // Логируем медленные обновления состояния
    if (metric.processingTime > 100) {
      logger.warn("[PerformanceMetricsTracker] Slow state update detected:", {
        eventType: metric.eventType,
        processingTime: metric.processingTime,
      })
    }
  }

  /**
   * Запустить отслеживание памяти
   */
  private startMemoryTracking() {
    // Snapshot каждые 10 секунд
    this.memorySnapshotInterval = setInterval(() => {
      this.takeMemorySnapshot()
    }, 10000)
  }

  /**
   * Остановить отслеживание памяти
   */
  stopMemoryTracking() {
    if (this.memorySnapshotInterval) {
      clearInterval(this.memorySnapshotInterval)
      this.memorySnapshotInterval = null
    }
  }

  /**
   * Сделать снимок памяти
   */
  private takeMemorySnapshot() {
    // В браузере performance.memory доступно только в Chrome
    const memoryInfo = (performance as any).memory

    if (!memoryInfo) {
      return
    }

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: memoryInfo.usedJSHeapSize || 0,
      heapTotal: memoryInfo.totalJSHeapSize || 0,
      external: memoryInfo.jsHeapSizeLimit || 0,
    }

    this.memorySnapshots.push(snapshot)

    // Ограничиваем размер массива
    if (this.memorySnapshots.length > this.maxMetricsSize) {
      this.memorySnapshots.shift()
    }
  }

  /**
   * Получить отчет о производительности
   */
  getReport(): PerformanceReport {
    const now = Date.now()
    const duration = now - this.startTime

    // Command metrics
    const totalCommands = this.commandMetrics.length
    const successfulCommands = this.commandMetrics.filter((m) => m.success).length
    const failedCommands = totalCommands - successfulCommands

    const commandTimes = this.commandMetrics.map((m) => m.executionTime)
    const averageCommandTime =
      commandTimes.length > 0 ? commandTimes.reduce((a, b) => a + b, 0) / commandTimes.length : 0

    const slowestCommand =
      this.commandMetrics.length > 0
        ? this.commandMetrics.reduce((prev, current) => (prev.executionTime > current.executionTime ? prev : current))
        : null

    const fastestCommand =
      this.commandMetrics.length > 0
        ? this.commandMetrics.reduce((prev, current) => (prev.executionTime < current.executionTime ? prev : current))
        : null

    // State update metrics
    const totalStateUpdates = this.stateUpdateMetrics.length
    const stateUpdateTimes = this.stateUpdateMetrics.map((m) => m.processingTime)
    const averageStateUpdateTime =
      stateUpdateTimes.length > 0 ? stateUpdateTimes.reduce((a, b) => a + b, 0) / stateUpdateTimes.length : 0

    const stateUpdatesPerSecond = totalStateUpdates > 0 ? (totalStateUpdates / duration) * 1000 : 0

    // Memory metrics
    const currentMemoryUsage =
      this.memorySnapshots.length > 0 ? this.memorySnapshots[this.memorySnapshots.length - 1].heapUsed : 0

    const peakMemoryUsage =
      this.memorySnapshots.length > 0 ? Math.max(...this.memorySnapshots.map((s) => s.heapUsed)) : 0

    const averageMemoryUsage =
      this.memorySnapshots.length > 0
        ? this.memorySnapshots.reduce((sum, s) => sum + s.heapUsed, 0) / this.memorySnapshots.length
        : 0

    return {
      // Command metrics
      totalCommands,
      successfulCommands,
      failedCommands,
      averageCommandTime,
      slowestCommand,
      fastestCommand,

      // State update metrics
      totalStateUpdates,
      averageStateUpdateTime,
      stateUpdatesPerSecond,

      // Memory metrics
      currentMemoryUsage,
      peakMemoryUsage,
      averageMemoryUsage,

      // Time range
      startTime: this.startTime,
      endTime: now,
      duration,
    }
  }

  /**
   * Логировать отчет в консоль
   */
  logReport() {
    const report = this.getReport()

    logger.info("[PerformanceMetricsTracker] Performance Report:", {
      commands: {
        total: report.totalCommands,
        successful: report.successfulCommands,
        failed: report.failedCommands,
        averageTime: `${report.averageCommandTime.toFixed(2)}ms`,
      },
      stateUpdates: {
        total: report.totalStateUpdates,
        averageTime: `${report.averageStateUpdateTime.toFixed(2)}ms`,
        perSecond: report.stateUpdatesPerSecond.toFixed(2),
      },
      memory: {
        current: `${(report.currentMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
        peak: `${(report.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
        average: `${(report.averageMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
      },
      duration: `${(report.duration / 1000).toFixed(2)}s`,
    })

    if (report.slowestCommand) {
      logger.info("[PerformanceMetricsTracker] Slowest command:", {
        command: report.slowestCommand.commandType,
        time: `${report.slowestCommand.executionTime}ms`,
      })
    }

    if (report.fastestCommand) {
      logger.info("[PerformanceMetricsTracker] Fastest command:", {
        command: report.fastestCommand.commandType,
        time: `${report.fastestCommand.executionTime}ms`,
      })
    }
  }

  /**
   * Очистить все метрики
   */
  clear() {
    this.commandMetrics = []
    this.stateUpdateMetrics = []
    this.memorySnapshots = []
    this.startTime = Date.now()

    logger.info("[PerformanceMetricsTracker] Metrics cleared")
  }

  /**
   * Cleanup
   */
  dispose() {
    this.stopMemoryTracking()
    this.clear()
    logger.info("[PerformanceMetricsTracker] Disposed")
  }
}

// Singleton instance
let metricsTrackerInstance: PerformanceMetricsTracker | null = null

/**
 * Получить экземпляр PerformanceMetricsTracker
 */
export function getPerformanceMetricsTracker(): PerformanceMetricsTracker {
  if (!metricsTrackerInstance) {
    metricsTrackerInstance = new PerformanceMetricsTracker()
  }
  return metricsTrackerInstance
}

/**
 * Сбросить экземпляр tracker (для тестов)
 */
export function resetPerformanceMetricsTracker() {
  if (metricsTrackerInstance) {
    metricsTrackerInstance.dispose()
    metricsTrackerInstance = null
  }
}
