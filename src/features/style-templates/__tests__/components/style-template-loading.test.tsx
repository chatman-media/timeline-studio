import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { StyleTemplateLoading } from "../../components/style-template-loading"

describe("StyleTemplateLoading", () => {
  it("должен отображать индикатор загрузки", () => {
    render(<StyleTemplateLoading />)

    expect(screen.getByText("Загрузка шаблонов...")).toBeInTheDocument()
  })

  it("должен отображать анимированный спиннер", () => {
    render(<StyleTemplateLoading />)

    const spinner = screen.getByTestId("loader2-icon")
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass("animate-spin")
  })

  it("должен иметь правильную структуру", () => {
    const renderResult = render(<StyleTemplateLoading />)

    expect(renderResult.container.firstChild).toHaveClass("flex flex-col items-center justify-center")
  })

  it("должен центрировать содержимое", () => {
    render(<StyleTemplateLoading />)

    const loadingContainer = screen.getByText("Загрузка шаблонов...").parentElement
    expect(loadingContainer).toHaveClass("flex flex-col items-center justify-center")
  })
})
