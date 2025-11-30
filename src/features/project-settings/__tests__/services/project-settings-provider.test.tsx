import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ProjectSettingsProvider } from "../../services/project-settings-provider"

// Мокируем зависимости
vi.mock("../../hooks/use-project-settings", () => ({
  useProjectSettings: vi.fn(),
}))

describe("ProjectSettingsProvider", () => {
  it("должен рендериться без ошибок", () => {
    const TestComponent = () => <div data-testid="test">Test</div>

    expect(() => {
      render(
        <ProjectSettingsProvider>
          <TestComponent />
        </ProjectSettingsProvider>,
      )
    }).not.toThrow()
  })

  it("должен быть React компонентом", () => {
    expect(typeof ProjectSettingsProvider).toBe("function")
  })

  it("должен принимать children prop", () => {
    const TestComponent = () => <div data-testid="test">Test</div>

    const { getByTestId } = render(
      <ProjectSettingsProvider>
        <TestComponent />
      </ProjectSettingsProvider>,
    )

    expect(getByTestId("test")).toBeInTheDocument()
  })
})
