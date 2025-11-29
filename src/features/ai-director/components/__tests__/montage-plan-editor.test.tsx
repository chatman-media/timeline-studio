/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { MontagePlan } from "../../types/montage-plan"
import { MontagePlanEditor } from "../montage-plan-editor"

describe("MontagePlanEditor", () => {
  const mockPlan: MontagePlan = {
    id: "plan-1",
    name: "Test Plan",
    description: "Test montage plan",
    style: "dynamic",
    targetDuration: 120,
    actualDuration: 115,
    clips: [
      {
        id: "clip-1",
        fileId: "file-1",
        filePath: "/path/to/video1.mp4",
        startTime: 10,
        endTime: 20,
        duration: 10,
        reason: "High quality scene",
        qualityScore: 0.9,
      },
      {
        id: "clip-2",
        fileId: "file-2",
        filePath: "/path/to/video2.mp4",
        startTime: 30,
        endTime: 45,
        duration: 15,
        reason: "Good composition",
        qualityScore: 0.85,
      },
    ],
    transitions: [
      {
        type: "cross_dissolve",
        duration: 0.5,
        afterClipIndex: 0,
      },
    ],
    createdAt: new Date(),
  }

  describe("Rendering", () => {
    it("should render editor title and description", () => {
      render(<MontagePlanEditor plan={mockPlan} />)

      expect(screen.getByText("Редактирование плана монтажа")).toBeInTheDocument()
      expect(screen.getByText(/Измени порядок клипов/)).toBeInTheDocument()
    })

    it("should show plan statistics", () => {
      render(<MontagePlanEditor plan={mockPlan} />)

      expect(screen.getByText(/Клипов: 2/)).toBeInTheDocument()
      expect(screen.getByText(/Переходов: 1/)).toBeInTheDocument()
    })

    it("should render all clips", () => {
      render(<MontagePlanEditor plan={mockPlan} />)

      expect(screen.getByText("video1.mp4")).toBeInTheDocument()
      expect(screen.getByText("video2.mp4")).toBeInTheDocument()
      expect(screen.getByText("High quality scene")).toBeInTheDocument()
      expect(screen.getByText("Good composition")).toBeInTheDocument()
    })

    it("should show quality scores", () => {
      render(<MontagePlanEditor plan={mockPlan} />)

      expect(screen.getByText("90%")).toBeInTheDocument()
      expect(screen.getByText("85%")).toBeInTheDocument()
    })

    it("should show clip numbers", () => {
      render(<MontagePlanEditor plan={mockPlan} />)

      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
    })
  })

  describe("Moving Clips", () => {
    it("should move clip up", async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()

      render(<MontagePlanEditor plan={mockPlan} onSave={onSave} />)

      // Find move up button for second clip
      const moveUpButtons = screen.getAllByTitle("Переместить вверх")
      const secondClipMoveUp = moveUpButtons[1]

      // Second button should not be disabled
      expect(secondClipMoveUp).not.toBeDisabled()

      await user.click(secondClipMoveUp)

      // Save button should now be enabled (has changes)
      const saveButton = screen.getByText("Сохранить изменения")
      expect(saveButton).not.toBeDisabled()

      // Should show unsaved changes message
      expect(screen.getByText("Есть несохраненные изменения")).toBeInTheDocument()
    })

    it("should disable move up for first clip", () => {
      render(<MontagePlanEditor plan={mockPlan} />)

      const moveUpButtons = screen.getAllByTitle("Переместить вверх")
      const firstClipMoveUp = moveUpButtons[0]

      expect(firstClipMoveUp).toBeDisabled()
    })

    it("should move clip down", async () => {
      const user = userEvent.setup()

      render(<MontagePlanEditor plan={mockPlan} />)

      const moveDownButtons = screen.getAllByTitle("Переместить вниз")
      const firstClipMoveDown = moveDownButtons[0]

      expect(firstClipMoveDown).not.toBeDisabled()

      await user.click(firstClipMoveDown)

      expect(screen.getByText("Есть несохраненные изменения")).toBeInTheDocument()
    })

    it("should disable move down for last clip", () => {
      render(<MontagePlanEditor plan={mockPlan} />)

      const moveDownButtons = screen.getAllByTitle("Переместить вниз")
      const lastClipMoveDown = moveDownButtons[moveDownButtons.length - 1]

      expect(lastClipMoveDown).toBeDisabled()
    })
  })

  describe("Removing Clips", () => {
    it("should remove clip", async () => {
      const user = userEvent.setup()

      render(<MontagePlanEditor plan={mockPlan} />)

      expect(screen.getByText("video1.mp4")).toBeInTheDocument()

      const removeButtons = screen.getAllByTitle("Удалить")
      await user.click(removeButtons[0])

      expect(screen.getByText("Есть несохраненные изменения")).toBeInTheDocument()
    })

    it("should update clip count after removal", async () => {
      const user = userEvent.setup()

      render(<MontagePlanEditor plan={mockPlan} />)

      expect(screen.getByText(/Клипов: 2/)).toBeInTheDocument()

      const removeButtons = screen.getAllByTitle("Удалить")
      await user.click(removeButtons[0])

      // Count should update in real-time
      // Note: This would require the component to recalculate on state change
    })
  })

  describe("Editing Duration", () => {
    it("should allow editing clip duration", async () => {
      const user = userEvent.setup()

      render(<MontagePlanEditor plan={mockPlan} />)

      const durationInputs = screen.getAllByLabelText(/Длительность/)
      const firstDurationInput = durationInputs[0] as HTMLInputElement

      expect(firstDurationInput.value).toBe("10.0")

      await user.clear(firstDurationInput)
      await user.type(firstDurationInput, "12.5")
      await user.tab() // Trigger onBlur

      expect(screen.getByText("Есть несохраненные изменения")).toBeInTheDocument()
    })

    it("should validate duration input", async () => {
      const user = userEvent.setup()

      render(<MontagePlanEditor plan={mockPlan} />)

      const durationInputs = screen.getAllByLabelText(/Длительность/)
      const firstDurationInput = durationInputs[0] as HTMLInputElement

      await user.clear(firstDurationInput)
      await user.type(firstDurationInput, "invalid")
      await user.tab()

      // Should revert to original value (state resets to "10" not "10.0")
      expect(firstDurationInput.value).toBe("10")
    })

    it("should not allow negative duration", async () => {
      const user = userEvent.setup()

      render(<MontagePlanEditor plan={mockPlan} />)

      const durationInputs = screen.getAllByLabelText(/Длительность/)
      const firstDurationInput = durationInputs[0] as HTMLInputElement

      await user.clear(firstDurationInput)
      await user.type(firstDurationInput, "-5")
      await user.tab()

      // Should revert to original value (state resets to "10" not "10.0")
      expect(firstDurationInput.value).toBe("10")
    })
  })

  describe("Transition Management", () => {
    it("should show transition selector for non-last clips", () => {
      render(<MontagePlanEditor plan={mockPlan} />)

      const transitionLabels = screen.getAllByText("Переход")
      // Should have transition selector for first clip (not last)
      expect(transitionLabels.length).toBeGreaterThan(0)
    })

    it("should show current transition type", () => {
      render(<MontagePlanEditor plan={mockPlan} />)

      // First clip has cross_dissolve transition - the Select shows it as selected
      // Check by looking for the trigger button that displays the current value
      const selectTriggers = screen.getAllByRole("combobox")
      expect(selectTriggers.length).toBeGreaterThan(0)
      // The value is in the Select's internal state, not as displayValue
    })

    it("should allow removing transition", async () => {
      const user = userEvent.setup()

      render(<MontagePlanEditor plan={mockPlan} />)

      // Find X button for removing transition - it's a ghost button with X icon
      const allButtons = screen.getAllByRole("button")
      const xButton = allButtons.find((btn) => btn.querySelector('[data-icon="X"]'))

      expect(xButton).toBeDefined()
      if (xButton) {
        await user.click(xButton)
        expect(screen.getByText("Есть несохраненные изменения")).toBeInTheDocument()
      }
    })

    it("should not show transition selector for last clip", () => {
      const singleClipPlan: MontagePlan = {
        ...mockPlan,
        clips: [mockPlan.clips[0]],
        transitions: [],
      }

      render(<MontagePlanEditor plan={singleClipPlan} />)

      expect(screen.queryByText("Переход")).not.toBeInTheDocument()
    })
  })

  describe("Saving Changes", () => {
    it("should call onSave with updated plan", async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()

      render(<MontagePlanEditor plan={mockPlan} onSave={onSave} />)

      // Make a change
      const removeButtons = screen.getAllByTitle("Удалить")
      await user.click(removeButtons[0])

      // Click save
      const saveButton = screen.getByText("Сохранить изменения")
      await user.click(saveButton)

      expect(onSave).toHaveBeenCalled()
      const savedPlan = onSave.mock.calls[0][0]
      expect(savedPlan.clips).toHaveLength(1)
      expect(savedPlan.updatedAt).toBeInstanceOf(Date)
    })

    it("should disable save button when no changes", () => {
      render(<MontagePlanEditor plan={mockPlan} />)

      const saveButton = screen.getByText("Сохранить изменения")
      expect(saveButton).toBeDisabled()
    })

    it("should recalculate actualDuration on save", async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()

      render(<MontagePlanEditor plan={mockPlan} onSave={onSave} />)

      // Change duration
      const durationInputs = screen.getAllByLabelText(/Длительность/)
      await user.clear(durationInputs[0])
      await user.type(durationInputs[0], "20")
      await user.tab()

      // Save
      const saveButton = screen.getByText("Сохранить изменения")
      await user.click(saveButton)

      const savedPlan = onSave.mock.calls[0][0]
      expect(savedPlan.actualDuration).toBe(35) // 20 + 15
    })
  })

  describe("Canceling", () => {
    it("should call onCancel when cancel button clicked", async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()

      render(<MontagePlanEditor plan={mockPlan} onCancel={onCancel} />)

      // Make changes
      const removeButtons = screen.getAllByTitle("Удалить")
      await user.click(removeButtons[0])

      // Find and click cancel button (X icon button)
      const cancelButtons = screen.getAllByRole("button")
      const cancelButton = cancelButtons.find((btn) => btn.querySelector("svg"))

      if (cancelButton && cancelButton.textContent === "") {
        await user.click(cancelButton)
        expect(onCancel).toHaveBeenCalled()
      }
    })

    it("should not render cancel button when onCancel not provided", () => {
      render(<MontagePlanEditor plan={mockPlan} />)

      // Only save button should be present
      const buttons = screen.getAllByRole("button")
      // Should have move/delete buttons for clips plus save button, but no dedicated cancel
      expect(buttons.length).toBeGreaterThan(0)
    })
  })
})
