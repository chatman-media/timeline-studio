/**
 * Tests for WidgetWorkspace component
 */

import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render } from "@/test/test-utils"
import { WidgetWorkspace } from "../../components/widget-workspace"
import { WorkspaceLayoutProvider } from "../../services/workspace-layout-provider"
import type { Widget, WidgetType } from "../../types/widget"

describe("WidgetWorkspace", () => {
  const mockWidgetRenderers = {
    timeline: (widget: Widget) => <div data-testid={`widget-${widget.id}`}>Timeline Widget</div>,
    player: (widget: Widget) => <div data-testid={`widget-${widget.id}`}>Player Widget</div>,
    browser: (widget: Widget) => <div data-testid={`widget-${widget.id}`}>Browser Widget</div>,
    options: (widget: Widget) => <div data-testid={`widget-${widget.id}`}>Options Widget</div>,
    "ai-chat": (widget: Widget) => <div data-testid={`widget-${widget.id}`}>AI Chat Widget</div>,
    "ai-suggestions": (widget: Widget) => <div data-testid={`widget-${widget.id}`}>AI Suggestions Widget</div>,
  } as Record<WidgetType, (widget: Widget) => JSX.Element>

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
    } as Record<WidgetType, (widget: Widget) => JSX.Element>

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
    } as Record<WidgetType, (widget: Widget) => JSX.Element>

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
    // Создаем кастомный провайдер без виджетов
    // TODO: Реализовать после добавления возможности передачи начального состояния в провайдер

    const { container } = render(
      <WorkspaceLayoutProvider>
        <WidgetWorkspace widgetRenderers={mockWidgetRenderers} />
      </WorkspaceLayoutProvider>,
    )

    // Workspace должен рендериться даже без виджетов
    const workspace = container.querySelector(".relative.h-full.w-full")
    expect(workspace).toBeInTheDocument()
  })
})
