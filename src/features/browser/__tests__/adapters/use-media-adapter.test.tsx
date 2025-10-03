import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMediaAdapter } from "../../adapters/use-media-adapter"

// Мокаем хуки для app-state
const mockUseAppSettings = vi.fn()
const mockUseFavorites = vi.fn()
const mockUseMediaImport = vi.fn()

// Утилитная функция для парсинга duration
const parseDuration = (duration: string) => {
  // Convert "00:01:30" to 90 seconds
  if (!duration) return 0
  const parts = duration.split(":")
  if (parts.length === 3) {
    return Number.parseInt(parts[0], 10) * 3600 + Number.parseInt(parts[1], 10) * 60 + Number.parseInt(parts[2], 10)
  }
  return 0
}

vi.mock("@/features/browser/utils", () => ({
  parseDuration: vi.fn((duration: string) => {
    // Convert "00:01:30" to 90 seconds
    if (!duration) return 0
    const parts = duration.split(":")
    if (parts.length === 3) {
      return Number.parseInt(parts[0], 10) * 3600 + Number.parseInt(parts[1], 10) * 60 + Number.parseInt(parts[2], 10)
    }
    return 0
  }),
  parseFileSize: vi.fn((size: string) => {
    // Convert "10MB" to bytes
    if (!size) return 0
    const match = /(\d+)(KB|MB|GB)?/i.exec(size)
    if (!match) return 0
    const value = Number.parseInt(match[1], 10)
    const unit = match[2]?.toUpperCase() || "B"
    const multipliers: Record<string, number> = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
    }
    return value * (multipliers[unit] || 1)
  }),
}))

vi.mock("@/features/browser/utils/grouping", () => ({
  getDateGroup: vi.fn(() => "Январь 2024"),
  getDurationGroup: vi.fn(() => "1-3 минуты"),
}))

vi.mock("@/features/app-state", () => ({
  useAppSettings: (...args: any[]) => mockUseAppSettings(...args),
  useFavorites: (...args: any[]) => mockUseFavorites(...args),
  AppSettingsProvider: ({ children }: any) => children,
}))

vi.mock("@/features/media/hooks/use-media-import", () => ({
  useMediaImport: (...args: any[]) => mockUseMediaImport(...args),
}))

vi.mock("@/features/media", () => ({
  getFileType: vi.fn((file: any) => {
    if (file.isVideo) return "video"
    if (file.isAudio) return "audio"
    if (file.isImage) return "image"
    return "unknown"
  }),
}))

vi.mock("@/i18n", () => ({
  default: {
    t: vi.fn((key: string) => key),
    language: "ru",
  },
}))

// Создаем тестовые данные медиафайлов
const createTestMediaFiles = () => [
  {
    id: "video1",
    name: "test-video.mp4",
    path: "/test/video.mp4",
    size: "10MB",
    duration: "00:01:30",
    startTime: 1704067200, // 2024-01-01
    isVideo: true,
    isAudio: false,
    isImage: false,
    probeData: {
      format: {
        size: 10485760,
        tags: {
          title: "Test Video",
          artist: "Test Artist",
        },
      },
      streams: [{ codec_type: "video" }, { codec_type: "audio" }],
    },
  },
  {
    id: "audio1",
    name: "test-audio.mp3",
    path: "/test/audio.mp3",
    size: "5MB",
    duration: "00:03:45",
    startTime: 1704153600, // 2024-01-02
    isVideo: false,
    isAudio: true,
    isImage: false,
    probeData: {
      format: {
        size: 5242880,
        tags: {
          title: "Test Audio",
          album: "Test Album",
        },
      },
      streams: [{ codec_type: "audio" }],
    },
  },
  {
    id: "image1",
    name: "test-image.jpg",
    path: "/test/image.jpg",
    size: "2MB",
    duration: "",
    startTime: 0,
    isVideo: false,
    isAudio: false,
    isImage: true,
    probeData: {
      format: {
        size: 2097152,
        tags: {
          creation_time: "2024-01-03T00:00:00Z",
        },
      },
      streams: [],
    },
  },
]

describe("useMediaAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Настраиваем моки по умолчанию
    // Преобразуем тестовые медиа файлы в формат MediaItem для media_pool
    const mediaFiles = createTestMediaFiles()
    const mediaPoolItems = mediaFiles.reduce<Record<string, any>>((acc, file) => {
      acc[file.id] = {
        id: file.id,
        name: file.name,
        path: file.path,
        media_type: file.isVideo ? "Video" : file.isAudio ? "Audio" : "Image",
        duration: file.duration === "00:01:30" ? 90 : file.duration === "00:03:45" ? 225 : null,
        metadata: {
          format: "",
          codec: null,
          resolution: null,
          frame_rate: null,
          bitrate:
            file.probeData?.format?.size && file.duration
              ? Math.round((file.probeData.format.size * 8) / parseDuration(file.duration))
              : null,
          audio_channels: file.probeData?.streams?.filter((s: any) => s.codec_type === "audio").length || null,
          sample_rate: null,
        },
        thumbnail: null,
        usage_count: 0,
        // Сохраняем оригинальные данные для тестов
        startTime: file.startTime,
        size: file.size,
        probeData: file.probeData,
      }
      return acc
    }, {})

    mockUseAppSettings.mockReturnValue({
      connectionError: null,
      projectState: {
        project: {
          media_pool: {
            items: mediaPoolItems,
          },
        },
      },
    })

    mockUseFavorites.mockReturnValue({
      isItemFavorite: vi.fn((item: any) => item.id === "video1"),
    })

    mockUseMediaImport.mockReturnValue({
      importFile: vi.fn(),
      importFolder: vi.fn(),
      isImporting: false,
    })
  })

  it("should return media adapter with correct structure", () => {
    const { result } = renderHook(() => useMediaAdapter())

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("matchesFilter")
    expect(result.current).toHaveProperty("importHandlers")
    expect(result.current).toHaveProperty("isFavorite")
    expect(result.current).toHaveProperty("favoriteType", "media")
  })

  describe("useData", () => {
    it("should return media files data", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.items).toHaveLength(3)
      expect(dataResult.current.loading).toBe(false)
      expect(dataResult.current.error).toBe(null)
    })
  })

  describe("getSortValue", () => {
    it("should return correct sort value for name", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())
      const file = dataResult.current.items[0]

      expect(file).toBeDefined()
      expect(result.current.getSortValue(file, "name")).toBe("test-video.mp4")
    })

    it("should return correct sort value for size", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())
      const file = dataResult.current.items[0]

      expect(file).toBeDefined()
      expect(result.current.getSortValue(file, "size")).toBe(10485760)
    })

    it("should return correct sort value for duration", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())
      const file = dataResult.current.items[0]

      expect(file).toBeDefined()
      expect(result.current.getSortValue(file, "duration")).toBe(90) // 1:30 = 90 seconds
    })

    it("should return startTime for default sort", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())
      const file = dataResult.current.items[0]

      expect(file).toBeDefined()
      expect(result.current.getSortValue(file, "date")).toBe(1704067200)
    })
  })

  describe("getSearchableText", () => {
    it("should return searchable text array", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())
      const file = dataResult.current.items[0]

      const searchableText = result.current.getSearchableText(file)
      expect(searchableText).toContain("test-video.mp4")
      expect(searchableText).toContain("Test Video")
      expect(searchableText).toContain("Test Artist")
    })

    it("should filter out empty values", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())
      const file = dataResult.current.items[2] // image without title/artist

      expect(file).toBeDefined()
      const searchableText = result.current.getSearchableText(file)
      expect(searchableText).toContain("test-image.jpg")
      expect(searchableText.length).toBe(1)
    })
  })

  describe("getGroupValue", () => {
    it("should return correct group for type", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())
      const videoFile = dataResult.current.items[0]
      const audioFile = dataResult.current.items[1]

      expect(videoFile).toBeDefined()
      expect(audioFile).toBeDefined()
      expect(result.current.getGroupValue(videoFile, "type")).toBe("browser.media.video")
      expect(result.current.getGroupValue(audioFile, "type")).toBe("browser.media.audio")
    })

    it("should return correct group for date", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())
      const file = dataResult.current.items[0]

      expect(file).toBeDefined()
      const dateGroup = result.current.getGroupValue(file, "date")
      expect(dateGroup).toBeTruthy()
    })

    it("should return correct group for duration", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())
      const file = dataResult.current.items[0]

      expect(file).toBeDefined()
      const durationGroup = result.current.getGroupValue(file, "duration")
      expect(durationGroup).toBeTruthy()
    })
  })

  describe("matchesFilter", () => {
    it("should match all filter", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())
      const file = dataResult.current.items[0]

      expect(result.current.matchesFilter?.(file, "all")).toBe(true)
    })

    it("should match video filter", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())
      const videoFile = dataResult.current.items[0]
      const audioFile = dataResult.current.items[1]

      expect(result.current.matchesFilter?.(videoFile, "video")).toBe(true)
      expect(result.current.matchesFilter?.(audioFile, "video")).toBe(false)
    })

    it("should match audio filter", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())
      const videoFile = dataResult.current.items[0]
      const audioFile = dataResult.current.items[1]

      // Video file has audio stream, so it should match audio filter
      expect(result.current.matchesFilter?.(videoFile, "audio")).toBe(true)
      expect(result.current.matchesFilter?.(audioFile, "audio")).toBe(true)
    })

    it("should match image filter", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())
      const imageFile = dataResult.current.items[2]
      const videoFile = dataResult.current.items[0]

      expect(result.current.matchesFilter?.(imageFile, "image")).toBe(true)
      expect(result.current.matchesFilter?.(videoFile, "image")).toBe(false)
    })

    it("should handle loading metadata state", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const loadingFile = {
        id: "loading1",
        name: "loading.mp4",
        path: "/test/loading.mp4",
        size: "1MB",
        duration: "",
        startTime: 0,
        isVideo: true,
        isAudio: false,
        isImage: false,
        isLoadingMetadata: true,
      }

      expect(result.current.matchesFilter?.(loadingFile, "video")).toBe(true)
    })
  })

  describe("isFavorite", () => {
    it("should check if item is favorite", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())
      const favoriteFile = dataResult.current.items[0] // video1
      const nonFavoriteFile = dataResult.current.items[1] // audio1

      expect(result.current.isFavorite?.(favoriteFile)).toBe(true)
      expect(result.current.isFavorite?.(nonFavoriteFile)).toBe(false)
    })
  })

  describe("importHandlers", () => {
    it("should provide import handlers", () => {
      const { result } = renderHook(() => useMediaAdapter())

      expect(result.current.importHandlers).toHaveProperty("importFile")
      expect(result.current.importHandlers).toHaveProperty("importFolder")
      expect(result.current.importHandlers).toHaveProperty("isImporting")
      expect(result.current.importHandlers?.isImporting).toBe(false)
    })
  })
})
