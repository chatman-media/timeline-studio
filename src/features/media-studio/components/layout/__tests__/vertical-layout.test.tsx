import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { VerticalLayout } from "../vertical-layout"

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
  Timeline: () => <div data-testid="timeline">Timeline</div>,
}))

vi.mock("@/features/options/components/options", () => ({
  Options: () => <div data-testid="options">Options</div>,
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

vi.mock("@/features/panels/components", () => ({
  LeftPanel: () => <div data-testid="left-panel">LeftPanel</div>,
  RightPanel: () => <div data-testid="right-panel">RightPanel</div>,
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

vi.mock("@/features/video-player/services/player-provider", () => ({
  PlayerProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="player-provider">{children}</div>,
  usePlayer: () => ({
    video: null,
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
  }),
}))

// Мокаем ResizablePanel компоненты
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanel: ({ children, defaultSize, minSize, maxSize }: any) => (
    <div
      data-testid="resizable-panel"
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-max-size={maxSize}
      data-panel-group-direction="horizontal"
    >
      {children}
    </div>
  ),
  ResizableHandle: () => <div data-testid="resizable-handle" />,
  ResizablePanelGroup: ({ children, direction, autoSaveId }: any) => (
    <div
      data-testid="resizable-panel-group"
      data-direction={direction}
      data-auto-save-id={autoSaveId}
      data-panel-group-direction={direction}
      className="flex h-full w-full"
    >
      {children}
    </div>
  ),
}))

vi.mock("@/domains/video-editing/providers/timeline-providers", () => ({
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

describe("VerticalLayout", () => {
  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    mockUserSettings.isBrowserVisible = true
    mockUserSettings.isOptionsVisible = true
    mockUserSettings.isTimelineVisible = true
  })

  describe("Основная структура", () => {
    it("должен рендерить все компоненты когда все панели видимы", () => {
      render(<VerticalLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
    })

    it("должен иметь правильную структуру ResizablePanelGroup", () => {
      const { container } = render(<VerticalLayout />)

      const mainPanelGroup = screen.getAllByTestId("resizable-panel-group")[0]
      expect(mainPanelGroup).toHaveAttribute("data-direction", "horizontal")
      expect(mainPanelGroup).toHaveAttribute("data-auto-save-id", "vertical-main-layout")
    })

    it("должен правильно разделять левую и правую части", () => {
      render(<VerticalLayout />)

      const panels = screen.getAllByTestId("resizable-panel")
      const leftPanel = panels.find((p) => p.getAttribute("data-default-size") === "67")
      const rightPanel = panels.find((p) => p.getAttribute("data-default-size") === "33")

      expect(leftPanel).toBeInTheDocument()
      expect(rightPanel).toBeInTheDocument()
    })
  })

  describe("Случай: все панели скрыты", () => {
    it("должен рендерить только VideoPlayer когда все панели скрыты", () => {
      mockUserSettings.isBrowserVisible = false
      mockUserSettings.isOptionsVisible = false
      mockUserSettings.isTimelineVisible = false

      render(<VerticalLayout />)

      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()

      // Не должно быть ResizablePanelGroup когда все скрыто
      expect(screen.queryByTestId("resizable-panel-group")).not.toBeInTheDocument()
    })
  })

  describe("Случай: только один компонент видим", () => {
    it("должен показывать только Options когда Timeline и Browser скрыты", () => {
      mockUserSettings.isBrowserVisible = false
      mockUserSettings.isTimelineVisible = false

      render(<VerticalLayout />)

      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
    })

    it("должен показывать только Timeline когда Browser и Options скрыты", () => {
      mockUserSettings.isBrowserVisible = false
      mockUserSettings.isOptionsVisible = false

      render(<VerticalLayout />)

      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
    })

    it("должен показывать только Browser когда Options и Timeline скрыты", () => {
      mockUserSettings.isOptionsVisible = false
      mockUserSettings.isTimelineVisible = false

      render(<VerticalLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
    })
  })

  describe("Случай: два компонента видимы", () => {
    it("должен показывать Browser + Options когда Timeline скрыт", () => {
      mockUserSettings.isTimelineVisible = false

      render(<VerticalLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()

      // Проверяем autoSaveId
      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups.some((pg) => pg.getAttribute("data-auto-save-id") === "vertical-layout-1")).toBe(true)
    })

    it("должен показывать Options + Timeline когда Browser скрыт", () => {
      mockUserSettings.isBrowserVisible = false

      render(<VerticalLayout />)

      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()

      // Проверяем autoSaveId
      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups.some((pg) => pg.getAttribute("data-auto-save-id") === "vertical-layout-2")).toBe(true)
    })

    it("должен показывать Browser + Timeline когда Options скрыт", () => {
      mockUserSettings.isOptionsVisible = false

      render(<VerticalLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()

      // Проверяем autoSaveId
      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups.some((pg) => pg.getAttribute("data-auto-save-id") === "vertical-layout-3")).toBe(true)
    })
  })

  describe("Размеры панелей", () => {
    it("должен устанавливать правильные размеры для Browser + Options", () => {
      mockUserSettings.isTimelineVisible = false

      render(<VerticalLayout />)

      const panels = screen.getAllByTestId("resizable-panel")

      // В левой части должны быть Browser (35%) и Options (65%)
      const browserPanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "35" && p.querySelector('[data-testid="browser"]'),
      )
      const optionsPanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "65" && p.querySelector('[data-testid="options"]'),
      )

      expect(browserPanel).toBeInTheDocument()
      expect(optionsPanel).toBeInTheDocument()
    })

    it("должен устанавливать правильные размеры для Options + Timeline", () => {
      mockUserSettings.isBrowserVisible = false

      render(<VerticalLayout />)

      const panels = screen.getAllByTestId("resizable-panel")

      // Options должен быть 65%, Timeline 35%
      const optionsPanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "65" && p.querySelector('[data-testid="options"]'),
      )
      const timelinePanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "35" && p.querySelector('[data-testid="timeline"]'),
      )

      expect(optionsPanel).toBeInTheDocument()
      expect(timelinePanel).toBeInTheDocument()
    })

    it("должен устанавливать правильные размеры для Browser + Timeline", () => {
      mockUserSettings.isOptionsVisible = false

      render(<VerticalLayout />)

      const panels = screen.getAllByTestId("resizable-panel")

      // Browser должен быть 30%, Timeline 70%
      const browserPanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "30" && p.querySelector('[data-testid="browser"]'),
      )
      const timelinePanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "70" && p.querySelector('[data-testid="timeline"]'),
      )

      expect(browserPanel).toBeInTheDocument()
      expect(timelinePanel).toBeInTheDocument()
    })

    it("должен устанавливать правильные размеры когда все компоненты видимы", () => {
      render(<VerticalLayout />)

      const panels = screen.getAllByTestId("resizable-panel")

      // Главное разделение: 67% слева, 33% справа
      expect(panels.some((p) => p.getAttribute("data-default-size") === "67")).toBe(true)
      expect(panels.some((p) => p.getAttribute("data-default-size") === "33")).toBe(true)

      // В верхней части слева: Browser 30%, Options 50%
      expect(panels.some((p) => p.getAttribute("data-default-size") === "30")).toBe(true)
      expect(panels.some((p) => p.getAttribute("data-default-size") === "50")).toBe(true)

      // Timeline внизу: 20%
      expect(panels.some((p) => p.getAttribute("data-default-size") === "20")).toBe(true)
    })
  })

  describe("Направление панелей", () => {
    it("должен использовать вертикальное направление для левой части с двумя компонентами", () => {
      mockUserSettings.isTimelineVisible = false

      render(<VerticalLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      const verticalGroup = panelGroups.find(
        (pg) =>
          pg.getAttribute("data-direction") === "vertical" &&
          pg.getAttribute("data-auto-save-id") === "vertical-layout-1",
      )

      expect(verticalGroup).toBeInTheDocument()
    })

    it("должен использовать смешанную структуру когда все компоненты видимы", () => {
      render(<VerticalLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")

      // Должна быть основная горизонтальная группа
      const mainHorizontal = panelGroups.find(
        (pg) =>
          pg.getAttribute("data-direction") === "horizontal" &&
          pg.getAttribute("data-auto-save-id") === "vertical-main-layout",
      )
      expect(mainHorizontal).toBeInTheDocument()

      // Должна быть вертикальная группа внутри
      const innerVertical = panelGroups.find(
        (pg) =>
          pg.getAttribute("data-direction") === "vertical" &&
          pg.getAttribute("data-auto-save-id") === "vertical-layout-4",
      )
      expect(innerVertical).toBeInTheDocument()

      // И горизонтальная группа для Browser + Options
      const innerHorizontal = panelGroups.find(
        (pg) =>
          pg.getAttribute("data-direction") === "horizontal" &&
          pg.getAttribute("data-auto-save-id") === "vertical-layout-4",
      )
      expect(innerHorizontal).toBeInTheDocument()
    })
  })

  describe("ResizableHandle", () => {
    it("должен добавлять handles между панелями", () => {
      render(<VerticalLayout />)

      const handles = screen.getAllByTestId("resizable-handle")
      expect(handles.length).toBeGreaterThan(0)
    })

    it("должен иметь разное количество handles для разных конфигураций", () => {
      const { rerender } = render(<VerticalLayout />)

      let handles = screen.getAllByTestId("resizable-handle")
      const fullConfigHandles = handles.length

      // Только один компонент - нет handles в левой части
      mockUserSettings.isBrowserVisible = false
      mockUserSettings.isOptionsVisible = false
      rerender(<VerticalLayout />)

      handles = screen.getAllByTestId("resizable-handle")
      expect(handles.length).toBeLessThan(fullConfigHandles)
    })
  })

  describe("Ограничения размеров", () => {
    it("должен устанавливать правильные ограничения minSize и maxSize", () => {
      render(<VerticalLayout />)

      const panels = screen.getAllByTestId("resizable-panel")

      // Все панели должны иметь minSize=20
      panels.forEach((panel) => {
        const minSize = panel.getAttribute("data-min-size")
        if (minSize) {
          expect(Number.parseInt(minSize)).toBeGreaterThanOrEqual(20)
        }
      })

      // Проверяем maxSize
      const panelsWith80Max = panels.filter((p) => p.getAttribute("data-max-size") === "80")
      const panelsWith100Max = panels.filter((p) => p.getAttribute("data-max-size") === "100")

      expect(panelsWith80Max.length).toBeGreaterThan(0)
      expect(panelsWith100Max.length).toBeGreaterThan(0)
    })
  })

  describe("Интеграция с VideoPlayer", () => {
    it("должен всегда показывать VideoPlayer в правой панели", () => {
      const configurations = [
        { isBrowserVisible: true, isOptionsVisible: true, isTimelineVisible: true },
        { isBrowserVisible: false, isOptionsVisible: true, isTimelineVisible: true },
        { isBrowserVisible: true, isOptionsVisible: false, isTimelineVisible: true },
        { isBrowserVisible: true, isOptionsVisible: true, isTimelineVisible: false },
        { isBrowserVisible: false, isOptionsVisible: false, isTimelineVisible: false },
      ]

      configurations.forEach((config) => {
        mockUserSettings.isBrowserVisible = config.isBrowserVisible
        mockUserSettings.isOptionsVisible = config.isOptionsVisible
        mockUserSettings.isTimelineVisible = config.isTimelineVisible

        const { unmount } = render(<VerticalLayout />)
        expect(screen.getByTestId("video-player")).toBeInTheDocument()
        unmount()
      })
    })

    it("должен размещать VideoPlayer в правой панели", () => {
      render(<VerticalLayout />)

      const videoPlayer = screen.getByTestId("video-player")
      const parentPanel = videoPlayer.closest('[data-testid="resizable-panel"]')

      expect(parentPanel).toBeInTheDocument()
      // Проверяем что размер либо 33 (с ResizablePanel) либо VideoPlayer без панели когда все скрыто
      const defaultSize = parentPanel?.getAttribute("data-default-size")
      if (defaultSize) {
        expect(defaultSize).toBe("33")
      }
    })
  })

  describe("Дублирование autoSaveId", () => {
    it("должен использовать одинаковый autoSaveId для вложенной горизонтальной группы", () => {
      render(<VerticalLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      const groupsWithSameId = panelGroups.filter((pg) => pg.getAttribute("data-auto-save-id") === "vertical-layout-4")

      // Должно быть 2 группы с одинаковым ID: вертикальная и горизонтальная внутри
      expect(groupsWithSameId).toHaveLength(2)

      // Одна должна быть вертикальной, другая горизонтальной
      const directions = groupsWithSameId.map((g) => g.getAttribute("data-direction"))
      expect(directions).toContain("vertical")
      expect(directions).toContain("horizontal")
    })
  })
})
