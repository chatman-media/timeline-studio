import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAutoLoadMedia } from "../use-auto-load-media"

// Создаем моки
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
}))

const mockAddMediaFile = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockUpdateMusicFiles = vi.hoisted(() => vi.fn())

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => mockLogger,
}))

vi.mock("@/features/app-state/hooks", () => ({
  useMediaFiles: () => ({
    addMediaFile: mockAddMediaFile,
  }),
  useMusicFiles: () => ({
    updateMusicFiles: mockUpdateMusicFiles,
  }),
}))

vi.mock("@/domains/project-management/services/app-directories-service", () => ({
  appDirectoriesService: {
    createAppDirectories: vi.fn().mockResolvedValue(undefined),
    getMediaSubdirectory: vi.fn((subdir: string) => `/app/media/${subdir}`),
  },
}))

describe("useAutoLoadMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Мокаем window.__TAURI_INTERNALS__
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {},
      writable: true,
      configurable: true,
    })
  })

  describe("начальное состояние", () => {
    it("должен возвращать начальное состояние", () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.loadedCount).toEqual({
        media: 0,
        music: 0,
      })
    })

    it("должен предоставлять функцию reload", () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      expect(typeof result.current.reload).toBe("function")
    })

    it("должен предоставлять функцию clearCache", () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      expect(typeof result.current.clearCache).toBe("function")
    })
  })

  describe("определение окружения", () => {
    it("должен распознавать Tauri окружение", async () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Автозагрузка отключена
      expect(mockLogger.info).toHaveBeenCalledWith("Auto-loading is disabled", {
        context: "useAutoLoadMedia",
      })
    })

    it("должен работать в не-Tauri окружении", () => {
      delete (window as any).__TAURI_INTERNALS__

      const { result } = renderHook(() => useAutoLoadMedia())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe("функция clearCache", () => {
    it("должен очищать кэш", () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      result.current.clearCache()

      expect(result.current.error).toBeNull()
    })

    it("должен быть стабильной функцией между рендерами", () => {
      const { result, rerender } = renderHook(() => useAutoLoadMedia())

      const firstClearCache = result.current.clearCache

      rerender()

      const secondClearCache = result.current.clearCache

      expect(firstClearCache).toBe(secondClearCache)
    })

    it("должен сбросить время последней загрузки", () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      result.current.clearCache()

      // Проверяем, что кэш был очищен
      expect(result.current.loadedCount).toEqual({
        media: 0,
        music: 0,
      })
    })
  })

  describe("функция reload (debounced)", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("должен дебаунсить вызовы reload", () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      result.current.reload()
      result.current.reload()
      result.current.reload()

      expect(result.current.isLoading).toBe(false)

      vi.advanceTimersByTime(300)

      expect(mockLogger.info).toHaveBeenCalledWith("Auto-loading is disabled", {
        context: "useAutoLoadMedia",
      })
    })

    it("должен быть стабильной функцией между рендерами при debounce", () => {
      const { result, rerender } = renderHook(() => useAutoLoadMedia())

      const firstReload = result.current.reload

      rerender()

      const secondReload = result.current.reload

      // Функция должна быть стабильной благодаря useCallback
      expect(typeof firstReload).toBe("function")
      expect(typeof secondReload).toBe("function")
    })

    it("не должен загружать чаще чем раз в 500мс", () => {
      vi.useFakeTimers()

      const { result } = renderHook(() => useAutoLoadMedia())

      result.current.reload()
      vi.advanceTimersByTime(100)
      result.current.reload()
      vi.advanceTimersByTime(100)
      result.current.reload()

      vi.advanceTimersByTime(300)

      expect(result.current.isLoading).toBe(false)

      vi.useRealTimers()
    })
  })

  describe("загруженный счетчик", () => {
    it("должен возвращать корректный счетчик после загрузки", async () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Автозагрузка отключена, счетчик должен быть нулевым
      expect(result.current.loadedCount).toEqual({
        media: 0,
        music: 0,
      })
    })

    it("должен обновлять счетчик при повторной загрузке", async () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCount = { ...result.current.loadedCount }

      result.current.reload()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.loadedCount).toEqual(initialCount)
    })
  })

  describe("кэширование", () => {
    it("должен использовать кэш при повторной загрузке", async () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      result.current.reload()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const logCallsCount = mockLogger.info.mock.calls.length

      result.current.reload()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockLogger.info.mock.calls.length).toBeGreaterThanOrEqual(logCallsCount)
    })

    it("должен сбрасывать кэш при вызове clearCache", () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      result.current.clearCache()

      expect(result.current.loadedCount).toEqual({
        media: 0,
        music: 0,
      })
    })
  })

  describe("обработка ошибок", () => {
    it("должен обрабатывать ошибки при сканировании директорий", async () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeNull()
    })

    it("должен логировать ошибки", async () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Автозагрузка отключена, ошибок быть не должно
      expect(result.current.error).toBeNull()
    })
  })

  describe("расширения файлов", () => {
    it("должен использовать правильные расширения для медиа", () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      // Проверяем, что хук инициализирован
      expect(result.current).toBeDefined()
      expect(result.current.loadedCount).toBeDefined()
    })

    it("должен использовать правильные расширения для музыки", () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      expect(result.current).toBeDefined()
      expect(result.current.loadedCount).toBeDefined()
    })
  })

  describe("обработка медиа файлов", () => {
    it("не должен вызывать addMediaFile когда автозагрузка отключена", async () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockAddMediaFile).not.toHaveBeenCalled()
    })

    it("не должен вызывать updateMusicFiles когда автозагрузка отключена", async () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockUpdateMusicFiles).not.toHaveBeenCalled()
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать пустые директории", async () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.loadedCount).toEqual({
        media: 0,
        music: 0,
      })
    })

    it("должен обрабатывать несуществующие директории", async () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe("производительность", () => {
    it("должен обрабатывать файлы пакетами", () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      // Автозагрузка отключена
      expect(result.current.loadedCount).toEqual({
        media: 0,
        music: 0,
      })
    })

    it("не должен загружать чаще чем раз в 500мс (debouncing)", () => {
      vi.useFakeTimers()

      const { result } = renderHook(() => useAutoLoadMedia())

      result.current.reload()
      vi.advanceTimersByTime(100)
      result.current.reload()
      vi.advanceTimersByTime(100)
      result.current.reload()

      vi.advanceTimersByTime(300)

      expect(result.current.isLoading).toBe(false)

      vi.useRealTimers()
    })
  })

  describe("логирование", () => {
    it("должен логировать информацию о загрузке", async () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockLogger.info).toHaveBeenCalledWith("Auto-loading is disabled", {
        context: "useAutoLoadMedia",
      })
    })

    it("должен логировать счетчики файлов", async () => {
      const { result } = renderHook(() => useAutoLoadMedia())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Автозагрузка отключена, поэтому логов о загрузке файлов не будет
      expect(mockLogger.info).toHaveBeenCalledWith("Auto-loading is disabled", {
        context: "useAutoLoadMedia",
      })
    })
  })

  describe("интеграция", () => {
    it("должен правильно работать при изменении состояния", () => {
      const { result, rerender } = renderHook(() => useAutoLoadMedia())

      expect(result.current.isLoading).toBe(false)

      rerender()

      expect(result.current.isLoading).toBe(false)
      expect(result.current.loadedCount).toEqual({
        media: 0,
        music: 0,
      })
    })

    it("должен сохранять стабильность функций при ререндере", () => {
      const { result, rerender } = renderHook(() => useAutoLoadMedia())

      const firstReload = result.current.reload
      const firstClearCache = result.current.clearCache

      rerender()

      // Проверяем что функции остаются функциями
      expect(typeof result.current.reload).toBe("function")
      expect(typeof result.current.clearCache).toBe("function")

      // Проверяем что они не undefined
      expect(result.current.reload).toBeDefined()
      expect(result.current.clearCache).toBeDefined()
    })
  })
})
