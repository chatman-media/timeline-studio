/**
 * Тесты для useStyleTemplateExport
 */

import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { StyleTemplate } from "../../types"
import { useStyleTemplateExport } from "../../hooks/use-style-template-export"

// Mock Tauri logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe("useStyleTemplateExport", () => {
  const mockTemplate: StyleTemplate = {
    id: "test-template-1",
    name: { ru: "Тестовый шаблон", en: "Test Template" },
    category: "intro",
    style: "modern",
    aspectRatio: "16:9",
    duration: 3,
    hasText: true,
    hasAnimation: true,
    elements: [],
  }

  const mockTemplates: StyleTemplate[] = [
    mockTemplate,
    {
      id: "test-template-2",
      name: { ru: "Второй шаблон", en: "Second Template" },
      category: "outro",
      style: "vintage",
      aspectRatio: "16:9",
      duration: 5,
      hasText: false,
      hasAnimation: true,
      elements: [],
    },
  ]

  let mockCreateObjectURL: ReturnType<typeof vi.fn>
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>
  let mockAppendChild: ReturnType<typeof vi.fn>
  let mockRemoveChild: ReturnType<typeof vi.fn>
  let mockClick: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock URL.createObjectURL and URL.revokeObjectURL
    mockCreateObjectURL = vi.fn().mockReturnValue("blob:test-url")
    mockRevokeObjectURL = vi.fn()

    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL

    // Mock DOM methods
    mockAppendChild = vi.fn()
    mockRemoveChild = vi.fn()
    mockClick = vi.fn()

    // Mock document.createElement
    const mockLink = {
      href: "",
      download: "",
      click: mockClick,
    }

    vi.spyOn(document, "createElement").mockReturnValue(mockLink as any)
    vi.spyOn(document.body, "appendChild").mockImplementation(mockAppendChild)
    vi.spyOn(document.body, "removeChild").mockImplementation(mockRemoveChild)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("initial state", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderHook(() => useStyleTemplateExport())

      expect(result.current.isExporting).toBe(false)
      expect(result.current.exportError).toBe(null)
      expect(typeof result.current.exportTemplate).toBe("function")
      expect(typeof result.current.exportTemplates).toBe("function")
    })
  })

  describe("exportTemplate", () => {
    it("should export single template successfully", async () => {
      const { result } = renderHook(() => useStyleTemplateExport())

      await result.current.exportTemplate(mockTemplate)

      // Should create blob with correct JSON
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))

      // Should create download link
      expect(document.createElement).toHaveBeenCalledWith("a")

      // Should append and remove link
      expect(mockAppendChild).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
      expect(mockRemoveChild).toHaveBeenCalled()

      // Should revoke object URL
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url")

      // Should not be exporting after completion
      expect(result.current.isExporting).toBe(false)
      expect(result.current.exportError).toBe(null)
    })

    it("should set isExporting to true during export", async () => {
      const { result } = renderHook(() => useStyleTemplateExport())

      const exportPromise = result.current.exportTemplate(mockTemplate)

      // Should be exporting immediately
      await waitFor(() => {
        expect(result.current.isExporting).toBe(true)
      })

      await exportPromise

      // Should not be exporting after completion
      expect(result.current.isExporting).toBe(false)
    })

    it("should generate correct filename from English name", async () => {
      const { result } = renderHook(() => useStyleTemplateExport())

      await result.current.exportTemplate(mockTemplate)

      const mockLink = (document.createElement as any).mock.results[0].value
      expect(mockLink.download).toBe("test_template.json")
    })

    it("should generate correct filename from Russian name when no English name", async () => {
      const templateWithoutEnglishName = {
        ...mockTemplate,
        name: { ru: "Тестовый шаблон", en: "" },
      }

      const { result } = renderHook(() => useStyleTemplateExport())

      await result.current.exportTemplate(templateWithoutEnglishName)

      const mockLink = (document.createElement as any).mock.results[0].value
      // Should use id when no valid name
      expect(mockLink.download).toBe("test-template-1.json")
    })

    it("should generate filename from id when name is missing", async () => {
      const templateWithMissingNames = {
        ...mockTemplate,
        name: { ru: "", en: "" },
      }

      const { result } = renderHook(() => useStyleTemplateExport())

      await result.current.exportTemplate(templateWithMissingNames)

      const mockLink = (document.createElement as any).mock.results[0].value
      expect(mockLink.download).toBe("test-template-1.json")
    })

    it("should sanitize filename by replacing special characters", async () => {
      const templateWithSpecialChars = {
        ...mockTemplate,
        name: { ru: "Test/Template*Name", en: "Test/Template*Name" },
      }

      const { result } = renderHook(() => useStyleTemplateExport())

      await result.current.exportTemplate(templateWithSpecialChars)

      const mockLink = (document.createElement as any).mock.results[0].value
      expect(mockLink.download).toBe("test_template_name.json")
    })

    it("should create blob with formatted JSON", async () => {
      const { result } = renderHook(() => useStyleTemplateExport())

      await result.current.exportTemplate(mockTemplate)

      const blobCall = mockCreateObjectURL.mock.calls[0][0]
      expect(blobCall).toBeInstanceOf(Blob)
      expect(blobCall.type).toBe("application/json")

      // Read blob content
      const text = await blobCall.text()
      const parsed = JSON.parse(text)

      expect(parsed).toEqual(mockTemplate)
      expect(text).toContain("\n") // Should be formatted
    })

    it("should handle export error", async () => {
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error("Failed to create blob")
      })

      const { result } = renderHook(() => useStyleTemplateExport())

      await expect(result.current.exportTemplate(mockTemplate)).rejects.toThrow("Failed to create blob")

      expect(result.current.isExporting).toBe(false)
      expect(result.current.exportError).toBe("Failed to create blob")
    })

    it("should handle unknown error type", async () => {
      mockCreateObjectURL.mockImplementation(() => {
        throw "Unknown error"
      })

      const { result } = renderHook(() => useStyleTemplateExport())

      await expect(result.current.exportTemplate(mockTemplate)).rejects.toBe("Unknown error")

      expect(result.current.isExporting).toBe(false)
      expect(result.current.exportError).toBe("Неизвестная ошибка")
    })

    it("should reset error on new export", async () => {
      const { result } = renderHook(() => useStyleTemplateExport())

      // First export fails
      mockCreateObjectURL.mockImplementationOnce(() => {
        throw new Error("First error")
      })

      await expect(result.current.exportTemplate(mockTemplate)).rejects.toThrow()
      expect(result.current.exportError).toBe("First error")

      // Second export succeeds
      mockCreateObjectURL.mockReturnValue("blob:test-url")
      await result.current.exportTemplate(mockTemplate)

      expect(result.current.exportError).toBe(null)
    })
  })

  describe("exportTemplates", () => {
    it("should export multiple templates successfully", async () => {
      const { result } = renderHook(() => useStyleTemplateExport())

      await result.current.exportTemplates(mockTemplates)

      // Should create blob with correct JSON
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))

      // Should create download link
      expect(document.createElement).toHaveBeenCalledWith("a")

      // Should append and remove link
      expect(mockAppendChild).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
      expect(mockRemoveChild).toHaveBeenCalled()

      // Should revoke object URL
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url")

      // Should not be exporting after completion
      expect(result.current.isExporting).toBe(false)
      expect(result.current.exportError).toBe(null)
    })

    it("should set isExporting to true during export", async () => {
      const { result } = renderHook(() => useStyleTemplateExport())

      const exportPromise = result.current.exportTemplates(mockTemplates)

      // Should be exporting immediately
      await waitFor(() => {
        expect(result.current.isExporting).toBe(true)
      })

      await exportPromise

      // Should not be exporting after completion
      expect(result.current.isExporting).toBe(false)
    })

    it("should generate filename with current date", async () => {
      const { result } = renderHook(() => useStyleTemplateExport())

      const dateSpy = vi.spyOn(Date.prototype, "toISOString").mockReturnValue("2024-11-30T12:00:00.000Z")

      await result.current.exportTemplates(mockTemplates)

      const mockLink = (document.createElement as any).mock.results[0].value
      expect(mockLink.download).toBe("style_templates_2024-11-30.json")

      dateSpy.mockRestore()
    })

    it("should create blob with array of templates", async () => {
      const { result } = renderHook(() => useStyleTemplateExport())

      await result.current.exportTemplates(mockTemplates)

      const blobCall = mockCreateObjectURL.mock.calls[0][0]
      expect(blobCall).toBeInstanceOf(Blob)
      expect(blobCall.type).toBe("application/json")

      // Read blob content
      const text = await blobCall.text()
      const parsed = JSON.parse(text)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(2)
      expect(parsed).toEqual(mockTemplates)
      expect(text).toContain("\n") // Should be formatted
    })

    it("should handle export error", async () => {
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error("Failed to create blob")
      })

      const { result } = renderHook(() => useStyleTemplateExport())

      await expect(result.current.exportTemplates(mockTemplates)).rejects.toThrow("Failed to create blob")

      expect(result.current.isExporting).toBe(false)
      expect(result.current.exportError).toBe("Failed to create blob")
    })

    it("should handle unknown error type", async () => {
      mockCreateObjectURL.mockImplementation(() => {
        throw "Unknown error"
      })

      const { result } = renderHook(() => useStyleTemplateExport())

      await expect(result.current.exportTemplates(mockTemplates)).rejects.toBe("Unknown error")

      expect(result.current.isExporting).toBe(false)
      expect(result.current.exportError).toBe("Неизвестная ошибка")
    })

    it("should export empty array", async () => {
      const { result } = renderHook(() => useStyleTemplateExport())

      await result.current.exportTemplates([])

      const blobCall = mockCreateObjectURL.mock.calls[0][0]
      const text = await blobCall.text()
      const parsed = JSON.parse(text)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(0)
    })

    it("should reset error on new export", async () => {
      const { result } = renderHook(() => useStyleTemplateExport())

      // First export fails
      mockCreateObjectURL.mockImplementationOnce(() => {
        throw new Error("First error")
      })

      await expect(result.current.exportTemplates(mockTemplates)).rejects.toThrow()
      expect(result.current.exportError).toBe("First error")

      // Second export succeeds
      mockCreateObjectURL.mockReturnValue("blob:test-url")
      await result.current.exportTemplates(mockTemplates)

      expect(result.current.exportError).toBe(null)
    })
  })

  describe("function stability", () => {
    it("should maintain stable function references", () => {
      const { result, rerender } = renderHook(() => useStyleTemplateExport())

      const exportTemplate1 = result.current.exportTemplate
      const exportTemplates1 = result.current.exportTemplates

      rerender()

      expect(result.current.exportTemplate).toBe(exportTemplate1)
      expect(result.current.exportTemplates).toBe(exportTemplates1)
    })
  })
})
