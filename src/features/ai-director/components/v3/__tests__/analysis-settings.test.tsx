/**
 * Tests for AnalysisSettings component
 */

import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { AnalysisSettings as AnalysisSettingsType } from "../analysis-settings"
import { AnalysisSettings } from "../analysis-settings"

describe("AnalysisSettings", () => {
  const createMockSettings = (overrides?: Partial<AnalysisSettingsType>): AnalysisSettingsType => ({
    mode: "balanced",
    analyzers: ["scene_detection", "audio_quality"],
    ...overrides,
  })

  const mockOnSettingsChange = vi.fn()

  const defaultProps = {
    settings: createMockSettings(),
    onSettingsChange: mockOnSettingsChange,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Rendering", () => {
    it("renders settings panel correctly", () => {
      render(<AnalysisSettings {...defaultProps} />)

      expect(screen.getByText("Analysis Settings")).toBeInTheDocument()
      expect(screen.getByText("Analysis Mode")).toBeInTheDocument()
      expect(screen.getByText("Analyzers")).toBeInTheDocument()
    })

    it("shows all mode options", () => {
      render(<AnalysisSettings {...defaultProps} />)

      expect(screen.getByLabelText("Quick")).toBeInTheDocument()
      expect(screen.getByLabelText("Balanced")).toBeInTheDocument()
      expect(screen.getByLabelText("Comprehensive")).toBeInTheDocument()
    })

    it("shows all analyzer options", () => {
      render(<AnalysisSettings {...defaultProps} />)

      expect(screen.getByLabelText("Audio Quality")).toBeInTheDocument()
      expect(screen.getByLabelText("Scene Detection")).toBeInTheDocument()
      expect(screen.getByLabelText("Moment Detection")).toBeInTheDocument()
      expect(screen.getByLabelText("Person Recognition")).toBeInTheDocument()
      expect(screen.getByLabelText("Speech Detection")).toBeInTheDocument()
      expect(screen.getByLabelText("Visual Quality")).toBeInTheDocument()
    })

    it("displays current settings summary", () => {
      render(<AnalysisSettings {...defaultProps} />)

      expect(screen.getByText(/Selected: 2 analyzers in balanced mode/i)).toBeInTheDocument()
    })
  })

  describe("Mode Selection", () => {
    it("selects correct mode initially", () => {
      render(<AnalysisSettings {...defaultProps} settings={createMockSettings({ mode: "quick" })} />)

      const quickRadio = screen.getByRole("radio", { name: /Quick/i })
      expect(quickRadio).toBeChecked()
    })

    it("calls onSettingsChange when mode changes", async () => {
      const user = userEvent.setup()
      render(<AnalysisSettings {...defaultProps} />)

      const quickRadio = screen.getByRole("radio", { name: /Quick/i })
      await user.click(quickRadio)

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        mode: "quick",
        analyzers: ["scene_detection", "audio_quality"],
      })
    })

    it("updates mode to comprehensive", async () => {
      const user = userEvent.setup()
      render(<AnalysisSettings {...defaultProps} />)

      const comprehensiveRadio = screen.getByRole("radio", { name: /Comprehensive/i })
      await user.click(comprehensiveRadio)

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        mode: "comprehensive",
        analyzers: ["scene_detection", "audio_quality"],
      })
    })
  })

  describe("Analyzer Selection", () => {
    it("checks correct analyzers initially", () => {
      render(<AnalysisSettings {...defaultProps} />)

      expect(screen.getByRole("checkbox", { name: /Audio Quality/i })).toBeChecked()
      expect(screen.getByRole("checkbox", { name: /Scene Detection/i })).toBeChecked()
      expect(screen.getByRole("checkbox", { name: /Moment Detection/i })).not.toBeChecked()
    })

    it("calls onSettingsChange when analyzer is checked", async () => {
      const user = userEvent.setup()
      render(<AnalysisSettings {...defaultProps} />)

      const momentCheckbox = screen.getByRole("checkbox", { name: /Moment Detection/i })
      await user.click(momentCheckbox)

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        mode: "balanced",
        analyzers: ["scene_detection", "audio_quality", "moment_detection"],
      })
    })

    it("calls onSettingsChange when analyzer is unchecked", async () => {
      const user = userEvent.setup()
      render(<AnalysisSettings {...defaultProps} />)

      const audioCheckbox = screen.getByRole("checkbox", { name: /Audio Quality/i })
      await user.click(audioCheckbox)

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        mode: "balanced",
        analyzers: ["scene_detection"],
      })
    })
  })

  describe("Select All / Clear buttons", () => {
    it("selects all analyzers when Select All clicked", async () => {
      const user = userEvent.setup()
      render(<AnalysisSettings {...defaultProps} />)

      const selectAllButton = screen.getByRole("button", { name: /Select All/i })
      await user.click(selectAllButton)

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        mode: "balanced",
        analyzers: [
          "audio_quality",
          "scene_detection",
          "moment_detection",
          "person_recognition",
          "speech_detection",
          "visual_quality",
        ],
      })
    })

    it("clears all analyzers when Clear clicked", async () => {
      const user = userEvent.setup()
      render(<AnalysisSettings {...defaultProps} />)

      const clearButton = screen.getByRole("button", { name: /Clear/i })
      await user.click(clearButton)

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        mode: "balanced",
        analyzers: [],
      })
    })
  })

  describe("Disabled state", () => {
    it("disables all controls when disabled prop is true", () => {
      render(<AnalysisSettings {...defaultProps} disabled={true} />)

      const quickRadio = screen.getByRole("radio", { name: /Quick/i })
      const audioCheckbox = screen.getByRole("checkbox", { name: /Audio Quality/i })
      const selectAllButton = screen.getByRole("button", { name: /Select All/i })
      const clearButton = screen.getByRole("button", { name: /Clear/i })

      expect(quickRadio).toBeDisabled()
      expect(audioCheckbox).toBeDisabled()
      expect(selectAllButton).toBeDisabled()
      expect(clearButton).toBeDisabled()
    })

    it("enables all controls when disabled prop is false", () => {
      render(<AnalysisSettings {...defaultProps} disabled={false} />)

      const quickRadio = screen.getByRole("radio", { name: /Quick/i })
      const audioCheckbox = screen.getByRole("checkbox", { name: /Audio Quality/i })
      const selectAllButton = screen.getByRole("button", { name: /Select All/i })
      const clearButton = screen.getByRole("button", { name: /Clear/i })

      expect(quickRadio).not.toBeDisabled()
      expect(audioCheckbox).not.toBeDisabled()
      expect(selectAllButton).not.toBeDisabled()
      expect(clearButton).not.toBeDisabled()
    })
  })

  describe("Summary text", () => {
    it("displays correct summary with single analyzer", () => {
      render(<AnalysisSettings {...defaultProps} settings={createMockSettings({ analyzers: ["audio_quality"] })} />)

      expect(screen.getByText(/Selected: 1 analyzer in balanced mode/i)).toBeInTheDocument()
    })

    it("displays correct summary with multiple analyzers", () => {
      render(
        <AnalysisSettings
          {...defaultProps}
          settings={createMockSettings({ analyzers: ["audio_quality", "scene_detection", "moment_detection"] })}
        />,
      )

      expect(screen.getByText(/Selected: 3 analyzers in balanced mode/i)).toBeInTheDocument()
    })

    it("updates summary when mode changes", () => {
      const { rerender } = render(<AnalysisSettings {...defaultProps} />)

      expect(screen.getByText(/in balanced mode/i)).toBeInTheDocument()

      rerender(<AnalysisSettings {...defaultProps} settings={createMockSettings({ mode: "quick" })} />)

      expect(screen.getByText(/in quick mode/i)).toBeInTheDocument()
    })
  })
})
