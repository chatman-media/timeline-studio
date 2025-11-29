import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { VideoFilter } from "@/features/filters/types/filters"
import { useFiltersAdapter } from "../../adapters/use-filters-adapter"

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

vi.mock("@/features/filters/components/filter-preview", () => ({
  FilterPreview: ({ filter, onClick }: any) => (
    <div data-testid="filter-preview" onClick={onClick}>
      {filter.name}
    </div>
  ),
}))

// Mock the unified filters adapter
vi.mock("@/features/browser/hooks/use-resources", () => ({
  useFiltersAdapter: vi.fn((config) => {
    const mockFilters: VideoFilter[] = [
      {
        id: "filter-1",
        name: "Cinematic",
        labels: { en: "Cinematic", ru: "Кинематографический" },
        description: { en: "Cinematic look", ru: "Кинематографический вид" },
        category: "cinematic",
        complexity: "basic",
        tags: ["cinema", "professional"],
        params: { brightness: 0.1, contrast: 1.2 },
      },
      {
        id: "filter-2",
        name: "Vintage",
        labels: { en: "Vintage", ru: "Винтаж" },
        description: { en: "Vintage style", ru: "Винтажный стиль" },
        category: "vintage",
        complexity: "intermediate",
        tags: ["retro", "old"],
        params: { saturation: 0.8, temperature: 10 },
      },
      {
        id: "filter-3",
        name: "Black & White",
        labels: { en: "Black & White", ru: "Черно-белый" },
        description: { en: "Classic B&W", ru: "Классический ЧБ" },
        category: "artistic",
        complexity: "advanced",
        tags: ["classic"],
        params: { saturation: 0 },
      },
    ]

    return {
      items: mockFilters,
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
      favoriteType: "filter",
    }
  }),
}))

describe("useFiltersAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return filter adapter with correct structure", () => {
    const { result } = renderHook(() => useFiltersAdapter())

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("matchesFilter")
    expect(result.current).toHaveProperty("importHandlers")
    expect(result.current).toHaveProperty("isFavorite")
    expect(result.current).toHaveProperty("favoriteType", "filter")
  })

  describe("useData", () => {
    it("should return filters data", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.loading).toBe(false)
      expect(dataResult.current.error).toBe(null)
      expect(dataResult.current.items).toHaveLength(3)
      expect(dataResult.current.items[0].name).toBe("Cinematic")
      expect(dataResult.current.items[1].name).toBe("Vintage")
      expect(dataResult.current.items[2].name).toBe("Black & White")
    })
  })

  describe("getSortValue", () => {
    it("should sort by name", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Test Filter",
        category: "color",
        complexity: "basic",
        params: {},
      }

      const sortValue = result.current.getSortValue(filter, "name")
      expect(sortValue).toBe("test filter")
    })

    it("should sort by category", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Test",
        category: "Cinematic",
        complexity: "basic",
        params: {},
      }

      const sortValue = result.current.getSortValue(filter, "category")
      expect(sortValue).toBe("cinematic")
    })

    it("should sort by complexity with numeric order", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      const basicFilter: VideoFilter = {
        id: "basic",
        name: "Basic",
        category: "color",
        complexity: "basic",
        params: {},
      }

      const intermediateFilter: VideoFilter = {
        id: "intermediate",
        name: "Intermediate",
        category: "color",
        complexity: "intermediate",
        params: {},
      }

      const advancedFilter: VideoFilter = {
        id: "advanced",
        name: "Advanced",
        category: "color",
        complexity: "advanced",
        params: {},
      }

      expect(result.current.getSortValue(basicFilter, "complexity")).toBe(0)
      expect(result.current.getSortValue(intermediateFilter, "complexity")).toBe(1)
      expect(result.current.getSortValue(advancedFilter, "complexity")).toBe(2)
    })

    it("should default to basic complexity when undefined", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Test",
        category: "color",
        params: {},
      }

      const sortValue = result.current.getSortValue(filter, "complexity")
      expect(sortValue).toBe(0) // basic = 0
    })

    it("should fallback to name for unknown sort field", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Test Filter",
        category: "color",
        complexity: "basic",
        params: {},
      }

      const sortValue = result.current.getSortValue(filter, "unknown")
      expect(sortValue).toBe("test filter")
    })
  })

  describe("getSearchableText", () => {
    it("should return all searchable fields", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Cinematic",
        labels: { en: "Cinematic", ru: "Кинематографический" },
        description: { en: "Cinematic look", ru: "Кинематографический вид" },
        category: "cinematic",
        complexity: "basic",
        tags: ["cinema", "professional"],
        params: {},
      }

      const searchableText = result.current.getSearchableText(filter)
      expect(searchableText).toContain("Cinematic")
      expect(searchableText).toContain("Кинематографический")
      expect(searchableText).toContain("Cinematic look")
      expect(searchableText).toContain("cinematic")
      expect(searchableText).toContain("cinema")
      expect(searchableText).toContain("professional")
    })

    it("should filter out empty values", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Simple Filter",
        category: "color",
        complexity: "basic",
        params: {},
      }

      const searchableText = result.current.getSearchableText(filter)
      expect(searchableText).toEqual(["Simple Filter", "color"])
    })

    it("should handle missing tags", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Filter",
        category: "color",
        complexity: "basic",
        params: {},
      }

      const searchableText = result.current.getSearchableText(filter)
      expect(searchableText).not.toContain(undefined)
      expect(searchableText.every((text) => text.length > 0)).toBe(true)
    })
  })

  describe("getGroupValue", () => {
    it("should group by category", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Test",
        category: "cinematic",
        complexity: "basic",
        params: {},
      }

      const group = result.current.getGroupValue(filter, "category")
      expect(group).toBe("cinematic")
    })

    it("should group by complexity", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Test",
        category: "color",
        complexity: "advanced",
        params: {},
      }

      const group = result.current.getGroupValue(filter, "complexity")
      expect(group).toBe("advanced")
    })

    it("should group by first tag", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Test",
        category: "color",
        complexity: "basic",
        tags: ["vintage", "retro"],
        params: {},
      }

      const group = result.current.getGroupValue(filter, "tags")
      expect(group).toBe("vintage")
    })

    it("should use 'untagged' for filters without tags", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Test",
        category: "color",
        complexity: "basic",
        params: {},
      }

      const group = result.current.getGroupValue(filter, "tags")
      expect(group).toBe("untagged")
    })

    it("should default to 'other' for missing category", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Test",
        complexity: "basic",
        params: {},
      } as VideoFilter

      const group = result.current.getGroupValue(filter, "category")
      expect(group).toBe("other")
    })

    it("should return empty string for unknown group type", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Test",
        category: "color",
        complexity: "basic",
        params: {},
      }

      const group = result.current.getGroupValue(filter, "unknown")
      expect(group).toBe("")
    })
  })

  describe("matchesFilter", () => {
    it("should match 'all' filter", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Test",
        category: "color",
        complexity: "basic",
        params: {},
      }

      expect(result.current.matchesFilter?.(filter, "all")).toBe(true)
    })

    it("should filter by complexity levels", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      const basicFilter: VideoFilter = {
        id: "basic",
        name: "Basic",
        category: "color",
        complexity: "basic",
        params: {},
      }

      const advancedFilter: VideoFilter = {
        id: "advanced",
        name: "Advanced",
        category: "color",
        complexity: "advanced",
        params: {},
      }

      expect(result.current.matchesFilter?.(basicFilter, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(basicFilter, "advanced")).toBe(false)
      expect(result.current.matchesFilter?.(advancedFilter, "advanced")).toBe(true)
      expect(result.current.matchesFilter?.(advancedFilter, "basic")).toBe(false)
    })

    it("should filter by category", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      const cinematicFilter: VideoFilter = {
        id: "cinematic",
        name: "Cinematic",
        category: "cinematic",
        complexity: "basic",
        params: {},
      }

      const vintageFilter: VideoFilter = {
        id: "vintage",
        name: "Vintage",
        category: "vintage",
        complexity: "basic",
        params: {},
      }

      expect(result.current.matchesFilter?.(cinematicFilter, "cinematic")).toBe(true)
      expect(result.current.matchesFilter?.(cinematicFilter, "vintage")).toBe(false)
      expect(result.current.matchesFilter?.(vintageFilter, "vintage")).toBe(true)
    })

    it("should handle all supported categories", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      const categories = ["color-correction", "creative", "cinematic", "vintage", "technical", "artistic"]

      categories.forEach((category) => {
        const filter: VideoFilter = {
          id: `filter-${category}`,
          name: category,
          category,
          complexity: "basic",
          params: {},
        }

        expect(result.current.matchesFilter?.(filter, category)).toBe(true)
      })
    })

    it("should default to basic complexity when undefined", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Test",
        category: "color",
        params: {},
      }

      expect(result.current.matchesFilter?.(filter, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(filter, "advanced")).toBe(false)
    })

    it("should return true for unknown filter types", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Test",
        category: "color",
        complexity: "basic",
        params: {},
      }

      expect(result.current.matchesFilter?.(filter, "unknown-filter")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })
  })

  describe("importHandlers", () => {
    it("should provide import functions", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      expect(result.current.importHandlers).toBeDefined()
      expect(typeof result.current.importHandlers?.importFile).toBe("function")
      expect(typeof result.current.importHandlers?.importFolder).toBe("function")
      expect(typeof result.current.importHandlers?.isImporting).toBe("boolean")
    })
  })

  describe("isFavorite", () => {
    it("should check if filter is favorite", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      const filter: VideoFilter = {
        id: "test",
        name: "Test",
        category: "color",
        complexity: "basic",
        params: {},
      }

      expect(typeof result.current.isFavorite).toBe("function")
      expect(result.current.isFavorite?.(filter)).toBe(false)
    })
  })

  describe("favoriteType", () => {
    it("should be 'filter'", () => {
      const { result } = renderHook(() => useFiltersAdapter())
      expect(result.current.favoriteType).toBe("filter")
    })
  })
})
