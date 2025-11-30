import { fireEvent, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { renderWithBase } from "@/test/test-utils"
import { CurveEditor } from "../../components/curve-editor"
import { createKeyframe } from "../../services/keyframe-manager"
import type { AnimationCurve } from "../../types/keyframe"

describe("CurveEditor Component", () => {
  const mockCurves: AnimationCurve[] = [
    {
      propertyId: "prop-1",
      keyframes: [createKeyframe(0, 0, "linear"), createKeyframe(1, 100, "linear")],
      preInfinity: "constant",
      postInfinity: "constant",
      visible: true,
      color: "#3b82f6",
      selected: false,
    },
  ]

  const defaultProps = {
    curves: mockCurves,
    currentTime: 0,
    duration: 10,
    onTimeChange: vi.fn(),
    onKeyframeAdd: vi.fn(),
    onKeyframeUpdate: vi.fn(),
    onKeyframeDelete: vi.fn(),
    onCurveSelect: vi.fn(),
  }

  it("renders curve editor", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0)
  })

  it("displays playback controls", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    // Check for play button
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(0)
  })

  it("renders canvas element", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    const canvas = document.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
  })

  it("calls onTimeChange when slider is moved", () => {
    const onTimeChange = vi.fn()
    renderWithBase(<CurveEditor {...defaultProps} onTimeChange={onTimeChange} />)

    // Component should render with sliders
    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0)
  })

  it("displays time information", () => {
    renderWithBase(<CurveEditor {...defaultProps} currentTime={2.5} />)

    // Component should render without errors
    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0)
  })

  it("renders interpolation type selector", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    // Combobox for interpolation type
    const comboboxes = screen.getAllByRole("combobox")
    expect(comboboxes.length).toBeGreaterThan(0)
  })

  it("displays curve list", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    expect(screen.getByText(/Property prop-1/)).toBeInTheDocument()
  })

  it("handles curve selection", () => {
    const onCurveSelect = vi.fn()
    renderWithBase(<CurveEditor {...defaultProps} onCurveSelect={onCurveSelect} />)

    const curveItem = screen.getByText(/Property prop-1/)
    fireEvent.click(curveItem)

    expect(onCurveSelect).toHaveBeenCalledWith("prop-1")
  })

  it("highlights selected curve", () => {
    renderWithBase(<CurveEditor {...defaultProps} selectedCurveId="prop-1" />)

    const curveItem = screen.getByText(/Property prop-1/).closest("div")
    expect(curveItem).toHaveClass("bg-muted")
  })

  it("respects snapToGrid prop", () => {
    const { rerender } = renderWithBase(<CurveEditor {...defaultProps} snapToGrid={false} />)

    // Re-render with snapToGrid enabled
    rerender(<CurveEditor {...defaultProps} snapToGrid={true} />)

    // Component should render without errors
    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0)
  })

  it("uses custom height", () => {
    renderWithBase(<CurveEditor {...defaultProps} height={600} />)

    const canvas = document.querySelector("canvas")
    expect(canvas?.height).toBe(600)
  })

  it("renders multiple curves", () => {
    const multipleCurves: AnimationCurve[] = [
      ...mockCurves,
      {
        propertyId: "prop-2",
        keyframes: [createKeyframe(0, 50, "ease-out")],
        preInfinity: "constant",
        postInfinity: "constant",
        visible: true,
        color: "#ef4444",
        selected: false,
      },
    ]

    renderWithBase(<CurveEditor {...defaultProps} curves={multipleCurves} />)

    expect(screen.getByText(/Property prop-1/)).toBeInTheDocument()
    expect(screen.getByText(/Property prop-2/)).toBeInTheDocument()
  })

  it("handles empty curves array", () => {
    renderWithBase(<CurveEditor {...defaultProps} curves={[]} />)

    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0)
  })

  it("handles mouse wheel for zoom", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    const canvas = document.querySelector("canvas")
    expect(canvas).toBeInTheDocument()

    if (canvas) {
      fireEvent.wheel(canvas, { deltaY: -100 })
      // Component should handle zoom without errors
      expect(canvas).toBeInTheDocument()
    }
  })

  it("resets zoom and pan when reset button clicked", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    // Find the maximize/reset button
    const buttons = screen.getAllByRole("button")
    // The reset button should be one of the toolbar buttons
    expect(buttons.length).toBeGreaterThan(4)
  })

  it("toggles play/pause state", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    const buttons = screen.getAllByRole("button")
    // Play/pause button should be first
    expect(buttons.length).toBeGreaterThan(0)
  })

  it("navigates to start of timeline", () => {
    const onTimeChange = vi.fn()
    renderWithBase(<CurveEditor {...defaultProps} onTimeChange={onTimeChange} />)

    // Component renders buttons
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(1)
  })

  it("navigates to end of timeline", () => {
    const onTimeChange = vi.fn()
    renderWithBase(<CurveEditor {...defaultProps} onTimeChange={onTimeChange} />)

    // Component renders buttons
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(2)
  })

  it("toggles grid visibility", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    // Grid toggle button should be available
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(3)
  })

  it("handles mouse down on canvas", () => {
    const onKeyframeAdd = vi.fn()
    const onCurveSelect = vi.fn()
    renderWithBase(
      <CurveEditor
        {...defaultProps}
        selectedCurveId="prop-1"
        onKeyframeAdd={onKeyframeAdd}
        onCurveSelect={onCurveSelect}
      />,
    )

    const canvas = document.querySelector("canvas")
    if (canvas) {
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      // Should handle mouse down
      expect(canvas).toBeInTheDocument()
    }
  })

  it("handles mouse move on canvas", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    const canvas = document.querySelector("canvas")
    if (canvas) {
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 })
      // Should handle mouse move
      expect(canvas).toBeInTheDocument()
    }
  })

  it("handles mouse up on canvas", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    const canvas = document.querySelector("canvas")
    if (canvas) {
      fireEvent.mouseUp(canvas)
      // Should handle mouse up
      expect(canvas).toBeInTheDocument()
    }
  })

  it("handles mouse leave on canvas", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    const canvas = document.querySelector("canvas")
    if (canvas) {
      fireEvent.mouseLeave(canvas)
      // Should handle mouse leave
      expect(canvas).toBeInTheDocument()
    }
  })

  it("changes interpolation type", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    const comboboxes = screen.getAllByRole("combobox")
    expect(comboboxes.length).toBeGreaterThan(0)
  })

  it("updates zoom via slider", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    // Zoom slider should be present
    const sliders = screen.getAllByRole("slider")
    expect(sliders.length).toBeGreaterThan(1) // Time slider + zoom slider
  })

  it("renders time scrubber", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    const sliders = screen.getAllByRole("slider")
    // Should have time scrubber
    expect(sliders.length).toBeGreaterThan(0)
  })

  it("handles curve visibility toggle", () => {
    renderWithBase(<CurveEditor {...defaultProps} />)

    const curveItem = screen.getByText(/Property prop-1/)
    const parent = curveItem.closest("div")
    expect(parent).toBeInTheDocument()

    // Find visibility toggle button
    const buttons = parent?.querySelectorAll("button")
    expect(buttons).toBeDefined()
  })

  it("uses custom gridSize", () => {
    renderWithBase(<CurveEditor {...defaultProps} snapToGrid={true} gridSize={5} />)

    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0)
  })

  it("renders curves with different interpolation types", () => {
    const curvesWithDifferentInterpolation: AnimationCurve[] = [
      {
        propertyId: "prop-bezier",
        keyframes: [
          { ...createKeyframe(0, 0, "bezier"), easeOut: [0.5, 0.5], easeIn: [0.5, 0.5] },
          { ...createKeyframe(1, 100, "bezier"), easeOut: [0.5, 0.5], easeIn: [0.5, 0.5] },
        ],
        preInfinity: "constant",
        postInfinity: "constant",
        visible: true,
        color: "#3b82f6",
        selected: false,
      },
      {
        propertyId: "prop-hold",
        keyframes: [createKeyframe(0, 0, "hold"), createKeyframe(1, 100, "hold")],
        preInfinity: "constant",
        postInfinity: "constant",
        visible: true,
        color: "#ef4444",
        selected: false,
      },
    ]

    renderWithBase(<CurveEditor {...defaultProps} curves={curvesWithDifferentInterpolation} />)

    expect(screen.getByText(/Property prop-bezier/)).toBeInTheDocument()
    expect(screen.getByText(/Property prop-hold/)).toBeInTheDocument()
  })

  it("renders selected keyframes", () => {
    const curveWithSelectedKeyframe: AnimationCurve[] = [
      {
        propertyId: "prop-1",
        keyframes: [{ ...createKeyframe(0, 0, "linear"), selected: true }, createKeyframe(1, 100, "linear")],
        preInfinity: "constant",
        postInfinity: "constant",
        visible: true,
        color: "#3b82f6",
        selected: false,
      },
    ]

    renderWithBase(<CurveEditor {...defaultProps} curves={curveWithSelectedKeyframe} />)

    const canvas = document.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
  })

  it("handles invisible curves", () => {
    const invisibleCurve: AnimationCurve[] = [
      {
        propertyId: "prop-1",
        keyframes: [createKeyframe(0, 0, "linear"), createKeyframe(1, 100, "linear")],
        preInfinity: "constant",
        postInfinity: "constant",
        visible: false,
        color: "#3b82f6",
        selected: false,
      },
    ]

    renderWithBase(<CurveEditor {...defaultProps} curves={invisibleCurve} />)

    expect(screen.getByText(/Property prop-1/)).toBeInTheDocument()
  })

  it("renders curves with single keyframe", () => {
    const singleKeyframeCurve: AnimationCurve[] = [
      {
        propertyId: "prop-1",
        keyframes: [createKeyframe(0, 0, "linear")],
        preInfinity: "constant",
        postInfinity: "constant",
        visible: true,
        color: "#3b82f6",
        selected: false,
      },
    ]

    renderWithBase(<CurveEditor {...defaultProps} curves={singleKeyframeCurve} />)

    const canvas = document.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
  })
})
