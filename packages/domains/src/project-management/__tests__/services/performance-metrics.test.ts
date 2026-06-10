/**
 * Performance Metrics Tests
 *
 * Тесты для PerformanceMetricsTracker
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  getPerformanceMetricsTracker,
  PerformanceMetricsTracker,
  resetPerformanceMetricsTracker,
} from "../../services/performance-metrics"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

describe("PerformanceMetricsTracker", () => {
  let tracker: PerformanceMetricsTracker

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    resetPerformanceMetricsTracker()
  })

  afterEach(() => {
    if (tracker) {
      tracker.dispose()
    }
    resetPerformanceMetricsTracker()
    vi.useRealTimers()
  })

  describe("Initialization", () => {
    it("should initialize with empty metrics", () => {
      tracker = new PerformanceMetricsTracker()
      const report = tracker.getReport()

      expect(report.totalCommands).toBe(0)
      expect(report.totalStateUpdates).toBe(0)
      expect(report.currentMemoryUsage).toBe(0)
    })

    it("should start memory tracking on initialization", () => {
      tracker = new PerformanceMetricsTracker()
      expect(tracker).toBeDefined()
      // Memory tracking starts automatically via setInterval
    })
  })

  describe("Command Metrics", () => {
    it("should record command metric", () => {
      tracker.recordCommand({
        commandType: "Play",
        executionTime: 100,
        timestamp: Date.now(),
        success: true,
      })

      const report = tracker.getReport()

      expect(report.totalCommands).toBe(1)
      expect(report.successfulCommands).toBe(1)
      expect(report.failedCommands).toBe(0)
      expect(report.averageCommandTime).toBe(100)
    })

    it("should track successful and failed commands separately", () => {
      tracker.recordCommand({
        commandType: "Play",
        executionTime: 100,
        timestamp: Date.now(),
        success: true,
      })

      tracker.recordCommand({
        commandType: "Pause",
        executionTime: 50,
        timestamp: Date.now(),
        success: false,
        error: "Command failed",
      })

      const report = tracker.getReport()

      expect(report.totalCommands).toBe(2)
      expect(report.successfulCommands).toBe(1)
      expect(report.failedCommands).toBe(1)
    })

    it("should calculate average command time", () => {
      tracker.recordCommand({
        commandType: "Play",
        executionTime: 100,
        timestamp: Date.now(),
        success: true,
      })

      tracker.recordCommand({
        commandType: "Pause",
        executionTime: 200,
        timestamp: Date.now(),
        success: true,
      })

      const report = tracker.getReport()

      expect(report.averageCommandTime).toBe(150)
    })

    it("should identify slowest command", () => {
      tracker.recordCommand({
        commandType: "Fast",
        executionTime: 50,
        timestamp: Date.now(),
        success: true,
      })

      tracker.recordCommand({
        commandType: "Slow",
        executionTime: 500,
        timestamp: Date.now(),
        success: true,
      })

      const report = tracker.getReport()

      expect(report.slowestCommand?.commandType).toBe("Slow")
      expect(report.slowestCommand?.executionTime).toBe(500)
    })

    it("should identify fastest command", () => {
      tracker.recordCommand({
        commandType: "Fast",
        executionTime: 50,
        timestamp: Date.now(),
        success: true,
      })

      tracker.recordCommand({
        commandType: "Slow",
        executionTime: 500,
        timestamp: Date.now(),
        success: true,
      })

      const report = tracker.getReport()

      expect(report.fastestCommand?.commandType).toBe("Fast")
      expect(report.fastestCommand?.executionTime).toBe(50)
    })

    it("should limit metrics size to 1000", () => {
      for (let i = 0; i < 1500; i++) {
        tracker.recordCommand({
          commandType: `Command${i}`,
          executionTime: i,
          timestamp: Date.now(),
          success: true,
        })
      }

      const report = tracker.getReport()

      expect(report.totalCommands).toBe(1000)
    })
  })

  describe("State Update Metrics", () => {
    it("should record state update metric", () => {
      tracker.recordStateUpdate({
        eventType: "StateChanged",
        timestamp: Date.now(),
        processingTime: 50,
      })

      const report = tracker.getReport()

      expect(report.totalStateUpdates).toBe(1)
      expect(report.averageStateUpdateTime).toBe(50)
    })

    it("should calculate average state update time", () => {
      tracker.recordStateUpdate({
        eventType: "StateChanged1",
        timestamp: Date.now(),
        processingTime: 50,
      })

      tracker.recordStateUpdate({
        eventType: "StateChanged2",
        timestamp: Date.now(),
        processingTime: 150,
      })

      const report = tracker.getReport()

      expect(report.averageStateUpdateTime).toBe(100)
    })

    it("should calculate state updates per second", () => {
      const startTime = Date.now()

      tracker.recordStateUpdate({
        eventType: "StateChanged",
        timestamp: startTime,
        processingTime: 50,
      })

      vi.advanceTimersByTime(1000) // 1 second

      const report = tracker.getReport()

      // stateUpdatesPerSecond = (totalStateUpdates / duration) * 1000
      // С fake timers duration будет примерно 1000ms, поэтому ожидаем ~1 update/sec
      expect(report.stateUpdatesPerSecond).toBeGreaterThan(0)
      expect(report.totalStateUpdates).toBe(1)
    })

    it("should limit metrics size to 1000", () => {
      for (let i = 0; i < 1500; i++) {
        tracker.recordStateUpdate({
          eventType: `Update${i}`,
          timestamp: Date.now(),
          processingTime: i,
        })
      }

      const report = tracker.getReport()

      expect(report.totalStateUpdates).toBe(1000)
    })
  })

  describe("Memory Tracking", () => {
    it("should track memory snapshots", () => {
      // Mock performance.memory перед созданием tracker
      ;(global as any).performance = {
        memory: {
          usedJSHeapSize: 1024000,
          totalJSHeapSize: 2048000,
          jsHeapSizeLimit: 4096000,
        },
      }

      // Создаём новый tracker после мока
      tracker = new PerformanceMetricsTracker()

      // Trigger memory snapshot via setInterval
      vi.advanceTimersByTime(10000)

      const report = tracker.getReport()

      expect(report.currentMemoryUsage).toBeGreaterThan(0)
    })

    it("should stop memory tracking", () => {
      // Mock performance.memory
      ;(global as any).performance = {
        memory: {
          usedJSHeapSize: 1024000,
          totalJSHeapSize: 2048000,
          jsHeapSizeLimit: 4096000,
        },
      }

      tracker = new PerformanceMetricsTracker()

      // Сначала дадим interval сработать хотя бы раз
      vi.advanceTimersByTime(10000)

      // Теперь останавливаем
      tracker.stopMemoryTracking()

      // Очищаем snapshots для проверки что больше не записываем
      const reportBefore = tracker.getReport()
      const snapshotsBefore = reportBefore.currentMemoryUsage

      // After stopping, no more snapshots should be taken
      vi.advanceTimersByTime(10000)

      const reportAfter = tracker.getReport()

      // Memory usage остаётся тем же (не обновляется)
      expect(reportAfter.currentMemoryUsage).toBe(snapshotsBefore)
    })
  })

  describe("Report Generation", () => {
    it("should generate complete report", () => {
      tracker.recordCommand({
        commandType: "Play",
        executionTime: 100,
        timestamp: Date.now(),
        success: true,
      })

      tracker.recordStateUpdate({
        eventType: "StateChanged",
        timestamp: Date.now(),
        processingTime: 50,
      })

      const report = tracker.getReport()

      expect(report).toHaveProperty("totalCommands")
      expect(report).toHaveProperty("successfulCommands")
      expect(report).toHaveProperty("failedCommands")
      expect(report).toHaveProperty("averageCommandTime")
      expect(report).toHaveProperty("slowestCommand")
      expect(report).toHaveProperty("fastestCommand")
      expect(report).toHaveProperty("totalStateUpdates")
      expect(report).toHaveProperty("averageStateUpdateTime")
      expect(report).toHaveProperty("stateUpdatesPerSecond")
      expect(report).toHaveProperty("currentMemoryUsage")
      expect(report).toHaveProperty("peakMemoryUsage")
      expect(report).toHaveProperty("averageMemoryUsage")
      expect(report).toHaveProperty("startTime")
      expect(report).toHaveProperty("endTime")
      expect(report).toHaveProperty("duration")
    })

    it("should calculate duration correctly", () => {
      vi.setSystemTime(0)
      const tracker = new PerformanceMetricsTracker()

      vi.advanceTimersByTime(5000) // 5 seconds

      const report = tracker.getReport()

      expect(report.duration).toBe(5000)

      tracker.dispose()
    })
  })

  describe("Clear and Dispose", () => {
    it("should clear all metrics", () => {
      tracker.recordCommand({
        commandType: "Play",
        executionTime: 100,
        timestamp: Date.now(),
        success: true,
      })

      tracker.recordStateUpdate({
        eventType: "StateChanged",
        timestamp: Date.now(),
        processingTime: 50,
      })

      tracker.clear()

      const report = tracker.getReport()

      expect(report.totalCommands).toBe(0)
      expect(report.totalStateUpdates).toBe(0)
    })

    it("should dispose properly", () => {
      tracker.dispose()

      const report = tracker.getReport()

      expect(report.totalCommands).toBe(0)
    })
  })

  describe("Edge Cases", () => {
    it("should handle zero commands", () => {
      const report = tracker.getReport()

      expect(report.averageCommandTime).toBe(0)
      expect(report.slowestCommand).toBeNull()
      expect(report.fastestCommand).toBeNull()
    })

    it("should handle zero state updates", () => {
      const report = tracker.getReport()

      expect(report.averageStateUpdateTime).toBe(0)
      expect(report.stateUpdatesPerSecond).toBe(0)
    })

    it("should handle missing performance.memory", () => {
      ;(global as any).performance = {}

      vi.advanceTimersByTime(10000)

      const report = tracker.getReport()

      expect(report.currentMemoryUsage).toBe(0)
    })
  })

  describe("Singleton", () => {
    it("should return same instance", () => {
      const instance1 = getPerformanceMetricsTracker()
      const instance2 = getPerformanceMetricsTracker()

      expect(instance1).toBe(instance2)
    })

    it("should reset singleton", () => {
      const instance1 = getPerformanceMetricsTracker()

      resetPerformanceMetricsTracker()

      const instance2 = getPerformanceMetricsTracker()

      expect(instance1).not.toBe(instance2)
    })
  })

  describe("Logging", () => {
    it("should log report", () => {
      tracker.recordCommand({
        commandType: "Play",
        executionTime: 100,
        timestamp: Date.now(),
        success: true,
      })

      // Should not throw
      tracker.logReport()
    })
  })
})
