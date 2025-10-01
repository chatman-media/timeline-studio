import { fireEvent, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { render } from "@/test/test-utils"
import { ContentIntelligencePanel } from "../content-intelligence-panel"

// Мокаем сервисы
vi.mock("@/domains/ai-services/services/media-analysis", () => ({
  FFmpegAnalysisService: {
    getInstance: () => ({
      getVideoMetadata: vi.fn().mockResolvedValue({
        format: "mp4",
        duration: 120.5,
        width: 1920,
        height: 1080,
        fps: 30,
        bitrate: 5000000,
        hasAudio: true,
      }),
      analyzeQuality: vi.fn().mockResolvedValue({
        overall: 85,
        video: {
          sharpness: 0.9,
          brightness: 0.7,
          stability: 0.95,
          noise: 0.1,
        },
      }),
      detectScenes: vi.fn().mockResolvedValue({
        scenes: [
          { start_time: 0, end_time: 10, confidence: 0.95 },
          { start_time: 10, end_time: 25, confidence: 0.88 },
          { start_time: 25, end_time: 40, confidence: 0.92 },
        ],
        total_scenes: 3,
        average_scene_length: 13.33,
      }),
      analyzeMotion: vi.fn().mockResolvedValue({
        motionIntensity: 0.65,
        cameraMovement: {
          type: "pan",
          intensity: 0.4,
        },
      }),
    }),
  },
}))

vi.mock("@/domains/ai-services/services/content-classifier", () => ({
  ContentClassifier: {
    getInstance: () => ({
      classify: vi.fn().mockResolvedValue({
        primary: {
          category: "documentary",
          subcategory: "educational",
          confidence: 0.89,
          reasoning: "Based on content analysis",
        },
        secondary: [],
        confidence: 0.89,
        tags: ["nature", "science", "discovery"],
        warnings: [],
      }),
    }),
  },
}))

vi.mock("@/domains/ai-services/services/vision", () => ({
  MultimodalAnalysisService: {
    getInstance: () => ({}),
  },
}))

vi.mock("@/domains/ai-services/services/platform-optimization", () => ({
  PlatformOptimizationService: {
    getInstance: () => ({}),
  },
}))

describe.skip("ContentIntelligencePanel", () => {
  it("should render empty state when no video is selected", () => {
    const { getByText } = render(<ContentIntelligencePanel />)

    expect(getByText("ai.contentIntelligence.selectVideo")).toBeInTheDocument()
  })

  it("should render with video path", () => {
    const { getByText } = render(<ContentIntelligencePanel videoPath="/path/to/video.mp4" />)

    expect(getByText("ai.contentIntelligence.title")).toBeInTheDocument()
    expect(getByText("ai.contentIntelligence.analyze")).toBeInTheDocument()
  })

  it("should start analysis when button is clicked", async () => {
    const onAnalysisComplete = vi.fn()
    const { getByText } = render(
      <ContentIntelligencePanel videoPath="/path/to/video.mp4" onAnalysisComplete={onAnalysisComplete} />,
    )

    const analyzeButton = getByText("ai.contentIntelligence.analyze")
    fireEvent.click(analyzeButton)

    // Should show loading state
    await waitFor(() => {
      expect(getByText("ai.analysis.starting")).toBeInTheDocument()
    })

    // Should complete analysis
    await waitFor(
      () => {
        expect(onAnalysisComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            videoId: "/path/to/video.mp4",
            metadata: expect.any(Object),
            scenes: expect.any(Object),
            quality: expect.any(Object),
            motion: expect.any(Object),
          }),
        )
      },
      { timeout: 5000 },
    )
  })

  it("should auto-start analysis when autoStart is true", async () => {
    const onAnalysisComplete = vi.fn()
    render(
      <ContentIntelligencePanel
        videoPath="/path/to/video.mp4"
        autoStart={true}
        onAnalysisComplete={onAnalysisComplete}
      />,
    )

    await waitFor(
      () => {
        expect(onAnalysisComplete).toHaveBeenCalled()
      },
      { timeout: 5000 },
    )
  })

  it("should display analysis results in tabs", async () => {
    const { getByText, getByRole } = render(
      <ContentIntelligencePanel videoPath="/path/to/video.mp4" autoStart={true} />,
    )

    // Wait for analysis to complete
    await waitFor(
      () => {
        expect(getByText("ai.analysis.overview")).toBeInTheDocument()
      },
      { timeout: 5000 },
    )

    // Check tabs are rendered
    expect(getByText("ai.analysis.scenes")).toBeInTheDocument()
    expect(getByText("ai.analysis.quality")).toBeInTheDocument()
    expect(getByText("ai.analysis.classification")).toBeInTheDocument()

    // Switch to scenes tab
    const scenesTab = getByText("ai.analysis.scenes")
    fireEvent.click(scenesTab)

    await waitFor(() => {
      expect(getByText("ai.analysis.sceneAnalysis")).toBeInTheDocument()
    })
  })

  it("should handle errors gracefully", async () => {
    // Mock error
    const FFmpegAnalysisService = await import("@/domains/ai-services/services/media-analysis")
    const mockGetMetadata = FFmpegAnalysisService.FFmpegAnalysisService.getInstance().getVideoMetadata as any
    mockGetMetadata.mockRejectedValueOnce(new Error("Failed to analyze"))

    const { getByText } = render(<ContentIntelligencePanel videoPath="/path/to/video.mp4" />)

    const analyzeButton = getByText("ai.contentIntelligence.analyze")
    fireEvent.click(analyzeButton)

    await waitFor(() => {
      expect(getByText("Failed to analyze")).toBeInTheDocument()
    })
  })

  it("should apply custom className", () => {
    const { container } = render(<ContentIntelligencePanel videoPath="/path/to/video.mp4" className="custom-class" />)

    expect(container.firstChild).toHaveClass("custom-class")
  })
})
