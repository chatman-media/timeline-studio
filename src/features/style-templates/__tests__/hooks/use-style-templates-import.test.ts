import { open } from "@tauri-apps/plugin-dialog"
import { readTextFile } from "@tauri-apps/plugin-fs"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { logError } from "@/lib/tauri-logger"
import { MediaProviders } from "@/test/test-utils"

import { useStyleTemplatesImport } from "../../hooks/use-style-templates-import"

// Мокаем Tauri dialog API
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}))

// Мокаем Tauri fs API
vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
}))

// Создаем мок функции для addStyleTemplate
const mockAddStyleTemplate = vi.fn()

// Мокаем useResources для возврата mockAddStyleTemplate
vi.mock("@/features/resources", async () => {
  const React = await import("react")
  return {
    ResourcesProvider: ({ children }: { children: React.ReactNode }) => children,
    useResources: () => ({
      addStyleTemplate: mockAddStyleTemplate,
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
const mockLogError = vi.mocked(logError)

describe("useStyleTemplatesImport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("должен инициализироваться с правильными значениями по умолчанию", () => {
    const { result } = renderHook(() => useStyleTemplatesImport(), { wrapper: MediaProviders })

    expect(result.current.isImporting).toBe(false)
    expect(typeof result.current.importStyleTemplatesFile).toBe("function")
    expect(typeof result.current.importStyleTemplateFile).toBe("function")
  })

  describe("importStyleTemplatesFile", () => {
    it("должен открывать диалог выбора JSON файла", async () => {
      mockOpen.mockResolvedValue("/path/to/templates.json")
      const { result } = renderHook(() => useStyleTemplatesImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importStyleTemplatesFile()
      })

      expect(mockOpen).toHaveBeenCalledWith({
        multiple: false,
        filters: [
          {
            name: "Style Templates JSON",
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

      const { result } = renderHook(() => useStyleTemplatesImport(), { wrapper: MediaProviders })

      // Начинаем импорт
      act(() => {
        void result.current.importStyleTemplatesFile()
      })

      // Проверяем, что isImporting стал true
      expect(result.current.isImporting).toBe(true)

      // Завершаем импорт
      await act(async () => {
        resolveOpen!("/path/to/templates.json")
        await openPromise
      })

      // Проверяем, что isImporting стал false
      expect(result.current.isImporting).toBe(false)
    })

    it("не должен делать ничего если файл не выбран", async () => {
      mockOpen.mockResolvedValue(null)
      const { result } = renderHook(() => useStyleTemplatesImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importStyleTemplatesFile()
      })

      // Проверяем что addStyleTemplate не был вызван
      expect(mockAddStyleTemplate).not.toHaveBeenCalled()
    })

    it("должен логировать выбранный файл", async () => {
      const filePath = "/path/to/templates.json"
      mockOpen.mockResolvedValue(filePath)
      // Мокаем JSON файл с корректными шаблонами
      const mockTemplates = [
        {
          id: "template1",
          name: { ru: "Шаблон 1", en: "Template 1" },
          category: "intro",
          style: "modern",
          aspectRatio: "16:9",
          duration: 5000,
          elements: [],
        },
      ]
      mockReadTextFile.mockResolvedValue(JSON.stringify(mockTemplates))
      const { result } = renderHook(() => useStyleTemplatesImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importStyleTemplatesFile()
      })

      // Проверяем что addStyleTemplate был вызван для каждого шаблона
      expect(mockAddStyleTemplate).toHaveBeenCalledTimes(1)
      expect(mockAddStyleTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "template1",
          category: "intro",
        }),
      )
    })

    it("должен обрабатывать ошибки", async () => {
      const error = new Error("Dialog error")
      mockOpen.mockRejectedValue(error)
      const { result } = renderHook(() => useStyleTemplatesImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importStyleTemplatesFile()
      })

      expect(mockLogError).toHaveBeenCalledWith("useStyleTemplatesImport", "Import failed: Dialog error")
      expect(result.current.isImporting).toBe(false)
    })

    it("не должен запускать импорт если уже идет импорт", async () => {
      let resolveOpen: (value: string) => void
      const openPromise = new Promise<string>((resolve) => {
        resolveOpen = resolve
      })
      mockOpen.mockReturnValue(openPromise)

      const { result } = renderHook(() => useStyleTemplatesImport(), { wrapper: MediaProviders })

      // Начинаем первый импорт
      act(() => {
        void result.current.importStyleTemplatesFile()
      })

      expect(result.current.isImporting).toBe(true)

      // Пытаемся запустить второй импорт
      await act(async () => {
        await result.current.importStyleTemplatesFile()
      })

      // Второй вызов не должен сработать (функция должна выйти рано)
      expect(mockOpen).toHaveBeenCalledTimes(1)

      // Завершаем первый импорт
      await act(async () => {
        resolveOpen!("/path/to/templates.json")
        await openPromise
      })
    })
  })

  describe("importStyleTemplateFile", () => {
    it("должен открывать диалог выбора файлов шаблонов", async () => {
      mockOpen.mockResolvedValue(["/path/to/template.json"])
      const { result } = renderHook(() => useStyleTemplatesImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importStyleTemplateFile()
      })

      expect(mockOpen).toHaveBeenCalledWith({
        multiple: true,
        filters: [
          {
            name: "Style Template Files",
            extensions: ["json"],
          },
        ],
      })
    })

    it("должен обрабатывать множественный выбор файлов", async () => {
      const files = ["/path/to/template1.json", "/path/to/template2.json"]
      mockOpen.mockResolvedValue(files)
      // Мокаем содержимое файлов
      const mockTemplate = {
        id: "template1",
        name: { ru: "Шаблон 1", en: "Template 1" },
        category: "intro",
        style: "modern",
        aspectRatio: "16:9",
        duration: 5000,
        elements: [],
      }
      mockReadTextFile.mockResolvedValue(JSON.stringify(mockTemplate))
      const { result } = renderHook(() => useStyleTemplatesImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importStyleTemplateFile()
      })

      // Проверяем что addStyleTemplate был вызван для каждого файла
      expect(mockAddStyleTemplate).toHaveBeenCalledTimes(2)
    })

    it("должен обрабатывать одиночный файл как массив", async () => {
      const file = "/path/to/template.json"
      mockOpen.mockResolvedValue(file)
      // Мокаем содержимое файла
      const mockTemplate = {
        id: "template1",
        name: { ru: "Шаблон 1", en: "Template 1" },
        category: "intro",
        style: "modern",
        aspectRatio: "16:9",
        duration: 5000,
        elements: [],
      }
      mockReadTextFile.mockResolvedValue(JSON.stringify(mockTemplate))
      const { result } = renderHook(() => useStyleTemplatesImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importStyleTemplateFile()
      })

      // Проверяем что addStyleTemplate был вызван один раз
      expect(mockAddStyleTemplate).toHaveBeenCalledTimes(1)
    })

    it("не должен делать ничего если файлы не выбраны", async () => {
      mockOpen.mockResolvedValue(null)
      const { result } = renderHook(() => useStyleTemplatesImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importStyleTemplateFile()
      })

      // Проверяем что addStyleTemplate не был вызван
      expect(mockAddStyleTemplate).not.toHaveBeenCalled()
    })

    it("должен обрабатывать ошибки", async () => {
      const error = new Error("Dialog error")
      mockOpen.mockRejectedValue(error)
      const { result } = renderHook(() => useStyleTemplatesImport(), { wrapper: MediaProviders })

      await act(async () => {
        await result.current.importStyleTemplateFile()
      })

      expect(mockLogError).toHaveBeenCalledWith(
        "useStyleTemplatesImport",
        "Failed to import style template files: Dialog error",
      )
      expect(result.current.isImporting).toBe(false)
    })

    it("не должен запускать импорт если уже идет импорт", async () => {
      let resolveOpen: (value: string[]) => void
      const openPromise = new Promise<string[]>((resolve) => {
        resolveOpen = resolve
      })
      mockOpen.mockReturnValue(openPromise)

      const { result } = renderHook(() => useStyleTemplatesImport(), { wrapper: MediaProviders })

      // Начинаем первый импорт
      act(() => {
        void result.current.importStyleTemplateFile()
      })

      expect(result.current.isImporting).toBe(true)

      // Пытаемся запустить второй импорт
      await act(async () => {
        await result.current.importStyleTemplateFile()
      })

      // Второй вызов не должен сработать
      expect(mockOpen).toHaveBeenCalledTimes(1)

      // Завершаем первый импорт
      await act(async () => {
        resolveOpen!(["/path/to/template.json"])
        await openPromise
      })
    })
  })

  it("должен корректно обрабатывать параллельные вызовы разных методов импорта", async () => {
    let resolveTemplatesOpen: (value: string) => void
    let resolveTemplateOpen: (value: string[]) => void

    const templatesOpenPromise = new Promise<string>((resolve) => {
      resolveTemplatesOpen = resolve
    })
    const templateOpenPromise = new Promise<string[]>((resolve) => {
      resolveTemplateOpen = resolve
    })

    mockOpen.mockReturnValueOnce(templatesOpenPromise).mockReturnValueOnce(templateOpenPromise)

    const { result } = renderHook(() => useStyleTemplatesImport(), { wrapper: MediaProviders })

    // Начинаем импорт JSON файла
    act(() => {
      void result.current.importStyleTemplatesFile()
    })

    expect(result.current.isImporting).toBe(true)

    // Пытаемся запустить импорт файлов шаблонов
    await act(async () => {
      await result.current.importStyleTemplateFile()
    })

    // Второй вызов не должен сработать
    expect(mockOpen).toHaveBeenCalledTimes(1)

    // Завершаем первый импорт
    await act(async () => {
      resolveTemplatesOpen!("/path/to/templates.json")
      await templatesOpenPromise
    })

    expect(result.current.isImporting).toBe(false)
  })
})
