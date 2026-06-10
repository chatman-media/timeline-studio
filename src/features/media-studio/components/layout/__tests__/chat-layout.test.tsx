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
  Browser: () => (
    <div data-testid="browser" data-oid=":ikaeqx">
      Browser
    </div>
  ),
}))

vi.mock("@/features/video-player/components/video-player", () => ({
  VideoPlayer: () => (
    <div data-testid="video-player" data-oid="ll5.vgp">
      VideoPlayer
    </div>
  ),
}))

vi.mock("@/features/timeline/components/timeline", () => ({
  Timeline: ({ noChat }: { noChat?: boolean }) => (
    <div data-testid="timeline" data-nochat={noChat} data-oid="md-kadt">
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
  Options: () => (
    <div data-testid="options" data-oid="melzj8d">
      Options
    </div>
  ),
}))

vi.mock("@/features/ai-chat/components/ai-chat", () => ({
  AiChat: () => (
    <div data-testid="ai-chat" data-oid="hba-5w9">
      AiChat
    </div>
  ),
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

vi.mock("@timeline-studio/domains/video-editing", () => ({
  PlayerProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="player-provider" data-oid="blx9gza">
      {children}
    </div>
  ),

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
vi.mock("@timeline-studio/ui/components/resizable", () => ({
  ResizablePanel: ({ children, defaultSize, minSize, maxSize }: any) => (
    <div
      data-testid="resizable-panel"
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-max-size={maxSize}
      data-oid="c.yq-h9"
    >
      {children}
    </div>
  ),

  ResizableHandle: () => <div data-testid="resizable-handle" data-oid="g7t-u3e" />,
  ResizablePanelGroup: ({ children, direction, autoSaveId }: any) => (
    <div
      data-testid="resizable-panel-group"
      data-direction={direction}
      data-auto-save-id={autoSaveId}
      className="flex h-full w-full"
      data-oid="wl_0:by"
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
      render(<ChatLayout data-oid="d.g0lsc" />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })

    it("должен иметь правильную структуру ResizablePanelGroup", () => {
      render(<ChatLayout data-oid="zrb:sax" />)

      const mainPanelGroup = screen.getAllByTestId("resizable-panel-group")[0]
      expect(mainPanelGroup).toHaveAttribute("data-direction", "horizontal")
      expect(mainPanelGroup).toHaveAttribute("data-auto-save-id", "group-chat-main")
    })
  })

  describe("Случай: все панели скрыты кроме VideoPlayer", () => {
    it("должен рендерить только VideoPlayer когда все панели скрыты", () => {
      mockUserSettings.isBrowserVisible = false
      mockUserSettings.isOptionsVisible = false
      mockUserSettings.isTimelineVisible = false

      render(<ChatLayout data-oid="hmda1hm" />)

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

      render(<ChatLayout data-oid="4s5a.lw" />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })

    it("должен показывать VideoPlayer + Options когда Browser скрыт", () => {
      mockUserSettings.isBrowserVisible = false

      render(<ChatLayout data-oid="n.rml2x" />)

      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })

    it("должен показывать Browser + VideoPlayer + Options", () => {
      render(<ChatLayout data-oid="luj-eut" />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })

    it("должен использовать правильные autoSaveId для разных конфигураций", () => {
      const { rerender } = render(<ChatLayout data-oid="01v-f.m" />)

      let panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups.some((pg) => pg.getAttribute("data-auto-save-id") === "group-browser-player-options")).toBe(
        true,
      )

      mockUserSettings.isOptionsVisible = false
      rerender(<ChatLayout data-oid="uxps924" />)

      panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups.some((pg) => pg.getAttribute("data-auto-save-id") === "group-browser-player")).toBe(true)

      mockUserSettings.isOptionsVisible = true
      mockUserSettings.isBrowserVisible = false
      rerender(<ChatLayout data-oid="rmdrm_0" />)

      panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups.some((pg) => pg.getAttribute("data-auto-save-id") === "group-player-options")).toBe(true)
    })
  })

  describe("Случай: Timeline видим", () => {
    it("должен показывать VideoPlayer + Timeline когда Browser и Options скрыты", () => {
      mockUserSettings.isBrowserVisible = false
      mockUserSettings.isOptionsVisible = false

      render(<ChatLayout data-oid="eqqetwd" />)

      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })

    it("должен показывать Browser + VideoPlayer + Timeline когда Options скрыт", () => {
      mockUserSettings.isOptionsVisible = false

      render(<ChatLayout data-oid="zuo5qrt" />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })

    it("должен показывать VideoPlayer + Options + Timeline когда Browser скрыт", () => {
      mockUserSettings.isBrowserVisible = false

      render(<ChatLayout data-oid="3zo_f9w" />)

      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
    })

    it("должен использовать вертикальную ориентацию для основной группы когда Timeline видим", () => {
      mockUserSettings.isBrowserVisible = false
      mockUserSettings.isOptionsVisible = false

      render(<ChatLayout data-oid="8.:viuj" />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      const verticalGroup = panelGroups.find(
        (pg) =>
          pg.getAttribute("data-direction") === "vertical" &&
          pg.getAttribute("data-auto-save-id") === "group-player-timeline",
      )
      expect(verticalGroup).toBeInTheDocument()
    })
  })

  describe("Размеры панелей", () => {
    it("должен устанавливать правильные размеры для главных панелей", () => {
      render(<ChatLayout data-oid="_6eemur" />)

      const panels = screen.getAllByTestId("resizable-panel")
      const mainLeftPanel = panels.find((p) => p.getAttribute("data-default-size") === "70")
      const mainRightPanel = panels.find((p) => p.getAttribute("data-default-size") === "30")

      expect(mainLeftPanel).toBeInTheDocument()
      expect(mainRightPanel).toBeInTheDocument()
    })

    it("должен устанавливать правильные ограничения размеров", () => {
      render(<ChatLayout data-oid="33eo5i9" />)

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

      render(<ChatLayout data-oid="urvo1_i" />)

      const panels = screen.getAllByTestId("resizable-panel")
      const panel25 = panels.filter((p) => p.getAttribute("data-default-size") === "25")
      const panel45 = panels.filter((p) => p.getAttribute("data-default-size") === "45")

      expect(panel25.length).toBeGreaterThan(0)
      expect(panel45.length).toBeGreaterThan(0)
    })
  })

  describe("Обработка ResizableHandle", () => {
    it("должен добавлять ResizableHandle между панелями", () => {
      render(<ChatLayout data-oid="73-u.b5" />)

      const handles = screen.getAllByTestId("resizable-handle")
      expect(handles.length).toBeGreaterThan(0)
    })

    it("должен добавлять правильное количество handles для разных конфигураций", () => {
      const { rerender } = render(<ChatLayout data-oid="fxso:9." />)

      let handles = screen.getAllByTestId("resizable-handle")
      const fullConfigHandles = handles.length

      // Только VideoPlayer + Timeline
      mockUserSettings.isBrowserVisible = false
      mockUserSettings.isOptionsVisible = false
      rerender(<ChatLayout data-oid="4:soy04" />)

      handles = screen.getAllByTestId("resizable-handle")
      expect(handles.length).toBeLessThan(fullConfigHandles)
    })
  })

  describe("Вложенные ResizablePanelGroup", () => {
    it("должен создавать вложенные группы для сложных layout", () => {
      render(<ChatLayout data-oid="n5lxw0r" />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      // Должно быть минимум 2 группы: основная и вложенная
      expect(panelGroups.length).toBeGreaterThanOrEqual(2)
    })

    it("должен использовать разные autoSaveId для вложенных групп", () => {
      render(<ChatLayout data-oid=".e1k1jv" />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      const autoSaveIds = panelGroups.map((pg) => pg.getAttribute("data-auto-save-id"))

      // Проверяем что есть разные ID
      const uniqueIds = new Set(autoSaveIds)
      expect(uniqueIds.size).toBeGreaterThan(1)
    })

    it("должен использовать правильные направления для вложенных групп", () => {
      mockUserSettings.isOptionsVisible = false

      render(<ChatLayout data-oid=":3pic3g" />)

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

        const { unmount } = render(<ChatLayout data-oid="tmq1:df" />)
        expect(screen.getByTestId("ai-chat")).toBeInTheDocument()
        unmount()
      })
    })

    it("должен размещать AiChat в отдельной панели", () => {
      render(<ChatLayout data-oid="v5t3pg0" />)

      const aiChat = screen.getByTestId("ai-chat")
      const parentPanel = aiChat.closest('[data-testid="resizable-panel"]')

      expect(parentPanel).toBeInTheDocument()
      expect(parentPanel).toHaveAttribute("data-default-size", "30")
    })
  })
})
