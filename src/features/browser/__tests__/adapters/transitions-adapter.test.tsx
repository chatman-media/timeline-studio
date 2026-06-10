/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest"

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useTransitionsAdapter } from "@/features/browser/adapters/use-transitions-adapter"

// Create mock implementation for the unified adapter
const mockUnifiedAdapterReturn: any = {
  items: [],
  loading: false,
  error: null,
  stats: {
    total: 0,
    byType: {},
    bySource: {},
    cacheSize: 0,
    memoryUsage: 0,
  },
  getSortValue: vi.fn(),
  getSearchableText: vi.fn(),
  getGroupValue: vi.fn(),
  matchesFilter: vi.fn(),
  importHandlers: undefined,
  favoriteType: "transition",
}

// Mock модулей
vi.mock("@/core/hooks", () => ({
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn(() => false),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
  })),
}))

vi.mock("@/features/browser/hooks/use-resources", () => ({
  useTransitionsAdapter: vi.fn(() => mockUnifiedAdapterReturn),
}))

vi.mock("@/features/drag-drop", () => ({
  useDraggable: vi.fn(() => ({})),
}))

vi.mock("@/lib/tauri-utils", () => ({
  convertVideoSrc: vi.fn((src) => src),
}))

describe("useTransitionsAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useData", () => {
    it("should return empty array when no transitions", () => {
      // Set mock data
      mockUnifiedAdapterReturn.items = []
      mockUnifiedAdapterReturn.loading = false
      mockUnifiedAdapterReturn.error = null

      function TestComponent() {
        const adapter = useTransitionsAdapter()
        const { items, loading, error } = adapter.useData()

        return (
          <div data-oid="harbjac">
            <div data-testid="items-count" data-oid="pb6xtil">
              {items.length}
            </div>
            <div data-testid="loading" data-oid="qbboywj">
              {loading.toString()}
            </div>
            <div data-testid="error" data-oid="zlb5gvn">
              {error?.message || "null"}
            </div>
          </div>
        )
      }

      render(<TestComponent data-oid="oz.5ral" />)

      expect(screen.getByTestId("items-count")).toHaveTextContent("0")
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
      expect(screen.getByTestId("error")).toHaveTextContent("null")
    })

    it("should return transitions when available", () => {
      const mockTransitions = [
        {
          id: "1",
          name: "fade",
          type: "fade",
          category: "basic",
          complexity: "basic",
          labels: {
            ru: "Плавное затухание",
            en: "Fade",
          },
          description: {
            ru: "Плавный переход между кадрами",
            en: "Smooth transition between frames",
          },
          duration: {
            default: 1,
            min: 0.5,
            max: 3,
          },
        },
        {
          id: "2",
          name: "wipe",
          type: "wipe",
          category: "basic",
          complexity: "basic",
          labels: {
            ru: "Вытеснение",
            en: "Wipe",
          },
          description: {
            ru: "Переход с вытеснением",
            en: "Wipe transition",
          },
          duration: {
            default: 1,
            min: 0.5,
            max: 2,
          },
        },
      ]

      // Set mock data
      mockUnifiedAdapterReturn.items = mockTransitions
      mockUnifiedAdapterReturn.loading = false
      mockUnifiedAdapterReturn.error = null
      mockUnifiedAdapterReturn.getSortValue = vi.fn((item, sortBy) => {
        if (sortBy === "name") return item.name
        if (sortBy === "category") return item.category
        return item.name
      })

      function TestComponent() {
        const adapter = useTransitionsAdapter()
        const { items } = adapter.useData()

        return (
          <div data-testid="items-count" data-oid="_iebbxx">
            {items.length}
          </div>
        )
      }

      render(<TestComponent data-oid="4y5lwic" />)

      expect(screen.getByTestId("items-count")).toHaveTextContent("2")
    })

    it("should handle loading state", () => {
      // Set mock data
      mockUnifiedAdapterReturn.items = []
      mockUnifiedAdapterReturn.loading = true
      mockUnifiedAdapterReturn.error = null

      function TestComponent() {
        const adapter = useTransitionsAdapter()
        const { loading } = adapter.useData()

        return (
          <div data-testid="loading" data-oid="obv4krg">
            {loading.toString()}
          </div>
        )
      }

      render(<TestComponent data-oid="q:1m95n" />)

      expect(screen.getByTestId("loading")).toHaveTextContent("true")
    })

    it("should handle error state", () => {
      // Set mock data
      mockUnifiedAdapterReturn.items = []
      mockUnifiedAdapterReturn.loading = false
      mockUnifiedAdapterReturn.error = "Failed to load transitions"

      function TestComponent() {
        const adapter = useTransitionsAdapter()
        const { error } = adapter.useData()

        return (
          <div data-testid="error" data-oid="pqzqa_j">
            {error?.message || "null"}
          </div>
        )
      }

      render(<TestComponent data-oid="7n8s_wa" />)

      expect(screen.getByTestId("error")).toHaveTextContent("Failed to load transitions")
    })
  })

  describe("customHandlers", () => {
    it("should provide getSortValue handler", () => {
      const mockTransition = {
        id: "1",
        name: "fade",
        type: "fade",
        category: "basic",
        complexity: "basic",
        labels: {
          ru: "Плавное затухание",
          en: "Fade",
        },
        duration: {
          default: 1,
        },
      }

      const mockGetSortValue = vi.fn((item, sortBy) => {
        if (sortBy === "name") return item.labels?.ru || item.name
        if (sortBy === "category") return item.category
        if (sortBy === "duration") return item.duration?.default || 1
        return item.name
      })

      // Set mock data
      mockUnifiedAdapterReturn.items = [mockTransition]
      mockUnifiedAdapterReturn.loading = false
      mockUnifiedAdapterReturn.error = null
      mockUnifiedAdapterReturn.getSortValue = mockGetSortValue

      function TestComponent() {
        const adapter = useTransitionsAdapter()
        const nameValue = adapter.getSortValue(mockTransition as any, "name")
        const categoryValue = adapter.getSortValue(mockTransition as any, "category")
        const durationValue = adapter.getSortValue(mockTransition as any, "duration")

        return (
          <div data-oid="a5.vtzl">
            <div data-testid="name-value" data-oid="hfnsfcq">
              {String(nameValue)}
            </div>
            <div data-testid="category-value" data-oid="6-01grn">
              {String(categoryValue)}
            </div>
            <div data-testid="duration-value" data-oid="r56lowr">
              {String(durationValue)}
            </div>
          </div>
        )
      }

      render(<TestComponent data-oid="zcjf-9z" />)

      expect(mockGetSortValue).toHaveBeenCalledWith(mockTransition, "name")
      expect(mockGetSortValue).toHaveBeenCalledWith(mockTransition, "category")
      expect(mockGetSortValue).toHaveBeenCalledWith(mockTransition, "duration")
    })

    it("should provide getSearchableText handler", () => {
      const mockTransition = {
        id: "1",
        name: "fade",
        type: "fade",
        category: "basic",
        complexity: "basic",
        labels: {
          ru: "Плавное затухание",
          en: "Fade",
        },
        description: {
          ru: "Плавный переход",
          en: "Smooth transition",
        },
        tags: ["smooth", "basic"],
      }

      const mockGetSearchableText = vi.fn((item) => [
        item.name,
        item.labels?.ru,
        item.labels?.en,
        item.description?.ru,
        item.description?.en,
        item.category,
        item.type,
        ...(item.tags || []),
      ])

      // Set mock data
      mockUnifiedAdapterReturn.items = [mockTransition]
      mockUnifiedAdapterReturn.loading = false
      mockUnifiedAdapterReturn.error = null
      mockUnifiedAdapterReturn.getSearchableText = mockGetSearchableText

      function TestComponent() {
        const adapter = useTransitionsAdapter()
        const searchableText = adapter.getSearchableText(mockTransition as any)

        return (
          <div data-testid="searchable" data-oid="64na9pn">
            {searchableText.join(", ")}
          </div>
        )
      }

      render(<TestComponent data-oid="716e4o0" />)

      expect(mockGetSearchableText).toHaveBeenCalledWith(mockTransition)
    })

    it("should provide getGroupValue handler", () => {
      const mockTransition = {
        id: "1",
        name: "fade",
        type: "fade",
        category: "basic",
        complexity: "basic",
        duration: {
          default: 0.5,
        },
        tags: ["smooth"],
      }

      const mockGetGroupValue = vi.fn((item, groupBy) => {
        if (groupBy === "category") return item.category
        if (groupBy === "complexity") return item.complexity
        if (groupBy === "type") return item.type
        if (groupBy === "duration") {
          const duration = item.duration?.default || 1
          if (duration <= 1) return "Короткие (≤1с)"
          if (duration <= 3) return "Средние (1-3с)"
          return "Длинные (>3с)"
        }
        return ""
      })

      // Set mock data
      mockUnifiedAdapterReturn.items = [mockTransition]
      mockUnifiedAdapterReturn.loading = false
      mockUnifiedAdapterReturn.error = null
      mockUnifiedAdapterReturn.getGroupValue = mockGetGroupValue

      function TestComponent() {
        const adapter = useTransitionsAdapter()
        const categoryGroup = adapter.getGroupValue(mockTransition as any, "category")
        const durationGroup = adapter.getGroupValue(mockTransition as any, "duration")

        return (
          <div data-oid="u7sqdvc">
            <div data-testid="category-group" data-oid="03w.e0a">
              {categoryGroup}
            </div>
            <div data-testid="duration-group" data-oid="17lejtt">
              {durationGroup}
            </div>
          </div>
        )
      }

      render(<TestComponent data-oid="yvsyzcb" />)

      expect(mockGetGroupValue).toHaveBeenCalledWith(mockTransition, "category")
      expect(mockGetGroupValue).toHaveBeenCalledWith(mockTransition, "duration")
    })

    it("should provide matchesFilter handler", () => {
      const mockTransition = {
        id: "1",
        name: "fade",
        type: "fade",
        category: "basic",
        complexity: "basic",
      }

      const mockMatchesFilter = vi.fn((item, filterType) => {
        if (filterType === "all") return true
        if (["basic", "intermediate", "advanced"].includes(filterType)) {
          return item.complexity === filterType
        }
        if (["basic", "advanced", "creative", "3d"].includes(filterType)) {
          return item.category === filterType
        }
        return true
      })

      // Set mock data
      mockUnifiedAdapterReturn.items = [mockTransition]
      mockUnifiedAdapterReturn.loading = false
      mockUnifiedAdapterReturn.error = null
      mockUnifiedAdapterReturn.matchesFilter = mockMatchesFilter

      function TestComponent() {
        const adapter = useTransitionsAdapter()
        const matchesAll = adapter.matchesFilter?.(mockTransition as any, "all")
        const matchesBasic = adapter.matchesFilter?.(mockTransition as any, "basic")
        const matchesAdvanced = adapter.matchesFilter?.(mockTransition as any, "advanced")

        return (
          <div data-oid="4-fqs2b">
            <div data-testid="matches-all" data-oid="c.nfrdk">
              {matchesAll?.toString()}
            </div>
            <div data-testid="matches-basic" data-oid="y2qrw8h">
              {matchesBasic?.toString()}
            </div>
            <div data-testid="matches-advanced" data-oid="5u3:ku1">
              {matchesAdvanced?.toString()}
            </div>
          </div>
        )
      }

      render(<TestComponent data-oid="jdsq:-f" />)

      expect(mockMatchesFilter).toHaveBeenCalledWith(mockTransition, "all")
      expect(mockMatchesFilter).toHaveBeenCalledWith(mockTransition, "basic")
      expect(mockMatchesFilter).toHaveBeenCalledWith(mockTransition, "advanced")
    })
  })

  describe("favoriteType", () => {
    it("should have transition favorite type", () => {
      function TestComponent() {
        const adapter = useTransitionsAdapter()

        return (
          <div data-testid="favorite-type" data-oid="4s0-g4y">
            {adapter.favoriteType}
          </div>
        )
      }

      render(<TestComponent data-oid="615.91v" />)

      expect(screen.getByTestId("favorite-type")).toHaveTextContent("transition")
    })
  })

  describe("isFavorite", () => {
    it("should check if transition is favorite", async () => {
      const mockTransition = {
        id: "1",
        name: "fade",
        type: "fade",
        category: "basic",
        complexity: "basic",
      }

      const { useFavorites } = await vi.importMock<typeof import("@/core/hooks")>("@/core/hooks")
      const mockIsItemFavorite = vi.fn(() => true)

      vi.mocked(useFavorites).mockReturnValue({
        isItemFavorite: mockIsItemFavorite,
        addFavorite: vi.fn(),
        removeFavorite: vi.fn(),
      } as any)

      function TestComponent() {
        const adapter = useTransitionsAdapter()
        const isFavorite = adapter.isFavorite ? adapter.isFavorite(mockTransition as any) : false

        return (
          <div data-testid="is-favorite" data-oid="egp8k88">
            {isFavorite.toString()}
          </div>
        )
      }

      render(<TestComponent data-oid="hjqdmyd" />)

      expect(mockIsItemFavorite).toHaveBeenCalledWith(mockTransition, "transition")
      expect(screen.getByTestId("is-favorite")).toHaveTextContent("true")
    })
  })
})
