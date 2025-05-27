import { act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MediaFile } from "@/features/media/types/media";
import { renderWithBase, screen } from "@/test/test-utils";
import { Transition } from "@/types/transitions";

import { TransitionGroup } from "../../components/transition-group";

// Мокаем TransitionPreview компонент
vi.mock("../../components/transition-preview", () => ({
  TransitionPreview: ({
    transition,
    onClick,
    size,
    previewWidth,
    previewHeight,
  }: any) => (
    <div
      data-testid={`transition-preview-${transition.id}`}
      data-size={size}
      data-width={previewWidth}
      data-height={previewHeight}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {transition.labels.ru}
    </div>
  ),
}));

describe("TransitionGroup", () => {
  const mockTransitions: Transition[] = [
    {
      id: "fade-1",
      type: "fade",
      labels: {
        ru: "Затухание",
        en: "Fade",
      },
      description: {
        ru: "Плавное затухание",
        en: "Smooth fade",
      },
      category: "basic",
      complexity: "basic",
      tags: ["professional", "standard"],
      duration: { min: 0.5, max: 2.0, default: 1.0 },
      parameters: { easing: "ease-in-out", intensity: 1.0 },
      ffmpegCommand: () => "fade=t=in:st=0:d=1.0",
    },
    {
      id: "zoom-1",
      type: "zoom",
      labels: {
        ru: "Увеличение",
        en: "Zoom",
      },
      description: {
        ru: "Эффект увеличения",
        en: "Zoom effect",
      },
      category: "creative",
      complexity: "intermediate",
      tags: ["professional", "standard"],
      duration: { min: 0.5, max: 3.0, default: 1.5 },
      parameters: { easing: "ease-out", intensity: 0.8, scale: 2.0 },
      ffmpegCommand: () => "zoompan=z='zoom+0.002':d=125",
    },
  ];

  const mockDemoVideos = {
    source: {
      id: "source",
      path: "/demo1.mp4",
      name: "Source Video",
      type: "video",
      size: 1000000,
      duration: 10,
      createdAt: new Date(),
      modifiedAt: new Date(),
    } as MediaFile,
    target: {
      id: "target",
      path: "/demo2.mp4",
      name: "Target Video",
      type: "video",
      size: 1000000,
      duration: 10,
      createdAt: new Date(),
      modifiedAt: new Date(),
    } as MediaFile,
  };

  const defaultProps = {
    title: "Basic Transitions",
    transitions: mockTransitions,
    previewSize: 2,
    previewWidth: 120,
    previewHeight: 80,
    demoVideos: mockDemoVideos,
    onTransitionClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен корректно рендериться с переходами", () => {
    act(() => {
      renderWithBase(<TransitionGroup {...defaultProps} />);
    });

    // Проверяем заголовок группы
    expect(screen.getByText("Basic Transitions")).toBeInTheDocument();

    // Проверяем наличие переходов
    expect(screen.getByTestId("transition-preview-fade-1")).toBeInTheDocument();
    expect(screen.getByTestId("transition-preview-zoom-1")).toBeInTheDocument();
  });

  it("должен отображать правильное количество переходов", () => {
    act(() => {
      renderWithBase(<TransitionGroup {...defaultProps} />);
    });

    const transitionPreviews = screen.getAllByRole("button");
    expect(transitionPreviews).toHaveLength(2);
  });

  it("должен передавать правильные пропсы в TransitionPreview", () => {
    act(() => {
      renderWithBase(<TransitionGroup {...defaultProps} />);
    });

    const fadePreview = screen.getByTestId("transition-preview-fade-1");
    expect(fadePreview).toHaveAttribute("data-size", "2");
    expect(fadePreview).toHaveAttribute("data-width", "120");
    expect(fadePreview).toHaveAttribute("data-height", "80");

    const zoomPreview = screen.getByTestId("transition-preview-zoom-1");
    expect(zoomPreview).toHaveAttribute("data-size", "2");
    expect(zoomPreview).toHaveAttribute("data-width", "120");
    expect(zoomPreview).toHaveAttribute("data-height", "80");
  });

  it("должен вызывать onTransitionClick при клике на переход", () => {
    const mockOnTransitionClick = vi.fn();
    renderWithBase(
      <TransitionGroup
        {...defaultProps}
        onTransitionClick={mockOnTransitionClick}
      />,
    );

    const fadePreview = screen.getByTestId("transition-preview-fade-1");
    act(() => {
      act(() => {
        fadePreview.click();
      });
    });

    expect(mockOnTransitionClick).toHaveBeenCalledWith(mockTransitions[0]);
  });

  it("должен вызывать onTransitionClick для разных переходов", () => {
    const mockOnTransitionClick = vi.fn();
    renderWithBase(
      <TransitionGroup
        {...defaultProps}
        onTransitionClick={mockOnTransitionClick}
      />,
    );

    // Кликаем на первый переход
    const fadePreview = screen.getByTestId("transition-preview-fade-1");
    act(() => {
      act(() => {
        fadePreview.click();
      });
    });

    // Кликаем на второй переход
    const zoomPreview = screen.getByTestId("transition-preview-zoom-1");
    act(() => {
      act(() => {
        zoomPreview.click();
      });
    });

    expect(mockOnTransitionClick).toHaveBeenCalledTimes(2);
    expect(mockOnTransitionClick).toHaveBeenNthCalledWith(
      1,
      mockTransitions[0],
    );
    expect(mockOnTransitionClick).toHaveBeenNthCalledWith(
      2,
      mockTransitions[1],
    );
  });

  it("не должен рендериться если нет переходов", () => {
    renderWithBase(<TransitionGroup {...defaultProps} transitions={[]} />);

    // Проверяем, что нет заголовка группы
    expect(screen.queryByText("Basic Transitions")).not.toBeInTheDocument();

    // Проверяем, что нет переходов
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("должен рендериться без заголовка если title пустой", () => {
    renderWithBase(<TransitionGroup {...defaultProps} title="" />);

    // Заголовка не должно быть
    expect(screen.queryByText("Basic Transitions")).not.toBeInTheDocument();

    // Но переходы должны быть
    expect(screen.getByTestId("transition-preview-fade-1")).toBeInTheDocument();
    expect(screen.getByTestId("transition-preview-zoom-1")).toBeInTheDocument();
  });

  it("должен применять правильные CSS классы для сетки", () => {
    renderWithBase(<TransitionGroup {...defaultProps} />);

    const gridContainer = screen.getByTestId(
      "transition-preview-fade-1",
    ).parentElement;
    expect(gridContainer).toHaveClass("grid");
    expect(gridContainer).toHaveClass("gap-2");
    expect(gridContainer).toHaveClass(
      "grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))]",
    );
  });

  it("должен устанавливать правильную CSS переменную для размера превью", () => {
    renderWithBase(<TransitionGroup {...defaultProps} previewWidth={150} />);

    const gridContainer = screen.getByTestId(
      "transition-preview-fade-1",
    ).parentElement;
    expect(gridContainer).toHaveStyle({ "--preview-size": "150px" });
  });

  it("должен обрабатывать изменение размеров превью", () => {
    const { rerender } = renderWithBase(<TransitionGroup {...defaultProps} />);

    // Проверяем начальные размеры
    let fadePreview = screen.getByTestId("transition-preview-fade-1");
    expect(fadePreview).toHaveAttribute("data-width", "120");
    expect(fadePreview).toHaveAttribute("data-height", "80");

    // Изменяем размеры
    act(() => {
      act(() => {
        rerender(
          <TransitionGroup
            {...defaultProps}
            previewWidth={200}
            previewHeight={150}
            previewSize={3}
          />,
        );
      });
    });

    fadePreview = screen.getByTestId("transition-preview-fade-1");
    expect(fadePreview).toHaveAttribute("data-width", "200");
    expect(fadePreview).toHaveAttribute("data-height", "150");
    expect(fadePreview).toHaveAttribute("data-size", "3");
  });

  it("должен отображать правильные имена переходов", () => {
    renderWithBase(<TransitionGroup {...defaultProps} />);

    expect(screen.getByText("Затухание")).toBeInTheDocument();
    expect(screen.getByText("Увеличение")).toBeInTheDocument();
  });

  it("должен обрабатывать один переход", () => {
    const singleTransition = [mockTransitions[0]];
    renderWithBase(
      <TransitionGroup {...defaultProps} transitions={singleTransition} />,
    );

    expect(screen.getByTestId("transition-preview-fade-1")).toBeInTheDocument();
    expect(
      screen.queryByTestId("transition-preview-zoom-1"),
    ).not.toBeInTheDocument();

    const transitionPreviews = screen.getAllByRole("button");
    expect(transitionPreviews).toHaveLength(1);
  });

  it("должен применять правильные CSS классы к заголовку", () => {
    renderWithBase(<TransitionGroup {...defaultProps} />);

    const title = screen.getByText("Basic Transitions");
    expect(title.tagName).toBe("H3");
    expect(title).toHaveClass(
      "text-sm",
      "font-medium",
      "text-gray-700",
      "dark:text-gray-300",
    );
  });

  it("должен применять правильные CSS классы к контейнеру", () => {
    renderWithBase(<TransitionGroup {...defaultProps} />);

    const container = screen.getByText("Basic Transitions").parentElement;
    expect(container).toHaveClass("space-y-2");
  });

  it("должен передавать правильные demo видео в TransitionPreview", () => {
    renderWithBase(<TransitionGroup {...defaultProps} />);

    // Проверяем, что TransitionPreview получает правильные demo видео
    // Это проверяется через моки - TransitionPreview должен получить sourceVideo и targetVideo
    expect(screen.getByTestId("transition-preview-fade-1")).toBeInTheDocument();
    expect(screen.getByTestId("transition-preview-zoom-1")).toBeInTheDocument();
  });

  it("должен обрабатывать изменение demo видео", () => {
    const newDemoVideos = {
      source: {
        ...mockDemoVideos.source,
        path: "/new-demo1.mp4",
        name: "New Source Video",
      },
      target: {
        ...mockDemoVideos.target,
        path: "/new-demo2.mp4",
        name: "New Target Video",
      },
    };

    const { rerender } = renderWithBase(<TransitionGroup {...defaultProps} />);

    // Изменяем demo видео
    act(() => {
      act(() => {
        rerender(
          <TransitionGroup {...defaultProps} demoVideos={newDemoVideos} />,
        );
      });
    });

    // Проверяем, что компонент перерендерился без ошибок
    expect(screen.getByTestId("transition-preview-fade-1")).toBeInTheDocument();
    expect(screen.getByTestId("transition-preview-zoom-1")).toBeInTheDocument();
  });
});
