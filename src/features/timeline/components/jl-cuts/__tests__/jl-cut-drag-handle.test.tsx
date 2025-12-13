import { fireEvent, render, screen } from "@testing-library/react"
import { renderWithTimeline } from "@/test/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { TimelineClip } from "@/features/timeline/types"
import { JLCutDragHandle } from "../jl-cut-drag-handle"

// Mock useJLCuts hook
const mockCreateJCut = vi.fn()
const mockCreateLCut = vi.fn()

vi.mock("../../../hooks/editing/use-jl-cuts", () => ({
  useJLCuts: () => ({
    createJCut: mockCreateJCut,
    createLCut: mockCreateLCut,
  }),
}))

// Создаем mock клипы
const createMockClip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
  id: "clip-1",
  name: "Test Clip",
  mediaId: "media-1",
  trackId: "track-1",
  startTime: 0,
  duration: 10,
  offset: 0,
  mediaFile: {
    id: "media-1",
    name: "test.mp4",
    path: "/test.mp4",
    type: "video" as any,
    duration: 10,
    size: 1000,
    createdAt: new Date(),
  },
  mediaStartTime: 0,
  mediaEndTime: 10,
  volume: 1,
  speed: 1,
  isReversed: false,
  opacity: 1,
  audioOffset: 0,
  effects: [],
  filters: [],
  transitions: [],
  isSelected: false,
  isLocked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe("JLCutDragHandle", () => {
  const defaultProps = {
    clip: createMockClip({ audioOffset: 2 }),
    linkedClip: createMockClip({ id: "linked-clip" }),
    cutType: "j-cut" as const,
    pixelsPerSecond: 100,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render drag handle", () => {
    const { getByTestId } = renderWithTimeline(<JLCutDragHandle {...defaultProps} />)

    const handle = getByTestId("jl-cut-handle")
    expect(handle).toBeInTheDocument()
    expect(handle).toHaveClass("cursor-ew-resize")
  })

  describe("J-Cut positioning and styling", () => {
    it("should position handle for J-Cut", () => {
      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...defaultProps} />)

      const handle = getByTestId("jl-cut-handle")
      expect(handle).toHaveClass("left-0 -translate-x-full")
      expect(handle).toHaveStyle({ marginLeft: "200px" }) // 2 * 100 pixels
    })

    it("should position visual indicator for J-Cut", () => {
      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...defaultProps} />)

      const visualHandle = container.querySelector("[class*='bg-primary/50']")
      expect(visualHandle).toBeInTheDocument()
    })
  })

  describe("L-Cut positioning and styling", () => {
    const lCutProps = {
      ...defaultProps,
      clip: createMockClip({ audioOffset: -1.5 }),
      cutType: "l-cut" as const,
    }

    it("should position handle for L-Cut", () => {
      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...lCutProps} />)

      const handle = getByTestId("jl-cut-handle")
      expect(handle).toHaveClass("right-0 translate-x-full")
      expect(handle).toHaveStyle({ marginRight: "150px" }) // Math.abs(-1.5) * 100 pixels
    })

    it("should position visual indicator for L-Cut", () => {
      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...lCutProps} />)

      const visualHandle = container.querySelector("[class*='bg-primary/50']")
      expect(visualHandle).toBeInTheDocument()
    })
  })

  describe("Mouse interaction", () => {
    it("should handle mousedown event", () => {
      const onOffsetChange = vi.fn()
      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...defaultProps} onOffsetChange={onOffsetChange} />)

      const handle = getByTestId("jl-cut-handle")

      fireEvent.mouseDown(handle, {
        clientX: 100,
      })

      // Проверяем что handle обрабатывает mousedown
      expect(handle).toBeInTheDocument()
    })

    it("should show tooltip during drag", () => {
      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...defaultProps} />)

      const handle = getByTestId("jl-cut-handle")

      fireEvent.mouseDown(handle, {
        clientX: 100,
      })

      // Проверяем что tooltip появился
      const tooltip = screen.getByText("2.0s")
      expect(tooltip).toBeInTheDocument()
      expect(tooltip).toHaveClass("bg-popover text-popover-foreground")
    })

    it("should position tooltip correctly for J-Cut", () => {
      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...defaultProps} />)

      const handle = getByTestId("jl-cut-handle")

      fireEvent.mouseDown(handle, {
        clientX: 100,
      })

      const tooltip = screen.getByText("2.0s")
      expect(tooltip).toHaveClass("right-full mr-2")
    })

    it("should position tooltip correctly for L-Cut", () => {
      const lCutProps = {
        ...defaultProps,
        clip: createMockClip({ audioOffset: -1.5 }),
        cutType: "l-cut" as const,
      }

      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...lCutProps} />)

      const handle = getByTestId("jl-cut-handle")

      fireEvent.mouseDown(handle, {
        clientX: 100,
      })

      const tooltip = screen.getByText("1.5s")
      expect(tooltip).toHaveClass("left-full ml-2")
    })

    it("should call createJCut for J-Cut during drag", () => {
      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...defaultProps} />)

      const handle = getByTestId("jl-cut-handle")

      fireEvent.mouseDown(handle, {
        clientX: 100,
      })

      // Симулируем mousemove
      fireEvent(
        document,
        new MouseEvent("mousemove", {
          clientX: 150, // +50 pixels
        }),
      )

      // Проверяем что createJCut был вызван
      expect(mockCreateJCut).toHaveBeenCalledWith("clip-1", expect.any(Number))
    })

    it("should call createLCut for L-Cut during drag", () => {
      const lCutProps = {
        ...defaultProps,
        clip: createMockClip({ audioOffset: -1.5 }),
        cutType: "l-cut" as const,
      }

      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...lCutProps} />)

      const handle = getByTestId("jl-cut-handle")

      fireEvent.mouseDown(handle, {
        clientX: 100,
      })

      // Симулируем mousemove
      fireEvent(
        document,
        new MouseEvent("mousemove", {
          clientX: 150,
        }),
      )

      // Проверяем что createLCut был вызван
      expect(mockCreateLCut).toHaveBeenCalledWith("clip-1", expect.any(Number))
    })

    it("should call onOffsetChange callback during drag", () => {
      const onOffsetChange = vi.fn()
      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...defaultProps} onOffsetChange={onOffsetChange} />)

      const handle = getByTestId("jl-cut-handle")

      fireEvent.mouseDown(handle, {
        clientX: 100,
      })

      fireEvent(
        document,
        new MouseEvent("mousemove", {
          clientX: 150,
        }),
      )

      expect(onOffsetChange).toHaveBeenCalledWith(expect.any(Number))
    })

    it("should constrain offset to minimum 0.1s", () => {
      const onOffsetChange = vi.fn()
      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...defaultProps} onOffsetChange={onOffsetChange} />)

      const handle = getByTestId("jl-cut-handle")

      fireEvent.mouseDown(handle, {
        clientX: 100,
      })

      // Симулируем движение далеко влево (большое отрицательное delta)
      fireEvent(
        document,
        new MouseEvent("mousemove", {
          clientX: -1000,
        }),
      )

      // Проверяем что offset не меньше 0.1
      expect(onOffsetChange).toHaveBeenCalledWith(0.1)
    })

    it("should constrain offset to maximum 5s", () => {
      const onOffsetChange = vi.fn()
      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...defaultProps} onOffsetChange={onOffsetChange} />)

      const handle = getByTestId("jl-cut-handle")

      fireEvent.mouseDown(handle, {
        clientX: 100,
      })

      // Симулируем движение далеко вправо (большое положительное delta)
      fireEvent(
        document,
        new MouseEvent("mousemove", {
          clientX: 1000,
        }),
      )

      // Проверяем что offset не больше 5
      expect(onOffsetChange).toHaveBeenCalledWith(5)
    })

    it("should stop dragging on mouseup", () => {
      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...defaultProps} />)

      const handle = getByTestId("jl-cut-handle")

      fireEvent.mouseDown(handle, {
        clientX: 100,
      })

      expect(handle).toBeInTheDocument()

      fireEvent(document, new MouseEvent("mouseup"))

      // Проверяем что handle остается в документе
      expect(handle).toBeInTheDocument()
    })

    it("should prevent default and stop propagation on mousedown", () => {
      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...defaultProps} />)

      const handle = getByTestId("jl-cut-handle")

      const mouseDownEvent = new MouseEvent("mousedown", {
        clientX: 100,
        bubbles: true,
        cancelable: true,
      })

      const preventDefaultSpy = vi.spyOn(mouseDownEvent, "preventDefault")
      const stopPropagationSpy = vi.spyOn(mouseDownEvent, "stopPropagation")

      fireEvent(handle, mouseDownEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(stopPropagationSpy).toHaveBeenCalled()
    })
  })

  describe("Zero offset handling", () => {
    it("should handle undefined audioOffset", () => {
      const props = {
        ...defaultProps,
        clip: createMockClip({ audioOffset: undefined }),
      }

      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...props} />)

      const handle = getByTestId("jl-cut-handle")
      expect(handle).toHaveStyle({ marginLeft: "0px" })
    })

    it("should format zero offset correctly in tooltip", () => {
      const props = {
        ...defaultProps,
        clip: createMockClip({ audioOffset: 0 }),
      }

      const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...props} />)

      const handle = getByTestId("jl-cut-handle")

      fireEvent.mouseDown(handle, {
        clientX: 100,
      })

      const tooltip = screen.getByText("0.0s")
      expect(tooltip).toBeInTheDocument()
    })
  })

  it("should apply custom className", () => {
    const customClass = "custom-drag-handle"
    const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...defaultProps} className={customClass} />)

    const handle = getByTestId("jl-cut-handle")
    expect(handle).toHaveClass(customClass)
  })

  it("should have proper hover styling", () => {
    const { getByTestId, container } = renderWithTimeline(<JLCutDragHandle {...defaultProps} />)

    const handle = getByTestId("jl-cut-handle")
    expect(handle).toHaveClass("cursor-ew-resize")

    const visualHandle = container.querySelector("[class*='bg-primary/50']")
    expect(visualHandle).toBeInTheDocument()
  })
})
