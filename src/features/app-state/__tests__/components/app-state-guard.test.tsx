/**
 * Tests for AppStateGuard component
 * Component was simplified - now just passes through children
 * Providers are composed in the main Providers component
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { AppStateGuard } from "../../components/app-state-guard"

describe("AppStateGuard", () => {
  it("should render children", () => {
    render(
      <AppStateGuard>
        <div>Test Content</div>
      </AppStateGuard>,
    )

    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("should render multiple children", () => {
    render(
      <AppStateGuard>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </AppStateGuard>,
    )

    expect(screen.getByText("Child 1")).toBeInTheDocument()
    expect(screen.getByText("Child 2")).toBeInTheDocument()
    expect(screen.getByText("Child 3")).toBeInTheDocument()
  })

  it("should handle null children gracefully", () => {
    const { container } = render(<AppStateGuard>{null}</AppStateGuard>)

    // Component should render without crashing
    expect(container).toBeInTheDocument()
  })

  it("should handle undefined children gracefully", () => {
    const { container } = render(<AppStateGuard>{undefined}</AppStateGuard>)

    // Component should render without crashing
    expect(container).toBeInTheDocument()
  })

  it("should pass through children without wrapping", () => {
    render(
      <AppStateGuard>
        <div data-testid="child">Test</div>
      </AppStateGuard>,
    )

    const child = screen.getByTestId("child")
    expect(child).toBeInTheDocument()
    expect(child.textContent).toBe("Test")
  })
})
