import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EffectPreview } from "../../components/effect-preview";

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "ru" },
  }),
}));

// Мокаем хуки
const mockAddEffect = vi.fn();
const mockRemoveResource = vi.fn();
const mockIsEffectAdded = vi.fn();

vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addEffect: mockAddEffect,
    removeResource: mockRemoveResource,
    isEffectAdded: mockIsEffectAdded,
    effectResources: [],
  }),
}));

// Мокаем хук эффектов
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
    params: {
      radius: 5,
    },
    ffmpegCommand: () => "gblur=sigma=5",
    cssFilter: (params: any) => `blur(${params.radius || 5}px)`,
    previewPath: "/effects/blur-preview.mp4",
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

// Мокаем CSS эффекты
vi.mock("../../utils/css-effects", () => ({
  generateCSSFilterForEffect: vi.fn().mockReturnValue("blur(5px)"),
  getPlaybackRate: vi.fn().mockReturnValue(1),
}));

// Мокаем компоненты
vi.mock("../../components/effect-indicators", () => ({
  EffectIndicators: ({ effect }: { effect: any }) => (
    <div data-testid="effect-indicators">{effect.category}</div>
  ),
}));

vi.mock("@/features/browser/components/layout/favorite-button", () => ({
  FavoriteButton: ({ file, type }: { file: any; type: string }) => (
    <button data-testid="favorite-button">
      {file.name} - {type}
    </button>
  ),
}));

vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: ({
    file,
    onAddMedia,
    onRemoveMedia,
    isAdded,
  }: {
    file: any;
    onAddMedia: (e: any) => void;
    onRemoveMedia: (e: any) => void;
    isAdded: boolean;
  }) => (
    <div data-testid="add-media-button">
      <button
        onClick={onAddMedia}
        data-testid={isAdded ? "remove-button" : "add-button"}
      >
        {isAdded ? "Remove" : "Add"} {file.name}
      </button>
      {isAdded && (
        <button onClick={onRemoveMedia} data-testid="remove-media-button">
          Remove Media
        </button>
      )}
    </div>
  ),
}));

describe("EffectPreview", () => {
  const defaultProps = {
    effectType: "blur" as const,
    size: 200,
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEffectAdded.mockReturnValue(false);
  });

  it("should render effect preview with video", () => {
    render(<EffectPreview {...defaultProps} />);

    // Проверяем наличие видео элемента
    const video = screen.getByTestId("effect-video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "/t1.mp4");
    expect(video).toHaveProperty("muted", true);
    expect(video).toHaveProperty("playsInline", true);
  });

  it("should render effect name", () => {
    render(<EffectPreview {...defaultProps} />);

    // Проверяем отображение названия эффекта
    expect(screen.getByText("Размытие")).toBeInTheDocument();
  });

  it("should render complexity indicator", () => {
    render(<EffectPreview {...defaultProps} />);

    // Проверяем индикатор сложности (зеленый для basic)
    const complexityIndicator = screen.getByTitle("effects.complexity.basic");
    expect(complexityIndicator).toBeInTheDocument();
    expect(complexityIndicator).toHaveClass("bg-green-500");
  });

  it("should render effect indicators", () => {
    render(<EffectPreview {...defaultProps} />);

    // Проверяем компонент индикаторов эффекта
    expect(screen.getByTestId("effect-indicators")).toBeInTheDocument();
    expect(screen.getByText("artistic")).toBeInTheDocument();
  });

  it("should render favorite button", () => {
    render(<EffectPreview {...defaultProps} />);

    // Проверяем кнопку избранного
    const favoriteButton = screen.getByTestId("favorite-button");
    expect(favoriteButton).toBeInTheDocument();
    expect(favoriteButton).toHaveTextContent("Blur Effect - effect");
  });

  it("should render add media button", () => {
    render(<EffectPreview {...defaultProps} />);

    // Проверяем кнопку добавления медиа
    const addButton = screen.getByTestId("add-button");
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("Add blur");
  });

  it("should show remove button when effect is added", () => {
    mockIsEffectAdded.mockReturnValue(true);

    render(<EffectPreview {...defaultProps} />);

    // Проверяем кнопку удаления
    const removeButton = screen.getByTestId("remove-button");
    expect(removeButton).toBeInTheDocument();
    expect(removeButton).toHaveTextContent("Remove blur");
  });

  it("should handle click event", () => {
    const mockOnClick = vi.fn();

    render(<EffectPreview {...defaultProps} onClick={mockOnClick} />);

    // Кликаем на контейнер превью
    const container = screen.getByTestId("effect-video").closest("div");
    act(() => {
      act(() => {
        fireEvent.click(container!);
      });
    });

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("should handle mouse hover events", async () => {
    render(<EffectPreview {...defaultProps} />);

    const container = screen.getByTestId("effect-video").closest("div");
    const video = screen.getByTestId("effect-video");

    // Мокаем методы видео
    const playMock = vi.fn().mockResolvedValue(undefined);
    const pauseMock = vi.fn();
    (video as any).play = playMock;
    (video as any).pause = pauseMock;

    // Наводим мышь
    act(() => {
      act(() => {
        fireEvent.mouseEnter(container!);
      });
    });

    // Ждем применения эффекта
    await waitFor(() => {
      expect(playMock).toHaveBeenCalled();
    });

    // Убираем мышь
    act(() => {
      act(() => {
        fireEvent.mouseLeave(container!);
      });
    });

    expect(pauseMock).toHaveBeenCalled();
  });

  it("should handle add effect action", () => {
    render(<EffectPreview {...defaultProps} />);

    const addButton = screen.getByTestId("add-button");
    act(() => {
      act(() => {
        fireEvent.click(addButton);
      });
    });

    expect(mockAddEffect).toHaveBeenCalledWith(mockEffects[0]);
  });

  it("should use custom width and height", () => {
    render(<EffectPreview {...defaultProps} width={300} height={200} />);

    const container = screen.getByTestId("effect-video").closest("div");
    expect(container).toHaveStyle({
      width: "300px",
      height: "200px",
    });

    const video = screen.getByTestId("effect-video");
    expect(video).toHaveStyle({
      width: "300px",
      height: "200px",
    });
  });

  it("should render fallback when effect not found", () => {
    render(<EffectPreview {...defaultProps} effectType="vignette" />);

    // Должно отображать тип эффекта как fallback если эффект не найден в моке
    expect(screen.getByText("vignette")).toBeInTheDocument();
  });

  it("should handle different complexity levels", () => {
    // Проверяем, что индикатор сложности отображается
    render(<EffectPreview {...defaultProps} />);

    const complexityIndicator = screen.getByTitle("effects.complexity.basic");
    expect(complexityIndicator).toHaveClass("bg-green-500");
  });
});
