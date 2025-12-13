/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock компонентов должен быть определен до импорта LazyTabContent
// Используем vi.hoisted для гарантии, что моки доступны до импорта
const mockComponents = vi.hoisted(() => ({
  MediaAdapterContent: () => <div data-testid="media-content">Media Content</div>,
  MusicAdapterContent: () => <div data-testid="music-content">Music Content</div>,
  EffectsAdapterContent: () => <div data-testid="effects-content">Effects Content</div>,
  FiltersAdapterContent: () => <div data-testid="filters-content">Filters Content</div>,
  TransitionsAdapterContent: () => <div data-testid="transitions-content">Transitions Content</div>,
  SubtitlesAdapterContent: () => <div data-testid="subtitles-content">Subtitles Content</div>,
  TemplatesAdapterContent: () => <div data-testid="templates-content">Templates Content</div>,
  StyleTemplatesAdapterContent: () => <div data-testid="style-templates-content">Style Templates Content</div>,
}))

// Mock динамических импортов для React.lazy()
vi.mock("@/features/browser/components/tab-adapters/media-adapter-content", () => ({
  MediaAdapterContent: mockComponents.MediaAdapterContent,
  default: mockComponents.MediaAdapterContent,
}))

vi.mock("@/features/browser/components/tab-adapters/music-adapter-content", () => ({
  MusicAdapterContent: mockComponents.MusicAdapterContent,
  default: mockComponents.MusicAdapterContent,
}))

vi.mock("@/features/browser/components/tab-adapters/effects-adapter-content", () => ({
  EffectsAdapterContent: mockComponents.EffectsAdapterContent,
  default: mockComponents.EffectsAdapterContent,
}))

vi.mock("@/features/browser/components/tab-adapters/filters-adapter-content", () => ({
  FiltersAdapterContent: mockComponents.FiltersAdapterContent,
  default: mockComponents.FiltersAdapterContent,
}))

vi.mock("@/features/browser/components/tab-adapters/transitions-adapter-content", () => ({
  TransitionsAdapterContent: mockComponents.TransitionsAdapterContent,
  default: mockComponents.TransitionsAdapterContent,
}))

vi.mock("@/features/browser/components/tab-adapters/subtitles-adapter-content", () => ({
  SubtitlesAdapterContent: mockComponents.SubtitlesAdapterContent,
  default: mockComponents.SubtitlesAdapterContent,
}))

vi.mock("@/features/browser/components/tab-adapters/templates-adapter-content", () => ({
  TemplatesAdapterContent: mockComponents.TemplatesAdapterContent,
  default: mockComponents.TemplatesAdapterContent,
}))

vi.mock("@/features/browser/components/tab-adapters/style-templates-adapter-content", () => ({
  StyleTemplatesAdapterContent: mockComponents.StyleTemplatesAdapterContent,
  default: mockComponents.StyleTemplatesAdapterContent,
}))

import { LazyTabContent } from "@/features/browser/components/lazy-tab-content"

describe("LazyTabContent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("rendering", () => {
    it("should not render anything for inactive tab", () => {
      const { container } = render(<LazyTabContent tabValue="media" activeTab="music" />)

      expect(container.firstChild).toBeNull()
    })

    it("should render loading fallback initially", async () => {
      render(<LazyTabContent tabValue="media" activeTab="media" />)

      // В начальный момент должен показываться fallback
      expect(screen.getByText("Загрузка...")).toBeInTheDocument()

      // Дождаться загрузки контента, чтобы не влиять на следующие тесты
      await waitFor(() => {
        expect(screen.queryByTestId("media-content")).toBeInTheDocument()
      })
    })

    it("should lazy load media adapter content", async () => {
      render(<LazyTabContent tabValue="media" activeTab="media" />)

      await waitFor(() => {
        expect(screen.getByTestId("media-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Media Content")).toBeInTheDocument()
    })

    it("should lazy load music adapter content", async () => {
      render(<LazyTabContent tabValue="music" activeTab="music" />)

      await waitFor(() => {
        expect(screen.getByTestId("music-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Music Content")).toBeInTheDocument()
    })

    it("should lazy load effects adapter content", async () => {
      render(<LazyTabContent tabValue="effects" activeTab="effects" />)

      await waitFor(() => {
        expect(screen.getByTestId("effects-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Effects Content")).toBeInTheDocument()
    })

    it("should lazy load filters adapter content", async () => {
      render(<LazyTabContent tabValue="filters" activeTab="filters" />)

      await waitFor(() => {
        expect(screen.getByTestId("filters-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Filters Content")).toBeInTheDocument()
    })

    it("should lazy load transitions adapter content", async () => {
      render(<LazyTabContent tabValue="transitions" activeTab="transitions" />)

      await waitFor(() => {
        expect(screen.getByTestId("transitions-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Transitions Content")).toBeInTheDocument()
    })

    it("should lazy load subtitles adapter content", async () => {
      render(<LazyTabContent tabValue="subtitles" activeTab="subtitles" />)

      await waitFor(() => {
        expect(screen.getByTestId("subtitles-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Subtitles Content")).toBeInTheDocument()
    })

    it("should lazy load templates adapter content", async () => {
      render(<LazyTabContent tabValue="templates" activeTab="templates" />)

      await waitFor(() => {
        expect(screen.getByTestId("templates-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Templates Content")).toBeInTheDocument()
    })

    it("should lazy load style_templates adapter content", async () => {
      render(<LazyTabContent tabValue="style_templates" activeTab="style_templates" />)

      await waitFor(() => {
        expect(screen.getByTestId("style-templates-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Style Templates Content")).toBeInTheDocument()
    })
  })

  describe("tab switching", () => {
    it("should unload content when tab becomes inactive", async () => {
      const { rerender, container } = render(<LazyTabContent tabValue="media" activeTab="media" />)

      // Wait for content to load
      await waitFor(() => {
        expect(screen.queryByTestId("media-content")).toBeInTheDocument()
      })

      // Switch to another tab
      rerender(<LazyTabContent tabValue="media" activeTab="music" />)

      // Content should be unloaded
      expect(container.firstChild).toBeNull()
    })

    it("should reload content when tab becomes active again", async () => {
      const { rerender } = render(<LazyTabContent tabValue="media" activeTab="music" />)

      // Initially not rendered
      expect(screen.queryByTestId("media-content")).not.toBeInTheDocument()

      // Switch to media tab
      rerender(<LazyTabContent tabValue="media" activeTab="media" />)

      // Content should load
      await waitFor(() => {
        expect(screen.getByTestId("media-content")).toBeInTheDocument()
      })
    })
  })

  describe("edge cases", () => {
    it("should handle unknown tab value", () => {
      const { container } = render(<LazyTabContent tabValue="unknown" activeTab="unknown" />)

      // Should not render anything for unknown tab (returns null)
      expect(container.firstChild).toBeNull()
    })

    it("should handle null activeTab", () => {
      const { container } = render(<LazyTabContent tabValue="media" activeTab="" />)

      // Should not render anything
      expect(container.firstChild).toBeNull()
    })
  })

  describe("memo optimization", () => {
    it("should not re-render if props don't change", async () => {
      const { rerender } = render(<LazyTabContent tabValue="media" activeTab="media" />)

      // Дождаться загрузки контента
      await waitFor(() => {
        expect(screen.queryByTestId("media-content")).toBeInTheDocument()
      })

      // Force re-render with same props
      rerender(<LazyTabContent tabValue="media" activeTab="media" />)

      // Component should be memoized and not cause unnecessary re-renders
      // (This is more of a performance test, hard to assert directly)
      expect(screen.getByTestId("media-content")).toBeInTheDocument()
    })

    it("should re-render when activeTab changes", async () => {
      const { rerender } = render(<LazyTabContent tabValue="media" activeTab="music" />)

      expect(screen.queryByTestId("media-content")).not.toBeInTheDocument()

      rerender(<LazyTabContent tabValue="media" activeTab="media" />)

      await waitFor(() => {
        expect(screen.getByTestId("media-content")).toBeInTheDocument()
      })
    })
  })
})
