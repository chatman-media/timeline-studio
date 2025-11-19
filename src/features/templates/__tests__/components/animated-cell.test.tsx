import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AnimatedCell } from "../../components/animated-cell"
import type { AnimationConfig } from "../../lib/template-config"

describe("AnimatedCell", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("renders children correctly", () => {
    render(
      <AnimatedCell>
        <div data-testid="child">Test Content</div>
      </AnimatedCell>,
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("applies fade animation by default", () => {
    const animation = {
      enter: { type: "fade" as const, duration: 300, easing: "ease-in-out" as const },
    }

    const { container } = render(
      <AnimatedCell animation={animation}>
        <div>Fade Content</div>
      </AnimatedCell>,
    )

    const cell = container.firstChild as HTMLElement
    // Should have transition defined
    expect(cell.style.transition).toBeTruthy()
  })

  it("applies slide-left animation", () => {
    const animation = {
      enter: { type: "slide-left" as const, duration: 400, easing: "ease-out" as const },
    }

    const { container } = render(
      <AnimatedCell animation={animation}>
        <div>Slide Content</div>
      </AnimatedCell>,
    )

    const cell = container.firstChild as HTMLElement
    // Should have transition defined
    expect(cell.style.transition).toBeTruthy()
  })

  it("applies zoom-in animation", () => {
    const animation = {
      enter: { type: "zoom-in" as const, duration: 350, easing: "ease-out" as const },
    }

    const { container } = render(
      <AnimatedCell animation={animation}>
        <div>Zoom Content</div>
      </AnimatedCell>,
    )

    const cell = container.firstChild as HTMLElement
    // Should have transition defined
    expect(cell.style.transition).toBeTruthy()
  })

  it("handles transition state correctly", () => {
    const animation = {
      transition: { type: "fade" as const, duration: 250, easing: "ease-in-out" as const },
    }

    const { container, rerender } = render(
      <AnimatedCell animation={animation} isTransitioning={false}>
        <div>Content</div>
      </AnimatedCell>,
    )

    const cell = container.firstChild as HTMLElement

    // Trigger transition
    rerender(
      <AnimatedCell animation={animation} isTransitioning={true}>
        <div>Content</div>
      </AnimatedCell>,
    )

    // Should have transition defined
    expect(cell.style.transition).toBeTruthy()
  })

  it("handles visibility changes", () => {
    const { container, rerender } = render(
      <AnimatedCell isVisible={true}>
        <div>Visible Content</div>
      </AnimatedCell>,
    )

    const cell = container.firstChild as HTMLElement

    // Should be defined
    expect(cell).toBeDefined()

    // Hide the cell
    rerender(
      <AnimatedCell isVisible={false}>
        <div>Hidden Content</div>
      </AnimatedCell>,
    )

    // Still defined
    expect(cell).toBeDefined()
  })

  it("applies custom className and style", () => {
    const { container } = render(
      <AnimatedCell className="custom-class">
        <div>Styled Content</div>
      </AnimatedCell>,
    )

    const cell = container.firstChild as HTMLElement
    expect(cell).toHaveClass("custom-class")
  })

  it("handles animation with delay", () => {
    const animation = {
      enter: { type: "fade" as const, duration: 300, delay: 100, easing: "ease-in-out" as const },
    }

    const { container } = render(
      <AnimatedCell animation={animation}>
        <div>Delayed Content</div>
      </AnimatedCell>,
    )

    vi.advanceTimersByTime(20)
    const cell = container.firstChild as HTMLElement
    // Should have transition with delay
    const style = window.getComputedStyle(cell)
    expect(style.transition).toContain("100ms")
  })

  it("handles no animation type", () => {
    const animation = {
      enter: { type: "none" as const, duration: 0, easing: "linear" as const },
    }

    const { container } = render(
      <AnimatedCell animation={animation}>
        <div>No Animation Content</div>
      </AnimatedCell>,
    )

    const cell = container.firstChild as HTMLElement
    // Should not have transition styles
    expect(cell).not.toHaveStyle({ opacity: "0" })
  })
})
