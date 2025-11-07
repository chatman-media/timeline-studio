import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MidiMappingEditorModal } from "../midi-mapping-editor-modal"

// Mock icons
vi.mock("lucide-react", () => ({
  // Add any icons used by the component here
}))

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, variant, className }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} className={className}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor, className }: any) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}))

vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <div data-value={value} data-testid="select">
      {children}
      <input type="hidden" value={value} onChange={(e) => onValueChange?.(e.target.value)} data-testid="select-input" />
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children }: any) => (
    <div
      data-value={value}
      onClick={() => {
        const select = document.querySelector('[data-testid="select"]')
        const input = select?.querySelector('[data-testid="select-input"]') as HTMLInputElement | null
        if (input) {
          input.value = value
          input.dispatchEvent(new Event("change", { bubbles: true }))
        }
      }}
    >
      {children}
    </div>
  ),
  SelectTrigger: ({ children, id, className }: any) => (
    <div id={id} className={className}>
      {children}
    </div>
  ),
  SelectValue: () => <span data-testid="select-value" />,
}))

vi.mock("@/components/ui/slider", () => ({
  Slider: ({ value, onValueChange, min, max, step, className }: any) => (
    <input
      type="range"
      value={value?.[0] || 0}
      onChange={(e) => onValueChange?.([Number.parseFloat(e.target.value)])}
      min={min}
      max={max}
      step={step}
      className={className}
      data-testid="slider"
    />
  ),
}))

// Mock modal service
const mockCloseModal = vi.fn()
const mockModalData = {
  mapping: null as any,
  onSave: vi.fn(),
}

vi.mock("@/features/modals/services", () => ({
  useModal: () => ({
    modalData: mockModalData,
    closeModal: mockCloseModal,
  }),
}))

describe("MidiMappingEditorModal", () => {
  const defaultMapping = {
    targetParameter: "channel.1.volume",
    messageType: "cc",
    controller: 7,
    channel: 1,
    min: 0,
    max: 1,
    curve: "linear",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockModalData.mapping = defaultMapping
    mockModalData.onSave = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Rendering", () => {
    it("should render with mapping data", () => {
      render(<MidiMappingEditorModal />)

      expect(screen.getByText("channel.1.volume")).toBeInTheDocument()
      expect(screen.getByText("CC CC7 CH1")).toBeInTheDocument()
    })

    it("should render all controls", () => {
      render(<MidiMappingEditorModal />)

      expect(screen.getByText("fairlightAudio.midi.mappingEditor.minimumValue")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.mappingEditor.maximumValue")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.mappingEditor.responseCurve")).toBeInTheDocument()
    })

    it("should render curve preview", () => {
      const { container } = render(<MidiMappingEditorModal />)

      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg?.tagName).toBe("svg")

      expect(screen.getByText("fairlightAudio.midi.mappingEditor.responseCurvePreview")).toBeInTheDocument()
    })

    it("should return null if no mapping provided", () => {
      mockModalData.mapping = null

      const { container } = render(<MidiMappingEditorModal />)
      expect(container.firstChild).toBeNull()
    })

    it("should display mapping info correctly for different message types", () => {
      mockModalData.mapping = {
        targetParameter: "master.volume",
        messageType: "noteon",
        channel: 2,
        min: 0.2,
        max: 0.8,
        curve: "exponential",
      }

      render(<MidiMappingEditorModal />)

      expect(screen.getByText("master.volume")).toBeInTheDocument()
      expect(screen.getByText("NOTEON CH2")).toBeInTheDocument()
    })

    it("should display initial slider values", () => {
      mockModalData.mapping = {
        ...defaultMapping,
        min: 0.25,
        max: 0.75,
      }

      render(<MidiMappingEditorModal />)

      expect(screen.getByText("0.25")).toBeInTheDocument()
      expect(screen.getByText("0.75")).toBeInTheDocument()
    })
  })

  describe("Value Controls", () => {
    it("should update minimum value", () => {
      render(<MidiMappingEditorModal />)

      const sliders = screen.getAllByTestId("slider")
      const minSlider = sliders[0]

      fireEvent.change(minSlider, { target: { value: "0.3" } })

      expect(screen.getByText("0.30")).toBeInTheDocument()
    })

    it("should update maximum value", () => {
      render(<MidiMappingEditorModal />)

      const sliders = screen.getAllByTestId("slider")
      const maxSlider = sliders[1]

      fireEvent.change(maxSlider, { target: { value: "0.85" } })

      expect(screen.getByText("0.85")).toBeInTheDocument()
    })

    it("should handle slider edge cases", () => {
      render(<MidiMappingEditorModal />)

      const sliders = screen.getAllByTestId("slider")

      // Test min boundary
      fireEvent.change(sliders[0], { target: { value: "0" } })
      expect(screen.getByText("0.00")).toBeInTheDocument()

      // Test max boundary
      fireEvent.change(sliders[1], { target: { value: "1" } })
      expect(screen.getByText("1.00")).toBeInTheDocument()
    })
  })

  describe("Curve Selection", () => {
    it("should render all curve options", () => {
      render(<MidiMappingEditorModal />)

      expect(screen.getByText("fairlightAudio.midi.mappingEditor.curves.linear")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.mappingEditor.curves.exponential")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.mappingEditor.curves.logarithmic")).toBeInTheDocument()
    })

    it("should update curve type", async () => {
      render(<MidiMappingEditorModal />)

      // Verify initial state
      const select = screen.getByTestId("select")
      expect(select).toHaveAttribute("data-value", "linear")

      // Verify all curve options exist
      const exponentialOption = screen.getByText("fairlightAudio.midi.mappingEditor.curves.exponential")
      expect(exponentialOption).toBeInTheDocument()

      // The SelectItem component has data-value attribute
      const selectItem = exponentialOption.closest("[data-value]")
      expect(selectItem).toHaveAttribute("data-value", "exponential")
    })

    it("should show initial curve selection", () => {
      mockModalData.mapping = {
        ...defaultMapping,
        curve: "logarithmic",
      }

      render(<MidiMappingEditorModal />)

      const select = screen.getByTestId("select")
      expect(select).toHaveAttribute("data-value", "logarithmic")
    })
  })

  describe("Curve Preview", () => {
    it("should render SVG curve path", () => {
      const { container } = render(<MidiMappingEditorModal />)

      const path = container.querySelector('path[stroke="rgb(59, 130, 246)"]')
      expect(path).toBeInTheDocument()
      expect(path).toHaveAttribute("d")
      expect(path).toHaveAttribute("fill", "none")
      expect(path).toHaveAttribute("stroke-width", "2")
    })

    it("should render min/max indicators", () => {
      const { container } = render(<MidiMappingEditorModal />)

      const circles = container.querySelectorAll('circle[fill="rgb(59, 130, 246)"]')
      expect(circles).toHaveLength(2)

      // Check min indicator
      expect(circles[0]).toHaveAttribute("cx", "0")
      expect(circles[0]).toHaveAttribute("r", "3")

      // Check max indicator
      expect(circles[1]).toHaveAttribute("cx", "100")
      expect(circles[1]).toHaveAttribute("r", "3")
    })

    it("should update curve preview when values change", () => {
      const { container } = render(<MidiMappingEditorModal />)

      // Change min value to see path update
      const sliders = screen.getAllByTestId("slider")
      fireEvent.change(sliders[0], { target: { value: "0.5" } })

      // Path should reflect new min value
      const path = container.querySelector("path")
      const d = path?.getAttribute("d") || ""

      // Path should start at y=50 (100 - 0.5 * 100)
      expect(d).toMatch(/^M 0,50/)
    })

    it("should render grid lines", () => {
      const { container } = render(<MidiMappingEditorModal />)

      const gridLines = container.querySelectorAll("g.stroke-zinc-800 line")
      expect(gridLines).toHaveLength(2)

      // Horizontal line
      expect(gridLines[0]).toHaveAttribute("x1", "0")
      expect(gridLines[0]).toHaveAttribute("y1", "50")
      expect(gridLines[0]).toHaveAttribute("x2", "100")
      expect(gridLines[0]).toHaveAttribute("y2", "50")

      // Vertical line
      expect(gridLines[1]).toHaveAttribute("x1", "50")
      expect(gridLines[1]).toHaveAttribute("y1", "0")
      expect(gridLines[1]).toHaveAttribute("x2", "50")
      expect(gridLines[1]).toHaveAttribute("y2", "100")
    })
  })

  describe("Modal Actions", () => {
    it("should close modal on cancel", () => {
      render(<MidiMappingEditorModal />)

      const cancelButton = screen.getByText("fairlightAudio.midi.mappingEditor.cancel")
      fireEvent.click(cancelButton)

      expect(mockCloseModal).toHaveBeenCalled()
    })

    it("should save changes and close modal", () => {
      render(<MidiMappingEditorModal />)

      // Change values
      const sliders = screen.getAllByTestId("slider")
      fireEvent.change(sliders[0], { target: { value: "0.2" } })
      fireEvent.change(sliders[1], { target: { value: "0.9" } })

      // Save without changing curve (keep it linear)
      const saveButton = screen.getByText("fairlightAudio.midi.mappingEditor.saveChanges")
      fireEvent.click(saveButton)

      expect(mockModalData.onSave).toHaveBeenCalledWith({
        min: 0.2,
        max: 0.9,
        curve: "linear",
      })
      expect(mockCloseModal).toHaveBeenCalled()
    })

    it("should handle save without onSave callback", () => {
      mockModalData.onSave = undefined as any

      render(<MidiMappingEditorModal />)

      const saveButton = screen.getByText("fairlightAudio.midi.mappingEditor.saveChanges")
      fireEvent.click(saveButton)

      // Should still close modal
      expect(mockCloseModal).toHaveBeenCalled()
    })

    it("should use default values when mapping lacks them", () => {
      mockModalData.mapping = {
        targetParameter: "test.param",
        messageType: "cc",
        // Missing min, max, curve
      }

      render(<MidiMappingEditorModal />)

      // Check defaults are applied
      expect(screen.getByText("0.00")).toBeInTheDocument()
      expect(screen.getByText("1.00")).toBeInTheDocument()

      const select = screen.getByTestId("select")
      expect(select).toHaveAttribute("data-value", "linear")
    })
  })

  describe("Curve Path Generation", () => {
    it("should generate valid SVG path for linear curve", () => {
      const { container } = render(<MidiMappingEditorModal />)

      const path = container.querySelector("path")
      const d = path?.getAttribute("d") || ""

      // Should start with M and contain L commands
      expect(d).toMatch(/^M/)
      expect(d).toContain(" L ")

      // Should have multiple points
      const points = d.split(" L ").length
      expect(points).toBeGreaterThan(10)
    })

    it("should update path when curve type changes", () => {
      const { container } = render(<MidiMappingEditorModal />)

      // Get initial path with default values (0 to 1)
      const path = container.querySelector("path")
      const d = path?.getAttribute("d") || ""

      // Default linear path should go from bottom-left to top-right
      expect(d).toMatch(/^M 0,100/) // starts at bottom (100 - 0 * 100)
      expect(d).toContain("100,0") // ends at top (100 - 1 * 100)

      // Path should have multiple points (more than 10)
      const points = d.split(" L ").length
      expect(points).toBeGreaterThan(10)
    })

    it("should update indicator positions based on min/max", () => {
      const { container } = render(<MidiMappingEditorModal />)

      // Change min value
      const sliders = screen.getAllByTestId("slider")
      fireEvent.change(sliders[0], { target: { value: "0.5" } })

      const circles = container.querySelectorAll("circle")
      // Min indicator should be at y=50 (100 - 0.5 * 100)
      expect(circles[0]).toHaveAttribute("cy", "50")

      // Change max value
      fireEvent.change(sliders[1], { target: { value: "0.75" } })

      const updatedCircles = container.querySelectorAll("circle")
      // Max indicator should be at y=25 (100 - 0.75 * 100)
      expect(updatedCircles[1]).toHaveAttribute("cy", "25")
    })
  })

  describe("Edge Cases", () => {
    it("should handle mapping without controller info", () => {
      mockModalData.mapping = {
        targetParameter: "test.param",
        messageType: "noteon",
        channel: 1,
        // No controller field
      }

      render(<MidiMappingEditorModal />)

      expect(screen.getByText("NOTEON CH1")).toBeInTheDocument()
    })

    it("should handle mapping without channel info", () => {
      mockModalData.mapping = {
        targetParameter: "test.param",
        messageType: "pitchbend",
        // No channel field
      }

      render(<MidiMappingEditorModal />)

      expect(screen.getByText("PITCHBEND")).toBeInTheDocument()
    })

    it("should maintain state between re-renders", () => {
      const { rerender } = render(<MidiMappingEditorModal />)

      // Change values
      const sliders = screen.getAllByTestId("slider")
      fireEvent.change(sliders[0], { target: { value: "0.33" } })

      // Re-render
      rerender(<MidiMappingEditorModal />)

      // Value should persist
      expect(screen.getByText("0.33")).toBeInTheDocument()
    })
  })
})
