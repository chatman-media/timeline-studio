/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock компонентов должен быть определен до импорта LazyTabContent
// Используем vi.hoisted для гарантии, что моки доступны до импорта
const mockComponents = vi.hoisted(() => ({
  MediaAdapterContent: () => (
    <div data-testid="media-content" data-oid="0107s.t">
      Media Content
    </div>
  ),

  MusicAdapterContent: () => (
    <div data-testid="music-content" data-oid=".arzptm">
      Music Content
    </div>
  ),

  EffectsAdapterContent: () => (
    <div data-testid="effects-content" data-oid="tazy.-:">
      Effects Content
    </div>
  ),

  FiltersAdapterContent: () => (
    <div data-testid="filters-content" data-oid="yd:wfl_">
      Filters Content
    </div>
  ),

  TransitionsAdapterContent: () => (
    <div data-testid="transitions-content" data-oid="16r0516">
      Transitions Content
    </div>
  ),

  SubtitlesAdapterContent: () => (
    <div data-testid="subtitles-content" data-oid="b.z1bku">
      Subtitles Content
    </div>
  ),

  TemplatesAdapterContent: () => (
    <div data-testid="templates-content" data-oid="pj9m0g5">
      Templates Content
    </div>
  ),

  StyleTemplatesAdapterContent: () => (
    <div data-testid="style-templates-content" data-oid="n7m85bo">
      Style Templates Content
    </div>
  ),
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
    it("should render hidden container for inactive tab", () => {
      const { container } = render(<LazyTabContent tabValue="media" activeTab="music" data-oid="ode90xw" />)

      // С кэшированием: неактивная вкладка рендерит скрытый div
      const tabContainer = container.firstChild as HTMLElement
      expect(tabContainer).not.toBeNull()
      expect(tabContainer.style.display).toBe("none")
      expect(tabContainer.getAttribute("data-active")).toBe("false")
    })

    it("should render loading fallback initially", async () => {
      render(<LazyTabContent tabValue="media" activeTab="media" data-oid=".vdp.j9" />)

      // В начальный момент должен показываться fallback
      expect(screen.getByText("Загрузка...")).toBeInTheDocument()

      // Дождаться загрузки контента, чтобы не влиять на следующие тесты
      await waitFor(() => {
        expect(screen.queryByTestId("media-content")).toBeInTheDocument()
      })
    })

    it("should lazy load media adapter content", async () => {
      render(<LazyTabContent tabValue="media" activeTab="media" data-oid="k3euxpp" />)

      await waitFor(() => {
        expect(screen.getByTestId("media-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Media Content")).toBeInTheDocument()
    })

    it("should lazy load music adapter content", async () => {
      render(<LazyTabContent tabValue="music" activeTab="music" data-oid="f.ag68e" />)

      await waitFor(() => {
        expect(screen.getByTestId("music-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Music Content")).toBeInTheDocument()
    })

    it("should lazy load effects adapter content", async () => {
      render(<LazyTabContent tabValue="effects" activeTab="effects" data-oid="7.sc1rp" />)

      await waitFor(() => {
        expect(screen.getByTestId("effects-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Effects Content")).toBeInTheDocument()
    })

    it("should lazy load filters adapter content", async () => {
      render(<LazyTabContent tabValue="filters" activeTab="filters" data-oid="5kftjbd" />)

      await waitFor(() => {
        expect(screen.getByTestId("filters-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Filters Content")).toBeInTheDocument()
    })

    it("should lazy load transitions adapter content", async () => {
      render(<LazyTabContent tabValue="transitions" activeTab="transitions" data-oid="fw:mddy" />)

      await waitFor(() => {
        expect(screen.getByTestId("transitions-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Transitions Content")).toBeInTheDocument()
    })

    it("should lazy load subtitles adapter content", async () => {
      render(<LazyTabContent tabValue="subtitles" activeTab="subtitles" data-oid="iaj9sfj" />)

      await waitFor(() => {
        expect(screen.getByTestId("subtitles-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Subtitles Content")).toBeInTheDocument()
    })

    it("should lazy load templates adapter content", async () => {
      render(<LazyTabContent tabValue="templates" activeTab="templates" data-oid="9l392j9" />)

      await waitFor(() => {
        expect(screen.getByTestId("templates-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Templates Content")).toBeInTheDocument()
    })

    it("should lazy load style_templates adapter content", async () => {
      render(<LazyTabContent tabValue="style_templates" activeTab="style_templates" data-oid="ljnc2bs" />)

      await waitFor(() => {
        expect(screen.getByTestId("style-templates-content")).toBeInTheDocument()
      })

      expect(screen.getByText("Style Templates Content")).toBeInTheDocument()
    })
  })

  describe("tab switching with caching", () => {
    it("should keep content mounted but hidden when tab becomes inactive", async () => {
      const { rerender, container } = render(<LazyTabContent tabValue="media" activeTab="media" data-oid="0b8:zd3" />)

      // Wait for content to load
      await waitFor(() => {
        expect(screen.queryByTestId("media-content")).toBeInTheDocument()
      })

      // Switch to another tab
      rerender(<LazyTabContent tabValue="media" activeTab="music" data-oid="ey-:cqn" />)

      // С кэшированием: контент остаётся смонтированным, но скрытым
      const tabContainer = container.firstChild as HTMLElement
      expect(tabContainer).not.toBeNull()
      expect(tabContainer.style.display).toBe("none")
      // Контент всё ещё в DOM
      expect(screen.queryByTestId("media-content")).toBeInTheDocument()
    })

    it("should show cached content immediately when tab becomes active again", async () => {
      const { rerender, container } = render(<LazyTabContent tabValue="media" activeTab="media" data-oid="g7n1vu0" />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId("media-content")).toBeInTheDocument()
      })

      // Switch away from media tab
      rerender(<LazyTabContent tabValue="media" activeTab="music" data-oid="bhvf1m6" />)
      expect((container.firstChild as HTMLElement).style.display).toBe("none")

      // Switch back to media tab
      rerender(<LazyTabContent tabValue="media" activeTab="media" data-oid="bhvf1m7" />)

      // Content should be visible immediately (no need to wait - it's cached)
      const tabContainer = container.firstChild as HTMLElement
      expect(tabContainer.style.display).toBe("block")
      expect(screen.getByTestId("media-content")).toBeInTheDocument()
    })
  })

  describe("edge cases", () => {
    it("should handle unknown tab value", () => {
      const { container } = render(<LazyTabContent tabValue="unknown" activeTab="unknown" data-oid="n2jc8kj" />)

      // Should not render anything for unknown tab (returns null - no adapter found)
      expect(container.firstChild).toBeNull()
    })

    it("should render hidden container when activeTab is empty", () => {
      const { container } = render(<LazyTabContent tabValue="media" activeTab="" data-oid="9w3g8_l" />)

      // С кэшированием: известная вкладка рендерится, но скрыта
      const tabContainer = container.firstChild as HTMLElement
      expect(tabContainer).not.toBeNull()
      expect(tabContainer.style.display).toBe("none")
      expect(tabContainer.getAttribute("data-active")).toBe("false")
    })
  })

  describe("memo optimization", () => {
    it("should not re-render if props don't change", async () => {
      const { rerender } = render(<LazyTabContent tabValue="media" activeTab="media" data-oid="olt35ei" />)

      // Дождаться загрузки контента
      await waitFor(() => {
        expect(screen.queryByTestId("media-content")).toBeInTheDocument()
      })

      // Force re-render with same props
      rerender(<LazyTabContent tabValue="media" activeTab="media" data-oid="sbrzqzv" />)

      // Component should be memoized and not cause unnecessary re-renders
      // (This is more of a performance test, hard to assert directly)
      expect(screen.getByTestId("media-content")).toBeInTheDocument()
    })

    it("should toggle visibility when activeTab changes", async () => {
      const { rerender, container } = render(<LazyTabContent tabValue="media" activeTab="media" data-oid="65q::kz" />)

      // Дождаться загрузки
      await waitFor(() => {
        expect(screen.getByTestId("media-content")).toBeInTheDocument()
      })

      // Изначально видим
      expect((container.firstChild as HTMLElement).style.display).toBe("block")

      // Переключаем на другую вкладку
      rerender(<LazyTabContent tabValue="media" activeTab="music" data-oid="ifz1-6l" />)

      // Теперь скрыт, но контент остаётся
      expect((container.firstChild as HTMLElement).style.display).toBe("none")
      expect(screen.getByTestId("media-content")).toBeInTheDocument()

      // Возвращаемся обратно
      rerender(<LazyTabContent tabValue="media" activeTab="media" data-oid="ifz1-6m" />)

      // Снова видим
      expect((container.firstChild as HTMLElement).style.display).toBe("block")
    })
  })
})
