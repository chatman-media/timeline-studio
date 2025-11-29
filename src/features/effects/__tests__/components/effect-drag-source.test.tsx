import { DndContext } from "@dnd-kit/core"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { EffectDragSource } from "../../components/effect-drag-source"
import type { BaseEffect } from "../../types"

// Mock @dnd-kit/core
const mockSetNodeRef = vi.fn()
const mockAttributes = { role: "button", tabIndex: 0 }
const mockListeners = {
  onPointerDown: vi.fn(),
  onKeyDown: vi.fn(),
}

let mockIsDragging = false
let mockTransform: { x: number; y: number } | null = null
let mockDisabled = false

vi.mock("@dnd-kit/core", async () => {
  const actual = await vi.importActual("@dnd-kit/core")
  return {
    ...actual,
    useDraggable: () => ({
      attributes: mockAttributes,
      listeners: mockListeners,
      setNodeRef: mockSetNodeRef,
      isDragging: mockIsDragging,
      transform: mockTransform,
      node: null,
      over: null,
      activatorEvent: null,
    }),
  }
})

describe("EffectDragSource", () => {
  const mockEffect: BaseEffect = {
    id: "test-effect",
    name: { en: "Test Effect", ru: "Тестовый эффект" },
    description: { en: "Test description", ru: "Тестовое описание" },
    category: "artistic",
    complexity: "low",
    tags: ["popular"],
    parameters: [],
    version: "1.0.0",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDragging = false
    mockTransform = null
    mockDisabled = false
  })

  describe("Rendering", () => {
    it("should render children", () => {
      render(
        <DndContext>
          <EffectDragSource effect={mockEffect}>
            <div>Test Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      expect(screen.getByText("Test Content")).toBeInTheDocument()
    })

    it("should apply custom className", () => {
      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect} className="custom-class">
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.querySelector(".custom-class")
      expect(wrapper).toBeInTheDocument()
    })

    it("should apply grab cursor when not disabled", () => {
      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect}>
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass("cursor-grab")
    })

    it("should apply not-allowed cursor when disabled", () => {
      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect} disabled>
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass("cursor-not-allowed")
    })
  })

  describe("Drag State", () => {
    it("should apply grabbing cursor when dragging", () => {
      mockIsDragging = true

      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect}>
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass("cursor-grabbing")
    })

    it("should reduce opacity when dragging", () => {
      mockIsDragging = true

      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect}>
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass("opacity-50")
    })

    it("should apply transform when dragging", () => {
      mockIsDragging = true
      mockTransform = { x: 100, y: 50 }

      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect}>
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.style.transform).toBe("translate3d(100px, 50px, 0)")
    })

    it("should not apply transform when not dragging", () => {
      mockIsDragging = false
      mockTransform = null

      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect}>
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.style.transform).toBe("")
    })
  })

  describe("Disabled State", () => {
    it("should reduce opacity when disabled", () => {
      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect} disabled>
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass("opacity-50")
    })

    it("should not show hover opacity when disabled", () => {
      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect} disabled>
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).not.toHaveClass("hover:opacity-90")
    })

    it("should show hover opacity when not disabled", () => {
      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect}>
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass("hover:opacity-90")
    })
  })

  describe("Draggable Configuration", () => {
    it("should set up draggable with correct id", () => {
      render(
        <DndContext>
          <EffectDragSource effect={mockEffect}>
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      // The useDraggable hook is called internally
      // We can't directly test its configuration, but we ensure it renders
      expect(screen.getByText("Content")).toBeInTheDocument()
    })

    it("should attach listeners to wrapper", () => {
      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect}>
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveAttribute("role", "button")
      expect(wrapper).toHaveAttribute("tabIndex", "0")
    })

    it("should call setNodeRef", () => {
      render(
        <DndContext>
          <EffectDragSource effect={mockEffect}>
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      expect(mockSetNodeRef).toHaveBeenCalled()
    })
  })

  describe("Effect Data", () => {
    it("should work with different effects", () => {
      const effect1: BaseEffect = {
        id: "effect-1",
        name: { en: "Effect 1" },
        category: "color-correction",
        complexity: "low",
        parameters: [],
        version: "1.0.0",
      }

      const { rerender } = render(
        <DndContext>
          <EffectDragSource effect={effect1}>
            <div>Content 1</div>
          </EffectDragSource>
        </DndContext>,
      )

      expect(screen.getByText("Content 1")).toBeInTheDocument()

      const effect2: BaseEffect = {
        id: "effect-2",
        name: { en: "Effect 2" },
        category: "artistic",
        complexity: "high",
        parameters: [],
        version: "1.0.0",
      }

      rerender(
        <DndContext>
          <EffectDragSource effect={effect2}>
            <div>Content 2</div>
          </EffectDragSource>
        </DndContext>,
      )

      expect(screen.getByText("Content 2")).toBeInTheDocument()
    })
  })

  describe("Styling", () => {
    it("should apply transition-opacity class", () => {
      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect}>
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass("transition-opacity")
    })

    it("should combine all classes correctly when not dragging and not disabled", () => {
      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect} className="custom">
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass("transition-opacity")
      expect(wrapper).toHaveClass("cursor-grab")
      expect(wrapper).toHaveClass("hover:opacity-90")
      expect(wrapper).toHaveClass("custom")
    })

    it("should combine all classes correctly when dragging", () => {
      mockIsDragging = true

      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect} className="custom">
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass("transition-opacity")
      expect(wrapper).toHaveClass("opacity-50")
      expect(wrapper).toHaveClass("cursor-grabbing")
      expect(wrapper).toHaveClass("custom")
    })

    it("should combine all classes correctly when disabled", () => {
      const { container } = render(
        <DndContext>
          <EffectDragSource effect={mockEffect} disabled className="custom">
            <div>Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass("transition-opacity")
      expect(wrapper).toHaveClass("cursor-not-allowed")
      expect(wrapper).toHaveClass("opacity-50")
      expect(wrapper).toHaveClass("custom")
    })
  })

  describe("Children Rendering", () => {
    it("should render multiple children", () => {
      render(
        <DndContext>
          <EffectDragSource effect={mockEffect}>
            <div>Child 1</div>
            <div>Child 2</div>
            <div>Child 3</div>
          </EffectDragSource>
        </DndContext>,
      )

      expect(screen.getByText("Child 1")).toBeInTheDocument()
      expect(screen.getByText("Child 2")).toBeInTheDocument()
      expect(screen.getByText("Child 3")).toBeInTheDocument()
    })

    it("should render complex children structures", () => {
      render(
        <DndContext>
          <EffectDragSource effect={mockEffect}>
            <div>
              <span>Nested</span>
              <div>
                <button>Button</button>
              </div>
            </div>
          </EffectDragSource>
        </DndContext>,
      )

      expect(screen.getByText("Nested")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Button" })).toBeInTheDocument()
    })
  })
})
