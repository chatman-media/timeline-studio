import { open } from "@tauri-apps/plugin-dialog"
import { readTextFile } from "@tauri-apps/plugin-fs"
import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { MediaProviders } from "@/test/test-utils"

import { useFiltersImport } from "../../hooks/use-filters-import"

// Mock AppProvider to avoid backend connection issues
vi.mock("@/features/app-state/services/app-provider", async () => {
  const React = await import("react")

  const mockContext = {
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    projectState: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    retryConnection: vi.fn(),
    executeCommand: vi.fn(),
  }

  const AppContext = React.createContext(mockContext)

  return {
    AppProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(AppContext.Provider, { value: mockContext }, children),
    useApp: () => mockContext,
    useApp: () => mockContext,
    AppProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(AppContext.Provider, { value: mockContext }, children),
    AppContext,
  }
})

// Мокаем Tauri dialog API
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}))

// Мокаем Tauri fs API
vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
}))

// Создаем мок функции для addFilter
const mockAddFilter = vi.fn()

// Мокаем useResources для возврата mockAddFilter
vi.mock("@/features/resources", async () => {
  const React = await import("react")
  return {
    ResourcesProvider: ({ children }: { children: React.ReactNode }) => children,
    useResources: () => ({
      addFilter: mockAddFilter,
      effects: [],
      filters: [],
      transitions: [],
      templates: [],
    }),
  }
})

// Получаем мок функции
const mockOpen = vi.mocked(open)
const mockReadTextFile = vi.mocked(readTextFile)

describe("useFiltersImport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Мокаем console.log и console.error
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("должен инициализироваться с правильными значениями по умолчанию", () => {
    const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

    expect(result.current.isImporting).toBe(false)
    expect(typeof result.current.importFiltersFile).toBe("function")
    expect(typeof result.current.importFilterFile).toBe("function")
  })

  describe("importFiltersFile", () => {
    it("должен открывать диалог выбора JSON файла", async () => {
      mockOpen.mockResolvedValue("/path/to/filters.json")
      const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importFiltersFile()
      })

      expect(mockOpen).toHaveBeenCalledWith({
        multiple: false,
        filters: [
          {
            name: "Filters JSON",
            extensions: ["json"],
          },
        ],
      })
    })

    it("должен устанавливать isImporting в true во время импорта", async () => {
      let resolveOpen: (value: string) => void
      const openPromise = new Promise<string>((resolve) => {
        resolveOpen = resolve
      })
      mockOpen.mockReturnValue(openPromise)

      const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

      // Начинаем импорт
      act(() => {
        void result.current.importFiltersFile()
      })

      // Проверяем, что isImporting стал true
      expect(result.current.isImporting).toBe(true)

      // Завершаем импорт
      await act(async () => {
        resolveOpen!("/path/to/filters.json")
        await openPromise
      })

      // Проверяем, что isImporting стал false
      await waitFor(() => {
        expect(result.current.isImporting).toBe(false)
      })
    })

    it("должен импортировать фильтры из файла", async () => {
      const filePath = "/path/to/filters.json"
      mockOpen.mockResolvedValue(filePath)
      // Мокаем JSON файл с корректными фильтрами
      const mockFilters = [
        {
          id: "filter1",
          name: "Filter 1",
          category: "creative",
        },
      ]
      mockReadTextFile.mockResolvedValue(JSON.stringify(mockFilters))
      const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importFiltersFile()
      })

      // Проверяем что addFilter был вызван для каждого фильтра
      expect(mockAddFilter).toHaveBeenCalledTimes(1)
      expect(mockAddFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "filter1",
          name: "Filter 1",
          category: "creative",
        }),
      )
    })

    it("не должен делать ничего если файл не выбран", async () => {
      mockOpen.mockResolvedValue(null)
      const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importFiltersFile()
      })

      // Проверяем что addFilter не был вызван
      expect(mockAddFilter).not.toHaveBeenCalled()
    })

    it("должен обрабатывать ошибки", async () => {
      const error = new Error("Dialog error")
      mockOpen.mockRejectedValue(error)
      const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importFiltersFile()
      })

      expect(console.error).toHaveBeenCalledWith("Ошибка при импорте фильтров:", error)
      expect(result.current.isImporting).toBe(false)
    })

    it("не должен запускать импорт если уже идет импорт", async () => {
      let resolveOpen: (value: string) => void
      const openPromise = new Promise<string>((resolve) => {
        resolveOpen = resolve
      })
      mockOpen.mockReturnValue(openPromise)

      const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

      // Начинаем первый импорт
      act(() => {
        void result.current.importFiltersFile()
      })

      expect(result.current.isImporting).toBe(true)

      // Пытаемся запустить второй импорт
      await act(async () => {
        await result.current.importFiltersFile()
      })

      // open должен быть вызван только один раз
      expect(mockOpen).toHaveBeenCalledTimes(1)

      // Завершаем первый импорт
      await act(async () => {
        resolveOpen!("/path/to/filters.json")
        await openPromise
      })
    })
  })

  describe("importFilterFile", () => {
    it("должен открывать диалог выбора файлов фильтров", async () => {
      mockOpen.mockResolvedValue(["/path/to/filter.cube"])
      const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importFilterFile()
      })

      expect(mockOpen).toHaveBeenCalledWith({
        multiple: true,
        filters: [
          {
            name: "Filter Files",
            extensions: ["cube", "3dl", "lut", "preset"],
          },
        ],
      })
    })

    it("должен обрабатывать множественный выбор файлов", async () => {
      const files = ["/path/to/filter1.cube", "/path/to/filter2.3dl"]
      mockOpen.mockResolvedValue(files)
      const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importFilterFile()
      })

      // Проверяем что addFilter был вызван для каждого файла
      expect(mockAddFilter).toHaveBeenCalledTimes(2)
    })

    it("должен обрабатывать одиночный файл как массив", async () => {
      const file = "/path/to/filter.cube"
      mockOpen.mockResolvedValue(file)
      const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importFilterFile()
      })

      // Проверяем что addFilter был вызван один раз
      expect(mockAddFilter).toHaveBeenCalledTimes(1)
    })

    it("должен устанавливать isImporting в true во время импорта", async () => {
      let resolveOpen: (value: string[]) => void
      const openPromise = new Promise<string[]>((resolve) => {
        resolveOpen = resolve
      })
      mockOpen.mockReturnValue(openPromise)

      const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

      // Начинаем импорт
      act(() => {
        void result.current.importFilterFile()
      })

      // Проверяем, что isImporting стал true
      expect(result.current.isImporting).toBe(true)

      // Завершаем импорт
      await act(async () => {
        resolveOpen!(["/path/to/filter.cube"])
        await openPromise
      })

      // Проверяем, что isImporting стал false
      await waitFor(() => {
        expect(result.current.isImporting).toBe(false)
      })
    })

    it("не должен делать ничего если файлы не выбраны", async () => {
      mockOpen.mockResolvedValue(null)
      const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importFilterFile()
      })

      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining("Импортировано"))
    })

    it("должен обрабатывать ошибки", async () => {
      const error = new Error("Dialog error")
      mockOpen.mockRejectedValue(error)
      const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importFilterFile()
      })

      expect(console.error).toHaveBeenCalledWith("Ошибка при импорте файлов фильтров:", error)
      expect(result.current.isImporting).toBe(false)
    })

    it("не должен запускать импорт если уже идет импорт", async () => {
      let resolveOpen: (value: string[]) => void
      const openPromise = new Promise<string[]>((resolve) => {
        resolveOpen = resolve
      })
      mockOpen.mockReturnValue(openPromise)

      const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

      // Начинаем первый импорт
      act(() => {
        void result.current.importFilterFile()
      })

      expect(result.current.isImporting).toBe(true)

      // Пытаемся запустить второй импорт
      await act(async () => {
        await result.current.importFilterFile()
      })

      // open должен быть вызван только один раз
      expect(mockOpen).toHaveBeenCalledTimes(1)

      // Завершаем первый импорт
      await act(async () => {
        resolveOpen!(["/path/to/filter.cube"])
        await openPromise
      })
    })
  })

  it("должен корректно обрабатывать параллельные вызовы разных методов импорта", async () => {
    let resolveFiltersOpen: (value: string) => void
    let resolveFilterOpen: (value: string[]) => void

    const filtersOpenPromise = new Promise<string>((resolve) => {
      resolveFiltersOpen = resolve
    })
    const filterOpenPromise = new Promise<string[]>((resolve) => {
      resolveFilterOpen = resolve
    })

    mockOpen.mockReturnValueOnce(filtersOpenPromise).mockReturnValueOnce(filterOpenPromise)

    const { result } = renderHook(() => useFiltersImport(), { wrapper: MediaProviders })

    // Начинаем импорт JSON файла
    act(() => {
      void result.current.importFiltersFile()
    })

    expect(result.current.isImporting).toBe(true)

    // Пытаемся запустить импорт файлов фильтров
    await act(async () => {
      await result.current.importFilterFile()
    })

    // Второй вызов не должен сработать
    expect(mockOpen).toHaveBeenCalledTimes(1)

    // Завершаем первый импорт
    await act(async () => {
      resolveFiltersOpen!("/path/to/filters.json")
      await filtersOpenPromise
    })

    expect(result.current.isImporting).toBe(false)
  })
})
