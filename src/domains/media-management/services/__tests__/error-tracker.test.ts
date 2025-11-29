/**
 * Error Tracker Service Tests
 *
 * Comprehensive тесты для ErrorTrackerService
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ErrorType } from "../error-tracker"
import { ErrorTrackerService, getErrorTracker } from "../error-tracker"

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

describe("ErrorTrackerService", () => {
  let service: ErrorTrackerService

  beforeEach(() => {
    service = new ErrorTrackerService()
  })

  describe("trackError", () => {
    it("should track error with all details", () => {
      const error = service.trackError("import_failed", "Failed to import file", {
        filePath: "/test/file.mp4",
        error: new Error("Test error"),
        metadata: { attempt: 1 },
      })

      expect(error.id).toBeDefined()
      expect(error.type).toBe("import_failed")
      expect(error.message).toBe("Failed to import file")
      expect(error.filePath).toBe("/test/file.mp4")
      expect(error.stack).toBeDefined()
      expect(error.metadata).toEqual({ attempt: 1 })
    })

    it("should generate unique error IDs", () => {
      const error1 = service.trackError("import_failed", "Error 1")
      const error2 = service.trackError("import_failed", "Error 2")

      expect(error1.id).not.toBe(error2.id)
    })

    it("should update operation stats on error", () => {
      service.trackError("import_failed", "Test error")

      const stats = service.getOperationStats("import_failed")
      expect((stats as any).failureCount).toBe(1)
    })

    it("should limit error history to maxErrors", () => {
      // Track more than maxErrors (1000)
      for (let i = 0; i < 1100; i++) {
        service.trackError("import_failed", `Error ${i}`)
      }

      const stats = service.getStats()
      expect(stats.total).toBeLessThanOrEqual(1000)
    })
  })

  describe("trackSuccess", () => {
    it("should track successful operations", () => {
      service.trackSuccess("import_failed")

      const stats = service.getOperationStats("import_failed")
      expect((stats as any).successCount).toBe(1)
    })

    it("should update reliability score", () => {
      service.trackSuccess("import_failed")
      service.trackSuccess("import_failed")
      service.trackError("import_failed", "Failed")

      const score = service.getReliabilityScore("import_failed")
      expect(score).toBeGreaterThan(50) // 2 success, 1 failure = ~67%
    })
  })

  describe("attemptRecovery", () => {
    it("should attempt retry recovery for retryable errors", async () => {
      const error = service.trackError("network_error", "Network timeout")
      error.metadata = {
        attemptCount: 0,
        retryCallback: vi.fn().mockResolvedValue(true),
      }

      const recovered = await service.attemptRecovery(error)

      expect(recovered).toBe(true)
      expect(error.recovered).toBe(true)
      expect(error.recoveryStrategy).toBe("retry")
    })

    it("should skip file recovery for unsupported formats", async () => {
      const error = service.trackError("unsupported_format", "Unknown format")

      const recovered = await service.attemptRecovery(error)

      expect(recovered).toBe(true)
      expect(error.recoveryStrategy).toBe("skip_file")
    })

    it("should attempt alternative method for metadata extraction", async () => {
      const error = service.trackError("metadata_extraction_failed", "FFmpeg failed")

      const recovered = await service.attemptRecovery(error)

      // Базовое извлечение всегда успешно
      expect(recovered).toBe(true)
      expect(error.recoveryStrategy).toBe("alternative_method")
    })

    it("should return false if no recovery strategies available", async () => {
      const error = service.trackError("disk_space_error", "No space")

      const recovered = await service.attemptRecovery(error)

      expect(recovered).toBe(false)
    })

    it("should retry with exponential backoff", async () => {
      const retryCallback = vi.fn().mockResolvedValue(true)
      const error = service.trackError("network_error", "Timeout")
      error.metadata = {
        attemptCount: 0,
        retryCallback,
      }

      const start = Date.now()
      await service.attemptRecovery(error)
      const duration = Date.now() - start

      // Should have delay >= 1000ms
      expect(duration).toBeGreaterThanOrEqual(900)
      expect(retryCallback).toHaveBeenCalled()
    })

    it("should respect max retry attempts", async () => {
      const retryCallback = vi.fn().mockRejectedValue(new Error("Still failing"))
      const error = service.trackError("network_error", "Timeout")
      error.metadata = {
        attemptCount: 0,
        retryCallback,
      }

      const recovered = await service.attemptRecovery(error)

      expect(recovered).toBe(false)
      expect(retryCallback).toHaveBeenCalledTimes(3) // maxAttempts = 3
    })
  })

  describe("getStats", () => {
    it("should return comprehensive statistics", () => {
      service.trackError("import_failed", "Error 1")
      service.trackError("import_failed", "Error 2")
      service.trackError("network_error", "Error 3")

      const stats = service.getStats()

      expect(stats.total).toBe(3)
      expect(stats.byType.import_failed).toBe(2)
      expect(stats.byType.network_error).toBe(1)
      expect(stats.recent).toHaveLength(3)
    })

    it("should calculate recovery rate", async () => {
      const error1 = service.trackError("network_error", "Error 1")
      const error2 = service.trackError("network_error", "Error 2")

      error1.metadata = { retryCallback: vi.fn().mockResolvedValue(true) }
      await service.attemptRecovery(error1)

      const stats = service.getStats()

      expect(stats.recoveryRate).toBe(50) // 1 of 2 recovered
    })

    it("should show most frequent errors", () => {
      for (let i = 0; i < 5; i++) service.trackError("import_failed", `Error ${i}`)
      for (let i = 0; i < 3; i++) service.trackError("network_error", `Error ${i}`)

      const stats = service.getStats()

      expect(stats.mostFrequent[0].type).toBe("import_failed")
      expect(stats.mostFrequent[0].count).toBe(5)
    })
  })

  describe("getErrorsByType", () => {
    it("should return errors of specific type", () => {
      service.trackError("import_failed", "Error 1")
      service.trackError("network_error", "Error 2")
      service.trackError("import_failed", "Error 3")

      const importErrors = service.getErrorsByType("import_failed")

      expect(importErrors).toHaveLength(2)
      expect(importErrors.every((e) => e.type === "import_failed")).toBe(true)
    })
  })

  describe("getErrorsForFile", () => {
    it("should return errors for specific file", () => {
      service.trackError("import_failed", "Error 1", {
        filePath: "/test/file1.mp4",
      })
      service.trackError("import_failed", "Error 2", {
        filePath: "/test/file2.mp4",
      })
      service.trackError("import_failed", "Error 3", {
        filePath: "/test/file1.mp4",
      })

      const fileErrors = service.getErrorsForFile("/test/file1.mp4")

      expect(fileErrors).toHaveLength(2)
    })
  })

  describe("clearOldErrors", () => {
    it("should remove errors older than specified date", () => {
      service.trackError("import_failed", "Old error")

      const threshold = new Date(Date.now() + 1000)
      service.clearOldErrors(threshold)

      expect(service.getStats().total).toBe(0)
    })

    it("should keep recent errors", () => {
      service.trackError("import_failed", "Recent error")

      const threshold = new Date(Date.now() - 10000)
      service.clearOldErrors(threshold)

      expect(service.getStats().total).toBe(1)
    })
  })

  describe("clearAll", () => {
    it("should remove all errors", () => {
      service.trackError("import_failed", "Error 1")
      service.trackError("network_error", "Error 2")

      service.clearAll()

      expect(service.getStats().total).toBe(0)
    })
  })

  describe("exportErrors", () => {
    it("should export errors as JSON", () => {
      service.trackError("import_failed", "Error 1")

      const exported = service.exportErrors()
      const data = JSON.parse(exported)

      expect(data.errors).toHaveLength(1)
      expect(data.stats).toBeDefined()
      expect(data.exportedAt).toBeDefined()
    })
  })

  describe("getReliabilityScore", () => {
    it("should return 100 for operations with no failures", () => {
      service.trackSuccess("import_failed")
      service.trackSuccess("import_failed")

      expect(service.getReliabilityScore("import_failed")).toBe(100)
    })

    it("should return 0 for operations with only failures", () => {
      service.trackError("import_failed", "Error")
      service.trackError("import_failed", "Error")

      expect(service.getReliabilityScore("import_failed")).toBe(0)
    })

    it("should calculate score based on success/failure ratio", () => {
      service.trackSuccess("import_failed")
      service.trackSuccess("import_failed")
      service.trackSuccess("import_failed")
      service.trackError("import_failed", "Error")

      expect(service.getReliabilityScore("import_failed")).toBe(75)
    })
  })

  describe("getFailureRate", () => {
    it("should calculate failure rate", () => {
      service.trackSuccess("import_failed")
      service.trackError("import_failed", "Error")

      expect(service.getFailureRate("import_failed")).toBe(50)
    })

    it("should support time window filtering", () => {
      service.trackError("import_failed", "Recent")

      const rate = service.getFailureRate("import_failed", 10000)

      expect(rate).toBeGreaterThan(0)
    })
  })

  describe("getRecommendations", () => {
    it("should recommend freeing disk space", () => {
      service.trackError("disk_space_error", "No space")

      const recommendations = service.getRecommendations()

      expect(recommendations.some((r) => r.includes("место на диске"))).toBe(true)
    })

    it("should recommend checking permissions", () => {
      for (let i = 0; i < 6; i++) {
        service.trackError("permission_denied", "Access denied")
      }

      const recommendations = service.getRecommendations()

      expect(recommendations.some((r) => r.includes("права доступа"))).toBe(true)
    })

    it("should recommend checking network", () => {
      for (let i = 0; i < 4; i++) {
        service.trackError("network_error", "Network issue")
      }

      const recommendations = service.getRecommendations()

      expect(recommendations.some((r) => r.includes("сетевое подключение"))).toBe(true)
    })
  })

  describe("singleton pattern", () => {
    it("should return same instance", () => {
      const instance1 = getErrorTracker()
      const instance2 = getErrorTracker()

      expect(instance1).toBe(instance2)
    })
  })

  describe("operation stats", () => {
    it("should track all error types", () => {
      const stats = service.getOperationStats()

      expect(stats).toBeInstanceOf(Map)
      expect(stats.size).toBeGreaterThan(0)
    })

    it("should return stats for specific type", () => {
      service.trackSuccess("import_failed")

      const stats = service.getOperationStats("import_failed")

      expect(stats).toHaveProperty("successCount")
      expect(stats).toHaveProperty("failureCount")
    })

    it("should return empty stats for unknown type", () => {
      const stats = service.getOperationStats("unknown" as ErrorType)

      expect((stats as any).successCount).toBe(0)
    })
  })
})
