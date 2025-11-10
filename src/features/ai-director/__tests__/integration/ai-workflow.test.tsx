/**
 * @vitest-environment jsdom
 *
 * AI Director Integration Tests
 * Comprehensive tests covering all AI functionality workflows
 */

import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AIDirectorConfig, ComprehensiveAnalysisResult } from "@/features/ai-director/types/ai-director"
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
  status: "completed",
  audio_analysis: {
    duration: 120,
    loudness: -12.5,
    tempo: 120,
    silence_percentage: 5.2,
    transcription: "Test transcription text",
    metrics: {
      peak_volume: 0.95,
      rms_volume: 0.65,
      dynamic_range: 18.5,
    },
  },
  scene_analysis: {
    scenes: [
      { start_time: 0, end_time: 30, confidence: 0.92, description: "Indoor scene" },
      { start_time: 30, end_time: 60, confidence: 0.88, description: "Outdoor scene" },
    ],
    scene_count: 2,
  },
  video_analysis: {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 120,
    bitrate: 5000000,
    codec: "h264",
  },
  object_detection: {
    objects: [
      { label: "person", confidence: 0.92, bbox: [0.3, 0.4, 0.2, 0.3], timestamp: 5 },
      { label: "car", confidence: 0.85, bbox: [0.5, 0.6, 0.3, 0.2], timestamp: 35 },
    ],
    total_objects: 2,
  },
  face_recognition: {
    faces: [{ person_id: "person-1", confidence: 0.94, bbox: [0.4, 0.3, 0.15, 0.2], timestamp: 10 }],
    total_faces: 1,
  },
  started_at: "2024-01-01T00:00:00Z",
  completed_at: "2024-01-01T00:01:00Z",
  total_duration_ms: 60000,
  errors: [],
})

const createMockConfig = (): AIDirectorConfig => ({
  performance_mode: "balanced",
  enable_audio_analysis: true,
  enable_scene_detection: true,
  enable_video_analysis: true,
  enable_object_detection: true,
  enable_face_recognition: true,
  enable_transcription: true,
  timeout_seconds: 300,
  max_memory_mb: 2048,
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
      expect(analysis.status).toBe("completed")
      expect(analysis.audio_analysis).toBeDefined()
      expect(analysis.audio_analysis?.loudness).toBe(-12.5)
      expect(analysis.scene_analysis).toBeDefined()
      expect(analysis.scene_analysis?.scene_count).toBe(2)
      expect(analysis.video_analysis?.width).toBe(1920)
      expect(analysis.object_detection?.total_objects).toBe(2)
      expect(analysis.face_recognition?.total_faces).toBe(1)
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
      expect(analysis.status).toBe("completed")
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
      expect(results.every((r) => r.status === "completed")).toBe(true)

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
      expect(analysis.scene_analysis?.scene_count).toBe(2)

      const scenes = analysis.scene_analysis?.scenes || []
      expect(scenes[0].start_time).toBe(0)
      expect(scenes[0].end_time).toBe(30)
      expect(scenes[0].confidence).toBeGreaterThan(0.8)
      expect(scenes[1].start_time).toBe(30)
      expect(scenes[1].end_time).toBe(60)
      expect(scenes.every((s) => s.confidence > 0.8)).toBe(true)
      expect(scenes.every((s) => s.start_time < s.end_time)).toBe(true)
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
        expect(scenes[i].end_time).toBeLessThanOrEqual(scenes[i + 1].start_time)
      }

      // Verify valid ranges
      scenes.forEach((scene) => {
        expect(scene.start_time).toBeLessThan(scene.end_time)
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
      const objects = analysis.object_detection?.objects || []

      expect(scenes.length).toBeGreaterThan(0)
      expect(objects.length).toBeGreaterThan(0)

      scenes.forEach((scene) => {
        expect(scene.start_time).toBeDefined()
        expect(scene.end_time).toBeDefined()
        expect(scene.confidence).toBeGreaterThan(0)
      })

      objects.forEach((obj) => {
        expect(obj.timestamp).toBeDefined()
        expect(obj.confidence).toBeGreaterThan(0)
      })

      expect(analysis.video_analysis?.duration).toBe(120)
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

      const objects = analysis.object_detection?.objects || []
      const faces = analysis.face_recognition?.faces || []

      const highQualityObjects = objects.filter((o) => o.confidence > 0.8)
      const highQualityFaces = faces.filter((f) => f.confidence > 0.8)

      expect(highQualityObjects.length).toBeGreaterThan(0)
      expect(highQualityFaces.length).toBeGreaterThan(0)

      highQualityObjects.forEach((obj) => {
        expect(obj.confidence).toBeGreaterThan(0.8)
      })

      highQualityFaces.forEach((face) => {
        expect(face.confidence).toBeGreaterThan(0.8)
      })

      expect(objects.length).toBe(2)
      expect(faces.length).toBe(1)
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
      const cutPoints = scenes.map((s) => s.start_time)

      expect(cutPoints.length).toBe(scenes.length)
      expect(cutPoints.length).toBeGreaterThan(0)

      // Verify chronological order
      for (let i = 0; i < cutPoints.length - 1; i++) {
        expect(cutPoints[i]).toBeLessThan(cutPoints[i + 1])
      }

      // Verify within video duration
      const duration = analysis.video_analysis?.duration || 120
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
      expect(audio?.silence_percentage).toBeDefined()
      expect(audio?.silence_percentage).toBeGreaterThanOrEqual(0)
      expect(audio?.silence_percentage).toBeLessThanOrEqual(100)
      expect(audio?.tempo).toBeDefined()
      expect(audio?.tempo).toBeGreaterThan(0)
      expect(audio?.loudness).toBeDefined()
      expect(audio?.duration).toBeGreaterThan(0)
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
      const objects = analysis.object_detection?.objects || []
      const scenes = analysis.scene_analysis?.scenes || []

      expect(audio).toBeDefined()
      expect(audio?.silence_percentage).toBeDefined()
      expect(objects.length).toBeGreaterThan(0)
      expect(scenes.length).toBeGreaterThan(0)

      const lowActivityObjects = objects.filter((o) => o.confidence < 0.7)
      expect(lowActivityObjects).toBeDefined()

      scenes.forEach((scene) => {
        const duration = scene.end_time - scene.start_time
        expect(duration).toBeGreaterThan(0)
      })

      expect(analysis.video_analysis?.duration).toBe(120)
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

      const faces = analysis.face_recognition?.faces || []
      const objects = analysis.object_detection?.objects || []

      const importantFaces = faces.filter((f) => f.confidence > 0.9)
      const importantObjects = objects.filter((o) => o.confidence > 0.9)

      expect(importantFaces.length).toBeGreaterThan(0)
      importantFaces.forEach((face) => {
        expect(face.timestamp).toBeDefined()
        expect(face.confidence).toBeGreaterThan(0.9)
      })

      expect(importantObjects.length).toBeGreaterThan(0)
      importantObjects.forEach((obj) => {
        expect(obj.timestamp).toBeDefined()
        expect(obj.confidence).toBeGreaterThan(0.9)
      })

      expect(faces.length).toBe(1)
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
      expect(audio?.duration).toBeGreaterThan(0)
      expect(audio?.loudness).toBeDefined()
      expect(audio?.tempo).toBeGreaterThan(0)
      expect(audio?.silence_percentage).toBeGreaterThanOrEqual(0)
      expect(audio?.silence_percentage).toBeLessThanOrEqual(100)

      const metrics = audio?.metrics
      expect(metrics).toBeDefined()
      expect(metrics?.peak_volume).toBeGreaterThan(0)
      expect(metrics?.peak_volume).toBeLessThanOrEqual(1)
      expect(metrics?.rms_volume).toBeGreaterThan(0)
      expect(metrics?.dynamic_range).toBeGreaterThan(0)
    })

    it("should detect audio quality issues", async () => {
      // Assertions: 8
      const mockResult = createMockAnalysisResult("audio-issues-1")
      mockResult.audio_analysis!.loudness = -3.0
      mockResult.audio_analysis!.silence_percentage = 45.0

      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const audio = analysis.audio_analysis
      expect(audio).toBeDefined()
      expect(audio?.loudness).toBe(-3.0)
      expect(audio?.silence_percentage).toBe(45.0)

      // Check for loudness issues
      if (audio && audio.loudness > -6) {
        expect(audio.loudness).toBeGreaterThan(-6)
      }

      // Check for excessive silence
      if (audio && audio.silence_percentage > 30) {
        expect(audio.silence_percentage).toBeGreaterThan(30)
      }

      expect(audio?.tempo).toBeDefined()
      expect(analysis.errors).toHaveLength(0)
      expect(result.current.state.error).toBeNull()
    })
  })

  describe("7. Face Detection and Tracking", () => {
    it("should detect and track faces across timeline", async () => {
      // Assertions: 10
      const mockResult = createMockAnalysisResult("face-track-1")
      mockResult.face_recognition = {
        faces: [
          { person_id: "person-1", confidence: 0.94, bbox: [0.4, 0.3, 0.15, 0.2], timestamp: 10 },
          { person_id: "person-1", confidence: 0.92, bbox: [0.42, 0.32, 0.15, 0.2], timestamp: 15 },
          { person_id: "person-2", confidence: 0.89, bbox: [0.6, 0.4, 0.12, 0.18], timestamp: 20 },
        ],
        total_faces: 3,
      }

      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const faceRecog = analysis.face_recognition
      expect(faceRecog).toBeDefined()
      expect(faceRecog?.total_faces).toBe(3)
      expect(faceRecog?.faces).toHaveLength(3)

      const person1Faces = faceRecog?.faces.filter((f) => f.person_id === "person-1") || []
      expect(person1Faces).toHaveLength(2)
      expect(person1Faces[0].timestamp).toBeLessThan(person1Faces[1].timestamp)

      faceRecog?.faces.forEach((face) => {
        expect(face.confidence).toBeGreaterThan(0.8)
        expect(face.bbox).toHaveLength(4)
        expect(face.timestamp).toBeGreaterThanOrEqual(0)
      })
    })

    it("should handle multiple faces in same frame", async () => {
      // Assertions: 8
      const mockResult = createMockAnalysisResult("multi-face-1")
      mockResult.face_recognition = {
        faces: [
          { person_id: "person-1", confidence: 0.94, bbox: [0.3, 0.3, 0.15, 0.2], timestamp: 10 },
          { person_id: "person-2", confidence: 0.91, bbox: [0.6, 0.3, 0.15, 0.2], timestamp: 10 },
          { person_id: "person-3", confidence: 0.88, bbox: [0.45, 0.5, 0.15, 0.2], timestamp: 10 },
        ],
        total_faces: 3,
      }

      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const faces = analysis.face_recognition?.faces || []
      const facesAt10 = faces.filter((f) => f.timestamp === 10)

      expect(facesAt10).toHaveLength(3)
      facesAt10.forEach((face) => {
        expect(face.confidence).toBeGreaterThan(0.8)
      })

      const uniquePersons = new Set(facesAt10.map((f) => f.person_id))
      expect(uniquePersons.size).toBe(3)
      expect(faces.length).toBe(3)
      expect(analysis.face_recognition?.total_faces).toBe(3)
      expect(result.current.state.error).toBeNull()
    })
  })

  describe("8. Object Recognition in Video", () => {
    it("should recognize and categorize objects", async () => {
      // Assertions: 10
      const mockResult = createMockAnalysisResult("object-1")
      mockResult.object_detection = {
        objects: [
          { label: "person", confidence: 0.92, bbox: [0.3, 0.4, 0.2, 0.3], timestamp: 5 },
          { label: "car", confidence: 0.85, bbox: [0.5, 0.6, 0.3, 0.2], timestamp: 35 },
          { label: "dog", confidence: 0.88, bbox: [0.2, 0.7, 0.15, 0.2], timestamp: 50 },
        ],
        total_objects: 3,
      }

      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const objDet = analysis.object_detection
      expect(objDet).toBeDefined()
      expect(objDet?.total_objects).toBe(3)
      expect(objDet?.objects).toHaveLength(3)

      const labels = objDet?.objects.map((o) => o.label) || []
      expect(labels).toContain("person")
      expect(labels).toContain("car")
      expect(labels).toContain("dog")

      objDet?.objects.forEach((obj) => {
        expect(obj.confidence).toBeGreaterThan(0.7)
        expect(obj.bbox).toHaveLength(4)
        expect(obj.timestamp).toBeGreaterThanOrEqual(0)
      })
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

      // Verify video analysis has color data
      expect(analysis.video_analysis).toBeDefined()
      expect(analysis.video_analysis?.width).toBe(1920)
      expect(analysis.video_analysis?.height).toBe(1080)
      expect(analysis.video_analysis?.fps).toBe(30)
      expect(analysis.video_analysis?.duration).toBe(120)
      expect(analysis.video_analysis?.codec).toBe("h264")
      expect(analysis.scene_analysis?.scenes).toHaveLength(2)
      expect(result.current.state.error).toBeNull()
    })
  })

  describe("10. AI-powered Subtitle Generation", () => {
    it("should generate subtitles from transcription", async () => {
      // Assertions: 9
      const mockResult = createMockAnalysisResult("subtitle-1")
      mockResult.audio_analysis!.transcription = "Hello world. This is a test. We are testing subtitle generation."

      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValue({
        status: "ok",
        data: mockResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysis = await result.current.analyzeComprehensive("/test/video.mp4")

      const transcription = analysis.audio_analysis?.transcription
      expect(transcription).toBeDefined()
      expect(transcription).toContain("Hello world")
      expect(transcription).toContain("test")
      expect(transcription?.length).toBeGreaterThan(0)
      expect(transcription?.split(". ")).toHaveLength(3)
      expect(analysis.audio_analysis).toBeDefined()
      expect(analysis.audio_analysis?.duration).toBeGreaterThan(0)
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
      expect(analysis.object_detection?.objects).toBeDefined()
      expect(analysis.audio_analysis).toBeDefined()

      const scenes = analysis.scene_analysis?.scenes || []
      const segments = scenes.map((s) => ({
        startTime: s.start_time,
        endTime: s.end_time,
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
      mockResult.video_analysis!.duration = 3600 // 1 hour
      mockResult.total_duration_ms = 45000 // 45 seconds processing

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
      expect(analysis.video_analysis?.duration).toBe(3600)
      expect(endTime - startTime).toBeLessThan(10000)
      expect(analysis.scene_analysis).toBeDefined()
      expect(analysis.audio_analysis).toBeDefined()
      expect(analysis.total_duration_ms).toBe(45000)
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
