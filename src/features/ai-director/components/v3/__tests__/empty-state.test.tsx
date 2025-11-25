/**
 * Tests for EmptyState component
 */

import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { EmptyState } from "../empty-state"

describe("EmptyState", () => {
  const mockOnSelectFiles = vi.fn()

  const defaultProps = {
    onSelectFiles: mockOnSelectFiles,
    currentSettings: {
      mode: "balanced",
      analyzers: ["audio_quality", "scene_detection"],
    },
  }

  it("renders empty state correctly", () => {
    render(<EmptyState {...defaultProps} />)

    expect(screen.getByText("Ready to Analyze")).toBeInTheDocument()
    expect(screen.getByText("Select Files from Media Pool")).toBeInTheDocument()
  })

  it("displays current settings", () => {
    render(<EmptyState {...defaultProps} />)

    expect(screen.getByText("balanced")).toBeInTheDocument()
    expect(screen.getByText("audio_quality, scene_detection")).toBeInTheDocument()
  })

  it("shows quick tips", () => {
    render(<EmptyState {...defaultProps} />)

    expect(screen.getByText("Quick Tips")).toBeInTheDocument()
    expect(screen.getByText(/Select multiple files from media pool/i)).toBeInTheDocument()
    expect(screen.getByText(/Configure analyzers and mode in Settings/i)).toBeInTheDocument()
  })

  it("calls onSelectFiles when button is clicked", async () => {
    const user = userEvent.setup()
    render(<EmptyState {...defaultProps} />)

    const button = screen.getByRole("button", { name: /Select Files from Media Pool/i })
    await user.click(button)

    expect(mockOnSelectFiles).toHaveBeenCalledTimes(1)
  })

  it("displays v3 badge", () => {
    render(<EmptyState {...defaultProps} />)

    expect(screen.getByText("v3")).toBeInTheDocument()
  })

  it("renders with single analyzer", () => {
    render(
      <EmptyState
        {...defaultProps}
        currentSettings={{
          mode: "quick",
          analyzers: ["audio_quality"],
        }}
      />,
    )

    expect(screen.getByText("quick")).toBeInTheDocument()
    expect(screen.getByText("audio_quality")).toBeInTheDocument()
  })

  it("renders with comprehensive mode", () => {
    render(
      <EmptyState
        {...defaultProps}
        currentSettings={{
          mode: "comprehensive",
          analyzers: ["audio_quality", "scene_detection", "moment_detection"],
        }}
      />,
    )

    expect(screen.getByText("comprehensive")).toBeInTheDocument()
    expect(screen.getByText("audio_quality, scene_detection, moment_detection")).toBeInTheDocument()
  })
})
