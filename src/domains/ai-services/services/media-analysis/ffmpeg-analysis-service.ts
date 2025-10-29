/**
 * Сервис для анализа видео с помощью FFmpeg и AI
 * Предоставляет возможности анализа сцен, качества, аудио и метаданных
 */

import { invoke } from "@tauri-apps/api/core"
import type {
  AudioAnalysisOptions,
  AudioAnalysisResult,
  KeyFrameExtractionOptions,
  KeyFrameExtractionResult,
  MotionAnalysisOptions,
  MotionAnalysisResult,
  QualityAnalysisOptions,
  QualityAnalysisResult,
  SceneDetectionOptions,
  SceneDetectionResult,
  SilenceDetectionOptions,
  SilenceDetectionResult,
  VideoAnalysisOptions,
  VideoMetadata,
} from "@/domains/ai-services/types/interfaces"

// Реэкспортируем типы для обратной совместимости
export type {
  AudioAnalysisResult,
  KeyFrameExtractionResult,
  MotionAnalysisResult,
  QualityAnalysisResult,
  SceneDetectionResult,
  SilenceDetectionResult,
  VideoAnalysisOptions,
  VideoMetadata,
} from "@/domains/ai-services/types/interfaces"

/**
 * Основной сервис FFmpeg анализа
 */
export class FFmpegAnalysisService {
  private static instance: FFmpegAnalysisService

  private constructor() {}

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): FFmpegAnalysisService {
    if (!FFmpegAnalysisService.instance) {
      FFmpegAnalysisService.instance = new FFmpegAnalysisService()
    }
    return FFmpegAnalysisService.instance
  }

  /**
   * Получить базовые метаданные видеофайла
   */
  public async getVideoMetadata(filePath: string): Promise<VideoMetadata> {
    try {
      const result = await invoke<VideoMetadata>("ffmpeg_get_metadata", {
        filePath,
      })
      return result
    } catch (error) {
      console.error("Ошибка получения метаданных видео:", error)
      throw new Error(`Не удалось получить метаданные: ${String(error)}`)
    }
  }

  /**
   * Определить сцены в видео
   */
  public async detectScenes(filePath: string, options: SceneDetectionOptions = {}): Promise<SceneDetectionResult> {
    try {
      const result = await invoke<SceneDetectionResult>("ffmpeg_detect_scenes", {
        filePath,
        threshold: options.threshold || 0.3,
        minSceneLength: options.minSceneLength || 1.0,
      })
      return result
    } catch (error) {
      console.error("Ошибка детекции сцен:", error)
      throw new Error(`Не удалось определить сцены: ${String(error)}`)
    }
  }

  /**
   * Анализ качества видео
   */
  public async analyzeQuality(filePath: string, options: QualityAnalysisOptions = {}): Promise<QualityAnalysisResult> {
    try {
      const result = await invoke<QualityAnalysisResult>("ffmpeg_analyze_quality", {
        filePath,
        sampleRate: options.sampleRate || 1.0,
        enableNoiseDetection: options.enableNoiseDetection ?? true,
        enableStabilityCheck: options.enableStabilityCheck ?? true,
      })
      return result
    } catch (error) {
      console.error("Ошибка анализа качества:", error)
      throw new Error(`Не удалось проанализировать качество: ${String(error)}`)
    }
  }

  /**
   * Детекция тишины в аудио
   */
  public async detectSilence(filePath: string, options: SilenceDetectionOptions = {}): Promise<SilenceDetectionResult> {
    try {
      const result = await invoke<SilenceDetectionResult>("ffmpeg_detect_silence", {
        filePath,
        threshold: options.threshold || -30, // dB
        minDuration: options.minDuration || 1.0,
      })
      return result
    } catch (error) {
      console.error("Ошибка детекции тишины:", error)
      throw new Error(`Не удалось определить тишину: ${String(error)}`)
    }
  }

  /**
   * Анализ движения в видео
   */
  public async analyzeMotion(filePath: string, options: MotionAnalysisOptions = {}): Promise<MotionAnalysisResult> {
    try {
      const result = await invoke<MotionAnalysisResult>("ffmpeg_analyze_motion", {
        filePath,
        sensitivity: options.sensitivity || 0.5,
      })
      return result
    } catch (error) {
      console.error("Ошибка анализа движения:", error)
      throw new Error(`Не удалось проанализировать движение: ${String(error)}`)
    }
  }

  /**
   * Извлечение ключевых кадров
   */
  public async extractKeyFrames(
    filePath: string,
    options: KeyFrameExtractionOptions = {},
  ): Promise<KeyFrameExtractionResult> {
    try {
      // Конвертируем maxFrames в interval (примерно каждые N секунд)
      const maxFrames = options.maxFrames || 10
      const interval = options.interval || 5.0 // Извлекаем ключевой кадр каждые 5 секунд по умолчанию

      const result = await invoke<KeyFrameExtractionResult>("ffmpeg_extract_keyframes", {
        filePath,
        interval,
        maxFrames,
      })
      return result
    } catch (error) {
      console.error("Ошибка извлечения ключевых кадров:", error)
      throw new Error(`Не удалось извлечь ключевые кадры: ${String(error)}`)
    }
  }

  /**
   * Извлечение одного кадра по временной метке
   */
  public async extractFrame(filePath: string, timestamp: number, width = 640, height = 480): Promise<ImageData | null> {
    try {
      const result = await invoke<{ imagePath: string; width: number; height: number }>("ffmpeg_extract_frame", {
        filePath,
        timestamp,
        width,
        height,
      })

      // Создаем ImageData из пути к изображению
      // В реальном приложении здесь будет загрузка изображения
      const canvas = new OffscreenCanvas(result.width, result.height)
      const ctx = canvas.getContext("2d")!

      // Для тестирования создаем заглушку ImageData
      const imageData = ctx.createImageData(result.width, result.height)

      // Заполняем случайными данными для тестирования
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = Math.floor(Math.random() * 255) // R
        imageData.data[i + 1] = Math.floor(Math.random() * 255) // G
        imageData.data[i + 2] = Math.floor(Math.random() * 255) // B
        imageData.data[i + 3] = 255 // A
      }

      return imageData
    } catch (error) {
      console.error("Ошибка извлечения кадра:", error)
      return null
    }
  }

  /**
   * Анализ аудиодорожки
   */
  public async analyzeAudio(filePath: string, options: AudioAnalysisOptions = {}): Promise<AudioAnalysisResult> {
    try {
      const result = await invoke<AudioAnalysisResult>("ffmpeg_analyze_audio", {
        filePath,
        enableSpectralAnalysis: options.enableSpectralAnalysis ?? true,
        enableLoudnessAnalysis: options.enableLoudnessAnalysis ?? true,
      })
      return result
    } catch (error) {
      console.error("Ошибка анализа аудио:", error)
      throw new Error(`Не удалось проанализировать аудио: ${String(error)}`)
    }
  }

  /**
   * Комплексный анализ видео (все типы анализа)
   */
  public async comprehensiveAnalysis(
    filePath: string,
    options: VideoAnalysisOptions = {},
  ): Promise<{
    metadata: VideoMetadata
    scenes: SceneDetectionResult
    quality: QualityAnalysisResult
    silence: SilenceDetectionResult
    motion: MotionAnalysisResult
    keyFrames: KeyFrameExtractionResult
    audio: AudioAnalysisResult
  }> {
    try {
      // Выполняем все анализы параллельно для оптимизации
      const [metadata, scenes, quality, silence, motion, keyFrames, audio] = await Promise.all([
        this.getVideoMetadata(filePath),
        this.detectScenes(filePath, options.sceneDetection),
        this.analyzeQuality(filePath, options.qualityAnalysis),
        this.detectSilence(filePath, options.silenceDetection),
        this.analyzeMotion(filePath, options.motionAnalysis),
        this.extractKeyFrames(filePath, options.keyFrameExtraction),
        this.analyzeAudio(filePath, options.audioAnalysis),
      ])

      return {
        metadata,
        scenes,
        quality,
        silence,
        motion,
        keyFrames,
        audio,
      }
    } catch (error) {
      console.error("Ошибка комплексного анализа:", error)
      throw new Error(`Не удалось выполнить комплексный анализ: ${String(error)}`)
    }
  }

  /**
   * Быстрый анализ для предпросмотра (только основные метрики)
   */
  public async quickAnalysis(filePath: string): Promise<{
    duration: number
    resolution: string
    quality: number
    hasAudio: boolean
    estimatedScenes: number
  }> {
    try {
      const metadata = await this.getVideoMetadata(filePath)

      // Быстрая оценка качества (без глубокого анализа)
      const quickQuality = await invoke<{ overall: number; estimatedScenes: number }>("ffmpeg_quick_analysis", {
        filePath,
      })

      return {
        duration: metadata.duration,
        resolution: `${metadata.width}x${metadata.height}`,
        quality: quickQuality.overall,
        hasAudio: metadata.hasAudio,
        estimatedScenes: quickQuality.estimatedScenes,
      }
    } catch (error) {
      console.error("Ошибка быстрого анализа:", error)
      throw new Error(`Не удалось выполнить быстрый анализ: ${String(error)}`)
    }
  }

  /**
   * Получить рекомендации по улучшению видео на основе анализа
   */
  public generateImprovementSuggestions(analysisResult: {
    quality: QualityAnalysisResult
    audio: AudioAnalysisResult
    motion: MotionAnalysisResult
  }): Array<{
    type: "quality" | "audio" | "motion" | "editing"
    severity: "low" | "medium" | "high"
    issue: string
    suggestion: string
    autoFixAvailable: boolean
  }> {
    const suggestions: Array<{
      type: "quality" | "audio" | "motion" | "editing"
      severity: "low" | "medium" | "high"
      issue: string
      suggestion: string
      autoFixAvailable: boolean
    }> = []

    // Анализ качества видео
    if (analysisResult.quality.video?.sharpness && analysisResult.quality.video.sharpness < 0.6) {
      suggestions.push({
        type: "quality",
        severity: "medium",
        issue: "Низкая резкость изображения",
        suggestion: "Применить фильтр повышения резкости (unsharp)",
        autoFixAvailable: true,
      })
    }

    if (
      analysisResult.quality.video?.brightness &&
      (analysisResult.quality.video.brightness < 0.3 || analysisResult.quality.video.brightness > 0.8)
    ) {
      suggestions.push({
        type: "quality",
        severity: "medium",
        issue: "Неоптимальная яркость",
        suggestion: "Настроить уровни яркости и контраста",
        autoFixAvailable: true,
      })
    }

    if (analysisResult.quality.video?.stability && analysisResult.quality.video.stability < 0.7) {
      suggestions.push({
        type: "quality",
        severity: "high",
        issue: "Нестабильное изображение (дрожание камеры)",
        suggestion: "Применить стабилизацию видео (deshake)",
        autoFixAvailable: true,
      })
    }

    if (analysisResult.quality.video?.noise && analysisResult.quality.video.noise > 0.4) {
      suggestions.push({
        type: "quality",
        severity: "medium",
        issue: "Высокий уровень шума",
        suggestion: "Применить фильтр шумоподавления (denoise)",
        autoFixAvailable: true,
      })
    }

    // Анализ аудио
    if (analysisResult.audio.volume.peak > 0.95) {
      suggestions.push({
        type: "audio",
        severity: "high",
        issue: "Возможное обрезание аудиосигнала (клиппинг)",
        suggestion: "Уменьшить громкость и применить лимитер",
        autoFixAvailable: true,
      })
    }

    if (analysisResult.audio.volume.average < 0.1) {
      suggestions.push({
        type: "audio",
        severity: "medium",
        issue: "Низкий уровень аудио",
        suggestion: "Увеличить громкость и применить нормализацию",
        autoFixAvailable: true,
      })
    }

    if (analysisResult.audio.volume.average < 0.2) {
      suggestions.push({
        type: "audio",
        severity: "medium",
        issue: "Низкий уровень громкости",
        suggestion: "Нормализовать громкость аудио",
        autoFixAvailable: true,
      })
    }

    // Анализ движения
    if (analysisResult.motion.stabilityScore < 0.6) {
      suggestions.push({
        type: "motion",
        severity: "medium",
        issue: "Резкие движения камеры",
        suggestion: "Добавить плавные переходы между кадрами",
        autoFixAvailable: false,
      })
    }

    if (analysisResult.motion.motionIntensity < 0.2) {
      suggestions.push({
        type: "editing",
        severity: "low",
        issue: "Статичные кадры",
        suggestion: "Добавить динамические переходы или эффекты",
        autoFixAvailable: false,
      })
    }

    return suggestions
  }
}
