import { describe, expect, it } from "vitest"
import { NodeVideoService } from "../video"

describe("NodeVideoService", () => {
  const service = new NodeVideoService()

  // ============================================================================
  // Cache Operations
  // ============================================================================

  describe("Cache Operations", () => {
    it("returns cache stats", async () => {
      const stats = await service.getCacheStats()
      expect(stats).toHaveProperty("totalSize")
      expect(stats).toHaveProperty("fileCount")
      expect(stats).toHaveProperty("hitRate")
      expect(stats).toHaveProperty("missRate")
    })

    it("returns cache size", async () => {
      const size = await service.getCacheSize()
      expect(typeof size).toBe("number")
    })

    it("returns cache memory usage", async () => {
      const usage = await service.getCacheMemoryUsage()
      expect(usage).toHaveProperty("used")
      expect(usage).toHaveProperty("available")
      expect(usage).toHaveProperty("percentage")
    })

    it("returns null for getCachedMetadata", async () => {
      const result = await service.getCachedMetadata("/video.mp4")
      expect(result).toBeNull()
    })
  })

  // ============================================================================
  // Hardware Acceleration
  // ============================================================================

  describe("Hardware Acceleration", () => {
    it("returns GPU encoder availability", async () => {
      const result = await service.checkGpuEncoderAvailability()
      expect(result).toBeDefined()
    })

    it("returns GPU capabilities", async () => {
      const caps = await service.getGpuCapabilities()
      expect(caps).toHaveProperty("available")
      expect(caps).toHaveProperty("encoders")
      expect(caps).toHaveProperty("decoders")
      expect(caps.available).toBe(false)
    })

    it("does not throw for setHardwareAcceleration", async () => {
      await expect(service.setHardwareAcceleration(true)).resolves.not.toThrow()
    })

    it("returns false for hardware acceleration support", async () => {
      const supported = await service.checkHardwareAccelerationSupport()
      expect(supported).toBe(false)
    })
  })

  // ============================================================================
  // Render Jobs
  // ============================================================================

  describe("Render Jobs", () => {
    it("returns active jobs", async () => {
      const jobs = await service.getActiveJobs()
      expect(Array.isArray(jobs)).toBe(true)
    })

    it("throws error for getRenderJob", async () => {
      await expect(service.getRenderJob("job-123")).rejects.toThrow()
    })

    it("returns render progress", async () => {
      const progress = await service.getRenderProgress("job-123")
      expect(progress).toHaveProperty("jobId")
      expect(progress).toHaveProperty("progress")
    })

    it("returns false for cancelRender", async () => {
      const result = await service.cancelRender("job-123")
      expect(result).toBe(false)
    })
  })

  // ============================================================================
  // Video Compilation
  // ============================================================================

  describe("Video Compilation", () => {
    it("returns job ID for renderProject", async () => {
      const jobId = await service.renderProject({}, "/output.mp4")
      expect(typeof jobId).toBe("string")
      expect(jobId).toContain("job-")
    })

    it("returns empty array for generatePreview", async () => {
      const preview = await service.generatePreview({}, 5.0)
      expect(Array.isArray(preview)).toBe(true)
    })

    it("returns prerender cache info", async () => {
      const info = await service.getPrerenderCacheInfo()
      expect(info).toHaveProperty("totalSegments")
      expect(info).toHaveProperty("totalSize")
    })
  })

  // ============================================================================
  // Compiler Settings
  // ============================================================================

  describe("Compiler Settings", () => {
    it("returns compiler settings", async () => {
      const settings = await service.getCompilerSettings()
      expect(settings).toHaveProperty("outputFormat")
      expect(settings).toHaveProperty("videoCodec")
      expect(settings).toHaveProperty("audioCodec")
    })

    it("does not throw for updateCompilerSettings", async () => {
      await expect(service.updateCompilerSettings({} as any)).resolves.not.toThrow()
    })
  })

  // ============================================================================
  // Effects
  // ============================================================================

  describe("Effects", () => {
    it("does not throw for createEffect", async () => {
      await expect(service.createEffect({})).resolves.not.toThrow()
    })

    it("does not throw for createFilter", async () => {
      await expect(service.createFilter({})).resolves.not.toThrow()
    })

    it("returns path for saveUserEffect", async () => {
      const path = await service.saveUserEffect("effect.json", '{"type":"blur"}')
      expect(typeof path).toBe("string")
      expect(path).toContain("effect.json")
    })

    it("returns JSON for loadUserEffect", async () => {
      const content = await service.loadUserEffect("/effects/effect.json")
      expect(typeof content).toBe("string")
    })

    it("returns empty array for getUserEffectsList", async () => {
      const list = await service.getUserEffectsList()
      expect(Array.isArray(list)).toBe(true)
    })

    it("returns path for saveEffectsCollection", async () => {
      const path = await service.saveEffectsCollection("collection.json", '{"effects":[]}')
      expect(typeof path).toBe("string")
    })

    it("returns JSON for loadEffectsCollection", async () => {
      const content = await service.loadEffectsCollection("/collections/collection.json")
      expect(typeof content).toBe("string")
    })
  })

  // ============================================================================
  // Effects on Clips
  // ============================================================================

  describe("Effects on Clips", () => {
    const schema = {}

    it("returns schema for addEffectToClip", async () => {
      const result = await service.addEffectToClip("clip-1", "effect-1", schema)
      expect(result).toBe(schema)
    })

    it("returns schema for addFilterToClip", async () => {
      const result = await service.addFilterToClip("clip-1", "filter-1", schema)
      expect(result).toBe(schema)
    })

    it("returns schema for removeEffectFromClip", async () => {
      const result = await service.removeEffectFromClip("clip-1", "effect-1", schema)
      expect(result).toBe(schema)
    })

    it("returns schema for removeFilterFromClip", async () => {
      const result = await service.removeFilterFromClip("clip-1", "filter-1", schema)
      expect(result).toBe(schema)
    })
  })

  // ============================================================================
  // System Info
  // ============================================================================

  describe("System Info", () => {
    it("returns system info", async () => {
      const info = await service.getSystemInfo()
      expect(info).toHaveProperty("os")
      expect(info).toHaveProperty("cpuCores")
      expect(info).toHaveProperty("totalMemory")
    })

    it("returns FFmpeg capabilities", async () => {
      const caps = await service.checkFfmpegCapabilities()
      expect(caps).toHaveProperty("version")
      expect(caps).toHaveProperty("codecs")
      expect(caps).toHaveProperty("formats")
    })
  })

  // ============================================================================
  // File Operations
  // ============================================================================

  describe("File Operations", () => {
    it("returns string for loadFile", async () => {
      const content = await service.loadFile("/test.txt")
      expect(typeof content).toBe("string")
    })

    it("throws error for saveFile with read-only path", async () => {
      await expect(service.saveFile({ path: "/test.txt", content: "test" })).rejects.toThrow()
    })
  })

  // ============================================================================
  // Frame Extraction
  // ============================================================================

  describe("Frame Extraction", () => {
    it("throws error for extractTimelineFrames with invalid file", async () => {
      await expect(service.extractTimelineFrames({ videoPath: "/video.mp4", timestamps: [1.0] } as any)).rejects.toThrow()
    })

    it("throws error for extractRecognitionFrames with invalid file", async () => {
      await expect(service.extractRecognitionFrames("/video.mp4", "object", 1.0)).rejects.toThrow()
    })

    it("returns empty array for extractSubtitleFrames with empty subtitles", async () => {
      const frames = await service.extractSubtitleFrames("/video.mp4", [])
      expect(Array.isArray(frames)).toBe(true)
    })
  })
})
