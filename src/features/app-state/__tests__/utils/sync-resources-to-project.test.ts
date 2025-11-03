/**
 * Tests for sync-resources-to-project.ts
 * Comprehensive testing of resource synchronization utilities
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MediaFile } from "@/features/media/types/media"
import type { MediaPoolItem } from "@/features/media/types/media-pool"
import { convertMediaFileToPoolItem } from "@/features/media/utils/media-pool-utils"
import type { TimelineStudioProject } from "@/features/project-settings/types/timeline-studio-project"
import type { MediaResource, MusicResource } from "@/features/resources/types"

import { getResourcesFromStorage, syncResourcesToProject } from "../../utils/sync-resources-to-project"

// Mock dependencies
vi.mock("@/features/media/utils/media-pool-utils", () => ({
  convertMediaFileToPoolItem: vi.fn(),
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
})

describe("sync-resources-to-project", () => {
  const mockMediaFile: MediaFile = {
    id: "media-1",
    name: "test-video.mp4",
    path: "/path/to/test-video.mp4",
    size: 1000000,
    isVideo: true,
    isAudio: false,
    isImage: false,
    duration: 30,
  }

  const mockMusicFile: MediaFile = {
    id: "music-1",
    name: "background-music.mp3",
    path: "/path/to/background-music.mp3",
    size: 500000,
    isVideo: false,
    isAudio: true,
    isImage: false,
    duration: 120,
  }

  const mockMediaPoolItem: MediaPoolItem = {
    id: "pool-item-1",
    type: "video",
    name: "test-video.mp4",
    source: {
      path: "/path/to/test-video.mp4",
      relativePath: "test-video.mp4",
      hash: "abc123",
    },
    status: "online",
    binId: "root",
    metadata: {
      duration: 30,
      frameRate: 30,
      resolution: { width: 1920, height: 1080 },
      fileSize: 1000000,
      codec: "h264",
      bitRate: 5000000,
      createdDate: new Date("2023-01-01"),
      modifiedDate: new Date("2023-01-01"),
      importedDate: new Date("2023-01-01"),
    },
    usage: {
      sequences: [],
      count: 0,
    },
    tags: [],
  }

  const mockMusicPoolItem: MediaPoolItem = {
    id: "pool-item-2",
    type: "audio",
    name: "background-music.mp3",
    source: {
      path: "/path/to/background-music.mp3",
      relativePath: "background-music.mp3",
      hash: "def456",
    },
    status: "online",
    binId: "music",
    metadata: {
      duration: 120,
      fileSize: 500000,
      codec: "mp3",
      bitRate: 128000,
      createdDate: new Date("2023-01-01"),
      modifiedDate: new Date("2023-01-01"),
      importedDate: new Date("2023-01-01"),
    },
    usage: {
      sequences: [],
      count: 0,
    },
    tags: [],
  }

  const createMockProject = (): TimelineStudioProject => ({
    metadata: {
      id: "project-1",
      name: "Test Project",
      version: "1.0.0",
      created: new Date("2023-01-01"),
      modified: new Date("2023-01-01"),
      platform: "macos",
      appVersion: "1.0.0",
    },
    settings: {
      aspectRatio: {
        label: "16:9",
        textLabel: "Widescreen",
        description: "YouTube",
        value: { width: 1920, height: 1080, name: "16:9" },
      },
      resolution: "1920x1080",
      frameRate: "30",
      colorSpace: "sdr",
      audio: {
        sampleRate: 48000,
        channels: 2,
        bitDepth: 24,
        masterVolume: 1.0,
        panLaw: "-3dB" as const,
      },
      preview: {
        resolution: "full" as const,
        quality: "best" as const,
        renderDuringPlayback: true,
        useGPU: true,
      },
      exportPresets: [],
    },
    mediaPool: {
      items: new Map(),
      bins: new Map([
        [
          "root",
          {
            id: "root",
            name: "Root",
            parentId: null,
            sortOrder: 0,
            createdDate: new Date("2023-01-01"),
          },
        ],
      ]),
      smartCollections: [],
      viewSettings: {
        sortBy: "name" as const,
        sortOrder: "asc" as const,
        viewMode: "list" as const,
        thumbnailSize: "medium" as const,
        showOfflineMedia: true,
        showProxyBadge: true,
      },
      stats: {
        totalItems: 0,
        totalSize: 0,
        onlineItems: 0,
        offlineItems: 0,
        proxyItems: 0,
        unusedItems: 0,
      },
    },
    sequences: new Map(),
    activeSequenceId: "seq-1",
    cache: {
      thumbnails: new Map(),
      waveforms: new Map(),
      proxies: new Map(),
      sceneAnalysis: new Map(),
      totalSize: 0,
    },
    workspace: {
      layout: "edit" as const,
      panels: {},
      recentTools: [],
      grid: {
        enabled: true,
        size: 10,
        snapToGrid: true,
        snapToClips: true,
        magneticTimeline: true,
      },
    },
    backup: {
      autoSave: {
        enabled: true,
        interval: 5,
        keepVersions: 10,
      },
      versions: [],
      lastSaved: new Date("2023-01-01"),
    },
  })

  const mockMediaResource: MediaResource = {
    id: "resource-1",
    type: "media",
    name: "Test Video",
    resourceId: "media-1",
    addedAt: Date.now(),
    file: mockMediaFile,
  }

  const mockMusicResource: MusicResource = {
    id: "resource-2",
    type: "music",
    name: "Background Music",
    resourceId: "music-1",
    addedAt: Date.now(),
    file: mockMusicFile,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe("syncResourcesToProject", () => {
    it("should sync media and music resources to project", () => {
      const project = createMockProject()
      vi.mocked(convertMediaFileToPoolItem)
        .mockReturnValueOnce(mockMediaPoolItem)
        .mockReturnValueOnce(mockMusicPoolItem)

      const result = syncResourcesToProject(project, [mockMediaResource], [mockMusicResource])

      expect(result).not.toBe(project) // Should return a new object
      expect(result.mediaPool.items.size).toBe(2)
      expect(result.mediaPool.items.has("pool-item-1")).toBe(true)
      expect(result.mediaPool.items.has("pool-item-2")).toBe(true)
    })

    it("should update existing items when syncing resources with same ID", () => {
      const project = createMockProject()
      const existingItem = { ...mockMediaPoolItem, id: "pool-item-1", name: "old-name.mp4" }
      project.mediaPool.items.set("pool-item-1", existingItem)

      const updatedItem = { ...mockMediaPoolItem, id: "pool-item-1", name: "new-name.mp4" }
      vi.mocked(convertMediaFileToPoolItem).mockReturnValueOnce(updatedItem)

      const result = syncResourcesToProject(project, [mockMediaResource], [])

      // Should update the existing item
      expect(result.mediaPool.items.size).toBe(1)
      expect(result.mediaPool.items.has("pool-item-1")).toBe(true)
      expect(result.mediaPool.items.get("pool-item-1")?.name).toBe("new-name.mp4")
    })

    it("should remove items that are not in localStorage resources", () => {
      const project = createMockProject()
      const existingItem1 = { ...mockMediaPoolItem, id: "existing-1" }
      const existingItem2 = { ...mockMediaPoolItem, id: "existing-2" }
      project.mediaPool.items.set("existing-1", existingItem1)
      project.mediaPool.items.set("existing-2", existingItem2)

      vi.mocked(convertMediaFileToPoolItem).mockReturnValueOnce({ ...mockMediaPoolItem, id: "existing-1" })

      // Only pass resource for existing-1, not existing-2
      const result = syncResourcesToProject(project, [mockMediaResource], [])

      // Should only have the item that was in resources
      expect(result.mediaPool.items.size).toBe(1)
      expect(result.mediaPool.items.has("existing-1")).toBe(true)
      expect(result.mediaPool.items.has("existing-2")).toBe(false)
    })

    it("should call convertMediaFileToPoolItem with correct parameters", () => {
      const project = createMockProject()
      vi.mocked(convertMediaFileToPoolItem)
        .mockReturnValueOnce(mockMediaPoolItem)
        .mockReturnValueOnce(mockMusicPoolItem)

      syncResourcesToProject(project, [mockMediaResource], [mockMusicResource])

      expect(convertMediaFileToPoolItem).toHaveBeenCalledWith(mockMediaFile)
      expect(convertMediaFileToPoolItem).toHaveBeenCalledWith(mockMusicFile, "music")
    })

    it("should skip resources without files", () => {
      const project = createMockProject()
      const resourceWithoutFile = {
        ...mockMediaResource,
        file: undefined as any,
      }

      const result = syncResourcesToProject(project, [resourceWithoutFile], [])

      expect(result.mediaPool.items.size).toBe(0)
      expect(convertMediaFileToPoolItem).not.toHaveBeenCalled()
    })

    it("should update media pool statistics correctly", () => {
      const project = createMockProject()
      vi.mocked(convertMediaFileToPoolItem)
        .mockReturnValueOnce(mockMediaPoolItem)
        .mockReturnValueOnce(mockMusicPoolItem)

      const result = syncResourcesToProject(project, [mockMediaResource], [mockMusicResource])

      expect(result.mediaPool.stats).toEqual({
        totalItems: 2,
        totalSize: 1500000, // 1000000 + 500000
        onlineItems: 2, // Both items are online
        offlineItems: 0,
        proxyItems: 0,
        unusedItems: 2, // All items are initially unused
      })
    })

    it("should handle offline items in statistics", () => {
      const project = createMockProject()
      const offlinePoolItem = {
        ...mockMediaPoolItem,
        status: "offline" as const,
      }
      vi.mocked(convertMediaFileToPoolItem).mockReturnValueOnce(offlinePoolItem)

      const result = syncResourcesToProject(project, [mockMediaResource], [])

      expect(result.mediaPool.stats.onlineItems).toBe(0)
      expect(result.mediaPool.stats.offlineItems).toBe(1)
    })

    it("should handle missing items in statistics", () => {
      const project = createMockProject()
      const missingPoolItem = {
        ...mockMediaPoolItem,
        status: "missing" as const,
      }
      vi.mocked(convertMediaFileToPoolItem).mockReturnValueOnce(missingPoolItem)

      const result = syncResourcesToProject(project, [mockMediaResource], [])

      expect(result.mediaPool.stats.onlineItems).toBe(0)
      expect(result.mediaPool.stats.offlineItems).toBe(1)
    })

    it("should update project modified date", () => {
      const project = createMockProject()
      const originalModified = project.metadata.modified

      // Mock Date constructor to return a specific time
      const mockDate = new Date("2023-12-01")
      const OriginalDate = global.Date
      global.Date = class extends OriginalDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(mockDate.getTime())
          } else {
            super(...args)
          }
        }
      } as any

      const result = syncResourcesToProject(project, [], [])

      expect(result.metadata.modified).toEqual(mockDate)
      expect(result.metadata.modified).not.toEqual(originalModified)

      global.Date = OriginalDate
    })

    it("should handle empty resources arrays", () => {
      const project = createMockProject()
      const result = syncResourcesToProject(project, [], [])

      expect(result.mediaPool.items.size).toBe(0)
      expect(result.mediaPool.stats.totalItems).toBe(0)
      expect(result.mediaPool.stats.totalSize).toBe(0)
      expect(convertMediaFileToPoolItem).not.toHaveBeenCalled()
    })

    it("should preserve other project properties", () => {
      const project = createMockProject()
      const result = syncResourcesToProject(project, [], [])

      expect(result.metadata.id).toBe(project.metadata.id)
      expect(result.metadata.name).toBe(project.metadata.name)
      expect(result.settings).toEqual(project.settings)
      expect(result.sequences).toBe(project.sequences)
    })
  })

  describe("getResourcesFromStorage", () => {
    it("should return empty arrays when localStorage is not available", () => {
      // Mock window as undefined (server-side)
      const originalWindow = global.window
      // @ts-expect-error - intentionally setting to undefined for test
      delete global.window

      const result = getResourcesFromStorage()

      expect(result).toEqual({
        mediaResources: [],
        musicResources: [],
      })

      // Restore window
      global.window = originalWindow
    })

    it("should return empty arrays when localStorage.getItem returns null", () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = getResourcesFromStorage()

      expect(result).toEqual({
        mediaResources: [],
        musicResources: [],
      })
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("timeline-studio-resources")
    })

    it("should parse and return stored resources", () => {
      const storedData = {
        mediaResources: [mockMediaResource],
        musicResources: [mockMusicResource],
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData))

      const result = getResourcesFromStorage()

      expect(result.mediaResources).toHaveLength(1)
      expect(result.musicResources).toHaveLength(1)
      expect(result.mediaResources[0].id).toBe(mockMediaResource.id)
      expect(result.musicResources[0].id).toBe(mockMusicResource.id)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("timeline-studio-resources")
    })

    it("should handle missing mediaResources in stored data", () => {
      const storedData = {
        musicResources: [mockMusicResource],
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData))

      const result = getResourcesFromStorage()

      expect(result.mediaResources).toHaveLength(0)
      expect(result.musicResources).toHaveLength(1)
      expect(result.musicResources[0].id).toBe(mockMusicResource.id)
    })

    it("should handle missing musicResources in stored data", () => {
      const storedData = {
        mediaResources: [mockMediaResource],
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData))

      const result = getResourcesFromStorage()

      expect(result.mediaResources).toHaveLength(1)
      expect(result.musicResources).toHaveLength(0)
      expect(result.mediaResources[0].id).toBe(mockMediaResource.id)
    })

    it("should handle invalid JSON in localStorage", () => {
      mockLocalStorage.getItem.mockReturnValue("invalid json{")
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const result = getResourcesFromStorage()

      expect(result).toEqual({
        mediaResources: [],
        musicResources: [],
      })
      expect(consoleSpy).toHaveBeenCalledWith("Failed to get resources from localStorage:", expect.any(Error))

      consoleSpy.mockRestore()
    })

    it("should handle localStorage.getItem throwing an error", () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("localStorage error")
      })
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const result = getResourcesFromStorage()

      expect(result).toEqual({
        mediaResources: [],
        musicResources: [],
      })
      expect(consoleSpy).toHaveBeenCalledWith("Failed to get resources from localStorage:", expect.any(Error))

      consoleSpy.mockRestore()
    })

    it("should handle empty stored data", () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({}))

      const result = getResourcesFromStorage()

      expect(result).toEqual({
        mediaResources: [],
        musicResources: [],
      })
    })

    it("should handle null values in stored data", () => {
      const storedData = {
        mediaResources: null,
        musicResources: null,
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData))

      const result = getResourcesFromStorage()

      expect(result).toEqual({
        mediaResources: [],
        musicResources: [],
      })
    })
  })

  describe("integration scenarios", () => {
    it("should handle complete sync workflow", () => {
      const project = createMockProject()

      // Setup localStorage with resources
      const storedData = {
        mediaResources: [mockMediaResource],
        musicResources: [mockMusicResource],
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData))

      vi.mocked(convertMediaFileToPoolItem)
        .mockReturnValueOnce(mockMediaPoolItem)
        .mockReturnValueOnce(mockMusicPoolItem)

      // Get resources from storage
      const resources = getResourcesFromStorage()

      // Sync to project
      const result = syncResourcesToProject(project, resources.mediaResources, resources.musicResources)

      expect(result.mediaPool.items.size).toBe(2)
      expect(result.mediaPool.stats.totalItems).toBe(2)
      expect(result.metadata.modified).toBeInstanceOf(Date)
    })

    it("should handle large number of resources efficiently", () => {
      const project = createMockProject()
      const manyMediaResources = Array.from({ length: 50 }, (_, i) => ({
        ...mockMediaResource,
        id: `resource-${i}`,
        resourceId: `media-${i}`,
        file: {
          ...mockMediaFile,
          id: `media-${i}`,
        },
      }))

      // Mock to return different items for each call
      manyMediaResources.forEach((_, i) => {
        vi.mocked(convertMediaFileToPoolItem).mockReturnValueOnce({
          ...mockMediaPoolItem,
          id: `pool-item-${i}`,
        })
      })

      const result = syncResourcesToProject(project, manyMediaResources, [])

      expect(result.mediaPool.items.size).toBe(50)
      expect(result.mediaPool.stats.totalItems).toBe(50)
      expect(convertMediaFileToPoolItem).toHaveBeenCalledTimes(50)
    })

    it("should maintain data integrity during sync", () => {
      const project = createMockProject()
      const originalModified = project.metadata.modified

      vi.mocked(convertMediaFileToPoolItem)
        .mockReturnValueOnce(mockMediaPoolItem)
        .mockReturnValueOnce(mockMusicPoolItem)

      // Mock Date to return a different time for the sync operation
      const mockDate = new Date("2024-01-01")
      const OriginalDate = global.Date
      global.Date = class extends OriginalDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(mockDate.getTime())
          } else {
            super(...args)
          }
        }
      } as any

      const result = syncResourcesToProject(project, [mockMediaResource], [mockMusicResource])

      global.Date = OriginalDate

      // Verify that the original project wasn't mutated
      expect(project.mediaPool.items.size).toBe(0)
      expect(project.metadata.modified).toEqual(originalModified)
      expect(result.metadata.modified).toEqual(mockDate)

      // Verify that the result has correct structure
      expect(result.mediaPool.items instanceof Map).toBe(true)
      expect(result.mediaPool.bins instanceof Map).toBe(true)
      expect(result.sequences instanceof Map).toBe(true)
    })

    it("should handle mixed online and offline resources", () => {
      const project = createMockProject()
      const onlineItem = { ...mockMediaPoolItem, status: "online" as const }
      const offlineItem = { ...mockMusicPoolItem, status: "offline" as const }

      vi.mocked(convertMediaFileToPoolItem).mockReturnValueOnce(onlineItem).mockReturnValueOnce(offlineItem)

      const result = syncResourcesToProject(project, [mockMediaResource], [mockMusicResource])

      expect(result.mediaPool.stats.onlineItems).toBe(1)
      expect(result.mediaPool.stats.offlineItems).toBe(1)
      expect(result.mediaPool.stats.totalItems).toBe(2)
    })
  })
})
