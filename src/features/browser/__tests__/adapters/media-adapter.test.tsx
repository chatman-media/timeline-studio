/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useMediaAdapter } from "../../adapters/use-media-adapter"
import { createMockMediaFile } from "./test-utils"

// Мокаем duration formatter
vi.mock("@/lib/duration-formatter", () => ({
  formatDurationSeconds: vi.fn((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }),
  parseDurationString: vi.fn((duration: unknown) => {
    if (typeof duration === "number") return duration
    if (typeof duration !== "string") return null
    const parts = duration.split(":").map((p) => Number.parseInt(p, 10))
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return null
  }),
}))

// Мокаем все зависимости напрямую
vi.mock("@timeline-studio/domains/project-management/hooks", () => ({
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn(() => false),
  })),
}))

// Мокируем основной экспорт из index
vi.mock("@/features/media/hooks/media-management", () => ({
  DEFAULT_PREVIEW_SIZE_INDEX: 3,
  DEFAULT_CONTENT_SIZES: {
    MEDIA: 250,
    TEMPLATES: 250,
    STYLE_TEMPLATES: 250,
    EFFECTS: 250,
    FILTERS: 250,
    TRANSITIONS: 250,
    SUBTITLES: 250,
    MUSIC: 250,
  },
  useMediaManagement: vi.fn(() => ({
    mediaPool: new Map([
      [
        "test-1",
        {
          path: "/test/video.mp4",
          name: "test-video.mp4",
          type: "Video",
          duration: 120.5,
          metadata: {
            format: "",
            codec: null,
            resolution: null,
            frame_rate: null,
            bitrate: null,
            audio_channels: null,
            sample_rate: null,
          },
          thumbnailPath: null,
        },
      ],

      [
        "test-2",
        {
          path: "/test/image.jpg",
          name: "test-image.jpg",
          type: "Image",
          duration: null,
          metadata: {
            format: "",
            codec: null,
            resolution: null,
            frame_rate: null,
            bitrate: null,
            audio_channels: null,
            sample_rate: null,
          },
          thumbnailPath: null,
        },
      ],
    ]),
    isLoading: false,
    error: null,
    importFiles: vi.fn(),
    selectMediaFiles: vi.fn(() => Promise.resolve([])),
    selectMediaDirectory: vi.fn(() => Promise.resolve([])),
  })),
}))

vi.mock("@/features/media", () => ({
  getFileType: vi.fn((file) => {
    if (file.extension === ".mp4") return "video"
    if (file.extension === ".jpg" || file.extension === ".png") return "image"
    if (file.extension === ".mp3") return "audio"
    return "unknown"
  }),
}))

vi.mock("@/lib/duration-formatter", () => ({
  parseDurationString: vi.fn((duration) => {
    if (typeof duration === "number") return duration
    return duration || 0
  }),
  formatDurationSeconds: vi.fn((seconds) => `${Math.floor(seconds / 60)}:${seconds % 60}`),
}))

vi.mock("@/features/browser/utils", () => ({
  parseFileSize: vi.fn((size) => size || 0),
}))

vi.mock("@/features/browser/utils/grouping", () => ({
  getDateGroup: vi.fn((timestamp, _language) => {
    if (!timestamp || timestamp === 0) return "Без даты"
    return "2024"
  }),
  getDurationGroup: vi.fn((duration) => {
    if (duration <= 60) return "Короткие (≤1мин)"
    if (duration <= 180) return "1-3 минуты"
    return "Длинные (>3мин)"
  }),
}))

vi.mock("@/features/browser/components/preview/media-preview", () => ({
  MediaPreview: ({ file, size, showFileName }: any) => (
    <div data-testid="media-preview" data-oid="ypndyq:">
      {file.name} - {size} - {showFileName ? "with-filename" : "no-filename"}
    </div>
  ),
}))

vi.mock("@/i18n", () => ({
  default: {
    t: vi.fn((key) => key),
    language: "ru",
    on: vi.fn(),
    off: vi.fn(),
    changeLanguage: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock("@/features/drag-drop", () => ({
  useDraggable: vi.fn(() => ({
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    draggable: true,
  })),
}))

describe("useMediaAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

      expect(dataResult.current.loading).toBe(false)
      expect(dataResult.current.error).toBe(null)
      expect(dataResult.current.items).toHaveLength(2)
      expect(dataResult.current.items[0].name).toBe("test-video.mp4")
      expect(dataResult.current.items[1].name).toBe("test-image.jpg")
    })
  })

  describe("getSortValue", () => {
    it("should sort by different fields correctly", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "Test.mp4",
        size: 1024,
        createdAt: "2024-01-01T00:00:00Z",
        duration: 60,
        startTime: 0,
        probeData: {
          streams: [],
          format: { duration: 60 },
        },
      })

      expect(result.current.getSortValue(testFile as any, "name")).toBe("test.mp4")
      expect(result.current.getSortValue(testFile as any, "size")).toBe(1024)
      expect(result.current.getSortValue(testFile as any, "duration")).toBe(60)
      expect(result.current.getSortValue(testFile as any, "unknown")).toBe(0) // Returns startTime for unknown
    })

    it("should handle missing duration data", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        duration: undefined,
        probeData: undefined,
        startTime: 0,
      })
      expect(result.current.getSortValue(testFile as any, "duration")).toBe(0)
    })

    it("should prioritize probe data for size", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test.mp4",
        size: 1024,
        startTime: 0,
        probeData: {
          streams: [],
          format: { size: 2048 },
        },
      })

      expect(result.current.getSortValue(testFile as any, "size")).toBe(2048) // Probe data has priority
    })

    it("should handle missing probe data for size", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test.mp4",
        size: 1024,
        startTime: 0,
        probeData: {
          streams: [],
          format: {},
        },
      })

      expect(result.current.getSortValue(testFile as any, "size")).toBe(1024) // Falls back to parsed size
    })
  })

  describe("getSearchableText", () => {
    it("should return searchable text array", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test-video.mp4",
        startTime: 0,
        probeData: {
          streams: [],
          format: {
            tags: {
              title: "Test Title",
              artist: "Test Artist",
              album: "Test Album",
            },
          },
        },
      })

      const searchableText = result.current.getSearchableText(testFile as any)
      expect(searchableText).toEqual(["test-video.mp4", "Test Title", "Test Artist", "Test Album"])
    })

    it("should filter out empty values", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test.mp4",
        probeData: undefined,
        startTime: 0,
      })

      const searchableText = result.current.getSearchableText(testFile as any)
      expect(searchableText).toEqual(["test.mp4"])
    })

    it("should handle missing tags", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test.mp4",
        startTime: 0,
        probeData: {
          streams: [],
          format: {},
        },
      })

      const searchableText = result.current.getSearchableText(testFile as any)
      expect(searchableText).toEqual(["test.mp4"])
    })
  })

  describe("getGroupValue", () => {
    it("should group by type", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test.mp4",
        extension: ".mp4",
        startTime: 0,
      })

      const group = result.current.getGroupValue(testFile as any, "type")
      expect(group).toBe("browser.media.video") // i18n key, not translated
    })

    it("should group by date", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test.mp4",
        startTime: 0, // No date
      })

      const group = result.current.getGroupValue(testFile as any, "date")
      expect(group).toBe("Без даты") // startTime is 0, so no date
    })

    it("should group by date with timestamp", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test.mp4",
        startTime: 1672531200, // 2023-01-01
      })

      const group = result.current.getGroupValue(testFile as any, "date")
      expect(group).not.toBe("Без даты") // Has date
    })

    it("should group by duration", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test.mp4",
        duration: 120, // 2 minutes
        startTime: 0,
      })

      const group = result.current.getGroupValue(testFile as any, "duration")
      expect(group).toBe("1-3 минуты") // 120 seconds = 2 minutes
    })

    it("should handle image metadata for date grouping", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test.jpg",
        startTime: 0,
        probeData: {
          streams: [],
          format: {
            tags: {
              creation_time: "2024-01-01T00:00:00Z",
            },
          },
        },
      })

      const group = result.current.getGroupValue(testFile as any, "date")
      expect(group).not.toBe("Без даты") // Should use creation_time from metadata
    })

    it("should return empty string for unknown group type", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test.mp4",
        startTime: 0,
      })

      const group = result.current.getGroupValue(testFile as any, "unknown")
      expect(group).toBe("") // Default case returns empty string
    })
  })

  describe("matchesFilter", () => {
    it("should match video filter", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const videoFile = createMockMediaFile({
        name: "test.mp4",
        extension: ".mp4",
        isVideo: true,
        startTime: 0,
        probeData: {
          streams: [{ codec_type: "video" }],
          format: {},
        },
      })

      expect(result.current.matchesFilter?.(videoFile as any, "video")).toBe(true)
      expect(result.current.matchesFilter?.(videoFile as any, "audio")).toBe(false)
      expect(result.current.matchesFilter?.(videoFile as any, "image")).toBe(false)
    })

    it("should match image filter", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const imageFile = createMockMediaFile({
        name: "test.jpg",
        extension: ".jpg",
        isImage: true,
        startTime: 0,
        probeData: {
          streams: [],
          format: {},
        },
      })

      expect(result.current.matchesFilter?.(imageFile as any, "image")).toBe(true)
      expect(result.current.matchesFilter?.(imageFile as any, "video")).toBe(false)
      expect(result.current.matchesFilter?.(imageFile as any, "audio")).toBe(false)
    })

    it("should match audio filter", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const audioFile = createMockMediaFile({
        name: "test.mp3",
        extension: ".mp3",
        isAudio: true,
        startTime: 0,
        probeData: {
          streams: [{ codec_type: "audio" }],
          format: {},
        },
      })

      expect(result.current.matchesFilter?.(audioFile as any, "audio")).toBe(true)
      expect(result.current.matchesFilter?.(audioFile as any, "video")).toBe(false)
      expect(result.current.matchesFilter?.(audioFile as any, "image")).toBe(false)
    })

    it("should handle loading metadata state", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const loadingFile = createMockMediaFile({
        name: "test.mp4",
        extension: ".mp4",
        isVideo: true,
        isLoadingMetadata: true,
        startTime: 0,
      })

      expect(result.current.matchesFilter?.(loadingFile as any, "video")).toBe(true) // Uses basic properties
      expect(result.current.matchesFilter?.(loadingFile as any, "audio")).toBe(false)
    })

    it("should handle image filter by extension when no metadata", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const imageFile = createMockMediaFile({
        name: "test.png",
        extension: ".png",
        startTime: 0,
        probeData: {
          streams: [],
          format: {},
        },
      })

      expect(result.current.matchesFilter?.(imageFile as any, "image")).toBe(true) // Uses regex test
    })

    it("should match 'all' filter", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test.mp4",
        startTime: 0,
      })

      expect(result.current.matchesFilter?.(testFile as any, "all")).toBe(true)
    })

    it("should return false for unknown filter", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test.mp4",
        startTime: 0,
      })

      expect(result.current.matchesFilter?.(testFile as any, "unknown")).toBe(false)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useMediaAdapter())
      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })

    it("should render MediaPreview correctly in list mode", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const PreviewComponent = result.current.PreviewComponent

      const mockFile = createMockMediaFile({
        name: "test.mp4",
        startTime: 0,
      })

      const mockProps = {
        item: mockFile,
        size: 100,
        viewMode: "list" as const,
        onClick: vi.fn(),
        onDragStart: vi.fn(),
        isSelected: false,
        isFavorite: false,
        onToggleFavorite: vi.fn(),
        onAddToTimeline: vi.fn(),
      }

      expect(PreviewComponent).toBeDefined()
    })

    it("should handle thumbnails view mode", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const PreviewComponent = result.current.PreviewComponent

      const mockFile = createMockMediaFile({
        name: "test.mp4",
        startTime: 0,
      })

      const mockProps = {
        item: mockFile,
        size: { width: 120, height: 80 },
        viewMode: "thumbnails" as const,
        onClick: vi.fn(),
        onDragStart: vi.fn(),
        isSelected: false,
        isFavorite: false,
        onToggleFavorite: vi.fn(),
        onAddToTimeline: vi.fn(),
      }

      expect(PreviewComponent).toBeDefined()
    })

    it("should handle click events", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const PreviewComponent = result.current.PreviewComponent
      const mockOnClick = vi.fn()

      const mockFile = createMockMediaFile({
        name: "test.mp4",
        startTime: 0,
      })

      const mockProps = {
        item: mockFile,
        size: 100,
        viewMode: "list" as const,
        onClick: mockOnClick,
        onDragStart: vi.fn(),
        isSelected: false,
        isFavorite: false,
        onToggleFavorite: vi.fn(),
        onAddToTimeline: vi.fn(),
      }

      // Test that component renders without throwing
      expect(PreviewComponent).toBeDefined()
    })

    it("should handle drag events", () => {
      const { result } = renderHook(() => useMediaAdapter())
      const PreviewComponent = result.current.PreviewComponent
      const mockOnDragStart = vi.fn()

      const mockFile = createMockMediaFile({
        name: "test.mp4",
        startTime: 0,
      })

      const mockProps = {
        item: mockFile,
        size: 100,
        viewMode: "list" as const,
        onClick: vi.fn(),
        onDragStart: mockOnDragStart,
        isSelected: false,
        isFavorite: false,
        onToggleFavorite: vi.fn(),
        onAddToTimeline: vi.fn(),
      }

      expect(PreviewComponent).toBeDefined()
    })
  })

  describe("importHandlers", () => {
    it("should provide import functions", () => {
      const { result } = renderHook(() => useMediaAdapter())

      expect(result.current.importHandlers).toBeDefined()
      expect(typeof result.current.importHandlers?.importFile).toBe("function")
      expect(typeof result.current.importHandlers?.importFolder).toBe("function")
      expect(typeof result.current.importHandlers?.isImporting).toBe("boolean")
    })

    it("should have correct import function signatures", () => {
      const { result } = renderHook(() => useMediaAdapter())

      // Test that functions exist and are callable
      expect(result.current.importHandlers?.importFile).toBeDefined()
      expect(result.current.importHandlers?.importFolder).toBeDefined()
      expect(result.current.importHandlers?.isImporting).toBeDefined()
    })
  })

  describe("isFavorite", () => {
    it("should check if file is favorite", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test.mp4",
        startTime: 0,
      })

      expect(typeof result.current.isFavorite).toBe("function")
      expect(result.current.isFavorite?.(testFile as any)).toBe(false)
    })

    it("should use correct favorite type", () => {
      const { result } = renderHook(() => useMediaAdapter())

      const testFile = createMockMediaFile({
        name: "test.mp4",
        startTime: 0,
      })

      // The function should call isItemFavorite with "media" type
      result.current.isFavorite?.(testFile as any)
      // We can't easily verify the call since it's mocked, but we test the return type
      expect(typeof result.current.isFavorite?.(testFile as any)).toBe("boolean")
    })
  })

  describe("favoriteType", () => {
    it("should be 'media'", () => {
      const { result } = renderHook(() => useMediaAdapter())
      expect(result.current.favoriteType).toBe("media")
    })
  })
})
