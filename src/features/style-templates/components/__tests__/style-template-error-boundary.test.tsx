import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { StyleTemplateErrorBoundary, withStyleTemplateErrorBoundary } from "../style-template-error-boundary"

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error message")
  }
  return <div>Normal content</div>
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
      <StyleTemplateErrorBoundary>
        <div>Test content</div>
      </StyleTemplateErrorBoundary>,
    )

    expect(screen.getByText("Test content")).toBeInTheDocument()
  })

  it("should render default error UI when error occurs", () => {
    render(
      <StyleTemplateErrorBoundary>
        <ThrowError shouldThrow={true} />
      </StyleTemplateErrorBoundary>,
    )

    expect(screen.getByText("Ошибка загрузки шаблонов")).toBeInTheDocument()
    expect(screen.getByText("Test error message")).toBeInTheDocument()
    expect(screen.getByText("Попробовать снова")).toBeInTheDocument()
  })

  it("should render custom fallback when provided", () => {
    const customFallback = <div>Custom error fallback</div>

    render(
      <StyleTemplateErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </StyleTemplateErrorBoundary>,
    )

    expect(screen.getByText("Custom error fallback")).toBeInTheDocument()
    expect(screen.queryByText("Ошибка загрузки шаблонов")).not.toBeInTheDocument()
  })

  it("should log error to console", () => {
    // Spy на componentDidCatch чтобы убедиться что он вызывается
    const componentDidCatchSpy = vi.spyOn(StyleTemplateErrorBoundary.prototype, "componentDidCatch")

    render(
      <StyleTemplateErrorBoundary>
        <ThrowError shouldThrow={true} />
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
      return <div>Success after retry</div>
    }

    const { rerender } = render(
      <StyleTemplateErrorBoundary>
        <TestComponent />
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
      <StyleTemplateErrorBoundary>
        <TestComponent />
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
      <StyleTemplateErrorBoundary>
        <ErrorWithoutMessage />
      </StyleTemplateErrorBoundary>,
    )

    expect(screen.getByText("Произошла неизвестная ошибка")).toBeInTheDocument()
  })

  it("should have proper styling for error UI", () => {
    render(
      <StyleTemplateErrorBoundary>
        <ThrowError shouldThrow={true} />
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
      <StyleTemplateErrorBoundary>
        <ThrowError shouldThrow={true} />
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
    const TestComponent = () => <div>Test component</div>
    const WrappedComponent = withStyleTemplateErrorBoundary(TestComponent)

    render(<WrappedComponent />)

    expect(screen.getByText("Test component")).toBeInTheDocument()
  })

  it("should catch errors in wrapped component", () => {
    const ErrorComponent = () => {
      throw new Error("Component error")
    }
    const WrappedComponent = withStyleTemplateErrorBoundary(ErrorComponent)

    render(<WrappedComponent />)

    expect(screen.getByText("Component error")).toBeInTheDocument()
    expect(screen.getByText("Ошибка загрузки шаблонов")).toBeInTheDocument()
  })

  it("should use custom fallback when provided", () => {
    const ErrorComponent = () => {
      throw new Error("Component error")
    }
    const customFallback = <div>Custom HOC fallback</div>
    const WrappedComponent = withStyleTemplateErrorBoundary(ErrorComponent, customFallback)

    render(<WrappedComponent />)

    expect(screen.getByText("Custom HOC fallback")).toBeInTheDocument()
    expect(screen.queryByText("Ошибка загрузки шаблонов")).not.toBeInTheDocument()
  })

  it("should pass props to wrapped component", () => {
    interface TestProps {
      message: string
      count: number
    }

    const TestComponent = ({ message, count }: TestProps) => (
      <div>
        {message} - {count}
      </div>
    )

    const WrappedComponent = withStyleTemplateErrorBoundary(TestComponent)

    render(<WrappedComponent message="Hello" count={42} />)

    expect(screen.getByText("Hello - 42")).toBeInTheDocument()
  })

  it("should handle component that throws on specific prop", () => {
    const ConditionalErrorComponent = ({ shouldError }: { shouldError: boolean }) => {
      if (shouldError) {
        throw new Error("Conditional error")
      }
      return <div>No error</div>
    }

    const WrappedComponent = withStyleTemplateErrorBoundary(ConditionalErrorComponent)

    const { rerender } = render(<WrappedComponent shouldError={false} />)
    expect(screen.getByText("No error")).toBeInTheDocument()

    rerender(<WrappedComponent shouldError={true} />)
    expect(screen.getByText("Conditional error")).toBeInTheDocument()
  })
})
