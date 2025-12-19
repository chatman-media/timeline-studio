/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ProjectSettingsProvider } from "../project-settings-provider"

// Мокируем зависимости
vi.mock("../../hooks/use-project-settings", () => ({
  useProjectSettings: vi.fn(),
}))

describe("ProjectSettingsProvider", () => {
  it("должен рендериться без ошибок", () => {
    const TestComponent = () => (
      <div data-testid="test" data-oid=":wfyn:s">
        Test
      </div>
    )

    expect(() => {
      render(
        <ProjectSettingsProvider data-oid="53kmnz0">
          <TestComponent data-oid="._6koab" />
        </ProjectSettingsProvider>,
      )
    }).not.toThrow()
  })

  it("должен быть React компонентом", () => {
    expect(typeof ProjectSettingsProvider).toBe("function")
  })

  it("должен принимать children prop", () => {
    const TestComponent = () => (
      <div data-testid="test" data-oid="8djqq93">
        Test
      </div>
    )

    const { getByTestId } = render(
      <ProjectSettingsProvider data-oid="rrwskcg">
        <TestComponent data-oid="m2kh852" />
      </ProjectSettingsProvider>,
    )

    expect(getByTestId("test")).toBeInTheDocument()
  })
})
