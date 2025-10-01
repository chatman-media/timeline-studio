import { act, renderHook } from "@testing-library/react"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { Subtitle, SubtitleAlignX, SubtitleAlignY, SubtitleFontWeight } from "@/domains/video-editing"

import { useFrameExtraction } from "../../hooks/use-frame-extraction"
import * as frameExtractionServiceModule from "../../services/frame-extraction-service"

// Ensure console.error is mocked to see errors
const originalConsoleError = console.error
beforeAll(() => {
  console.error = vi.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Мокаем useMediaPreview и useFramePreview
vi.mock("@/features/media/hooks/use-media-preview", () => ({
  useMediaPreview: () => ({
    getPreviewData: vi.fn().mockResolvedValue(null),
    generateThumbnail: vi.fn().mockResolvedValue("base64-thumbnail"),
    clearPreviewData: vi.fn().mockResolvedValue(true),
    getFilesWithPreviews: vi.fn().mockResolvedValue([]),
    savePreviewData: vi.fn().mockResolvedValue(true),
    loadPreviewData: vi.fn().mockResolvedValue(true),
    isGenerating: false,
    error: null,
  }),
}))

// Create mock functions outside to maintain references
const mockExtractTimelineFrames = vi.fn()
const mockExtractRecognitionFrames = vi.fn()
const mockGetFrameAtTimestamp = vi.fn()

vi.mock("@/features/media/hooks/use-frame-preview", () => ({
  useFramePreview: () => ({
    extractTimelineFrames: mockExtractTimelineFrames,
    extractRecognitionFrames: mockExtractRecognitionFrames,
    getFrameAtTimestamp: mockGetFrameAtTimestamp,
    isExtracting: false,
    error: null,
  }),
}))

// Мокаем сервис извлечения кадров
vi.mock("../../services/frame-extraction-service", () => {
  const mockExtractRecognitionFramesService = vi.fn()
  const mockCacheRecognitionFramesService = vi.fn()

  return {
    ExtractionPurpose: {
      TimelinePreview: "timeline_preview",
      ObjectDetection: "object_detection",
      SceneRecognition: "scene_recognition",
      TextRecognition: "text_recognition",
      SubtitleAnalysis: "subtitle_analysis",
    },
    FrameExtractionService: {
      getInstance: vi.fn(() => ({
        extractTimelineFrames: vi.fn(),
        extractRecognitionFrames: mockExtractRecognitionFramesService,
        extractSubtitleFrames: vi.fn(),
        getCachedFrames: vi.fn(),
        cacheFrames: vi.fn(),
        clearFrameCache: vi.fn(),
        cacheFramesInIndexedDB: vi.fn(),
        cacheRecognitionFrames: mockCacheRecognitionFramesService,
      })),
    },
    frameExtractionService: {
      getCachedFrames: vi.fn(),
      extractTimelineFrames: vi.fn(),
      extractRecognitionFrames: mockExtractRecognitionFramesService,
      extractSubtitleFrames: vi.fn(),
      cacheFrames: vi.fn(),
      clearFrameCache: vi.fn(),
      cacheFramesInIndexedDB: vi.fn(),
      cacheRecognitionFrames: mockCacheRecognitionFramesService,
    },
    // Export mock functions so they can be accessed in tests
    __mocks: {
      extractRecognitionFrames: mockExtractRecognitionFramesService,
      cacheRecognitionFrames: mockCacheRecognitionFramesService,
    },
  }
})

describe("useFrameExtraction", () => {
  let mockFrameExtractionService: any

  const mockTimelineFrames = [
    {
      timestamp: 0,
      frameData: "data:image/png;base64,frame1",
      isKeyframe: true,
    },
    {
      timestamp: 1,
      frameData: "data:image/png;base64,frame2",
      isKeyframe: false,
    },
    {
      timestamp: 2,
      frameData: "data:image/png;base64,frame3",
      isKeyframe: true,
    },
  ]

  const mockRecognitionFrames = [
    {
      timestamp: 0,
      frameData: new Uint8Array([1, 2, 3, 4]),
      resolution: [640, 480] as [number, number],
      sceneChangeScore: 0.8,
      isKeyframe: true,
    },
    {
      timestamp: 2,
      frameData: new Uint8Array([5, 6, 7, 8]),
      resolution: [640, 480] as [number, number],
      sceneChangeScore: 0.3,
      isKeyframe: false,
    },
  ]

  const mockSubtitleFrames = [
    {
      subtitleId: "sub1",
      subtitleText: "Hello world",
      timestamp: 1.5,
      frameData: new Uint8Array([9, 10, 11, 12]),
      startTime: 1.0,
      endTime: 2.0,
    },
    {
      subtitleId: "sub2",
      subtitleText: "Test subtitle",
      timestamp: 3.7,
      frameData: new Uint8Array([13, 14, 15, 16]),
      startTime: 3.5,
      endTime: 4.0,
    },
  ]

  const mockSubtitles: Subtitle[] = [
    {
      id: "sub1",
      text: "Hello world",
      start_time: 1.0,
      end_time: 2.0,
      position: {
        x: 0,
        y: 0,
        align_x: SubtitleAlignX.Center,
        align_y: SubtitleAlignY.Bottom,
      },
      style: {
        font_family: "Arial",
        font_size: 24,
        font_weight: SubtitleFontWeight.Normal,
        color: "#ffffff",
      },
      enabled: true,
    },
    {
      id: "sub2",
      text: "Test subtitle",
      start_time: 3.5,
      end_time: 4.0,
      position: {
        x: 0,
        y: 0,
        align_x: SubtitleAlignX.Center,
        align_y: SubtitleAlignY.Bottom,
      },
      style: {
        font_family: "Arial",
        font_size: 24,
        font_weight: SubtitleFontWeight.Normal,
        color: "#ffffff",
      },
      enabled: true,
    },
  ]

  beforeEach(async () => {
    vi.clearAllMocks()
    const { frameExtractionService, FrameExtractionService, __mocks } = (await import(
      "../../services/frame-extraction-service"
    )) as any

    mockFrameExtractionService = frameExtractionService

    // Обновляем мок getInstance для возврата мока
    vi.mocked(FrameExtractionService.getInstance).mockReturnValue(mockFrameExtractionService)

    // Настраиваем моки по умолчанию
    if (__mocks) {
      __mocks.extractRecognitionFrames.mockResolvedValue(mockRecognitionFrames)
      __mocks.cacheRecognitionFrames.mockResolvedValue(undefined)
    }

    // Reset mock functions
    mockExtractTimelineFrames.mockReset()
    mockExtractRecognitionFrames.mockReset()
    mockGetFrameAtTimestamp.mockReset()
  })

  describe("initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useFrameExtraction())

      expect(result.current.timelineFrames).toEqual([])
      expect(result.current.recognitionFrames).toEqual([])
      expect(result.current.subtitleFrames).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.progress).toBe(0)
      expect(result.current.error).toBeNull()
    })

    it("should accept custom options", () => {
      const customOptions = {
        cacheResults: false,
        autoLoad: true,
        interval: 2.0,
        maxFrames: 50,
      }

      const { result } = renderHook(() => useFrameExtraction(customOptions))

      // Options are internal, but we can verify they're used correctly
      expect(result.current.timelineFrames).toEqual([])
    })
  })

  describe("extractTimelineFrames", () => {
    it("should extract timeline frames successfully", async () => {
      mockExtractTimelineFrames.mockResolvedValueOnce(mockTimelineFrames)

      const { result } = renderHook(() => useFrameExtraction())

      await act(async () => {
        await result.current.extractTimelineFrames("/video.mp4", 10)
      })

      expect(mockExtractTimelineFrames).toHaveBeenCalledWith(
        "/video.mp4", // fileId
        "/video.mp4", // videoPath
        10, // duration
        1.0, // interval
        undefined, // maxFrames
      )

      expect(result.current.timelineFrames).toEqual(mockTimelineFrames)
      expect(result.current.isLoading).toBe(false)
    })

    it("should handle extraction with custom options", async () => {
      mockExtractTimelineFrames.mockResolvedValueOnce(mockTimelineFrames)

      const { result } = renderHook(() =>
        useFrameExtraction({
          interval: 2.0,
          maxFrames: 50,
        }),
      )

      await act(async () => {
        await result.current.extractTimelineFrames("/video.mp4", 10)
      })

      expect(mockExtractTimelineFrames).toHaveBeenCalledWith(
        "/video.mp4", // fileId
        "/video.mp4", // videoPath
        10, // duration
        2.0, // custom interval
        50, // custom maxFrames
      )
      expect(result.current.timelineFrames).toEqual(mockTimelineFrames)
    })

    it("should handle extraction error", async () => {
      const errorMessage = "Failed to extract frames"
      mockExtractTimelineFrames.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useFrameExtraction())

      await act(async () => {
        await result.current.extractTimelineFrames("/video.mp4", 10)
      })

      expect(result.current.error?.message).toBe(errorMessage)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe("extractRecognitionFrames", () => {
    it("should extract recognition frames for object detection", async () => {
      const { ExtractionPurpose } = await import("../../services/frame-extraction-service")
      mockFrameExtractionService.extractRecognitionFrames.mockResolvedValueOnce(mockRecognitionFrames)
      mockFrameExtractionService.cacheRecognitionFrames.mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useFrameExtraction())

      await act(async () => {
        await result.current.extractRecognitionFrames("/video.mp4", ExtractionPurpose.ObjectDetection)
      })

      expect(mockFrameExtractionService.extractRecognitionFrames).toHaveBeenCalledWith(
        "/video.mp4", // videoPath
        ExtractionPurpose.ObjectDetection, // purpose
        1.0, // interval
      )

      expect(mockFrameExtractionService.cacheRecognitionFrames).toHaveBeenCalledWith(
        "/video.mp4",
        mockRecognitionFrames,
      )

      expect(result.current.recognitionFrames).toEqual(mockRecognitionFrames)
    })

    it("should extract recognition frames for scene recognition", async () => {
      const { ExtractionPurpose } = await import("../../services/frame-extraction-service")
      mockFrameExtractionService.extractRecognitionFrames.mockResolvedValueOnce(mockRecognitionFrames)
      mockFrameExtractionService.cacheRecognitionFrames.mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useFrameExtraction())

      await act(async () => {
        await result.current.extractRecognitionFrames("/video.mp4", ExtractionPurpose.SceneRecognition)
      })

      expect(mockFrameExtractionService.extractRecognitionFrames).toHaveBeenCalledWith(
        "/video.mp4", // videoPath
        ExtractionPurpose.SceneRecognition, // purpose
        1.0, // interval
      )

      expect(mockFrameExtractionService.cacheRecognitionFrames).toHaveBeenCalledWith(
        "/video.mp4",
        mockRecognitionFrames,
      )

      expect(result.current.recognitionFrames).toEqual(mockRecognitionFrames)
    })
  })

  describe("extractSubtitleFrames", () => {
    it("should extract subtitle frames", async () => {
      mockFrameExtractionService.extractSubtitleFrames.mockResolvedValueOnce(mockSubtitleFrames)

      const { result } = renderHook(() => useFrameExtraction())

      await act(async () => {
        await result.current.extractSubtitleFrames("/video.mp4", mockSubtitles)
      })

      expect(mockFrameExtractionService.extractSubtitleFrames).toHaveBeenCalledWith("/video.mp4", mockSubtitles)

      expect(result.current.subtitleFrames).toEqual(mockSubtitleFrames)
    })

    it("should handle empty subtitles array", async () => {
      mockFrameExtractionService.extractSubtitleFrames.mockResolvedValueOnce([])

      const { result } = renderHook(() => useFrameExtraction())

      await act(async () => {
        await result.current.extractSubtitleFrames("/video.mp4", [])
      })

      expect(mockFrameExtractionService.extractSubtitleFrames).toHaveBeenCalledWith("/video.mp4", [])
      expect(result.current.subtitleFrames).toEqual([])
    })
  })

  describe("clearCache", () => {
    it("should clear cache without resetting state", async () => {
      mockFrameExtractionService.clearFrameCache.mockResolvedValueOnce(undefined)
      mockExtractTimelineFrames.mockResolvedValueOnce(mockTimelineFrames)

      const { result } = renderHook(() => useFrameExtraction())

      // Устанавливаем некоторые кадры через extraction
      await act(async () => {
        await result.current.extractTimelineFrames("/video.mp4", 10)
      })

      expect(result.current.timelineFrames).toEqual(mockTimelineFrames)

      await act(async () => {
        await result.current.clearCache()
      })

      expect(mockFrameExtractionService.clearFrameCache).toHaveBeenCalled()
      // State should remain unchanged after clearing cache
      expect(result.current.timelineFrames).toEqual(mockTimelineFrames)
      expect(result.current.recognitionFrames).toEqual([])
      expect(result.current.subtitleFrames).toEqual([])
    })
  })

  describe("reset", () => {
    it("should reset state without clearing cache", async () => {
      mockExtractTimelineFrames.mockResolvedValueOnce(mockTimelineFrames)

      const { result } = renderHook(() => useFrameExtraction())

      // Устанавливаем некоторые данные
      await act(async () => {
        await result.current.extractTimelineFrames("/video.mp4", 10)
      })

      expect(result.current.timelineFrames).toEqual(mockTimelineFrames)

      act(() => {
        result.current.reset()
      })

      expect(result.current.timelineFrames).toEqual([])
      expect(result.current.recognitionFrames).toEqual([])
      expect(result.current.subtitleFrames).toEqual([])
      expect(result.current.error).toBeNull()
      expect(result.current.progress).toBe(0)
      expect(mockFrameExtractionService.clearFrameCache).not.toHaveBeenCalled()
    })
  })

  describe("concurrent extraction", () => {
    it("should handle concurrent extraction requests", async () => {
      const { ExtractionPurpose } = await import("../../services/frame-extraction-service")

      // Настраиваем моки для этого теста
      mockExtractTimelineFrames.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTimelineFrames), 50)),
      )

      // Настраиваем моки для сервиса распознавания
      const mocks = (frameExtractionServiceModule as any).__mocks
      mocks.extractRecognitionFrames.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockRecognitionFrames), 50)),
      )
      mocks.cacheRecognitionFrames.mockResolvedValue(undefined)

      const { result } = renderHook(() => useFrameExtraction())

      // Запускаем две экстракции одновременно
      const promise1 = act(async () => {
        await result.current.extractTimelineFrames("/video1.mp4", 10)
      })

      const promise2 = act(async () => {
        await result.current.extractRecognitionFrames("/video2.mp4", ExtractionPurpose.ObjectDetection)
      })

      await Promise.all([promise1, promise2])

      expect(mockExtractTimelineFrames).toHaveBeenCalledTimes(1)
      expect(mocks.extractRecognitionFrames).toHaveBeenCalledTimes(1)
      expect(result.current.timelineFrames).toEqual(mockTimelineFrames)
      // expect(result.current.recognitionFrames).toEqual(mockRecognitionFrames)
    })
  })

  describe.skip("adaptive interval calculation", () => {
    it("should calculate adaptive interval for long videos", async () => {
      // Reset mocks before this test
      mockExtractTimelineFrames.mockClear()
      mockExtractRecognitionFrames.mockClear()
      mockGetFrameAtTimestamp.mockClear()

      mockExtractTimelineFrames.mockResolvedValueOnce(mockTimelineFrames)

      const { result, rerender } = renderHook(() =>
        useFrameExtraction({
          interval: 1.0,
          maxFrames: 100,
        }),
      )

      // Force a rerender if the hook is not ready
      if (!result.current) {
        rerender()
      }

      // Check that the hook initialized properly
      expect(result.current).toBeDefined()
      expect(result.current.extractTimelineFrames).toBeDefined()

      // Длинное видео (300 секунд)
      await act(async () => {
        await result.current.extractTimelineFrames("/long-video.mp4", 300)
      })

      // Хук использует адаптивный интервал внутри
      expect(mockExtractTimelineFrames).toHaveBeenCalledWith(
        "/long-video.mp4", // fileId
        "/long-video.mp4", // videoPath
        300, // duration
        1.0, // interval
        100, // maxFrames
      )
    })
  })

  describe.skip("progress tracking", () => {
    it("should update progress during extraction", async () => {
      // Reset mocks before this test
      mockExtractTimelineFrames.mockClear()
      mockExtractRecognitionFrames.mockClear()
      mockGetFrameAtTimestamp.mockClear()

      mockExtractTimelineFrames.mockResolvedValueOnce(mockTimelineFrames)

      const { result, rerender } = renderHook(() => useFrameExtraction())

      // Force a rerender if the hook is not ready
      if (!result.current) {
        rerender()
      }

      // Check that the hook initialized properly
      expect(result.current).toBeDefined()
      expect(result.current.progress).toBe(0)

      await act(async () => {
        await result.current.extractTimelineFrames("/video.mp4", 10)
      })

      // После завершения прогресс должен быть 100
      expect(result.current.progress).toBe(100)
    })
  })
})
