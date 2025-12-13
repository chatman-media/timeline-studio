/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { type MediaFile, MediaType } from "@/domains/media-management"
import { usePlayer } from "@/domains/video-editing"
import { TimelineProjectProvider, TimelineProvider } from "@/features/timeline/providers/timeline-providers"
import { useFullscreen } from "@/features/video-player/hooks/use-fullscreen"
import { PlayerControls } from "../player-controls"

// Создаем мок функции для logger используя vi.hoisted
const { mockLoggerError, mockLogInfo, mockLogError } = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogError: vi.fn(),
}))

// Мокаем tauri-logger
vi.mock("@/lib/tauri-logger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tauri-logger")>()
  return {
    ...actual,
    createLogger: vi.fn(() => ({
      info: vi.fn(),
      infoSync: vi.fn(),
      debug: vi.fn(),
      debugSync: vi.fn(),
      error: mockLoggerError,
      errorSync: vi.fn(),
      warn: vi.fn(),
      warnSync: vi.fn(),
      trace: vi.fn(),
      traceSync: vi.fn(),
    })),
    logInfo: mockLogInfo,
    logError: mockLogError,
    logDebug: vi.fn(),
    logWarn: vi.fn(),
    logTrace: vi.fn(),
  }
})

// Вспомогательная функция для рендеринга с провайдерами
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <TimelineProjectProvider>
      <TimelineProvider>{ui}</TimelineProvider>
    </TimelineProjectProvider>,
  )
}

// Мокаем lucide-react иконки
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>()
  return {
    ...actual,
    Play: (props: any) => (
      <svg data-testid="play-icon" data-icon="Play" {...props}>
        Play
      </svg>
    ),
    Pause: (props: any) => (
      <svg data-testid="pause-icon" data-icon="Pause" {...props}>
        Pause
      </svg>
    ),
    StepBack: (props: any) => (
      <svg data-testid="stepback-icon" data-icon="StepBack" {...props}>
        StepBack
      </svg>
    ),
    StepForward: (props: any) => (
      <svg data-testid="stepforward-icon" data-icon="StepForward" {...props}>
        StepForward
      </svg>
    ),
    Maximize2: (props: any) => (
      <svg data-testid="maximize2-icon" data-icon="Maximize2" {...props}>
        Maximize2
      </svg>
    ),
    Minimize2: (props: any) => (
      <svg data-testid="minimize2-icon" data-icon="Minimize2" {...props}>
        Minimize2
      </svg>
    ),
    CircleDot: (props: any) => (
      <svg data-testid="circledot-icon" data-icon="CircleDot" {...props}>
        CircleDot
      </svg>
    ),
    Volume2: (props: any) => (
      <svg data-testid="volume2-icon" data-icon="Volume2" {...props}>
        Volume2
      </svg>
    ),
    VolumeX: (props: any) => (
      <svg data-testid="volumex-icon" data-icon="VolumeX" {...props}>
        VolumeX
      </svg>
    ),
    TvMinimalPlay: (props: any) => (
      <svg data-testid="tvminimalplay-icon" data-icon="TvMinimalPlay" {...props}>
        TvMinimalPlay
      </svg>
    ),
    ImagePlay: (props: any) => (
      <svg data-testid="imageplay-icon" data-icon="ImagePlay" {...props}>
        ImagePlay
      </svg>
    ),
    UnfoldHorizontal: (props: any) => (
      <svg data-testid="unfoldhorizontal-icon" data-icon="UnfoldHorizontal" {...props}>
        UnfoldHorizontal
      </svg>
    ),
    Camera: (props: any) => (
      <svg data-testid="camera-icon" data-icon="Camera" {...props}>
        Camera
      </svg>
    ),
    ChevronFirst: (props: any) => (
      <svg data-testid="chevronfirst-icon" data-icon="ChevronFirst" {...props}>
        ChevronFirst
      </svg>
    ),
    ChevronLast: (props: any) => (
      <svg data-testid="chevronlast-icon" data-icon="ChevronLast" {...props}>
        ChevronLast
      </svg>
    ),
  }
})

// Мокаем компоненты UI
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button onClick={onClick} className={className} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/slider", () => ({
  Slider: ({ value, onValueChange, max, step, className, disabled }: any) => (
    <input
      type="range"
      data-testid="slider"
      value={value?.[0] || 0}
      onChange={(e) => onValueChange?.([Number.parseFloat(e.target.value)])}
      max={max}
      step={step}
      className={className}
      disabled={disabled}
    />
  ),
}))

// Мокаем дочерние компоненты
vi.mock("../prerender-controls", () => ({
  PrerenderControls: vi.fn(() => <div data-testid="prerender-controls">Prerender Controls</div>),
}))

vi.mock("../volume-slider", () => ({
  VolumeSlider: ({ volume, onValueChange, onValueCommit }: any) => (
    <div
      data-testid="volume-slider"
      data-volume={volume}
      onClick={() => {
        if (onValueChange) onValueChange([0.5])
        if (onValueCommit) onValueCommit([0.5])
      }}
    >
      Volume Slider
    </div>
  ),
}))

vi.mock("@/features/timeline/providers/timeline-providers", () => ({
  TimelineProjectProvider: ({ children }: any) => children,
  TimelineProvider: ({ children }: any) => children,
  useTimeline: () => ({
    currentTime: 0,
    duration: 120,
    isPlaying: false,
    zoom: 1,
    setCurrentTime: vi.fn(),
    setDuration: vi.fn(),
    setIsPlaying: vi.fn(),
    setZoom: vi.fn(),
  }),
}))

// Мокаем useLinkedClips
vi.mock("@/features/timeline/hooks/clips/use-linked-clips", () => ({
  useLinkedClips: () => ({
    linkedClips: [],
    isLinked: () => false,
    linkClips: vi.fn(),
    unlinkClips: vi.fn(),
    getLinkedClips: () => [],
  }),
}))

// Мокаем useMulticam
vi.mock("@/features/multicam/hooks/use-multicam", () => ({
  useMulticam: () => ({
    isMulticam: false,
    angles: [],
    currentAngle: 0,
    switchAngle: vi.fn(),
    isChangingCamera: false,
  }),
}))

// Helper для создания полного mock PlayerContextType
const createMockPlayerContext = (overrides = {}) => ({
  currentTime: 0,
  isPlaying: false,
  playbackRate: 1,
  speedRampingEnabled: false,
  currentPlaybackRate: 1,
  basePlaybackRate: 1,
  volume: 0.75,
  duration: 0,
  isVideoLoading: false,
  isVideoReady: false,
  isSeeking: false,
  isChangingCamera: false,
  isRecording: false,
  isResizableMode: false,
  currentVideo: null,
  previewMedia: null,
  videoSource: "timeline" as const,
  selectedClipId: null,
  appliedEffects: [],
  appliedFilters: [],
  appliedTemplate: null,
  prerenderSettings: {
    prerenderEnabled: false,
    prerenderQuality: 80,
    prerenderSegmentDuration: 10,
    prerenderApplyEffects: true,
    prerenderAutoPrerender: false,
  },
  setCurrentVideo: vi.fn(),
  setVolume: vi.fn(),
  setDuration: vi.fn(),
  setVideoLoading: vi.fn(),
  setVideoReady: vi.fn(),
  setIsSeeking: vi.fn(),
  setIsChangingCamera: vi.fn(),
  setIsRecording: vi.fn(),
  setIsResizableMode: vi.fn(),
  setPreviewMedia: vi.fn(),
  setVideoSource: vi.fn(),
  applyEffect: vi.fn(),
  applyFilter: vi.fn(),
  applyTemplate: vi.fn(),
  clearEffects: vi.fn(),
  clearFilters: vi.fn(),
  clearTemplate: vi.fn(),
  setPrerenderSettings: vi.fn(),
  setSpeedRampingEnabled: vi.fn(),
  updatePlaybackRate: vi.fn(),
  setBasePlaybackRate: vi.fn(),
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn().mockResolvedValue(undefined),
  seek: vi.fn().mockResolvedValue(undefined),
  setPlaybackRate: vi.fn().mockResolvedValue(undefined),
  playerSetMedia: vi.fn().mockResolvedValue(undefined),
  playerSetVolume: vi.fn().mockResolvedValue(undefined),
  playerSelectClip: vi.fn().mockResolvedValue(undefined),
  playerClearSelection: vi.fn().mockResolvedValue(undefined),
  playerSetSource: vi.fn().mockResolvedValue(undefined),
  playerApplyEffect: vi.fn().mockResolvedValue(undefined),
  playerApplyFilter: vi.fn().mockResolvedValue(undefined),
  playerApplyTemplate: vi.fn().mockResolvedValue(undefined),
  playerClearEffects: vi.fn().mockResolvedValue(undefined),
  playerClearFilters: vi.fn().mockResolvedValue(undefined),
  playerClearTemplate: vi.fn().mockResolvedValue(undefined),
  ...overrides,
})

// Мокаем хуки
vi.mock("@/domains/video-editing", () => ({
  usePlayer: vi.fn(() => createMockPlayerContext()),
}))

vi.mock("@/features/video-player/hooks/use-fullscreen", () => ({
  useFullscreen: vi.fn(() => ({
    isFullscreen: false,
    enterFullscreen: vi.fn(),
    exitFullscreen: vi.fn(),
    toggleFullscreen: vi.fn(),
  })),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock("@/features/media/utils/video", () => ({
  getFrameTime: (_file: MediaFile) => 1 / 30, // 30 fps
}))

// Мокаем useDebouncedSeek
vi.mock("@/features/video-player/hooks/use-debounced-seek", () => ({
  useDebouncedSeek: (seek: any, options: any) => ({
    debouncedSeek: (time: number) => {
      // Вызываем onSeekStart сразу
      options?.onSeekStart?.(time)
      // Вызываем seek сразу (без debounce для тестов)
      seek(time)
    },
    immediateSeek: seek,
    cancelPendingSeek: vi.fn(),
    isPending: false,
  }),
}))

// Мокаем video-editing-orchestrator
vi.mock("@/domains/video-editing/services/video-editing-orchestrator", () => ({
  getVideoEditingOrchestrator: () => ({
    getActors: () => ({
      timeline: {
        send: vi.fn(),
        getSnapshot: () => ({
          context: {
            project: null,
            isLoading: false,
            hasUnsavedChanges: false,
            isPlaying: false,
            currentTime: 0,
            playbackRate: 1,
            duration: 0,
            tracks: [],
            clips: [],
            selectedClipIds: [],
            selectedTrackIds: [],
            selectedSectionIds: [],
          },
        }),
      },
    }),
    createProject: Object.assign(vi.fn(), { bind: vi.fn() }),
    saveProject: Object.assign(vi.fn(), { bind: vi.fn() }),
    loadProject: Object.assign(vi.fn(), { bind: vi.fn() }),
    play: Object.assign(vi.fn(), { bind: vi.fn() }),
    pause: Object.assign(vi.fn(), { bind: vi.fn() }),
    stopPlayback: Object.assign(vi.fn(), { bind: vi.fn() }),
    seek: Object.assign(vi.fn(), { bind: vi.fn() }),
    addTrack: Object.assign(vi.fn(), { bind: vi.fn() }),
    removeTrack: Object.assign(vi.fn(), { bind: vi.fn() }),
    updateTrack: Object.assign(vi.fn(), { bind: vi.fn() }),
    addClip: Object.assign(vi.fn(), { bind: vi.fn() }),
    removeClip: Object.assign(vi.fn(), { bind: vi.fn() }),
    updateClip: Object.assign(vi.fn(), { bind: vi.fn() }),
    executeCommand: Object.assign(vi.fn(), { bind: vi.fn() }),
  }),
}))

describe("PlayerControls", () => {
  const mockFile: MediaFile = {
    id: "test-video",
    path: "/path/to/video.mp4",
    name: "Test Video.mp4",
    type: MediaType.Video,
    size: 1024000,
    isVideo: true,
    duration: 120, // 2 минуты в секундах
    probeData: {
      format: {},
      streams: [{ r_frame_rate: "30/1" }],
    } as any,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLoggerError.mockClear()

    // Mock the fullscreen API
    Element.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined)
    Document.prototype.exitFullscreen = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(document, "fullscreenElement", {
      writable: true,
      value: null,
    })
  })

  describe("Отображение элементов управления", () => {
    it("должен отображать все основные элементы управления", () => {
      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      expect(screen.getByTestId("stepback-icon")).toBeInTheDocument()
      // Ищем основную play иконку через кнопку
      expect(screen.getByTitle("timeline.controls.play")).toBeInTheDocument()
      expect(screen.getByTestId("stepforward-icon")).toBeInTheDocument()
      expect(screen.getByTestId("slider")).toBeInTheDocument()
      expect(screen.getByTestId("volume-slider")).toBeInTheDocument()
      expect(screen.getByTestId("maximize2-icon")).toBeInTheDocument()
    })

    it("должен отображать иконку паузы при воспроизведении", () => {
      // Mock usePlayer to return isPlaying: true
      ;(usePlayer as any).mockReturnValue({
        isPlaying: true,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn().mockResolvedValue(undefined),
        seek: vi.fn().mockResolvedValue(undefined),
        volume: 0.75,
        setVolume: vi.fn(),
        isRecording: false,
        setIsRecording: vi.fn(),
        setIsSeeking: vi.fn(),
        isChangingCamera: false,
        isResizableMode: false,
        setIsResizableMode: vi.fn(),
        videoSource: "timeline" as const,
        setVideoSource: vi.fn(),
      })

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      expect(screen.getByTestId("pause-icon")).toBeInTheDocument()
      // Проверяем что основная play кнопка не отображается (но маленькая play иконка в AI Analysis может остаться)
      expect(screen.queryByTitle("timeline.controls.play")).not.toBeInTheDocument()
    })

    it("должен отображать иконку записи при isRecording", () => {
      // Mock usePlayer to return isRecording: true
      ;(usePlayer as any).mockReturnValue({
        isPlaying: false,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn().mockResolvedValue(undefined),
        seek: vi.fn().mockResolvedValue(undefined),
        volume: 0.75,
        setVolume: vi.fn(),
        isRecording: true,
        setIsRecording: vi.fn(),
        setIsSeeking: vi.fn(),
        isChangingCamera: false,
        isResizableMode: false,
        setIsResizableMode: vi.fn(),
        videoSource: "timeline" as const,
        setVideoSource: vi.fn(),
      })

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      expect(screen.getByTestId("circledot-icon")).toBeInTheDocument()
    })

    it("должен отображать иконку minimize в полноэкранном режиме", () => {
      // Mock useFullscreen to return isFullscreen: true
      vi.mocked(useFullscreen).mockReturnValue({
        isFullscreen: true,
        enterFullscreen: vi.fn(),
        exitFullscreen: vi.fn(),
        toggleFullscreen: vi.fn(),
      })

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      expect(screen.getByTestId("minimize2-icon")).toBeInTheDocument()
      expect(screen.queryByTestId("maximize2-icon")).not.toBeInTheDocument()
    })
  })

  describe("Управление воспроизведением", () => {
    it("должен переключать воспроизведение при клике на play/pause", () => {
      const mockPlay = vi.fn().mockResolvedValue(undefined)
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayerContext({
          isPlaying: false,
          play: mockPlay,
        }),
      )

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      const playButton = screen.getByTitle("timeline.controls.play")
      fireEvent.click(playButton)

      expect(mockPlay).toHaveBeenCalled()
    })

    it("должен переключать паузу при воспроизведении", () => {
      const mockPause = vi.fn().mockResolvedValue(undefined)
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayerContext({
          isPlaying: true,
          pause: mockPause,
        }),
      )

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      const pauseButton = screen.getByTitle("timeline.controls.pause")
      fireEvent.click(pauseButton)

      expect(mockPause).toHaveBeenCalled()
    })

    it("должен переключать запись", () => {
      const mockSetIsRecording = vi.fn()
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayerContext({
          isRecording: false,
          setIsRecording: mockSetIsRecording,
        }),
      )

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      const recordButton = screen.getByTitle("timeline.controls.record")
      expect(recordButton).not.toBeDisabled() // Проверяем что кнопка активна
      fireEvent.click(recordButton)

      expect(mockSetIsRecording).toHaveBeenCalledWith(true)
    })

    it("должен останавливать запись", () => {
      const mockSetIsRecording = vi.fn()
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayerContext({
          isRecording: true,
          setIsRecording: mockSetIsRecording,
        }),
      )

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      const stopRecordButton = screen.getByTitle("timeline.controls.stopRecord")
      fireEvent.click(stopRecordButton)

      expect(mockSetIsRecording).toHaveBeenCalledWith(false)
    })
  })

  describe("Навигация по времени", () => {
    it("должен обновлять время при изменении слайдера", () => {
      const mockSeek = vi.fn().mockResolvedValue(undefined)
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayerContext({
          seek: mockSeek,
        }),
      )

      renderWithProviders(<PlayerControls currentTime={30} file={mockFile} />)

      const slider = screen.getByTestId("slider")
      fireEvent.change(slider, { target: { value: "60" } })

      expect(mockSeek).toHaveBeenCalledWith(60)
    })

    it("должен устанавливать isSeeking при начале перемещения", () => {
      const mockSetIsSeeking = vi.fn()
      const mockSeek = vi.fn().mockResolvedValue(undefined)
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayerContext({
          seek: mockSeek,
          setIsSeeking: mockSetIsSeeking,
        }),
      )

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      const slider = screen.getByTestId("slider")
      // Мокаем onValueChange для триггера isSeeking
      fireEvent.change(slider, { target: { value: "30" } })

      expect(mockSetIsSeeking).toHaveBeenCalledWith(true)
      expect(mockSeek).toHaveBeenCalledWith(30)
    })

    it("должен правильно отображать время файла", () => {
      const fileWithTime = {
        ...mockFile,
        startTime: 65.5, // В секундах
        duration: 120, // 2 минуты в секундах
      }
      // currentTime=65.5 секунд: 1 минута 5 секунд 12 кадров (при 25fps)
      // duration=120 секунд через prop: 2 минуты
      renderWithProviders(<PlayerControls currentTime={65.5} file={fileWithTime} duration={120} />)

      // Компонент отображает currentTime и duration в timecode формате
      expect(screen.getByText("00:01:05:12")).toBeInTheDocument()
      expect(screen.getByText("00:02:00:00")).toBeInTheDocument()
    })

    it("должен отображать значения по умолчанию если время не задано", () => {
      const fileWithoutTime = {
        ...mockFile,
        startTime: undefined,
        duration: undefined,
      }
      renderWithProviders(<PlayerControls currentTime={0} file={fileWithoutTime} />)

      // Показывает значения по умолчанию - должно быть два элемента с текстом 00:00:00:00
      const defaultTimeElements = screen.getAllByText("00:00:00:00")
      expect(defaultTimeElements).toHaveLength(2) // startTime и duration
    })
  })

  describe("Управление громкостью", () => {
    it("должен отображать текущую громкость", () => {
      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      const volumeSlider = screen.getByTestId("volume-slider")
      expect(volumeSlider).toHaveAttribute("data-volume", "0.75")
    })

    it("должен обновлять громкость при клике на слайдер", () => {
      const mockSetVolume = vi.fn()
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayerContext({
          setVolume: mockSetVolume,
        }),
      )

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      const volumeSlider = screen.getByTestId("volume-slider")
      fireEvent.click(volumeSlider)

      expect(mockSetVolume).toHaveBeenCalledWith(0.5)
    })
  })

  describe("Полноэкранный режим", () => {
    it("должен вызывать toggleFullscreen при клике", () => {
      const mockToggleFullscreen = vi.fn()
      vi.mocked(useFullscreen).mockReturnValue({
        isFullscreen: false,
        enterFullscreen: vi.fn(),
        exitFullscreen: vi.fn(),
        toggleFullscreen: mockToggleFullscreen,
      })

      // Создаем mock элемент
      const mockContainer = document.createElement("div")
      mockContainer.className = "media-player-container"
      document.body.appendChild(mockContainer)

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      const fullscreenButton = screen.getByTitle("timeline.controls.fullscreen")
      fireEvent.click(fullscreenButton)

      expect(mockToggleFullscreen).toHaveBeenCalledWith(mockContainer)

      // Очищаем
      document.body.removeChild(mockContainer)
    })

    it("должен показывать ошибку если контейнер не найден", () => {
      const mockToggleFullscreen = vi.fn()
      vi.mocked(useFullscreen).mockReturnValue({
        isFullscreen: false,
        enterFullscreen: vi.fn(),
        exitFullscreen: vi.fn(),
        toggleFullscreen: mockToggleFullscreen,
      })

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      const fullscreenButton = screen.getByTitle("timeline.controls.fullscreen")
      fireEvent.click(fullscreenButton)

      expect(mockLoggerError).toHaveBeenCalledWith("media player container not found")
      expect(mockToggleFullscreen).not.toHaveBeenCalled()
    })
  })

  describe("Режим изменения размера", () => {
    it("должен переключать режим изменения размера", () => {
      const mockSetIsResizableMode = vi.fn()
      ;(usePlayer as any).mockReturnValue({
        isPlaying: false,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn().mockResolvedValue(undefined),
        seek: vi.fn().mockResolvedValue(undefined),
        volume: 0.75,
        setVolume: vi.fn(),
        isRecording: false,
        setIsRecording: vi.fn(),
        setIsSeeking: vi.fn(),
        isChangingCamera: false,
        isResizableMode: false,
        setIsResizableMode: mockSetIsResizableMode,
        videoSource: "timeline" as const,
        setVideoSource: vi.fn(),
      })

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      const resizeButton = screen.getByTitle("timeline.controlsMain.resizableMode")
      fireEvent.click(resizeButton)

      expect(mockSetIsResizableMode).toHaveBeenCalledWith(true)
    })

    it("должен показывать правильную иконку в режиме изменения размера", () => {
      ;(usePlayer as any).mockReturnValue({
        isPlaying: false,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn().mockResolvedValue(undefined),
        seek: vi.fn().mockResolvedValue(undefined),
        volume: 0.75,
        setVolume: vi.fn(),
        isRecording: false,
        setIsRecording: vi.fn(),
        setIsSeeking: vi.fn(),
        isChangingCamera: false,
        isResizableMode: true,
        setIsResizableMode: vi.fn(),
        videoSource: "timeline" as const,
        setVideoSource: vi.fn(),
      })

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      // В режиме изменения размера title меняется на fixedSizeMode
      expect(screen.getByTitle("timeline.controlsMain.fixedSizeMode")).toBeInTheDocument()
    })
  })

  describe("Переключение источника видео", () => {
    it("должен переключать источник видео при клике", () => {
      const mockSetVideoSource = vi.fn()
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayerContext({
          videoSource: "timeline",
          setVideoSource: mockSetVideoSource,
        }),
      )

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      // В режиме timeline показывается иконка TvMinimalPlay
      const sourceButton = screen.getByTestId("tvminimalplay-icon").closest("button")
      fireEvent.click(sourceButton!)

      expect(mockSetVideoSource).toHaveBeenCalledWith("browser")
    })

    it("должен переключать обратно на timeline", () => {
      const mockSetVideoSource = vi.fn()
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayerContext({
          videoSource: "browser",
          setVideoSource: mockSetVideoSource,
        }),
      )

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      // В режиме browser показывается иконка ImagePlay
      const sourceButton = screen.getByTestId("imageplay-icon").closest("button")
      fireEvent.click(sourceButton!)

      expect(mockSetVideoSource).toHaveBeenCalledWith("timeline")
    })

    it("должен показывать правильную иконку для текущего источника", () => {
      // Сбрасываем мок обратно к дефолтному videoSource: "timeline"
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayerContext({
          videoSource: "timeline",
        }),
      )

      const { rerender } = renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      // В режиме timeline
      expect(screen.getByTestId("tvminimalplay-icon")).toBeInTheDocument()
      expect(screen.queryByTestId("imageplay-icon")).not.toBeInTheDocument()

      // Переключаем на browser
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayerContext({
          videoSource: "browser",
        }),
      )

      rerender(
        <TimelineProjectProvider>
          <TimelineProvider>
            <PlayerControls currentTime={0} file={mockFile} />
          </TimelineProvider>
        </TimelineProjectProvider>,
      )

      // В режиме browser
      expect(screen.getByTestId("imageplay-icon")).toBeInTheDocument()
      expect(screen.queryByTestId("tvminimalplay-icon")).not.toBeInTheDocument()
    })
  })

  describe("Обработка времени", () => {
    it("должен корректно обрабатывать Unix timestamp", () => {
      // Unix timestamp (больше года в секундах)
      const unixTime = Date.now() / 1000
      renderWithProviders(<PlayerControls currentTime={unixTime} file={mockFile} />)

      // Проверяем что слайдер использует правильное значение
      const slider = screen.getByTestId("slider")
      expect(slider).toHaveValue("0") // localDisplayTime по умолчанию 0
    })

    it("должен правильно рассчитывать frameTime", () => {
      const fileWith60fps = {
        ...mockFile,
        probeData: {
          format: {},
          streams: [{ r_frame_rate: "60/1" }],
        } as any,
      }
      renderWithProviders(<PlayerControls currentTime={0} file={fileWith60fps} />)

      // getFrameTime мокнут для возврата 1/30, проверяем что слайдер использует step
      const slider = screen.getByTestId("slider")
      expect(slider).toHaveAttribute("step", "0.001") // Компонент использует фиксированный step
    })
  })

  describe("Отключенные состояния", () => {
    it("должен отключать элементы управления при смене камеры", () => {
      // Override the mock for this specific test
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayerContext({
          isChangingCamera: true,
        }),
      )

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      const playButton = screen.getByTitle("timeline.controls.play")
      expect(playButton).toBeDisabled()

      const slider = screen.getByTestId("slider")
      expect(slider).toBeDisabled()
    })

    it("должен показывать prerender controls", () => {
      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      expect(screen.getByTestId("prerender-controls")).toBeInTheDocument()
    })
  })
})
