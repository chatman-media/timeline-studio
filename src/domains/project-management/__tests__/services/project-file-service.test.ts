/**
 * Project File Service Tests
 *
 * Тесты для функций работы с файлами проектов
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SavedMediaFile, SavedMusicFile } from "@/domains/media-management"
import type { ProjectFile } from "@/domains/shared/types/project"
import {
  createNewProject,
  getProjectStats,
  hasUnsavedChanges,
  loadProject,
  migrateProject,
  saveProject,
  updateBrowserState,
  updateMediaLibrary,
  updateProjectFavorites,
} from "../../services/project-file-service"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

// Mock container
const mockReadTextFile = vi.fn()
const mockWriteTextFile = vi.fn()

vi.mock("@/core", () => ({
  container: {
    hasPlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => ({
      readTextFile: mockReadTextFile,
      writeTextFile: mockWriteTextFile,
    })),
  },
}))

describe("ProjectFileService", () => {
  const mockProjectData: ProjectFile = {
    settings: {
      aspectRatio: {
        label: "16:9",
        textLabel: "Широкоэкранный",
        description: "YouTube",
        value: { width: 1920, height: 1080, name: "16:9" },
      },
      resolution: "1920x1080",
      frameRate: "30",
      colorSpace: "sdr",
    },
    mediaPool: {
      mediaFiles: [],
      musicFiles: [],
      lastUpdated: Date.now(),
      version: "1.0.0",
    },
    workspaceSettings: {
      media: {
        viewMode: "grid",
        sortBy: "name",
        sortOrder: "asc",
        searchQuery: "",
        filterType: "all",
        groupBy: "none",
      },
      music: {
        viewMode: "list",
        sortBy: "name",
        sortOrder: "asc",
        searchQuery: "",
        filterType: "all",
        groupBy: "none",
        showFavoritesOnly: false,
      },
    },
    favoriteFiles: {
      mediaFiles: [],
      musicFiles: [],
    },
    meta: {
      version: "1.0.0",
      createdAt: Date.now(),
      lastModified: Date.now(),
      originalPlatform: "macos",
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("loadProject", () => {
    it("should load and parse project file", async () => {
      mockReadTextFile.mockResolvedValueOnce(JSON.stringify(mockProjectData))

      const result = await loadProject("/path/to/project.tls")

      expect(result).toEqual(mockProjectData)
      expect(mockReadTextFile).toHaveBeenCalledWith("/path/to/project.tls")
    })

    it("should handle JSON parse errors", async () => {
      mockReadTextFile.mockResolvedValueOnce("invalid json {")

      await expect(loadProject("/path/to/project.tls")).rejects.toThrow("Failed to parse project file")
    })

    it("should validate project structure", async () => {
      const invalidProject = { invalid: true }
      mockReadTextFile.mockResolvedValueOnce(JSON.stringify(invalidProject))

      await expect(loadProject("/path/to/project.tls")).rejects.toThrow("Invalid project structure")
    })

    it("should handle missing settings", async () => {
      const projectWithoutSettings = { ...mockProjectData, settings: undefined }
      mockReadTextFile.mockResolvedValueOnce(JSON.stringify(projectWithoutSettings))

      await expect(loadProject("/path/to/project.tls")).rejects.toThrow("missing settings")
    })

    it("should handle missing meta", async () => {
      const projectWithoutMeta = { ...mockProjectData, meta: undefined }
      mockReadTextFile.mockResolvedValueOnce(JSON.stringify(projectWithoutMeta))

      await expect(loadProject("/path/to/project.tls")).rejects.toThrow("missing meta")
    })

    it("should handle unsupported version", async () => {
      const projectWithBadVersion = {
        ...mockProjectData,
        meta: { ...mockProjectData.meta, version: "2.0.0" },
      }
      mockReadTextFile.mockResolvedValueOnce(JSON.stringify(projectWithBadVersion))

      await expect(loadProject("/path/to/project.tls")).rejects.toThrow("Unsupported project version")
    })

    it("should handle file read errors", async () => {
      mockReadTextFile.mockRejectedValueOnce(new Error("File not found"))

      await expect(loadProject("/path/to/project.tls")).rejects.toThrow("Failed to load project")
    })
  })

  describe("saveProject", () => {
    it("should save project with updated metadata", async () => {
      await saveProject("/path/to/project.tls", mockProjectData)

      expect(mockWriteTextFile).toHaveBeenCalledWith("/path/to/project.tls", expect.stringContaining('"lastModified":'))
    })

    it("should format JSON with indentation", async () => {
      await saveProject("/path/to/project.tls", mockProjectData)

      const savedContent = mockWriteTextFile.mock.calls[0][1]
      expect(savedContent).toContain("\n")
      expect(savedContent).toContain("  ")
    })

    it("should handle write errors", async () => {
      mockWriteTextFile.mockRejectedValueOnce(new Error("Write failed"))

      await expect(saveProject("/path/to/project.tls", mockProjectData)).rejects.toThrow("Failed to save project")
    })
  })

  describe("createNewProject", () => {
    it("should create project with default structure", () => {
      const project = createNewProject("My Project")

      expect(project.settings).toBeDefined()
      expect(project.mediaPool).toBeDefined()
      expect(project.workspaceSettings).toBeDefined()
      expect(project.favoriteFiles).toBeDefined()
      expect(project.meta).toBeDefined()
    })

    it("should initialize empty media files", () => {
      const project = createNewProject("My Project")

      expect(project.mediaPool?.mediaFiles).toEqual([])
      expect(project.mediaPool?.musicFiles).toEqual([])
    })

    it("should set default resolution", () => {
      const project = createNewProject("My Project")

      expect(project.settings.resolution).toBe("1920x1080")
      expect(project.settings.frameRate).toBe("30")
    })

    it("should set creation timestamp", () => {
      const project = createNewProject("My Project")

      expect(project.meta.createdAt).toBeDefined()
      expect(project.meta.lastModified).toBeDefined()
    })
  })

  describe("updateMediaLibrary", () => {
    it("should update media library", () => {
      const mediaFiles: SavedMediaFile[] = [
        {
          id: "media-1",
          originalPath: "/path/to/video.mp4",
          name: "video.mp4",
          size: 1024000,
          lastModified: Date.now(),
          isVideo: true,
          isAudio: false,
          isImage: false,
          metadata: {
            duration: 10,
          },
          status: "available",
          lastChecked: Date.now(),
        },
      ]

      const musicFiles: SavedMusicFile[] = []

      const updated = updateMediaLibrary(mockProjectData, mediaFiles, musicFiles)

      expect(updated.mediaPool?.mediaFiles).toEqual(mediaFiles)
      expect(updated.mediaPool?.musicFiles).toEqual(musicFiles)
    })

    it("should update lastUpdated timestamp", () => {
      const updated = updateMediaLibrary(mockProjectData, [], [])

      expect(updated.mediaPool?.lastUpdated).toBeDefined()
    })
  })

  describe("updateBrowserState", () => {
    it("should update workspace settings", () => {
      const newSettings = {
        media: {
          viewMode: "list" as const,
          sortBy: "date" as const,
          sortOrder: "desc" as const,
          searchQuery: "test",
          filterType: "video" as const,
          groupBy: "date" as const,
        },
      }

      const updated = updateBrowserState(mockProjectData, newSettings)

      expect(updated.workspaceSettings).toEqual(newSettings)
    })
  })

  describe("updateProjectFavorites", () => {
    it("should update favorite files", () => {
      const newFavorites = {
        mediaFiles: ["media-1", "media-2"],
        musicFiles: ["music-1"],
      }

      const updated = updateProjectFavorites(mockProjectData, newFavorites)

      expect(updated.favoriteFiles).toEqual(newFavorites)
    })
  })

  describe("getProjectStats", () => {
    it("should calculate project statistics", () => {
      const projectWithMedia = {
        ...mockProjectData,
        mediaPool: {
          ...mockProjectData.mediaPool,
          mediaFiles: [{ id: "1", size: 1024 } as SavedMediaFile, { id: "2", size: 2048 } as SavedMediaFile],
          musicFiles: [{ id: "3", size: 512 } as SavedMusicFile],
        },
      }

      const stats = getProjectStats(projectWithMedia as any)

      expect(stats.totalMediaFiles).toBe(2)
      expect(stats.totalMusicFiles).toBe(1)
      expect(stats.totalSize).toBe(3584)
      expect(stats.lastModified).toBeDefined()
    })

    it("should handle empty media pool", () => {
      const stats = getProjectStats(mockProjectData)

      expect(stats.totalMediaFiles).toBe(0)
      expect(stats.totalMusicFiles).toBe(0)
      expect(stats.totalSize).toBe(0)
    })

    it("should handle invalid file sizes", () => {
      const projectWithInvalidSizes = {
        ...mockProjectData,
        mediaPool: {
          ...mockProjectData.mediaPool,
          mediaFiles: [{ id: "1", size: null } as any],
        },
      }

      const stats = getProjectStats(projectWithInvalidSizes as any)

      expect(stats.totalSize).toBe(0)
    })
  })

  describe("hasUnsavedChanges", () => {
    it("should detect changes in media files count", () => {
      const currentMedia: SavedMediaFile[] = [{ id: "1" } as SavedMediaFile]
      const hasChanges = hasUnsavedChanges(mockProjectData, currentMedia, [])

      expect(hasChanges).toBe(true)
    })

    it("should detect changes in music files count", () => {
      const currentMusic: SavedMusicFile[] = [{ id: "1" } as SavedMusicFile]
      const hasChanges = hasUnsavedChanges(mockProjectData, [], currentMusic)

      expect(hasChanges).toBe(true)
    })

    it("should detect changes in file IDs", () => {
      const projectWithFiles = {
        ...mockProjectData,
        mediaLibrary: {
          ...mockProjectData.mediaLibrary,
          mediaFiles: [{ id: "old-id" } as SavedMediaFile],
        },
      }

      const currentMedia: SavedMediaFile[] = [{ id: "new-id" } as SavedMediaFile]

      const hasChanges = hasUnsavedChanges(projectWithFiles as any, currentMedia, [])

      expect(hasChanges).toBe(true)
    })

    it("should return false when no changes", () => {
      const hasChanges = hasUnsavedChanges(mockProjectData, [], [])

      expect(hasChanges).toBe(false)
    })
  })

  describe("migrateProject", () => {
    it("should return project unchanged for now", () => {
      const result = migrateProject(mockProjectData)

      expect(result).toEqual(mockProjectData)
    })
  })

  describe("Edge Cases", () => {
    it("should handle platform service not available", async () => {
      const { container } = await import("@/core")
      const mockContainer = vi.mocked(container)
      mockContainer.hasPlatform.mockReturnValueOnce(false)

      await expect(loadProject("/path/to/project.tls")).rejects.toThrow("Platform service not available")
    })

    it("should handle invalid mediaLibrary structure", async () => {
      const projectWithInvalidMedia = {
        ...mockProjectData,
        mediaPool: {
          mediaFiles: "not an array",
          musicFiles: [],
        },
      }

      mockReadTextFile.mockResolvedValueOnce(JSON.stringify(projectWithInvalidMedia))

      await expect(loadProject("/path/to/project.tls")).rejects.toThrow()
    })

    it("should handle missing required fields in media files", async () => {
      const projectWithInvalidFiles = {
        ...mockProjectData,
        mediaPool: {
          mediaFiles: [{ invalidField: true }],
          musicFiles: [],
        },
      }

      mockReadTextFile.mockResolvedValueOnce(JSON.stringify(projectWithInvalidFiles))

      await expect(loadProject("/path/to/project.tls")).rejects.toThrow("Invalid saved media file")
    })
  })
})
