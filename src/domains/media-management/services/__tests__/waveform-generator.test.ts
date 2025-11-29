/**
 * WaveformGeneratorService Tests
 *
 * Тесты для WaveformGeneratorService
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaInfo } from "../../types"
import { WaveformGeneratorService } from "../waveform-generator"

// Mock media service
const mockMediaService = {
  getMetadata: vi.fn(),
  generateWaveformPreview: vi.fn(),
}

vi.mock("@/core/container", () => ({
  getMedia: vi.fn(() => mockMediaService),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

describe("WaveformGeneratorService", () => {
  let service: WaveformGeneratorService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new WaveformGeneratorService()
  })

  describe("generateWaveform", () => {
    it("should generate waveform from file path", async () => {
      mockMediaService.generateWaveformPreview.mockResolvedValue("/tmp/waveform.png")

      const result = await service.generateWaveform("/test/audio.mp3")

      expect(result.sourcePath).toBe("/test/audio.mp3")
      expect(result.data).toBeDefined()
      expect(result.data.peaks).toBeDefined()
      expect(result.generationTime).toBeGreaterThanOrEqual(0)
    })

    it("should generate waveform from MediaInfo", async () => {
      const mediaInfo: MediaInfo = {
        path: "/test/audio.mp3",
        name: "audio.mp3",
        type: "Audio",
        duration: 120,
      }

      mockMediaService.generateWaveformPreview.mockResolvedValue("/tmp/waveform.png")

      const result = await service.generateWaveform(mediaInfo)

      expect(result.sourcePath).toBe("/test/audio.mp3")
    })

    it("should use custom width and height", async () => {
      mockMediaService.generateWaveformPreview.mockResolvedValue("/tmp/waveform.png")

      const result = await service.generateWaveform("/test/audio.mp3", {
        width: 2000,
        height: 200,
      })

      expect(result.data.peaks.length).toBeLessThanOrEqual(2000)
    })

    it("should cache generated waveforms", async () => {
      mockMediaService.generateWaveformPreview.mockResolvedValue("/tmp/waveform.png")

      const result1 = await service.generateWaveform("/test/audio.mp3")
      const result2 = await service.generateWaveform("/test/audio.mp3")

      expect(result2.generationTime).toBe(0) // Loaded from cache
      expect(result1.data).toEqual(result2.data)
    })

    it("should generate different cache keys for different options", async () => {
      mockMediaService.generateWaveformPreview.mockResolvedValue("/tmp/waveform.png")

      const result1 = await service.generateWaveform("/test/audio.mp3", { width: 1000 })
      const result2 = await service.generateWaveform("/test/audio.mp3", { width: 2000 })

      expect(result2.generationTime).toBeGreaterThan(0) // Not from cache
    })

    it("should generate PNG format", async () => {
      mockMediaService.generateWaveformPreview.mockResolvedValue("/tmp/waveform.png")

      const result = await service.generateWaveform("/test/audio.mp3", {
        format: "png",
      })

      expect(result.data.png).toBeDefined()
    })

    it("should handle errors gracefully", async () => {
      mockMediaService.generateWaveformPreview.mockRejectedValue(new Error("File not found"))

      const result = await service.generateWaveform("/test/missing.mp3")

      // Should return fallback data instead of throwing
      expect(result.data.peaks).toBeDefined()
      expect(result.data.peaks.every((p) => p === 0)).toBe(true)
    })
  })

  describe("batchGenerate", () => {
    it("should generate waveforms for multiple files", async () => {
      const files = ["/test/audio1.mp3", "/test/audio2.mp3"]

      mockMediaService.generateWaveformPreview.mockResolvedValue("/tmp/waveform.png")

      const results = await service.batchGenerate(files)

      expect(results).toHaveLength(2)
      expect(results[0].sourcePath).toBe("/test/audio1.mp3")
      expect(results[1].sourcePath).toBe("/test/audio2.mp3")
    })

    it("should handle errors in batch processing", async () => {
      const files = ["/test/audio1.mp3", "/test/missing.mp3"]

      mockMediaService.generateWaveformPreview
        .mockResolvedValueOnce("/tmp/waveform.png")
        .mockRejectedValueOnce(new Error("File not found"))

      const results = await service.batchGenerate(files)

      expect(results).toHaveLength(1)
      expect(results[0].sourcePath).toBe("/test/audio1.mp3")
    })
  })

  describe("clearCache", () => {
    it("should clear waveform cache", async () => {
      mockMediaService.generateWaveformPreview.mockResolvedValue("/tmp/waveform.png")

      // Generate and cache
      await service.generateWaveform("/test/audio.mp3")

      // Clear cache
      service.clearCache()

      // Should regenerate
      const result = await service.generateWaveform("/test/audio.mp3")
      expect(result.generationTime).toBeGreaterThan(0)
    })
  })

  describe("removeFromCache", () => {
    it("should remove specific file from cache", async () => {
      mockMediaService.generateWaveformPreview.mockResolvedValue("/tmp/waveform.png")

      await service.generateWaveform("/test/audio1.mp3")
      await service.generateWaveform("/test/audio2.mp3")

      service.removeFromCache("/test/audio1.mp3")

      const result1 = await service.generateWaveform("/test/audio1.mp3")
      const result2 = await service.generateWaveform("/test/audio2.mp3")

      expect(result1.generationTime).toBeGreaterThan(0) // Regenerated
      expect(result2.generationTime).toBe(0) // From cache
    })
  })
})
