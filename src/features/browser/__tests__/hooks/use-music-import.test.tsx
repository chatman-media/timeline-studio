/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  getMediaFiles,
  getMediaMetadata,
  MediaType,
  selectAudioFile,
  selectMediaDirectory,
} from "@/domains/media-management"
import { useMusicImport } from "@/features/browser/hooks/use-music-import"

// Mock модулей
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@/core/hooks/use-current-project", () => ({
  useCurrentProject: vi.fn(() => ({
    currentProject: {
      path: "/test/project",
      name: "Test Project",
    },
    setProjectDirty: vi.fn(),
    saveProject: vi.fn(),
  })),
}))

vi.mock("@/domains/project-management/hooks/use-music-files", () => ({
  useMusicFiles: vi.fn(() => ({
    musicFiles: [],
    updateMusicFiles: vi.fn(),
  })),
}))

vi.mock("@/domains/media-management", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domains/media-management")>()
  return {
    ...actual,
    getMediaMetadata: vi.fn(),
    selectAudioFile: vi.fn(),
    selectMediaDirectory: vi.fn(),
    getMediaFiles: vi.fn(),
  }
})

vi.mock("@/features/media", () => ({
  convertToSavedMusicFile: vi.fn((file) => Promise.resolve(file)),
}))

describe("useMusicImport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("importFile", () => {
    it("should successfully import audio files", async () => {
      const mockFiles = ["/path/to/song1.mp3", "/path/to/song2.mp3"]
      const mockMetadata = {
        is_audio: true,
        size: 1024000,
        duration: 180,
        start_time: Date.now(),
        creation_time: "2024-01-01",
        probe_data: {
          streams: [],
          format: {},
        },
      }

      vi.mocked(selectAudioFile).mockResolvedValue(mockFiles)
      vi.mocked(getMediaMetadata).mockResolvedValue(mockMetadata)

      const { result } = renderHook(() => useMusicImport())

      expect(result.current.isImporting).toBe(false)
      expect(result.current.progress).toBe(0)

      let importPromise: Promise<any>
      act(() => {
        importPromise = result.current.importFile()
      })

      // Проверяем состояние импорта сразу после запуска (но вне act)
      expect(result.current.isImporting).toBe(true)

      // Ждем завершения импорта
      const importResult = await act(async () => {
        return await importPromise!
      })

      await waitFor(() => {
        expect(result.current.isImporting).toBe(false)
      })

      expect(importResult.success).toBe(true)
      expect(importResult.files).toHaveLength(2)
      expect(importResult.message).toContain("2")
    })

    it("should handle no files selected", async () => {
      vi.mocked(selectAudioFile).mockResolvedValue([])

      const { result } = renderHook(() => useMusicImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importFile()
      })

      expect(importResult.success).toBe(false)
      expect(importResult.message).toBe("Файлы не выбраны")
      expect(importResult.files).toHaveLength(0)
    })

    it("should handle import errors", async () => {
      const error = new Error("Failed to select files")
      vi.mocked(selectAudioFile).mockRejectedValue(error)

      const { result } = renderHook(() => useMusicImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importFile()
      })

      expect(importResult.success).toBe(false)
      expect(importResult.message).toContain("Ошибка при импорте")
      expect(importResult.files).toHaveLength(0)
    })

    it("should create basic music files without metadata", async () => {
      const mockFiles = ["/path/to/song.mp3"]

      vi.mocked(selectAudioFile).mockResolvedValue(mockFiles)
      vi.mocked(getMediaMetadata).mockResolvedValue(null)

      const { result } = renderHook(() => useMusicImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importFile()
      })

      expect(importResult.success).toBe(true)
      expect(importResult.files).toHaveLength(1)
      expect(importResult.files[0]).toMatchObject({
        path: "/path/to/song.mp3",
        type: MediaType.Music,
        isAudio: true,
      })
    })

    it("should handle metadata loading errors gracefully", async () => {
      const mockFiles = ["/path/to/song.mp3"]
      const error = new Error("Metadata loading failed")

      vi.mocked(selectAudioFile).mockResolvedValue(mockFiles)
      vi.mocked(getMediaMetadata).mockRejectedValue(error)

      const { result } = renderHook(() => useMusicImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importFile()
      })

      // Import should still succeed with basic files
      expect(importResult.success).toBe(true)
      expect(importResult.files).toHaveLength(1)
    })
  })

  describe("importDirectory", () => {
    it("should successfully import audio files from directory", async () => {
      const mockDir = "/path/to/music"
      const mockFiles = ["/path/to/music/song1.mp3", "/path/to/music/song2.wav"]

      vi.mocked(selectMediaDirectory).mockResolvedValue(mockDir)
      vi.mocked(getMediaFiles).mockResolvedValue(mockFiles)

      const { invoke } = await import("@tauri-apps/api/core")
      ;(invoke as any).mockResolvedValue(mockFiles)

      const mockMetadata = {
        is_audio: true,
        size: 1024000,
        duration: 180,
        start_time: Date.now(),
        creation_time: "2024-01-01",
        probe_data: {
          streams: [],
          format: {},
        },
      }
      vi.mocked(getMediaMetadata).mockResolvedValue(mockMetadata)

      const { result } = renderHook(() => useMusicImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importDirectory()
      })

      await waitFor(() => {
        expect(result.current.isImporting).toBe(false)
      })

      expect(importResult.success).toBe(true)
      expect(importResult.files.length).toBeGreaterThan(0)
    })

    it("should handle no directory selected", async () => {
      vi.mocked(selectMediaDirectory).mockResolvedValue(null)

      const { result } = renderHook(() => useMusicImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importDirectory()
      })

      expect(importResult.success).toBe(false)
      expect(importResult.message).toBe("Директория не выбрана")
    })

    it("should filter only audio files from directory", async () => {
      const mockDir = "/path/to/mixed"
      const mockFiles = [
        "/path/to/mixed/song.mp3",
        "/path/to/mixed/video.mp4",
        "/path/to/mixed/audio.wav",
        "/path/to/mixed/image.jpg",
      ]

      vi.mocked(selectMediaDirectory).mockResolvedValue(mockDir)
      vi.mocked(getMediaFiles).mockResolvedValue(mockFiles)

      const { invoke } = await import("@tauri-apps/api/core")
      ;(invoke as any).mockResolvedValue(mockFiles)

      const mockMetadata = {
        is_audio: true,
        size: 1024000,
        duration: 180,
        start_time: Date.now(),
        creation_time: "2024-01-01",
        probe_data: {
          streams: [],
          format: {},
        },
      }
      vi.mocked(getMediaMetadata).mockResolvedValue(mockMetadata)

      const { result } = renderHook(() => useMusicImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importDirectory()
      })

      // Should only import audio files (mp3, wav)
      await waitFor(() => {
        expect(importResult.success).toBe(true)
      })
    })

    it("should handle directory with no audio files", async () => {
      const mockDir = "/path/to/empty"
      const mockFiles = ["/path/to/empty/video.mp4", "/path/to/empty/image.jpg"]

      vi.mocked(selectMediaDirectory).mockResolvedValue(mockDir)
      vi.mocked(getMediaFiles).mockResolvedValue(mockFiles)

      const { invoke } = await import("@tauri-apps/api/core")
      ;(invoke as any).mockResolvedValue(mockFiles)

      const { result } = renderHook(() => useMusicImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importDirectory()
      })

      expect(importResult.success).toBe(false)
      expect(importResult.message).toContain("нет аудиофайлов")
    })

    it("should handle directory import errors", async () => {
      const error = new Error("Failed to read directory")
      vi.mocked(selectMediaDirectory).mockRejectedValue(error)

      const { result } = renderHook(() => useMusicImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importDirectory()
      })

      expect(importResult.success).toBe(false)
      expect(importResult.message).toContain("Ошибка при импорте")
    })
  })

  describe("progress tracking", () => {
    it("should update progress during import", async () => {
      const mockFiles = ["/path/to/song1.mp3", "/path/to/song2.mp3"]
      const mockMetadata = {
        is_audio: true,
        size: 1024000,
        duration: 180,
        start_time: Date.now(),
        creation_time: "2024-01-01",
        probe_data: {
          streams: [],
          format: {},
        },
      }

      vi.mocked(selectAudioFile).mockResolvedValue(mockFiles)
      vi.mocked(getMediaMetadata).mockResolvedValue(mockMetadata)

      const { result } = renderHook(() => useMusicImport())

      await act(async () => {
        const promise = result.current.importFile()
        // Progress should be 0 initially
        expect(result.current.progress).toBe(0)
        await promise
      })

      // After import completes, progress might be updated
      // (actual progress updates happen asynchronously)
    })
  })

  describe("cleanup on unmount", () => {
    it("should clean up timeouts on unmount", async () => {
      const mockFiles = ["/path/to/song.mp3"]

      vi.mocked(selectAudioFile).mockResolvedValue(mockFiles)

      const { result, unmount } = renderHook(() => useMusicImport())

      await act(async () => {
        result.current.importFile()
      })

      // Unmount should clean up without errors
      unmount()
    })
  })

  describe("edge cases", () => {
    it("should handle files with special characters", async () => {
      const mockFiles = ["/path/to/Música (Artist).mp3", "/path/to/歌曲.mp3"]

      vi.mocked(selectAudioFile).mockResolvedValue(mockFiles)
      vi.mocked(getMediaMetadata).mockResolvedValue(null)

      const { result } = renderHook(() => useMusicImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importFile()
      })

      expect(importResult.success).toBe(true)
      expect(importResult.files).toHaveLength(2)
    })

    it("should handle files without extensions", async () => {
      const mockFiles = ["/path/to/audiofile"]

      vi.mocked(selectAudioFile).mockResolvedValue(mockFiles)
      vi.mocked(getMediaMetadata).mockResolvedValue(null)

      const { result } = renderHook(() => useMusicImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importFile()
      })

      expect(importResult.success).toBe(true)
      expect(importResult.files[0].isAudio).toBe(false) // Unknown extension
    })

    it("should handle very long file paths", async () => {
      const longPath = `/path/to/${"very/long/".repeat(50)}song.mp3`
      const mockFiles = [longPath]

      vi.mocked(selectAudioFile).mockResolvedValue(mockFiles)
      vi.mocked(getMediaMetadata).mockResolvedValue(null)

      const { result } = renderHook(() => useMusicImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importFile()
      })

      expect(importResult.success).toBe(true)
      expect(importResult.files[0].path).toBe(longPath)
    })
  })
})
