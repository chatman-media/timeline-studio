import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ModalType } from "@/domains/system-integration/machines/modal-machine"
import { BaseProviders } from "@/test/test-utils"
import { ModalContainer } from "../modal-container"

// Mock useModal hook
const mockCloseModal = vi.fn()
const mockModalType = vi.fn()
const mockModalData = vi.fn()
const mockIsOpen = vi.fn()

vi.mock("../../services", () => ({
  useModal: () => ({
    modalType: mockModalType(),
    modalData: mockModalData(),
    isOpen: mockIsOpen(),
    closeModal: mockCloseModal,
  }),
}))

// Mock all modal components
vi.mock("@/features/app-state/components/missing-files-modal", () => ({
  MissingFilesModal: () => <div data-testid="missing-files-modal">Missing Files Modal</div>,
}))

vi.mock("@/features/camera-capture", () => ({
  CameraCaptureModal: () => <div data-testid="camera-capture-modal">Camera Capture Modal</div>,
}))

vi.mock("@/features/color-grading/components/controls/color-grading-save-preset-modal", () => ({
  ColorGradingSavePresetModal: () => <div data-testid="color-grading-modal">Color Grading Modal</div>,
}))

vi.mock("@/features/effects/components/effect-detail-modal", () => ({
  EffectDetailModal: () => <div data-testid="effect-detail-modal">Effect Detail Modal</div>,
}))

vi.mock("@/features/export", () => ({
  ExportModal: () => <div data-testid="export-modal">Export Modal</div>,
}))

vi.mock("@/features/fairlight-audio/components/midi/midi-configuration-modal-component", () => ({
  MidiConfigurationModalComponent: () => <div data-testid="midi-configuration-modal">MIDI Configuration Modal</div>,
}))

vi.mock("@/features/fairlight-audio/components/midi/midi-learn-modal", () => ({
  MidiLearnModal: () => <div data-testid="midi-learn-modal">MIDI Learn Modal</div>,
}))

vi.mock("@/features/fairlight-audio/components/midi/midi-mapping-editor-modal", () => ({
  MidiMappingEditorModal: () => <div data-testid="midi-mapping-modal">MIDI Mapping Modal</div>,
}))

vi.mock("@/features/keyboard-shortcuts", () => ({
  KeyboardShortcutsModal: () => <div data-testid="keyboard-shortcuts-modal">Keyboard Shortcuts Modal</div>,
}))

vi.mock("@/features/media/components/cache-settings-modal", () => ({
  CacheSettingsModal: () => <div data-testid="cache-settings-modal">Cache Settings Modal</div>,
}))

vi.mock("@/features/person-identification/components/person-form-modal", () => ({
  PersonFormModal: () => <div data-testid="person-form-modal">Person Form Modal</div>,
}))

vi.mock("@/features/project-settings", () => ({
  ProjectSettingsModal: () => <div data-testid="project-settings-modal">Project Settings Modal</div>,
}))

vi.mock("@/features/subtitles/components/subtitle-ai-tools-modal", () => ({
  SubtitleAIToolsModal: () => <div data-testid="subtitle-ai-tools-modal">Subtitle AI Tools Modal</div>,
}))

vi.mock("@/features/timeline/components/ai-markers/ai-marker-settings-modal", () => ({
  AIMarkerSettingsModal: () => <div data-testid="ai-marker-settings-modal">AI Marker Settings Modal</div>,
}))

vi.mock("@/features/timeline/components/audio-effects-editor-modal", () => ({
  AudioEffectsEditorModal: () => <div data-testid="audio-effects-modal">Audio Effects Modal</div>,
}))

vi.mock("@/features/timeline/components/subtitle-editor-modal", () => ({
  SubtitleEditorModal: () => <div data-testid="subtitle-editor-modal">Subtitle Editor Modal</div>,
}))

vi.mock("@/features/user-settings", () => ({
  UserSettingsModal: () => <div data-testid="user-settings-modal">User Settings Modal</div>,
}))

vi.mock("@/features/video-compiler/components/cache-statistics-modal", () => ({
  CacheStatisticsModal: () => <div data-testid="cache-statistics-modal">Cache Statistics Modal</div>,
}))

vi.mock("@/features/voice-recording", () => ({
  VoiceRecordModal: () => <div data-testid="voice-recording-modal">Voice Recording Modal</div>,
}))

describe("ModalContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockModalType.mockReturnValue("none")
    mockModalData.mockReturnValue(null)
    mockIsOpen.mockReturnValue(false)
  })

  it("should not render dialog when closed", () => {
    render(
      <BaseProviders>
        <ModalContainer />
      </BaseProviders>,
    )

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("should render dialog when opened", () => {
    mockIsOpen.mockReturnValue(true)
    mockModalType.mockReturnValue("project-settings")

    render(
      <BaseProviders>
        <ModalContainer />
      </BaseProviders>,
    )

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("modals.projectSettings.title")).toBeInTheDocument()
  })

  it("should close modal on backdrop click", () => {
    mockIsOpen.mockReturnValue(true)
    mockModalType.mockReturnValue("project-settings")

    render(
      <BaseProviders>
        <ModalContainer />
      </BaseProviders>,
    )

    // Find the close button and click it
    const closeButton = screen.getByRole("button", { name: /close/i })
    fireEvent.click(closeButton)

    expect(mockCloseModal).toHaveBeenCalled()
  })

  describe("Modal Types", () => {
    const modalTestCases: Array<[ModalType, string, string]> = [
      ["project-settings", "project-settings-modal", "modals.projectSettings.title"],
      ["keyboard-shortcuts", "keyboard-shortcuts-modal", "modals.keyboardShortcuts.title"],
      ["user-settings", "user-settings-modal", "modals.userSettings.title"],
      ["camera-capture", "camera-capture-modal", "modals.cameraCapture.title"],
      ["voice-recording", "voice-recording-modal", "modals.voiceRecording.title"],
      ["export", "export-modal", "modals.export.title"],
      ["cache-settings", "cache-settings-modal", "modals.cacheSettings.title"],
      ["cache-statistics", "cache-statistics-modal", "modals.cacheStatistics.title"],
      ["subtitle-editor", "subtitle-editor-modal", "modals.subtitleEditor.titleAdd"],
      ["person-form", "person-form-modal", "modals.personForm.titleAdd"],
      ["missing-files", "missing-files-modal", "modals.missingFiles.title"],
      ["ai-marker-settings", "ai-marker-settings-modal", "modals.aiMarkerSettings.title"],
      ["subtitle-ai-tools", "subtitle-ai-tools-modal", "modals.subtitleAITools.title"],
      ["audio-effects", "audio-effects-modal", "modals.audioEffects.title"],
      ["midi-learn", "midi-learn-modal", "modals.midiLearn.title"],
      ["midi-mapping", "midi-mapping-modal", "modals.midiMapping.title"],
      ["midi-configuration", "midi-configuration-modal", "modals.midiConfiguration.title"],
      ["effect-detail", "effect-detail-modal", "modals.effectDetail.title"],
      ["color-grading", "color-grading-modal", "modals.colorGrading.title"],
    ]

    it.each(modalTestCases)("should render %s modal with correct title", (modalType, testId, title) => {
      mockIsOpen.mockReturnValue(true)
      mockModalType.mockReturnValue(modalType)

      render(
        <BaseProviders>
          <ModalContainer />
        </BaseProviders>,
      )

      expect(screen.getByTestId(testId)).toBeInTheDocument()
      expect(screen.getByText(title)).toBeInTheDocument()
    })
  })

  it("should handle subtitle editor with edit mode", () => {
    mockIsOpen.mockReturnValue(true)
    mockModalType.mockReturnValue("subtitle-editor")
    mockModalData.mockReturnValue({ subtitle: { id: "1", text: "Test" } })

    render(
      <BaseProviders>
        <ModalContainer />
      </BaseProviders>,
    )

    expect(screen.getByText("modals.subtitleEditor.titleEdit")).toBeInTheDocument()
  })

  it("should handle person form with edit mode", () => {
    mockIsOpen.mockReturnValue(true)
    mockModalType.mockReturnValue("person-form")
    mockModalData.mockReturnValue({ person: { id: "1", name: "John" } })

    render(
      <BaseProviders>
        <ModalContainer />
      </BaseProviders>,
    )

    expect(screen.getByText("modals.personForm.titleEdit")).toBeInTheDocument()
  })

  it("should apply custom dialog class from modalData", () => {
    mockIsOpen.mockReturnValue(true)
    mockModalType.mockReturnValue("project-settings")
    mockModalData.mockReturnValue({ dialogClass: "custom-class" })

    render(
      <BaseProviders>
        <ModalContainer />
      </BaseProviders>,
    )

    const dialogElement = screen.getByRole("dialog")
    expect(dialogElement).toHaveClass("custom-class")
  })

  describe("Dialog Classes", () => {
    const classTestCases: Array<[ModalType, string]> = [
      ["camera-capture", "h-[max(600px,min(70vh,800px))]"],
      ["voice-recording", "h-[max(500px,min(60vh,700px))]"],
      ["export", "h-[max(700px,min(80vh,900px))]"],
      ["project-settings", "h-[450px]"],
      ["user-settings", "h-[800px]"],
      ["keyboard-shortcuts", "h-[max(600px,min(70vh,1000px))]"],
      ["cache-settings", "h-[max(700px,min(80vh,900px))]"],
      ["cache-statistics", "h-[max(600px,min(70vh,800px))]"],
      ["subtitle-editor", "h-[max(600px,min(70vh,800px))]"],
      ["person-form", "h-[max(500px,min(60vh,700px))]"],
      ["missing-files", "h-[max(600px,min(70vh,800px))]"],
      ["ai-marker-settings", "h-[max(600px,min(70vh,700px))]"],
      ["subtitle-ai-tools", "h-[max(500px,min(60vh,600px))]"],
      ["audio-effects", "max-w-3xl"],
      ["midi-learn", "sm:max-w-md"],
      ["midi-mapping", "sm:max-w-md"],
      ["midi-configuration", "max-w-2xl"],
      ["effect-detail", "max-w-4xl"],
      ["color-grading", "h-[max(400px,min(50vh,500px))]"],
    ]

    it.each(classTestCases)("should apply correct class for %s modal", (modalType, expectedClass) => {
      mockIsOpen.mockReturnValue(true)
      mockModalType.mockReturnValue(modalType)

      render(
        <BaseProviders>
          <ModalContainer />
        </BaseProviders>,
      )

      const dialogElement = screen.getByRole("dialog")
      expect(dialogElement).toHaveClass(expectedClass)
    })
  })

  it("should render nothing for unknown modal type", () => {
    mockIsOpen.mockReturnValue(true)
    mockModalType.mockReturnValue("unknown-type" as ModalType)

    render(
      <BaseProviders>
        <ModalContainer />
      </BaseProviders>,
    )

    // Should still render dialog but with no content
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.queryByTestId(/modal$/)).not.toBeInTheDocument()
  })

  it("should handle none modal type", () => {
    mockIsOpen.mockReturnValue(true)
    mockModalType.mockReturnValue("none")

    render(
      <BaseProviders>
        <ModalContainer />
      </BaseProviders>,
    )

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    // Title should be empty
    const title = screen.getByRole("heading")
    expect(title.textContent).toBe("")
  })

  it("should apply dark mode classes", () => {
    mockIsOpen.mockReturnValue(true)
    mockModalType.mockReturnValue("project-settings")

    render(
      <BaseProviders>
        <ModalContainer />
      </BaseProviders>,
    )

    const dialogElement = screen.getByRole("dialog")
    expect(dialogElement).toHaveClass("dark:bg-[#1e1e1e]")
  })

  it("should have scrollable content area", () => {
    mockIsOpen.mockReturnValue(true)
    mockModalType.mockReturnValue("project-settings")

    render(
      <BaseProviders>
        <ModalContainer />
      </BaseProviders>,
    )

    const contentArea = screen.getByTestId("project-settings-modal").parentElement
    expect(contentArea).toHaveClass("overflow-auto")
  })
})
