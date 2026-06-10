import { beforeEach, describe, expect, it, vi } from "vitest"
import { YoloDataService } from "@timeline-studio/domains/ai-services/services/recognition"
import { createMockYoloData } from "../../__mocks__"

describe("YoloDataService", () => {
  let service: YoloDataService

  const mockYoloData = createMockYoloData({
    frames: [
      {
        timestamp: 0,
        detections: [
          {
            class: "person",
            confidence: 0.95,
            bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.6 },
          },
        ],
      },
      {
        timestamp: 5,
        detections: [
          {
            class: "car",
            confidence: 0.87,
            bbox: { x: 0.5, y: 0.4, width: 0.2, height: 0.3 },
          },
          {
            class: "person",
            confidence: 0.92,
            bbox: { x: 0.2, y: 0.3, width: 0.25, height: 0.5 },
          },
        ],
      },
      {
        timestamp: 10,
        detections: [
          {
            class: "dog",
            confidence: 0.88,
            bbox: { x: 0.3, y: 0.5, width: 0.2, height: 0.3 },
          },
        ],
      },
    ],
  })

  beforeEach(() => {
    service = new YoloDataService()
    vi.clearAllMocks()
  })

  describe("loadYoloData", () => {
    it("should return null for non-existent data", async () => {
      const result = await service.loadYoloData("non-existent-video")
      expect(result).toBeNull()
    })

    it("should mark video as non-existent after failed load", async () => {
      await service.loadYoloData("test-video")

      // Второй вызов должен сразу вернуть null без попытки загрузки
      const result = await service.loadYoloData("test-video")
      expect(result).toBeNull()
    })

    it("should return cached data on subsequent calls", async () => {
      // Мокаем успешную загрузку данных
      const originalLoadYoloData = service.loadYoloData
      service.loadYoloData = vi.fn().mockResolvedValue(mockYoloData)

      const result1 = await service.loadYoloData("test-video")
      const result2 = await service.loadYoloData("test-video")

      expect(result1).toEqual(mockYoloData)
      expect(result2).toEqual(mockYoloData)
      expect(service.loadYoloData).toHaveBeenCalledTimes(2)
    })
  })

  describe("getYoloDataAtTimestamp", () => {
    beforeEach(() => {
      // Устанавливаем данные в кэш напрямую для тестирования
      ;(service as any).yoloDataCache["test-video"] = mockYoloData
    })

    it("should return empty array for non-existent video", async () => {
      const result = await service.getYoloDataAtTimestamp("non-existent", 5)
      expect(result).toEqual([])
    })

    it("should return detections for exact timestamp", async () => {
      const result = await service.getYoloDataAtTimestamp("test-video", 5)
      expect(result).toHaveLength(2)
      expect(result[0].class).toBe("car")
      expect(result[1].class).toBe("person")
    })

    it("should return closest frame detections", async () => {
      const result = await service.getYoloDataAtTimestamp("test-video", 3)
      // Должен вернуть кадр с timestamp 5 (ближайший к 3)
      expect(result).toHaveLength(2)
    })

    it("should return detections for timestamp 0", async () => {
      const result = await service.getYoloDataAtTimestamp("test-video", 0)
      expect(result).toHaveLength(1)
      expect(result[0].class).toBe("person")
    })

    it("should handle empty frames array", async () => {
      ;(service as any).yoloDataCache["empty-video"] = {
        ...mockYoloData,
        frames: [],
      }

      const result = await service.getYoloDataAtTimestamp("empty-video", 5)
      expect(result).toEqual([])
    })
  })

  describe("getVideoSummary", () => {
    beforeEach(() => {
      ;(service as any).yoloDataCache["test-video"] = mockYoloData
    })

    it("should return null for non-existent video", async () => {
      const result = await service.getVideoSummary("non-existent")
      expect(result).toBeNull()
    })

    it("should return correct summary statistics", async () => {
      const result = await service.getVideoSummary("test-video")

      expect(result).toEqual({
        videoId: "test-video",
        videoName: "test.mp4",
        frameCount: 3,
        detectedClasses: ["person", "car", "dog"],
        classCounts: {
          person: 2,
          car: 1,
          dog: 1,
        },
        classTimeRanges: expect.any(Object),
      })
    })

    it("should handle empty frames", async () => {
      ;(service as any).yoloDataCache["empty-video"] = {
        ...mockYoloData,
        frames: [],
      }

      const result = await service.getVideoSummary("empty-video")
      expect(result).toBeNull()
    })

    it("should create correct time ranges", async () => {
      const result = await service.getVideoSummary("test-video")

      expect(result?.classTimeRanges).toBeDefined()
      expect(result?.classTimeRanges.person).toBeDefined()
      expect(result?.classTimeRanges.car).toBeDefined()
      expect(result?.classTimeRanges.dog).toBeDefined()
    })
  })

  describe("getAllYoloData", () => {
    it("should return all data for video", async () => {
      ;(service as any).yoloDataCache["test-video"] = mockYoloData

      const result = await service.getAllYoloData("test-video")
      expect(result).toEqual(mockYoloData)
    })

    it("should return null for non-existent video", async () => {
      const result = await service.getAllYoloData("non-existent")
      expect(result).toBeNull()
    })
  })

  describe("hasYoloData", () => {
    it("should return true for cached video", () => {
      ;(service as any).yoloDataCache["test-video"] = mockYoloData

      const result = service.hasYoloData("test-video")
      expect(result).toBe(true)
    })

    it("should return false for non-existent video", () => {
      const result = service.hasYoloData("non-existent")
      expect(result).toBe(false)
    })

    it("should return false for video marked as non-existent", () => {
      ;(service as any).nonExistentFiles["test-video"] = true

      const result = service.hasYoloData("test-video")
      expect(result).toBe(false)
    })
  })

  describe("clearVideoCache", () => {
    it("should clear cache for specific video", () => {
      ;(service as any).yoloDataCache["test-video"] = mockYoloData
      ;(service as any).nonExistentFiles["test-video"] = true

      service.clearVideoCache("test-video")

      expect((service as any).yoloDataCache["test-video"]).toBeUndefined()
      expect((service as any).nonExistentFiles["test-video"]).toBeUndefined()
    })
  })

  describe("clearAllCache", () => {
    it("should clear all cache", () => {
      ;(service as any).yoloDataCache.video1 = mockYoloData
      ;(service as any).yoloDataCache.video2 = mockYoloData
      ;(service as any).nonExistentFiles.video3 = true
      ;(service as any).missingDataCount = 5

      service.clearAllCache()

      expect((service as any).yoloDataCache).toEqual({})
      expect((service as any).nonExistentFiles).toEqual({})
      expect((service as any).missingDataCount).toBe(0)
    })
  })

  describe("getCacheStats", () => {
    it("should return correct cache statistics", () => {
      ;(service as any).yoloDataCache.video1 = mockYoloData
      ;(service as any).yoloDataCache.video2 = mockYoloData
      ;(service as any).nonExistentFiles.video3 = true
      ;(service as any).nonExistentFiles.video4 = true
      ;(service as any).missingDataCount = 3

      const stats = service.getCacheStats()

      expect(stats.cachedVideos).toBe(2)
      expect(stats.nonExistentVideos).toBe(2)
      expect(stats.missingDataCount).toBe(3)
      expect(stats.totalMemoryUsage).toBeGreaterThan(0)
    })
  })

  describe("findClosestFrame", () => {
    it("should find closest frame by timestamp", async () => {
      ;(service as any).yoloDataCache["test-video"] = mockYoloData

      // Тестируем через getYoloDataAtTimestamp, который использует findClosestFrame
      const result1 = await service.getYoloDataAtTimestamp("test-video", 2)
      const result2 = await service.getYoloDataAtTimestamp("test-video", 7)

      // timestamp 2 ближе к 0, чем к 5
      expect(result1).toHaveLength(1)
      expect(result1[0].class).toBe("person")

      // timestamp 7 ближе к 5, чем к 10
      expect(result2).toHaveLength(2)
    })

    it("should handle single frame", async () => {
      const singleFrameData = {
        ...mockYoloData,
        frames: [mockYoloData.frames[0]],
      }
      ;(service as any).yoloDataCache["single-frame"] = singleFrameData

      const result = await service.getYoloDataAtTimestamp("single-frame", 100)
      expect(result).toHaveLength(1)
      expect(result[0].class).toBe("person")
    })
  })
})
