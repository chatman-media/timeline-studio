/**
 * Tests for OverallProgressCard component
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { OverallProgressCard, type OverallProgressData } from "../overall-progress-card"

describe("OverallProgressCard", () => {
  const createMockProgressData = (overrides?: Partial<OverallProgressData>): OverallProgressData => ({
    progress: 0,
    completedFiles: 0,
    totalFiles: 3,
    status: "idle",
    ...overrides,
  })

  const mockFileStatistics = {
    completed: 0,
    analyzing: 0,
    pending: 3,
    error: 0,
  }

  const defaultProps = {
    progressData: createMockProgressData(),
    fileStatistics: mockFileStatistics,
  }

  describe("Progress display", () => {
    it("renders overall progress correctly", () => {
      const progressData = createMockProgressData({
        progress: 48,
        completedFiles: 2,
        totalFiles: 3,
        status: "analyzing",
      })

      render(<OverallProgressCard {...defaultProps} progressData={progressData} />)

      expect(screen.getByText("48%")).toBeInTheDocument()
      expect(screen.getByText(/Complete \(2\/3 files\)/i)).toBeInTheDocument()
    })

    it("shows ETA when analyzing", () => {
      const progressData = createMockProgressData({
        progress: 48,
        completedFiles: 2,
        totalFiles: 3,
        estimatedTimeRemaining: 180, // 3 minutes
        status: "analyzing",
      })

      render(<OverallProgressCard {...defaultProps} progressData={progressData} />)

      expect(screen.getByText(/ETA: 3m/i)).toBeInTheDocument()
    })

    it("does not show ETA when not analyzing", () => {
      const progressData = createMockProgressData({
        progress: 100,
        completedFiles: 3,
        totalFiles: 3,
        estimatedTimeRemaining: 0,
        status: "completed",
      })

      render(<OverallProgressCard {...defaultProps} progressData={progressData} />)

      expect(screen.queryByText(/ETA:/i)).not.toBeInTheDocument()
    })
  })

  describe("File statistics", () => {
    it("displays file statistics correctly", () => {
      const fileStatistics = {
        completed: 1,
        analyzing: 1,
        pending: 1,
        error: 0,
      }

      const { container } = render(<OverallProgressCard {...defaultProps} fileStatistics={fileStatistics} />)

      // Find completed count (green)
      const completedSection = container.querySelector(".text-green-600")
      expect(completedSection).toBeInTheDocument()
      expect(completedSection?.querySelector(".font-semibold")?.textContent).toBe("1")

      // Find analyzing count (blue)
      const analyzingSection = container.querySelector(".text-blue-600")
      expect(analyzingSection).toBeInTheDocument()
      expect(analyzingSection?.querySelector(".font-semibold")?.textContent).toBe("1")
    })

    it("shows error count", () => {
      const fileStatistics = {
        completed: 2,
        analyzing: 0,
        pending: 0,
        error: 1,
      }

      const { container } = render(<OverallProgressCard {...defaultProps} fileStatistics={fileStatistics} />)

      expect(screen.getByText("Errors")).toBeInTheDocument()

      // Find error count (red)
      const errorSection = container.querySelector(".text-red-600")
      expect(errorSection).toBeInTheDocument()
      expect(errorSection?.querySelector(".font-semibold")?.textContent).toBe("1")
    })
  })

  describe("ETA formatting", () => {
    it("formats seconds correctly", () => {
      const progressData = createMockProgressData({
        progress: 95,
        estimatedTimeRemaining: 45,
        status: "analyzing",
      })

      render(<OverallProgressCard {...defaultProps} progressData={progressData} />)

      expect(screen.getByText(/ETA: 45s/i)).toBeInTheDocument()
    })

    it("formats minutes correctly", () => {
      const progressData = createMockProgressData({
        progress: 50,
        estimatedTimeRemaining: 150, // 2m 30s
        status: "analyzing",
      })

      render(<OverallProgressCard {...defaultProps} progressData={progressData} />)

      expect(screen.getByText(/ETA: 2m 30s/i)).toBeInTheDocument()
    })

    it("formats hours correctly", () => {
      const progressData = createMockProgressData({
        progress: 10,
        estimatedTimeRemaining: 3750, // 62 minutes = 1h 2m
        status: "analyzing",
      })

      render(<OverallProgressCard {...defaultProps} progressData={progressData} />)

      expect(screen.getByText(/ETA: 1h 2m/i)).toBeInTheDocument()
    })
  })

  describe("Cancel button", () => {
    it("shows cancel button when analyzing and onCancel provided", () => {
      const mockOnCancel = vi.fn()
      const progressData = createMockProgressData({
        progress: 50,
        status: "analyzing",
      })

      render(<OverallProgressCard {...defaultProps} progressData={progressData} onCancel={mockOnCancel} />)

      expect(screen.getByRole("button", { name: /Cancel Analysis/i })).toBeInTheDocument()
    })

    it("does not show cancel button when not analyzing", () => {
      const mockOnCancel = vi.fn()
      const progressData = createMockProgressData({
        progress: 100,
        status: "completed",
      })

      render(<OverallProgressCard {...defaultProps} progressData={progressData} onCancel={mockOnCancel} />)

      expect(screen.queryByRole("button", { name: /Cancel Analysis/i })).not.toBeInTheDocument()
    })

    it("calls onCancel when cancel button clicked", async () => {
      const user = userEvent.setup()
      const mockOnCancel = vi.fn()
      const progressData = createMockProgressData({
        progress: 50,
        status: "analyzing",
      })

      render(<OverallProgressCard {...defaultProps} progressData={progressData} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByRole("button", { name: /Cancel Analysis/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe("Pause button (optional)", () => {
    it("shows pause button when provided", () => {
      const mockOnPause = vi.fn()
      const progressData = createMockProgressData({
        progress: 50,
        status: "analyzing",
      })

      render(<OverallProgressCard {...defaultProps} progressData={progressData} onPause={mockOnPause} />)

      expect(screen.getByRole("button", { name: /Pause/i })).toBeInTheDocument()
    })

    it("calls onPause when pause button clicked", async () => {
      const user = userEvent.setup()
      const mockOnPause = vi.fn()
      const progressData = createMockProgressData({
        progress: 50,
        status: "analyzing",
      })

      render(<OverallProgressCard {...defaultProps} progressData={progressData} onPause={mockOnPause} />)

      const pauseButton = screen.getByRole("button", { name: /Pause/i })
      await user.click(pauseButton)

      expect(mockOnPause).toHaveBeenCalledTimes(1)
    })
  })

  describe("Progress bar", () => {
    it("displays progress bar with correct value", () => {
      const progressData = createMockProgressData({
        progress: 48,
      })

      const { container } = render(<OverallProgressCard {...defaultProps} progressData={progressData} />)

      // Progress component should be present with value 48
      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toBeInTheDocument()
    })
  })
})
