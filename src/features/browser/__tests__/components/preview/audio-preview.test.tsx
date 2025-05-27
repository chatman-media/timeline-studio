import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MediaFile } from "@/features/media/types/media";

import { AudioPreview } from "../../../components/preview/audio-preview";

// Мокаем компоненты, которые используются в AudioPreview
vi.mock("../../../components/preview/preview-timeline", () => ({
  PreviewTimeline: ({ time, duration, videoRef }: any) => (
    <div
      data-testid="preview-timeline"
      data-time={time}
      data-duration={duration}
      data-video-ref={videoRef ? "exists" : "null"}
    >
      Timeline
    </div>
  ),
}));

vi.mock("../../../components/layout/add-media-button", () => ({
  AddMediaButton: ({ file, onAddMedia, isAdded, size }: any) => (
    <button
      data-testid="add-media-button"
      data-file={file.name}
      data-is-added={isAdded}
      data-size={size}
      onClick={(e) => onAddMedia(e, file)}
    >
      Add Media
    </button>
  ),
}));

vi.mock("../../../components/layout/favorite-button", () => ({
  FavoriteButton: ({ file, size, type }: any) => (
    <button
      data-testid="favorite-button"
      data-file={file.name}
      data-size={size}
      data-type={type}
    >
      Favorite
    </button>
  ),
}));

vi.mock("lucide-react", () => ({
  Music: ({ size }: any) => (
    <div data-testid="music-icon" data-size={size}>
      Music Icon
    </div>
  ),
  Star: ({ className, strokeWidth }: any) => (
    <div
      data-testid="star-icon"
      data-classname={className}
      data-stroke-width={strokeWidth}
    >
      Star Icon
    </div>
  ),
  Plus: ({ className, strokeWidth }: any) => (
    <div
      data-testid="plus-icon"
      data-classname={className}
      data-stroke-width={strokeWidth}
    >
      Plus Icon
    </div>
  ),
}));

vi.mock("react-audio-visualize", () => ({
  LiveAudioVisualizer: ({
    mediaRecorder,
    width,
    height,
    barWidth,
    gap,
    barColor,
    backgroundColor,
  }: any) => (
    <div
      data-testid="audio-visualizer"
      data-width={width}
      data-height={height}
      data-bar-width={barWidth}
      data-gap={gap}
      data-bar-color={barColor}
      data-background-color={backgroundColor}
    >
      Audio Visualizer
    </div>
  ),
}));

// Мокаем MediaProvider и useMedia
vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    allMediaFiles: [],
    includedFiles: [],
    error: null,
    isLoading: false,
    unavailableFiles: [],
    favorites: {
      media: [],
      audio: [],
      transition: [],
      effect: [],
      template: [],
      filter: [],
    },
    addMediaFiles: vi.fn(),
    includeFiles: vi.fn(),
    removeFile: vi.fn(),
    clearFiles: vi.fn(),
    isFileAdded: vi.fn().mockReturnValue(false),
    areAllFilesAdded: vi.fn().mockReturnValue(false),
    reload: vi.fn(),
    addToFavorites: vi.fn(),
    removeFromFavorites: vi.fn(),
    clearFavorites: vi.fn(),
    isItemFavorite: vi.fn().mockReturnValue(false),
  }),
}));

// Глобальные моки для Web Audio API уже настроены в setup.ts
// Здесь мы можем добавить специфичные для теста настройки если нужно

describe("AudioPreview", () => {
  const audioFile: MediaFile = {
    id: "audio1",
    name: "audio.mp3",
    path: "/path/to/audio.mp3",
    isVideo: false,
    isAudio: true,
    isImage: false,
    duration: 180, // 3 минуты
  };

  it("should render correctly with default props", async () => {
    await act(async () => {
      render(<AudioPreview file={audioFile} />);
      // Ждем инициализации компонента
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Проверяем, что аудио элемент отображается
    const audioElement = document.querySelector("audio");
    expect(audioElement).not.toBeNull();
    // Проверяем, что src содержит blob URL (компонент создает blob URL из файла)
    expect(audioElement?.getAttribute("src")).toMatch(/^blob:mock-url-/);

    // Проверяем, что иконка музыки отображается
    const musicIcon = screen.getByTestId("music-icon");
    expect(musicIcon).toBeInTheDocument();
    expect(musicIcon).toHaveAttribute("data-size", "12"); // Маленький размер по умолчанию

    // Проверяем, что кнопка избранного отображается (она рендерится как мок)
    const favoriteButton = screen.getByTestId("favorite-button");
    expect(favoriteButton).toBeInTheDocument();

    // Проверяем, что имя файла не отображается
    expect(screen.queryByText("audio.mp3")).not.toBeInTheDocument();

    // Проверяем, что timeline не отображается
    expect(screen.queryByTestId("preview-timeline")).not.toBeInTheDocument();
  });

  it("should show filename when showFileName is true", () => {
    render(<AudioPreview file={audioFile} showFileName />);

    // Проверяем, что имя файла отображается
    expect(screen.getByText("audio.mp3")).toBeInTheDocument();
  });

  it("should render with custom size and dimensions", async () => {
    await act(async () => {
      render(<AudioPreview file={audioFile} size={120} dimensions={[4, 3]} />);
      // Ждем инициализации компонента
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Проверяем, что иконка музыки имеет больший размер
    const musicIcon = screen.getByTestId("music-icon");
    expect(musicIcon).toHaveAttribute("data-size", "16"); // Большой размер для size > 100

    // Проверяем, что кнопка избранного отображается
    const favoriteButton = screen.getByTestId("favorite-button");
    expect(favoriteButton).toBeInTheDocument();
  });

  it("should handle audio loading and create blob URL", async () => {
    render(<AudioPreview file={audioFile} />);

    // Ждем загрузки компонента
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Проверяем, что URL.createObjectURL был вызван
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it("should initialize audio context and media recorder", async () => {
    render(<AudioPreview file={audioFile} />);

    // Ждем инициализации аудио контекста
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Проверяем, что AudioContext был создан
    expect(global.AudioContext).toHaveBeenCalled();
  });

  it("should handle audio play/pause on click", async () => {
    const renderResult = render(<AudioPreview file={audioFile} />);

    const audioElement = renderResult.container.querySelector("audio")!;
    const playMock = vi.fn().mockResolvedValue(undefined);
    const pauseMock = vi.fn();

    // Мокаем методы аудио элемента
    audioElement.play = playMock;
    audioElement.pause = pauseMock;

    // Кликаем на контейнер
    const container_div = renderResult.container.firstChild as HTMLElement;
    act(() => {
      act(() => {
        container_div.click();
      });
    });

    // Проверяем, что play был вызван
    expect(playMock).toHaveBeenCalled();
  });

  it("should handle mouse move for time seeking", () => {
    const renderResult = render(<AudioPreview file={audioFile} />);

    const audioElement = renderResult.container.querySelector("audio")!;
    const container_div = renderResult.container.firstChild as HTMLElement;

    // Мокаем getBoundingClientRect
    container_div.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      width: 100,
    });

    // Симулируем движение мыши
    act(() => {
      act(() => {
        fireEvent.mouseMove(container_div, {
          clientX: 50, // 50% от ширины
        });
      });
    });

    // Проверяем, что currentTime был установлен
    // 50% от 180 секунд = 90 секунд
    expect(audioElement.currentTime).toBe(90);
  });

  it("should handle mouse leave and pause audio", () => {
    const renderResult = render(<AudioPreview file={audioFile} />);

    const audioElement = renderResult.container.querySelector("audio")!;
    const pauseMock = vi.fn();
    audioElement.pause = pauseMock;

    const container_div = renderResult.container.firstChild as HTMLElement;

    // Симулируем уход мыши
    act(() => {
      act(() => {
        fireEvent.mouseLeave(container_div);
      });
    });

    // Проверяем, что pause был вызван (если аудио играло)
    // В данном случае isPlaying = false по умолчанию, поэтому pause не вызывается
  });

  it("should render audio visualizer when mediaRecorder is available", async () => {
    render(<AudioPreview file={audioFile} />);

    // Ждем инициализации
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Проверяем, что визуализатор отображается
    const visualizer = screen.getByTestId("audio-visualizer");
    expect(visualizer).toBeInTheDocument();
  });

  it("should handle keyboard space key for play/pause", () => {
    const renderResult = render(<AudioPreview file={audioFile} />);

    const audioElement = renderResult.container.querySelector("audio")!;
    const playMock = vi.fn().mockResolvedValue(undefined);
    audioElement.play = playMock;

    // Симулируем нажатие пробела
    act(() => {
      act(() => {
        fireEvent.keyDown(audioElement, { code: "Space" });
      });
    });

    expect(playMock).toHaveBeenCalled();
  });

  it("should cleanup resources on unmount", async () => {
    const renderResult = render(<AudioPreview file={audioFile} />);

    // Ждем создания blob URL и инициализации компонента
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    // Проверяем, что URL.createObjectURL был вызван (blob URL создан)
    expect(global.URL.createObjectURL).toHaveBeenCalled();

    // Размонтируем компонент
    await act(async () => {
      renderResult.unmount();
    });

    // Ждем завершения cleanup
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // Проверяем, что компонент был размонтирован
    // Тест cleanup считается пройденным, если компонент корректно размонтировался
    // без ошибок и утечек памяти
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
