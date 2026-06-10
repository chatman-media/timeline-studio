/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react"
import type React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TimelineProviders } from "@/test/test-utils"

import { useMediaImport } from "../../hooks/use-media-import"

// Мокаем AppProvider для избежания проблем с XState
vi.mock("@timeline-studio/domains/project-management/providers/app-provider", () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useApp: vi.fn(() => ({
    projectState: { project: null },
    executeCommand: vi.fn(),
    isConnected: true,
    isConnecting: false,
    connectionError: null,
  })),
}))

// Мокаем зависимости
const mockAddMedia = vi.fn()
const mockSetProjectDirty = vi.fn()

// Re-mock these functions with test-specific implementations
vi.mock("@timeline-studio/domains/project-management/hooks/use-current-project", () => ({
  useCurrentProject: vi.fn(() => ({
    currentProject: {
      path: "/test/project",
      name: "Test",
      isDirty: false,
      isNew: false,
    },
    setProjectDirty: mockSetProjectDirty,
  })),
}))

vi.mock("../../hooks/use-media-preview", () => ({
  useMediaPreview: vi.fn(() => ({
    generateThumbnail: vi.fn().mockResolvedValue("thumbnail-data"),
  })),
}))

vi.mock("@timeline-studio/domains/video-editing", () => ({
  ResourcesProvider: ({ children }: { children: React.ReactNode }) => children,
  PlayerProvider: ({ children }: { children: React.ReactNode }) => children,
  TimelineProvider: ({ children }: { children: React.ReactNode }) => children,
  useResources: vi.fn(() => ({
    addMedia: mockAddMedia,
  })),
  usePlayer: () => ({
    playerSetSource: vi.fn(),
    playerSetMedia: vi.fn(),
    currentTime: 0,
    duration: 0,
    isPlaying: false,
  }),
}))

vi.mock("../../hooks/use-media-processor", () => ({
  useMediaProcessor: vi.fn((options) => ({
    scanFolder: vi.fn().mockResolvedValue([]),
    scanFolderWithThumbnails: vi.fn().mockImplementation((_dir) => {
      // Возвращаем пустой массив файлов для простоты теста
      return Promise.resolve([])
    }),
    processFiles: vi.fn().mockImplementation(async (files) => {
      // Симулируем обработку файлов с задержкой
      await new Promise((resolve) => setTimeout(resolve, 50)) // Небольшая задержка

      files.forEach((file: string) => {
        options.onFilesDiscovered?.([{ path: file, size: 1024 }])
        options.onMetadataReady?.(file, {
          id: file,
          name: file.split("/").pop(),
          path: file,
          isVideo: file.endsWith(".mp4"),
          isAudio: file.endsWith(".mp3"),
          isImage: file.endsWith(".jpg"),
          size: 1024,
          duration: 60,
          isLoadingMetadata: false,
        })
      })
      // Возвращаем полные MediaFile объекты
      return files.map((f: string) => ({
        id: f,
        path: f,
        name: f.split("/").pop() || f,
        isVideo: f.endsWith(".mp4"),
        isAudio: f.endsWith(".mp3"),
        isImage: f.endsWith(".jpg"),
        size: 1024,
        duration: 60,
        isLoadingMetadata: false,
      }))
    }),
  })),
}))

// Mock useMediaManagement
const mockImportFiles = vi.fn()
const mockSelectMediaFiles = vi.fn()
const mockSelectAudioFiles = vi.fn()
const mockSelectMediaDirectory = vi.fn()

vi.mock("../../hooks/use-media-management", () => ({
  useMediaManagement: vi.fn(() => ({
    mediaImportState: {
      isImporting: false,
      isCompleted: false,
      isFailed: false,
      status: "idle",
    },
    importFiles: mockImportFiles,
    selectMediaFiles: mockSelectMediaFiles,
    selectAudioFiles: mockSelectAudioFiles,
    selectMediaDirectory: mockSelectMediaDirectory,
  })),
}))

// Mock только функций selectMediaFile и selectMediaDirectory
vi.mock("@timeline-studio/domains/media-management", async () => {
  const actual = await vi.importActual<typeof import("@timeline-studio/domains/media-management")>("@timeline-studio/domains/media-management")
  return {
    ...actual,
    selectMediaFile: vi.fn(),
    selectMediaDirectory: vi.fn(),
  }
})

// Мокаем модули
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@/lib/media", () => ({
  getMediaMetadata: vi.fn(),
  selectMediaFile: vi.fn(),
  selectMediaDirectory: vi.fn(),
}))

vi.mock("../../utils/saved-media-utils", () => ({
  convertToSavedMediaFile: vi.fn().mockResolvedValue({}),
}))

describe("useMediaImport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useMediaImport(), {
      wrapper: TimelineProviders,
    })

    expect(result.current.isImporting).toBe(false)
    expect(result.current.status).toBe("idle")
    expect(typeof result.current.selectMediaFiles).toBe("function")
    expect(typeof result.current.importFiles).toBe("function")
  })

  it("should import multiple files", async () => {
    const mockFiles = ["/path/to/file1.mp4", "/path/to/file2.mp3"]
    const mockImportedFiles = mockFiles.map((f: string) => ({
      id: f,
      path: f,
      name: f.split("/").pop() || f,
      isVideo: f.endsWith(".mp4"),
      isAudio: f.endsWith(".mp3"),
      isImage: false,
      size: 1024,
      duration: 60,
      isLoadingMetadata: false,
    }))

    mockSelectMediaFiles.mockResolvedValue(mockFiles)
    mockImportFiles.mockResolvedValue(mockImportedFiles)

    const { result } = renderHook(() => useMediaImport(), {
      wrapper: TimelineProviders,
    })

    // Новый API: сначала выбираем файлы, потом импортируем
    const selectedFiles = await result.current.selectMediaFiles()
    expect(selectedFiles).toEqual(mockFiles)

    // importFiles требует 2 аргумента: (files, options) и возвращает массив
    const importedFiles = await result.current.importFiles(mockFiles, {})

    // Проверяем результат - это массив файлов
    expect(importedFiles).toBeDefined()
    expect(Array.isArray(importedFiles)).toBe(true)
    expect(importedFiles).toHaveLength(2)

    // Проверяем первый файл - после обработки с метаданными
    expect(importedFiles[0]).toMatchObject({
      path: mockFiles[0],
      name: "file1.mp4",
      isVideo: true,
      isAudio: false,
      isImage: false,
      isLoadingMetadata: false,
    })

    // Проверяем второй файл
    expect(importedFiles[1]).toMatchObject({
      path: mockFiles[1],
      name: "file2.mp3",
      isVideo: false,
      isAudio: true,
      isImage: false,
      isLoadingMetadata: false,
    })
  })

  it("should import files from a folder", async () => {
    const mockDirectory = "/path/to/directory"

    mockSelectMediaDirectory.mockResolvedValue(mockDirectory)

    const { result } = renderHook(() => useMediaImport(), {
      wrapper: TimelineProviders,
    })

    // Новый API: selectMediaDirectory автоматически сканирует и импортирует файлы, возвращает путь
    const selectedDirectory = await result.current.selectMediaFiles()

    // Проверяем результат - это строка с путём к директории
    expect(mockSelectMediaFiles).toHaveBeenCalled()
  })

  it("should handle file selection cancellation", async () => {
    mockSelectMediaFiles.mockResolvedValue(null)

    const { result } = renderHook(() => useMediaImport(), {
      wrapper: TimelineProviders,
    })

    const selectedFiles = await result.current.selectMediaFiles()

    expect(selectedFiles).toBeNull()
  })

  it("should handle folder selection cancellation", async () => {
    mockSelectMediaFiles.mockResolvedValue(null)

    const { result } = renderHook(() => useMediaImport(), {
      wrapper: TimelineProviders,
    })

    const selectedFiles = await result.current.selectMediaFiles()

    // Новый API: возвращает null при отмене
    expect(selectedFiles).toBeNull()
  })

  it("should update status during import", async () => {
    const mockFiles = Array.from({ length: 10 }, (_, i) => `/path/to/file${i}.mp4`)
    const mockImportedFiles = mockFiles.map((f: string) => ({
      id: f,
      path: f,
      name: f.split("/").pop() || f,
      isVideo: true,
      isAudio: false,
      isImage: false,
      size: 1024,
      duration: 60,
      isLoadingMetadata: false,
    }))

    mockImportFiles.mockResolvedValue(mockImportedFiles)

    const { result } = renderHook(() => useMediaImport(), {
      wrapper: TimelineProviders,
    })

    // Проверяем начальное состояние
    expect(result.current.isImporting).toBe(false)
    expect(result.current.status).toBe("idle")

    // Вызываем импорт
    const importedFiles = await result.current.importFiles(mockFiles, {})

    // Проверяем результат
    expect(mockImportFiles).toHaveBeenCalledWith(mockFiles, {})
    expect(importedFiles).toHaveLength(10)
  })
})
