/**
 * @vitest-environment jsdom
 */
// @ts-nocheck - TODO: Update test to use new unified effects types
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BaseEffect } from "@/features/effects/types"
import { useEffectsAdapter } from "../../adapters/use-effects-adapter"

// Mock dependencies
vi.mock("@/domains/project-management/hooks", () => ({
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn(() => false),
  })),
}))

vi.mock("@/features/drag-drop", () => ({
  useDraggable: vi.fn(() => ({
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    draggable: true,
  })),
}))

vi.mock("@/features/effects/components/effect-preview", () => ({
  EffectPreview: ({ effect, onClick }: any) => (
    <div data-testid="effect-preview" onClick={onClick}>
      {effect.name?.en || effect.name?.ru}
    </div>
  ),
}))

// Mock the unified effects adapter
vi.mock("@/features/browser/hooks/use-resources", () => ({
  useEffectsAdapter: vi.fn((config) => {
    const mockEffects: BaseEffect[] = [
      {
        id: "effect-1",
        name: { en: "Blur", ru: "Размытие" },
        description: { en: "Blur effect", ru: "Эффект размытия" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
        tags: ["blur", "artistic"],
      },
      {
        id: "effect-2",
        name: { en: "Sharpen", ru: "Резкость" },
        description: { en: "Sharpen effect", ru: "Эффект резкости" },
        category: "technical",
        complexity: "medium",
        processingType: "render",
        tags: ["sharpen", "technical"],
      },
      {
        id: "effect-3",
        name: { en: "Glow", ru: "Свечение" },
        description: { en: "Glow effect", ru: "Эффект свечения" },
        category: "creative",
        complexity: "high",
        processingType: "gpu",
        tags: ["glow", "creative"],
      },
    ]

    return {
      useData: () => ({
        items: mockEffects,
        loading: false,
        error: null,
      }),
      items: mockEffects,
      loading: false,
      error: null,
      stats: { total: 3, filtered: 3 },
      getSortValue: config.customHandlers?.getSortValue || vi.fn(),
      getSearchableText: config.customHandlers?.getSearchableText || vi.fn(),
      getGroupValue: config.customHandlers?.getGroupValue || vi.fn(),
      matchesFilter: config.customHandlers?.matchesFilter || vi.fn(),
      importHandlers: {
        importFile: vi.fn(),
        importFolder: vi.fn(),
        isImporting: false,
      },
      favoriteType: "effect",
    }
  }),
}))

describe("useEffectsAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return effect adapter with correct structure", () => {
    const { result } = renderHook(() => useEffectsAdapter())

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("matchesFilter")
    expect(result.current).toHaveProperty("importHandlers")
    expect(result.current).toHaveProperty("isFavorite")
    expect(result.current).toHaveProperty("favoriteType", "effect")
  })

  describe("useData", () => {
    it("should return effects data", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.loading).toBe(false)
      expect(dataResult.current.error).toBe(null)
      expect(dataResult.current.items).toHaveLength(3)
      expect(dataResult.current.items[0].name.en).toBe("Blur")
      expect(dataResult.current.items[1].name.en).toBe("Sharpen")
      expect(dataResult.current.items[2].name.en).toBe("Glow")
    })
  })

  describe("getSortValue", () => {
    it("should sort by name using English locale", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test Effect", ru: "Тестовый эффект" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
      }

      const sortValue = result.current.getSortValue(effect, "name")
      expect(sortValue).toBe("test effect")
    })

    it("should fallback to Russian when English is not available", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { ru: "Тестовый эффект" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
      }

      const sortValue = result.current.getSortValue(effect, "name")
      expect(sortValue).toBe("тестовый эффект")
    })

    it("should sort by category", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "Creative",
        complexity: "low",
        processingType: "css",
      }

      const sortValue = result.current.getSortValue(effect, "category")
      expect(sortValue).toBe("creative")
    })

    it("should sort by complexity with numeric order", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      const lowEffect: BaseEffect = {
        id: "low",
        name: { en: "Low" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
      }

      const mediumEffect: BaseEffect = {
        id: "medium",
        name: { en: "Medium" },
        category: "artistic",
        complexity: "medium",
        processingType: "css",
      }

      const highEffect: BaseEffect = {
        id: "high",
        name: { en: "High" },
        category: "artistic",
        complexity: "high",
        processingType: "css",
      }

      const extremeEffect: BaseEffect = {
        id: "extreme",
        name: { en: "Extreme" },
        category: "artistic",
        complexity: "extreme",
        processingType: "render",
      }

      expect(result.current.getSortValue(lowEffect, "complexity")).toBe(0)
      expect(result.current.getSortValue(mediumEffect, "complexity")).toBe(1)
      expect(result.current.getSortValue(highEffect, "complexity")).toBe(2)
      expect(result.current.getSortValue(extremeEffect, "complexity")).toBe(3)
    })

    it("should default to low complexity when undefined", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "artistic",
        processingType: "css",
      }

      const sortValue = result.current.getSortValue(effect, "complexity")
      expect(sortValue).toBe(0) // low = 0
    })

    it("should sort by processingType", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "artistic",
        complexity: "low",
        processingType: "gpu",
      }

      const sortValue = result.current.getSortValue(effect, "processingType")
      expect(sortValue).toBe("gpu")
    })

    it("should fallback to name for unknown sort field", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test Effect" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
      }

      const sortValue = result.current.getSortValue(effect, "unknown")
      expect(sortValue).toBe("test effect")
    })
  })

  describe("getSearchableText", () => {
    it("should return all searchable fields", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Blur", ru: "Размытие" },
        description: { en: "Blur effect", ru: "Эффект размытия" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
        tags: ["blur", "artistic", "creative"],
      }

      const searchableText = result.current.getSearchableText(effect)
      expect(searchableText).toContain("Размытие")
      expect(searchableText).toContain("Blur")
      expect(searchableText).toContain("Эффект размытия")
      expect(searchableText).toContain("Blur effect")
      expect(searchableText).toContain("artistic")
      expect(searchableText).toContain("css")
      expect(searchableText).toContain("blur")
      expect(searchableText).toContain("creative")
    })

    it("should filter out empty values", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Simple Effect" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
      }

      const searchableText = result.current.getSearchableText(effect)
      expect(searchableText).not.toContain("")
      expect(searchableText.every((text) => text.length > 0)).toBe(true)
    })

    it("should handle missing tags", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Effect" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
      }

      const searchableText = result.current.getSearchableText(effect)
      expect(searchableText).not.toContain(undefined)
      expect(searchableText.every((text) => typeof text === "string")).toBe(true)
    })
  })

  describe("getGroupValue", () => {
    it("should group by category", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
      }

      const group = result.current.getGroupValue(effect, "category")
      expect(group).toBe("artistic")
    })

    it("should group by complexity", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "artistic",
        complexity: "high",
        processingType: "css",
      }

      const group = result.current.getGroupValue(effect, "complexity")
      expect(group).toBe("high")
    })

    it("should group by processingType", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "artistic",
        complexity: "low",
        processingType: "gpu",
      }

      const group = result.current.getGroupValue(effect, "processingType")
      expect(group).toBe("gpu")
    })

    it("should group by first tag", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
        tags: ["vintage", "retro"],
      }

      const group = result.current.getGroupValue(effect, "tags")
      expect(group).toBe("vintage")
    })

    it("should use 'untagged' for effects without tags", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
      }

      const group = result.current.getGroupValue(effect, "tags")
      expect(group).toBe("untagged")
    })

    it("should default to 'other' for missing category", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        complexity: "low",
        processingType: "css",
      } as BaseEffect

      const group = result.current.getGroupValue(effect, "category")
      expect(group).toBe("other")
    })

    it("should default to 'basic' for missing complexity", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "artistic",
        processingType: "css",
      }

      const group = result.current.getGroupValue(effect, "complexity")
      expect(group).toBe("basic")
    })

    it("should default to 'render' for missing processingType", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "artistic",
        complexity: "low",
      } as BaseEffect

      const group = result.current.getGroupValue(effect, "processingType")
      expect(group).toBe("render")
    })

    it("should return empty string for unknown group type", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
      }

      const group = result.current.getGroupValue(effect, "unknown")
      expect(group).toBe("")
    })
  })

  describe("matchesFilter", () => {
    it("should match 'all' filter", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
      }

      expect(result.current.matchesFilter?.(effect, "all")).toBe(true)
    })

    it("should filter by complexity levels", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      const basicEffect: BaseEffect = {
        id: "basic",
        name: { en: "Basic" },
        category: "artistic",
        complexity: "basic",
        processingType: "css",
      }

      const advancedEffect: BaseEffect = {
        id: "advanced",
        name: { en: "Advanced" },
        category: "artistic",
        complexity: "advanced",
        processingType: "render",
      }

      expect(result.current.matchesFilter?.(basicEffect, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(basicEffect, "advanced")).toBe(false)
      expect(result.current.matchesFilter?.(advancedEffect, "advanced")).toBe(true)
      expect(result.current.matchesFilter?.(advancedEffect, "basic")).toBe(false)
    })

    it("should filter by category", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      const artisticEffect: BaseEffect = {
        id: "artistic",
        name: { en: "Artistic" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
      }

      const technicalEffect: BaseEffect = {
        id: "technical",
        name: { en: "Technical" },
        category: "technical",
        complexity: "low",
        processingType: "render",
      }

      expect(result.current.matchesFilter?.(artisticEffect, "artistic")).toBe(true)
      expect(result.current.matchesFilter?.(artisticEffect, "technical")).toBe(false)
      expect(result.current.matchesFilter?.(technicalEffect, "technical")).toBe(true)
    })

    it("should handle all supported categories", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      const categories = ["color-correction", "artistic", "vintage", "cinematic", "creative", "technical", "distortion"]

      categories.forEach((category) => {
        const effect: BaseEffect = {
          id: `effect-${category}`,
          name: { en: category },
          category,
          complexity: "low",
          processingType: "css",
        }

        expect(result.current.matchesFilter?.(effect, category)).toBe(true)
      })
    })

    it("should default to basic complexity when undefined", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "artistic",
        processingType: "css",
      }

      expect(result.current.matchesFilter?.(effect, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(effect, "advanced")).toBe(false)
    })

    it("should return true for unknown filter types", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
      }

      expect(result.current.matchesFilter?.(effect, "unknown-filter")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })
  })

  describe("importHandlers", () => {
    it("should provide import functions", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      expect(result.current.importHandlers).toBeDefined()
      expect(typeof result.current.importHandlers?.importFile).toBe("function")
      expect(typeof result.current.importHandlers?.importFolder).toBe("function")
      expect(typeof result.current.importHandlers?.isImporting).toBe("boolean")
    })
  })

  describe("isFavorite", () => {
    it("should check if effect is favorite", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      const effect: BaseEffect = {
        id: "test",
        name: { en: "Test" },
        category: "artistic",
        complexity: "low",
        processingType: "css",
      }

      expect(typeof result.current.isFavorite).toBe("function")
      expect(result.current.isFavorite?.(effect)).toBe(false)
    })
  })

  describe("favoriteType", () => {
    it("should be 'effect'", () => {
      const { result } = renderHook(() => useEffectsAdapter())
      expect(result.current.favoriteType).toBe("effect")
    })
  })
})
