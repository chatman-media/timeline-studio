import type { MediaFile, SavedMediaFile, SavedMusicFile } from "@timeline-studio/domains/media-management"
import {
  generateRestorationReport,
  promptUserToFindFile,
  restoreFile,
  restoreProjectMedia,
} from "@timeline-studio/domains/media-management"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Мокаем модули Tauri
vi.mock("@tauri-apps/api/path", () => ({
  dirname: vi.fn().mockResolvedValue("/project/dir"),
  join: vi.fn().mockImplementation((...args) => args.join("/")),
}))

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}))

// Мокаем утилиты
vi.mock("@timeline-studio/domains/media-management/utils/saved-media-utils", () => ({
  fileExists: vi.fn(),
  validateFileIntegrity: vi.fn(),
  generateAlternativePaths: vi.fn(),
  convertFromSavedMediaFile: vi.fn(),
  getExtensionsForFile: vi.fn(),
}))

// Импортируем замоканные функции
const { fileExists, validateFileIntegrity, generateAlternativePaths, convertFromSavedMediaFile, getExtensionsForFile } =
  await import("@timeline-studio/domains/media-management/utils/saved-media-utils")
const mockFileExists = fileExists as any
const mockValidateFileIntegrity = validateFileIntegrity as any
const mockGenerateAlternativePaths = generateAlternativePaths as any
const mockConvertFromSavedMediaFile = convertFromSavedMediaFile as any
const mockGetExtensionsForFile = getExtensionsForFile as any

describe("MediaRestorationService", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Настройка базовых моков
    mockGetExtensionsForFile.mockReturnValue(["mp4", "avi", "mkv"])
  })

  describe("restoreFile", () => {
    const mockSavedFile: SavedMediaFile = {
      id: "test-id",
      originalPath: "/original/path/video.mp4",
      name: "video.mp4",
      size: 1024,
      lastModified: Date.now(),
      isVideo: true,
      isAudio: false,
      isImage: false,
      metadata: {
        duration: 120,
        probeData: { streams: [], format: {} },
      },
      status: "unknown",
      lastChecked: Date.now(),
    }

    it("должен восстановить файл по оригинальному пути", async () => {
      mockFileExists.mockResolvedValue(true)
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      })
      mockConvertFromSavedMediaFile.mockReturnValue({
        id: "test-id",
        name: "video.mp4",
        path: "/original/path/video.mp4",
      } as MediaFile)

      const result = await restoreFile(mockSavedFile, "/project/dir")

      expect(result.status).toBe("found")
      expect(result.restoredFile).toBeDefined()
      expect(mockFileExists).toHaveBeenCalledWith("/original/path/video.mp4")
    })

    it("должен найти файл по относительному пути", async () => {
      const savedFileWithRelative = {
        ...mockSavedFile,
        relativePath: "media/video.mp4",
      }

      mockFileExists.mockResolvedValueOnce(false) // Оригинальный путь не найден
      mockFileExists.mockResolvedValueOnce(true) // Относительный путь найден
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      })
      mockConvertFromSavedMediaFile.mockReturnValue({
        id: "test-id",
        name: "video.mp4",
        path: "/project/dir/media/video.mp4",
      } as MediaFile)

      const result = await restoreFile(savedFileWithRelative, "/project/dir")

      expect(result.status).toBe("relocated")
      expect(result.newPath).toBe("/project/dir/media/video.mp4")
    })

    it("должен найти файл в альтернативных местах", async () => {
      mockFileExists.mockResolvedValueOnce(false) // Оригинальный путь
      mockFileExists.mockResolvedValueOnce(true) // Альтернативный путь
      mockGenerateAlternativePaths.mockResolvedValue(["/project/dir/video.mp4", "/project/dir/media/video.mp4"])
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      })
      mockConvertFromSavedMediaFile.mockReturnValue({
        id: "test-id",
        name: "video.mp4",
        path: "/project/dir/video.mp4",
      } as MediaFile)

      const result = await restoreFile(mockSavedFile, "/project/dir")

      expect(result.status).toBe("relocated")
      expect(result.newPath).toBe("/project/dir/video.mp4")
    })

    it("должен вернуть missing если файл не найден", async () => {
      mockFileExists.mockResolvedValue(false)
      mockGenerateAlternativePaths.mockResolvedValue([])

      const result = await restoreFile(mockSavedFile, "/project/dir")

      expect(result.status).toBe("missing")
      expect(result.restoredFile).toBeUndefined()
    })

    it("должен обрабатывать ошибки валидации", async () => {
      mockFileExists.mockResolvedValue(true)
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: false,
        confidence: 0.3,
        issues: ["File size mismatch"],
      })

      const result = await restoreFile(mockSavedFile, "/project/dir")

      expect(result.status).toBe("corrupted")
    })

    it("должен обрабатывать ошибки", async () => {
      mockFileExists.mockRejectedValue(new Error("File system error"))

      await expect(restoreFile(mockSavedFile, "/project/dir")).rejects.toThrow("File system error")
    })
  })

  describe("restoreProjectMedia", () => {
    const mockMediaFiles: SavedMediaFile[] = [
      {
        id: "media-1",
        originalPath: "/path/video1.mp4",
        name: "video1.mp4",
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

    it("должен восстановить все файлы проекта", async () => {
      mockFileExists.mockResolvedValue(true)
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      })
      mockConvertFromSavedMediaFile.mockReturnValue({} as MediaFile)

      const result = await restoreProjectMedia(mockMediaFiles, mockMusicFiles, "/project/path.tls")

      expect(result.stats.total).toBe(2)
      expect(result.stats.restored).toBe(2)
      expect(result.stats.missing).toBe(0)
    })

    it("должен обрабатывать отсутствующие файлы", async () => {
      mockFileExists.mockResolvedValue(false)
      mockGenerateAlternativePaths.mockResolvedValue([])

      const result = await restoreProjectMedia(mockMediaFiles, mockMusicFiles, "/project/path.tls")

      expect(result.stats.missing).toBe(2)
      expect(result.missingFiles).toHaveLength(2)
    })

    it("должен генерировать отчет о восстановлении", async () => {
      mockFileExists.mockResolvedValue(true)
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      })
      mockConvertFromSavedMediaFile.mockReturnValue({} as MediaFile)

      const result = await restoreProjectMedia(mockMediaFiles, mockMusicFiles, "/project/path.tls")

      const report = generateRestorationReport(result)

      expect(report).toContain("Восстановление медиафайлов завершено")
      expect(report).toContain("Всего файлов: 2")
      expect(report).toContain("Восстановлено: 2")
    })
  })

  describe("promptUserToFindFile", () => {
    const mockSavedFileForDialog: SavedMediaFile = {
      id: "test-id",
      originalPath: "/original/path/video.mp4",
      name: "video.mp4",
      size: 1024,
      lastModified: Date.now(),
      isVideo: true,
      isAudio: false,
      isImage: false,
      metadata: {
        duration: 120,
        probeData: { streams: [], format: {} },
      },
      status: "unknown",
      lastChecked: Date.now(),
    }

    it("должен открыть диалог выбора файла", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockOpen = vi.mocked(open)

      mockOpen.mockResolvedValue("/new/path/video.mp4")

      const result = await promptUserToFindFile(mockSavedFileForDialog)

      expect(result).toBe("/new/path/video.mp4")
      expect(mockOpen).toHaveBeenCalledWith({
        title: "Найти файл: video.mp4",
        multiple: false,
        filters: expect.any(Array),
      })
    })

    it("должен вернуть null если пользователь отменил", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockOpen = vi.mocked(open)

      mockOpen.mockResolvedValue(null)

      const result = await promptUserToFindFile(mockSavedFileForDialog)

      expect(result).toBeNull()
    })

    it("должен вернуть null если выбранный файл не совпадает с ожидаемым", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockOpen = vi.mocked(open)

      mockOpen.mockResolvedValue("/wrong/path/different.mp4")
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: false,
        confidence: 0.1, // Низкая уверенность
        issues: ["File size mismatch", "Different codec"],
      })

      const result = await promptUserToFindFile(mockSavedFileForDialog)

      expect(result).toBeNull()
    })

    it("должен принять файл с минимальной допустимой уверенностью", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockOpen = vi.mocked(open)

      mockOpen.mockResolvedValue("/similar/path/video.mp4")
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 0.31, // Чуть выше минимального порога 30%
        issues: [],
      })

      const result = await promptUserToFindFile(mockSavedFileForDialog)

      expect(result).toBe("/similar/path/video.mp4")
    })
  })

  describe("Edge Cases", () => {
    it("должен обработать пустой список медиафайлов", async () => {
      const result = await restoreProjectMedia([], [], "/project/file.tls")

      expect(result.stats.total).toBe(0)
      expect(result.stats.restored).toBe(0)
      expect(result.restoredMedia).toHaveLength(0)
      expect(result.restoredMusic).toHaveLength(0)
    })

    it("должен обработать файл с очень длинным путем", async () => {
      const longPath = `/very/long/path/${"nested/".repeat(100)}video.mp4`
      const savedFile: SavedMediaFile = {
        id: "long-path",
        originalPath: longPath,
        name: "video.mp4",
        size: 1024,
        lastModified: Date.now(),
        isVideo: true,
        isAudio: false,
        isImage: false,
        metadata: {
          duration: 120,
          probeData: { streams: [], format: {} },
        },
        status: "unknown",
        lastChecked: Date.now(),
      }

      mockFileExists.mockResolvedValue(true)
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      })
      mockConvertFromSavedMediaFile.mockReturnValue({
        id: "long-path",
        name: "video.mp4",
        path: longPath,
      } as MediaFile)

      const result = await restoreFile(savedFile, "/project/dir")

      expect(result.status).toBe("found")
      expect(mockFileExists).toHaveBeenCalledWith(longPath)
    })

    it("должен обработать файл с специальными символами в пути", async () => {
      const specialPath = "/path/with spaces/and (parentheses)/[brackets]/file@#$.mp4"
      const savedFile: SavedMediaFile = {
        id: "special-chars",
        originalPath: specialPath,
        name: "file@#$.mp4",
        size: 1024,
        lastModified: Date.now(),
        isVideo: true,
        isAudio: false,
        isImage: false,
        metadata: {
          duration: 120,
          probeData: { streams: [], format: {} },
        },
        status: "unknown",
        lastChecked: Date.now(),
      }

      mockFileExists.mockResolvedValue(true)
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      })
      mockConvertFromSavedMediaFile.mockReturnValue({
        id: "special-chars",
        name: "file@#$.mp4",
        path: specialPath,
      } as MediaFile)

      const result = await restoreFile(savedFile, "/project/dir")

      expect(result.status).toBe("found")
    })

    it("должен обработать файл с Unicode символами в имени", async () => {
      const unicodePath = "/path/видео-测试-🎬.mp4"
      const savedFile: SavedMediaFile = {
        id: "unicode",
        originalPath: unicodePath,
        name: "видео-测试-🎬.mp4",
        size: 1024,
        lastModified: Date.now(),
        isVideo: true,
        isAudio: false,
        isImage: false,
        metadata: {
          duration: 120,
          probeData: { streams: [], format: {} },
        },
        status: "unknown",
        lastChecked: Date.now(),
      }

      mockFileExists.mockResolvedValue(true)
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      })
      mockConvertFromSavedMediaFile.mockReturnValue({
        id: "unicode",
        name: "видео-测试-🎬.mp4",
        path: unicodePath,
      } as MediaFile)

      const result = await restoreFile(savedFile, "/project/dir")

      expect(result.status).toBe("found")
    })

    it("должен обработать файл без расширения", async () => {
      const noExtensionFile: SavedMediaFile = {
        id: "no-ext",
        originalPath: "/path/video",
        name: "video",
        size: 1024,
        lastModified: Date.now(),
        isVideo: true,
        isAudio: false,
        isImage: false,
        metadata: {
          duration: 120,
          probeData: { streams: [], format: {} },
        },
        status: "unknown",
        lastChecked: Date.now(),
      }

      mockFileExists.mockResolvedValue(false)
      mockGenerateAlternativePaths.mockResolvedValue([])

      const result = await restoreFile(noExtensionFile, "/project/dir")

      expect(result.status).toBe("missing")
    })

    it("должен обработать файл с размером 0 байт", async () => {
      const zeroSizeFile: SavedMediaFile = {
        id: "zero-size",
        originalPath: "/path/empty.mp4",
        name: "empty.mp4",
        size: 0,
        lastModified: Date.now(),
        isVideo: true,
        isAudio: false,
        isImage: false,
        metadata: {
          duration: 0,
          probeData: { streams: [], format: {} },
        },
        status: "unknown",
        lastChecked: Date.now(),
      }

      mockFileExists.mockResolvedValue(true)
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      })
      mockConvertFromSavedMediaFile.mockReturnValue({
        id: "zero-size",
        name: "empty.mp4",
        path: "/path/empty.mp4",
      } as MediaFile)

      const result = await restoreFile(zeroSizeFile, "/project/dir")

      expect(result.status).toBe("found")
    })

    it("должен обработать очень большой файл", async () => {
      const largeFile: SavedMediaFile = {
        id: "large-file",
        originalPath: "/path/large.mp4",
        name: "large.mp4",
        size: 100 * 1024 * 1024 * 1024, // 100GB
        lastModified: Date.now(),
        isVideo: true,
        isAudio: false,
        isImage: false,
        metadata: {
          duration: 36000, // 10 hours
          probeData: { streams: [], format: {} },
        },
        status: "unknown",
        lastChecked: Date.now(),
      }

      mockFileExists.mockResolvedValue(true)
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      })
      mockConvertFromSavedMediaFile.mockReturnValue({
        id: "large-file",
        name: "large.mp4",
        path: "/path/large.mp4",
      } as MediaFile)

      const result = await restoreFile(largeFile, "/project/dir")

      expect(result.status).toBe("found")
    })

    it("должен обработать смешанный список медиа и музыки", async () => {
      const mediaFiles: SavedMediaFile[] = [
        {
          id: "video1",
          originalPath: "/path/video1.mp4",
          name: "video1.mp4",
          size: 1024,
          lastModified: Date.now(),
          isVideo: true,
          isAudio: false,
          isImage: false,
          metadata: { duration: 120, probeData: { streams: [], format: {} } },
          status: "unknown",
          lastChecked: Date.now(),
        },
      ]

      const musicFiles: SavedMusicFile[] = [
        {
          id: "music1",
          originalPath: "/path/music1.mp3",
          name: "music1.mp3",
          size: 512,
          lastModified: Date.now(),
          isVideo: false,
          isAudio: true,
          isImage: false,
          metadata: { duration: 180, probeData: { streams: [], format: {} } },
          status: "unknown",
          lastChecked: Date.now(),
        },
      ]

      mockFileExists.mockResolvedValue(true)
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      })
      mockConvertFromSavedMediaFile.mockImplementation((file: SavedMediaFile) => ({
        id: file.id,
        name: file.name,
        path: file.originalPath,
      }))

      const result = await restoreProjectMedia(mediaFiles, musicFiles, "/project/file.tls")

      expect(result.stats.total).toBe(2)
      expect(result.restoredMedia).toHaveLength(1)
      expect(result.restoredMusic).toHaveLength(1)
    })

    it("должен обработать все файлы как отсутствующие", async () => {
      const missingFiles: SavedMediaFile[] = [
        {
          id: "missing1",
          originalPath: "/missing/video1.mp4",
          name: "video1.mp4",
          size: 1024,
          lastModified: Date.now(),
          isVideo: true,
          isAudio: false,
          isImage: false,
          metadata: { duration: 120, probeData: { streams: [], format: {} } },
          status: "unknown",
          lastChecked: Date.now(),
        },
        {
          id: "missing2",
          originalPath: "/missing/video2.mp4",
          name: "video2.mp4",
          size: 2048,
          lastModified: Date.now(),
          isVideo: true,
          isAudio: false,
          isImage: false,
          metadata: { duration: 90, probeData: { streams: [], format: {} } },
          status: "unknown",
          lastChecked: Date.now(),
        },
      ]

      mockFileExists.mockResolvedValue(false)
      mockGenerateAlternativePaths.mockResolvedValue([])

      const result = await restoreProjectMedia(missingFiles, [], "/project/file.tls")

      expect(result.stats.total).toBe(2)
      expect(result.stats.missing).toBe(2)
      expect(result.stats.restored).toBe(0)
      expect(result.missingFiles).toHaveLength(2)
    })

    it("должен обработать все файлы как поврежденные", async () => {
      const corruptedFiles: SavedMediaFile[] = [
        {
          id: "corrupt1",
          originalPath: "/path/corrupt1.mp4",
          name: "corrupt1.mp4",
          size: 1024,
          lastModified: Date.now(),
          isVideo: true,
          isAudio: false,
          isImage: false,
          metadata: { duration: 120, probeData: { streams: [], format: {} } },
          status: "unknown",
          lastChecked: Date.now(),
        },
      ]

      mockFileExists.mockResolvedValue(true)
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: false,
        confidence: 0,
        issues: ["File corrupted", "Invalid header"],
      })

      const result = await restoreProjectMedia(corruptedFiles, [], "/project/file.tls")

      expect(result.stats.total).toBe(1)
      expect(result.stats.corrupted).toBe(1)
      expect(result.corruptedFiles).toHaveLength(1)
    })

    it("должен корректно обработать ошибку при проверке относительного пути", async () => {
      const fileWithRelPath: SavedMediaFile = {
        id: "rel-error",
        originalPath: "/original/video.mp4",
        relativePath: "media/video.mp4",
        name: "video.mp4",
        size: 1024,
        lastModified: Date.now(),
        isVideo: true,
        isAudio: false,
        isImage: false,
        metadata: { duration: 120, probeData: { streams: [], format: {} } },
        status: "unknown",
        lastChecked: Date.now(),
      }

      mockFileExists.mockResolvedValueOnce(false) // Original path fails
      mockFileExists.mockRejectedValueOnce(new Error("Permission denied")) // Relative path throws
      mockGenerateAlternativePaths.mockResolvedValue([])

      const result = await restoreFile(fileWithRelPath, "/project/dir")

      expect(result.status).toBe("missing")
    })
  })

  describe("generateRestorationReport", () => {
    it("должен создать полный отчет со всеми статусами", () => {
      const result = {
        restoredMedia: [],
        restoredMusic: [],
        missingFiles: [
          {
            id: "missing1",
            originalPath: "/missing/video.mp4",
            name: "missing.mp4",
          } as SavedMediaFile,
        ],
        relocatedFiles: [
          {
            original: {
              id: "relocated1",
              originalPath: "/old/path/video.mp4",
              name: "relocated.mp4",
            } as SavedMediaFile,
            newPath: "/new/path/video.mp4",
          },
        ],
        corruptedFiles: [
          {
            id: "corrupt1",
            originalPath: "/path/corrupt.mp4",
            name: "corrupt.mp4",
          } as SavedMediaFile,
        ],
        stats: {
          total: 10,
          restored: 7,
          missing: 1,
          relocated: 1,
          corrupted: 1,
        },
      }

      const report = generateRestorationReport(result)

      expect(report).toContain("Всего файлов: 10")
      expect(report).toContain("Восстановлено: 7")
      expect(report).toContain("Перемещено: 1")
      expect(report).toContain("Отсутствует: 1")
      expect(report).toContain("Повреждено: 1")
      expect(report).toContain("missing.mp4")
      expect(report).toContain("relocated.mp4")
      expect(report).toContain("corrupt.mp4")
    })

    it("должен создать минимальный отчет без проблем", () => {
      const result = {
        restoredMedia: [],
        restoredMusic: [],
        missingFiles: [],
        relocatedFiles: [],
        corruptedFiles: [],
        stats: {
          total: 5,
          restored: 5,
          missing: 0,
          relocated: 0,
          corrupted: 0,
        },
      }

      const report = generateRestorationReport(result)

      expect(report).toContain("Всего файлов: 5")
      expect(report).toContain("Восстановлено: 5")
      expect(report).not.toContain("Перемещенные файлы")
      expect(report).not.toContain("Отсутствующие файлы")
      expect(report).not.toContain("Поврежденные файлы")
    })
  })
})
