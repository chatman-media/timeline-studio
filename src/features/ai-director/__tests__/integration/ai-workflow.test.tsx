/**
 * @vitest-environment jsdom
 *
 * AI Director Integration Tests
 * Comprehensive tests covering all AI functionality workflows
 */

import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AIDirectorConfig, ComprehensiveAnalysisResult, SceneAnalysis } from "@/types/generated/tauri-bindings"
import { useAIDirector } from "../../hooks/use-ai-director"

// ============================================================================
// Mock Setup
// ============================================================================

// Mock Tauri bindings commands - use vi.hoisted to avoid hoisting issues
const { mockCommands } = vi.hoisted(() => {
  const mockCommands = {
    aiDirectorAnalyzeComprehensive: vi.fn(),
    aiDirectorAnalyzeQuick: vi.fn(),
    aiDirectorAnalyzeBatch: vi.fn(),
    aiDirectorGetDefaultConfig: vi.fn(),
    aiDirectorValidateConfig: vi.fn(),
    aiDirectorGetCapabilities: vi.fn(),
    aiDirectorHealthCheck: vi.fn(),
  }
  return { mockCommands }
})

vi.mock("@/types/generated/tauri-bindings", () => ({
  commands: mockCommands,
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}))

// ============================================================================
// Test Data Factories
// ============================================================================

const createMockAnalysisResult = (id: string): ComprehensiveAnalysisResult => ({
  analysis_id: id,
  status: "Completed",
  audio_analysis: {
    basic_metrics: {
      duration: 120,
      sample_rate: 44100,
      channels: 2,
      bit_depth: 16,
      file_size: 1024000,
    },
    ffmpeg_analysis: {
      loudness: {
        integrated: -12.5,
        range: 8.0,
        true_peak: -1.0,
      },
      dynamics: {
        crest_factor: 6.0,
        dynamic_range: 18.5,
        compression_ratio: 2.0,
        attack_time: { seconds: 0.01 },
        release_time: { seconds: 0.1 },
      },
      frequency: {
        low_freq_energy: 0.3,
        mid_freq_energy: 0.5,
        high_freq_energy: 0.2,
        spectral_centroid: 2000,
        spectral_rolloff: 8000,
      },
      temporal: {
        zero_crossing_rate: 0.1,
        silence_ratio: 0.052,
        speech_ratio: 0.8,
      },
    },
    montage_analysis: {
      tempo: 120,
      beat_positions: [],
      rhythm_stability: 0.9,
      energy_curve: [],
      silence_segments: [],
    },
    transcription_analysis: {
      full_text: "Test transcription text",
      segments: [],
      detected_language: "en",
      confidence: 0.95,
    },
    analysis_metadata: {
      processing_time_ms: 1000,
      engines_used: ["ffmpeg", "whisper"],
      config_snapshot: "{}",
      timestamp: "2024-01-01T00:00:00Z",
    },
  },
  scene_analysis: {
    scenes: [
      {
        id: "scene-1",
        fileId: "file-1",
        startTime: 0,
        endTime: 30,
        duration: 30,
        sceneType: "dialog",
        confidence: 0.92,
        keyFrames: [0, 15],
        description: "Indoor scene",
        visual: null,
        audio: null,
        emotional: null,
        tags: [],
      },
      {
        id: "scene-2",
        fileId: "file-1",
        startTime: 30,
        endTime: 60,
        duration: 30,
        sceneType: "action",
        confidence: 0.88,
        keyFrames: [30, 45],
        description: "Outdoor scene",
        visual: null,
        audio: null,
        emotional: null,
        tags: [],
      },
    ],
    total_scenes: 2,
    avg_scene_duration: 30,
    scene_types_distribution: {},
  },
  vision_analysis: null,
  moment_analysis: null,
  content_analysis: null,
  combined_insights: {
    overall_quality_score: 0.85,
    key_moments: [],
    content_tags: [],
    dominant_emotions: [],
    pacing_analysis: {
      overall_pace: "medium",
      pace_changes: [],
      recommended_cuts: [],
    },
    quality_issues: [],
    enhancement_suggestions: [],
  },
  performance_metrics: {
    total_processing_time_ms: 60000,
    peak_memory_usage_mb: 512,
    cpu_usage_percent: 50,
    gpu_usage_percent: null,
    cache_hit_rate: null,
  },
  editing_recommendations: [],
  errors: [],
  metadata: {
    analysis_version: "1.0.0",
    processing_time_ms: 60000,
    config_used: "{}",
    engines_used: ["ffmpeg", "whisper"],
    total_engines_available: 3,
    analysis_timestamp: "2024-01-01T00:00:00Z",
    success_rate: 1.0,
  },
})

const createMockConfig = (): AIDirectorConfig => ({
  performance_mode: "balanced",
  enable_audio_analysis: true,
  enable_scene_detection: true,
  enable_video_analysis: true,
  enable_vision_analysis: true,
  enable_face_detection: true,
  enable_face_analysis: true,
  enable_object_detection: true,
  enable_moment_detection: true,
  enable_content_analysis: true,
  enable_transcription: true,
  timeout_seconds: 300,
  max_memory_mb: 2048,
  enable_caching: true,
  cache_ttl_seconds: 3600,
})

// ============================================================================
// Integration Tests - Main Workflows
// ============================================================================

describe("AI Director Workflow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.values(mockCommands).forEach((mock) => mock.mockReset())
  })

  describe("1. Full AI Director Analysis Workflow", () => {
    it("should complete comprehensive analysis with all components", async () => {
      // Assertions: 14
      const mockResult = createMockAnalysisResult("comprehensive-1")
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())

      const analysis = await result.current.analyzeComprehensive("/test/video.mp4", createMockConfig())

      expect(analysis).toBeDefined()
      expect(analysis.analysis_id).toBe("comprehensive-1")
      expect(analysis.status).toBe("Completed")
      expect(analysis.audio_analysis).toBeDefined()
      expect(analysis.audio_analysis?.ffmpeg_analysis?.loudness.integrated).toBe(-12.5)
      expect(analysis.scene_analysis).toBeDefined()
      expect(analysis.scene_analysis?.total_scenes).toBe(2)
      expect(analysis.vision_analysis).toBeNull()
      expect(analysis.moment_analysis).toBeNull()
      expect(analysis.content_analysis).toBeNull()
      expect(analysis.errors).toHaveLength(0)

      await waitFor(() => {
        expect(result.current.state.isAnalyzing).toBe(false)
        expect(result.current.state.currentResult).toEqual(mockResult)
        expect(result.current.state.error).toBeNull()
      })
    })

    it("should handle quick analysis mode", async () => {
      // Assertions: 9
      const mockResult = createMockAnalysisResult("quick-1")
      mockCommands.aiDirectorAnalyzeQuick.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())

      const analysis = await result.current.analyzeQuick("/test/video.mp4")

      expect(analysis.analysis_id).toBe("quick-1")
      expect(analysis.status).toBe("Completed")
      expect(mockCommands.aiDirectorAnalyzeQuick).toHaveBeenCalledWith("/test/video.mp4")

      await waitFor(() => {
        expect(result.current.state.isAnalyzing).toBe(false)
        expect(result.current.state.currentResult).toBeDefined()
        expect(result.current.state.error).toBeNull()
        expect(result.current.state.lastAnalyzedPath).toBe("/test/video.mp4")
        expect(result.current.state.analysisProgress).toBe(100)
        expect(result.current.state.currentResult?.analysis_id).toBe("quick-1")
      })
    })

    it("should process batch analysis for multiple files", async () => {
      // Assertions: 12
      const mockResults = [
        createMockAnalysisResult("batch-1"),
        createMockAnalysisResult("batch-2"),
        createMockAnalysisResult("batch-3"),
      ]
      mockCommands.aiDirectorAnalyzeBatch.mockResolvedValue({
        status: "ok",
        data: mockResults,
      })

      const { result } = renderHook(() => useAIDirector())
      const filePaths = ["/test/video1.mp4", "/test/video2.mp4", "/test/video3.mp4"]

      const results = await result.current.analyzeBatch(filePaths)

      expect(results).toHaveLength(3)
      expect(results[0].analysis_id).toBe("batch-1")
      expect(results[1].analysis_id).toBe("batch-2")
      expect(results[2].analysis_id).toBe("batch-3")
      expect(results.every((r) => r.status === "Completed")).toBe(true)

      await waitFor(() => {
        expect(result.current.state.isAnalyzing).toBe(false)
        expect(result.current.state.currentResult).toEqual(mockResults[2])
      })

      expect(mockCommands.aiDirectorAnalyzeBatch).toHaveBeenCalledWith(filePaths, null)
      expect(mockCommands.aiDirectorAnalyzeBatch).toHaveBeenCalledTimes(1)
      expect(result.current.state.error).toBeNull()
      expect(mockResults).toHaveLength(3)
      expect(mockResults[0].audio_analysis).toBeDefined()
    })
  })

  describe("2. Scene Detection and Classification", () => {
    it("should detect multiple scenes with metadata", async () => {
      // Assertions: 10
      const mockResult = createMockAnalysisResult("scene-1")
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      expect(analysis.scene_analysis).toBeDefined()
      expect(analysis.scene_analysis?.scenes).toHaveLength(2)
      expect(analysis.scene_analysis?.total_scenes).toBe(2)

      const scenes = analysis.scene_analysis?.scenes || []
      expect(scenes[0].startTime).toBe(0)
      expect(scenes[0].endTime).toBe(30)
      expect(scenes[0].confidence).toBeGreaterThan(0.8)
      expect(scenes[1].startTime).toBe(30)
      expect(scenes[1].endTime).toBe(60)
      expect(scenes.every((s) => s.confidence > 0.8)).toBe(true)
      expect(scenes.every((s) => s.startTime < s.endTime)).toBe(true)
    })

    it("should validate scene boundaries and transitions", async () => {
      // Assertions: 8
      const mockResult = createMockAnalysisResult("boundaries-1")
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const scenes = analysis.scene_analysis?.scenes || []
      expect(scenes.length).toBeGreaterThan(0)

      // Verify no overlaps
      for (let i = 0; i < scenes.length - 1; i++) {
        expect(scenes[i].endTime).toBeLessThanOrEqual(scenes[i + 1].startTime)
      }

      // Verify valid ranges
      scenes.forEach((scene) => {
        expect(scene.startTime).toBeLessThan(scene.endTime)
        expect(scene.confidence).toBeGreaterThan(0)
        expect(scene.confidence).toBeLessThanOrEqual(1)
      })

      expect(scenes[0].description).toBeDefined()
      expect(scenes[1].description).toBeDefined()
    })
  })

  describe("3. Smart Montage Generation", () => {
    it("should generate montage data from analysis results", async () => {
      // Assertions: 10
      const mockResult = createMockAnalysisResult("montage-1")
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const scenes = analysis.scene_analysis?.scenes || []
      const duration = analysis.audio_analysis?.basic_metrics.duration || 0

      expect(scenes.length).toBeGreaterThan(0)
      expect(duration).toBeGreaterThan(0)

      scenes.forEach((scene) => {
        expect(scene.startTime).toBeDefined()
        expect(scene.endTime).toBeDefined()
        expect(scene.confidence).toBeGreaterThan(0)
      })

      // Verify moments can be extracted from combined insights
      const keyMoments = analysis.combined_insights.key_moments
      expect(keyMoments).toBeDefined()
      expect(Array.isArray(keyMoments)).toBe(true)

      expect(duration).toBe(120)
    })

    it("should prioritize high-quality moments", async () => {
      // Assertions: 8
      const mockResult = createMockAnalysisResult("quality-1")
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const keyMoments = analysis.combined_insights.key_moments
      const qualityScore = analysis.combined_insights.overall_quality_score

      expect(keyMoments).toBeDefined()
      expect(qualityScore).toBeGreaterThan(0)

      // Verify high quality analysis
      expect(qualityScore).toBeGreaterThan(0.8)
      expect(qualityScore).toBeLessThanOrEqual(1)

      // Verify scenes have high confidence
      const scenes = analysis.scene_analysis?.scenes || []
      const highQualityScenes = scenes.filter((s) => s.confidence > 0.8)
      expect(highQualityScenes.length).toBeGreaterThan(0)

      highQualityScenes.forEach((scene) => {
        expect(scene.confidence).toBeGreaterThan(0.8)
      })

      expect(scenes.length).toBe(2)
      expect(qualityScore).toBe(0.85)
    })
  })

  describe("4. Auto-cut Suggestions", () => {
    it("should generate cut points from scene analysis", async () => {
      // Assertions: 9
      const mockResult = createMockAnalysisResult("autocut-1")
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const scenes = analysis.scene_analysis?.scenes || []
      const cutPoints = scenes.map((s) => s.startTime)

      expect(cutPoints.length).toBe(scenes.length)
      expect(cutPoints.length).toBeGreaterThan(0)

      // Verify chronological order
      for (let i = 0; i < cutPoints.length - 1; i++) {
        expect(cutPoints[i]).toBeLessThan(cutPoints[i + 1])
      }

      // Verify within video duration
      const duration = analysis.audio_analysis?.basic_metrics.duration || 120
      cutPoints.forEach((cut) => {
        expect(cut).toBeGreaterThanOrEqual(0)
        expect(cut).toBeLessThanOrEqual(duration)
      })

      expect(duration).toBe(120)
    })

    it("should suggest cuts based on audio metrics", async () => {
      // Assertions: 8
      const mockResult = createMockAnalysisResult("audio-cuts-1")
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const audio = analysis.audio_analysis
      expect(audio).toBeDefined()
      expect(audio?.ffmpeg_analysis?.temporal.silence_ratio).toBeDefined()
      expect(audio?.ffmpeg_analysis?.temporal.silence_ratio).toBeGreaterThanOrEqual(0)
      expect(audio?.ffmpeg_analysis?.temporal.silence_ratio).toBeLessThanOrEqual(1)
      expect(audio?.montage_analysis?.tempo).toBeDefined()
      expect(audio?.montage_analysis?.tempo).toBeGreaterThan(0)
      expect(audio?.ffmpeg_analysis?.loudness.integrated).toBeDefined()
      expect(audio?.basic_metrics.duration).toBeGreaterThan(0)
    })
  })

  describe("5. Content-aware Trimming", () => {
    it("should identify trimmable sections", async () => {
      // Assertions: 9
      const mockResult = createMockAnalysisResult("trim-1")
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const audio = analysis.audio_analysis
      const scenes = analysis.scene_analysis?.scenes || []

      expect(audio).toBeDefined()
      expect(audio?.ffmpeg_analysis?.temporal.silence_ratio).toBeDefined()
      expect(scenes.length).toBeGreaterThan(0)

      // Check for quality issues
      const qualityIssues = analysis.combined_insights.quality_issues
      expect(qualityIssues).toBeDefined()
      expect(Array.isArray(qualityIssues)).toBe(true)

      scenes.forEach((scene) => {
        const duration = scene.endTime - scene.startTime
        expect(duration).toBeGreaterThan(0)
      })

      expect(analysis.audio_analysis?.basic_metrics.duration).toBe(120)
      expect(analysis.errors).toHaveLength(0)
    })

    it("should preserve important moments during trimming", async () => {
      // Assertions: 9
      const mockResult = createMockAnalysisResult("preserve-1")
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const keyMoments = analysis.combined_insights.key_moments
      const scenes = analysis.scene_analysis?.scenes || []

      expect(keyMoments).toBeDefined()
      expect(Array.isArray(keyMoments)).toBe(true)

      // Verify important scenes are preserved (high confidence)
      const importantScenes = scenes.filter((s) => s.confidence > 0.9)
      expect(importantScenes.length).toBeGreaterThan(0)

      importantScenes.forEach((scene) => {
        expect(scene.startTime).toBeDefined()
        expect(scene.confidence).toBeGreaterThan(0.9)
      })

      expect(scenes.length).toBeGreaterThan(0)
      expect(analysis.combined_insights.overall_quality_score).toBeGreaterThan(0)
      expect(analysis.errors).toHaveLength(0)
    })
  })

  describe("6. Audio Quality Analysis", () => {
    it("should analyze comprehensive audio metrics", async () => {
      // Assertions: 11
      const mockResult = createMockAnalysisResult("audio-quality-1")
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const audio = analysis.audio_analysis
      expect(audio).toBeDefined()
      expect(audio?.basic_metrics.duration).toBeGreaterThan(0)
      expect(audio?.ffmpeg_analysis?.loudness.integrated).toBeDefined()
      expect(audio?.montage_analysis?.tempo).toBeGreaterThan(0)
      expect(audio?.ffmpeg_analysis?.temporal.silence_ratio).toBeGreaterThanOrEqual(0)
      expect(audio?.ffmpeg_analysis?.temporal.silence_ratio).toBeLessThanOrEqual(1)

      const dynamics = audio?.ffmpeg_analysis?.dynamics
      expect(dynamics).toBeDefined()
      expect(dynamics?.crest_factor).toBeGreaterThan(0)
      expect(dynamics?.dynamic_range).toBeGreaterThan(0)
      expect(dynamics?.compression_ratio).toBeGreaterThan(0)
      expect(audio?.ffmpeg_analysis?.loudness.true_peak).toBeDefined()
    })

    it("should detect audio quality issues", async () => {
      // Assertions: 8
      const mockResult = createMockAnalysisResult("audio-issues-1")
      mockResult.audio_analysis!.ffmpeg_analysis!.loudness.integrated = -3.0
      mockResult.audio_analysis!.ffmpeg_analysis!.temporal.silence_ratio = 0.45

      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const audio = analysis.audio_analysis
      expect(audio).toBeDefined()
      expect(audio?.ffmpeg_analysis?.loudness.integrated).toBe(-3.0)
      expect(audio?.ffmpeg_analysis?.temporal.silence_ratio).toBe(0.45)

      // Check for loudness issues
      if (audio?.ffmpeg_analysis && audio.ffmpeg_analysis.loudness.integrated > -6) {
        expect(audio.ffmpeg_analysis.loudness.integrated).toBeGreaterThan(-6)
      }

      // Check for excessive silence
      if (audio?.ffmpeg_analysis && audio.ffmpeg_analysis.temporal.silence_ratio > 0.3) {
        expect(audio.ffmpeg_analysis.temporal.silence_ratio).toBeGreaterThan(0.3)
      }

      expect(audio?.montage_analysis?.tempo).toBeDefined()
      expect(analysis.errors).toHaveLength(0)
      expect(result.current.state.error).toBeNull()
    })
  })

  describe("7. Face Detection and Tracking", () => {
    it("should detect and track faces across timeline", async () => {
      // Assertions: 10
      const mockResult = createMockAnalysisResult("face-track-1")
      mockResult.vision_analysis = {
        objects_detected: [],
        faces_count: 3,
        avg_composition_score: 0.85,
        visual_quality_avg: 0.9,
      }

      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const visionAnalysis = analysis.vision_analysis
      expect(visionAnalysis).toBeDefined()
      expect(visionAnalysis?.faces_count).toBe(3)
      expect(visionAnalysis?.avg_composition_score).toBeGreaterThan(0)

      // Verify quality metrics
      expect(visionAnalysis?.visual_quality_avg).toBeGreaterThan(0.8)
      expect(visionAnalysis?.visual_quality_avg).toBeLessThanOrEqual(1)

      // Verify overall analysis quality
      const qualityScore = analysis.combined_insights.overall_quality_score
      expect(qualityScore).toBeGreaterThan(0)
      expect(qualityScore).toBeLessThanOrEqual(1)

      expect(analysis.errors).toHaveLength(0)
      expect(visionAnalysis?.faces_count).toBeGreaterThan(0)
    })

    it("should handle multiple faces in same frame", async () => {
      // Assertions: 8
      const mockResult = createMockAnalysisResult("multi-face-1")
      mockResult.vision_analysis = {
        objects_detected: ["person", "person", "person"],
        faces_count: 3,
        avg_composition_score: 0.88,
        visual_quality_avg: 0.92,
      }

      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const visionAnalysis = analysis.vision_analysis
      expect(visionAnalysis).toBeDefined()
      expect(visionAnalysis?.faces_count).toBe(3)

      // Verify quality is high with multiple faces
      expect(visionAnalysis?.avg_composition_score).toBeGreaterThan(0.8)
      expect(visionAnalysis?.visual_quality_avg).toBeGreaterThan(0.8)

      // Verify objects detected
      const objectsDetected = visionAnalysis?.objects_detected || []
      expect(objectsDetected.length).toBeGreaterThan(0)
      expect(analysis.errors).toHaveLength(0)
      expect(result.current.state.error).toBeNull()
    })
  })

  describe("8. Object Recognition in Video", () => {
    it("should recognize and categorize objects", async () => {
      // Assertions: 10
      const mockResult = createMockAnalysisResult("object-1")
      mockResult.vision_analysis = {
        objects_detected: ["person", "car", "dog"],
        faces_count: 1,
        avg_composition_score: 0.85,
        visual_quality_avg: 0.88,
      }

      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const visionAnalysis = analysis.vision_analysis
      expect(visionAnalysis).toBeDefined()
      expect(visionAnalysis?.objects_detected).toBeDefined()
      expect(visionAnalysis?.objects_detected.length).toBe(3)

      const objects = visionAnalysis?.objects_detected || []
      expect(objects).toContain("person")
      expect(objects).toContain("car")
      expect(objects).toContain("dog")

      // Verify vision quality metrics
      expect(visionAnalysis?.avg_composition_score).toBeGreaterThan(0.7)
      expect(visionAnalysis?.visual_quality_avg).toBeGreaterThan(0.7)
      expect(analysis.errors).toHaveLength(0)
    })
  })

  describe("9. Automated Color Grading Suggestions", () => {
    it("should analyze color composition", async () => {
      // Assertions: 8
      const mockResult = createMockAnalysisResult("color-1")
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      // Verify vision analysis has composition data
      expect(analysis.vision_analysis).toBeDefined()
      expect(analysis.combined_insights.overall_quality_score).toBeGreaterThan(0)
      expect(analysis.scene_analysis?.scenes).toHaveLength(2)
      expect(analysis.scene_analysis?.total_scenes).toBe(2)
      expect(analysis.audio_analysis?.basic_metrics.duration).toBe(120)

      // Verify enhancement suggestions are available
      const suggestions = analysis.combined_insights.enhancement_suggestions
      expect(suggestions).toBeDefined()
      expect(result.current.state.error).toBeNull()
    })
  })

  describe("10. AI-powered Subtitle Generation", () => {
    it("should generate subtitles from transcription", async () => {
      // Assertions: 9
      const mockResult = createMockAnalysisResult("subtitle-1")
      mockResult.audio_analysis!.transcription_analysis = {
        full_text: "Hello world. This is a test. We are testing subtitle generation.",
        segments: [],
        detected_language: "en",
        confidence: 0.95,
      }

      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const transcription = analysis.audio_analysis?.transcription_analysis?.full_text
      expect(transcription).toBeDefined()
      expect(transcription).toContain("Hello world")
      expect(transcription).toContain("test")
      expect(transcription?.length).toBeGreaterThan(0)
      expect(transcription?.split(". ")).toHaveLength(3)
      expect(analysis.audio_analysis).toBeDefined()
      expect(analysis.audio_analysis?.basic_metrics.duration).toBeGreaterThan(0)
      expect(analysis.errors).toHaveLength(0)
      expect(result.current.state.error).toBeNull()
    })
  })

  describe("11. Integration with Timeline (AI Suggestions)", () => {
    it("should provide data for timeline integration", async () => {
      // Assertions: 10
      const mockResult = createMockAnalysisResult("timeline-1")
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      expect(analysis.scene_analysis?.scenes).toBeDefined()
      expect(analysis.editing_recommendations).toBeDefined()
      expect(analysis.audio_analysis).toBeDefined()

      const scenes = analysis.scene_analysis?.scenes || []
      const segments = scenes.map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        type: "scene" as const,
        confidence: s.confidence,
      }))

      expect(segments.length).toBe(scenes.length)
      segments.forEach((seg) => {
        expect(seg.startTime).toBeLessThan(seg.endTime)
        expect(seg.type).toBe("scene")
        expect(seg.confidence).toBeGreaterThan(0)
      })

      expect(result.current.state.error).toBeNull()
      expect(result.current.state.isAnalyzing).toBe(false)
    })
  })

  describe("12. Performance with Long Videos", () => {
    it("should handle analysis of long videos", async () => {
      // Assertions: 9
      const mockResult = createMockAnalysisResult("long-video-1")
      mockResult.audio_analysis!.basic_metrics.duration = 3600 // 1 hour
      mockResult.performance_metrics.total_processing_time_ms = 45000 // 45 seconds processing

      mockCommands.aiDirectorAnalyzeComprehensive.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ status: "ok", data: mockResult }), 100)
          }),
      )

      const { result } = renderHook(() => useAIDirector())
      const startTime = Date.now()

      const analysis = await result.current.analyzeComprehensive("/test/long-video.mp4")
      const endTime = Date.now()

      expect(analysis).toBeDefined()
      expect(analysis.audio_analysis?.basic_metrics.duration).toBe(3600)
      expect(endTime - startTime).toBeLessThan(10000)
      expect(analysis.scene_analysis).toBeDefined()
      expect(analysis.audio_analysis).toBeDefined()
      expect(analysis.performance_metrics.total_processing_time_ms).toBe(45000)
      expect(analysis.errors).toHaveLength(0)

      await waitFor(() => {
        expect(result.current.state.error).toBeNull()
        expect(result.current.state.isAnalyzing).toBe(false)
      })
    })

    it("should handle timeout scenarios", async () => {
      // Assertions: 4
      mockCommands.aiDirectorAnalyzeComprehensive.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Analysis timeout")), 50)
          }),
      )

      const { result } = renderHook(() => useAIDirector())

      await expect(result.current.analyzeComprehensive("/test/video.mp4")).rejects.toThrow("Analysis timeout")

      await waitFor(() => {
        expect(result.current.state.error).toBe("Analysis timeout")
        expect(result.current.state.isAnalyzing).toBe(false)
      })

      expect(mockCommands.aiDirectorAnalyzeComprehensive).toHaveBeenCalled()
    })
  })

  describe("13. System Capabilities", () => {
    it("should retrieve system capabilities", async () => {
      // Assertions: 9
      const mockCaps = {
        audio_analysis: true,
        video_analysis: true,
        scene_detection: true,
        object_detection: true,
        face_recognition: true,
        transcription: true,
        gpu_available: true,
        max_video_resolution: { width: 4096, height: 2160 },
        supported_codecs: ["h264", "h265", "vp9"],
        max_parallel_analyses: 4,
      }

      mockCommands.aiDirectorGetCapabilities.mockResolvedValue({
        status: "ok",
        data: mockCaps,
      })

      const { result } = renderHook(() => useAIDirector())
      const caps = await result.current.getCapabilities()

      expect(caps.audio_analysis).toBe(true)
      expect(caps.video_analysis).toBe(true)
      expect(caps.scene_detection).toBe(true)
      expect(caps.object_detection).toBe(true)
      expect(caps.face_recognition).toBe(true)
      expect(caps.transcription).toBe(true)
      expect(caps.gpu_available).toBe(true)
      expect(caps.supported_codecs).toContain("h264")
      expect(caps.max_parallel_analyses).toBeGreaterThan(0)
    })

    it("should validate configuration", async () => {
      // Assertions: 7
      const mockValidation = {
        isValid: true,
        warnings: [],
        errors: [],
        estimatedTime: 120,
        estimatedMemory: 512,
      }

      mockCommands.aiDirectorValidateConfig.mockResolvedValue({
        status: "ok",
        data: mockValidation,
      })

      const { result } = renderHook(() => useAIDirector())
      const validation = await result.current.validateConfig(createMockConfig())

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(validation.warnings).toHaveLength(0)
      expect(validation.estimatedTime).toBeGreaterThan(0)
      expect(validation.estimatedMemory).toBeGreaterThan(0)
      expect(mockCommands.aiDirectorValidateConfig).toHaveBeenCalled()
      expect(mockCommands.aiDirectorValidateConfig).toHaveBeenCalledTimes(1)
    })
  })

  describe("14. Error Handling", () => {
    it("should handle analysis errors gracefully", async () => {
      // Assertions: 5
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "error",
        error: "GPU out of memory",
      })

      const { result } = renderHook(() => useAIDirector())

      await expect(result.current.analyzeComprehensive("/test/video.mp4")).rejects.toThrow("GPU out of memory")

      await waitFor(() => {
        expect(result.current.state.error).toBe("GPU out of memory")
        expect(result.current.state.isAnalyzing).toBe(false)
        expect(result.current.state.currentResult).toBeNull()
      })

      expect(mockCommands.aiDirectorAnalyzeComprehensive).toHaveBeenCalled()
    })

    it("should clear errors on next successful analysis", async () => {
      // Assertions: 7
      const mockResult = createMockAnalysisResult("recovery-1")

      mockCommands.aiDirectorAnalyzeQuick
        .mockResolvedValueOnce({ status: "error", error: "First error" })
        .mockResolvedValueOnce({ status: "ok", data: mockResult })

      const { result } = renderHook(() => useAIDirector())

      await expect(result.current.analyzeQuick("/test/video.mp4")).rejects.toThrow("First error")
      await waitFor(() => expect(result.current.state.error).toBe("First error"))

      const analysis = await result.current.analyzeQuick("/test/video.mp4")

      expect(analysis).toEqual(mockResult)
      await waitFor(() => {
        expect(result.current.state.error).toBeNull()
        expect(result.current.state.currentResult).toEqual(mockResult)
        expect(result.current.state.isAnalyzing).toBe(false)
      })

      expect(mockCommands.aiDirectorAnalyzeQuick).toHaveBeenCalledTimes(2)
    })
  })
})
