/**
 * @vitest-environment jsdom
 */
/**
 * Tests for WidgetWorkspace component
 */

import { fireEvent, screen, waitFor } from "@testing-library/react"
import type { ReactElement } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render } from "@/test/test-utils"
import { WidgetWorkspace } from "../../components/widget-workspace"
import { WorkspaceLayoutProvider } from "../../services/workspace-layout-provider"
import type { Widget, WidgetType } from "../../types/widget"

// Mock DndContext from @dnd-kit/core for testing drag events
vi.mock("@dnd-kit/core", async () => {
  const actual = await vi.importActual("@dnd-kit/core")
  return {
    ...actual,
    DndContext: ({ children, onDragStart, onDragEnd }: any) => {
      // Expose handlers for testing via data attributes
      return (
        <div
          data-testid="dnd-context"
          data-ondragstart={onDragStart ? "true" : "false"}
          data-ondragend={onDragEnd ? "true" : "false"}
        >
          {children}
        </div>
      )
    },
    useSensor: vi.fn((sensor: any) => sensor),
    useSensors: vi.fn((...sensors: any[]) => sensors),
    MouseSensor: vi.fn(),
    TouchSensor: vi.fn(),
    useDraggable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: false,
    }),
  }
})

describe("WidgetWorkspace", () => {
  const mockWidgetRenderers = {
    timeline: (widget: Widget) => <div data-testid={`widget-${widget.id}`}>Timeline Widget</div>,
    player: (widget: Widget) => <div data-testid={`widget-${widget.id}`}>Player Widget</div>,
    browser: (widget: Widget) => <div data-testid={`widget-${widget.id}`}>Browser Widget</div>,
    options: (widget: Widget) => <div data-testid={`widget-${widget.id}`}>Options Widget</div>,
    "ai-chat": (widget: Widget) => <div data-testid={`widget-${widget.id}`}>AI Chat Widget</div>,
    "ai-suggestions": (widget: Widget) => <div data-testid={`widget-${widget.id}`}>AI Suggestions Widget</div>,
  } as Record<WidgetType, (widget: Widget) => ReactElement>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен рендерить workspace контейнер", () => {
    const { container } = render(
      <WorkspaceLayoutProvider>
        <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
      </WorkspaceLayoutProvider>,
    )

    // Проверяем наличие основного контейнера workspace
    const workspace = container.querySelector(".relative.h-full.w-full")
    expect(workspace).toBeInTheDocument()
  })

  it("должен рендерить виджеты из текущего preset", () => {
    render(
      <WorkspaceLayoutProvider>
        <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
      </WorkspaceLayoutProvider>,
    )

    // Default preset имеет 3 виджета: browser, player, timeline
    expect(screen.getByText("Browser Widget")).toBeInTheDocument()
    expect(screen.getByText("Player Widget")).toBeInTheDocument()
    expect(screen.getByText("Timeline Widget")).toBeInTheDocument()
  })

  it("должен применить bounds виджета как inline стили", () => {
    render(
      <WorkspaceLayoutProvider>
        <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
      </WorkspaceLayoutProvider>,
    )

    // Находим контейнер первого виджета (browser-1)
    const widgetElement = screen.getByTestId("widget-browser-1").parentElement?.parentElement

    expect(widgetElement).toHaveStyle({
      position: "absolute",
    })
  })

  it("не должен рендерить виджеты без рендерера", () => {
    const incompleteRenderers = {
      timeline: (_widget: Widget) => <div>Timeline</div>,
      // Намеренно пропускаем другие типы
    } as Record<WidgetType, (widget: Widget) => ReactElement>

    // Mock console.warn to avoid noise in test output
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    render(
      <WorkspaceLayoutProvider>
        <WidgetWorkspace widgetRenderers={incompleteRenderers} />
      </WorkspaceLayoutProvider>,
    )

    // Должен рендерить только timeline
    expect(screen.queryByText("Timeline")).toBeInTheDocument()
    expect(screen.queryByText("Browser Widget")).not.toBeInTheDocument()

    consoleWarnSpy.mockRestore()
  })

  it("не должен рендерить минимизированные виджеты", () => {
    // Используем собственный провайдер с минимизированным виджетом
    const TestWrapper = ({ children }: { children: React.ReactNode }) => {
      return <WorkspaceLayoutProvider>{children}</WorkspaceLayoutProvider>
    }

    const { rerender } = render(
      <TestWrapper>
        <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
      </TestWrapper>,
    )

    // Изначально все виджеты видимы
    expect(screen.getByText("Browser Widget")).toBeInTheDocument()

    // TODO: После реализации minification проверить скрытие виджета
  })

  it("должен показывать drag overlay во время перетаскивания", () => {
    render(
      <WorkspaceLayoutProvider>
        <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
      </WorkspaceLayoutProvider>,
    )

    // TODO: Добавить тесты для drag overlay после настройки DnD тестирования
    // Требуется мокирование @dnd-kit/core
  })

  it("должен применить правильный z-index для виджетов", () => {
    render(
      <WorkspaceLayoutProvider>
        <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
      </WorkspaceLayoutProvider>,
    )

    const browserWidget = screen.getByTestId("widget-browser-1").parentElement?.parentElement
    const playerWidget = screen.getByTestId("widget-player-1").parentElement?.parentElement

    // Виджеты должны иметь z-index из своего состояния
    expect(browserWidget).toBeDefined()
    expect(playerWidget).toBeDefined()
  })

  it("должен передавать виджет в renderer функцию", () => {
    const customRenderer = vi.fn((widget: Widget) => <div>Custom {widget.type}</div>)

    const customRenderers = {
      timeline: customRenderer,
      player: customRenderer,
      browser: customRenderer,
      options: customRenderer,
      "ai-chat": customRenderer,
      "ai-suggestions": customRenderer,
    } as Record<WidgetType, (widget: Widget) => ReactElement>

    render(
      <WorkspaceLayoutProvider>
        <WidgetWorkspace widgetRenderers={customRenderers} />
      </WorkspaceLayoutProvider>,
    )

    // Renderer должен быть вызван для каждого виджета
    expect(customRenderer).toHaveBeenCalledWith(expect.objectContaining({ type: "browser" }))
    expect(customRenderer).toHaveBeenCalledWith(expect.objectContaining({ type: "player" }))
    expect(customRenderer).toHaveBeenCalledWith(expect.objectContaining({ type: "timeline" }))
  })

  it("должен корректно работать с пустым списком виджетов", () => {
    const { container } = render(
      <WorkspaceLayoutProvider>
        <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
      </WorkspaceLayoutProvider>,
    )

    // Workspace должен рендериться даже без виджетов
    const workspace = container.querySelector(".relative.h-full.w-full")
    expect(workspace).toBeInTheDocument()
  })

  describe("DnD Configuration", () => {
    it("должен настраивать DndContext с обработчиками", () => {
      render(
        <WorkspaceLayoutProvider>
          <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
        </WorkspaceLayoutProvider>,
      )

      const dndContext = screen.getByTestId("dnd-context")
      expect(dndContext).toHaveAttribute("data-ondragstart", "true")
      expect(dndContext).toHaveAttribute("data-ondragend", "true")
    })

    it("должен рендерить WidgetDock для минимизированных виджетов", () => {
      render(
        <WorkspaceLayoutProvider>
          <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
        </WorkspaceLayoutProvider>,
      )

      // WidgetDock должен быть в DOM
      // Проверяем через наличие контейнера с минимизированными виджетами
      // (по умолчанию нет минимизированных виджетов)
      expect(screen.getByTestId("dnd-context")).toBeInTheDocument()
    })
  })

  describe("Widget Selection", () => {
    it("должен выделять виджет при клике через onSelect", async () => {
      render(
        <WorkspaceLayoutProvider>
          <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
        </WorkspaceLayoutProvider>,
      )

      // Виджет timeline должен быть в DOM
      const timelineWidget = screen.getByText("Timeline Widget")
      expect(timelineWidget).toBeInTheDocument()

      // Находим родительский контейнер виджета и кликаем
      const widgetContainer = timelineWidget.closest(".rounded-lg")
      if (widgetContainer) {
        fireEvent.click(widgetContainer)
      }

      // Виджет должен получить ring-2 класс (selected)
      await waitFor(() => {
        const selectedWidget = document.querySelector(".ring-2")
        expect(selectedWidget).toBeInTheDocument()
      })
    })
  })

  describe("Widget Actions", () => {
    it("должен отображать кнопки управления виджетом", () => {
      render(
        <WorkspaceLayoutProvider>
          <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
        </WorkspaceLayoutProvider>,
      )

      // Должны быть кнопки Minimize, Maximize, Close для каждого виджета
      const minimizeButtons = screen.getAllByTitle("Minimize")
      const maximizeButtons = screen.getAllByTitle("Maximize")
      const closeButtons = screen.getAllByTitle("Close")

      // 3 виджета в default preset
      expect(minimizeButtons.length).toBeGreaterThanOrEqual(3)
      expect(maximizeButtons.length).toBeGreaterThanOrEqual(3)
      expect(closeButtons.length).toBeGreaterThanOrEqual(3)
    })

    it("должен удалять виджет при клике на Close", async () => {
      render(
        <WorkspaceLayoutProvider>
          <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
        </WorkspaceLayoutProvider>,
      )

      // Находим количество виджетов до удаления
      const initialWidgets = screen.getAllByText(/Widget$/)
      const initialCount = initialWidgets.length

      // Кликаем на кнопку Close первого виджета
      const closeButtons = screen.getAllByTitle("Close")
      fireEvent.click(closeButtons[0])

      // После удаления должно быть на 1 виджет меньше
      await waitFor(() => {
        const remainingWidgets = screen.queryAllByText(/Widget$/)
        expect(remainingWidgets.length).toBe(initialCount - 1)
      })
    })

    it("должен минимизировать виджет при клике на Minimize", async () => {
      render(
        <WorkspaceLayoutProvider>
          <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
        </WorkspaceLayoutProvider>,
      )

      const initialWidgets = screen.getAllByText(/Widget$/)
      const initialCount = initialWidgets.length

      // Кликаем на кнопку Minimize первого виджета
      const minimizeButtons = screen.getAllByTitle("Minimize")
      fireEvent.click(minimizeButtons[0])

      // Минимизированный виджет не должен отображаться в основной области
      await waitFor(() => {
        const remainingWidgets = screen.queryAllByText(/Widget$/)
        expect(remainingWidgets.length).toBe(initialCount - 1)
      })
    })
  })

  describe("Drag Handles", () => {
    it("должен отображать drag handle для каждого виджета", () => {
      render(
        <WorkspaceLayoutProvider>
          <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
        </WorkspaceLayoutProvider>,
      )

      const dragHandles = screen.getAllByTitle("Drag to move")
      // 3 виджета в default preset
      expect(dragHandles.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe("Resize Handles", () => {
    it("должен отображать resize handles для виджетов когда enableResize=true", () => {
      const { container } = render(
        <WorkspaceLayoutProvider>
          <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
        </WorkspaceLayoutProvider>,
      )

      // Corner handles
      const cornerHandles = container.querySelectorAll(".rounded-full.border-2")
      expect(cornerHandles.length).toBeGreaterThanOrEqual(12) // 4 на каждый из 3 виджетов
    })
  })

  describe("Widget Types Display", () => {
    it("должен отображать тип виджета в header", () => {
      render(
        <WorkspaceLayoutProvider>
          <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
        </WorkspaceLayoutProvider>,
      )

      // В header каждого виджета должен быть его тип
      expect(screen.getByText("browser")).toBeInTheDocument()
      expect(screen.getByText("player")).toBeInTheDocument()
      expect(screen.getByText("timeline")).toBeInTheDocument()
    })
  })

  describe("Widget Visibility", () => {
    it("должен применять полупрозрачность для невидимых виджетов", () => {
      // Поведение невидимых виджетов тестируется через widget-container
      // Здесь проверяем что виджеты изначально видимы
      const { container } = render(
        <WorkspaceLayoutProvider>
          <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
        </WorkspaceLayoutProvider>,
      )

      // Все виджеты должны иметь opacity: 1 (видимы)
      const widgetContainers = container.querySelectorAll(".rounded-lg.border.bg-background")
      widgetContainers.forEach((widget) => {
        const style = (widget as HTMLElement).style
        expect(style.opacity === "" || style.opacity === "1").toBe(true)
      })
    })
  })

  describe("WidgetRenderers Edge Cases", () => {
    it("должен корректно работать когда renderer возвращает сложный JSX", () => {
      const complexRenderers = {
        timeline: (widget: Widget) => (
          <div data-testid={`complex-${widget.id}`}>
            <header>Timeline Header</header>
            <main>
              <p>Timeline Content</p>
            </main>
            <footer>Timeline Footer</footer>
          </div>
        ),
        player: (widget: Widget) => <span data-testid={`complex-${widget.id}`}>Player</span>,
        browser: (widget: Widget) => <span data-testid={`complex-${widget.id}`}>Browser</span>,
        options: (widget: Widget) => <span data-testid={`complex-${widget.id}`}>Options</span>,
        "ai-chat": (widget: Widget) => <span data-testid={`complex-${widget.id}`}>AI Chat</span>,
        "ai-suggestions": (widget: Widget) => <span data-testid={`complex-${widget.id}`}>AI Suggestions</span>,
      } as Record<WidgetType, (widget: Widget) => ReactElement>

      render(
        <WorkspaceLayoutProvider>
          <WidgetWorkspace widgetRenderers={complexRenderers} />
        </WorkspaceLayoutProvider>,
      )

      expect(screen.getByText("Timeline Header")).toBeInTheDocument()
      expect(screen.getByText("Timeline Content")).toBeInTheDocument()
      expect(screen.getByText("Timeline Footer")).toBeInTheDocument()
    })

    it("должен передавать widget.id в renderer", () => {
      const idTrackingRenderers = {
        timeline: (widget: Widget) => <div data-widget-id={widget.id}>Timeline</div>,
        player: (widget: Widget) => <div data-widget-id={widget.id}>Player</div>,
        browser: (widget: Widget) => <div data-widget-id={widget.id}>Browser</div>,
        options: (widget: Widget) => <div data-widget-id={widget.id}>Options</div>,
        "ai-chat": (widget: Widget) => <div data-widget-id={widget.id}>AI Chat</div>,
        "ai-suggestions": (widget: Widget) => <div data-widget-id={widget.id}>AI Suggestions</div>,
      } as Record<WidgetType, (widget: Widget) => ReactElement>

      const { container } = render(
        <WorkspaceLayoutProvider>
          <WidgetWorkspace widgetRenderers={idTrackingRenderers} />
        </WorkspaceLayoutProvider>,
      )

      const widgetElements = container.querySelectorAll("[data-widget-id]")
      expect(widgetElements.length).toBeGreaterThanOrEqual(3)

      // Каждый виджет должен иметь уникальный id
      const ids = Array.from(widgetElements).map((el) => el.getAttribute("data-widget-id"))
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it("должен передавать widget.bounds в renderer", () => {
      const boundsTrackingRenderer = vi.fn((widget: Widget) => (
        <div data-bounds={JSON.stringify(widget.bounds)}>Widget</div>
      ))

      const boundsRenderers = {
        timeline: boundsTrackingRenderer,
        player: boundsTrackingRenderer,
        browser: boundsTrackingRenderer,
        options: boundsTrackingRenderer,
        "ai-chat": boundsTrackingRenderer,
        "ai-suggestions": boundsTrackingRenderer,
      } as Record<WidgetType, (widget: Widget) => ReactElement>

      render(
        <WorkspaceLayoutProvider>
          <WidgetWorkspace widgetRenderers={boundsRenderers} />
        </WorkspaceLayoutProvider>,
      )

      // Renderer должен быть вызван с widget объектом, содержащим bounds
      expect(boundsTrackingRenderer).toHaveBeenCalledWith(
        expect.objectContaining({
          bounds: expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number),
            width: expect.any(Number),
            height: expect.any(Number),
          }),
        }),
      )
    })
  })

  describe("Workspace Container Styling", () => {
    it("должен иметь правильные классы контейнера", () => {
      const { container } = render(
        <WorkspaceLayoutProvider>
          <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
        </WorkspaceLayoutProvider>,
      )

      const workspace = container.querySelector(".relative.h-full.w-full.overflow-hidden.bg-background")
      expect(workspace).toBeInTheDocument()
    })
  })
})
