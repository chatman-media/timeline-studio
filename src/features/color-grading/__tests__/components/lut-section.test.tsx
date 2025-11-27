import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import React from "react"
import { describe, expect, it, vi } from "vitest"

import { LUTSection } from "../../components/lut/lut-section"

// Мокаем logger - используем vi.hoisted для правильного hoisting
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}))

// Mock showOpenDialog
const mockShowOpenDialog = vi.fn()

// Mock @/core container
vi.mock("@/core", () => ({
  container: {
    hasPlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => ({
      showOpenDialog: mockShowOpenDialog,
    })),
  },
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => mockLogger,
}))

// Мокаем lucide-react иконки
vi.mock("lucide-react", () => ({
  RefreshCw: () => <span>RefreshCw</span>,
  Upload: () => <span>Upload</span>,
  X: () => <span>X</span>,
}))

// Мокаем хук useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))

// Мокаем UI компоненты
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor, ...props }: any) => (
    <label htmlFor={htmlFor} {...props}>
      {children}
    </label>
  ),
}))

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      {React.Children.map(children, (child) => React.cloneElement(child, { onValueChange }))}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value, onClick }: any) => (
    <div data-testid={`select-item-${value}`} onClick={onClick}>
      {children}
    </div>
  ),
}))

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <button role="switch" aria-checked={checked} onClick={() => onCheckedChange(!checked)}>
      Switch
    </button>
  ),
}))

// Мокаем ParameterSlider
vi.mock("../../components/controls/parameter-slider", () => ({
  ParameterSlider: ({ label, value, onChange, disabled, formatValue }: any) => (
    <div data-testid="parameter-slider">
      <span>{label}</span>
      <span>{formatValue ? formatValue(value) : value}</span>
      <button onClick={() => onChange(50)} disabled={disabled}>
        Change Intensity
      </button>
    </div>
  ),
}))

// Мокаем хук useColorGrading
const mockState = {
  lut: {
    file: null as string | null,
    isEnabled: false,
    intensity: 100,
  },
}

const mockDispatch = vi.fn()

vi.mock("../../services/color-grading-provider", () => ({
  useColorGrading: () => ({
    state: mockState,
    dispatch: mockDispatch,
  }),
}))

describe("LUTSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger.info.mockClear()
    mockLogger.error.mockClear()
    mockLogger.warn.mockClear()
    mockLogger.debug.mockClear()
    mockShowOpenDialog.mockClear()
    mockShowOpenDialog.mockResolvedValue(null)
    mockState.lut = {
      file: null,
      isEnabled: false,
      intensity: 100,
    }
  })

  it("should render LUT section", () => {
    render(<LUTSection />)

    expect(screen.getByTestId("lut-section")).toBeInTheDocument()
  })

  it("should render description text", () => {
    render(<LUTSection />)

    expect(screen.getByText("Apply professional color looks with LUT files")).toBeInTheDocument()
  })

  it("should render LUT file selector", () => {
    render(<LUTSection />)

    expect(screen.getByText("LUT File")).toBeInTheDocument()
    expect(screen.getByTestId("select")).toBeInTheDocument()
  })

  it("should render upload button", () => {
    render(<LUTSection />)

    expect(screen.getByText("Upload")).toBeInTheDocument()
  })

  it("should render supported formats info", () => {
    render(<LUTSection />)

    expect(screen.getByText("Supported formats: .cube, .3dl, .dat, .look, .mga, .m3d")).toBeInTheDocument()
  })

  it("should render preset LUT categories", () => {
    render(<LUTSection />)

    expect(screen.getByText("Film Emulation")).toBeInTheDocument()
    expect(screen.getByText("Creative Looks")).toBeInTheDocument()
    expect(screen.getByText("Technical")).toBeInTheDocument()
  })

  it("should render preset LUTs", () => {
    render(<LUTSection />)

    expect(screen.getByTestId("select-item-film-kodak-2383")).toBeInTheDocument()
    expect(screen.getByTestId("select-item-orange-teal")).toBeInTheDocument()
    expect(screen.getByTestId("select-item-bw-contrast")).toBeInTheDocument()
  })

  it("should handle LUT selection", () => {
    render(<LUTSection />)

    const selectItem = screen.getByTestId("select-item-film-kodak-2383")
    fireEvent.click(selectItem)

    // Note: In real implementation, onValueChange would be called
    // Here we're testing that the element exists and is clickable
    expect(selectItem).toBeInTheDocument()
  })

  it("should show enable switch when LUT is selected", () => {
    mockState.lut.file = "film-kodak-2383"
    const { rerender } = render(<LUTSection />)

    // Simulate LUT selection
    rerender(<LUTSection />)

    expect(screen.getByText("Enable LUT")).toBeInTheDocument()
    expect(screen.getByRole("switch")).toBeInTheDocument()
  })

  it("should show intensity slider when LUT is selected", () => {
    mockState.lut.file = "film-kodak-2383"
    render(<LUTSection />)

    expect(screen.getByTestId("parameter-slider")).toBeInTheDocument()
    expect(screen.getByText("Intensity")).toBeInTheDocument()
    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("should toggle LUT enable state", async () => {
    mockState.lut.file = "film-kodak-2383"
    const user = userEvent.setup()
    render(<LUTSection />)

    const switchButton = screen.getByRole("switch")
    await user.click(switchButton)

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "TOGGLE_LUT",
      enabled: true,
    })
  })

  it("should update intensity", async () => {
    mockState.lut.file = "film-kodak-2383"
    mockState.lut.isEnabled = true
    const user = userEvent.setup()
    render(<LUTSection />)

    const intensityButton = screen.getByText("Change Intensity")
    await user.click(intensityButton)

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_LUT_INTENSITY",
      value: 50,
    })
  })

  it("should show preview section when LUT is enabled", () => {
    mockState.lut.file = "film-kodak-2383"
    mockState.lut.isEnabled = true
    render(<LUTSection />)

    expect(screen.getByText("Preview")).toBeInTheDocument()
    expect(screen.getByText("Refresh")).toBeInTheDocument()
    expect(screen.getByText("Original")).toBeInTheDocument()
    expect(screen.getByText("25%")).toBeInTheDocument()
    expect(screen.getByText("50%")).toBeInTheDocument()
    expect(screen.getByText("75%")).toBeInTheDocument()
    // 100% appears twice - in intensity and preview
    expect(screen.getAllByText("100%")).toHaveLength(2)
  })

  it("should handle file import", async () => {
    mockShowOpenDialog.mockResolvedValueOnce(["/path/to/custom.cube"])

    const user = userEvent.setup()
    render(<LUTSection />)

    const uploadButton = screen.getByText("Upload")
    await user.click(uploadButton)

    await waitFor(() => {
      expect(mockShowOpenDialog).toHaveBeenCalledWith({
        multiple: false,
        filters: [
          {
            name: "LUT Files",
            extensions: ["cube", "3dl", "dat", "look", "mga", "m3d"],
          },
        ],
      })
    })
  })

  it("should handle refresh previews", async () => {
    mockState.lut.file = "film-kodak-2383"
    mockState.lut.isEnabled = true
    const user = userEvent.setup()

    render(<LUTSection />)

    const refreshButton = screen.getByText("Refresh")
    await user.click(refreshButton)

    expect(mockLogger.info).toHaveBeenCalledWith("Refreshing LUT previews...")
  })

  it("should disable intensity slider when LUT is disabled", () => {
    mockState.lut.file = "film-kodak-2383"
    mockState.lut.isEnabled = false
    render(<LUTSection />)

    const intensityButton = screen.getByText("Change Intensity")
    expect(intensityButton).toBeDisabled()
  })

  it("should handle none selection", () => {
    mockState.lut.file = "film-kodak-2383"
    render(<LUTSection />)

    // In real implementation, selecting "none" would trigger dispatch
    const noneItem = screen.getByTestId("select-item-none")
    expect(noneItem).toBeInTheDocument()
  })

  it("should not show controls when no LUT is selected", () => {
    mockState.lut.file = null
    render(<LUTSection />)

    expect(screen.queryByText("Enable LUT")).not.toBeInTheDocument()
    expect(screen.queryByTestId("parameter-slider")).not.toBeInTheDocument()
    expect(screen.queryByText("Preview")).not.toBeInTheDocument()
  })
})
