import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MediaFile } from "@/features/media/types/media";

import { PlayerControls } from "./player-controls";

// Мокаем usePlayer из player-provider
const mockSetIsPlaying = vi.fn();
const mockSetCurrentTime = vi.fn();
const mockSetVolume = vi.fn();
const mockSetIsRecording = vi.fn();
const mockSetIsSeeking = vi.fn();
const mockSetIsResizableMode = vi.fn();

vi.mock("../services/player-provider", () => ({
  usePlayer: () => ({
    isPlaying: false,
    setIsPlaying: mockSetIsPlaying,
    setCurrentTime: mockSetCurrentTime,
    volume: 50,
    setVolume: mockSetVolume,
    isRecording: false,
    setIsRecording: mockSetIsRecording,
    setIsSeeking: mockSetIsSeeking,
    isChangingCamera: false,
    isResizableMode: true,
    setIsResizableMode: mockSetIsResizableMode,
  }),
}));

// Мокаем useFullscreen из use-fullscreen
const mockToggleFullscreen = vi.fn();
vi.mock("../hooks/use-fullscreen", () => ({
  useFullscreen: () => ({
    isFullscreen: false,
    toggleFullscreen: mockToggleFullscreen,
  }),
}));

// Мокаем VolumeSlider из volume-slider
vi.mock("./volume-slider", () => ({
  VolumeSlider: ({ volume, onValueChange, onValueCommit }: any) => (
    <div data-testid="volume-slider" data-volume={volume}>
      <button
        data-testid="volume-slider-change"
        onClick={() => onValueChange([75])}
      >
        Change Volume
      </button>
      <button data-testid="volume-slider-commit" onClick={onValueCommit}>
        Commit Volume
      </button>
    </div>
  ),
}));

// Мокаем getFrameTime из @/lib/video
vi.mock("@/lib/video", () => ({
  getFrameTime: vi.fn().mockReturnValue(0.04), // 25 fps
}));

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Мокаем компоненты из lucide-react
vi.mock("lucide-react", () => ({
  Camera: () => <div data-testid="camera-icon" />,
  ChevronFirst: () => <div data-testid="chevron-first-icon" />,
  ChevronLast: () => <div data-testid="chevron-last-icon" />,
  CircleDot: () => <div data-testid="circle-dot-icon" />,
  Grid2x2: () => <div data-testid="grid-icon" />,
  Maximize2: () => <div data-testid="maximize-icon" />,
  Minimize2: () => <div data-testid="minimize-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  Play: () => <div data-testid="play-icon" />,
  SquarePlay: () => <div data-testid="square-play-icon" />,
  StepBack: () => <div data-testid="step-back-icon" />,
  StepForward: () => <div data-testid="step-forward-icon" />,
  UnfoldHorizontal: () => <div data-testid="unfold-horizontal-icon" />,
  Volume2: () => <div data-testid="volume-icon" />,
  VolumeX: () => <div data-testid="volume-x-icon" />,
}));

// Мокаем компоненты из @/components/ui
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, title, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} title={title} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/slider", () => ({
  Slider: ({
    value,
    min,
    max,
    step,
    onValueChange,
    disabled,
    className,
  }: any) => (
    <input
      type="range"
      value={value[0]}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      disabled={disabled}
      className={className}
      data-testid="timeline-slider"
    />
  ),
}));

// Мокаем console.log для проверки вызова
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// Создаем тестовый объект MediaFile
const testVideo: MediaFile = {
  id: "test-video-1",
  name: "Test Video",
  path: "/path/to/test-video.mp4",
  duration: 120,
  startTime: 0,
  endTime: 120,
};

describe("PlayerControls", () => {
  it("should render all controls", () => {
    // Рендерим компонент
    render(<PlayerControls currentTime={10} file={testVideo} />);

    // Проверяем, что все основные элементы управления отрендерились
    expect(screen.getByTestId("play-icon")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-slider")).toBeInTheDocument();
    expect(screen.getByTestId("volume-slider")).toBeInTheDocument();
  });

  it("should toggle play/pause when play button is clicked", () => {
    // Рендерим компонент
    render(<PlayerControls currentTime={10} file={testVideo} />);

    // Находим кнопку воспроизведения
    const playButton = screen.getByTestId("play-icon").closest("button");

    // Кликаем по кнопке
    if (playButton) {
      act(() => {
        act(() => {
          fireEvent.click(playButton);
        });
      });
    }

    // Проверяем, что setIsPlaying был вызван с правильным значением
    expect(mockSetIsPlaying).toHaveBeenCalledWith(true);
  });

  it("should toggle recording when record button is clicked", () => {
    // Рендерим компонент
    render(<PlayerControls currentTime={10} file={testVideo} />);

    // Находим кнопку записи
    const recordButton = screen
      .getByTestId("circle-dot-icon")
      .closest("button");

    // Кликаем по кнопке
    if (recordButton) {
      act(() => {
        act(() => {
          fireEvent.click(recordButton);
        });
      });
    }

    // Проверяем, что setIsRecording был вызван с правильным значением
    expect(mockSetIsRecording).toHaveBeenCalledWith(true);
  });

  it("should skip forward when next frame button is clicked", () => {
    // Рендерим компонент
    render(<PlayerControls currentTime={10} file={testVideo} />);

    // Находим кнопку следующего кадра
    const nextFrameButton = screen
      .getByTestId("step-forward-icon")
      .closest("button");

    // Кликаем по кнопке
    if (nextFrameButton) {
      act(() => {
        act(() => {
          fireEvent.click(nextFrameButton);
        });
      });
    }

    // Проверяем, что setCurrentTime был вызван с правильным значением (текущее время + frameTime)
    expect(mockSetCurrentTime).toHaveBeenCalledWith(10.04);
    expect(mockSetIsSeeking).toHaveBeenCalledWith(true);
  });

  it("should skip backward when previous frame button is clicked", () => {
    // Рендерим компонент
    render(<PlayerControls currentTime={10} file={testVideo} />);

    // Находим кнопку предыдущего кадра
    const prevFrameButton = screen
      .getByTestId("step-back-icon")
      .closest("button");

    // Кликаем по кнопке
    if (prevFrameButton) {
      act(() => {
        act(() => {
          fireEvent.click(prevFrameButton);
        });
      });
    }

    // Проверяем, что setCurrentTime был вызван с правильным значением (текущее время - frameTime)
    expect(mockSetCurrentTime).toHaveBeenCalledWith(9.96);
    expect(mockSetIsSeeking).toHaveBeenCalledWith(true);
  });

  it("should go to first frame when first frame button is clicked", () => {
    // Рендерим компонент
    render(<PlayerControls currentTime={10} file={testVideo} />);

    // Находим кнопку первого кадра
    const firstFrameButton = screen
      .getByTestId("chevron-first-icon")
      .closest("button");

    // Кликаем по кнопке
    if (firstFrameButton) {
      act(() => {
        act(() => {
          fireEvent.click(firstFrameButton);
        });
      });
    }

    // Проверяем, что setCurrentTime был вызван с правильным значением (startTime)
    expect(mockSetCurrentTime).toHaveBeenCalledWith(0);
    expect(mockSetIsSeeking).toHaveBeenCalledWith(true);
  });

  it("should go to last frame when last frame button is clicked", () => {
    // Рендерим компонент
    render(<PlayerControls currentTime={10} file={testVideo} />);

    // Находим кнопку последнего кадра
    const lastFrameButton = screen
      .getByTestId("chevron-last-icon")
      .closest("button");

    // Кликаем по кнопке
    if (lastFrameButton) {
      act(() => {
        act(() => {
          fireEvent.click(lastFrameButton);
        });
      });
    }

    // Проверяем, что setCurrentTime был вызван с правильным значением (endTime)
    expect(mockSetCurrentTime).toHaveBeenCalledWith(120);
    expect(mockSetIsSeeking).toHaveBeenCalledWith(true);
  });

  it("should toggle resizable mode when resizable button is clicked", () => {
    // Рендерим компонент
    render(<PlayerControls currentTime={10} file={testVideo} />);

    // Находим кнопку переключения режима resizable
    const resizableButton = screen
      .getByTestId("unfold-horizontal-icon")
      .closest("button");

    // Кликаем по кнопке
    if (resizableButton) {
      act(() => {
        act(() => {
          fireEvent.click(resizableButton);
        });
      });
    }

    // Проверяем, что setIsResizableMode был вызван с правильным значением
    expect(mockSetIsResizableMode).toHaveBeenCalledWith(false);
  });

  it("should change volume when volume slider is used", () => {
    // Рендерим компонент
    render(<PlayerControls currentTime={10} file={testVideo} />);

    // Находим кнопку изменения громкости в слайдере
    const volumeChangeButton = screen.getByTestId("volume-slider-change");

    // Кликаем по кнопке
    act(() => {
      act(() => {
        fireEvent.click(volumeChangeButton);
      });
    });

    // Проверяем, что setVolume был вызван с правильным значением
    expect(mockSetVolume).toHaveBeenCalledWith(75);
  });

  it("should toggle fullscreen when fullscreen button is clicked", () => {
    // Создаем мок для querySelector
    const mockQuerySelector = vi
      .spyOn(document, "querySelector")
      .mockReturnValue(document.createElement("div"));

    // Рендерим компонент
    render(<PlayerControls currentTime={10} file={testVideo} />);

    // Находим кнопку полноэкранного режима
    const fullscreenButton = screen
      .getByTestId("maximize-icon")
      .closest("button");

    // Кликаем по кнопке
    if (fullscreenButton) {
      act(() => {
        act(() => {
          fireEvent.click(fullscreenButton);
        });
      });
    }

    // Проверяем, что querySelector был вызван с правильным селектором
    expect(mockQuerySelector).toHaveBeenCalledWith(".media-player-container");

    // Проверяем, что toggleFullscreen был вызван
    expect(mockToggleFullscreen).toHaveBeenCalled();

    // Восстанавливаем оригинальную функцию querySelector
    mockQuerySelector.mockRestore();
  });
});
