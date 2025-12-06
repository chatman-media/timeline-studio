/**
 * Unit tests for ThemeProvider
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ThemeProvider, useTheme } from "../theme-provider"

// Mock next-themes
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="next-theme-provider">{children}</div>
  ),
  useTheme: vi.fn(() => ({
    theme: "dark",
    setTheme: vi.fn(),
    systemTheme: "dark",
  })),
}))

describe("ThemeProvider", () => {
  it("should render children", () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test Child</div>
      </ThemeProvider>,
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
    expect(screen.getByText("Test Child")).toBeInTheDocument()
  })

  it("should wrap children in NextThemeProvider", () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>,
    )

    expect(screen.getByTestId("next-theme-provider")).toBeInTheDocument()
  })

  it("should render multiple children", () => {
    render(
      <ThemeProvider>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </ThemeProvider>,
    )

    expect(screen.getByTestId("child-1")).toBeInTheDocument()
    expect(screen.getByTestId("child-2")).toBeInTheDocument()
  })
})

describe("useTheme re-export", () => {
  it("should re-export useTheme from next-themes", () => {
    expect(useTheme).toBeDefined()
    expect(typeof useTheme).toBe("function")
  })

  it("should return theme hook result", () => {
    const result = useTheme()
    expect(result).toHaveProperty("theme")
    expect(result).toHaveProperty("setTheme")
  })
})
