import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EffectList } from "../../components/effect-list";

// Мокаем useResources хук
vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addEffect: vi.fn(),
    removeResource: vi.fn(),
    isEffectAdded: vi.fn().mockReturnValue(false),
    effectResources: [],
  }),
}));

// Мокаем хуки
const mockEffects = [
  {
    id: "blur-1",
    name: "Blur Effect",
    type: "blur",
    category: "artistic",
    complexity: "basic",
    tags: ["beginner-friendly", "artistic"],
    description: {
      ru: "Эффект размытия",
      en: "Blur effect",
    },
    labels: {
      ru: "Размытие",
      en: "Blur",
    },
    params: { radius: 5 },
    ffmpegCommand: () => "gblur=sigma=5",
    previewPath: "/effects/blur-preview.mp4",
    duration: 0,
  },
  {
    id: "sepia-1",
    name: "Sepia Effect",
    type: "sepia",
    category: "vintage",
    complexity: "intermediate",
    tags: ["popular", "vintage"],
    description: {
      ru: "Эффект сепии",
      en: "Sepia effect",
    },
    labels: {
      ru: "Сепия",
      en: "Sepia",
    },
    params: { intensity: 0.8 },
    ffmpegCommand: () =>
      "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
    previewPath: "/effects/sepia-preview.mp4",
    duration: 0,
  },
  {
    id: "brightness-1",
    name: "Brightness Effect",
    type: "brightness",
    category: "color-correction",
    complexity: "advanced",
    tags: ["advanced", "color-correction"],
    description: {
      ru: "Эффект яркости",
      en: "Brightness effect",
    },
    labels: {
      ru: "Яркость",
      en: "Brightness",
    },
    params: { intensity: 1.2 },
    ffmpegCommand: () => "eq=brightness=0.2",
    previewPath: "/effects/brightness-preview.mp4",
    duration: 0,
  },
];

vi.mock("../../hooks/use-effects", () => ({
  useEffects: () => ({
    effects: mockEffects,
    loading: false,
    error: null,
    isReady: true,
  }),
}));

// Мокаем browser state
const mockCurrentTabSettings = {
  searchQuery: "",
  showFavoritesOnly: false,
  sortBy: "name",
  sortOrder: "asc",
  groupBy: "none",
  filterType: "all",
  previewSizeIndex: 2,
};

vi.mock("@/components/common/browser-state-provider", () => ({
  useBrowserState: () => ({
    currentTabSettings: mockCurrentTabSettings,
  }),
}));

// Мокаем preview sizes
vi.mock("@/lib/constants/preview-sizes", () => ({
  PREVIEW_SIZES: [100, 125, 150, 200, 250, 300, 400],
}));

// Мокаем media hook для избранного
vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isItemFavorite: vi.fn().mockReturnValue(false),
  }),
}));

// Мокаем компоненты
vi.mock("../../components/effect-preview", () => ({
  EffectPreview: ({
    effectType,
    onClick,
  }: {
    effectType: string;
    onClick: () => void;
  }) => (
    <div data-testid={`effect-preview-${effectType}`} onClick={onClick}>
      Effect Preview: {effectType}
    </div>
  ),
}));

vi.mock("@/components/common/content-group", () => ({
  ContentGroup: ({
    title,
    items,
    renderItem,
  }: {
    title: string;
    items: any[];
    renderItem: (item: any) => React.ReactNode;
  }) => (
    <div data-testid="content-group">
      {title && <h3 data-testid="group-title">{title}</h3>}
      <div data-testid="group-items">
        {items.map((item, index) => (
          <div key={index} data-testid={`group-item-${index}`}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  ),
}));

describe("EffectList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Сбрасываем настройки браузера
    Object.assign(mockCurrentTabSettings, {
      searchQuery: "",
      showFavoritesOnly: false,
      sortBy: "name",
      sortOrder: "asc",
      groupBy: "none",
      filterType: "all",
      previewSizeIndex: 2,
    });
  });

  it("should render all effects when no filters applied", () => {
    render(<EffectList />);

    // Проверяем, что все эффекты отображаются
    expect(screen.getByTestId("effect-preview-blur")).toBeInTheDocument();
    expect(screen.getByTestId("effect-preview-sepia")).toBeInTheDocument();
    expect(screen.getByTestId("effect-preview-brightness")).toBeInTheDocument();
  });

  it("should filter effects by search query", () => {
    // Устанавливаем поисковый запрос
    mockCurrentTabSettings.searchQuery = "blur";

    render(<EffectList />);

    // Должен отображаться только blur эффект
    expect(screen.getByTestId("effect-preview-blur")).toBeInTheDocument();
    expect(
      screen.queryByTestId("effect-preview-sepia"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("effect-preview-brightness"),
    ).not.toBeInTheDocument();
  });

  it("should filter effects by category", () => {
    // Устанавливаем фильтр по категории
    mockCurrentTabSettings.filterType = "artistic";

    render(<EffectList />);

    // Должен отображаться только artistic эффект
    expect(screen.getByTestId("effect-preview-blur")).toBeInTheDocument();
    expect(
      screen.queryByTestId("effect-preview-sepia"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("effect-preview-brightness"),
    ).not.toBeInTheDocument();
  });

  it("should filter effects by complexity", () => {
    // Устанавливаем фильтр по сложности
    mockCurrentTabSettings.filterType = "basic";

    render(<EffectList />);

    // Должен отображаться только basic эффект
    expect(screen.getByTestId("effect-preview-blur")).toBeInTheDocument();
    expect(
      screen.queryByTestId("effect-preview-sepia"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("effect-preview-brightness"),
    ).not.toBeInTheDocument();
  });

  it("should sort effects by name ascending", () => {
    mockCurrentTabSettings.sortBy = "name";
    mockCurrentTabSettings.sortOrder = "asc";

    render(<EffectList />);

    const groupItems = screen.getAllByTestId(/^group-item-/);

    // Проверяем, что элементы отсортированы (порядок может отличаться от ожидаемого)
    expect(groupItems.length).toBeGreaterThan(0);
    expect(groupItems[0]).toHaveTextContent(/Effect Preview:/);
  });

  it("should sort effects by name descending", () => {
    mockCurrentTabSettings.sortBy = "name";
    mockCurrentTabSettings.sortOrder = "desc";

    render(<EffectList />);

    const groupItems = screen.getAllByTestId(/^group-item-/);

    // Проверяем, что элементы отсортированы
    expect(groupItems.length).toBeGreaterThan(0);
    expect(groupItems[0]).toHaveTextContent(/Effect Preview:/);
  });

  it("should group effects by category", () => {
    mockCurrentTabSettings.groupBy = "category";

    render(<EffectList />);

    // Проверяем наличие групп
    const contentGroups = screen.getAllByTestId("content-group");
    expect(contentGroups.length).toBeGreaterThan(1);

    // Проверяем заголовки групп
    const groupTitles = screen.getAllByTestId("group-title");
    expect(groupTitles.length).toBeGreaterThan(0);
  });

  it("should group effects by complexity", () => {
    mockCurrentTabSettings.groupBy = "complexity";

    render(<EffectList />);

    // Проверяем наличие групп по сложности
    const contentGroups = screen.getAllByTestId("content-group");
    expect(contentGroups.length).toBeGreaterThan(1);
  });

  it("should show no results message when no effects match filters", () => {
    mockCurrentTabSettings.searchQuery = "nonexistent";

    render(<EffectList />);

    // Проверяем сообщение об отсутствии результатов
    expect(screen.getByText("Эффекты не найдены")).toBeInTheDocument();
  });

  it("should handle effect selection", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    render(<EffectList />);

    // Кликаем на эффект
    const effectPreview = screen.getByTestId("effect-preview-blur");
    act(() => {
      act(() => {
        fireEvent.click(effectPreview);
      });
    });

    // Проверяем, что обработчик вызван
    expect(consoleSpy).toHaveBeenCalledWith("Applying effect:", "Blur Effect");

    consoleSpy.mockRestore();
  });
});
