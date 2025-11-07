/**
 * Tests for useMontageBackend hook - integration with Tauri backend commands
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMontageBackend } from "../use-montage-backend"

// Получаем доступ к глобальному mock через vi.mocked
const mockInvoke = vi.mocked(await import("@tauri-apps/api/core")).invoke

// Mock данные для тестов
const mockVideoCompositionAnalysis = {
  quality_score: 85,
  motion_level: 70,
  faces_detected: 2,
  objects_detected: [
    { class_id: 0, confidence: 0.9, bbox: [100, 100, 200, 200] },
    { class_id: 1, confidence: 0.8, bbox: [300, 300, 400, 400] },
  ],
  frame_analysis: {
    sharpness: 92,
    brightness: 75,
    contrast: 80,
    saturation: 70,
  },
}

const mockMomentScores = [
  {
    timestamp: 10,
    duration: 5,
    scores: { visual: 85, technical: 88, emotional: 75, narrative: 80, action: 90, composition: 82 },
    totalScore: 84,
    category: "action" as const,
  },
  {
    timestamp: 25,
    duration: 3,
    scores: { visual: 78, technical: 80, emotional: 85, narrative: 75, action: 60, composition: 80 },
    totalScore: 76,
    category: "highlight" as const,
  },
]

const mockMontagePlan = {
  id: "plan_1",
  name: "Test Plan",
  sequences: [],
  totalDuration: 120,
  qualityScore: 85,
  engagementScore: 88,
  coherenceScore: 82,
}

const mockQualityAnalysis = {
  quality_score: 90,
  technical_score: 88,
  visual_score: 85,
  resolution: { width: 1920, height: 1080 },
  frame_rate: 30,
  bitrate: 10000000,
  codec: "h264",
  issues: [],
}

const mockVideoAnalysis = {
  timestamp: 15.5,
  quality_metrics: {
    sharpness: 92,
    brightness: 75,
    contrast: 80,
    saturation: 70,
    noise_level: 5,
  },
  composition_score: 85,
  technical_score: 88,
}

const mockAudioAnalysis = {
  duration: 120,
  sample_rate: 48000,
  channels: 2,
  peak_amplitude: -3.2,
  rms_level: -18.5,
  silence_percentage: 5.2,
  speech_presence: 75,
  music_presence: 60,
  tempo: 120,
  key: "C major",
  emotional_tone: "energetic",
}

describe("useMontageBackend", () => {
  beforeEach(() => {
    mockInvoke.mockClear()
  })

  describe("initialization", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(() => useMontageBackend())

      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.isGenerating).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.progress).toBe(0)
    })

    it("should provide all 6 required backend commands", () => {
      const { result } = renderHook(() => useMontageBackend())

      expect(typeof result.current.analyzeVideoComposition).toBe("function")
      expect(typeof result.current.detectKeyMoments).toBe("function")
      expect(typeof result.current.generateMontagePlan).toBe("function")
      expect(typeof result.current.analyzeVideoQuality).toBe("function")
      expect(typeof result.current.analyzeFrameQuality).toBe("function")
      expect(typeof result.current.analyzeAudioContent).toBe("function")
    })

    it("should provide state management properties", () => {
      const { result } = renderHook(() => useMontageBackend())

      expect(typeof result.current.isAnalyzing).toBe("boolean")
      expect(typeof result.current.isGenerating).toBe("boolean")
      expect(typeof result.current.progress).toBe("number")
      expect(result.current.error === null || typeof result.current.error === "string").toBe(true)
    })
  })

  describe("analyzeVideoComposition", () => {
    it("should call Tauri invoke with correct parameters", async () => {
      mockInvoke.mockResolvedValueOnce(mockVideoCompositionAnalysis)
      const { result } = renderHook(() => useMontageBackend())

      await act(async () => {
        await result.current.analyzeVideoComposition("/path/to/video.mp4", "processor_1")
      })

      expect(mockInvoke).toHaveBeenCalledWith("analyze_video_composition", {
        videoPath: "/path/to/video.mp4",
        processorId: "processor_1",
        options: {},
      })
    })

    it("should call Tauri invoke with options", async () => {
      mockInvoke.mockResolvedValueOnce(mockVideoCompositionAnalysis)
      const { result } = renderHook(() => useMontageBackend())

      const options = { sample_rate: 1, quality_threshold: 0.8 }

      await act(async () => {
        await result.current.analyzeVideoComposition("/path/to/video.mp4", "processor_1", options)
      })

      expect(mockInvoke).toHaveBeenCalledWith("analyze_video_composition", {
        videoPath: "/path/to/video.mp4",
        processorId: "processor_1",
        options,
      })
    })

    it("should handle successful analysis", async () => {
      mockInvoke.mockResolvedValueOnce(mockVideoCompositionAnalysis)
      const { result } = renderHook(() => useMontageBackend())

      let analysisResult: any
      await act(async () => {
        analysisResult = await result.current.analyzeVideoComposition("/path/to/video.mp4", "processor_1")
      })

      expect(analysisResult).toEqual(mockVideoCompositionAnalysis)
      expect(result.current.error).toBe(null)
    })

    it("should handle errors correctly", async () => {
      const errorMessage = "Analysis failed"
      mockInvoke.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useMontageBackend())

      await act(async () => {
        try {
          await result.current.analyzeVideoComposition("/path/to/video.mp4", "processor_1")
        } catch (error) {
          // Ожидаем ошибку
        }
      })

      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe("detectKeyMoments", () => {
    it("should call Tauri invoke with correct parameters", async () => {
      mockInvoke.mockResolvedValueOnce(mockMomentScores)
      const { result } = renderHook(() => useMontageBackend())

      const detections = [{ class_id: 0, confidence: 0.9 }]
      const qualityScores = [85, 90, 78]

      await act(async () => {
        await result.current.detectKeyMoments(detections, qualityScores)
      })

      expect(mockInvoke).toHaveBeenCalledWith("detect_key_moments", {
        detections,
        qualityScores,
      })
    })

    it("should return moment scores", async () => {
      mockInvoke.mockResolvedValueOnce(mockMomentScores)
      const { result } = renderHook(() => useMontageBackend())

      let momentsResult: any
      await act(async () => {
        momentsResult = await result.current.detectKeyMoments([], [])
      })

      expect(momentsResult).toEqual(mockMomentScores)
    })

    it("should handle string errors", async () => {
      mockInvoke.mockRejectedValueOnce("String error for key moments")
      const { result } = renderHook(() => useMontageBackend())

      await act(async () => {
        try {
          await result.current.detectKeyMoments([], [])
        } catch (error) {
          // Ожидаем ошибку
        }
      })

      expect(result.current.error).toBe("Failed to detect key moments")
    })
  })

  describe("generateMontagePlan", () => {
    it("should call Tauri invoke with correct parameters", async () => {
      mockInvoke.mockResolvedValueOnce(mockMontagePlan)
      const { result } = renderHook(() => useMontageBackend())

      const config = {
        style: { name: "dynamic-action" },
        target_duration: 60,
        max_clips: 20,
        quality_threshold: 0.7,
        use_audio_sync: true,
        genetic_algorithm: {
          population_size: 50,
          generations: 100,
          mutation_rate: 0.1,
          crossover_rate: 0.8,
        },
      }
      const sourceFiles = ["/video1.mp4", "/video2.mp4"]

      await act(async () => {
        await result.current.generateMontagePlan(mockMomentScores as any, config, sourceFiles)
      })

      expect(mockInvoke).toHaveBeenCalledWith("generate_montage_plan", {
        moments: mockMomentScores,
        config,
        sourceFiles,
      })
    })

    it("should return montage plan", async () => {
      mockInvoke.mockResolvedValueOnce(mockMontagePlan)
      const { result } = renderHook(() => useMontageBackend())

      let planResult: any
      await act(async () => {
        planResult = await result.current.generateMontagePlan([], { style: { name: "test" } } as any, [])
      })

      expect(planResult).toEqual(mockMontagePlan)
    })

    it("should handle string errors", async () => {
      mockInvoke.mockRejectedValueOnce("String error for montage plan")
      const { result } = renderHook(() => useMontageBackend())

      await act(async () => {
        try {
          await result.current.generateMontagePlan([], { style: { name: "test" } } as any, [])
        } catch (error) {
          // Ожидаем ошибку
        }
      })

      expect(result.current.error).toBe("Failed to generate montage plan")
    })
  })

  describe("analyzeVideoQuality", () => {
    it("should call Tauri invoke and return quality analysis", async () => {
      mockInvoke.mockResolvedValueOnce(mockQualityAnalysis)
      const { result } = renderHook(() => useMontageBackend())

      let qualityResult: any
      await act(async () => {
        qualityResult = await result.current.analyzeVideoQuality("/path/to/video.mp4")
      })

      expect(mockInvoke).toHaveBeenCalledWith("analyze_video_quality", {
        videoPath: "/path/to/video.mp4",
      })
      expect(qualityResult).toEqual(mockQualityAnalysis)
    })
  })

  describe("analyzeFrameQuality", () => {
    it("should call Tauri invoke with timestamp", async () => {
      mockInvoke.mockResolvedValueOnce(mockVideoAnalysis)
      const { result } = renderHook(() => useMontageBackend())

      await act(async () => {
        await result.current.analyzeFrameQuality("/path/to/video.mp4", 15.5)
      })

      expect(mockInvoke).toHaveBeenCalledWith("analyze_frame_quality", {
        videoPath: "/path/to/video.mp4",
        timestamp: 15.5,
      })
    })

    it("should handle string errors", async () => {
      mockInvoke.mockRejectedValueOnce("String error for frame analysis")
      const { result } = renderHook(() => useMontageBackend())

      await act(async () => {
        try {
          await result.current.analyzeFrameQuality("/path/to/video.mp4", 15.5)
        } catch (error) {
          // Ожидаем ошибку
        }
      })

      expect(result.current.error).toBe("Failed to analyze frame quality")
    })
  })

  describe("analyzeAudioContent", () => {
    it("should call Tauri invoke and return audio analysis", async () => {
      mockInvoke.mockResolvedValueOnce(mockAudioAnalysis)
      const { result } = renderHook(() => useMontageBackend())

      let audioResult: any
      await act(async () => {
        audioResult = await result.current.analyzeAudioContent("/path/to/audio.mp3")
      })

      expect(mockInvoke).toHaveBeenCalledWith("analyze_audio_content", {
        audioPath: "/path/to/audio.mp3",
      })
      expect(audioResult).toEqual(mockAudioAnalysis)
    })

    it("should handle string errors", async () => {
      mockInvoke.mockRejectedValueOnce("String error for audio analysis")
      const { result } = renderHook(() => useMontageBackend())

      await act(async () => {
        try {
          await result.current.analyzeAudioContent("/path/to/audio.mp3")
        } catch (error) {
          // Ожидаем ошибку
        }
      })

      expect(result.current.error).toBe("Failed to analyze audio content")
    })
  })

  describe("error handling", () => {
    it("should handle Error objects correctly", async () => {
      const errorMessage = "Custom error message"
      mockInvoke.mockRejectedValueOnce(new Error(errorMessage))
      const { result } = renderHook(() => useMontageBackend())

      await act(async () => {
        try {
          await result.current.analyzeVideoQuality("/path/to/video.mp4")
        } catch (error) {
          // Ожидаем ошибку
        }
      })

      expect(result.current.error).toBe(errorMessage)
    })

    it("should handle string errors", async () => {
      mockInvoke.mockRejectedValueOnce("String error")
      const { result } = renderHook(() => useMontageBackend())

      await act(async () => {
        try {
          await result.current.analyzeVideoQuality("/path/to/video.mp4")
        } catch (error) {
          // Ожидаем ошибку
        }
      })

      expect(result.current.error).toBe("Failed to analyze video quality")
    })

    it("should reset error state on new operations", async () => {
      // Первая операция с ошибкой
      mockInvoke.mockRejectedValueOnce(new Error("First error"))
      const { result } = renderHook(() => useMontageBackend())

      await act(async () => {
        try {
          await result.current.analyzeVideoQuality("/path/to/video.mp4")
        } catch (error) {
          // Ожидаем ошибку
        }
      })

      expect(result.current.error).toBe("First error")

      // Вторая операция успешная
      mockInvoke.mockResolvedValueOnce(mockQualityAnalysis)

      await act(async () => {
        await result.current.analyzeVideoQuality("/path/to/video2.mp4")
      })

      expect(result.current.error).toBe(null)
    })
  })

  describe("function stability", () => {
    it("should maintain stable function references", () => {
      const { result, rerender } = renderHook(() => useMontageBackend())

      const initialFunctions = {
        analyzeVideoComposition: result.current.analyzeVideoComposition,
        detectKeyMoments: result.current.detectKeyMoments,
        generateMontagePlan: result.current.generateMontagePlan,
        analyzeVideoQuality: result.current.analyzeVideoQuality,
        analyzeFrameQuality: result.current.analyzeFrameQuality,
        analyzeAudioContent: result.current.analyzeAudioContent,
      }

      rerender()

      expect(result.current.analyzeVideoComposition).toBe(initialFunctions.analyzeVideoComposition)
      expect(result.current.detectKeyMoments).toBe(initialFunctions.detectKeyMoments)
      expect(result.current.generateMontagePlan).toBe(initialFunctions.generateMontagePlan)
      expect(result.current.analyzeVideoQuality).toBe(initialFunctions.analyzeVideoQuality)
      expect(result.current.analyzeFrameQuality).toBe(initialFunctions.analyzeFrameQuality)
      expect(result.current.analyzeAudioContent).toBe(initialFunctions.analyzeAudioContent)
    })
  })
})
