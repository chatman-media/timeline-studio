/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ParameterSlider } from "../../components/controls/parameter-slider"

describe("ParameterSlider", () => {
  const defaultProps = {
    label: "Test Slider",
    value: 50,
    onChange: vi.fn(),
    min: 0,
    max: 100,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render parameter slider", () => {
    render(<ParameterSlider {...defaultProps} data-oid="k4w7ayk" />)

    expect(screen.getByText("Test Slider")).toBeInTheDocument()
  })

  it("should display current value", () => {
    render(<ParameterSlider {...defaultProps} data-oid="_a0sbjs" />)

    expect(screen.getByText("50")).toBeInTheDocument()
  })

  it("should render range input", () => {
    render(<ParameterSlider {...defaultProps} data-oid="b_1gns2" />)

    const input = screen.getByRole("slider")
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute("min", "0")
    expect(input).toHaveAttribute("max", "100")
    expect(input).toHaveAttribute("value", "50")
  })

  it("should call onChange when value changes", () => {
    render(<ParameterSlider {...defaultProps} data-oid="z-zclvt" />)

    const input = screen.getByRole("slider")
    fireEvent.change(input, { target: { value: "75" } })

    expect(defaultProps.onChange).toHaveBeenCalledWith(75)
  })

  it("should use custom step", () => {
    render(<ParameterSlider {...defaultProps} step={5} data-oid="37rg_0i" />)

    const input = screen.getByRole("slider")
    expect(input).toHaveAttribute("step", "5")
  })

  it("should format value with custom formatter", () => {
    const formatValue = (v: number) => `${v}%`
    render(<ParameterSlider {...defaultProps} formatValue={formatValue} data-oid="30z_vr5" />)

    expect(screen.getByText("50%")).toBeInTheDocument()
  })

  it("should hide value when showValue is false", () => {
    render(<ParameterSlider {...defaultProps} showValue={false} data-oid="vxjxki_" />)

    expect(screen.queryByText("50")).not.toBeInTheDocument()
  })

  it("should be disabled when disabled prop is true", () => {
    render(<ParameterSlider {...defaultProps} disabled data-oid="udepr12" />)

    const input = screen.getByRole("slider")
    expect(input).toBeDisabled()
  })

  it("should reset to default value on double click", async () => {
    const user = userEvent.setup()
    const { container } = render(<ParameterSlider {...defaultProps} defaultValue={25} data-oid="47o3ox:" />)

    const track = container.querySelector(".bg-muted")!
    await user.dblClick(track)

    expect(defaultProps.onChange).toHaveBeenCalledWith(25)
  })

  it("should not reset when disabled", async () => {
    const user = userEvent.setup()
    const { container } = render(<ParameterSlider {...defaultProps} defaultValue={25} disabled data-oid="-zx41cs" />)

    const track = container.querySelector(".bg-muted")!
    await user.dblClick(track)

    expect(defaultProps.onChange).not.toHaveBeenCalled()
  })

  it("should show different colors based on value relative to default", () => {
    const { container, rerender } = render(<ParameterSlider {...defaultProps} defaultValue={50} data-oid="nk_wdnr" />)

    // Value equals default - muted-foreground
    let filledBar = container.querySelector(".bg-muted-foreground")
    expect(filledBar).toBeInTheDocument()

    // Value greater than default - blue
    rerender(<ParameterSlider {...defaultProps} value={75} defaultValue={50} data-oid="wyqry0v" />)
    filledBar = container.querySelector(".bg-blue-500")
    expect(filledBar).toBeInTheDocument()

    // Value less than default - orange
    rerender(<ParameterSlider {...defaultProps} value={25} defaultValue={50} data-oid="rmrwyh1" />)
    filledBar = container.querySelector(".bg-orange-500")
    expect(filledBar).toBeInTheDocument()
  })

  it("should show blue color when no default value", () => {
    const { container } = render(<ParameterSlider {...defaultProps} data-oid="1c72vh7" />)

    const filledBar = container.querySelector(".bg-blue-500")
    expect(filledBar).toBeInTheDocument()
  })

  it("should calculate correct percentage for fill width", () => {
    const { container } = render(<ParameterSlider {...defaultProps} value={25} min={0} max={100} data-oid="nt9dd43" />)

    const filledBar = container.querySelector("[style*='width']") as HTMLElement
    expect(filledBar?.style.width).toBe("25%")
  })

  it("should show center mark when default value is provided", () => {
    const { container } = render(<ParameterSlider {...defaultProps} defaultValue={50} data-oid="12sqozu" />)

    const centerMark = container.querySelector(".bg-border") as HTMLElement
    expect(centerMark).toBeInTheDocument()
    expect(centerMark?.style.left).toBe("50%")
  })

  it("should not show center mark without default value", () => {
    const { container } = render(<ParameterSlider {...defaultProps} data-oid="z3e.h6." />)

    const centerMark = container.querySelector(".bg-border")
    expect(centerMark).not.toBeInTheDocument()
  })

  it("should handle dragging state", () => {
    const { container } = render(<ParameterSlider {...defaultProps} data-oid="tmg6jxk" />)

    const input = screen.getByRole("slider")
    const filledBar = container.querySelector("[class*='transition']") as HTMLElement

    // Before drag - has transition
    expect(filledBar).toHaveClass("transition-all")

    // Start drag
    fireEvent.mouseDown(input)
    expect(filledBar).toHaveClass("transition-none")

    // End drag
    fireEvent.mouseUp(input)
    expect(filledBar).toHaveClass("transition-all")
  })

  it("should show tooltip on hover when default value exists", async () => {
    const user = userEvent.setup()
    const { container } = render(<ParameterSlider {...defaultProps} defaultValue={50} data-oid="2vu:s.9" />)

    const sliderContainer = container.querySelector(".group")!

    // Find the tooltip element
    const tooltip = screen.getByText("Double-click to reset")
    const tooltipContainer = tooltip.closest("div")!

    // Initially hidden
    expect(tooltipContainer).toHaveClass("opacity-0")

    // Show on hover
    await user.hover(sliderContainer)
    expect(tooltipContainer).toHaveClass("group-hover:opacity-100")
  })

  it("should not show tooltip when disabled", () => {
    render(<ParameterSlider {...defaultProps} defaultValue={50} disabled data-oid="w_u_ky9" />)

    expect(screen.queryByText("Double-click to reset")).not.toBeInTheDocument()
  })

  it("should not show tooltip without default value", () => {
    render(<ParameterSlider {...defaultProps} data-oid="4ob4nn2" />)

    expect(screen.queryByText("Double-click to reset")).not.toBeInTheDocument()
  })

  it("should apply custom className", () => {
    const { container } = render(<ParameterSlider {...defaultProps} className="custom-class" data-oid="vljv022" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass("custom-class")
  })

  it("should handle edge values correctly", () => {
    const { container, rerender } = render(
      <ParameterSlider {...defaultProps} value={0} min={0} max={100} data-oid="aqzh0oi" />,
    )

    let filledBar = container.querySelector("[style*='width']") as HTMLElement
    expect(filledBar?.style.width).toBe("0%")

    rerender(<ParameterSlider {...defaultProps} value={100} min={0} max={100} data-oid="7bbziuf" />)
    filledBar = container.querySelector("[style*='width']") as HTMLElement
    expect(filledBar?.style.width).toBe("100%")
  })

  it("should handle negative ranges", () => {
    const { container } = render(
      <ParameterSlider {...defaultProps} value={0} min={-100} max={100} data-oid="54-:k:s" />,
    )

    const filledBar = container.querySelector("[style*='width']") as HTMLElement
    expect(filledBar?.style.width).toBe("50%")
  })

  it("should position default value mark correctly in negative range", () => {
    const { container } = render(
      <ParameterSlider {...defaultProps} value={25} min={-100} max={100} defaultValue={0} data-oid="cij6wc6" />,
    )

    const centerMark = container.querySelector(".bg-border")
    expect(centerMark).toHaveStyle({ left: "50%" })
  })
})
