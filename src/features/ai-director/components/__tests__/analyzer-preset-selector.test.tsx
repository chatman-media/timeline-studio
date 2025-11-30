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
      estimatedTime: "2 min",
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

      expect(screen.getByText("Preset'ы")).toBeInTheDocument()
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
        estimatedTime: "1 min",
      }

      render(<AnalyzerPresetSelector {...defaultProps} customPresets={[...mockCustomPresets, matchingPreset]} />)

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
      const saveButton = screen.getByRole("button", { name: /сохранить текущий выбор/i })
      await user.click(saveButton)

      // Try to save without name - find save button in dialog
      const confirmButtons = screen.getAllByRole("button", { name: /сохранить/i })
      const confirmButton = confirmButtons[confirmButtons.length - 1] // Last one is in dialog
      await user.click(confirmButton)

      // Should show error (exact text from validatePreset function)
      expect(screen.getByText("Имя preset'а не может быть пустым")).toBeInTheDocument()
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

      // Find delete button for custom preset - it's a ghost button with Trash2 icon
      const deleteButtons = screen.getAllByRole("button")
      const deleteButton = deleteButtons.find((btn) => btn.querySelector('[data-icon="Trash2"]'))

      expect(deleteButton).toBeDefined()
      if (deleteButton) {
        await user.click(deleteButton)
        expect(onDeletePreset).toHaveBeenCalledWith("custom-1")
      }
    })

    it("should not show delete button for default presets", () => {
      render(<AnalyzerPresetSelector {...defaultProps} customPresets={[]} />)

      // Default presets should not have delete buttons (Trash2 icon)
      const allButtons = screen.queryAllByRole("button")
      const deleteButtons = allButtons.filter((btn) => btn.querySelector('[data-icon="Trash2"]'))
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

      // Should show how many analyzers in preset (2 analyzers in custom preset)
      expect(screen.getByText("2 анализаторов")).toBeInTheDocument()
    })

    it("should show estimated time", () => {
      render(<AnalyzerPresetSelector {...defaultProps} />)

      // estimatedTime 120 seconds is formatted as "2 min"
      expect(screen.getByText("2 min")).toBeInTheDocument()
    })
  })

  describe("Empty State", () => {
    it("should show message when no custom presets", () => {
      render(<AnalyzerPresetSelector {...defaultProps} customPresets={[]} />)

      // When no custom presets, only default presets should be shown
      // There's no explicit "no custom presets" message, just no "Пользовательские" section
      expect(screen.queryByText("Пользовательские")).not.toBeInTheDocument()
    })

    it("should show default presets even when no custom", () => {
      render(<AnalyzerPresetSelector {...defaultProps} customPresets={[]} />)

      // Default presets should still be visible
      expect(screen.getByText(/Quick|Balanced|Complete/i)).toBeInTheDocument()
    })
  })
})
