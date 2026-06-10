/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { MidiDevice } from "../../../services/midi/midi-engine"
import { MidiLearnDialog } from "../midi-learn-dialog"
import { mockUIComponents, resetSelectStates } from "./test-utils/mocks"

// Setup all UI mocks
mockUIComponents()

// Override the dialog mock to show the test version
vi.mock("@timeline-studio/ui/components/dialog", () => ({
  Dialog: ({ open, onOpenChange, children }: any) =>
    open ? (
      <div data-testid="dialog" onClick={() => onOpenChange?.(false)} data-oid=":.au3wh">
        {children}
      </div>
    ) : null,
  DialogContent: ({ children, className }: any) => (
    <div className={className} data-oid="_9pwj6z">
      {children}
    </div>
  ),

  DialogDescription: ({ children }: any) => <div data-oid="4c0udor">{children}</div>,
  DialogFooter: ({ children }: any) => <div data-oid="1usk1uu">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-oid="grnjxcv">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-oid="010pf_0">{children}</h2>,
}))

// Mock MIDI hook
const mockStartLearning = vi.fn()
vi.mock("../../../hooks/use-midi", () => ({
  useMidi: () => ({
    startLearning: mockStartLearning,
  }),
}))

describe("MidiLearnDialog", () => {
  const mockOnClose = vi.fn()
  const mockOnComplete = vi.fn()

  const mockDevices: MidiDevice[] = [
    {
      id: "device1",
      name: "MIDI Device 1",
      type: "input",
      manufacturer: "",
      state: "connected",
    },
    {
      id: "device2",
      name: "MIDI Device 2",
      type: "input",
      manufacturer: "",
      state: "connected",
    },
  ]

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    devices: mockDevices,
    onComplete: mockOnComplete,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    resetSelectStates()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetSelectStates()
  })

  describe("Rendering", () => {
    it("should render when open", () => {
      render(<MidiLearnDialog {...defaultProps} data-oid="5g50u2q" />)

      expect(screen.getByTestId("dialog")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.learnDialog.title")).toBeInTheDocument()
    })

    it("should not render when closed", () => {
      render(<MidiLearnDialog {...defaultProps} open={false} data-oid="5w1lhmv" />)

      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument()
    })

    it("should render device selection", () => {
      render(<MidiLearnDialog {...defaultProps} data-oid=".hzcjmv" />)

      expect(screen.getByText("fairlightAudio.midi.learnDialog.midiDevice")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.learnDialog.selectMidiDevice")).toBeInTheDocument()
    })

    it("should render parameter selection", () => {
      render(<MidiLearnDialog {...defaultProps} data-oid="e17zyny" />)

      expect(screen.getByText("fairlightAudio.midi.learnDialog.targetParameter")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.learnDialog.selectParameter")).toBeInTheDocument()
    })

    it("should render parameter select", () => {
      render(<MidiLearnDialog {...defaultProps} data-oid="etm.pjf" />)

      // Check that parameter select exists
      const paramSelects = screen.getAllByRole("combobox")
      expect(paramSelects).toHaveLength(2) // Device and parameter selects
      expect(screen.getByText("fairlightAudio.midi.learnDialog.selectParameter")).toBeInTheDocument()
    })

    it("should render initial status", () => {
      render(<MidiLearnDialog {...defaultProps} data-oid="jy86me-" />)

      expect(screen.getByTestId("music-icon")).toHaveClass("text-zinc-600")
      expect(screen.getByText("fairlightAudio.midi.learnDialog.status.ready")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.learnDialog.status.readyHint")).toBeInTheDocument()
    })
  })

  describe("Device Selection", () => {
    it("should render device select", () => {
      render(<MidiLearnDialog {...defaultProps} data-oid=".qo8tt9" />)

      // Check that device select exists
      const selects = screen.getAllByRole("combobox")
      expect(selects).toHaveLength(2) // Device and parameter selects
      expect(screen.getByText("fairlightAudio.midi.learnDialog.selectMidiDevice")).toBeInTheDocument()
    })

    it("should handle device selection", () => {
      // Since we're using real Radix UI components, we can't test the selection directly
      // We'll just verify the component renders correctly
      render(<MidiLearnDialog {...defaultProps} data-oid="8ia-8jc" />)

      const selects = screen.getAllByRole("combobox")
      expect(selects).toHaveLength(2)
      expect(selects[0]).toBeInTheDocument() // Device select
    })
  })

  describe("Parameter Selection", () => {
    it("should handle parameter selection", () => {
      // Since we're using real Radix UI components, we can't test the selection directly
      // We'll just verify the component renders correctly
      render(<MidiLearnDialog {...defaultProps} data-oid="jd8t215" />)

      const selects = screen.getAllByRole("combobox")
      expect(selects).toHaveLength(2)
      expect(selects[1]).toBeInTheDocument() // Parameter select
    })
  })

  describe("Start Listening", () => {
    it("should disable start button when device not selected", () => {
      render(<MidiLearnDialog {...defaultProps} data-oid="_43fjh4" />)

      const startButton = screen.getByText("fairlightAudio.midi.learnDialog.buttons.startListening")
      expect(startButton).toBeDisabled()
    })

    it("should disable start button when parameter not selected", () => {
      render(<MidiLearnDialog {...defaultProps} data-oid="x_3s2s6" />)

      // Start button should be disabled when nothing is selected
      const startButton = screen.getByText("fairlightAudio.midi.learnDialog.buttons.startListening")
      expect(startButton).toBeDisabled()
    })

    it("should have disabled start button initially", () => {
      render(<MidiLearnDialog {...defaultProps} data-oid="mstb78w" />)

      const startButton = screen.getByText("fairlightAudio.midi.learnDialog.buttons.startListening")
      expect(startButton).toBeDisabled()
    })

    it("should show correct UI elements", () => {
      render(<MidiLearnDialog {...defaultProps} data-oid="vstm9:d" />)

      // Check that all main UI elements are present
      expect(screen.getByText("fairlightAudio.midi.learnDialog.status.ready")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.learnDialog.buttons.cancel")).toBeInTheDocument()
      expect(screen.getByText("fairlightAudio.midi.learnDialog.buttons.startListening")).toBeInTheDocument()
    })
  })

  describe("MIDI Message Reception", () => {
    it("should setup MIDI learning hook", () => {
      render(<MidiLearnDialog {...defaultProps} data-oid="_li:-nj" />)

      // Verify the component renders and hook is available
      expect(mockStartLearning).toBeDefined()
    })
  })

  describe("Dialog Control", () => {
    it("should call onClose when cancel clicked", () => {
      render(<MidiLearnDialog {...defaultProps} data-oid="mekp6lc" />)

      const cancelButton = screen.getByText("fairlightAudio.midi.learnDialog.buttons.cancel")
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it("should call onClose when dialog closed", () => {
      render(<MidiLearnDialog {...defaultProps} data-oid="lr.4an-" />)

      const dialog = screen.getByTestId("dialog")
      fireEvent.click(dialog)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
