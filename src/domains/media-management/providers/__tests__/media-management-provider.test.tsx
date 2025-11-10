/**
 * MediaManagementProvider Integration Tests
 *
 * Интеграционные тесты для MediaManagementProvider
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockVideoMetadata } from "../../__mocks__"
import { useMediaManagement } from "../../hooks/use-media-management"
import { MediaManagementProvider } from "../media-management-provider"

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))
vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: vi.fn(() => ({
    onStateChange: vi.fn(() => () => {}),
    executeCommand: vi.fn().mockResolvedValue({ id: "media-1", path: "/test/video.mp4" }),
    getProjectState: vi.fn().mockResolvedValue({
      project: {
        media_pool: {
          items: {},
        },
      },
    }),
  })),
}))
vi.mock("@/features/media/services/media-api", () => ({
  selectMediaFile: vi.fn().mockResolvedValue(["/test/video.mp4"]),
  selectAudioFile: vi.fn().mockResolvedValue(["/test/audio.mp3"]),
}))
vi.mock("../../services/media-metadata-service", () => ({
  getMediaMetadataService: vi.fn(() => ({
    extractMetadata: vi.fn().mockResolvedValue({
      type: "Video",
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 120.5,
      codec: "h264",
      bitrate: 5000000,
      hasAudio: true,
      audioCodec: "aac",
      audioSampleRate: 48000,
      audioChannels: 2,
    }),
  })),
}))

describe("MediaManagementProvider", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MediaManagementProvider>{children}</MediaManagementProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("provider initialization", () => {
    it("should provide context value", () => {
      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      expect(result.current).toBeDefined()
      expect(result.current.isReady).toBe(true)
    })

    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

      expect(() => {
        renderHook(() => useMediaManagement())
      }).toThrow("useMediaManagement must be used within MediaManagementProvider")

      consoleError.mockRestore()
    })

    it("should have initial state", () => {
      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.isReady).toBe(true)
    })
  })

  describe("importFiles", () => {
    it("should import files successfully", async () => {
      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      let importResults: any[] = []

      await act(async () => {
        importResults = await result.current.importFiles(["/test/video.mp4"], {
          copyToProject: true,
          createProxies: false,
          analyzeContent: true,
          generateThumbnails: true,
          preserveMetadata: true,
        })
      })

      expect(importResults).toBeDefined()
      expect(importResults.length).toBeGreaterThan(0)
    })

    it("should set loading state during import", async () => {
      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      act(() => {
        result.current.importFiles(["/test/video.mp4"], {
          copyToProject: true,
          createProxies: false,
          analyzeContent: true,
          generateThumbnails: true,
          preserveMetadata: true,
        })
      })

      // Should be loading
      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should handle import errors", async () => {
      const getBackendSync = await import("@/features/app-state/services/backend-sync")
      vi.mocked(getBackendSync.getBackendSync).mockReturnValue({
        onStateChange: vi.fn(() => () => {}),
        executeCommand: vi.fn().mockRejectedValue(new Error("Import failed")),
        getProjectState: vi.fn().mockResolvedValue({ project: { media_pool: { items: {} } } }),
      } as any)

      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      // importFiles не выбрасывает ошибку - она продолжает импорт остальных файлов
      // Проверим, что результат пустой массив при ошибке
      const importResults = await result.current.importFiles(["/test/video.mp4"], {
        copyToProject: true,
        createProxies: false,
        analyzeContent: true,
        generateThumbnails: true,
        preserveMetadata: true,
      })

      expect(importResults).toEqual([])
      expect(result.current.error).toBe(null) // error сбрасывается при начале импорта
    })

    it("should handle partial import failures", async () => {
      const getBackendSync = await import("@/features/app-state/services/backend-sync")

      let callCount = 0
      vi.mocked(getBackendSync.getBackendSync).mockReturnValue({
        onStateChange: vi.fn(() => () => {}),
        executeCommand: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 2) {
            return Promise.reject(new Error("Second file failed"))
          }
          return Promise.resolve({ id: `media-${callCount}`, path: `/test/video${callCount}.mp4` })
        }),
        getProjectState: vi.fn().mockResolvedValue({ project: { media_pool: { items: {} } } }),
      } as any)

      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      let importResults: any[] = []

      await act(async () => {
        importResults = await result.current.importFiles(["/test/video1.mp4", "/test/video2.mp4", "/test/video3.mp4"], {
          copyToProject: true,
          createProxies: false,
          analyzeContent: true,
          generateThumbnails: true,
          preserveMetadata: true,
        })
      })

      // Should complete with results for successful imports only
      expect(importResults.length).toBe(2)
    })

    it("should detect media type from file extension", async () => {
      const getBackendSync = await import("@/features/app-state/services/backend-sync")
      const mockExecuteCommand = vi.fn().mockResolvedValue({ id: "media-1" })

      vi.mocked(getBackendSync.getBackendSync).mockReturnValue({
        onStateChange: vi.fn(() => () => {}),
        executeCommand: mockExecuteCommand,
        getProjectState: vi.fn().mockResolvedValue({ project: { media_pool: { items: {} } } }),
      } as any)

      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      await act(async () => {
        await result.current.importFiles(["/test/video.mp4"], {
          copyToProject: true,
          createProxies: false,
          analyzeContent: true,
          generateThumbnails: true,
          preserveMetadata: true,
        })
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "AddMedia",
        }),
      )
    })
  })

  describe("selectMediaFiles", () => {
    it("should select media files", async () => {
      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      let selectedFiles: string[] | null = null

      await act(async () => {
        selectedFiles = await result.current.selectMediaFiles()
      })

      expect(selectedFiles).toEqual(["/test/video.mp4"])
    })
  })

  describe("selectAudioFiles", () => {
    it("should select audio files", async () => {
      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      let selectedFiles: string[] | null = null

      await act(async () => {
        selectedFiles = await result.current.selectAudioFiles()
      })

      expect(selectedFiles).toEqual(["/test/audio.mp3"])
    })
  })

  describe("getMediaInfo", () => {
    it("should get media info from backend", async () => {
      const getBackendSync = await import("@/features/app-state/services/backend-sync")
      vi.mocked(getBackendSync.getBackendSync).mockReturnValue({
        onStateChange: vi.fn(() => () => {}),
        executeCommand: vi.fn(),
        getProjectState: vi.fn().mockResolvedValue({
          project: {
            media_pool: {
              items: {
                "media-1": {
                  id: "media-1",
                  path: "/test/video.mp4",
                  name: "video.mp4",
                  media_type: "Video",
                  duration: 120.5,
                  thumbnail: "/tmp/thumb.jpg",
                },
              },
            },
          },
        }),
      } as any)

      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      let mediaInfo: any = null

      await act(async () => {
        mediaInfo = await result.current.getMediaInfo("/test/video.mp4")
      })

      expect(mediaInfo).toEqual({
        path: "/test/video.mp4",
        name: "video.mp4",
        type: "Video",
        duration: 120.5,
        thumbnailPath: "/tmp/thumb.jpg",
      })
    })

    it("should return basic info if file not in backend", async () => {
      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      let mediaInfo: any = null

      await act(async () => {
        mediaInfo = await result.current.getMediaInfo("/test/unknown.mp4")
      })

      expect(mediaInfo).toEqual({
        path: "/test/unknown.mp4",
        name: "unknown.mp4",
        type: "Video",
      })
    })

    it("should handle errors gracefully", async () => {
      const getBackendSync = await import("@/features/app-state/services/backend-sync")
      vi.mocked(getBackendSync.getBackendSync).mockReturnValue({
        onStateChange: vi.fn(() => () => {}),
        executeCommand: vi.fn(),
        getProjectState: vi.fn().mockRejectedValue(new Error("Backend error")),
      } as any)

      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      let mediaInfo: any = null

      await act(async () => {
        mediaInfo = await result.current.getMediaInfo("/test/video.mp4")
      })

      // Should still return basic info
      expect(mediaInfo).toBeDefined()
      expect(mediaInfo.path).toBe("/test/video.mp4")
    })
  })

  describe("extractMetadata", () => {
    beforeEach(async () => {
      // Reset backend sync mock to default for this describe block
      const getBackendSync = await import("@/features/app-state/services/backend-sync")
      vi.mocked(getBackendSync.getBackendSync).mockReturnValue({
        onStateChange: vi.fn(() => () => {}),
        executeCommand: vi.fn().mockResolvedValue({ id: "media-1", path: "/test/video.mp4" }),
        getProjectState: vi.fn().mockResolvedValue({
          project: {
            media_pool: {
              items: {},
            },
          },
        }),
      } as any)
    })

    it("should extract metadata successfully", async () => {
      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      let metadata: any = null

      await act(async () => {
        metadata = await result.current.extractMetadata("/test/video.mp4")
      })

      expect(metadata).toEqual(mockVideoMetadata)
    })

    it("should set loading state during extraction", async () => {
      const { getMediaMetadataService } = await import("../../services/media-metadata-service")
      vi.mocked(getMediaMetadataService).mockReturnValue({
        extractMetadata: vi
          .fn()
          .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(mockVideoMetadata), 100))),
      } as any)

      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      act(() => {
        result.current.extractMetadata("/test/video.mp4")
      })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should handle metadata extraction errors", async () => {
      const { getMediaMetadataService } = await import("../../services/media-metadata-service")
      vi.mocked(getMediaMetadataService).mockReturnValue({
        extractMetadata: vi.fn().mockRejectedValue(new Error("Extraction failed")),
      } as any)

      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      await expect(result.current.extractMetadata("/test/video.mp4")).rejects.toThrow("Extraction failed")

      await waitFor(() => {
        expect(result.current.error).toBe("Extraction failed")
      })
    })
  })

  describe("backend sync integration", () => {
    it("should subscribe to backend state changes", async () => {
      const getBackendSync = await import("@/features/app-state/services/backend-sync")
      const mockOnStateChange = vi.fn(() => () => {})

      vi.mocked(getBackendSync.getBackendSync).mockReturnValue({
        onStateChange: mockOnStateChange,
        executeCommand: vi.fn(),
        getProjectState: vi.fn().mockResolvedValue({ project: { media_pool: { items: {} } } }),
      } as any)

      renderHook(() => useMediaManagement(), { wrapper })

      expect(mockOnStateChange).toHaveBeenCalled()
    })

    it("should update file operations on backend state change", async () => {
      const getBackendSync = await import("@/features/app-state/services/backend-sync")
      let stateChangeCallback: any = null

      vi.mocked(getBackendSync.getBackendSync).mockReturnValue({
        onStateChange: vi.fn((callback) => {
          stateChangeCallback = callback
          return () => {}
        }),
        executeCommand: vi.fn(),
        getProjectState: vi.fn().mockResolvedValue({ project: { media_pool: { items: {} } } }),
      } as any)

      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      // Trigger state change
      act(() => {
        if (stateChangeCallback) {
          stateChangeCallback({
            project: {
              media_pool: {
                items: {
                  "media-1": {
                    id: "media-1",
                    path: "/test/video.mp4",
                    name: "video.mp4",
                    media_type: "Video",
                  },
                },
              },
            },
          })
        }
      })

      await waitFor(() => {
        expect(result.current.fileOperationsState.operations).toHaveLength(1)
      })
    })
  })

  describe("media type detection", () => {
    it("should detect video file types", async () => {
      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      const videoFiles = [
        "/test/video.mp4",
        "/test/video.avi",
        "/test/video.mkv",
        "/test/video.mov",
        "/test/video.webm",
      ]

      for (const file of videoFiles) {
        const info = await result.current.getMediaInfo(file)
        expect(info.type).toBe("Video")
      }
    })

    it("should detect audio file types", async () => {
      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      const audioFiles = [
        "/test/audio.mp3",
        "/test/audio.wav",
        "/test/audio.ogg",
        "/test/audio.flac",
        "/test/audio.aac",
      ]

      for (const file of audioFiles) {
        const info = await result.current.getMediaInfo(file)
        expect(info.type).toBe("Audio")
      }
    })

    it("should detect image file types", async () => {
      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      const imageFiles = [
        "/test/image.jpg",
        "/test/image.jpeg",
        "/test/image.png",
        "/test/image.gif",
        "/test/image.webp",
      ]

      for (const file of imageFiles) {
        const info = await result.current.getMediaInfo(file)
        expect(info.type).toBe("Image")
      }
    })

    it("should return Unknown for unrecognized types", async () => {
      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      const info = await result.current.getMediaInfo("/test/file.xyz")
      expect(info.type).toBe("Unknown")
    })
  })
})
