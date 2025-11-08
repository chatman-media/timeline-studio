import { invoke } from "@tauri-apps/api/core"
import { basename, dirname, join } from "@tauri-apps/api/path"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MediaFile } from "@/features/media/types/media"
import { MediaType } from "@/features/media/types/media"

import {
  calculateRelativePath,
  convertFromSavedMediaFile,
  convertToSavedMediaFile,
  convertToSavedMusicFile,
  fileExists,
  generateFileId,
  getAbsolutePath,
  getExtensionsForFile,
  getFileStats,
  searchFilesByName,
  validateFileIntegrity,
} from "../../utils/saved-media-utils"

// Импортируем моки

// Мокаем Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@tauri-apps/api/path", () => ({
  dirname: vi.fn(),
  basename: vi.fn(),
  join: vi.fn(),
}))

const mockInvoke = vi.mocked(invoke)
const mockDirname = vi.mocked(dirname)
const mockBasename = vi.mocked(basename)
const mockJoin = vi.mocked(join)

describe("saved-media-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("generateFileId", () => {
    it("должен генерировать уникальный ID для файла", () => {
      const filePath = "/path/to/file.mp4"
      const metadata = { size: 1024, lastModified: 1234567890 }

      const id = generateFileId(filePath, metadata)

      expect(id).toBeDefined()
      expect(typeof id).toBe("string")
      expect(id.length).toBeGreaterThan(0)
    })

    it("должен генерировать разные ID для разных файлов", () => {
      const id1 = generateFileId("/path/to/file1.mp4", {
        size: 1024,
        lastModified: 1234567890,
      })
      const id2 = generateFileId("/path/to/file2.mp4", {
        size: 2048,
        lastModified: 1234567891,
      })

      expect(id1).not.toBe(id2)
    })

    it("должен обрабатывать ошибки и возвращать fallback ID", () => {
      // Мокаем btoa для выброса ошибки
      const originalBtoa = global.btoa
      global.btoa = vi.fn().mockImplementation(() => {
        throw new Error("btoa error")
      })

      const id = generateFileId("/path/to/file.mp4", { size: 1024 })

      expect(id).toMatch(/^file_\d+_[a-z0-9]+$/)

      // Восстанавливаем btoa
      global.btoa = originalBtoa
    })
  })

  describe("calculateRelativePath", () => {
    it("должен возвращать undefined если projectPath null", async () => {
      const result = await calculateRelativePath("/path/to/file.mp4", null)
      expect(result).toBeUndefined()
    })

    it("должен вычислять относительный путь для файла в поддиректории проекта", async () => {
      mockDirname.mockResolvedValue("/project/dir")

      const result = await calculateRelativePath("/project/dir/media/file.mp4", "/project/dir/project.tls")

      expect(result).toBe("media/file.mp4")
    })

    it("должен возвращать undefined для файла вне директории проекта", async () => {
      mockDirname.mockResolvedValue("/project/dir")

      const result = await calculateRelativePath("/other/dir/file.mp4", "/project/dir/project.tls")

      expect(result).toBeUndefined()
    })

    it("должен обрабатывать ошибки", async () => {
      mockDirname.mockRejectedValue(new Error("dirname error"))

      const result = await calculateRelativePath("/path/to/file.mp4", "/project/dir/project.tls")

      expect(result).toBeUndefined()
    })
  })

  describe("fileExists", () => {
    it("должен возвращать true для существующего файла", async () => {
      mockInvoke.mockResolvedValue(true)

      const result = await fileExists("/path/to/existing/file.mp4")

      expect(result).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith("file_exists", {
        path: "/path/to/existing/file.mp4",
      })
    })

    it("должен возвращать false для несуществующего файла", async () => {
      mockInvoke.mockResolvedValue(false)

      const result = await fileExists("/path/to/missing/file.mp4")

      expect(result).toBe(false)
    })

    it("должен обрабатывать ошибки и возвращать false", async () => {
      mockInvoke.mockRejectedValue(new Error("invoke error"))

      const result = await fileExists("/path/to/file.mp4")

      expect(result).toBe(false)
    })
  })

  describe("getFileStats", () => {
    it("должен возвращать статистику файла", async () => {
      const mockStats = { size: 1024, lastModified: 1234567890 }
      mockInvoke.mockResolvedValue(mockStats)

      const result = await getFileStats("/path/to/file.mp4")

      expect(result).toEqual(mockStats)
      expect(mockInvoke).toHaveBeenCalledWith("get_file_stats", {
        path: "/path/to/file.mp4",
      })
    })

    it("должен обрабатывать ошибки и возвращать null", async () => {
      mockInvoke.mockRejectedValue(new Error("invoke error"))

      const result = await getFileStats("/path/to/file.mp4")

      expect(result).toBeNull()
    })
  })

  describe("convertToSavedMediaFile", () => {
    it("должен конвертировать MediaFile в SavedMediaFile", async () => {
      const mediaFile: MediaFile = {
        id: "test-id",
        name: "test.mp4",
        path: "/path/to/test.mp4",
        type: MediaType.Video,
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 1024,
        duration: 120,
        startTime: 0,
        createdAt: new Date("2023-01-01T00:00:00Z"),
        probeData: { streams: [], format: {} },
      }

      const result = await convertToSavedMediaFile(mediaFile)

      expect(result).toMatchObject({
        id: "test-id",
        originalPath: "/path/to/test.mp4",
        name: "test.mp4",
        size: 1024,
        isVideo: true,
        isAudio: false,
        isImage: false,
        status: "available",
        metadata: {
          duration: 120,
          startTime: 0,
          createdAt: new Date("2023-01-01T00:00:00Z").toISOString(),
          probeData: { streams: [], format: {} },
        },
      })
      expect(result.lastChecked).toBeGreaterThan(0)
    })
  })

  describe("convertToSavedMusicFile", () => {
    it("должен конвертировать MediaFile в SavedMusicFile с музыкальными метаданными", async () => {
      const mediaFile: MediaFile = {
        id: "music-id",
        name: "song.mp3",
        path: "/path/to/song.mp3",
        type: MediaType.Audio,
        isVideo: false,
        isAudio: true,
        isImage: false,
        size: 2048,
        duration: 180,
        probeData: {
          streams: [],
          format: {
            tags: {
              artist: "Test Artist",
              album: "Test Album",
              title: "Test Song",
              date: "2023",
              track: "1",
            },
          },
        },
      }

      const result = await convertToSavedMusicFile(mediaFile)

      expect(result.musicMetadata).toEqual({
        artist: "Test Artist",
        album: "Test Album",
        title: "Test Song",
        year: 2023,
        track: 1,
        genre: undefined,
      })
    })
  })

  describe("convertFromSavedMediaFile", () => {
    it("должен конвертировать SavedMediaFile обратно в MediaFile", () => {
      const savedFile = {
        id: "test-id",
        originalPath: "/path/to/test.mp4",
        name: "test.mp4",
        size: 1024,
        lastModified: 1234567890,
        isVideo: true,
        isAudio: false,
        isImage: false,
        metadata: {
          duration: 120,
          startTime: 0,
          createdAt: new Date("2023-01-01T00:00:00Z").toISOString(),
          probeData: { streams: [], format: {} },
        },
        status: "available" as const,
        lastChecked: Date.now(),
      }

      const result = convertFromSavedMediaFile(savedFile)

      expect(result).toMatchObject({
        id: "test-id",
        name: "test.mp4",
        path: "/path/to/test.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 1024,
        duration: 120,
        startTime: 0,
        createdAt: new Date("2023-01-01T00:00:00Z"),
        probeData: { streams: [], format: {} },
        isLoadingMetadata: false,
        lastCheckedAt: expect.any(Number),
      })
    })
  })

  describe("getExtensionsForFile", () => {
    it("должен возвращать расширения для видеофайла", () => {
      const file = {
        name: "video.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
      } as any

      const result = getExtensionsForFile(file)

      expect(result).toContain("mp4")
      expect(result).toContain("avi")
      expect(result).toContain("mkv")
    })

    it("должен возвращать расширения для аудиофайла", () => {
      const file = {
        name: "audio.mp3",
        isVideo: false,
        isAudio: true,
        isImage: false,
      } as any

      const result = getExtensionsForFile(file)

      expect(result).toContain("mp3")
      expect(result).toContain("wav")
      expect(result).toContain("ogg")
    })
  })

  describe("searchFilesByName", () => {
    it("должен искать файлы по имени", async () => {
      mockInvoke.mockResolvedValue(["/path/to/found/file.mp4"])

      const result = await searchFilesByName("/search/dir", "file.mp4", 2)

      expect(result).toEqual(["/path/to/found/file.mp4"])
      expect(mockInvoke).toHaveBeenCalledWith("search_files_by_name", {
        directory: "/search/dir",
        filename: "file.mp4",
        maxDepth: 2,
      })
    })

    it("должен обрабатывать ошибки поиска", async () => {
      mockInvoke.mockRejectedValue(new Error("search error"))

      const result = await searchFilesByName("/search/dir", "file.mp4")

      expect(result).toEqual([])
    })
  })

  describe("getAbsolutePath", () => {
    it("должен возвращать абсолютный путь", async () => {
      mockInvoke.mockResolvedValue("/absolute/path/to/file.mp4")

      const result = await getAbsolutePath("./relative/file.mp4")

      expect(result).toBe("/absolute/path/to/file.mp4")
      expect(mockInvoke).toHaveBeenCalledWith("get_absolute_path", {
        path: "./relative/file.mp4",
      })
    })

    it("должен обрабатывать ошибки", async () => {
      mockInvoke.mockRejectedValue(new Error("path error"))

      const result = await getAbsolutePath("./invalid/path")

      expect(result).toBeNull()
    })
  })

  describe("validateFileIntegrity", () => {
    it("должен валидировать корректный файл", async () => {
      mockInvoke.mockResolvedValueOnce(true) // file_exists
      mockInvoke.mockResolvedValueOnce({
        size: 1024,
        lastModified: 1234567890,
      }) // get_file_stats
      mockBasename.mockResolvedValue("test.mp4")

      const savedFile = {
        name: "test.mp4",
        size: 1024,
        lastModified: 1234567890,
      } as any

      const result = await validateFileIntegrity("/path/to/test.mp4", savedFile)

      expect(result.isValid).toBe(true)
      expect(result.confidence).toBe(1.0)
      expect(result.issues).toHaveLength(0)
    })

    it("должен обнаруживать несуществующий файл", async () => {
      mockInvoke.mockResolvedValue(false) // file_exists

      const savedFile = { name: "test.mp4" } as any

      const result = await validateFileIntegrity("/path/to/missing.mp4", savedFile)

      expect(result.isValid).toBe(false)
      expect(result.confidence).toBe(0)
      expect(result.issues).toContain("File does not exist")
    })
  })
})
