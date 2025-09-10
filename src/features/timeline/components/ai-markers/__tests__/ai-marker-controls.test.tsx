import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom"

import { ContentType } from "@/domains/ai-services/types"

// SceneType enum for testing
enum SceneType {
  ACTION = "action",
  DIALOGUE = "dialogue",
  LANDSCAPE = "landscape",
  CLOSEUP = "closeup",
  ESTABLISHING = "establishing",
  MONTAGE = "montage",
  TRANSITION = "transition",
}

import { AIMarkerControls } from "../ai-marker-controls"

// Mock dependencies
const mockSend = vi.fn()
const mockOpenModal = vi.fn()
const mockAnalysisState = {
  isAnalyzing: false,
  sceneAnalysis: null,
  keyMoments: [],
  insights: null,
}

vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  useTimeline: () => ({
    send: mockSend,
  }),
}))

vi.mock("@/features/timeline/hooks/use-timeline-ai-analysis", () => ({
  useTimelineAIAnalysis: () => ({
    state: mockAnalysisState,
  }),
}))

vi.mock("@/features/modals/services", () => ({
  useModal: () => ({
    openModal: mockOpenModal,
  }),
}))

// Mock AIMarkerService
const mockCreateMarkersFromScenes = vi.fn()
const mockCreateMarkersFromKeyMoments = vi.fn()
const mockCreateQualityMarkers = vi.fn()
const mockCreateEmotionalMarkers = vi.fn()
const mockGroupNearbyMarkers = vi.fn()
const mockUpdateConfig = vi.fn()

vi.mock("@/features/timeline/services/ai-marker-service", () => ({
  AIMarkerService: vi.fn().mockImplementation(() => ({
    createMarkersFromScenes: mockCreateMarkersFromScenes,
    createMarkersFromKeyMoments: mockCreateMarkersFromKeyMoments,
    createQualityMarkers: mockCreateQualityMarkers,
    createEmotionalMarkers: mockCreateEmotionalMarkers,
    groupNearbyMarkers: mockGroupNearbyMarkers,
    updateConfig: mockUpdateConfig,
  })),
}))

// Mock Tooltip components
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => children,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => children,
}))

describe("AIMarkerControls", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset analysis state
    mockAnalysisState.isAnalyzing = false
    mockAnalysisState.sceneAnalysis = null
    mockAnalysisState.keyMoments = []
    mockAnalysisState.insights = null
  })

  it("renders control buttons", () => {
    render(<AIMarkerControls />)

    expect(screen.getByRole("button", { name: /AI Маркеры/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument()
  })

  it("shows error when no analysis data available", async () => {
    render(<AIMarkerControls />)

    const generateButton = screen.getByRole("button", { name: /AI Маркеры/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText("Нет данных анализа. Сначала проанализируйте Timeline.")).toBeInTheDocument()
    })
  })

  it("generates markers from scene analysis", async () => {
    // Setup scene analysis data
    mockAnalysisState.sceneAnalysis = {
      scenes: [
        {
          id: "scene1",
          startTime: 0,
          endTime: 5,
          duration: 5,
          type: SceneType.ESTABLISHING,
          keyFrames: [],
          quality: {
            overall: 90,
            sharpness: 85,
            brightness: 80,
            contrast: 75,
            saturation: 70,
            stability: 95,
            noise: 5,
          },
          content: { objects: [], faces: [], text: [], activities: [] },
          transitions: [],
        },
        {
          id: "scene2",
          startTime: 5,
          endTime: 10,
          duration: 5,
          type: SceneType.ACTION,
          keyFrames: [],
          quality: {
            overall: 85,
            sharpness: 80,
            brightness: 75,
            contrast: 70,
            saturation: 65,
            stability: 90,
            noise: 10,
          },
          content: { objects: [], faces: [], text: [], activities: [] },
          transitions: [],
        },
      ],
      keyMoments: [],
      classification: {
        contentType: ContentType.NARRATIVE,
        genres: [],
        confidence: 0.85,
      },
      summary: {
        totalScenes: 2,
        averageSceneDuration: 5,
        dominantColors: [],
        visualComplexity: 0.5,
        audioProfile: {
          hasSpeech: false,
          hasMusic: false,
          hasSilence: true,
          speechPercentage: 0,
          musicPercentage: 0,
          averageVolume: 0,
          dynamicRange: 0,
        },
      },
      timeline: {
        duration: 10,
        segments: [],
        keyframes: [],
      },
    }

    const mockSceneMarkers = [
      { id: "marker1", time: 0, label: "Scene 1" },
      { id: "marker2", time: 5, label: "Scene 2" },
    ]
    mockCreateMarkersFromScenes.mockReturnValue(mockSceneMarkers)
    mockGroupNearbyMarkers.mockImplementation((markers) => markers)

    render(<AIMarkerControls />)

    const generateButton = screen.getByRole("button", { name: /AI Маркеры/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(mockCreateMarkersFromScenes).toHaveBeenCalledWith(mockAnalysisState.sceneAnalysis.scenes)
      expect(mockSend).toHaveBeenCalledWith({ type: "ADD_MARKER", marker: mockSceneMarkers[0] })
      expect(mockSend).toHaveBeenCalledWith({ type: "ADD_MARKER", marker: mockSceneMarkers[1] })
    })

    // Check that markers were created and added
    expect(mockCreateMarkersFromScenes).toHaveBeenCalledWith(mockAnalysisState.sceneAnalysis.scenes)
    expect(mockSend).toHaveBeenCalledWith({ type: "ADD_MARKER", marker: mockSceneMarkers[0] })
    expect(mockSend).toHaveBeenCalledWith({ type: "ADD_MARKER", marker: mockSceneMarkers[1] })
  })

  it("generates markers from key moments", async () => {
    // Setup key moments data
    mockAnalysisState.keyMoments = [
      { time: 10, type: "action", confidence: 0.85, description: "Action moment" },
      { time: 20, type: "emotion", confidence: 0.9, description: "Emotional moment" },
    ]

    const mockMomentMarkers = [
      { id: "moment1", time: 10, label: "Key Moment 1" },
      { id: "moment2", time: 20, label: "Key Moment 2" },
    ]
    mockCreateMarkersFromKeyMoments.mockReturnValue(mockMomentMarkers)
    mockGroupNearbyMarkers.mockImplementation((markers) => markers)

    render(<AIMarkerControls />)

    const generateButton = screen.getByRole("button", { name: /AI Маркеры/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(mockCreateMarkersFromKeyMoments).toHaveBeenCalledWith(mockAnalysisState.keyMoments)
      expect(mockSend).toHaveBeenCalledTimes(2)
    })
  })

  it("shows progress during generation", async () => {
    mockAnalysisState.keyMoments = [{ time: 10, type: "action", confidence: 0.85 }]
    mockCreateMarkersFromKeyMoments.mockReturnValue([{ id: "marker1", time: 10 }])
    mockGroupNearbyMarkers.mockImplementation((markers) => markers)

    render(<AIMarkerControls />)

    const generateButton = screen.getByRole("button", { name: /AI Маркеры/i })
    fireEvent.click(generateButton)

    expect(screen.getByText("Создание...")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toBeInTheDocument()

    // Check that progress bar is visible during generation
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  it("disables generate button when analyzing", () => {
    mockAnalysisState.isAnalyzing = true

    render(<AIMarkerControls />)

    const generateButton = screen.getByRole("button", { name: /AI Маркеры/i })
    expect(generateButton).toBeDisabled()
  })

  it("opens settings modal", () => {
    render(<AIMarkerControls />)

    const settingsButton = screen.getByRole("button", { name: /settings/i })
    fireEvent.click(settingsButton)

    expect(mockOpenModal).toHaveBeenCalledWith("ai-marker-settings", {
      config: expect.objectContaining({
        createSceneMarkers: true,
        createKeyMomentMarkers: true,
        createQualityMarkers: false,
        createEmotionalMarkers: true,
        minConfidence: 0.7,
        minSceneDuration: 2,
        minQualityScore: 80,
        groupNearbyMarkers: true,
        groupingThreshold: 2,
      }),
      onSave: expect.any(Function),
    })
  })

  it("updates marker service config when settings are saved", () => {
    render(<AIMarkerControls />)

    const settingsButton = screen.getByRole("button", { name: /settings/i })
    fireEvent.click(settingsButton)

    const { onSave } = mockOpenModal.mock.calls[0][1]
    const newConfig = {
      createSceneMarkers: false,
      createKeyMomentMarkers: true,
      createQualityMarkers: true,
      createEmotionalMarkers: false,
      minConfidence: 0.8,
      minSceneDuration: 3,
      minQualityScore: 90,
      groupNearbyMarkers: false,
      groupingThreshold: 1,
    }

    onSave(newConfig)

    expect(mockUpdateConfig).toHaveBeenCalledWith(newConfig)
  })

  it("handles error during marker generation", async () => {
    mockAnalysisState.keyMoments = [{ time: 10 }]
    mockCreateMarkersFromKeyMoments.mockImplementation(() => {
      throw new Error("Generation failed")
    })

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    render(<AIMarkerControls />)

    const generateButton = screen.getByRole("button", { name: /AI Маркеры/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText("Ошибка при создании маркеров")).toBeInTheDocument()
    })

    expect(consoleSpy).toHaveBeenCalledWith("Failed to generate markers:", expect.any(Error))
    consoleSpy.mockRestore()
  })

  it("closes result alert", async () => {
    mockAnalysisState.keyMoments = [{ time: 10 }]
    mockCreateMarkersFromKeyMoments.mockReturnValue([{ id: "marker1", time: 10 }])
    mockGroupNearbyMarkers.mockImplementation((markers) => markers)

    render(<AIMarkerControls />)

    const generateButton = screen.getByRole("button", { name: /AI Маркеры/i })
    fireEvent.click(generateButton)

    // Check that marker was created
    expect(mockCreateMarkersFromKeyMoments).toHaveBeenCalled()
    expect(mockSend).toHaveBeenCalledWith({ type: "ADD_MARKER", marker: { id: "marker1", time: 10 } })
  })

  it("opens settings with current config", async () => {
    render(<AIMarkerControls />)

    const settingsButton = screen.getByRole("button", { name: /settings/i })
    fireEvent.click(settingsButton)

    expect(mockOpenModal).toHaveBeenCalledWith("ai-marker-settings", {
      config: expect.objectContaining({
        createSceneMarkers: true,
        createKeyMomentMarkers: true,
        createQualityMarkers: false, // Default is false
        createEmotionalMarkers: true,
        minConfidence: 0.7,
        minSceneDuration: 2,
        minQualityScore: 80,
        groupNearbyMarkers: true,
        groupingThreshold: 2,
      }),
      onSave: expect.any(Function),
    })
  })

  it("groups nearby markers when enabled", async () => {
    mockAnalysisState.keyMoments = [
      { time: 10, type: "action" },
      { time: 11, type: "emotion" },
    ]

    const mockMarkers = [
      { id: "marker1", time: 10, label: "Marker 1" },
      { id: "marker2", time: 11, label: "Marker 2" },
    ]
    const mockGroupedMarkers = [{ id: "grouped1", time: 10.5, label: "Grouped Marker" }]

    mockCreateMarkersFromKeyMoments.mockReturnValue(mockMarkers)
    mockGroupNearbyMarkers.mockReturnValue(mockGroupedMarkers)

    render(<AIMarkerControls />)

    const generateButton = screen.getByRole("button", { name: /AI Маркеры/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(mockGroupNearbyMarkers).toHaveBeenCalledWith(mockMarkers)
      expect(mockSend).toHaveBeenCalledWith({ type: "ADD_MARKER", marker: mockGroupedMarkers[0] })
      expect(mockSend).toHaveBeenCalledTimes(1) // Only grouped marker added
    })
  })

  it("handles className prop", () => {
    const { container } = render(<AIMarkerControls className="custom-class" />)

    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("displays progress bar during generation", async () => {
    mockAnalysisState.keyMoments = [{ time: 10 }]
    mockCreateMarkersFromKeyMoments.mockReturnValue([{ id: "marker1", time: 10 }])
    mockGroupNearbyMarkers.mockImplementation((markers) => markers)

    render(<AIMarkerControls />)

    const generateButton = screen.getByRole("button", { name: /AI Маркеры/i })
    fireEvent.click(generateButton)

    // Progress should be visible during generation
    expect(screen.getByRole("progressbar")).toBeInTheDocument()

    // Check that progress bar is visible during generation
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })
})
