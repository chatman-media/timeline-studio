import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createLogger } from "@/lib/tauri-logger"
import { MediaStudio } from "./media-studio"

const logger = createLogger({ module: "MediaStudio.test" })

// Мокаем useUserSettings
const mockUseUserSettings = vi.hoisted(() => vi.fn())
vi.mock("@/features/user-settings", () => ({
  useUserSettings: mockUseUserSettings,
  UserSettingsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Мокаем Timeline и useTimeline
vi.mock("@/features/timeline", () => ({
  TimelineProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTimeline: () => ({
    timelineState: { clips: [], currentTime: 0, duration: 0 },
    addMediaClip: vi.fn(),
    removeClip: vi.fn(),
    updateClip: vi.fn(),
    setCurrentTime: vi.fn(),
  }),
}))

// Мокаем useAutoLoadUserData
const mockUseAutoLoadUserData = vi.hoisted(() => vi.fn())
vi.mock("@/features/media-studio/hooks", () => ({
  useAutoLoadUserData: mockUseAutoLoadUserData,
}))

// Мокаем useCurrentProject
vi.mock("@/features/app-state/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    currentProject: { name: "Test Project" },
    openProject: vi.fn(),
    saveProject: vi.fn(),
    setProjectDirty: vi.fn(),
    createNewProject: vi.fn(),
  }),
}))

// Мокаем useModal
vi.mock("@/features/modals/services/modal-provider", () => ({
  useModal: () => ({
    openModal: vi.fn(),
  }),
}))

// Мокаем TopBar из media-studio
vi.mock("./top-bar/top-bar", () => ({
  TopBar: () => <div data-testid="top-bar">TopBar</div>,
}))

// Мокаем ModalContainer
vi.mock("@/features/modals/components", () => ({
  ModalContainer: () => <div data-testid="modal-container">ModalContainer</div>,
}))

// Мокаем AppStateGuard и ProjectLoadingOverlay
vi.mock("@/features/app-state/components/app-state-guard", () => ({
  AppStateGuard: ({ children }: { children: React.ReactNode }) => <div data-testid="app-state-guard">{children}</div>,
}))

vi.mock("@/features/app-state/components/project-loading-overlay", () => ({
  ProjectLoadingOverlay: () => <div data-testid="project-loading-overlay">ProjectLoadingOverlay</div>,
}))

// Мокаем layouts
vi.mock("./layout", () => ({
  DefaultLayout: () => <div data-testid="default-layout">DefaultLayout</div>,
  OptionsLayout: () => <div data-testid="options-layout">OptionsLayout</div>,
  VerticalLayout: () => <div data-testid="vertical-layout">VerticalLayout</div>,
  ChatLayout: () => <div data-testid="chat-layout">ChatLayout</div>,
}))

// Мокаем console для тестирования логирования
const originalConsoleLog = console.log
const originalConsoleError = console.error
const consoleLogSpy = vi.fn()
const consoleErrorSpy = vi.fn()

describe("MediaStudio", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    console.log = consoleLogSpy
    console.error = consoleErrorSpy

    // Дефолтные значения для моков
    mockUseUserSettings.mockReturnValue({
      layoutMode: "default",
    })

    mockUseAutoLoadUserData.mockReturnValue({
      isLoading: false,
      loadedData: {
        media: 0,
        music: 0,
        effects: 0,
        transitions: 0,
        filters: 0,
        subtitles: 0,
        styleTemplates: 0,
      },
      error: null,
    })
  })

  afterEach(() => {
    console.log = originalConsoleLog
    console.error = originalConsoleError
  })

  it("рендерит основные компоненты", () => {
    render(<MediaStudio />)

    expect(screen.getByTestId("top-bar")).toBeInTheDocument()
    expect(screen.getByTestId("modal-container")).toBeInTheDocument()
  })

  describe("рендерит правильный layout в зависимости от layoutMode", () => {
    it("рендерит DefaultLayout при layoutMode='default'", () => {
      mockUseUserSettings.mockReturnValue({ layoutMode: "default" })

      render(<MediaStudio />)

      expect(screen.getByTestId("default-layout")).toBeInTheDocument()
      expect(screen.queryByTestId("options-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("vertical-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("chat-layout")).not.toBeInTheDocument()
    })

    it("рендерит OptionsLayout при layoutMode='options'", () => {
      mockUseUserSettings.mockReturnValue({ layoutMode: "options" })

      render(<MediaStudio />)

      expect(screen.getByTestId("options-layout")).toBeInTheDocument()
      expect(screen.queryByTestId("default-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("vertical-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("chat-layout")).not.toBeInTheDocument()
    })

    it("рендерит VerticalLayout при layoutMode='vertical'", () => {
      mockUseUserSettings.mockReturnValue({ layoutMode: "vertical" })

      render(<MediaStudio />)

      expect(screen.getByTestId("vertical-layout")).toBeInTheDocument()
      expect(screen.queryByTestId("default-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("options-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("chat-layout")).not.toBeInTheDocument()
    })

    it("рендерит ChatLayout при layoutMode='chat'", () => {
      mockUseUserSettings.mockReturnValue({ layoutMode: "chat" })

      render(<MediaStudio />)

      expect(screen.getByTestId("chat-layout")).toBeInTheDocument()
      expect(screen.queryByTestId("default-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("options-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("vertical-layout")).not.toBeInTheDocument()
    })
  })

  describe("автозагрузка пользовательских данных", () => {
    it("логирует состояние загрузки", () => {
      mockUseAutoLoadUserData.mockReturnValue({
        isLoading: true,
        loadedData: {
          media: 0,
          music: 0,
          effects: 0,
          transitions: 0,
          filters: 0,
          subtitles: 0,
          styleTemplates: 0,
        },
        error: null,
      })

      render(<MediaStudio />)

      expect(consoleLogSpy).toHaveBeenCalledWith("Загружаем пользовательские данные...")
    })

    it("логирует ошибку при неудачной загрузке", () => {
      const error = new Error("Ошибка загрузки")
      mockUseAutoLoadUserData.mockReturnValue({
        isLoading: false,
        loadedData: {
          media: 0,
          music: 0,
          effects: 0,
          transitions: 0,
          filters: 0,
          subtitles: 0,
          styleTemplates: 0,
        },
        error,
      })

      render(<MediaStudio />)

      expect(consoleErrorSpy).toHaveBeenCalledWith("Ошибка автозагрузки пользовательских данных:", error)
    })

    it("логирует загруженные данные когда есть ненулевые значения", () => {
      const loadedData = {
        media: 5,
        music: 3,
        effects: 0,
        transitions: 2,
        filters: 0,
        subtitles: 0,
        styleTemplates: 1,
      }

      mockUseAutoLoadUserData.mockReturnValue({
        isLoading: false,
        loadedData,
        error: null,
      })

      render(<MediaStudio />)

      expect(consoleLogSpy).toHaveBeenCalledWith("Загружены пользовательские данные:", loadedData)
    })

    it("не логирует данные когда все значения нулевые", () => {
      mockUseAutoLoadUserData.mockReturnValue({
        isLoading: false,
        loadedData: {
          media: 0,
          music: 0,
          effects: 0,
          transitions: 0,
          filters: 0,
          subtitles: 0,
          styleTemplates: 0,
        },
        error: null,
      })

      render(<MediaStudio />)

      expect(consoleLogSpy).not.toHaveBeenCalled()
    })
  })

  it("имеет правильную структуру DOM", () => {
    const { container } = render(<MediaStudio />)

    // AppStateGuard обернут в контейнер
    const appStateGuard = container.querySelector('[data-testid="app-state-guard"]')
    expect(appStateGuard).toBeInTheDocument()

    const mainDiv = appStateGuard?.querySelector(".flex.flex-col.h-screen.w-screen")
    expect(mainDiv).toBeInTheDocument()

    const contentDiv = mainDiv?.querySelector(".flex-1")
    expect(contentDiv).toBeInTheDocument()
  })
})
