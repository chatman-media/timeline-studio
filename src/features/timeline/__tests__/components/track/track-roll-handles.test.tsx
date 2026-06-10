/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MediaType } from "@timeline-studio/domains/media-management"
import { useEditModeContext } from "@/features/timeline/hooks/editing/use-edit-mode"
import { RollEditHandle } from "../../../components/edit-tools/roll-edit-handle"
import { TrackRollHandles } from "../../../components/track/track-roll-handles"
import type { TimelineClip, TimelineTrack, TrackType } from "../../../types"
import { EDIT_MODES } from "../../../types/edit-modes"

const mockRollEditHandle = vi.mocked(RollEditHandle)

// Mock dependencies
vi.mock("@/features/timeline/hooks/editing/use-edit-mode", () => ({
  useEditModeContext: vi.fn(),
}))

vi.mock("../../../components/edit-tools/roll-edit-handle", () => ({
  RollEditHandle: vi.fn(({ leftClip, rightClip, onRollStart }) => (
    <div
      data-testid={`roll-handle-${leftClip.id}-${rightClip.id}`}
      onClick={() => onRollStart?.(100)}
      data-oid="w8f.5sk"
    >
      Roll Handle {leftClip.id}-{rightClip.id}
    </div>
  )),
}))

// Test data factories
const createClip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
  id: "clip-1",
  name: "Test Clip",
  type: "video",
  mediaId: "media-1",
  mediaFile: {
    id: "media-1",
    name: "test-video.mp4",
    path: "/path/to/test-video.mp4",
    type: "video" as MediaType,
    duration: 100,
    size: 1000000,
    createdAt: new Date(),
  },
  trackId: "track-1",
  startTime: 10,
  duration: 20,
  sourceIn: 5,
  sourceOut: 25,
  mediaStartTime: 5,
  mediaEndTime: 25,
  offset: 0,
  volume: 1,
  speed: 1,
  playbackRate: 1,
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
  ...overrides,
})

const createTrack = (overrides: Partial<TimelineTrack> = {}): TimelineTrack => ({
  id: "track-1",
  name: "Test Track",
  type: "video" as TrackType,
  clips: [],
  transitions: [],
  isHidden: false,
  isMuted: false,
  muted: false,
  solo: false,
  locked: false,
  expanded: true,
  volume: 1,
  pan: 0,
  order: 0,
  height: 80,
  color: "#3b82f6",
  trackEffects: [],
  trackFilters: [],
  isLocked: false,
  isSolo: false,
  ...overrides,
})

const mockEditModeContext = {
  editMode: EDIT_MODES.ROLL,
  setEditMode: vi.fn(),
  isEditMode: vi.fn(),
  exitEditMode: vi.fn(),
  config: undefined,
  cursor: "default",
}

describe("TrackRollHandles", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockRollEditHandle.mockClear()
    vi.mocked(useEditModeContext).mockReturnValue(mockEditModeContext)
  })

  describe("rendering behavior", () => {
    it("должен рендерить roll handles для смежных клипов в roll режиме", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({ id: "clip-2", startTime: 10, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2] })

      render(<TrackRollHandles track={track} timeScale={10} data-oid="_h.-a:m" />)

      expect(screen.getByTestId("roll-handle-clip-1-clip-2")).toBeInTheDocument()
      const mockCall = mockRollEditHandle.mock.calls[0]
      expect(mockCall[0]).toMatchObject({
        leftClip: clip1,
        rightClip: clip2,
        isHovered: true,
        isActive: false,
        timeScale: 10,
      })
      expect(typeof mockCall[0].onRollStart).toBe("function")
    })

    it("не должен рендерить handles не в roll режиме", () => {
      vi.mocked(useEditModeContext).mockReturnValue({
        ...mockEditModeContext,
        editMode: EDIT_MODES.SELECT,
      })

      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({ id: "clip-2", startTime: 10, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2] })

      const { container } = render(<TrackRollHandles track={track} timeScale={10} data-oid="5:0yy29" />)

      expect(container.firstChild).toBeNull()
      expect(mockRollEditHandle).not.toHaveBeenCalled()
    })

    it("не должен рендерить handles для пустого трека", () => {
      const track = createTrack({ clips: [] })

      const { container } = render(<TrackRollHandles track={track} timeScale={10} data-oid="58900a." />)

      expect(container.firstChild).toBeNull()
      expect(mockRollEditHandle).not.toHaveBeenCalled()
    })

    it("не должен рендерить handles для трека с одним клипом", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const track = createTrack({ clips: [clip1] })

      const { container } = render(<TrackRollHandles track={track} timeScale={10} data-oid="kjplrgy" />)

      expect(container.firstChild).toBeNull()
      expect(mockRollEditHandle).not.toHaveBeenCalled()
    })

    it("должен рендерить handles для всех смежных пар в треке", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({ id: "clip-2", startTime: 10, duration: 10 })
      const clip3 = createClip({ id: "clip-3", startTime: 20, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2, clip3] })

      render(<TrackRollHandles track={track} timeScale={10} data-oid="v10s72t" />)

      expect(screen.getByTestId("roll-handle-clip-1-clip-2")).toBeInTheDocument()
      expect(screen.getByTestId("roll-handle-clip-2-clip-3")).toBeInTheDocument()
      expect(RollEditHandle).toHaveBeenCalledTimes(2)
    })
  })

  describe("adjacent pairs detection", () => {
    it("должен находить смежные клипы (точное касание)", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({ id: "clip-2", startTime: 10, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2] })

      render(<TrackRollHandles track={track} timeScale={10} data-oid="0f6qy_1" />)

      const mockCall = mockRollEditHandle.mock.calls[0]
      expect(mockCall[0]).toMatchObject({
        leftClip: clip1,
        rightClip: clip2,
      })
      expect(typeof mockCall[0].onRollStart).toBe("function")
    })

    it("должен находить смежные клипы с минимальным зазором (в пределах толерантности)", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({
        id: "clip-2",
        startTime: 10.0005,
        duration: 10,
      }) // gap = 0.0005
      const track = createTrack({ clips: [clip1, clip2] })

      render(<TrackRollHandles track={track} timeScale={10} data-oid="3:omvoo" />)

      const mockCall = mockRollEditHandle.mock.calls[0]
      expect(mockCall[0]).toMatchObject({
        leftClip: clip1,
        rightClip: clip2,
      })
      expect(typeof mockCall[0].onRollStart).toBe("function")
    })

    it("не должен находить несмежные клипы (большой зазор)", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({ id: "clip-2", startTime: 15, duration: 10 }) // gap = 5
      const track = createTrack({ clips: [clip1, clip2] })

      const { container } = render(<TrackRollHandles track={track} timeScale={10} data-oid="s-ilay3" />)

      expect(container.firstChild).toBeNull()
      expect(mockRollEditHandle).not.toHaveBeenCalled()
    })

    it("должен обрабатывать перекрывающиеся клипы (отрицательный зазор)", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({
        id: "clip-2",
        startTime: 9.9995,
        duration: 10,
      }) // minimal gap = 0.0005
      const track = createTrack({ clips: [clip1, clip2] })

      render(<TrackRollHandles track={track} timeScale={10} data-oid="yq16f06" />)

      expect(RollEditHandle).toHaveBeenCalledTimes(1)
      const mockCall = mockRollEditHandle.mock.calls[0]
      expect(mockCall[0]).toMatchObject({
        leftClip: clip1,
        rightClip: clip2,
      })
      expect(typeof mockCall[0].onRollStart).toBe("function")
    })

    it("должен правильно сортировать клипы по времени", () => {
      // Клипы в неправильном порядке в массиве
      const clip1 = createClip({ id: "clip-1", startTime: 20, duration: 10 })
      const clip2 = createClip({ id: "clip-2", startTime: 0, duration: 10 })
      const clip3 = createClip({ id: "clip-3", startTime: 10, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2, clip3] })

      render(<TrackRollHandles track={track} timeScale={10} data-oid="1rf1rrs" />)

      expect(RollEditHandle).toHaveBeenCalledTimes(2)
      // Должны быть созданы handles в правильном порядке: clip-2->clip-3, clip-3->clip-1
      expect(screen.getByTestId("roll-handle-clip-2-clip-3")).toBeInTheDocument()
      expect(screen.getByTestId("roll-handle-clip-3-clip-1")).toBeInTheDocument()
    })

    it("должен обрабатывать одинаковые времена начала", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 10, duration: 5 })
      const clip2 = createClip({ id: "clip-2", startTime: 10, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2] })

      const { container } = render(<TrackRollHandles track={track} timeScale={10} data-oid="1fepux9" />)

      // Клипы начинаются в одно время, поэтому они не смежные в обычном понимании
      expect(container.firstChild).toBeNull()
    })
  })

  describe("onRollStart callback", () => {
    it("должен вызывать onRollStart с правильными параметрами", () => {
      const onRollStart = vi.fn()
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({ id: "clip-2", startTime: 10, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2] })

      render(<TrackRollHandles track={track} timeScale={10} onRollStart={onRollStart} data-oid="kz.dhmu" />)

      // Simulate click on roll handle
      screen.getByTestId("roll-handle-clip-1-clip-2").click()

      expect(onRollStart).toHaveBeenCalledWith("clip-1", "clip-2", 100)
    })

    it("должен работать без onRollStart callback", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({ id: "clip-2", startTime: 10, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2] })

      expect(() => {
        render(<TrackRollHandles track={track} timeScale={10} data-oid="6c1g9pa" />)
      }).not.toThrow()

      // Should not throw when clicking
      expect(() => {
        screen.getByTestId("roll-handle-clip-1-clip-2").click()
      }).not.toThrow()
    })

    it("должен передавать callback для каждого handle отдельно", () => {
      const onRollStart = vi.fn()
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({ id: "clip-2", startTime: 10, duration: 10 })
      const clip3 = createClip({ id: "clip-3", startTime: 20, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2, clip3] })

      render(<TrackRollHandles track={track} timeScale={10} onRollStart={onRollStart} data-oid="_3qee-:" />)

      screen.getByTestId("roll-handle-clip-1-clip-2").click()
      screen.getByTestId("roll-handle-clip-2-clip-3").click()

      expect(onRollStart).toHaveBeenCalledTimes(2)
      expect(onRollStart).toHaveBeenNthCalledWith(1, "clip-1", "clip-2", 100)
      expect(onRollStart).toHaveBeenNthCalledWith(2, "clip-2", "clip-3", 100)
    })
  })

  describe("timeScale prop", () => {
    it("должен передавать timeScale в RollEditHandle", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({ id: "clip-2", startTime: 10, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2] })

      render(<TrackRollHandles track={track} timeScale={25} data-oid="wk0q82p" />)

      const mockCall = mockRollEditHandle.mock.calls[0]
      expect(mockCall[0]).toMatchObject({
        timeScale: 25,
      })
      expect(typeof mockCall[0].onRollStart).toBe("function")
    })

    it("должен работать с разными значениями timeScale", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({ id: "clip-2", startTime: 10, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2] })

      const { rerender } = render(<TrackRollHandles track={track} timeScale={10} data-oid="keklazm" />)

      let mockCall = mockRollEditHandle.mock.calls[0]
      expect(mockCall[0]).toMatchObject({
        timeScale: 10,
      })
      expect(typeof mockCall[0].onRollStart).toBe("function")

      rerender(<TrackRollHandles track={track} timeScale={50} data-oid="sa8.r0g" />)

      mockCall = mockRollEditHandle.mock.calls[1]
      expect(mockCall[0]).toMatchObject({
        timeScale: 50,
      })
      expect(typeof mockCall[0].onRollStart).toBe("function")
    })
  })

  describe("performance and memoization", () => {
    it("должен пересчитывать adjacentPairs только при изменении clips", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({ id: "clip-2", startTime: 10, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2] })

      const { rerender } = render(<TrackRollHandles track={track} timeScale={10} data-oid="z6jd5n8" />)

      expect(RollEditHandle).toHaveBeenCalledTimes(1)

      // Rerender with same clips but different timeScale
      rerender(<TrackRollHandles track={track} timeScale={20} data-oid="18xf5ec" />)

      // adjacentPairs should be memoized, so RollEditHandle called only for re-render
      expect(RollEditHandle).toHaveBeenCalledTimes(2)

      // Rerender with different clips
      const newClips = [
        createClip({ id: "clip-3", startTime: 0, duration: 5 }),
        createClip({ id: "clip-4", startTime: 5, duration: 5 }),
        createClip({ id: "clip-5", startTime: 10, duration: 5 }),
      ]

      const newTrack = createTrack({ clips: newClips })

      rerender(<TrackRollHandles track={newTrack} timeScale={20} data-oid="zef0d1m" />)

      // Should call for 2 new adjacent pairs
      expect(RollEditHandle).toHaveBeenCalledTimes(4)
    })

    it("должен корректно обновлять при добавлении клипов", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const track = createTrack({ clips: [clip1] })

      const { rerender, container } = render(<TrackRollHandles track={track} timeScale={10} data-oid="834.8f:" />)

      // No handles for single clip
      expect(container.firstChild).toBeNull()

      // Add adjacent clip
      const clip2 = createClip({ id: "clip-2", startTime: 10, duration: 10 })
      const updatedTrack = createTrack({ clips: [clip1, clip2] })

      rerender(<TrackRollHandles track={updatedTrack} timeScale={10} data-oid="pfg:3vi" />)

      expect(screen.getByTestId("roll-handle-clip-1-clip-2")).toBeInTheDocument()
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать клипы с нулевой продолжительностью", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 0 })
      const clip2 = createClip({ id: "clip-2", startTime: 0, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2] })

      render(<TrackRollHandles track={track} timeScale={10} data-oid="fhhhjnv" />)

      const mockCall = mockRollEditHandle.mock.calls[0]
      expect(mockCall[0]).toMatchObject({
        leftClip: clip1,
        rightClip: clip2,
      })
      expect(typeof mockCall[0].onRollStart).toBe("function")
    })

    it("должен обрабатывать отрицательные времена начала", () => {
      const clip1 = createClip({ id: "clip-1", startTime: -5, duration: 10 })
      const clip2 = createClip({ id: "clip-2", startTime: 5, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2] })

      render(<TrackRollHandles track={track} timeScale={10} data-oid="9lknlr1" />)

      const mockCall = mockRollEditHandle.mock.calls[0]
      expect(mockCall[0]).toMatchObject({
        leftClip: clip1,
        rightClip: clip2,
      })
      expect(typeof mockCall[0].onRollStart).toBe("function")
    })

    it("должен обрабатывать очень большие значения времени", () => {
      const clip1 = createClip({
        id: "clip-1",
        startTime: 1000000,
        duration: 1000,
      })
      const clip2 = createClip({
        id: "clip-2",
        startTime: 1001000,
        duration: 1000,
      })
      const track = createTrack({ clips: [clip1, clip2] })

      render(<TrackRollHandles track={track} timeScale={0.01} data-oid="5du4v7v" />)

      const mockCall = mockRollEditHandle.mock.calls[0]
      expect(mockCall[0]).toMatchObject({
        leftClip: clip1,
        rightClip: clip2,
        timeScale: 0.01,
      })
      expect(typeof mockCall[0].onRollStart).toBe("function")
    })

    it("должен обрабатывать дублирующиеся ID клипов", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({ id: "clip-1", startTime: 10, duration: 10 }) // Same ID
      const track = createTrack({ clips: [clip1, clip2] })

      expect(() => {
        render(<TrackRollHandles track={track} timeScale={10} data-oid="o_z653l" />)
      }).not.toThrow()

      // Should still render handle (React key might be problematic, but component should work)
      expect(RollEditHandle).toHaveBeenCalled()
    })

    it("должен обрабатывать дробные значения времени", () => {
      const clip1 = createClip({
        id: "clip-1",
        startTime: 0.333,
        duration: 10.666,
      })
      const clip2 = createClip({
        id: "clip-2",
        startTime: 10.999,
        duration: 10.001,
      })
      const track = createTrack({ clips: [clip1, clip2] })

      render(<TrackRollHandles track={track} timeScale={10} data-oid="hqmszn3" />)

      const mockCall = mockRollEditHandle.mock.calls[0]
      expect(mockCall[0]).toMatchObject({
        leftClip: clip1,
        rightClip: clip2,
      })
      expect(typeof mockCall[0].onRollStart).toBe("function")
    })

    it("должен обрабатывать множественные режимы редактирования", () => {
      const clip1 = createClip({ id: "clip-1", startTime: 0, duration: 10 })
      const clip2 = createClip({ id: "clip-2", startTime: 10, duration: 10 })
      const track = createTrack({ clips: [clip1, clip2] })

      const editModes = [EDIT_MODES.SELECT, EDIT_MODES.TRIM, EDIT_MODES.RIPPLE, EDIT_MODES.SLIP]

      editModes.forEach((mode) => {
        vi.mocked(useEditModeContext).mockReturnValue({
          ...mockEditModeContext,
          editMode: mode,
        })

        const { container } = render(<TrackRollHandles track={track} timeScale={10} data-oid=":mqtou-" />)

        // Roll handles should NOT appear for these modes
        expect(container.firstChild).toBeNull()
      })
    })
  })
})
