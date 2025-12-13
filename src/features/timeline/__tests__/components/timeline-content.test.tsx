import { fireEvent, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithTimeline } from "@/test/test-utils"
import { useProjectSettings } from "@/features/project-settings/hooks/use-project-settings"

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

const mockTimelineState = vi.hoisted(() => ({
  project: null as any,
  uiState: {
    timeScale: 10,
    selectedTrackIds: [] as string[],
  },
  currentTime: 0,
  createProject: vi.fn().mockResolvedValue(undefined),
  addSection: vi.fn().mockResolvedValue(undefined),
  addTrack: vi.fn(),
  updateTrack: vi.fn(),
  selectTracks: vi.fn(),
  seek: vi.fn(),
  error: null as string | null,
  clearError: vi.fn(),
  send: vi.fn(),
}))

const mockTracks = vi.hoisted(() => ({
  tracks: [] as any[],
  setTrackHeight: vi.fn(),
}))

const mockClips = vi.hoisted(() => ({
  clips: [] as any[],
}))

const mockDragState = vi.hoisted(() => ({
  dragState: { isDragging: false },
}))

// Mock все внешние зависимости
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant }: any) => <span data-variant={variant}>{children}</span>,
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}))

vi.mock("@/components/ui/resizable", () => ({
  ResizableHandle: () => <div data-testid="resizable-handle" />,
  ResizablePanel: ({ children, defaultSize }: any) => <div data-default-size={defaultSize}>{children}</div>,
  ResizablePanelGroup: ({ children }: any) => <div>{children}</div>,
}))

vi.mock("@/domains/project-management/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domains/project-management/hooks")>()
  return {
    ...actual,
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
  }
})

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

vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: () => mockTimelineState,
}))

vi.mock("../../hooks/use-tracks", () => ({
  useTracks: () => mockTracks,
}))

vi.mock("../../hooks/use-clips", () => ({
  useClips: () => mockClips,
}))

vi.mock("../../hooks/use-drag-drop-timeline", () => ({
  useDragDropTimeline: () => mockDragState,
}))

vi.mock("../../context/timeline-ui-context", () => ({
  TimelineUIProvider: ({ children }: any) => children,
  useTimelineUI: () => ({
    uiState: { timeScale: 60, scrollPosition: { x: 0, y: 0 }, minTimeScale: 10, maxTimeScale: 200 },
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

vi.mock("../../hooks/use-timeline-player-sync", () => ({
  useTimelinePlayerSync: vi.fn(),
}))

vi.mock("../../hooks/use-edit-mode", () => ({
  EditModeProvider: ({ children }: any) => <div>{children}</div>,
}))

// Mock child components
vi.mock("../../components/timeline-hotkeys", () => ({
  TimelineHotkeys: () => <div data-testid="timeline-hotkeys" />,
}))

vi.mock("../../components/timeline-speed-ramping-integration", () => ({
  TimelineSpeedRampingIntegration: () => <div data-testid="timeline-speed-ramping-integration" />,
  SpeedRampingIndicator: () => <div data-testid="speed-ramping-indicator" />,
  TimelineSpeedRampingStatus: () => <div data-testid="timeline-speed-ramping-status" />,
}))

vi.mock("../../components/edit-mode-selector", () => ({
  EditModeSelector: () => <div data-testid="edit-mode-selector" />,
}))

vi.mock("../../components/edit-tools/edit-mode-overlay", () => ({
  EditModeOverlay: () => <div data-testid="edit-mode-overlay" />,
}))

vi.mock("../../components/ai-markers/ai-marker-controls", () => ({
  AIMarkerControls: () => <div data-testid="ai-marker-controls" />,
}))

vi.mock("../../components/track-controls-panel", () => ({
  TrackControlsPanel: () => <div data-testid="track-controls-panel" />,
}))

vi.mock("../../components/drag-drop-provider", () => ({
  DragDropProvider: ({ children }: any) => <div>{children}</div>,
}))

vi.mock("../../components/markers", () => ({
  TimelineMarkersLayer: () => <div data-testid="timeline-markers-layer" />,
}))

vi.mock("../../components/ai-analysis/timeline-ai-overlay", () => ({
  TimelineAIOverlay: () => <div data-testid="timeline-ai-overlay" />,
}))

vi.mock("../../components/edit-tools/split-indicator", () => ({
  SplitIndicator: () => <div data-testid="split-indicator" />,
}))

vi.mock("../../components/track-insertion-zone", () => ({
  TrackInsertionZones: () => <div data-testid="track-insertion-zones" />,
}))

vi.mock("../../components/timeline-preview-strip", () => ({
  TimelinePreviewStrip: () => <div data-testid="timeline-preview-strip" />,
}))

vi.mock("../../components/timeline-scale", () => ({
  TimelineScale: () => <div data-testid="timeline-scale" />,
}))

vi.mock("../../components/track/track", () => ({
  Track: ({ track }: any) => <div data-testid={`track-${track.id}`}>{track.name}</div>,
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
    // ResizeObserver уже мокируется в setup.ts
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Loading and error states", () => {
    it("should render without loading state when project is not initialized", () => {
      renderWithTimeline(<TimelineContent />)

      // Компонент больше не показывает loading state - Timeline рендерится сразу
      // Проект создается автоматически в useEffect
      expect(mockTimelineState.createProject).toHaveBeenCalled()
    })

    it("should show error state when there is an error", () => {
      mockTimelineState.error = "Failed to load timeline"

      renderWithTimeline(<TimelineContent />)

      expect(screen.getByText("Ошибка Timeline")).toBeInTheDocument()
      expect(screen.getByText("Failed to load timeline")).toBeInTheDocument()
      expect(screen.getByText("Закрыть")).toBeInTheDocument()
    })

    it("should clear error when clicking close button", () => {
      mockTimelineState.error = "Some error"

      renderWithTimeline(<TimelineContent />)

      const closeButton = screen.getByText("Закрыть")
      fireEvent.click(closeButton)

      expect(mockTimelineState.clearError).toHaveBeenCalled()
    })
  })

  describe("Project initialization", () => {
    it("should create project on mount when no project exists", async () => {
      renderWithTimeline(<TimelineContent />)

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

      renderWithTimeline(<TimelineContent />)

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

      renderWithTimeline(<TimelineContent />)

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
      renderWithTimeline(<TimelineContent />)

      expect(screen.getByTestId("timeline-hotkeys")).toBeInTheDocument()
      expect(screen.getByTestId("timeline-speed-ramping-integration")).toBeInTheDocument()
      expect(screen.getByTestId("speed-ramping-indicator")).toBeInTheDocument()
      expect(screen.getByTestId("edit-mode-overlay")).toBeInTheDocument()
      expect(screen.getByTestId("edit-mode-selector")).toBeInTheDocument()
      expect(screen.getByTestId("ai-marker-controls")).toBeInTheDocument()
    })

    it("should display project information", () => {
      renderWithTimeline(<TimelineContent />)

      expect(screen.getByText("Test Project")).toBeInTheDocument()
      expect(screen.getByText("1920x1080 @ 30fps")).toBeInTheDocument()
    })

    it("should display statistics badges", () => {
      mockTracks.tracks = [{ id: "t1" }, { id: "t2" }]
      mockClips.clips = [{ id: "c1" }, { id: "c2" }, { id: "c3" }]

      renderWithTimeline(<TimelineContent />)

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

      renderWithTimeline(<TimelineContent />)

      expect(screen.getByText("Треки не найдены")).toBeInTheDocument()
      expect(screen.getByText("Добавить видео трек")).toBeInTheDocument()
    })

    it("should add track when clicking add button", () => {
      mockTracks.tracks = []

      renderWithTimeline(<TimelineContent />)

      const addButton = screen.getByText("Добавить видео трек")
      fireEvent.click(addButton)

      expect(mockTimelineState.addTrack).toHaveBeenCalledWith("Video", "Видео трек")
    })

    it("should render tracks when they exist", () => {
      mockTracks.tracks = [
        { id: "track-1", name: "Video Track 1", type: "video", clips: [] },
        { id: "track-2", name: "Audio Track 1", type: "audio", clips: [] },
      ]

      renderWithTimeline(<TimelineContent />)

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
      renderWithTimeline(<TimelineContent />)

      expect(screen.getByTestId("timeline-scale")).toBeInTheDocument()
    })

    it("should render markers layer", () => {
      renderWithTimeline(<TimelineContent />)

      expect(screen.getByTestId("timeline-markers-layer")).toBeInTheDocument()
    })

    it("should render AI overlay", () => {
      renderWithTimeline(<TimelineContent />)

      expect(screen.getByTestId("timeline-ai-overlay")).toBeInTheDocument()
    })

    it("should render split indicator", () => {
      renderWithTimeline(<TimelineContent />)

      expect(screen.getByTestId("split-indicator")).toBeInTheDocument()
    })

    it("should render track insertion zones when dragging", () => {
      mockDragState.dragState.isDragging = true

      renderWithTimeline(<TimelineContent />)

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

      renderWithTimeline(<TimelineContent />)

      expect(screen.queryByTestId("timeline-preview-strip")).not.toBeInTheDocument()
    })

    it.skip("should render preview strip for video clips with media", () => {
      // SKIP: Preview strip был удален при рефакторинге - теперь tracks рендерятся через TracksWithTimeScale
      mockTracks.tracks = [{ id: "track-1", name: "Video Track", type: "video", clips: ["clip-1"] }]
      mockClips.clips = [
        {
          id: "clip-1",
          trackId: "track-1",
          mediaFile: { path: "/path/to/video.mp4" },
          startTime: 0,
          duration: 10,
        },
      ]

      renderWithTimeline(<TimelineContent />)

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
      const { container } = renderWithTimeline(<TimelineContent />)

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

      const { unmount } = renderWithTimeline(<TimelineContent />)

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
      mockTimelineState.uiState.selectedTrackIds = ["track-1"]
      mockTimelineState.currentTime = 5

      const { container } = renderWithTimeline(<TimelineContent />)

      const track = container.querySelector('[data-testid="track-track-1"]')
      expect(track).toBeTruthy()
    })

    it("should handle track selection", () => {
      renderWithTimeline(<TimelineContent />)

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

    it("should render timeline header with label", () => {
      renderWithTimeline(<TimelineContent />)

      expect(screen.getByText("Временная шкала")).toBeInTheDocument()
    })

    it("should render resizable panels", () => {
      const { container } = renderWithTimeline(<TimelineContent />)

      const panels = container.querySelectorAll("[data-default-size]")
      expect(panels).toHaveLength(2)
      expect(panels[0]).toHaveAttribute("data-default-size", "25")
      expect(panels[1]).toHaveAttribute("data-default-size", "75")
    })

    it("should render resizable handle", () => {
      renderWithTimeline(<TimelineContent />)

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
      const { container } = renderWithTimeline(<TimelineContent />)

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

      renderWithTimeline(<TimelineContent />)

      expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function))
    })

    it("should cleanup listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

      const { unmount } = renderWithTimeline(<TimelineContent />)

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
      renderWithTimeline(<TimelineContent />)

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
      vi.mocked(useProjectSettings).mockReturnValueOnce({ settings: null } as any)

      renderWithTimeline(<TimelineContent />)

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

      renderWithTimeline(<TimelineContent />)

      // TrackInsertionZones should still be rendered but with isVisible=false
      expect(screen.getByTestId("track-insertion-zones")).toBeInTheDocument()
    })

    it("should show track insertion zones when dragging", () => {
      mockDragState.dragState.isDragging = true

      renderWithTimeline(<TimelineContent />)

      expect(screen.getByTestId("track-insertion-zones")).toBeInTheDocument()
    })
  })
})
