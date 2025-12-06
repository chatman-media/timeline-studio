import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { indexedDBCacheService } from "@/domains/media-management/services/indexeddb-cache-service"
import { mediaPreviewService } from "@/domains/media-management/services/media-preview-service"
import { useMediaPreview } from "@/domains/media-management/hooks/use-media-preview"
import type { MediaPreviewData, ThumbnailData } from "@/domains/media-management"

// Mock mediaPreviewService
vi.mock("@/domains/media-management/services/media-preview-service", () => ({
  mediaPreviewService: {
    getPreviewData: vi.fn(),
    generateThumbnail: vi.fn(),
    clearPreviewData: vi.fn(),
    getFilesWithPreviews: vi.fn(),
    savePreviewData: vi.fn(),
    loadPreviewData: vi.fn(),
    restorePreviewCache: vi.fn(),
    hasCachedThumbnail: vi.fn(),
    getCachedThumbnailPath: vi.fn(),
    saveTimelineFrames: vi.fn(),
    getTimelineFrames: vi.fn(),
  },
}))

// Mock tauri-logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    info: vi.fn(),
    infoSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
  })),
}))

// Mock IndexedDB cache service
vi.mock("@/domains/media-management/services/indexeddb-cache-service", () => ({
  indexedDBCacheService: {
    getCachedPreview: vi.fn().mockResolvedValue(null),
    cachePreview: vi.fn().mockResolvedValue(undefined),
    deletePreview: vi.fn().mockResolvedValue(undefined),
    clearPreviewCache: vi.fn().mockResolvedValue(undefined),
  },
}))

// Get typed mock references
const mockGetPreviewData = vi.mocked(mediaPreviewService.getPreviewData)
const mockGenerateThumbnail = vi.mocked(mediaPreviewService.generateThumbnail)
const mockClearPreviewData = vi.mocked(mediaPreviewService.clearPreviewData)
const mockGetFilesWithPreviews = vi.mocked(mediaPreviewService.getFilesWithPreviews)
const mockSavePreviewData = vi.mocked(mediaPreviewService.savePreviewData)
const mockLoadPreviewData = vi.mocked(mediaPreviewService.loadPreviewData)

describe("useMediaPreview", () => {
  const mockIndexedDBCache = vi.mocked(indexedDBCacheService)

  const mockPreviewData: MediaPreviewData = {
    file_id: "test-file-123",
    file_path: "/path/to/test/video.mp4",
    browser_thumbnail: {
      path: "/thumbnails/test-file-123.jpg",
      base64_data: "base64_thumbnail_data",
      timestamp: 0,
      width: 320,
      height: 180,
    },
    timeline_previews: [
      {
        timestamp: 0,
        path: "/previews/frame_0.jpg",
        base64_data: "base64_frame_0",
      },
      {
        timestamp: 1,
        path: "/previews/frame_1.jpg",
        base64_data: "base64_frame_1",
      },
    ],
    timeline_frames: [
      {
        timestamp: 0,
        base64_data: "base64_timeline_frame_0",
        is_keyframe: true,
      },
    ],
    recognition_frames: [
      {
        timestamp: 0,
        path: "/recognition/frame_0.jpg",
        processed: true,
      },
    ],
    recognition_results: {
      objects: [],
      faces: [],
      scenes: [],
      processed_at: "2024-01-01T00:00:00Z",
    },
    last_updated: "2024-01-01T00:00:00Z",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPreviewData.mockReset()
    mockGenerateThumbnail.mockReset()
    mockClearPreviewData.mockReset()
    mockGetFilesWithPreviews.mockReset()
    mockSavePreviewData.mockReset()
    mockLoadPreviewData.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("getPreviewData", () => {
    it("should return cached preview if available", async () => {
      const cachedThumbnail = "cached_base64_data"
      mockIndexedDBCache.getCachedPreview.mockResolvedValue(cachedThumbnail)

      const { result } = renderHook(() => useMediaPreview())

      let previewData: MediaPreviewData | null = null
      await act(async () => {
        previewData = await result.current.getPreviewData("test-file-123")
      })

      expect(mockIndexedDBCache.getCachedPreview).toHaveBeenCalledWith("test-file-123")
      expect(mockGetPreviewData).not.toHaveBeenCalled() // Should not call backend
      expect(previewData).toMatchObject({
        file_id: "test-file-123",
        browser_thumbnail: {
          base64_data: cachedThumbnail,
        },
      })
      expect(result.current.error).toBeNull()
    })

    it("should fetch preview data successfully", async () => {
      mockIndexedDBCache.getCachedPreview.mockResolvedValue(null) // Not in cache
      mockIndexedDBCache.cachePreview.mockResolvedValue(undefined)
      mockGetPreviewData.mockResolvedValue(mockPreviewData)

      const { result } = renderHook(() => useMediaPreview())

      let previewData: MediaPreviewData | null = null
      await act(async () => {
        previewData = await result.current.getPreviewData("test-file-123")
      })

      expect(mockIndexedDBCache.getCachedPreview).toHaveBeenCalledWith("test-file-123")
      expect(mockGetPreviewData).toHaveBeenCalledWith("test-file-123")
      expect(mockIndexedDBCache.cachePreview).toHaveBeenCalledWith("test-file-123", "base64_thumbnail_data")
      expect(previewData).toEqual(mockPreviewData)
      expect(result.current.error).toBeNull()
    })

    it("should handle null preview data", async () => {
      mockIndexedDBCache.getCachedPreview.mockResolvedValue(null) // Not in cache
      mockGetPreviewData.mockResolvedValue(null)

      const { result } = renderHook(() => useMediaPreview())

      let previewData: MediaPreviewData | null = null
      await act(async () => {
        previewData = await result.current.getPreviewData("non-existent-file")
      })

      expect(previewData).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it("should handle errors when fetching preview data", async () => {
      mockIndexedDBCache.getCachedPreview.mockResolvedValue(null) // Not in cache
      const error = new Error("Failed to fetch preview data")
      mockGetPreviewData.mockRejectedValue(error)

      const onError = vi.fn()
      const { result } = renderHook(() => useMediaPreview({ onError }))

      let previewData: MediaPreviewData | null = null
      await act(async () => {
        previewData = await result.current.getPreviewData("test-file-123")
      })

      expect(previewData).toBeNull()
      expect(onError).toHaveBeenCalledWith("Failed to fetch preview data")
      expect(result.current.error).toBe("Failed to fetch preview data")
    })

    it("should handle non-Error exceptions", async () => {
      mockIndexedDBCache.getCachedPreview.mockResolvedValue(null) // Not in cache
      mockGetPreviewData.mockRejectedValue("String error")

      const onError = vi.fn()
      const { result } = renderHook(() => useMediaPreview({ onError }))

      let previewData: MediaPreviewData | null = null
      await act(async () => {
        previewData = await result.current.getPreviewData("test-file-123")
      })

      expect(previewData).toBeNull()
      expect(onError).toHaveBeenCalledWith("Failed to get preview data")
      expect(result.current.error).toBe("Failed to get preview data")
    })
  })

  describe("generateThumbnail", () => {
    it("should generate thumbnail successfully", async () => {
      const base64Data = "generated_thumbnail_base64"
      const thumbnailData: ThumbnailData = {
        path: "",
        base64_data: base64Data,
        timestamp: 5.5,
        width: 320,
        height: 180,
      }
      mockGenerateThumbnail.mockResolvedValue(thumbnailData)
      mockIndexedDBCache.cachePreview.mockResolvedValue(undefined)

      const onThumbnailGenerated = vi.fn()
      const { result } = renderHook(() => useMediaPreview({ onThumbnailGenerated }))

      expect(result.current.isGenerating).toBe(false)

      let generatedThumbnail: ThumbnailData | null = null
      await act(async () => {
        generatedThumbnail = await result.current.generateThumbnail(
          "test-file-123",
          "/path/to/video.mp4",
          320,
          180,
          5.5,
        )
      })

      expect(mockGenerateThumbnail).toHaveBeenCalledWith("test-file-123", "/path/to/video.mp4", 320, 180, 5.5)

      expect(mockIndexedDBCache.cachePreview).toHaveBeenCalledWith("test-file-123", base64Data)
      expect(generatedThumbnail).toEqual(thumbnailData)
      expect(onThumbnailGenerated).toHaveBeenCalledWith("test-file-123", thumbnailData)
      expect(result.current.error).toBeNull()
      expect(result.current.isGenerating).toBe(false)
    })

    it("should set isGenerating state correctly", async () => {
      let resolveThumbnail: (value: ThumbnailData) => void
      const thumbnailPromise = new Promise<ThumbnailData>((resolve) => {
        resolveThumbnail = resolve
      })
      mockGenerateThumbnail.mockReturnValue(thumbnailPromise)

      const { result } = renderHook(() => useMediaPreview())

      expect(result.current.isGenerating).toBe(false)

      // Start generating
      act(() => {
        void result.current.generateThumbnail("test-file", "/path/to/video.mp4", 320, 180)
      })

      // Check isGenerating is true
      await waitFor(() => {
        expect(result.current.isGenerating).toBe(true)
      })

      // Resolve the promise
      await act(async () => {
        resolveThumbnail!({
          path: "",
          base64_data: "thumbnail_data",
          timestamp: 0,
          width: 320,
          height: 180,
        })
      })

      // Check isGenerating is back to false
      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false)
      })
    })

    it("should use default timestamp of 0", async () => {
      const thumbnailData: ThumbnailData = {
        path: "",
        base64_data: "thumbnail_base64",
        timestamp: 0,
        width: 320,
        height: 180,
      }
      mockGenerateThumbnail.mockResolvedValue(thumbnailData)

      const { result } = renderHook(() => useMediaPreview())

      await act(async () => {
        await result.current.generateThumbnail("test-file", "/path/to/video.mp4", 320, 180)
      })

      expect(mockGenerateThumbnail).toHaveBeenCalledWith("test-file", "/path/to/video.mp4", 320, 180, 0)
    })

    it("should handle thumbnail generation errors", async () => {
      const error = new Error("Thumbnail generation failed")
      mockGenerateThumbnail.mockRejectedValue(error)

      const onError = vi.fn()
      const { result } = renderHook(() => useMediaPreview({ onError }))

      let thumbnailData: ThumbnailData | null = null
      await act(async () => {
        thumbnailData = await result.current.generateThumbnail("test-file", "/path/to/video.mp4", 320, 180)
      })

      expect(thumbnailData).toBeNull()
      expect(onError).toHaveBeenCalledWith("Thumbnail generation failed")
      expect(result.current.error).toBe("Thumbnail generation failed")
      expect(result.current.isGenerating).toBe(false)
    })

    it("should handle non-Error exceptions", async () => {
      mockGenerateThumbnail.mockRejectedValue("String error")

      const onError = vi.fn()
      const { result } = renderHook(() => useMediaPreview({ onError }))

      let thumbnailData: ThumbnailData | null = null
      await act(async () => {
        thumbnailData = await result.current.generateThumbnail("test-file", "/path/to/video.mp4", 320, 180)
      })

      expect(thumbnailData).toBeNull()
      expect(onError).toHaveBeenCalledWith("Failed to generate thumbnail")
      expect(result.current.error).toBe("Failed to generate thumbnail")
    })
  })

  describe("clearPreviewData", () => {
    it("should clear preview data successfully", async () => {
      mockClearPreviewData.mockResolvedValue(undefined)
      mockIndexedDBCache.deletePreview.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMediaPreview())

      let success = false
      await act(async () => {
        success = await result.current.clearPreviewData("test-file-123")
      })

      expect(mockClearPreviewData).toHaveBeenCalledWith("test-file-123")
      expect(mockIndexedDBCache.deletePreview).toHaveBeenCalledWith("test-file-123")
      expect(success).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it("should handle errors when clearing preview data", async () => {
      const error = new Error("Failed to clear data")
      mockClearPreviewData.mockRejectedValue(error)

      const onError = vi.fn()
      const { result } = renderHook(() => useMediaPreview({ onError }))

      let success = false
      await act(async () => {
        success = await result.current.clearPreviewData("test-file-123")
      })

      expect(success).toBe(false)
      expect(onError).toHaveBeenCalledWith("Failed to clear data")
      expect(result.current.error).toBe("Failed to clear data")
    })
  })

  describe("getFilesWithPreviews", () => {
    it("should get files with previews successfully", async () => {
      const fileIds = ["file1", "file2", "file3"]
      mockGetFilesWithPreviews.mockResolvedValue(fileIds)

      const { result } = renderHook(() => useMediaPreview())

      let files: string[] = []
      await act(async () => {
        files = await result.current.getFilesWithPreviews()
      })

      expect(mockGetFilesWithPreviews).toHaveBeenCalledWith()
      expect(files).toEqual(fileIds)
      expect(result.current.error).toBeNull()
    })

    it("should handle errors and return empty array", async () => {
      const error = new Error("Failed to get files")
      mockGetFilesWithPreviews.mockRejectedValue(error)

      const onError = vi.fn()
      const { result } = renderHook(() => useMediaPreview({ onError }))

      let files: string[] = []
      await act(async () => {
        files = await result.current.getFilesWithPreviews()
      })

      expect(files).toEqual([])
      expect(onError).toHaveBeenCalledWith("Failed to get files")
      expect(result.current.error).toBe("Failed to get files")
    })
  })

  describe("savePreviewData", () => {
    it("should save preview data successfully", async () => {
      mockSavePreviewData.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMediaPreview())

      let success = false
      await act(async () => {
        success = await result.current.savePreviewData("/path/to/save.json")
      })

      expect(mockSavePreviewData).toHaveBeenCalledWith("/path/to/save.json")
      expect(success).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it("should handle save errors", async () => {
      const error = new Error("Save failed")
      mockSavePreviewData.mockRejectedValue(error)

      const onError = vi.fn()
      const { result } = renderHook(() => useMediaPreview({ onError }))

      let success = false
      await act(async () => {
        success = await result.current.savePreviewData("/path/to/save.json")
      })

      expect(success).toBe(false)
      expect(onError).toHaveBeenCalledWith("Save failed")
      expect(result.current.error).toBe("Save failed")
    })
  })

  describe("loadPreviewData", () => {
    it("should load preview data successfully", async () => {
      mockLoadPreviewData.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMediaPreview())

      let success = false
      await act(async () => {
        success = await result.current.loadPreviewData("/path/to/load.json")
      })

      expect(mockLoadPreviewData).toHaveBeenCalledWith("/path/to/load.json")
      expect(success).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it("should handle load errors", async () => {
      const error = new Error("Load failed")
      mockLoadPreviewData.mockRejectedValue(error)

      const onError = vi.fn()
      const { result } = renderHook(() => useMediaPreview({ onError }))

      let success = false
      await act(async () => {
        success = await result.current.loadPreviewData("/path/to/load.json")
      })

      expect(success).toBe(false)
      expect(onError).toHaveBeenCalledWith("Load failed")
      expect(result.current.error).toBe("Load failed")
    })
  })

  describe("error handling", () => {
    it("should reset error state on successful operations", async () => {
      const error = new Error("Previous error")
      mockGenerateThumbnail.mockRejectedValueOnce(error)
      mockIndexedDBCache.cachePreview.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMediaPreview())

      // First operation fails
      await act(async () => {
        await result.current.generateThumbnail("test-file", "/path/to/video.mp4", 320, 180)
      })

      expect(result.current.error).toBe("Previous error")

      // Second operation succeeds - generateThumbnail resets error state
      const thumbnailData: ThumbnailData = {
        path: "",
        base64_data: "thumbnail_data",
        timestamp: 0,
        width: 320,
        height: 180,
      }
      mockGenerateThumbnail.mockResolvedValueOnce(thumbnailData)

      await act(async () => {
        await result.current.generateThumbnail("test-file", "/path/to/video.mp4", 320, 180)
      })

      expect(result.current.error).toBeNull()
    })

    it("should handle multiple concurrent operations", async () => {
      const thumbnailData: ThumbnailData = {
        path: "",
        base64_data: "thumbnail_data",
        timestamp: 0,
        width: 320,
        height: 180,
      }

      // Mock IndexedDB cache to return null (not cached)
      mockIndexedDBCache.getCachedPreview.mockResolvedValue(null)
      mockIndexedDBCache.cachePreview.mockResolvedValue(undefined)
      mockIndexedDBCache.deletePreview.mockResolvedValue(undefined)

      // Mock Tauri commands
      mockGetPreviewData.mockResolvedValue(mockPreviewData)
      mockGenerateThumbnail.mockResolvedValue(thumbnailData)
      mockClearPreviewData.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMediaPreview())

      await act(async () => {
        const [preview, thumbnail, cleared] = await Promise.all([
          result.current.getPreviewData("file1"),
          result.current.generateThumbnail("file2", "/path/to/video.mp4", 320, 180),
          result.current.clearPreviewData("file3"),
        ])

        expect(preview).toEqual(mockPreviewData)
        expect(thumbnail).toEqual(thumbnailData)
        expect(cleared).toBe(true)
      })

      expect(mockGetPreviewData).toHaveBeenCalledTimes(1)
      expect(mockGenerateThumbnail).toHaveBeenCalledTimes(1)
      expect(mockClearPreviewData).toHaveBeenCalledTimes(1)
    })
  })
})
