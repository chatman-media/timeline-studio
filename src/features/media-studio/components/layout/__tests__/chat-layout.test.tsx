/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ChatLayout } from "../chat-layout"

// Создаем мокированный модуль для управления видимостью компонентов
const mockUserSettings = vi.hoisted(() => ({
  isBrowserVisible: true,
  isOptionsVisible: true,
  isTimelineVisible: true,
}))

// Мокаем useUserSettings чтобы контролировать видимость компонентов
vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => mockUserSettings,
}))

// Мокаем зависимости
vi.mock("@/features/project-settings/hooks", () => ({
  useProjectSettings: () => ({
    settings: {
      aspectRatio: {
        value: { width: 1920, height: 1080 },
        update: vi.fn(),
      },
      frameRate: 30,
      resolution: { width: 1920, height: 1080 },
    },
    updateProjectSettings: vi.fn(),
  }),
}))

vi.mock("@/features/browser/components/browser", () => ({
  Browser: () => <div data-testid="browser">Browser</div>,
}))

vi.mock("@/features/video-player/components/video-player", () => ({
  VideoPlayer: () => <div data-testid="video-player">VideoPlayer</div>,
}))

vi.mock("@/features/timeline/components/timeline", () => ({
  Timeline: ({ noChat }: { noChat?: boolean }) => (
    <div data-testid="timeline" data-nochat={noChat}>
      Timeline
    </div>
  ),
}))

vi.mock("@/features/timeline/hooks", () => ({
  useTimeline: () => ({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    zoom: 1,
    setCurrentTime: vi.fn(),
    setDuration: vi.fn(),
    setIsPlaying: vi.fn(),
    setZoom: vi.fn(),
  }),
}))

vi.mock("@/features/options", () => ({
  Options: () => <div data-testid="options">Options</div>,
}))

vi.mock("@/features/ai-chat/components/ai-chat", () => ({
  AiChat: () => <div data-testid="ai-chat">AiChat</div>,
}))

vi.mock("@/features/video-compiler/hooks/use-prerender", () => ({
  usePrerender: () => ({
    isRendering: false,
    progress: 0,
    startPrerender: vi.fn(),
    stopPrerender: vi.fn(),
    clearPrerenderCache: vi.fn(),
  }),
  usePrerenderCache: () => ({
    clearCache: vi.fn(),
    cacheSize: 0,
    totalCacheSize: 0,
  }),
}))

vi.mock("@/features/video-player/components/prerender-controls", () => ({
  PrerenderControls: () => null,
}))

vi.mock("@/domains/video-editing", () => ({
  PlayerProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="player-provider">{children}</div>,
  usePlayer: () => ({
    video: null,
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
  }),
}))

// Создаем мок контекста вне функции
const mockTimelineContext = {
  project: null,
  uiState: {
    selectedClipIds: [],
    selectedTrackId: null,
    zoom: 1,
    scrollPosition: 0,
  },
  isPlaying: false,
  isRecording: false,
  currentTime: 0,
  error: null,
  lastAction: null,
  isReady: true,
  isSaving: false,
}

// Мокаем ResizablePanel компоненты
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanel: ({ children, defaultSize, minSize, maxSize }: any) => (
    <div data-testid="resizable-panel" data-default-size={defaultSize} data-min-size={minSize} data-max-size={maxSize}>
      {children}
    </div>
  ),
  ResizableHandle: () => <div data-testid="resizable-handle" />,
  ResizablePanelGroup: ({ children, direction, autoSaveId }: any) => (
    <div
      data-testid="resizable-panel-group"
      data-direction={direction}
      data-auto-save-id={autoSaveId}
      className="flex h-full w-full"
    >
      {children}
    </div>
  ),
}))

vi.mock("@/features/timeline/providers/timeline-providers", () => ({
  useTimeline: () => ({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    zoom: 1,
    setCurrentTime: vi.fn(),
    setDuration: vi.fn(),
    setIsPlaying: vi.fn(),
    setZoom: vi.fn(),
  }),
}))

describe("ChatLayout", () => {
  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    mockUserSettings.isBrowserVisible = true
    mockUserSettings.isOptionsVisible = true
    mockUserSettings.isTimelineVisible = true
  })

  describe("Основная структура", () => {
    it("должен рендерить все компоненты когда все панели видимы", () => {
      render(<ChatLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })

    it("должен иметь правильную структуру ResizablePanelGroup", () => {
      render(<ChatLayout />)

      const mainPanelGroup = screen.getAllByTestId("resizable-panel-group")[0]
      expect(mainPanelGroup).toHaveAttribute("data-direction", "horizontal")
      expect(mainPanelGroup).toHaveAttribute("data-auto-save-id", "chat-layout-main")
    })
  })

  describe("Случай: все панели скрыты кроме VideoPlayer", () => {
    it("должен рендерить только VideoPlayer когда все панели скрыты", () => {
      mockUserSettings.isBrowserVisible = false
      mockUserSettings.isOptionsVisible = false
      mockUserSettings.isTimelineVisible = false

      render(<ChatLayout />)

      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()
      // AI чат всегда видим в ChatLayout
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })
  })

  describe("Случай: Timeline скрыт", () => {
    beforeEach(() => {
      mockUserSettings.isTimelineVisible = false
    })

    it("должен показывать Browser + VideoPlayer когда Options скрыт", () => {
      mockUserSettings.isOptionsVisible = false

      render(<ChatLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })

    it("должен показывать VideoPlayer + Options когда Browser скрыт", () => {
      mockUserSettings.isBrowserVisible = false

      render(<ChatLayout />)

      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })

    it("должен показывать Browser + VideoPlayer + Options", () => {
      render(<ChatLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })

    it("должен использовать правильные autoSaveId для разных конфигураций", () => {
      const { rerender } = render(<ChatLayout />)

      let panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups.some((pg) => pg.getAttribute("data-auto-save-id") === "chat-layout-3")).toBe(true)

      mockUserSettings.isOptionsVisible = false
      rerender(<ChatLayout />)

      panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups.some((pg) => pg.getAttribute("data-auto-save-id") === "chat-layout-1")).toBe(true)

      mockUserSettings.isOptionsVisible = true
      mockUserSettings.isBrowserVisible = false
      rerender(<ChatLayout />)

      panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups.some((pg) => pg.getAttribute("data-auto-save-id") === "chat-layout-2")).toBe(true)
    })
  })

  describe("Случай: Timeline видим", () => {
    it("должен показывать VideoPlayer + Timeline когда Browser и Options скрыты", () => {
      mockUserSettings.isBrowserVisible = false
      mockUserSettings.isOptionsVisible = false

      render(<ChatLayout />)

      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })

    it("должен показывать Browser + VideoPlayer + Timeline когда Options скрыт", () => {
      mockUserSettings.isOptionsVisible = false

      render(<ChatLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })

    it("должен показывать VideoPlayer + Options + Timeline когда Browser скрыт", () => {
      mockUserSettings.isBrowserVisible = false

      render(<ChatLayout />)

      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })

    it("должен использовать вертикальную ориентацию для основной группы когда Timeline видим", () => {
      mockUserSettings.isBrowserVisible = false
      mockUserSettings.isOptionsVisible = false

      render(<ChatLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      const verticalGroup = panelGroups.find(
        (pg) =>
          pg.getAttribute("data-direction") === "vertical" && pg.getAttribute("data-auto-save-id") === "chat-layout-4",
      )
      expect(verticalGroup).toBeInTheDocument()
    })
  })

  describe("Размеры панелей", () => {
    it("должен устанавливать правильные размеры для главных панелей", () => {
      render(<ChatLayout />)

      const panels = screen.getAllByTestId("resizable-panel")
      const mainLeftPanel = panels.find((p) => p.getAttribute("data-default-size") === "70")
      const mainRightPanel = panels.find((p) => p.getAttribute("data-default-size") === "30")

      expect(mainLeftPanel).toBeInTheDocument()
      expect(mainRightPanel).toBeInTheDocument()
    })

    it("должен устанавливать правильные ограничения размеров", () => {
      render(<ChatLayout />)

      const panels = screen.getAllByTestId("resizable-panel")

      // Проверяем что есть панели с различными ограничениями
      const panelWith20Min = panels.find((p) => p.getAttribute("data-min-size") === "20")
      const panelWith30Min = panels.find((p) => p.getAttribute("data-min-size") === "30")

      expect(panelWith20Min).toBeInTheDocument()
      expect(panelWith30Min).toBeInTheDocument()
    })

    it("должен использовать разные размеры по умолчанию для разных конфигураций", () => {
      // Конфигурация с 3 панелями горизонтально
      mockUserSettings.isTimelineVisible = false

      render(<ChatLayout />)

      const panels = screen.getAllByTestId("resizable-panel")
      const panel25 = panels.filter((p) => p.getAttribute("data-default-size") === "25")
      const panel50 = panels.filter((p) => p.getAttribute("data-default-size") === "50")

      expect(panel25.length).toBeGreaterThan(0)
      expect(panel50.length).toBeGreaterThan(0)
    })
  })

  describe("Обработка ResizableHandle", () => {
    it("должен добавлять ResizableHandle между панелями", () => {
      render(<ChatLayout />)

      const handles = screen.getAllByTestId("resizable-handle")
      expect(handles.length).toBeGreaterThan(0)
    })

    it("должен добавлять правильное количество handles для разных конфигураций", () => {
      const { rerender } = render(<ChatLayout />)

      let handles = screen.getAllByTestId("resizable-handle")
      const fullConfigHandles = handles.length

      // Только VideoPlayer + Timeline
      mockUserSettings.isBrowserVisible = false
      mockUserSettings.isOptionsVisible = false
      rerender(<ChatLayout />)

      handles = screen.getAllByTestId("resizable-handle")
      expect(handles.length).toBeLessThan(fullConfigHandles)
    })
  })

  describe("Вложенные ResizablePanelGroup", () => {
    it("должен создавать вложенные группы для сложных layout", () => {
      render(<ChatLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      // Должно быть минимум 2 группы: основная и вложенная
      expect(panelGroups.length).toBeGreaterThanOrEqual(2)
    })

    it("должен использовать разные autoSaveId для вложенных групп", () => {
      render(<ChatLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      const autoSaveIds = panelGroups.map((pg) => pg.getAttribute("data-auto-save-id"))

      // Проверяем что есть разные ID
      const uniqueIds = new Set(autoSaveIds)
      expect(uniqueIds.size).toBeGreaterThan(1)
    })

    it("должен использовать правильные направления для вложенных групп", () => {
      mockUserSettings.isOptionsVisible = false

      render(<ChatLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      const horizontalGroups = panelGroups.filter((pg) => pg.getAttribute("data-direction") === "horizontal")
      const verticalGroups = panelGroups.filter((pg) => pg.getAttribute("data-direction") === "vertical")

      expect(horizontalGroups.length).toBeGreaterThan(0)
      expect(verticalGroups.length).toBeGreaterThan(0)
    })
  })

  describe("Интеграция с AiChat", () => {
    it("должен всегда показывать AiChat в правой панели", () => {
      const configurations = [
        {
          isBrowserVisible: true,
          isOptionsVisible: true,
          isTimelineVisible: true,
        },
        {
          isBrowserVisible: false,
          isOptionsVisible: true,
          isTimelineVisible: true,
        },
        {
          isBrowserVisible: true,
          isOptionsVisible: false,
          isTimelineVisible: true,
        },
        {
          isBrowserVisible: true,
          isOptionsVisible: true,
          isTimelineVisible: false,
        },
        {
          isBrowserVisible: false,
          isOptionsVisible: false,
          isTimelineVisible: false,
        },
      ]

      configurations.forEach((config) => {
        mockUserSettings.isBrowserVisible = config.isBrowserVisible
        mockUserSettings.isOptionsVisible = config.isOptionsVisible
        mockUserSettings.isTimelineVisible = config.isTimelineVisible

        const { unmount } = render(<ChatLayout />)
        expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
        unmount()
      })
    })

    it("должен размещать AiChat в отдельной панели", () => {
      render(<ChatLayout />)

      const aiChat = screen.getByTestId("ai-chat")
      const parentPanel = aiChat.closest('[data-testid="resizable-panel"]')

      expect(parentPanel).toBeInTheDocument()
      expect(parentPanel).toHaveAttribute("data-default-size", "30")
    })
  })
})
