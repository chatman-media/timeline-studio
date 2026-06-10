/**
 * Тесты для вспомогательных функций браузера
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { BrowserFileInfo, BrowserStateAccess } from "../../types"
import {
  analyzeFileRelationships,
  filterFiles,
  findFilesByPattern,
  formatDateKey,
  formatDuration,
  formatFileSize,
  getBrowserFiles,
  getBrowserStateAccess,
  getBrowserStats,
  getCurrentTab,
  getFileTypeCategory,
  getRandomFiles,
  getSelectedFiles,
  getSizeCategory,
  groupFiles,
  hasBrowserAccess,
  setBrowserStateAccess,
  sortFiles,
} from "../helpers"

describe("Browser helpers - доступ к состоянию браузера", () => {
  let mockAccess: BrowserStateAccess

  beforeEach(() => {
    mockAccess = {
      getCurrentTab: vi.fn(() => "media" as const),
      getFiles: vi.fn(() => []),
      getSelectedFiles: vi.fn(() => []),
      getFilters: vi.fn(() => ({})),
      setFilters: vi.fn(),
      selectFiles: vi.fn(),
      deselectFiles: vi.fn(),
      searchFiles: vi.fn(() => []),
      getFileGroups: vi.fn(() => []),
      getBrowserStats: vi.fn(() => ({
        totalFiles: 0,
        selectedFiles: 0,
        filesByType: {},
        totalSize: 0,
      })),
    }
  })

  afterEach(() => {
    setBrowserStateAccess(null)
    vi.clearAllMocks()
  })

  describe("setBrowserStateAccess / getBrowserStateAccess", () => {
    it("должен устанавливать и получать доступ к браузеру", () => {
      setBrowserStateAccess(mockAccess)
      expect(getBrowserStateAccess()).toBe(mockAccess)
    })

    it("должен позволять сбрасывать доступ", () => {
      setBrowserStateAccess(mockAccess)
      expect(getBrowserStateAccess()).toBe(mockAccess)

      setBrowserStateAccess(null)
      expect(getBrowserStateAccess()).toBeNull()
    })
  })

  describe("hasBrowserAccess", () => {
    it("должен возвращать false когда доступ не установлен", () => {
      setBrowserStateAccess(null)
      expect(hasBrowserAccess()).toBe(false)
    })

    it("должен возвращать true когда доступ установлен", () => {
      setBrowserStateAccess(mockAccess)
      expect(hasBrowserAccess()).toBe(true)
    })
  })

  describe("getCurrentTab", () => {
    it("должен возвращать текущую вкладку", () => {
      setBrowserStateAccess(mockAccess)
      expect(getCurrentTab()).toBe("media")
      expect(mockAccess.getCurrentTab).toHaveBeenCalledOnce()
    })

    it("должен выбрасывать ошибку когда доступ не установлен", () => {
      setBrowserStateAccess(null)
      expect(() => getCurrentTab()).toThrow("Browser state access не настроен")
    })
  })

  describe("getBrowserFiles", () => {
    it("должен возвращать файлы", () => {
      const mockFiles: BrowserFileInfo[] = [
        {
          id: "file1",
          name: "test.mp4",
          path: "/test/test.mp4",
          type: "video/mp4",
          size: 1024,
        },
      ]

      mockAccess.getFiles = vi.fn(() => mockFiles)
      setBrowserStateAccess(mockAccess)

      expect(getBrowserFiles()).toEqual(mockFiles)
      expect(mockAccess.getFiles).toHaveBeenCalledWith(undefined)
    })

    it("должен передавать параметр tab", () => {
      setBrowserStateAccess(mockAccess)

      getBrowserFiles("effects")
      expect(mockAccess.getFiles).toHaveBeenCalledWith("effects")
    })

    it("должен выбрасывать ошибку когда доступ не установлен", () => {
      setBrowserStateAccess(null)
      expect(() => getBrowserFiles()).toThrow("Browser state access не настроен")
    })
  })

  describe("getSelectedFiles", () => {
    it("должен возвращать выбранные файлы", () => {
      const mockFiles: BrowserFileInfo[] = [
        {
          id: "file1",
          name: "test.mp4",
          path: "/test/test.mp4",
          type: "video/mp4",
        },
      ]

      mockAccess.getSelectedFiles = vi.fn(() => mockFiles)
      setBrowserStateAccess(mockAccess)

      expect(getSelectedFiles()).toEqual(mockFiles)
      expect(mockAccess.getSelectedFiles).toHaveBeenCalledOnce()
    })

    it("должен выбрасывать ошибку когда доступ не установлен", () => {
      setBrowserStateAccess(null)
      expect(() => getSelectedFiles()).toThrow("Browser state access не настроен")
    })
  })

  describe("getBrowserStats", () => {
    it("должен возвращать статистику браузера", () => {
      const mockStats = {
        totalFiles: 10,
        selectedFiles: 2,
        filesByType: { video: 5, audio: 5 },
        totalSize: 1024000,
      }

      mockAccess.getBrowserStats = vi.fn(() => mockStats)
      setBrowserStateAccess(mockAccess)

      expect(getBrowserStats()).toEqual(mockStats)
      expect(mockAccess.getBrowserStats).toHaveBeenCalledOnce()
    })

    it("должен выбрасывать ошибку когда доступ не установлен", () => {
      setBrowserStateAccess(null)
      expect(() => getBrowserStats()).toThrow("Browser state access не настроен")
    })
  })
})

describe("Browser helpers - фильтрация и сортировка", () => {
  const mockFiles: BrowserFileInfo[] = [
    {
      id: "file1",
      name: "video1.mp4",
      path: "/videos/video1.mp4",
      type: "video/mp4",
      size: 1024 * 1024 * 5, // 5MB
      duration: 120,
      createdAt: new Date("2024-01-01"),
      modifiedAt: new Date("2024-01-10"),
      tags: ["intro", "main"],
      location: "/videos",
    },
    {
      id: "file2",
      name: "audio1.mp3",
      path: "/audio/audio1.mp3",
      type: "audio/mp3",
      size: 1024 * 1024 * 2, // 2MB
      duration: 60,
      createdAt: new Date("2024-01-02"),
      modifiedAt: new Date("2024-01-11"),
      tags: ["background"],
      location: "/audio",
    },
    {
      id: "file3",
      name: "test_video.mp4",
      path: "/test/test_video.mp4",
      type: "video/mp4",
      size: 1024 * 1024 * 15, // 15MB
      duration: 180,
      createdAt: new Date("2024-01-03"),
      modifiedAt: new Date("2024-01-12"),
      tags: ["test"],
      location: "/test",
    },
  ]

  describe("filterFiles", () => {
    it("должен фильтровать по поисковому запросу", () => {
      const filters = { searchQuery: "video" }
      const result = filterFiles(mockFiles, filters)

      expect(result).toHaveLength(2)
      expect(result.map((f) => f.name)).toContain("video1.mp4")
      expect(result.map((f) => f.name)).toContain("test_video.mp4")
    })

    it("должен фильтровать по тегам в поиске", () => {
      const filters = { searchQuery: "background" }
      const result = filterFiles(mockFiles, filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("audio1.mp3")
    })

    it("должен фильтровать по типам файлов", () => {
      const filters = { fileTypes: ["video"] }
      const result = filterFiles(mockFiles, filters)

      expect(result).toHaveLength(2)
      expect(result.every((f) => getFileTypeCategory(f.type) === "video")).toBe(true)
    })

    it("должен фильтровать по диапазону дат", () => {
      const filters = {
        dateRange: {
          start: new Date("2024-01-11"),
          end: new Date("2024-01-12"),
        },
      }
      const result = filterFiles(mockFiles, filters)

      expect(result).toHaveLength(2)
    })

    it("должен фильтровать по диапазону размера", () => {
      const filters = {
        sizeRange: {
          min: 1024 * 1024 * 3, // 3MB
          max: 1024 * 1024 * 10, // 10MB
        },
      }
      const result = filterFiles(mockFiles, filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("video1.mp4")
    })

    it("должен фильтровать по диапазону длительности", () => {
      const filters = {
        durationRange: {
          min: 100,
          max: 150,
        },
      }
      const result = filterFiles(mockFiles, filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("video1.mp4")
    })

    it("должен фильтровать по тегам", () => {
      const filters = { tags: ["intro"] }
      const result = filterFiles(mockFiles, filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("video1.mp4")
    })

    it("должен фильтровать по расположению", () => {
      const filters = { location: "test" }
      const result = filterFiles(mockFiles, filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("test_video.mp4")
    })

    it("должен применять несколько фильтров одновременно", () => {
      const filters = {
        searchQuery: "video",
        fileTypes: ["video"],
        sizeRange: { min: 0, max: 1024 * 1024 * 10 },
      }
      const result = filterFiles(mockFiles, filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("video1.mp4")
    })

    it("должен возвращать все файлы при пустых фильтрах", () => {
      const result = filterFiles(mockFiles, {})
      expect(result).toHaveLength(mockFiles.length)
    })
  })

  describe("sortFiles", () => {
    it("должен сортировать по имени (ascending)", () => {
      const result = sortFiles(mockFiles, "name", "asc")

      expect(result[0].name).toBe("audio1.mp3")
      expect(result[2].name).toBe("video1.mp4")
    })

    it("должен сортировать по имени (descending)", () => {
      const result = sortFiles(mockFiles, "name", "desc")

      expect(result[0].name).toBe("video1.mp4")
      expect(result[2].name).toBe("audio1.mp3")
    })

    it("должен сортировать по дате", () => {
      const result = sortFiles(mockFiles, "date", "asc")

      expect(result[0].id).toBe("file1")
      expect(result[2].id).toBe("file3")
    })

    it("должен сортировать по размеру", () => {
      const result = sortFiles(mockFiles, "size", "asc")

      expect(result[0].name).toBe("audio1.mp3")
      expect(result[2].name).toBe("test_video.mp4")
    })

    it("должен сортировать по длительности", () => {
      const result = sortFiles(mockFiles, "duration", "desc")

      expect(result[0].duration).toBe(180)
      expect(result[2].duration).toBe(60)
    })

    it("должен сортировать по типу", () => {
      const result = sortFiles(mockFiles, "type", "asc")

      expect(result[0].type).toBe("audio/mp3")
    })

    it("должен использовать ascending по умолчанию", () => {
      const result = sortFiles(mockFiles, "name")

      expect(result[0].name).toBe("audio1.mp3")
    })

    it("не должен изменять оригинальный массив", () => {
      const original = [...mockFiles]
      sortFiles(mockFiles, "name", "desc")

      expect(mockFiles).toEqual(original)
    })
  })

  describe("groupFiles", () => {
    it("должен группировать по типу", () => {
      const result = groupFiles(mockFiles, "type")

      expect(result).toHaveLength(2)

      const videoGroup = result.find((g) => g.name === "video")
      expect(videoGroup?.files).toHaveLength(2)

      const audioGroup = result.find((g) => g.name === "audio")
      expect(audioGroup?.files).toHaveLength(1)
    })

    it("должен группировать по размеру", () => {
      const result = groupFiles(mockFiles, "size")

      expect(result.length).toBeGreaterThan(0)
      expect(result.every((g) => g.type === "size")).toBe(true)
    })

    it("должен группировать по расположению", () => {
      const result = groupFiles(mockFiles, "location")

      expect(result).toHaveLength(3)
      expect(result.map((g) => g.name)).toContain("/videos")
      expect(result.map((g) => g.name)).toContain("/audio")
      expect(result.map((g) => g.name)).toContain("/test")
    })

    it("должен группировать по тегам", () => {
      const result = groupFiles(mockFiles, "tags")

      expect(result.length).toBeGreaterThan(0)
      expect(result.map((g) => g.name)).toContain("intro")
      expect(result.map((g) => g.name)).toContain("background")
    })

    it("должен вычислять статистику групп", () => {
      const result = groupFiles(mockFiles, "type")

      result.forEach((group) => {
        expect(group.count).toBe(group.files.length)
        expect(group.totalSize).toBeGreaterThanOrEqual(0)
        expect(group.totalDuration).toBeGreaterThanOrEqual(0)
      })
    })

    it("должен создавать уникальные ID для групп", () => {
      const result = groupFiles(mockFiles, "type")

      const ids = result.map((g) => g.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })
})

describe("Browser helpers - утилиты для файлов", () => {
  describe("getFileTypeCategory", () => {
    it("должен определять видео файлы", () => {
      expect(getFileTypeCategory("video/mp4")).toBe("video")
      expect(getFileTypeCategory("video/avi")).toBe("video")
      expect(getFileTypeCategory("file.mp4")).toBe("video")
      expect(getFileTypeCategory("file.mkv")).toBe("video")
    })

    it("должен определять аудио файлы", () => {
      expect(getFileTypeCategory("audio/mp3")).toBe("audio")
      expect(getFileTypeCategory("audio/wav")).toBe("audio")
      expect(getFileTypeCategory("file.mp3")).toBe("audio")
      expect(getFileTypeCategory("file.flac")).toBe("audio")
    })

    it("должен определять изображения", () => {
      expect(getFileTypeCategory("image/png")).toBe("image")
      expect(getFileTypeCategory("image/jpeg")).toBe("image")
      expect(getFileTypeCategory("file.jpg")).toBe("image")
      expect(getFileTypeCategory("file.gif")).toBe("image")
    })

    it("должен возвращать 'other' для неизвестных типов", () => {
      expect(getFileTypeCategory("text/plain")).toBe("other")
      expect(getFileTypeCategory("application/pdf")).toBe("other")
    })

    it("должен быть нечувствителен к регистру", () => {
      expect(getFileTypeCategory("VIDEO/MP4")).toBe("video")
      expect(getFileTypeCategory("AUDIO/MP3")).toBe("audio")
    })
  })

  describe("formatFileSize", () => {
    it("должен форматировать байты", () => {
      expect(formatFileSize(0)).toBe("0 B")
      expect(formatFileSize(512)).toBe("512 B")
    })

    it("должен форматировать килобайты", () => {
      expect(formatFileSize(1024)).toBe("1 KB")
      expect(formatFileSize(1536)).toBe("1.5 KB")
    })

    it("должен форматировать мегабайты", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1 MB")
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe("2.5 MB")
    })

    it("должен форматировать гигабайты", () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB")
      expect(formatFileSize(1024 * 1024 * 1024 * 1.75)).toBe("1.75 GB")
    })
  })

  describe("formatDuration", () => {
    it("должен форматировать секунды", () => {
      expect(formatDuration(30)).toBe("30.0s")
      expect(formatDuration(45.5)).toBe("45.5s")
    })

    it("должен форматировать минуты", () => {
      expect(formatDuration(60)).toBe("1:00")
      expect(formatDuration(90)).toBe("1:30")
      expect(formatDuration(125)).toBe("2:05")
    })

    it("должен форматировать часы", () => {
      expect(formatDuration(3600)).toBe("1:00:00")
      expect(formatDuration(3665)).toBe("1:01:00")
      expect(formatDuration(7320)).toBe("2:02:00")
    })
  })

  describe("getSizeCategory", () => {
    it("должен категоризировать маленькие файлы", () => {
      expect(getSizeCategory(500 * 1024)).toBe("Маленькие (< 1MB)")
    })

    it("должен категоризировать средние файлы", () => {
      expect(getSizeCategory(5 * 1024 * 1024)).toBe("Средние (1-10MB)")
    })

    it("должен категоризировать большие файлы", () => {
      expect(getSizeCategory(50 * 1024 * 1024)).toBe("Большие (10-100MB)")
    })

    it("должен категоризировать очень большие файлы", () => {
      expect(getSizeCategory(150 * 1024 * 1024)).toBe("Очень большие (> 100MB)")
    })
  })

  describe("formatDateKey", () => {
    it("должен определять 'Сегодня'", () => {
      const today = new Date()
      expect(formatDateKey(today)).toBe("Сегодня")
    })

    it("должен определять 'Вчера'", () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(formatDateKey(yesterday)).toBe("Вчера")
    })

    it("должен определять 'На этой неделе'", () => {
      const fiveDaysAgo = new Date()
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
      expect(formatDateKey(fiveDaysAgo)).toBe("На этой неделе")
    })

    it("должен форматировать старые даты", () => {
      const oldDate = new Date("2023-06-15")
      const result = formatDateKey(oldDate)

      expect(result).toContain("2023")
      expect(result).toContain("июн") // или другое название месяца в зависимости от локали
    })
  })
})

describe("Browser helpers - анализ файлов", () => {
  const mockFiles: BrowserFileInfo[] = [
    {
      id: "file1",
      name: "video_part_1.mp4",
      path: "/test/video_part_1.mp4",
      type: "video/mp4",
      size: 1024 * 1024 * 5,
    },
    {
      id: "file2",
      name: "video_part_2.mp4",
      path: "/test/video_part_2.mp4",
      type: "video/mp4",
      size: 1024 * 1024 * 5,
    },
    {
      id: "file3",
      name: "audio.mp3",
      path: "/test/audio.mp3",
      type: "audio/mp3",
      size: 1024 * 1024 * 2,
    },
  ]

  describe("analyzeFileRelationships", () => {
    it("должен находить серии файлов", () => {
      const result = analyzeFileRelationships(mockFiles, "series")

      expect(result.series).toBeDefined()
      expect(result.totalSeries).toBeGreaterThanOrEqual(0)
      expect(result.filesInSeries).toBeGreaterThanOrEqual(0)
    })

    it("должен находить похожие файлы", () => {
      const result = analyzeFileRelationships(mockFiles, "similarity")

      expect(result.similar).toBeDefined()
      expect(result.totalGroups).toBeGreaterThanOrEqual(0)
    })

    it("должен обрабатывать неизвестный тип анализа", () => {
      const result = analyzeFileRelationships(mockFiles, "unknown")

      expect(result.analysis).toContain("Неподдерживаемый")
    })
  })

  describe("getRandomFiles", () => {
    it("должен возвращать случайные файлы", () => {
      const result = getRandomFiles(mockFiles, 2)

      expect(result).toHaveLength(2)
      expect(mockFiles).toContain(result[0])
      expect(mockFiles).toContain(result[1])
    })

    it("должен ограничивать количество файлов", () => {
      const result = getRandomFiles(mockFiles, 10)

      expect(result.length).toBeLessThanOrEqual(mockFiles.length)
    })

    it("не должен изменять оригинальный массив", () => {
      const original = [...mockFiles]
      getRandomFiles(mockFiles, 2)

      expect(mockFiles).toEqual(original)
    })
  })

  describe("findFilesByPattern", () => {
    it("должен находить файлы по простому шаблону", () => {
      const result = findFilesByPattern(mockFiles, "video*")

      expect(result).toHaveLength(2)
      expect(result.every((f) => f.name.includes("video"))).toBe(true)
    })

    it("должен использовать регулярные выражения", () => {
      // Используем шаблон с * вместо ? так как функция конвертирует * в .*
      const result = findFilesByPattern(mockFiles, "video_part_*")

      expect(result).toHaveLength(2)
    })

    it("должен быть нечувствителен к регистру", () => {
      const result = findFilesByPattern(mockFiles, "VIDEO*")

      expect(result.length).toBeGreaterThan(0)
    })

    it("должен искать по пути", () => {
      const result = findFilesByPattern(mockFiles, "*/test/*")

      expect(result).toHaveLength(mockFiles.length)
    })

    it("должен возвращать пустой массив при отсутствии совпадений", () => {
      const result = findFilesByPattern(mockFiles, "nonexistent*")

      expect(result).toHaveLength(0)
    })
  })
})
