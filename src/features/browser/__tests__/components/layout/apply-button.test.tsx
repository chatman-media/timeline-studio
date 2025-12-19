/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { ResourceType, TimelineResource } from "@/domains/shared/types/resources"
import { ApplyButton } from "@/features/browser/components/layout/apply-button"

// Mock the logger with a spy - use vi.hoisted to ensure these are created before the mock
const { mockInfo, mockWarn, mockError, mockDebug, mockTrace } = vi.hoisted(() => ({
  mockInfo: vi.fn(),
  mockWarn: vi.fn(),
  mockError: vi.fn(),
  mockDebug: vi.fn(),
  mockTrace: vi.fn(),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: mockInfo,
    warn: mockWarn,
    error: mockError,
    debug: mockDebug,
    trace: mockTrace,
  }),
}))

describe("ApplyButton", () => {
  const mockResource = {
    id: "test-resource",
    type: "media" as const,
    name: "Test Resource",
    resourceId: "media-1",
    addedAt: Date.now(),
    file: {
      id: "file-1",
      file_path: "/path/to/file.mp4",
      file_name: "file.mp4",
      media_type: "Video" as const,
      duration: 10,
      file_size: 1024,
    },
  }

  it("should render apply button", () => {
    render(
      <ApplyButton resource={mockResource as unknown as TimelineResource} size={150} type="media" data-oid="19xg1xc" />,
    )

    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()
  })

  it("should call onApply callback when clicked", () => {
    const onApply = vi.fn()

    render(
      <ApplyButton
        resource={mockResource as unknown as TimelineResource}
        size={150}
        type="media"
        onApply={onApply}
        data-oid="drmhv39"
      />,
    )

    const button = screen.getByRole("button")
    fireEvent.click(button)

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith(mockResource as unknown as TimelineResource, "media")
  })

  it("should log to logger when onApply is not provided", () => {
    mockInfo.mockClear()

    render(
      <ApplyButton resource={mockResource as unknown as TimelineResource} size={150} type="media" data-oid="ru4-rar" />,
    )

    const button = screen.getByRole("button")
    fireEvent.click(button)

    expect(mockInfo).toHaveBeenCalledWith(
      "ApplyButton clicked",
      expect.objectContaining({ resourceId: "test-resource", type: "media" }),
    )
  })

  it("should stop event propagation", () => {
    const onApply = vi.fn()
    const containerClick = vi.fn()

    render(
      <div onClick={containerClick} data-oid="isomvv6">
        <ApplyButton
          resource={mockResource as unknown as TimelineResource}
          size={150}
          type="media"
          onApply={onApply}
          data-oid="w4j7ujt"
        />
      </div>,
    )

    const button = screen.getByRole("button")
    fireEvent.click(button)

    expect(onApply).toHaveBeenCalled()
    expect(containerClick).not.toHaveBeenCalled()
  })

  it("should handle different resource types", () => {
    const onApply = vi.fn()
    const types: ResourceType[] = [
      "media",
      "effect",
      "filter",
      "template",
      "transition",
      "music",
      "subtitle",
      "styleTemplate",
    ]

    types.forEach((type) => {
      const { unmount } = render(
        <ApplyButton
          resource={{ ...mockResource, type } as unknown as TimelineResource}
          size={150}
          type={type}
          onApply={onApply}
          data-oid="e3c:bv."
        />,
      )

      const button = screen.getByRole("button")
      fireEvent.click(button)

      expect(onApply).toHaveBeenLastCalledWith({ ...(mockResource as unknown as TimelineResource), type }, type)

      unmount()
    })

    expect(onApply).toHaveBeenCalledTimes(types.length)
  })

  it("should apply correct styles based on size", () => {
    const sizes = [50, 100, 150, 200]

    sizes.forEach((size) => {
      const { container, unmount } = render(
        <ApplyButton
          resource={mockResource as unknown as TimelineResource}
          size={size}
          type="media"
          data-oid="58ldn--"
        />,
      )

      const button = container.querySelector("button")
      expect(button).toHaveStyle({
        bottom: `${20 + size / 25}px`,
      })

      const icon = container.querySelector("svg")
      expect(icon).toHaveStyle({
        height: `${6 + size / 30}px`,
        width: `${6 + size / 30}px`,
      })

      unmount()
    })
  })

  it("should have correct accessibility attributes", () => {
    render(
      <ApplyButton resource={mockResource as unknown as TimelineResource} size={150} type="media" data-oid="2gm:it5" />,
    )

    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("type", "button")
  })

  it("should have correct hover and focus classes", () => {
    render(
      <ApplyButton resource={mockResource as unknown as TimelineResource} size={150} type="media" data-oid="xcb1kf1" />,
    )

    const button = screen.getByRole("button")
    expect(button.className).toContain("group-hover:visible")
    expect(button.className).toContain("focus:ring-2")
    expect(button.className).toContain("focus:ring-teal")
  })

  it("should prevent default on onApply call", () => {
    const onApply = vi.fn()

    render(
      <ApplyButton
        resource={mockResource as unknown as TimelineResource}
        size={150}
        type="media"
        onApply={onApply}
        data-oid="-fd7uqx"
      />,
    )

    const button = screen.getByRole("button")
    const event = new MouseEvent("click", { bubbles: true })
    vi.spyOn(event, "stopPropagation")

    button.dispatchEvent(event)

    expect(event.stopPropagation).toHaveBeenCalled()
  })

  it("should render ArrowRight icon", () => {
    const { container } = render(
      <ApplyButton resource={mockResource as unknown as TimelineResource} size={150} type="media" data-oid="_3hae4g" />,
    )

    const icon = container.querySelector("svg")
    expect(icon).toBeInTheDocument()

    // Проверяем класс через getAttribute для SVG элементов
    const iconClass = icon?.getAttribute("class") || ""
    expect(iconClass).toContain("transition-transform")
    expect(iconClass).toContain("hover:scale-110")
  })
})
