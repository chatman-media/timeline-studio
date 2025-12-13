/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CurveEditor, type CurvePoint } from "../../components/curves/curve-editor"

describe("CurveEditor", () => {
  const defaultPoints: CurvePoint[] = [
    { x: 0, y: 256, id: "start" },
    { x: 256, y: 0, id: "end" },
  ]

  const mockOnPointsChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render curve editor", () => {
    const { container } = render(<CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} />)

    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("should render grid pattern", () => {
    const { container } = render(<CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} />)

    const pattern = container.querySelector("pattern")
    expect(pattern).toBeInTheDocument()
    expect(pattern).toHaveAttribute("width", "32")
    expect(pattern).toHaveAttribute("height", "32")
  })

  it("should render diagonal reference line", () => {
    const { container } = render(<CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} />)

    const line = container.querySelector("line")
    expect(line).toBeInTheDocument()
    expect(line).toHaveAttribute("x1", "0")
    expect(line).toHaveAttribute("y1", "256")
    expect(line).toHaveAttribute("x2", "256")
    expect(line).toHaveAttribute("y2", "0")
  })

  it("should render curve path when 2 or more points", () => {
    const { container } = render(<CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} />)

    const path = container.querySelector("path[stroke='white']")
    expect(path).toBeInTheDocument()
    expect(path).toHaveAttribute("d")
  })

  it("should not render curve with less than 2 points", () => {
    const { container } = render(
      <CurveEditor points={[{ x: 128, y: 128, id: "single" }]} onPointsChange={mockOnPointsChange} />,
    )

    const path = container.querySelector("path[stroke='white']")
    expect(path).not.toBeInTheDocument()
  })

  it("should render all points", () => {
    const { container } = render(<CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} />)

    // Each point has 2 circles (hit area and visual)
    const circles = container.querySelectorAll("circle")
    expect(circles).toHaveLength(defaultPoints.length * 2)
  })

  it("should apply custom color", () => {
    const { container } = render(<CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} color="red" />)

    const path = container.querySelector("path[stroke='red']")
    expect(path).toBeInTheDocument()
  })

  it("should add new point on svg click", () => {
    const { container } = render(<CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} />)

    const svg = container.querySelector("svg")!

    // Mock getBoundingClientRect
    svg.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 256,
      height: 256,
      right: 256,
      bottom: 256,
      x: 0,
      y: 0,
      toJSON: () => {},
    }))

    fireEvent.click(svg, { clientX: 128, clientY: 128 })

    expect(mockOnPointsChange).toHaveBeenCalledWith([...defaultPoints, expect.objectContaining({ x: 128, y: 128 })])
  })

  it("should not add point when clicking on existing point", () => {
    const { container } = render(<CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} />)

    const circle = container.querySelector("circle[r='12']")!
    fireEvent.click(circle)

    expect(mockOnPointsChange).not.toHaveBeenCalled()
  })

  it("should drag point", () => {
    const { container } = render(<CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} />)

    const svg = container.querySelector("svg")!
    const hitArea = container.querySelector("circle[r='12']")!

    // Mock getBoundingClientRect
    svg.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 256,
      height: 256,
      right: 256,
      bottom: 256,
      x: 0,
      y: 0,
      toJSON: () => {},
    }))

    // Start drag
    fireEvent.mouseDown(hitArea)

    // Move mouse
    fireEvent.mouseMove(svg, { clientX: 50, clientY: 50 })

    expect(mockOnPointsChange).toHaveBeenCalledWith([{ x: 50, y: 50, id: "start" }, defaultPoints[1]])

    // End drag
    fireEvent.mouseUp(svg)

    // Move after drag ended - should not call onChange
    vi.clearAllMocks()
    fireEvent.mouseMove(svg, { clientX: 100, clientY: 100 })
    expect(mockOnPointsChange).not.toHaveBeenCalled()
  })

  it("should delete point on double click", () => {
    const threePoints: CurvePoint[] = [
      { x: 0, y: 256, id: "start" },
      { x: 128, y: 128, id: "middle" },
      { x: 256, y: 0, id: "end" },
    ]

    const { container } = render(<CurveEditor points={threePoints} onPointsChange={mockOnPointsChange} />)

    const middlePointHitArea = container.querySelectorAll("circle[r='12']")[1]
    fireEvent.doubleClick(middlePointHitArea)

    expect(mockOnPointsChange).toHaveBeenCalledWith([threePoints[0], threePoints[2]])
  })

  it("should not delete point if only 2 points remain", () => {
    const { container } = render(<CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} />)

    const hitArea = container.querySelector("circle[r='12']")!
    fireEvent.doubleClick(hitArea)

    expect(mockOnPointsChange).not.toHaveBeenCalled()
  })

  it("should show hover state on point", () => {
    const { container } = render(<CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} />)

    const hitArea = container.querySelector("circle[r='12']")!
    const visualPoint = container.querySelector("circle[fill='white']")!

    expect(visualPoint).toHaveAttribute("r", "4")

    fireEvent.mouseEnter(hitArea)
    expect(visualPoint).toHaveAttribute("r", "6")

    fireEvent.mouseLeave(hitArea)
    expect(visualPoint).toHaveAttribute("r", "4")
  })

  it("should show drag state hint", () => {
    const { container } = render(<CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} />)

    expect(screen.getByText("Click to add • Double-click to remove")).toBeInTheDocument()

    const hitArea = container.querySelector("circle[r='12']")!
    fireEvent.mouseDown(hitArea)

    expect(screen.getByText("Drag to move")).toBeInTheDocument()
  })

  it("should handle mouse leave during drag", () => {
    const { container } = render(<CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} />)

    const svg = container.querySelector("svg")!
    const hitArea = container.querySelector("circle[r='12']")!

    svg.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 256,
      height: 256,
      right: 256,
      bottom: 256,
      x: 0,
      y: 0,
      toJSON: () => {},
    }))

    // Start drag
    fireEvent.mouseDown(hitArea)
    fireEvent.mouseMove(svg, { clientX: 50, clientY: 50 })
    expect(mockOnPointsChange).toHaveBeenCalled()

    // Leave svg
    vi.clearAllMocks()
    fireEvent.mouseLeave(svg)

    // Move after leave - should not call onChange
    fireEvent.mouseMove(svg, { clientX: 100, clientY: 100 })
    expect(mockOnPointsChange).not.toHaveBeenCalled()
  })

  it("should sort points by x coordinate for curve generation", () => {
    const unsortedPoints: CurvePoint[] = [
      { x: 256, y: 0, id: "end" },
      { x: 0, y: 256, id: "start" },
      { x: 128, y: 128, id: "middle" },
    ]

    const { container } = render(<CurveEditor points={unsortedPoints} onPointsChange={mockOnPointsChange} />)

    const path = container.querySelector("path[stroke='white']")!
    const d = path.getAttribute("d")!

    // Path should start with the leftmost point (x=0)
    expect(d).toMatch(/^M 0 256/)
  })

  it("should clamp coordinates within bounds", () => {
    const { container } = render(<CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} />)

    const svg = container.querySelector("svg")!
    const hitArea = container.querySelector("circle[r='12']")!

    svg.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 256,
      height: 256,
      right: 256,
      bottom: 256,
      x: 0,
      y: 0,
      toJSON: () => {},
    }))

    // Start drag
    fireEvent.mouseDown(hitArea)

    // Try to move outside bounds
    fireEvent.mouseMove(svg, { clientX: -50, clientY: 300 })

    expect(mockOnPointsChange).toHaveBeenCalledWith([
      { x: 0, y: 256, id: "start" }, // Clamped to bounds
      defaultPoints[1],
    ])
  })

  it("should apply custom className", () => {
    const { container } = render(
      <CurveEditor points={defaultPoints} onPointsChange={mockOnPointsChange} className="custom-class" />,
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass("custom-class")
  })

  it("should handle empty points array", () => {
    const { container } = render(<CurveEditor points={[]} onPointsChange={mockOnPointsChange} />)

    expect(container.querySelector("svg")).toBeInTheDocument()
    // Should not have curve path (with strokeWidth="2")
    expect(container.querySelector("path[stroke-width='2']")).not.toBeInTheDocument()
  })
})
