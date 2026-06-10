/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AIMarkerSettingsModal } from "../ai-marker-settings-modal"

// Mock dependencies
const mockCloseModal = vi.fn()
const mockModalData = {
  config: null as any,
  onSave: vi.fn(),
}

vi.mock("@/core/hooks", () => ({
  useModals: () => ({
    activeModal: "ai-marker-settings",
    isModalOpen: true,
    modalData: mockModalData,
    openModal: vi.fn(),
    closeModal: mockCloseModal,
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

describe("AIMarkerSettingsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockModalData.config = null
    mockModalData.onSave = vi.fn()
  })

  it("renders with default configuration", () => {
    render(<AIMarkerSettingsModal data-oid="wbwn:jz" />)

    // Check switches
    expect(screen.getByLabelText("Маркеры смены сцен")).toBeChecked()
    expect(screen.getByLabelText("Ключевые моменты")).toBeChecked()
    expect(screen.getByLabelText("Маркеры качества")).not.toBeChecked()
    expect(screen.getByLabelText("Эмоциональные маркеры")).toBeChecked()
    expect(screen.getByLabelText("Группировать близкие маркеры")).toBeChecked()

    // Check sliders - using getAllByText for duplicate values
    expect(screen.getByText("70%")).toBeInTheDocument() // confidence
    expect(screen.getAllByText("2с")).toHaveLength(2) // scene duration and grouping threshold
    // Quality score is not shown when quality markers are disabled
  })

  it("loads initial configuration from modal data", () => {
    mockModalData.config = {
      createSceneMarkers: false,
      createKeyMomentMarkers: false,
      createQualityMarkers: true,
      createEmotionalMarkers: false,
      minConfidence: 0.5,
      minSceneDuration: 5,
      minQualityScore: 90,
      groupNearbyMarkers: false,
      groupingThreshold: 3,
    }

    render(<AIMarkerSettingsModal data-oid="2rc9du:" />)

    // Check switches
    expect(screen.getByLabelText("Маркеры смены сцен")).not.toBeChecked()
    expect(screen.getByLabelText("Ключевые моменты")).not.toBeChecked()
    expect(screen.getByLabelText("Маркеры качества")).toBeChecked()
    expect(screen.getByLabelText("Эмоциональные маркеры")).not.toBeChecked()
    expect(screen.getByLabelText("Группировать близкие маркеры")).not.toBeChecked()

    // Check sliders
    expect(screen.getByText("50%")).toBeInTheDocument() // confidence
    expect(screen.getByText("5с")).toBeInTheDocument() // scene duration
    expect(screen.getByText("90%")).toBeInTheDocument() // quality score
  })

  it("toggles marker type switches", () => {
    render(<AIMarkerSettingsModal data-oid="2dislht" />)

    const sceneSwitch = screen.getByLabelText("Маркеры смены сцен")
    const momentSwitch = screen.getByLabelText("Ключевые моменты")
    const qualitySwitch = screen.getByLabelText("Маркеры качества")
    const emotionSwitch = screen.getByLabelText("Эмоциональные маркеры")

    fireEvent.click(sceneSwitch)
    expect(sceneSwitch).not.toBeChecked()

    fireEvent.click(momentSwitch)
    expect(momentSwitch).not.toBeChecked()

    fireEvent.click(qualitySwitch)
    expect(qualitySwitch).toBeChecked()

    fireEvent.click(emotionSwitch)
    expect(emotionSwitch).not.toBeChecked()
  })

  it("displays confidence slider correctly", () => {
    render(<AIMarkerSettingsModal data-oid="3_v4nak" />)

    // Check that confidence slider is present
    expect(screen.getByText("Минимальная уверенность")).toBeInTheDocument()
    expect(screen.getByText("70%")).toBeInTheDocument()

    // Check that slider role exists
    const sliders = screen.getAllByRole("slider")
    expect(sliders.length).toBeGreaterThan(0)
  })

  it("shows quality score slider only when quality markers are enabled", () => {
    render(<AIMarkerSettingsModal data-oid="ik0ry-d" />)

    // Initially quality markers are disabled
    expect(screen.queryByText("Минимальное качество")).not.toBeInTheDocument()

    // Enable quality markers
    const qualitySwitch = screen.getByLabelText("Маркеры качества")
    fireEvent.click(qualitySwitch)

    // Now quality score slider should be visible
    expect(screen.getByText("Минимальное качество")).toBeInTheDocument()
    expect(screen.getByText("80%")).toBeInTheDocument() // Default quality score
  })

  it("shows grouping threshold slider only when grouping is enabled", () => {
    render(<AIMarkerSettingsModal data-oid="28lwuig" />)

    // Initially grouping is enabled
    expect(screen.getByText("Порог группировки (сек)")).toBeInTheDocument()

    // Disable grouping
    const groupSwitch = screen.getByLabelText("Группировать близкие маркеры")
    fireEvent.click(groupSwitch)

    // Grouping threshold should be hidden
    expect(screen.queryByText("Порог группировки (сек)")).not.toBeInTheDocument()
  })

  it("saves configuration and closes modal", () => {
    render(<AIMarkerSettingsModal data-oid="z_tmq8t" />)

    // Make some changes
    const qualitySwitch = screen.getByLabelText("Маркеры качества")
    fireEvent.click(qualitySwitch)

    const saveButton = screen.getByRole("button", { name: "Сохранить" })
    fireEvent.click(saveButton)

    expect(mockModalData.onSave).toHaveBeenCalledWith({
      createSceneMarkers: true,
      createKeyMomentMarkers: true,
      createQualityMarkers: true, // Changed
      createEmotionalMarkers: true,
      minConfidence: 0.7,
      minSceneDuration: 2,
      minQualityScore: 80,
      groupNearbyMarkers: true,
      groupingThreshold: 2,
    })

    expect(mockCloseModal).toHaveBeenCalled()
  })

  it("cancels without saving", () => {
    render(<AIMarkerSettingsModal data-oid="zpj330." />)

    // Make some changes
    const qualitySwitch = screen.getByLabelText("Маркеры качества")
    fireEvent.click(qualitySwitch)

    const cancelButton = screen.getByRole("button", { name: "Отмена" })
    fireEvent.click(cancelButton)

    expect(mockModalData.onSave).not.toHaveBeenCalled()
    expect(mockCloseModal).toHaveBeenCalled()
  })

  it("handles missing onSave callback gracefully", () => {
    mockModalData.onSave = undefined as any

    render(<AIMarkerSettingsModal data-oid="j0mi-v7" />)

    const saveButton = screen.getByRole("button", { name: "Сохранить" })

    // Should not throw error
    expect(() => fireEvent.click(saveButton)).not.toThrow()
    expect(mockCloseModal).toHaveBeenCalled()
  })

  it("updates all configuration values correctly", () => {
    render(<AIMarkerSettingsModal data-oid="lsls0s4" />)

    // Toggle all switches
    fireEvent.click(screen.getByLabelText("Маркеры смены сцен"))
    fireEvent.click(screen.getByLabelText("Ключевые моменты"))
    fireEvent.click(screen.getByLabelText("Маркеры качества"))
    fireEvent.click(screen.getByLabelText("Эмоциональные маркеры"))
    fireEvent.click(screen.getByLabelText("Группировать близкие маркеры"))

    // Save
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }))

    expect(mockModalData.onSave).toHaveBeenCalledWith({
      createSceneMarkers: false,
      createKeyMomentMarkers: false,
      createQualityMarkers: true,
      createEmotionalMarkers: false,
      minConfidence: 0.7,
      minSceneDuration: 2,
      minQualityScore: 80,
      groupNearbyMarkers: false,
      groupingThreshold: 2,
    })
  })

  it("renders section headers", () => {
    render(<AIMarkerSettingsModal data-oid="qk_xr3g" />)

    expect(screen.getByText("Типы маркеров")).toBeInTheDocument()
    expect(screen.getByText("Параметры фильтрации")).toBeInTheDocument()
    expect(screen.getByText("Группировка маркеров")).toBeInTheDocument()
  })

  it("maintains configuration state between renders", () => {
    const { rerender } = render(<AIMarkerSettingsModal data-oid="748pn56" />)

    // Make changes
    fireEvent.click(screen.getByLabelText("Маркеры качества"))

    // Re-render component
    rerender(<AIMarkerSettingsModal data-oid="d._jzha" />)

    // State should be preserved
    expect(screen.getByLabelText("Маркеры качества")).toBeChecked()
  })
})
