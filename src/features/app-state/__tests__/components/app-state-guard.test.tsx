/**
 * Tests for AppStateGuard component
 * Tests provider wrapping and children rendering
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AppStateGuard } from "../../components/app-state-guard"

// Mock providers
vi.mock("@/shared/services/ai/react-integration", () => ({
  AIServicesProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ai-services-provider">{children}</div>
  ),
}))

vi.mock("../../services/app-provider", () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="app-provider">{children}</div>,
}))

describe("AppStateGuard", () => {
  it("should render children", () => {
    render(
      <AppStateGuard>
        <div>Test Content</div>
      </AppStateGuard>,
    )

    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("should wrap children with AIServicesProvider", () => {
    render(
      <AppStateGuard>
        <div>Test</div>
      </AppStateGuard>,
    )

    expect(screen.getByTestId("ai-services-provider")).toBeInTheDocument()
  })

  it("should wrap children with AppProvider", () => {
    render(
      <AppStateGuard>
        <div>Test</div>
      </AppStateGuard>,
    )

    expect(screen.getByTestId("app-provider")).toBeInTheDocument()
  })

  it("should maintain provider hierarchy (AI -> App -> Children)", () => {
    const { container } = render(
      <AppStateGuard>
        <div data-testid="child">Test</div>
      </AppStateGuard>,
    )

    const aiProvider = screen.getByTestId("ai-services-provider")
    const appProvider = screen.getByTestId("app-provider")
    const child = screen.getByTestId("child")

    // Check that appProvider is inside aiProvider
    expect(aiProvider).toContainElement(appProvider)
    // Check that child is inside appProvider
    expect(appProvider).toContainElement(child)
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
    render(<AppStateGuard>{null}</AppStateGuard>)

    expect(screen.getByTestId("app-provider")).toBeInTheDocument()
  })

  it("should handle undefined children gracefully", () => {
    render(<AppStateGuard>{undefined}</AppStateGuard>)

    expect(screen.getByTestId("app-provider")).toBeInTheDocument()
  })
})
