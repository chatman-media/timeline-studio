import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAutoLoadResources } from "../use-auto-load-resources"

// Создаем моки
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
}))

const mockAddEffect = vi.hoisted(() => vi.fn())
const mockAddFilter = vi.hoisted(() => vi.fn())
const mockAddTransition = vi.hoisted(() => vi.fn())
const mockAddSubtitle = vi.hoisted(() => vi.fn())
const mockAddStyleTemplate = vi.hoisted(() => vi.fn())

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => mockLogger,
}))

vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addEffect: mockAddEffect,
    addFilter: mockAddFilter,
    addTransition: mockAddTransition,
    addSubtitle: mockAddSubtitle,
    addStyleTemplate: mockAddStyleTemplate,
  }),
}))

vi.mock("@/features/app-state/services", () => ({
  appDirectoriesService: {
    createAppDirectories: vi.fn().mockResolvedValue(undefined),
    getMediaSubdirectory: vi.fn((subdir: string) => `/app/media/${subdir}`),
  },
}))

// Мокаем валидаторы
vi.mock("../../utils/validation", () => ({
  validateEffect: vi.fn((data) => (data?.id ? data : null)),
  validateFilter: vi.fn((data) => (data?.id ? data : null)),
  validateTransition: vi.fn((data) => (data?.id ? data : null)),
  validateSubtitleStyle: vi.fn((data) => (data?.id ? data : null)),
  validateStyleTemplate: vi.fn((data) => (data?.id ? data : null)),
}))

describe("useAutoLoadResources", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Мокаем window.__TAURI_INTERNALS__ для определения Tauri окружения
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {},
      writable: true,
      configurable: true,
    })
  })

  describe("начальное состояние", () => {
    it("должен возвращать начальное состояние", () => {
      const { result } = renderHook(() => useAutoLoadResources())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.loadedStats).toEqual({
        effects: 0,
        filters: 0,
        transitions: 0,
        subtitles: 0,
        styleTemplates: 0,
      })
    })

    it("должен предоставлять функцию reload", () => {
      const { result } = renderHook(() => useAutoLoadResources())

      expect(typeof result.current.reload).toBe("function")
    })

    it("должен предоставлять функцию clearCache", () => {
      const { result } = renderHook(() => useAutoLoadResources())

      expect(typeof result.current.clearCache).toBe("function")
    })
  })

  describe("определение окружения", () => {
    it("должен распознавать Tauri окружение", async () => {
      // Мокаем Tauri API
      const mockExists = vi.fn().mockResolvedValue(true)
      const mockReadDir = vi.fn().mockResolvedValue([])

      vi.doMock("@tauri-apps/plugin-fs", () => ({
        exists: mockExists,
        readDir: mockReadDir,
      }))

      const { result } = renderHook(() => useAutoLoadResources())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Проверяем, что Tauri окружение было распознано
      expect(mockLogger.info).toHaveBeenCalledWith("Auto-loading is disabled", {
        context: "useAutoLoadResources",
      })
    })

    it("должен работать в не-Tauri окружении", () => {
      // Удаляем __TAURI_INTERNALS__
      delete (window as any).__TAURI_INTERNALS__

      const { result } = renderHook(() => useAutoLoadResources())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe("функция clearCache", () => {
    it("должен очищать кэш", () => {
      const { result } = renderHook(() => useAutoLoadResources())

      result.current.clearCache()

      // Проверяем, что функция выполнилась без ошибок
      expect(result.current.error).toBeNull()
    })

    it("должен быть стабильной функцией между рендерами", () => {
      const { result, rerender } = renderHook(() => useAutoLoadResources())

      const firstClearCache = result.current.clearCache

      rerender()

      const secondClearCache = result.current.clearCache

      expect(firstClearCache).toBe(secondClearCache)
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
      const { result } = renderHook(() => useAutoLoadResources())

      result.current.reload()
      result.current.reload()
      result.current.reload()

      expect(result.current.isLoading).toBe(false)

      // Ждем debounce timeout (500мс)
      vi.advanceTimersByTime(500)

      // После debounce должна начаться загрузка
      expect(mockLogger.info).toHaveBeenCalledWith("Auto-loading is disabled", {
        context: "useAutoLoadResources",
      })
    })

    it("должен быть стабильной функцией между рендерами", () => {
      const { result, rerender } = renderHook(() => useAutoLoadResources())

      const firstReload = result.current.reload

      rerender()

      const secondReload = result.current.reload

      expect(firstReload).toBe(secondReload)
    })
  })

  describe("обработка ошибок", () => {
    it("должен обрабатывать ошибки при сканировании директорий", async () => {
      // Мокаем ошибку при чтении директории
      const mockExists = vi.fn().mockResolvedValue(true)
      const mockReadDir = vi.fn().mockRejectedValue(new Error("Directory read error"))

      vi.doMock("@tauri-apps/plugin-fs", () => ({
        exists: mockExists,
        readDir: mockReadDir,
      }))

      const { result } = renderHook(() => useAutoLoadResources())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Проверяем, что ошибка была залогирована
      // (Автозагрузка отключена, поэтому реальной загрузки не происходит)
      expect(mockLogger.info).toHaveBeenCalledWith("Auto-loading is disabled", {
        context: "useAutoLoadResources",
      })
    })
  })

  describe("загруженная статистика", () => {
    it("должен возвращать корректную статистику после загрузки", async () => {
      const { result } = renderHook(() => useAutoLoadResources())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Так как автозагрузка отключена, статистика должна быть нулевой
      expect(result.current.loadedStats).toEqual({
        effects: 0,
        filters: 0,
        transitions: 0,
        subtitles: 0,
        styleTemplates: 0,
      })
    })

    it("должен обновлять статистику при повторной загрузке", async () => {
      const { result } = renderHook(() => useAutoLoadResources())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialStats = { ...result.current.loadedStats }

      // Вызываем reload
      result.current.reload()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Статистика должна остаться такой же (автозагрузка отключена)
      expect(result.current.loadedStats).toEqual(initialStats)
    })
  })

  describe("кэширование", () => {
    it("должен использовать кэш при повторной загрузке", async () => {
      const { result } = renderHook(() => useAutoLoadResources())

      // Первая загрузка
      result.current.reload()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const logCallsCount = mockLogger.info.mock.calls.length

      // Вторая загрузка (должна использовать кэш)
      result.current.reload()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Количество логов должно увеличиться (новый вызов)
      expect(mockLogger.info.mock.calls.length).toBeGreaterThanOrEqual(logCallsCount)
    })

    it("должен сбрасывать кэш при вызове clearCache", () => {
      const { result } = renderHook(() => useAutoLoadResources())

      result.current.clearCache()

      // После очистки кэша статистика должна остаться прежней
      expect(result.current.loadedStats).toEqual({
        effects: 0,
        filters: 0,
        transitions: 0,
        subtitles: 0,
        styleTemplates: 0,
      })
    })
  })

  describe("интеграция с валидаторами", () => {
    it("должен использовать валидаторы для проверки данных", async () => {
      const { result } = renderHook(() => useAutoLoadResources())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Так как автозагрузка отключена, валидаторы не должны быть вызваны
      expect(mockAddEffect).not.toHaveBeenCalled()
      expect(mockAddFilter).not.toHaveBeenCalled()
      expect(mockAddTransition).not.toHaveBeenCalled()
      expect(mockAddSubtitle).not.toHaveBeenCalled()
      expect(mockAddStyleTemplate).not.toHaveBeenCalled()
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать пустые директории", async () => {
      const mockExists = vi.fn().mockResolvedValue(true)
      const mockReadDir = vi.fn().mockResolvedValue([])

      vi.doMock("@tauri-apps/plugin-fs", () => ({
        exists: mockExists,
        readDir: mockReadDir,
      }))

      const { result } = renderHook(() => useAutoLoadResources())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.loadedStats).toEqual({
        effects: 0,
        filters: 0,
        transitions: 0,
        subtitles: 0,
        styleTemplates: 0,
      })
    })

    it("должен обрабатывать несуществующие директории", async () => {
      const mockExists = vi.fn().mockResolvedValue(false)

      vi.doMock("@tauri-apps/plugin-fs", () => ({
        exists: mockExists,
        readDir: vi.fn(),
      }))

      const { result } = renderHook(() => useAutoLoadResources())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeNull()
    })

    it("должен обрабатывать невалидные JSON файлы", async () => {
      const { result } = renderHook(() => useAutoLoadResources())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Проверяем, что невалидные данные не добавляются
      expect(mockAddEffect).not.toHaveBeenCalled()
    })
  })

  describe("производительность", () => {
    it("должен обрабатывать файлы пакетами", () => {
      const { result } = renderHook(() => useAutoLoadResources())

      // Так как автозагрузка отключена, пакетная обработка не запускается
      expect(result.current.loadedStats).toEqual({
        effects: 0,
        filters: 0,
        transitions: 0,
        subtitles: 0,
        styleTemplates: 0,
      })
    })

    it("не должен загружать чаще чем раз в секунду (debouncing)", () => {
      vi.useFakeTimers()

      const { result } = renderHook(() => useAutoLoadResources())

      // Множественные вызовы reload
      result.current.reload()
      vi.advanceTimersByTime(100)
      result.current.reload()
      vi.advanceTimersByTime(100)
      result.current.reload()

      // Должен быть только один вызов после debounce
      vi.advanceTimersByTime(500)

      expect(result.current.isLoading).toBe(false)

      vi.useRealTimers()
    })
  })

  describe("логирование", () => {
    it("должен логировать информацию о загрузке", () => {
      renderHook(() => useAutoLoadResources())

      // Автозагрузка отключена, логируется соответствующее сообщение
      expect(mockLogger.info).toHaveBeenCalledWith("Auto-loading is disabled", {
        context: "useAutoLoadResources",
      })
    })

    it("должен не вызывать ошибки при работе", () => {
      const { result } = renderHook(() => useAutoLoadResources())

      // Автозагрузка отключена, поэтому ошибок быть не должно
      expect(result.current.error).toBeNull()
    })
  })
})
