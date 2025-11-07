import { act, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { StyleTemplateErrorBoundary } from "../../components/style-template-error-boundary"

// Компонент, который выбрасывает ошибку
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error")
  }
  return <div>No error</div>
}

describe("StyleTemplateErrorBoundary", () => {
  beforeEach(() => {
    // Подавляем ошибки в консоли для тестов
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("должен отображать дочерние компоненты если нет ошибки", () => {
    render(
      <StyleTemplateErrorBoundary>
        <ThrowError shouldThrow={false} />
      </StyleTemplateErrorBoundary>,
    )

    expect(screen.getByText("No error")).toBeInTheDocument()
  })

  it("должен отображать сообщение об ошибке при возникновении ошибки", () => {
    render(
      <StyleTemplateErrorBoundary>
        <ThrowError shouldThrow={true} />
      </StyleTemplateErrorBoundary>,
    )

    expect(screen.getByText("Ошибка загрузки шаблонов")).toBeInTheDocument()
  })

  it("должен отображать кнопку повтора", () => {
    render(
      <StyleTemplateErrorBoundary>
        <ThrowError shouldThrow={true} />
      </StyleTemplateErrorBoundary>,
    )

    expect(screen.getByRole("button", { name: /попробовать снова/i })).toBeInTheDocument()
  })

  it("должен сбрасывать ошибку при нажатии на кнопку повтора", () => {
    const { rerender } = render(
      <StyleTemplateErrorBoundary>
        <ThrowError shouldThrow={true} />
      </StyleTemplateErrorBoundary>,
    )

    // Проверяем, что отображается ошибка
    expect(screen.getByText("Ошибка загрузки шаблонов")).toBeInTheDocument()

    // Сначала перерендериваем с исправленным компонентом
    act(() => {
      rerender(
        <StyleTemplateErrorBoundary>
          <ThrowError shouldThrow={false} />
        </StyleTemplateErrorBoundary>,
      )
    })

    // Нажимаем кнопку повтора для сброса состояния ошибки
    const retryButton = screen.getByRole("button", {
      name: /попробовать снова/i,
    })
    act(() => {
      retryButton.click()
    })

    // Проверяем, что ошибка исчезла
    expect(screen.getByText("No error")).toBeInTheDocument()
  })

  it("должен иметь правильную структуру при ошибке", () => {
    const renderResult = render(
      <StyleTemplateErrorBoundary>
        <ThrowError shouldThrow={true} />
      </StyleTemplateErrorBoundary>,
    )

    expect(renderResult.container.firstChild).toHaveClass(
      "flex h-64 w-full flex-col items-center justify-center",
    )
  })

  it("должен центрировать содержимое ошибки", () => {
    render(
      <StyleTemplateErrorBoundary>
        <ThrowError shouldThrow={true} />
      </StyleTemplateErrorBoundary>,
    )

    const errorContainer = screen.getByText("Ошибка загрузки шаблонов").parentElement
    expect(errorContainer).toHaveClass("flex h-64 w-full flex-col items-center justify-center")
  })

  it("должен отображать иконку ошибки", () => {
    render(
      <StyleTemplateErrorBoundary>
        <ThrowError shouldThrow={true} />
      </StyleTemplateErrorBoundary>,
    )

    expect(screen.getByTestId("alerttriangle-icon")).toBeInTheDocument()
  })
})
