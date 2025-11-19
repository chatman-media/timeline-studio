/**
 * Тесты для StyleTemplateDragSource
 */

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { StyleTemplate } from "../../types"
import { StyleTemplateDragSource } from "../style-template-drag-source"

// Мок для @dnd-kit/core
vi.mock("@dnd-kit/core", () => ({
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
    transform: null,
  })),
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

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

  it("должен применять cursor-grab когда не перетаскивается", () => {
    const { container } = render(
      <StyleTemplateDragSource template={mockTemplate}>
        <div>Test</div>
      </StyleTemplateDragSource>,
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain("cursor-grab")
  })

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
})
