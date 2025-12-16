/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для Track компонента
 */

import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

// Import mocks before components
import "@/test/mocks/dnd-kit"
import "../../__mocks__/hooks"

import { renderWithTimeline } from "@/test/test-utils"
import { TrackComponent as Track } from "../../components/track/track"

// Мокируем TimelineUIContext
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

// Мокаем данные трека
const mockTrack = {
  id: "track-1",
  name: "Test Track",
  type: "video" as const,
  clips: [],
  transitions: [],
  muted: false,
  solo: false,
  locked: false,
  isLocked: false,
  isMuted: false,
  isHidden: false,
  isSolo: false,
  expanded: false,
  volume: 1,
  pan: 0,
  height: 120,
  order: 0,
  trackEffects: [],
  trackFilters: [],
}

describe("Track Component", () => {
  describe("Component Initialization", () => {
    it("should be defined and exportable", () => {
      expect(Track).toBeDefined()
      expect(typeof Track).toBe("function")
    })

    it("should render without errors", () => {
      expect(() => {
        renderWithTimeline(<Track track={mockTrack} />)
      }).not.toThrow()
    })

    it("should render with track test id", () => {
      renderWithTimeline(<Track track={mockTrack} />)

      const trackElement = screen.getByTestId("timeline-track")
      expect(trackElement).toBeInTheDocument()
    })
  })

  describe("Track Properties", () => {
    it("should display track name", () => {
      renderWithTimeline(<Track track={mockTrack} />)

      expect(screen.getByText("Test Track")).toBeInTheDocument()
    })

    it("should handle different track types", () => {
      const videoTrack = { ...mockTrack, type: "video" as const }
      const audioTrack = { ...mockTrack, type: "audio" as const, name: "Audio Track" }

      const { rerender } = renderWithTimeline(<Track track={videoTrack} />)
      expect(screen.getByTestId("timeline-track")).toBeInTheDocument()

      rerender(<Track track={audioTrack} />)
      expect(screen.getByText("Audio Track")).toBeInTheDocument()
    })

    it("should reflect track state in UI", () => {
      const mutedTrack = { ...mockTrack, isMuted: true, name: "Muted Track" }
      const lockedTrack = { ...mockTrack, isLocked: true, name: "Locked Track" }

      const { rerender } = renderWithTimeline(<Track track={mutedTrack} />)
      expect(screen.getByText("Muted Track")).toBeInTheDocument()

      rerender(<Track track={lockedTrack} />)
      expect(screen.getByText("Locked Track")).toBeInTheDocument()
    })
  })

  describe("Track Interactions", () => {
    it("should handle track selection", () => {
      const onSelect = vi.fn()
      renderWithTimeline(<Track track={mockTrack} onSelect={onSelect} />)

      const trackElement = screen.getByTestId("timeline-track")
      expect(trackElement).toBeInTheDocument()

      // Клик по треку должен вызвать onSelect
      trackElement.click()
      expect(onSelect).toHaveBeenCalledWith(mockTrack.id)
    })

    it("should handle track lock toggle", () => {
      const onUpdate = vi.fn()
      renderWithTimeline(<Track track={mockTrack} onUpdate={onUpdate} />)

      // Ищем кнопку lock
      const lockButton = screen.getByTestId("track-lock-button")
      expect(lockButton).toBeInTheDocument()

      lockButton.click()
      expect(onUpdate).toHaveBeenCalledWith({ ...mockTrack, isLocked: !mockTrack.isLocked })
    })

    it("should handle track mute toggle for audio tracks", () => {
      const audioTrack = { ...mockTrack, type: "audio" as const }
      const onUpdate = vi.fn()
      renderWithTimeline(<Track track={audioTrack} onUpdate={onUpdate} />)

      // Ищем кнопку mute (только для аудио треков)
      const muteButton = screen.getByTestId("track-mute-button")
      expect(muteButton).toBeInTheDocument()

      muteButton.click()
      expect(onUpdate).toHaveBeenCalledWith({ ...audioTrack, isMuted: !audioTrack.isMuted })
    })

    it("should not show mute button for video tracks", () => {
      renderWithTimeline(<Track track={mockTrack} />)

      // Для видео треков кнопка mute не должна отображаться
      const muteButton = screen.queryByTestId("track-mute-button")
      expect(muteButton).not.toBeInTheDocument()
    })
  })

  describe("Track Styling", () => {
    it("should accept className and style props without errors", () => {
      const customStyle = { backgroundColor: "blue", height: "150px" }

      expect(() => {
        renderWithTimeline(<Track track={mockTrack} className="custom-track" style={customStyle} />)
      }).not.toThrow()

      const trackElement = screen.getByTestId("timeline-track")
      expect(trackElement).toBeInTheDocument()
    })
  })

  describe("Track State Variations", () => {
    it("should render hidden track", () => {
      const hiddenTrack = { ...mockTrack, isHidden: true, name: "Hidden Track" }

      expect(() => {
        renderWithTimeline(<Track track={hiddenTrack} />)
      }).not.toThrow()
    })

    it("should render solo track", () => {
      const soloTrack = { ...mockTrack, isSolo: true, name: "Solo Track" }

      renderWithTimeline(<Track track={soloTrack} />)
      expect(screen.getByText("Solo Track")).toBeInTheDocument()
    })

    it("should handle track with clips", () => {
      const trackWithClips = {
        ...mockTrack,
        clips: [
          {
            id: "clip-1",
            name: "Test Clip",
            type: "video" as const,
            mediaId: "media-1",
            trackId: "track-1",
            startTime: 0,
            duration: 10,
            sourceIn: 0,
            sourceOut: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            volume: 1,
            playbackRate: 1,
            speed: 1,
            isReversed: false,
            isMuted: false,
            opacity: 1,
            position: {
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
            },
            effects: [],
            filters: [],
            transitions: [],
            isSelected: false,
            isLocked: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      }

      expect(() => {
        renderWithTimeline(<Track track={trackWithClips} />)
      }).not.toThrow()
    })
  })

  describe("Track Error Handling", () => {
    it("should handle missing track prop gracefully", () => {
      expect(() => {
        renderWithTimeline(<Track track={null} />)
      }).not.toThrow()

      // Проверяем, что отображается fallback
      expect(screen.getByText("Invalid track")).toBeInTheDocument()
    })

    it("should render track with null gracefully", () => {
      renderWithTimeline(<Track track={null} />)

      const trackElement = screen.getByTestId("timeline-track")
      expect(trackElement).toBeInTheDocument()
      expect(screen.getByText("Invalid track")).toBeInTheDocument()
    })
  })

  describe("Track Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      renderWithTimeline(<Track track={mockTrack} />)

      const trackElement = screen.getByTestId("timeline-track")
      expect(trackElement).toBeInTheDocument()

      // DIV с role="button" для обеспечения доступности с вложенными интерактивными элементами
      expect(trackElement.tagName).toBe("DIV")
      expect(trackElement).toHaveAttribute("role", "button")
    })

    it("should be keyboard accessible", () => {
      renderWithTimeline(<Track track={mockTrack} />)

      const trackElement = screen.getByTestId("timeline-track")
      // DIV с role="button" и tabIndex для клавиатурной доступности
      expect(trackElement.tagName).toBe("DIV")
      expect(trackElement).toHaveAttribute("role", "button")
      expect(trackElement).toHaveAttribute("tabIndex", "0")
    })
  })
})
