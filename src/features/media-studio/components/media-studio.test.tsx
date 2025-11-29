import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MediaStudio } from "./media-studio"

// Мокаем tauri-logger
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  trace: vi.fn(),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => mockLogger,
}))

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
vi.mock("@/domains/project-management/hooks/use-current-project", () => ({
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

// Мокаем ProjectLoadingOverlay
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

describe("MediaStudio", () => {
  beforeEach(() => {
    vi.clearAllMocks()

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

      expect(mockLogger.info).toHaveBeenCalledWith("Загружаем пользовательские данные...")
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

      expect(mockLogger.error).toHaveBeenCalledWith("Ошибка автозагрузки пользовательских данных", { error })
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

      expect(mockLogger.info).toHaveBeenCalledWith("Загружены пользовательские данные", { loadedData })
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

      expect(mockLogger.info).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  it("имеет правильную структуру DOM", () => {
    const { container } = render(<MediaStudio />)

    const mainDiv = container.querySelector(".flex.flex-col.h-screen.w-screen")
    expect(mainDiv).toBeInTheDocument()

    const contentDiv = mainDiv?.querySelector(".flex-1")
    expect(contentDiv).toBeInTheDocument()
  })
})
