import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { indexedDBCacheService } from "@/domains/media-management/services/indexeddb-cache-service"
import { useMediaPreview } from "@/features/media/hooks/use-media-preview"
import type { MediaPreviewData, ThumbnailData } from "@/features/media/types/preview"

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Mock tauri-logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    debugSync: vi.fn(),
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

describe("useMediaPreview", () => {
  let mockInvoke: ReturnType<typeof vi.fn>
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

  beforeEach(async () => {
    vi.clearAllMocks()
    const { invoke } = await import("@tauri-apps/api/core")
    mockInvoke = vi.mocked(invoke)
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
      expect(mockInvoke).not.toHaveBeenCalled() // Should not call backend
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
      mockInvoke.mockResolvedValue(mockPreviewData)

      const { result } = renderHook(() => useMediaPreview())

      let previewData: MediaPreviewData | null = null
      await act(async () => {
        previewData = await result.current.getPreviewData("test-file-123")
      })

      expect(mockIndexedDBCache.getCachedPreview).toHaveBeenCalledWith("test-file-123")
      expect(mockInvoke).toHaveBeenCalledWith("get_media_preview_data", { fileId: "test-file-123" })
      expect(mockIndexedDBCache.cachePreview).toHaveBeenCalledWith("test-file-123", "base64_thumbnail_data")
      expect(previewData).toEqual(mockPreviewData)
      expect(result.current.error).toBeNull()
    })

    it("should handle null preview data", async () => {
      mockIndexedDBCache.getCachedPreview.mockResolvedValue(null) // Not in cache
      mockInvoke.mockResolvedValue(null)

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
      mockInvoke.mockRejectedValue(error)

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
      mockInvoke.mockRejectedValue("String error")

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
      mockInvoke.mockResolvedValue(thumbnailData)
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

      expect(mockInvoke).toHaveBeenCalledWith("generate_media_thumbnail", {
        fileId: "test-file-123",
        filePath: "/path/to/video.mp4",
        width: 320,
        height: 180,
        timestamp: 5.5,
      })

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
      mockInvoke.mockReturnValue(thumbnailPromise)

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
      mockInvoke.mockResolvedValue(thumbnailData)

      const { result } = renderHook(() => useMediaPreview())

      await act(async () => {
        await result.current.generateThumbnail("test-file", "/path/to/video.mp4", 320, 180)
      })

      expect(mockInvoke).toHaveBeenCalledWith("generate_media_thumbnail", {
        fileId: "test-file",
        filePath: "/path/to/video.mp4",
        width: 320,
        height: 180,
        timestamp: 0,
      })
    })

    it("should handle thumbnail generation errors", async () => {
      const error = new Error("Thumbnail generation failed")
      mockInvoke.mockRejectedValue(error)

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
      mockInvoke.mockRejectedValue("String error")

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
      mockInvoke.mockResolvedValue(undefined)
      mockIndexedDBCache.deletePreview.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMediaPreview())

      let success = false
      await act(async () => {
        success = await result.current.clearPreviewData("test-file-123")
      })

      expect(mockInvoke).toHaveBeenCalledWith("clear_media_preview_data", { fileId: "test-file-123" })
      expect(mockIndexedDBCache.deletePreview).toHaveBeenCalledWith("test-file-123")
      expect(success).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it("should handle errors when clearing preview data", async () => {
      const error = new Error("Failed to clear data")
      mockInvoke.mockRejectedValue(error)

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
      mockInvoke.mockResolvedValue(fileIds)

      const { result } = renderHook(() => useMediaPreview())

      let files: string[] = []
      await act(async () => {
        files = await result.current.getFilesWithPreviews()
      })

      expect(mockInvoke).toHaveBeenCalledWith("get_files_with_previews")
      expect(files).toEqual(fileIds)
      expect(result.current.error).toBeNull()
    })

    it("should handle errors and return empty array", async () => {
      const error = new Error("Failed to get files")
      mockInvoke.mockRejectedValue(error)

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
      mockInvoke.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMediaPreview())

      let success = false
      await act(async () => {
        success = await result.current.savePreviewData("/path/to/save.json")
      })

      expect(mockInvoke).toHaveBeenCalledWith("save_preview_data", { path: "/path/to/save.json" })
      expect(success).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it("should handle save errors", async () => {
      const error = new Error("Save failed")
      mockInvoke.mockRejectedValue(error)

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
      mockInvoke.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMediaPreview())

      let success = false
      await act(async () => {
        success = await result.current.loadPreviewData("/path/to/load.json")
      })

      expect(mockInvoke).toHaveBeenCalledWith("load_preview_data", { path: "/path/to/load.json" })
      expect(success).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it("should handle load errors", async () => {
      const error = new Error("Load failed")
      mockInvoke.mockRejectedValue(error)

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
      mockInvoke.mockRejectedValueOnce(error)
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
      mockInvoke.mockResolvedValueOnce(thumbnailData)

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

      mockInvoke.mockImplementation((command: string) => {
        if (command === "get_media_preview_data") return Promise.resolve(mockPreviewData)
        if (command === "generate_media_thumbnail") return Promise.resolve(thumbnailData)
        if (command === "clear_media_preview_data") return Promise.resolve(undefined)
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

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

      expect(mockInvoke).toHaveBeenCalledTimes(3)
    })
  })
})
