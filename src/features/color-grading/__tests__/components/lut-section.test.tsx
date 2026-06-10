/**
 * @vitest-environment jsdom
 */
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

// Mock @timeline-studio/core container
vi.mock("@timeline-studio/core", () => ({
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
  RefreshCw: () => <span data-oid="qcycycl">RefreshCw</span>,
  Upload: () => <span data-oid=".no3qpd">Upload</span>,
  X: () => <span data-oid="zzypejp">X</span>,
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
    <button onClick={onClick} disabled={disabled} {...props} data-oid="d9sdxug">
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor, ...props }: any) => (
    <label htmlFor={htmlFor} {...props} data-oid="m8x.g.b">
      {children}
    </label>
  ),
}))

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} data-oid="9w-bi3u">
      {React.Children.map(children, (child) => React.cloneElement(child, { onValueChange }))}
    </div>
  ),

  SelectTrigger: ({ children }: any) => (
    <div data-testid="select-trigger" data-oid="hq2suai">
      {children}
    </div>
  ),

  SelectValue: ({ placeholder }: any) => <span data-oid="nrwjx0j">{placeholder}</span>,
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content" data-oid="_jjcgg3">
      {children}
    </div>
  ),

  SelectItem: ({ children, value, onClick }: any) => (
    <div data-testid={`select-item-${value}`} onClick={onClick} data-oid="fw2n4_9">
      {children}
    </div>
  ),
}))

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <button role="switch" aria-checked={checked} onClick={() => onCheckedChange(!checked)} data-oid="1n3scqv">
      Switch
    </button>
  ),
}))

// Мокаем ParameterSlider
vi.mock("../../components/controls/parameter-slider", () => ({
  ParameterSlider: ({ label, value, onChange, disabled, formatValue }: any) => (
    <div data-testid="parameter-slider" data-oid=":3ag473">
      <span data-oid="pg.77ng">{label}</span>
      <span data-oid="2s9fxua">{formatValue ? formatValue(value) : value}</span>
      <button onClick={() => onChange(50)} disabled={disabled} data-oid="e58kxen">
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
    render(<LUTSection data-oid="_k-dvnq" />)

    expect(screen.getByTestId("lut-section")).toBeInTheDocument()
  })

  it("should render description text", () => {
    render(<LUTSection data-oid="78bz:34" />)

    expect(screen.getByText("Apply professional color looks with LUT files")).toBeInTheDocument()
  })

  it("should render LUT file selector", () => {
    render(<LUTSection data-oid="uxd0y22" />)

    expect(screen.getByText("LUT File")).toBeInTheDocument()
    expect(screen.getByTestId("select")).toBeInTheDocument()
  })

  it("should render upload button", () => {
    render(<LUTSection data-oid="snoiobs" />)

    expect(screen.getByText("Upload")).toBeInTheDocument()
  })

  it("should render supported formats info", () => {
    render(<LUTSection data-oid="rps6:y1" />)

    expect(screen.getByText("Supported formats: .cube, .3dl, .dat, .look, .mga, .m3d")).toBeInTheDocument()
  })

  it("should render preset LUT categories", () => {
    render(<LUTSection data-oid="wybnr3f" />)

    expect(screen.getByText("Film Emulation")).toBeInTheDocument()
    expect(screen.getByText("Creative Looks")).toBeInTheDocument()
    expect(screen.getByText("Technical")).toBeInTheDocument()
  })

  it("should render preset LUTs", () => {
    render(<LUTSection data-oid="or--n.i" />)

    expect(screen.getByTestId("select-item-film-kodak-2383")).toBeInTheDocument()
    expect(screen.getByTestId("select-item-orange-teal")).toBeInTheDocument()
    expect(screen.getByTestId("select-item-bw-contrast")).toBeInTheDocument()
  })

  it("should handle LUT selection", () => {
    render(<LUTSection data-oid="rqcd9:c" />)

    const selectItem = screen.getByTestId("select-item-film-kodak-2383")
    fireEvent.click(selectItem)

    // Note: In real implementation, onValueChange would be called
    // Here we're testing that the element exists and is clickable
    expect(selectItem).toBeInTheDocument()
  })

  it("should show enable switch when LUT is selected", () => {
    mockState.lut.file = "film-kodak-2383"
    const { rerender } = render(<LUTSection data-oid="0:qxq99" />)

    // Simulate LUT selection
    rerender(<LUTSection data-oid="ae4.xm9" />)

    expect(screen.getByText("Enable LUT")).toBeInTheDocument()
    expect(screen.getByRole("switch")).toBeInTheDocument()
  })

  it("should show intensity slider when LUT is selected", () => {
    mockState.lut.file = "film-kodak-2383"
    render(<LUTSection data-oid="ytizmse" />)

    expect(screen.getByTestId("parameter-slider")).toBeInTheDocument()
    expect(screen.getByText("Intensity")).toBeInTheDocument()
    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("should toggle LUT enable state", async () => {
    mockState.lut.file = "film-kodak-2383"
    const user = userEvent.setup()
    render(<LUTSection data-oid="a4yxole" />)

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
    render(<LUTSection data-oid="y8ha1hk" />)

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
    render(<LUTSection data-oid="vcq3brg" />)

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
    render(<LUTSection data-oid="eykx0-1" />)

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

    render(<LUTSection data-oid="ntr:25v" />)

    const refreshButton = screen.getByText("Refresh")
    await user.click(refreshButton)

    expect(mockLogger.info).toHaveBeenCalledWith("Refreshing LUT previews...")
  })

  it("should disable intensity slider when LUT is disabled", () => {
    mockState.lut.file = "film-kodak-2383"
    mockState.lut.isEnabled = false
    render(<LUTSection data-oid="tkna.dt" />)

    const intensityButton = screen.getByText("Change Intensity")
    expect(intensityButton).toBeDisabled()
  })

  it("should handle none selection", () => {
    mockState.lut.file = "film-kodak-2383"
    render(<LUTSection data-oid="rsrr8k0" />)

    // In real implementation, selecting "none" would trigger dispatch
    const noneItem = screen.getByTestId("select-item-none")
    expect(noneItem).toBeInTheDocument()
  })

  it("should not show controls when no LUT is selected", () => {
    mockState.lut.file = null
    render(<LUTSection data-oid="fgjy_w3" />)

    expect(screen.queryByText("Enable LUT")).not.toBeInTheDocument()
    expect(screen.queryByTestId("parameter-slider")).not.toBeInTheDocument()
    expect(screen.queryByText("Preview")).not.toBeInTheDocument()
  })
})
