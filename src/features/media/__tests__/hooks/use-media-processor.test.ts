import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { type DiscoveredFile, useMediaProcessor } from "@/features/media/hooks/use-media-processor"
import type { MediaFile } from "@/features/media/types/media"

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
}))

// Mock metadata cache service
vi.mock("@/features/video-compiler/services/metadata-cache-service", () => ({
  cacheMediaMetadata: vi.fn(),
  getCachedMetadata: vi.fn(),
}))

vi.mock("@/types/media", () => ({
  metadataToMediaFileFields: vi.fn(),
}))

describe("useMediaProcessor", () => {
  let mockInvoke: ReturnType<typeof vi.fn>
  let mockListen: ReturnType<typeof vi.fn>
  let mockCacheMediaMetadata: ReturnType<typeof vi.fn>
  let mockGetCachedMetadata: ReturnType<typeof vi.fn>

  const mockMediaFile: MediaFile = {
    id: "test-file-123",
    path: "/path/to/test/video.mp4",
    name: "video.mp4",
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

    const tauriCore = await import("@tauri-apps/api/core")
    const tauriEvent = await import("@tauri-apps/api/event")
    const metadataCache = await import("@/features/video-compiler/services/metadata-cache-service")

    mockInvoke = vi.mocked(tauriCore.invoke)
    mockListen = vi.mocked(tauriEvent.listen)
    mockCacheMediaMetadata = vi.mocked(metadataCache.cacheMediaMetadata)
    mockGetCachedMetadata = vi.mocked(metadataCache.getCachedMetadata)

    // Default mock return for listen
    mockListen.mockReturnValue(Promise.resolve(() => {}))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("event handling", () => {
    it("should handle FilesDiscovered event", async () => {
      const onFilesDiscovered = vi.fn()
      let eventCallback: any

      mockListen.mockImplementation((eventName, callback) => {
        if (eventName === "media-processor") {
          eventCallback = callback
        }
        return Promise.resolve(() => {})
      })

      renderHook(() => useMediaProcessor({ onFilesDiscovered }))

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
      let eventCallback: any

      mockListen.mockImplementation((eventName, callback) => {
        if (eventName === "media-processor") {
          eventCallback = callback
        }
        return Promise.resolve(() => {})
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
      let eventCallback: any

      mockListen.mockImplementation((eventName, callback) => {
        if (eventName === "media-processor") {
          eventCallback = callback
        }
        return Promise.resolve(() => {})
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
      let eventCallback: any

      mockListen.mockImplementation((eventName, callback) => {
        if (eventName === "media-processor") {
          eventCallback = callback
        }
        return Promise.resolve(() => {})
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
      let eventCallback: any

      mockListen.mockImplementation((eventName, callback) => {
        if (eventName === "media-processor") {
          eventCallback = callback
        }
        return Promise.resolve(() => {})
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
      mockListen.mockResolvedValue(unlistenFn)

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
      mockInvoke.mockResolvedValue(mockFiles)

      const { result } = renderHook(() => useMediaProcessor())

      expect(result.current.isProcessing).toBe(false)

      let files: MediaFile[] = []
      await act(async () => {
        files = await result.current.scanFolder("/path/to/folder")
      })

      expect(mockInvoke).toHaveBeenCalledWith("scan_media_folder", {
        folderPath: "/path/to/folder",
      })
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
      mockInvoke.mockReturnValue(scanPromise)

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
      mockInvoke.mockRejectedValue(error)

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
      mockInvoke.mockResolvedValue(mockFiles)

      const { result } = renderHook(() => useMediaProcessor())

      let files: MediaFile[] = []
      await act(async () => {
        files = await result.current.scanFolderWithThumbnails("/path/to/folder", 640, 360)
      })

      expect(mockInvoke).toHaveBeenCalledWith("scan_media_folder_with_thumbnails", {
        folderPath: "/path/to/folder",
        width: 640,
        height: 360,
      })
      expect(files).toEqual(mockFiles)
    })

    it("should use default thumbnail dimensions", async () => {
      mockInvoke.mockResolvedValue([])

      const { result } = renderHook(() => useMediaProcessor())

      await act(async () => {
        await result.current.scanFolderWithThumbnails("/path/to/folder")
      })

      expect(mockInvoke).toHaveBeenCalledWith("scan_media_folder_with_thumbnails", {
        folderPath: "/path/to/folder",
        width: 320,
        height: 180,
      })
    })
  })

  describe("processFiles", () => {
    it("should process files successfully", async () => {
      const mockFiles: MediaFile[] = [mockMediaFile]
      const filePaths = ["/path/to/file1.mp4", "/path/to/file2.mp4"]

      mockGetCachedMetadata.mockResolvedValue(null)
      mockInvoke.mockResolvedValue(mockFiles)

      const { result } = renderHook(() => useMediaProcessor())

      let files: MediaFile[] = []
      await act(async () => {
        files = await result.current.processFiles(filePaths)
      })

      expect(mockInvoke).toHaveBeenCalledWith("process_media_files", {
        filePaths,
      })
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

      mockInvoke.mockResolvedValue([])

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
      mockInvoke.mockRejectedValue(error)
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

      mockInvoke.mockResolvedValue(mockFiles)

      const { result } = renderHook(() => useMediaProcessor())

      let files: MediaFile[] = []
      await act(async () => {
        files = await result.current.processFilesWithThumbnails(filePaths, 640, 360)
      })

      expect(mockInvoke).toHaveBeenCalledWith("process_media_files_with_thumbnails", {
        filePaths,
        width: 640,
        height: 360,
      })
      expect(files).toEqual(mockFiles)
    })
  })

  describe("clearErrors", () => {
    it("should clear all errors", async () => {
      let eventCallback: any

      mockListen.mockImplementation((eventName, callback) => {
        if (eventName === "media-processor") {
          eventCallback = callback
        }
        return Promise.resolve(() => {})
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
      mockInvoke.mockResolvedValue(undefined)

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

      expect(mockInvoke).toHaveBeenCalledWith("cancel_media_processing")
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.progress).toEqual({ current: 0, total: 0 })
    })

    it("should handle cancel errors gracefully", async () => {
      const error = new Error("Cancel failed")
      mockInvoke.mockRejectedValue(error)

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const { result } = renderHook(() => useMediaProcessor())

      await act(async () => {
        await result.current.cancelProcessing()
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to cancel processing:", error)

      consoleErrorSpy.mockRestore()
    })
  })

  describe("parseFrameRate helper", () => {
    it("should parse various frame rate formats", async () => {
      let eventCallback: any

      mockListen.mockImplementation((eventName, callback) => {
        if (eventName === "media-processor") {
          eventCallback = callback
        }
        return Promise.resolve(() => {})
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
