/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { StyleTemplateErrorBoundary, withStyleTemplateErrorBoundary } from "../style-template-error-boundary"

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error message")
  }
  return <div data-oid="i.k13gs">Normal content</div>
}

describe("StyleTemplateErrorBoundary", () => {
  // Suppress console.error for these tests
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })
  afterEach(() => {
    console.error = originalError
  })

  it("should render children when there is no error", () => {
    render(
      <StyleTemplateErrorBoundary data-oid="_zqnjd3">
        <div data-oid="m.u5haw">Test content</div>
      </StyleTemplateErrorBoundary>,
    )

    expect(screen.getByText("Test content")).toBeInTheDocument()
  })

  it("should render default error UI when error occurs", () => {
    render(
      <StyleTemplateErrorBoundary data-oid="jug3hb7">
        <ThrowError shouldThrow={true} data-oid="boimq3j" />
      </StyleTemplateErrorBoundary>,
    )

    expect(screen.getByText("Ошибка загрузки шаблонов")).toBeInTheDocument()
    expect(screen.getByText("Test error message")).toBeInTheDocument()
    expect(screen.getByText("Попробовать снова")).toBeInTheDocument()
  })

  it("should render custom fallback when provided", () => {
    const customFallback = <div data-oid="m1adxv3">Custom error fallback</div>

    render(
      <StyleTemplateErrorBoundary fallback={customFallback} data-oid="0.1k48:">
        <ThrowError shouldThrow={true} data-oid="_lgjogm" />
      </StyleTemplateErrorBoundary>,
    )

    expect(screen.getByText("Custom error fallback")).toBeInTheDocument()
    expect(screen.queryByText("Ошибка загрузки шаблонов")).not.toBeInTheDocument()
  })

  it("should log error to console", () => {
    // Spy на componentDidCatch чтобы убедиться что он вызывается
    const componentDidCatchSpy = vi.spyOn(StyleTemplateErrorBoundary.prototype, "componentDidCatch")

    render(
      <StyleTemplateErrorBoundary data-oid="xfr9r2o">
        <ThrowError shouldThrow={true} data-oid="rl7xgtf" />
      </StyleTemplateErrorBoundary>,
    )

    // Проверяем что componentDidCatch был вызван с ошибкой и errorInfo
    expect(componentDidCatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Test error message" }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    )

    componentDidCatchSpy.mockRestore()
  })

  it("should handle retry button click", async () => {
    const user = userEvent.setup()
    let throwError = true

    const TestComponent = () => {
      if (throwError) {
        throw new Error("Test error")
      }
      return <div data-oid=".b4wj3x">Success after retry</div>
    }

    const { rerender } = render(
      <StyleTemplateErrorBoundary data-oid="phpmxk1">
        <TestComponent data-oid="9yl2y2g" />
      </StyleTemplateErrorBoundary>,
    )

    // Initially shows error
    expect(screen.getByText("Ошибка загрузки шаблонов")).toBeInTheDocument()

    // Set to not throw error anymore
    throwError = false

    // Click retry button
    const retryButton = screen.getByText("Попробовать снова")
    await user.click(retryButton)

    // Should reset error state and try to render children again
    rerender(
      <StyleTemplateErrorBoundary data-oid="o8zu3h3">
        <TestComponent data-oid="h5t8hhs" />
      </StyleTemplateErrorBoundary>,
    )

    expect(screen.getByText("Success after retry")).toBeInTheDocument()
    expect(screen.queryByText("Ошибка загрузки шаблонов")).not.toBeInTheDocument()
  })

  it("should show unknown error message when error has no message", () => {
    const ErrorWithoutMessage = () => {
      throw new Error()
    }

    render(
      <StyleTemplateErrorBoundary data-oid="pd1kkbn">
        <ErrorWithoutMessage data-oid="ji3jit." />
      </StyleTemplateErrorBoundary>,
    )

    expect(screen.getByText("Произошла неизвестная ошибка")).toBeInTheDocument()
  })

  it("should have proper styling for error UI", () => {
    render(
      <StyleTemplateErrorBoundary data-oid=":zhvktn">
        <ThrowError shouldThrow={true} data-oid="_5xpu08" />
      </StyleTemplateErrorBoundary>,
    )

    const errorContainer = screen.getByText("Ошибка загрузки шаблонов").parentElement?.parentElement
    expect(errorContainer).toBeDefined()

    const errorIcon = errorContainer?.querySelector(".h-12.w-12")
    expect(errorIcon).toBeInTheDocument()

    const retryButton = screen.getByText("Попробовать снова")
    expect(retryButton).toHaveClass("flex items-center gap-2 rounded-md bg-red-600")
  })

  it("should have refresh icon in retry button", () => {
    render(
      <StyleTemplateErrorBoundary data-oid="sis608c">
        <ThrowError shouldThrow={true} data-oid="6x_dsb0" />
      </StyleTemplateErrorBoundary>,
    )

    const retryButton = screen.getByText("Попробовать снова")
    const refreshIcon = retryButton.querySelector(".h-4.w-4")
    expect(refreshIcon).toBeInTheDocument()
  })
})

describe("withStyleTemplateErrorBoundary HOC", () => {
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })
  afterEach(() => {
    console.error = originalError
  })

  it("should wrap component with error boundary", () => {
    const TestComponent = () => <div data-oid="a445gsb">Test component</div>
    const WrappedComponent = withStyleTemplateErrorBoundary(TestComponent)

    render(<WrappedComponent data-oid="6b5x:4j" />)

    expect(screen.getByText("Test component")).toBeInTheDocument()
  })

  it("should catch errors in wrapped component", () => {
    const ErrorComponent = () => {
      throw new Error("Component error")
    }
    const WrappedComponent = withStyleTemplateErrorBoundary(ErrorComponent)

    render(<WrappedComponent data-oid="3sxzwd1" />)

    expect(screen.getByText("Component error")).toBeInTheDocument()
    expect(screen.getByText("Ошибка загрузки шаблонов")).toBeInTheDocument()
  })

  it("should use custom fallback when provided", () => {
    const ErrorComponent = () => {
      throw new Error("Component error")
    }
    const customFallback = <div data-oid=":fpy92e">Custom HOC fallback</div>
    const WrappedComponent = withStyleTemplateErrorBoundary(ErrorComponent, customFallback)

    render(<WrappedComponent data-oid="z59ujz9" />)

    expect(screen.getByText("Custom HOC fallback")).toBeInTheDocument()
    expect(screen.queryByText("Ошибка загрузки шаблонов")).not.toBeInTheDocument()
  })

  it("should pass props to wrapped component", () => {
    interface TestProps {
      message: string
      count: number
    }

    const TestComponent = ({ message, count }: TestProps) => (
      <div data-oid="dlw-82t">
        {message} - {count}
      </div>
    )

    const WrappedComponent = withStyleTemplateErrorBoundary(TestComponent)

    render(<WrappedComponent message="Hello" count={42} data-oid="v7.ac_5" />)

    expect(screen.getByText("Hello - 42")).toBeInTheDocument()
  })

  it("should handle component that throws on specific prop", () => {
    const ConditionalErrorComponent = ({ shouldError }: { shouldError: boolean }) => {
      if (shouldError) {
        throw new Error("Conditional error")
      }
      return <div data-oid="_.k95pb">No error</div>
    }

    const WrappedComponent = withStyleTemplateErrorBoundary(ConditionalErrorComponent)

    const { rerender } = render(<WrappedComponent shouldError={false} data-oid="il9r4ny" />)
    expect(screen.getByText("No error")).toBeInTheDocument()

    rerender(<WrappedComponent shouldError={true} data-oid="f58s613" />)
    expect(screen.getByText("Conditional error")).toBeInTheDocument()
  })
})
