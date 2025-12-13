/**
 * @vitest-environment jsdom
 */
// @ts-nocheck - TODO: Update to use new unified effects types
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { EffectDetail } from "../../components/effect-detail"
import type { BaseEffect } from "../../types"

// Mock для модального окна
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

describe("EffectDetail", () => {
  const mockEffect: BaseEffect = {
    id: "test-effect",
    name: { en: "Test Effect", ru: "Тестовый эффект" },
    description: { en: "Test description", ru: "Тестовое описание" },
    category: "artistic",
    complexity: "low",
    tags: ["popular"],
    parameters: [
      {
        id: "intensity",
        name: { en: "Intensity", ru: "Интенсивность" },
        type: "number",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
      },
    ],
    version: "1.0.0",
  }

  const mockOnApplyEffect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Rendering", () => {
    it("should render the button", () => {
      render(<EffectDetail effect={mockEffect} onApplyEffect={mockOnApplyEffect} />)

      const button = screen.getByRole("button", { name: /детали эффекта/i })
      expect(button).toBeInTheDocument()
    })

    it("should render with outline variant", () => {
      render(<EffectDetail effect={mockEffect} onApplyEffect={mockOnApplyEffect} />)

      const button = screen.getByRole("button", { name: /детали эффекта/i })
      expect(button).toHaveClass("border")
    })

    it("should render with small size", () => {
      render(<EffectDetail effect={mockEffect} onApplyEffect={mockOnApplyEffect} />)

      const button = screen.getByRole("button", { name: /детали эффекта/i })
      expect(button).toHaveClass("h-8")
    })
  })

  describe("Interaction", () => {
    it("should open modal when clicked", async () => {
      const user = userEvent.setup()
      render(<EffectDetail effect={mockEffect} onApplyEffect={mockOnApplyEffect} />)

      const button = screen.getByRole("button", { name: /детали эффекта/i })
      await user.click(button)

      expect(mockOpenModal).toHaveBeenCalledTimes(1)
    })

    it("should pass effect to modal", async () => {
      const user = userEvent.setup()
      render(<EffectDetail effect={mockEffect} onApplyEffect={mockOnApplyEffect} />)

      const button = screen.getByRole("button", { name: /детали эффекта/i })
      await user.click(button)

      expect(mockOpenModal).toHaveBeenCalledWith("effect-detail", {
        effect: mockEffect,
        onApplyEffect: mockOnApplyEffect,
      })
    })

    it("should pass onApplyEffect callback to modal", async () => {
      const user = userEvent.setup()
      const customCallback = vi.fn()
      render(<EffectDetail effect={mockEffect} onApplyEffect={customCallback} />)

      const button = screen.getByRole("button", { name: /детали эффекта/i })
      await user.click(button)

      expect(mockOpenModal).toHaveBeenCalledWith("effect-detail", {
        effect: mockEffect,
        onApplyEffect: customCallback,
      })
    })
  })

  describe("Multiple Clicks", () => {
    it("should handle multiple clicks", async () => {
      const user = userEvent.setup()
      render(<EffectDetail effect={mockEffect} onApplyEffect={mockOnApplyEffect} />)

      const button = screen.getByRole("button", { name: /детали эффекта/i })

      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(mockOpenModal).toHaveBeenCalledTimes(3)
    })

    it("should pass same data on multiple clicks", async () => {
      const user = userEvent.setup()
      render(<EffectDetail effect={mockEffect} onApplyEffect={mockOnApplyEffect} />)

      const button = screen.getByRole("button", { name: /детали эффекта/i })

      await user.click(button)
      const firstCall = mockOpenModal.mock.calls[0]

      await user.click(button)
      const secondCall = mockOpenModal.mock.calls[1]

      expect(firstCall).toEqual(secondCall)
    })
  })

  describe("Different Effects", () => {
    it("should work with different effect objects", async () => {
      const user = userEvent.setup()
      const effect1: BaseEffect = {
        id: "effect-1",
        name: { en: "Effect 1" },
        category: "color-correction",
        complexity: "low",
        parameters: [],
        version: "1.0.0",
      }

      const { rerender } = render(<EffectDetail effect={effect1} onApplyEffect={mockOnApplyEffect} />)

      const button = screen.getByRole("button", { name: /детали эффекта/i })
      await user.click(button)

      expect(mockOpenModal).toHaveBeenCalledWith("effect-detail", {
        effect: effect1,
        onApplyEffect: mockOnApplyEffect,
      })

      const effect2: BaseEffect = {
        id: "effect-2",
        name: { en: "Effect 2" },
        category: "artistic",
        complexity: "high",
        parameters: [],
        version: "1.0.0",
      }

      mockOpenModal.mockClear()
      rerender(<EffectDetail effect={effect2} onApplyEffect={mockOnApplyEffect} />)

      await user.click(button)

      expect(mockOpenModal).toHaveBeenCalledWith("effect-detail", {
        effect: effect2,
        onApplyEffect: mockOnApplyEffect,
      })
    })
  })

  describe("Accessibility", () => {
    it("should be keyboard accessible", async () => {
      const user = userEvent.setup()
      render(<EffectDetail effect={mockEffect} onApplyEffect={mockOnApplyEffect} />)

      const button = screen.getByRole("button", { name: /детали эффекта/i })

      // Focus on button
      await user.tab()
      expect(button).toHaveFocus()

      // Press Enter
      await user.keyboard("{Enter}")
      expect(mockOpenModal).toHaveBeenCalledTimes(1)
    })

    it("should work with Space key", async () => {
      const user = userEvent.setup()
      render(<EffectDetail effect={mockEffect} onApplyEffect={mockOnApplyEffect} />)

      const button = screen.getByRole("button", { name: /детали эффекта/i })

      await user.tab()
      await user.keyboard(" ")

      expect(mockOpenModal).toHaveBeenCalledTimes(1)
    })
  })

  describe("Edge Cases", () => {
    it("should handle effect with minimal properties", async () => {
      const user = userEvent.setup()
      const minimalEffect: BaseEffect = {
        id: "minimal",
        name: { en: "Minimal" },
        category: "artistic",
        complexity: "low",
        parameters: [],
        version: "1.0.0",
      }

      render(<EffectDetail effect={minimalEffect} onApplyEffect={mockOnApplyEffect} />)

      const button = screen.getByRole("button", { name: /детали эффекта/i })
      await user.click(button)

      expect(mockOpenModal).toHaveBeenCalledWith("effect-detail", {
        effect: minimalEffect,
        onApplyEffect: mockOnApplyEffect,
      })
    })

    it("should handle effect with many parameters", async () => {
      const user = userEvent.setup()
      const complexEffect: BaseEffect = {
        ...mockEffect,
        parameters: Array.from({ length: 10 }, (_, i) => ({
          id: `param-${i}`,
          name: { en: `Parameter ${i}` },
          type: "number" as const,
          defaultValue: i,
          min: 0,
          max: 100,
          step: 1,
        })),
      }

      render(<EffectDetail effect={complexEffect} onApplyEffect={mockOnApplyEffect} />)

      const button = screen.getByRole("button", { name: /детали эффекта/i })
      await user.click(button)

      expect(mockOpenModal).toHaveBeenCalledWith("effect-detail", {
        effect: complexEffect,
        onApplyEffect: mockOnApplyEffect,
      })
    })
  })
})
