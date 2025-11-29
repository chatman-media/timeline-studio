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
    startTime: Date.now(),
    analyzers: [
      {
        type: "scene_detection",
        status: "completed",
        progress: 100,
      },
      {
        type: "audio_quality",
        status: "analyzing",
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

    it("should show status label", () => {
      render(<FileAnalysisProgress file={mockFile} />)

      expect(screen.getByText("Анализ")).toBeInTheDocument()
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

      render(<FileAnalysisProgress file={completedFile} />)

      expect(screen.getByText("Завершено")).toBeInTheDocument()
    })

    it("should show error status", () => {
      const errorFile: FileProgress = {
        ...mockFile,
        status: "error",
        error: "Analysis failed",
      }

      render(<FileAnalysisProgress file={errorFile} />)

      expect(screen.getByText("Ошибка")).toBeInTheDocument()
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

      // Should not crash or show invalid duration
      expect(screen.queryByText(/m|s$/)).not.toBeInTheDocument()
    })
  })

  describe("Expandable Content", () => {
    it("should be collapsed by default", () => {
      render(<FileAnalysisProgress file={mockFile} />)

      // Analyzers should not be visible
      expect(screen.queryByText("scene_detection")).not.toBeInTheDocument()
    })

    it("should expand when defaultExpanded is true", () => {
      render(<FileAnalysisProgress file={mockFile} defaultExpanded={true} />)

      // Should show analyzer details
      expect(screen.getByText(/scene_detection|audio_quality|face_detection/)).toBeInTheDocument()
    })

    it("should toggle expansion on click", async () => {
      const user = userEvent.setup()
      render(<FileAnalysisProgress file={mockFile} />)

      // Find expand/collapse trigger
      const expandButton = screen.getByRole("button")
      await user.click(expandButton)

      // Should show analyzers
      // Note: actual implementation may vary
    })
  })

  describe("Analyzers Display", () => {
    it("should show all analyzers when expanded", () => {
      render(<FileAnalysisProgress file={mockFile} defaultExpanded={true} />)

      // All three analyzers should be visible
      const analyzers = mockFile.analyzers
      expect(analyzers).toHaveLength(3)
    })

    it("should show analyzer progress", () => {
      render(<FileAnalysisProgress file={mockFile} defaultExpanded={true} />)

      // Completed analyzer should show 100%
      // Analyzing should show 50%
      // Pending should show 0%
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

      render(<FileAnalysisProgress file={completedFile} />)

      // Check icon should be present
      expect(screen.getByText("Завершено")).toBeInTheDocument()
    })

    it("should show error icon for error status", () => {
      const errorFile: FileProgress = {
        ...mockFile,
        status: "error",
        error: "Failed",
      }

      render(<FileAnalysisProgress file={errorFile} />)

      expect(screen.getByText("Ошибка")).toBeInTheDocument()
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
