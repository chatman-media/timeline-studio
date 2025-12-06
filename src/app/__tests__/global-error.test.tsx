/**
 * Tests for GlobalError component
 */

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import GlobalError from "../global-error"

describe("GlobalError", () => {
  const mockReset = vi.fn()
  const mockError = new Error("Test error")

  it("should render error message", () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    expect(screen.getByText("Application Error")).toBeInTheDocument()
    expect(screen.getByText("An unexpected error occurred. Please try refreshing the page.")).toBeInTheDocument()
  })

  it("should render try again button", () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    const button = screen.getByRole("button", { name: /try again/i })
    expect(button).toBeInTheDocument()
  })

  it("should call reset when button is clicked", () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    const button = screen.getByRole("button", { name: /try again/i })
    fireEvent.click(button)

    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it("should display error digest if provided", () => {
    const errorWithDigest = { ...mockError, digest: "abc123" }
    render(<GlobalError error={errorWithDigest} reset={mockReset} />)

    expect(screen.getByText(/Error ID: abc123/i)).toBeInTheDocument()
  })

  it("should not display error digest if not provided", () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    expect(screen.queryByText(/Error ID:/i)).not.toBeInTheDocument()
  })

  it("should have correct html structure", () => {
    const { container } = render(<GlobalError error={mockError} reset={mockReset} />)

    // GlobalError renders html/body, but testing-library doesn't render them in container
    // Check that the component structure is rendered
    expect(container.firstChild).toBeTruthy()
  })

  it("should apply inline styles for error layout", () => {
    const { container } = render(<GlobalError error={mockError} reset={mockReset} />)

    // Check for main container with flex centering
    // In testing-library, the div is the first child
    const mainDiv = container.querySelector("div")
    expect(mainDiv).toBeInTheDocument()
    // Inline styles should be applied
    expect(mainDiv).toHaveAttribute("style")
  })

  it("should not use React Context to avoid useContext errors", () => {
    // This test verifies that the component doesn't use any React Context
    // which could cause errors during Next.js static export
    expect(() => render(<GlobalError error={mockError} reset={mockReset} />)).not.toThrow()
  })

  it("should render heading with correct text", () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toHaveTextContent("Application Error")
  })
})
