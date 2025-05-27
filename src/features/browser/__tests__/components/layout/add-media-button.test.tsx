import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaFile } from "@/features/media/types/media";

import { AddMediaButton } from "../../../components/layout/add-media-button";

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.media.add": "Add to timeline",
        "browser.media.added": "Added to timeline",
        "browser.media.remove": "Remove from timeline",
      };
      return translations[key] || key;
    },
  }),
}));

// Мокаем Lucide иконки
vi.mock("lucide-react", () => ({
  Plus: ({ className, strokeWidth }: any) => (
    <div
      data-testid="plus-icon"
      className={className}
      data-stroke-width={strokeWidth}
    >
      Plus Icon
    </div>
  ),
  Check: ({ className, strokeWidth }: any) => (
    <div
      data-testid="check-icon"
      className={className}
      data-stroke-width={strokeWidth}
    >
      Check Icon
    </div>
  ),
  X: ({ className, strokeWidth }: any) => (
    <div
      data-testid="x-icon"
      className={className}
      data-stroke-width={strokeWidth}
    >
      X Icon
    </div>
  ),
}));

describe("AddMediaButton", () => {
  // Создаем тестовый файл
  const testFile: MediaFile = {
    id: "test-id",
    name: "test-file.mp4",
    path: "/path/to/test-file.mp4",
    isVideo: true,
    isAudio: false,
    isImage: false,
    size: 1024,
    duration: 60,
  };

  // Мокаем функции обратного вызова
  const onAddMedia = vi.fn();
  const onRemoveMedia = vi.fn();

  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks();
    // Мокаем setTimeout и clearTimeout
    vi.useFakeTimers();
  });

  // Восстанавливаем оригинальные функции после тестов
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render add button when isAdded is false", () => {
    // Рендерим компонент
    render(
      <AddMediaButton
        file={testFile}
        isAdded={false}
        onAddMedia={onAddMedia}
      />,
    );

    // Проверяем, что отображается иконка Plus
    expect(screen.getByTestId("plus-icon")).toBeInTheDocument();

    // Проверяем, что кнопка имеет правильный title
    expect(screen.getByTitle("Add to timeline")).toBeInTheDocument();

    // Проверяем, что кнопка имеет класс invisible (скрыта по умолчанию)
    const button = screen.getByTitle("Add to timeline");
    expect(button.className).toContain("invisible");
    expect(button.className).toContain("group-hover:visible");
  });

  it("should render check icon when isAdded is true", () => {
    // Рендерим компонент
    render(<AddMediaButton file={testFile} isAdded onAddMedia={onAddMedia} />);

    // Проверяем, что отображается иконка Check
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();

    // Проверяем, что кнопка имеет правильный title
    expect(screen.getByTitle("Added to timeline")).toBeInTheDocument();

    // Проверяем, что кнопка имеет класс visible
    const button = screen.getByTitle("Added to timeline");
    expect(button.className).toContain("visible");
  });

  it("should call onAddMedia when clicked and not added", () => {
    // Рендерим компонент
    render(
      <AddMediaButton
        file={testFile}
        isAdded={false}
        onAddMedia={onAddMedia}
      />,
    );

    // Кликаем на кнопку
    act(() => {
      act(() => {
        fireEvent.click(screen.getByTitle("Add to timeline"));
      });
    });

    // Проверяем, что onAddMedia был вызван с правильными аргументами
    expect(onAddMedia).toHaveBeenCalledTimes(1);
    expect(onAddMedia).toHaveBeenCalledWith(expect.anything(), testFile);
  });

  it("should show remove icon on hover when isAdded is true and not recently added", () => {
    // Рендерим компонент
    render(
      <AddMediaButton
        file={testFile}
        isAdded
        onAddMedia={onAddMedia}
        onRemoveMedia={onRemoveMedia}
      />,
    );

    // Проверяем, что изначально отображается иконка Check
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();

    // Продвигаем таймеры вперед, чтобы сбросить флаг isRecentlyAdded
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Получаем кнопку
    const button = screen.getByTitle("Added to timeline");

    // Симулируем наведение на кнопку
    act(() => {
      act(() => {
        fireEvent.mouseEnter(button);
      });
    });

    // Проверяем, что title изменился
    expect(screen.getByTitle("Remove from timeline")).toBeInTheDocument();

    // Проверяем, что отображается иконка X
    expect(screen.getByTestId("x-icon")).toBeInTheDocument();
  });

  it("should call onRemoveMedia when clicked on remove icon", () => {
    // Рендерим компонент
    render(
      <AddMediaButton
        file={testFile}
        isAdded
        onAddMedia={onAddMedia}
        onRemoveMedia={onRemoveMedia}
      />,
    );

    // Продвигаем таймеры вперед, чтобы сбросить флаг isRecentlyAdded
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Получаем кнопку
    const button = screen.getByTitle("Added to timeline");

    // Симулируем наведение на кнопку
    act(() => {
      act(() => {
        fireEvent.mouseEnter(button);
      });
    });

    // Кликаем на кнопку удаления
    act(() => {
      act(() => {
        fireEvent.click(screen.getByTitle("Remove from timeline"));
      });
    });

    // Проверяем, что onRemoveMedia был вызван с правильными аргументами
    expect(onRemoveMedia).toHaveBeenCalledTimes(1);
    expect(onRemoveMedia).toHaveBeenCalledWith(expect.anything(), testFile);
  });

  it("should use onAddMedia as fallback if onRemoveMedia is not provided", () => {
    // Рендерим компонент без onRemoveMedia
    render(<AddMediaButton file={testFile} isAdded onAddMedia={onAddMedia} />);

    // Продвигаем таймеры вперед, чтобы сбросить флаг isRecentlyAdded
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Получаем кнопку
    const button = screen.getByTitle("Added to timeline");

    // Симулируем наведение на кнопку
    act(() => {
      act(() => {
        fireEvent.mouseEnter(button);
      });
    });

    // Кликаем на кнопку удаления
    act(() => {
      act(() => {
        fireEvent.click(screen.getByTitle("Remove from timeline"));
      });
    });

    // Проверяем, что onAddMedia был вызван с правильными аргументами
    expect(onAddMedia).toHaveBeenCalledTimes(1);
    expect(onAddMedia).toHaveBeenCalledWith(expect.anything(), testFile);
  });

  it("should apply different styles based on size prop", () => {
    // Рендерим компонент с большим размером
    const { rerender } = render(
      <AddMediaButton
        file={testFile}
        isAdded={false}
        size={120}
        onAddMedia={onAddMedia}
      />,
    );

    // Проверяем, что иконка имеет правильный класс для большого размера
    expect(screen.getByTestId("plus-icon").className).toContain("h-3.5 w-3.5");

    // Проверяем, что кнопка имеет правильное позиционирование для большого размера
    expect(screen.getByTitle("Add to timeline").className).toContain(
      "right-[5px] bottom-1",
    );

    // Перерендериваем компонент с маленьким размером
    act(() => {
      rerender(
        <AddMediaButton
          file={testFile}
          isAdded={false}
          size={60}
          onAddMedia={onAddMedia}
        />,
      );
    });

    // Проверяем, что иконка имеет правильный класс для маленького размера
    expect(screen.getByTestId("plus-icon").className).toContain("h-2.5 w-2.5");

    // Проверяем, что кнопка имеет правильное позиционирование для маленького размера
    expect(screen.getByTitle("Add to timeline").className).toContain(
      "right-1 bottom-0.5",
    );
  });

  it("should not render if onAddMedia is not provided", () => {
    // Рендерим компонент без onAddMedia
    const renderResult = render(
      <AddMediaButton file={testFile} isAdded={false} />,
    );

    // Проверяем, что компонент не отрендерен
    expect(renderResult.container.firstChild).toBeNull();
  });
});
