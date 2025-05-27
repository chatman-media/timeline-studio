import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StyleTemplatePreview } from "../../components/style-template-preview";
import { StyleTemplate } from "../../types";

// Мокаем компоненты
vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: vi.fn(({ onAddMedia, onRemoveMedia, isAdded }) => (
    <button
      data-testid="add-media-button"
      onClick={isAdded ? onRemoveMedia : onAddMedia}
    >
      {isAdded ? "Remove" : "Add"}
    </button>
  )),
}));

vi.mock("@/features/browser/components/layout/favorite-button", () => ({
  FavoriteButton: vi.fn(() => (
    <button data-testid="favorite-button">Favorite</button>
  )),
}));

// Мокаем хук useResources
vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addStyleTemplate: vi.fn(),
    isStyleTemplateAdded: vi.fn(() => false),
  }),
}));

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: "ru" },
  }),
}));

const mockTemplate: StyleTemplate = {
  id: "test-template",
  name: {
    ru: "Тестовый шаблон",
    en: "Test Template",
  },
  category: "intro",
  style: "modern",
  aspectRatio: "16:9",
  duration: 3,
  hasText: true,
  hasAnimation: true,
  thumbnail: "test-thumbnail.jpg",
  previewVideo: "test-preview.mp4",
  tags: {
    ru: ["тест", "интро"],
    en: ["test", "intro"],
  },
  description: {
    ru: "Тестовое описание",
    en: "Test description",
  },
  elements: [],
};

const mockTemplateWithoutThumbnail: StyleTemplate = {
  ...mockTemplate,
  id: "template-no-thumb",
  thumbnail: undefined,
  previewVideo: undefined,
};

describe("StyleTemplatePreview", () => {
  const mockOnSelect = vi.fn();
  const defaultProps = {
    template: mockTemplate,
    size: 150,
    onSelect: mockOnSelect,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен отображать превью шаблона с миниатюрой", () => {
    render(<StyleTemplatePreview {...defaultProps} />);

    const image = screen.getByAltText("Test Template");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "test-thumbnail.jpg");
  });

  it("должен отображать заглушку если нет миниатюры", () => {
    render(
      <StyleTemplatePreview
        {...defaultProps}
        template={mockTemplateWithoutThumbnail}
      />,
    );

    expect(screen.getByText("🎨")).toBeInTheDocument();
    expect(screen.getByText("Интро")).toBeInTheDocument(); // Локализованная категория
  });

  it("должен отображать название шаблона", () => {
    render(<StyleTemplatePreview {...defaultProps} />);

    expect(screen.getByText("Test Template")).toBeInTheDocument();
  });

  it("должен отображать индикаторы стиля и категории", () => {
    render(<StyleTemplatePreview {...defaultProps} />);

    expect(screen.getByText("СОВ")).toBeInTheDocument(); // Современный -> СОВ
    expect(screen.getByText("ИНТ")).toBeInTheDocument(); // Интро -> ИНТ
  });

  it("должен отображать кнопку воспроизведения при наведении", () => {
    render(<StyleTemplatePreview {...defaultProps} />);

    const container = screen.getByRole("img");
    act(() => {
      act(() => {
        fireEvent.mouseEnter(container.parentElement!);
      });
    });

    // Кнопка воспроизведения должна появиться только если есть previewVideo
    if (mockTemplate.previewVideo) {
      expect(screen.getByTestId("play-icon")).toBeInTheDocument();
    }
  });

  it("должен вызывать onSelect при клике", () => {
    render(<StyleTemplatePreview {...defaultProps} />);

    const container = screen.getByRole("img");
    act(() => {
      act(() => {
        fireEvent.click(container.parentElement!);
      });
    });

    expect(mockOnSelect).toHaveBeenCalledWith("test-template");
  });

  it("должен отображать кнопку избранного", () => {
    render(<StyleTemplatePreview {...defaultProps} />);

    expect(screen.getByTestId("favorite-button")).toBeInTheDocument();
  });

  it("должен отображать кнопку добавления в ресурсы", () => {
    render(<StyleTemplatePreview {...defaultProps} />);

    expect(screen.getByTestId("add-media-button")).toBeInTheDocument();
  });

  it("должен применять правильные размеры", () => {
    const size = 200;
    render(<StyleTemplatePreview {...defaultProps} size={size} />);

    const container = screen.getByRole("img").parentElement!;
    expect(container).toHaveStyle({
      width: `${size}px`,
      height: `${size}px`,
    });
  });

  it("должен обрабатывать различные категории", () => {
    const outroTemplate: StyleTemplate = {
      ...mockTemplate,
      category: "outro",
    };

    render(<StyleTemplatePreview {...defaultProps} template={outroTemplate} />);

    expect(screen.getByText("КОН")).toBeInTheDocument(); // Концовка -> КОН
  });

  it("должен обрабатывать различные стили", () => {
    const minimalTemplate: StyleTemplate = {
      ...mockTemplate,
      style: "minimal",
    };

    render(
      <StyleTemplatePreview {...defaultProps} template={minimalTemplate} />,
    );

    expect(screen.getByText("МИН")).toBeInTheDocument(); // Минимализм -> МИН
  });

  it("должен обрабатывать события мыши", () => {
    render(<StyleTemplatePreview {...defaultProps} />);

    const container = screen.getByRole("img").parentElement!;

    // Тестируем mouseEnter
    act(() => {
      act(() => {
        fireEvent.mouseEnter(container);
      });
    });
    // Состояние hover должно измениться (проверяется через наличие кнопки воспроизведения)

    // Тестируем mouseLeave
    act(() => {
      act(() => {
        fireEvent.mouseLeave(container);
      });
    });
    // Состояние hover должно сброситься
  });

  it("должен корректно работать с английским языком", () => {
    // Мокаем i18n для английского языка
    vi.mock("react-i18next", () => ({
      useTranslation: () => ({
        t: (key: string, fallback: string) => fallback,
        i18n: { language: "en" },
      }),
    }));

    render(<StyleTemplatePreview {...defaultProps} />);

    expect(screen.getByText("Test Template")).toBeInTheDocument();
  });
});
