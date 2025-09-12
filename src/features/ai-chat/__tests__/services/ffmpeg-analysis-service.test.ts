import { beforeEach, describe, expect, it, vi } from "vitest"
// Import global mock
import { mockInvoke } from "@/test/mocks/tauri/core"
import {
  type AudioAnalysisResult,
  FFmpegAnalysisService,
  type KeyFrameExtractionResult,
  type MotionAnalysisResult,
  type QualityAnalysisResult,
  type SceneDetectionResult,
  type SilenceDetectionResult,
  type VideoAnalysisOptions,
  type VideoMetadata,
} from "../../services/ffmpeg-analysis-service"

describe("FFmpegAnalysisService", () => {
  let service: FFmpegAnalysisService

  const mockMetadata: VideoMetadata = {
    duration: 120,
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate: 5000000,
    codec: "h264",
    format: "mp4",
    hasAudio: true,
    audioCodec: "aac",
    audioChannels: 2,
    audioSampleRate: 48000,
    fileSize: 75000000,
  }

  const mockSceneDetection: SceneDetectionResult = {
    scenes: [
      { startTime: 0, endTime: 5.5, confidence: 0.9 },
      { startTime: 5.5, endTime: 12.3, confidence: 0.85 },
      { startTime: 12.3, endTime: 20.0, confidence: 0.92 },
    ],
    totalScenes: 3,
    averageSceneLength: 6.67,
  }

  const mockQualityAnalysis: QualityAnalysisResult = {
    overall: 0.85,
    sharpness: 0.8,
    brightness: 0.7,
    contrast: 0.75,
    saturation: 0.9,
    noise: 0.2,
    stability: 0.85,
    issues: [],
  }

  const mockSilenceDetection: SilenceDetectionResult = {
    silences: [
      { startTime: 15.0, endTime: 16.5, duration: 1.5, confidence: 0.95 },
      { startTime: 45.2, endTime: 46.0, duration: 0.8, confidence: 0.9 },
    ],
    totalSilenceDuration: 2.3,
    speechPercentage: 98.08,
  }

  const mockMotionAnalysis: MotionAnalysisResult = {
    motionIntensity: 0.6,
    cameraMovement: {
      panning: 0.3,
      tilting: 0.2,
      zooming: 0.1,
      stability: 0.8,
    },
    objectMovement: 0.5,
    motionProfile: [
      { timestamp: 0, intensity: 0.4 },
      { timestamp: 5, intensity: 0.7 },
      { timestamp: 10, intensity: 0.5 },
    ],
  }

  const mockKeyFrames: KeyFrameExtractionResult = {
    keyFrames: [
      { timestamp: 2.5, imagePath: "/tmp/frame1.jpg", confidence: 0.9 },
      { timestamp: 8.0, imagePath: "/tmp/frame2.jpg", confidence: 0.85 },
      { timestamp: 15.0, imagePath: "/tmp/frame3.jpg", confidence: 0.95 },
    ],
    thumbnailPath: "/tmp/thumbnail.jpg",
  }

  const mockAudioAnalysis: AudioAnalysisResult = {
    volume: {
      average: 0.6,
      peak: 0.85,
      rms: 0.55,
    },
    frequency: {
      lowEnd: 0.7,
      midRange: 0.8,
      highEnd: 0.6,
    },
    dynamics: {
      dynamicRange: 0.7,
      compressionRatio: 2.5,
    },
    quality: {
      clipping: false,
      noiseLevel: 0.15,
      overallQuality: 0.85,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockReset()
    // Reset singleton instance
    // @ts-expect-error - accessing private property for testing
    FFmpegAnalysisService.instance = undefined
    service = FFmpegAnalysisService.getInstance()
  })

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = FFmpegAnalysisService.getInstance()
      const instance2 = FFmpegAnalysisService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("getVideoMetadata", () => {
    it("should return video metadata", async () => {
      mockInvoke.mockResolvedValue(mockMetadata)

      const result = await service.getVideoMetadata("test.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_get_metadata", {
        filePath: "test.mp4",
      })
      expect(result).toEqual(mockMetadata)
    })

    it("should handle errors", async () => {
      mockInvoke.mockRejectedValue(new Error("FFmpeg error"))

      await expect(service.getVideoMetadata("test.mp4")).rejects.toThrow(
        "Не удалось получить метаданные: Error: FFmpeg error",
      )
    })
  })

  describe("detectScenes", () => {
    it("should detect scenes with default options", async () => {
      mockInvoke.mockResolvedValue(mockSceneDetection)

      const result = await service.detectScenes("test.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_detect_scenes", {
        filePath: "test.mp4",
        threshold: 0.3,
        minSceneLength: 1.0,
      })
      expect(result).toEqual(mockSceneDetection)
    })

    it("should detect scenes with custom options", async () => {
      mockInvoke.mockResolvedValue(mockSceneDetection)

      const options: VideoAnalysisOptions["sceneDetection"] = {
        threshold: 0.5,
        minSceneLength: 2.0,
      }

      const result = await service.detectScenes("test.mp4", options)

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_detect_scenes", {
        filePath: "test.mp4",
        threshold: 0.5,
        minSceneLength: 2.0,
      })
      expect(result).toEqual(mockSceneDetection)
    })

    it("should handle errors", async () => {
      mockInvoke.mockRejectedValue(new Error("Scene detection failed"))

      await expect(service.detectScenes("test.mp4")).rejects.toThrow(
        "Не удалось определить сцены: Error: Scene detection failed",
      )
    })
  })

  describe("analyzeQuality", () => {
    it("should analyze quality with default options", async () => {
      mockInvoke.mockResolvedValue(mockQualityAnalysis)

      const result = await service.analyzeQuality("test.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_analyze_quality", {
        filePath: "test.mp4",
        sampleRate: 1.0,
        enableNoiseDetection: true,
        enableStabilityCheck: true,
      })
      expect(result).toEqual(mockQualityAnalysis)
    })

    it("should analyze quality with custom options", async () => {
      mockInvoke.mockResolvedValue(mockQualityAnalysis)

      const options: VideoAnalysisOptions["qualityAnalysis"] = {
        sampleRate: 2.0,
        enableNoiseDetection: false,
        enableStabilityCheck: false,
      }

      const result = await service.analyzeQuality("test.mp4", options)

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_analyze_quality", {
        filePath: "test.mp4",
        sampleRate: 2.0,
        enableNoiseDetection: false,
        enableStabilityCheck: false,
      })
      expect(result).toEqual(mockQualityAnalysis)
    })

    it("should handle errors", async () => {
      mockInvoke.mockRejectedValue(new Error("Quality analysis failed"))

      await expect(service.analyzeQuality("test.mp4")).rejects.toThrow(
        "Не удалось проанализировать качество: Error: Quality analysis failed",
      )
    })
  })

  describe("detectSilence", () => {
    it("should detect silence with default options", async () => {
      mockInvoke.mockResolvedValue(mockSilenceDetection)

      const result = await service.detectSilence("test.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_detect_silence", {
        filePath: "test.mp4",
        threshold: -30,
        minDuration: 1.0,
      })
      expect(result).toEqual(mockSilenceDetection)
    })

    it("should detect silence with custom options", async () => {
      mockInvoke.mockResolvedValue(mockSilenceDetection)

      const options: VideoAnalysisOptions["silenceDetection"] = {
        threshold: -40,
        minDuration: 0.5,
      }

      const result = await service.detectSilence("test.mp4", options)

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_detect_silence", {
        filePath: "test.mp4",
        threshold: -40,
        minDuration: 0.5,
      })
      expect(result).toEqual(mockSilenceDetection)
    })

    it("should handle errors", async () => {
      mockInvoke.mockRejectedValue(new Error("Silence detection failed"))

      await expect(service.detectSilence("test.mp4")).rejects.toThrow(
        "Не удалось определить тишину: Error: Silence detection failed",
      )
    })
  })

  describe("analyzeMotion", () => {
    it("should analyze motion with default options", async () => {
      mockInvoke.mockResolvedValue(mockMotionAnalysis)

      const result = await service.analyzeMotion("test.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_analyze_motion", {
        filePath: "test.mp4",
        sensitivity: 0.5,
      })
      expect(result).toEqual(mockMotionAnalysis)
    })

    it("should analyze motion with custom options", async () => {
      mockInvoke.mockResolvedValue(mockMotionAnalysis)

      const options: VideoAnalysisOptions["motionAnalysis"] = {
        sensitivity: 0.8,
      }

      const result = await service.analyzeMotion("test.mp4", options)

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_analyze_motion", {
        filePath: "test.mp4",
        sensitivity: 0.8,
      })
      expect(result).toEqual(mockMotionAnalysis)
    })

    it("should handle errors", async () => {
      mockInvoke.mockRejectedValue(new Error("Motion analysis failed"))

      await expect(service.analyzeMotion("test.mp4")).rejects.toThrow(
        "Не удалось проанализировать движение: Error: Motion analysis failed",
      )
    })
  })

  describe("extractKeyFrames", () => {
    it("should extract key frames with default options", async () => {
      mockInvoke.mockResolvedValue(mockKeyFrames)

      const result = await service.extractKeyFrames("test.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_extract_keyframes", {
        filePath: "test.mp4",
        interval: 5.0,
        maxFrames: 10,
      })
      expect(result).toEqual(mockKeyFrames)
    })

    it("should extract key frames with custom options", async () => {
      mockInvoke.mockResolvedValue(mockKeyFrames)

      const options: VideoAnalysisOptions["keyFrameExtraction"] = {
        count: 5,
        quality: "high",
        aiDescription: true,
      }

      const result = await service.extractKeyFrames("test.mp4", options)

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_extract_keyframes", {
        filePath: "test.mp4",
        interval: 5.0,
        maxFrames: 5,
      })
      expect(result).toEqual(mockKeyFrames)
    })

    it("should handle errors", async () => {
      mockInvoke.mockRejectedValue(new Error("Key frame extraction failed"))

      await expect(service.extractKeyFrames("test.mp4")).rejects.toThrow(
        "Не удалось извлечь ключевые кадры: Error: Key frame extraction failed",
      )
    })
  })

  describe("analyzeAudio", () => {
    it("should analyze audio with default options", async () => {
      mockInvoke.mockResolvedValue(mockAudioAnalysis)

      const result = await service.analyzeAudio("test.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_analyze_audio", {
        filePath: "test.mp4",
        enableSpectralAnalysis: true,
        enableDynamicsAnalysis: true,
      })
      expect(result).toEqual(mockAudioAnalysis)
    })

    it("should analyze audio with custom options", async () => {
      mockInvoke.mockResolvedValue(mockAudioAnalysis)

      const options: VideoAnalysisOptions["audioAnalysis"] = {
        enableSpectralAnalysis: false,
        enableDynamicsAnalysis: false,
      }

      const result = await service.analyzeAudio("test.mp4", options)

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_analyze_audio", {
        filePath: "test.mp4",
        enableSpectralAnalysis: false,
        enableDynamicsAnalysis: false,
      })
      expect(result).toEqual(mockAudioAnalysis)
    })

    it("should handle errors", async () => {
      mockInvoke.mockRejectedValue(new Error("Audio analysis failed"))

      await expect(service.analyzeAudio("test.mp4")).rejects.toThrow(
        "Не удалось проанализировать аудио: Error: Audio analysis failed",
      )
    })
  })

  describe("comprehensiveAnalysis", () => {
    it("should perform comprehensive analysis", async () => {
      mockInvoke.mockImplementation((command) => {
        switch (command) {
          case "ffmpeg_get_metadata":
            return Promise.resolve(mockMetadata)
          case "ffmpeg_detect_scenes":
            return Promise.resolve(mockSceneDetection)
          case "ffmpeg_analyze_quality":
            return Promise.resolve(mockQualityAnalysis)
          case "ffmpeg_detect_silence":
            return Promise.resolve(mockSilenceDetection)
          case "ffmpeg_analyze_motion":
            return Promise.resolve(mockMotionAnalysis)
          case "ffmpeg_extract_keyframes":
            return Promise.resolve(mockKeyFrames)
          case "ffmpeg_analyze_audio":
            return Promise.resolve(mockAudioAnalysis)
          default:
            return Promise.reject(new Error(`Unknown command: ${command}`))
        }
      })

      const result = await service.comprehensiveAnalysis("test.mp4")

      expect(result).toEqual({
        metadata: mockMetadata,
        scenes: mockSceneDetection,
        quality: mockQualityAnalysis,
        silence: mockSilenceDetection,
        motion: mockMotionAnalysis,
        keyFrames: mockKeyFrames,
        audio: mockAudioAnalysis,
      })

      // Verify all commands were called
      expect(mockInvoke).toHaveBeenCalledTimes(7)
    })

    it("should pass custom options to each analysis", async () => {
      mockInvoke.mockResolvedValue({})

      const options: VideoAnalysisOptions = {
        sceneDetection: { threshold: 0.5 },
        qualityAnalysis: { sampleRate: 2.0 },
        silenceDetection: { threshold: -40 },
        motionAnalysis: { sensitivity: 0.8 },
        keyFrameExtraction: { count: 5 },
        audioAnalysis: { enableSpectralAnalysis: false },
      }

      await service.comprehensiveAnalysis("test.mp4", options)

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_detect_scenes", {
        filePath: "test.mp4",
        threshold: 0.5,
        minSceneLength: 1.0,
      })

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_analyze_quality", {
        filePath: "test.mp4",
        sampleRate: 2.0,
        enableNoiseDetection: true,
        enableStabilityCheck: true,
      })
    })

    it("should handle partial failures", async () => {
      mockInvoke.mockImplementation((command) => {
        if (command === "ffmpeg_get_metadata") {
          return Promise.resolve(mockMetadata)
        }
        return Promise.reject(new Error(`${command} failed`))
      })

      await expect(service.comprehensiveAnalysis("test.mp4")).rejects.toThrow("Не удалось выполнить комплексный анализ")
    })
  })

  describe("quickAnalysis", () => {
    it("should perform quick analysis", async () => {
      mockInvoke.mockImplementation((command) => {
        if (command === "ffmpeg_get_metadata") {
          return Promise.resolve(mockMetadata)
        }
        if (command === "ffmpeg_quick_analysis") {
          return Promise.resolve({
            overall: 0.85,
            estimatedScenes: 10,
          })
        }
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

      const result = await service.quickAnalysis("test.mp4")

      expect(result).toEqual({
        duration: 120,
        resolution: "1920x1080",
        quality: 0.85,
        hasAudio: true,
        estimatedScenes: 10,
      })

      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_get_metadata", {
        filePath: "test.mp4",
      })
      expect(mockInvoke).toHaveBeenCalledWith("ffmpeg_quick_analysis", {
        filePath: "test.mp4",
      })
    })

    it("should handle errors", async () => {
      mockInvoke.mockRejectedValue(new Error("Quick analysis failed"))

      await expect(service.quickAnalysis("test.mp4")).rejects.toThrow()
    })
  })

  describe("generateImprovementSuggestions", () => {
    it("should generate suggestions for quality issues", () => {
      const analysisResult = {
        quality: {
          ...mockQualityAnalysis,
          sharpness: 0.4,
          brightness: 0.2,
          stability: 0.5,
          noise: 0.6,
        },
        audio: mockAudioAnalysis,
        motion: mockMotionAnalysis,
      }

      const suggestions = service.generateImprovementSuggestions(analysisResult)

      expect(suggestions).toContainEqual({
        type: "quality",
        severity: "medium",
        issue: "Низкая резкость изображения",
        suggestion: "Применить фильтр повышения резкости (unsharp)",
        autoFixAvailable: true,
      })

      expect(suggestions).toContainEqual({
        type: "quality",
        severity: "medium",
        issue: "Неоптимальная яркость",
        suggestion: "Настроить уровни яркости и контраста",
        autoFixAvailable: true,
      })

      expect(suggestions).toContainEqual({
        type: "quality",
        severity: "high",
        issue: "Нестабильное изображение (дрожание камеры)",
        suggestion: "Применить стабилизацию видео (deshake)",
        autoFixAvailable: true,
      })

      expect(suggestions).toContainEqual({
        type: "quality",
        severity: "medium",
        issue: "Высокий уровень шума",
        suggestion: "Применить фильтр шумоподавления (denoise)",
        autoFixAvailable: true,
      })
    })

    it("should generate suggestions for audio issues", () => {
      const analysisResult = {
        quality: mockQualityAnalysis,
        audio: {
          ...mockAudioAnalysis,
          quality: {
            clipping: true,
            noiseLevel: 0.5,
            overallQuality: 0.5,
          },
          volume: {
            average: 0.15,
            peak: 0.95,
            rms: 0.1,
          },
        },
        motion: mockMotionAnalysis,
      }

      const suggestions = service.generateImprovementSuggestions(analysisResult)

      expect(suggestions).toContainEqual({
        type: "audio",
        severity: "high",
        issue: "Обрезание аудиосигнала (клиппинг)",
        suggestion: "Уменьшить громкость и применить лимитер",
        autoFixAvailable: true,
      })

      expect(suggestions).toContainEqual({
        type: "audio",
        severity: "medium",
        issue: "Высокий уровень фонового шума",
        suggestion: "Применить фильтр шумоподавления для аудио",
        autoFixAvailable: true,
      })

      expect(suggestions).toContainEqual({
        type: "audio",
        severity: "medium",
        issue: "Низкий уровень громкости",
        suggestion: "Нормализовать громкость аудио",
        autoFixAvailable: true,
      })
    })

    it("should generate suggestions for motion issues", () => {
      const analysisResult = {
        quality: mockQualityAnalysis,
        audio: mockAudioAnalysis,
        motion: {
          ...mockMotionAnalysis,
          cameraMovement: {
            panning: 0.3,
            tilting: 0.2,
            zooming: 0.1,
            stability: 0.4,
          },
          motionIntensity: 0.1,
        },
      }

      const suggestions = service.generateImprovementSuggestions(analysisResult)

      expect(suggestions).toContainEqual({
        type: "motion",
        severity: "medium",
        issue: "Резкие движения камеры",
        suggestion: "Добавить плавные переходы между кадрами",
        autoFixAvailable: false,
      })

      expect(suggestions).toContainEqual({
        type: "editing",
        severity: "low",
        issue: "Статичные кадры",
        suggestion: "Добавить динамические переходы или эффекты",
        autoFixAvailable: false,
      })
    })

    it("should return empty array for perfect video", () => {
      const analysisResult = {
        quality: mockQualityAnalysis,
        audio: mockAudioAnalysis,
        motion: mockMotionAnalysis,
      }

      const suggestions = service.generateImprovementSuggestions(analysisResult)

      expect(suggestions).toEqual([])
    })

    it("should handle edge cases in brightness", () => {
      const analysisResult = {
        quality: {
          ...mockQualityAnalysis,
          brightness: 0.9, // Too bright
        },
        audio: mockAudioAnalysis,
        motion: mockMotionAnalysis,
      }

      const suggestions = service.generateImprovementSuggestions(analysisResult)

      expect(suggestions).toContainEqual({
        type: "quality",
        severity: "medium",
        issue: "Неоптимальная яркость",
        suggestion: "Настроить уровни яркости и контраста",
        autoFixAvailable: true,
      })
    })
  })
})
