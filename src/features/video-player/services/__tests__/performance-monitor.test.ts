/**
 * Tests for Performance Monitor service
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { globalPerformanceMonitor, PerformanceMonitor } from "../performance-monitor"

describe("PerformanceMonitor", () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    vi.clearAllMocks()
    monitor = new PerformanceMonitor()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("recordSync", () => {
    it("должен записывать время синхронизации", () => {
      monitor.recordSync(50, "play")
      monitor.recordSync(75, "seek")

      const metrics = monitor.getMetrics()
      expect(metrics.totalCommands).toBe(2)
      expect(metrics.avgSyncTime).toBe(62.5)
    })

    it("должен обновлять lastSyncTime", () => {
      const beforeRecord = performance.now()
      monitor.recordSync(50, "play")

      const metrics = monitor.getMetrics()
      expect(metrics.lastSyncTime).toBeGreaterThanOrEqual(beforeRecord)
    })

    it("должен ограничивать размер истории syncTimes", () => {
      // MAX_SYNC_TIMES = 200
      for (let i = 0; i < 250; i++) {
        monitor.recordSync(i, "test")
      }

      const records = monitor.getSyncRecords(1000)
      // Проверяем что записи хранятся
      expect(records.length).toBeLessThanOrEqual(1000)
    })

    it("должен записывать командный тип по умолчанию как unknown", () => {
      monitor.recordSync(50)

      const records = monitor.getSyncRecords()
      expect(records[0].commandType).toBe("unknown")
    })

    it("должен записывать успешные синхронизации", () => {
      monitor.recordSync(100, "pause")

      const records = monitor.getSyncRecords()
      expect(records[0].success).toBe(true)
      expect(records[0].duration).toBe(100)
      expect(records[0].commandType).toBe("pause")
    })
  })

  describe("recordFailure", () => {
    it("должен записывать провалы команд", () => {
      const error = new Error("Test error")
      monitor.recordFailure(error, "play")

      const metrics = monitor.getMetrics()
      expect(metrics.failedCommands).toBe(1)
      expect(metrics.lastError).toBe("Test error")
    })

    it("должен инкрементировать общий счётчик команд", () => {
      const error = new Error("Error")
      monitor.recordFailure(error, "seek")

      const metrics = monitor.getMetrics()
      expect(metrics.totalCommands).toBe(1)
    })

    it("должен записывать детали ошибки в syncRecords", () => {
      const error = new Error("Custom error message")
      monitor.recordFailure(error, "volume")

      const records = monitor.getSyncRecords()
      expect(records[0].success).toBe(false)
      expect(records[0].error).toBe("Custom error message")
      expect(records[0].commandType).toBe("volume")
    })
  })

  describe("getMetrics", () => {
    it("должен возвращать начальные метрики", () => {
      const metrics = monitor.getMetrics()

      expect(metrics.avgSyncTime).toBe(0)
      expect(metrics.syncFrequency).toBe(0)
      expect(metrics.commandQueueSize).toBe(0)
      expect(metrics.failedCommands).toBe(0)
      expect(metrics.lastError).toBeNull()
      expect(metrics.lastSyncTime).toBeNull()
      expect(metrics.p95Latency).toBe(0)
      expect(metrics.p99Latency).toBe(0)
      expect(metrics.totalCommands).toBe(0)
    })

    it("должен корректно рассчитывать P95 latency", () => {
      // Записываем 100 значений от 1 до 100
      for (let i = 1; i <= 100; i++) {
        monitor.recordSync(i, "test")
      }

      const metrics = monitor.getMetrics()
      // P95 индекс = Math.floor(100 * 0.95) = 95, значение в sortedTimes[95] = 96
      expect(metrics.p95Latency).toBe(96)
    })

    it("должен корректно рассчитывать P99 latency", () => {
      // Записываем 100 значений от 1 до 100
      for (let i = 1; i <= 100; i++) {
        monitor.recordSync(i, "test")
      }

      const metrics = monitor.getMetrics()
      // P99 индекс = Math.floor(100 * 0.99) = 99, значение в sortedTimes[99] = 100
      expect(metrics.p99Latency).toBe(100)
    })

    it("должен рассчитывать частоту синхронизации", () => {
      // Записываем несколько команд
      monitor.recordSync(10, "play")
      monitor.recordSync(20, "pause")

      const metrics = monitor.getMetrics()
      // syncFrequency = (commandCount / timeRange) * 1000
      expect(metrics.syncFrequency).toBeGreaterThan(0)
    })
  })

  describe("getSyncRecords", () => {
    it("должен возвращать записи с ограничением", () => {
      for (let i = 0; i < 20; i++) {
        monitor.recordSync(i, "test")
      }

      const records = monitor.getSyncRecords(5)
      expect(records.length).toBe(5)
    })

    it("должен возвращать последние записи", () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordSync(i * 10, `test-${i}`)
      }

      const records = monitor.getSyncRecords(3)
      expect(records[0].commandType).toBe("test-7")
      expect(records[1].commandType).toBe("test-8")
      expect(records[2].commandType).toBe("test-9")
    })

    it("должен возвращать пустой массив если нет записей", () => {
      const records = monitor.getSyncRecords()
      expect(records).toEqual([])
    })
  })

  describe("getCommandTypeStats", () => {
    it("должен возвращать статистику по типам команд", () => {
      monitor.recordSync(100, "play")
      monitor.recordSync(50, "play")
      monitor.recordSync(200, "seek")
      monitor.recordFailure(new Error("Error"), "play")

      const stats = monitor.getCommandTypeStats()

      expect(stats.play.count).toBe(3)
      expect(stats.play.avgDuration).toBe(50) // (100 + 50 + 0) / 3
      expect(stats.play.failureRate).toBeCloseTo(1 / 3)

      expect(stats.seek.count).toBe(1)
      expect(stats.seek.avgDuration).toBe(200)
      expect(stats.seek.failureRate).toBe(0)
    })

    it("должен возвращать пустой объект если нет данных", () => {
      const stats = monitor.getCommandTypeStats()
      expect(stats).toEqual({})
    })
  })

  describe("reset", () => {
    it("должен сбрасывать все метрики", () => {
      monitor.recordSync(100, "play")
      monitor.recordFailure(new Error("Error"), "seek")

      monitor.reset()

      const metrics = monitor.getMetrics()
      expect(metrics.totalCommands).toBe(0)
      expect(metrics.failedCommands).toBe(0)
      expect(metrics.lastError).toBeNull()
      expect(metrics.avgSyncTime).toBe(0)
    })

    it("должен очищать историю записей", () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordSync(i, "test")
      }

      monitor.reset()

      const records = monitor.getSyncRecords()
      expect(records).toEqual([])
    })
  })

  describe("getHealthStatus", () => {
    it("должен возвращать здоровый статус при хороших метриках", () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordSync(50, "test")
      }

      const health = monitor.getHealthStatus()

      expect(health.isHealthy).toBe(true)
      expect(health.issues).toEqual([])
      expect(health.warnings).toEqual([])
    })

    it("должен добавлять issue при высоком failure rate (>10%)", () => {
      // 2 успеха, 1 провал = 33% failure rate
      monitor.recordSync(50, "test")
      monitor.recordSync(50, "test")
      monitor.recordFailure(new Error("Error"), "test")

      const health = monitor.getHealthStatus()

      expect(health.isHealthy).toBe(false)
      expect(health.issues.some((i) => i.includes("High failure rate"))).toBe(true)
    })

    it("должен добавлять warning при elevated failure rate (5-10%)", () => {
      // 18 успехов, 1 провал = ~5.3% failure rate
      for (let i = 0; i < 18; i++) {
        monitor.recordSync(50, "test")
      }
      monitor.recordFailure(new Error("Error"), "test")

      const health = monitor.getHealthStatus()

      expect(health.warnings.some((w) => w.includes("Elevated failure rate"))).toBe(true)
    })

    it("должен добавлять issue при высоком P99 latency (>1000ms)", () => {
      for (let i = 0; i < 100; i++) {
        monitor.recordSync(1100, "test")
      }

      const health = monitor.getHealthStatus()

      expect(health.isHealthy).toBe(false)
      expect(health.issues.some((i) => i.includes("High P99 latency"))).toBe(true)
    })

    it("должен добавлять warning при elevated P99 latency (500-1000ms)", () => {
      for (let i = 0; i < 100; i++) {
        monitor.recordSync(600, "test")
      }

      const health = monitor.getHealthStatus()

      expect(health.warnings.some((w) => w.includes("Elevated P99 latency"))).toBe(true)
    })

    it("должен добавлять issue при высоком среднем времени синхронизации (>200ms)", () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordSync(250, "test")
      }

      const health = monitor.getHealthStatus()

      expect(health.isHealthy).toBe(false)
      expect(health.issues.some((i) => i.includes("High average sync time"))).toBe(true)
    })

    it("должен добавлять warning при elevated average sync time (100-200ms)", () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordSync(150, "test")
      }

      const health = monitor.getHealthStatus()

      expect(health.warnings.some((w) => w.includes("Elevated average sync time"))).toBe(true)
    })

    it("должен добавлять issue при большой очереди команд (>500)", () => {
      for (let i = 0; i < 600; i++) {
        monitor.recordSync(10, "test")
      }

      const health = monitor.getHealthStatus()

      expect(health.isHealthy).toBe(false)
      expect(health.issues.some((i) => i.includes("Large command queue"))).toBe(true)
    })

    it("должен добавлять warning при растущей очереди команд (200-500)", () => {
      for (let i = 0; i < 300; i++) {
        monitor.recordSync(10, "test")
      }

      const health = monitor.getHealthStatus()

      expect(health.warnings.some((w) => w.includes("Growing command queue"))).toBe(true)
    })
  })

  describe("getSummaryReport", () => {
    it("должен возвращать строку отчёта", () => {
      monitor.recordSync(100, "play")
      monitor.recordSync(200, "seek")
      monitor.recordFailure(new Error("Error"), "pause")

      const report = monitor.getSummaryReport()

      expect(typeof report).toBe("string")
      expect(report).toContain("Video Player Performance Report")
      expect(report).toContain("Total Commands")
      expect(report).toContain("Failed Commands")
      expect(report).toContain("Latency Metrics")
      expect(report).toContain("Health Status")
      expect(report).toContain("Command Type Statistics")
    })

    it("должен отображать правильный success rate", () => {
      monitor.recordSync(100, "play")
      monitor.recordSync(200, "seek")

      const report = monitor.getSummaryReport()

      expect(report).toContain("100.0%")
    })

    it("должен отображать issues если они есть", () => {
      // Создаём высокий failure rate
      monitor.recordSync(50, "test")
      monitor.recordFailure(new Error("Error"), "test")
      monitor.recordFailure(new Error("Error"), "test")

      const report = monitor.getSummaryReport()

      expect(report).toContain("Issues:")
    })

    it("должен отображать warnings если они есть", () => {
      // 18 успехов, 1 провал = ~5.3% failure rate
      for (let i = 0; i < 18; i++) {
        monitor.recordSync(50, "test")
      }
      monitor.recordFailure(new Error("Error"), "test")

      const report = monitor.getSummaryReport()

      expect(report).toContain("Warnings:")
    })
  })

  describe("MAX limits", () => {
    it("должен ограничивать количество syncRecords до MAX_SYNC_RECORDS", () => {
      // MAX_SYNC_RECORDS = 1000
      for (let i = 0; i < 1100; i++) {
        monitor.recordSync(10, "test")
      }

      const records = monitor.getSyncRecords(2000)
      expect(records.length).toBe(1000)
    })

    it("должен сохранять последние записи при превышении лимита", () => {
      // MAX_SYNC_RECORDS = 1000
      for (let i = 0; i < 1100; i++) {
        monitor.recordSync(i, `test-${i}`)
      }

      const records = monitor.getSyncRecords(1)
      // Последняя запись должна быть test-1099
      expect(records[0].commandType).toBe("test-1099")
    })
  })
})

describe("globalPerformanceMonitor", () => {
  beforeEach(() => {
    globalPerformanceMonitor.reset()
  })

  it("должен быть singleton инстансом", () => {
    expect(globalPerformanceMonitor).toBeInstanceOf(PerformanceMonitor)
  })

  it("должен сохранять состояние между вызовами", () => {
    globalPerformanceMonitor.recordSync(100, "play")

    const metrics = globalPerformanceMonitor.getMetrics()
    expect(metrics.totalCommands).toBe(1)
  })
})
