/**
 * FileSystemService Tests
 *
 * Тесты для FileSystemService
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { FileSystemService } from "../file-system-service"

// Mock platform service
const mockPlatformService = {
  exists: vi.fn(),
  getFileStats: vi.fn(),
  getPlatform: vi.fn(),
  searchFilesByName: vi.fn(),
  getAbsolutePath: vi.fn(),
}

vi.mock("@/core/container", () => ({
  getPlatform: vi.fn(() => mockPlatformService),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
  })),
}))

describe("FileSystemService", () => {
  let service: FileSystemService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new FileSystemService()
  })

  describe("fileExists", () => {
    it("should return true when file exists", async () => {
      mockPlatformService.exists.mockResolvedValue(true)

      const result = await service.fileExists("/test/file.mp4")

      expect(result).toBe(true)
      expect(mockPlatformService.exists).toHaveBeenCalledWith("/test/file.mp4")
    })

    it("should return false when file does not exist", async () => {
      mockPlatformService.exists.mockResolvedValue(false)

      const result = await service.fileExists("/test/missing.mp4")

      expect(result).toBe(false)
    })

    it("should return false on error", async () => {
      mockPlatformService.exists.mockRejectedValue(new Error("Access denied"))

      const result = await service.fileExists("/test/file.mp4")

      expect(result).toBe(false)
    })
  })

  describe("getFileStats", () => {
    it("should return file stats when successful", async () => {
      const mockStats = {
        size: 1024000,
        modified: 1234567890,
        created: 1234567890,
      }
      mockPlatformService.getFileStats.mockResolvedValue(mockStats)

      const result = await service.getFileStats("/test/file.mp4")

      expect(result).toEqual(mockStats)
      expect(mockPlatformService.getFileStats).toHaveBeenCalledWith("/test/file.mp4")
    })

    it("should return null on error", async () => {
      mockPlatformService.getFileStats.mockRejectedValue(new Error("File not found"))

      const result = await service.getFileStats("/test/missing.mp4")

      expect(result).toBeNull()
    })
  })

  describe("getPlatform", () => {
    it("should return platform string", async () => {
      mockPlatformService.getPlatform.mockResolvedValue("darwin")

      const result = await service.getPlatform()

      expect(result).toBe("darwin")
    })

    it("should return 'unknown' on error", async () => {
      mockPlatformService.getPlatform.mockRejectedValue(new Error("Platform detection failed"))

      const result = await service.getPlatform()

      expect(result).toBe("unknown")
    })
  })

  describe("searchFilesByName", () => {
    it("should return found files", async () => {
      const mockFiles = ["/test/dir/file1.mp4", "/test/dir/subdir/file2.mp4"]
      mockPlatformService.searchFilesByName.mockResolvedValue(mockFiles)

      const result = await service.searchFilesByName("/test/dir", "*.mp4", 3)

      expect(result).toEqual(mockFiles)
      expect(mockPlatformService.searchFilesByName).toHaveBeenCalledWith("/test/dir", "*.mp4", 3)
    })

    it("should use default maxDepth of 3", async () => {
      mockPlatformService.searchFilesByName.mockResolvedValue([])

      await service.searchFilesByName("/test/dir", "*.mp4")

      expect(mockPlatformService.searchFilesByName).toHaveBeenCalledWith("/test/dir", "*.mp4", 3)
    })

    it("should return empty array on error", async () => {
      mockPlatformService.searchFilesByName.mockRejectedValue(new Error("Search failed"))

      const result = await service.searchFilesByName("/test/dir", "*.mp4")

      expect(result).toEqual([])
    })
  })

  describe("getAbsolutePath", () => {
    it("should return absolute path", async () => {
      mockPlatformService.getAbsolutePath.mockResolvedValue("/absolute/path/to/file.mp4")

      const result = await service.getAbsolutePath("./file.mp4")

      expect(result).toBe("/absolute/path/to/file.mp4")
      expect(mockPlatformService.getAbsolutePath).toHaveBeenCalledWith("./file.mp4")
    })

    it("should return null on error", async () => {
      mockPlatformService.getAbsolutePath.mockRejectedValue(new Error("Path resolution failed"))

      const result = await service.getAbsolutePath("./file.mp4")

      expect(result).toBeNull()
    })
  })
})
