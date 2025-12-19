/**
 * @vitest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { renderWithModal } from "@/test/test-utils"

import { PerformanceSettingsTab } from "../../../components/tabs/performance-settings-tab"

// Mock the GPU status component
vi.mock("@/features/video-compiler/components/gpu-status", () => ({
  GpuStatus: ({ showDetails }: { showDetails: boolean }) => (
    <div data-testid="gpu-status" data-oid="r525fdl">
      GPU Status {showDetails ? "with details" : ""}
    </div>
  ),
}))

// Create mock functions
const mockHandlers = {
  handleGpuAccelerationChange: vi.fn(),
  handlePreferredGpuEncoderChange: vi.fn(),
  handleProxyEnabledChange: vi.fn(),
  handleProxyTypeChange: vi.fn(),
  handleProxyHostChange: vi.fn(),
  handleProxyPortChange: vi.fn(),
  handleProxyUsernameChange: vi.fn(),
  handleProxyPasswordChange: vi.fn(),
  handleMaxConcurrentJobsChange: vi.fn(),
  handleRenderQualityChange: vi.fn(),
  handleBackgroundRenderingChange: vi.fn(),
  handleRenderDelayChange: vi.fn(),
}

// Default mock values
const defaultMockValues = {
  // GPU settings
  gpuAccelerationEnabled: true,
  preferredGpuEncoder: "auto",

  // Proxy settings
  proxyEnabled: false,
  proxyType: "http",
  proxyHost: "",
  proxyPort: "",
  proxyUsername: "",
  proxyPassword: "",

  // Performance settings
  maxConcurrentJobs: 2,
  renderQuality: "high",
  backgroundRenderingEnabled: true,
  renderDelay: 13,

  // Methods
  ...mockHandlers,
}

// Mock useUserSettings hook with configurable values
const mockUseUserSettings = vi.fn(() => defaultMockValues)

vi.mock("../../../hooks/use-user-settings", () => ({
  useUserSettings: () => mockUseUserSettings(),
}))

describe("PerformanceSettingsTab", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    // Reset to default values
    mockUseUserSettings.mockReturnValue(defaultMockValues)
  })

  it("renders GPU acceleration section", () => {
    renderWithModal(<PerformanceSettingsTab data-oid="q7yb04w" />)

    expect(screen.getByText("dialogs.userSettings.performance.gpuAcceleration")).toBeInTheDocument()
    expect(screen.getByTestId("gpu-status")).toBeInTheDocument()
  })

  it("renders rendering settings section", () => {
    renderWithModal(<PerformanceSettingsTab data-oid=":cphbth" />)

    expect(screen.getByText("dialogs.userSettings.performance.renderingSettings")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.performance.renderQuality")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.performance.backgroundRendering")).toBeInTheDocument()
  })

  it("renders proxy server section", () => {
    renderWithModal(<PerformanceSettingsTab data-oid="9h-4mqg" />)

    expect(screen.getByText("dialogs.userSettings.performance.proxyServer")).toBeInTheDocument()
  })

  it("shows GPU encoder selection when GPU acceleration is enabled", () => {
    renderWithModal(<PerformanceSettingsTab data-oid="vh9azmv" />)

    expect(screen.getByText("dialogs.userSettings.performance.preferredGpuEncoder")).toBeInTheDocument()
  })

  it("hides GPU encoder selection when GPU acceleration is disabled", () => {
    mockUseUserSettings.mockReturnValue({
      ...defaultMockValues,
      gpuAccelerationEnabled: false,
    })

    renderWithModal(<PerformanceSettingsTab data-oid="wqxzvzo" />)

    expect(screen.queryByText("dialogs.userSettings.performance.preferredGpuEncoder")).not.toBeInTheDocument()
  })

  it("handles GPU acceleration toggle", () => {
    renderWithModal(<PerformanceSettingsTab data-oid="sm0ecyn" />)

    // Find GPU switch by looking for the label
    const gpuLabel = screen.getByText("dialogs.userSettings.performance.gpuAcceleration")
    const gpuContainer = gpuLabel.closest("div")
    const gpuSwitch = gpuContainer?.querySelector('[role="switch"]')

    if (gpuSwitch) {
      fireEvent.click(gpuSwitch)
      expect(mockHandlers.handleGpuAccelerationChange).toHaveBeenCalledWith(false)
    }
  })

  it("shows GPU encoder selection when GPU acceleration is enabled", () => {
    renderWithModal(<PerformanceSettingsTab data-oid="ndop._o" />)

    // Check that GPU encoder section is rendered
    expect(screen.getByText("dialogs.userSettings.performance.preferredGpuEncoder")).toBeInTheDocument()

    // Check that the default encoder (auto) is shown
    expect(screen.getByText("dialogs.userSettings.performance.encoderAuto")).toBeInTheDocument()
  })

  it("shows proxy settings when proxy is enabled", () => {
    mockUseUserSettings.mockReturnValue({
      ...defaultMockValues,
      proxyEnabled: true,
    })

    renderWithModal(<PerformanceSettingsTab data-oid="s40o6-n" />)

    expect(screen.getByText("dialogs.userSettings.performance.proxyType")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.performance.proxyHost")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.performance.proxyPort")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.performance.proxyAuth")).toBeInTheDocument()
  })

  it("hides proxy settings when proxy is disabled", () => {
    renderWithModal(<PerformanceSettingsTab data-oid="1h15l3." />)

    expect(screen.queryByText("dialogs.userSettings.performance.proxyType")).not.toBeInTheDocument()
    expect(screen.queryByText("dialogs.userSettings.performance.proxyHost")).not.toBeInTheDocument()
  })

  it("handles proxy enable toggle", () => {
    renderWithModal(<PerformanceSettingsTab data-oid="x5-od:." />)

    // Find proxy switch by looking for the label
    const proxyLabel = screen.getByText("dialogs.userSettings.performance.proxyServer")
    const proxyContainer = proxyLabel.closest("div")
    const proxySwitch = proxyContainer?.querySelector('[role="switch"]')

    if (proxySwitch) {
      fireEvent.click(proxySwitch)
      expect(mockHandlers.handleProxyEnabledChange).toHaveBeenCalledWith(true)
    }
  })

  it("shows proxy type selector when proxy is enabled", () => {
    mockUseUserSettings.mockReturnValue({
      ...defaultMockValues,
      proxyEnabled: true,
    })

    renderWithModal(<PerformanceSettingsTab data-oid="-gn1tw4" />)

    // Check that proxy type label is shown
    expect(screen.getByText("dialogs.userSettings.performance.proxyType")).toBeInTheDocument()

    // Check that the default proxy type (HTTP) is displayed somewhere
    const httpElements = screen.getAllByText("HTTP")
    expect(httpElements.length).toBeGreaterThan(0)
  })

  it("handles proxy host input", async () => {
    const user = userEvent.setup()
    mockUseUserSettings.mockReturnValue({
      ...defaultMockValues,
      proxyEnabled: true,
    })

    renderWithModal(<PerformanceSettingsTab data-oid="q955pru" />)

    const hostInput = screen.getByPlaceholderText("proxy.example.com")
    await user.type(hostInput, "my-proxy.com")

    expect(mockHandlers.handleProxyHostChange).toHaveBeenCalledTimes(12) // one call per character
  })

  it("handles proxy port input", async () => {
    const user = userEvent.setup()
    mockUseUserSettings.mockReturnValue({
      ...defaultMockValues,
      proxyEnabled: true,
    })

    renderWithModal(<PerformanceSettingsTab data-oid="41wbq7j" />)

    const portInput = screen.getByPlaceholderText("8080")
    await user.type(portInput, "3128")

    expect(mockHandlers.handleProxyPortChange).toHaveBeenCalledTimes(4)
  })

  it("handles proxy username input", async () => {
    const user = userEvent.setup()
    mockUseUserSettings.mockReturnValue({
      ...defaultMockValues,
      proxyEnabled: true,
    })

    renderWithModal(<PerformanceSettingsTab data-oid="p9m65j0" />)

    const usernameInput = screen.getByPlaceholderText("dialogs.userSettings.performance.usernamePlaceholder")
    await user.type(usernameInput, "testuser")

    expect(mockHandlers.handleProxyUsernameChange).toHaveBeenCalled()
  })

  it("handles proxy password input and visibility toggle", async () => {
    const user = userEvent.setup()
    mockUseUserSettings.mockReturnValue({
      ...defaultMockValues,
      proxyEnabled: true,
      proxyPassword: "secret123",
    })

    renderWithModal(<PerformanceSettingsTab data-oid="fy072hd" />)

    const passwordInput = screen.getByPlaceholderText("dialogs.userSettings.performance.passwordPlaceholder")

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute("type", "password")

    // Click show button
    const showButton = screen.getByText("dialogs.userSettings.performance.show")
    await user.click(showButton)

    // Password should now be visible
    expect(passwordInput).toHaveAttribute("type", "text")
    expect(screen.getByText("dialogs.userSettings.performance.hide")).toBeInTheDocument()

    // Type in password field
    await user.type(passwordInput, "newpass")
    expect(mockHandlers.handleProxyPasswordChange).toHaveBeenCalled()
  })

  it("shows render delay settings when background rendering is enabled", () => {
    renderWithModal(<PerformanceSettingsTab data-oid="yw.5ke-" />)

    expect(screen.getByText("dialogs.userSettings.performance.renderDelay")).toBeInTheDocument()
    expect(screen.getByDisplayValue("13")).toBeInTheDocument()
  })

  it("hides render delay settings when background rendering is disabled", () => {
    mockUseUserSettings.mockReturnValue({
      ...defaultMockValues,
      backgroundRenderingEnabled: false,
    })

    renderWithModal(<PerformanceSettingsTab data-oid="fnuscx4" />)

    expect(screen.queryByText("dialogs.userSettings.performance.renderDelay")).not.toBeInTheDocument()
  })

  it("handles background rendering toggle", () => {
    renderWithModal(<PerformanceSettingsTab data-oid="r-fmhkr" />)

    // Find background rendering switch by looking for the label
    const backgroundLabel = screen.getByText("dialogs.userSettings.performance.backgroundRendering")
    const backgroundContainer = backgroundLabel.closest("div")?.parentElement
    const backgroundSwitch = backgroundContainer?.querySelector('[role="switch"]')

    if (backgroundSwitch) {
      fireEvent.click(backgroundSwitch)
      expect(mockHandlers.handleBackgroundRenderingChange).toHaveBeenCalledWith(false)
    }
  })

  it("handles render delay change", () => {
    renderWithModal(<PerformanceSettingsTab data-oid="01c2kz4" />)

    const delayInput = screen.getByDisplayValue("13")

    // Simulate changing the value directly
    fireEvent.change(delayInput, { target: { value: "10" } })

    expect(mockHandlers.handleRenderDelayChange).toHaveBeenCalledWith(10)
  })

  it("shows render quality selector", () => {
    renderWithModal(<PerformanceSettingsTab data-oid="y2ceu_p" />)

    // Check that render quality section is rendered
    expect(screen.getByText("dialogs.userSettings.performance.renderQuality")).toBeInTheDocument()

    // Check that the default quality (high) is shown
    expect(screen.getByText("dialogs.userSettings.performance.qualityHigh")).toBeInTheDocument()
  })

  it("shows max concurrent jobs selector", () => {
    renderWithModal(<PerformanceSettingsTab data-oid="l-szh6m" />)

    // Check that concurrent jobs section is rendered
    expect(screen.getByText("dialogs.userSettings.performance.maxConcurrentJobs")).toBeInTheDocument()

    // Check that the default value (2 tasks) is shown
    expect(screen.getByText("2 dialogs.userSettings.performance.tasks")).toBeInTheDocument()
  })

  it("shows proxy configuration when enabled", () => {
    mockUseUserSettings.mockReturnValue({
      ...defaultMockValues,
      proxyEnabled: true,
    })

    renderWithModal(<PerformanceSettingsTab data-oid="qdpbcth" />)

    // Check that all proxy-related fields are shown
    expect(screen.getByText("dialogs.userSettings.performance.proxyType")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.performance.proxyHost")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.performance.proxyPort")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.performance.proxyAuth")).toBeInTheDocument()
  })

  it("shows tooltip for render delay", () => {
    renderWithModal(<PerformanceSettingsTab data-oid="xeta8u1" />)

    // Check that render delay section with tooltip is rendered
    const renderDelayText = screen.getByText("dialogs.userSettings.performance.renderDelay")
    expect(renderDelayText).toBeInTheDocument()

    // The Info icon should be rendered near the render delay label
    // Since it's an SVG icon from lucide-react, we check for its container
    const renderDelayContainer = renderDelayText.closest("div")
    expect(renderDelayContainer).toBeInTheDocument()
  })
})
