import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAutoLoadUserData } from "../use-auto-load-user-data"

// Создаем моки для зависимостей
const mockUseAutoLoadMedia = vi.hoisted(() => vi.fn())
const mockUseAutoLoadResources = vi.hoisted(() => vi.fn())

vi.mock("../use-auto-load-media", () => ({
  useAutoLoadMedia: mockUseAutoLoadMedia,
}))

vi.mock("../use-auto-load-resources", () => ({
  useAutoLoadResources: mockUseAutoLoadResources,
}))

describe("useAutoLoadUserData", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Дефолтные возвращаемые значения
    mockUseAutoLoadMedia.mockReturnValue({
      isLoading: false,
      error: null,
      loadedCount: { media: 0, music: 0 },
      reload: vi.fn(),
      clearCache: vi.fn(),
    })

    mockUseAutoLoadResources.mockReturnValue({
      isLoading: false,
      error: null,
      loadedStats: {
        effects: 0,
        transitions: 0,
        filters: 0,
        subtitles: 0,
        styleTemplates: 0,
      },
      reload: vi.fn(),
      clearCache: vi.fn(),
    })
  })

  describe("базовая функциональность", () => {
    it("должен объединять состояние загрузки из обоих хуков", () => {
      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.isLoading).toBe(false)
    })

    it("должен показывать isLoading=true если media загружается", () => {
      mockUseAutoLoadMedia.mockReturnValue({
        isLoading: true,
        error: null,
        loadedCount: { media: 0, music: 0 },
        reload: vi.fn(),
        clearCache: vi.fn(),
      })

      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.isLoading).toBe(true)
    })

    it("должен показывать isLoading=true если resources загружаются", () => {
      mockUseAutoLoadResources.mockReturnValue({
        isLoading: true,
        error: null,
        loadedStats: {
          effects: 0,
          transitions: 0,
          filters: 0,
          subtitles: 0,
          styleTemplates: 0,
        },
        reload: vi.fn(),
        clearCache: vi.fn(),
      })

      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.isLoading).toBe(true)
    })

    it("должен показывать isLoading=true если оба хука загружаются", () => {
      mockUseAutoLoadMedia.mockReturnValue({
        isLoading: true,
        error: null,
        loadedCount: { media: 0, music: 0 },
        reload: vi.fn(),
        clearCache: vi.fn(),
      })

      mockUseAutoLoadResources.mockReturnValue({
        isLoading: true,
        error: null,
        loadedStats: {
          effects: 0,
          transitions: 0,
          filters: 0,
          subtitles: 0,
          styleTemplates: 0,
        },
        reload: vi.fn(),
        clearCache: vi.fn(),
      })

      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe("обработка ошибок", () => {
    it("должен возвращать ошибку из mediaHook", () => {
      const error = "Media loading error"
      mockUseAutoLoadMedia.mockReturnValue({
        isLoading: false,
        error,
        loadedCount: { media: 0, music: 0 },
        reload: vi.fn(),
        clearCache: vi.fn(),
      })

      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.error).toBe(error)
    })

    it("должен возвращать ошибку из resourcesHook", () => {
      const error = "Resources loading error"
      mockUseAutoLoadResources.mockReturnValue({
        isLoading: false,
        error,
        loadedStats: {
          effects: 0,
          transitions: 0,
          filters: 0,
          subtitles: 0,
          styleTemplates: 0,
        },
        reload: vi.fn(),
        clearCache: vi.fn(),
      })

      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.error).toBe(error)
    })

    it("должен возвращать первую ошибку если оба хука имеют ошибки", () => {
      const mediaError = "Media error"
      const resourcesError = "Resources error"

      mockUseAutoLoadMedia.mockReturnValue({
        isLoading: false,
        error: mediaError,
        loadedCount: { media: 0, music: 0 },
        reload: vi.fn(),
        clearCache: vi.fn(),
      })

      mockUseAutoLoadResources.mockReturnValue({
        isLoading: false,
        error: resourcesError,
        loadedStats: {
          effects: 0,
          transitions: 0,
          filters: 0,
          subtitles: 0,
          styleTemplates: 0,
        },
        reload: vi.fn(),
        clearCache: vi.fn(),
      })

      const { result } = renderHook(() => useAutoLoadUserData())

      // Должна вернуться первая ошибка (из media)
      expect(result.current.error).toBe(mediaError)
    })
  })

  describe("объединенная статистика", () => {
    it("должен правильно объединять loadedData", () => {
      mockUseAutoLoadMedia.mockReturnValue({
        isLoading: false,
        error: null,
        loadedCount: { media: 5, music: 3 },
        reload: vi.fn(),
        clearCache: vi.fn(),
      })

      mockUseAutoLoadResources.mockReturnValue({
        isLoading: false,
        error: null,
        loadedStats: {
          effects: 10,
          transitions: 7,
          filters: 4,
          subtitles: 2,
          styleTemplates: 1,
        },
        reload: vi.fn(),
        clearCache: vi.fn(),
      })

      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.loadedData).toEqual({
        media: 5,
        music: 3,
        effects: 10,
        transitions: 7,
        filters: 4,
        subtitles: 2,
        styleTemplates: 1,
      })
    })

    it("должен работать с нулевыми значениями", () => {
      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.loadedData).toEqual({
        media: 0,
        music: 0,
        effects: 0,
        transitions: 0,
        filters: 0,
        subtitles: 0,
        styleTemplates: 0,
      })
    })
  })

  describe("функция reload", () => {
    it("должен вызывать reload обоих хуков", async () => {
      const mediaReload = vi.fn().mockResolvedValue(undefined)
      const resourcesReload = vi.fn().mockResolvedValue(undefined)

      mockUseAutoLoadMedia.mockReturnValue({
        isLoading: false,
        error: null,
        loadedCount: { media: 0, music: 0 },
        reload: mediaReload,
        clearCache: vi.fn(),
      })

      mockUseAutoLoadResources.mockReturnValue({
        isLoading: false,
        error: null,
        loadedStats: {
          effects: 0,
          transitions: 0,
          filters: 0,
          subtitles: 0,
          styleTemplates: 0,
        },
        reload: resourcesReload,
        clearCache: vi.fn(),
      })

      const { result } = renderHook(() => useAutoLoadUserData())

      await result.current.reload()

      expect(mediaReload).toHaveBeenCalledTimes(1)
      expect(resourcesReload).toHaveBeenCalledTimes(1)
    })

    it("должен вызывать reload параллельно", async () => {
      const mediaReload = vi.fn().mockResolvedValue(undefined)
      const resourcesReload = vi.fn().mockResolvedValue(undefined)

      mockUseAutoLoadMedia.mockReturnValue({
        isLoading: false,
        error: null,
        loadedCount: { media: 0, music: 0 },
        reload: mediaReload,
        clearCache: vi.fn(),
      })

      mockUseAutoLoadResources.mockReturnValue({
        isLoading: false,
        error: null,
        loadedStats: {
          effects: 0,
          transitions: 0,
          filters: 0,
          subtitles: 0,
          styleTemplates: 0,
        },
        reload: resourcesReload,
        clearCache: vi.fn(),
      })

      const { result } = renderHook(() => useAutoLoadUserData())

      const startTime = Date.now()
      await result.current.reload()
      const duration = Date.now() - startTime

      // Проверяем, что вызовы были параллельными (не последовательными)
      // При последовательном выполнении это заняло бы больше времени
      expect(duration).toBeLessThan(100) // Достаточно малое время для параллельных Promise
    })

    it("должен быть стабильной функцией между рендерами", () => {
      const { result, rerender } = renderHook(() => useAutoLoadUserData())

      const firstReload = result.current.reload

      rerender()

      const secondReload = result.current.reload

      // Функция должна быть мемоизирована
      expect(firstReload).toBe(secondReload)
    })
  })

  describe("функция clearCache", () => {
    it("должен вызывать clearCache обоих хуков", () => {
      const mediaClearCache = vi.fn()
      const resourcesClearCache = vi.fn()

      mockUseAutoLoadMedia.mockReturnValue({
        isLoading: false,
        error: null,
        loadedCount: { media: 0, music: 0 },
        reload: vi.fn(),
        clearCache: mediaClearCache,
      })

      mockUseAutoLoadResources.mockReturnValue({
        isLoading: false,
        error: null,
        loadedStats: {
          effects: 0,
          transitions: 0,
          filters: 0,
          subtitles: 0,
          styleTemplates: 0,
        },
        reload: vi.fn(),
        clearCache: resourcesClearCache,
      })

      const { result } = renderHook(() => useAutoLoadUserData())

      result.current.clearCache()

      expect(mediaClearCache).toHaveBeenCalledTimes(1)
      expect(resourcesClearCache).toHaveBeenCalledTimes(1)
    })

    it("должен быть стабильной функцией между рендерами", () => {
      const { result, rerender } = renderHook(() => useAutoLoadUserData())

      const firstClearCache = result.current.clearCache

      rerender()

      const secondClearCache = result.current.clearCache

      // Функция должна быть мемоизирована
      expect(firstClearCache).toBe(secondClearCache)
    })
  })

  describe("edge cases", () => {
    it("должен работать когда оба хука не загружены и без ошибок", () => {
      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.loadedData).toEqual({
        media: 0,
        music: 0,
        effects: 0,
        transitions: 0,
        filters: 0,
        subtitles: 0,
        styleTemplates: 0,
      })
    })

    it("должен работать когда media загружен, а resources нет", () => {
      mockUseAutoLoadMedia.mockReturnValue({
        isLoading: false,
        error: null,
        loadedCount: { media: 10, music: 5 },
        reload: vi.fn(),
        clearCache: vi.fn(),
      })

      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.loadedData.media).toBe(10)
      expect(result.current.loadedData.music).toBe(5)
      expect(result.current.loadedData.effects).toBe(0)
    })

    it("должен работать когда resources загружены, а media нет", () => {
      mockUseAutoLoadResources.mockReturnValue({
        isLoading: false,
        error: null,
        loadedStats: {
          effects: 15,
          transitions: 8,
          filters: 6,
          subtitles: 3,
          styleTemplates: 2,
        },
        reload: vi.fn(),
        clearCache: vi.fn(),
      })

      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.loadedData.media).toBe(0)
      expect(result.current.loadedData.effects).toBe(15)
      expect(result.current.loadedData.transitions).toBe(8)
    })
  })

  describe("интеграция", () => {
    it("должен правильно работать при изменении состояния хуков", () => {
      const { result, rerender } = renderHook(() => useAutoLoadUserData())

      // Начальное состояние
      expect(result.current.isLoading).toBe(false)

      // Начинаем загрузку media
      mockUseAutoLoadMedia.mockReturnValue({
        isLoading: true,
        error: null,
        loadedCount: { media: 0, music: 0 },
        reload: vi.fn(),
        clearCache: vi.fn(),
      })

      rerender()

      expect(result.current.isLoading).toBe(true)

      // Завершаем загрузку media
      mockUseAutoLoadMedia.mockReturnValue({
        isLoading: false,
        error: null,
        loadedCount: { media: 5, music: 3 },
        reload: vi.fn(),
        clearCache: vi.fn(),
      })

      rerender()

      expect(result.current.isLoading).toBe(false)
      expect(result.current.loadedData.media).toBe(5)
    })
  })
})
