/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ColorWheel } from "../../components/color-wheels/color-wheel"

// Мокаем canvas context
const mockContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  arc: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 0,
}

HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
  if (contextId === "2d") {
    return mockContext as unknown as CanvasRenderingContext2D
  }
  return null
}) as typeof HTMLCanvasElement.prototype.getContext

describe("ColorWheel", () => {
  const defaultProps = {
    type: "lift" as const,
    label: "Lift",
    value: { r: 0, g: 0, b: 0 },
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render color wheel with label", () => {
    render(<ColorWheel {...defaultProps} />)

    expect(screen.getByText("Lift")).toBeInTheDocument()
  })

  it("should display RGB values", () => {
    render(<ColorWheel {...defaultProps} value={{ r: 0.5, g: -0.3, b: 0.2 }} />)

    expect(screen.getByText("+0.50")).toBeInTheDocument()
    expect(screen.getByText("-0.30")).toBeInTheDocument()
    expect(screen.getByText("+0.20")).toBeInTheDocument()
  })

  it("should render canvas with correct size", () => {
    const { container } = render(<ColorWheel {...defaultProps} size={100} />)

    const canvas = container.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute("width", "100")
    expect(canvas).toHaveAttribute("height", "100")
  })

  it("should call onChange when clicking on wheel", () => {
    const onChange = vi.fn()
    const { container } = render(<ColorWheel {...defaultProps} onChange={onChange} />)

    const wheelContainer = container.querySelector('[style*="width"]')
    if (wheelContainer) {
      // Создаем мок для getBoundingClientRect
      wheelContainer.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        right: 80,
        bottom: 80,
        width: 80,
        height: 80,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      fireEvent.mouseDown(wheelContainer, { clientX: 40, clientY: 40 })
    }

    expect(onChange).toHaveBeenCalled()
  })

  it("should not call onChange when disabled", () => {
    const onChange = vi.fn()
    const { container } = render(<ColorWheel {...defaultProps} onChange={onChange} disabled />)

    const wheelContainer = container.querySelector('[style*="width"]')
    if (wheelContainer) {
      fireEvent.mouseDown(wheelContainer, { clientX: 40, clientY: 40 })
    }

    expect(onChange).not.toHaveBeenCalled()
  })

  it("should handle drag operations", () => {
    const onChange = vi.fn()
    const { container } = render(<ColorWheel {...defaultProps} onChange={onChange} />)

    const wheelContainer = container.querySelector('[style*="width"]')
    if (wheelContainer) {
      wheelContainer.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        right: 80,
        bottom: 80,
        width: 80,
        height: 80,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      // Start drag
      fireEvent.mouseDown(wheelContainer, { clientX: 40, clientY: 40 })
      expect(onChange).toHaveBeenCalledTimes(1)

      // Move mouse
      fireEvent.mouseMove(window, { clientX: 50, clientY: 50 })
      expect(onChange).toHaveBeenCalledTimes(2)

      // End drag
      fireEvent.mouseUp(window)

      // Move after drag ended - should not call onChange
      fireEvent.mouseMove(window, { clientX: 60, clientY: 60 })
      expect(onChange).toHaveBeenCalledTimes(2)
    }
  })

  it("should position indicator based on value", () => {
    const { container, rerender } = render(<ColorWheel {...defaultProps} value={{ r: 0, g: 0, b: 0 }} />)

    let indicator = container.querySelector('[style*="left"]')
    expect(indicator).toHaveStyle({ left: "40px", top: "40px" })

    // Update value
    rerender(<ColorWheel {...defaultProps} value={{ r: 0.5, g: 0.5, b: 0 }} />)

    indicator = container.querySelector('[style*="left"]')
    // The position should change based on the new value
    expect(indicator).toBeTruthy()
  })

  it("should draw different gradients for different wheel types", () => {
    const { rerender } = render(<ColorWheel {...defaultProps} type="lift" />)

    expect(mockContext.createRadialGradient).toHaveBeenCalled()

    vi.clearAllMocks()
    rerender(<ColorWheel {...defaultProps} type="gamma" />)
    expect(mockContext.createRadialGradient).toHaveBeenCalled()

    vi.clearAllMocks()
    rerender(<ColorWheel {...defaultProps} type="gain" />)
    expect(mockContext.createRadialGradient).toHaveBeenCalled()
  })

  it("should handle mouse events cleanup on unmount", () => {
    const { container, unmount } = render(<ColorWheel {...defaultProps} />)

    const wheelContainer = container.querySelector('[style*="width"]')
    if (wheelContainer) {
      wheelContainer.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        right: 80,
        bottom: 80,
        width: 80,
        height: 80,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      // Start drag
      fireEvent.mouseDown(wheelContainer, { clientX: 40, clientY: 40 })
    }

    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith("mouseup", expect.any(Function))
  })
})
