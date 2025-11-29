/**
 * SmartOrganizationService Tests
 *
 * Тесты для SmartOrganizationService
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaInfo } from "../../types"
import { SmartOrganizationService } from "../smart-organization"

// Mock platform service
const mockPlatformService = {
  getFileStats: vi.fn(),
}

// Mock metadata service
const mockMetadataService = {
  extractMetadata: vi.fn(),
}

vi.mock("@/core/container", () => ({
  getPlatform: vi.fn(() => mockPlatformService),
}))

vi.mock("../media-metadata-service", () => ({
  getMediaMetadataService: vi.fn(() => mockMetadataService),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

describe("SmartOrganizationService", () => {
  let service: SmartOrganizationService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new SmartOrganizationService()
  })

  describe("organizeByDate", () => {
    it("should organize files by creation date", async () => {
      const files: MediaInfo[] = [
        { path: "/test/video1.mp4", name: "video1.mp4", type: "Video" },
        { path: "/test/video2.mp4", name: "video2.mp4", type: "Video" },
        { path: "/test/video3.mp4", name: "video3.mp4", type: "Video" },
      ]

      // Mock file stats with different dates
      mockPlatformService.getFileStats
        .mockResolvedValueOnce({ created: new Date("2024-01-15").getTime() / 1000 })
        .mockResolvedValueOnce({ created: new Date("2024-01-15").getTime() / 1000 })
        .mockResolvedValueOnce({ created: new Date("2024-01-20").getTime() / 1000 })

      const result = await service.organizeByDate(files)

      expect(result.groups).toHaveLength(2)
      expect(result.processedFiles).toBe(3)
      expect(result.groups[0].files).toHaveLength(2)
      expect(result.groups[1].files).toHaveLength(1)
    })

    it("should format dates according to format option", async () => {
      const files: MediaInfo[] = [{ path: "/test/video.mp4", name: "video.mp4", type: "Video" }]

      mockPlatformService.getFileStats.mockResolvedValue({
        created: new Date("2024-01-15").getTime() / 1000,
      })

      const result = await service.organizeByDate(files, { format: "YYYY-MM" })

      expect(result.groups[0].name).toBe("2024-01")
    })

    it("should handle files with missing dates", async () => {
      const files: MediaInfo[] = [
        { path: "/test/video1.mp4", name: "video1.mp4", type: "Video" },
        { path: "/test/video2.mp4", name: "video2.mp4", type: "Video" },
      ]

      mockPlatformService.getFileStats
        .mockResolvedValueOnce({ created: new Date("2024-01-15").getTime() / 1000 })
        .mockResolvedValueOnce(null)

      const result = await service.organizeByDate(files)

      expect(result.groups).toHaveLength(1)
      expect(result.processedFiles).toBe(2)
    })

    it("should sort groups by date", async () => {
      const files: MediaInfo[] = [
        { path: "/test/video1.mp4", name: "video1.mp4", type: "Video" },
        { path: "/test/video2.mp4", name: "video2.mp4", type: "Video" },
      ]

      mockPlatformService.getFileStats
        .mockResolvedValueOnce({ created: new Date("2024-01-20").getTime() / 1000 })
        .mockResolvedValueOnce({ created: new Date("2024-01-10").getTime() / 1000 })

      const result = await service.organizeByDate(files)

      expect(result.groups[0].name).toBe("2024-01-10")
      expect(result.groups[1].name).toBe("2024-01-20")
    })
  })

  describe("organizeByEvents", () => {
    it("should group files by timestamp gaps", async () => {
      const files: MediaInfo[] = [
        { path: "/test/video1.mp4", name: "video1.mp4", type: "Video" },
        { path: "/test/video2.mp4", name: "video2.mp4", type: "Video" },
        { path: "/test/video3.mp4", name: "video3.mp4", type: "Video" },
      ]

      // Files 1 and 2 are close together, file 3 is 2 hours later
      const baseTime = new Date("2024-01-15T10:00:00").getTime() / 1000
      mockPlatformService.getFileStats
        .mockResolvedValueOnce({ created: baseTime })
        .mockResolvedValueOnce({ created: baseTime + 300 }) // 5 minutes later
        .mockResolvedValueOnce({ created: baseTime + 7200 }) // 2 hours later

      const result = await service.organizeByEvents(files, { gapThreshold: 3600 })

      expect(result.groups).toHaveLength(2)
      expect(result.groups[0].files).toHaveLength(2)
      expect(result.groups[1].files).toHaveLength(1)
    })

    it("should respect minFilesPerEvent option", async () => {
      const files: MediaInfo[] = [
        { path: "/test/video1.mp4", name: "video1.mp4", type: "Video" },
        { path: "/test/video2.mp4", name: "video2.mp4", type: "Video" },
      ]

      const baseTime = new Date("2024-01-15T10:00:00").getTime() / 1000
      mockPlatformService.getFileStats
        .mockResolvedValueOnce({ created: baseTime })
        .mockResolvedValueOnce({ created: baseTime + 7200 })

      const result = await service.organizeByEvents(files, {
        gapThreshold: 3600,
        minFilesPerEvent: 2,
      })

      // No events should be created as each has only 1 file
      expect(result.groups).toHaveLength(0)
    })
  })

  describe("organizeByCameraType", () => {
    it("should group files by camera manufacturer", async () => {
      const files: MediaInfo[] = [
        { path: "/test/video1.mp4", name: "video1.mp4", type: "Video" },
        { path: "/test/video2.mp4", name: "video2.mp4", type: "Video" },
      ]

      mockMetadataService.extractMetadata
        .mockResolvedValueOnce({
          type: "Video",
          metadata: { camera: { make: "Canon", model: "EOS R5" } },
        })
        .mockResolvedValueOnce({
          type: "Video",
          metadata: { camera: { make: "Sony", model: "A7S III" } },
        })

      const result = await service.organizeByCameraType(files, {
        groupByManufacturer: true,
      })

      expect(result.groups).toHaveLength(2)
      expect(result.groups.some((g) => g.name.includes("Canon"))).toBe(true)
      expect(result.groups.some((g) => g.name.includes("Sony"))).toBe(true)
    })

    it("should handle files without camera metadata", async () => {
      const files: MediaInfo[] = [{ path: "/test/video.mp4", name: "video.mp4", type: "Video" }]

      mockMetadataService.extractMetadata.mockResolvedValue({
        type: "Video",
        metadata: {},
      })

      const result = await service.organizeByCameraType(files)

      expect(result.groups).toHaveLength(1)
      expect(result.groups[0].name).toBe("Unknown Camera")
    })
  })

})
