import { invoke } from "@tauri-apps/api/core"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppDirectoriesService } from "../../services/app-directories-service"

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

describe("AppDirectoriesService", () => {
  let service: AppDirectoriesService
  const mockDirectories = {
    base_dir: "/Users/test/Movies/Timeline Studio",
    media_dir: "/Users/test/Movies/Timeline Studio/Media",
    projects_dir: "/Users/test/Movies/Timeline Studio/Projects",
    snapshot_dir: "/Users/test/Movies/Timeline Studio/Snapshot",
    cinematic_dir: "/Users/test/Movies/Timeline Studio/Cinematic",
    output_dir: "/Users/test/Movies/Timeline Studio/Output",
    render_dir: "/Users/test/Movies/Timeline Studio/Render",
    recognition_dir: "/Users/test/Movies/Timeline Studio/Recognition",
    backup_dir: "/Users/test/Movies/Timeline Studio/Backup",
    media_proxy_dir: "/Users/test/Movies/Timeline Studio/MediaProxy",
    caches_dir: "/Users/test/Movies/Timeline Studio/Caches",
    recorded_dir: "/Users/test/Movies/Timeline Studio/Recorded",
    audio_dir: "/Users/test/Movies/Timeline Studio/Audio",
    cloud_project_dir: "/Users/test/Movies/Timeline Studio/Cloud Project",
    upload_dir: "/Users/test/Movies/Timeline Studio/Upload",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Get fresh instance
    service = AppDirectoriesService.getInstance()
    // Reset cached directories
    ;(service as any).directories = undefined
  })

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = AppDirectoriesService.getInstance()
      const instance2 = AppDirectoriesService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("getAppDirectories", () => {
    it("should fetch and cache app directories", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(mockDirectories)

      const result = await service.getAppDirectories()

      expect(invoke).toHaveBeenCalledWith("get_app_directories")
      expect(result).toEqual(mockDirectories)

      // Second call should use cache
      const cachedResult = await service.getAppDirectories()
      expect(invoke).toHaveBeenCalledTimes(1) // Not called again
      expect(cachedResult).toEqual(mockDirectories)
    })

    it("should handle errors", async () => {
      const error = new Error("Failed to get directories")
      vi.mocked(invoke).mockRejectedValueOnce(error)

      await expect(service.getAppDirectories()).rejects.toThrow("Failed to get directories")
    })
  })

  describe("createAppDirectories", () => {
    it("should create directories and update cache", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(mockDirectories)

      const result = await service.createAppDirectories()

      expect(invoke).toHaveBeenCalledWith("create_app_directories")
      expect(result).toEqual(mockDirectories)
    })

    it("should handle errors", async () => {
      const error = new Error("Failed to create directories")
      vi.mocked(invoke).mockRejectedValueOnce(error)

      await expect(service.createAppDirectories()).rejects.toThrow("Failed to create directories")
    })
  })

  describe("getDirectorySizes", () => {
    it("should fetch directory sizes", async () => {
      const mockSizes = {
        media: 1048576,
        projects: 524288,
        output: 262144,
        render: 131072,
        caches: 65536,
        backup: 32768,
        total: 2064384,
      }
      vi.mocked(invoke).mockResolvedValueOnce(mockSizes)

      const result = await service.getDirectorySizes()

      expect(invoke).toHaveBeenCalledWith("get_directory_sizes")
      expect(result).toEqual(mockSizes)
    })
  })

  describe("clearAppCache", () => {
    it("should clear app cache", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(undefined)

      await service.clearAppCache()

      expect(invoke).toHaveBeenCalledWith("clear_app_cache")
    })
  })

  describe("getMediaSubdirectory", () => {
    it("should return correct subdirectory path", async () => {
      // First get directories to cache them
      vi.mocked(invoke).mockResolvedValueOnce(mockDirectories)
      await service.getAppDirectories()

      expect(service.getMediaSubdirectory("videos")).toBe("/Users/test/Movies/Timeline Studio/Media/Videos")
      expect(service.getMediaSubdirectory("effects")).toBe("/Users/test/Movies/Timeline Studio/Media/Effects")
      expect(service.getMediaSubdirectory("transitions")).toBe("/Users/test/Movies/Timeline Studio/Media/Transitions")
      expect(service.getMediaSubdirectory("images")).toBe("/Users/test/Movies/Timeline Studio/Media/Images")
      expect(service.getMediaSubdirectory("music")).toBe("/Users/test/Movies/Timeline Studio/Media/Music")
      expect(service.getMediaSubdirectory("style_templates")).toBe(
        "/Users/test/Movies/Timeline Studio/Media/StyleTemplates",
      )
      expect(service.getMediaSubdirectory("subtitles")).toBe("/Users/test/Movies/Timeline Studio/Media/Subtitles")
      expect(service.getMediaSubdirectory("filters")).toBe("/Users/test/Movies/Timeline Studio/Media/Filters")
    })

    it("should throw error if directories not initialized", () => {
      expect(() => service.getMediaSubdirectory("videos")).toThrow("App directories not initialized")
    })
  })

  describe("formatSize", () => {
    it("should format bytes correctly", () => {
      expect(service.formatSize(0)).toBe("0.00 B")
      expect(service.formatSize(512)).toBe("512.00 B")
      expect(service.formatSize(1024)).toBe("1.00 KB")
      expect(service.formatSize(1536)).toBe("1.50 KB")
      expect(service.formatSize(1048576)).toBe("1.00 MB")
      expect(service.formatSize(1073741824)).toBe("1.00 GB")
    })

    it("should handle large sizes", () => {
      expect(service.formatSize(1099511627776)).toBe("1.00 TB") // 1 TB = 1024^4 bytes
      expect(service.formatSize(2199023255552)).toBe("2.00 TB") // 2 TB
      expect(service.formatSize(1125899906842624)).toBe("1024.00 TB") // 1 PB
    })
  })
})
