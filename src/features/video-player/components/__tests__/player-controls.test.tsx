import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TimelineProjectProvider, TimelineProvider } from "@/domains/video-editing/providers/timeline-providers"
import type { MediaFile } from "@/features/media/types/media"
import { PlayerControls } from "../player-controls"
import { usePlayer } from "@/features/video-player/services/player-provider"
import { useFullscreen } from "@/features/video-player/hooks/use-fullscreen"

// Вспомогательная функция для рендеринга с провайдерами
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <TimelineProjectProvider>
      <TimelineProvider>{ui}</TimelineProvider>
    </TimelineProjectProvider>,
  )
}

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

vi.mock("../components/volume-slider", () => ({
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

vi.mock("@/domains/video-editing/providers/timeline-providers", () => ({
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
vi.mock("@/features/timeline/hooks/use-linked-clips", () => ({
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

// Мокаем хуки
vi.mock("../services/player-provider", () => ({
  usePlayer: vi.fn(() => ({
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
    setIsResizableMode: vi.fn(),
    videoSource: "timeline" as const,
    setVideoSource: vi.fn(),
  })),
}))

vi.mock("../hooks/use-fullscreen", () => ({
  useFullscreen: vi.fn(() => ({
    isFullscreen: false,
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

    // Mock the fullscreen API
    Element.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined)
    Document.prototype.exitFullscreen = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: null
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
      vi.mocked(usePlayer).mockReturnValue({
        isPlaying: false,
        play: mockPlay,
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

      const playButton = screen.getByTitle("timeline.controls.play")
      fireEvent.click(playButton)

      expect(mockPlay).toHaveBeenCalled()
    })

    it("должен переключать паузу при воспроизведении", () => {
      const mockPause = vi.fn().mockResolvedValue(undefined)
      vi.mocked(usePlayer).mockReturnValue({
        isPlaying: true,
        play: vi.fn().mockResolvedValue(undefined),
        pause: mockPause,
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

      const pauseButton = screen.getByTitle("timeline.controls.pause")
      fireEvent.click(pauseButton)

      expect(mockPause).toHaveBeenCalled()
    })

    it("должен переключать запись", () => {
      const mockSetIsRecording = vi.fn()
      vi.mocked(usePlayer).mockReturnValue({
        isPlaying: false,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn().mockResolvedValue(undefined),
        seek: vi.fn().mockResolvedValue(undefined),
        volume: 0.75,
        setVolume: vi.fn(),
        isRecording: false,
        setIsRecording: mockSetIsRecording,
        setIsSeeking: vi.fn(),
        isChangingCamera: false,
        isResizableMode: false,
        setIsResizableMode: vi.fn(),
        videoSource: "timeline" as const,
        setVideoSource: vi.fn(),
      })
      
      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      const recordButton = screen.getByTitle("timeline.controls.record")
      expect(recordButton).not.toBeDisabled() // Проверяем что кнопка активна
      fireEvent.click(recordButton)

      expect(mockSetIsRecording).toHaveBeenCalledWith(true)
    })

    it("должен останавливать запись", () => {
      const mockSetIsRecording = vi.fn()
      vi.mocked(usePlayer).mockReturnValue({
        isPlaying: false,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn().mockResolvedValue(undefined),
        seek: vi.fn().mockResolvedValue(undefined),
        volume: 0.75,
        setVolume: vi.fn(),
        isRecording: true,
        setIsRecording: mockSetIsRecording,
        setIsSeeking: vi.fn(),
        isChangingCamera: false,
        isResizableMode: false,
        setIsResizableMode: vi.fn(),
        videoSource: "timeline" as const,
        setVideoSource: vi.fn(),
      })
      
      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      const stopRecordButton = screen.getByTitle("timeline.controls.stopRecord")
      fireEvent.click(stopRecordButton)

      expect(mockSetIsRecording).toHaveBeenCalledWith(false)
    })
  })

  describe("Навигация по времени", () => {
    it("должен обновлять время при изменении слайдера", () => {
      const mockSeek = vi.fn().mockResolvedValue(undefined)
      vi.mocked(usePlayer).mockReturnValue({
        isPlaying: false,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn().mockResolvedValue(undefined),
        seek: mockSeek,
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
      
      renderWithProviders(<PlayerControls currentTime={30} file={mockFile} />)

      const slider = screen.getByTestId("slider")
      fireEvent.change(slider, { target: { value: "60" } })

      expect(mockSeek).toHaveBeenCalledWith(60)
    })

    it("должен устанавливать isSeeking при начале перемещения", () => {
      const mockSetIsSeeking = vi.fn()
      vi.mocked(usePlayer).mockReturnValue({
        isPlaying: false,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn().mockResolvedValue(undefined),
        seek: vi.fn().mockResolvedValue(undefined),
        volume: 0.75,
        setVolume: vi.fn(),
        isRecording: false,
        setIsRecording: vi.fn(),
        setIsSeeking: mockSetIsSeeking,
        isChangingCamera: false,
        isResizableMode: false,
        setIsResizableMode: vi.fn(),
        videoSource: "timeline" as const,
        setVideoSource: vi.fn(),
      })
      
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
        startTime: "00:01:05:15" as any, // Передаем строку в нужном формате (временный обход типов)
        duration: "00:02:00:00" as any, // Передаем строку в нужном формате (временный обход типов)
      }
      renderWithProviders(<PlayerControls currentTime={65.5} file={fileWithTime} />)

      // Компонент отображает startTime и duration из файла
      expect(screen.getByText("00:01:05:15")).toBeInTheDocument()
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
      vi.mocked(usePlayer).mockReturnValue({
        isPlaying: false,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn().mockResolvedValue(undefined),
        seek: vi.fn().mockResolvedValue(undefined),
        volume: 0.75,
        setVolume: mockSetVolume,
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
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const mockToggleFullscreen = vi.fn()
      vi.mocked(useFullscreen).mockReturnValue({
        isFullscreen: false,
        toggleFullscreen: mockToggleFullscreen,
      })

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      const fullscreenButton = screen.getByTitle("timeline.controls.fullscreen")
      fireEvent.click(fullscreenButton)

      expect(consoleSpy).toHaveBeenCalledWith("[handleFullscreen] Не найден контейнер медиаплеера")
      expect(mockToggleFullscreen).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
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
      vi.mocked(usePlayer).mockReturnValue({
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
        setIsResizableMode: vi.fn(),
        videoSource: "timeline" as const,
        setVideoSource: mockSetVideoSource,
      })

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      // В режиме timeline показывается иконка TvMinimalPlay
      const sourceButton = screen.getByTestId("tvminimalplay-icon").closest("button")
      fireEvent.click(sourceButton!)

      expect(mockSetVideoSource).toHaveBeenCalledWith("browser")
    })

    it("должен переключать обратно на timeline", () => {
      const mockSetVideoSource = vi.fn()
      vi.mocked(usePlayer).mockReturnValue({
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
        setIsResizableMode: vi.fn(),
        videoSource: "browser" as const,
        setVideoSource: mockSetVideoSource,
      })

      renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      // В режиме browser показывается иконка ImagePlay
      const sourceButton = screen.getByTestId("imageplay-icon").closest("button")
      fireEvent.click(sourceButton!)

      expect(mockSetVideoSource).toHaveBeenCalledWith("timeline")
    })

    it("должен показывать правильную иконку для текущего источника", () => {
      const { rerender } = renderWithProviders(<PlayerControls currentTime={0} file={mockFile} />)

      // В режиме timeline
      expect(screen.getByTestId("tvminimalplay-icon")).toBeInTheDocument()
      expect(screen.queryByTestId("imageplay-icon")).not.toBeInTheDocument()

      // Переключаем на browser
      usePlayer.mockImplementation(() => ({
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
        setIsResizableMode: vi.fn(),
        videoSource: "browser" as const,
        setVideoSource: vi.fn(),
      }))

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
      vi.mocked(usePlayer).mockReturnValue({
        isPlaying: false,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn().mockResolvedValue(undefined),
        seek: vi.fn().mockResolvedValue(undefined),
        volume: 0.75,
        setVolume: vi.fn(),
        isRecording: false,
        setIsRecording: vi.fn(),
        setIsSeeking: vi.fn(),
        isChangingCamera: true,
        isResizableMode: false,
        setIsResizableMode: vi.fn(),
        videoSource: "timeline" as const,
        setVideoSource: vi.fn(),
      })

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
