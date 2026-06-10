/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest"

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MediaType } from "@timeline-studio/domains/media-management"
import { useMusicAdapter } from "@/features/browser/adapters/use-music-adapter"

// Mock модулей
vi.mock("@timeline-studio/core/hooks", () => ({
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn(() => false),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
  })),
}))

vi.mock("@/features/browser/services/project-music", () => ({
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
const { useMusicFiles } = await import("@/features/browser/services/project-music")
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
          <div data-oid="64xr-x2">
            <div data-testid="items-count" data-oid="0n1.63:">
              {items.length}
            </div>
            <div data-testid="loading" data-oid="qq304:.">
              {loading.toString()}
            </div>
            <div data-testid="error" data-oid="4-_2xo_">
              {error?.message || "null"}
            </div>
          </div>
        )
      }

      render(<TestComponent data-oid="vo3iqo1" />)

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

        return (
          <div data-testid="items-count" data-oid="nyt.qp3">
            {items.length}
          </div>
        )
      }

      render(<TestComponent data-oid="zpguf37" />)

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

        return (
          <div data-testid="sort-value" data-oid="n629i3k">
            {sortValue}
          </div>
        )
      }

      render(<TestComponent data-oid="vkk3srq" />)

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

        return (
          <div data-testid="sort-value" data-oid="23ae44h">
            {sortValue}
          </div>
        )
      }

      render(<TestComponent data-oid="pvlhvva" />)

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

        return (
          <div data-testid="sort-value" data-oid="eycdeuf">
            {sortValue}
          </div>
        )
      }

      render(<TestComponent data-oid="vflqozp" />)

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

        return (
          <div data-testid="sort-value" data-oid="yebpjqx">
            {sortValue}
          </div>
        )
      }

      render(<TestComponent data-oid="nivieee" />)

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

        return (
          <div data-testid="searchable" data-oid="gp9_.7a">
            {searchableText.join(", ")}
          </div>
        )
      }

      render(<TestComponent data-oid="6rqu1:f" />)

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

        return (
          <div data-testid="group-value" data-oid="l995n2r">
            {groupValue}
          </div>
        )
      }

      render(<TestComponent data-oid="e-vrwrf" />)

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

        return (
          <div data-testid="group-value" data-oid="honokrf">
            {groupValue}
          </div>
        )
      }

      render(<TestComponent data-oid="2:3ckph" />)

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

        return (
          <div data-testid="group-value" data-oid="8nf_m6h">
            {groupValue}
          </div>
        )
      }

      render(<TestComponent data-oid="2bjdnsb" />)

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

        return (
          <div data-testid="matches" data-oid="6lszh:2">
            {matches.toString()}
          </div>
        )
      }

      render(<TestComponent data-oid="3f-s7z_" />)

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
          <div data-oid="o570.7i">
            <div data-testid="matches-mp3" data-oid="2wmauzu">
              {matchesMp3.toString()}
            </div>
            <div data-testid="matches-wav" data-oid="02w_q-i">
              {matchesWav.toString()}
            </div>
          </div>
        )
      }

      render(<TestComponent data-oid="w_.qm9t" />)

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
          <div data-oid="leekmuf">
            <div data-testid="has-import" data-oid="-kpjxg6">
              {(!!adapter.importHandlers).toString()}
            </div>
            <div data-testid="is-importing" data-oid="xr4z8zy">
              {adapter.importHandlers?.isImporting?.toString()}
            </div>
          </div>
        )
      }

      render(<TestComponent data-oid="tcpi3a-" />)

      expect(screen.getByTestId("has-import")).toHaveTextContent("true")
      expect(screen.getByTestId("is-importing")).toHaveTextContent("true")
    })
  })

  describe("favoriteType", () => {
    it("should have music favorite type", () => {
      function TestComponent() {
        const adapter = useMusicAdapter()

        return (
          <div data-testid="favorite-type" data-oid="pci:o1x">
            {adapter.favoriteType}
          </div>
        )
      }

      render(<TestComponent data-oid="on1lwm_" />)

      expect(screen.getByTestId("favorite-type")).toHaveTextContent("music")
    })
  })
})
