import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaFile } from "@/domains/media-management"
import { MediaType } from "@/domains/media-management"
import { type DiscoveredFile, useMediaProcessor } from "@/domains/media-management/hooks/use-media-processor"

// Create mock event service
const mockUnlisten = vi.fn()
const mockEventListen = vi.fn()

// Mock @/core container
vi.mock("@/core", () => ({
  container: {
    hasEvent: vi.fn(() => true),
    getEvent: vi.fn(() => ({
      listen: mockEventListen,
      emit: vi.fn(),
      once: vi.fn(),
    })),
    hasBackend: vi.fn(() => true),
    getBackend: vi.fn(() => ({
      invoke: vi.fn(),
    })),
  },
}))

// Mock domain service
vi.mock("@/domains/media-management/services/media-processor-service", () => ({
  mediaProcessorService: {
    scanFolder: vi.fn(),
    scanFolderWithThumbnails: vi.fn(),
    processFiles: vi.fn(),
    processFilesWithThumbnails: vi.fn(),
    cancelProcessing: vi.fn(),
  },
}))

// Mock metadata cache service
vi.mock("@/domains/video-editing/services/compiler/metadata-cache-service", () => ({
  cacheMediaMetadata: vi.fn(),
  getCachedMetadata: vi.fn(),
}))

vi.mock("@/types/media", () => ({
  metadataToMediaFileFields: vi.fn(),
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => {
  const mockLogger = {
    errorSync: vi.fn(),
    infoSync: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }
  return {
    createLogger: vi.fn(() => mockLogger),
    mockLogger,
  }
})

// Import mocked service
import { mediaProcessorService } from "@/domains/media-management/services/media-processor-service"

const mockMediaProcessorService = vi.mocked(mediaProcessorService)

describe("useMediaProcessor", () => {
  let mockCacheMediaMetadata: ReturnType<typeof vi.fn>
  let mockGetCachedMetadata: ReturnType<typeof vi.fn>

  const mockMediaFile: MediaFile = {
    id: "test-file-123",
    path: "/path/to/test/video.mp4",
    name: "video.mp4",
    type: MediaType.Video,
    size: 1024 * 1024 * 10, // 10MB
    duration: 120.5,
    isVideo: true,
    isAudio: false,
    isImage: false,
    probeData: {
      streams: [
        {
          codec_type: "video",
          codec_name: "h264",
          width: 1920,
          height: 1080,
          r_frame_rate: "30/1",
        },
        {
          codec_type: "audio",
          codec_name: "aac",
        },
      ],
      format: {
        bit_rate: 1000000,
      },
    },
  }

  const mockDiscoveredFiles: DiscoveredFile[] = [
    {
      id: "file-1",
      path: "/path/to/file1.mp4",
      name: "file1.mp4",
      extension: "mp4",
      size: 1024 * 1024,
    },
    {
      id: "file-2",
      path: "/path/to/file2.mov",
      name: "file2.mov",
      extension: "mov",
      size: 2048 * 1024,
    },
  ]

  beforeEach(async () => {
    vi.clearAllMocks()

    const metadataCache = await import("@/domains/video-editing/services/compiler/metadata-cache-service")

    mockCacheMediaMetadata = vi.mocked(metadataCache.cacheMediaMetadata)
    mockGetCachedMetadata = vi.mocked(metadataCache.getCachedMetadata)

    // Default mock return for event listen
    mockEventListen.mockImplementation(() => Promise.resolve(mockUnlisten))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("event handling", () => {
    it("should handle FilesDiscovered event", async () => {
      const onFilesDiscovered = vi.fn()
      let eventCallback: (event: any) => void = () => {}

      mockEventListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === "media-processor") {
          eventCallback = callback
        }
        return Promise.resolve(mockUnlisten)
      })

      renderHook(() => useMediaProcessor({ onFilesDiscovered }))

      // Wait for event listener setup
      await waitFor(() => expect(mockEventListen).toHaveBeenCalled())

      // Simulate FilesDiscovered event
      await act(async () => {
        eventCallback({
          payload: {
            type: "FilesDiscovered",
            data: {
              files: mockDiscoveredFiles,
              total: 2,
            },
          },
        })
      })

      expect(onFilesDiscovered).toHaveBeenCalledWith(mockDiscoveredFiles)
    })

    it("should handle MetadataReady event and cache metadata", async () => {
      const onMetadataReady = vi.fn()
      let eventCallback: (event: any) => void = () => {}

      mockEventListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === "media-processor") {
          eventCallback = callback
        }
        return Promise.resolve(mockUnlisten)
      })

      renderHook(() => useMediaProcessor({ onMetadataReady }))

      // Simulate MetadataReady event
      await act(async () => {
        eventCallback({
          payload: {
            type: "MetadataReady",
            data: {
              file_id: "test-file-123",
              file_path: "/path/to/test/video.mp4",
              metadata: mockMediaFile,
            },
          },
        })
      })

      expect(onMetadataReady).toHaveBeenCalledWith("test-file-123", mockMediaFile)

      // Wait for async caching
      await waitFor(() => {
        expect(mockCacheMediaMetadata).toHaveBeenCalledWith(
          "/path/to/test/video.mp4",
          expect.objectContaining({
            file_path: "/path/to/test/video.mp4",
            duration: 120.5,
            resolution: [1920, 1080],
            fps: 30,
            video_codec: "h264",
            audio_codec: "aac",
          }),
        )
      })
    })

    it("should handle ThumbnailReady event", async () => {
      const onThumbnailReady = vi.fn()
      let eventCallback: (event: any) => void = () => {}

      mockEventListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === "media-processor") {
          eventCallback = callback
        }
        return Promise.resolve(mockUnlisten)
      })

      renderHook(() => useMediaProcessor({ onThumbnailReady }))

      // Simulate ThumbnailReady event
      await act(async () => {
        eventCallback({
          payload: {
            type: "ThumbnailReady",
            data: {
              file_id: "test-file-123",
              file_path: "/path/to/test/video.mp4",
              thumbnail_path: "/thumbnails/test-file-123.jpg",
              thumbnail_data: "base64_thumbnail_data",
            },
          },
        })
      })

      expect(onThumbnailReady).toHaveBeenCalledWith(
        "test-file-123",
        "/thumbnails/test-file-123.jpg",
        "base64_thumbnail_data",
      )
    })

    it("should handle ProcessingError event", async () => {
      const onError = vi.fn()
      let eventCallback: (event: any) => void = () => {}

      mockEventListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === "media-processor") {
          eventCallback = callback
        }
        return Promise.resolve(mockUnlisten)
      })

      const { result } = renderHook(() => useMediaProcessor({ onError }))

      // Simulate ProcessingError event
      await act(async () => {
        eventCallback({
          payload: {
            type: "ProcessingError",
            data: {
              file_id: "test-file-123",
              file_path: "/path/to/test/video.mp4",
              error: "Failed to process file",
            },
          },
        })
      })

      expect(onError).toHaveBeenCalledWith("test-file-123", "Failed to process file")
      expect(result.current.errors.get("test-file-123")).toBe("Failed to process file")
    })

    it("should handle ScanProgress event", async () => {
      const onProgress = vi.fn()
      let eventCallback: (event: any) => void = () => {}

      mockEventListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === "media-processor") {
          eventCallback = callback
        }
        return Promise.resolve(mockUnlisten)
      })

      const { result } = renderHook(() => useMediaProcessor({ onProgress }))

      // Simulate ScanProgress event
      await act(async () => {
        eventCallback({
          payload: {
            type: "ScanProgress",
            data: {
              current: 5,
              total: 10,
            },
          },
        })
      })

      expect(onProgress).toHaveBeenCalledWith(5, 10)
      expect(result.current.progress).toEqual({ current: 5, total: 10 })
    })

    it("should cleanup event listener on unmount", async () => {
      const unlistenFn = vi.fn()
      mockEventListen.mockResolvedValue(unlistenFn)

      const { unmount } = renderHook(() => useMediaProcessor())

      unmount()

      await waitFor(() => {
        expect(unlistenFn).toHaveBeenCalled()
      })
    })
  })

  describe("scanFolder", () => {
    it("should scan folder successfully", async () => {
      const mockFiles: MediaFile[] = [mockMediaFile]
      mockMediaProcessorService.scanFolder.mockResolvedValue(mockFiles)

      const { result } = renderHook(() => useMediaProcessor())

      expect(result.current.isProcessing).toBe(false)

      let files: MediaFile[] = []
      await act(async () => {
        files = await result.current.scanFolder("/path/to/folder")
      })

      expect(mockMediaProcessorService.scanFolder).toHaveBeenCalledWith("/path/to/folder")
      expect(files).toEqual(mockFiles)
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.errors.size).toBe(0)
      expect(result.current.progress).toEqual({ current: 0, total: 0 })
    })

    it("should set isProcessing state correctly", async () => {
      let resolveScan: (value: MediaFile[]) => void
      const scanPromise = new Promise<MediaFile[]>((resolve) => {
        resolveScan = resolve
      })
      mockMediaProcessorService.scanFolder.mockReturnValue(scanPromise)

      const { result } = renderHook(() => useMediaProcessor())

      // Start scanning
      act(() => {
        void result.current.scanFolder("/path/to/folder")
      })

      // Check isProcessing is true
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true)
      })

      // Resolve the promise
      await act(async () => {
        resolveScan!([mockMediaFile])
      })

      // Check isProcessing is back to false
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })
    })

    it("should handle scan errors", async () => {
      const error = new Error("Scan failed")
      mockMediaProcessorService.scanFolder.mockRejectedValue(error)

      const { result } = renderHook(() => useMediaProcessor())

      await expect(
        act(async () => {
          await result.current.scanFolder("/path/to/folder")
        }),
      ).rejects.toThrow("Scan failed")

      expect(result.current.isProcessing).toBe(false)
    })
  })

  describe("scanFolderWithThumbnails", () => {
    it("should scan folder with thumbnails successfully", async () => {
      const mockFiles: MediaFile[] = [mockMediaFile]
      mockMediaProcessorService.scanFolderWithThumbnails.mockResolvedValue(mockFiles)

      const { result } = renderHook(() => useMediaProcessor())

      let files: MediaFile[] = []
      await act(async () => {
        files = await result.current.scanFolderWithThumbnails("/path/to/folder", 640, 360)
      })

      expect(mockMediaProcessorService.scanFolderWithThumbnails).toHaveBeenCalledWith("/path/to/folder", 640, 360)
      expect(files).toEqual(mockFiles)
    })

    it("should use default thumbnail dimensions", async () => {
      mockMediaProcessorService.scanFolderWithThumbnails.mockResolvedValue([])

      const { result } = renderHook(() => useMediaProcessor())

      await act(async () => {
        await result.current.scanFolderWithThumbnails("/path/to/folder")
      })

      expect(mockMediaProcessorService.scanFolderWithThumbnails).toHaveBeenCalledWith("/path/to/folder", 320, 180)
    })
  })

  describe("processFiles", () => {
    it("should process files successfully", async () => {
      const mockFiles: MediaFile[] = [mockMediaFile]
      const filePaths = ["/path/to/file1.mp4", "/path/to/file2.mp4"]

      mockGetCachedMetadata.mockResolvedValue(null)
      mockMediaProcessorService.processFiles.mockResolvedValue(mockFiles)

      const { result } = renderHook(() => useMediaProcessor())

      let files: MediaFile[] = []
      await act(async () => {
        files = await result.current.processFiles(filePaths)
      })

      expect(mockMediaProcessorService.processFiles).toHaveBeenCalledWith(filePaths)
      expect(files).toEqual(mockFiles)
      expect(result.current.progress.total).toBe(2)
    })

    it("should check cache before processing", async () => {
      const filePaths = ["/path/to/file1.mp4", "/path/to/file2.mp4"]
      const cachedMetadata = {
        file_path: "/path/to/file1.mp4",
        duration: 60,
        cached_at: new Date().toISOString(),
      }

      mockGetCachedMetadata.mockResolvedValueOnce(cachedMetadata).mockResolvedValueOnce(null)

      mockMediaProcessorService.processFiles.mockResolvedValue([])

      const { result } = renderHook(() => useMediaProcessor())

      await act(async () => {
        await result.current.processFiles(filePaths)
      })

      expect(mockGetCachedMetadata).toHaveBeenCalledTimes(2)
      expect(mockGetCachedMetadata).toHaveBeenCalledWith("/path/to/file1.mp4")
      expect(mockGetCachedMetadata).toHaveBeenCalledWith("/path/to/file2.mp4")
    })

    it("should handle process errors", async () => {
      const error = new Error("Process failed")
      mockMediaProcessorService.processFiles.mockRejectedValue(error)
      mockGetCachedMetadata.mockResolvedValue(null)

      const { result } = renderHook(() => useMediaProcessor())

      await expect(
        act(async () => {
          await result.current.processFiles(["/path/to/file.mp4"])
        }),
      ).rejects.toThrow("Process failed")

      expect(result.current.isProcessing).toBe(false)
    })
  })

  describe("processFilesWithThumbnails", () => {
    it("should process files with thumbnails successfully", async () => {
      const mockFiles: MediaFile[] = [mockMediaFile]
      const filePaths = ["/path/to/file1.mp4"]

      mockMediaProcessorService.processFilesWithThumbnails.mockResolvedValue(mockFiles)

      const { result } = renderHook(() => useMediaProcessor())

      let files: MediaFile[] = []
      await act(async () => {
        files = await result.current.processFilesWithThumbnails(filePaths, 640, 360)
      })

      expect(mockMediaProcessorService.processFilesWithThumbnails).toHaveBeenCalledWith(filePaths, 640, 360)
      expect(files).toEqual(mockFiles)
    })
  })

  describe("clearErrors", () => {
    it("should clear all errors", async () => {
      let eventCallback: (event: any) => void = () => {}

      mockEventListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === "media-processor") {
          eventCallback = callback
        }
        return Promise.resolve(mockUnlisten)
      })

      const { result } = renderHook(() => useMediaProcessor())

      // Add some errors
      await act(async () => {
        eventCallback({
          payload: {
            type: "ProcessingError",
            data: {
              file_id: "file-1",
              file_path: "/path/to/file1.mp4",
              error: "Error 1",
            },
          },
        })
        eventCallback({
          payload: {
            type: "ProcessingError",
            data: {
              file_id: "file-2",
              file_path: "/path/to/file2.mp4",
              error: "Error 2",
            },
          },
        })
      })

      expect(result.current.errors.size).toBe(2)

      // Clear errors
      act(() => {
        result.current.clearErrors()
      })

      expect(result.current.errors.size).toBe(0)
    })
  })

  describe("cancelProcessing", () => {
    it("should cancel processing successfully", async () => {
      let resolveScan: (value: MediaFile[]) => void
      const scanPromise = new Promise<MediaFile[]>((resolve) => {
        resolveScan = resolve
      })
      mockMediaProcessorService.scanFolder.mockReturnValue(scanPromise)
      mockMediaProcessorService.cancelProcessing.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMediaProcessor())

      // Set some state
      act(() => {
        void result.current.scanFolder("/path/to/folder")
      })

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true)
      })

      // Cancel processing
      await act(async () => {
        await result.current.cancelProcessing()
      })

      expect(mockMediaProcessorService.cancelProcessing).toHaveBeenCalled()
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.progress).toEqual({ current: 0, total: 0 })
    })

    it("should handle cancel errors gracefully", async () => {
      const error = new Error("Cancel failed")
      mockMediaProcessorService.cancelProcessing.mockRejectedValue(error)

      const { result } = renderHook(() => useMediaProcessor())

      await act(async () => {
        await result.current.cancelProcessing()
      })

      // Note: Logger error would be called but we don't have access to the mock instance here
      // This is expected behavior - the error is logged but processing continues
    })
  })

  describe("parseFrameRate helper", () => {
    it("should parse various frame rate formats", async () => {
      let eventCallback: (event: any) => void = () => {}

      mockEventListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === "media-processor") {
          eventCallback = callback
        }
        return Promise.resolve(mockUnlisten)
      })

      renderHook(() => useMediaProcessor())

      // Test various frame rate formats
      const testCases = [
        { r_frame_rate: "30/1", expected: 30 },
        { r_frame_rate: "24000/1001", expected: 23.976 }, // ~23.976
        { r_frame_rate: "25", expected: 25 },
        { r_frame_rate: undefined, expected: undefined },
      ]

      for (const testCase of testCases) {
        const metadata = {
          ...mockMediaFile,
          probeData: {
            ...mockMediaFile.probeData,
            streams: [
              {
                codec_type: "video",
                codec_name: "h264",
                width: 1920,
                height: 1080,
                r_frame_rate: testCase.r_frame_rate,
              },
            ],
          },
        }

        await act(async () => {
          eventCallback({
            payload: {
              type: "MetadataReady",
              data: {
                file_id: "test-file",
                file_path: "/path/to/video.mp4",
                metadata,
              },
            },
          })
        })

        await waitFor(() => {
          if (testCase.expected !== undefined) {
            expect(mockCacheMediaMetadata).toHaveBeenCalledWith(
              expect.any(String),
              expect.objectContaining({
                fps: testCase.expected === 23.976 ? expect.closeTo(23.976, 3) : testCase.expected,
              }),
            )
          }
        })

        mockCacheMediaMetadata.mockClear()
      }
    })
  })
})
