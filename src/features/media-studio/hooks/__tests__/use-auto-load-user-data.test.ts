import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAutoLoadUserData } from "../use-auto-load-user-data"

const mockUseAutoLoadResources = vi.hoisted(() => vi.fn())

vi.mock("../use-auto-load-resources", () => ({
  useAutoLoadResources: mockUseAutoLoadResources,
}))

describe("useAutoLoadUserData", () => {
  beforeEach(() => {
    vi.clearAllMocks()

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
    it("должен возвращать состояние загрузки из resourcesHook", () => {
      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.isLoading).toBe(false)
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
  })

  describe("обработка ошибок", () => {
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
  })

  describe("статистика загрузки", () => {
    it("должен правильно возвращать loadedData", () => {
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
        effects: 0,
        transitions: 0,
        filters: 0,
        subtitles: 0,
        styleTemplates: 0,
      })
    })
  })

  describe("функция reload", () => {
    it("должен вызывать reload resourcesHook", async () => {
      const resourcesReload = vi.fn().mockResolvedValue(undefined)

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

      expect(resourcesReload).toHaveBeenCalledTimes(1)
    })

    it("должен быть стабильной функцией между рендерами", () => {
      const { result, rerender } = renderHook(() => useAutoLoadUserData())

      const firstReload = result.current.reload

      rerender()

      const secondReload = result.current.reload

      expect(firstReload).toBe(secondReload)
    })
  })

  describe("функция clearCache", () => {
    it("должен вызывать clearCache resourcesHook", () => {
      const resourcesClearCache = vi.fn()

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

      expect(resourcesClearCache).toHaveBeenCalledTimes(1)
    })

    it("должен быть стабильной функцией между рендерами", () => {
      const { result, rerender } = renderHook(() => useAutoLoadUserData())

      const firstClearCache = result.current.clearCache

      rerender()

      const secondClearCache = result.current.clearCache

      expect(firstClearCache).toBe(secondClearCache)
    })
  })

  describe("интеграция", () => {
    it("должен правильно работать при изменении состояния хука", () => {
      const { result, rerender } = renderHook(() => useAutoLoadUserData())

      expect(result.current.isLoading).toBe(false)

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

      rerender()

      expect(result.current.isLoading).toBe(true)

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

      rerender()

      expect(result.current.isLoading).toBe(false)
      expect(result.current.loadedData.effects).toBe(15)
    })
  })
})
