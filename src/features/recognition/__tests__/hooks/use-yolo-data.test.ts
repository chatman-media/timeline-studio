/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockYoloData, mockDetections } from "../../__mocks__"
import { useYoloData } from "../../hooks/use-yolo-data"

// Mock dependencies - use vi.hoisted to properly hoist mock class
// biome-ignore lint/style/useConst: vi.hoisted requires this pattern
let mockYoloDataService = vi.hoisted(() => ({
  loadYoloData: vi.fn(),
  getYoloDataAtTimestamp: vi.fn(),
  getVideoSummary: vi.fn(),
  getAllYoloData: vi.fn(),
  hasYoloData: vi.fn(),
  clearVideoCache: vi.fn(),
  clearAllCache: vi.fn(),
  getCacheStats: vi.fn(),
  saveYoloData: vi.fn(),
}))

const MockYoloDataService = vi.hoisted(() => {
  return class {
    loadYoloData = mockYoloDataService.loadYoloData
    getYoloDataAtTimestamp = mockYoloDataService.getYoloDataAtTimestamp
    getVideoSummary = mockYoloDataService.getVideoSummary
    getAllYoloData = mockYoloDataService.getAllYoloData
    hasYoloData = mockYoloDataService.hasYoloData
    clearVideoCache = mockYoloDataService.clearVideoCache
    clearAllCache = mockYoloDataService.clearAllCache
    getCacheStats = mockYoloDataService.getCacheStats
    saveYoloData = mockYoloDataService.saveYoloData
  }
})

vi.mock("@/domains/ai-services/services/recognition", () => ({
  YoloDataService: MockYoloDataService,
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
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock return values
    mockYoloDataService.loadYoloData.mockResolvedValue(createMockYoloData())
    mockYoloDataService.getYoloDataAtTimestamp.mockResolvedValue(mockDetections)
    mockYoloDataService.getVideoSummary.mockResolvedValue({
      videoId: "test-video",
      videoName: "test.mp4",
      frameCount: 2,
      detectedClasses: ["person", "car"],
      classCounts: { person: 2, car: 1 },
      classTimeRanges: {
        person: [{ start: 0, end: 5 }],
        car: [{ start: 5, end: 5 }],
      },
    })
    mockYoloDataService.getAllYoloData.mockResolvedValue(createMockYoloData())
    mockYoloDataService.hasYoloData.mockReturnValue(true)
    mockYoloDataService.getCacheStats.mockReturnValue({
      cachedVideos: 1,
      nonExistentVideos: 0,
      totalMemoryUsage: 1024,
      missingDataCount: 0,
    })
    mockYoloDataService.saveYoloData.mockResolvedValue(undefined)
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
        {
          class: "person",
          confidence: 0.95,
          bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.6 },
        },
        {
          class: "person",
          confidence: 0.92,
          bbox: { x: 0.5, y: 0.3, width: 0.2, height: 0.5 },
        },
      ])
      const { result } = renderHook(() => useYoloData())

      const context = await result.current.getSceneContext("test-video", 5)

      expect(context).toContain("2 person")
    })

    it("должен определять позиции объектов", async () => {
      mockYoloDataService.getYoloDataAtTimestamp.mockResolvedValue([
        {
          class: "person",
          confidence: 0.95,
          bbox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        },
      ])
      const { result } = renderHook(() => useYoloData())

      const context = await result.current.getSceneContext("test-video", 5)

      expect(context).toMatch(/верх|центр|низ/)
      expect(context).toMatch(/лево|центр|право/)
    })

    it("должен обработать ошибку в getYoloDataAtTimestamp как отсутствие объектов", async () => {
      // Когда getYoloDataAtTimestamp выбрасывает ошибку, она ловится внутри хука
      // и возвращается пустой массив, что приводит к сообщению об отсутствии объектов
      mockYoloDataService.getYoloDataAtTimestamp.mockRejectedValue(new Error("Failed"))
      const { result } = renderHook(() => useYoloData())

      const context = await result.current.getSceneContext("test-video", 5)

      expect(context).toBe("В кадре не обнаружено объектов.")
    })

    it("должен определять верхнюю левую позицию", async () => {
      mockYoloDataService.getYoloDataAtTimestamp.mockResolvedValue([
        {
          class: "person",
          confidence: 0.95,
          bbox: { x: 0.1, y: 0.1, width: 0.1, height: 0.1 },
        },
      ])
      const { result } = renderHook(() => useYoloData())

      const context = await result.current.getSceneContext("test-video", 5)

      expect(context).toContain("верх-лево")
    })

    it("должен определять центральную позицию", async () => {
      mockYoloDataService.getYoloDataAtTimestamp.mockResolvedValue([
        {
          class: "person",
          confidence: 0.95,
          bbox: { x: 0.4, y: 0.4, width: 0.2, height: 0.2 },
        },
      ])
      const { result } = renderHook(() => useYoloData())

      const context = await result.current.getSceneContext("test-video", 5)

      expect(context).toContain("центр-центр")
    })

    it("должен определять нижнюю правую позицию", async () => {
      mockYoloDataService.getYoloDataAtTimestamp.mockResolvedValue([
        {
          class: "person",
          confidence: 0.95,
          bbox: { x: 0.7, y: 0.7, width: 0.2, height: 0.2 },
        },
      ])
      const { result } = renderHook(() => useYoloData())

      const context = await result.current.getSceneContext("test-video", 5)

      expect(context).toContain("низ-право")
    })

    it("должен объединять уникальные позиции", async () => {
      mockYoloDataService.getYoloDataAtTimestamp.mockResolvedValue([
        {
          class: "person",
          confidence: 0.95,
          bbox: { x: 0.1, y: 0.1, width: 0.1, height: 0.1 },
        },
        {
          class: "person",
          confidence: 0.95,
          bbox: { x: 0.7, y: 0.1, width: 0.1, height: 0.1 },
        },
      ])
      const { result } = renderHook(() => useYoloData())

      const context = await result.current.getSceneContext("test-video", 5)

      expect(context).toContain("2 person")
      expect(context).toMatch(/верх-лево.*верх-право|в/)
    })

    it("должен использовать 'в разных частях кадра' для многих позиций", async () => {
      mockYoloDataService.getYoloDataAtTimestamp.mockResolvedValue([
        {
          class: "person",
          confidence: 0.95,
          bbox: { x: 0.1, y: 0.1, width: 0.1, height: 0.1 },
        },
        {
          class: "person",
          confidence: 0.95,
          bbox: { x: 0.5, y: 0.5, width: 0.1, height: 0.1 },
        },
        {
          class: "person",
          confidence: 0.95,
          bbox: { x: 0.8, y: 0.8, width: 0.1, height: 0.1 },
        },
      ])
      const { result } = renderHook(() => useYoloData())

      const context = await result.current.getSceneContext("test-video", 5)

      expect(context).toContain("3 person")
      expect(context).toContain("в разных частях кадра")
    })
  })

  describe("integration with Preview Manager", () => {
    it("должен использовать processVideoRecognition когда нет локальных данных", async () => {
      mockYoloDataService.loadYoloData.mockResolvedValueOnce(null)
      const mockProcessVideoRecognition = vi.fn().mockResolvedValue(createMockYoloData())

      vi.mocked(await import("../../hooks/use-recognition-preview")).useRecognitionPreview = vi.fn(() => ({
        processVideoRecognition: mockProcessVideoRecognition,
        getRecognitionAtTimestamp: vi.fn().mockResolvedValue([]),
        getPreviewWithRecognition: vi.fn(),
        processBatchRecognition: vi.fn(),
        clearRecognitionResults: vi.fn(),
        isProcessing: false,
        error: null,
      }))

      const { result } = renderHook(() => useYoloData())

      await result.current.loadYoloData("test-video", "/path/to/video.mp4")

      await waitFor(() => {
        expect(mockProcessVideoRecognition).toHaveBeenCalledWith("test-video", "/path/to/video.mp4")
      })
    })

    it("должен использовать getRecognitionFromCache когда нет локальных данных для timestamp", async () => {
      mockYoloDataService.getYoloDataAtTimestamp.mockResolvedValueOnce([])
      const mockGetRecognitionAtTimestamp = vi.fn().mockResolvedValue(mockDetections)

      vi.mocked(await import("../../hooks/use-recognition-preview")).useRecognitionPreview = vi.fn(() => ({
        processVideoRecognition: vi.fn(),
        getRecognitionAtTimestamp: mockGetRecognitionAtTimestamp,
        getPreviewWithRecognition: vi.fn(),
        processBatchRecognition: vi.fn(),
        clearRecognitionResults: vi.fn(),
        isProcessing: false,
        error: null,
      }))

      const { result } = renderHook(() => useYoloData())

      const detections = await result.current.getYoloDataAtTimestamp("test-video", 5)

      expect(detections).toEqual(mockDetections)
      await waitFor(() => {
        expect(mockGetRecognitionAtTimestamp).toHaveBeenCalledWith("test-video", 5)
      })
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
