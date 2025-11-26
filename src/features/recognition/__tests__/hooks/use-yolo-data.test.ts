import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { YoloDataService } from "@/domains/ai-services/services/recognition"
import { createMockYoloData, mockDetections } from "../../__mocks__"
import { useYoloData } from "../../hooks/use-yolo-data"

// Mock dependencies
vi.mock("@/domains/ai-services/services/recognition", () => ({
  YoloDataService: vi.fn(),
}))

vi.mock("../../hooks/use-recognition-preview", () => ({
  useRecognitionPreview: vi.fn(() => ({
    processVideoRecognition: vi.fn().mockResolvedValue(null),
    getRecognitionAtTimestamp: vi.fn().mockResolvedValue([]),
  })),
}))

vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

describe("useYoloData", () => {
  let mockYoloDataService: any

  beforeEach(() => {
    mockYoloDataService = {
      loadYoloData: vi.fn().mockResolvedValue(createMockYoloData()),
      getYoloDataAtTimestamp: vi.fn().mockResolvedValue(mockDetections),
      getVideoSummary: vi.fn().mockResolvedValue({
        videoId: "test-video",
        videoName: "test.mp4",
        frameCount: 2,
        detectedClasses: ["person", "car"],
        classCounts: { person: 2, car: 1 },
        classTimeRanges: {
          person: [{ start: 0, end: 5 }],
          car: [{ start: 5, end: 5 }],
        },
      }),
      getAllYoloData: vi.fn().mockResolvedValue(createMockYoloData()),
      hasYoloData: vi.fn().mockReturnValue(true),
      clearVideoCache: vi.fn(),
      clearAllCache: vi.fn(),
      getCacheStats: vi.fn().mockReturnValue({
        cachedVideos: 1,
        nonExistentVideos: 0,
        totalMemoryUsage: 1024,
        missingDataCount: 0,
      }),
      saveYoloData: vi.fn().mockResolvedValue(undefined),
    }

    ;(YoloDataService as any).mockImplementation(() => mockYoloDataService)
  })

  describe("loadYoloData", () => {
    it("должен успешно загрузить данные YOLO", async () => {
      const { result } = renderHook(() => useYoloData())

      const data = await result.current.loadYoloData("test-video")

      expect(data).toBeDefined()
      expect(data?.videoId).toBe("test-video")
      expect(mockYoloDataService.loadYoloData).toHaveBeenCalledWith("test-video", undefined)
    })

    it("должен обновить состояние загрузки", async () => {
      const { result } = renderHook(() => useYoloData())

      const loadPromise = result.current.loadYoloData("test-video")

      // Проверяем, что состояние загрузки установлено
      await waitFor(() => {
        expect(result.current.isLoading("test-video")).toBe(false)
      })

      await loadPromise
    })

    it("должен обработать ошибку загрузки", async () => {
      mockYoloDataService.loadYoloData.mockRejectedValue(new Error("Load failed"))
      const { result } = renderHook(() => useYoloData())

      const data = await result.current.loadYoloData("test-video")

      expect(data).toBeNull()
      await waitFor(() => {
        expect(result.current.getError("test-video")).toBe("Load failed")
      })
    })

    it("должен загрузить данные с путем к видео", async () => {
      const { result } = renderHook(() => useYoloData())

      await result.current.loadYoloData("test-video", "/path/to/video.mp4")

      expect(mockYoloDataService.loadYoloData).toHaveBeenCalledWith("test-video", "/path/to/video.mp4")
    })
  })

  describe("getYoloDataAtTimestamp", () => {
    it("должен получить данные для конкретного времени", async () => {
      const { result } = renderHook(() => useYoloData())

      const detections = await result.current.getYoloDataAtTimestamp("test-video", 5)

      expect(detections).toEqual(mockDetections)
      expect(mockYoloDataService.getYoloDataAtTimestamp).toHaveBeenCalledWith("test-video", 5)
    })

    it("должен вернуть пустой массив при ошибке", async () => {
      mockYoloDataService.getYoloDataAtTimestamp.mockRejectedValue(new Error("Failed"))
      const { result } = renderHook(() => useYoloData())

      const detections = await result.current.getYoloDataAtTimestamp("test-video", 5)

      expect(detections).toEqual([])
    })
  })

  describe("getVideoSummary", () => {
    it("должен получить сводку по видео", async () => {
      const { result } = renderHook(() => useYoloData())

      const summary = await result.current.getVideoSummary("test-video")

      expect(summary).toBeDefined()
      expect(summary?.videoId).toBe("test-video")
      expect(summary?.detectedClasses).toContain("person")
      expect(summary?.detectedClasses).toContain("car")
    })

    it("должен вернуть null при ошибке", async () => {
      mockYoloDataService.getVideoSummary.mockRejectedValue(new Error("Failed"))
      const { result } = renderHook(() => useYoloData())

      const summary = await result.current.getVideoSummary("test-video")

      expect(summary).toBeNull()
    })
  })

  describe("getAllYoloData", () => {
    it("должен получить все данные YOLO", async () => {
      const { result } = renderHook(() => useYoloData())

      const data = await result.current.getAllYoloData("test-video")

      expect(data).toBeDefined()
      expect(data?.videoId).toBe("test-video")
    })

    it("должен вернуть null при ошибке", async () => {
      mockYoloDataService.getAllYoloData.mockRejectedValue(new Error("Failed"))
      const { result } = renderHook(() => useYoloData())

      const data = await result.current.getAllYoloData("test-video")

      expect(data).toBeNull()
    })
  })

  describe("hasYoloData", () => {
    it("должен вернуть true для кэшированного видео", () => {
      const { result } = renderHook(() => useYoloData())

      const hasData = result.current.hasYoloData("test-video")

      expect(hasData).toBe(true)
    })

    it("должен вернуть false для некэшированного видео", () => {
      mockYoloDataService.hasYoloData.mockReturnValue(false)
      const { result } = renderHook(() => useYoloData())

      const hasData = result.current.hasYoloData("non-existent")

      expect(hasData).toBe(false)
    })
  })

  describe("clearVideoCache", () => {
    it("должен очистить кэш для конкретного видео", () => {
      const { result } = renderHook(() => useYoloData())

      result.current.clearVideoCache("test-video")

      expect(mockYoloDataService.clearVideoCache).toHaveBeenCalledWith("test-video")
    })

    it("должен очистить состояния загрузки и ошибок", async () => {
      const { result } = renderHook(() => useYoloData())

      // Сначала создаем состояния
      await result.current.loadYoloData("test-video")

      // Очищаем кэш
      result.current.clearVideoCache("test-video")

      await waitFor(() => {
        expect(result.current.isLoading("test-video")).toBe(false)
        expect(result.current.getError("test-video")).toBeNull()
      })
    })
  })

  describe("clearAllCache", () => {
    it("должен очистить весь кэш", () => {
      const { result } = renderHook(() => useYoloData())

      result.current.clearAllCache()

      expect(mockYoloDataService.clearAllCache).toHaveBeenCalled()
    })
  })

  describe("getCacheStats", () => {
    it("должен вернуть статистику кэша", () => {
      const { result } = renderHook(() => useYoloData())

      const stats = result.current.getCacheStats()

      expect(stats).toEqual({
        cachedVideos: 1,
        nonExistentVideos: 0,
        totalMemoryUsage: 1024,
        missingDataCount: 0,
      })
    })
  })

  describe("preloadYoloData", () => {
    it("должен предзагрузить данные для списка видео", async () => {
      const { result } = renderHook(() => useYoloData())

      await result.current.preloadYoloData(["video1", "video2", "video3"])

      await waitFor(() => {
        expect(mockYoloDataService.loadYoloData).toHaveBeenCalledTimes(3)
      })
    })

    it("должен обработать ошибки предзагрузки", async () => {
      mockYoloDataService.loadYoloData.mockRejectedValueOnce(new Error("Failed"))
      const { result } = renderHook(() => useYoloData())

      // Не должно выбросить ошибку
      await expect(result.current.preloadYoloData(["video1", "video2"])).resolves.not.toThrow()
    })
  })

  describe("getSceneContext", () => {
    it("должен создать контекст сцены", async () => {
      const { result } = renderHook(() => useYoloData())

      const context = await result.current.getSceneContext("test-video", 5)

      expect(context).toBeDefined()
      expect(typeof context).toBe("string")
      expect(context).toContain("В кадре обнаружено")
    })

    it("должен вернуть сообщение об отсутствии объектов", async () => {
      mockYoloDataService.getYoloDataAtTimestamp.mockResolvedValue([])
      const { result } = renderHook(() => useYoloData())

      const context = await result.current.getSceneContext("test-video", 5)

      expect(context).toBe("В кадре не обнаружено объектов.")
    })

    it("должен группировать объекты по классам", async () => {
      mockYoloDataService.getYoloDataAtTimestamp.mockResolvedValue([
        { class: "person", confidence: 0.95, bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.6 } },
        { class: "person", confidence: 0.92, bbox: { x: 0.5, y: 0.3, width: 0.2, height: 0.5 } },
      ])
      const { result } = renderHook(() => useYoloData())

      const context = await result.current.getSceneContext("test-video", 5)

      expect(context).toContain("2 person")
    })

    it("должен определять позиции объектов", async () => {
      mockYoloDataService.getYoloDataAtTimestamp.mockResolvedValue([
        { class: "person", confidence: 0.95, bbox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 } },
      ])
      const { result } = renderHook(() => useYoloData())

      const context = await result.current.getSceneContext("test-video", 5)

      expect(context).toMatch(/верх|центр|низ/)
      expect(context).toMatch(/лево|центр|право/)
    })

    it("должен обработать ошибку создания контекста", async () => {
      mockYoloDataService.getYoloDataAtTimestamp.mockRejectedValue(new Error("Failed"))
      const { result } = renderHook(() => useYoloData())

      const context = await result.current.getSceneContext("test-video", 5)

      expect(context).toBe("Ошибка при анализе сцены.")
    })
  })

  describe("loading and error states", () => {
    it("должен предоставить метод isLoading", () => {
      const { result } = renderHook(() => useYoloData())

      expect(typeof result.current.isLoading).toBe("function")
      expect(result.current.isLoading("test-video")).toBe(false)
    })

    it("должен предоставить метод getError", () => {
      const { result } = renderHook(() => useYoloData())

      expect(typeof result.current.getError).toBe("function")
      expect(result.current.getError("test-video")).toBeNull()
    })

    it("должен обновлять loadingStates", async () => {
      const { result } = renderHook(() => useYoloData())

      expect(result.current.loadingStates).toEqual({})
    })

    it("должен обновлять errorStates", async () => {
      const { result } = renderHook(() => useYoloData())

      expect(result.current.errorStates).toEqual({})
    })
  })
})
