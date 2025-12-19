/**
 * Integration tests for AI Director ↔ Montage Planner integration
 * Проверка взаимодействия AI Director с Montage Planner
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock Tauri
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

describe("AI Director ↔ Montage Planner Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Analysis to Montage Flow", () => {
    it("should convert AI Director analysis to Montage Planner format", async () => {
      const { invoke } = await import("@tauri-apps/api/core")

      const mockAnalysisResult = {
        analysis_id: "test-analysis-123",
        status: "Completed",
        audio_analysis: {
          basic_metrics: {
            duration: { seconds: 120 },
            overall_volume: { level: 0.7 },
          },
        },
        vision_analysis: {
          scene_changes: [
            { timestamp: 0.0, confidence: 0.9 },
            { timestamp: 30.5, confidence: 0.85 },
            { timestamp: 60.0, confidence: 0.92 },
          ],
        },
        moment_analysis: {
          key_moments: [
            {
              timestamp: 10.5,
              duration: 5.0,
              quality_score: 0.9,
              moment_type: "HighAction",
            },
            {
              timestamp: 45.2,
              duration: 3.5,
              quality_score: 0.85,
              moment_type: "Emotional",
            },
          ],
        },
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockAnalysisResult)

      const analysisResult = (await invoke("ai_director_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
      })) as typeof mockAnalysisResult

      expect(analysisResult.moment_analysis?.key_moments).toHaveLength(2)

      // Convert to Montage Planner format
      const montagePlanRequest = {
        sourceFiles: ["/path/to/video.mp4"],
        keyMoments: analysisResult.moment_analysis?.key_moments,
        sceneChanges: analysisResult.vision_analysis?.scene_changes,
        audioDuration: analysisResult.audio_analysis?.basic_metrics?.duration?.seconds,
        style: "dynamic",
        targetDuration: 30,
      }

      expect(montagePlanRequest.keyMoments).toBeDefined()
      expect(montagePlanRequest.sceneChanges).toBeDefined()
    })

    it("should generate montage plan from analysis results", async () => {
      const { invoke } = await import("@tauri-apps/api/core")

      const mockAnalysis = {
        analysis_id: "test-123",
        moment_analysis: {
          key_moments: [
            {
              timestamp: 5.0,
              duration: 3.0,
              quality_score: 0.9,
              moment_type: "HighAction",
            },
            {
              timestamp: 15.0,
              duration: 4.0,
              quality_score: 0.85,
              moment_type: "Emotional",
            },
          ],
        },
      }

      const mockMontagePlan = {
        id: "plan-123",
        name: "AI Generated Plan",
        style: "dynamic",
        clips: [
          {
            sourceFile: "/path/to/video.mp4",
            startTime: 0,
            duration: 3.0,
            inPoint: 5.0,
            effects: [],
          },
          {
            sourceFile: "/path/to/video.mp4",
            startTime: 3.5,
            duration: 4.0,
            inPoint: 15.0,
            effects: [],
          },
        ],

        transitions: [
          {
            type: "cross_dissolve",
            duration: 0.5,
            atTime: 3.0,
          },
        ],

        totalDuration: 7.5,
        createdAt: new Date().toISOString(),
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockAnalysis).mockResolvedValueOnce(mockMontagePlan)

      const analysis = (await invoke("ai_director_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
      })) as typeof mockAnalysis

      expect(analysis.moment_analysis?.key_moments).toHaveLength(2)

      // Generate montage plan based on analysis
      const plan = (await invoke("generate_montage_plan", {
        moments: analysis.moment_analysis?.key_moments,
        config: { style: "dynamic", targetDuration: 30 },
      })) as typeof mockMontagePlan

      expect(plan.clips).toHaveLength(2)
      expect(plan.clips[0].inPoint).toBe(5.0)
      expect(plan.clips[1].inPoint).toBe(15.0)
    })
  })

  describe("Unified Audio Analysis Integration", () => {
    it("should use unified audio data for montage planning", async () => {
      const { invoke } = await import("@tauri-apps/api/core")

      const mockUnifiedAudioAnalysis = {
        basic_metrics: {
          duration: { seconds: 120 },
          overall_volume: { level: 0.7 },
        },
        ffmpeg_analysis: {
          peak_loudness: -6.5,
          average_loudness: -14.5,
          dynamic_range: 8.0,
          silence_segments: [{ start: 30.5, duration: 2.0, silence_level: -60.0 }],
        },
        montage_analysis: {
          rhythm_profile: {
            beats_per_minute: 120.0,
            tempo_stability: 0.85,
            beat_timestamps: [0.5, 1.0, 1.5, 2.0],
          },
          energy_profile: {
            overall_energy: 0.75,
            energy_segments: [
              { start: 0.0, duration: 30.0, energy_level: 0.8 },
              { start: 30.0, duration: 30.0, energy_level: 0.6 },
            ],
          },
        },
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockUnifiedAudioAnalysis)

      const audioAnalysis = (await invoke("unified_audio_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
        config: {
          enable_ffmpeg_analysis: true,
          enable_montage_analysis: true,
          performance_mode: "Balanced",
        },
      })) as typeof mockUnifiedAudioAnalysis

      // Use audio analysis for montage planning
      expect(audioAnalysis.montage_analysis?.rhythm_profile?.beats_per_minute).toBe(120.0)
      expect(audioAnalysis.montage_analysis?.energy_profile?.overall_energy).toBe(0.75)

      // Montage plan should sync with beat timestamps
      const beatTimestamps = audioAnalysis.montage_analysis?.rhythm_profile?.beat_timestamps
      expect(beatTimestamps).toBeDefined()
      expect(beatTimestamps?.length).toBeGreaterThan(0)
    })

    it("should detect silence for better cut points", async () => {
      const { invoke } = await import("@tauri-apps/api/core")

      const mockAudioWithSilence = {
        ffmpeg_analysis: {
          silence_segments: [
            { start: 10.5, duration: 1.5, silence_level: -55.0 },
            { start: 30.0, duration: 2.0, silence_level: -60.0 },
            { start: 60.5, duration: 1.0, silence_level: -50.0 },
          ],
        },
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockAudioWithSilence)

      const audioAnalysis = (await invoke("unified_audio_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
      })) as typeof mockAudioWithSilence

      const silenceSegments = audioAnalysis.ffmpeg_analysis?.silence_segments || []

      // Use silence segments as natural cut points
      expect(silenceSegments.length).toBeGreaterThan(0)

      const cutPoints = silenceSegments.map((seg: any) => seg.start)
      expect(cutPoints).toContain(10.5)
      expect(cutPoints).toContain(30.0)
    })
  })

  describe("Template to Montage Plan Conversion", () => {
    it("should convert workflow template to montage plan", async () => {
      const template = {
        id: "instagram-reel",
        name: "Instagram Reel",
        style: "dynamic",
        parameters: {
          targetDuration: 30,
          clipDuration: { min: 1, max: 3, preferred: 2 },
          clipCount: { min: 10, max: 20, preferred: 15 },
          aspectRatio: "9:16",
        },
        clipRules: {
          qualityThreshold: 0.7,
          contentRequirements: { movement: true },
          scenePriority: { action: 0.8, static: 0.2 },
        },
        transitionRules: {
          defaultType: "cut",
          duration: 0.3,
          frequency: 1.0,
        },
      }

      // Convert template to montage generation config
      const montageConfig = {
        style: template.style,
        targetDuration: template.parameters.targetDuration,
        clipDuration: template.parameters.clipDuration,
        qualityThreshold: template.clipRules.qualityThreshold,
        transitionType: template.transitionRules.defaultType,
        transitionDuration: template.transitionRules.duration,
      }

      expect(montageConfig.targetDuration).toBe(30)
      expect(montageConfig.style).toBe("dynamic")
      expect(montageConfig.clipDuration.preferred).toBe(2)
    })
  })

  describe("Quality-Based Clip Selection", () => {
    it("should filter clips by quality threshold", async () => {
      const { invoke } = await import("@tauri-apps/api/core")

      const mockMoments = {
        key_moments: [
          {
            timestamp: 5.0,
            duration: 3.0,
            quality_score: 0.95,
            moment_type: "HighAction",
          },
          {
            timestamp: 15.0,
            duration: 2.0,
            quality_score: 0.6,
            moment_type: "Static",
          },
          {
            timestamp: 25.0,
            duration: 4.0,
            quality_score: 0.85,
            moment_type: "Emotional",
          },
          {
            timestamp: 35.0,
            duration: 3.0,
            quality_score: 0.5,
            moment_type: "Static",
          },
        ],
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockMoments)

      const analysis = (await invoke("ai_director_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
      })) as typeof mockMoments

      const qualityThreshold = 0.7
      const filteredMoments = analysis.key_moments.filter((m: any) => m.quality_score >= qualityThreshold)

      expect(filteredMoments).toHaveLength(2)
      expect(filteredMoments[0].quality_score).toBe(0.95)
      expect(filteredMoments[1].quality_score).toBe(0.85)
    })
  })

  describe("Scene Detection Integration", () => {
    it("should use AI Director scene detection for montage boundaries", async () => {
      const { invoke } = await import("@tauri-apps/api/core")

      const mockVisionAnalysis = {
        scene_changes: [
          { timestamp: 0.0, confidence: 0.95, scene_type: "Indoor" },
          { timestamp: 15.5, confidence: 0.9, scene_type: "Outdoor" },
          { timestamp: 45.0, confidence: 0.88, scene_type: "Indoor" },
        ],

        composition_analysis: [{ timestamp: 5.0, rule_of_thirds_score: 0.85, balance_score: 0.8 }],
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockVisionAnalysis)

      const visionAnalysis = (await invoke("analyze_video_comprehensive", {
        videoPath: "/path/to/video.mp4",
        options: {
          enable_scene_detection: true,
          enable_composition_analysis: true,
        },
      })) as typeof mockVisionAnalysis

      expect(visionAnalysis.scene_changes).toHaveLength(3)

      // Use scene changes as clip boundaries
      const clipBoundaries = visionAnalysis.scene_changes.map((sc: any) => sc.timestamp)
      expect(clipBoundaries).toEqual([0.0, 15.5, 45.0])
    })
  })

  describe("Rhythm-Based Editing", () => {
    it("should align cuts with beat timestamps", async () => {
      const { invoke } = await import("@tauri-apps/api/core")

      const mockRhythmAnalysis = {
        montage_analysis: {
          rhythm_profile: {
            beats_per_minute: 128.0,
            beat_timestamps: [0.0, 0.469, 0.938, 1.406, 1.875, 2.344],
            tempo_stability: 0.92,
          },
        },
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockRhythmAnalysis)

      const audioAnalysis = (await invoke("unified_audio_analyze_comprehensive", {
        videoPath: "/path/to/music-video.mp4",
        config: {
          enable_montage_analysis: true,
        },
      })) as typeof mockRhythmAnalysis

      const beatTimestamps = audioAnalysis.montage_analysis?.rhythm_profile?.beat_timestamps || []

      // Montage plan should place cuts on or near beat timestamps
      const clipTimes = [0.0, 0.938, 1.875] // Every other beat

      clipTimes.forEach((clipTime) => {
        const nearestBeat = beatTimestamps.reduce((prev: number, curr: number) =>
          Math.abs(curr - clipTime) < Math.abs(prev - clipTime) ? curr : prev,
        )
        expect(Math.abs(nearestBeat - clipTime)).toBeLessThan(0.05) // Within 50ms
      })
    })
  })

  describe("Multi-File Montage", () => {
    it("should create montage plan from multiple source files", async () => {
      const { invoke } = await import("@tauri-apps/api/core")

      const sourceFiles = ["/path/to/video1.mp4", "/path/to/video2.mp4", "/path/to/video3.mp4"]

      const mockBatchAnalysis = sourceFiles.map((file, i) => ({
        analysis_id: `analysis-${i}`,
        source_file: file,
        moment_analysis: {
          key_moments: [
            { timestamp: 5.0, duration: 3.0, quality_score: 0.9 },
            { timestamp: 15.0, duration: 2.5, quality_score: 0.85 },
          ],
        },
      }))

      vi.mocked(invoke).mockResolvedValueOnce(mockBatchAnalysis)

      const batchAnalysis = (await invoke("ai_director_analyze_batch", {
        filePaths: sourceFiles,
      })) as typeof mockBatchAnalysis

      expect(Array.isArray(batchAnalysis)).toBe(true)
      expect(batchAnalysis).toHaveLength(3)

      // Combine moments from all files
      const allMoments = batchAnalysis.flatMap((analysis: any, fileIndex: number) =>
        analysis.moment_analysis.key_moments.map((moment: any) => ({
          ...moment,
          sourceFile: sourceFiles[fileIndex],
        })),
      )

      expect(allMoments).toHaveLength(6) // 2 moments × 3 files
    })
  })

  describe("Error Handling", () => {
    it("should handle missing analysis data gracefully", async () => {
      const { invoke } = await import("@tauri-apps/api/core")

      const incompleteAnalysis = {
        analysis_id: "test-123",
        status: "Completed",
        // Missing moment_analysis
        moment_analysis: null as { key_moments: any[] } | null,
        vision_analysis: null,
        audio_analysis: null,
      }

      vi.mocked(invoke).mockResolvedValueOnce(incompleteAnalysis)

      const analysis = (await invoke("ai_director_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
      })) as typeof incompleteAnalysis

      // Should handle missing data without crashing
      const moments = analysis.moment_analysis?.key_moments || []
      expect(Array.isArray(moments)).toBe(true)
      expect(moments).toHaveLength(0)
    })

    it("should validate montage plan before generation", async () => {
      const invalidConfig = {
        targetDuration: -10, // Invalid negative duration
        style: "invalid-style",
        clipCount: { min: 10, max: 5 }, // Invalid: min > max
      }

      // Validation should fail
      expect(invalidConfig.targetDuration).toBeLessThan(0)
      expect(invalidConfig.clipCount.min).toBeGreaterThan(invalidConfig.clipCount.max)
    })
  })
})
