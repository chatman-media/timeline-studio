/**
 * Tests for MediaPoolSelector component
 */

import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { MediaPoolSelector } from "../media-pool-selector"

describe("MediaPoolSelector", () => {
  const mockOnOpenMediaPool = vi.fn()

  const defaultProps = {
    selectedCount: 0,
    onOpenMediaPool: mockOnOpenMediaPool,
  }

  it("renders button with text", () => {
    render(<MediaPoolSelector {...defaultProps} />)

    expect(screen.getByRole("button", { name: /Select Files from Media Pool/i })).toBeInTheDocument()
  })

  it("does not show badge when no files selected", () => {
    render(<MediaPoolSelector {...defaultProps} />)

    expect(screen.queryByText(/selected/i)).not.toBeInTheDocument()
  })

  it("shows badge with count when files are selected", () => {
    render(<MediaPoolSelector {...defaultProps} selectedCount={3} />)

    expect(screen.getByText("3 selected")).toBeInTheDocument()
  })

  it("calls onOpenMediaPool when clicked", async () => {
    const user = userEvent.setup()
    render(<MediaPoolSelector {...defaultProps} />)

    const button = screen.getByRole("button")
    await user.click(button)

    expect(mockOnOpenMediaPool).toHaveBeenCalledTimes(1)
  })

  it("is disabled when disabled prop is true", () => {
    render(<MediaPoolSelector {...defaultProps} disabled={true} />)

    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
  })

  it("is not disabled by default", () => {
    render(<MediaPoolSelector {...defaultProps} />)

    const button = screen.getByRole("button")
    expect(button).not.toBeDisabled()
  })

  it("updates badge when selected count changes", () => {
    const { rerender } = render(<MediaPoolSelector {...defaultProps} selectedCount={1} />)

    expect(screen.getByText("1 selected")).toBeInTheDocument()

    rerender(<MediaPoolSelector {...defaultProps} selectedCount={5} />)

    expect(screen.getByText("5 selected")).toBeInTheDocument()
    expect(screen.queryByText("1 selected")).not.toBeInTheDocument()
  })

  it("hides badge when count becomes 0", () => {
    const { rerender } = render(<MediaPoolSelector {...defaultProps} selectedCount={3} />)

    expect(screen.getByText("3 selected")).toBeInTheDocument()

    rerender(<MediaPoolSelector {...defaultProps} selectedCount={0} />)

    expect(screen.queryByText(/selected/i)).not.toBeInTheDocument()
  })
})
