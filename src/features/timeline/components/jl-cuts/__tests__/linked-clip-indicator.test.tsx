/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { LinkedClipIndicator } from "../linked-clip-indicator"

describe("LinkedClipIndicator", () => {
  it("should render when isLinked is true", () => {
    render(<LinkedClipIndicator isLinked={true} />)

    const icon = screen.getByTestId("link2-icon")
    expect(icon).toBeInTheDocument()

    const indicator = icon.parentElement!
    expect(indicator).toBeInTheDocument()
  })

  it("should not render when isLinked is false", () => {
    const { container } = render(<LinkedClipIndicator isLinked={false} />)

    expect(container.firstChild).toBeNull()
  })

  it("should apply default classes", () => {
    render(<LinkedClipIndicator isLinked={true} />)

    const icon = screen.getByTestId("link2-icon")
    const indicator = icon.parentElement!
    expect(indicator).toHaveClass("absolute bottom-0 right-0 m-1")
    expect(indicator).toHaveClass("bg-primary/10 border border-primary/30 rounded p-0.5")
  })

  it("should apply custom className", () => {
    const customClass = "custom-indicator-class"
    render(<LinkedClipIndicator isLinked={true} className={customClass} />)

    const icon = screen.getByTestId("link2-icon")
    const indicator = icon.parentElement!
    expect(indicator).toHaveClass(customClass)
  })

  it("should have proper styling for the Link2 icon", () => {
    render(<LinkedClipIndicator isLinked={true} />)

    const icon = screen.getByTestId("link2-icon")
    expect(icon).toHaveClass("h-3 w-3 text-primary")
  })

  it("should be positioned as an overlay indicator", () => {
    render(<LinkedClipIndicator isLinked={true} />)

    const icon = screen.getByTestId("link2-icon")
    const indicator = icon.parentElement!

    // Проверяем что это абсолютно позиционированный элемент в правом нижнем углу
    expect(indicator).toHaveClass("absolute bottom-0 right-0")
  })

  it("should handle undefined className gracefully", () => {
    render(<LinkedClipIndicator isLinked={true} className={undefined} />)

    const icon = screen.getByTestId("link2-icon")
    const indicator = icon.parentElement!
    expect(indicator).toBeInTheDocument()
  })
})
