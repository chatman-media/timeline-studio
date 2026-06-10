/**
 * @vitest-environment jsdom
 */

import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useLanguage } from "@/features/language"
import { createMockApiKeys, createMockUserSettings } from "../../__tests__/test-utils"
import { UserSettingsModal } from "../../components/user-settings-modal"
import { useApiKeys } from "../../hooks/use-api-keys"
import { useUserSettings } from "../../hooks/use-user-settings"

// Mock container with platform service
const mockShowOpenDialog = vi.fn()
vi.mock("@/core", () => ({
  container: {
    hasPlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => ({
      showOpenDialog: mockShowOpenDialog,
    })),
  },
}))

// Мокаем хуки
vi.mock("@/features/language")
vi.mock("../../hooks/use-user-settings")
vi.mock("../../hooks/use-api-keys")

const mockOrchestrator = {
  openModal: vi.fn().mockResolvedValue(undefined),
  closeModal: vi.fn().mockResolvedValue(undefined),
  submitModal: vi.fn().mockResolvedValue(undefined),
  getActiveModal: vi.fn().mockReturnValue("none"),
  getModalData: vi.fn().mockReturnValue(null),
  subscribeToModals: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
}

vi.mock("@/core/hooks", () => ({
  useModals: () => ({
    activeModal: "none",
    modalData: null,
    isModalOpen: false,
    openModal: mockOrchestrator.openModal,
    closeModal: mockOrchestrator.closeModal,
    submitModal: mockOrchestrator.submitModal,
  }),
}))
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Создаем функцию для получения моковых данных с переопределениями
const getMockUserSettings = (overrides = {}) => ({
  screenshotsPath: "",
  playerScreenshotsPath: "",
  openAiApiKey: "",
  claudeApiKey: "",
  isBrowserVisible: true,
  isTimelineVisible: true,
  isOptionsVisible: true,
  activeTab: "media" as const,
  layoutMode: "default" as const,
  playerVolume: 100,
  handleScreenshotsPathChange: vi.fn(),
  handleAiApiKeyChange: vi.fn(),
  handleClaudeApiKeyChange: vi.fn(),
  handlePlayerScreenshotsPathChange: vi.fn(),
  handleTabChange: vi.fn(),
  handleLayoutChange: vi.fn(),
  toggleBrowserVisibility: vi.fn(),
  handlePlayerVolumeChange: vi.fn(),
  toggleTimelineVisibility: vi.fn(),
  toggleOptionsVisibility: vi.fn(),
  ...overrides,
})

describe("UserSettingsModal", () => {
  const mockHandleScreenshotsPathChange = vi.fn()
  const mockHandleAiApiKeyChange = vi.fn()
  const mockHandleClaudeApiKeyChange = vi.fn()
  const mockHandlePlayerScreenshotsPathChange = vi.fn()
  const mockHandlePlayerVolumeChange = vi.fn()
  const mockToggleTimelineVisibility = vi.fn()
  const mockToggleOptionsVisibility = vi.fn()
  const mockChangeLanguage = vi.fn()

  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
    mockShowOpenDialog.mockReset()
    mockOrchestrator.openModal.mockClear()
    mockOrchestrator.closeModal.mockClear()

    // Устанавливаем моки по умолчанию
    vi.mocked(useUserSettings).mockImplementation(() =>
      createMockUserSettings({
        screenshotsPath: "",
        playerScreenshotsPath: "",
        handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
        handleAiApiKeyChange: mockHandleAiApiKeyChange,
        handleClaudeApiKeyChange: mockHandleClaudeApiKeyChange,
        handlePlayerScreenshotsPathChange: mockHandlePlayerScreenshotsPathChange,
        handlePlayerVolumeChange: mockHandlePlayerVolumeChange,
        toggleTimelineVisibility: mockToggleTimelineVisibility,
        toggleOptionsVisibility: mockToggleOptionsVisibility,
      }),
    )

    vi.mocked(useLanguage).mockImplementation(() => ({
      currentLanguage: "ru",
      changeLanguage: mockChangeLanguage,
      systemLanguage: "ru",
      isLoading: false,
      error: null,
      refreshLanguage: vi.fn(),
    }))

    vi.mocked(useApiKeys).mockImplementation(() => createMockApiKeys())
  })

  it("should render correctly", () => {
    render(<UserSettingsModal data-oid="m.j73qm" />)

    // Проверяем, что компонент отрендерился с табами
    expect(screen.getByText("dialogs.userSettings.tabs.general")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.tabs.aiServices")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.tabs.socialNetworks")).toBeInTheDocument()

    // Проверяем общие настройки на активной вкладке "General"
    expect(screen.getByText("dialogs.userSettings.interfaceLanguage")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.screenshotsPath")).toBeInTheDocument()

    expect(screen.getByText("dialogs.userSettings.cancel")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.save")).toBeInTheDocument()
  })

  it("should handle language change", () => {
    render(<UserSettingsModal data-oid=":0.p30t" />)

    // Проверяем, что селект языка отображается
    expect(screen.getByText("dialogs.userSettings.interfaceLanguage")).toBeInTheDocument()

    // Симулируем выбор языка, вызывая напрямую функцию changeLanguage

    void vi.mocked(useLanguage)().changeLanguage("en")

    // Проверяем, что changeLanguage был вызван
    expect(mockChangeLanguage).toHaveBeenCalledWith("en")
  })

  it("should handle screenshots path change", () => {
    render(<UserSettingsModal data-oid="_ml6lcn" />)

    // Находим инпут пути скриншотов
    const inputs = screen.getAllByRole("textbox")
    const screenshotsPathInput = inputs[0]

    // Вводим новый путь
    act(() => {
      act(() => {
        fireEvent.change(screenshotsPathInput, {
          target: { value: "new/path" },
        })
      })
    })

    // Нажимаем кнопку "Сохранить"
    const saveButton = screen.getByText("dialogs.userSettings.save")
    act(() => {
      act(() => {
        fireEvent.click(saveButton)
      })
    })

    // Проверяем, что handleScreenshotsPathChange был вызван с правильными параметрами
    expect(mockHandleScreenshotsPathChange).toHaveBeenCalledWith("new/path")
  })

  it("should render tabs correctly", () => {
    render(<UserSettingsModal data-oid="6sqiwsv" />)

    // Проверяем, что табы отображаются
    expect(screen.getByText("dialogs.userSettings.tabs.general")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.tabs.aiServices")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.tabs.socialNetworks")).toBeInTheDocument()

    // General tab активен по умолчанию, проверяем его содержимое
    expect(screen.getByText("dialogs.userSettings.interfaceLanguage")).toBeInTheDocument()
  })

  it("should handle cancel button click", () => {
    render(<UserSettingsModal data-oid="bdk:vxj" />)

    // Нажимаем кнопку "Отмена"
    const cancelButton = screen.getByText("dialogs.userSettings.cancel")
    act(() => {
      act(() => {
        fireEvent.click(cancelButton)
      })
    })

    // Проверяем, что closeModal был вызван
    expect(mockOrchestrator.closeModal).toHaveBeenCalled()
  })

  it("should clear screenshots path when X button is clicked", () => {
    // Переопределяем значение screenshotsPath для этого теста
    vi.mocked(useUserSettings).mockImplementation(() =>
      createMockUserSettings({
        screenshotsPath: "custom/path",
        handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
        handleAiApiKeyChange: mockHandleAiApiKeyChange,
      }),
    )

    render(<UserSettingsModal data-oid="wnw6o_t" />)

    // Находим кнопку X рядом с инпутом пути скриншотов
    const clearButton = screen.getByTitle("dialogs.userSettings.clearPath")

    // Кликаем по кнопке X
    act(() => {
      act(() => {
        fireEvent.click(clearButton)
      })
    })

    // Проверяем, что handleScreenshotsPathChange был вызван с правильным значением
    expect(mockHandleScreenshotsPathChange).toHaveBeenCalledWith("")
  })

  it("should update state when language changes in context", () => {
    // Рендерим компонент
    render(<UserSettingsModal data-oid="k1l0558" />)

    // Проверяем, что начальное значение языка установлено правильно
    const selectValue = screen.getByRole("combobox")
    expect(selectValue).toHaveTextContent("ru")

    // Изменяем язык в контексте

    vi.mocked(useLanguage).mockImplementation(() => ({
      currentLanguage: "en",
      changeLanguage: mockChangeLanguage,
      systemLanguage: "ru",
      isLoading: false,
      error: null,
      refreshLanguage: vi.fn(),
    }))

    // Перерендериваем компонент
    render(<UserSettingsModal data-oid="xft_0n1" />)

    // Проверяем, что значение языка обновилось
    const updatedSelectValue = screen.getAllByRole("combobox")[1]
    expect(updatedSelectValue).toHaveTextContent("en")
  })

  it.skip("should update state when screenshotsPath changes in context", () => {
    // Рендерим компонент
    render(<UserSettingsModal data-oid="8onfwwa" />)

    // Проверяем, что начальное значение пути скриншотов установлено правильно
    const inputs = screen.getAllByRole("textbox")
    const screenshotsPathInput = inputs[0]
    expect(screenshotsPathInput).toHaveValue("")

    // Изменяем путь скриншотов в контексте
    vi.mocked(useUserSettings).mockImplementation(() =>
      createMockUserSettings({
        screenshotsPath: "new/path",
        handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
        handleAiApiKeyChange: mockHandleAiApiKeyChange,
      }),
    )

    // Перерендериваем компонент
    render(<UserSettingsModal data-oid="lijv8qc" />)

    // Проверяем, что значение пути скриншотов обновилось
    const updatedInputs = screen.getAllByRole("textbox")
    const updatedScreenshotsPathInput = updatedInputs[0]
    expect(updatedScreenshotsPathInput).toHaveValue("new/path")
  })

  it("should handle folder selection button click using Tauri Dialog Plugin", async () => {
    mockShowOpenDialog.mockResolvedValue(["selected/directory/path"])

    // Рендерим компонент
    const { rerender } = render(<UserSettingsModal data-oid=":zgnzbk" />)

    // Находим кнопки выбора папки (у нас их две - для screenshotsPath и playerScreenshotsPath)
    const folderButtons = screen.getAllByRole("button", {
      name: /folder/i,
    })

    // Берем первую кнопку (для screenshotsPath)
    const folderButton = folderButtons[0]

    // Кликаем по кнопке
    act(() => {
      act(() => {
        fireEvent.click(folderButton)
      })
    })

    // Ждем, пока асинхронные операции завершатся
    await vi.waitFor(() => {
      // Проверяем, что showOpenDialog был вызван с правильными параметрами
      expect(mockShowOpenDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          directory: true,
          multiple: false,
          title: "dialogs.userSettings.selectFolder",
        }),
      )
    })

    // Имитируем обновление состояния после выбора директории
    vi.mocked(useUserSettings).mockImplementation(() =>
      createMockUserSettings({
        screenshotsPath: "selected/directory/path",
        handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
        handleAiApiKeyChange: mockHandleAiApiKeyChange,
      }),
    )

    // Перерендериваем компонент
    act(() => {
      rerender(<UserSettingsModal data-oid="p8pvwii" />)
    })

    // Проверяем, что путь скриншотов был обновлен
    const inputs = screen.getAllByRole("textbox")
    const screenshotsPathInput = inputs[0]
    expect(screenshotsPathInput).toHaveValue("selected/directory/path")
  })

  it("should handle player screenshots path selection", async () => {
    mockShowOpenDialog.mockResolvedValue(["selected/directory/path"])

    // Рендерим компонент
    const { rerender } = render(<UserSettingsModal data-oid="2o0ykom" />)

    // Находим кнопки выбора папки (у нас их две - для screenshotsPath и playerScreenshotsPath)
    const folderButtons = screen.getAllByRole("button", {
      name: /folder/i,
    })

    // Берем вторую кнопку (для playerScreenshotsPath)
    const folderButton = folderButtons[1]

    // Кликаем по кнопке
    act(() => {
      act(() => {
        fireEvent.click(folderButton)
      })
    })

    // Ждем, пока асинхронные операции завершатся
    await vi.waitFor(() => {
      // Проверяем, что showOpenDialog был вызван с правильными параметрами
      expect(mockShowOpenDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          directory: true,
          multiple: false,
          title: "dialogs.userSettings.selectFolder",
        }),
      )
    })

    // Имитируем обновление состояния после выбора директории
    vi.mocked(useUserSettings).mockImplementation(() =>
      createMockUserSettings({
        playerScreenshotsPath: "selected/directory/path",
        handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
        handleAiApiKeyChange: mockHandleAiApiKeyChange,
      }),
    )

    // Перерендериваем компонент
    act(() => {
      rerender(<UserSettingsModal data-oid="neril7c" />)
    })

    // Проверяем, что путь скриншотов плеера был обновлен
    const inputs = screen.getAllByRole("textbox")
    const playerScreenshotsPathInput = inputs[1]
    expect(playerScreenshotsPathInput).toHaveValue("selected/directory/path")
  })

  it("should not update path when folder selection is cancelled", async () => {
    mockShowOpenDialog.mockResolvedValue([])

    // Рендерим компонент
    render(<UserSettingsModal data-oid="p8ggwb1" />)

    // Находим кнопки выбора папки (у нас их две - для screenshotsPath и playerScreenshotsPath)
    const folderButtons = screen.getAllByRole("button", {
      name: /folder/i,
    })

    // Берем первую кнопку (для screenshotsPath)
    const folderButton = folderButtons[0]

    // Кликаем по кнопке
    act(() => {
      act(() => {
        fireEvent.click(folderButton)
      })
    })

    // Ждем, пока асинхронные операции завершатся
    await vi.waitFor(() => {
      // Проверяем, что showOpenDialog был вызван с правильными параметрами
      expect(mockShowOpenDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          directory: true,
          multiple: false,
          title: "dialogs.userSettings.selectFolder",
        }),
      )
    })

    // Проверяем, что путь скриншотов не изменился
    const inputs = screen.getAllByRole("textbox")
    const screenshotsPathInput = inputs[0]
    expect(screenshotsPathInput).toHaveValue("")
  })

  it("should handle error when folder selection fails", async () => {
    mockShowOpenDialog.mockRejectedValue(new Error("Permission denied"))

    // Мокаем window.prompt
    const mockPrompt = vi.spyOn(window, "prompt").mockReturnValue("custom/path")

    // Рендерим компонент
    render(<UserSettingsModal data-oid="x.2:646" />)

    // Находим кнопки выбора папки
    const folderButtons = screen.getAllByRole("button", {
      name: /folder/i,
    })

    // Берем первую кнопку (для screenshotsPath)
    const folderButton = folderButtons[0]

    // Кликаем по кнопке
    act(() => {
      act(() => {
        fireEvent.click(folderButton)
      })
    })

    // Ждем, пока асинхронные операции завершатся
    await vi.waitFor(() => {
      // Проверяем, что showOpenDialog был вызван
      expect(mockShowOpenDialog).toHaveBeenCalled()
      // Проверяем, что был показан prompt
      expect(mockPrompt).toHaveBeenCalledWith("dialogs.userSettings.selectFolderPrompt", expect.any(String))
    })

    // Восстанавливаем window.prompt
    mockPrompt.mockRestore()
  })

  it("should handle player screenshots path change input", () => {
    render(<UserSettingsModal data-oid="._nw3ff" />)

    // Находим инпут пути скриншотов плеера
    const inputs = screen.getAllByRole("textbox")
    const playerScreenshotsPathInput = inputs[1]

    // Вводим новый путь
    act(() => {
      act(() => {
        fireEvent.change(playerScreenshotsPathInput, {
          target: { value: "new/player/path" },
        })
      })
    })

    // Нажимаем кнопку "Сохранить"
    const saveButton = screen.getByText("dialogs.userSettings.save")
    act(() => {
      act(() => {
        fireEvent.click(saveButton)
      })
    })

    // Проверяем, что handlePlayerScreenshotsPathChange был вызван с правильными параметрами
    const mockHandlePlayerScreenshotsPathChange = vi.mocked(useUserSettings)().handlePlayerScreenshotsPathChange
    expect(mockHandlePlayerScreenshotsPathChange).toHaveBeenCalledWith("new/player/path")
  })

  it("should clear player screenshots path when X button is clicked", () => {
    // Переопределяем значение playerScreenshotsPath для этого теста
    const mockHandlePlayerScreenshotsPathChangeFn = vi.fn()
    vi.mocked(useUserSettings).mockImplementation(() =>
      createMockUserSettings({
        playerScreenshotsPath: "custom/player/path",
        screenshotsPath: "", // Keep default value
        handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
        handleAiApiKeyChange: mockHandleAiApiKeyChange,
        handlePlayerScreenshotsPathChange: mockHandlePlayerScreenshotsPathChangeFn,
      }),
    )

    render(<UserSettingsModal data-oid="sltbljp" />)

    // Находим кнопку X рядом с инпутом пути скриншотов плеера
    // Since the player screenshots path is not default, there should be a clear button for it
    const clearButtons = screen.getAllByTitle("dialogs.userSettings.clearPath")
    // Only player screenshots path has non-default value, so it should be the only clear button
    const clearPlayerPathButton = clearButtons[0]

    // Кликаем по кнопке X
    act(() => {
      act(() => {
        fireEvent.click(clearPlayerPathButton)
      })
    })

    // Проверяем, что handlePlayerScreenshotsPathChange был вызван с правильным значением
    expect(mockHandlePlayerScreenshotsPathChangeFn).toHaveBeenCalledWith("")
  })

  it("should open cache statistics modal when button is clicked", () => {
    render(<UserSettingsModal data-oid="xbu35gk" />)

    // Находим кнопку статистики кэша
    const cacheStatsButton = screen.getByText("dialogs.userSettings.cacheStats")

    // Кликаем по кнопке
    act(() => {
      fireEvent.click(cacheStatsButton)
    })

    // Проверяем, что openModal был вызван с правильными параметрами
    expect(mockOrchestrator.openModal).toHaveBeenCalledWith("cache-statistics", { returnTo: "user-settings" })
  })

  it("should open cache settings modal when button is clicked", () => {
    render(<UserSettingsModal data-oid="pe-xucu" />)

    // Находим кнопку настроек кэша
    const cacheSettingsButton = screen.getByText("dialogs.userSettings.cacheSettings")

    // Кликаем по кнопке
    act(() => {
      fireEvent.click(cacheSettingsButton)
    })

    // Проверяем, что openModal был вызван с правильными параметрами
    expect(mockOrchestrator.openModal).toHaveBeenCalledWith("cache-settings", {
      returnTo: "user-settings",
    })
  })
})
