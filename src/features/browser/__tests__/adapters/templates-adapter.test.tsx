/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest"

import { render, screen } from "@testing-library/react"
import type { JSX } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useTemplatesAdapter } from "@/features/browser/adapters/use-templates-adapter"
import type { MediaTemplate } from "@/features/templates/lib/templates"

// Вспомогательная функция для создания тестовых шаблонов
const createMockTemplate = (
  overrides: Partial<MediaTemplate> & Pick<MediaTemplate, "id" | "screens" | "split">,
): MediaTemplate & { name: string } => ({
  name: overrides.id, // ListItem требует name
  resizable: false,
  render: (() => null as unknown as JSX.Element) as () => JSX.Element,
  ...overrides,
})

// Mock модулей
vi.mock("@/domains/project-management/hooks", () => ({
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn(() => false),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
  })),
}))

vi.mock("@/features/project-settings", () => ({
  useProjectSettings: vi.fn(() => ({
    settings: {
      aspectRatio: {
        label: "16:9",
        value: {
          width: 1920,
          height: 1080,
        },
      },
    },
  })),
}))

vi.mock("@/features/templates/lib/templates", () => ({
  TEMPLATE_MAP: {
    landscape: [
      {
        id: "landscape-1",
        name: "landscape-1",
        screens: 1,
        split: "vertical" as const,
        resizable: false,
        render: () => null,
      },
      {
        id: "landscape-2",
        name: "landscape-2",
        screens: 2,
        split: "horizontal" as const,
        resizable: true,
        render: () => null,
      },
    ],
    portrait: [
      {
        id: "portrait-1",
        name: "portrait-1",
        screens: 1,
        split: "vertical" as const,
        resizable: false,
        render: () => null,
      },
    ],
    square: [
      {
        id: "square-1",
        name: "square-1",
        screens: 1,
        split: "grid" as const,
        resizable: false,
        render: () => null,
      },
    ],
  },
}))

describe("useTemplatesAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useData", () => {
    it("should return templates based on aspect ratio", () => {
      function TestComponent() {
        const adapter = useTemplatesAdapter()
        const { items, loading, error } = adapter.useData()

        return (
          <div>
            <div data-testid="items-count">{items.length}</div>
            <div data-testid="loading">{loading.toString()}</div>
            <div data-testid="error">{error?.message || "null"}</div>
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByTestId("items-count")).toHaveTextContent("2")
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
      expect(screen.getByTestId("error")).toHaveTextContent("null")
    })

    it("should update templates when aspect ratio changes", async () => {
      const { useProjectSettings } =
        await vi.importMock<typeof import("@/features/project-settings")>("@/features/project-settings")

      // First render with 16:9
      vi.mocked(useProjectSettings).mockReturnValue({
        settings: {
          aspectRatio: {
            label: "16:9",
            value: { width: 1920, height: 1080 },
          },
        },
      } as any)

      function TestComponent() {
        const adapter = useTemplatesAdapter()
        const { items } = adapter.useData()

        return <div data-testid="items-count">{items.length}</div>
      }

      const { rerender } = render(<TestComponent />)

      expect(screen.getByTestId("items-count")).toHaveTextContent("2")

      // Change to portrait
      vi.mocked(useProjectSettings).mockReturnValue({
        settings: {
          aspectRatio: {
            label: "9:16",
            value: { width: 1080, height: 1920 },
          },
        },
      } as any)

      rerender(<TestComponent />)

      // Should show portrait templates
      expect(screen.getByTestId("items-count")).toHaveTextContent("1")
    })
  })

  describe("getSortValue", () => {
    it("should sort by id/name", () => {
      const mockTemplate = createMockTemplate({
        id: "Template-One",
        screens: 2,
        split: "vertical",
        resizable: true,
      })

      function TestComponent() {
        const adapter = useTemplatesAdapter()
        const sortValue = adapter.getSortValue(mockTemplate, "name")

        return <div data-testid="sort-value">{sortValue}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("sort-value")).toHaveTextContent("template-one")
    })

    it("should sort by screens count", () => {
      const mockTemplate = createMockTemplate({
        id: "template-1",
        screens: 4,
        split: "grid",
        resizable: false,
      })

      function TestComponent() {
        const adapter = useTemplatesAdapter()
        const sortValue = adapter.getSortValue(mockTemplate, "screens")

        return <div data-testid="sort-value">{sortValue}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("sort-value")).toHaveTextContent("4")
    })

    it("should sort by resizable", () => {
      const mockTemplate = createMockTemplate({
        id: "template-1",
        screens: 2,
        split: "vertical",
        resizable: true,
      })

      function TestComponent() {
        const adapter = useTemplatesAdapter()
        const sortValue = adapter.getSortValue(mockTemplate, "resizable")

        return <div data-testid="sort-value">{sortValue}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("sort-value")).toHaveTextContent("1")
    })
  })

  describe("getSearchableText", () => {
    it("should return searchable fields", () => {
      const mockTemplate = createMockTemplate({
        id: "vertical-split",
        screens: 2,
        split: "vertical",
        resizable: true,
      })

      function TestComponent() {
        const adapter = useTemplatesAdapter()
        const searchableText = adapter.getSearchableText(mockTemplate)

        return <div data-testid="searchable">{searchableText.join(", ")}</div>
      }

      render(<TestComponent />)

      const text = screen.getByTestId("searchable").textContent
      expect(text).toContain("vertical-split")
      expect(text).toContain("vertical")
      expect(text).toContain("2")
      expect(text).toContain("resizable")
    })
  })

  describe("getGroupValue", () => {
    it("should group by split type", () => {
      const mockTemplate = createMockTemplate({
        id: "template-1",
        screens: 2,
        split: "horizontal",
        resizable: false,
      })

      function TestComponent() {
        const adapter = useTemplatesAdapter()
        const groupValue = adapter.getGroupValue(mockTemplate, "split")

        return <div data-testid="group-value">{groupValue}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("group-value")).toHaveTextContent("horizontal")
    })

    it("should group by screens count", () => {
      const mockTemplate = createMockTemplate({
        id: "template-1",
        screens: 3,
        split: "grid",
        resizable: false,
      })

      function TestComponent() {
        const adapter = useTemplatesAdapter()
        const groupValue = adapter.getGroupValue(mockTemplate, "screens")

        return <div data-testid="group-value">{groupValue}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("group-value")).toHaveTextContent("3-4 экрана")
    })

    it("should group by resizable", () => {
      const mockTemplate1 = createMockTemplate({
        id: "template-1",
        screens: 2,
        split: "vertical",
        resizable: true,
      })

      const mockTemplate2 = createMockTemplate({
        id: "template-2",
        screens: 2,
        split: "vertical",
        resizable: false,
      })

      function TestComponent() {
        const adapter = useTemplatesAdapter()
        const group1 = adapter.getGroupValue(mockTemplate1, "resizable")
        const group2 = adapter.getGroupValue(mockTemplate2, "resizable")

        return (
          <div>
            <div data-testid="group-1">{group1}</div>
            <div data-testid="group-2">{group2}</div>
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByTestId("group-1")).toHaveTextContent("Изменяемые")
      expect(screen.getByTestId("group-2")).toHaveTextContent("Фиксированные")
    })
  })

  describe("matchesFilter", () => {
    it("should match all filter", () => {
      const mockTemplate = createMockTemplate({
        id: "template-1",
        screens: 2,
        split: "vertical",
        resizable: false,
      })

      function TestComponent() {
        const adapter = useTemplatesAdapter()
        const matches = adapter.matchesFilter?.(mockTemplate, "all")

        return <div data-testid="matches">{matches?.toString()}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("matches")).toHaveTextContent("true")
    })

    it("should filter by split type", () => {
      const mockTemplate = createMockTemplate({
        id: "template-1",
        screens: 2,
        split: "vertical",
        resizable: false,
      })

      function TestComponent() {
        const adapter = useTemplatesAdapter()
        const matchesVertical = adapter.matchesFilter?.(mockTemplate, "vertical")
        const matchesHorizontal = adapter.matchesFilter?.(mockTemplate, "horizontal")

        return (
          <div>
            <div data-testid="matches-vertical">{matchesVertical?.toString()}</div>
            <div data-testid="matches-horizontal">{matchesHorizontal?.toString()}</div>
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByTestId("matches-vertical")).toHaveTextContent("true")
      expect(screen.getByTestId("matches-horizontal")).toHaveTextContent("false")
    })

    it("should filter by screens count", () => {
      const mockTemplate = createMockTemplate({
        id: "template-1",
        screens: 2,
        split: "vertical",
        resizable: false,
      })

      function TestComponent() {
        const adapter = useTemplatesAdapter()
        const matches2 = adapter.matchesFilter?.(mockTemplate, "screens-2")
        const matches3 = adapter.matchesFilter?.(mockTemplate, "screens-3")

        return (
          <div>
            <div data-testid="matches-2">{matches2?.toString()}</div>
            <div data-testid="matches-3">{matches3?.toString()}</div>
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByTestId("matches-2")).toHaveTextContent("true")
      expect(screen.getByTestId("matches-3")).toHaveTextContent("false")
    })

    it("should filter by resizable", () => {
      const resizableTemplate = createMockTemplate({
        id: "template-1",
        screens: 2,
        split: "vertical",
        resizable: true,
      })

      const fixedTemplate = createMockTemplate({
        id: "template-2",
        screens: 2,
        split: "vertical",
        resizable: false,
      })

      function TestComponent() {
        const adapter = useTemplatesAdapter()
        const resizableMatches = adapter.matchesFilter?.(resizableTemplate, "resizable")
        const fixedMatches = adapter.matchesFilter?.(fixedTemplate, "fixed")

        return (
          <div>
            <div data-testid="resizable-matches">{resizableMatches?.toString()}</div>
            <div data-testid="fixed-matches">{fixedMatches?.toString()}</div>
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByTestId("resizable-matches")).toHaveTextContent("true")
      expect(screen.getByTestId("fixed-matches")).toHaveTextContent("true")
    })
  })

  describe("favoriteType", () => {
    it("should have template favorite type", () => {
      function TestComponent() {
        const adapter = useTemplatesAdapter()

        return <div data-testid="favorite-type">{adapter.favoriteType}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("favorite-type")).toHaveTextContent("template")
    })
  })

  describe("importHandlers", () => {
    it("should not have import handlers", () => {
      function TestComponent() {
        const adapter = useTemplatesAdapter()

        return <div data-testid="has-import">{(adapter.importHandlers === undefined).toString()}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("has-import")).toHaveTextContent("true")
    })
  })
})
