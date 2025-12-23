/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MediaStudio } from "../"

// Мокаем tauri-logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    info: vi.fn(),
    infoSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
    traceSync: vi.fn(),
  })),
}))

// Мокаем useUserSettings
const mockUseUserSettings = vi.hoisted(() => vi.fn())
vi.mock("@/features/user-settings", () => ({
  useUserSettings: mockUseUserSettings,
  UserSettingsProvider: ({ children }: { children: React.ReactNode }) => <div data-oid="ch1s3q:">{children}</div>,
}))

// Мокаем Timeline и useTimeline
vi.mock("@/features/timeline", () => ({
  TimelineProvider: ({ children }: { children: React.ReactNode }) => <div data-oid="ktudrqw">{children}</div>,
  useTimeline: () => ({
    timelineState: { clips: [], currentTime: 0, duration: 0 },
    addMediaClip: vi.fn(),
    removeClip: vi.fn(),
    updateClip: vi.fn(),
    setCurrentTime: vi.fn(),
  }),
}))

// Мокаем DragDropProvider
vi.mock("@/features/timeline/components/drag-drop-provider", () => ({
  DragDropProvider: ({ children }: { children: React.ReactNode }) => <div data-oid="dragdrop">{children}</div>,
}))

// Мокаем AI Director hooks
vi.mock("@/domains/ai-director/hooks/use-ai-director-events", () => ({
  useAIDirectorEvents: () => ({
    lastProgress: null,
  }),
}))

// Мокаем AnalysisProgressIndicator
vi.mock("@/features/ai-director/components/analysis-progress-indicator", () => ({
  AnalysisProgressIndicator: () => null,
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

// Мокаем useApp для ProjectLoadingOverlay
vi.mock("@/domains/project-management/providers/app-provider", () => ({
  useApp: () => ({
    isConnecting: false,
    connectionError: null,
  }),
}))

// Мокаем useModals
vi.mock("@/domains/system-integration", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domains/system-integration")>()
  return {
    ...actual,
    useModals: () => ({
      activeModal: "none",
      modalData: null,
      isModalOpen: false,
      openModal: vi.fn(),
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
  }
})

// Мокаем TopBar из media-studio
vi.mock("../top-bar/top-bar", () => ({
  TopBar: () => (
    <div data-testid="top-bar" data-oid="bsj:7ux">
      TopBar
    </div>
  ),
}))

// Мокаем ModalContainer - still using old path but component uses new architecture internally
vi.mock("@/features/modals/components", () => ({
  ModalContainer: () => (
    <div data-testid="modal-container" data-oid="hivkaqc">
      ModalContainer
    </div>
  ),
}))

// Мокаем ProjectLoadingOverlay
vi.mock("../project-loading-overlay", () => ({
  ProjectLoadingOverlay: () => (
    <div data-testid="project-loading-overlay" data-oid="gm.0qpd">
      ProjectLoadingOverlay
    </div>
  ),
}))

// Мокаем layouts
vi.mock("../layout", () => ({
  DefaultLayout: () => (
    <div data-testid="default-layout" data-oid="vbpoy_a">
      DefaultLayout
    </div>
  ),

  OptionsLayout: () => (
    <div data-testid="options-layout" data-oid="5qnafmj">
      OptionsLayout
    </div>
  ),

  VerticalLayout: () => (
    <div data-testid="vertical-layout" data-oid="17v7ztz">
      VerticalLayout
    </div>
  ),

  ChatLayout: () => (
    <div data-testid="chat-layout" data-oid="o5yu_wa">
      ChatLayout
    </div>
  ),
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
    render(<MediaStudio data-oid="7:-sdfy" />)

    expect(screen.getByTestId("top-bar")).toBeInTheDocument()
    expect(screen.getByTestId("modal-container")).toBeInTheDocument()
  })

  describe("рендерит правильный layout в зависимости от layoutMode", () => {
    it("рендерит DefaultLayout при layoutMode='default'", () => {
      mockUseUserSettings.mockReturnValue({ layoutMode: "default" })

      render(<MediaStudio data-oid="q73elmn" />)

      expect(screen.getByTestId("default-layout")).toBeInTheDocument()
      expect(screen.queryByTestId("options-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("vertical-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("chat-layout")).not.toBeInTheDocument()
    })

    it("рендерит OptionsLayout при layoutMode='options'", () => {
      mockUseUserSettings.mockReturnValue({ layoutMode: "options" })

      render(<MediaStudio data-oid="xeafgt0" />)

      expect(screen.getByTestId("options-layout")).toBeInTheDocument()
      expect(screen.queryByTestId("default-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("vertical-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("chat-layout")).not.toBeInTheDocument()
    })

    it("рендерит VerticalLayout при layoutMode='vertical'", () => {
      mockUseUserSettings.mockReturnValue({ layoutMode: "vertical" })

      render(<MediaStudio data-oid="6zd1j1k" />)

      expect(screen.getByTestId("vertical-layout")).toBeInTheDocument()
      expect(screen.queryByTestId("default-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("options-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("chat-layout")).not.toBeInTheDocument()
    })

    it("рендерит ChatLayout при layoutMode='chat'", () => {
      mockUseUserSettings.mockReturnValue({ layoutMode: "chat" })

      render(<MediaStudio data-oid="0v9o-_o" />)

      expect(screen.getByTestId("chat-layout")).toBeInTheDocument()
      expect(screen.queryByTestId("default-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("options-layout")).not.toBeInTheDocument()
      expect(screen.queryByTestId("vertical-layout")).not.toBeInTheDocument()
    })
  })

  describe("автозагрузка пользовательских данных", () => {
    it("рендерится во время загрузки пользовательских данных", () => {
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

      const { container } = render(<MediaStudio data-oid="iig5vwq" />)

      // Проверяем что компонент рендерится
      expect(container.querySelector(".flex.flex-col.h-screen.w-screen")).toBeInTheDocument()
    })

    it("рендерится при ошибке загрузки", () => {
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

      const { container } = render(<MediaStudio data-oid="6_p_h44" />)

      // Проверяем что компонент рендерится
      expect(container.querySelector(".flex.flex-col.h-screen.w-screen")).toBeInTheDocument()
    })

    it("рендерится с загруженными данными", () => {
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

      const { container } = render(<MediaStudio data-oid="la4ck4o" />)

      // Проверяем что компонент рендерится
      expect(container.querySelector(".flex.flex-col.h-screen.w-screen")).toBeInTheDocument()
    })
  })

  it("имеет правильную структуру DOM", () => {
    const { container } = render(<MediaStudio data-oid="-p6j0x:" />)

    const mainDiv = container.querySelector(".flex.flex-col.h-screen.w-screen")
    expect(mainDiv).toBeInTheDocument()

    const contentDiv = mainDiv?.querySelector(".flex-1")
    expect(contentDiv).toBeInTheDocument()
  })
})
