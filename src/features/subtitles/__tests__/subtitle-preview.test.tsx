import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SubtitlePreview } from "../components/subtitle-preview";

import type { SubtitleStyle } from "../types/subtitles";

// Мокаем хук переводов
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "ru" },
  }),
}));

// Мокаем хук ресурсов
const mockAddSubtitle = vi.fn();
const mockIsSubtitleAdded = vi.fn().mockReturnValue(false);
const mockRemoveResource = vi.fn();

vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addSubtitle: mockAddSubtitle,
    isSubtitleAdded: mockIsSubtitleAdded,
    removeResource: mockRemoveResource,
    subtitleResources: [],
  }),
}));

// Мокаем компоненты браузера
vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: ({ onAddMedia, isAdded, size }: any) => (
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

// Мокаем CSS утилиты
vi.mock("../utils/css-styles", () => ({
  subtitleStyleToCSS: (style: any) => ({
    fontSize: style.style.fontSize || "24px",
    fontFamily: style.style.fontFamily || "Arial, sans-serif",
    color: style.style.color || "#ffffff",
    backgroundColor: style.style.backgroundColor || "transparent",
    textAlign: style.style.textAlign || "center",
    fontWeight: style.style.fontWeight || "normal",
    textShadow: style.style.textShadow || "2px 2px 4px rgba(0,0,0,0.8)",
  }),
}));

describe("SubtitlePreview", () => {
  const mockSubtitleStyle: SubtitleStyle = {
    id: "test-subtitle",
    name: "Test Subtitle",
    labels: {
      ru: "Тестовый субтитр",
      en: "Test Subtitle",
      es: "Subtítulo de prueba",
      fr: "Sous-titre de test",
      de: "Test-Untertitel",
    },
    description: { ru: "Тестовый стиль субтитров", en: "Test subtitle style" },
    category: "basic",
    complexity: "basic",
    tags: ["test", "minimal"],
    style: {
      fontSize: "24px",
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      backgroundColor: "transparent",
      textAlign: "center",
      fontWeight: "normal",
      textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
    },
  };

  const defaultProps = {
    style: mockSubtitleStyle,
    onClick: vi.fn(),
    size: 200,
    previewWidth: 200,
    previewHeight: 112,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSubtitleAdded.mockReturnValue(false);
  });

  it("should render subtitle preview with text", () => {
    render(<SubtitlePreview {...defaultProps} />);

    // Проверяем наличие текста превью
    const previewText = screen.getByTestId("subtitle-preview-text");
    expect(previewText).toBeInTheDocument();
    expect(previewText).toHaveTextContent("Timeline Studio");
  });

  it("should render subtitle name", () => {
    render(<SubtitlePreview {...defaultProps} />);

    // Проверяем отображение названия субтитра
    expect(screen.getByText("Тестовый субтитр")).toBeInTheDocument();
  });

  it("should apply CSS styles to preview text", () => {
    render(<SubtitlePreview {...defaultProps} />);

    const previewText = screen.getByTestId("subtitle-preview-text");

    // Проверяем применение стилей
    expect(previewText).toHaveStyle({
      fontSize: "24px",
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      textAlign: "center",
      fontWeight: "normal",
    });
  });

  it("should render complexity indicator", () => {
    render(<SubtitlePreview {...defaultProps} />);

    // Проверяем индикатор сложности (зеленый для basic)
    const complexityIndicator = screen.getByTitle("subtitles.complexity.basic");
    expect(complexityIndicator).toBeInTheDocument();
    expect(complexityIndicator).toHaveClass("bg-green-500");
  });

  it("should render category indicator", () => {
    render(<SubtitlePreview {...defaultProps} />);

    // Проверяем индикатор категории
    const categoryIndicator = screen.getByTitle("subtitles.categories.basic");
    expect(categoryIndicator).toBeInTheDocument();
    expect(categoryIndicator).toHaveClass("bg-black/70");
    expect(categoryIndicator).toHaveClass("text-white");
    expect(categoryIndicator).toHaveTextContent("BAS");
  });

  it("should render favorite button", () => {
    render(<SubtitlePreview {...defaultProps} />);

    // Проверяем кнопку избранного
    const favoriteButton = screen.getByTestId("favorite-button");
    expect(favoriteButton).toBeInTheDocument();
    expect(favoriteButton).toHaveTextContent("Favorite Test Subtitle");
  });

  it("should render add media button", () => {
    render(<SubtitlePreview {...defaultProps} />);

    // Проверяем кнопку добавления медиа
    const addButton = screen.getByTestId("add-button");
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("Add");
  });

  it("should show remove button when subtitle is added", () => {
    mockIsSubtitleAdded.mockReturnValue(true);

    render(<SubtitlePreview {...defaultProps} />);

    // Проверяем кнопку удаления
    const removeButton = screen.getByTestId("remove-button");
    expect(removeButton).toBeInTheDocument();
    expect(removeButton).toHaveTextContent("Remove");
  });

  it("should handle click event", () => {
    const mockOnClick = vi.fn();

    render(<SubtitlePreview {...defaultProps} onClick={mockOnClick} />);

    // Кликаем на контейнер превью
    const container = screen
      .getByTestId("subtitle-preview-text")
      .closest("div");
    act(() => {
      act(() => {
        fireEvent.click(container!);
      });
    });

    // Проверяем, что обработчик вызван
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("should handle add subtitle action", () => {
    render(<SubtitlePreview {...defaultProps} />);

    const addButton = screen.getByTestId("add-button");
    act(() => {
      act(() => {
        fireEvent.click(addButton);
      });
    });

    // Проверяем, что субтитр добавлен
    expect(mockAddSubtitle).toHaveBeenCalledWith(mockSubtitleStyle);
  });

  it("should use custom preview dimensions", () => {
    render(
      <SubtitlePreview
        {...defaultProps}
        previewWidth={300}
        previewHeight={200}
      />,
    );

    // Ищем контейнер с правильными размерами (родительский элемент)
    const container = screen
      .getByTestId("subtitle-preview-text")
      .closest("div")?.parentElement;
    expect(container).toHaveStyle({
      width: "300px",
      height: "200px",
    });
  });

  it("should handle different complexity levels", () => {
    const advancedSubtitle = {
      ...mockSubtitleStyle,
      complexity: "advanced" as const,
    };

    render(<SubtitlePreview {...defaultProps} style={advancedSubtitle} />);

    const complexityIndicator = screen.getByTitle(
      "subtitles.complexity.advanced",
    );
    expect(complexityIndicator).toHaveClass("bg-red-500");
  });

  it("should handle different categories", () => {
    const creativeSubtitle = {
      ...mockSubtitleStyle,
      category: "creative" as const,
    };

    render(<SubtitlePreview {...defaultProps} style={creativeSubtitle} />);

    const categoryIndicator = screen.getByTitle(
      "subtitles.categories.creative",
    );
    expect(categoryIndicator).toHaveClass("bg-black/70");
    expect(categoryIndicator).toHaveTextContent("SUB"); // fallback для creative
  });

  it("should show animation indicator when style has animation", () => {
    const animatedSubtitle = {
      ...mockSubtitleStyle,
      style: {
        ...mockSubtitleStyle.style,
        animation: "fadeInOut 2s ease-in-out infinite",
      },
    };

    render(<SubtitlePreview {...defaultProps} style={animatedSubtitle} />);

    // Проверяем индикатор анимации
    expect(screen.getByText("ANI")).toBeInTheDocument();
  });

  it("should not show animation indicator when style has no animation", () => {
    render(<SubtitlePreview {...defaultProps} />);

    // Проверяем отсутствие индикатора анимации
    expect(screen.queryByText("ANI")).not.toBeInTheDocument();
  });

  it("should handle subtitle with background color", () => {
    const backgroundSubtitle = {
      ...mockSubtitleStyle,
      style: {
        ...mockSubtitleStyle.style,
        backgroundColor: "rgba(0,0,0,0.8)",
        padding: "8px 16px",
        borderRadius: "4px",
      },
    };

    render(<SubtitlePreview {...defaultProps} style={backgroundSubtitle} />);

    const previewText = screen.getByTestId("subtitle-preview-text");
    expect(previewText).toHaveStyle({
      backgroundColor: "rgba(0,0,0,0.8)",
    });
  });

  it("should handle subtitle with custom font", () => {
    const customFontSubtitle = {
      ...mockSubtitleStyle,
      style: {
        ...mockSubtitleStyle.style,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        fontSize: "32px",
      },
    };

    render(<SubtitlePreview {...defaultProps} style={customFontSubtitle} />);

    const previewText = screen.getByTestId("subtitle-preview-text");
    expect(previewText).toHaveStyle({
      fontFamily: "Georgia, serif",
      fontWeight: "bold",
      fontSize: "32px",
    });
  });
});
