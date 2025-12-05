import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ThemeProvider } from "@/config/providers/theme-provider"

// Мокаем next-themes
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="next-theme-provider">{children}</div>
  ),
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
}))

describe("ThemeProvider", () => {
  it("should render children", () => {
    render(
      <ThemeProvider>
        <div data-testid="test-child">Test</div>
      </ThemeProvider>,
    )

    // Проверяем, что дочерний компонент отрендерен
    expect(screen.getByTestId("test-child")).toBeInTheDocument()
    expect(screen.getByText("Test")).toBeInTheDocument()
  })

  it("should wrap children in NextThemeProvider", () => {
    render(
      <ThemeProvider>
        <div data-testid="test-child">Test</div>
      </ThemeProvider>,
    )

    // Проверяем, что NextThemeProvider отрендерен
    expect(screen.getByTestId("next-theme-provider")).toBeInTheDocument()

    // Проверяем, что дочерний компонент находится внутри NextThemeProvider
    expect(screen.getByTestId("next-theme-provider")).toContainElement(screen.getByTestId("test-child"))
  })
})
