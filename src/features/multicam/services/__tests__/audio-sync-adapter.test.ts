/**
 * Тесты для адаптера синхронизации по аудио
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { syncByAudio } from "../audio-sync-adapter"

const mockCorrelateAudioFiles = vi.hoisted(() => vi.fn())

vi.mock("@/core/container", () => ({
  container: {
    getAI: () => ({
      correlateAudioFiles: mockCorrelateAudioFiles,
    }),
  },
}))

// Мокаем логгер
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe("audio-sync-adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("syncByAudio", () => {
    it("should successfully sync two audio files", async () => {
      const basePath = "/path/to/base.mp4"
      const targetPath = "/path/to/target.mp4"

      mockCorrelateAudioFiles.mockResolvedValue({
        offsetSeconds: 2.5,
        confidence: 0.85,
        correlationPeak: 0.92,
      })

      const result = await syncByAudio(basePath, targetPath)

      expect(mockCorrelateAudioFiles).toHaveBeenCalledWith(basePath, targetPath, 30)
      expect(result).toEqual({
        offset: 2.5,
        confidence: 0.85,
        correlationPeak: 0.92,
      })
    })

    it("should use custom maxOffsetSeconds", async () => {
      const basePath = "/path/to/base.mp4"
      const targetPath = "/path/to/target.mp4"

      mockCorrelateAudioFiles.mockResolvedValue({
        offsetSeconds: 1.0,
        confidence: 0.95,
        correlationPeak: 0.98,
      })

      await syncByAudio(basePath, targetPath, { maxOffsetSeconds: 60 })

      expect(mockCorrelateAudioFiles).toHaveBeenCalledWith(basePath, targetPath, 60)
    })

    it("should call onProgress callback", async () => {
      const basePath = "/path/to/base.mp4"
      const targetPath = "/path/to/target.mp4"
      const onProgress = vi.fn()

      mockCorrelateAudioFiles.mockResolvedValue({
        offsetSeconds: 0.5,
        confidence: 0.75,
        correlationPeak: 0.8,
      })

      await syncByAudio(basePath, targetPath, { onProgress })

      expect(onProgress).toHaveBeenCalledWith(0.1)
      expect(onProgress).toHaveBeenCalledWith(1.0)
    })

    it("should throw error if correlation fails", async () => {
      const basePath = "/path/to/base.mp4"
      const targetPath = "/path/to/target.mp4"

      mockCorrelateAudioFiles.mockRejectedValue(new Error("Correlation failed"))

      await expect(syncByAudio(basePath, targetPath)).rejects.toThrow("Correlation failed")
    })

    it("should respect abort signal before starting", async () => {
      const basePath = "/path/to/base.mp4"
      const targetPath = "/path/to/target.mp4"
      const controller = new AbortController()
      controller.abort()

      await expect(syncByAudio(basePath, targetPath, { signal: controller.signal })).rejects.toThrow(
        "Синхронизация отменена",
      )

      expect(mockCorrelateAudioFiles).not.toHaveBeenCalled()
    })

    it("should respect abort signal after correlation", async () => {
      const basePath = "/path/to/base.mp4"
      const targetPath = "/path/to/target.mp4"
      const controller = new AbortController()

      mockCorrelateAudioFiles.mockImplementation(async () => {
        controller.abort()
        return {
          offsetSeconds: 1.0,
          confidence: 0.9,
          correlationPeak: 0.95,
        }
      })

      await expect(syncByAudio(basePath, targetPath, { signal: controller.signal })).rejects.toThrow(
        "Синхронизация отменена",
      )
    })

    it("should handle abort during correlation error", async () => {
      const basePath = "/path/to/base.mp4"
      const targetPath = "/path/to/target.mp4"
      const controller = new AbortController()

      mockCorrelateAudioFiles.mockImplementation(async () => {
        controller.abort()
        throw new Error("Some correlation error")
      })

      await expect(syncByAudio(basePath, targetPath, { signal: controller.signal })).rejects.toThrow(
        "Синхронизация отменена",
      )
    })

    it("should handle high confidence results", async () => {
      const basePath = "/path/to/base.mp4"
      const targetPath = "/path/to/target.mp4"

      mockCorrelateAudioFiles.mockResolvedValue({
        offsetSeconds: -3.25,
        confidence: 0.99,
        correlationPeak: 0.995,
      })

      const result = await syncByAudio(basePath, targetPath)

      expect(result.confidence).toBe(0.99)
      expect(result.offset).toBe(-3.25)
    })

    it("should handle low confidence results", async () => {
      const basePath = "/path/to/base.mp4"
      const targetPath = "/path/to/target.mp4"

      mockCorrelateAudioFiles.mockResolvedValue({
        offsetSeconds: 0.1,
        confidence: 0.3,
        correlationPeak: 0.35,
      })

      const result = await syncByAudio(basePath, targetPath)

      expect(result.confidence).toBe(0.3)
      expect(result.correlationPeak).toBe(0.35)
    })

    it("should handle negative offsets", async () => {
      const basePath = "/path/to/base.mp4"
      const targetPath = "/path/to/target.mp4"

      mockCorrelateAudioFiles.mockResolvedValue({
        offsetSeconds: -5.75,
        confidence: 0.88,
        correlationPeak: 0.91,
      })

      const result = await syncByAudio(basePath, targetPath)

      expect(result.offset).toBe(-5.75)
    })

    it("should handle zero offset", async () => {
      const basePath = "/path/to/base.mp4"
      const targetPath = "/path/to/target.mp4"

      mockCorrelateAudioFiles.mockResolvedValue({
        offsetSeconds: 0,
        confidence: 1.0,
        correlationPeak: 1.0,
      })

      const result = await syncByAudio(basePath, targetPath)

      expect(result.offset).toBe(0)
      expect(result.confidence).toBe(1.0)
    })
  })
})
