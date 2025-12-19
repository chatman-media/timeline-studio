/**
 * @vitest-environment jsdom
 */
/**
 * Unit tests for ThemeProvider
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ThemeProvider, useTheme } from "../theme-provider"

// Mock next-themes
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="next-theme-provider" data-oid=":z9q.5n">
      {children}
    </div>
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
      <ThemeProvider data-oid="w2l2dc0">
        <div data-testid="child" data-oid="1bkec.m">
          Test Child
        </div>
      </ThemeProvider>,
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
    expect(screen.getByText("Test Child")).toBeInTheDocument()
  })

  it("should wrap children in NextThemeProvider", () => {
    render(
      <ThemeProvider data-oid="za_ujgp">
        <div data-oid="._._13v">Content</div>
      </ThemeProvider>,
    )

    expect(screen.getByTestId("next-theme-provider")).toBeInTheDocument()
  })

  it("should render multiple children", () => {
    render(
      <ThemeProvider data-oid="vt.von6">
        <div data-testid="child-1" data-oid="5_-4q-c">
          Child 1
        </div>
        <div data-testid="child-2" data-oid="kb35nm3">
          Child 2
        </div>
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
