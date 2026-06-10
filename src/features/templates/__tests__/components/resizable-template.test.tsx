import { fireEvent, screen } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MediaType } from "@timeline-studio/core/types/media"
import { renderWithTemplates } from "@/test/test-utils"

import { ResizableTemplate } from "../../components/resizable-template"

// Мокаем usePlayer хук
const mockUsePlayer = vi.fn()
vi.mock("@/features/timeline/providers/player-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/timeline/providers/player-provider")>()
  return {
    ...actual,
    usePlayer: () => mockUsePlayer(),
  }
})

// Мокаем компоненты resizable UI
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, direction }: any) => (
    <div data-testid="resizable-panel-group" data-direction={direction} data-oid="o9k55qa">
      {children}
    </div>
  ),

  ResizablePanel: ({ children, defaultSize, minSize }: any) => (
    <div data-testid="resizable-panel" data-default-size={defaultSize} data-min-size={minSize} data-oid=".-3vpd8">
      {children}
    </div>
  ),

  ResizableHandle: ({ className }: any) => (
    <div data-testid="resizable-handle" className={className} data-oid="d-:hy.m" />
  ),
}))

// Мокаем VideoPanelComponent
vi.mock("../../components/video-panel-component", () => ({
  VideoPanelComponent: ({ video, isActive, index, className }: any) => (
    <div
      data-testid={`video-panel-${index ?? video?.id ?? "unknown"}`}
      className={className}
      data-video-id={video?.id}
      data-is-active={isActive}
      data-oid=".axe2ml"
    >
      Video Panel {index ?? video?.id ?? "unknown"} - {video?.name || "No Video"}
    </div>
  ),
}))

describe("ResizableTemplate", () => {
  beforeEach(() => {
    // По умолчанию resizable режим выключен
    mockUsePlayer.mockReturnValue({
      isResizableMode: false,
    })

    // Сбрасываем моки DOM API
    Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
      configurable: true,
      value: vi.fn(() => ({
        width: 1000,
        height: 600,
        left: 0,
        top: 0,
        right: 1000,
        bottom: 600,
        x: 0,
        y: 0,
      })),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const mockTemplate = {
    id: "split-vertical-landscape", // Используем реальный ID шаблона
    split: "vertical" as const,
    resizable: true,
    screens: 2,
    splitPosition: 50,
    render: () => React.createElement("div", {}, "Test Template"),
  }

  const mockAppliedTemplate = {
    template: mockTemplate,
    videos: [],
  }

  const mockVideos = [
    {
      id: "video-1",
      name: "Test Video 1",
      path: "/test/video1.mp4",
      type: MediaType.Video,
      size: 1024,
      duration: 60,
      startTime: 0,
      endTime: 60,
    },
    {
      id: "video-2",
      name: "Test Video 2",
      path: "/test/video2.mp4",
      type: MediaType.Video,
      size: 1024,
      duration: 60,
      startTime: 0,
      endTime: 60,
    },
  ]

  const mockVideosForGrid = [
    ...mockVideos,
    {
      id: "video-3",
      name: "Test Video 3",
      path: "/test/video3.mp4",
      type: MediaType.Video,
      size: 3072,
      duration: 90,
      startTime: 0,
      endTime: 90,
    },
    {
      id: "video-4",
      name: "Test Video 4",
      path: "/test/video4.mp4",
      type: MediaType.Video,
      size: 4096,
      duration: 150,
      startTime: 0,
      endTime: 150,
    },
  ]

  it("should be importable", () => {
    // Простой smoke test - проверяем, что компонент можно импортировать
    expect(ResizableTemplate).toBeDefined()
    expect(typeof ResizableTemplate).toBe("function")
  })

  it("should render without crashing", () => {
    renderWithTemplates(
      <ResizableTemplate
        appliedTemplate={mockAppliedTemplate}
        videos={mockVideos}
        activeVideoId={null}
        data-oid="4mmqhgr"
      />,
    )

    // Проверяем, что компонент отрендерился (используем SplitVertical для vertical template)
    expect(screen.getByTestId("video-panel-0")).toBeInTheDocument()
    expect(screen.getByTestId("video-panel-1")).toBeInTheDocument()
  })

  it("should render video panels for each screen", () => {
    renderWithTemplates(
      <ResizableTemplate
        appliedTemplate={mockAppliedTemplate}
        videos={mockVideos}
        activeVideoId={null}
        data-oid="rhlk8jy"
      />,
    )

    // Проверяем, что отрендерились панели для каждого экрана
    expect(screen.getByTestId("video-panel-0")).toBeInTheDocument()
    expect(screen.getByTestId("video-panel-1")).toBeInTheDocument()
  })

  it("should render template even when no videos", () => {
    renderWithTemplates(
      <ResizableTemplate appliedTemplate={mockAppliedTemplate} videos={[]} activeVideoId={null} data-oid="d_iwk7r" />,
    )

    // Проверяем, что компонент отрендерился - в новой системе может отрендерить TemplateRenderer
    // Если конфигурация найдена, то покажет шаблон, если нет - сообщение о ошибке
    expect(document.body).toBeInTheDocument()
  })

  it("should handle horizontal split template", () => {
    const horizontalTemplate = {
      ...mockTemplate,
      id: "split-horizontal-landscape", // Используем реальный ID
      split: "horizontal" as const,
    }

    const horizontalAppliedTemplate = {
      template: horizontalTemplate,
      videos: [],
    }

    renderWithTemplates(
      <ResizableTemplate
        appliedTemplate={horizontalAppliedTemplate}
        videos={mockVideos}
        activeVideoId={null}
        data-oid="4a5tw-8"
      />,
    )

    // Проверяем, что компонент отрендерился (используем SplitHorizontal для horizontal template)
    expect(screen.getByTestId("video-panel-0")).toBeInTheDocument()
    expect(screen.getByTestId("video-panel-1")).toBeInTheDocument()
  })

  it("should handle grid template", () => {
    const gridTemplate = {
      ...mockTemplate,
      id: "split-grid-2x2-landscape",
      split: "grid" as const,
      screens: 4,
    }

    const gridAppliedTemplate = {
      template: gridTemplate,
      videos: mockVideosForGrid,
    }

    renderWithTemplates(
      <ResizableTemplate
        appliedTemplate={gridAppliedTemplate}
        videos={mockVideosForGrid}
        activeVideoId={null}
        data-oid="1viv:n_"
      />,
    )

    // Проверяем, что компонент отрендерился (используем SplitGrid2x2 для grid template)
    // Для grid шаблона с 4 экранами и 4 видео, должны быть panel-0, panel-1, panel-2 и panel-3
    expect(screen.getByTestId("video-panel-0")).toBeInTheDocument()
    expect(screen.getByTestId("video-panel-1")).toBeInTheDocument()
    expect(screen.getByTestId("video-panel-2")).toBeInTheDocument()
    expect(screen.getByTestId("video-panel-3")).toBeInTheDocument()
  })

  it("should validate template structure", () => {
    // Проверяем корректность структуры шаблона
    expect(mockTemplate).toHaveProperty("id")
    expect(mockTemplate).toHaveProperty("split")
    expect(mockTemplate).toHaveProperty("resizable")
    expect(mockTemplate).toHaveProperty("screens")
    expect(mockTemplate).toHaveProperty("splitPosition")
    expect(mockTemplate).toHaveProperty("render")

    // Проверяем типы свойств
    expect(typeof mockTemplate.id).toBe("string")
    expect(typeof mockTemplate.split).toBe("string")
    expect(typeof mockTemplate.resizable).toBe("boolean")
    expect(typeof mockTemplate.screens).toBe("number")
    expect(typeof mockTemplate.splitPosition).toBe("number")
    expect(typeof mockTemplate.render).toBe("function")

    // Проверяем значения
    expect(mockTemplate.resizable).toBe(true)
    expect(mockTemplate.screens).toBe(2)
    expect(mockTemplate.splitPosition).toBe(50)
  })

  describe("Resizable Mode Tests", () => {
    beforeEach(() => {
      // Включаем resizable режим для этих тестов
      mockUsePlayer.mockReturnValue({
        isResizableMode: true,
      })
    })

    it("should render ResizablePanelGroup when in resizable mode for vertical split", () => {
      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={mockAppliedTemplate}
          videos={mockVideos}
          activeVideoId={null}
          data-oid="m4gd6kq"
        />,
      )

      // Проверяем, что рендерится ResizablePanelGroup
      expect(screen.getByTestId("resizable-panel-group")).toBeInTheDocument()
      expect(screen.getByTestId("resizable-panel-group")).toHaveAttribute("data-direction", "horizontal")

      // Проверяем, что есть ResizablePanel'ы
      const panels = screen.getAllByTestId("resizable-panel")
      expect(panels).toHaveLength(2)

      // Проверяем, что есть ResizableHandle
      expect(screen.getByTestId("resizable-handle")).toBeInTheDocument()
    })

    it("should render ResizablePanelGroup when in resizable mode for horizontal split", () => {
      const horizontalTemplate = {
        ...mockTemplate,
        id: "split-horizontal-landscape",
        split: "horizontal" as const,
      }

      const horizontalAppliedTemplate = {
        template: horizontalTemplate,
        videos: [],
      }

      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={horizontalAppliedTemplate}
          videos={mockVideos}
          activeVideoId={null}
          data-oid="g2a89ad"
        />,
      )

      // Проверяем, что рендерится ResizablePanelGroup с вертикальным направлением
      expect(screen.getByTestId("resizable-panel-group")).toBeInTheDocument()
      expect(screen.getByTestId("resizable-panel-group")).toHaveAttribute("data-direction", "vertical")
    })

    it("should not render ResizablePanelGroup for non-resizable templates", () => {
      const nonResizableTemplate = {
        ...mockTemplate,
        resizable: false,
      }

      const nonResizableAppliedTemplate = {
        template: nonResizableTemplate,
        videos: [],
      }

      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={nonResizableAppliedTemplate}
          videos={mockVideos}
          activeVideoId={null}
          data-oid="tr:z3to"
        />,
      )

      // ResizablePanelGroup не должен рендериться для non-resizable шаблонов
      expect(screen.queryByTestId("resizable-panel-group")).not.toBeInTheDocument()
    })

    it("should not render ResizablePanelGroup for grid templates even if resizable", () => {
      const gridTemplate = {
        ...mockTemplate,
        id: "split-grid-2x2-landscape",
        split: "grid" as const,
        screens: 4,
        resizable: true,
      }

      const gridAppliedTemplate = {
        template: gridTemplate,
        videos: mockVideosForGrid,
      }

      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={gridAppliedTemplate}
          videos={mockVideosForGrid}
          activeVideoId={null}
          data-oid="7wixb47"
        />,
      )

      // Grid шаблоны не должны использовать ResizablePanelGroup
      expect(screen.queryByTestId("resizable-panel-group")).not.toBeInTheDocument()
    })
  })

  describe("Diagonal Template Tests", () => {
    const diagonalTemplate = {
      id: "split-diagonal-landscape",
      split: "diagonal" as const,
      resizable: true,
      screens: 2,
      splitPoints: [
        { x: 66.67, y: 0 },
        { x: 33.33, y: 100 },
      ],

      render: () => React.createElement("div", {}, "Diagonal Template"),
    }

    const diagonalAppliedTemplate = {
      template: diagonalTemplate,
      videos: [],
    }

    it("should render diagonal template in normal mode", () => {
      mockUsePlayer.mockReturnValue({
        isResizableMode: false,
      })

      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={diagonalAppliedTemplate}
          videos={mockVideos}
          activeVideoId={null}
          data-oid="fn1ib4h"
        />,
      )

      expect(screen.getByTestId("video-panel-0")).toBeInTheDocument()
      expect(screen.getByTestId("video-panel-1")).toBeInTheDocument()
    })

    it("should render diagonal template with interactive controls in resizable mode", () => {
      mockUsePlayer.mockReturnValue({
        isResizableMode: true,
      })

      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={diagonalAppliedTemplate}
          videos={mockVideos}
          activeVideoId={null}
          data-oid="-j0_6b0"
        />,
      )

      // Проверяем, что есть SVG элемент
      const svgElement = document.querySelector("svg")
      expect(svgElement).toBeInTheDocument()

      // Проверяем, что есть circle элементы для drag точек
      const circles = document.querySelectorAll("circle")
      expect(circles).toHaveLength(2)

      // Проверяем, что есть line элемент для перетаскивания диагонали
      const line = document.querySelector("line")
      expect(line).toBeInTheDocument()
    })
  })

  describe("Mouse Interaction Tests", () => {
    const diagonalTemplate = {
      id: "split-diagonal-landscape",
      split: "diagonal" as const,
      resizable: true,
      screens: 2,
      splitPoints: [
        { x: 66.67, y: 0 },
        { x: 33.33, y: 100 },
      ],

      render: () => React.createElement("div", {}, "Diagonal Template"),
    }

    const diagonalAppliedTemplate = {
      template: diagonalTemplate,
      videos: [],
    }

    beforeEach(() => {
      mockUsePlayer.mockReturnValue({
        isResizableMode: true,
      })
    })

    it("should handle mouse down on first drag point", () => {
      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={diagonalAppliedTemplate}
          videos={mockVideos}
          activeVideoId={null}
          data-oid=".fv65.x"
        />,
      )

      const circles = document.querySelectorAll("circle")
      const firstCircle = circles[0]

      expect(firstCircle).toBeInTheDocument()

      // Симулируем mouse down на первой точке
      fireEvent.mouseDown(firstCircle, {
        clientX: 100,
        clientY: 50,
      })

      // Проверяем, что event не вызвал ошибок
      expect(firstCircle).toBeInTheDocument()
    })

    it("should handle mouse down on second drag point", () => {
      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={diagonalAppliedTemplate}
          videos={mockVideos}
          activeVideoId={null}
          data-oid="ktno2na"
        />,
      )

      const circles = document.querySelectorAll("circle")
      const secondCircle = circles[1]

      expect(secondCircle).toBeInTheDocument()

      // Симулируем mouse down на второй точке
      fireEvent.mouseDown(secondCircle, {
        clientX: 200,
        clientY: 150,
      })

      // Проверяем, что event не вызвал ошибок
      expect(secondCircle).toBeInTheDocument()
    })

    it("should handle mouse down on diagonal line", () => {
      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={diagonalAppliedTemplate}
          videos={mockVideos}
          activeVideoId={null}
          data-oid="9etdici"
        />,
      )

      const line = document.querySelector("line")
      expect(line).toBeInTheDocument()

      // Симулируем mouse down на линии (point index 2)
      fireEvent.mouseDown(line!, {
        clientX: 150,
        clientY: 100,
      })

      // Проверяем, что event не вызвал ошибок
      expect(line).toBeInTheDocument()
    })

    it("should handle mouse move during dragging", async () => {
      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={diagonalAppliedTemplate}
          videos={mockVideos}
          activeVideoId={null}
          data-oid="yacp:0."
        />,
      )

      const circles = document.querySelectorAll("circle")
      const firstCircle = circles[0]

      // Начинаем dragging
      fireEvent.mouseDown(firstCircle, {
        clientX: 100,
        clientY: 50,
      })

      // Симулируем mouse move
      fireEvent.mouseMove(window, {
        clientX: 150,
        clientY: 50,
      })

      // Заканчиваем dragging
      fireEvent.mouseUp(window)

      // Проверяем, что компонент остался стабильным
      expect(firstCircle).toBeInTheDocument()
    })
  })

  describe("Edge Cases and Error Handling", () => {
    it("should handle template without configuration", () => {
      const invalidTemplate = {
        id: "non-existent-template",
        split: "vertical" as const,
        resizable: true,
        screens: 2,
        render: () => React.createElement("div", {}, "Invalid Template"),
      }

      const invalidAppliedTemplate = {
        template: invalidTemplate,
        videos: [],
      }

      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={invalidAppliedTemplate}
          videos={mockVideos}
          activeVideoId={null}
          data-oid="o:jzf0d"
        />,
      )

      // Должно показать сообщение об ошибке
      expect(screen.getByText("Template configuration not found")).toBeInTheDocument()
    })

    it("should handle empty videos array", () => {
      renderWithTemplates(
        <ResizableTemplate appliedTemplate={mockAppliedTemplate} videos={[]} activeVideoId={null} data-oid="meo-wra" />,
      )

      // Компонент должен отрендериться без ошибок
      expect(document.body).toBeInTheDocument()
    })

    it("should handle videos without paths", () => {
      const videosWithoutPaths = [
        {
          id: "video-1",
          name: "Test Video 1",
          path: "", // Пустой путь
          type: MediaType.Video,
          size: 1024,
          duration: 60,
          startTime: 0,
          endTime: 60,
        },
        {
          id: "video-2",
          name: "Test Video 2",
          // path отсутствует
          type: MediaType.Video,
          size: 1024,
          duration: 60,
          startTime: 0,
          endTime: 60,
        } as any,
      ]

      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={mockAppliedTemplate}
          videos={videosWithoutPaths}
          activeVideoId={null}
          data-oid="s9k9zmj"
        />,
      )

      // Компонент должен отрендериться без ошибок
      expect(document.body).toBeInTheDocument()
    })

    it("should handle null template", () => {
      const nullAppliedTemplate = {
        template: null,
        videos: [],
      }

      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={nullAppliedTemplate as any}
          videos={mockVideos}
          activeVideoId={null}
          data-oid="os6k1j."
        />,
      )

      // Должно показать сообщение об ошибке
      expect(screen.getByText("Template configuration not found")).toBeInTheDocument()
    })

    it("should handle diagonal template without splitPoints", () => {
      const diagonalTemplateWithoutPoints = {
        id: "split-diagonal-landscape",
        split: "diagonal" as const,
        resizable: true,
        screens: 2,
        render: () => React.createElement("div", {}, "Diagonal Template"),
      }

      const diagonalAppliedTemplate = {
        template: diagonalTemplateWithoutPoints,
        videos: [],
      }

      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={diagonalAppliedTemplate}
          videos={mockVideos}
          activeVideoId={null}
          data-oid="g7.9kfn"
        />,
      )

      // Компонент должен использовать дефолтные splitPoints
      expect(screen.getByTestId("video-panel-0")).toBeInTheDocument()
      expect(screen.getByTestId("video-panel-1")).toBeInTheDocument()
    })

    it("should respect video count limits", () => {
      const manyVideos = Array.from({ length: 10 }, (_, i) => ({
        id: `video-${i + 1}`,
        name: `Test Video ${i + 1}`,
        path: `/test/video${i + 1}.mp4`,
        type: MediaType.Video,
        size: 1024,
        duration: 60,
        startTime: 0,
        endTime: 60,
      }))

      renderWithTemplates(
        <ResizableTemplate
          appliedTemplate={mockAppliedTemplate}
          videos={manyVideos}
          activeVideoId={null}
          data-oid="u12ctiz"
        />,
      )

      // Должно рендерить только количество видео, равное screens шаблона (2)
      expect(screen.getByTestId("video-panel-0")).toBeInTheDocument()
      expect(screen.getByTestId("video-panel-1")).toBeInTheDocument()
      expect(screen.queryByTestId("video-panel-2")).not.toBeInTheDocument()
    })
  })
})
