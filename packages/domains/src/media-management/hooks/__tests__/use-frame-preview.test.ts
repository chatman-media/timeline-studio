/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaProviders } from "@/test/test-utils"

import { useFramePreview } from "../../hooks/use-frame-preview"

// Мокаем зависимости
vi.mock("../../hooks/use-media-preview", () => ({
  useMediaPreview: vi.fn(() => ({
    getPreviewData: vi.fn(),
    generateThumbnail: vi.fn(),
    clearPreviewData: vi.fn(),
    getAllFilesWithPreviews: vi.fn(),
    saveTimelineFrames: vi.fn(),
    getTimelineFrames: vi.fn(),
  })),
}))

vi.mock("@timeline-studio/domains/video-editing/services/compiler/frame-extraction-service", () => ({
  FrameExtractionService: {
    getInstance: vi.fn(() => ({
      extractTimelineFrames: vi.fn().mockResolvedValue([
        { timestamp: 0, frameData: "frame1", isKeyframe: false },
        { timestamp: 1, frameData: "frame2", isKeyframe: false },
        { timestamp: 2, frameData: "frame3", isKeyframe: false },
      ]),
      getCachedFrames: vi.fn().mockResolvedValue([]),
      cacheFramesInIndexedDB: vi.fn(),
    })),
  },
  ExtractionPurpose: {
    ObjectDetection: "object_detection",
  },
}))

// Мокаем Tauri API
const mockInvoke = vi.fn()
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (cmd: string, args?: unknown) => mockInvoke(cmd, args),
}))

describe("useFramePreview", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("extractTimelineFrames", () => {
    it("должен извлекать кадры для таймлайна", async () => {
      const { useMediaPreview } = await import("../../hooks/use-media-preview")
      const { FrameExtractionService } = await import(
        "@timeline-studio/domains/video-editing/services/compiler/frame-extraction-service"
      )

      vi.mocked(useMediaPreview).mockReturnValue({
        getPreviewData: vi.fn().mockResolvedValue(null), // No cache data
        generateThumbnail: vi.fn(),
        clearPreviewData: vi.fn(),
        getAllFilesWithPreviews: vi.fn(),
        saveTimelineFrames: vi.fn(),
        getTimelineFrames: vi.fn(),
        getFilesWithPreviews: vi.fn(),
        savePreviewData: vi.fn(),
        loadPreviewData: vi.fn(),
        restorePreviewCache: vi.fn(),
        hasCachedThumbnail: vi.fn(),
        getCachedThumbnailPath: vi.fn(),
        isGenerating: false,
        error: null,
      })

      const mockExtractTimelineFrames = vi.fn().mockResolvedValue([
        { timestamp: 0, frameData: "frame1", isKeyframe: false },
        { timestamp: 1, frameData: "frame2", isKeyframe: false },
        { timestamp: 2, frameData: "frame3", isKeyframe: false },
      ])

      const mockInstance = {
        extractTimelineFrames: mockExtractTimelineFrames,
        getCachedFrames: vi.fn().mockResolvedValue([]),
        cacheFramesInIndexedDB: vi.fn(),
      }

      vi.mocked(FrameExtractionService.getInstance).mockReturnValue(mockInstance as any)
      mockInvoke.mockResolvedValueOnce(undefined) // для save_timeline_frames

      const { result } = renderHook(() => useFramePreview(), {
        wrapper: MediaProviders,
      })

      let frames: any
      await act(async () => {
        frames = await result.current.extractTimelineFrames(
          "test-file-123",
          "/path/to/video.mp4",
          10, // duration
          1, // interval
        )
      })

      // Проверяем, что извлечение кадров было вызвано
      expect(mockExtractTimelineFrames).toHaveBeenCalledWith("/path/to/video.mp4", 10, 1, undefined)

      // Проверяем результат
      expect(frames).toHaveLength(3)
      expect(frames[0]).toEqual({
        timestamp: 0,
        frameData: "frame1",
        isKeyframe: false,
      })
    })

    it("должен использовать кэшированные кадры если они существуют", async () => {
      const { useMediaPreview } = await import("../../hooks/use-media-preview")
      const { FrameExtractionService } = await import(
        "@timeline-studio/domains/video-editing/services/compiler/frame-extraction-service"
      )

      const cachedFrames = [
        { timestamp: 0, frameData: "cached1", isKeyframe: false },
        { timestamp: 1, frameData: "cached2", isKeyframe: true },
      ]

      vi.mocked(useMediaPreview).mockReturnValue({
        getPreviewData: vi.fn().mockResolvedValue({
          timeline_previews: cachedFrames.map((f) => ({
            timestamp: f.timestamp,
            path: `/cache/frame_${f.timestamp}.jpg`,
            base64_data: f.frameData,
            is_keyframe: f.isKeyframe,
          })),
        }),
        generateThumbnail: vi.fn(),
        clearPreviewData: vi.fn(),
        getAllFilesWithPreviews: vi.fn(),
        saveTimelineFrames: vi.fn(),
        getTimelineFrames: vi.fn(),
        getFilesWithPreviews: vi.fn(),
        savePreviewData: vi.fn(),
        loadPreviewData: vi.fn(),
        restorePreviewCache: vi.fn(),
        hasCachedThumbnail: vi.fn(),
        getCachedThumbnailPath: vi.fn(),
        isGenerating: false,
        error: null,
      })

      const mockExtractTimelineFrames = vi.fn()
      const mockInstance = {
        extractTimelineFrames: mockExtractTimelineFrames,
        getCachedFrames: vi.fn().mockResolvedValue([]),
        cacheFramesInIndexedDB: vi.fn(),
      }

      vi.mocked(FrameExtractionService.getInstance).mockReturnValue(mockInstance as any)

      const { result } = renderHook(() => useFramePreview(), {
        wrapper: MediaProviders,
      })

      let frames: any
      await act(async () => {
        frames = await result.current.extractTimelineFrames("test-file-123", "/path/to/video.mp4", 10, 1)
      })

      // Проверяем, что извлечение НЕ было вызвано
      expect(mockExtractTimelineFrames).not.toHaveBeenCalled()

      // Проверяем, что вернулись кэшированные кадры
      expect(frames).toEqual(cachedFrames)
    })
  })

  describe("getFrameAtTimestamp", () => {
    it("должен получать кадр по временной метке", async () => {
      const { useMediaPreview } = await import("../../hooks/use-media-preview")

      const mockPreviewData = {
        timeline_previews: [
          { timestamp: 0, path: "/cache/frame_0.jpg", base64_data: "frame0" },
          { timestamp: 1, path: "/cache/frame_1.jpg", base64_data: "frame1" },
          { timestamp: 2, path: "/cache/frame_2.jpg", base64_data: "frame2" },
          { timestamp: 3, path: "/cache/frame_3.jpg", base64_data: "frame3" },
        ],
      }

      vi.mocked(useMediaPreview).mockReturnValue({
        getPreviewData: vi.fn().mockResolvedValue(mockPreviewData),
        generateThumbnail: vi.fn(),
        clearPreviewData: vi.fn(),
        getAllFilesWithPreviews: vi.fn(),
        saveTimelineFrames: vi.fn(),
        getTimelineFrames: vi.fn(),
        getFilesWithPreviews: vi.fn(),
        savePreviewData: vi.fn(),
        loadPreviewData: vi.fn(),
        restorePreviewCache: vi.fn(),
        hasCachedThumbnail: vi.fn(),
        getCachedThumbnailPath: vi.fn(),
        isGenerating: false,
        error: null,
      })

      const { result } = renderHook(() => useFramePreview(), {
        wrapper: MediaProviders,
      })

      // Точное совпадение
      let frame = await result.current.getFrameAtTimestamp("test-file-123", 2)
      expect(frame).toEqual({
        timestamp: 2,
        base64_data: "frame2",
        is_keyframe: false,
      })

      // Ближайший кадр (1.4 ближе к 1)
      frame = await result.current.getFrameAtTimestamp("test-file-123", 1.4)
      expect(frame).toEqual({
        timestamp: 1,
        base64_data: "frame1",
        is_keyframe: false,
      })

      // Ближайший кадр (1.6 ближе к 2)
      frame = await result.current.getFrameAtTimestamp("test-file-123", 1.6)
      expect(frame).toEqual({
        timestamp: 2,
        base64_data: "frame2",
        is_keyframe: false,
      })
    })

    it("должен возвращать null если нет кадров", async () => {
      const { useMediaPreview } = await import("../../hooks/use-media-preview")

      vi.mocked(useMediaPreview).mockReturnValue({
        getPreviewData: vi.fn().mockResolvedValue({
          timeline_previews: [],
        }),
        generateThumbnail: vi.fn(),
        clearPreviewData: vi.fn(),
        getAllFilesWithPreviews: vi.fn(),
        saveTimelineFrames: vi.fn(),
        getTimelineFrames: vi.fn(),
        getFilesWithPreviews: vi.fn(),
        savePreviewData: vi.fn(),
        loadPreviewData: vi.fn(),
        restorePreviewCache: vi.fn(),
        hasCachedThumbnail: vi.fn(),
        getCachedThumbnailPath: vi.fn(),
        isGenerating: false,
        error: null,
      })

      const { result } = renderHook(() => useFramePreview(), {
        wrapper: MediaProviders,
      })

      const frame = await result.current.getFrameAtTimestamp("test-file-123", 1)
      expect(frame).toBeNull()
    })

    it("должен возвращать null если нет данных превью", async () => {
      const { useMediaPreview } = await import("../../hooks/use-media-preview")

      vi.mocked(useMediaPreview).mockReturnValue({
        getPreviewData: vi.fn().mockResolvedValue(null),
        generateThumbnail: vi.fn(),
        clearPreviewData: vi.fn(),
        getAllFilesWithPreviews: vi.fn(),
        saveTimelineFrames: vi.fn(),
        getTimelineFrames: vi.fn(),
        getFilesWithPreviews: vi.fn(),
        savePreviewData: vi.fn(),
        loadPreviewData: vi.fn(),
        restorePreviewCache: vi.fn(),
        hasCachedThumbnail: vi.fn(),
        getCachedThumbnailPath: vi.fn(),
        isGenerating: false,
        error: null,
      })

      const { result } = renderHook(() => useFramePreview(), {
        wrapper: MediaProviders,
      })

      const frame = await result.current.getFrameAtTimestamp("test-file-123", 1)
      expect(frame).toBeNull()
    })
  })

  describe("clearTimelineFrames", () => {
    it("должен очищать кадры таймлайна", async () => {
      const { useMediaPreview } = await import("../../hooks/use-media-preview")

      const mockClearPreviewData = vi.fn().mockResolvedValue(true)
      vi.mocked(useMediaPreview).mockReturnValue({
        getPreviewData: vi.fn(),
        generateThumbnail: vi.fn(),
        clearPreviewData: mockClearPreviewData,
        getAllFilesWithPreviews: vi.fn(),
        saveTimelineFrames: vi.fn(),
        getTimelineFrames: vi.fn(),
        getFilesWithPreviews: vi.fn(),
        savePreviewData: vi.fn(),
        loadPreviewData: vi.fn(),
        restorePreviewCache: vi.fn(),
        hasCachedThumbnail: vi.fn(),
        getCachedThumbnailPath: vi.fn(),
        isGenerating: false,
        error: null,
      })

      const { result } = renderHook(() => useFramePreview(), {
        wrapper: MediaProviders,
      })

      let success = false
      await act(async () => {
        success = await result.current.clearTimelineFrames("test-file-123")
      })

      expect(mockClearPreviewData).toHaveBeenCalledWith("test-file-123")
      expect(success).toBe(true)
    })
  })
})
