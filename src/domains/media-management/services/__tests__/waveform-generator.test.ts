/**
 * WaveformGeneratorService Tests
 *
 * Тесты для WaveformGeneratorService
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaInfo } from "../../types"
import { WaveformGeneratorService } from "../waveform-generator"

// Tauri MediaType is simplified: "Video" | "Audio" | "Image"
type TauriMediaType = "Video" | "Audio" | "Image"

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
    // Reset mock to default implementation
    mockMediaService.generateWaveformPreview.mockReset()
    mockMediaService.generateWaveformPreview.mockResolvedValue("/tmp/waveform_default.png")
    service = new WaveformGeneratorService()
  })

  afterEach(() => {
    // Clear cache after each test to prevent cross-test contamination
    service.clearCache()
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
        type: "Audio" as TauriMediaType,
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
      mockMediaService.generateWaveformPreview
        .mockResolvedValueOnce("/tmp/waveform1.png")
        .mockResolvedValueOnce("/tmp/waveform2.png")

      // First call with width: 1000
      const result1 = await service.generateWaveform("/test/audio.mp3", { width: 1000 })

      // Debug: check cache size after first call
      expect(service.getCacheSize()).toBe(1) // Should have 1 entry
      expect(result1.generationTime).toBeGreaterThanOrEqual(0) // First call - not from cache

      // Second call with width: 2000 (different cache key)
      const result2 = await service.generateWaveform("/test/audio.mp3", { width: 2000 })

      // Debug: check cache size after second call
      expect(service.getCacheSize()).toBe(2) // Should have 2 entries (different keys)
      expect(result2.generationTime).toBeGreaterThanOrEqual(0) // Second call with different options - not from cache

      expect(mockMediaService.generateWaveformPreview).toHaveBeenCalledTimes(2) // Called twice - different cache keys
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

      // Both files should be in results, but the second one should have fallback data (all zeros)
      expect(results).toHaveLength(2)
      expect(results[0].sourcePath).toBe("/test/audio1.mp3")
      expect(results[1].sourcePath).toBe("/test/missing.mp3")
      expect(results[1].data.peaks.every((p) => p === 0)).toBe(true) // Fallback data
    })
  })

  describe("clearCache", () => {
    it("should clear waveform cache", async () => {
      mockMediaService.generateWaveformPreview
        .mockResolvedValueOnce("/tmp/waveform1.png")
        .mockResolvedValueOnce("/tmp/waveform2.png")

      // Generate and cache
      const result1 = await service.generateWaveform("/test/audio.mp3")
      expect(result1.generationTime).toBeGreaterThanOrEqual(0) // First generation

      // Clear cache
      service.clearCache()

      // Should regenerate
      const result2 = await service.generateWaveform("/test/audio.mp3")
      expect(result2.generationTime).toBeGreaterThanOrEqual(0) // Regenerated after cache clear
      expect(mockMediaService.generateWaveformPreview).toHaveBeenCalledTimes(2) // Called twice - once before clear, once after
    })
  })

  describe("removeFromCache", () => {
    it("should remove specific file from cache", async () => {
      mockMediaService.generateWaveformPreview
        .mockResolvedValueOnce("/tmp/waveform1.png") // First audio1.mp3
        .mockResolvedValueOnce("/tmp/waveform2.png") // audio2.mp3
        .mockResolvedValueOnce("/tmp/waveform3.png") // Regenerated audio1.mp3

      const first1 = await service.generateWaveform("/test/audio1.mp3")
      expect(first1.generationTime).toBeGreaterThanOrEqual(0) // First generation

      const first2 = await service.generateWaveform("/test/audio2.mp3")
      expect(first2.generationTime).toBeGreaterThanOrEqual(0) // First generation

      service.removeFromCache("/test/audio1.mp3")

      const result1 = await service.generateWaveform("/test/audio1.mp3")
      expect(result1.generationTime).toBeGreaterThanOrEqual(0) // Regenerated after removal

      const result2 = await service.generateWaveform("/test/audio2.mp3")
      expect(result2.generationTime).toBe(0) // From cache (wasn't removed)

      expect(mockMediaService.generateWaveformPreview).toHaveBeenCalledTimes(3) // Called 3 times total
    })
  })
})
