import { beforeEach, describe, expect, it } from "vitest"

import { projectTemplateManager } from "../../services/project-template-manager"
import type { ProjectTemplate } from "../../types/project-template"

describe("ProjectTemplateManager", () => {
  beforeEach(() => {
    // Reset state before each test by clearing the Map
    const customTemplatesMap = projectTemplateManager["customTemplates"] as Map<string, any>
    customTemplatesMap.clear()
  })

  describe("getAllTemplates", () => {
    it("should return all templates including built-in and custom", () => {
      const templates = projectTemplateManager.getAllTemplates()
      expect(templates).toBeDefined()
      expect(Array.isArray(templates)).toBe(true)
      expect(templates.length).toBeGreaterThan(0)
    })
  })

  describe("getTemplateById", () => {
    it("should return template by id", () => {
      const templates = projectTemplateManager.getAllTemplates()
      const firstTemplate = templates[0]

      const found = projectTemplateManager.getTemplateById(firstTemplate.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(firstTemplate.id)
    })

    it("should return undefined for non-existent id", () => {
      const found = projectTemplateManager.getTemplateById("non-existent-id")
      expect(found).toBeUndefined()
    })
  })

  describe("getFilteredTemplates", () => {
    it("should filter templates by category", () => {
      const category = "youtube"
      const filtered = projectTemplateManager.getFilteredTemplates({ category })

      expect(Array.isArray(filtered)).toBe(true)
      filtered.forEach((template) => {
        expect(template.category).toBe(category)
      })
    })

    it("should filter templates by aspect ratio", () => {
      const aspectRatio = "16:9"
      const filtered = projectTemplateManager.getFilteredTemplates({ aspectRatio })

      expect(Array.isArray(filtered)).toBe(true)
      filtered.forEach((template) => {
        expect(template.settings.aspectRatio).toBe(aspectRatio)
      })
    })
  })

  describe("searchTemplates", () => {
    it("should search templates by query", () => {
      const query = "youtube"
      const results = projectTemplateManager.searchTemplates(query)

      expect(Array.isArray(results)).toBe(true)
      results.forEach((template) => {
        const searchableText = [template.name.en, template.name.ru, template.description?.en, template.description?.ru]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        expect(searchableText).toContain(query.toLowerCase())
      })
    })

    it("should return empty array for non-matching query", () => {
      const results = projectTemplateManager.searchTemplates("non-existent-query-xyz")
      expect(results).toEqual([])
    })
  })

  describe("sortTemplates", () => {
    it("should sort templates by name ascending", () => {
      const templates = projectTemplateManager.getAllTemplates()
      const sorted = projectTemplateManager.sortTemplates(templates, "name", "asc")

      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].name.en.localeCompare(sorted[i].name.en)).toBeLessThanOrEqual(0)
      }
    })

    it("should sort templates by name descending", () => {
      const templates = projectTemplateManager.getAllTemplates()
      const sorted = projectTemplateManager.sortTemplates(templates, "name", "desc")

      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].name.en.localeCompare(sorted[i].name.en)).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe("addCustomTemplate", () => {
    it("should add a custom template", () => {
      const customTemplate: ProjectTemplate = {
        id: "custom-test-template",
        name: { en: "Custom Test", ru: "Кастомный тест" },
        description: { en: "Test description", ru: "Тестовое описание" },
        category: "custom",
        isCustom: true,
        estimatedDuration: 60,
        settings: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          aspectRatio: "16:9",
        },
        structure: {
          tracks: [],
          sections: [],
          markers: [],
        },
      }

      projectTemplateManager.addCustomTemplate(customTemplate)

      const found = projectTemplateManager.getTemplateById(customTemplate.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(customTemplate.id)
      expect(found?.isCustom).toBe(true)
    })

    it("should throw error when adding template with existing id", () => {
      const template: ProjectTemplate = {
        id: "duplicate-id",
        name: { en: "Test", ru: "Тест" },
        category: "custom",
        isCustom: true,
        estimatedDuration: 60,
        settings: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          aspectRatio: "16:9",
        },
        structure: {
          tracks: [],
          sections: [],
          markers: [],
        },
      }

      projectTemplateManager.addCustomTemplate(template)

      expect(() => {
        projectTemplateManager.addCustomTemplate(template)
      }).toThrow()
    })
  })

  describe("deleteCustomTemplate", () => {
    it("should delete a custom template", () => {
      const customTemplate: ProjectTemplate = {
        id: "delete-test",
        name: { en: "Delete Test", ru: "Тест удаления" },
        category: "custom",
        isCustom: true,
        estimatedDuration: 60,
        settings: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          aspectRatio: "16:9",
        },
        structure: {
          tracks: [],
          sections: [],
          markers: [],
        },
      }

      projectTemplateManager.addCustomTemplate(customTemplate)
      expect(projectTemplateManager.getTemplateById(customTemplate.id)).toBeDefined()

      projectTemplateManager.deleteCustomTemplate(customTemplate.id)
      expect(projectTemplateManager.getTemplateById(customTemplate.id)).toBeUndefined()
    })

    it("should throw error when deleting built-in template", () => {
      const templates = projectTemplateManager.getAllTemplates()
      const builtInTemplate = templates.find((t) => !t.isCustom)

      if (builtInTemplate) {
        expect(() => {
          projectTemplateManager.deleteCustomTemplate(builtInTemplate.id)
        }).toThrow()
      }
    })
  })

  describe("getStatistics", () => {
    it("should return statistics about templates", () => {
      const stats = projectTemplateManager.getStatistics()

      expect(stats).toBeDefined()
      expect(stats.total).toBeGreaterThan(0)
      expect(stats.byCategory).toBeDefined()
      expect(stats.byPlatform).toBeDefined()
      expect(typeof stats.total).toBe("number")
    })
  })
})
