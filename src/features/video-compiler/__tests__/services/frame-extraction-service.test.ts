import { beforeEach, describe, expect, it, vi } from "vitest"
import { Subtitle } from "@/domains/video-editing"
import type { RecognitionFrame, TimelineFrame } from "../../services/frame-extraction-service"
import { ExtractionPurpose, frameExtractionService } from "../../services/frame-extraction-service"

// Мокаем Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Мокаем IndexedDB Cache Service
vi.mock("@/features/media/services/indexeddb-cache-service", () => ({
  indexedDBCacheService: {
    cacheTimelineFrames: vi.fn(),
    getCachedTimelineFrames: vi.fn(),
    cacheRecognitionFrames: vi.fn(),
    getCachedRecognitionFrames: vi.fn(),
    cacheSubtitleFrames: vi.fn(),
    getCachedSubtitleFrames: vi.fn(),
    clearFrameCache: vi.fn(),
    clearRecognitionCache: vi.fn(),
    clearSubtitleCache: vi.fn(),
  },
}))

describe("frameExtractionService", () => {
  let mockInvoke: any
  let mockIndexedDBCacheService: any

  const mockTimelineFrames: TimelineFrame[] = [
    { timestamp: 0, frameData: "base64data1", isKeyframe: true },
    { timestamp: 1, frameData: "base64data2", isKeyframe: false },
    { timestamp: 2, frameData: "base64data3", isKeyframe: true },
  ]

  const mockRecognitionFrames: RecognitionFrame[] = [
    {
      timestamp: 0,
      frameData: new Uint8Array([1, 2, 3, 4]),
      resolution: [1920, 1080],
      sceneChangeScore: 0.8,
      isKeyframe: true,
    },
    {
      timestamp: 1,
      frameData: new Uint8Array([5, 6, 7, 8]),
      resolution: [1920, 1080],
      isKeyframe: false,
    },
  ]

  const mockSubtitles: Subtitle[] = [
    {
      id: "sub1",
      text: "Test subtitle 1",
      start_time: 0,
      end_time: 2,
      position: "bottom",
      style: "default",
      animations: [],
      enabled: true,
    },
    {
      id: "sub2",
      text: "Test subtitle 2",
      start_time: 2,
      end_time: 4,
      position: "bottom",
      style: "default",
      animations: [],
      enabled: true,
    },
  ]

  beforeEach(async () => {
    vi.clearAllMocks()
    const { invoke } = await import("@tauri-apps/api/core")
    mockInvoke = invoke as any

    const { indexedDBCacheService } = await import("@/features/media/services/indexeddb-cache-service")
    mockIndexedDBCacheService = indexedDBCacheService as any
  })

  describe("extractTimelineFrames", () => {
    it("should extract timeline frames", async () => {
      const mockResponse = mockTimelineFrames.map((frame) => ({
        timestamp: frame.timestamp,
        frame_data: frame.frameData,
        is_keyframe: frame.isKeyframe,
      }))

      mockInvoke.mockResolvedValueOnce(mockResponse)

      const result = await frameExtractionService.extractTimelineFrames("/video.mp4", 10, 1.0, 100)

      expect(result).toEqual(mockTimelineFrames)
      expect(mockInvoke).toHaveBeenCalledWith("extract_timeline_frames", {
        request: {
          video_path: "/video.mp4",
          duration: 10,
          interval: 1.0,
          max_frames: 100,
        },
      })
    })

    it("should handle extraction error", async () => {
      const errorMessage = "Failed to extract frames"
      mockInvoke.mockRejectedValueOnce(new Error(errorMessage))

      await expect(frameExtractionService.extractTimelineFrames("/video.mp4", 10)).rejects.toThrow(errorMessage)
    })
  })

  describe("extractRecognitionFrames", () => {
    it("should extract recognition frames", async () => {
      const mockResponse = mockRecognitionFrames.map((frame) => ({
        timestamp: frame.timestamp,
        frame_data: Array.from(frame.frameData),
        resolution: frame.resolution,
        scene_change_score: frame.sceneChangeScore,
        is_keyframe: frame.isKeyframe,
      }))

      mockInvoke.mockResolvedValueOnce(mockResponse)

      const result = await frameExtractionService.extractRecognitionFrames(
        "/video.mp4",
        ExtractionPurpose.ObjectDetection,
        1.0,
      )

      expect(result).toEqual(mockRecognitionFrames)
      expect(mockInvoke).toHaveBeenCalledWith("extract_recognition_frames", {
        video_path: "/video.mp4",
        purpose: ExtractionPurpose.ObjectDetection.toString(),
        interval: 1.0,
      })
    })

    it("should handle different extraction purposes", async () => {
      mockInvoke.mockResolvedValueOnce([])

      await frameExtractionService.extractRecognitionFrames("/video.mp4", ExtractionPurpose.SceneRecognition, 2.0)

      expect(mockInvoke).toHaveBeenCalledWith("extract_recognition_frames", {
        video_path: "/video.mp4",
        purpose: ExtractionPurpose.SceneRecognition.toString(),
        interval: 2.0,
      })
    })
  })

  describe("extractSubtitleFrames", () => {
    it("should extract subtitle frames", async () => {
      const mockResponse = [
        {
          subtitle_id: "sub1",
          subtitle_text: "Test subtitle 1",
          timestamp: 1,
          frame_data: [1, 2, 3, 4],
          start_time: 0,
          end_time: 2,
        },
        {
          subtitle_id: "sub2",
          subtitle_text: "Test subtitle 2",
          timestamp: 3,
          frame_data: [5, 6, 7, 8],
          start_time: 2,
          end_time: 4,
        },
      ]

      mockInvoke.mockResolvedValueOnce(mockResponse)

      const result = await frameExtractionService.extractSubtitleFrames("/video.mp4", mockSubtitles)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        subtitleId: "sub1",
        subtitleText: "Test subtitle 1",
        timestamp: 1,
        frameData: new Uint8Array([1, 2, 3, 4]),
        startTime: 0,
        endTime: 2,
      })

      expect(mockInvoke).toHaveBeenCalledWith("extract_subtitle_frames", {
        video_path: "/video.mp4",
        subtitles: mockSubtitles.map((subtitle) => ({
          id: subtitle.id,
          text: subtitle.text,
          start_time: subtitle.start_time,
          end_time: subtitle.end_time,
          position: subtitle.position,
          style: subtitle.style,
          animations: subtitle.animations,
          enabled: subtitle.enabled,
        })),
      })
    })
  })

  describe("clearFrameCache", () => {
    it("should clear frame cache", async () => {
      mockIndexedDBCacheService.clearFrameCache.mockResolvedValueOnce(undefined)
      mockIndexedDBCacheService.clearRecognitionCache.mockResolvedValueOnce(undefined)
      mockIndexedDBCacheService.clearSubtitleCache.mockResolvedValueOnce(undefined)

      await frameExtractionService.clearFrameCache()

      expect(mockIndexedDBCacheService.clearFrameCache).toHaveBeenCalled()
      expect(mockIndexedDBCacheService.clearRecognitionCache).toHaveBeenCalled()
      expect(mockIndexedDBCacheService.clearSubtitleCache).toHaveBeenCalled()
    })

    it("should handle clear cache error", async () => {
      const errorMessage = "Failed to clear cache"
      mockIndexedDBCacheService.clearFrameCache.mockRejectedValueOnce(new Error(errorMessage))

      await expect(frameExtractionService.clearFrameCache()).rejects.toThrow(errorMessage)
    })
  })

  describe("createPreviewElement", () => {
    it("should create preview image element", () => {
      const frameData = "base64imagedata"
      const timestamp = 5.5

      const img = frameExtractionService.createPreviewElement(frameData, timestamp)

      expect(img).toBeInstanceOf(HTMLImageElement)
      expect(img.src).toBe(`data:image/jpeg;base64,${frameData}`)
      expect(img.alt).toBe("Frame at 5.50s")
      expect(img.dataset.timestamp).toBe("5.5")
    })
  })

  describe("drawFrameToCanvas", () => {
    it("should draw frame to canvas", async () => {
      const frameData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) // PNG header
      const canvas = document.createElement("canvas")
      const mockContext = {
        drawImage: vi.fn(),
      }

      vi.spyOn(canvas, "getContext").mockReturnValue(mockContext as any)

      // Mock Image loading
      global.URL.createObjectURL = vi.fn().mockReturnValue("blob:url")
      global.URL.revokeObjectURL = vi.fn()

      const mockImage = {
        onload: null as any,
        onerror: null as any,
        width: 100,
        height: 100,
        set src(_value: string) {
          // Simulate successful image load
          setTimeout(() => this.onload?.(), 0)
        },
      }

      vi.spyOn(global, "Image").mockImplementation(() => mockImage as any)

      const promise = frameExtractionService.drawFrameToCanvas(frameData, canvas)

      // Wait for image to "load"
      await new Promise((resolve) => setTimeout(resolve, 10))

      await expect(promise).resolves.toBeUndefined()
      expect(canvas.width).toBe(100)
      expect(canvas.height).toBe(100)
      expect(mockContext.drawImage).toHaveBeenCalled()
    })

    it("should handle canvas context error", async () => {
      const frameData = new Uint8Array([1, 2, 3, 4])
      const canvas = document.createElement("canvas")

      vi.spyOn(canvas, "getContext").mockReturnValue(null)

      await expect(frameExtractionService.drawFrameToCanvas(frameData, canvas)).rejects.toThrow(
        "Failed to get canvas context",
      )
    })
  })

  describe("generateSmartTimelinePreviews", () => {
    it("should generate optimal timeline previews", async () => {
      const mockResponse = mockTimelineFrames.map((frame) => ({
        timestamp: frame.timestamp,
        frame_data: frame.frameData,
        is_keyframe: frame.isKeyframe,
      }))

      mockInvoke.mockResolvedValueOnce(mockResponse)

      const result = await frameExtractionService.generateSmartTimelinePreviews(
        "/video.mp4",
        60, // 60 second video
        800, // 800px container
        160, // 160px per frame
      )

      expect(result).toEqual(mockTimelineFrames)
      expect(mockInvoke).toHaveBeenCalledWith("extract_timeline_frames", {
        request: {
          video_path: "/video.mp4",
          duration: 60,
          interval: 12, // 60 / (800/160) = 12
          max_frames: 5, // 800 / 160 = 5
        },
      })
    })

    it("should respect minimum interval", async () => {
      mockInvoke.mockResolvedValueOnce([])

      const result = await frameExtractionService.generateSmartTimelinePreviews(
        "/video.mp4",
        2, // 2 second video
        800, // 800px container
        160, // 160px per frame
      )

      expect(result).toEqual([])
      expect(mockInvoke).toHaveBeenCalledWith("extract_timeline_frames", {
        request: {
          video_path: "/video.mp4",
          duration: 2,
          interval: 0.5, // Minimum 0.5 seconds
          max_frames: 5,
        },
      })
    })
  })

  describe("cacheFramesInIndexedDB", () => {
    it("should cache frames in IndexedDB", async () => {
      mockIndexedDBCacheService.cacheTimelineFrames.mockResolvedValueOnce(undefined)
      const consoleSpy = vi.spyOn(console, "log")

      await frameExtractionService.cacheFramesInIndexedDB("/video.mp4", mockTimelineFrames)

      expect(mockIndexedDBCacheService.cacheTimelineFrames).toHaveBeenCalledWith("/video.mp4", mockTimelineFrames)
      expect(consoleSpy).toHaveBeenCalledWith(`Cached ${mockTimelineFrames.length} timeline frames for /video.mp4`)
    })
  })

  describe("getCachedFrames", () => {
    it("should return cached frames from IndexedDB", async () => {
      mockIndexedDBCacheService.getCachedTimelineFrames.mockResolvedValueOnce(mockTimelineFrames)
      const consoleSpy = vi.spyOn(console, "log")

      const result = await frameExtractionService.getCachedFrames("/video.mp4")

      expect(result).toEqual(mockTimelineFrames)
      expect(mockIndexedDBCacheService.getCachedTimelineFrames).toHaveBeenCalledWith("/video.mp4")
      expect(consoleSpy).toHaveBeenCalledWith(`Retrieved ${mockTimelineFrames.length} cached frames for /video.mp4`)
    })

    it("should return null when no cached frames", async () => {
      mockIndexedDBCacheService.getCachedTimelineFrames.mockResolvedValueOnce(null)

      const result = await frameExtractionService.getCachedFrames("/video.mp4")

      expect(result).toBeNull()
    })

    it("should handle cache retrieval error", async () => {
      const errorMessage = "IndexedDB error"
      mockIndexedDBCacheService.getCachedTimelineFrames.mockRejectedValueOnce(new Error(errorMessage))
      const consoleSpy = vi.spyOn(console, "error")

      const result = await frameExtractionService.getCachedFrames("/video.mp4")

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith("Failed to retrieve cached frames:", expect.any(Error))
    })
  })
})
