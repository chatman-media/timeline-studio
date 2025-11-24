import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { TimelineStudioProject } from "@/features/project-settings/types/timeline-studio-project"

import { useProjectTemplate } from "../../hooks/use-project-template"
import { projectTemplateManager, templateApplier, templateValidator } from "../../services"
import type { ValidationResult } from "../../services/template-validator"
import type { ProjectTemplate } from "../../types/project-template"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

describe("useProjectTemplate", () => {
  let mockProject: TimelineStudioProject
  let mockTemplates: ProjectTemplate[]

  beforeEach(() => {
    vi.clearAllMocks()

    mockProject = {
      metadata: {
        id: "test-project",
        name: "Test Project",
        version: "1.0.0",
        created: new Date(),
        modified: new Date(),
      },
      settings: {
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
        aspectRatio: "16:9",
        audio: {
          sampleRate: 48000,
          bitDepth: 16,
          channels: 2,
          masterVolume: 1,
          panLaw: "-3dB",
        },
        preview: {
          resolution: "full",
          quality: "best",
          renderDuringPlayback: true,
          useGPU: true,
        },
      },
      sequences: [],
      mediaLibrary: {
        items: [],
        folders: [],
      },
      preferences: {
        autoSave: true,
        autoSaveInterval: 300,
        showTimecode: true,
      },
    } as unknown as TimelineStudioProject

    mockTemplates = [
      {
        id: "template-1",
        name: { en: "YouTube Video", ru: "YouTube видео" },
        category: "youtube",
        aspectRatio: "16:9",
        estimatedDuration: 600,
        settings: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          aspectRatio: "16:9",
        },
        structure: {
          tracks: [],
          sections: [],
        },
        placeholders: {},
      },
      {
        id: "template-2",
        name: { en: "Social Media Video", ru: "Соцсети видео" },
        category: "social",
        aspectRatio: "9:16",
        estimatedDuration: 60,
        settings: {
          resolution: { width: 1080, height: 1920 },
          frameRate: 30,
          aspectRatio: "9:16",
        },
        structure: {
          tracks: [],
          sections: [],
        },
        placeholders: {},
      },
    ] as unknown as ProjectTemplate[]

    vi.spyOn(projectTemplateManager, "getAllTemplates").mockReturnValue(mockTemplates)
  })

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useProjectTemplate())

      expect(result.current.templates).toHaveLength(2)
      expect(result.current.selectedTemplate).toBeNull()
      expect(result.current.validationResult).toBeNull()
      expect(result.current.isApplying).toBe(false)
      expect(result.current.isValidating).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe("template selection", () => {
    it("should select template and validate it", () => {
      vi.spyOn(projectTemplateManager, "getTemplateById").mockReturnValue(mockTemplates[0])
      vi.spyOn(templateValidator, "validate").mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
      })

      const { result } = renderHook(() => useProjectTemplate())

      act(() => {
        result.current.selectTemplate("template-1")
      })

      expect(result.current.selectedTemplate).toBeDefined()
      expect(result.current.selectedTemplate?.id).toBe("template-1")
      expect(result.current.validationResult?.valid).toBe(true)
      expect(templateValidator.validate).toHaveBeenCalled()
    })

    it("should clear selection", () => {
      vi.spyOn(projectTemplateManager, "getTemplateById").mockReturnValue(mockTemplates[0])
      vi.spyOn(templateValidator, "validate").mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
      })

      const { result } = renderHook(() => useProjectTemplate())

      act(() => {
        result.current.selectTemplate("template-1")
      })

      expect(result.current.selectedTemplate).toBeDefined()

      act(() => {
        result.current.clearSelection()
      })

      expect(result.current.selectedTemplate).toBeNull()
      expect(result.current.validationResult).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe("filtering and search", () => {
    it("should filter templates", () => {
      vi.spyOn(projectTemplateManager, "getFilteredTemplates").mockReturnValue([mockTemplates[0]])
      vi.spyOn(projectTemplateManager, "sortTemplates").mockReturnValue([mockTemplates[0]])

      const { result } = renderHook(() => useProjectTemplate())

      act(() => {
        result.current.filterTemplates({ category: "youtube" })
      })

      expect(projectTemplateManager.getFilteredTemplates).toHaveBeenCalledWith({ category: "youtube" })
    })

    it("should search templates", () => {
      vi.spyOn(projectTemplateManager, "searchTemplates").mockReturnValue([mockTemplates[0]])
      vi.spyOn(projectTemplateManager, "sortTemplates").mockReturnValue([mockTemplates[0]])

      const { result } = renderHook(() => useProjectTemplate())

      act(() => {
        result.current.searchTemplates("youtube")
      })

      expect(projectTemplateManager.searchTemplates).toHaveBeenCalledWith("youtube")
    })

    it("should sort templates", () => {
      vi.spyOn(projectTemplateManager, "sortTemplates").mockReturnValue(mockTemplates)

      const { result } = renderHook(() => useProjectTemplate())

      act(() => {
        result.current.sortTemplates("name", "desc")
      })

      expect(projectTemplateManager.sortTemplates).toHaveBeenCalled()
    })

    it("should reset filters", () => {
      vi.spyOn(projectTemplateManager, "sortTemplates").mockReturnValue(mockTemplates)

      const { result } = renderHook(() => useProjectTemplate())

      act(() => {
        result.current.filterTemplates({ category: "youtube" })
      })

      act(() => {
        result.current.resetFilters()
      })

      expect(projectTemplateManager.getAllTemplates).toHaveBeenCalled()
    })
  })

  describe("validation", () => {
    it("should validate template", () => {
      vi.spyOn(templateValidator, "validate").mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
      })

      const { result } = renderHook(() => useProjectTemplate())

      let validationResult: ValidationResult | null = null
      act(() => {
        validationResult = result.current.validateTemplate(mockTemplates[0])
      })

      expect(validationResult?.valid).toBe(true)
      expect(result.current.validationResult?.valid).toBe(true)
    })
  })

  describe("apply template", () => {
    it("should throw error if no template selected", async () => {
      const { result } = renderHook(() => useProjectTemplate())

      await expect(result.current.applyTemplate(mockProject)).rejects.toThrow("No template selected")
    })

    it("should apply template successfully", async () => {
      const mockSequence = { id: "seq-1", name: "Test Sequence" } as any

      vi.spyOn(projectTemplateManager, "getTemplateById").mockReturnValue(mockTemplates[0])
      vi.spyOn(templateValidator, "validate").mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
      })
      vi.spyOn(templateApplier, "applyTemplate").mockResolvedValue(mockSequence)

      const { result } = renderHook(() => useProjectTemplate())

      act(() => {
        result.current.selectTemplate("template-1")
      })

      let sequence: any = null
      await act(async () => {
        sequence = await result.current.applyTemplate(mockProject)
      })

      expect(sequence).toBeDefined()
      expect(templateApplier.applyTemplate).toHaveBeenCalled()
    })

    it("should handle apply template error", async () => {
      vi.spyOn(projectTemplateManager, "getTemplateById").mockReturnValue(mockTemplates[0])
      vi.spyOn(templateValidator, "validate").mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
      })
      vi.spyOn(templateApplier, "applyTemplate").mockRejectedValue(new Error("Apply failed"))

      const { result } = renderHook(() => useProjectTemplate())

      act(() => {
        result.current.selectTemplate("template-1")
      })

      await expect(
        act(async () => {
          await result.current.applyTemplate(mockProject)
        }),
      ).rejects.toThrow("Apply failed")

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })
    })

    it("should not apply invalid template", async () => {
      vi.spyOn(projectTemplateManager, "getTemplateById").mockReturnValue(mockTemplates[0])
      vi.spyOn(templateValidator, "validate").mockReturnValue({
        valid: false,
        errors: [{ field: "settings", message: "Invalid settings", severity: "error" as const }],
        warnings: [],
      })

      const { result } = renderHook(() => useProjectTemplate())

      act(() => {
        result.current.selectTemplate("template-1")
      })

      await expect(
        act(async () => {
          await result.current.applyTemplate(mockProject)
        }),
      ).rejects.toThrow("Template validation failed")
    })
  })

  describe("custom templates", () => {
    it("should add custom template", () => {
      vi.spyOn(templateValidator, "validate").mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
      })
      vi.spyOn(projectTemplateManager, "addCustomTemplate").mockImplementation(() => {})

      const { result } = renderHook(() => useProjectTemplate())

      const customTemplate: ProjectTemplate = {
        ...mockTemplates[0],
        id: "custom-1",
      }

      act(() => {
        result.current.addCustomTemplate(customTemplate)
      })

      expect(projectTemplateManager.addCustomTemplate).toHaveBeenCalledWith(customTemplate)
    })

    it("should not add invalid custom template", () => {
      vi.spyOn(templateValidator, "validate").mockReturnValue({
        valid: false,
        errors: [{ field: "settings", message: "Invalid settings", severity: "error" as const }],
        warnings: [],
      })

      const { result } = renderHook(() => useProjectTemplate())

      const customTemplate: ProjectTemplate = {
        ...mockTemplates[0],
        id: "custom-1",
      }

      expect(() => {
        act(() => {
          result.current.addCustomTemplate(customTemplate)
        })
      }).toThrow("Invalid template")
    })

    it("should delete custom template", () => {
      vi.spyOn(projectTemplateManager, "deleteCustomTemplate").mockImplementation(() => {})

      const { result } = renderHook(() => useProjectTemplate())

      act(() => {
        result.current.deleteCustomTemplate("custom-1")
      })

      expect(projectTemplateManager.deleteCustomTemplate).toHaveBeenCalledWith("custom-1")
    })

    it("should clear selection when deleting selected template", () => {
      vi.spyOn(projectTemplateManager, "getTemplateById").mockReturnValue(mockTemplates[0])
      vi.spyOn(templateValidator, "validate").mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
      })
      vi.spyOn(projectTemplateManager, "deleteCustomTemplate").mockImplementation(() => {})

      const { result } = renderHook(() => useProjectTemplate())

      act(() => {
        result.current.selectTemplate("template-1")
      })

      expect(result.current.selectedTemplate?.id).toBe("template-1")

      act(() => {
        result.current.deleteCustomTemplate("template-1")
      })

      expect(result.current.selectedTemplate).toBeNull()
    })
  })

  describe("utilities", () => {
    it("should get template by id", () => {
      vi.spyOn(projectTemplateManager, "getTemplateById").mockReturnValue(mockTemplates[0])

      const { result } = renderHook(() => useProjectTemplate())

      const template = result.current.getTemplateById("template-1")

      expect(template).toBeDefined()
      expect(template?.id).toBe("template-1")
    })

    it("should preview template", () => {
      const mockPreview = {
        duration: 0,
        trackCount: 0,
        sectionCount: 0,
        markers: [],
        tracks: [],
      }
      vi.spyOn(templateApplier, "previewTemplate").mockReturnValue(mockPreview)

      const { result } = renderHook(() => useProjectTemplate())

      const preview = result.current.previewTemplate(mockTemplates[0])

      expect(preview).toBeDefined()
      expect(templateApplier.previewTemplate).toHaveBeenCalledWith(mockTemplates[0])
    })

    it("should export template", () => {
      vi.spyOn(projectTemplateManager, "exportTemplate").mockReturnValue('{"id":"template-1"}')

      const { result } = renderHook(() => useProjectTemplate())

      const json = result.current.exportTemplate("template-1")

      expect(json).toBeDefined()
      expect(projectTemplateManager.exportTemplate).toHaveBeenCalledWith("template-1")
    })

    it("should import template", () => {
      vi.spyOn(projectTemplateManager, "importTemplate").mockReturnValue(mockTemplates[0])

      const { result } = renderHook(() => useProjectTemplate())

      const template = result.current.importTemplate('{"id":"template-1"}')

      expect(template).toBeDefined()
      expect(template.id).toBe("template-1")
      expect(projectTemplateManager.importTemplate).toHaveBeenCalledWith('{"id":"template-1"}')
    })
  })
})
