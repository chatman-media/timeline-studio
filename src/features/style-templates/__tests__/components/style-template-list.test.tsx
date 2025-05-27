import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StyleTemplateList } from "../../components/style-template-list";
import { useStyleTemplates } from "../../hooks";

// Мокаем хук useStyleTemplates
vi.mock("../../hooks", () => ({
  useStyleTemplates: vi.fn(),
}));

// Мокаем компонент StyleTemplatePreview
vi.mock("../../components/style-template-preview", () => ({
  StyleTemplatePreview: vi.fn(({ template, onSelect }) => (
    <div
      data-testid={`template-preview-${template.id}`}
      onClick={() => onSelect(template.id)}
    >
      {template.name.ru}
    </div>
  )),
}));

// Мокаем useBrowserState
vi.mock("@/components/common/browser-state-provider", () => ({
  useBrowserState: () => ({
    currentTabSettings: {
      searchQuery: "",
      showFavoritesOnly: false,
      sortBy: "name",
      sortOrder: "asc",
      groupBy: "none",
      filterType: "all",
      previewSizeIndex: 2,
    },
  }),
}));

// Мокаем useMedia
vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isItemFavorite: vi.fn(() => false),
  }),
}));

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: "ru" },
  }),
}));

// Мокаем ContentGroup
vi.mock("@/components/common/content-group", () => ({
  ContentGroup: vi.fn(({ title, items, renderItem }) => (
    <div>
      {title && <h3>{title}</h3>}
      <div className="grid gap-3">
        {items.map((item: any) => renderItem(item))}
      </div>
    </div>
  )),
}));

const mockUseStyleTemplates = vi.mocked(useStyleTemplates);

const mockTemplates = [
  {
    id: "template-1",
    name: {
      ru: "Современное интро",
      en: "Modern Intro",
    },
    category: "intro",
    style: "modern",
    aspectRatio: "16:9" as const,
    duration: 3,
    hasText: true,
    hasAnimation: true,
    tags: {
      ru: ["интро", "современный"],
      en: ["intro", "modern"],
    },
    description: {
      ru: "Современное интро",
      en: "Modern intro",
    },
    elements: [],
  },
  {
    id: "template-2",
    name: {
      ru: "Минималистичная концовка",
      en: "Minimal Outro",
    },
    category: "outro",
    style: "minimal",
    aspectRatio: "16:9" as const,
    duration: 4,
    hasText: false,
    hasAnimation: true,
    tags: {
      ru: ["концовка", "минимализм"],
      en: ["outro", "minimal"],
    },
    description: {
      ru: "Минималистичная концовка",
      en: "Minimal outro",
    },
    elements: [],
  },
];

describe("StyleTemplateList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен отображать индикатор загрузки", () => {
    mockUseStyleTemplates.mockReturnValue({
      templates: [],
      loading: true,
      error: null,
      filteredTemplates: [],
      setFilter: vi.fn(),
      setSorting: vi.fn(),
      getTemplateById: vi.fn(),
      getTemplatesByCategory: vi.fn(),
    });

    render(<StyleTemplateList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("должен отображать ошибку загрузки", () => {
    const errorMessage = "Failed to load templates";
    mockUseStyleTemplates.mockReturnValue({
      templates: [],
      loading: false,
      error: errorMessage,
      filteredTemplates: [],
      setFilter: vi.fn(),
      setSorting: vi.fn(),
      getTemplateById: vi.fn(),
      getTemplatesByCategory: vi.fn(),
    });

    render(<StyleTemplateList />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("должен отображать список шаблонов", () => {
    mockUseStyleTemplates.mockReturnValue({
      templates: mockTemplates,
      loading: false,
      error: null,
      filteredTemplates: mockTemplates,
      setFilter: vi.fn(),
      setSorting: vi.fn(),
      getTemplateById: vi.fn(),
      getTemplatesByCategory: vi.fn(),
    });

    render(<StyleTemplateList />);

    expect(
      screen.getByTestId("template-preview-template-1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("template-preview-template-2"),
    ).toBeInTheDocument();
    expect(screen.getByText("Современное интро")).toBeInTheDocument();
    expect(screen.getByText("Минималистичная концовка")).toBeInTheDocument();
  });

  it("должен отображать сообщение об отсутствии результатов", () => {
    mockUseStyleTemplates.mockReturnValue({
      templates: [], // Пустой массив шаблонов
      loading: false,
      error: null,
      filteredTemplates: [],
      setFilter: vi.fn(),
      setSorting: vi.fn(),
      getTemplateById: vi.fn(),
      getTemplatesByCategory: vi.fn(),
    });

    render(<StyleTemplateList />);

    expect(screen.getByText("common.noResults")).toBeInTheDocument();
  });

  it("должен обрабатывать выбор шаблона", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    mockUseStyleTemplates.mockReturnValue({
      templates: mockTemplates,
      loading: false,
      error: null,
      filteredTemplates: mockTemplates,
      setFilter: vi.fn(),
      setSorting: vi.fn(),
      getTemplateById: vi.fn(),
      getTemplatesByCategory: vi.fn(),
    });

    render(<StyleTemplateList />);

    const templatePreview = screen.getByTestId("template-preview-template-1");
    act(() => {
      act(() => {
        templatePreview.click();
      });
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Выбран стилистический шаблон:",
      "template-1",
    );

    consoleSpy.mockRestore();
  });
});
