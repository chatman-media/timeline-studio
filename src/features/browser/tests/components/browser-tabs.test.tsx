import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BrowserTabs } from "../../components/browser-tabs";

// Мокаем модуль i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.tabs.media": "Media",
        "browser.tabs.music": "Music",
        "browser.tabs.effects": "Effects",
        "browser.tabs.filters": "Filters",
        "browser.tabs.subtitles": "Subtitles",
        "browser.tabs.transitions": "Transitions",
        "browser.tabs.templates": "Templates",
        "browser.tabs.styleTemplates": "Style Templates",
      };
      return translations[key] || key;
    },
  }),
}));

// Мокаем компоненты Lucide
vi.mock("lucide-react", () => ({
  Image: () => <div data-testid="image-icon">Image</div>,
  Music: () => <div data-testid="music-icon">Music</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
  Blend: () => <div data-testid="blend-icon">Blend</div>,
  Type: () => <div data-testid="type-icon">Type</div>,
  FlipHorizontal2: () => (
    <div data-testid="flip-horizontal-icon">FlipHorizontal2</div>
  ),
  Grid2X2: () => <div data-testid="grid-icon">Grid2X2</div>,
  LayoutTemplate: () => (
    <div data-testid="layout-template-icon">LayoutTemplate</div>
  ),
  Sticker: () => <div data-testid="sticker-icon">Sticker</div>,
}));

// Мокаем компоненты UI
vi.mock("@/components/ui/tabs", () => ({
  TabsList: ({ children }: any) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({
    children,
    value,
    className,
    onClick,
    "data-state": dataState,
  }: any) => (
    <button
      data-testid={`tab-trigger-${value}`}
      data-value={value}
      data-state={dataState}
      className={className}
      onClick={onClick}
      role="tab"
    >
      {children}
    </button>
  ),
}));

describe("BrowserTabs", () => {
  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    mockOnTabChange.mockClear();
  });

  it("renders all tabs correctly", () => {
    render(<BrowserTabs activeTab="media" onTabChange={mockOnTabChange} />);

    // Проверяем, что все вкладки отображаются
    expect(screen.getByTestId("tab-trigger-media")).toBeInTheDocument();
    expect(screen.getByTestId("tab-trigger-music")).toBeInTheDocument();
    expect(screen.getByTestId("tab-trigger-effects")).toBeInTheDocument();
    expect(screen.getByTestId("tab-trigger-filters")).toBeInTheDocument();
    expect(screen.getByTestId("tab-trigger-subtitles")).toBeInTheDocument();
    expect(screen.getByTestId("tab-trigger-transitions")).toBeInTheDocument();
    expect(screen.getByTestId("tab-trigger-templates")).toBeInTheDocument();
    expect(
      screen.getByTestId("tab-trigger-style-templates"),
    ).toBeInTheDocument();
  });

  it("highlights the active tab", () => {
    render(<BrowserTabs activeTab="music" onTabChange={mockOnTabChange} />);

    // Проверяем, что активная вкладка имеет атрибут data-state="active"
    expect(screen.getByTestId("tab-trigger-music")).toHaveAttribute(
      "data-state",
      "active",
    );

    // Проверяем, что неактивная вкладка имеет атрибут data-state="inactive"
    expect(screen.getByTestId("tab-trigger-media")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });

  it("calls onTabChange when a tab is clicked", () => {
    render(<BrowserTabs activeTab="media" onTabChange={mockOnTabChange} />);

    // Кликаем по вкладке "Music"
    fireEvent.click(screen.getByTestId("tab-trigger-music"));
    expect(mockOnTabChange).toHaveBeenCalledWith("music");

    // Кликаем по вкладке "Effects"
    fireEvent.click(screen.getByTestId("tab-trigger-effects"));
    expect(mockOnTabChange).toHaveBeenCalledWith("effects");
  });

  it("renders all tab icons", () => {
    render(<BrowserTabs activeTab="media" onTabChange={mockOnTabChange} />);

    // Проверяем, что все иконки отображаются
    expect(screen.getByTestId("image-icon")).toBeInTheDocument();
    expect(screen.getByTestId("music-icon")).toBeInTheDocument();
    expect(screen.getByTestId("sparkles-icon")).toBeInTheDocument();
    expect(screen.getByTestId("blend-icon")).toBeInTheDocument();
    expect(screen.getByTestId("type-icon")).toBeInTheDocument();
    expect(screen.getByTestId("flip-horizontal-icon")).toBeInTheDocument();
    expect(screen.getByTestId("grid-icon")).toBeInTheDocument();
    expect(screen.getByTestId("sticker-icon")).toBeInTheDocument();
  });
});
