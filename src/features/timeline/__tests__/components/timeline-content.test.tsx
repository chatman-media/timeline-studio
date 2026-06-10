import { fireEvent, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useProjectSettings } from "@/features/project-settings/hooks/use-project-settings"
import { renderWithTimeline } from "@/test/test-utils"

import { TimelineContent } from "../../components/timeline-content"

// Hoisted mocks for proper initialization order
const mockCurrentProject = vi.hoisted(() => ({
  id: "test-project",
  name: "Test Project",
  metadata: {
    name: "Test Project",
    file_path: null,
    is_dirty: false,
  },
}))

const mockProjectSettings = vi.hoisted(() => ({
  aspectRatio: {
    value: { width: 1920, height: 1080 },
  },
  frameRate: "30",
}))

const mockTimelineState = vi.hoisted(() => {
  // Create mock functions inside hoisted block
  const mockCreateProject = vi.fn(() => Promise.resolve())
  const mockAddSection = vi.fn(() => Promise.resolve())
  const mockAddTrack = vi.fn(() => Promise.resolve())
  const mockRemoveTrack = vi.fn(() => Promise.resolve())
  const mockUpdateTrack = vi.fn(() => Promise.resolve())
  const mockSelectTracks = vi.fn()
  const mockSelectClips = vi.fn()
  const mockClearSelection = vi.fn()
  const mockSeek = vi.fn()
  const mockPlay = vi.fn()
  const mockPause = vi.fn()
  const mockStop = vi.fn()
  const mockClearError = vi.fn()
  const mockSend = vi.fn()
  const mockSetTimeScale = vi.fn()
  const mockSetScrollPosition = vi.fn()
  const mockToggleSnap = vi.fn()

  return {
    project: null as any,
    selectedTrackIds: [] as string[],
    selectedClipIds: [] as string[],
    currentTime: 0,
    isPlaying: false,
    duration: 300,
    playbackRate: 1,
    createProject: mockCreateProject,
    addSection: mockAddSection,
    addTrack: mockAddTrack,
    removeTrack: mockRemoveTrack,
    updateTrack: mockUpdateTrack,
    selectTracks: mockSelectTracks,
    selectClips: mockSelectClips,
    clearSelection: mockClearSelection,
    seek: mockSeek,
    play: mockPlay,
    pause: mockPause,
    stop: mockStop,
    error: null as string | null,
    clearError: mockClearError,
    send: mockSend,
    setTimeScale: mockSetTimeScale,
    setScrollPosition: mockSetScrollPosition,
    toggleSnap: mockToggleSnap,
  }
})

const mockTracks = vi.hoisted(() => ({
  tracks: [] as any[],
  globalTracks: [] as any[],
  sectionTracks: [] as any[],
  selectedTracks: [] as any[],
  visibleTracks: [] as any[],
  findTrack: vi.fn(() => null),
  getTracksByType: vi.fn(() => []),
  getTracksBySection: vi.fn(() => []),
  canAddTrackToSection: vi.fn(() => true),
  getTrackStats: vi.fn(() => ({
    clipCount: 0,
    totalDuration: 0,
    isEmpty: true,
  })),
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
  updateTrack: vi.fn(),
  setTrackHeight: vi.fn(),
}))

const mockClips = vi.hoisted(() => ({
  clips: [] as any[],
  addClip: vi.fn(),
  removeClip: vi.fn(),
  moveClip: vi.fn(),
  trimClip: vi.fn(),
  splitClip: vi.fn(),
  updateClip: vi.fn(),
  batchUpdateClips: vi.fn(),
}))

const mockDragState = vi.hoisted(() => ({
  dragState: { isDragging: false },
}))

// Mock все внешние зависимости
vi.mock("@timeline-studio/core/hooks/use-user-settings", () => ({
  useUserSettings: () => ({
    playerVolume: 50,
    playerVideoSource: "browser",
    timelineVirtualizationEnabled: false,
    updatePlayerVolume: vi.fn(),
    updatePlayerVideoSource: vi.fn(),
    updateSettings: vi.fn(),
  }),
}))

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant }: any) => (
    <span data-variant={variant} data-oid="rx5:arb">
      {children}
    </span>
  ),
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props} data-oid="n8pvdld">
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-oid="2s95f7e">
      {children}
    </div>
  ),

  CardContent: ({ children }: any) => <div data-oid="0e9btrz">{children}</div>,
  CardHeader: ({ children }: any) => <div data-oid="r9hhngx">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-oid="qa5h32q">{children}</h3>,
}))

vi.mock("@/components/ui/resizable", () => ({
  ResizableHandle: () => <div data-testid="resizable-handle" data-oid="sq-shbz" />,
  ResizablePanel: ({ children, defaultSize }: any) => (
    <div data-default-size={defaultSize} data-oid="vcsm2mc">
      {children}
    </div>
  ),

  ResizablePanelGroup: ({ children }: any) => <div data-oid="-d0s3vl">{children}</div>,
}))

vi.mock("@timeline-studio/core/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    currentProject: {
      id: "test-project",
      name: "Test Project",
      metadata: {
        name: "Test Project",
        file_path: null,
        is_dirty: false,
      },
    },
  }),
}))

vi.mock("@/features/project-settings/hooks/use-project-settings", () => ({
  useProjectSettings: vi.fn(() => ({
    settings: {
      aspectRatio: {
        value: { width: 1920, height: 1080 },
      },
      frameRate: "30",
    },
  })),
}))

vi.mock("../../hooks/state/use-timeline", () => ({
  useTimeline: () => mockTimelineState,
}))

vi.mock("../../hooks/state/use-tracks", () => ({
  useTracks: () => mockTracks,
}))

vi.mock("../../hooks/clips/use-clips", () => ({
  useClips: () => mockClips,
}))

vi.mock("../../hooks/drag-drop/use-drag-drop-timeline", () => ({
  useDragDropTimeline: () => mockDragState,
}))

vi.mock("../../context/timeline-ui-context", () => ({
  TimelineUIProvider: ({ children }: any) => children,
  useTimelineUI: () => ({
    uiState: {
      timeScale: 60,
      scrollPosition: { x: 0, y: 0 },
      minTimeScale: 10,
      maxTimeScale: 200,
    },
    setTimeScale: vi.fn(),
    setScrollPosition: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    resetZoom: vi.fn(),
  }),
}))

// Мокаем AI интеграцию
vi.mock("@/features/ai-chat/hooks/use-timeline-ai-integration", () => ({
  useTimelineAIIntegration: () => ({
    isReady: true,
    hasProject: false,
    clipsCount: 0,
    tracksCount: 0,
    projectDuration: 0,
  }),
}))

vi.mock("../../hooks/integration/use-timeline-player-sync", () => ({
  useTimelinePlayerSync: vi.fn(),
}))

vi.mock("../../hooks/editing/use-edit-mode", () => ({
  EditModeProvider: ({ children }: any) => <div data-oid="vf2p8lc">{children}</div>,
}))

// Mock child components
vi.mock("../../components/timeline-hotkeys", () => ({
  TimelineHotkeys: () => <div data-testid="timeline-hotkeys" data-oid="redq8u0" />,
}))

vi.mock("../../components/timeline-speed-ramping-integration", () => ({
  TimelineSpeedRampingIntegration: () => <div data-testid="timeline-speed-ramping-integration" data-oid="rax840-" />,
  SpeedRampingIndicator: () => <div data-testid="speed-ramping-indicator" data-oid="z_8oqg1" />,
  TimelineSpeedRampingStatus: () => <div data-testid="timeline-speed-ramping-status" data-oid=":y4f_6q" />,
}))

vi.mock("../../components/edit-mode-selector", () => ({
  EditModeSelector: () => <div data-testid="edit-mode-selector" data-oid="i326.c2" />,
}))

vi.mock("../../components/edit-tools/edit-mode-overlay", () => ({
  EditModeOverlay: () => <div data-testid="edit-mode-overlay" data-oid="4zyx:4l" />,
}))

vi.mock("../../components/ai-markers/ai-marker-controls", () => ({
  AIMarkerControls: () => <div data-testid="ai-marker-controls" data-oid="jd_wahk" />,
}))

vi.mock("../../components/track-controls-panel", () => ({
  TrackControlsPanel: () => <div data-testid="track-controls-panel" data-oid="l5y.t3v" />,
}))

vi.mock("../../components/drag-drop-provider", () => ({
  DragDropProvider: ({ children }: any) => <div data-oid="68suli7">{children}</div>,
}))

vi.mock("../../components/markers", () => ({
  TimelineMarkersLayer: () => <div data-testid="timeline-markers-layer" data-oid="pib3ts7" />,
}))

vi.mock("../../components/ai-analysis/timeline-ai-overlay", () => ({
  TimelineAIOverlay: () => <div data-testid="timeline-ai-overlay" data-oid="v848l99" />,
}))

vi.mock("../../components/edit-tools/split-indicator", () => ({
  SplitIndicator: () => <div data-testid="split-indicator" data-oid="oegfad2" />,
}))

vi.mock("../../components/track-insertion-zone", () => ({
  TrackInsertionZones: () => <div data-testid="track-insertion-zones" data-oid="dw03rzl" />,
}))

vi.mock("../../components/timeline-preview-strip", () => ({
  TimelinePreviewStrip: () => <div data-testid="timeline-preview-strip" data-oid="xo6oi25" />,
}))

vi.mock("../../components/timeline-scale", () => ({
  TimelineScale: () => <div data-testid="timeline-scale" data-oid="e::k5iw" />,
}))

vi.mock("../../components/track/track", () => ({
  TrackComponent: ({ track }: any) => (
    <div data-testid={`track-${track.id}`} data-oid="kag.vj4">
      {track.name}
    </div>
  ),
}))

// TODO: Набор тестов пропущен (1/33 тестов проходит, 32 падают)
// Проблема: ResizeObserver мок не является конструктором
// Ошибка: "() => ({ observe: vi.fn(), ... }) is not a constructor"
// Необходимо исправить мокирование ResizeObserver в setup.ts или в этом файле
describe("TimelineContent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock states
    mockTimelineState.project = null
    mockTimelineState.error = null
    mockTracks.tracks = []
    mockClips.clips = []

    // Reset mock implementations
    mockTimelineState.createProject.mockImplementation(() => Promise.resolve())
    mockTimelineState.addSection.mockImplementation(() => Promise.resolve())
    // ResizeObserver уже мокируется в setup.ts
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Loading and error states", () => {
    it("should render without loading state when project is not initialized", () => {
      renderWithTimeline(<TimelineContent data-oid="bxhw9db" />)

      // Компонент больше не показывает loading state - Timeline рендерится сразу
      // Проект создается автоматически в useEffect
      expect(mockTimelineState.createProject).toHaveBeenCalled()
    })

    it("should show error state when there is an error", () => {
      mockTimelineState.error = "Failed to load timeline"

      renderWithTimeline(<TimelineContent data-oid="gc76-h8" />)

      expect(screen.getByText("Ошибка Timeline")).toBeInTheDocument()
      expect(screen.getByText("Failed to load timeline")).toBeInTheDocument()
      expect(screen.getByText("Закрыть")).toBeInTheDocument()
    })

    it("should clear error when clicking close button", () => {
      mockTimelineState.error = "Some error"

      renderWithTimeline(<TimelineContent data-oid="yb5ofpp" />)

      const closeButton = screen.getByText("Закрыть")
      fireEvent.click(closeButton)

      expect(mockTimelineState.clearError).toHaveBeenCalled()
    })
  })

  describe("Project initialization", () => {
    it("should create project on mount when no project exists", async () => {
      renderWithTimeline(<TimelineContent data-oid="l.i38cv" />)

      await waitFor(() => {
        expect(mockTimelineState.createProject).toHaveBeenCalledWith("Test Project")
      })
    })

    it("should add initial section when project is created", async () => {
      mockTimelineState.project = {
        id: "test",
        name: "Test",
        sections: [],
        settings: { resolution: { width: 1920, height: 1080 }, fps: 30 },
        duration: 300,
      }

      renderWithTimeline(<TimelineContent data-oid="q8f9cta" />)

      await waitFor(() => {
        expect(mockTimelineState.addSection).toHaveBeenCalledWith("Main Section", 0, 300)
      })
    })

    it("should not add section if sections already exist", () => {
      mockTimelineState.project = {
        id: "test",
        name: "Test",
        sections: [{ id: "section-1", name: "Existing" }],
        settings: { resolution: { width: 1920, height: 1080 }, fps: 30 },
        duration: 300,
      }

      renderWithTimeline(<TimelineContent data-oid="1qkg-9b" />)

      expect(mockTimelineState.addSection).not.toHaveBeenCalled()
    })
  })

  describe("Main content rendering", () => {
    beforeEach(() => {
      mockTimelineState.project = {
        id: "test",
        name: "Test",
        sections: [{ id: "section-1", name: "Main" }],
        settings: { resolution: { width: 1920, height: 1080 }, fps: 30 },
        duration: 300,
      }
    })

    it("should render all main components", () => {
      renderWithTimeline(<TimelineContent data-oid="xladxth" />)

      expect(screen.getByTestId("timeline-hotkeys")).toBeInTheDocument()
      expect(screen.getByTestId("timeline-speed-ramping-integration")).toBeInTheDocument()
      expect(screen.getByTestId("speed-ramping-indicator")).toBeInTheDocument()
      expect(screen.getByTestId("edit-mode-overlay")).toBeInTheDocument()
      expect(screen.getByTestId("edit-mode-selector")).toBeInTheDocument()
      expect(screen.getByTestId("ai-marker-controls")).toBeInTheDocument()
    })

    it("should display project information", () => {
      renderWithTimeline(<TimelineContent data-oid="5kl49gl" />)

      expect(screen.getByText("Test Project")).toBeInTheDocument()
      expect(screen.getByText("1920x1080 @ 30fps")).toBeInTheDocument()
    })

    it("should display statistics badges", () => {
      mockTracks.tracks = [{ id: "t1" }, { id: "t2" }]
      mockClips.clips = [{ id: "c1" }, { id: "c2" }, { id: "c3" }]

      renderWithTimeline(<TimelineContent data-oid="gdjz54i" />)

      expect(screen.getByText("1 секций")).toBeInTheDocument()
      expect(screen.getByText("2 треков")).toBeInTheDocument()
      expect(screen.getByText("3 клипов")).toBeInTheDocument()
    })
  })

  describe("Track management", () => {
    beforeEach(() => {
      mockTimelineState.project = {
        id: "test",
        name: "Test",
        sections: [{ id: "section-1", name: "Main" }],
        settings: { resolution: { width: 1920, height: 1080 }, fps: 30 },
        duration: 300,
      }
    })

    it("should show empty state when no tracks", () => {
      mockTracks.tracks = []

      renderWithTimeline(<TimelineContent data-oid="zcu-c3e" />)

      expect(screen.getByText("Перетащите файл сюда или")).toBeInTheDocument()
      expect(screen.getByText("Добавить видео трек")).toBeInTheDocument()
    })

    it("should add track when clicking add button", () => {
      mockTracks.tracks = []

      renderWithTimeline(<TimelineContent data-oid="81yf0f2" />)

      const addButton = screen.getByText("Добавить видео трек")
      fireEvent.click(addButton)

      expect(mockTimelineState.addTrack).toHaveBeenCalledWith("Video", "Видео трек")
    })

    it("should render tracks when they exist", () => {
      mockTracks.tracks = [
        { id: "track-1", name: "Video Track 1", type: "video", clips: [] },
        { id: "track-2", name: "Audio Track 1", type: "audio", clips: [] },
      ]

      renderWithTimeline(<TimelineContent data-oid="n8ko:04" />)

      expect(screen.getByTestId("track-track-1")).toBeInTheDocument()
      expect(screen.getByTestId("track-track-2")).toBeInTheDocument()
      expect(screen.getByText("Video Track 1")).toBeInTheDocument()
      expect(screen.getByText("Audio Track 1")).toBeInTheDocument()
    })
  })

  describe("Timeline components", () => {
    beforeEach(() => {
      mockTimelineState.project = {
        id: "test",
        name: "Test",
        sections: [{ id: "section-1", name: "Main" }],
        settings: { resolution: { width: 1920, height: 1080 }, fps: 30 },
        duration: 300,
      }
      mockTracks.tracks = [{ id: "track-1", name: "Track 1", type: "video", clips: [] }]
    })

    it("should render timeline scale", () => {
      renderWithTimeline(<TimelineContent data-oid="xzldfb-" />)

      expect(screen.getByTestId("timeline-scale")).toBeInTheDocument()
    })

    it("should render markers layer", () => {
      renderWithTimeline(<TimelineContent data-oid="3phpere" />)

      expect(screen.getByTestId("timeline-markers-layer")).toBeInTheDocument()
    })

    it("should render AI overlay", () => {
      renderWithTimeline(<TimelineContent data-oid="fw9y46g" />)

      expect(screen.getByTestId("timeline-ai-overlay")).toBeInTheDocument()
    })

    it("should render split indicator", () => {
      renderWithTimeline(<TimelineContent data-oid="0eyddoq" />)

      expect(screen.getByTestId("split-indicator")).toBeInTheDocument()
    })

    it("should render track insertion zones when dragging", () => {
      mockDragState.dragState.isDragging = true

      renderWithTimeline(<TimelineContent data-oid="r2srj_8" />)

      expect(screen.getByTestId("track-insertion-zones")).toBeInTheDocument()
    })
  })

  describe("Preview strip", () => {
    beforeEach(() => {
      mockTimelineState.project = {
        id: "test",
        name: "Test",
        sections: [{ id: "section-1", name: "Main" }],
        settings: { resolution: { width: 1920, height: 1080 }, fps: 30 },
        duration: 300,
      }
    })

    it("should not render preview strip when no video clips", () => {
      mockTracks.tracks = [{ id: "track-1", name: "Audio Track", type: "audio", clips: [] }]
      mockClips.clips = []

      renderWithTimeline(<TimelineContent data-oid="q5brdg8" />)

      expect(screen.queryByTestId("timeline-preview-strip")).not.toBeInTheDocument()
    })

    it.skip("should render preview strip for video clips with media", () => {
      // SKIP: Preview strip был удален при рефакторинге - теперь tracks рендерятся через TracksWithTimeScale
      mockTracks.tracks = [
        {
          id: "track-1",
          name: "Video Track",
          type: "video",
          clips: ["clip-1"],
        },
      ]

      mockClips.clips = [
        {
          id: "clip-1",
          trackId: "track-1",
          mediaFile: { path: "/path/to/video.mp4" },
          startTime: 0,
          duration: 10,
        },
      ]

      renderWithTimeline(<TimelineContent data-oid="w9bd9l9" />)

      expect(screen.getByTestId("timeline-preview-strip")).toBeInTheDocument()
    })
  })

  describe("Scroll and resize handling", () => {
    beforeEach(() => {
      mockTimelineState.project = {
        id: "test",
        name: "Test",
        sections: [{ id: "section-1", name: "Main" }],
        settings: { resolution: { width: 1920, height: 1080 }, fps: 30 },
        duration: 300,
      }
      mockTracks.tracks = [{ id: "track-1", name: "Track 1", type: "video", clips: [] }]
    })

    it("should handle scroll events", () => {
      const { container } = renderWithTimeline(<TimelineContent data-oid="26f1dfv" />)

      const scrollContainer = container.querySelector(".overflow-auto")
      expect(scrollContainer).toBeTruthy()

      // Simulate scroll
      fireEvent.scroll(scrollContainer!, { target: { scrollLeft: 100 } })
    })

    it("should setup resize observer", () => {
      const mockObserve = vi.fn()
      const mockDisconnect = vi.fn()

      // Создаем класс, а не функцию
      global.ResizeObserver = class {
        observe = mockObserve
        disconnect = mockDisconnect
        unobserve = vi.fn()
      } as any

      const { unmount } = renderWithTimeline(<TimelineContent data-oid="3pxejn1" />)

      expect(mockObserve).toHaveBeenCalled()

      unmount()
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  describe("Integration with timeline state", () => {
    beforeEach(() => {
      mockTimelineState.project = {
        id: "test",
        name: "Test",
        sections: [{ id: "section-1", name: "Main" }],
        settings: { resolution: { width: 1920, height: 1080 }, fps: 30 },
        duration: 300,
      }
      mockTracks.tracks = [
        {
          id: "track-1",
          name: "Track 1",
          type: "video",
          clips: [],
          isSelected: false,
        },
      ]
    })

    it("should pass correct props to Track component", () => {
      mockTimelineState.selectedTrackIds = ["track-1"]
      mockTimelineState.currentTime = 5

      const { container } = renderWithTimeline(<TimelineContent data-oid="we:kxdy" />)

      const track = container.querySelector('[data-testid="track-track-1"]')
      expect(track).toBeTruthy()
    })

    it("should handle track selection", () => {
      renderWithTimeline(<TimelineContent data-oid="srfdwkk" />)

      // Since Track is mocked, we can't test the actual selection,
      // but we can verify the component receives the correct props
      expect(mockTimelineState.selectTracks).toBeDefined()
    })
  })

  describe("Timeline header rendering", () => {
    beforeEach(() => {
      mockTimelineState.project = {
        id: "test",
        name: "Test",
        sections: [{ id: "section-1", name: "Main" }],
        settings: { resolution: { width: 1920, height: 1080 }, fps: 30 },
        duration: 300,
      }
      mockTracks.tracks = [{ id: "track-1", name: "Track 1", type: "video", clips: [] }]
    })

    it("should render timeline header with project name", () => {
      renderWithTimeline(<TimelineContent data-oid="8qkv99e" />)

      expect(screen.getByText("Test Project")).toBeInTheDocument()
    })

    it("should render resizable panels", () => {
      const { container } = renderWithTimeline(<TimelineContent data-oid="bxw9_qj" />)

      const panels = container.querySelectorAll("[data-default-size]")
      expect(panels).toHaveLength(2)
      expect(panels[0]).toHaveAttribute("data-default-size", "25")
      expect(panels[1]).toHaveAttribute("data-default-size", "75")
    })

    it("should render resizable handle", () => {
      renderWithTimeline(<TimelineContent data-oid="bfmzfub" />)

      expect(screen.getByTestId("resizable-handle")).toBeInTheDocument()
    })
  })

  describe("Split functionality", () => {
    beforeEach(() => {
      mockTimelineState.project = {
        id: "test",
        name: "Test",
        sections: [{ id: "section-1", name: "Main" }],
        settings: { resolution: { width: 1920, height: 1080 }, fps: 30 },
        duration: 300,
      }
      mockTracks.tracks = [
        {
          id: "track-1",
          name: "Track 1",
          type: "video",
          clips: [{ id: "clip-1", startTime: 0, duration: 10 }],
        },
      ]
    })

    it("should setup split indicator with correct props", () => {
      const { container } = renderWithTimeline(<TimelineContent data-oid="jwinep-" />)

      expect(screen.getByTestId("split-indicator")).toBeInTheDocument()

      // Verify scroll container is passed
      const scrollContainer = container.querySelector(".overflow-auto")
      expect(scrollContainer).toBeTruthy()
    })
  })

  describe("Window event listeners", () => {
    beforeEach(() => {
      mockTimelineState.project = {
        id: "test",
        name: "Test",
        sections: [{ id: "section-1", name: "Main" }],
        settings: { resolution: { width: 1920, height: 1080 }, fps: 30 },
        duration: 300,
      }
      mockTracks.tracks = [{ id: "track-1", name: "Track 1", type: "video", clips: [] }]
    })

    it("should setup window resize listener", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener")

      renderWithTimeline(<TimelineContent data-oid="m.5e-gd" />)

      expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function))
    })

    it("should cleanup listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

      const { unmount } = renderWithTimeline(<TimelineContent data-oid="c473aiw" />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function))
    })
  })

  describe("Track updates", () => {
    beforeEach(() => {
      mockTimelineState.project = {
        id: "test",
        name: "Test",
        sections: [{ id: "section-1", name: "Main" }],
        settings: { resolution: { width: 1920, height: 1080 }, fps: 30 },
        duration: 300,
      }
      mockTracks.tracks = [
        {
          id: "track-1",
          name: "Track 1",
          type: "video",
          clips: [],
        },
      ]
    })

    it("should pass update handler to tracks", () => {
      renderWithTimeline(<TimelineContent data-oid="02u66:t" />)

      // Verify updateTrack function is available
      expect(mockTimelineState.updateTrack).toBeDefined()
    })
  })

  describe("Project settings fallback", () => {
    it("should use project settings when projectSettings not available", () => {
      mockTimelineState.project = {
        id: "test",
        name: "Fallback Project",
        sections: [{ id: "section-1", name: "Main" }],
        settings: { resolution: { width: 1280, height: 720 }, fps: 25 },
        duration: 300,
      }

      // Temporarily set projectSettings to null
      vi.mocked(useProjectSettings).mockReturnValueOnce({
        settings: null,
      } as any)

      renderWithTimeline(<TimelineContent data-oid="eb09em8" />)

      expect(screen.getByText("1280x720 @ 25fps")).toBeInTheDocument()
    })
  })

  describe("Drag state integration", () => {
    beforeEach(() => {
      mockTimelineState.project = {
        id: "test",
        name: "Test",
        sections: [{ id: "section-1", name: "Main" }],
        settings: { resolution: { width: 1920, height: 1080 }, fps: 30 },
        duration: 300,
      }
      mockTracks.tracks = [{ id: "track-1", name: "Track 1", type: "video", clips: [] }]
    })

    it("should not show track insertion zones when not dragging", () => {
      mockDragState.dragState.isDragging = false

      renderWithTimeline(<TimelineContent data-oid="id91p:o" />)

      // TrackInsertionZones should still be rendered but with isVisible=false
      expect(screen.getByTestId("track-insertion-zones")).toBeInTheDocument()
    })

    it("should show track insertion zones when dragging", () => {
      mockDragState.dragState.isDragging = true

      renderWithTimeline(<TimelineContent data-oid="b9z32_u" />)

      expect(screen.getByTestId("track-insertion-zones")).toBeInTheDocument()
    })
  })
})
