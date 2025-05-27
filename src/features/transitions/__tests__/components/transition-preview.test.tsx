import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MediaFile } from "@/features/media/types/media";
import type { Transition } from "@/types/transitions";

import { TransitionPreview } from "../../components/transition-preview";

// Мокаем хук переводов
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "ru" },
  }),
}));

// Мокаем хук ресурсов
const mockAddTransition = vi.fn();
const mockIsTransitionAdded = vi.fn().mockReturnValue(false);
const mockRemoveResource = vi.fn();

vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addTransition: mockAddTransition,
    isTransitionAdded: mockIsTransitionAdded,
    removeResource: mockRemoveResource,
    transitionResources: [],
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

// Мокаем хук переходов
const mockTransitions = [
  {
    id: "fade",
    type: "fade",
    labels: { ru: "Затухание", en: "Fade" },
    description: { ru: "Плавное затухание", en: "Smooth fade" },
    category: "basic",
    complexity: "basic",
    tags: ["popular"],
    duration: { min: 0.5, max: 2.0, default: 1.0 },
    parameters: { easing: "ease-in-out", intensity: 1.0 },
    ffmpegCommand: () => "fade=t=in:st=0:d=1.0",
  },
];

vi.mock("../../hooks/use-transitions", () => ({
  useTransitions: () => ({
    transitions: mockTransitions,
    loading: false,
    error: null,
    isReady: true,
  }),
}));

describe("TransitionPreview", () => {
  const mockTransition: Transition = {
    id: "test-transition",
    type: "fade",
    labels: {
      ru: "Тестовый переход",
      en: "Test Transition",
      es: "Transición de prueba",
      fr: "Transition de test",
      de: "Test-Übergang",
    },
    description: { ru: "Тестовый переход", en: "Test Transition" },
    category: "basic",
    complexity: "basic",
    tags: ["test"],
    duration: { min: 0.5, max: 2.0, default: 1.0 },
    parameters: {
      easing: "ease-in-out",
      intensity: 1.0,
    },
    ffmpegCommand: () => "fade=t=in:st=0:d=1.0",
  };

  const mockSourceVideo: MediaFile = {
    id: "source",
    path: "/t1.mp4",
    name: "Source Video",
    type: "video",
    size: 1000000,
    duration: 10,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const mockTargetVideo: MediaFile = {
    id: "target",
    path: "/t2.mp4",
    name: "Target Video",
    type: "video",
    size: 1000000,
    duration: 10,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const defaultProps = {
    transition: mockTransition,
    sourceVideo: mockSourceVideo,
    targetVideo: mockTargetVideo,
    transitionType: "fade" as const,
    onClick: vi.fn(),
    size: 200,
    previewWidth: 200,
    previewHeight: 112,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTransitionAdded.mockReturnValue(false);
  });

  it("should render transition preview with videos", () => {
    render(<TransitionPreview {...defaultProps} />);

    // Проверяем наличие видео элементов
    const sourceVideo = screen.getByTestId("source-video");
    const targetVideo = screen.getByTestId("target-video");

    expect(sourceVideo).toBeInTheDocument();
    expect(targetVideo).toBeInTheDocument();
    expect(sourceVideo).toHaveAttribute("src", "/t1.mp4");
    expect(targetVideo).toHaveAttribute("src", "/t2.mp4");
  });

  it("should render transition name", () => {
    render(<TransitionPreview {...defaultProps} />);

    // Проверяем отображение названия перехода
    expect(screen.getByText("Тестовый переход")).toBeInTheDocument();
  });

  it("should render complexity indicator", () => {
    render(<TransitionPreview {...defaultProps} />);

    // Проверяем индикатор сложности (зеленый для basic)
    const complexityIndicator = screen.getByTitle(
      "transitions.complexity.basic",
    );
    expect(complexityIndicator).toBeInTheDocument();
    expect(complexityIndicator).toHaveClass("bg-green-500");
  });

  it("should render category indicator", () => {
    render(<TransitionPreview {...defaultProps} />);

    // Проверяем индикатор категории
    const categoryIndicator = screen.getByTitle("transitions.categories.basic");
    expect(categoryIndicator).toBeInTheDocument();
    expect(categoryIndicator).toHaveClass("bg-gray-700");
    expect(categoryIndicator).toHaveClass("text-white");
    expect(categoryIndicator).toHaveTextContent("BSC");
  });

  it("should render favorite button", () => {
    render(<TransitionPreview {...defaultProps} />);

    // Проверяем кнопку избранного
    const favoriteButton = screen.getByTestId("favorite-button");
    expect(favoriteButton).toBeInTheDocument();
    expect(favoriteButton).toHaveTextContent("Favorite Тестовый переход");
  });

  it("should render add media button", () => {
    render(<TransitionPreview {...defaultProps} />);

    // Проверяем кнопку добавления медиа
    const addButton = screen.getByTestId("add-button");
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("Add");
  });

  it("should show remove button when transition is added", () => {
    mockIsTransitionAdded.mockReturnValue(true);

    render(<TransitionPreview {...defaultProps} />);

    // Проверяем кнопку удаления
    const removeButton = screen.getByTestId("remove-button");
    expect(removeButton).toBeInTheDocument();
    expect(removeButton).toHaveTextContent("Remove");
  });

  it("should handle click event", () => {
    const mockOnClick = vi.fn();

    render(<TransitionPreview {...defaultProps} onClick={mockOnClick} />);

    // Кликаем на контейнер превью
    const container = screen.getByTestId("source-video").closest("div");
    act(() => {
      act(() => {
        fireEvent.click(container!);
      });
    });

    // Проверяем, что обработчик вызван
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("should handle mouse hover events", async () => {
    render(<TransitionPreview {...defaultProps} />);

    const container = screen.getByTestId("source-video").closest("div");
    const sourceVideo = screen.getByTestId("source-video");
    const targetVideo = screen.getByTestId("target-video");

    // Мокаем методы видео
    sourceVideo.play = vi.fn().mockResolvedValue(undefined);
    sourceVideo.pause = vi.fn();
    targetVideo.play = vi.fn().mockResolvedValue(undefined);
    targetVideo.pause = vi.fn();

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
    expect(sourceVideo.pause).toHaveBeenCalled();
    expect(targetVideo.pause).toHaveBeenCalled();
  });

  it("should handle add transition action", () => {
    render(<TransitionPreview {...defaultProps} />);

    const addButton = screen.getByTestId("add-button");
    act(() => {
      act(() => {
        fireEvent.click(addButton);
      });
    });

    // Проверяем, что переход добавлен с полным объектом Transition
    expect(mockAddTransition).toHaveBeenCalledWith(mockTransition);
  });

  it("should use custom preview dimensions", () => {
    render(
      <TransitionPreview
        {...defaultProps}
        previewWidth={300}
        previewHeight={200}
      />,
    );

    // Ищем контейнер с правильными размерами
    const container = screen
      .getByTestId("source-video")
      .closest("div")?.parentElement;
    expect(container).toHaveStyle({
      width: "300px",
      height: "200px",
    });
  });

  it("should handle different complexity levels", () => {
    const advancedTransition = {
      ...mockTransition,
      complexity: "advanced" as const,
    };

    render(
      <TransitionPreview {...defaultProps} transition={advancedTransition} />,
    );

    const complexityIndicator = screen.getByTitle(
      "transitions.complexity.advanced",
    );
    expect(complexityIndicator).toHaveClass("bg-red-500");
  });

  it("should handle different categories", () => {
    const creativeTransition = {
      ...mockTransition,
      category: "creative" as const,
    };

    render(
      <TransitionPreview {...defaultProps} transition={creativeTransition} />,
    );

    const categoryIndicator = screen.getByTitle(
      "transitions.categories.creative",
    );
    expect(categoryIndicator).toHaveClass("bg-gray-700");
    expect(categoryIndicator).toHaveTextContent("CRE");
  });

  it("should handle transition without transition prop", () => {
    const { transition, ...propsWithoutTransition } = defaultProps;

    render(<TransitionPreview {...propsWithoutTransition} />);

    // Должен найти переход по типу из хука
    expect(screen.getByText("Затухание")).toBeInTheDocument();
  });

  it("should handle fallback when transition not found", () => {
    render(<TransitionPreview {...defaultProps} transitionType="unknown" />);

    // Должен отображать fallback название (в данном случае создается fallback объект)
    // Проверяем, что компонент рендерится без ошибок
    expect(screen.getByTestId("source-video")).toBeInTheDocument();
    expect(screen.getByTestId("target-video")).toBeInTheDocument();
  });
});
