/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { BUILT_IN_TEMPLATES } from "../../types/montage-templates"
import { useMontageTemplate } from "../use-montage-template"

describe("useMontageTemplate", () => {
  beforeEach(() => {
    // Reset any state if needed
  })
  describe("Initial State", () => {
    it("should initialize with null selected template", () => {
      const { result } = renderHook(() => useMontageTemplate())

      expect(result.current.selectedTemplate).toBeNull()
      expect(result.current.availableTemplates).toHaveLength(BUILT_IN_TEMPLATES.length)
    })

    it("should provide all built-in templates", () => {
      const { result } = renderHook(() => useMontageTemplate())

      expect(result.current.availableTemplates).toEqual(BUILT_IN_TEMPLATES)
    })
  })

  describe("Template Selection", () => {
    it("should select template by id", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.selectTemplate("instagram-reel")
      })

      expect(result.current.selectedTemplate).not.toBeNull()
      expect(result.current.selectedTemplate?.id).toBe("instagram-reel")
    })

    it("should select template by object", () => {
      const { result } = renderHook(() => useMontageTemplate())
      const template = BUILT_IN_TEMPLATES[0]

      act(() => {
        result.current.selectTemplate(template)
      })

      expect(result.current.selectedTemplate).toEqual(template)
    })

    it("should handle invalid template id", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.selectTemplate("non-existent-template")
      })

      expect(result.current.selectedTemplate).toBeNull()
    })

    it("should clear selection", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.selectTemplate("instagram-reel")
      })

      expect(result.current.selectedTemplate).not.toBeNull()

      act(() => {
        result.current.clearSelection()
      })

      expect(result.current.selectedTemplate).toBeNull()
    })
  })

  describe("Template Filtering", () => {
    it("should filter by category", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.filterByCategory("social")
      })

      expect(result.current.filteredTemplates.length).toBeGreaterThan(0)
      expect(result.current.filteredTemplates.every((t) => t.category === "social")).toBe(true)
    })

    it("should filter by multiple categories", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.filterByCategories(["social", "promo"])
      })

      const categories = result.current.filteredTemplates.map((t) => t.category)
      expect(categories.every((c) => c === "social" || c === "promo")).toBe(true)
    })

    it("should search by name", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.searchTemplates("Instagram")
      })

      expect(result.current.filteredTemplates.length).toBeGreaterThan(0)
      expect(result.current.filteredTemplates.some((t) => t.name.includes("Instagram"))).toBe(true)
    })

    it("should search by tags", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.searchByTags(["vertical"])
      })

      expect(result.current.filteredTemplates.length).toBeGreaterThan(0)
      expect(result.current.filteredTemplates.every((t) => t.tags.includes("vertical"))).toBe(true)
    })

    it("should combine filters", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.filterByCategory("social")
      })

      act(() => {
        result.current.searchTemplates("reel")
      })

      const filtered = result.current.filteredTemplates
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.every((t) => t.name.toLowerCase().includes("reel"))).toBe(true)
    })

    it("should clear all filters", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.filterByCategory("social")
        result.current.searchTemplates("reel")
      })

      expect(result.current.filteredTemplates.length).toBeLessThan(BUILT_IN_TEMPLATES.length)

      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.filteredTemplates).toHaveLength(BUILT_IN_TEMPLATES.length)
    })
  })

  describe("Template Parameters", () => {
    it("should customize template parameters", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.selectTemplate("instagram-reel")
      })

      act(() => {
        result.current.customizeParameters({
          targetDuration: 60,
        })
      })

      expect(result.current.customizedTemplate?.parameters.targetDuration).toBe(60)
    })

    it("should preserve original template", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.selectTemplate("instagram-reel")
        result.current.customizeParameters({
          targetDuration: 60,
        })
      })

      const original = BUILT_IN_TEMPLATES.find((t) => t.id === "instagram-reel")
      expect(result.current.selectedTemplate).toEqual(original)
      expect(result.current.customizedTemplate).not.toEqual(original)
    })

    it("should reset customization", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.selectTemplate("instagram-reel")
      })

      act(() => {
        result.current.customizeParameters({ targetDuration: 60 })
      })

      expect(result.current.customizedTemplate).not.toBeNull()

      act(() => {
        result.current.resetCustomization()
      })

      expect(result.current.customizedTemplate).toBeNull()
    })
  })

  describe("Template Comparison", () => {
    it("should compare two templates", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.compareTemplates("instagram-reel", "youtube-intro")
      })

      expect(result.current.comparison).not.toBeNull()
      expect(result.current.comparison?.template1.id).toBe("instagram-reel")
      expect(result.current.comparison?.template2.id).toBe("youtube-intro")
    })

    it("should show parameter differences", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.compareTemplates("instagram-reel", "youtube-intro")
      })

      const { comparison } = result.current
      expect(comparison?.differences.targetDuration).toBeDefined()
      expect(comparison?.differences.aspectRatio).toBeDefined()
    })

    it("should clear comparison", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.compareTemplates("instagram-reel", "youtube-intro")
      })

      expect(result.current.comparison).not.toBeNull()

      act(() => {
        result.current.clearComparison()
      })

      expect(result.current.comparison).toBeNull()
    })
  })

  describe("Template Recommendations", () => {
    it("should recommend templates based on criteria", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.getRecommendations({
          targetDuration: 30,
          aspectRatio: "9:16",
        })
      })

      expect(result.current.recommendations.length).toBeGreaterThan(0)
      expect(result.current.recommendations[0].id).toBe("instagram-reel")
    })

    it("should rank recommendations by relevance", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.getRecommendations({
          targetDuration: 60,
          style: "highlights",
        })
      })

      // First recommendation should be most relevant
      expect(result.current.recommendations.length).toBeGreaterThan(0)
      expect(result.current.recommendations[0].score).toBeGreaterThanOrEqual(
        result.current.recommendations[1]?.score || 0,
      )
    })
  })

  describe("Custom Templates", () => {
    it("should create custom template from selection", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.selectTemplate("instagram-reel")
      })

      act(() => {
        result.current.saveAsCustomTemplate({
          name: "My Custom Reel",
          description: "Custom Instagram reel template",
        })
      })

      expect(result.current.customTemplates.length).toBe(1)
      expect(result.current.customTemplates[0].name).toBe("My Custom Reel")
      expect(result.current.customTemplates[0].isBuiltIn).toBe(false)
    })

    it("should delete custom template", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.selectTemplate("instagram-reel")
      })

      act(() => {
        result.current.saveAsCustomTemplate({
          name: "My Custom Reel",
          description: "Test",
        })
      })

      const customId = result.current.customTemplates[0].id

      act(() => {
        result.current.deleteCustomTemplate(customId)
      })

      expect(result.current.customTemplates).toHaveLength(0)
    })

    it("should not delete built-in templates", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.deleteCustomTemplate("instagram-reel")
      })

      // Built-in template should still exist
      const template = result.current.availableTemplates.find((t) => t.id === "instagram-reel")
      expect(template).toBeDefined()
    })
  })

  describe("Template Export/Import", () => {
    it("should export template as JSON", () => {
      const { result } = renderHook(() => useMontageTemplate())

      act(() => {
        result.current.selectTemplate("instagram-reel")
      })

      const exported = result.current.exportTemplate()

      expect(exported).toBeDefined()
      expect(JSON.parse(exported).id).toBe("instagram-reel")
    })

    it("should import template from JSON", () => {
      const { result } = renderHook(() => useMontageTemplate())

      const template = BUILT_IN_TEMPLATES[0]
      // Convert Date to string for proper comparison
      const templateForExport = {
        ...template,
        createdAt: template.createdAt.toISOString(),
      }
      const json = JSON.stringify(templateForExport)

      act(() => {
        result.current.importTemplate(json)
      })

      expect(result.current.selectedTemplate).toEqual(
        expect.objectContaining({
          id: template.id,
          name: template.name,
          style: template.style,
        }),
      )
    })

    it("should validate imported template", () => {
      const { result } = renderHook(() => useMontageTemplate())

      const invalidJson = JSON.stringify({ invalid: "template" })

      expect(() => {
        act(() => {
          result.current.importTemplate(invalidJson)
        })
      }).toThrow()
    })
  })
})
