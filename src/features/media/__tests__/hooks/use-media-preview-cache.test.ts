import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { indexedDBCacheService } from "@/domains/media-management/services/indexeddb-cache-service"
import { mediaPreviewService } from "@/domains/media-management/services/media-preview-service"
import { useMediaPreview } from "../../hooks/use-media-preview"

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

// Mock IndexedDB cache service
vi.mock("@/domains/media-management/services/indexeddb-cache-service", () => ({
  indexedDBCacheService: {
    getCachedPreview: vi.fn(),
    cachePreview: vi.fn(),
    deletePreview: vi.fn(),
    clearPreviewCache: vi.fn(),
  },
}))

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

// Get typed mock references
const mockGetPreviewData = vi.mocked(mediaPreviewService.getPreviewData)
const mockGenerateThumbnail = vi.mocked(mediaPreviewService.generateThumbnail)
const mockClearPreviewData = vi.mocked(mediaPreviewService.clearPreviewData)

describe("useMediaPreview with IndexedDB cache", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPreviewData.mockReset()
    mockGenerateThumbnail.mockReset()
    mockClearPreviewData.mockReset()
  })

  describe("getPreviewData", () => {
    it("should return cached preview from IndexedDB if available", async () => {
      const fileId = "test-file-123"
      const cachedThumbnail = "cached-base64-data"

      vi.mocked(indexedDBCacheService.getCachedPreview).mockResolvedValue(cachedThumbnail)

      const { result } = renderHook(() => useMediaPreview())

      const data = await act(async () => {
        return result.current.getPreviewData(fileId)
      })

      expect(indexedDBCacheService.getCachedPreview).toHaveBeenCalledWith(fileId)
      expect(mockGetPreviewData).not.toHaveBeenCalled() // Should not call backend
      expect(data).toEqual({
        file_id: fileId,
        file_path: "",
        browser_thumbnail: {
          path: "",
          base64_data: cachedThumbnail,
          timestamp: 0,
          width: 0,
          height: 0,
        },
        last_updated: expect.any(String),
        timeline_previews: [],
        recognition_frames: [],
      })
    })

    it("should fetch from backend and cache if not in IndexedDB", async () => {
      const fileId = "test-file-456"
      const backendData = {
        file_id: fileId,
        file_path: "/path/to/file.mp4",
        browser_thumbnail: {
          path: "/cache/thumb.jpg",
          base64_data: "backend-base64-data",
          timestamp: 1234567890,
          width: 320,
          height: 180,
        },
        timeline_previews: [],
        recognition_frames: [],
        last_updated: new Date().toISOString(),
      }

      vi.mocked(indexedDBCacheService.getCachedPreview).mockResolvedValue(null)
      mockGetPreviewData.mockResolvedValue(backendData)

      const { result } = renderHook(() => useMediaPreview())

      const data = await act(async () => {
        return result.current.getPreviewData(fileId)
      })

      expect(indexedDBCacheService.getCachedPreview).toHaveBeenCalledWith(fileId)
      expect(mockGetPreviewData).toHaveBeenCalledWith(fileId)
      expect(indexedDBCacheService.cachePreview).toHaveBeenCalledWith(fileId, "backend-base64-data")
      expect(data).toEqual(backendData)
    })

    it("should handle backend errors gracefully", async () => {
      const fileId = "test-file-789"
      const errorMsg = "Failed to fetch preview"

      vi.mocked(indexedDBCacheService.getCachedPreview).mockResolvedValue(null)
      mockGetPreviewData.mockRejectedValue(new Error(errorMsg))

      const onError = vi.fn()
      const { result } = renderHook(() => useMediaPreview({ onError }))

      const data = await act(async () => {
        return result.current.getPreviewData(fileId)
      })

      expect(data).toBeNull()
      expect(result.current.error).toBe(errorMsg)
      expect(onError).toHaveBeenCalledWith(errorMsg)
    })
  })

  describe("generateThumbnail", () => {
    it("should cache generated thumbnail", async () => {
      const fileId = "test-file-gen"
      const thumbnailData = {
        path: "/cache/generated.jpg",
        base64_data: "generated-base64-data",
        timestamp: 0,
        width: 160,
        height: 90,
      }

      mockGenerateThumbnail.mockResolvedValue(thumbnailData)

      const { result } = renderHook(() => useMediaPreview())

      const thumbnail = await act(async () => {
        return result.current.generateThumbnail(fileId, "/path/to/file.mp4", 160, 90)
      })

      expect(mockGenerateThumbnail).toHaveBeenCalledWith(fileId, "/path/to/file.mp4", 160, 90, 0)
      expect(indexedDBCacheService.cachePreview).toHaveBeenCalledWith(fileId, "generated-base64-data")
      expect(thumbnail).toEqual(thumbnailData)
    })

    it("should notify callback when thumbnail is generated", async () => {
      const fileId = "test-file-callback"
      const thumbnailData = {
        path: "/cache/generated.jpg",
        base64_data: "generated-base64-data",
        timestamp: 0,
        width: 160,
        height: 90,
      }

      mockGenerateThumbnail.mockResolvedValue(thumbnailData)
      const onThumbnailGenerated = vi.fn()

      const { result } = renderHook(() => useMediaPreview({ onThumbnailGenerated }))

      await act(async () => {
        await result.current.generateThumbnail(fileId, "/path/to/file.mp4", 160, 90)
      })

      expect(onThumbnailGenerated).toHaveBeenCalledWith(fileId, thumbnailData)
    })
  })

  describe("clearPreviewData", () => {
    it("should clear preview from backend and IndexedDB", async () => {
      const fileId = "test-file-clear"

      mockClearPreviewData.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMediaPreview())

      const success = await act(async () => {
        return result.current.clearPreviewData(fileId)
      })

      expect(mockClearPreviewData).toHaveBeenCalledWith(fileId)
      expect(indexedDBCacheService.deletePreview).toHaveBeenCalledWith(fileId)
      expect(success).toBe(true)
    })

    it("should handle clear errors", async () => {
      const fileId = "test-file-clear-error"
      const errorMsg = "Failed to clear"

      mockClearPreviewData.mockRejectedValue(new Error(errorMsg))

      const { result } = renderHook(() => useMediaPreview())

      const success = await act(async () => {
        return result.current.clearPreviewData(fileId)
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe(errorMsg)
    })
  })

  describe("caching behavior", () => {
    it("should not cache if thumbnail has no base64 data", async () => {
      const fileId = "test-no-base64"
      const thumbnailData = {
        path: "/cache/generated.jpg",
        base64_data: undefined, // No base64 data
        timestamp: 0,
        width: 160,
        height: 90,
      }

      mockGenerateThumbnail.mockResolvedValue(thumbnailData)

      const { result } = renderHook(() => useMediaPreview())

      await act(async () => {
        await result.current.generateThumbnail(fileId, "/path/to/file.mp4", 160, 90)
      })

      expect(indexedDBCacheService.cachePreview).not.toHaveBeenCalled()
    })

    it("should handle cache hits and misses correctly", async () => {
      const fileId = "test-caching"

      // Test cache hit - should return cached data without calling backend
      vi.mocked(indexedDBCacheService.getCachedPreview).mockResolvedValue("cached-data")
      const { result } = renderHook(() => useMediaPreview())

      const cachedResult = await act(async () => {
        return result.current.getPreviewData(fileId)
      })

      // Verify cache was checked
      expect(indexedDBCacheService.getCachedPreview).toHaveBeenCalledWith(fileId)
      // Verify backend was NOT called (cache hit)
      expect(mockGetPreviewData).not.toHaveBeenCalled()
      // Verify we got the cached data
      expect(cachedResult?.browser_thumbnail?.base64_data).toBe("cached-data")

      // Reset mocks for cache miss test
      vi.clearAllMocks()

      // Test cache miss - should call backend and cache the result
      vi.mocked(indexedDBCacheService.getCachedPreview).mockResolvedValue(null)
      mockGetPreviewData.mockResolvedValue({
        file_id: fileId,
        file_path: "/path/to/file.mp4",
        browser_thumbnail: {
          path: "/cache/thumb.jpg",
          base64_data: "new-data",
          timestamp: 0,
          width: 320,
          height: 180,
        },
        timeline_previews: [],
        recognition_frames: [],
        last_updated: new Date().toISOString(),
      })

      const backendResult = await act(async () => {
        return result.current.getPreviewData(fileId)
      })

      // Verify cache was checked
      expect(indexedDBCacheService.getCachedPreview).toHaveBeenCalledWith(fileId)
      // Verify backend WAS called (cache miss)
      expect(mockGetPreviewData).toHaveBeenCalledWith(fileId)
      // Verify result was cached
      expect(indexedDBCacheService.cachePreview).toHaveBeenCalledWith(fileId, "new-data")
      // Verify we got the backend data
      expect(backendResult?.browser_thumbnail?.base64_data).toBe("new-data")
    })
  })
})
