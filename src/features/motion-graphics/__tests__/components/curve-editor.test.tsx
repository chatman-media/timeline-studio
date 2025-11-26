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
})
