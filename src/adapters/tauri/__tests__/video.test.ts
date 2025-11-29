import { beforeEach, describe, expect, it, vi } from "vitest"
import { TauriVideoService } from "../video"

const mockInvoke = vi.fn()

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debugSync: vi.fn(),
    infoSync: vi.fn(),
    errorSync: vi.fn(),
  }),
}))

describe("TauriVideoService", () => {
  let service: TauriVideoService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new TauriVideoService()
  })

  // ============================================================================
  // Cache Operations
  // ============================================================================

  describe("Cache Operations", () => {
    it("caches media metadata", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.cacheMediaMetadata({ filePath: "/video.mp4" })

      expect(mockInvoke).toHaveBeenCalledWith("cache_media_metadata", {
        filePath: "/video.mp4",
      })
    })

    it("clears media metadata cache", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.clearMediaMetadataCache()

      expect(mockInvoke).toHaveBeenCalledWith("clear_media_metadata_cache")
    })

    it("clears preview cache", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.clearPreviewCache()

      expect(mockInvoke).toHaveBeenCalledWith("clear_preview_cache")
    })

    it("clears all cache", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.clearAllCache()

      expect(mockInvoke).toHaveBeenCalledWith("clear_all_cache")
    })

    it("configures cache", async () => {
      const config = { maxSize: 1024, ttl: 3600 } as any
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.configureCache(config)

      expect(mockInvoke).toHaveBeenCalledWith("configure_cache", { config })
    })

    it("gets cache stats", async () => {
      const stats = { size: 512, entries: 10, hits: 100, misses: 5 } as any
      mockInvoke.mockResolvedValueOnce(stats)

      const result = await service.getCacheStats()

      expect(mockInvoke).toHaveBeenCalledWith("get_cache_stats")
      expect(result).toEqual(stats)
    })

    it("gets cache size", async () => {
      mockInvoke.mockResolvedValueOnce(1048576)

      const result = await service.getCacheSize()

      expect(mockInvoke).toHaveBeenCalledWith("get_cache_size")
      expect(result).toBe(1048576)
    })

    it("gets cache memory usage", async () => {
      const usage = { used: 512, total: 1024 } as any
      mockInvoke.mockResolvedValueOnce(usage)

      const result = await service.getCacheMemoryUsage()

      expect(mockInvoke).toHaveBeenCalledWith("get_cache_memory_usage")
      expect(result).toEqual(usage)
    })

    it("gets cached metadata", async () => {
      const metadata = { duration: 120, width: 1920, height: 1080 }
      mockInvoke.mockResolvedValueOnce(metadata)

      const result = await service.getCachedMetadata("/video.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("get_cached_metadata", {
        filePath: "/video.mp4",
      })
      expect(result).toEqual(metadata)
    })
  })

  // ============================================================================
  // Hardware Acceleration
  // ============================================================================

  describe("Hardware Acceleration", () => {
    it("checks GPU encoder availability", async () => {
      const availability = { h264: true, h265: true, vp9: false }
      mockInvoke.mockResolvedValueOnce(availability)

      const result = await service.checkGpuEncoderAvailability()

      expect(mockInvoke).toHaveBeenCalledWith("check_gpu_encoder_availability")
      expect(result).toEqual(availability)
    })

    it("gets GPU capabilities", async () => {
      const capabilities = {
        vendor: "NVIDIA",
        model: "RTX 3080",
        encoders: ["h264", "h265"],
      } as any
      mockInvoke.mockResolvedValueOnce(capabilities)

      const result = await service.getGpuCapabilities()

      expect(mockInvoke).toHaveBeenCalledWith("get_gpu_capabilities_full")
      expect(result).toEqual(capabilities)
    })

    it("sets hardware acceleration", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.setHardwareAcceleration(true)

      expect(mockInvoke).toHaveBeenCalledWith("set_hardware_acceleration", {
        enabled: true,
      })
    })

    it("checks hardware acceleration support", async () => {
      mockInvoke.mockResolvedValueOnce(true)

      const result = await service.checkHardwareAccelerationSupport()

      expect(mockInvoke).toHaveBeenCalledWith("check_hardware_acceleration_support")
      expect(result).toBe(true)
    })
  })

  // ============================================================================
  // Render Jobs
  // ============================================================================

  describe("Render Jobs", () => {
    it("gets active render jobs", async () => {
      const jobs = [{ id: "job-1", status: "rendering" }, { id: "job-2", status: "queued" }] as any
      mockInvoke.mockResolvedValueOnce(jobs)

      const result = await service.getActiveJobs()

      expect(mockInvoke).toHaveBeenCalledWith("get_active_jobs")
      expect(result).toEqual(jobs)
    })

    it("gets specific render job", async () => {
      const job = { id: "job-123", status: "rendering", progress: 50 } as any
      mockInvoke.mockResolvedValueOnce(job)

      const result = await service.getRenderJob("job-123")

      expect(mockInvoke).toHaveBeenCalledWith("get_render_job", { jobId: "job-123" })
      expect(result).toEqual(job)
    })

    it("gets render progress", async () => {
      const progress = { jobId: "job-123", progress: 75, status: "rendering" } as any
      mockInvoke.mockResolvedValueOnce(progress)

      const result = await service.getRenderProgress("job-123")

      expect(mockInvoke).toHaveBeenCalledWith("get_render_progress", {
        jobId: "job-123",
      })
      expect(result).toEqual(progress)
    })

    it("cancels render", async () => {
      mockInvoke.mockResolvedValueOnce(true)

      const result = await service.cancelRender("job-123")

      expect(mockInvoke).toHaveBeenCalledWith("cancel_render", {
        jobId: "job-123",
      })
      expect(result).toBe(true)
    })
  })

  // ============================================================================
  // Video Compilation
  // ============================================================================

  describe("Video Compilation", () => {
    it("renders project", async () => {
      const projectSchema = { timeline: { tracks: [] } }
      mockInvoke.mockResolvedValueOnce("job-123")

      const result = await service.renderProject(projectSchema, "/output/video.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("compile_video", {
        projectSchema,
        outputPath: "/output/video.mp4",
      })
      expect(result).toBe("job-123")
    })

    it("generates preview with default quality", async () => {
      const projectSchema = { timeline: { tracks: [] } }
      const previewData = [1, 2, 3, 4, 5]
      mockInvoke.mockResolvedValueOnce(previewData)

      const result = await service.generatePreview(projectSchema, 5.5)

      expect(mockInvoke).toHaveBeenCalledWith("generate_preview", {
        projectSchema,
        timestamp: 5.5,
        quality: 75,
      })
      expect(result).toEqual(previewData)
    })

    it("generates preview with custom quality", async () => {
      const projectSchema = { timeline: { tracks: [] } }
      mockInvoke.mockResolvedValueOnce([])

      await service.generatePreview(projectSchema, 10.0, 90)

      expect(mockInvoke).toHaveBeenCalledWith("generate_preview", {
        projectSchema,
        timestamp: 10.0,
        quality: 90,
      })
    })

    it("prerenders segment", async () => {
      const request = { segmentId: "seg-1", startTime: 0, endTime: 10 } as any
      const result = { success: true, path: "/prerender/seg-1.mp4" } as any
      mockInvoke.mockResolvedValueOnce(result)

      const prerenderResult = await service.prerenderSegment(request)

      expect(mockInvoke).toHaveBeenCalledWith("prerender_segment", { request })
      expect(prerenderResult).toEqual(result)
    })

    it("gets prerender cache info", async () => {
      const cacheInfo = { segments: 5, totalSize: 1024000 } as any
      mockInvoke.mockResolvedValueOnce(cacheInfo)

      const result = await service.getPrerenderCacheInfo()

      expect(mockInvoke).toHaveBeenCalledWith("get_prerender_cache_info")
      expect(result).toEqual(cacheInfo)
    })

    it("clears prerender cache", async () => {
      mockInvoke.mockResolvedValueOnce(5)

      const result = await service.clearPrerenderCache()

      expect(mockInvoke).toHaveBeenCalledWith("clear_prerender_cache")
      expect(result).toBe(5)
    })
  })

  // ============================================================================
  // Compiler Settings
  // ============================================================================

  describe("Compiler Settings", () => {
    it("gets compiler settings", async () => {
      const settings = { codec: "h264", quality: "high", threads: 4 } as any
      mockInvoke.mockResolvedValueOnce(settings)

      const result = await service.getCompilerSettings()

      expect(mockInvoke).toHaveBeenCalledWith("get_compiler_settings_advanced")
      expect(result).toEqual(settings)
    })

    it("updates compiler settings", async () => {
      const settings = { codec: "h265", quality: "medium", threads: 8 } as any
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.updateCompilerSettings(settings)

      expect(mockInvoke).toHaveBeenCalledWith("update_compiler_settings_advanced", {
        settings,
      })
    })
  })

  // ============================================================================
  // Effects Operations
  // ============================================================================

  describe("Effects Operations", () => {
    it("creates effect", async () => {
      const effect = { type: "blur", intensity: 5 }
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.createEffect(effect)

      expect(mockInvoke).toHaveBeenCalledWith("create_effect", effect)
    })

    it("creates filter", async () => {
      const filter = { type: "grayscale" }
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.createFilter(filter)

      expect(mockInvoke).toHaveBeenCalledWith("create_filter", filter)
    })

    it("deletes user effect", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.deleteUserEffect("effect-123")

      expect(mockInvoke).toHaveBeenCalledWith("delete_user_effect", {
        effectId: "effect-123",
      })
    })

    it("saves user effect", async () => {
      mockInvoke.mockResolvedValueOnce("/effects/my-effect.json")

      const result = await service.saveUserEffect("my-effect.json", '{"type":"blur"}')

      expect(mockInvoke).toHaveBeenCalledWith("save_user_effect", {
        fileName: "my-effect.json",
        effect: '{"type":"blur"}',
      })
      expect(result).toBe("/effects/my-effect.json")
    })

    it("loads user effect", async () => {
      mockInvoke.mockResolvedValueOnce('{"type":"blur"}')

      const result = await service.loadUserEffect("/effects/my-effect.json")

      expect(mockInvoke).toHaveBeenCalledWith("load_user_effect", {
        filePath: "/effects/my-effect.json",
      })
      expect(result).toBe('{"type":"blur"}')
    })

    it("gets user effects list", async () => {
      const effects = ["effect1.json", "effect2.json"]
      mockInvoke.mockResolvedValueOnce(effects)

      const result = await service.getUserEffectsList()

      expect(mockInvoke).toHaveBeenCalledWith("get_user_effects_list")
      expect(result).toEqual(effects)
    })

    it("saves effects collection", async () => {
      mockInvoke.mockResolvedValueOnce("/collections/my-collection.json")

      const result = await service.saveEffectsCollection("my-collection.json", '{"effects":[]}')

      expect(mockInvoke).toHaveBeenCalledWith("save_effects_collection", {
        fileName: "my-collection.json",
        collection: '{"effects":[]}',
      })
      expect(result).toBe("/collections/my-collection.json")
    })

    it("loads effects collection", async () => {
      mockInvoke.mockResolvedValueOnce('{"effects":[]}')

      const result = await service.loadEffectsCollection("/collections/my-collection.json")

      expect(mockInvoke).toHaveBeenCalledWith("load_effects_collection", {
        filePath: "/collections/my-collection.json",
      })
      expect(result).toBe('{"effects":[]}')
    })
  })

  // ============================================================================
  // Effects on Clips
  // ============================================================================

  describe("Effects on Clips", () => {
    it("adds effect to clip", async () => {
      const projectSchema = { timeline: { tracks: [] } }
      const updatedSchema = { timeline: { tracks: [{ clips: [{ effects: ["effect-1"] }] }] } }
      mockInvoke.mockResolvedValueOnce(updatedSchema)

      const result = await service.addEffectToClip("clip-123", "effect-1", projectSchema)

      expect(mockInvoke).toHaveBeenCalledWith("add_effect_to_clip", {
        clipId: "clip-123",
        effectId: "effect-1",
        projectSchema,
      })
      expect(result).toEqual(updatedSchema)
    })

    it("adds filter to clip", async () => {
      const projectSchema = { timeline: { tracks: [] } }
      const updatedSchema = { timeline: { tracks: [{ clips: [{ filters: ["filter-1"] }] }] } }
      mockInvoke.mockResolvedValueOnce(updatedSchema)

      const result = await service.addFilterToClip("clip-123", "filter-1", projectSchema)

      expect(mockInvoke).toHaveBeenCalledWith("add_filter_to_clip", {
        clipId: "clip-123",
        filterId: "filter-1",
        projectSchema,
      })
      expect(result).toEqual(updatedSchema)
    })

    it("removes effect from clip", async () => {
      const projectSchema = { timeline: { tracks: [] } }
      const updatedSchema = { timeline: { tracks: [{ clips: [{ effects: [] }] }] } }
      mockInvoke.mockResolvedValueOnce(updatedSchema)

      const result = await service.removeEffectFromClip("clip-123", "effect-1", projectSchema)

      expect(mockInvoke).toHaveBeenCalledWith("remove_effect_from_clip", {
        clipId: "clip-123",
        effectId: "effect-1",
        projectSchema,
      })
      expect(result).toEqual(updatedSchema)
    })

    it("removes filter from clip", async () => {
      const projectSchema = { timeline: { tracks: [] } }
      const updatedSchema = { timeline: { tracks: [{ clips: [{ filters: [] }] }] } }
      mockInvoke.mockResolvedValueOnce(updatedSchema)

      const result = await service.removeFilterFromClip("clip-123", "filter-1", projectSchema)

      expect(mockInvoke).toHaveBeenCalledWith("remove_filter_from_clip", {
        clipId: "clip-123",
        filterId: "filter-1",
        projectSchema,
      })
      expect(result).toEqual(updatedSchema)
    })
  })

  // ============================================================================
  // System Info
  // ============================================================================

  describe("System Info", () => {
    it("gets system info", async () => {
      const info = {
        os: "darwin",
        cpuCores: 8,
        memoryTotal: 16384,
      } as any
      mockInvoke.mockResolvedValueOnce(info)

      const result = await service.getSystemInfo()

      expect(mockInvoke).toHaveBeenCalledWith("get_system_info")
      expect(result).toEqual(info)
    })

    it("checks FFmpeg capabilities", async () => {
      const capabilities = {
        version: "5.1.2",
        encoders: ["h264", "h265"],
        decoders: ["h264", "h265", "vp9"],
      } as any
      mockInvoke.mockResolvedValueOnce(capabilities)

      const result = await service.checkFfmpegCapabilities()

      expect(mockInvoke).toHaveBeenCalledWith("check_ffmpeg_capabilities")
      expect(result).toEqual(capabilities)
    })
  })

  // ============================================================================
  // File Operations
  // ============================================================================

  describe("File Operations", () => {
    it("loads file", async () => {
      mockInvoke.mockResolvedValueOnce("file content")

      const result = await service.loadFile("/path/to/file.txt")

      expect(mockInvoke).toHaveBeenCalledWith("load_file", {
        path: "/path/to/file.txt",
      })
      expect(result).toBe("file content")
    })

    it("saves file", async () => {
      const params = { path: "/path/to/file.txt", content: "data" }
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.saveFile(params)

      expect(mockInvoke).toHaveBeenCalledWith("save_file", params)
    })
  })

  // ============================================================================
  // Frame Extraction
  // ============================================================================

  describe("Frame Extraction", () => {
    it("extracts timeline frames", async () => {
      const request = { videoPath: "/video.mp4", timestamps: [1.0, 2.0] } as any
      const frames = [
        { timestamp: 1.0, path: "/frame1.jpg" },
        { timestamp: 2.0, path: "/frame2.jpg" },
      ] as any
      mockInvoke.mockResolvedValueOnce(frames)

      const result = await service.extractTimelineFrames(request)

      expect(mockInvoke).toHaveBeenCalledWith("extract_timeline_frames", { request })
      expect(result).toEqual(frames)
    })

    it("extracts recognition frames", async () => {
      const frames = [
        { timestamp: 0, path: "/frame0.jpg" },
        { timestamp: 1, path: "/frame1.jpg" },
      ] as any
      mockInvoke.mockResolvedValueOnce(frames)

      const result = await service.extractRecognitionFrames("/video.mp4", "object-detection", 1.0)

      expect(mockInvoke).toHaveBeenCalledWith("extract_recognition_frames", {
        video_path: "/video.mp4",
        purpose: "object-detection",
        interval: 1.0,
      })
      expect(result).toEqual(frames)
    })

    it("extracts subtitle frames", async () => {
      const subtitles = [
        { startTime: 0, endTime: 2, text: "Hello" },
        { startTime: 2, endTime: 4, text: "World" },
      ]
      const frames = [
        { timestamp: 0, path: "/frame0.jpg" },
        { timestamp: 2, path: "/frame2.jpg" },
      ] as any
      mockInvoke.mockResolvedValueOnce(frames)

      const result = await service.extractSubtitleFrames("/video.mp4", subtitles)

      expect(mockInvoke).toHaveBeenCalledWith("extract_subtitle_frames", {
        video_path: "/video.mp4",
        subtitles,
      })
      expect(result).toEqual(frames)
    })
  })

  // ============================================================================
  // Error Handling
  // ============================================================================

  describe("Error Handling", () => {
    it("propagates invoke errors", async () => {
      const error = new Error("Operation failed")
      mockInvoke.mockRejectedValueOnce(error)

      await expect(service.clearAllCache()).rejects.toThrow("Operation failed")
    })
  })
})
