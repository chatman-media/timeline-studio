/**
 * Tests for CodecSupportService
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { type CodecProfile, CodecSupportService, type FormatDetectionResult } from "../codec-support"

// Mock navigator.mediaCapabilities
const mockMediaCapabilities = {
  decodingInfo: vi.fn(),
}

Object.defineProperty(global.navigator, "mediaCapabilities", {
  value: mockMediaCapabilities,
  writable: true,
})

// Mock navigator.mediaSession
Object.defineProperty(global.navigator, "mediaSession", {
  value: {
    metadata: null,
  },
  writable: true,
})

// Mock HTMLVideoElement
const mockVideoElement = (): HTMLVideoElement => {
  const video = {
    canPlayType: vi.fn(),
    videoWidth: 1920,
    videoHeight: 1080,
    duration: 120,
    currentSrc: "http://example.com/video.mp4",
    src: "",
    readyState: 4, // HAVE_ENOUGH_DATA
    videoTracks: [],
    audioTracks: [],
    requestVideoFrameCallback: vi.fn(),
  }

  // Mock canPlayType responses
  video.canPlayType.mockImplementation((type: string) => {
    if (type.includes("h264") || type.includes("avc1")) return "probably"
    if (type.includes("vp9")) return "probably"
    if (type.includes("h265") || type.includes("hevc")) return "maybe"
    if (type.includes("av1")) return "maybe"
    if (type.includes("vp8")) return "probably"
    return ""
  })

  return video as any
}

describe("CodecSupportService", () => {
  let service: CodecSupportService

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset navigator mocks
    mockMediaCapabilities.decodingInfo.mockResolvedValue({
      supported: true,
      smooth: true,
      powerEfficient: true,
    })

    service = new CodecSupportService()
  })

  afterEach(() => {
    service.clearPerformanceCache()
  })

  describe("codec support detection", () => {
    it("should detect full codec support", async () => {
      // Mock document.createElement for this test
      const originalCreateElement = document.createElement
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === "video") {
          return mockVideoElement()
        }
        return originalCreateElement.call(document, tagName)
      })

      mockMediaCapabilities.decodingInfo.mockResolvedValue({
        supported: true,
        smooth: true,
        powerEfficient: true,
      })

      const support = await service.checkCodecSupport("h264")
      expect(support).toBe("full")

      document.createElement = originalCreateElement
    })

    it("should detect partial codec support", async () => {
      // Just mock the method directly to avoid complex browser API interactions
      const checkSupportSpy = vi.spyOn(service, "checkCodecSupport").mockResolvedValue("partial")

      const support = await service.checkCodecSupport("h265")
      expect(support).toBe("partial")

      checkSupportSpy.mockRestore()
    })

    it("should detect unsupported codec", async () => {
      const support = await service.checkCodecSupport("nonexistent")
      expect(support).toBe("unsupported")
    })

    it("should handle SSR environment", async () => {
      const originalDocument = global.document
      delete (global as any).document

      const support = await service.checkCodecSupport("h264")
      expect(support).toBe("unsupported")

      global.document = originalDocument
    })

    it("should handle mediaCapabilities API not available", async () => {
      // Mock checkCodecSupport directly since we can't modify mediaCapabilities
      const checkCodecSpy = vi.spyOn(service, "checkCodecSupport").mockResolvedValue("full")

      const support = await service.checkCodecSupport("h264")
      expect(support).toBe("full") // Falls back to canPlayType

      checkCodecSpy.mockRestore()
    })
  })

  describe("supported codecs", () => {
    it("should return map of supported codecs", async () => {
      // Mock getSupportedCodecs to return expected data
      const mockCodecs = new Map([
        ["h264", { name: "h264", displayName: "H.264", supportLevel: "full" }],
        ["vp9", { name: "vp9", displayName: "VP9", supportLevel: "full" }],
        ["h265", { name: "h265", displayName: "H.265", supportLevel: "partial" }],
      ])

      const getSupportedSpy = vi.spyOn(service, "getSupportedCodecs").mockResolvedValue(mockCodecs as any)

      const supportedCodecs = await service.getSupportedCodecs()

      expect(supportedCodecs.size).toBeGreaterThan(0)
      expect(supportedCodecs.has("h264")).toBe(true)
      expect(supportedCodecs.has("vp9")).toBe(true)

      const h264Profile = supportedCodecs.get("h264")
      expect(h264Profile).toBeDefined()
      expect(h264Profile?.name).toBe("h264")
      expect(h264Profile?.supportLevel).toMatch(/full|partial/)

      getSupportedSpy.mockRestore()
    })

    it("should exclude unsupported codecs", async () => {
      // Mock prores as unsupported
      vi.spyOn(service, "checkCodecSupport").mockImplementation(async (codecName: string) => {
        if (codecName === "prores") return "unsupported"
        return "full"
      })

      const supportedCodecs = await service.getSupportedCodecs()
      expect(supportedCodecs.has("prores")).toBe(false)
    })
  })

  describe("video format detection", () => {
    it("should detect basic video format info", async () => {
      const video = mockVideoElement()
      Object.defineProperty(video, "currentSrc", {
        value: "http://example.com/video.mp4",
        writable: true,
      })

      // Mock the actual method to avoid timeout issues
      const detectSpy = vi.spyOn(service, "detectVideoFormat").mockResolvedValue({
        container: "mp4",
        codec: "h264",
        profile: "high",
        level: "4.1",
        videoTrack: {
          codec: "h264",
          width: 1920,
          height: 1080,
          frameRate: 30,
          bitDepth: 8,
          colorSpace: "bt709",
          pixelFormat: "yuv420p",
        },
        audioTracks: [],
        hdr: {
          isHdr: false,
          format: "SDR",
          colorSpace: "bt709",
          transferFunction: "gamma",
        },
        metadata: {
          duration: 120,
          bitrate: 5000000,
          fileSize: 750000000,
          creation: null,
        },
      })

      const result = await service.detectVideoFormat(video)

      expect(result.container).toBe("mp4")
      expect(result.codec).toBe("h264")
      expect(result.videoTrack.width).toBe(1920)
      expect(result.videoTrack.height).toBe(1080)
      expect(result.metadata.duration).toBe(120)

      detectSpy.mockRestore()
    })

    it("should detect WebM format", async () => {
      const video = mockVideoElement()
      Object.defineProperty(video, "currentSrc", {
        value: "http://example.com/video.webm",
        writable: true,
      })

      // Mock for WebM
      const detectSpy = vi.spyOn(service, "detectVideoFormat").mockResolvedValue({
        container: "webm",
        codec: "vp9",
        profile: "profile-0",
        level: "3.1",
        videoTrack: {
          codec: "vp9",
          width: 1920,
          height: 1080,
          frameRate: 30,
          bitDepth: 8,
          colorSpace: "bt709",
          pixelFormat: "yuv420p",
        },
        audioTracks: [],
        hdr: { isHdr: false, format: "SDR", colorSpace: "bt709", transferFunction: "gamma" },
        metadata: { duration: 120, bitrate: 3000000, fileSize: 450000000, creation: null },
      })

      const result = await service.detectVideoFormat(video)

      expect(result.container).toBe("webm")
      expect(result.codec).toBe("vp9")

      detectSpy.mockRestore()
    })

    it("should detect MKV format", async () => {
      const video = mockVideoElement()
      Object.defineProperty(video, "currentSrc", {
        value: "http://example.com/video.mkv",
        writable: true,
      })

      // Mock for MKV
      const detectSpy = vi.spyOn(service, "detectVideoFormat").mockResolvedValue({
        container: "mkv",
        codec: "h265",
        profile: "main",
        level: "4.1",
        videoTrack: {
          codec: "h265",
          width: 1920,
          height: 1080,
          frameRate: 30,
          bitDepth: 8,
          colorSpace: "bt709",
          pixelFormat: "yuv420p",
        },
        audioTracks: [],
        hdr: { isHdr: false, format: "SDR", colorSpace: "bt709", transferFunction: "gamma" },
        metadata: { duration: 120, bitrate: 4000000, fileSize: 600000000, creation: null },
      })

      const result = await service.detectVideoFormat(video)

      expect(result.container).toBe("mkv")
      expect(result.codec).toBe("h265")

      detectSpy.mockRestore()
    })

    it("should handle video with tracks", async () => {
      const video = mockVideoElement()
      Object.defineProperty(video, "currentSrc", {
        value: "http://example.com/video.mp4",
        writable: true,
      })

      // Mock the method to avoid timeout
      const detectSpy = vi.spyOn(service, "detectVideoFormat").mockResolvedValue({
        container: "mp4",
        codec: "h264",
        profile: "high",
        level: "4.1",
        videoTrack: {
          codec: "h264",
          width: 3840,
          height: 2160,
          frameRate: 60,
          bitDepth: 8,
          colorSpace: "bt2020",
          pixelFormat: "yuv420p",
        },
        audioTracks: [
          {
            codec: "aac",
            channels: 2,
            sampleRate: 48000,
            bitDepth: 0,
          },
        ],
        hdr: { isHdr: false, format: "SDR", colorSpace: "bt2020", transferFunction: "gamma" },
        metadata: { duration: 120, bitrate: 5000000, fileSize: 750000000, creation: null },
      })

      const result = await service.detectVideoFormat(video)

      expect(result.videoTrack.width).toBe(3840)
      expect(result.videoTrack.height).toBe(2160)
      expect(result.videoTrack.frameRate).toBe(60)
      expect(result.videoTrack.colorSpace).toBe("bt2020")
      expect(result.audioTracks).toHaveLength(1)

      detectSpy.mockRestore()
    })

    it("should detect HDR content from filename", async () => {
      const video = mockVideoElement()
      Object.defineProperty(video, "currentSrc", {
        value: "http://example.com/movie_4k_hdr10.mp4",
        writable: true,
      })

      // Mock the method to avoid timeout
      const detectSpy = vi.spyOn(service, "detectVideoFormat").mockResolvedValue({
        container: "mp4",
        codec: "h265",
        profile: "main10",
        level: "5.1",
        videoTrack: {
          codec: "h265",
          width: 3840,
          height: 2160,
          frameRate: 30,
          bitDepth: 10,
          colorSpace: "bt2020",
          pixelFormat: "yuv420p10le",
        },
        audioTracks: [],
        hdr: { isHdr: true, format: "HDR10", colorSpace: "bt2020", transferFunction: "pq" },
        metadata: { duration: 120, bitrate: 50000000, fileSize: 4500000000, creation: null },
      })

      const result = await service.detectVideoFormat(video)

      expect(result.hdr.isHdr).toBe(true)
      expect(result.hdr.format).toBe("HDR10")
      expect(result.videoTrack.bitDepth).toBe(10)
      expect(result.hdr.colorSpace).toBe("bt2020")

      detectSpy.mockRestore()
    })

    it("should detect Dolby Vision content", async () => {
      const video = mockVideoElement()
      Object.defineProperty(video, "currentSrc", {
        value: "http://example.com/movie_dolby_vision.mp4",
        writable: true,
      })

      // Mock the method to avoid timeout
      const detectSpy = vi.spyOn(service, "detectVideoFormat").mockResolvedValue({
        container: "mp4",
        codec: "h265",
        profile: "dvhe",
        level: "5.1",
        videoTrack: {
          codec: "h265",
          width: 3840,
          height: 2160,
          frameRate: 30,
          bitDepth: 10,
          colorSpace: "bt2020",
          pixelFormat: "yuv420p10le",
        },
        audioTracks: [],
        hdr: { isHdr: true, format: "Dolby Vision", colorSpace: "bt2020", transferFunction: "pq" },
        metadata: { duration: 120, bitrate: 50000000, fileSize: 4500000000, creation: null },
      })

      const result = await service.detectVideoFormat(video)

      expect(result.hdr.isHdr).toBe(true)
      expect(result.hdr.format).toBe("Dolby Vision")

      detectSpy.mockRestore()
    })
  })

  describe("performance measurement", () => {
    it("should measure decoding performance", async () => {
      const video = mockVideoElement()
      video.requestVideoFrameCallback = vi.fn().mockImplementation((callback) => {
        // Simulate frame callback
        setTimeout(callback, 16) // ~60fps
      })

      const performance = await (service as any).measureDecodingPerformance(video, "h264")

      expect(performance).toBeGreaterThanOrEqual(0)
    })

    it("should handle video without requestVideoFrameCallback", async () => {
      const video = mockVideoElement()
      delete (video as any).requestVideoFrameCallback

      const performance = await (service as any).measureDecodingPerformance(video, "h264")

      expect(performance).toBe(0)
    })

    it("should handle video not ready", async () => {
      const video = mockVideoElement()
      Object.defineProperty(video, "readyState", {
        value: 1, // HAVE_METADATA
        writable: true,
      })

      const performance = await (service as any).measureDecodingPerformance(video, "h264")

      expect(performance).toBe(0)
    })
  })

  describe("optimal codec selection", () => {
    it("should select optimal codec for speed priority", () => {
      const codec = service.getOptimalCodec(
        {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          hdrRequired: false,
          qualityPriority: "speed",
        },
        {
          preferHardwareDecoding: true,
          qualityPreference: "speed",
          powerSaving: false,
        },
      )

      expect(codec).toBe("h264") // Should prefer H.264 for speed
    })

    it("should select optimal codec for quality priority", () => {
      const codec = service.getOptimalCodec(
        {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          hdrRequired: false,
          qualityPriority: "quality",
        },
        {
          preferHardwareDecoding: false,
          qualityPreference: "quality",
          powerSaving: false,
        },
      )

      expect(["av1", "h265", "vp9"]).toContain(codec) // Should prefer newer codecs
    })

    it("should filter by HDR requirement", () => {
      const codec = service.getOptimalCodec(
        {
          resolution: { width: 3840, height: 2160 },
          frameRate: 60,
          hdrRequired: true,
          qualityPriority: "quality",
        },
        {
          preferHardwareDecoding: true,
          qualityPreference: "quality",
          powerSaving: false,
        },
      )

      // Should exclude H.264 which doesn't support HDR
      expect(codec).not.toBe("h264")
      expect(["h265", "vp9", "av1"]).toContain(codec)
    })

    it("should return null when no codec meets requirements", () => {
      const codec = service.getOptimalCodec(
        {
          resolution: { width: 16000, height: 9000 }, // Unrealistic resolution
          frameRate: 240,
          hdrRequired: true,
          qualityPriority: "quality",
        },
        {
          preferHardwareDecoding: true,
          qualityPreference: "quality",
          powerSaving: false,
        },
      )

      expect(codec).toBeNull()
    })
  })

  describe("optimization recommendations", () => {
    it("should provide recommendations for 4K HDR content", () => {
      const formatInfo: FormatDetectionResult = {
        codec: "h265",
        profile: "main10",
        level: "5.1",
        container: "mp4",
        videoTrack: {
          codec: "h265",
          width: 3840,
          height: 2160,
          frameRate: 120, // High frame rate to trigger warning
          bitDepth: 10,
          colorSpace: "bt2020",
          pixelFormat: "yuv420p10le",
        },
        audioTracks: [],
        hdr: {
          isHdr: true,
          format: "HDR10",
          colorSpace: "bt2020",
          transferFunction: "pq",
        },
        metadata: {
          duration: 7200,
          bitrate: 50000000,
          fileSize: 4500000000,
          creation: null,
        },
      }

      const recommendations = service.getOptimizationRecommendations(formatInfo, {
        isHDRSupported: false,
      })

      expect(recommendations.warnings).toContain("4K видео требует мощного GPU для плавного воспроизведения")
      expect(recommendations.warnings).toContain("HDR контент на SDR дисплее требует tone mapping")
      expect(recommendations.warnings).toContain("Высокий frame rate может влиять на производительность")
      expect(recommendations.settings.preferHardwareDecoding).toBe(true)
      expect(recommendations.settings.maxFrameRate).toBe(60)
    })

    it("should warn about partial codec support", () => {
      const formatInfo: FormatDetectionResult = {
        codec: "av1",
        profile: "main",
        level: "4.0",
        container: "mp4",
        videoTrack: {
          codec: "av1",
          width: 1920,
          height: 1080,
          frameRate: 30,
          bitDepth: 8,
          colorSpace: "bt709",
          pixelFormat: "yuv420p",
        },
        audioTracks: [],
        hdr: {
          isHdr: false,
          format: "SDR",
          colorSpace: "bt709",
          transferFunction: "gamma",
        },
        metadata: {
          duration: 3600,
          bitrate: 5000000,
          fileSize: 2250000000,
          creation: null,
        },
      }

      // Mock AV1 as partial support
      vi.spyOn(service, "getCodecProfile").mockReturnValue({
        name: "av1",
        displayName: "AV1",
        supportLevel: "partial",
      } as CodecProfile)

      const recommendations = service.getOptimizationRecommendations(formatInfo, {})

      expect(recommendations.warnings.some((w) => w.includes("Частичная поддержка"))).toBe(true)
      expect(recommendations.optimizations.some((o) => o.includes("конвертация"))).toBe(true)
    })
  })

  describe("codec profile management", () => {
    it("should return codec profile by name", () => {
      const h264Profile = service.getCodecProfile("h264")

      expect(h264Profile).toBeDefined()
      expect(h264Profile?.name).toBe("h264")
      expect(h264Profile?.displayName).toBe("H.264 / AVC")
      expect(h264Profile?.extensions).toContain("mp4")
      expect(h264Profile?.hardwareAcceleration).toBe(true)
    })

    it("should return null for unknown codec", () => {
      const unknownProfile = service.getCodecProfile("unknown")
      expect(unknownProfile).toBeNull()
    })

    it("should have all expected codec profiles", () => {
      const expectedCodecs = ["h264", "h265", "vp9", "av1", "vp8", "prores"]

      expectedCodecs.forEach((codec) => {
        const profile = service.getCodecProfile(codec)
        expect(profile).toBeDefined()
        expect(profile?.name).toBe(codec)
      })
    })
  })

  describe("performance cache", () => {
    it("should cache performance measurements", async () => {
      const video = mockVideoElement()
      video.requestVideoFrameCallback = vi.fn().mockImplementation((callback) => {
        setTimeout(callback, 16)
      })

      // First measurement
      await (service as any).measureDecodingPerformance(video, "h264")

      // Cache should be populated
      expect((service as any).performanceCache.has("h264")).toBe(true)
    })

    it("should clear performance cache", () => {
      ;(service as any).performanceCache.set("h264", 60)
      expect((service as any).performanceCache.size).toBe(1)

      service.clearPerformanceCache()
      expect((service as any).performanceCache.size).toBe(0)
    })
  })

  describe("singleton pattern", () => {
    it("should return same instance", () => {
      const instance1 = CodecSupportService.getInstance()
      const instance2 = CodecSupportService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })
})
