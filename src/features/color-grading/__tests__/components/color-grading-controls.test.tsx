/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ColorGradingControls } from "../../components/controls/color-grading-controls"

// Mock dependencies
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))

const mockOpenModal = vi.fn()
const mockResetAll = vi.fn()
const mockTogglePreview = vi.fn()
const mockApplyToClip = vi.fn()
const mockLoadPreset = vi.fn()
const mockSavePreset = vi.fn()
const mockAutoCorrect = vi.fn()

const mockUseModals = vi.fn()
const mockUseColorGradingContext = vi.fn()

vi.mock("@/domains/system-integration", () => ({
  useModals: () => mockUseModals(),
}))

vi.mock("../../services/color-grading-provider", () => ({
  useColorGradingContext: () => mockUseColorGradingContext(),
}))

vi.mock("../../types/presets", () => ({
  getAllPresetCategories: () => ["cinematic", "creative", "custom"],
}))

describe("ColorGradingControls", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    mockUseModals.mockReturnValue({
      openModal: mockOpenModal,
    })

    mockUseColorGradingContext.mockReturnValue({
      state: {
        previewEnabled: true,
        selectedClip: "clip-123",
      },
      hasChanges: true,
      resetAll: mockResetAll,
      togglePreview: mockTogglePreview,
      applyToClip: mockApplyToClip,
      loadPreset: mockLoadPreset,
      savePreset: mockSavePreset,
      autoCorrect: mockAutoCorrect,
      availablePresets: [
        {
          id: "preset-1",
          name: "Cinematic",
          category: "cinematic",
          description: "Film look",
          isBuiltIn: true,
          data: {},
        },
        {
          id: "preset-2",
          name: "Warm",
          category: "creative",
          description: "Warm tones",
          isBuiltIn: true,
          data: {},
        },
        {
          id: "preset-3",
          name: "My Custom",
          category: "custom",
          isBuiltIn: false,
          data: {},
        },
      ],
      dispatch: vi.fn(),
    })
  })

  it("should render controls container", () => {
    render(<ColorGradingControls />)
    expect(screen.getByTestId("color-grading-controls")).toBeInTheDocument()
  })

  describe("Reset All button", () => {
    it("should render reset all button", () => {
      render(<ColorGradingControls />)
      expect(screen.getByTitle("Reset all color corrections")).toBeInTheDocument()
      expect(screen.getByText("Reset All")).toBeInTheDocument()
    })

    it("should call resetAll when clicked", async () => {
      const user = userEvent.setup()
      render(<ColorGradingControls />)

      await user.click(screen.getByText("Reset All"))
      expect(mockResetAll).toHaveBeenCalledOnce()
    })

    it("should be disabled when no changes", () => {
      mockUseColorGradingContext.mockReturnValueOnce({
        state: { previewEnabled: true, selectedClip: "clip-123" },
        hasChanges: false,
        resetAll: mockResetAll,
        togglePreview: mockTogglePreview,
        applyToClip: mockApplyToClip,
        loadPreset: mockLoadPreset,
        savePreset: mockSavePreset,
        autoCorrect: mockAutoCorrect,
        availablePresets: [],
        dispatch: vi.fn(),
      })

      render(<ColorGradingControls />)
      expect(screen.getByText("Reset All")).toBeDisabled()
    })
  })

  describe("Auto Correct button", () => {
    it("should render auto correct button", () => {
      render(<ColorGradingControls />)
      expect(screen.getByTitle("Automatically adjust levels")).toBeInTheDocument()
      expect(screen.getByText("Auto")).toBeInTheDocument()
    })

    it("should call autoCorrect when clicked", async () => {
      const user = userEvent.setup()
      render(<ColorGradingControls />)

      await user.click(screen.getByText("Auto"))
      expect(mockAutoCorrect).toHaveBeenCalledOnce()
    })
  })

  describe("Load Preset dropdown", () => {
    it("should render load preset button", () => {
      render(<ColorGradingControls />)
      expect(screen.getByTitle("Load color grading preset")).toBeInTheDocument()
      expect(screen.getByText("Load Preset")).toBeInTheDocument()
    })

    it("should open dropdown when clicked", async () => {
      const user = userEvent.setup()
      render(<ColorGradingControls />)

      await user.click(screen.getByText("Load Preset"))

      // Wait for dropdown to open
      await waitFor(() => {
        expect(screen.getByText("Cinematic")).toBeInTheDocument()
        expect(screen.getByText("Warm")).toBeInTheDocument()
        expect(screen.getByText("My Custom")).toBeInTheDocument()
      })
    })

    it("should display presets grouped by category", async () => {
      const user = userEvent.setup()
      render(<ColorGradingControls />)

      await user.click(screen.getByText("Load Preset"))

      await waitFor(() => {
        // Check category labels
        expect(screen.getByText("cinematic")).toBeInTheDocument()
        expect(screen.getByText("creative")).toBeInTheDocument()
        expect(screen.getByText("custom")).toBeInTheDocument()
      })
    })

    it("should call loadPreset when preset is selected", async () => {
      const user = userEvent.setup()
      render(<ColorGradingControls />)

      await user.click(screen.getByText("Load Preset"))
      await waitFor(() => {
        expect(screen.getByText("Cinematic")).toBeInTheDocument()
      })

      await user.click(screen.getByText("Cinematic"))
      expect(mockLoadPreset).toHaveBeenCalledWith("preset-1")
    })

    it("should display preset descriptions", async () => {
      const user = userEvent.setup()
      render(<ColorGradingControls />)

      await user.click(screen.getByText("Load Preset"))

      await waitFor(() => {
        expect(screen.getByText("Film look")).toBeInTheDocument()
        expect(screen.getByText("Warm tones")).toBeInTheDocument()
      })
    })
  })

  describe("Save Preset button", () => {
    it("should render save preset button", () => {
      render(<ColorGradingControls />)
      expect(screen.getByTitle("Save current settings as preset")).toBeInTheDocument()
      expect(screen.getByText("Save Preset")).toBeInTheDocument()
    })

    it("should open modal when clicked", async () => {
      const user = userEvent.setup()
      render(<ColorGradingControls />)

      await user.click(screen.getByText("Save Preset"))
      expect(mockOpenModal).toHaveBeenCalledWith("color-grading", {
        onSave: mockSavePreset,
      })
    })

    it("should be disabled when no changes", () => {
      mockUseColorGradingContext.mockReturnValueOnce({
        state: { previewEnabled: true, selectedClip: "clip-123" },
        hasChanges: false,
        resetAll: mockResetAll,
        togglePreview: mockTogglePreview,
        applyToClip: mockApplyToClip,
        loadPreset: mockLoadPreset,
        savePreset: mockSavePreset,
        autoCorrect: mockAutoCorrect,
        availablePresets: [],
        dispatch: vi.fn(),
      })

      render(<ColorGradingControls />)
      expect(screen.getByText("Save Preset")).toBeDisabled()
    })
  })

  describe("Preview toggle button", () => {
    it("should render preview button with Eye icon when preview enabled", () => {
      render(<ColorGradingControls />)
      expect(screen.getByTitle("Toggle real-time preview")).toBeInTheDocument()
      expect(screen.getByText("Preview")).toBeInTheDocument()
    })

    it("should render EyeOff icon when preview disabled", () => {
      mockUseColorGradingContext.mockReturnValueOnce({
        state: { previewEnabled: false, selectedClip: "clip-123" },
        hasChanges: true,
        resetAll: mockResetAll,
        togglePreview: mockTogglePreview,
        applyToClip: mockApplyToClip,
        loadPreset: mockLoadPreset,
        savePreset: mockSavePreset,
        autoCorrect: mockAutoCorrect,
        availablePresets: [],
        dispatch: vi.fn(),
      })

      render(<ColorGradingControls />)
      expect(screen.getByText("Preview")).toBeInTheDocument()
    })

    it("should toggle preview when clicked", async () => {
      const user = userEvent.setup()
      render(<ColorGradingControls />)

      await user.click(screen.getByText("Preview"))
      expect(mockTogglePreview).toHaveBeenCalledWith(false)
    })
  })

  describe("Apply to Clip button", () => {
    it("should render apply to clip button", () => {
      render(<ColorGradingControls />)
      expect(screen.getByTitle("Apply color grading to selected clip")).toBeInTheDocument()
      expect(screen.getByText("Apply to Clip")).toBeInTheDocument()
    })

    it("should call applyToClip when clicked", async () => {
      const user = userEvent.setup()
      render(<ColorGradingControls />)

      await user.click(screen.getByText("Apply to Clip"))
      expect(mockApplyToClip).toHaveBeenCalledOnce()
    })

    it("should be disabled when no clip selected", () => {
      mockUseColorGradingContext.mockReturnValueOnce({
        state: { previewEnabled: true, selectedClip: null },
        hasChanges: true,
        resetAll: mockResetAll,
        togglePreview: mockTogglePreview,
        applyToClip: mockApplyToClip,
        loadPreset: mockLoadPreset,
        savePreset: mockSavePreset,
        autoCorrect: mockAutoCorrect,
        availablePresets: [],
        dispatch: vi.fn(),
      })

      render(<ColorGradingControls />)
      expect(screen.getByText("Apply to Clip")).toBeDisabled()
    })

    it("should be disabled when no changes", () => {
      mockUseColorGradingContext.mockReturnValueOnce({
        state: { previewEnabled: true, selectedClip: "clip-123" },
        hasChanges: false,
        resetAll: mockResetAll,
        togglePreview: mockTogglePreview,
        applyToClip: mockApplyToClip,
        loadPreset: mockLoadPreset,
        savePreset: mockSavePreset,
        autoCorrect: mockAutoCorrect,
        availablePresets: [],
        dispatch: vi.fn(),
      })

      render(<ColorGradingControls />)
      expect(screen.getByText("Apply to Clip")).toBeDisabled()
    })
  })

  describe("Layout", () => {
    it("should have left and right button groups", () => {
      render(<ColorGradingControls />)
      const container = screen.getByTestId("color-grading-controls")
      const buttonGroups = container.querySelectorAll(".flex.gap-2")

      expect(buttonGroups).toHaveLength(2)
    })

    it("should have proper spacing and alignment", () => {
      render(<ColorGradingControls />)
      const container = screen.getByTestId("color-grading-controls")

      expect(container).toHaveClass("flex")
      expect(container).toHaveClass("justify-between")
      expect(container).toHaveClass("items-center")
    })
  })
})
