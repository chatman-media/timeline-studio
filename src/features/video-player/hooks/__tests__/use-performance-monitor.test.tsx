/**
 * @vitest-environment jsdom
 * Tests for usePerformanceMonitor hook
 */

import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Мокаем globalPerformanceMonitor
const mockGetMetrics = vi.fn()
const mockGetSyncRecords = vi.fn()
const mockGetCommandTypeStats = vi.fn()
const mockGetHealthStatus = vi.fn()
const mockGetSummaryReport = vi.fn()
const mockReset = vi.fn()

vi.mock("@timeline-studio/domains/video-editing/services/performance-monitor", () => ({
  globalPerformanceMonitor: {
    getMetrics: (...args: any[]) => mockGetMetrics(...args),
    getSyncRecords: (...args: any[]) => mockGetSyncRecords(...args),
    getCommandTypeStats: (...args: any[]) => mockGetCommandTypeStats(...args),
    getHealthStatus: (...args: any[]) => mockGetHealthStatus(...args),
    getSummaryReport: (...args: any[]) => mockGetSummaryReport(...args),
    reset: (...args: any[]) => mockReset(...args),
  },
}))

import { usePerformanceMonitor } from "../use-performance-monitor"

describe("usePerformanceMonitor", () => {
  const mockMetrics = {
    avgSyncTime: 50,
    syncFrequency: 10,
    commandQueueSize: 5,
    failedCommands: 1,
    lastError: null,
    lastSyncTime: 1000,
    p95Latency: 75,
    p99Latency: 100,
    totalCommands: 20,
  }

  const mockSyncRecords = [
    { timestamp: 1000, duration: 50, commandType: "play", success: true },
    { timestamp: 2000, duration: 30, commandType: "seek", success: true },
  ]

  const mockCommandStats = {
    play: { count: 10, avgDuration: 50, failureRate: 0.05 },
    seek: { count: 5, avgDuration: 30, failureRate: 0 },
  }

  const mockHealth = {
    isHealthy: true,
    issues: [],
    warnings: [],
  }

  const mockReport = "=== Video Player Performance Report ==="

  // Устанавливаем моки сразу при загрузке модуля
  mockGetMetrics.mockReturnValue(mockMetrics)
  mockGetSyncRecords.mockReturnValue(mockSyncRecords)
  mockGetCommandTypeStats.mockReturnValue(mockCommandStats)
  mockGetHealthStatus.mockReturnValue(mockHealth)
  mockGetSummaryReport.mockReturnValue(mockReport)

  beforeEach(() => {
    vi.useFakeTimers()

    // Очищаем счетчики вызовов, но сохраняем implementation
    mockGetMetrics.mockClear()
    mockGetSyncRecords.mockClear()
    mockGetCommandTypeStats.mockClear()
    mockGetHealthStatus.mockClear()
    mockGetSummaryReport.mockClear()
    mockReset.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("initial state", () => {
    it("должен инициализироваться с данными из globalPerformanceMonitor", () => {
      const { result } = renderHook(() => usePerformanceMonitor({ autoRefresh: false }))

      expect(result.current.metrics).toEqual(mockMetrics)
      expect(result.current.syncRecords).toEqual(mockSyncRecords)
      expect(result.current.commandTypeStats).toEqual(mockCommandStats)
      expect(result.current.health).toEqual(mockHealth)
      expect(result.current.summaryReport).toBe(mockReport)
    })
  })

  describe("autoRefresh", () => {
    it("должен обновлять метрики при autoRefresh=true", () => {
      const { result } = renderHook(() => usePerformanceMonitor({ autoRefresh: true, refreshInterval: 1000 }))

      // Начальный вызов
      expect(mockGetMetrics).toHaveBeenCalledTimes(1)

      // Ждём интервал
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // После интервала должен быть вызван ещё раз
      expect(mockGetMetrics).toHaveBeenCalledTimes(2)
    })

    it("не должен обновлять метрики при autoRefresh=false", () => {
      renderHook(() => usePerformanceMonitor({ autoRefresh: false }))

      // Начальный вызов
      expect(mockGetMetrics).toHaveBeenCalledTimes(1)

      // Ждём время
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Не должно быть дополнительных вызовов
      expect(mockGetMetrics).toHaveBeenCalledTimes(1)
    })

    it("должен использовать кастомный refreshInterval", () => {
      renderHook(() => usePerformanceMonitor({ autoRefresh: true, refreshInterval: 500 }))

      expect(mockGetMetrics).toHaveBeenCalledTimes(1)

      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(mockGetMetrics).toHaveBeenCalledTimes(2)

      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(mockGetMetrics).toHaveBeenCalledTimes(3)
    })

    it("должен использовать дефолтный refreshInterval 1000ms", () => {
      renderHook(() => usePerformanceMonitor({ autoRefresh: true }))

      expect(mockGetMetrics).toHaveBeenCalledTimes(1)

      act(() => {
        vi.advanceTimersByTime(999)
      })

      expect(mockGetMetrics).toHaveBeenCalledTimes(1)

      act(() => {
        vi.advanceTimersByTime(1)
      })

      expect(mockGetMetrics).toHaveBeenCalledTimes(2)
    })

    it("должен очищать интервал при размонтировании", () => {
      const { unmount } = renderHook(() => usePerformanceMonitor({ autoRefresh: true, refreshInterval: 1000 }))

      expect(mockGetMetrics).toHaveBeenCalledTimes(1)

      unmount()

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Не должно быть дополнительных вызовов после unmount
      expect(mockGetMetrics).toHaveBeenCalledTimes(1)
    })
  })

  describe("refresh", () => {
    it("должен обновлять все метрики при вызове refresh", () => {
      const { result } = renderHook(() => usePerformanceMonitor({ autoRefresh: false }))

      // Сбрасываем счётчики
      vi.clearAllMocks()

      // Обновляем моки с новыми данными
      const newMetrics = { ...mockMetrics, totalCommands: 100 }
      mockGetMetrics.mockReturnValue(newMetrics)

      act(() => {
        result.current.refresh()
      })

      expect(mockGetMetrics).toHaveBeenCalledTimes(1)
      expect(mockGetSyncRecords).toHaveBeenCalledTimes(1)
      expect(mockGetCommandTypeStats).toHaveBeenCalledTimes(1)
      expect(mockGetHealthStatus).toHaveBeenCalledTimes(1)
      expect(mockGetSummaryReport).toHaveBeenCalledTimes(1)

      expect(result.current.metrics).toEqual(newMetrics)
    })
  })

  describe("reset", () => {
    it("должен вызывать reset на globalPerformanceMonitor и обновлять данные", () => {
      const { result } = renderHook(() => usePerformanceMonitor({ autoRefresh: false }))

      vi.clearAllMocks()

      // Устанавливаем моки для reset state
      const resetMetrics = {
        ...mockMetrics,
        totalCommands: 0,
        failedCommands: 0,
      }
      mockGetMetrics.mockReturnValue(resetMetrics)

      act(() => {
        result.current.reset()
      })

      expect(mockReset).toHaveBeenCalledTimes(1)
      // После reset вызывается refresh
      expect(mockGetMetrics).toHaveBeenCalledTimes(1)
      expect(result.current.metrics).toEqual(resetMetrics)
    })
  })

  describe("default options", () => {
    it("должен использовать autoRefresh=true по умолчанию", () => {
      renderHook(() => usePerformanceMonitor())

      expect(mockGetMetrics).toHaveBeenCalledTimes(1)

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(mockGetMetrics).toHaveBeenCalledTimes(2)
    })
  })

  describe("return type", () => {
    it("должен возвращать все необходимые свойства", () => {
      const { result } = renderHook(() => usePerformanceMonitor({ autoRefresh: false }))

      expect(result.current).toHaveProperty("metrics")
      expect(result.current).toHaveProperty("syncRecords")
      expect(result.current).toHaveProperty("commandTypeStats")
      expect(result.current).toHaveProperty("health")
      expect(result.current).toHaveProperty("summaryReport")
      expect(result.current).toHaveProperty("reset")
      expect(result.current).toHaveProperty("refresh")

      expect(typeof result.current.reset).toBe("function")
      expect(typeof result.current.refresh).toBe("function")
    })
  })
})
