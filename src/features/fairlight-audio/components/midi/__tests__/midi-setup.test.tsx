/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { MidiDevice, MidiMapping } from "../../../services/midi/midi-engine"
import { MidiSetup } from "../midi-setup"
import { resetSelectStates } from "./test-utils/mocks"

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock Radix UI Tabs with our custom mock
vi.mock("@/components/ui/tabs", async () => {
  const tabsMock = await import("./test-utils/tabs-mock")
  return {
    Tabs: tabsMock.Tabs,
    TabsContent: tabsMock.TabsContent,
    TabsList: tabsMock.TabsList,
    TabsTrigger: tabsMock.TabsTrigger,
  }
})

// Mock other UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
}))

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor, className }: any) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}))

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}))

// Mock useModals hook
const mockOpenModal = vi.fn()
vi.mock("@/domains/system-integration", () => ({
  useModals: () => ({
    activeModal: "none",
    modalData: null,
    isModalOpen: false,
    openModal: mockOpenModal,
    closeModal: vi.fn(),
    submitModal: vi.fn(),
    openCameraCapture: vi.fn(),
    openVoiceRecording: vi.fn(),
    openExport: vi.fn(),
    openProjectSettings: vi.fn(),
    openUserSettings: vi.fn(),
    openKeyboardShortcuts: vi.fn(),
    openColorGrading: vi.fn(),
    openEffectDetail: vi.fn(),
  }),
}))

vi.mock("../midi-mapping-editor", () => ({
  MidiMappingEditor: ({ mapping, onSave }: any) => (
    <button onClick={() => onSave?.({ min: 0.5, max: 1 })}>Edit {mapping.targetParameter}</button>
  ),
}))

vi.mock("../midi-router-view", () => ({
  MidiRouterView: () => <div>MidiRouterView</div>,
}))

// Mock MIDI hook
const mockDevices: MidiDevice[] = [
  { id: "input1", name: "MIDI Input 1", type: "input", manufacturer: "Test Manufacturer", state: "connected" },
  { id: "input2", name: "MIDI Input 2", type: "input", manufacturer: "Test Manufacturer", state: "connected" },
  { id: "output1", name: "MIDI Output 1", type: "output", manufacturer: "Test Manufacturer", state: "connected" },
  { id: "output2", name: "MIDI Output 2", type: "output", manufacturer: "Test Manufacturer", state: "disconnected" },
]

const mockMappings: MidiMapping[] = [
  {
    id: "mapping1",
    deviceId: "input1",
    messageType: "cc",
    channel: 1,
    controller: 7,
    targetParameter: "channel.1.volume",
    min: 0,
    max: 1,
    curve: "linear",
  },
  {
    id: "mapping2",
    deviceId: "input2",
    messageType: "noteon",
    channel: 2,
    targetParameter: "channel.2.mute",
    min: 0,
    max: 1,
    curve: "linear",
  },
]

const mockUseMidi = {
  devices: mockDevices,
  inputDevices: mockDevices.filter((d) => d.type === "input"),
  outputDevices: mockDevices.filter((d) => d.type === "output"),
  mappings: mockMappings,
  isInitialized: true,
  error: null,
  addMapping: vi.fn(),
  removeMapping: vi.fn(),
  updateMapping: vi.fn(),
}

vi.mock("../../../hooks/use-midi", () => ({
  useMidi: () => mockUseMidi,
}))

describe("MidiSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOpenModal.mockClear()
    resetSelectStates()
    mockUseMidi.isInitialized = true
    mockUseMidi.error = null
    mockUseMidi.mappings = [...mockMappings]
    mockUseMidi.devices = [...mockDevices]
    mockUseMidi.inputDevices = mockDevices.filter((d) => d.type === "input")
    mockUseMidi.outputDevices = mockDevices.filter((d) => d.type === "output")
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetSelectStates()
  })

  describe("Rendering", () => {
    it("should render tabs", () => {
      render(<MidiSetup />)

      expect(screen.getByText("fairlightAudio.midi.setup.tabs.devices")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.setup.tabs.mappings")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.setup.tabs.router")).toBeInTheDocument()
    })

    it("should show loading state", () => {
      mockUseMidi.isInitialized = false

      render(<MidiSetup />)

      expect(screen.getByTestId("loader2-icon")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.setup.initializing")).toBeInTheDocument()
    })

    it("should show error state", () => {
      mockUseMidi.error = "Failed to initialize MIDI" as any // Mock error for test

      render(<MidiSetup />)

      expect(screen.getByTestId("info-icon")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.setup.error")).toBeInTheDocument()
      expect(screen.getByText("Failed to initialize MIDI")).toBeInTheDocument()
    })
  })

  describe("Devices Tab", () => {
    it("should display input devices", () => {
      render(<MidiSetup />)

      expect(screen.getByText("fairlightAudio.midi.setup.devices.inputDevices")).toBeInTheDocument()
      // Multiple elements with same text exist (device list and select options)
      const input1Elements = screen.getAllByText("MIDI Input 1")
      const input2Elements = screen.getAllByText("MIDI Input 2")
      expect(input1Elements.length).toBeGreaterThan(0)
      expect(input2Elements.length).toBeGreaterThan(0)
    })

    it("should display output devices", () => {
      render(<MidiSetup />)

      expect(screen.getByText("fairlightAudio.midi.setup.devices.outputDevices")).toBeInTheDocument()
      // Multiple elements with same text exist (device list and select options)
      const output1Elements = screen.getAllByText("MIDI Output 1")
      const output2Elements = screen.getAllByText("MIDI Output 2")
      expect(output1Elements.length).toBeGreaterThan(0)
      expect(output2Elements.length).toBeGreaterThan(0)
    })

    it("should show no devices message", () => {
      mockUseMidi.inputDevices = []
      mockUseMidi.outputDevices = []

      render(<MidiSetup />)

      expect(screen.getByText("fairlightAudio.midi.setup.devices.noInputDevices")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.setup.devices.noOutputDevices")).toBeInTheDocument()
    })

    it("should display device manufacturer", () => {
      render(<MidiSetup />)

      // Verify devices are displayed with manufacturer info
      const inputDevices = screen.getAllByText("MIDI Input 1")
      expect(inputDevices.length).toBeGreaterThan(0)

      // Find device item that shows manufacturer
      const deviceItem = inputDevices[0].closest(".flex.items-center.justify-between")
      expect(deviceItem?.textContent).toContain("Test Manufacturer")
    })

    it("should show device connection status", () => {
      const { container } = render(<MidiSetup />)

      // Find all device items
      const deviceItems = container.querySelectorAll(".flex.items-center.justify-between.p-2")
      expect(deviceItems.length).toBeGreaterThan(0)

      // Check for connection indicators
      const indicators = container.querySelectorAll(".rounded-full")
      expect(indicators.length).toBeGreaterThan(0)

      // We should have both connected (green) and disconnected (red) devices
      const greenIndicators = Array.from(indicators).filter((ind) => ind.className.includes("bg-green-500"))
      const redIndicators = Array.from(indicators).filter((ind) => ind.className.includes("bg-red-500"))

      expect(greenIndicators.length).toBeGreaterThan(0) // 3 connected devices
      expect(redIndicators.length).toBeGreaterThan(0) // 1 disconnected device
    })

    it("should render default device selectors", () => {
      render(<MidiSetup />)

      expect(screen.getByText("fairlightAudio.midi.setup.devices.defaultDevices")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.setup.devices.defaultInput")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.setup.devices.defaultOutput")).toBeInTheDocument()
    })
  })

  describe("Mappings Tab", () => {
    it("should display mappings", async () => {
      render(<MidiSetup />)

      // Click on mappings tab
      const mappingsTab = screen.getByRole("tab", { name: "fairlightAudio.midi.setup.tabs.mappings" })
      fireEvent.click(mappingsTab)

      // Debug: check what's rendered after click
      await waitFor(() => {
        // The tab should become selected
        expect(mappingsTab).toHaveAttribute("aria-selected", "true")
      })

      // Debug: print current DOM
      // screen.debug()

      // Now check for content - wait for it to appear
      await waitFor(() => {
        expect(screen.getByText("channel.1.volume")).toBeInTheDocument()
      })

      expect(screen.getByText("channel.2.mute")).toBeInTheDocument()
    })

    it("should show mapping details", async () => {
      render(<MidiSetup />)

      // Click on mappings tab
      const mappingsTab = screen.getByRole("tab", { name: "fairlightAudio.midi.setup.tabs.mappings" })
      fireEvent.click(mappingsTab)

      // Wait for mappings title to appear
      await waitFor(() => {
        expect(screen.getByText("fairlightAudio.midi.setup.mappings.title")).toBeInTheDocument()
      })

      // Check for parameter names
      expect(screen.getByText("channel.1.volume")).toBeInTheDocument()

      // Check for device and message details text which includes bullet separator
      const detailText1 = screen.getByText((content, element) => {
        return (
          element?.tagName === "P" &&
          element?.className?.includes("text-xs") &&
          content.includes("MIDI Input 1") &&
          content.includes("•") &&
          content.includes("CC") &&
          content.includes("CC7") &&
          content.includes("CH1")
        )
      })

      expect(detailText1).toBeInTheDocument()
    })

    it("should show no mappings message", async () => {
      mockUseMidi.mappings = []

      render(<MidiSetup />)

      // Click on mappings tab
      const mappingsTab = screen.getByRole("tab", { name: "fairlightAudio.midi.setup.tabs.mappings" })
      fireEvent.click(mappingsTab)

      // Wait for mappings title to appear
      await waitFor(() => {
        expect(screen.getByText("fairlightAudio.midi.setup.mappings.title")).toBeInTheDocument()
      })

      // Now check for empty state content
      expect(screen.getByTestId("music-icon")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.setup.mappings.noMappings")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.setup.mappings.addFirstMapping")).toBeInTheDocument()
    })

    it("should render add mapping button", async () => {
      render(<MidiSetup />)

      // Click on mappings tab
      const mappingsTab = screen.getByRole("tab", { name: "fairlightAudio.midi.setup.tabs.mappings" })
      fireEvent.click(mappingsTab)

      // Wait for mappings title to appear
      await waitFor(() => {
        expect(screen.getByText("fairlightAudio.midi.setup.mappings.title")).toBeInTheDocument()
      })

      // Check for add mapping button
      expect(screen.getByText("fairlightAudio.midi.setup.mappings.addMapping")).toBeInTheDocument()
    })

    it("should handle adding mapping", async () => {
      // Setup mock to immediately call onComplete
      mockOpenModal.mockImplementation((modalId, props) => {
        if (modalId === "midi-learn" && props.onComplete) {
          // Simulate completing MIDI learn
          props.onComplete(
            { id: "device1", name: "MIDI Device 1", type: "input", manufacturer: "Test", state: "connected" },
            { type: "cc", channel: 1, data: { controller: 7 } },
            "test.param",
          )
        }
      })

      render(<MidiSetup />)

      // Click on mappings tab
      const mappingsTab = screen.getByRole("tab", { name: "fairlightAudio.midi.setup.tabs.mappings" })
      fireEvent.click(mappingsTab)

      // Wait for mappings title to appear
      await waitFor(() => {
        expect(screen.getByText("fairlightAudio.midi.setup.mappings.title")).toBeInTheDocument()
      })

      const addButton = screen.getByText("fairlightAudio.midi.setup.mappings.addMapping")
      fireEvent.click(addButton)

      expect(mockOpenModal).toHaveBeenCalledWith("midi-learn", expect.any(Object))
      expect(mockUseMidi.addMapping).toHaveBeenCalledWith({
        deviceId: "device1",
        messageType: "cc",
        channel: 1,
        controller: 7,
        targetParameter: "test.param",
        min: 0,
        max: 1,
        curve: "linear",
      })
    })

    it("should handle updating mapping", async () => {
      render(<MidiSetup />)

      // Click on mappings tab
      const mappingsTab = screen.getByRole("tab", { name: "fairlightAudio.midi.setup.tabs.mappings" })
      fireEvent.click(mappingsTab)

      // Wait for mappings title to appear
      await waitFor(() => {
        expect(screen.getByText("fairlightAudio.midi.setup.mappings.title")).toBeInTheDocument()
      })

      const editButton = screen.getByText("Edit channel.1.volume")
      fireEvent.click(editButton)

      expect(mockUseMidi.updateMapping).toHaveBeenCalledWith("mapping1", { min: 0.5, max: 1 })
    })

    it("should handle removing mapping", async () => {
      render(<MidiSetup />)

      // Click on mappings tab
      const mappingsTab = screen.getByRole("tab", { name: "fairlightAudio.midi.setup.tabs.mappings" })
      fireEvent.click(mappingsTab)

      // Wait for mappings title to appear
      await waitFor(() => {
        expect(screen.getByText("fairlightAudio.midi.setup.mappings.title")).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTestId("trash2-icon")
      expect(deleteButtons).toHaveLength(2)

      fireEvent.click(deleteButtons[0].parentElement!)

      expect(mockUseMidi.removeMapping).toHaveBeenCalledWith("mapping1")
    })

    it("should handle unknown device in mapping", async () => {
      mockUseMidi.mappings = [
        {
          ...mockMappings[0],
          deviceId: "unknown-device",
        },
      ]

      render(<MidiSetup />)

      // Click on mappings tab
      const mappingsTab = screen.getByRole("tab", { name: "fairlightAudio.midi.setup.tabs.mappings" })
      fireEvent.click(mappingsTab)

      // Wait for mappings title to appear
      await waitFor(() => {
        expect(screen.getByText("fairlightAudio.midi.setup.mappings.title")).toBeInTheDocument()
      })

      // Check for unknown device text in mapping details
      const detailText = screen.getByText((content, element) => {
        return (
          element?.tagName === "P" &&
          element?.className?.includes("text-xs") &&
          content.includes("fairlightAudio.midi.setup.devices.unknownDevice")
        )
      })

      expect(detailText).toBeInTheDocument()
    })
  })

  describe("Router Tab", () => {
    it("should render router view", async () => {
      render(<MidiSetup />)

      // Click on router tab
      const routerTab = screen.getByRole("tab", { name: "fairlightAudio.midi.setup.tabs.router" })
      fireEvent.click(routerTab)

      // Wait for router view to appear
      await waitFor(() => {
        expect(screen.getByText("MidiRouterView")).toBeInTheDocument()
      })
    })
  })

  describe("Tab Content", () => {
    it("should show devices tab by default", () => {
      render(<MidiSetup />)

      // Devices tab content should be visible
      expect(screen.getByText("fairlightAudio.midi.setup.devices.inputDevices")).toBeInTheDocument()

      // Check that devices tab is active
      const devicesTab = screen.getByRole("tab", { name: "fairlightAudio.midi.setup.tabs.devices" })
      expect(devicesTab).toHaveAttribute("aria-selected", "true")

      // Other tabs content should not be rendered with our mock
      expect(screen.queryByText("fairlightAudio.midi.setup.mappings.title")).not.toBeInTheDocument()
    })

    it("should switch between tabs", async () => {
      render(<MidiSetup />)

      // All content is rendered, just check tab selection state
      const devicesTab = screen.getByRole("tab", { name: "fairlightAudio.midi.setup.tabs.devices" })
      const mappingsTab = screen.getByRole("tab", { name: "fairlightAudio.midi.setup.tabs.mappings" })
      const routerTab = screen.getByRole("tab", { name: "fairlightAudio.midi.setup.tabs.router" })

      // Initially devices tab is active
      expect(devicesTab).toHaveAttribute("aria-selected", "true")
      expect(mappingsTab).toHaveAttribute("aria-selected", "false")
      expect(routerTab).toHaveAttribute("aria-selected", "false")

      // Click mappings tab
      fireEvent.click(mappingsTab)

      await waitFor(() => {
        expect(mappingsTab).toHaveAttribute("aria-selected", "true")
      })
      expect(devicesTab).toHaveAttribute("aria-selected", "false")

      // Click router tab
      fireEvent.click(routerTab)

      await waitFor(() => {
        expect(routerTab).toHaveAttribute("aria-selected", "true")
      })
      expect(mappingsTab).toHaveAttribute("aria-selected", "false")
    })
  })
})
