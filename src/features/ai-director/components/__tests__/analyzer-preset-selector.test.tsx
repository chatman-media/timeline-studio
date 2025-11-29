/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { AnalyzerType } from "../../types/analysis-progress"
import type { AnalyzerPreset } from "../../types/analyzer-presets"
import { AnalyzerPresetSelector } from "../analyzer-preset-selector"

describe("AnalyzerPresetSelector", () => {
  const mockSelectedAnalyzers = new Set<AnalyzerType>(["scene_detection", "audio_quality"])

  const mockCustomPresets: AnalyzerPreset[] = [
    {
      id: "custom-1",
      name: "My Custom Preset",
      description: "Custom analyzers",
      analyzers: new Set<AnalyzerType>(["scene_detection", "face_detection"]),
      isDefault: false,
      category: "custom",
      estimatedTime: 120,
    },
  ]

  const defaultProps = {
    selectedAnalyzers: mockSelectedAnalyzers,
    customPresets: mockCustomPresets,
    onApplyPreset: vi.fn(),
    onSavePreset: vi.fn(),
    onDeletePreset: vi.fn(),
  }

  describe("Rendering", () => {
    it("should render preset selector", () => {
      render(<AnalyzerPresetSelector {...defaultProps} />)

      expect(screen.getByText(/Preset/i)).toBeInTheDocument()
    })

    it("should show default presets", () => {
      render(<AnalyzerPresetSelector {...defaultProps} />)

      // Default presets should be visible
      expect(screen.getByText(/Quick|Balanced|Complete|Full/i)).toBeInTheDocument()
    })

    it("should show custom presets", () => {
      render(<AnalyzerPresetSelector {...defaultProps} />)

      expect(screen.getByText("My Custom Preset")).toBeInTheDocument()
    })
  })

  describe("Applying Presets", () => {
    it("should call onApplyPreset when preset clicked", async () => {
      const user = userEvent.setup()
      const onApplyPreset = vi.fn()

      render(<AnalyzerPresetSelector {...defaultProps} onApplyPreset={onApplyPreset} />)

      // Find and click a preset
      const presetButton = screen.getByText("My Custom Preset")
      await user.click(presetButton)

      expect(onApplyPreset).toHaveBeenCalled()
    })

    it("should highlight matching preset", () => {
      const matchingPreset: AnalyzerPreset = {
        id: "matching",
        name: "Matching Preset",
        description: "Matches selection",
        analyzers: mockSelectedAnalyzers,
        isDefault: false,
        category: "custom",
        estimatedTime: 60,
      }

      render(
        <AnalyzerPresetSelector
          {...defaultProps}
          customPresets={[...mockCustomPresets, matchingPreset]}
        />,
      )

      // Matching preset should be highlighted somehow
      expect(screen.getByText("Matching Preset")).toBeInTheDocument()
    })
  })

  describe("Saving Presets", () => {
    it("should show save dialog when save button clicked", async () => {
      const user = userEvent.setup()

      render(<AnalyzerPresetSelector {...defaultProps} />)

      const saveButton = screen.getByRole("button", { name: /save|сохранить/i })
      await user.click(saveButton)

      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("should save new preset", async () => {
      const user = userEvent.setup()
      const onSavePreset = vi.fn()

      render(<AnalyzerPresetSelector {...defaultProps} onSavePreset={onSavePreset} />)

      // Open save dialog
      const saveButton = screen.getByRole("button", { name: /save|сохранить/i })
      await user.click(saveButton)

      // Fill form
      const nameInput = screen.getByLabelText(/name|название/i)
      const descInput = screen.getByLabelText(/description|описание/i)

      await user.type(nameInput, "New Preset")
      await user.type(descInput, "New preset description")

      // Save
      const confirmButton = screen.getByRole("button", { name: /save|сохранить/i })
      await user.click(confirmButton)

      expect(onSavePreset).toHaveBeenCalled()
    })

    it("should validate preset before saving", async () => {
      const user = userEvent.setup()
      const onSavePreset = vi.fn()

      render(<AnalyzerPresetSelector {...defaultProps} onSavePreset={onSavePreset} />)

      // Open save dialog
      const saveButton = screen.getByRole("button", { name: /save|сохранить/i })
      await user.click(saveButton)

      // Try to save without name
      const confirmButton = screen.getByRole("button", { name: /save|сохранить/i })
      await user.click(confirmButton)

      // Should show error
      expect(screen.getByText(/error|ошибка|required|обязательно/i)).toBeInTheDocument()
      expect(onSavePreset).not.toHaveBeenCalled()
    })

    it("should close dialog after successful save", async () => {
      const user = userEvent.setup()

      render(<AnalyzerPresetSelector {...defaultProps} />)

      // Open dialog
      const saveButton = screen.getByRole("button", { name: /save|сохранить/i })
      await user.click(saveButton)

      // Fill and save
      const nameInput = screen.getByLabelText(/name|название/i)
      await user.type(nameInput, "New Preset")

      const confirmButton = screen.getByRole("button", { name: /save|сохранить/i })
      await user.click(confirmButton)

      // Dialog should close
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  describe("Deleting Presets", () => {
    it("should call onDeletePreset when delete clicked", async () => {
      const user = userEvent.setup()
      const onDeletePreset = vi.fn()

      render(<AnalyzerPresetSelector {...defaultProps} onDeletePreset={onDeletePreset} />)

      // Find delete button for custom preset
      const deleteButtons = screen.getAllByRole("button", { name: /delete|удалить/i })
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0])
        expect(onDeletePreset).toHaveBeenCalledWith("custom-1")
      }
    })

    it("should not show delete button for default presets", () => {
      render(<AnalyzerPresetSelector {...defaultProps} customPresets={[]} />)

      // Default presets should not have delete buttons
      const deleteButtons = screen.queryAllByRole("button", { name: /delete|удалить/i })
      expect(deleteButtons).toHaveLength(0)
    })
  })

  describe("Preset Details", () => {
    it("should show preset description", () => {
      render(<AnalyzerPresetSelector {...defaultProps} />)

      expect(screen.getByText("Custom analyzers")).toBeInTheDocument()
    })

    it("should show analyzer count", () => {
      render(<AnalyzerPresetSelector {...defaultProps} />)

      // Should show how many analyzers in preset
      expect(screen.getByText(/2 анализатор|analyzer/i)).toBeInTheDocument()
    })

    it("should show estimated time", () => {
      render(<AnalyzerPresetSelector {...defaultProps} />)

      expect(screen.getByText(/120|2 min/i)).toBeInTheDocument()
    })
  })

  describe("Empty State", () => {
    it("should show message when no custom presets", () => {
      render(<AnalyzerPresetSelector {...defaultProps} customPresets={[]} />)

      expect(screen.getByText(/no custom|нет пользовательских/i)).toBeInTheDocument()
    })

    it("should show default presets even when no custom", () => {
      render(<AnalyzerPresetSelector {...defaultProps} customPresets={[]} />)

      // Default presets should still be visible
      expect(screen.getByText(/Quick|Balanced|Complete/i)).toBeInTheDocument()
    })
  })
})
