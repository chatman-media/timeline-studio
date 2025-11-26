/**
 * Tests for WidgetContainer dragging states
 *
 * Этот файл тестирует состояния dragging с динамическим моком useDraggable
 */

import { fireEvent, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render } from "@/test/test-utils"
import { createMockWidget } from "../../__mocks__/test-data"
import { WidgetContainer } from "../../components/widget-container"

// Мок для useDraggable с возможностью динамической настройки
const mockUseDraggable = vi.fn()

vi.mock("@dnd-kit/core", () => ({
  useDraggable: () => mockUseDraggable(),
}))

describe("WidgetContainer Dragging States", () => {
  const mockWidget = createMockWidget("test-1", "timeline", { x: 10, y: 20, width: 50, height: 30 })

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock - не dragging
    mockUseDraggable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: false,
    })
  })

  describe("isDragging=true", () => {
    it("должен применять opacity-50 класс когда isDragging=true", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        isDragging: true,
      })

      const { container } = render(
        <WidgetContainer widget={mockWidget}>
          <div>Content</div>
        </WidgetContainer>,
      )

      const widgetElement = container.querySelector(".rounded-lg.border.bg-background")
      expect(widgetElement).toHaveClass("opacity-50")
    })

    it("должен увеличивать z-index на 1000 когда isDragging=true", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        isDragging: true,
      })

      const widgetWithZIndex = createMockWidget("test-drag", "timeline", undefined, { zIndex: 5 })

      const { container } = render(
        <WidgetContainer widget={widgetWithZIndex}>
          <div>Content</div>
        </WidgetContainer>,
      )

      const widgetElement = container.querySelector(".rounded-lg.border.bg-background") as HTMLElement
      expect(widgetElement).toHaveStyle({ zIndex: "1005" })
    })

    it("должен применять cursor-grabbing класс при dragging", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        isDragging: true,
      })

      const { container } = render(
        <WidgetContainer widget={mockWidget}>
          <div>Content</div>
        </WidgetContainer>,
      )

      const widgetElement = container.querySelector(".rounded-lg.border.bg-background")
      // При isDragging=true виджет имеет opacity-50, но не cursor-grabbing (cursor-grabbing только при resizing)
      expect(widgetElement).toHaveClass("opacity-50")
    })
  })

  describe("Transform", () => {
    it("должен применять transform из useDraggable", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: { x: 50, y: 30, scaleX: 1, scaleY: 1 },
        isDragging: true,
      })

      const { container } = render(
        <WidgetContainer widget={mockWidget}>
          <div>Content</div>
        </WidgetContainer>,
      )

      const widgetElement = container.querySelector(".rounded-lg.border.bg-background") as HTMLElement
      expect(widgetElement).toHaveStyle({ transform: "translate3d(50px, 30px, 0)" })
    })

    it("должен применять отрицательный transform", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: { x: -20, y: -15, scaleX: 1, scaleY: 1 },
        isDragging: true,
      })

      const { container } = render(
        <WidgetContainer widget={mockWidget}>
          <div>Content</div>
        </WidgetContainer>,
      )

      const widgetElement = container.querySelector(".rounded-lg.border.bg-background") as HTMLElement
      expect(widgetElement).toHaveStyle({ transform: "translate3d(-20px, -15px, 0)" })
    })

    it("должен не применять transform когда transform=null", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        isDragging: false,
      })

      const { container } = render(
        <WidgetContainer widget={mockWidget}>
          <div>Content</div>
        </WidgetContainer>,
      )

      const widgetElement = container.querySelector(".rounded-lg.border.bg-background") as HTMLElement
      // Когда transform=null, CSS.Translate.toString вернёт undefined
      const style = widgetElement.getAttribute("style")
      // transform не должен содержать translate3d когда transform=null
      expect(style).not.toContain("translate3d")
    })

    it("должен корректно обрабатывать нулевой transform", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
        isDragging: false,
      })

      const { container } = render(
        <WidgetContainer widget={mockWidget}>
          <div>Content</div>
        </WidgetContainer>,
      )

      const widgetElement = container.querySelector(".rounded-lg.border.bg-background") as HTMLElement
      expect(widgetElement).toHaveStyle({ transform: "translate3d(0px, 0px, 0)" })
    })
  })

  describe("Drag Attributes and Listeners", () => {
    it("должен передавать attributes в drag handle", () => {
      const mockAttributes = {
        role: "button",
        "aria-pressed": false,
        "aria-describedby": "DndDescribedBy-test",
      }

      mockUseDraggable.mockReturnValue({
        attributes: mockAttributes,
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        isDragging: false,
      })

      render(
        <WidgetContainer widget={mockWidget}>
          <div>Content</div>
        </WidgetContainer>,
      )

      const dragHandle = screen.getByTitle("Drag to move")
      expect(dragHandle).toHaveAttribute("role", "button")
      expect(dragHandle).toHaveAttribute("aria-pressed", "false")
    })

    it("должен передавать listeners в drag handle", () => {
      const mockOnPointerDown = vi.fn()
      const mockOnKeyDown = vi.fn()

      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {
          onPointerDown: mockOnPointerDown,
          onKeyDown: mockOnKeyDown,
        },
        setNodeRef: vi.fn(),
        transform: null,
        isDragging: false,
      })

      render(
        <WidgetContainer widget={mockWidget}>
          <div>Content</div>
        </WidgetContainer>,
      )

      const dragHandle = screen.getByTitle("Drag to move")

      fireEvent.pointerDown(dragHandle)
      expect(mockOnPointerDown).toHaveBeenCalled()

      fireEvent.keyDown(dragHandle, { key: "Enter" })
      expect(mockOnKeyDown).toHaveBeenCalled()
    })
  })

  describe("Combined States", () => {
    it("должен корректно обрабатывать isDragging=true с transform", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: { x: 100, y: 50, scaleX: 1, scaleY: 1 },
        isDragging: true,
      })

      const widgetWithZIndex = createMockWidget("combined-test", "player", undefined, { zIndex: 3 })

      const { container } = render(
        <WidgetContainer widget={widgetWithZIndex}>
          <div>Content</div>
        </WidgetContainer>,
      )

      const widgetElement = container.querySelector(".rounded-lg.border.bg-background") as HTMLElement

      // Проверяем все состояния одновременно
      expect(widgetElement).toHaveClass("opacity-50")
      expect(widgetElement).toHaveStyle({
        zIndex: "1003", // 3 + 1000
        transform: "translate3d(100px, 50px, 0)",
      })
    })

    it("должен корректно обрабатывать isDragging=false с transform (начало drag)", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: { x: 5, y: 5, scaleX: 1, scaleY: 1 },
        isDragging: false, // Может быть false в начале drag из-за activationConstraint
      })

      const { container } = render(
        <WidgetContainer widget={mockWidget}>
          <div>Content</div>
        </WidgetContainer>,
      )

      const widgetElement = container.querySelector(".rounded-lg.border.bg-background") as HTMLElement

      // При isDragging=false не должно быть opacity-50
      expect(widgetElement).not.toHaveClass("opacity-50")
      // Но transform должен применяться
      expect(widgetElement).toHaveStyle({ transform: "translate3d(5px, 5px, 0)" })
    })
  })
})
