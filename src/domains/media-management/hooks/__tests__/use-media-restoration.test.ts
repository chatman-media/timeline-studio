import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMediaRestoration } from "@/domains/media-management/hooks/use-media-restoration"
import type { MediaFile } from "@/domains/media-management"
import type { SavedMediaFile, SavedMusicFile } from "@/domains/media-management"

// Мокаем MediaRestorationService
vi.mock("@/domains/media-management/services/media-restoration-service", () => ({
  restoreProjectMedia: vi.fn(),
  generateRestorationReport: vi.fn(),
}))

// Мокаем useModals from new modal architecture
vi.mock("@/domains/system-integration", () => ({
  useModals: vi.fn(() => ({
    activeModal: "none",
    modalData: null,
    isModalOpen: false,
    openModal: vi.fn(),
    closeModal: vi.fn(),
    submitModal: vi.fn(),
    openCameraCapture: vi.fn(),
    openVoiceRecording: vi.fn(),
    openExport: vi.fn(),
    openProjectSettings: vi.fn(),
    openUserSettings: vi.fn(),
    openKeyboardShortcuts: vi.fn(),
    openColorGrading: vi.fn(),
    openEffectDetail: vi.fn(),
  })),
}))

// Мокаем tauri-logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

const { restoreProjectMedia, generateRestorationReport } = await import(
  "@/domains/media-management/services/media-restoration-service"
)
const mockRestoreProjectMedia = vi.mocked(restoreProjectMedia)
const mockGenerateRestorationReport = vi.mocked(generateRestorationReport)

describe("useMediaRestoration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockMediaFiles: SavedMediaFile[] = [
    {
      id: "media-1",
      originalPath: "/path/video.mp4",
      name: "video.mp4",
      size: 1024,
      lastModified: Date.now(),
      isVideo: true,
      isAudio: false,
      isImage: false,
      metadata: { duration: 120 },
      status: "unknown",
      lastChecked: Date.now(),
    },
  ]

  const mockMusicFiles: SavedMusicFile[] = [
    {
      id: "music-1",
      originalPath: "/path/song.mp3",
      name: "song.mp3",
      size: 512,
      lastModified: Date.now(),
      isVideo: false,
      isAudio: true,
      isImage: false,
      metadata: { duration: 180 },
      musicMetadata: { artist: "Test Artist" },
      status: "unknown",
      lastChecked: Date.now(),
    },
  ]

  const mockRestorationResult = {
    restoredMedia: [{ id: "media-1", name: "video.mp4" } as MediaFile],
    restoredMusic: [{ id: "music-1", name: "song.mp3" } as MediaFile],
    missingFiles: [],
    relocatedFiles: [],
    corruptedFiles: [],
    stats: {
      total: 2,
      restored: 2,
      missing: 0,
      relocated: 0,
      corrupted: 0,
    },
  }

  it("должен инициализироваться с правильным начальным состоянием", () => {
    const { result } = renderHook(() => useMediaRestoration())

    expect(result.current.state.isRestoring).toBe(false)
    expect(result.current.state.progress).toBe(0)
    expect(result.current.state.phase).toBe("completed")
    expect(result.current.showMissingFilesDialog).toBe(false)
    expect(result.current.restorationResult).toBeNull()
  })

  it("должен восстанавливать медиафайлы проекта", async () => {
    mockRestoreProjectMedia.mockResolvedValue(mockRestorationResult)

    const { result } = renderHook(() => useMediaRestoration())

    let restorationPromise: Promise<any>

    act(() => {
      restorationPromise = result.current.restoreProjectMedia(mockMediaFiles, mockMusicFiles, "/project/path.tls")
    })

    // Проверяем состояние во время восстановления
    expect(result.current.state.isRestoring).toBe(true)
    expect(result.current.state.phase).toBe("scanning")

    const restorationResponse = await restorationPromise!

    await waitFor(() => {
      expect(result.current.state.isRestoring).toBe(false)
      expect(result.current.state.phase).toBe("completed")
    })

    expect(restorationResponse.restoredMedia).toHaveLength(1)
    expect(restorationResponse.restoredMusic).toHaveLength(1)
    expect(restorationResponse.needsUserInput).toBe(false)
    expect(mockRestoreProjectMedia).toHaveBeenCalledWith(mockMediaFiles, mockMusicFiles, "/project/path.tls")
  })

  it("должен показывать диалог для отсутствующих файлов", async () => {
    const resultWithMissingFiles = {
      ...mockRestorationResult,
      missingFiles: [mockMediaFiles[0]],
      stats: {
        ...mockRestorationResult.stats,
        missingFiles: 1,
        foundFiles: 1,
      },
    }

    mockRestoreProjectMedia.mockResolvedValue(resultWithMissingFiles)

    const { result } = renderHook(() => useMediaRestoration())

    await act(async () => {
      await result.current.restoreProjectMedia(mockMediaFiles, mockMusicFiles, "/project/path.tls", {
        showDialog: true,
      })
    })

    await waitFor(() => {
      expect(result.current.showMissingFilesDialog).toBe(true)
      expect(result.current.getMissingFiles()).toHaveLength(1)
    })
  })

  it("должен обрабатывать разрешение отсутствующих файлов", async () => {
    const resultWithMissingFiles = {
      ...mockRestorationResult,
      missingFiles: [mockMediaFiles[0]],
    }

    mockRestoreProjectMedia.mockResolvedValue(resultWithMissingFiles)

    const { result } = renderHook(() => useMediaRestoration())

    // Сначала восстанавливаем с отсутствующими файлами
    await act(async () => {
      await result.current.restoreProjectMedia(mockMediaFiles, mockMusicFiles, "/project/path.tls", {
        showDialog: true,
      })
    })

    // Затем разрешаем отсутствующие файлы
    await act(async () => {
      await result.current.handleMissingFilesResolution([
        {
          file: mockMediaFiles[0],
          newPath: "/new/path/video.mp4",
          action: "found",
        },
      ])
    })

    await waitFor(() => {
      expect(result.current.showMissingFilesDialog).toBe(false)
    })
  })

  it("должен отменять диалог отсутствующих файлов", async () => {
    const resultWithMissingFiles = {
      ...mockRestorationResult,
      missingFiles: [mockMediaFiles[0]],
    }

    mockRestoreProjectMedia.mockResolvedValue(resultWithMissingFiles)

    const { result } = renderHook(() => useMediaRestoration())

    await act(async () => {
      await result.current.restoreProjectMedia(mockMediaFiles, mockMusicFiles, "/project/path.tls", {
        showDialog: true,
      })
    })

    act(() => {
      result.current.cancelMissingFilesDialog()
    })

    expect(result.current.showMissingFilesDialog).toBe(false)
  })

  it("должен сбрасывать состояние восстановления", async () => {
    mockRestoreProjectMedia.mockResolvedValue(mockRestorationResult)

    const { result } = renderHook(() => useMediaRestoration())

    await act(async () => {
      await result.current.restoreProjectMedia(mockMediaFiles, mockMusicFiles, "/project/path.tls")
    })

    act(() => {
      result.current.resetRestoration()
    })

    expect(result.current.state.isRestoring).toBe(false)
    expect(result.current.state.progress).toBe(0)
    expect(result.current.state.phase).toBe("completed")
    expect(result.current.restorationResult).toBeNull()
  })

  it("должен обрабатывать ошибки восстановления", async () => {
    const error = new Error("Restoration failed")
    mockRestoreProjectMedia.mockRejectedValue(error)

    const { result } = renderHook(() => useMediaRestoration())

    await act(async () => {
      try {
        await result.current.restoreProjectMedia(mockMediaFiles, mockMusicFiles, "/project/path.tls")
      } catch (e) {
        // Ожидаем ошибку
      }
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe("error")
      expect(result.current.state.error).toContain("Restoration failed")
    })
  })

  it("должен генерировать отчет о восстановлении", async () => {
    mockRestoreProjectMedia.mockResolvedValue(mockRestorationResult)
    mockGenerateRestorationReport.mockReturnValue("Restoration completed successfully")

    const { result } = renderHook(() => useMediaRestoration())

    await act(async () => {
      await result.current.restoreProjectMedia(mockMediaFiles, mockMusicFiles, "/project/path.tls")
    })

    const report = result.current.getRestorationReport()
    expect(report).toBe("Restoration completed successfully")
  })

  it("должен возвращать статистику восстановления", async () => {
    mockRestoreProjectMedia.mockResolvedValue(mockRestorationResult)

    const { result } = renderHook(() => useMediaRestoration())

    await act(async () => {
      await result.current.restoreProjectMedia(mockMediaFiles, mockMusicFiles, "/project/path.tls")
    })

    const stats = result.current.getRestorationStats()
    expect(stats).toEqual(mockRestorationResult.stats)
  })

  it("должен возвращать перемещенные файлы", async () => {
    const resultWithRelocated = {
      ...mockRestorationResult,
      relocatedFiles: [
        {
          original: mockMediaFiles[0],
          newPath: "/new/path/video.mp4",
        },
      ],
    }

    mockRestoreProjectMedia.mockResolvedValue(resultWithRelocated)

    const { result } = renderHook(() => useMediaRestoration())

    await act(async () => {
      await result.current.restoreProjectMedia(mockMediaFiles, mockMusicFiles, "/project/path.tls")
    })

    const relocatedFiles = result.current.getRelocatedFiles()
    expect(relocatedFiles).toHaveLength(1)
    expect(relocatedFiles[0].newPath).toBe("/new/path/video.mp4")
  })
})
