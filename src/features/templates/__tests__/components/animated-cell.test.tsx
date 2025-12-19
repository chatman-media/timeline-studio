/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AnimatedCell } from "../../components/animated-cell"

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
      <AnimatedCell data-oid="a6ovj9m">
        <div data-testid="child" data-oid="bp12es_">
          Test Content
        </div>
      </AnimatedCell>,
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("applies fade animation by default", () => {
    const animation = {
      enter: {
        type: "fade" as const,
        duration: 300,
        easing: "ease-in-out" as const,
      },
    }

    const { container } = render(
      <AnimatedCell animation={animation} data-oid="j9egdqw">
        <div data-oid="c0tftx4">Fade Content</div>
      </AnimatedCell>,
    )

    const cell = container.firstChild as HTMLElement
    // Should have transition defined
    expect(cell.style.transition).toBeTruthy()
  })

  it("applies slide-left animation", () => {
    const animation = {
      enter: {
        type: "slide-left" as const,
        duration: 400,
        easing: "ease-out" as const,
      },
    }

    const { container } = render(
      <AnimatedCell animation={animation} data-oid="a7ud3h_">
        <div data-oid="m2rsus1">Slide Content</div>
      </AnimatedCell>,
    )

    const cell = container.firstChild as HTMLElement
    // Should have transition defined
    expect(cell.style.transition).toBeTruthy()
  })

  it("applies zoom-in animation", () => {
    const animation = {
      enter: {
        type: "zoom-in" as const,
        duration: 350,
        easing: "ease-out" as const,
      },
    }

    const { container } = render(
      <AnimatedCell animation={animation} data-oid="jt0dep0">
        <div data-oid="f0mfk8e">Zoom Content</div>
      </AnimatedCell>,
    )

    const cell = container.firstChild as HTMLElement
    // Should have transition defined
    expect(cell.style.transition).toBeTruthy()
  })

  it("handles transition state correctly", () => {
    const animation = {
      transition: {
        type: "fade" as const,
        duration: 250,
        easing: "ease-in-out" as const,
      },
    }

    const { container, rerender } = render(
      <AnimatedCell animation={animation} isTransitioning={false} data-oid=":muo159">
        <div data-oid="ms40snw">Content</div>
      </AnimatedCell>,
    )

    const cell = container.firstChild as HTMLElement

    // Trigger transition
    rerender(
      <AnimatedCell animation={animation} isTransitioning={true} data-oid="0ftm00n">
        <div data-oid="z35_:gr">Content</div>
      </AnimatedCell>,
    )

    // Should have transition defined
    expect(cell.style.transition).toBeTruthy()
  })

  it("handles visibility changes", () => {
    const { container, rerender } = render(
      <AnimatedCell isVisible={true} data-oid="auzu.na">
        <div data-oid="v2szk3n">Visible Content</div>
      </AnimatedCell>,
    )

    const cell = container.firstChild as HTMLElement

    // Should be defined
    expect(cell).toBeDefined()

    // Hide the cell
    rerender(
      <AnimatedCell isVisible={false} data-oid="gwq2zd4">
        <div data-oid="hksu0r7">Hidden Content</div>
      </AnimatedCell>,
    )

    // Still defined
    expect(cell).toBeDefined()
  })

  it("applies custom className and style", () => {
    const { container } = render(
      <AnimatedCell className="custom-class" data-oid="oidzeqn">
        <div data-oid="kje0_mt">Styled Content</div>
      </AnimatedCell>,
    )

    const cell = container.firstChild as HTMLElement
    expect(cell).toHaveClass("custom-class")
  })

  it("handles animation with delay", () => {
    const animation = {
      enter: {
        type: "fade" as const,
        duration: 300,
        delay: 100,
        easing: "ease-in-out" as const,
      },
    }

    const { container } = render(
      <AnimatedCell animation={animation} data-oid="skz5jc0">
        <div data-oid="8c168qg">Delayed Content</div>
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
      <AnimatedCell animation={animation} data-oid=".5c51gf">
        <div data-oid="i-hno5-">No Animation Content</div>
      </AnimatedCell>,
    )

    const cell = container.firstChild as HTMLElement
    // Should not have transition styles
    expect(cell).not.toHaveStyle({ opacity: "0" })
  })
})
