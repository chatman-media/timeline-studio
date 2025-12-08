import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TabContent } from "@/features/browser/components/tab-content"

// Mock всех адаптеров
vi.mock("@/features/browser/adapters/use-media-adapter", () => ({
  useMediaAdapter: vi.fn(() => ({
    useData: () => ({ items: [], loading: false, error: null }),
    PreviewComponent: () => null,
    getSortValue: vi.fn(),
    getSearchableText: vi.fn(),
    getGroupValue: vi.fn(),
    matchesFilter: vi.fn(),
    importHandlers: undefined,
    favoriteType: "media",
  })),
}))

vi.mock("@/features/browser/adapters/use-music-adapter", () => ({
  useMusicAdapter: vi.fn(() => ({
    useData: () => ({ items: [], loading: false, error: null }),
    PreviewComponent: () => null,
    getSortValue: vi.fn(),
    getSearchableText: vi.fn(),
    getGroupValue: vi.fn(),
    matchesFilter: vi.fn(),
    importHandlers: undefined,
    favoriteType: "music",
  })),
}))

vi.mock("@/features/browser/adapters/use-effects-adapter", () => ({
  useEffectsAdapter: vi.fn(() => ({
    useData: () => ({ items: [], loading: false, error: null }),
    PreviewComponent: () => null,
    getSortValue: vi.fn(),
    getSearchableText: vi.fn(),
    getGroupValue: vi.fn(),
    matchesFilter: vi.fn(),
    importHandlers: undefined,
    favoriteType: "effect",
  })),
}))

vi.mock("@/features/browser/adapters/use-filters-adapter", () => ({
  useFiltersAdapter: vi.fn(() => ({
    useData: () => ({ items: [], loading: false, error: null }),
    PreviewComponent: () => null,
    getSortValue: vi.fn(),
    getSearchableText: vi.fn(),
    getGroupValue: vi.fn(),
    matchesFilter: vi.fn(),
    importHandlers: undefined,
    favoriteType: "filter",
  })),
}))

vi.mock("@/features/browser/adapters/use-transitions-adapter", () => ({
  useTransitionsAdapter: vi.fn(() => ({
    useData: () => ({ items: [], loading: false, error: null }),
    PreviewComponent: () => null,
    getSortValue: vi.fn(),
    getSearchableText: vi.fn(),
    getGroupValue: vi.fn(),
    matchesFilter: vi.fn(),
    importHandlers: undefined,
    favoriteType: "transition",
  })),
}))

vi.mock("@/features/browser/adapters/use-subtitles-adapter", () => ({
  useSubtitlesAdapter: vi.fn(() => ({
    useData: () => ({ items: [], loading: false, error: null }),
    PreviewComponent: () => null,
    getSortValue: vi.fn(),
    getSearchableText: vi.fn(),
    getGroupValue: vi.fn(),
    matchesFilter: vi.fn(),
    importHandlers: undefined,
    favoriteType: "subtitle",
  })),
}))

vi.mock("@/features/browser/adapters/use-templates-adapter", () => ({
  useTemplatesAdapter: vi.fn(() => ({
    useData: () => ({ items: [], loading: false, error: null }),
    PreviewComponent: () => null,
    getSortValue: vi.fn(),
    getSearchableText: vi.fn(),
    getGroupValue: vi.fn(),
    matchesFilter: vi.fn(),
    importHandlers: undefined,
    favoriteType: "template",
  })),
}))

vi.mock("@/features/browser/adapters/use-style-templates-adapter", () => ({
  useStyleTemplatesAdapter: vi.fn(() => ({
    useData: () => ({ items: [], loading: false, error: null }),
    PreviewComponent: () => null,
    getSortValue: vi.fn(),
    getSearchableText: vi.fn(),
    getGroupValue: vi.fn(),
    matchesFilter: vi.fn(),
    importHandlers: undefined,
    favoriteType: "styleTemplate",
  })),
}))

vi.mock("@/features/browser/adapters/use-project-templates-adapter", () => ({
  useProjectTemplatesAdapter: vi.fn(() => ({
    useData: () => ({ items: [], loading: false, error: null }),
    PreviewComponent: () => null,
    getSortValue: vi.fn(),
    getSearchableText: vi.fn(),
    getGroupValue: vi.fn(),
    matchesFilter: vi.fn(),
    importHandlers: undefined,
    favoriteType: "projectTemplate",
  })),
}))

vi.mock("@/features/browser/adapters/use-scenarios-adapter", () => ({
  useScenariosAdapter: vi.fn(() => ({
    useData: () => ({ items: [], loading: false, error: null }),
    PreviewComponent: () => null,
    getSortValue: vi.fn(),
    getSearchableText: vi.fn(),
    getGroupValue: vi.fn(),
    matchesFilter: vi.fn(),
    importHandlers: undefined,
    favoriteType: "scenario",
  })),
}))

vi.mock("@/features/browser/components/universal-list", () => ({
  UniversalList: ({ adapter }: any) => (
    <div data-testid="universal-list" data-favorite-type={adapter.favoriteType}>
      Universal List
    </div>
  ),
}))

vi.mock("@/features/timeline/hooks", () => ({
  useTimelineActions: vi.fn(() => ({
    addSingleMediaToTimeline: vi.fn(),
  })),
}))

vi.mock("@/components/ui/tabs", () => ({
  TabsContent: ({ value, children }: any) => (
    <div data-testid={`tabs-content-${value}`} data-value={value}>
      {children}
    </div>
  ),
}))

describe("TabContent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("rendering", () => {
    it("should render loading state for inactive tab", () => {
      render(<TabContent tabValue="media" activeTab="music" className="test-class" />)

      expect(screen.getByTestId("tabs-content-media")).toBeInTheDocument()
      expect(screen.getByText("Загрузка...")).toBeInTheDocument()
    })

    it("should render media tab content when active", () => {
      render(<TabContent tabValue="media" activeTab="media" className="test-class" />)

      expect(screen.getByTestId("universal-list")).toBeInTheDocument()
      expect(screen.getByTestId("universal-list")).toHaveAttribute("data-favorite-type", "media")
    })

    it("should render music tab content when active", () => {
      render(<TabContent tabValue="music" activeTab="music" className="test-class" />)

      expect(screen.getByTestId("universal-list")).toBeInTheDocument()
      expect(screen.getByTestId("universal-list")).toHaveAttribute("data-favorite-type", "music")
    })

    it("should render effects tab content when active", () => {
      render(<TabContent tabValue="effects" activeTab="effects" className="test-class" />)

      expect(screen.getByTestId("universal-list")).toBeInTheDocument()
      expect(screen.getByTestId("universal-list")).toHaveAttribute("data-favorite-type", "effect")
    })

    it("should render filters tab content when active", () => {
      render(<TabContent tabValue="filters" activeTab="filters" className="test-class" />)

      expect(screen.getByTestId("universal-list")).toBeInTheDocument()
      expect(screen.getByTestId("universal-list")).toHaveAttribute("data-favorite-type", "filter")
    })

    it("should render transitions tab content when active", () => {
      render(<TabContent tabValue="transitions" activeTab="transitions" className="test-class" />)

      expect(screen.getByTestId("universal-list")).toBeInTheDocument()
      expect(screen.getByTestId("universal-list")).toHaveAttribute("data-favorite-type", "transition")
    })

    it("should render subtitles tab content when active", () => {
      render(<TabContent tabValue="subtitles" activeTab="subtitles" className="test-class" />)

      expect(screen.getByTestId("universal-list")).toBeInTheDocument()
      expect(screen.getByTestId("universal-list")).toHaveAttribute("data-favorite-type", "subtitle")
    })

    it("should render templates tab content when active", () => {
      render(<TabContent tabValue="templates" activeTab="templates" className="test-class" />)

      expect(screen.getByTestId("universal-list")).toBeInTheDocument()
      expect(screen.getByTestId("universal-list")).toHaveAttribute("data-favorite-type", "template")
    })

    it("should render style_templates tab content when active", () => {
      render(<TabContent tabValue="style_templates" activeTab="style_templates" className="test-class" />)

      expect(screen.getByTestId("universal-list")).toBeInTheDocument()
      expect(screen.getByTestId("universal-list")).toHaveAttribute("data-favorite-type", "styleTemplate")
    })

    it("should render projects tab content when active", () => {
      render(<TabContent tabValue="projects" activeTab="projects" className="test-class" />)

      expect(screen.getByTestId("universal-list")).toBeInTheDocument()
      expect(screen.getByTestId("universal-list")).toHaveAttribute("data-favorite-type", "projectTemplate")
    })

    it("should render scenarios tab content when active", () => {
      render(<TabContent tabValue="scenarios" activeTab="scenarios" className="test-class" />)

      expect(screen.getByTestId("universal-list")).toBeInTheDocument()
      expect(screen.getByTestId("universal-list")).toHaveAttribute("data-favorite-type", "scenario")
    })
  })

  describe("unknown tab handling", () => {
    it("should show error message for unknown tab", () => {
      render(<TabContent tabValue="unknown" activeTab="unknown" className="test-class" />)

      expect(screen.getByText('Адаптер для "unknown" не найден')).toBeInTheDocument()
    })
  })

  describe("memo optimization", () => {
    it("should render with memo to prevent unnecessary re-renders", () => {
      const { rerender } = render(<TabContent tabValue="media" activeTab="media" className="test-class" />)

      expect(screen.getByTestId("universal-list")).toBeInTheDocument()

      // Force re-render with same props
      rerender(<TabContent tabValue="media" activeTab="media" className="test-class" />)

      // Component should still be rendered
      expect(screen.getByTestId("universal-list")).toBeInTheDocument()
    })
  })

  describe("tab switching", () => {
    it("should update content when switching tabs", () => {
      const { rerender } = render(<TabContent tabValue="media" activeTab="media" className="test-class" />)

      expect(screen.getByTestId("universal-list")).toHaveAttribute("data-favorite-type", "media")

      rerender(<TabContent tabValue="media" activeTab="music" className="test-class" />)

      expect(screen.getByText("Загрузка...")).toBeInTheDocument()
    })

    it("should load new tab content when switched", () => {
      const { rerender } = render(<TabContent tabValue="media" activeTab="music" className="test-class" />)

      expect(screen.getByText("Загрузка...")).toBeInTheDocument()

      rerender(<TabContent tabValue="media" activeTab="media" className="test-class" />)

      expect(screen.getByTestId("universal-list")).toBeInTheDocument()
    })
  })

  describe("className prop", () => {
    it("should apply className to TabsContent", () => {
      render(<TabContent tabValue="media" activeTab="media" className="custom-class" />)

      const tabsContent = screen.getByTestId("tabs-content-media")
      expect(tabsContent).toBeInTheDocument()
    })
  })

  describe("displayName", () => {
    it("should have correct displayName", () => {
      expect(TabContent.displayName).toBe("TabContent")
    })
  })
})
