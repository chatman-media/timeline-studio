/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AnalysisError, AnalysisProgress } from "@/domains/ai-services/types/ai-director-events"
import { useAIDirectorAnalysis } from "../../hooks/use-ai-director-analysis"
import { AIDirectorProgress } from "../ai-director-progress"

// Mock the hook
vi.mock("../../hooks/use-ai-director-analysis")

const mockUseAIDirectorAnalysis = vi.mocked(useAIDirectorAnalysis)

describe("AIDirectorProgress", () => {
  const defaultHookReturn = {
    isAnalyzing: false,
    currentProgress: null,
    result: null,
    errors: [],
    startAnalysis: vi.fn(),
    startQuickAnalysis: vi.fn(),
    clearErrors: vi.fn(),
    progressPercentage: 0,
    currentStage: "idle",
    estimatedTimeRemaining: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAIDirectorAnalysis.mockReturnValue(defaultHookReturn)
  })

  describe("Rendering", () => {
    it("should render with default state", () => {
      render(<AIDirectorProgress />)

      expect(screen.getByText("AI Director Analysis")).toBeInTheDocument()
      expect(screen.getByText("Ready")).toBeInTheDocument()
    })

    it("should hide when showOnlyWhenActive is true and not active", () => {
      const { container } = render(<AIDirectorProgress showOnlyWhenActive={true} />)

      expect(container.firstChild).toBeNull()
    })

    it("should show when showOnlyWhenActive is false and not active", () => {
      render(<AIDirectorProgress showOnlyWhenActive={false} />)

      expect(screen.getByText("AI Director Analysis")).toBeInTheDocument()
    })

    it("should show when analyzing even with showOnlyWhenActive", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
      })

      render(<AIDirectorProgress showOnlyWhenActive={true} />)

      expect(screen.getByText("AI Director Analysis")).toBeInTheDocument()
      expect(screen.getByText("Analyzing...")).toBeInTheDocument()
    })
  })

  describe("Status Display", () => {
    it("should display analyzing status when active", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText("Analyzing...")).toBeInTheDocument()
    })

    it("should display ready status when idle", () => {
      render(<AIDirectorProgress />)

      expect(screen.getByText("Ready")).toBeInTheDocument()
    })

    it("should show pulsing indicator when analyzing", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
      })

      const { container } = render(<AIDirectorProgress />)

      const indicator = container.querySelector(".animate-pulse")
      expect(indicator).toBeInTheDocument()
    })
  })

  describe("Progress Display", () => {
    it("should display progress bar when analyzing", () => {
      const progress: AnalysisProgress = {
        analysisId: "test-123",
        stage: "audio",
        progress: 0.5,
        message: "Processing audio...",
        estimatedTimeRemaining: 30,
      }

      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
        currentProgress: progress,
        progressPercentage: 50,
        currentStage: "audio",
      })

      render(<AIDirectorProgress />)

      expect(screen.getAllByText("Audio Analysis").length).toBeGreaterThan(0)
      expect(screen.getByText("50%")).toBeInTheDocument()
    })

    it("should display progress message", () => {
      const progress: AnalysisProgress = {
        analysisId: "test-123",
        stage: "video",
        progress: 0.75,
        message: "Analyzing video frames...",
        estimatedTimeRemaining: 15,
      }

      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
        currentProgress: progress,
        progressPercentage: 75,
        currentStage: "video",
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText("Analyzing video frames...")).toBeInTheDocument()
    })

    it("should display estimated time remaining for short durations", () => {
      const progress: AnalysisProgress = {
        analysisId: "test-123",
        stage: "audio",
        progress: 0.3,
        message: "Processing...",
        estimatedTimeRemaining: 45,
      }

      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
        currentProgress: progress,
        estimatedTimeRemaining: 45,
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText("45s remaining")).toBeInTheDocument()
    })

    it("should display estimated time in minutes", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
        estimatedTimeRemaining: 180,
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText("3m remaining")).toBeInTheDocument()
    })

    it("should display estimated time in hours and minutes", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
        estimatedTimeRemaining: 7200,
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText("2h 0m remaining")).toBeInTheDocument()
    })
  })

  describe("Stage Display", () => {
    it("should display all stage indicators", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
        currentStage: "audio",
      })

      render(<AIDirectorProgress />)

      expect(screen.getAllByText("Initializing").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Audio Analysis").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Video Analysis").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Integrating Results").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Complete").length).toBeGreaterThan(0)
    })

    it("should highlight current stage", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
        currentStage: "video",
      })

      const { container } = render(<AIDirectorProgress />)

      const stageIndicators = container.querySelectorAll(".animate-pulse")
      expect(stageIndicators.length).toBeGreaterThan(0)
    })

    it("should mark completed stages", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
        currentStage: "integration",
      })

      render(<AIDirectorProgress />)

      // Initialization, audio, and video should be completed
      // This is a visual test - we're just ensuring it renders without error
      expect(screen.getAllByText("Integrating Results").length).toBeGreaterThan(0)
    })

    it("should apply correct colors to stages", () => {
      const stages = ["initialization", "audio", "video", "integration", "complete"]

      for (const stage of stages) {
        mockUseAIDirectorAnalysis.mockReturnValue({
          ...defaultHookReturn,
          isAnalyzing: true,
          currentStage: stage,
        })

        const { unmount } = render(<AIDirectorProgress />)

        // Just verify it renders without errors
        expect(screen.getByText("AI Director Analysis")).toBeInTheDocument()

        unmount()
      }
    })
  })

  describe("Error Display", () => {
    it("should display error count", () => {
      const errors: AnalysisError[] = [
        { analysisId: "test-123", stage: "audio", error: "Audio error 1" },
        { analysisId: "test-123", stage: "video", error: "Video error 1" },
      ]

      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        errors,
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText(/Clear 2 errors/)).toBeInTheDocument()
    })

    it("should display single error without plural", () => {
      const errors: AnalysisError[] = [{ analysisId: "test-123", stage: "audio", error: "Audio error" }]

      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        errors,
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText(/Clear 1 error/)).toBeInTheDocument()
    })

    it("should display error details", () => {
      const errors: AnalysisError[] = [
        { analysisId: "test-123", stage: "audio", error: "Audio processing failed" },
        { analysisId: "test-123", stage: "video", error: "Video decoding error" },
      ]

      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        errors,
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText(/audio:/)).toBeInTheDocument()
      expect(screen.getByText(/Audio processing failed/)).toBeInTheDocument()
      expect(screen.getByText(/video:/)).toBeInTheDocument()
      expect(screen.getByText(/Video decoding error/)).toBeInTheDocument()
    })

    it("should limit error display to 3", () => {
      const errors: AnalysisError[] = [
        { analysisId: "test-123", stage: "audio", error: "Error 1" },
        { analysisId: "test-123", stage: "video", error: "Error 2" },
        { analysisId: "test-123", stage: "scene", error: "Error 3" },
        { analysisId: "test-123", stage: "moment", error: "Error 4" },
        { analysisId: "test-123", stage: "content", error: "Error 5" },
      ]

      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        errors,
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText(/... and 2 more errors/)).toBeInTheDocument()
    })

    it("should call clearErrors when clear button clicked", async () => {
      const user = userEvent.setup()
      const clearErrors = vi.fn()

      const errors: AnalysisError[] = [{ analysisId: "test-123", stage: "audio", error: "Test error" }]

      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        errors,
        clearErrors,
      })

      render(<AIDirectorProgress />)

      const clearButton = screen.getByText(/Clear 1 error/)
      await user.click(clearButton)

      expect(clearErrors).toHaveBeenCalledTimes(1)
    })
  })

  describe("Debug Info", () => {
    it("should show debug info in development", () => {
      vi.stubEnv("NODE_ENV", "development")

      const progress: AnalysisProgress = {
        analysisId: "test-123",
        stage: "audio",
        progress: 0.5,
        message: "Processing...",
        estimatedTimeRemaining: 30,
      }

      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        currentProgress: progress,
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText("Debug Info")).toBeInTheDocument()

      vi.unstubAllEnvs()
    })

    it("should hide debug info in production", () => {
      vi.stubEnv("NODE_ENV", "production")

      const progress: AnalysisProgress = {
        analysisId: "test-123",
        stage: "audio",
        progress: 0.5,
        message: "Processing...",
        estimatedTimeRemaining: 30,
      }

      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        currentProgress: progress,
      })

      render(<AIDirectorProgress />)

      expect(screen.queryByText("Debug Info")).not.toBeInTheDocument()

      vi.unstubAllEnvs()
    })
  })

  describe("Edge Cases", () => {
    it("should handle null progress gracefully", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        currentProgress: null,
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText("AI Director Analysis")).toBeInTheDocument()
    })

    it("should handle empty errors array", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        errors: [],
      })

      render(<AIDirectorProgress />)

      expect(screen.queryByText(/Clear.*error/)).not.toBeInTheDocument()
    })

    it("should handle unknown stage gracefully", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
        currentStage: "unknown_stage",
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText("unknown_stage")).toBeInTheDocument()
    })

    it("should handle 0 progress", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
        progressPercentage: 0,
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText("0%")).toBeInTheDocument()
    })

    it("should handle 100 progress", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
        progressPercentage: 100,
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText("100%")).toBeInTheDocument()
    })

    it("should handle null estimated time remaining", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
        estimatedTimeRemaining: null,
      })

      render(<AIDirectorProgress />)

      expect(screen.queryByText(/remaining/)).not.toBeInTheDocument()
    })

    it("should handle 0 estimated time remaining", () => {
      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true,
        estimatedTimeRemaining: 0,
      })

      render(<AIDirectorProgress />)

      expect(screen.queryByText(/remaining/)).not.toBeInTheDocument()
    })

    it("should handle very long error messages", () => {
      const longError = "A".repeat(500)

      const errors: AnalysisError[] = [{ analysisId: "test-123", stage: "audio", error: longError }]

      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        errors,
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText(new RegExp(longError))).toBeInTheDocument()
    })

    it("should handle progress message with special characters", () => {
      const progress: AnalysisProgress = {
        analysisId: "test-123",
        stage: "audio",
        progress: 0.5,
        message: "Processing <audio> & 'video' with \"quotes\"...",
        estimatedTimeRemaining: 30,
      }

      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        currentProgress: progress,
      })

      render(<AIDirectorProgress />)

      expect(screen.getByText(/Processing <audio> & 'video' with "quotes".../)).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should render semantic HTML", () => {
      render(<AIDirectorProgress />)

      const heading = screen.getByRole("heading", { name: "AI Director Analysis" })
      expect(heading).toBeInTheDocument()
    })

    it("should have accessible button for clearing errors", () => {
      const errors: AnalysisError[] = [{ analysisId: "test-123", stage: "audio", error: "Test error" }]

      mockUseAIDirectorAnalysis.mockReturnValue({
        ...defaultHookReturn,
        errors,
      })

      render(<AIDirectorProgress />)

      const button = screen.getByRole("button", { name: /Clear 1 error/ })
      expect(button).toBeInTheDocument()
    })
  })
})
