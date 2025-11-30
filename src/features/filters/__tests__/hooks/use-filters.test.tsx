/**
 * Tests for use-filters hook
 *
 * Tests the main filters hook functionality including:
 * - Loading filters from JSON data
 * - Error handling and fallback filters
 * - Filter retrieval by ID
 * - Filter retrieval by category
 * - Filter search functionality
 */

import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useFilterById, useFilters, useFiltersByCategory, useFiltersSearch } from "../../hooks/use-filters"

// Mock tauri logger
vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}))

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))

describe("useFilters", () => {
  describe("Loading filters", () => {
    it("should load filters from JSON data", async () => {
      const { result } = renderHook(() => useFilters())

      // Initially loading
      expect(result.current.loading).toBe(true)
      expect(result.current.filters).toEqual([])
      expect(result.current.error).toBe(null)
      expect(result.current.isReady).toBe(false)

      // Wait for filters to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should have loaded filters
      expect(result.current.filters.length).toBeGreaterThan(0)
      expect(result.current.error).toBe(null)
      expect(result.current.isReady).toBe(true)
    })

    it("should have valid filter structure", async () => {
      const { result } = renderHook(() => useFilters())

      await waitFor(() => {
        expect(result.current.isReady).toBe(true)
      })

      const firstFilter = result.current.filters[0]
      expect(firstFilter).toHaveProperty("id")
      expect(firstFilter).toHaveProperty("name")
      expect(firstFilter).toHaveProperty("category")
      expect(firstFilter).toHaveProperty("complexity")
      expect(firstFilter).toHaveProperty("params")
      expect(typeof firstFilter.id).toBe("string")
      expect(typeof firstFilter.name).toBe("string")
      expect(typeof firstFilter.category).toBe("string")
      expect(typeof firstFilter.params).toBe("object")
    })

    it("should support reload functionality", async () => {
      const { result } = renderHook(() => useFilters())

      await waitFor(() => {
        expect(result.current.isReady).toBe(true)
      })

      const initialFiltersCount = result.current.filters.length

      // Reload filters
      result.current.reload()

      // Should reload and have same count
      await waitFor(() => {
        expect(result.current.isReady).toBe(true)
      })

      expect(result.current.filters.length).toBe(initialFiltersCount)
    })
  })

  describe("Filter categories", () => {
    it("should load filters with various categories", async () => {
      const { result } = renderHook(() => useFilters())

      await waitFor(() => {
        expect(result.current.isReady).toBe(true)
      })

      const categories = new Set(result.current.filters.map((f) => f.category))
      expect(categories.size).toBeGreaterThan(0)
    })
  })

  describe("Filter complexity levels", () => {
    it("should have filters with different complexity levels", async () => {
      const { result } = renderHook(() => useFilters())

      await waitFor(() => {
        expect(result.current.isReady).toBe(true)
      })

      const complexityLevels = new Set(result.current.filters.map((f) => f.complexity))
      expect(complexityLevels.size).toBeGreaterThan(0)
    })
  })
})

describe("useFilterById", () => {
  it("should return null while loading", () => {
    const { result } = renderHook(() => useFilterById("any-id"))
    expect(result.current).toBe(null)
  })

  it("should return filter by ID when ready", async () => {
    const { result: filtersResult } = renderHook(() => useFilters())

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    const firstFilterId = filtersResult.current.filters[0].id

    const { result } = renderHook(() => useFilterById(firstFilterId))

    await waitFor(() => {
      expect(result.current).not.toBe(null)
    })

    expect(result.current?.id).toBe(firstFilterId)
  })

  it("should return null for non-existent filter ID", async () => {
    const { result: filtersResult } = renderHook(() => useFilters())

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    const { result } = renderHook(() => useFilterById("non-existent-id-12345"))

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    expect(result.current).toBe(null)
  })
})

describe("useFiltersByCategory", () => {
  it("should return empty array while loading", () => {
    const { result } = renderHook(() => useFiltersByCategory("any-category"))
    expect(result.current).toEqual([])
  })

  it("should return filters by category when ready", async () => {
    const { result: filtersResult } = renderHook(() => useFilters())

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    const firstCategory = filtersResult.current.filters[0].category

    const { result } = renderHook(() => useFiltersByCategory(firstCategory))

    await waitFor(() => {
      expect(result.current.length).toBeGreaterThan(0)
    })

    // All returned filters should have the requested category
    result.current.forEach((filter) => {
      expect(filter.category).toBe(firstCategory)
    })
  })

  it("should return empty array for non-existent category", async () => {
    const { result: filtersResult } = renderHook(() => useFilters())

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    const { result } = renderHook(() => useFiltersByCategory("non-existent-category-12345"))

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    expect(result.current).toEqual([])
  })
})

describe("useFiltersSearch", () => {
  it("should return all filters when query is empty", async () => {
    const { result: filtersResult } = renderHook(() => useFilters())

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    const totalFilters = filtersResult.current.filters.length

    const { result } = renderHook(() => useFiltersSearch(""))

    await waitFor(() => {
      expect(result.current.length).toBe(totalFilters)
    })
  })

  it("should return all filters when query is only whitespace", async () => {
    const { result: filtersResult } = renderHook(() => useFilters())

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    const totalFilters = filtersResult.current.filters.length

    const { result } = renderHook(() => useFiltersSearch("   "))

    await waitFor(() => {
      expect(result.current.length).toBe(totalFilters)
    })
  })

  it("should search by filter label (Russian)", async () => {
    const { result: filtersResult } = renderHook(() => useFilters())

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    // Get a filter with Russian label
    const filterWithRuLabel = filtersResult.current.filters.find((f) => f.labels?.ru)

    if (filterWithRuLabel && filterWithRuLabel.labels?.ru) {
      const searchQuery = filterWithRuLabel.labels.ru.substring(0, 3).toLowerCase()

      const { result } = renderHook(() => useFiltersSearch(searchQuery, "ru"))

      await waitFor(() => {
        expect(result.current.length).toBeGreaterThan(0)
      })

      // Should include our filter
      expect(result.current.some((f) => f.id === filterWithRuLabel.id)).toBe(true)
    }
  })

  it("should search by filter label (English)", async () => {
    const { result: filtersResult } = renderHook(() => useFilters())

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    // Get a filter with English label
    const filterWithEnLabel = filtersResult.current.filters.find((f) => f.labels?.en)

    if (filterWithEnLabel && filterWithEnLabel.labels?.en) {
      const searchQuery = filterWithEnLabel.labels.en.substring(0, 3).toLowerCase()

      const { result } = renderHook(() => useFiltersSearch(searchQuery, "en"))

      await waitFor(() => {
        expect(result.current.length).toBeGreaterThan(0)
      })

      // Should include our filter
      expect(result.current.some((f) => f.id === filterWithEnLabel.id)).toBe(true)
    }
  })

  it("should search by filter name as fallback", async () => {
    const { result: filtersResult } = renderHook(() => useFilters())

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    const firstFilter = filtersResult.current.filters[0]
    const searchQuery = firstFilter.name.substring(0, 3).toLowerCase()

    const { result } = renderHook(() => useFiltersSearch(searchQuery, "ru"))

    await waitFor(() => {
      expect(result.current.length).toBeGreaterThan(0)
    })
  })

  it("should search by tags", async () => {
    const { result: filtersResult } = renderHook(() => useFilters())

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    // Find a filter with tags
    const filterWithTags = filtersResult.current.filters.find((f) => f.tags && f.tags.length > 0)

    if (filterWithTags && filterWithTags.tags && filterWithTags.tags.length > 0) {
      const searchQuery = filterWithTags.tags[0].toLowerCase()

      const { result } = renderHook(() => useFiltersSearch(searchQuery, "ru"))

      await waitFor(() => {
        expect(result.current.length).toBeGreaterThan(0)
      })

      // Should include our filter
      expect(result.current.some((f) => f.id === filterWithTags.id)).toBe(true)
    }
  })

  it("should perform case-insensitive search", async () => {
    const { result: filtersResult } = renderHook(() => useFilters())

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    const firstFilter = filtersResult.current.filters[0]
    const searchQuery = firstFilter.name.substring(0, 3)

    // Search with different cases
    const { result: lowerResult } = renderHook(() => useFiltersSearch(searchQuery.toLowerCase(), "ru"))
    const { result: upperResult } = renderHook(() => useFiltersSearch(searchQuery.toUpperCase(), "ru"))

    await waitFor(() => {
      expect(lowerResult.current.length).toBeGreaterThan(0)
      expect(upperResult.current.length).toBeGreaterThan(0)
    })

    // Results should be the same regardless of case
    expect(lowerResult.current.length).toBe(upperResult.current.length)
  })

  it("should return empty array for non-matching query", async () => {
    const { result: filtersResult } = renderHook(() => useFilters())

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    const { result } = renderHook(() => useFiltersSearch("xyz-non-existent-query-12345", "ru"))

    await waitFor(() => {
      expect(filtersResult.current.isReady).toBe(true)
    })

    expect(result.current).toEqual([])
  })

  it("should return empty array while loading", () => {
    const { result } = renderHook(() => useFiltersSearch("test"))
    expect(result.current).toEqual([])
  })
})
