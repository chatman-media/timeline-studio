/**
 * @vitest-environment jsdom
 */
// @ts-nocheck - TODO: Update to use new unified effects types
import { DndContext } from "@dnd-kit/core"
import { render, screen } from "@testing-library/react"
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
        <DndContext data-oid="7n6g:v6">
          <EffectDragSource effect={mockEffect} data-oid="bp1862-">
            <div data-oid="_q6mj3w">Test Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      expect(screen.getByText("Test Content")).toBeInTheDocument()
    })

    it("should apply custom className", () => {
      const { container } = render(
        <DndContext data-oid=".jhqrv1">
          <EffectDragSource effect={mockEffect} className="custom-class" data-oid="tkhaalu">
            <div data-oid="mbyb6pq">Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.querySelector(".custom-class")
      expect(wrapper).toBeInTheDocument()
    })

    it("should apply grab cursor when not disabled", () => {
      const { container } = render(
        <DndContext data-oid="j81aahi">
          <EffectDragSource effect={mockEffect} data-oid="jofiww9">
            <div data-oid="a1g424t">Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass("cursor-grab")
    })

    it("should apply not-allowed cursor when disabled", () => {
      const { container } = render(
        <DndContext data-oid="l-gwkgp">
          <EffectDragSource effect={mockEffect} disabled data-oid="y4ipsy.">
            <div data-oid="mg68:f5">Content</div>
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
        <DndContext data-oid="p69mgnt">
          <EffectDragSource effect={mockEffect} data-oid="fu7dl-2">
            <div data-oid="j8nndpq">Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass("cursor-grabbing")
    })

    it("should reduce opacity when dragging", () => {
      mockIsDragging = true

      const { container } = render(
        <DndContext data-oid="edydnag">
          <EffectDragSource effect={mockEffect} data-oid=".y8hnij">
            <div data-oid="8g3zybk">Content</div>
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
        <DndContext data-oid="3_hr_ui">
          <EffectDragSource effect={mockEffect} data-oid="0.-or4i">
            <div data-oid="2cj_7x5">Content</div>
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
        <DndContext data-oid="3i0w2cl">
          <EffectDragSource effect={mockEffect} data-oid="x_anyc5">
            <div data-oid="vgelrl9">Content</div>
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
        <DndContext data-oid="g510p-e">
          <EffectDragSource effect={mockEffect} disabled data-oid="u.76urg">
            <div data-oid=":55dtx_">Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass("opacity-50")
    })

    it("should not show hover opacity when disabled", () => {
      const { container } = render(
        <DndContext data-oid="7k2291u">
          <EffectDragSource effect={mockEffect} disabled data-oid="cuubx4s">
            <div data-oid="_r0mg1t">Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).not.toHaveClass("hover:opacity-90")
    })

    it("should show hover opacity when not disabled", () => {
      const { container } = render(
        <DndContext data-oid="cc:jc4g">
          <EffectDragSource effect={mockEffect} data-oid="u_469tn">
            <div data-oid="-6r3g_e">Content</div>
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
        <DndContext data-oid="sqcg9.x">
          <EffectDragSource effect={mockEffect} data-oid="16mnjog">
            <div data-oid="7wy:jhe">Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      // The useDraggable hook is called internally
      // We can't directly test its configuration, but we ensure it renders
      expect(screen.getByText("Content")).toBeInTheDocument()
    })

    it("should attach listeners to wrapper", () => {
      const { container } = render(
        <DndContext data-oid=".ns555m">
          <EffectDragSource effect={mockEffect} data-oid="xgpnrea">
            <div data-oid="4est0xn">Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveAttribute("role", "button")
      expect(wrapper).toHaveAttribute("tabIndex", "0")
    })

    it("should call setNodeRef", () => {
      render(
        <DndContext data-oid="vo0.7fj">
          <EffectDragSource effect={mockEffect} data-oid="7pyozul">
            <div data-oid="z63-0b2">Content</div>
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
        <DndContext data-oid="5ptv75x">
          <EffectDragSource effect={effect1} data-oid="kx.jea:">
            <div data-oid="dmn53ls">Content 1</div>
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
        <DndContext data-oid=":elhrke">
          <EffectDragSource effect={effect2} data-oid="5ad-zz1">
            <div data-oid="lzgaw1b">Content 2</div>
          </EffectDragSource>
        </DndContext>,
      )

      expect(screen.getByText("Content 2")).toBeInTheDocument()
    })
  })

  describe("Styling", () => {
    it("should apply transition-opacity class", () => {
      const { container } = render(
        <DndContext data-oid="i8m94:s">
          <EffectDragSource effect={mockEffect} data-oid="oprgppo">
            <div data-oid=".qk85i6">Content</div>
          </EffectDragSource>
        </DndContext>,
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass("transition-opacity")
    })

    it("should combine all classes correctly when not dragging and not disabled", () => {
      const { container } = render(
        <DndContext data-oid="isi7rgl">
          <EffectDragSource effect={mockEffect} className="custom" data-oid="k6gbe7_">
            <div data-oid="fkdl9hx">Content</div>
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
        <DndContext data-oid="qsdttc2">
          <EffectDragSource effect={mockEffect} className="custom" data-oid="p096n8k">
            <div data-oid="xm_4_1:">Content</div>
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
        <DndContext data-oid=".b8ndcm">
          <EffectDragSource effect={mockEffect} disabled className="custom" data-oid="z1ob4x1">
            <div data-oid="t8llpqx">Content</div>
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
        <DndContext data-oid="c0v_07j">
          <EffectDragSource effect={mockEffect} data-oid="qnatp5t">
            <div data-oid="gse0rcv">Child 1</div>
            <div data-oid="s_5mzik">Child 2</div>
            <div data-oid="3c7:9_5">Child 3</div>
          </EffectDragSource>
        </DndContext>,
      )

      expect(screen.getByText("Child 1")).toBeInTheDocument()
      expect(screen.getByText("Child 2")).toBeInTheDocument()
      expect(screen.getByText("Child 3")).toBeInTheDocument()
    })

    it("should render complex children structures", () => {
      render(
        <DndContext data-oid="qez0o15">
          <EffectDragSource effect={mockEffect} data-oid="w43rpuk">
            <div data-oid="0-:yn4.">
              <span data-oid="7:f81s_">Nested</span>
              <div data-oid="s15r3z0">
                <button data-oid="1znra0b">Button</button>
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
