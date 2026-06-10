/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useTemplatesImport } from "../../hooks/use-templates-import"

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

vi.mock("@timeline-studio/core", () => ({
  container: {
    hasPlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => mockPlatform),
  },
}))

describe("useTemplatesImport", () => {
  const mockOpen = mockShowOpenDialog

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should import templates import hook without errors", async () => {
    const { result } = renderHook(() => useTemplatesImport())

    // Проверяем, что хук возвращает необходимые функции
    expect(result.current).toHaveProperty("importTemplatesFile")
    expect(result.current).toHaveProperty("importTemplateFile")
    expect(result.current).toHaveProperty("isImporting")

    expect(typeof result.current.importTemplatesFile).toBe("function")
    expect(typeof result.current.importTemplateFile).toBe("function")
    expect(typeof result.current.isImporting).toBe("boolean")
  })

  it("should handle template file import", async () => {
    const mockFiles = ["/path/to/template1.json", "/path/to/template2.json"]
    mockOpen.mockResolvedValue(mockFiles)

    const { result } = renderHook(() => useTemplatesImport())

    await act(async () => {
      await result.current.importTemplateFile()
    })

    // Проверяем, что функция была вызвана
    expect(mockOpen).toHaveBeenCalledWith({
      multiple: true,
      filters: [
        {
          name: "Template Files",
          extensions: ["json"],
        },
      ],
    })
  })

  it("should handle templates file import", async () => {
    const mockFile = "/path/to/templates.json"
    mockOpen.mockResolvedValue(mockFile)

    const { result } = renderHook(() => useTemplatesImport())

    await act(async () => {
      await result.current.importTemplatesFile()
    })

    // Проверяем, что функция была вызвана
    expect(mockOpen).toHaveBeenCalledWith({
      multiple: false,
      filters: [
        {
          name: "Templates JSON",
          extensions: ["json"],
        },
      ],
    })
  })

  it("should handle import errors", async () => {
    const mockError = new Error("Failed to import template")
    mockOpen.mockRejectedValue(mockError)

    const { result } = renderHook(() => useTemplatesImport())

    await act(async () => {
      await result.current.importTemplateFile()
    })

    // Ошибка должна быть обработана без выброса исключения
    expect(result.current.isImporting).toBe(false)
  })

  it("should handle cancelled file selection", async () => {
    mockOpen.mockResolvedValue(null)

    const { result } = renderHook(() => useTemplatesImport())

    await act(async () => {
      await result.current.importTemplateFile()
    })

    // Проверяем, что состояние корректно обновилось
    expect(result.current.isImporting).toBe(false)
  })

  it("should track importing state", async () => {
    let resolveImport: (value: any) => void
    const importPromise = new Promise((resolve) => {
      resolveImport = resolve
    })

    mockOpen.mockReturnValue(importPromise)

    const { result } = renderHook(() => useTemplatesImport())

    // Проверяем начальное состояние
    expect(result.current.isImporting).toBe(false)

    // Начинаем импорт
    act(() => {
      void result.current.importTemplateFile()
    })

    // Проверяем состояние во время импорта
    expect(result.current.isImporting).toBe(true)

    // Завершаем импорт
    await act(async () => {
      resolveImport!(["/path/to/template.json"])
      await importPromise
    })

    // Проверяем состояние после импорта
    expect(result.current.isImporting).toBe(false)
  })

  it("should handle multiple file import", async () => {
    const mockFiles = ["/path/to/template1.json", "/path/to/template2.json"]

    mockOpen.mockResolvedValue(mockFiles)

    const { result } = renderHook(() => useTemplatesImport())

    await act(async () => {
      await result.current.importTemplateFile()
    })

    // Проверяем, что функция была вызвана
    expect(mockOpen).toHaveBeenCalledWith({
      multiple: true,
      filters: [
        {
          name: "Template Files",
          extensions: ["json"],
        },
      ],
    })
  })

  it("should handle concurrent imports", async () => {
    const mockFile = "/path/to/template.json"
    mockOpen.mockResolvedValue([mockFile])

    const { result } = renderHook(() => useTemplatesImport())

    // Запускаем несколько импортов одновременно
    await act(async () => {
      const promises = [
        result.current.importTemplateFile(),
        result.current.importTemplateFile(),
        result.current.importTemplatesFile(),
      ]
      await Promise.all(promises)
    })

    // Проверяем, что функции были вызваны
    expect(mockOpen).toHaveBeenCalledTimes(3)
  })
})
