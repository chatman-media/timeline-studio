/**
 * MediaManagementProvider Integration Tests
 *
 * Интеграционные тесты для MediaManagementProvider
 * Теперь провайдер использует MediaManagementOrchestrator
 */

import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useMediaManagement } from "../../hooks/use-media-management"
import { MediaManagementProvider } from "../media-management-provider"

// Mock orchestrator state
const mockMediaPool = new Map<string, any>()
const mockIsLoading = false
const mockError: string | null = null
const mockFileOperationsState = {
  activeOperations: [],
  completedOperations: [],
  failedOperations: [],
}
const mockMediaImportState = {
  files: [],
  options: {},
  operations: [],
  currentOperation: null,
  totalProgress: 0,
  errors: [],
}

// Mock orchestrator methods
const mockImportFiles = vi.fn().mockImplementation(async (files: string[]) => {
  return files.map((path, index) => ({
    id: `media-${index + 1}`,
    path,
    name: path.split("/").pop() || "",
    type: "Video" as const,
  }))
})
const mockSelectMediaFiles = vi.fn().mockResolvedValue(["/test/video.mp4"])
const mockSelectAudioFiles = vi.fn().mockResolvedValue(["/test/audio.mp3"])
const mockSelectMediaDirectory = vi.fn().mockResolvedValue("/test/directory")
const mockGetMediaInfo = vi.fn().mockImplementation(async (path: string) => {
  const name = path.split("/").pop() || ""
  const ext = name.split(".").pop()?.toLowerCase() || ""

  let type: string = "Unknown"
  if (["mp4", "avi", "mkv", "mov", "webm"].includes(ext)) type = "Video"
  else if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext)) type = "Audio"
  else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) type = "Image"

  return { path, name, type }
})
const mockExtractMetadata = vi.fn().mockResolvedValue({
  type: "Video",
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 120.5,
  codec: "h264",
  bitrate: 5_000_000,
  hasAudio: true,
  audioCodec: "aac",
  audioChannels: 2,
  audioSampleRate: 48000,
})

const mockSubscribeToFileOperations = vi.fn(() => ({ unsubscribe: vi.fn() }))
const mockSubscribeToMediaImport = vi.fn(() => ({ unsubscribe: vi.fn() }))

const mockOrchestrator = {
  getMediaPool: vi.fn(() => mockMediaPool),
  isMediaLoading: vi.fn(() => mockIsLoading),
  getError: vi.fn(() => mockError),
  getFileOperationsState: vi.fn(() => mockFileOperationsState),
  getMediaImportState: vi.fn(() => mockMediaImportState),
  subscribeToFileOperations: mockSubscribeToFileOperations,
  subscribeToMediaImport: mockSubscribeToMediaImport,
  importFiles: mockImportFiles,
  selectMediaFiles: mockSelectMediaFiles,
  selectAudioFiles: mockSelectAudioFiles,
  selectMediaDirectory: mockSelectMediaDirectory,
  getMediaInfo: mockGetMediaInfo,
  extractMetadata: mockExtractMetadata,
  refreshMediaPool: vi.fn().mockResolvedValue(undefined),
}

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    traceSync: vi.fn(),
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

// Mock orchestrator
vi.mock("../../services/media-management-orchestrator", () => ({
  getMediaManagementOrchestrator: vi.fn(() => mockOrchestrator),
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

    it("should call orchestrator importFiles", async () => {
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

      // Verify orchestrator was called
      expect(mockImportFiles).toHaveBeenCalledWith(["/test/video.mp4"], expect.any(Object))
    })

    it("should handle import errors", async () => {
      // Mock orchestrator to return error
      mockImportFiles.mockRejectedValueOnce(new Error("Import failed"))

      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      // importFiles может выбросить ошибку при полной неудаче
      await expect(
        result.current.importFiles(["/test/video.mp4"], {
          copyToProject: true,
          createProxies: false,
          analyzeContent: true,
          generateThumbnails: true,
          preserveMetadata: true,
        }),
      ).rejects.toThrow("Import failed")
    })

    it("should handle partial import failures via orchestrator", async () => {
      // Mock orchestrator to return partial results
      mockImportFiles.mockResolvedValueOnce([
        { id: "media-1", path: "/test/video1.mp4", name: "video1.mp4", type: "Video" },
        { id: "media-3", path: "/test/video3.mp4", name: "video3.mp4", type: "Video" },
      ])

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

    it("should delegate import to orchestrator", async () => {
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

      expect(mockImportFiles).toHaveBeenCalled()
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
    it("should get media info via orchestrator", async () => {
      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      let mediaInfo: any = null

      await act(async () => {
        mediaInfo = await result.current.getMediaInfo("/test/video.mp4")
      })

      expect(mockGetMediaInfo).toHaveBeenCalledWith("/test/video.mp4")
      expect(mediaInfo).toEqual({
        path: "/test/video.mp4",
        name: "video.mp4",
        type: "Video",
      })
    })

    it("should return basic info for unknown file", async () => {
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
      // Mock orchestrator to throw error
      mockGetMediaInfo.mockRejectedValueOnce(new Error("Backend error"))

      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      // getMediaInfo через provider должен пробросить ошибку
      await expect(result.current.getMediaInfo("/test/video.mp4")).rejects.toThrow("Backend error")
    })
  })

  describe("extractMetadata", () => {
    it("should extract metadata via orchestrator", async () => {
      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      let metadata: any = null

      await act(async () => {
        metadata = await result.current.extractMetadata("/test/video.mp4")
      })

      // Verify orchestrator was called
      expect(mockExtractMetadata).toHaveBeenCalledWith("/test/video.mp4")

      // Verify metadata has expected structure
      expect(metadata).toBeDefined()
      expect(metadata.type).toBe("Video")
      expect(metadata.width).toBe(1920)
      expect(metadata.height).toBe(1080)
      expect(metadata.fps).toBe(30)
      expect(metadata.duration).toBe(120.5)
      expect(metadata.codec).toBe("h264")
      expect(metadata.bitrate).toBe(5_000_000)
      expect(metadata.hasAudio).toBe(true)
      expect(metadata.audioCodec).toBe("aac")
      expect(metadata.audioChannels).toBe(2)
      expect(metadata.audioSampleRate).toBe(48000)
    })

    it("should handle metadata extraction errors", async () => {
      // Mock orchestrator to throw error
      mockExtractMetadata.mockRejectedValueOnce(new Error("Extraction failed"))

      const { result } = renderHook(() => useMediaManagement(), { wrapper })

      await expect(result.current.extractMetadata("/test/video.mp4")).rejects.toThrow("Extraction failed")
    })
  })

  describe("orchestrator integration", () => {
    it("should subscribe to file operations via orchestrator", async () => {
      renderHook(() => useMediaManagement(), { wrapper })

      // Verify provider subscribed to orchestrator events
      expect(mockSubscribeToFileOperations).toHaveBeenCalled()
    })

    it("should subscribe to media import via orchestrator", async () => {
      renderHook(() => useMediaManagement(), { wrapper })

      // Verify provider subscribed to orchestrator events
      expect(mockSubscribeToMediaImport).toHaveBeenCalled()
    })

    it("should get initial state from orchestrator", async () => {
      renderHook(() => useMediaManagement(), { wrapper })

      // Verify provider got initial state from orchestrator
      expect(mockOrchestrator.getMediaPool).toHaveBeenCalled()
      expect(mockOrchestrator.isMediaLoading).toHaveBeenCalled()
      expect(mockOrchestrator.getError).toHaveBeenCalled()
      expect(mockOrchestrator.getFileOperationsState).toHaveBeenCalled()
      expect(mockOrchestrator.getMediaImportState).toHaveBeenCalled()
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
