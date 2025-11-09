import "@testing-library/jest-dom/vitest"

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMusicAdapter } from "@/features/browser/adapters/use-music-adapter"
import { MediaType } from "@/features/media/types/media"

// Mock модулей
vi.mock("@/features/app-state", () => ({
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn(() => false),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
  })),
  useMusicFiles: vi.fn(() => ({
    musicFiles: [],
    updateMusicFiles: vi.fn(),
  })),
}))

vi.mock("@/features/browser/hooks/use-music-import", () => ({
  useMusicImport: vi.fn(() => ({
    importFile: vi.fn(),
    importDirectory: vi.fn(),
    isImporting: false,
    progress: 0,
  })),
}))

vi.mock("@/features/resources", () => ({
  useResources: vi.fn(() => ({
    isMusicAdded: vi.fn(() => false),
  })),
}))

vi.mock("@/features/drag-drop", () => ({
  useDraggable: vi.fn(() => ({})),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "ru",
    },
  }),
}))

// Import mocked modules after vi.mock
const { useMusicFiles } = await import("@/features/app-state")
const { useMusicImport } = await import("@/features/browser/hooks/use-music-import")

describe("useMusicAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useData", () => {
    it("should return empty array when no music files", () => {
      // Need to create a test component to use the hook
      function TestComponent() {
        const adapter = useMusicAdapter()
        const { items, loading, error } = adapter.useData()

        return (
          <div>
            <div data-testid="items-count">{items.length}</div>
            <div data-testid="loading">{loading.toString()}</div>
            <div data-testid="error">{error?.message || "null"}</div>
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByTestId("items-count")).toHaveTextContent("0")
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
      expect(screen.getByTestId("error")).toHaveTextContent("null")
    })

    it("should return music files when available", () => {
      const mockMusicFiles = [
        {
          id: "1",
          name: "song1.mp3",
          path: "/path/to/song1.mp3",
          type: MediaType.Music,
          media_type: MediaType.Music,
          duration: 180,
          metadata: {
            artist: "Artist 1",
            title: "Song 1",
          },
          thumbnail: null,
          usage_count: 0,
          isAudio: true,
          isVideo: false,
          isImage: false,
          probeData: {
            format: {
              duration: 180,
              tags: {
                artist: "Artist 1",
                title: "Song 1",
              },
            },
            streams: [],
          },
        },
        {
          id: "2",
          name: "song2.mp3",
          path: "/path/to/song2.mp3",
          type: MediaType.Music,
          media_type: MediaType.Music,
          duration: 200,
          metadata: {
            artist: "Artist 2",
            title: "Song 2",
          },
          thumbnail: null,
          usage_count: 0,
          isAudio: true,
          isVideo: false,
          isImage: false,
          probeData: {
            format: {
              duration: 200,
              tags: {
                artist: "Artist 2",
                title: "Song 2",
              },
            },
            streams: [],
          },
        },
      ]

      vi.mocked(useMusicFiles).mockReturnValue({
        musicFiles: mockMusicFiles as any,
        addMusicFile: vi.fn(),
        removeMusicFile: vi.fn(),
        updateMusicFile: vi.fn(),
        updateMusicFiles: vi.fn(),
      })

      function TestComponent() {
        const adapter = useMusicAdapter()
        const { items } = adapter.useData()

        return <div data-testid="items-count">{items.length}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("items-count")).toHaveTextContent("2")
    })
  })

  describe("getSortValue", () => {
    it("should sort by name", () => {
      const mockFile = {
        id: "1",
        name: "Song.mp3",
        path: "/path/to/song.mp3",
        type: MediaType.Music,
        media_type: MediaType.Music as any,
        duration: 0,
        metadata: {},
        thumbnail: null,
        usage_count: 0,
        isAudio: true,
        isVideo: false,
        isImage: false,
        probeData: {
          format: {},
          streams: [],
        },
      }

      vi.mocked(useMusicFiles).mockReturnValue({
        musicFiles: [mockFile] as any,
        addMusicFile: vi.fn(),
        removeMusicFile: vi.fn(),
        updateMusicFile: vi.fn(),
        updateMusicFiles: vi.fn(),
      })

      function TestComponent() {
        const adapter = useMusicAdapter()
        const sortValue = adapter.getSortValue(mockFile as any, "name")

        return <div data-testid="sort-value">{sortValue}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("sort-value")).toHaveTextContent("song.mp3")
    })

    it("should sort by title from metadata", () => {
      const mockFile = {
        id: "1",
        name: "file.mp3",
        path: "/path/to/file.mp3",
        type: MediaType.Music,
        media_type: MediaType.Music as any,
        duration: 0,
        metadata: {
          title: "Beautiful Song",
        },
        thumbnail: null,
        usage_count: 0,
        isAudio: true,
        isVideo: false,
        isImage: false,
        probeData: {
          format: {
            tags: {
              title: "Beautiful Song",
            },
          },
          streams: [],
        },
      }

      vi.mocked(useMusicFiles).mockReturnValue({
        musicFiles: [mockFile] as any,
        addMusicFile: vi.fn(),
        removeMusicFile: vi.fn(),
        updateMusicFile: vi.fn(),
        updateMusicFiles: vi.fn(),
      })

      function TestComponent() {
        const adapter = useMusicAdapter()
        const sortValue = adapter.getSortValue(mockFile as any, "title")

        return <div data-testid="sort-value">{sortValue}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("sort-value")).toHaveTextContent("beautiful song")
    })

    it("should sort by artist", () => {
      const mockFile = {
        id: "1",
        name: "song.mp3",
        path: "/path/to/song.mp3",
        type: MediaType.Music,
        media_type: MediaType.Music as any,
        duration: 0,
        metadata: {
          artist: "The Beatles",
        },
        thumbnail: null,
        usage_count: 0,
        isAudio: true,
        isVideo: false,
        isImage: false,
        probeData: {
          format: {
            tags: {
              artist: "The Beatles",
            },
          },
          streams: [],
        },
      }

      vi.mocked(useMusicFiles).mockReturnValue({
        musicFiles: [mockFile] as any,
        addMusicFile: vi.fn(),
        removeMusicFile: vi.fn(),
        updateMusicFile: vi.fn(),
        updateMusicFiles: vi.fn(),
      })

      function TestComponent() {
        const adapter = useMusicAdapter()
        const sortValue = adapter.getSortValue(mockFile as any, "artist")

        return <div data-testid="sort-value">{sortValue}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("sort-value")).toHaveTextContent("the beatles")
    })

    it("should sort by duration", () => {
      const mockFile = {
        id: "1",
        name: "song.mp3",
        path: "/path/to/song.mp3",
        type: MediaType.Music,
        media_type: MediaType.Music as any,
        duration: 180.5,
        metadata: {},
        thumbnail: null,
        usage_count: 0,
        isAudio: true,
        isVideo: false,
        isImage: false,
        probeData: {
          format: {
            duration: 180.5,
          },
          streams: [],
        },
      }

      vi.mocked(useMusicFiles).mockReturnValue({
        musicFiles: [mockFile] as any,
        addMusicFile: vi.fn(),
        removeMusicFile: vi.fn(),
        updateMusicFile: vi.fn(),
        updateMusicFiles: vi.fn(),
      })

      function TestComponent() {
        const adapter = useMusicAdapter()
        const sortValue = adapter.getSortValue(mockFile as any, "duration")

        return <div data-testid="sort-value">{sortValue}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("sort-value")).toHaveTextContent("180.5")
    })
  })

  describe("getSearchableText", () => {
    it("should return searchable fields", () => {
      const mockFile = {
        id: "1",
        name: "song.mp3",
        path: "/path/to/song.mp3",
        type: MediaType.Music,
        media_type: MediaType.Music as any,
        duration: 0,
        metadata: {
          title: "Beautiful Song",
          artist: "Artist Name",
          album: "Album Name",
          genre: "Rock",
        },
        thumbnail: null,
        usage_count: 0,
        isAudio: true,
        isVideo: false,
        isImage: false,
        probeData: {
          format: {
            tags: {
              title: "Beautiful Song",
              artist: "Artist Name",
              album: "Album Name",
              genre: "Rock",
            },
          },
          streams: [],
        },
      }

      vi.mocked(useMusicFiles).mockReturnValue({
        musicFiles: [mockFile] as any,
        addMusicFile: vi.fn(),
        removeMusicFile: vi.fn(),
        updateMusicFile: vi.fn(),
        updateMusicFiles: vi.fn(),
      })

      function TestComponent() {
        const adapter = useMusicAdapter()
        const searchableText = adapter.getSearchableText(mockFile as any)

        return <div data-testid="searchable">{searchableText.join(", ")}</div>
      }

      render(<TestComponent />)

      const text = screen.getByTestId("searchable").textContent
      expect(text).toContain("song.mp3")
      expect(text).toContain("Beautiful Song")
      expect(text).toContain("Artist Name")
      expect(text).toContain("Album Name")
      expect(text).toContain("Rock")
    })
  })

  describe("getGroupValue", () => {
    it("should group by artist", () => {
      const mockFile = {
        id: "1",
        name: "song.mp3",
        path: "/path/to/song.mp3",
        type: MediaType.Music,
        media_type: MediaType.Music as any,
        duration: 0,
        metadata: {
          artist: "The Beatles",
        },
        thumbnail: null,
        usage_count: 0,
        isAudio: true,
        isVideo: false,
        isImage: false,
        probeData: {
          format: {
            tags: {
              artist: "The Beatles",
            },
          },
          streams: [],
        },
      }

      vi.mocked(useMusicFiles).mockReturnValue({
        musicFiles: [mockFile] as any,
        addMusicFile: vi.fn(),
        removeMusicFile: vi.fn(),
        updateMusicFile: vi.fn(),
        updateMusicFiles: vi.fn(),
      })

      function TestComponent() {
        const adapter = useMusicAdapter()
        const groupValue = adapter.getGroupValue(mockFile as any, "artist")

        return <div data-testid="group-value">{groupValue}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("group-value")).toHaveTextContent("The Beatles")
    })

    it("should return default for unknown artist", () => {
      const mockFile = {
        id: "1",
        name: "song.mp3",
        path: "/path/to/song.mp3",
        type: MediaType.Music,
        media_type: MediaType.Music as any,
        duration: 180,
        metadata: {
          artist: "Test Artist",
          title: "Test Song",
        },
        thumbnail: null,
        usage_count: 0,
        isAudio: true,
        isVideo: false,
        isImage: false,
        probeData: {
          format: {},
          streams: [],
        },
      }

      vi.mocked(useMusicFiles).mockReturnValue({
        musicFiles: [mockFile] as any,
        addMusicFile: vi.fn(),
        removeMusicFile: vi.fn(),
        updateMusicFile: vi.fn(),
        updateMusicFiles: vi.fn(),
      })

      function TestComponent() {
        const adapter = useMusicAdapter()
        const groupValue = adapter.getGroupValue(mockFile as any, "artist")

        return <div data-testid="group-value">{groupValue}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("group-value")).toHaveTextContent("Неизвестный исполнитель")
    })

    it("should group by genre", () => {
      const mockFile = {
        id: "1",
        name: "song.mp3",
        path: "/path/to/song.mp3",
        type: MediaType.Music,
        media_type: MediaType.Music as any,
        duration: 0,
        metadata: {
          genre: "Rock",
        },
        thumbnail: null,
        usage_count: 0,
        isAudio: true,
        isVideo: false,
        isImage: false,
        probeData: {
          format: {
            tags: {
              genre: "Rock",
            },
          },
          streams: [],
        },
      }

      vi.mocked(useMusicFiles).mockReturnValue({
        musicFiles: [mockFile] as any,
        addMusicFile: vi.fn(),
        removeMusicFile: vi.fn(),
        updateMusicFile: vi.fn(),
        updateMusicFiles: vi.fn(),
      })

      function TestComponent() {
        const adapter = useMusicAdapter()
        const groupValue = adapter.getGroupValue(mockFile as any, "genre")

        return <div data-testid="group-value">{groupValue}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("group-value")).toHaveTextContent("Rock")
    })
  })

  describe("matchesFilter", () => {
    it("should match all filter", () => {
      const mockFile = {
        id: "1",
        name: "song.mp3",
        path: "/path/to/song.mp3",
        type: MediaType.Music,
        media_type: MediaType.Music as any,
        duration: 180,
        metadata: {
          artist: "Test Artist",
          title: "Test Song",
        },
        thumbnail: null,
        usage_count: 0,
        isAudio: true,
        isVideo: false,
        isImage: false,
        probeData: {
          format: {},
          streams: [],
        },
      }

      vi.mocked(useMusicFiles).mockReturnValue({
        musicFiles: [mockFile] as any,
        addMusicFile: vi.fn(),
        removeMusicFile: vi.fn(),
        updateMusicFile: vi.fn(),
        updateMusicFiles: vi.fn(),
      })

      function TestComponent() {
        const adapter = useMusicAdapter()
        const matches = adapter.matchesFilter?.(mockFile as any, "all") ?? false

        return <div data-testid="matches">{matches.toString()}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("matches")).toHaveTextContent("true")
    })

    it("should filter by extension", () => {
      const mockFile = {
        id: "1",
        name: "song.mp3",
        path: "/path/to/song.mp3",
        type: MediaType.Music,
        media_type: MediaType.Music as any,
        duration: 180,
        metadata: {
          artist: "Test Artist",
          title: "Test Song",
        },
        thumbnail: null,
        usage_count: 0,
        isAudio: true,
        isVideo: false,
        isImage: false,
        probeData: {
          format: {},
          streams: [],
        },
      }

      vi.mocked(useMusicFiles).mockReturnValue({
        musicFiles: [mockFile] as any,
        addMusicFile: vi.fn(),
        removeMusicFile: vi.fn(),
        updateMusicFile: vi.fn(),
        updateMusicFiles: vi.fn(),
      })

      function TestComponent() {
        const adapter = useMusicAdapter()
        const matchesMp3 = adapter.matchesFilter?.(mockFile as any, "mp3") ?? false
        const matchesWav = adapter.matchesFilter?.(mockFile as any, "wav") ?? false

        return (
          <div>
            <div data-testid="matches-mp3">{matchesMp3.toString()}</div>
            <div data-testid="matches-wav">{matchesWav.toString()}</div>
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByTestId("matches-mp3")).toHaveTextContent("true")
      expect(screen.getByTestId("matches-wav")).toHaveTextContent("false")
    })
  })

  describe("importHandlers", () => {
    it("should provide import handlers", () => {
      const mockImportFile = vi.fn()
      const mockImportDirectory = vi.fn()

      vi.mocked(useMusicImport).mockReturnValue({
        importFile: mockImportFile,
        importDirectory: mockImportDirectory,
        isImporting: true,
        progress: 50,
      })

      function TestComponent() {
        const adapter = useMusicAdapter()

        return (
          <div>
            <div data-testid="has-import">{(!!adapter.importHandlers).toString()}</div>
            <div data-testid="is-importing">{adapter.importHandlers?.isImporting?.toString()}</div>
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByTestId("has-import")).toHaveTextContent("true")
      expect(screen.getByTestId("is-importing")).toHaveTextContent("true")
    })
  })

  describe("favoriteType", () => {
    it("should have music favorite type", () => {
      function TestComponent() {
        const adapter = useMusicAdapter()

        return <div data-testid="favorite-type">{adapter.favoriteType}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("favorite-type")).toHaveTextContent("music")
    })
  })
})
