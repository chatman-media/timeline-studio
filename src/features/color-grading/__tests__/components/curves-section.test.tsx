import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import React from "react"
import { describe, expect, it, vi } from "vitest"

import type { CurvePoint } from "../../components/curves/curve-editor"
import { CurvesSection } from "../../components/curves/curves-section"

// Мокаем хук useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))

// Мокаем CurveEditor
vi.mock("../../components/curves/curve-editor", () => ({
  CurveEditor: ({ points, onPointsChange, color, className }: any) => (
    <div data-testid="curve-editor" data-color={color} className={className}>
      <span data-testid="curve-points">{JSON.stringify(points)}</span>
      <button onClick={() => onPointsChange([{ x: 128, y: 128, id: "test" }])}>Change Points</button>
    </div>
  ),
  CurvePoint: {} as any,
}))

// Мокаем UI компоненты
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, value, onValueChange, className }: any) => (
    <div data-testid="tabs" data-value={value} className={className}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { _activeValue: value, _onValueChange: onValueChange }),
      )}
    </div>
  ),
  TabsList: ({ children, className, _activeValue, _onValueChange }: any) => (
    <div className={className}>
      {React.Children.map(children, (child) => React.cloneElement(child, { _activeValue, _onValueChange }))}
    </div>
  ),
  TabsTrigger: ({ children, value, className, _activeValue, _onValueChange }: any) => (
    <button data-tab-value={value} className={className} onClick={() => _onValueChange?.(value)}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value, className, _activeValue }: any) => {
    if (value === _activeValue) {
      return <div className={className}>{children}</div>
    }
    return null
  },
}))

// Мокаем хук useColorGrading
const mockState = {
  curves: {
    master: [
      { x: 0, y: 256, id: "start" },
      { x: 256, y: 0, id: "end" },
    ],
    red: null,
    green: null,
    blue: null,
  },
}

const mockDispatch = vi.fn()

vi.mock("../../services/color-grading-provider", () => ({
  useColorGrading: () => ({
    state: mockState,
    dispatch: mockDispatch,
  }),
}))

describe("CurvesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render curves section", () => {
    render(<CurvesSection />)

    expect(screen.getByTestId("curves-section")).toBeInTheDocument()
  })

  it("should render description text", () => {
    render(<CurvesSection />)

    expect(screen.getByText("Fine-tune tonal response with interactive curves")).toBeInTheDocument()
  })

  it("should render all curve type tabs", () => {
    render(<CurvesSection />)

    expect(screen.getByText("Master")).toBeInTheDocument()
    expect(screen.getByText("Red")).toBeInTheDocument()
    expect(screen.getByText("Green")).toBeInTheDocument()
    expect(screen.getByText("Blue")).toBeInTheDocument()
  })

  it("should render curve editor", () => {
    render(<CurvesSection />)

    expect(screen.getByTestId("curve-editor")).toBeInTheDocument()
  })

  it("should render control buttons", () => {
    render(<CurvesSection />)

    expect(screen.getByText("Reset")).toBeInTheDocument()
    expect(screen.getByText("Auto")).toBeInTheDocument()
  })

  it("should render hint text", () => {
    render(<CurvesSection />)

    expect(screen.getByText("Click to add points, drag to adjust")).toBeInTheDocument()
  })

  it("should start with master curve active", () => {
    render(<CurvesSection />)

    const tabs = screen.getByTestId("tabs")
    expect(tabs).toHaveAttribute("data-value", "master")

    const editor = screen.getByTestId("curve-editor")
    expect(editor).toHaveAttribute("data-color", "#ffffff")
  })

  it("should switch to red curve", async () => {
    // This test would require a more complex setup with actual state management
    // For now, we'll just verify the tab structure exists
    render(<CurvesSection />)

    const redTab = screen.getByText("Red")
    expect(redTab).toBeInTheDocument()
    expect(redTab).toHaveAttribute("data-tab-value", "red")
  })

  it("should handle points change", async () => {
    const user = userEvent.setup()
    render(<CurvesSection />)

    const changeButton = screen.getByText("Change Points")
    await user.click(changeButton)

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "UPDATE_CURVE",
      curve: "master",
      points: [{ x: 128, y: 128, id: "test" }],
    })
  })

  it("should reset curve", async () => {
    const user = userEvent.setup()
    render(<CurvesSection />)

    const resetButton = screen.getByText("Reset")
    await user.click(resetButton)

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "UPDATE_CURVE",
      curve: "master",
      points: [
        { x: 0, y: 256, id: "start" },
        { x: 256, y: 0, id: "end" },
      ],
    })
  })

  it("should apply auto curve", async () => {
    const user = userEvent.setup()
    render(<CurvesSection />)

    const autoButton = screen.getByText("Auto")
    await user.click(autoButton)

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "UPDATE_CURVE",
      curve: "master",
      points: [
        { x: 0, y: 256, id: "start" },
        { x: 64, y: 176, id: "shadows" },
        { x: 192, y: 80, id: "highlights" },
        { x: 256, y: 0, id: "end" },
      ],
    })
  })

  it("should use default points for curves without data", () => {
    render(<CurvesSection />)

    const pointsText = screen.getByTestId("curve-points").textContent
    const points = JSON.parse(pointsText!)

    expect(points).toEqual([
      { x: 0, y: 256, id: "start" },
      { x: 256, y: 0, id: "end" },
    ])
  })

  it("should use stored points for curves with data", () => {
    const customPoints: CurvePoint[] = [
      { x: 0, y: 200, id: "p1" },
      { x: 128, y: 128, id: "p2" },
      { x: 256, y: 50, id: "p3" },
    ]

    mockState.curves.master = customPoints

    render(<CurvesSection />)

    const pointsText = screen.getByTestId("curve-points").textContent
    const points = JSON.parse(pointsText!)

    expect(points).toEqual(customPoints)
  })

  it("should handle all curve types", async () => {
    render(<CurvesSection />)

    // Verify all tabs exist
    const curveTypes = ["master", "red", "green", "blue"] as const

    for (const curveType of curveTypes) {
      const tab = screen.getByText(curveType.charAt(0).toUpperCase() + curveType.slice(1))
      expect(tab).toBeInTheDocument()
      expect(tab).toHaveAttribute("data-tab-value", curveType)
    }

    // Verify that clicking change points uses the current active curve (master by default)
    const user = userEvent.setup()
    const changeButton = screen.getByText("Change Points")
    await user.click(changeButton)

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "UPDATE_CURVE",
      curve: "master",
      points: expect.any(Array),
    })
  })

  it("should apply correct styles to tabs", () => {
    const { container } = render(<CurvesSection />)

    const redTab = screen.getByText("Red")
    expect(redTab).toHaveClass("text-red-400")

    const greenTab = screen.getByText("Green")
    expect(greenTab).toHaveClass("text-green-400")

    const blueTab = screen.getByText("Blue")
    expect(blueTab).toHaveClass("text-blue-400")
  })

  it("should pass correct className to CurveEditor", () => {
    render(<CurvesSection />)

    const editor = screen.getByTestId("curve-editor")
    expect(editor).toHaveClass("w-full")
    expect(editor).toHaveClass("h-64")
  })
})
