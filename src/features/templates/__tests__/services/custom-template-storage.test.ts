import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { MediaTemplateConfig } from "../../lib/template-config"
import {
  clearCustomTemplates,
  deleteCustomTemplate,
  exportCustomTemplate,
  getCustomTemplate,
  getCustomTemplates,
  importCustomTemplate,
  saveCustomTemplate,
  updateCustomTemplate,
} from "../../services/custom-template-storage"

describe("CustomTemplateStorage", () => {
  const mockTemplate: MediaTemplateConfig = {
    id: "test-template",
    split: "vertical",
    screens: 2,
    resizable: true,
    splitPosition: 50,
  }

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    // Clean up after each test
    clearCustomTemplates()
  })

  describe("saveCustomTemplate", () => {
    it("saves a custom template with correct properties", () => {
      const saved = saveCustomTemplate(mockTemplate, "My Custom Template")

      expect(saved).toBeDefined()
      expect(saved.customName).toBe("My Custom Template")
      expect(saved.id).toMatch(/^custom-my-custom-template-\d+$/)
      expect(saved.createdAt).toBeDefined()
      expect(saved.updatedAt).toBeDefined()
    })

    it("saves template to localStorage", () => {
      saveCustomTemplate(mockTemplate, "Test Template")

      const stored = localStorage.getItem("timeline-studio-custom-templates")
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(1)
    })

    it("can save multiple templates", () => {
      saveCustomTemplate(mockTemplate, "Template 1")
      saveCustomTemplate(mockTemplate, "Template 2")
      saveCustomTemplate(mockTemplate, "Template 3")

      const templates = getCustomTemplates()
      expect(templates).toHaveLength(3)
    })
  })

  describe("getCustomTemplates", () => {
    it("returns empty array when no templates exist", () => {
      const templates = getCustomTemplates()
      expect(templates).toEqual([])
    })

    it("returns all saved templates", () => {
      saveCustomTemplate(mockTemplate, "Template 1")
      saveCustomTemplate(mockTemplate, "Template 2")

      const templates = getCustomTemplates()
      expect(templates).toHaveLength(2)
      expect(templates[0].customName).toBeDefined()
      expect(templates[1].customName).toBeDefined()
    })

    it("returns templates sorted by updatedAt (newest first)", async () => {
      const first = saveCustomTemplate(mockTemplate, "First")
      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10))
      const second = saveCustomTemplate(mockTemplate, "Second")

      const templates = getCustomTemplates()
      expect(templates[0].id).toBe(second.id)
      expect(templates[1].id).toBe(first.id)
    })
  })

  describe("getCustomTemplate", () => {
    it("returns undefined for non-existent template", () => {
      const template = getCustomTemplate("non-existent-id")
      expect(template).toBeUndefined()
    })

    it("returns the correct template by id", () => {
      const saved = saveCustomTemplate(mockTemplate, "Find Me")
      const found = getCustomTemplate(saved.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(saved.id)
      expect(found?.customName).toBe("Find Me")
    })
  })

  describe("updateCustomTemplate", () => {
    it("returns null for non-existent template", () => {
      const result = updateCustomTemplate("non-existent-id", { screens: 3 })
      expect(result).toBeNull()
    })

    it("updates existing template", () => {
      const saved = saveCustomTemplate(mockTemplate, "Update Me")
      const originalUpdatedAt = saved.updatedAt

      const updated = updateCustomTemplate(saved.id, {
        screens: 4,
        splitPosition: 60,
      })

      expect(updated).toBeDefined()
      expect(updated?.screens).toBe(4)
      expect(updated?.splitPosition).toBe(60)
      expect(updated?.id).toBe(saved.id) // ID should remain the same
      expect(updated!.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
    })

    it("persists updates to localStorage", () => {
      const saved = saveCustomTemplate(mockTemplate, "Persist Updates")
      updateCustomTemplate(saved.id, { screens: 5 })

      const templates = getCustomTemplates()
      const updated = templates.find((t) => t.id === saved.id)

      expect(updated?.screens).toBe(5)
    })
  })

  describe("deleteCustomTemplate", () => {
    it("returns false for non-existent template", () => {
      const result = deleteCustomTemplate("non-existent-id")
      expect(result).toBe(false)
    })

    it("deletes existing template", () => {
      const saved = saveCustomTemplate(mockTemplate, "Delete Me")
      const result = deleteCustomTemplate(saved.id)

      expect(result).toBe(true)

      const templates = getCustomTemplates()
      expect(templates).toHaveLength(0)
    })

    it("only deletes specified template", () => {
      const template1 = saveCustomTemplate(mockTemplate, "Keep Me")
      const template2 = saveCustomTemplate(mockTemplate, "Delete Me")

      deleteCustomTemplate(template2.id)

      const templates = getCustomTemplates()
      expect(templates).toHaveLength(1)
      expect(templates[0].id).toBe(template1.id)
    })
  })

  describe("exportCustomTemplate", () => {
    it("returns null for non-existent template", () => {
      const result = exportCustomTemplate("non-existent-id")
      expect(result).toBeNull()
    })

    it("exports template as JSON string", () => {
      const saved = saveCustomTemplate(mockTemplate, "Export Me")
      const exported = exportCustomTemplate(saved.id)

      expect(exported).toBeTruthy()
      expect(typeof exported).toBe("string")

      const parsed = JSON.parse(exported!)
      expect(parsed.id).toBe(saved.id)
      expect(parsed.customName).toBe("Export Me")
    })

    it("exported JSON can be parsed", () => {
      const saved = saveCustomTemplate(mockTemplate, "Exportable")
      const exported = exportCustomTemplate(saved.id)

      expect(() => JSON.parse(exported!)).not.toThrow()
    })
  })

  describe("importCustomTemplate", () => {
    it("returns null for invalid JSON", () => {
      const result = importCustomTemplate("invalid json")
      expect(result).toBeNull()
    })

    it("returns null for template without required fields", () => {
      const invalidTemplate = JSON.stringify({ id: "test" })
      const result = importCustomTemplate(invalidTemplate)
      expect(result).toBeNull()
    })

    it("imports valid template", () => {
      const saved = saveCustomTemplate(mockTemplate, "Original")
      const exported = exportCustomTemplate(saved.id)!

      // Clear and import
      clearCustomTemplates()
      const imported = importCustomTemplate(exported)

      expect(imported).toBeDefined()
      expect(imported?.screens).toBe(mockTemplate.screens)
      expect(imported?.split).toBe(mockTemplate.split)
    })

    it("generates new ID for imported template", () => {
      const saved = saveCustomTemplate(mockTemplate, "Original")
      const exported = exportCustomTemplate(saved.id)!

      const imported = importCustomTemplate(exported)

      expect(imported?.id).not.toBe(saved.id)
      expect(imported?.id).toMatch(/^custom-imported-\d+$/)
    })

    it("adds imported template to storage", () => {
      const saved = saveCustomTemplate(mockTemplate, "Original")
      const exported = exportCustomTemplate(saved.id)!

      importCustomTemplate(exported)

      const templates = getCustomTemplates()
      expect(templates).toHaveLength(2) // Original + Imported
    })
  })

  describe("clearCustomTemplates", () => {
    it("removes all templates from storage", () => {
      saveCustomTemplate(mockTemplate, "Template 1")
      saveCustomTemplate(mockTemplate, "Template 2")
      saveCustomTemplate(mockTemplate, "Template 3")

      expect(getCustomTemplates()).toHaveLength(3)

      clearCustomTemplates()

      expect(getCustomTemplates()).toHaveLength(0)
      expect(localStorage.getItem("timeline-studio-custom-templates")).toBeNull()
    })
  })
})
