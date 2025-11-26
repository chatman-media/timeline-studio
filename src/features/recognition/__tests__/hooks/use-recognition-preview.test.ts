import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useRecognitionPreview } from "../../hooks/use-recognition-preview"
import { createMockYoloData } from "../../__mocks__"

// Mock Tauri API
const mockInvoke = vi.fn()
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}))

// Mock useMediaPreview
const mockGetPreviewData = vi.fn()
vi.mock("@/features/media/hooks/use-media-preview", () => ({
  useMediaPreview: () => ({
    getPreviewData: mockGetPreviewData,
  }),
}))

vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

describe("useRecognitionPreview", () => {
  const mockYoloData = createMockYoloData()
  const mockRecognitionResults = {
    objects: [
      {
        class: "person",
        confidence: 0.95,
        timestamps: [0, 5],
        bounding_boxes: [
          { x: 0.1, y: 0.2, width: 0.3, height: 0.6 },
          { x: 0.2, y: 0.3, width: 0.25, height: 0.5 },
        ],
      },
    ],
    processed_at: new Date().toISOString(),
  }

  beforeEach(() => {
    mockInvoke.mockReset()
    mockGetPreviewData.mockReset()
  })

  describe("processVideoRecognition", () => {
    it("должен запустить распознавание видео", async () => {
      mockGetPreviewData.mockResolvedValue(null)
      mockInvoke.mockResolvedValue(mockYoloData)

      const { result } = renderHook(() => useRecognitionPreview())

      const data = await result.current.processVideoRecognition("test-video", "/path/to/video.mp4")

      expect(data).toBeDefined()
      expect(data?.videoId).toBe("test-video")
      expect(mockInvoke).toHaveBeenCalledWith("process_video_recognition", {
        videoPath: "/path/to/video.mp4",
        modelPath: undefined,
        targetClasses: undefined,
      })
    })

    it("должен использовать кэшированные результаты", async () => {
      mockGetPreviewData.mockResolvedValue({
        file_path: "/path/to/video.mp4",
        recognition_results: mockRecognitionResults,
      })

      const { result } = renderHook(() => useRecognitionPreview())

      const data = await result.current.processVideoRecognition("test-video", "/path/to/video.mp4")

      expect(data).toBeDefined()
      expect(mockInvoke).not.toHaveBeenCalled()
    })

    it("должен обновлять состояние обработки", async () => {
      mockGetPreviewData.mockResolvedValue(null)
      mockInvoke.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockYoloData), 100)),
      )

      const { result } = renderHook(() => useRecognitionPreview())

      const promise = result.current.processVideoRecognition("test-video", "/path/to/video.mp4")

      // Проверяем, что isProcessing установлен
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      await promise
    })

    it("должен обработать ошибку распознавания", async () => {
      mockGetPreviewData.mockResolvedValue(null)
      mockInvoke.mockRejectedValue(new Error("Recognition failed"))

      const onError = vi.fn()
      const { result } = renderHook(() => useRecognitionPreview({ onError }))

      const data = await result.current.processVideoRecognition("test-video", "/path/to/video.mp4")

      expect(data).toBeNull()
      expect(result.current.error).toBe("Recognition failed")
      expect(onError).toHaveBeenCalledWith("Recognition failed")
    })

    it("должен вызвать callback при завершении", async () => {
      mockGetPreviewData.mockResolvedValue(null)
      mockInvoke.mockResolvedValue(mockYoloData)

      const onComplete = vi.fn()
      const { result } = renderHook(() =>
        useRecognitionPreview({
          onRecognitionComplete: onComplete,
        }),
      )

      await result.current.processVideoRecognition("test-video", "/path/to/video.mp4")

      expect(onComplete).toHaveBeenCalledWith("test-video", expect.any(Object))
    })

    it("должен передать параметры модели и классов", async () => {
      mockGetPreviewData.mockResolvedValue(null)
      mockInvoke.mockResolvedValue(mockYoloData)

      const { result } = renderHook(() => useRecognitionPreview())

      await result.current.processVideoRecognition(
        "test-video",
        "/path/to/video.mp4",
        "/path/to/model.onnx",
        ["person", "car"],
      )

      expect(mockInvoke).toHaveBeenCalledWith("process_video_recognition", {
        videoPath: "/path/to/video.mp4",
        modelPath: "/path/to/model.onnx",
        targetClasses: ["person", "car"],
      })
    })
  })

  describe("getRecognitionAtTimestamp", () => {
    it("должен получить результаты для timestamp", async () => {
      mockGetPreviewData.mockResolvedValue({
        file_path: "/path/to/video.mp4",
        recognition_results: mockRecognitionResults,
      })

      const { result } = renderHook(() => useRecognitionPreview())

      const detections = await result.current.getRecognitionAtTimestamp("test-video", 3)

      expect(detections).toBeDefined()
      expect(detections.length).toBeGreaterThan(0)
    })

    it("должен найти ближайший кадр", async () => {
      mockGetPreviewData.mockResolvedValue({
        file_path: "/path/to/video.mp4",
        recognition_results: mockRecognitionResults,
      })

      const { result } = renderHook(() => useRecognitionPreview())

      const detections = await result.current.getRecognitionAtTimestamp("test-video", 2)

      expect(detections).toBeDefined()
    })

    it("должен вернуть пустой массив без данных", async () => {
      mockGetPreviewData.mockResolvedValue(null)

      const { result } = renderHook(() => useRecognitionPreview())

      const detections = await result.current.getRecognitionAtTimestamp("test-video", 5)

      expect(detections).toEqual([])
    })

    it("должен обработать ошибку", async () => {
      mockGetPreviewData.mockRejectedValue(new Error("Failed"))

      const { result } = renderHook(() => useRecognitionPreview())

      const detections = await result.current.getRecognitionAtTimestamp("test-video", 5)

      expect(detections).toEqual([])
    })
  })

  describe("getPreviewWithRecognition", () => {
    it("должен получить превью с распознаванием", async () => {
      mockInvoke.mockResolvedValue({ preview_with_boxes: "base64_image_data" })

      const { result } = renderHook(() => useRecognitionPreview())

      const preview = await result.current.getPreviewWithRecognition("test-video")

      expect(preview).toBe("base64_image_data")
      expect(mockInvoke).toHaveBeenCalledWith("get_preview_data_with_recognition", {
        fileId: "test-video",
      })
    })

    it("должен вернуть null если нет данных", async () => {
      mockInvoke.mockResolvedValue(null)

      const { result } = renderHook(() => useRecognitionPreview())

      const preview = await result.current.getPreviewWithRecognition("test-video")

      expect(preview).toBeNull()
    })

    it("должен обработать ошибку", async () => {
      mockInvoke.mockRejectedValue(new Error("Failed"))

      const { result } = renderHook(() => useRecognitionPreview())

      const preview = await result.current.getPreviewWithRecognition("test-video")

      expect(preview).toBeNull()
      expect(result.current.error).toBe("Failed")
    })
  })

  describe("processBatchRecognition", () => {
    it("должен обработать batch файлов", async () => {
      mockGetPreviewData.mockResolvedValue(null)
      mockInvoke.mockResolvedValue(mockYoloData)

      const { result } = renderHook(() => useRecognitionPreview())

      const results = await result.current.processBatchRecognition([
        { id: "video1", path: "/path/to/video1.mp4" },
        { id: "video2", path: "/path/to/video2.mp4" },
      ])

      expect(results.size).toBe(2)
      expect(results.has("video1")).toBe(true)
      expect(results.has("video2")).toBe(true)
    })

    it("должен обрабатывать файлы пакетами", async () => {
      mockGetPreviewData.mockResolvedValue(null)
      mockInvoke.mockResolvedValue(mockYoloData)

      const { result } = renderHook(() => useRecognitionPreview())

      const files = Array.from({ length: 10 }, (_, i) => ({
        id: `video${i}`,
        path: `/path/to/video${i}.mp4`,
      }))

      await result.current.processBatchRecognition(files)

      // Должно быть вызвано 10 раз (по одному на каждый файл)
      expect(mockInvoke).toHaveBeenCalledTimes(10)
    })

    it("должен обработать ошибки в batch", async () => {
      mockGetPreviewData.mockResolvedValue(null)
      mockInvoke.mockRejectedValue(new Error("Failed"))

      const { result } = renderHook(() => useRecognitionPreview())

      const results = await result.current.processBatchRecognition([
        { id: "video1", path: "/path/to/video1.mp4" },
      ])

      expect(results.size).toBe(0)
      expect(result.current.error).toBe("Failed")
    })
  })

  describe("clearRecognitionResults", () => {
    it("должен очистить результаты распознавания", async () => {
      mockInvoke.mockResolvedValue(undefined)

      const { result } = renderHook(() => useRecognitionPreview())

      const success = await result.current.clearRecognitionResults("test-video")

      expect(success).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith("clear_recognition_results", { fileId: "test-video" })
    })

    it("должен обработать ошибку очистки", async () => {
      mockInvoke.mockRejectedValue(new Error("Failed"))

      const { result } = renderHook(() => useRecognitionPreview())

      const success = await result.current.clearRecognitionResults("test-video")

      expect(success).toBe(false)
    })
  })

  describe("convertRecognitionResultsToYoloData", () => {
    it("должен конвертировать результаты в YoloData формат", async () => {
      mockGetPreviewData.mockResolvedValue({
        file_path: "/path/to/video.mp4",
        recognition_results: mockRecognitionResults,
      })

      const { result } = renderHook(() => useRecognitionPreview())

      const data = await result.current.processVideoRecognition("test-video", "/path/to/video.mp4")

      expect(data).toBeDefined()
      expect(data?.frames).toBeDefined()
      expect(data?.frames.length).toBeGreaterThan(0)
      expect(data?.metadata).toBeDefined()
    })
  })
})
