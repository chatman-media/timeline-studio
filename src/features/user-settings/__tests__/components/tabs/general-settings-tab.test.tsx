import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useLanguage } from "@/features/language"
import { useModal } from "@/features/modals/services/modal-provider"
import { GeneralSettingsTab } from "../../../components/tabs/general-settings-tab"
import { useUserSettings } from "../../../hooks/use-user-settings"
import { createMockUserSettings } from "../../test-utils"

vi.mock("../../../hooks/use-user-settings")
vi.mock("@/features/modals/services/modal-provider")
vi.mock("@/features/language")
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}))
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))
vi.mock("lucide-react", () => ({
  Database: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      Database
    </span>
  ),
  Folder: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      Folder
    </span>
  ),
  X: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      X
    </span>
  ),
  ChevronDownIcon: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      ChevronDown
    </span>
  ),
  ChevronUpIcon: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      ChevronUp
    </span>
  ),
  CheckIcon: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      Check
    </span>
  ),
  Save: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      Save
    </span>
  ),
}))

vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Mock scrollIntoView which is not available in jsdom
Element.prototype.scrollIntoView = vi.fn()

describe("GeneralSettingsTab", () => {
  const mockHandleScreenshotsPathChange = vi.fn()
  const mockHandlePlayerScreenshotsPathChange = vi.fn()
  const mockOpenModal = vi.fn()
  const mockChangeLanguage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useUserSettings).mockImplementation(() =>
      createMockUserSettings({
        handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
        handlePlayerScreenshotsPathChange: mockHandlePlayerScreenshotsPathChange,
      }),
    )

    vi.mocked(useModal).mockImplementation(() => ({
      openModal: mockOpenModal,
      closeModal: vi.fn(),
      modalType: "none",
      modalData: null,
      isOpen: false,
      submitModal: vi.fn(),
      isConnected: false,
    }))

    vi.mocked(useLanguage).mockImplementation(() => ({
      currentLanguage: "ru",
      changeLanguage: mockChangeLanguage,
      systemLanguage: "ru",
      isLoading: false,
      error: null,
      refreshLanguage: vi.fn(),
    }))
  })

  it("should render all UI elements correctly", () => {
    render(<GeneralSettingsTab />)

    expect(screen.getByText("dialogs.userSettings.interfaceLanguage")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.screenshotsPath")).toBeInTheDocument()
    expect(screen.getByText("Путь для сохранения скриншотов видеоплеера")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.performance.title")).toBeInTheDocument()
    expect(screen.getByText("Статистика кэша")).toBeInTheDocument()
    expect(screen.getByText("Настройки кэша")).toBeInTheDocument()
  })

  it("should handle language selection and console log the change", async () => {
    const consoleSpy = vi.spyOn(console, "log")
    render(<GeneralSettingsTab />)

    const selectTrigger = screen.getByRole("combobox")
    act(() => {
      fireEvent.click(selectTrigger)
    })

    await waitFor(() => {
      // Find the dropdown option (not the one in the trigger)
      const options = screen.getAllByText("language.native.en")
      expect(options.length).toBeGreaterThan(0)
    })

    // Click the dropdown option (the last one is usually the dropdown item)
    const englishOptions = screen.getAllByText("language.native.en")
    const dropdownOption = englishOptions[englishOptions.length - 1]

    act(() => {
      fireEvent.click(dropdownOption)
    })

    expect(consoleSpy).toHaveBeenCalledWith("Applying language change via new system:", "en")
    expect(mockChangeLanguage).toHaveBeenCalledWith("en")
  })

  it("should update selectedLanguage state when language is changed", async () => {
    render(<GeneralSettingsTab />)

    const selectTrigger = screen.getByRole("combobox")
    expect(selectTrigger).toHaveTextContent("ru")

    act(() => {
      fireEvent.click(selectTrigger)
    })

    await waitFor(() => {
      // Find the dropdown option (not the one in the trigger)
      const options = screen.getAllByText("language.native.es")
      expect(options.length).toBeGreaterThan(0)
    })

    // Click the dropdown option (the last one is usually the dropdown item)
    const spanishOptions = screen.getAllByText("language.native.es")
    const dropdownOption = spanishOptions[spanishOptions.length - 1]

    act(() => {
      fireEvent.click(dropdownOption)
    })

    expect(selectTrigger).toHaveTextContent("es")
  })

  it("should handle screenshots path input changes", () => {
    render(<GeneralSettingsTab />)

    const screenshotsInput = screen.getByPlaceholderText("public/screenshots")
    act(() => {
      fireEvent.change(screenshotsInput, { target: { value: "new/screenshots/path" } })
    })

    expect(mockHandleScreenshotsPathChange).toHaveBeenCalledWith("new/screenshots/path")
  })

  it("should handle player screenshots path input changes", () => {
    render(<GeneralSettingsTab />)

    const playerScreenshotsInput = screen.getByPlaceholderText("public/media")
    act(() => {
      fireEvent.change(playerScreenshotsInput, { target: { value: "new/player/path" } })
    })

    expect(mockHandlePlayerScreenshotsPathChange).toHaveBeenCalledWith("new/player/path")
  })

  it("should show clear button for non-default screenshots path", () => {
    vi.mocked(useUserSettings).mockImplementation(() => ({
      screenshotsPath: "custom/screenshots",
      playerScreenshotsPath: "public/media",
      handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
      handlePlayerScreenshotsPathChange: mockHandlePlayerScreenshotsPathChange,
      openAiApiKey: "",
      claudeApiKey: "",
      isBrowserVisible: true,
      isTimelineVisible: true,
      isOptionsVisible: true,
      activeTab: "media",
      layoutMode: "default",
      playerVolume: 100,
      handleAiApiKeyChange: vi.fn(),
      handleClaudeApiKeyChange: vi.fn(),
      handleTabChange: vi.fn(),
      handleLayoutChange: vi.fn(),
      toggleBrowserVisibility: vi.fn(),
      handlePlayerVolumeChange: vi.fn(),
      toggleTimelineVisibility: vi.fn(),
      toggleOptionsVisibility: vi.fn(),
    }))

    render(<GeneralSettingsTab />)

    const clearButton = screen.getByTitle("dialogs.userSettings.clearPath")
    expect(clearButton).toBeInTheDocument()

    act(() => {
      fireEvent.click(clearButton)
    })

    expect(mockHandleScreenshotsPathChange).toHaveBeenCalledWith("public/screenshots")
  })

  it("should handle folder selection for screenshots path", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")
    const mockOpen = open as unknown as ReturnType<typeof vi.fn>
    mockOpen.mockResolvedValue("selected/folder/path")

    render(<GeneralSettingsTab />)

    const folderButtons = screen.getAllByTitle("dialogs.userSettings.selectFolder")
    const screenshotsFolderButton = folderButtons[0]

    act(() => {
      fireEvent.click(screenshotsFolderButton)
    })

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith({
        directory: true,
        multiple: false,
        title: "dialogs.userSettings.selectFolder",
      })
    })

    await waitFor(() => {
      expect(mockHandleScreenshotsPathChange).toHaveBeenCalledWith("selected/folder/path")
    })
  })

  it("should handle folder selection error with prompt fallback", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")
    const mockOpen = open as unknown as ReturnType<typeof vi.fn>
    mockOpen.mockRejectedValue(new Error("Permission denied"))

    const mockPrompt = vi.spyOn(window, "prompt").mockReturnValue("fallback/path")
    const consoleSpy = vi.spyOn(console, "error")

    render(<GeneralSettingsTab />)

    const folderButtons = screen.getAllByTitle("dialogs.userSettings.selectFolder")
    const screenshotsFolderButton = folderButtons[0]

    act(() => {
      fireEvent.click(screenshotsFolderButton)
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Ошибка при выборе директории:", expect.any(Error))
      expect(mockPrompt).toHaveBeenCalledWith("dialogs.userSettings.selectFolderPrompt", "public/screenshots")
      expect(mockHandleScreenshotsPathChange).toHaveBeenCalledWith("fallback/path")
    })

    mockPrompt.mockRestore()
  })

  it("should handle folder selection error for player screenshots with prompt fallback", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")
    const mockOpen = open as unknown as ReturnType<typeof vi.fn>
    mockOpen.mockRejectedValue(new Error("Permission denied"))

    const mockPrompt = vi.spyOn(window, "prompt").mockReturnValue("player/fallback/path")
    const consoleSpy = vi.spyOn(console, "error")

    render(<GeneralSettingsTab />)

    const folderButtons = screen.getAllByTitle("dialogs.userSettings.selectFolder")
    const playerFolderButton = folderButtons[1]

    act(() => {
      fireEvent.click(playerFolderButton)
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Ошибка при выборе директории:", expect.any(Error))
      expect(mockPrompt).toHaveBeenCalledWith("dialogs.userSettings.selectFolderPrompt", "public/media")
      expect(mockHandlePlayerScreenshotsPathChange).toHaveBeenCalledWith("player/fallback/path")
    })

    mockPrompt.mockRestore()
  })

  it("should trim whitespace from prompt input", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")
    const mockOpen = open as unknown as ReturnType<typeof vi.fn>
    mockOpen.mockRejectedValue(new Error("Permission denied"))

    const mockPrompt = vi.spyOn(window, "prompt").mockReturnValue("  path/with/spaces  ")

    render(<GeneralSettingsTab />)

    const folderButtons = screen.getAllByTitle("dialogs.userSettings.selectFolder")
    const playerFolderButton = folderButtons[1]

    act(() => {
      fireEvent.click(playerFolderButton)
    })

    await waitFor(() => {
      expect(mockHandlePlayerScreenshotsPathChange).toHaveBeenCalledWith("path/with/spaces")
    })

    mockPrompt.mockRestore()
  })

  it("should not update path when prompt is cancelled", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")
    const mockOpen = open as unknown as ReturnType<typeof vi.fn>
    mockOpen.mockRejectedValue(new Error("Permission denied"))

    const mockPrompt = vi.spyOn(window, "prompt").mockReturnValue(null)

    render(<GeneralSettingsTab />)

    const folderButtons = screen.getAllByTitle("dialogs.userSettings.selectFolder")
    const playerFolderButton = folderButtons[1]

    act(() => {
      fireEvent.click(playerFolderButton)
    })

    await waitFor(() => {
      expect(mockPrompt).toHaveBeenCalled()
    })

    expect(mockHandlePlayerScreenshotsPathChange).not.toHaveBeenCalled()

    mockPrompt.mockRestore()
  })

  it("should open cache statistics modal", () => {
    render(<GeneralSettingsTab />)

    const cacheStatsButton = screen.getByText("Статистика кэша")
    act(() => {
      fireEvent.click(cacheStatsButton)
    })

    expect(mockOpenModal).toHaveBeenCalledWith("cache-statistics", { returnTo: "user-settings" })
  })

  it("should open cache settings modal", () => {
    render(<GeneralSettingsTab />)

    const cacheSettingsButton = screen.getByText("Настройки кэша")
    act(() => {
      fireEvent.click(cacheSettingsButton)
    })

    expect(mockOpenModal).toHaveBeenCalledWith("cache-settings", { returnTo: "user-settings" })
  })

  it("should render all language options", async () => {
    render(<GeneralSettingsTab />)

    const selectTrigger = screen.getByRole("combobox")
    act(() => {
      fireEvent.click(selectTrigger)
    })

    await waitFor(() => {
      const languages = ["ru", "en", "es", "fr", "de", "pt", "zh", "ja", "ko", "tr"]
      languages.forEach((lang) => {
        // Use getAllByText since the option might appear multiple times (in trigger and dropdown)
        const elements = screen.getAllByText(`language.native.${lang}`)
        expect(elements.length).toBeGreaterThan(0)
      })
    })
  })

  it("should log console message when folder is selected successfully", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")
    const mockOpen = open as unknown as ReturnType<typeof vi.fn>
    mockOpen.mockResolvedValue("new/selected/path")

    const consoleSpy = vi.spyOn(console, "log")

    render(<GeneralSettingsTab />)

    const folderButtons = screen.getAllByTitle("dialogs.userSettings.selectFolder")
    const screenshotsFolderButton = folderButtons[0]

    act(() => {
      fireEvent.click(screenshotsFolderButton)
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Screenshots path updated from folder dialog:", "new/selected/path")
    })
  })

  it("should not update path when folder selection returns array", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")
    const mockOpen = open as unknown as ReturnType<typeof vi.fn>
    mockOpen.mockResolvedValue(["path1", "path2"])

    render(<GeneralSettingsTab />)

    const folderButtons = screen.getAllByTitle("dialogs.userSettings.selectFolder")
    const screenshotsFolderButton = folderButtons[0]

    act(() => {
      fireEvent.click(screenshotsFolderButton)
    })

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalled()
    })

    expect(mockHandleScreenshotsPathChange).not.toHaveBeenCalled()
  })
})
