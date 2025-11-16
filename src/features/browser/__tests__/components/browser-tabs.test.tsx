import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BrowserTabs } from "../../components/browser-tabs";
import { EffectsProvider } from "../../providers/browser-resources-provider";

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
}));

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Мокаем иконки lucide
vi.mock("lucide-react", () => ({
  Clapperboard: () => <span data-testid="icon-clapperboard" />,
  Music: () => <span data-testid="icon-music" />,
  Type: () => <span data-testid="icon-type" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
  Blend: () => <span data-testid="icon-blend" />,
  FlipHorizontal2: () => <span data-testid="icon-flip" />,
  Video: () => <span data-testid="icon-video" />,
  Sticker: () => <span data-testid="icon-sticker" />,
}));

describe("BrowserTabs", () => {
  const defaultProps = {
    activeTab: "media",
    onTabChange: vi.fn(),
  };

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<EffectsProvider>{component}</EffectsProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен рендерить все вкладки", () => {
    renderWithProvider(<BrowserTabs {...defaultProps} />);

    expect(screen.getByTestId("media-tab")).toBeInTheDocument();
    expect(screen.getByTestId("music-tab")).toBeInTheDocument();
    expect(screen.getByTestId("subtitles-tab")).toBeInTheDocument();
    expect(screen.getByTestId("effects-tab")).toBeInTheDocument();
    expect(screen.getByTestId("filters-tab")).toBeInTheDocument();
    expect(screen.getByTestId("transitions-tab")).toBeInTheDocument();
    expect(screen.getByTestId("templates-tab")).toBeInTheDocument();
    expect(screen.getByTestId("style-templates-tab")).toBeInTheDocument();
  });

  it("должен отображать правильные иконки для каждой вкладки", () => {
    renderWithProvider(<BrowserTabs {...defaultProps} />);

    expect(screen.getByTestId("media-tab")).toContainElement(
      screen.getByTestId("icon-clapperboard"),
    );
    expect(screen.getByTestId("music-tab")).toContainElement(
      screen.getByTestId("icon-music"),
    );
    expect(screen.getByTestId("subtitles-tab")).toContainElement(
      screen.getByTestId("icon-type"),
    );
    expect(screen.getByTestId("effects-tab")).toContainElement(
      screen.getByTestId("icon-sparkles"),
    );
    expect(screen.getByTestId("filters-tab")).toContainElement(
      screen.getByTestId("icon-blend"),
    );
    expect(screen.getByTestId("transitions-tab")).toContainElement(
      screen.getByTestId("icon-flip"),
    );
    expect(screen.getByTestId("templates-tab")).toContainElement(
      screen.getByTestId("icon-video"),
    );
    expect(screen.getByTestId("style-templates-tab")).toContainElement(
      screen.getByTestId("icon-sticker"),
    );
  });

  it("должен отображать правильные метки для каждой вкладки", () => {
    renderWithProvider(<BrowserTabs {...defaultProps} />);

    expect(screen.getByTestId("media-tab")).toHaveTextContent(
      "browser.tabs.media",
    );
    expect(screen.getByTestId("music-tab")).toHaveTextContent(
      "browser.tabs.music",
    );
    expect(screen.getByTestId("subtitles-tab")).toHaveTextContent(
      "browser.tabs.subtitles",
    );
    expect(screen.getByTestId("effects-tab")).toHaveTextContent(
      "browser.tabs.effects",
    );
    expect(screen.getByTestId("filters-tab")).toHaveTextContent(
      "browser.tabs.filters",
    );
    expect(screen.getByTestId("transitions-tab")).toHaveTextContent(
      "browser.tabs.transitions",
    );
    expect(screen.getByTestId("templates-tab")).toHaveTextContent(
      "browser.tabs.templates",
    );
    expect(screen.getByTestId("style-templates-tab")).toHaveTextContent(
      "browser.tabs.styleTemplates",
    );
  });

  it("должен устанавливать правильные классы для активной вкладки", () => {
    renderWithProvider(<BrowserTabs {...defaultProps} activeTab="music" />);

    // Активная вкладка имеет специальные классы
    const musicTab = screen.getByTestId("music-tab");
    expect(musicTab).toHaveClass("bg-background");
    expect(musicTab).toHaveClass("text-teal");

    // Неактивные вкладки не имеют этих классов
    const mediaTab = screen.getByTestId("media-tab");
    expect(mediaTab).toHaveClass("text-gray-600");
  });

  it("должен вызывать onTabChange при клике на неактивную вкладку", () => {
    const onTabChange = vi.fn();
    renderWithProvider(
      <BrowserTabs activeTab="media" onTabChange={onTabChange} />,
    );

    // Клик по неактивной вкладке
    fireEvent.click(screen.getByTestId("music-tab"));
    expect(onTabChange).toHaveBeenCalledWith("music");

    fireEvent.click(screen.getByTestId("effects-tab"));
    expect(onTabChange).toHaveBeenCalledWith("effects");

    fireEvent.click(screen.getByTestId("templates-tab"));
    expect(onTabChange).toHaveBeenCalledWith("templates");
  });

  it("должен не вызывать onTabChange при клике на активную вкладку", () => {
    const onTabChange = vi.fn();
    renderWithProvider(
      <BrowserTabs activeTab="media" onTabChange={onTabChange} />,
    );

    // Клик по активной вкладке
    fireEvent.click(screen.getByTestId("media-tab"));
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it("должен применять правильные CSS классы к контейнеру вкладок", () => {
    const { container } = renderWithProvider(<BrowserTabs {...defaultProps} />);

    const tabsContainer = container.querySelector("div");
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
    ];
    expectedClasses.forEach((className) => {
      expect(tabsContainer).toHaveClass(className);
    });
  });

  it("должен обновляться при изменении activeTab", () => {
    const { rerender } = renderWithProvider(<BrowserTabs {...defaultProps} />);

    expect(screen.getByTestId("media-tab")).toHaveClass("bg-background");

    // Перерендерим с новым activeTab
    rerender(
      <EffectsProvider>
        <BrowserTabs {...defaultProps} activeTab="filters" />
      </EffectsProvider>,
    );

    expect(screen.getByTestId("filters-tab")).toHaveClass("bg-background");
    expect(screen.getByTestId("media-tab")).toHaveClass("text-gray-600");
  });

  it("должен обрабатывать все возможные вкладки", () => {
    const tabs = [
      "media",
      "music",
      "subtitles",
      "effects",
      "filters",
      "transitions",
      "templates",
      "style-templates",
    ];

    tabs.forEach((tab) => {
      // Очищаем DOM перед каждым рендером
      const { unmount } = renderWithProvider(
        <BrowserTabs {...defaultProps} activeTab={tab} />,
      );
      expect(screen.getByTestId(`${tab}-tab`)).toHaveClass("bg-background");
      unmount();
    });
  });
});
