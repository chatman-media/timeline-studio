/**
 * Performance Monitor для Video Player
 *
 * Отслеживает метрики производительности синхронизации с backend
 * Canonical source for performance monitoring
 */

export interface PerformanceMetrics {
  /** Среднее время синхронизации (ms) */
  avgSyncTime: number
  /** Частота синхронизации (ops/sec) */
  syncFrequency: number
  /** Размер очереди команд */
  commandQueueSize: number
  /** Количество проваленных команд */
  failedCommands: number
  /** Последняя ошибка */
  lastError: string | null
  /** Время последней синхронизации */
  lastSyncTime: number | null
  /** P95 latency (95-й процентиль времени синхронизации) */
  p95Latency: number
  /** P99 latency (99-й процентиль времени синхронизации) */
  p99Latency: number
  /** Общее количество выполненных команд */
  totalCommands: number
}

export interface SyncRecord {
  timestamp: number
  duration: number
  commandType: string
  success: boolean
  error?: string
}

/**
 * Performance Monitor для отслеживания производительности видеоплеера
 */
export class PerformanceMonitor {
  private metrics = {
    syncTimes: [] as number[],
    syncRecords: [] as SyncRecord[],
    firstSyncTime: 0,
    lastSyncTime: 0,
    commandCount: 0,
    failureCount: 0,
    lastError: null as string | null,
  }

  private readonly MAX_SYNC_RECORDS = 1000
  private readonly MAX_SYNC_TIMES = 200

  /**
   * Записать успешную синхронизацию
   */
  recordSync(duration: number, commandType: string = "unknown") {
    const now = performance.now()

    // Записываем время синхронизации
    this.metrics.syncTimes.push(duration)
    if (this.metrics.syncTimes.length > this.MAX_SYNC_TIMES) {
      this.metrics.syncTimes.shift()
    }

    // Записываем детальную запись
    this.metrics.syncRecords.push({
      timestamp: now,
      duration,
      commandType,
      success: true,
    })

    // Ограничиваем размер истории
    if (this.metrics.syncRecords.length > this.MAX_SYNC_RECORDS) {
      this.metrics.syncRecords.shift()
    }

    // Обновляем счётчики
    if (this.metrics.firstSyncTime === 0) {
      this.metrics.firstSyncTime = now
    }
    this.metrics.lastSyncTime = now
    this.metrics.commandCount++
  }

  /**
   * Записать проваленную команду
   */
  recordFailure(error: Error, commandType: string = "unknown") {
    const now = performance.now()

    this.metrics.failureCount++
    this.metrics.lastError = error.message

    // Записываем детальную запись
    this.metrics.syncRecords.push({
      timestamp: now,
      duration: 0,
      commandType,
      success: false,
      error: error.message,
    })

    // Ограничиваем размер истории
    if (this.metrics.syncRecords.length > this.MAX_SYNC_RECORDS) {
      this.metrics.syncRecords.shift()
    }

    this.metrics.commandCount++
  }

  /**
   * Получить текущие метрики производительности
   */
  getMetrics(): PerformanceMetrics {
    const now = performance.now()
    const timeRange = now - this.metrics.firstSyncTime

    // Среднее время синхронизации
    const avgSyncTime =
      this.metrics.syncTimes.length > 0
        ? this.metrics.syncTimes.reduce((a, b) => a + b, 0) / this.metrics.syncTimes.length
        : 0

    // Частота синхронизации (operations per second)
    const syncFrequency = timeRange > 0 ? (this.metrics.commandCount / timeRange) * 1000 : 0

    // P95 и P99 latency
    const sortedTimes = [...this.metrics.syncTimes].sort((a, b) => a - b)
    const p95Index = Math.floor(sortedTimes.length * 0.95)
    const p99Index = Math.floor(sortedTimes.length * 0.99)
    const p95Latency = sortedTimes[p95Index] || 0
    const p99Latency = sortedTimes[p99Index] || 0

    return {
      avgSyncTime,
      syncFrequency,
      commandQueueSize: this.metrics.syncRecords.length,
      failedCommands: this.metrics.failureCount,
      lastError: this.metrics.lastError,
      lastSyncTime: this.metrics.lastSyncTime > 0 ? this.metrics.lastSyncTime : null,
      p95Latency,
      p99Latency,
      totalCommands: this.metrics.commandCount,
    }
  }

  /**
   * Получить детальную историю синхронизаций
   */
  getSyncRecords(limit: number = 100): SyncRecord[] {
    return this.metrics.syncRecords.slice(-limit)
  }

  /**
   * Получить статистику по типам команд
   */
  getCommandTypeStats(): Record<string, { count: number; avgDuration: number; failureRate: number }> {
    const stats: Record<
      string,
      {
        count: number
        totalDuration: number
        failures: number
      }
    > = {}

    for (const record of this.metrics.syncRecords) {
      if (!stats[record.commandType]) {
        stats[record.commandType] = {
          count: 0,
          totalDuration: 0,
          failures: 0,
        }
      }

      stats[record.commandType].count++
      stats[record.commandType].totalDuration += record.duration

      if (!record.success) {
        stats[record.commandType].failures++
      }
    }

    // Конвертируем в итоговый формат
    const result: Record<string, { count: number; avgDuration: number; failureRate: number }> = {}

    for (const [commandType, data] of Object.entries(stats)) {
      result[commandType] = {
        count: data.count,
        avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
        failureRate: data.count > 0 ? data.failures / data.count : 0,
      }
    }

    return result
  }

  /**
   * Сбросить все метрики
   */
  reset() {
    this.metrics = {
      syncTimes: [],
      syncRecords: [],
      firstSyncTime: 0,
      lastSyncTime: 0,
      commandCount: 0,
      failureCount: 0,
      lastError: null,
    }
  }

  /**
   * Проверить здоровье системы
   */
  getHealthStatus(): {
    isHealthy: boolean
    issues: string[]
    warnings: string[]
  } {
    const metrics = this.getMetrics()
    const issues: string[] = []
    const warnings: string[] = []

    // Проверка частоты ошибок
    if (metrics.totalCommands > 0) {
      const failureRate = metrics.failedCommands / metrics.totalCommands
      if (failureRate > 0.1) {
        issues.push(`High failure rate: ${(failureRate * 100).toFixed(1)}%`)
      } else if (failureRate > 0.05) {
        warnings.push(`Elevated failure rate: ${(failureRate * 100).toFixed(1)}%`)
      }
    }

    // Проверка latency
    if (metrics.p99Latency > 1000) {
      issues.push(`High P99 latency: ${metrics.p99Latency.toFixed(0)}ms`)
    } else if (metrics.p99Latency > 500) {
      warnings.push(`Elevated P99 latency: ${metrics.p99Latency.toFixed(0)}ms`)
    }

    if (metrics.avgSyncTime > 200) {
      issues.push(`High average sync time: ${metrics.avgSyncTime.toFixed(0)}ms`)
    } else if (metrics.avgSyncTime > 100) {
      warnings.push(`Elevated average sync time: ${metrics.avgSyncTime.toFixed(0)}ms`)
    }

    // Проверка размера очереди
    if (metrics.commandQueueSize > 500) {
      issues.push(`Large command queue: ${metrics.commandQueueSize}`)
    } else if (metrics.commandQueueSize > 200) {
      warnings.push(`Growing command queue: ${metrics.commandQueueSize}`)
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      warnings,
    }
  }

  /**
   * Получить сводный отчет
   */
  getSummaryReport(): string {
    const metrics = this.getMetrics()
    const health = this.getHealthStatus()
    const commandStats = this.getCommandTypeStats()

    let report = "=== Video Player Performance Report ===\n\n"

    report += "📊 Overall Metrics:\n"
    report += `  Total Commands: ${metrics.totalCommands}\n`
    report += `  Failed Commands: ${metrics.failedCommands}\n`
    report += `  Success Rate: ${((1 - metrics.failedCommands / metrics.totalCommands) * 100).toFixed(1)}%\n`
    report += `  Sync Frequency: ${metrics.syncFrequency.toFixed(2)} ops/sec\n\n`

    report += "⏱️ Latency Metrics:\n"
    report += `  Average: ${metrics.avgSyncTime.toFixed(2)}ms\n`
    report += `  P95: ${metrics.p95Latency.toFixed(2)}ms\n`
    report += `  P99: ${metrics.p99Latency.toFixed(2)}ms\n\n`

    report += "🏥 Health Status:\n"
    report += `  Status: ${health.isHealthy ? "✅ Healthy" : "❌ Unhealthy"}\n`

    if (health.issues.length > 0) {
      report += "  Issues:\n"
      for (const issue of health.issues) {
        report += `    - ${issue}\n`
      }
    }

    if (health.warnings.length > 0) {
      report += "  Warnings:\n"
      for (const warning of health.warnings) {
        report += `    - ${warning}\n`
      }
    }

    report += "\n📋 Command Type Statistics:\n"
    for (const [commandType, stats] of Object.entries(commandStats)) {
      report += `  ${commandType}:\n`
      report += `    Count: ${stats.count}\n`
      report += `    Avg Duration: ${stats.avgDuration.toFixed(2)}ms\n`
      report += `    Failure Rate: ${(stats.failureRate * 100).toFixed(1)}%\n`
    }

    return report
  }
}

/**
 * Singleton instance глобального Performance Monitor
 */
export const globalPerformanceMonitor = new PerformanceMonitor()
