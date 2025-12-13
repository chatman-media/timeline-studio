/**
 * @vitest-environment jsdom
 * Tests for NotFound component
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import NotFound from "../not-found"

describe("NotFound", () => {
  it("should render 404 heading", () => {
    render(<NotFound />)

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toHaveTextContent("404")
  })

  it("should render Page Not Found message", () => {
    render(<NotFound />)

    expect(screen.getByText("Page Not Found")).toBeInTheDocument()
  })

  it("should render descriptive text", () => {
    render(<NotFound />)

    expect(screen.getByText("The page you're looking for doesn't exist.")).toBeInTheDocument()
  })

  it("should have correct layout classes", () => {
    const { container } = render(<NotFound />)

    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveClass("flex")
    expect(mainDiv).toHaveClass("h-screen")
    expect(mainDiv).toHaveClass("items-center")
    expect(mainDiv).toHaveClass("justify-center")
  })

  it("should center content with text-center", () => {
    const { container } = render(<NotFound />)

    const contentDiv = container.querySelector(".text-center")
    expect(contentDiv).toBeInTheDocument()
  })

  it("should render without errors", () => {
    expect(() => render(<NotFound />)).not.toThrow()
  })

  it("should have proper heading hierarchy", () => {
    render(<NotFound />)

    const h1 = screen.getByRole("heading", { level: 1 })
    const h2 = screen.getByRole("heading", { level: 2 })

    expect(h1).toHaveTextContent("404")
    expect(h2).toHaveTextContent("Page Not Found")
  })

  it("should apply styling classes to elements", () => {
    const { container } = render(<NotFound />)

    const h1 = container.querySelector("h1")
    expect(h1).toHaveClass("text-4xl")
    expect(h1).toHaveClass("font-bold")
    expect(h1).toHaveClass("mb-4")

    const h2 = container.querySelector("h2")
    expect(h2).toHaveClass("text-2xl")
    expect(h2).toHaveClass("mb-4")

    const p = container.querySelector("p")
    expect(p).toHaveClass("text-gray-600")
  })
})
