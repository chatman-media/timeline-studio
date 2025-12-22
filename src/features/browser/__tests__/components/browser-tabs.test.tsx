/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BrowserTabs } from "../../components/browser-tabs"
import { EffectsProvider } from "../../providers/browser-resources-provider"

// Мокаем ленивые загрузчики ресурсов
vi.mock("../../services/resource-loaders", () => ({
  loadAllResourcesLazy: vi.fn().mockResolvedValue({
    effects: {
      success: true,
      data: [],
      source: "built-in",
      timestamp: Date.now(),
    },
    filters: {
      success: true,
      data: [],
      source: "built-in",
      timestamp: Date.now(),
    },
    transitions: {
      success: true,
      data: [],
      source: "built-in",
      timestamp: Date.now(),
    },
  }),
}))

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Мокаем иконки lucide
vi.mock("lucide-react", () => ({
  Clapperboard: () => <span data-testid="icon-clapperboard" data-oid="394fhs6" />,
  Music: () => <span data-testid="icon-music" data-oid=":plo-q4" />,
  Type: () => <span data-testid="icon-type" data-oid="hgltsh3" />,
  Sparkles: () => <span data-testid="icon-sparkles" data-oid="9d4jrji" />,
  Blend: () => <span data-testid="icon-blend" data-oid="4slp4rx" />,
  FlipHorizontal2: () => <span data-testid="icon-flip" data-oid="16emp6e" />,
  Video: () => <span data-testid="icon-video" data-oid="zo6afub" />,
  Sticker: () => <span data-testid="icon-sticker" data-oid="0ffkkr." />,
  LayoutTemplate: () => <span data-testid="icon-layouttemplate" data-oid="c9y1u9a" />,
  Wand2: () => <span data-testid="icon-wand2" data-oid="1niv1s8" />,
}))

describe("BrowserTabs", () => {
  const defaultProps = {
    activeTab: "media",
    onTabChange: vi.fn(),
  }

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<EffectsProvider data-oid="le3izk_">{component}</EffectsProvider>)
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен рендерить все активные вкладки", () => {
    renderWithProvider(<BrowserTabs {...defaultProps} data-oid="r31mb68" />)

    expect(screen.getByTestId("media-tab")).toBeInTheDocument()
    expect(screen.getByTestId("music-tab")).toBeInTheDocument()
    expect(screen.getByTestId("subtitles-tab")).toBeInTheDocument()
    expect(screen.getByTestId("effects-tab")).toBeInTheDocument()
    expect(screen.getByTestId("filters-tab")).toBeInTheDocument()
    expect(screen.getByTestId("transitions-tab")).toBeInTheDocument()
    expect(screen.getByTestId("templates-tab")).toBeInTheDocument()
    // style_templates, projects and scenarios tabs are temporarily disabled
    expect(screen.queryByTestId("style_templates-tab")).not.toBeInTheDocument()
    expect(screen.queryByTestId("projects-tab")).not.toBeInTheDocument()
    expect(screen.queryByTestId("scenarios-tab")).not.toBeInTheDocument()
  })

  it("должен отображать правильные иконки для каждой активной вкладки", () => {
    renderWithProvider(<BrowserTabs {...defaultProps} data-oid="q3p:30x" />)

    expect(screen.getByTestId("media-tab")).toContainElement(screen.getByTestId("icon-clapperboard"))
    expect(screen.getByTestId("music-tab")).toContainElement(screen.getByTestId("icon-music"))
    expect(screen.getByTestId("subtitles-tab")).toContainElement(screen.getByTestId("icon-type"))
    expect(screen.getByTestId("effects-tab")).toContainElement(screen.getByTestId("icon-sparkles"))
    expect(screen.getByTestId("filters-tab")).toContainElement(screen.getByTestId("icon-blend"))
    expect(screen.getByTestId("transitions-tab")).toContainElement(screen.getByTestId("icon-flip"))
    expect(screen.getByTestId("templates-tab")).toContainElement(screen.getByTestId("icon-video"))
  })

  it("должен отображать правильные метки для каждой активной вкладки", () => {
    renderWithProvider(<BrowserTabs {...defaultProps} data-oid="k0i6r70" />)

    expect(screen.getByTestId("media-tab")).toHaveTextContent("browser.tabs.media")
    expect(screen.getByTestId("music-tab")).toHaveTextContent("browser.tabs.music")
    expect(screen.getByTestId("subtitles-tab")).toHaveTextContent("browser.tabs.subtitles")
    expect(screen.getByTestId("effects-tab")).toHaveTextContent("browser.tabs.effects")
    expect(screen.getByTestId("filters-tab")).toHaveTextContent("browser.tabs.filters")
    expect(screen.getByTestId("transitions-tab")).toHaveTextContent("browser.tabs.transitions")
    expect(screen.getByTestId("templates-tab")).toHaveTextContent("browser.tabs.templates")
  })

  it("должен устанавливать правильные классы для активной вкладки", () => {
    renderWithProvider(<BrowserTabs {...defaultProps} activeTab="music" data-oid="cwk.hu5" />)

    // Активная вкладка имеет специальные классы
    const musicTab = screen.getByTestId("music-tab")
    expect(musicTab).toHaveClass("bg-background")
    expect(musicTab).toHaveClass("text-teal")

    // Неактивные вкладки не имеют этих классов
    const mediaTab = screen.getByTestId("media-tab")
    expect(mediaTab).toHaveClass("text-gray-600")
  })

  it("должен вызывать onTabChange при клике на неактивную вкладку", () => {
    const onTabChange = vi.fn()
    renderWithProvider(<BrowserTabs activeTab="media" onTabChange={onTabChange} data-oid="o5vh0c-" />)

    // Клик по неактивной вкладке
    fireEvent.click(screen.getByTestId("music-tab"))
    expect(onTabChange).toHaveBeenCalledWith("music")

    fireEvent.click(screen.getByTestId("effects-tab"))
    expect(onTabChange).toHaveBeenCalledWith("effects")

    fireEvent.click(screen.getByTestId("templates-tab"))
    expect(onTabChange).toHaveBeenCalledWith("templates")
  })

  it("должен не вызывать onTabChange при клике на активную вкладку", () => {
    const onTabChange = vi.fn()
    renderWithProvider(<BrowserTabs activeTab="media" onTabChange={onTabChange} data-oid="s7xe5gg" />)

    // Клик по активной вкладке
    fireEvent.click(screen.getByTestId("media-tab"))
    expect(onTabChange).not.toHaveBeenCalled()
  })

  it("должен применять правильные CSS классы к контейнеру вкладок", () => {
    const { container } = renderWithProvider(<BrowserTabs {...defaultProps} data-oid="dh0x0tc" />)

    const tabsContainer = container.querySelector("div")
    const expectedClasses = [
      "h-[50px]",
      "shrink-0",
      "flex",
      "justify-start",
      "border-none",
      "rounded-none",
      "dark:bg-[#2D2D2D]",
      "m-0",
      "p-0",
    ]

    expectedClasses.forEach((className) => {
      expect(tabsContainer).toHaveClass(className)
    })
  })

  it("должен обновляться при изменении activeTab", () => {
    const { rerender } = renderWithProvider(<BrowserTabs {...defaultProps} data-oid="kv5r1-1" />)

    expect(screen.getByTestId("media-tab")).toHaveClass("bg-background")

    // Перерендерим с новым activeTab
    rerender(
      <EffectsProvider data-oid="tc0kygk">
        <BrowserTabs {...defaultProps} activeTab="filters" data-oid="w:hb_o3" />
      </EffectsProvider>,
    )

    expect(screen.getByTestId("filters-tab")).toHaveClass("bg-background")
    expect(screen.getByTestId("media-tab")).toHaveClass("text-gray-600")
  })

  it("должен обрабатывать все активные вкладки", () => {
    const tabs = ["media", "music", "subtitles", "effects", "filters", "transitions", "templates"]

    tabs.forEach((tab) => {
      // Очищаем DOM перед каждым рендером
      const { unmount } = renderWithProvider(<BrowserTabs {...defaultProps} activeTab={tab} data-oid="vbg2yem" />)
      expect(screen.getByTestId(`${tab}-tab`)).toHaveClass("bg-background")
      unmount()
    })
  })
})
