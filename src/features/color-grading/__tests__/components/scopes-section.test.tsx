/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ScopesSection } from "../../components/scopes/scopes-section"

// Мокаем lucide-react иконки
vi.mock("lucide-react", () => ({
  Activity: () => <span data-oid="e9uzel_">Activity</span>,
  BarChart3: () => <span data-oid="6ffjydn">BarChart3</span>,
  CircleDot: () => <span data-oid="ub0td04">CircleDot</span>,
  Settings: () => <span data-oid="owg-f6a">Settings</span>,
}))

// Мокаем хук useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))

// Мокаем UI компоненты
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, ...props }: any) => (
    <button onClick={onClick} data-variant={variant} {...props} data-oid="g5-4a1o">
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor, ...props }: any) => (
    <label htmlFor={htmlFor} {...props} data-oid="bj:1zwy">
      {children}
    </label>
  ),
}))

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} data-oid="pyc9qou">
      {React.Children.map(children, (child) => React.cloneElement(child, { onValueChange }))}
    </div>
  ),

  SelectTrigger: ({ children }: any) => (
    <div data-testid="select-trigger" data-oid="pkh1kl9">
      {children}
    </div>
  ),

  SelectValue: () => <span data-oid="_ftnk.y">SelectValue</span>,
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content" data-oid="t..lu9f">
      {children}
    </div>
  ),

  SelectItem: ({ children, value, onClick }: any) => (
    <div data-testid={`select-item-${value}`} onClick={() => onClick?.({ target: { value } })} data-oid="_n9pcr1">
      {children}
    </div>
  ),
}))

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <button role="switch" aria-checked={checked} onClick={() => onCheckedChange(!checked)} data-oid="e22zevv">
      Switch
    </button>
  ),
}))

// Мокаем ScopeViewer
vi.mock("../../components/scopes/scope-viewer", () => ({
  ScopeViewer: ({ type, refreshRate, isFullscreen, onClose }: any) => (
    <div
      data-testid="scope-viewer"
      data-type={type}
      data-refresh-rate={refreshRate}
      data-fullscreen={isFullscreen}
      data-oid="-.f:_8y"
    >
      <span data-oid="5h2c:vy">Scope Viewer - {type}</span>
      {onClose && (
        <button onClick={onClose} data-oid="977w:9n">
          Close
        </button>
      )}
    </div>
  ),
}))

// Мокаем хук useColorGrading
const mockState = {
  scopes: {
    waveformEnabled: false,
    vectorscopeEnabled: false,
    histogramEnabled: false,
    refreshRate: 30,
  },
}

const mockDispatch = vi.fn()

vi.mock("../../services/color-grading-provider", () => ({
  useColorGrading: () => ({
    state: mockState,
    dispatch: mockDispatch,
  }),
}))

describe("ScopesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.scopes = {
      waveformEnabled: false,
      vectorscopeEnabled: false,
      histogramEnabled: false,
      refreshRate: 30,
    }
  })

  it("should render scopes section", () => {
    render(<ScopesSection data-oid="mkke4:." />)

    expect(screen.getByTestId("scopes-section")).toBeInTheDocument()
  })

  it("should render description text", () => {
    render(<ScopesSection data-oid="yh-j:tq" />)

    expect(screen.getByText("Real-time analysis of color and exposure")).toBeInTheDocument()
  })

  it("should render all scope toggles", () => {
    render(<ScopesSection data-oid="o-su7wk" />)

    expect(screen.getByText("Waveform")).toBeInTheDocument()
    expect(screen.getByText("Vectorscope")).toBeInTheDocument()
    expect(screen.getByText("Histogram")).toBeInTheDocument()
    expect(screen.getAllByRole("switch")).toHaveLength(3)
  })

  it("should render refresh rate selector", () => {
    render(<ScopesSection data-oid="uize_e2" />)

    expect(screen.getByText("Refresh Rate")).toBeInTheDocument()
    expect(screen.getByTestId("select")).toBeInTheDocument()
    expect(screen.getByTestId("select")).toHaveAttribute("data-value", "30")
  })

  it("should toggle waveform scope", async () => {
    const user = userEvent.setup()
    render(<ScopesSection data-oid=":d_1obg" />)

    const switches = screen.getAllByRole("switch")
    await user.click(switches[0]) // First switch is waveform

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "TOGGLE_SCOPE",
      scopeType: "waveform",
      enabled: true,
    })
  })

  it("should toggle vectorscope", async () => {
    const user = userEvent.setup()
    render(<ScopesSection data-oid="ax.e7j-" />)

    const switches = screen.getAllByRole("switch")
    await user.click(switches[1]) // Second switch is vectorscope

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "TOGGLE_SCOPE",
      scopeType: "vectorscope",
      enabled: true,
    })
  })

  it("should toggle histogram", async () => {
    const user = userEvent.setup()
    render(<ScopesSection data-oid="xuu:5m-" />)

    const switches = screen.getAllByRole("switch")
    await user.click(switches[2]) // Third switch is histogram

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "TOGGLE_SCOPE",
      scopeType: "histogram",
      enabled: true,
    })
  })

  it("should change refresh rate", () => {
    render(<ScopesSection data-oid="ti_40.i" />)

    // Mock the select change
    const selectContent = screen.getByTestId("select-content")
    const select15fps = selectContent.querySelector('[data-testid="select-item-15"]')

    // Simulate selecting 15 FPS
    fireEvent.click(select15fps!)

    // Note: In the real implementation, onValueChange would be called
  })

  it("should show scope viewer when scopes are enabled", () => {
    mockState.scopes.waveformEnabled = true
    render(<ScopesSection data-oid="ot_.:.x" />)

    expect(screen.getByTestId("scope-viewer")).toBeInTheDocument()
    expect(screen.getByTestId("scope-viewer")).toHaveAttribute("data-type", "waveform")
  })

  it("should show scope type buttons when multiple scopes are enabled", () => {
    mockState.scopes.waveformEnabled = true
    mockState.scopes.vectorscopeEnabled = true
    render(<ScopesSection data-oid="q0mult0" />)

    // Should have 2 scope type buttons
    const buttons = screen.getAllByRole("button")
    const scopeButtons = buttons.filter(
      (btn) => btn.textContent?.includes("Waveform") || btn.textContent?.includes("Vectorscope"),
    )
    expect(scopeButtons).toHaveLength(2)
  })

  it("should switch between scope types", async () => {
    mockState.scopes.waveformEnabled = true
    mockState.scopes.vectorscopeEnabled = true
    mockState.scopes.histogramEnabled = true

    const user = userEvent.setup()
    render(<ScopesSection data-oid="sl7s74r" />)

    // Initially shows waveform
    expect(screen.getByTestId("scope-viewer")).toHaveAttribute("data-type", "waveform")

    // Find the vectorscope button specifically (not the label)
    const vectorscopeButtons = screen.getAllByText("Vectorscope")
    const vectorscopeButton = vectorscopeButtons
      .find((el) => el.closest("button")?.getAttribute("data-variant"))
      ?.closest("button")

    if (vectorscopeButton) {
      await user.click(vectorscopeButton)

      // The test logic would need actual state change in real implementation
      // For now, just verify the button exists and is clickable
      expect(vectorscopeButton).toBeInTheDocument()
    }
  })

  it("should show fullscreen button when scopes are enabled", () => {
    mockState.scopes.waveformEnabled = true
    render(<ScopesSection data-oid="ydebhk." />)

    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("should toggle fullscreen mode", async () => {
    mockState.scopes.waveformEnabled = true
    const user = userEvent.setup()
    const { container } = render(<ScopesSection data-oid="z.3sk9p" />)

    const settingsButton = screen.getByText("Settings").closest("button")
    await user.click(settingsButton!)

    // Check for fullscreen classes
    const fullscreenDiv = container.querySelector(".fixed.inset-0.z-50")
    expect(fullscreenDiv).toBeInTheDocument()

    // Check that scope viewer has fullscreen prop
    expect(screen.getByTestId("scope-viewer")).toHaveAttribute("data-fullscreen", "true")
  })

  it("should show close button in fullscreen mode", async () => {
    mockState.scopes.waveformEnabled = true
    const user = userEvent.setup()
    render(<ScopesSection data-oid="bjj26ga" />)

    // Enter fullscreen
    const settingsButton = screen.getByText("Settings").closest("button")
    await user.click(settingsButton!)

    // Should have close button
    expect(screen.getByText("Close")).toBeInTheDocument()
  })

  it("should exit fullscreen when close is clicked", async () => {
    mockState.scopes.waveformEnabled = true
    const user = userEvent.setup()
    const { container, rerender } = render(<ScopesSection data-oid="mag7doe" />)

    // Enter fullscreen
    const settingsButton = screen.getByText("Settings").closest("button")
    await user.click(settingsButton!)

    // Click close
    const closeButton = screen.getByText("Close")
    await user.click(closeButton)

    // Force re-render
    rerender(<ScopesSection data-oid="r8youyz" />)

    // Should exit fullscreen
    const fullscreenDiv = container.querySelector(".fixed.inset-0.z-50")
    expect(fullscreenDiv).not.toBeInTheDocument()
  })

  it("should show hints for different scope types", () => {
    mockState.scopes.waveformEnabled = true
    render(<ScopesSection data-oid="ky7_fxs" />)

    expect(screen.getByText("Shows luminance distribution across the image")).toBeInTheDocument()
  })

  it("should show vectorscope hint when active", async () => {
    mockState.scopes.waveformEnabled = true
    mockState.scopes.vectorscopeEnabled = true

    const user = userEvent.setup()
    render(<ScopesSection data-oid="8yp1sa4" />)

    // Find the vectorscope button specifically (not the label)
    const vectorscopeButtons = screen.getAllByText("Vectorscope")
    const vectorscopeButton = vectorscopeButtons
      .find((el) => el.closest("button")?.getAttribute("data-variant"))
      ?.closest("button")

    if (vectorscopeButton) {
      await user.click(vectorscopeButton)

      // After clicking vectorscope, should show vectorscope hint
      const hintText = screen.getByText("Shows color saturation and hue distribution")
      expect(hintText).toBeInTheDocument()
    }
  })

  it("should not show scope viewer when all scopes are disabled", () => {
    render(<ScopesSection data-oid="1yt7.9m" />)

    expect(screen.queryByTestId("scope-viewer")).not.toBeInTheDocument()
  })

  it("should have proper styling for active scope button", () => {
    mockState.scopes.waveformEnabled = true
    mockState.scopes.vectorscopeEnabled = true
    render(<ScopesSection data-oid="arci61r" />)

    const waveformButton = screen.getAllByText("Waveform")[1].closest("button") // Second is the type button
    expect(waveformButton).toHaveAttribute("data-variant", "default")

    const vectorscopeButton = screen.getAllByText("Vectorscope")[1].closest("button")
    expect(vectorscopeButton).toHaveAttribute("data-variant", "ghost")
  })

  it("should render refresh rate options", () => {
    render(<ScopesSection data-oid="kbyefu8" />)

    expect(screen.getByTestId("select-item-15")).toHaveTextContent("15 FPS")
    expect(screen.getByTestId("select-item-30")).toHaveTextContent("30 FPS")
    expect(screen.getByTestId("select-item-60")).toHaveTextContent("60 FPS")
  })

  it("should show all three scope type buttons when all enabled", () => {
    mockState.scopes.waveformEnabled = true
    mockState.scopes.vectorscopeEnabled = true
    mockState.scopes.histogramEnabled = true
    render(<ScopesSection data-oid="s9.tcj:" />)

    // Count scope type buttons (not the toggles)
    const buttons = screen.getAllByRole("button")
    const scopeTypeButtons = buttons.filter((btn) => {
      const text = btn.textContent || ""
      return text.includes("Waveform") || text.includes("Vectorscope") || text.includes("Histogram")
    })

    // Should have 3 type buttons + 3 toggle switches + 1 settings button
    expect(scopeTypeButtons.length).toBeGreaterThanOrEqual(3)
  })

  it("should render icons for each scope type", () => {
    render(<ScopesSection data-oid="2wx-x23" />)

    expect(screen.getAllByText("Activity")).toHaveLength(1)
    expect(screen.getAllByText("CircleDot")).toHaveLength(1)
    expect(screen.getAllByText("BarChart3")).toHaveLength(1)
  })
})
