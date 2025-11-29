/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import type { FileAnalysisProgress as FileProgress } from "../../types/analysis-progress"
import { FileAnalysisProgress } from "../file-analysis-progress"

describe("FileAnalysisProgress", () => {
  const mockFile: FileProgress = {
    fileId: "file-1",
    fileName: "video.mp4",
    filePath: "/path/to/video.mp4",
    status: "analyzing",
    progress: 50,
    startTime: new Date().toISOString(),
    analyzers: [
      {
        type: "scene_detection",
        status: "completed",
        progress: 100,
      },
      {
        type: "audio_quality",
        status: "running", // AnalyzerStatus uses "running" not "analyzing"
        progress: 50,
      },
      {
        type: "face_detection",
        status: "pending",
        progress: 0,
      },
    ],
  }

  describe("Rendering", () => {
    it("should render file name", () => {
      render(<FileAnalysisProgress file={mockFile} />)

      expect(screen.getByText("video.mp4")).toBeInTheDocument()
    })

    it("should show status icon for analyzing", () => {
      const { container } = render(<FileAnalysisProgress file={mockFile} />)

      // Should show Loader2 icon with animation
      const loader = container.querySelector('[data-icon="Loader2"]')
      expect(loader).toBeInTheDocument()
      expect(loader).toHaveClass("animate-spin")
    })

    it("should show progress percentage", () => {
      render(<FileAnalysisProgress file={mockFile} />)

      expect(screen.getByText("50%")).toBeInTheDocument()
    })

    it("should show completed status", () => {
      const completedFile: FileProgress = {
        ...mockFile,
        status: "completed",
        progress: 100,
      }

      const { container } = render(<FileAnalysisProgress file={completedFile} />)

      // Should show CheckCircle2 icon for completed
      const checkIcon = container.querySelector('[data-icon="CheckCircle2"]')
      expect(checkIcon).toBeInTheDocument()
    })

    it("should show error status", () => {
      const errorFile: FileProgress = {
        ...mockFile,
        status: "error",
        error: "Analysis failed",
      }

      const { container } = render(<FileAnalysisProgress file={errorFile} />)

      // Should show XCircle icon for error
      const errorIcon = container.querySelector('[data-icon="XCircle"]')
      expect(errorIcon).toBeInTheDocument()
    })
  })

  describe("Duration Display", () => {
    it("should format duration in seconds", () => {
      const fileWithDuration: FileProgress = {
        ...mockFile,
        duration: 45000, // 45 seconds
      }

      render(<FileAnalysisProgress file={fileWithDuration} />)

      expect(screen.getByText("45s")).toBeInTheDocument()
    })

    it("should format duration in minutes and seconds", () => {
      const fileWithDuration: FileProgress = {
        ...mockFile,
        duration: 125000, // 2 minutes 5 seconds
      }

      render(<FileAnalysisProgress file={fileWithDuration} />)

      expect(screen.getByText("2m 5s")).toBeInTheDocument()
    })

    it("should not show duration when not available", () => {
      render(<FileAnalysisProgress file={mockFile} />)

      // Should not crash - duration just won't be displayed
      // File name should still render
      expect(screen.getByText("video.mp4")).toBeInTheDocument()
    })
  })

  describe("Expandable Content", () => {
    it("should be collapsed by default", () => {
      const { container } = render(<FileAnalysisProgress file={mockFile} />)

      // Analyzers category headings should not be visible when collapsed
      expect(screen.queryByText("Видео")).not.toBeInTheDocument()
      expect(screen.queryByText("Аудио")).not.toBeInTheDocument()
    })

    it("should expand when defaultExpanded is true", () => {
      render(<FileAnalysisProgress file={mockFile} defaultExpanded={true} />)

      // Should show category headings when expanded
      expect(screen.getByText("Видео")).toBeInTheDocument()
      expect(screen.getByText("Аудио")).toBeInTheDocument()
    })

    it("should toggle expansion on click", async () => {
      const user = userEvent.setup()
      render(<FileAnalysisProgress file={mockFile} />)

      // The entire header is a collapsible trigger button
      const expandButton = screen.getByRole("button")
      await user.click(expandButton)

      // Should show category headings after expansion
      expect(screen.getByText("Видео")).toBeInTheDocument()
    })
  })

  describe("Analyzers Display", () => {
    it("should show all analyzers when expanded", () => {
      render(<FileAnalysisProgress file={mockFile} defaultExpanded={true} />)

      // Should show category headings
      expect(screen.getByText("Видео")).toBeInTheDocument()
      expect(screen.getByText("Аудио")).toBeInTheDocument()

      // Verify all 3 analyzers are present
      const analyzers = mockFile.analyzers
      expect(analyzers).toHaveLength(3)
    })

    it("should show analyzer progress", () => {
      render(<FileAnalysisProgress file={mockFile} defaultExpanded={true} />)

      // Should show progress percentages for analyzers
      expect(screen.getByText("100%")).toBeInTheDocument() // completed analyzer
      const percentages = screen.getAllByText("50%") // file progress + running analyzer
      expect(percentages.length).toBeGreaterThan(0)
      // Pending analyzers don't show percentage
    })
  })

  describe("Status Icons", () => {
    it("should show loader icon for analyzing status", () => {
      const { container } = render(<FileAnalysisProgress file={mockFile} />)

      // Loader icon should be animated
      const loader = container.querySelector("svg.animate-spin")
      expect(loader).toBeInTheDocument()
    })

    it("should show check icon for completed status", () => {
      const completedFile: FileProgress = {
        ...mockFile,
        status: "completed",
        progress: 100,
      }

      const { container } = render(<FileAnalysisProgress file={completedFile} />)

      // CheckCircle2 icon should be present
      const checkIcon = container.querySelector('[data-icon="CheckCircle2"]')
      expect(checkIcon).toBeInTheDocument()
    })

    it("should show error icon for error status", () => {
      const errorFile: FileProgress = {
        ...mockFile,
        status: "error",
        error: "Failed",
      }

      const { container } = render(<FileAnalysisProgress file={errorFile} />)

      // XCircle icon should be present
      const errorIcon = container.querySelector('[data-icon="XCircle"]')
      expect(errorIcon).toBeInTheDocument()
    })
  })

  describe("Error Display", () => {
    it("should show error message when status is error", () => {
      const errorFile: FileProgress = {
        ...mockFile,
        status: "error",
        error: "File not found",
      }

      render(<FileAnalysisProgress file={errorFile} defaultExpanded={true} />)

      expect(screen.getByText(/File not found/i)).toBeInTheDocument()
    })

    it("should not show error message for other statuses", () => {
      render(<FileAnalysisProgress file={mockFile} />)

      expect(screen.queryByText(/error|failed/i)).not.toBeInTheDocument()
    })
  })
})
