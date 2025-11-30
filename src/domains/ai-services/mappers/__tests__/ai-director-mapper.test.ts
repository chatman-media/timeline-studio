/**
 * Tests for AI Director Mapper
 *
 * Тесты для преобразования результатов AI Director в унифицированный формат
 */

import { describe, expect, it } from "vitest"
import type { MontageAnalysisResult } from "@/types/montage-planner-rust"
import type { ComprehensiveAnalysisResult } from "../../services/ai-director"
import {
  isComprehensiveAnalysisResult,
  isMontageAnalysisResult,
  mapComprehensiveAnalysisToUnified,
  mapMontageAnalysisToUnified,
} from "../ai-director-mapper"

describe("AI Director Mapper", () => {
  describe("mapComprehensiveAnalysisToUnified", () => {
    it("должен корректно маппить базовые поля", () => {
      const input: ComprehensiveAnalysisResult = {
        analysis_id: "test-123",
        status: "Completed",
        started_at: "2024-01-01T00:00:00Z",
        completed_at: "2024-01-01T00:00:05Z",
        total_duration_ms: 5000,
        errors: [],
        video_analysis: {
          duration: 60,
          fps: 30,
          width: 1920,
          height: 1080,
          codec: "h264",
          bitrate: 5000000,
        },
      }

      const result = mapComprehensiveAnalysisToUnified(input)

      expect(result.analysisId).toBe("test-123")
      expect(result.status).toBe("completed")
      expect(result.createdAt).toBe("2024-01-01T00:00:00Z")
      expect(result.processingTimeMs).toBe(5000)
    })

    it("должен корректно маппить видео информацию", () => {
      const input: ComprehensiveAnalysisResult = {
        analysis_id: "test-123",
        status: "Completed",
        started_at: "2024-01-01T00:00:00Z",
        video_analysis: {
          duration: 120,
          fps: 60,
          width: 3840,
          height: 2160,
          codec: "h265",
        } as any,
      } as any

      const result = mapComprehensiveAnalysisToUnified(input)

      expect(result.videoInfo.duration).toBe(120)
      expect(result.videoInfo.fps).toBe(60)
      expect(result.videoInfo.resolution.width).toBe(3840)
      expect(result.videoInfo.resolution.height).toBe(2160)
      expect(result.videoInfo.codec).toBe("h265")
    })

    it("должен корректно маппить статусы", () => {
      const statuses: Array<[string, string]> = [
        ["Pending", "pending"],
        ["InProgress", "in_progress"],
        ["Completed", "completed"],
        ["Failed", "failed"],
        ["PartiallyCompleted", "partially_completed"],
      ]

      for (const [input, expected] of statuses) {
        const result = mapComprehensiveAnalysisToUnified({
          analysis_id: "test",
          status: input,
          started_at: "2024-01-01T00:00:00Z",
        } as any)

        expect(result.status).toBe(expected)
      }
    })

    it("должен обрабатывать неизвестный статус как completed", () => {
      const result = mapComprehensiveAnalysisToUnified({
        analysis_id: "test",
        status: "UnknownStatus",
        started_at: "2024-01-01T00:00:00Z",
      } as any)

      expect(result.status).toBe("completed")
    })

    it("должен корректно маппить аудио анализ", () => {
      const input: ComprehensiveAnalysisResult = {
        analysis_id: "test-123",
        status: "Completed",
        started_at: "2024-01-01T00:00:00Z",
        audio_analysis: {
          duration: 60,
          transcription: "Hello world",
          loudness: -14,
          silence_percentage: 10,
        } as any,
      } as any

      const result = mapComprehensiveAnalysisToUnified(input)

      expect(result.audioAnalysis).toBeDefined()
      expect(result.audioAnalysis?.hasAudio).toBe(true)
      expect(result.audioAnalysis?.duration).toBe(60)
      expect(result.audioAnalysis?.transcription?.fullText).toBe("Hello world")
    })

    it("должен обрабатывать отсутствие аудио анализа", () => {
      const input: ComprehensiveAnalysisResult = {
        analysis_id: "test-123",
        status: "Completed",
        started_at: "2024-01-01T00:00:00Z",
        audio_analysis: undefined,
      } as any

      const result = mapComprehensiveAnalysisToUnified(input)

      expect(result.audioAnalysis).toBeUndefined()
    })

    it("должен корректно маппить сцены", () => {
      const input: ComprehensiveAnalysisResult = {
        analysis_id: "test-123",
        status: "Completed",
        started_at: "2024-01-01T00:00:00Z",
        scene_analysis: {
          scenes: [
            {
              start_time: 0,
              end_time: 10,
              confidence: 0.95,
              description: "Test scene",
            },
            {
              start_time: 10,
              end_time: 20,
              confidence: 0.85,
              description: "Another scene",
            },
          ],
        } as any,
      } as any

      const result = mapComprehensiveAnalysisToUnified(input)

      expect(result.visualAnalysis?.scenes).toHaveLength(2)
      expect(result.visualAnalysis?.scenes[0].startTime).toBe(0)
      expect(result.visualAnalysis?.scenes[0].endTime).toBe(10)
      expect(result.visualAnalysis?.scenes[0].confidence).toBe(0.95)
      expect(result.visualAnalysis?.scenes[0].description).toBe("Test scene")
    })

    it("должен рассчитывать метрики качества", () => {
      const input: ComprehensiveAnalysisResult = {
        analysis_id: "test-123",
        status: "Completed",
        started_at: "2024-01-01T00:00:00Z",
        video_analysis: {
          duration: 60,
          fps: 30,
          width: 1920,
          height: 1080,
          codec: "h264",
        } as any,
        audio_analysis: {
          duration: 60,
        } as any,
      } as any

      const result = mapComprehensiveAnalysisToUnified(input)

      expect(result.qualityMetrics).toBeDefined()
      expect(result.qualityMetrics.overall).toBeGreaterThan(0)
      expect(result.qualityMetrics.video).toBeGreaterThan(0)
      expect(result.qualityMetrics.audio).toBeGreaterThan(0)
      expect(result.qualityMetrics.technical).toBeGreaterThan(0)
    })

    it("должен создавать пустые массивы для отсутствующих данных", () => {
      const input: ComprehensiveAnalysisResult = {
        analysis_id: "test-123",
        status: "Completed",
        started_at: "2024-01-01T00:00:00Z",
      } as any

      const result = mapComprehensiveAnalysisToUnified(input)

      expect(result.editingRecommendations).toEqual([])
      expect(result.keyMoments).toEqual([])
    })
  })

  describe("mapMontageAnalysisToUnified", () => {
    it("должен корректно маппить базовые поля", () => {
      const input: MontageAnalysisResult = {
        analysis_id: "montage-123",
        video_id: "/test/video.mp4",
        duration: 120,
        quality_score: 85,
        motion_score: 75,
        audio_quality: 90,
        key_moments: [],
        faces_detected: 0,
        objects_detected: [],
      }

      const result = mapMontageAnalysisToUnified(input)

      expect(result.analysisId).toBe("montage-123")
      expect(result.videoPath).toBe("/test/video.mp4")
      expect(result.status).toBe("completed")
      expect(result.videoInfo?.duration).toBe(120)
    })

    it("должен корректно маппить key moments", () => {
      const input: MontageAnalysisResult = {
        analysis_id: "montage-123",
        video_id: "/test/video.mp4",
        duration: 120,
        quality_score: 85,
        motion_score: 75,
        audio_quality: 90,
        faces_detected: 0,
        objects_detected: [],
        key_moments: [
          {
            timestamp: 5,
            duration: 2,
            category: "action",
            total_score: 95,
            description: "Exciting moment",
            tags: ["fast", "dynamic"],
          },
          {
            timestamp: 15,
            duration: 3,
            category: "dialogue",
            total_score: 80,
            description: "Important conversation",
            tags: ["speech", "calm"],
          },
        ] as any,
      }

      const result = mapMontageAnalysisToUnified(input)

      expect(result.keyMoments).toHaveLength(2)
      expect(result.keyMoments?.[0].timestamp).toBe(5)
      expect(result.keyMoments?.[0].category).toBe("action")
      expect(result.keyMoments?.[0].score).toBe(95)
      expect(result.keyMoments?.[0].tags).toEqual(["fast", "dynamic"])
    })

    it("должен рассчитывать метрики качества", () => {
      const input: MontageAnalysisResult = {
        analysis_id: "montage-123",
        video_id: "/test/video.mp4",
        duration: 120,
        quality_score: 85,
        motion_score: 75,
        audio_quality: 90,
        faces_detected: 0,
        objects_detected: [],
        key_moments: [],
      }

      const result = mapMontageAnalysisToUnified(input)

      expect(result.qualityMetrics).toBeDefined()
      expect(result.qualityMetrics?.overall).toBe(85)
      expect(result.qualityMetrics?.video).toBe(75)
      expect(result.qualityMetrics?.audio).toBe(90)
      expect(result.qualityMetrics?.technical).toBe((85 + 75) / 2)
    })

    it("должен создавать пустой массив для отсутствующих key moments", () => {
      const input: MontageAnalysisResult = {
        analysis_id: "montage-123",
        video_id: "/test/video.mp4",
        duration: 120,
        quality_score: 85,
        motion_score: 75,
        audio_quality: 90,
        faces_detected: 0,
        objects_detected: [],
        key_moments: [],
      }

      const result = mapMontageAnalysisToUnified(input)

      expect(result.keyMoments).toEqual([])
    })
  })

  describe("Type Guards", () => {
    describe("isComprehensiveAnalysisResult", () => {
      it("должен вернуть true для валидного ComprehensiveAnalysisResult", () => {
        const valid = {
          analysis_id: "test-123",
          status: "Completed",
          video_path: "/test/video.mp4",
        }

        expect(isComprehensiveAnalysisResult(valid)).toBe(true)
      })

      it("должен вернуть false для невалидного объекта", () => {
        expect(isComprehensiveAnalysisResult(null)).toBe(false)
        expect(isComprehensiveAnalysisResult(undefined)).toBe(false)
        expect(isComprehensiveAnalysisResult({})).toBe(false)
        expect(isComprehensiveAnalysisResult({ analysis_id: "test" })).toBe(false)
        expect(isComprehensiveAnalysisResult({ status: "Completed" })).toBe(false)
        expect(isComprehensiveAnalysisResult("string")).toBe(false)
        expect(isComprehensiveAnalysisResult(123)).toBe(false)
      })
    })

    describe("isMontageAnalysisResult", () => {
      it("должен вернуть true для валидного MontageAnalysisResult", () => {
        const valid = {
          video_id: "/test/video.mp4",
          key_moments: [],
          analysis_id: "montage-123",
        }

        expect(isMontageAnalysisResult(valid)).toBe(true)
      })

      it("должен вернуть false для невалидного объекта", () => {
        expect(isMontageAnalysisResult(null)).toBe(false)
        expect(isMontageAnalysisResult(undefined)).toBe(false)
        expect(isMontageAnalysisResult({})).toBe(false)
        expect(isMontageAnalysisResult({ video_id: "/test" })).toBe(false)
        expect(isMontageAnalysisResult({ key_moments: [] })).toBe(false)
        expect(isMontageAnalysisResult({ analysis_id: "test" })).toBe(false)
        expect(isMontageAnalysisResult("string")).toBe(false)
        expect(isMontageAnalysisResult(123)).toBe(false)
      })
    })
  })

  describe("Edge Cases", () => {
    it("должен обрабатывать минимальные ComprehensiveAnalysisResult", () => {
      const minimal: ComprehensiveAnalysisResult = {
        analysis_id: "test",
        status: "Completed",
        started_at: "2024-01-01T00:00:00Z",
      } as any

      const result = mapComprehensiveAnalysisToUnified(minimal)

      expect(result.analysisId).toBe("test")
      expect(result.status).toBe("completed")
      expect(result.qualityMetrics).toBeDefined()
    })

    it("должен обрабатывать отсутствие всех опциональных полей в MontageAnalysisResult", () => {
      const minimal: MontageAnalysisResult = {
        analysis_id: "montage",
        video_id: "/test/video.mp4",
        duration: 60,
        quality_score: 50,
        motion_score: 50,
        audio_quality: 50,
        faces_detected: 0,
        objects_detected: [],
        key_moments: [],
      }

      const result = mapMontageAnalysisToUnified(minimal)

      expect(result.analysisId).toBe("montage")
      expect(result.keyMoments).toEqual([])
      expect(result.qualityMetrics).toBeDefined()
    })

    it("должен обрабатывать нулевые значения для video_analysis", () => {
      const input: ComprehensiveAnalysisResult = {
        analysis_id: "test",
        status: "Completed",
        started_at: "2024-01-01T00:00:00Z",
        video_analysis: {
          duration: 0,
          fps: 0,
          width: 0,
          height: 0,
          codec: "",
        } as any,
      } as any

      const result = mapComprehensiveAnalysisToUnified(input)

      expect(result.videoInfo.duration).toBe(0)
      expect(result.videoInfo.fps).toBe(0)
      expect(result.videoInfo.resolution.width).toBe(0)
      expect(result.videoInfo.resolution.height).toBe(0)
    })
  })
})
