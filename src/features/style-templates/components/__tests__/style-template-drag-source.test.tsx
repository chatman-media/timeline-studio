/**
 * Тесты для StyleTemplateDragSource
 */

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { StyleTemplate } from "../../types"
import { StyleTemplateDragSource } from "../style-template-drag-source"

// Mock useDraggable
let mockUseDraggable = vi.fn()

// Мок для @dnd-kit/core
vi.mock("@dnd-kit/core", () => ({
  useDraggable: (options: any) => mockUseDraggable(options),
}))

describe("StyleTemplateDragSource", () => {
  const mockTemplate: StyleTemplate = {
    id: "test-template",
    name: { ru: "Тест", en: "Test" },
    category: "intro",
    style: "modern",
    aspectRatio: "16:9",
    duration: 3,
    hasText: true,
    hasAnimation: true,
    elements: [],
  }

  const mockSetNodeRef = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementation
    mockUseDraggable.mockReturnValue({
      attributes: { "data-test": "attribute" },
      listeners: { onPointerDown: vi.fn() },
      setNodeRef: mockSetNodeRef,
      isDragging: false,
      transform: null,
    })
  })

  describe("rendering", () => {
    it("должен рендерить дочерние элементы", () => {
      render(
        <StyleTemplateDragSource template={mockTemplate}>
          <div>Test Content</div>
        </StyleTemplateDragSource>,
      )

      expect(screen.getByText("Test Content")).toBeInTheDocument()
    })

    it("должен применять правильный className", () => {
      const { container } = render(
        <StyleTemplateDragSource template={mockTemplate} className="custom-class">
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain("custom-class")
    })

    it("должен применять базовые классы", () => {
      const { container } = render(
        <StyleTemplateDragSource template={mockTemplate}>
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain("transition-opacity")
    })
  })

  describe("draggable configuration", () => {
    it("должен вызывать useDraggable с правильными параметрами", () => {
      render(
        <StyleTemplateDragSource template={mockTemplate}>
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      expect(mockUseDraggable).toHaveBeenCalledWith({
        id: "style-template-test-template",
        data: {
          type: "style-template",
          template: mockTemplate,
          resourceType: "style-template",
          resourceId: "test-template",
        },
        disabled: false,
      })
    })

    it("должен передавать disabled в useDraggable", () => {
      render(
        <StyleTemplateDragSource template={mockTemplate} disabled>
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      expect(mockUseDraggable).toHaveBeenCalledWith(
        expect.objectContaining({
          disabled: true,
        }),
      )
    })

    it("должен применять attributes из useDraggable", () => {
      const { container } = render(
        <StyleTemplateDragSource template={mockTemplate}>
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.getAttribute("data-test")).toBe("attribute")
    })
  })

  describe("drag states", () => {
    it("должен применять cursor-grab когда не перетаскивается", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: mockSetNodeRef,
        isDragging: false,
        transform: null,
      })

      const { container } = render(
        <StyleTemplateDragSource template={mockTemplate}>
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain("cursor-grab")
      expect(wrapper.className).not.toContain("cursor-grabbing")
    })

    it("должен применять cursor-grabbing когда перетаскивается", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: mockSetNodeRef,
        isDragging: true,
        transform: { x: 10, y: 20, scaleX: 1, scaleY: 1 },
      })

      const { container } = render(
        <StyleTemplateDragSource template={mockTemplate}>
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain("cursor-grabbing")
      expect(wrapper.className).toContain("opacity-50")
    })

    it("должен применять transform когда перетаскивается", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: mockSetNodeRef,
        isDragging: true,
        transform: { x: 15, y: 25, scaleX: 1, scaleY: 1 },
      })

      const { container } = render(
        <StyleTemplateDragSource template={mockTemplate}>
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.style.transform).toBe("translate3d(15px, 25px, 0)")
    })

    it("не должен применять transform когда transform null", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: mockSetNodeRef,
        isDragging: false,
        transform: null,
      })

      const { container } = render(
        <StyleTemplateDragSource template={mockTemplate}>
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.style.transform).toBe("")
    })
  })

  describe("disabled state", () => {
    it("должен быть disabled когда передан disabled prop", () => {
      const { container } = render(
        <StyleTemplateDragSource template={mockTemplate} disabled>
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain("cursor-not-allowed")
      expect(wrapper.className).toContain("opacity-50")
    })

    it("не должен применять cursor-grab когда disabled", () => {
      const { container } = render(
        <StyleTemplateDragSource template={mockTemplate} disabled>
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).not.toContain("cursor-grab")
      expect(wrapper.className).toContain("cursor-not-allowed")
    })

    it("не должен применять hover:opacity-90 когда disabled", () => {
      const { container } = render(
        <StyleTemplateDragSource template={mockTemplate} disabled>
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).not.toContain("hover:opacity-90")
    })
  })

  describe("different templates", () => {
    it("должен работать с outro template", () => {
      const outroTemplate: StyleTemplate = {
        ...mockTemplate,
        id: "outro-template",
        category: "outro",
      }

      render(
        <StyleTemplateDragSource template={outroTemplate}>
          <div>Outro</div>
        </StyleTemplateDragSource>,
      )

      expect(mockUseDraggable).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "style-template-outro-template",
        }),
      )
      expect(screen.getByText("Outro")).toBeInTheDocument()
    })

    it("должен работать с lower-third template", () => {
      const lowerThirdTemplate: StyleTemplate = {
        ...mockTemplate,
        id: "lower-third",
        category: "lower-third",
      }

      render(
        <StyleTemplateDragSource template={lowerThirdTemplate}>
          <div>Lower Third</div>
        </StyleTemplateDragSource>,
      )

      expect(mockUseDraggable).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "style-template-lower-third",
        }),
      )
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать transform с нулевыми координатами", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: mockSetNodeRef,
        isDragging: true,
        transform: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
      })

      const { container } = render(
        <StyleTemplateDragSource template={mockTemplate}>
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.style.transform).toBe("translate3d(0px, 0px, 0)")
    })

    it("должен обрабатывать отрицательные координаты transform", () => {
      mockUseDraggable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: mockSetNodeRef,
        isDragging: true,
        transform: { x: -10, y: -20, scaleX: 1, scaleY: 1 },
      })

      const { container } = render(
        <StyleTemplateDragSource template={mockTemplate}>
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.style.transform).toBe("translate3d(-10px, -20px, 0)")
    })

    it("должен работать без className", () => {
      const { container } = render(
        <StyleTemplateDragSource template={mockTemplate}>
          <div>Test</div>
        </StyleTemplateDragSource>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toBeInTheDocument()
      expect(wrapper.className).toContain("transition-opacity")
    })
  })
})
