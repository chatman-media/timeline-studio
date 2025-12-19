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
    render(<ColorWheel {...defaultProps} data-oid="-gc35te" />)

    expect(screen.getByText("Lift")).toBeInTheDocument()
  })

  it("should display RGB values", () => {
    render(<ColorWheel {...defaultProps} value={{ r: 0.5, g: -0.3, b: 0.2 }} data-oid="r66egw1" />)

    expect(screen.getByText("+0.50")).toBeInTheDocument()
    expect(screen.getByText("-0.30")).toBeInTheDocument()
    expect(screen.getByText("+0.20")).toBeInTheDocument()
  })

  it("should render canvas with correct size", () => {
    const { container } = render(<ColorWheel {...defaultProps} size={100} data-oid="3:ec1.1" />)

    const canvas = container.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute("width", "100")
    expect(canvas).toHaveAttribute("height", "100")
  })

  it("should call onChange when clicking on wheel", () => {
    const onChange = vi.fn()
    const { container } = render(<ColorWheel {...defaultProps} onChange={onChange} data-oid=".xns4jn" />)

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
    const { container } = render(<ColorWheel {...defaultProps} onChange={onChange} disabled data-oid="kop8h:7" />)

    const wheelContainer = container.querySelector('[style*="width"]')
    if (wheelContainer) {
      fireEvent.mouseDown(wheelContainer, { clientX: 40, clientY: 40 })
    }

    expect(onChange).not.toHaveBeenCalled()
  })

  it("should handle drag operations", () => {
    const onChange = vi.fn()
    const { container } = render(<ColorWheel {...defaultProps} onChange={onChange} data-oid="1ct:md0" />)

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
    const { container, rerender } = render(
      <ColorWheel {...defaultProps} value={{ r: 0, g: 0, b: 0 }} data-oid=":.tixh8" />,
    )

    let indicator = container.querySelector('[style*="left"]')
    expect(indicator).toHaveStyle({ left: "40px", top: "40px" })

    // Update value
    rerender(<ColorWheel {...defaultProps} value={{ r: 0.5, g: 0.5, b: 0 }} data-oid="6enln6s" />)

    indicator = container.querySelector('[style*="left"]')
    // The position should change based on the new value
    expect(indicator).toBeTruthy()
  })

  it("should draw different gradients for different wheel types", () => {
    const { rerender } = render(<ColorWheel {...defaultProps} type="lift" data-oid="vgrfh9p" />)

    expect(mockContext.createRadialGradient).toHaveBeenCalled()

    vi.clearAllMocks()
    rerender(<ColorWheel {...defaultProps} type="gamma" data-oid="c1xnck:" />)
    expect(mockContext.createRadialGradient).toHaveBeenCalled()

    vi.clearAllMocks()
    rerender(<ColorWheel {...defaultProps} type="gain" data-oid="9l2b2m6" />)
    expect(mockContext.createRadialGradient).toHaveBeenCalled()
  })

  it("should handle mouse events cleanup on unmount", () => {
    const { container, unmount } = render(<ColorWheel {...defaultProps} data-oid="c2ce5a7" />)

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
