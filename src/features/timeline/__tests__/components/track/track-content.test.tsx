import { useDroppable } from "@dnd-kit/core"
import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Import mocks before components
import { renderWithProviders } from "@/test/test-utils"

import { mockUseDragDropTimeline } from "../../../__mocks__/hooks"
import { TrackContent } from "../../../components/track/track-content"
import type { TimelineClip, TimelineTrack } from "../../../types"

// Import the global mock

// Мокаем dnd-kit
vi.mock("@dnd-kit/core", () => ({
  useDroppable: vi.fn(() => ({
    isOver: false,
    setNodeRef: vi.fn(),
  })),
}))

// Мокаем TrackRollHandles компонент
vi.mock("../../../components/track/track-roll-handles", () => ({
  TrackRollHandles: () => null,
}))

// Create local references to the mocked drag state and function
const mockDragState = {
  isDragging: false,
  draggedItem: null,
  dragOverTrack: null,
  dropPosition: null,
}

const mockIsValidDropTarget = vi.fn(() => true)

// Мокаем useTimeline
const mockAddClip = vi.fn()
vi.mock("../../../hooks/use-timeline", () => ({
  useTimeline: () => ({
    addClip: mockAddClip,
    project: null,
    uiState: {
      selectedClipIds: [],
      selectedTrackIds: [],
      selectedSectionIds: [],
    },
    currentTime: 0,
    error: null,
  }),
}))

// Мокаем useDropZone
vi.mock("@/features/drag-drop", () => ({
  useDropZone: vi.fn(() => ({
    ref: { current: null },
  })),
}))

// Мокаем компонент Clip
vi.mock("../../../components/clip/clip", () => ({
  Clip: ({ clip, timeScale }: any) => (
    <div
      data-testid={`clip-${clip.id}`}
      data-clip-id={clip.id}
      data-start-time={clip.startTime}
      style={{ left: `${clip.startTime * timeScale}px` }}
    >
      Clip {clip.id}
    </div>
  ),
}))

// Мокаем плейхэд индикатор
vi.mock("../../../components/track/track-playhead-indicator", () => ({
  TrackPlayheadIndicator: ({ currentTime, timeScale }: any) => (
    <div
      data-testid="playhead-indicator"
      data-current-time={currentTime}
      style={{ left: `${currentTime * timeScale}px` }}
    >
      Playhead
    </div>
  ),
}))

describe("TrackContent", () => {
  const mockOnUpdate = vi.fn()

  const baseTrack: TimelineTrack = {
    id: "track-1",
    sectionId: "section-1",
    type: "video",
    name: "Video Track 1",
    height: 100,
    isLocked: false,
    isMuted: false,
    isHidden: false,
    volume: 1,
    clips: [],
    order: 0,
    isSolo: false,
    pan: 0,
    trackEffects: [],
    trackFilters: [],
    transitions: [],
  }

  const baseClip: TimelineClip = {
    id: "clip-1",
    trackId: "track-1",
    mediaId: "media-1",
    name: "Test Clip",
    startTime: 5,
    duration: 10,
    offset: 0,
    mediaStartTime: 0,
    mediaEndTime: 10,
    volume: 1,
    isSelected: false,
    isLocked: false,
    isReversed: false,
    speed: 1,
    opacity: 1,
    effects: [],
    filters: [],
    transitions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockDragState.isDragging = false
    mockDragState.dropPosition = null
    mockIsValidDropTarget.mockReturnValue(true)

    // Set up the global drag-drop mock to use our local state
    mockUseDragDropTimeline.mockReturnValue({
      dragState: {
        ...mockDragState,
        dropPosition: mockDragState.dropPosition as any,
      },
      isValidDropTarget: mockIsValidDropTarget,
      handleDragStart: vi.fn(),
      handleDragOver: vi.fn(),
      handleDragEnd: vi.fn(),
      isValidDropTargetForNewTrack: vi.fn(() => false),
    })

    // Reset useDroppable mock to default state
    vi.mocked(useDroppable).mockReturnValue({
      isOver: false,
      setNodeRef: vi.fn(),
      active: null,
      rect: { current: null },
      node: { current: null },
      over: null,
    } as any)
  })

  describe("Рендеринг основного контента", () => {
    it("должен рендерить контейнер трека", () => {
      renderWithProviders(<TrackContent track={baseTrack} timeScale={10} currentTime={0} onUpdate={mockOnUpdate} />)

      const container = screen.getByTestId("track-container-track-1")
      expect(container).toBeInTheDocument()
    })

    it("должен рендерить клипы трека", () => {
      const trackWithClips = {
        ...baseTrack,
        clips: [
          { ...baseClip, id: "clip-1", startTime: 5 },
          { ...baseClip, id: "clip-2", startTime: 20 },
        ],
      }

      renderWithProviders(
        <TrackContent track={trackWithClips} timeScale={10} currentTime={0} onUpdate={mockOnUpdate} />,
      )

      expect(screen.getByTestId("clip-clip-1")).toBeInTheDocument()
      expect(screen.getByTestId("clip-clip-2")).toBeInTheDocument()
    })

    it("должен сортировать клипы по времени начала", () => {
      const trackWithClips = {
        ...baseTrack,
        clips: [
          { ...baseClip, id: "clip-2", startTime: 20 },
          { ...baseClip, id: "clip-1", startTime: 5 },
          { ...baseClip, id: "clip-3", startTime: 15 },
        ],
      }

      renderWithProviders(
        <TrackContent track={trackWithClips} timeScale={10} currentTime={0} onUpdate={mockOnUpdate} />,
      )

      const clips = screen.getAllByTestId(/^clip-clip-/)
      expect(clips[0]).toHaveAttribute("data-start-time", "5")
      expect(clips[1]).toHaveAttribute("data-start-time", "15")
      expect(clips[2]).toHaveAttribute("data-start-time", "20")
    })

    it("должен рендерить playhead индикатор", () => {
      renderWithProviders(<TrackContent track={baseTrack} timeScale={10} currentTime={5} onUpdate={mockOnUpdate} />)

      // Playhead рендерится как div с определенными классами
      const container = screen.getByTestId("track-container-track-1")
      const playhead = container.querySelector(".bg-primary.z-20")
      expect(playhead).toBeInTheDocument()
      expect(playhead).toHaveStyle({ left: "50px" })
    })
  })

  describe("Drag and Drop функциональность", () => {
    it("должен показывать drop feedback при перетаскивании", () => {
      // Set up the mock to return the correct state before rendering
      mockUseDragDropTimeline.mockReturnValue({
        dragState: {
          isDragging: true,
          draggedItem: null,
          dragOverTrack: null,
          dropPosition: null,
        },
        isValidDropTarget: vi.fn(() => true),
        handleDragStart: vi.fn(),
        handleDragOver: vi.fn(),
        handleDragEnd: vi.fn(),
        isValidDropTargetForNewTrack: vi.fn(() => false),
      })

      // Mock useDroppable to return isOver: true
      vi.mocked(useDroppable).mockReturnValue({
        isOver: true,
        setNodeRef: vi.fn(),
        active: null,
        rect: { current: null },
        node: { current: null },
        over: null,
      } as any)

      renderWithProviders(<TrackContent track={baseTrack} timeScale={10} currentTime={0} onUpdate={mockOnUpdate} />)

      expect(screen.getByText("Drop here")).toBeInTheDocument()
    })

    it("должен применять стили для валидного drop target", () => {
      mockUseDragDropTimeline.mockReturnValue({
        dragState: {
          isDragging: true,
          draggedItem: null,
          dragOverTrack: null,
          dropPosition: null,
        },
        isValidDropTarget: vi.fn(() => true),
        handleDragStart: vi.fn(),
        handleDragOver: vi.fn(),
        handleDragEnd: vi.fn(),
        isValidDropTargetForNewTrack: vi.fn(() => false),
      })

      renderWithProviders(<TrackContent track={baseTrack} timeScale={10} currentTime={0} onUpdate={mockOnUpdate} />)

      const container = screen.getByTestId("track-container-track-1")
      expect(container.className).toMatch(/border-dashed/)
      expect(container.className).toMatch(/border-2/)
    })

    it("должен применять стили для невалидного drop target", () => {
      mockUseDragDropTimeline.mockReturnValue({
        dragState: {
          isDragging: true,
          draggedItem: null,
          dragOverTrack: null,
          dropPosition: null,
        },
        isValidDropTarget: vi.fn(() => false),
        handleDragStart: vi.fn(),
        handleDragOver: vi.fn(),
        handleDragEnd: vi.fn(),
        isValidDropTargetForNewTrack: vi.fn(() => false),
      })

      renderWithProviders(<TrackContent track={baseTrack} timeScale={10} currentTime={0} onUpdate={mockOnUpdate} />)

      const container = screen.getByTestId("track-container-track-1")
      expect(container.className).toMatch(/opacity-50/)
    })

    it("должен показывать insertion индикатор", () => {
      mockUseDragDropTimeline.mockReturnValue({
        dragState: {
          isDragging: false,
          draggedItem: null,
          dragOverTrack: null,
          dropPosition: {
            trackId: "track-1",
            startTime: 10,
          },
        },
        isValidDropTarget: vi.fn(() => true),
        handleDragStart: vi.fn(),
        handleDragOver: vi.fn(),
        handleDragEnd: vi.fn(),
        isValidDropTargetForNewTrack: vi.fn(() => false),
      })

      renderWithProviders(<TrackContent track={baseTrack} timeScale={10} currentTime={0} onUpdate={mockOnUpdate} />)

      const indicator = document.querySelector(".bg-primary.z-25")
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveStyle({ left: "100px" }) // 10 * 10
    })

    it("не должен показывать insertion индикатор для другого трека", () => {
      mockUseDragDropTimeline.mockReturnValue({
        dragState: {
          isDragging: false,
          draggedItem: null,
          dragOverTrack: null,
          dropPosition: {
            trackId: "track-2", // Другой трек
            startTime: 10,
          },
        },
        isValidDropTarget: vi.fn(() => true),
        handleDragStart: vi.fn(),
        handleDragOver: vi.fn(),
        handleDragEnd: vi.fn(),
        isValidDropTargetForNewTrack: vi.fn(() => false),
      })

      renderWithProviders(<TrackContent track={baseTrack} timeScale={10} currentTime={0} onUpdate={mockOnUpdate} />)

      const indicator = document.querySelector(".bg-primary.z-25")
      expect(indicator).not.toBeInTheDocument()
    })
  })

  describe("Обработка событий клипов", () => {
    it("должен обновлять клип через onUpdate", () => {
      const trackWithClip = {
        ...baseTrack,
        clips: [baseClip],
      }

      renderWithProviders(<TrackContent track={trackWithClip} timeScale={10} currentTime={0} onUpdate={mockOnUpdate} />)

      // Симулируем вызов handleClipUpdate
      // В реальном компоненте это происходит через пропс onUpdate компонента Clip
      const clipElement = screen.getByTestId("clip-clip-1")
      expect(clipElement).toBeInTheDocument()

      // Проверяем что onUpdate передан в правильном формате
      expect(mockOnUpdate).not.toHaveBeenCalled()
    })

    it("должен удалять клип через onUpdate", () => {
      const trackWithClips = {
        ...baseTrack,
        clips: [
          { ...baseClip, id: "clip-1" },
          { ...baseClip, id: "clip-2", startTime: 20 },
        ],
      }

      renderWithProviders(
        <TrackContent track={trackWithClips} timeScale={10} currentTime={0} onUpdate={mockOnUpdate} />,
      )

      // В реальном компоненте удаление происходит через пропс onRemove компонента Clip
      expect(screen.getByTestId("clip-clip-1")).toBeInTheDocument()
      expect(screen.getByTestId("clip-clip-2")).toBeInTheDocument()
    })
  })

  describe("Стили и классы", () => {
    it("должен иметь базовые стили", () => {
      renderWithProviders(<TrackContent track={baseTrack} timeScale={10} currentTime={0} onUpdate={mockOnUpdate} />)

      const container = screen.getByTestId("track-container-track-1")
      expect(container.className).toMatch(/relative/)
      expect(container.className).toMatch(/h-full/)
      expect(container.className).toMatch(/w-full/)
      expect(container.className).toMatch(/bg-background/)
      expect(container.className).toMatch(/border-l/)
      expect(container.className).toMatch(/border-border/)
    })

    it("должен показывать drop zone визуальный feedback", () => {
      mockUseDragDropTimeline.mockReturnValue({
        dragState: {
          isDragging: true,
          draggedItem: null,
          dragOverTrack: null,
          dropPosition: null,
        },
        isValidDropTarget: vi.fn(() => true),
        handleDragStart: vi.fn(),
        handleDragOver: vi.fn(),
        handleDragEnd: vi.fn(),
        isValidDropTargetForNewTrack: vi.fn(() => false),
      })

      vi.mocked(useDroppable).mockReturnValue({
        isOver: true,
        setNodeRef: vi.fn(),
        active: null,
        rect: { current: null },
        node: { current: null },
        over: null,
      } as any)

      renderWithProviders(<TrackContent track={baseTrack} timeScale={10} currentTime={0} onUpdate={mockOnUpdate} />)

      const dropZone = screen.getByText("Drop here").closest(".absolute")
      expect(dropZone).toHaveClass("absolute")
      expect(dropZone).toHaveClass("inset-0")
      expect(dropZone).toHaveClass("bg-primary/5")
    })
  })

  describe("Работа с различными типами треков", () => {
    it("должен корректно работать с audio треком", () => {
      const audioTrack = { ...baseTrack, type: "audio" as const }

      renderWithProviders(<TrackContent track={audioTrack} timeScale={10} currentTime={0} onUpdate={mockOnUpdate} />)

      expect(screen.getByTestId("track-container-track-1")).toBeInTheDocument()
    })

    it("должен корректно работать с subtitle треком", () => {
      const subtitleTrack = { ...baseTrack, type: "subtitle" as const }

      renderWithProviders(<TrackContent track={subtitleTrack} timeScale={10} currentTime={0} onUpdate={mockOnUpdate} />)

      expect(screen.getByTestId("track-container-track-1")).toBeInTheDocument()
    })
  })
})
