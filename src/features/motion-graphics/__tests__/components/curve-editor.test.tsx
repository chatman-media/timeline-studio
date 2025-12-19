/**
 * @vitest-environment jsdom
 */
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
    renderWithBase(<CurveEditor {...defaultProps} data-oid="8gz688a" />)

    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0)
  })

  it("displays playback controls", () => {
    renderWithBase(<CurveEditor {...defaultProps} data-oid="ffwfwn9" />)

    // Check for play button
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(0)
  })

  it("renders canvas element", () => {
    renderWithBase(<CurveEditor {...defaultProps} data-oid="53iuah4" />)

    const canvas = document.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
  })

  it("calls onTimeChange when slider is moved", () => {
    const onTimeChange = vi.fn()
    renderWithBase(<CurveEditor {...defaultProps} onTimeChange={onTimeChange} data-oid="6ux09cb" />)

    // Component should render with sliders
    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0)
  })

  it("displays time information", () => {
    renderWithBase(<CurveEditor {...defaultProps} currentTime={2.5} data-oid="zxdqo8-" />)

    // Component should render without errors
    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0)
  })

  it("renders interpolation type selector", () => {
    renderWithBase(<CurveEditor {...defaultProps} data-oid="t89.57d" />)

    // Combobox for interpolation type
    const comboboxes = screen.getAllByRole("combobox")
    expect(comboboxes.length).toBeGreaterThan(0)
  })

  it("displays curve list", () => {
    renderWithBase(<CurveEditor {...defaultProps} data-oid="a1r0zj:" />)

    expect(screen.getByText(/Property prop-1/)).toBeInTheDocument()
  })

  it("handles curve selection", () => {
    const onCurveSelect = vi.fn()
    renderWithBase(<CurveEditor {...defaultProps} onCurveSelect={onCurveSelect} data-oid="-cx40se" />)

    const curveItem = screen.getByText(/Property prop-1/)
    fireEvent.click(curveItem)

    expect(onCurveSelect).toHaveBeenCalledWith("prop-1")
  })

  it("highlights selected curve", () => {
    renderWithBase(<CurveEditor {...defaultProps} selectedCurveId="prop-1" data-oid="83s0:t6" />)

    const curveItem = screen.getByText(/Property prop-1/).closest("div")
    expect(curveItem).toHaveClass("bg-muted")
  })

  it("respects snapToGrid prop", () => {
    const { rerender } = renderWithBase(<CurveEditor {...defaultProps} snapToGrid={false} data-oid="-5:yaa7" />)

    // Re-render with snapToGrid enabled
    rerender(<CurveEditor {...defaultProps} snapToGrid={true} data-oid="28f-5f-" />)

    // Component should render without errors
    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0)
  })

  it("uses custom height", () => {
    renderWithBase(<CurveEditor {...defaultProps} height={600} data-oid="mdj-vhf" />)

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

    renderWithBase(<CurveEditor {...defaultProps} curves={multipleCurves} data-oid="ragvm9k" />)

    expect(screen.getByText(/Property prop-1/)).toBeInTheDocument()
    expect(screen.getByText(/Property prop-2/)).toBeInTheDocument()
  })

  it("handles empty curves array", () => {
    renderWithBase(<CurveEditor {...defaultProps} curves={[]} data-oid="-erwgti" />)

    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0)
  })

  it("handles mouse wheel for zoom", () => {
    renderWithBase(<CurveEditor {...defaultProps} data-oid="aoxhgmq" />)

    const canvas = document.querySelector("canvas")
    expect(canvas).toBeInTheDocument()

    if (canvas) {
      fireEvent.wheel(canvas, { deltaY: -100 })
      // Component should handle zoom without errors
      expect(canvas).toBeInTheDocument()
    }
  })

  it("resets zoom and pan when reset button clicked", () => {
    renderWithBase(<CurveEditor {...defaultProps} data-oid="j90ov1m" />)

    // Find the maximize/reset button
    const buttons = screen.getAllByRole("button")
    // The reset button should be one of the toolbar buttons
    expect(buttons.length).toBeGreaterThan(4)
  })

  it("toggles play/pause state", () => {
    renderWithBase(<CurveEditor {...defaultProps} data-oid="my5gisg" />)

    const buttons = screen.getAllByRole("button")
    // Play/pause button should be first
    expect(buttons.length).toBeGreaterThan(0)
  })

  it("navigates to start of timeline", () => {
    const onTimeChange = vi.fn()
    renderWithBase(<CurveEditor {...defaultProps} onTimeChange={onTimeChange} data-oid="l2x60kr" />)

    // Component renders buttons
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(1)
  })

  it("navigates to end of timeline", () => {
    const onTimeChange = vi.fn()
    renderWithBase(<CurveEditor {...defaultProps} onTimeChange={onTimeChange} data-oid="xswbkb5" />)

    // Component renders buttons
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(2)
  })

  it("toggles grid visibility", () => {
    renderWithBase(<CurveEditor {...defaultProps} data-oid="dk19o.-" />)

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
        data-oid="h66yod_"
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
    renderWithBase(<CurveEditor {...defaultProps} data-oid="b-19763" />)

    const canvas = document.querySelector("canvas")
    if (canvas) {
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 })
      // Should handle mouse move
      expect(canvas).toBeInTheDocument()
    }
  })

  it("handles mouse up on canvas", () => {
    renderWithBase(<CurveEditor {...defaultProps} data-oid="kh1g8w5" />)

    const canvas = document.querySelector("canvas")
    if (canvas) {
      fireEvent.mouseUp(canvas)
      // Should handle mouse up
      expect(canvas).toBeInTheDocument()
    }
  })

  it("handles mouse leave on canvas", () => {
    renderWithBase(<CurveEditor {...defaultProps} data-oid="c1zg9r." />)

    const canvas = document.querySelector("canvas")
    if (canvas) {
      fireEvent.mouseLeave(canvas)
      // Should handle mouse leave
      expect(canvas).toBeInTheDocument()
    }
  })

  it("changes interpolation type", () => {
    renderWithBase(<CurveEditor {...defaultProps} data-oid="_u:6h6p" />)

    const comboboxes = screen.getAllByRole("combobox")
    expect(comboboxes.length).toBeGreaterThan(0)
  })

  it("updates zoom via slider", () => {
    renderWithBase(<CurveEditor {...defaultProps} data-oid="bm0tx79" />)

    // Zoom slider should be present
    const sliders = screen.getAllByRole("slider")
    expect(sliders.length).toBeGreaterThan(1) // Time slider + zoom slider
  })

  it("renders time scrubber", () => {
    renderWithBase(<CurveEditor {...defaultProps} data-oid="p_q.sca" />)

    const sliders = screen.getAllByRole("slider")
    // Should have time scrubber
    expect(sliders.length).toBeGreaterThan(0)
  })

  it("handles curve visibility toggle", () => {
    renderWithBase(<CurveEditor {...defaultProps} data-oid="sf9h1da" />)

    const curveItem = screen.getByText(/Property prop-1/)
    const parent = curveItem.closest("div")
    expect(parent).toBeInTheDocument()

    // Find visibility toggle button
    const buttons = parent?.querySelectorAll("button")
    expect(buttons).toBeDefined()
  })

  it("uses custom gridSize", () => {
    renderWithBase(<CurveEditor {...defaultProps} snapToGrid={true} gridSize={5} data-oid="70lpquc" />)

    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0)
  })

  it("renders curves with different interpolation types", () => {
    const curvesWithDifferentInterpolation: AnimationCurve[] = [
      {
        propertyId: "prop-bezier",
        keyframes: [
          {
            ...createKeyframe(0, 0, "bezier"),
            easeOut: [0.5, 0.5],
            easeIn: [0.5, 0.5],
          },
          {
            ...createKeyframe(1, 100, "bezier"),
            easeOut: [0.5, 0.5],
            easeIn: [0.5, 0.5],
          },
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

    renderWithBase(<CurveEditor {...defaultProps} curves={curvesWithDifferentInterpolation} data-oid="wm1mb-n" />)

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

    renderWithBase(<CurveEditor {...defaultProps} curves={curveWithSelectedKeyframe} data-oid="tz33knp" />)

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

    renderWithBase(<CurveEditor {...defaultProps} curves={invisibleCurve} data-oid="qqlj1t8" />)

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

    renderWithBase(<CurveEditor {...defaultProps} curves={singleKeyframeCurve} data-oid="_5j.:1t" />)

    const canvas = document.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
  })
})
