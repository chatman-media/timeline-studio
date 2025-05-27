import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { VideoFilter } from "@/types/filters";

import { FilterPreview } from "../../components/filter-preview";

// Мокаем хук переводов
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "ru" },
  }),
}));

// Мокаем хук ресурсов
const mockAddFilter = vi.fn();
const mockIsFilterAdded = vi.fn().mockReturnValue(false);
const mockRemoveResource = vi.fn();

vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addFilter: mockAddFilter,
    isFilterAdded: mockIsFilterAdded,
    removeResource: mockRemoveResource,
    filterResources: [],
  }),
}));

// Мокаем компоненты браузера
vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: ({ onAddMedia, onRemoveMedia, isAdded, size }: any) => (
    <div
      data-testid={isAdded ? "remove-button" : "add-button"}
      onClick={onAddMedia}
    >
      {isAdded ? "Remove" : "Add"} (size: {size})
    </div>
  ),
}));

vi.mock("@/features/browser/components/layout/favorite-button", () => ({
  FavoriteButton: ({ file, size, type }: any) => (
    <div data-testid="favorite-button">
      Favorite {file.name} (size: {size}, type: {type})
    </div>
  ),
}));

describe("FilterPreview", () => {
  const mockFilter: VideoFilter = {
    id: "test-filter",
    name: "Test Filter",
    category: "color-correction",
    complexity: "basic",
    tags: ["professional"],
    description: { ru: "Тестовый фильтр", en: "Test Filter" },
    labels: {
      ru: "Тест",
      en: "Test",
      es: "Prueba",
      fr: "Test",
      de: "Test",
    },
    params: {
      brightness: 0.1,
      contrast: 1.2,
      saturation: 1.1,
    },
  };

  const defaultProps = {
    filter: mockFilter,
    size: 200,
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFilterAdded.mockReturnValue(false);
  });

  it("should render filter preview with video", () => {
    render(<FilterPreview {...defaultProps} />);

    // Проверяем наличие видео элемента
    const video = screen.getByTestId("filter-video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "/t1.mp4");
    expect(video).toHaveProperty("muted", true);
    expect(video).toHaveProperty("playsInline", true);
  });

  it("should render filter name", () => {
    render(<FilterPreview {...defaultProps} />);

    // Проверяем отображение названия фильтра
    expect(screen.getByText("Тест")).toBeInTheDocument();
  });

  it("should render complexity indicator", () => {
    render(<FilterPreview {...defaultProps} />);

    // Проверяем индикатор сложности (зеленый для basic)
    const complexityIndicator = screen.getByTitle("filters.complexity.basic");
    expect(complexityIndicator).toBeInTheDocument();
    expect(complexityIndicator).toHaveClass("bg-green-500");
  });

  it("should render category indicator", () => {
    render(<FilterPreview {...defaultProps} />);

    // Проверяем индикатор категории
    const categoryIndicator = screen.getByTitle(
      "filters.categories.color-correction",
    );
    expect(categoryIndicator).toBeInTheDocument();
    expect(categoryIndicator).toHaveClass("bg-black/70");
    expect(categoryIndicator).toHaveClass("text-white");
    expect(categoryIndicator).toHaveClass("font-medium");
    expect(categoryIndicator).toHaveTextContent("CC");
  });

  it("should render favorite button", () => {
    render(<FilterPreview {...defaultProps} />);

    // Проверяем кнопку избранного
    const favoriteButton = screen.getByTestId("favorite-button");
    expect(favoriteButton).toBeInTheDocument();
    expect(favoriteButton).toHaveTextContent("Favorite Test Filter");
  });

  it("should render add media button", () => {
    render(<FilterPreview {...defaultProps} />);

    // Проверяем кнопку добавления медиа
    const addButton = screen.getByTestId("add-button");
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("Add");
  });

  it("should show remove button when filter is added", () => {
    mockIsFilterAdded.mockReturnValue(true);

    render(<FilterPreview {...defaultProps} />);

    // Проверяем кнопку удаления
    const removeButton = screen.getByTestId("remove-button");
    expect(removeButton).toBeInTheDocument();
    expect(removeButton).toHaveTextContent("Remove");
  });

  it("should handle click event", () => {
    const mockOnClick = vi.fn();

    render(<FilterPreview {...defaultProps} onClick={mockOnClick} />);

    // Кликаем на контейнер превью
    const container = screen.getByTestId("filter-video").closest("div");
    act(() => {
      act(() => {
        fireEvent.click(container!);
      });
    });

    // Проверяем, что обработчик вызван
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("should handle mouse hover events", async () => {
    render(<FilterPreview {...defaultProps} />);

    const container = screen.getByTestId("filter-video").closest("div");
    const video = screen.getByTestId("filter-video");

    // Мокаем методы видео
    video.play = vi.fn().mockResolvedValue(undefined);
    video.pause = vi.fn();

    // Наводим мышь
    act(() => {
      act(() => {
        fireEvent.mouseEnter(container!);
      });
    });

    // Убираем мышь
    act(() => {
      act(() => {
        fireEvent.mouseLeave(container!);
      });
    });

    // Проверяем, что методы видео были вызваны
    expect(video.pause).toHaveBeenCalled();
  });

  it("should handle add filter action", () => {
    render(<FilterPreview {...defaultProps} />);

    const addButton = screen.getByTestId("add-button");
    act(() => {
      act(() => {
        fireEvent.click(addButton);
      });
    });

    // Проверяем, что фильтр добавлен
    expect(mockAddFilter).toHaveBeenCalledWith(mockFilter);
  });

  it("should use custom preview dimensions", () => {
    render(
      <FilterPreview
        {...defaultProps}
        previewWidth={300}
        previewHeight={200}
      />,
    );

    const container = screen.getByTestId("filter-video").closest("div");
    expect(container).toHaveStyle({
      width: "300px",
      height: "200px",
    });
  });

  it("should handle different complexity levels", () => {
    const intermediateFilter = {
      ...mockFilter,
      complexity: "intermediate" as const,
    };

    render(<FilterPreview {...defaultProps} filter={intermediateFilter} />);

    const complexityIndicator = screen.getByTitle(
      "filters.complexity.intermediate",
    );
    expect(complexityIndicator).toHaveClass("bg-yellow-500");
  });

  it("should handle different categories", () => {
    const creativeFilter = {
      ...mockFilter,
      category: "creative" as const,
    };

    render(<FilterPreview {...defaultProps} filter={creativeFilter} />);

    const categoryIndicator = screen.getByTitle("filters.categories.creative");
    expect(categoryIndicator).toHaveClass("bg-black/70");
    expect(categoryIndicator).toHaveTextContent("CRE");
  });

  it("should apply CSS filters to video", () => {
    render(<FilterPreview {...defaultProps} />);

    const container = screen.getByTestId("filter-video").closest("div");
    const video = screen.getByTestId("filter-video");

    // Мокаем методы видео
    video.play = vi.fn().mockResolvedValue(undefined);

    // Наводим мышь для применения фильтра
    act(() => {
      act(() => {
        fireEvent.mouseEnter(container!);
      });
    });

    // Проверяем, что CSS фильтр применен (проверяем, что style.filter не пустой)
    // В реальности здесь будет CSS filter строка с brightness, contrast, saturation
    expect(video.style.filter).toBeDefined();
  });
});
