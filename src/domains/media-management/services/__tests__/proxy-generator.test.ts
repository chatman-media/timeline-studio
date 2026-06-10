/**
 * Proxy Generator Service Tests
 *
 * Comprehensive тесты для ProxyGeneratorService
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaInfo } from "../../types"
import type { ProxyGenerationResult } from "../proxy-generator"
import { ProxyGeneratorService } from "../proxy-generator"

// Tauri MediaType is simplified: "Video" | "Audio" | "Image"
type TauriMediaType = "Video" | "Audio" | "Image"

// Mock container
const mockMediaService = {
  generateProxy: vi.fn(),
}

vi.mock("@timeline-studio/core/container", () => ({
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

describe("ProxyGeneratorService", () => {
  let service: ProxyGeneratorService

  const mockMediaInfo: MediaInfo = {
    path: "/test/video.mp4",
    name: "video.mp4",
    type: "Video" as TauriMediaType,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ProxyGeneratorService()
    // Default mock implementation to resolve successfully
    mockMediaService.generateProxy.mockResolvedValue({
      proxyPath: "/tmp/proxy.mp4",
      sourcePath: "/original/video.mp4",
      size: 10_000_000,
      resolution: { width: 1920, height: 1080 },
      generationTime: 5000,
    })
  })

  afterEach(async () => {
    // Clean up any active generations
    await service.cancelAllGenerations()
  })

  describe("generateProxy", () => {
    it("should generate proxy with default options", async () => {
      const mockResult: ProxyGenerationResult = {
        proxyPath: "/tmp/proxy.mp4",
        sourcePath: mockMediaInfo.path,
        size: 10_000_000,
        resolution: { width: 1920, height: 1080 },
        generationTime: 5000,
      }

      mockMediaService.generateProxy.mockResolvedValue(mockResult)

      const result = await service.generateProxy(mockMediaInfo.path)

      expect(mockMediaService.generateProxy).toHaveBeenCalledWith(
        mockMediaInfo.path,
        expect.objectContaining({
          width: 1280,
          height: 720,
          codec: "h264",
          bitrate: "3M",
          preserveAudio: true,
        }),
      )

      expect(result.proxyPath).toBe(mockResult.proxyPath)
      // generationTime is calculated by the service (Date.now() - startTime)
      // It will be >= 0, typically very small in tests
      expect(result.generationTime).toBeGreaterThanOrEqual(0)
    })

    it("should generate proxy with custom resolution", async () => {
      const mockResult: ProxyGenerationResult = {
        proxyPath: "/tmp/proxy-4k.mp4",
        sourcePath: "/test/video.mp4",
        size: 20_000_000,
        resolution: { width: 3840, height: 2160 },
        generationTime: 10000,
      }

      mockMediaService.generateProxy.mockResolvedValue(mockResult)

      const result = await service.generateProxy(mockMediaInfo.path, {
        resolution: "1080p",
        quality: "high",
      })

      expect(mockMediaService.generateProxy).toHaveBeenCalledWith(
        mockMediaInfo.path,
        expect.objectContaining({
          width: 1920,
          height: 1080,
          bitrate: "5M",
        }),
      )

      expect(result.proxyPath).toBe(mockResult.proxyPath)
    })

    it("should generate proxy with custom dimensions", async () => {
      const mockResult: ProxyGenerationResult = {
        proxyPath: "/tmp/proxy-custom.mp4",
        sourcePath: "/test/video.mp4",
        size: 15_000_000,
        resolution: { width: 960, height: 540 },
        generationTime: 7000,
      }

      mockMediaService.generateProxy.mockResolvedValue(mockResult)

      await service.generateProxy(mockMediaInfo.path, {
        resolution: "custom",
        customResolution: { width: 960, height: 540 },
      })

      expect(mockMediaService.generateProxy).toHaveBeenCalledWith(
        mockMediaInfo.path,
        expect.objectContaining({
          width: 960,
          height: 540,
        }),
      )
    })

    it("should handle MediaInfo object input", async () => {
      const mockResult: ProxyGenerationResult = {
        proxyPath: "/tmp/proxy.mp4",
        sourcePath: "/test/video.mp4",
        size: 10_000_000,
        resolution: { width: 1920, height: 1080 },
        generationTime: 5000,
      }

      mockMediaService.generateProxy.mockResolvedValue(mockResult)

      await service.generateProxy(mockMediaInfo)

      expect(mockMediaService.generateProxy).toHaveBeenCalledWith(mockMediaInfo.path, expect.anything())
    })

    it("should call progress callback", async () => {
      const mockResult: ProxyGenerationResult = {
        proxyPath: "/tmp/proxy.mp4",
        sourcePath: "/test/video.mp4",
        size: 10_000_000,
        resolution: { width: 1920, height: 1080 },
        generationTime: 100,
      }

      mockMediaService.generateProxy.mockResolvedValue(mockResult)

      const onProgress = vi.fn()

      await service.generateProxy(mockMediaInfo.path, { onProgress })

      expect(onProgress).toHaveBeenCalled()
      expect(onProgress).toHaveBeenCalledWith(100)
    })

    it("should handle generation errors", async () => {
      mockMediaService.generateProxy.mockRejectedValue(new Error("FFmpeg error"))

      await expect(service.generateProxy(mockMediaInfo.path)).rejects.toThrow()
    })

    it("should support different codecs", async () => {
      const mockResult: ProxyGenerationResult = {
        proxyPath: "/tmp/proxy.mp4",
        sourcePath: "/test/video.mp4",
        size: 10_000_000,
        resolution: { width: 1920, height: 1080 },
        generationTime: 5000,
      }

      mockMediaService.generateProxy.mockResolvedValue(mockResult)

      await service.generateProxy(mockMediaInfo.path, {
        codec: "h265",
      })

      expect(mockMediaService.generateProxy).toHaveBeenCalledWith(
        mockMediaInfo.path,
        expect.objectContaining({
          codec: "h265",
        }),
      )
    })

    it("should support custom FPS", async () => {
      const mockResult: ProxyGenerationResult = {
        proxyPath: "/tmp/proxy.mp4",
        sourcePath: "/test/video.mp4",
        size: 10_000_000,
        resolution: { width: 1920, height: 1080 },
        generationTime: 5000,
      }

      mockMediaService.generateProxy.mockResolvedValue(mockResult)

      await service.generateProxy(mockMediaInfo.path, {
        fps: 30,
      })

      expect(mockMediaService.generateProxy).toHaveBeenCalledWith(
        mockMediaInfo.path,
        expect.objectContaining({
          fps: 30,
        }),
      )
    })

    it("should support audio preservation setting", async () => {
      const mockResult: ProxyGenerationResult = {
        proxyPath: "/tmp/proxy.mp4",
        sourcePath: "/test/video.mp4",
        size: 10_000_000,
        resolution: { width: 1920, height: 1080 },
        generationTime: 5000,
      }

      mockMediaService.generateProxy.mockResolvedValue(mockResult)

      await service.generateProxy(mockMediaInfo.path, {
        preserveAudio: false,
      })

      expect(mockMediaService.generateProxy).toHaveBeenCalledWith(
        mockMediaInfo.path,
        expect.objectContaining({
          preserveAudio: false,
        }),
      )
    })
  })

  describe("batchGenerate", () => {
    it("should generate proxies for multiple files", async () => {
      const files = [
        { path: "/test/video1.mp4", name: "video1.mp4", type: "Video" as TauriMediaType },
        { path: "/test/video2.mp4", name: "video2.mp4", type: "Video" as TauriMediaType },
      ]

      const mockResult: ProxyGenerationResult = {
        proxyPath: "/tmp/proxy.mp4",
        sourcePath: "/test/video.mp4",
        size: 10_000_000,
        resolution: { width: 1920, height: 1080 },
        generationTime: 5000,
      }

      mockMediaService.generateProxy.mockResolvedValue(mockResult)

      const results = await service.batchGenerate(files)

      expect(results).toHaveLength(2)
      expect(mockMediaService.generateProxy).toHaveBeenCalledTimes(2)
    })

    it("should call file progress callback", async () => {
      const files = [{ path: "/test/video1.mp4", name: "video1.mp4", type: "Video" as TauriMediaType }]

      const mockResult: ProxyGenerationResult = {
        proxyPath: "/tmp/proxy.mp4",
        sourcePath: "/test/video.mp4",
        size: 10_000_000,
        resolution: { width: 1920, height: 1080 },
        generationTime: 100,
      }

      mockMediaService.generateProxy.mockResolvedValue(mockResult)

      const onFileProgress = vi.fn()

      await service.batchGenerate(files, { onFileProgress })

      expect(onFileProgress).toHaveBeenCalled()
    })

    it("should call file complete callback", async () => {
      const files = [{ path: "/test/video1.mp4", name: "video1.mp4", type: "Video" as TauriMediaType }]

      const mockResult: ProxyGenerationResult = {
        proxyPath: "/tmp/proxy.mp4",
        sourcePath: "/test/video.mp4",
        size: 10_000_000,
        resolution: { width: 1920, height: 1080 },
        generationTime: 5000,
      }

      mockMediaService.generateProxy.mockResolvedValue(mockResult)

      const onFileComplete = vi.fn()

      await service.batchGenerate(files, { onFileComplete })

      // The callback is called with the actual result from generateProxy,
      // which includes the service-calculated generationTime (which will be ~0 in tests)
      expect(onFileComplete).toHaveBeenCalledWith(
        files[0],
        expect.objectContaining({
          proxyPath: mockResult.proxyPath,
        }),
      )
    })

    it("should call file error callback on failure", async () => {
      const files = [{ path: "/test/video1.mp4", name: "video1.mp4", type: "Video" as TauriMediaType }]

      mockMediaService.generateProxy.mockRejectedValue(new Error("FFmpeg error"))

      const onFileError = vi.fn()

      await service.batchGenerate(files, { onFileError }).catch(() => {})

      expect(onFileError).toHaveBeenCalledWith(files[0], expect.any(Error))
    })

    it("should continue batch on individual file errors", async () => {
      const files = [
        { path: "/test/video1.mp4", name: "video1.mp4", type: "Video" as TauriMediaType },
        { path: "/test/video2.mp4", name: "video2.mp4", type: "Video" as TauriMediaType },
      ]

      const mockResult: ProxyGenerationResult = {
        proxyPath: "/tmp/proxy.mp4",
        sourcePath: "/test/video.mp4",
        size: 10_000_000,
        resolution: { width: 1920, height: 1080 },
        generationTime: 5000,
      }

      mockMediaService.generateProxy
        .mockRejectedValueOnce(new Error("Error on first"))
        .mockResolvedValueOnce(mockResult)

      const results = await service.batchGenerate(files)

      expect(results).toHaveLength(1) // Only successful one
      expect(mockMediaService.generateProxy).toHaveBeenCalledTimes(2)
    })
  })

  describe("cancelGeneration", () => {
    it("should cancel active generation", async () => {
      const promise = service.generateProxy(mockMediaInfo.path)

      await service.cancelGeneration(mockMediaInfo.path)

      expect(service.isGenerating(mockMediaInfo.path)).toBe(false)
    })

    it("should do nothing if no active generation", async () => {
      await service.cancelGeneration("/non-existent.mp4")

      // Should not throw
      expect(service.isGenerating("/non-existent.mp4")).toBe(false)
    })
  })

  describe("cancelAllGenerations", () => {
    it("should cancel all active generations", async () => {
      const file1 = "/test/video1.mp4"
      const file2 = "/test/video2.mp4"

      // Mock generateProxy to return a promise that never resolves
      mockMediaService.generateProxy.mockImplementation(() => new Promise(() => {}))

      // Start generations but don't await - just track them
      service.generateProxy(file1).catch(() => {})
      service.generateProxy(file2).catch(() => {})

      await service.cancelAllGenerations()

      expect(service.getActiveGenerations()).toHaveLength(0)
    })
  })

  describe("isGenerating", () => {
    it("should return true for active generation", async () => {
      mockMediaService.generateProxy.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  proxyPath: "/tmp/proxy.mp4",
                  sourcePath: "/test/video.mp4",
                  size: 10_000_000,
                  resolution: { width: 1920, height: 1080 },
                  generationTime: 5000,
                }),
              100,
            )
          }),
      )

      const promise = service.generateProxy(mockMediaInfo.path).catch(() => {})

      expect(service.isGenerating(mockMediaInfo.path)).toBe(true)

      await promise

      expect(service.isGenerating(mockMediaInfo.path)).toBe(false)
    })

    it("should return false for non-active generation", () => {
      expect(service.isGenerating("/non-existent.mp4")).toBe(false)
    })
  })

  describe("getActiveGenerations", () => {
    it("should return list of active generations", async () => {
      mockMediaService.generateProxy.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  proxyPath: "/tmp/proxy.mp4",
                  sourcePath: "/test/video.mp4",
                  size: 10_000_000,
                  resolution: { width: 1920, height: 1080 },
                  generationTime: 5000,
                }),
              100,
            )
          }),
      )

      service.generateProxy("/test/video1.mp4").catch(() => {})
      service.generateProxy("/test/video2.mp4").catch(() => {})

      const active = service.getActiveGenerations()

      expect(active).toContain("/test/video1.mp4")
      expect(active).toContain("/test/video2.mp4")
    })

    it("should return empty array when no active generations", () => {
      expect(service.getActiveGenerations()).toHaveLength(0)
    })
  })

  describe("resolution presets", () => {
    it.each([
      ["360p", 640, 360],
      ["540p", 960, 540],
      ["720p", 1280, 720],
      ["1080p", 1920, 1080],
    ])("should use correct resolution for %s preset", async (resolution, width, height) => {
      const mockResult: ProxyGenerationResult = {
        proxyPath: "/tmp/proxy.mp4",
        sourcePath: "/test/video.mp4",
        size: 10_000_000,
        resolution: { width: 1920, height: 1080 },
        generationTime: 5000,
      }

      mockMediaService.generateProxy.mockResolvedValue(mockResult)

      await service.generateProxy(mockMediaInfo.path, {
        resolution: resolution as any,
      })

      expect(mockMediaService.generateProxy).toHaveBeenCalledWith(
        mockMediaInfo.path,
        expect.objectContaining({
          width,
          height,
        }),
      )
    })
  })

  describe("quality settings", () => {
    it.each([
      ["low", "1M"],
      ["medium", "3M"],
      ["high", "5M"],
    ])("should use correct bitrate for %s quality", async (quality, bitrate) => {
      const mockResult: ProxyGenerationResult = {
        proxyPath: "/tmp/proxy.mp4",
        sourcePath: "/test/video.mp4",
        size: 10_000_000,
        resolution: { width: 1920, height: 1080 },
        generationTime: 5000,
      }

      mockMediaService.generateProxy.mockResolvedValue(mockResult)

      await service.generateProxy(mockMediaInfo.path, {
        quality: quality as any,
      })

      expect(mockMediaService.generateProxy).toHaveBeenCalledWith(
        mockMediaInfo.path,
        expect.objectContaining({
          bitrate,
        }),
      )
    })
  })
})
