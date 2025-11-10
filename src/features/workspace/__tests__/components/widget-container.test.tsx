/**
 * Tests for WidgetContainer component
 */

import { fireEvent, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render } from "@/test/test-utils"
import { createMockWidget } from "../../__mocks__/test-data"
import { WidgetContainer } from "../../components/widget-container"

// Mock @dnd-kit/core
vi.mock("@dnd-kit/core", () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}))

describe("WidgetContainer", () => {
  const mockWidget = createMockWidget("test-1", "timeline", { x: 10, y: 20, width: 50, height: 30 })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен рендерить дочерние элементы", () => {
    render(
      <WidgetContainer widget={mockWidget}>
        <div data-testid="child-content">Child Content</div>
      </WidgetContainer>,
    )

    expect(screen.getByTestId("child-content")).toBeInTheDocument()
    expect(screen.getByText("Child Content")).toBeInTheDocument()
  })

  it("должен отображать тип виджета в заголовке", () => {
    render(
      <WidgetContainer widget={mockWidget}>
        <div>Content</div>
      </WidgetContainer>,
    )

    expect(screen.getByText("timeline")).toBeInTheDocument()
  })

  it("должен применить правильные inline стили для позиционирования", () => {
    render(
      <WidgetContainer widget={mockWidget}>
        <div>Content</div>
      </WidgetContainer>,
    )

    const widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement

    expect(widgetElement).toHaveStyle({
      position: "absolute",
      left: "10%",
      top: "20%",
      width: "50%",
      height: "30%",
    })
  })

  it("должен показывать selected состояние", () => {
    const { rerender } = render(
      <WidgetContainer widget={mockWidget} isSelected={false}>
        <div>Content</div>
      </WidgetContainer>,
    )

    let widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement
    expect(widgetElement).not.toHaveClass("ring-2")

    rerender(
      <WidgetContainer widget={mockWidget} isSelected={true}>
        <div>Content</div>
      </WidgetContainer>,
    )

    widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement
    expect(widgetElement).toHaveClass("ring-2")
  })

  it("должен вызвать onSelect при клике", () => {
    const onSelect = vi.fn()

    render(
      <WidgetContainer widget={mockWidget} onSelect={onSelect}>
        <div>Content</div>
      </WidgetContainer>,
    )

    // Находим widget container по классу
    const widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement
    fireEvent.click(widgetElement)

    expect(onSelect).toHaveBeenCalledWith(mockWidget.id)
  })

  it("должен отображать кнопку минимизации", () => {
    const onMinimize = vi.fn()

    render(
      <WidgetContainer widget={mockWidget} onMinimize={onMinimize}>
        <div>Content</div>
      </WidgetContainer>,
    )

    const minimizeBtn = screen.getByTitle("Minimize")
    expect(minimizeBtn).toBeInTheDocument()

    fireEvent.click(minimizeBtn)
    expect(onMinimize).toHaveBeenCalledWith(mockWidget.id)
  })

  it("должен отображать кнопку максимизации", () => {
    const onMaximize = vi.fn()

    render(
      <WidgetContainer widget={mockWidget} onMaximize={onMaximize}>
        <div>Content</div>
      </WidgetContainer>,
    )

    const maximizeBtn = screen.getByTitle("Maximize")
    expect(maximizeBtn).toBeInTheDocument()

    fireEvent.click(maximizeBtn)
    expect(onMaximize).toHaveBeenCalledWith(mockWidget.id)
  })

  it("должен отображать кнопку закрытия", () => {
    const onRemove = vi.fn()

    render(
      <WidgetContainer widget={mockWidget} onRemove={onRemove}>
        <div>Content</div>
      </WidgetContainer>,
    )

    const closeBtn = screen.getByTitle("Close")
    expect(closeBtn).toBeInTheDocument()

    fireEvent.click(closeBtn)
    expect(onRemove).toHaveBeenCalledWith(mockWidget.id)
  })

  it("должен предотвращать всплытие событий на кнопках", () => {
    const onSelect = vi.fn()
    const onMinimize = vi.fn()

    render(
      <WidgetContainer widget={mockWidget} onSelect={onSelect} onMinimize={onMinimize}>
        <div>Content</div>
      </WidgetContainer>,
    )

    const minimizeBtn = screen.getByTitle("Minimize")
    fireEvent.click(minimizeBtn)

    // onSelect не должен вызваться при клике на кнопку
    expect(onSelect).not.toHaveBeenCalled()
    expect(onMinimize).toHaveBeenCalledWith(mockWidget.id)
  })

  it("не должен рендериться если виджет минимизирован", () => {
    const minimizedWidget = createMockWidget("test-2", "player", undefined, { isMinimized: true })

    render(
      <WidgetContainer widget={minimizedWidget}>
        <div>Content</div>
      </WidgetContainer>,
    )

    // Проверяем что widget container не рендерится
    const widgetElement = document.querySelector(".rounded-lg.border.bg-background")
    expect(widgetElement).toBeNull()
  })

  it("должен применить полупрозрачность для невидимых виджетов", () => {
    const invisibleWidget = createMockWidget("test-3", "browser", undefined, { isVisible: false })

    render(
      <WidgetContainer widget={invisibleWidget}>
        <div>Content</div>
      </WidgetContainer>,
    )

    const widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement
    expect(widgetElement).toHaveStyle({ opacity: "0.3" })
  })

  it("должен блокировать pointer-events для невидимых виджетов", () => {
    const invisibleWidget = createMockWidget("test-4", "options", undefined, { isVisible: false })

    render(
      <WidgetContainer widget={invisibleWidget}>
        <div>Content</div>
      </WidgetContainer>,
    )

    const widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement
    expect(widgetElement).toHaveStyle({ pointerEvents: "none" })
  })

  it("должен применить правильный z-index", () => {
    const widgetWithZIndex = createMockWidget("test-5", "timeline", undefined, { zIndex: 5 })

    render(
      <WidgetContainer widget={widgetWithZIndex}>
        <div>Content</div>
      </WidgetContainer>,
    )

    const widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement
    expect(widgetElement).toHaveStyle({ zIndex: "5" })
  })

  it("не должен отображать кнопки если обработчики не переданы", () => {
    render(
      <WidgetContainer widget={mockWidget}>
        <div>Content</div>
      </WidgetContainer>,
    )

    expect(screen.queryByTitle("Minimize")).not.toBeInTheDocument()
    expect(screen.queryByTitle("Maximize")).not.toBeInTheDocument()
    expect(screen.queryByTitle("Close")).not.toBeInTheDocument()
  })

  it("должен отображать drag handle", () => {
    render(
      <WidgetContainer widget={mockWidget}>
        <div>Content</div>
      </WidgetContainer>,
    )

    const dragHandle = screen.getByTitle("Drag to move")
    expect(dragHandle).toBeInTheDocument()
  })
})
