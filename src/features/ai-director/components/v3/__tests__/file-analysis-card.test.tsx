/**
 * Tests for FileAnalysisCard component
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { FileAnalysisCard, type FileAnalysisCardData } from "../file-analysis-card"

describe("FileAnalysisCard", () => {
  const createMockFile = (overrides?: Partial<FileAnalysisCardData>): FileAnalysisCardData => ({
    filePath: "/path/to/video.mp4",
    fileName: "video.mp4",
    status: "pending",
    progress: 0,
    analyzers: [],
    ...overrides,
  })

  describe("Pending state", () => {
    it("renders pending file correctly", () => {
      const file = createMockFile()
      render(<FileAnalysisCard file={file} />)

      expect(screen.getByText("video.mp4")).toBeInTheDocument()
      expect(screen.getByText("Pending analysis...")).toBeInTheDocument()
      expect(screen.getByText("0%")).toBeInTheDocument()
    })
  })

  describe("Analyzing state", () => {
    it("renders analyzing file with progress", () => {
      const file = createMockFile({
        status: "analyzing",
        progress: 45,
        currentStage: "Audio Analysis",
        eta: 90,
      })
      render(<FileAnalysisCard file={file} />)

      expect(screen.getByText("video.mp4")).toBeInTheDocument()
      expect(screen.getByText("Audio Analysis")).toBeInTheDocument()
      expect(screen.getByText("45%")).toBeInTheDocument()
      expect(screen.getByText("1m 30s")).toBeInTheDocument()
    })

    it("shows analyzing indicator with pulsing animation", () => {
      const file = createMockFile({
        status: "analyzing",
        progress: 50,
      })
      const { container } = render(<FileAnalysisCard file={file} />)

      // Check for animate-pulse class on the Clock icon
      const pulsingIcon = container.querySelector(".animate-pulse")
      expect(pulsingIcon).toBeInTheDocument()
    })
  })

  describe("Completed state", () => {
    it("renders completed file", () => {
      const file = createMockFile({
        status: "completed",
        progress: 100,
      })
      render(<FileAnalysisCard file={file} />)

      expect(screen.getByText("video.mp4")).toBeInTheDocument()
      expect(screen.getByText("Analysis complete")).toBeInTheDocument()
      expect(screen.getByText("100%")).toBeInTheDocument()
    })
  })

  describe("Error state", () => {
    it("renders error state with message", () => {
      const file = createMockFile({
        status: "error",
        progress: 25,
        error: "Failed to process file",
      })
      render(<FileAnalysisCard file={file} />)

      expect(screen.getByText("video.mp4")).toBeInTheDocument()
      expect(screen.getByText("Failed to process file")).toBeInTheDocument()
      expect(screen.getByText("25%")).toBeInTheDocument()
    })
  })

  describe("Analyzers display", () => {
    it("shows analyzers with their status", () => {
      const file = createMockFile({
        status: "analyzing",
        progress: 50,
        analyzers: [
          { name: "audio_quality", status: "completed" },
          { name: "scene_detection", status: "analyzing" },
          { name: "moment_detection", status: "pending" },
        ],
      })
      render(<FileAnalysisCard file={file} />)

      expect(screen.getByText("audio_quality")).toBeInTheDocument()
      expect(screen.getByText("scene_detection")).toBeInTheDocument()
      expect(screen.getByText("moment_detection")).toBeInTheDocument()

      // Check for status icons
      expect(screen.getByText("✓")).toBeInTheDocument() // completed
      expect(screen.getByText("⏳")).toBeInTheDocument() // analyzing
      expect(screen.getByText("⏸️")).toBeInTheDocument() // pending
    })

    it("does not render analyzers section when empty", () => {
      const file = createMockFile({
        analyzers: [],
      })
      const { container } = render(<FileAnalysisCard file={file} />)

      // Should not have analyzer list
      const analyzerSection = container.querySelector(".flex.flex-wrap.gap-2")
      expect(analyzerSection).not.toBeInTheDocument()
    })
  })

  describe("ETA formatting", () => {
    it("formats ETA under 1 minute", () => {
      const file = createMockFile({
        status: "analyzing",
        progress: 90,
        eta: 45,
      })
      render(<FileAnalysisCard file={file} />)

      expect(screen.getByText("45s")).toBeInTheDocument()
    })

    it("formats ETA in minutes", () => {
      const file = createMockFile({
        status: "analyzing",
        progress: 50,
        eta: 150, // 2m 30s
      })
      render(<FileAnalysisCard file={file} />)

      expect(screen.getByText("2m 30s")).toBeInTheDocument()
    })

    it("does not show ETA when not analyzing", () => {
      const file = createMockFile({
        status: "pending",
        eta: 60,
      })
      render(<FileAnalysisCard file={file} />)

      expect(screen.queryByText("1m")).not.toBeInTheDocument()
    })
  })

  describe("Visual styling", () => {
    it("applies correct border color for analyzing state", () => {
      const file = createMockFile({
        status: "analyzing",
      })
      const { container } = render(<FileAnalysisCard file={file} />)

      const card = container.querySelector(".border-blue-200")
      expect(card).toBeInTheDocument()
    })

    it("applies correct border color for completed state", () => {
      const file = createMockFile({
        status: "completed",
      })
      const { container } = render(<FileAnalysisCard file={file} />)

      const card = container.querySelector(".border-green-200")
      expect(card).toBeInTheDocument()
    })

    it("applies correct border color for error state", () => {
      const file = createMockFile({
        status: "error",
      })
      const { container } = render(<FileAnalysisCard file={file} />)

      const card = container.querySelector(".border-red-200")
      expect(card).toBeInTheDocument()
    })
  })
})
