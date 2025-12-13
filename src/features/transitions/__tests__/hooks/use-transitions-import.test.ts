/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { logError } from "@/lib/tauri-logger"

import { useTransitionsImport } from "../../hooks/use-transitions-import"

// Mock platform service
const mockShowOpenDialog = vi.fn()
const mockReadTextFile = vi.fn()

const mockPlatform = {
  showOpenDialog: mockShowOpenDialog,
  showSaveDialog: vi.fn(),
  readTextFile: mockReadTextFile,
  writeTextFile: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  exists: vi.fn(),
  readClipboard: vi.fn(),
  writeClipboard: vi.fn(),
  showNotification: vi.fn(),
  openPath: vi.fn(),
  openUrl: vi.fn(),
  getVersion: vi.fn().mockResolvedValue("1.0.0"),
  convertFileSrc: vi.fn((path: string) => path),
}

vi.mock("@/core", () => ({
  container: {
    hasPlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => mockPlatform),
  },
}))

// Получаем мок функции
const mockOpen = mockShowOpenDialog
const mockLogError = vi.mocked(logError)

// Мокаем fetch
global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

describe("useTransitionsImport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("должен инициализироваться с правильными значениями по умолчанию", () => {
    const { result } = renderHook(() => useTransitionsImport())

    expect(result.current.isImporting).toBe(false)
    expect(result.current.progress).toBe(0)
    expect(typeof result.current.importTransitionsFile).toBe("function")
    expect(typeof result.current.importTransitionFile).toBe("function")
  })

  describe("importTransitionsFile", () => {
    it("должен открывать диалог выбора JSON файла", async () => {
      mockOpen.mockResolvedValue("/path/to/transitions.json")
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ transitions: [] }),
      } as Response)

      const { result } = renderHook(() => useTransitionsImport())

      await act(async () => {
        await result.current.importTransitionsFile()
      })

      expect(mockOpen).toHaveBeenCalledWith({
        multiple: false,
        filters: [
          {
            name: "Transitions JSON",
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

      const { result } = renderHook(() => useTransitionsImport())

      // Начинаем импорт
      act(() => {
        void result.current.importTransitionsFile()
      })

      // Проверяем, что isImporting стал true
      expect(result.current.isImporting).toBe(true)

      // Завершаем импорт
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ transitions: [] }),
      } as Response)

      await act(async () => {
        resolveOpen!("/path/to/transitions.json")
        await openPromise
      })

      // Проверяем, что isImporting стал false
      await waitFor(() => {
        expect(result.current.isImporting).toBe(false)
      })
    })

    it("должен обновлять прогресс во время импорта", async () => {
      mockOpen.mockResolvedValue("/path/to/transitions.json")
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            transitions: [
              {
                id: "test",
                type: "fade",
                labels: { ru: "Тест", en: "Test" },
                category: "basic",
                complexity: "basic",
                tags: ["test"],
              },
            ],
          }),
      } as Response)

      const { result } = renderHook(() => useTransitionsImport())

      await act(async () => {
        await result.current.importTransitionsFile()
      })

      // Прогресс должен быть 100% после завершения
      expect(result.current.progress).toBe(100)
    })

    it("должен импортировать валидные переходы из массива", async () => {
      const validTransitions = [
        {
          id: "fade",
          type: "fade",
          labels: { ru: "Затухание", en: "Fade" },
          category: "basic",
          complexity: "basic",
          tags: ["popular"],
        },
      ]

      mockOpen.mockResolvedValue("/path/to/transitions.json")
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(validTransitions),
      } as Response)

      const { result } = renderHook(() => useTransitionsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importTransitionsFile()
      })

      expect(importResult.success).toBe(true)
      expect(importResult.transitions).toHaveLength(1)
      expect(importResult.message).toBe("Успешно импортировано 1 переходов")
    })

    it("должен импортировать переходы из объекта с полем transitions", async () => {
      const transitionsData = {
        version: "1.0",
        transitions: [
          {
            id: "zoom",
            type: "zoom",
            labels: { ru: "Увеличение", en: "Zoom" },
            category: "creative",
            complexity: "intermediate",
            tags: ["dynamic"],
          },
        ],
      }

      mockOpen.mockResolvedValue("/path/to/transitions.json")
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(transitionsData),
      } as Response)

      const { result } = renderHook(() => useTransitionsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importTransitionsFile()
      })

      expect(importResult.success).toBe(true)
      expect(importResult.transitions).toHaveLength(1)
    })

    it("должен обрабатывать одиночный переход", async () => {
      const singleTransition = {
        id: "slide",
        type: "slide",
        labels: { ru: "Скольжение", en: "Slide" },
        category: "basic",
        complexity: "basic",
        tags: ["smooth"],
      }

      mockOpen.mockResolvedValue("/path/to/transition.json")
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(singleTransition),
      } as Response)

      const { result } = renderHook(() => useTransitionsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importTransitionsFile()
      })

      expect(importResult.success).toBe(true)
      expect(importResult.transitions).toHaveLength(1)
    })

    it("не должен делать ничего если файл не выбран", async () => {
      mockOpen.mockResolvedValue(null)
      const { result } = renderHook(() => useTransitionsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importTransitionsFile()
      })

      expect(importResult.success).toBe(false)
      expect(importResult.message).toBe("Файл не выбран")
      expect(importResult.transitions).toHaveLength(0)
    })

    it("должен отклонять невалидную структуру файла", async () => {
      mockOpen.mockResolvedValue("/path/to/invalid.json")
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ invalid: "data" }),
      } as Response)

      const { result } = renderHook(() => useTransitionsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importTransitionsFile()
      })

      expect(importResult.success).toBe(false)
      expect(importResult.message).toBe("Неверная структура файла переходов")
    })

    it("должен отклонять файл без валидных переходов", async () => {
      mockOpen.mockResolvedValue("/path/to/empty.json")
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ transitions: [] }),
      } as Response)

      const { result } = renderHook(() => useTransitionsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importTransitionsFile()
      })

      expect(importResult.success).toBe(false)
      expect(importResult.message).toBe("В файле не найдено валидных переходов")
    })

    it("должен обрабатывать ошибки", async () => {
      const error = new Error("Network error")
      mockOpen.mockResolvedValue("/path/to/transitions.json")
      mockFetch.mockRejectedValue(error)

      const { result } = renderHook(() => useTransitionsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importTransitionsFile()
      })

      expect(importResult.success).toBe(false)
      expect(importResult.message).toContain("Ошибка при импорте")
      expect(mockLogError).toHaveBeenCalledWith("Import failed: Network error")
      expect(result.current.isImporting).toBe(false)
    })

    it("не должен запускать импорт если уже идет импорт", async () => {
      let resolveOpen: (value: string) => void
      const openPromise = new Promise<string>((resolve) => {
        resolveOpen = resolve
      })
      mockOpen.mockReturnValue(openPromise)

      const { result } = renderHook(() => useTransitionsImport())

      // Начинаем первый импорт
      act(() => {
        void result.current.importTransitionsFile()
      })

      expect(result.current.isImporting).toBe(true)

      // Пытаемся запустить второй импорт
      let secondImportResult: any
      await act(async () => {
        secondImportResult = await result.current.importTransitionsFile()
      })

      expect(secondImportResult.success).toBe(false)
      expect(secondImportResult.message).toBe("Импорт уже выполняется")

      // Завершаем первый импорт
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ transitions: [] }),
      } as Response)

      await act(async () => {
        resolveOpen!("/path/to/transitions.json")
        await openPromise
      })
    })
  })

  describe("importTransitionFile", () => {
    it("должен открывать диалог выбора файлов переходов", async () => {
      mockOpen.mockResolvedValue(["/path/to/transition.preset"])
      const { result } = renderHook(() => useTransitionsImport())

      await act(async () => {
        await result.current.importTransitionFile()
      })

      expect(mockOpen).toHaveBeenCalledWith({
        multiple: true,
        filters: [
          {
            name: "Transition Files",
            extensions: ["json", "preset", "transition"],
          },
        ],
      })
    })

    it("должен обрабатывать множественный выбор файлов", async () => {
      const files = ["/path/to/transition1.preset", "/path/to/transition2.json"]
      mockOpen.mockResolvedValue(files)
      const { result } = renderHook(() => useTransitionsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importTransitionFile()
      })

      expect(importResult.success).toBe(true)
      expect(importResult.transitions).toHaveLength(2)
      expect(importResult.message).toBe("Успешно импортировано 2 файлов переходов")
    })

    it("должен обрабатывать одиночный файл как массив", async () => {
      const file = "/path/to/transition.preset"
      mockOpen.mockResolvedValue(file)
      const { result } = renderHook(() => useTransitionsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importTransitionFile()
      })

      expect(importResult.success).toBe(true)
      expect(importResult.transitions).toHaveLength(1)
    })

    it("должен создавать переходы с правильной структурой", async () => {
      const file = "/path/to/my-transition.preset"
      mockOpen.mockResolvedValue([file])
      const { result } = renderHook(() => useTransitionsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importTransitionFile()
      })

      const transition = importResult.transitions[0]
      expect(transition.id).toMatch(/^user-\d+-0$/)
      expect(transition.type).toBe("imported")
      expect(transition.labels.ru).toBe("my-transition")
      expect(transition.labels.en).toBe("my-transition")
      expect(transition.category).toBe("creative")
      expect(transition.complexity).toBe("intermediate")
      expect(transition.tags).toContain("fallback")
      expect(transition.parameters).toEqual({})
      expect(transition.ffmpegCommand).toBeDefined()
    })

    it("не должен делать ничего если файлы не выбраны", async () => {
      mockOpen.mockResolvedValue(null)
      const { result } = renderHook(() => useTransitionsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importTransitionFile()
      })

      expect(importResult.success).toBe(false)
      expect(importResult.message).toBe("Файлы не выбраны")
      expect(importResult.transitions).toHaveLength(0)
    })

    it("должен обрабатывать ошибки", async () => {
      const error = new Error("Dialog error")
      mockOpen.mockRejectedValue(error)
      const { result } = renderHook(() => useTransitionsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importTransitionFile()
      })

      expect(importResult.success).toBe(false)
      expect(importResult.message).toContain("Ошибка при импорте")
      expect(mockLogError).toHaveBeenCalledWith("Transition files import failed: Dialog error")
      expect(result.current.isImporting).toBe(false)
    })

    it("не должен запускать импорт если уже идет импорт", async () => {
      let resolveOpen: (value: string[]) => void
      const openPromise = new Promise<string[]>((resolve) => {
        resolveOpen = resolve
      })
      mockOpen.mockReturnValue(openPromise)

      const { result } = renderHook(() => useTransitionsImport())

      // Начинаем первый импорт
      act(() => {
        void result.current.importTransitionFile()
      })

      expect(result.current.isImporting).toBe(true)

      // Пытаемся запустить второй импорт
      let secondImportResult: any
      await act(async () => {
        secondImportResult = await result.current.importTransitionFile()
      })

      expect(secondImportResult.success).toBe(false)
      expect(secondImportResult.message).toBe("Импорт уже выполняется")

      // Завершаем первый импорт
      await act(async () => {
        resolveOpen!(["/path/to/transition.preset"])
        await openPromise
      })
    })
  })

  it("должен корректно обрабатывать параллельные вызовы разных методов импорта", async () => {
    let resolveTransitionsOpen: (value: string) => void
    let resolveTransitionOpen: (value: string[]) => void

    const transitionsOpenPromise = new Promise<string>((resolve) => {
      resolveTransitionsOpen = resolve
    })
    const transitionOpenPromise = new Promise<string[]>((resolve) => {
      resolveTransitionOpen = resolve
    })

    mockOpen.mockReturnValueOnce(transitionsOpenPromise).mockReturnValueOnce(transitionOpenPromise)

    const { result } = renderHook(() => useTransitionsImport())

    // Начинаем импорт JSON файла
    act(() => {
      void result.current.importTransitionsFile()
    })

    expect(result.current.isImporting).toBe(true)

    // Пытаемся запустить импорт файлов переходов
    let secondImportResult: any
    await act(async () => {
      secondImportResult = await result.current.importTransitionFile()
    })

    // Второй вызов не должен сработать
    expect(secondImportResult.success).toBe(false)
    expect(secondImportResult.message).toBe("Импорт уже выполняется")

    // Завершаем первый импорт
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ transitions: [] }),
    } as Response)

    await act(async () => {
      resolveTransitionsOpen!("/path/to/transitions.json")
      await transitionsOpenPromise
    })

    expect(result.current.isImporting).toBe(false)
  })
})
