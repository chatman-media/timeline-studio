/**
 * AI Director Result Mapper
 *
 * Преобразует результаты AI Director (Rust backend) в унифицированный формат
 * для использования в TypeScript приложении
 */

import type {
  ComprehensiveAnalysisResult,
  EditingRecommendation,
  KeyMomentInsight,
  MontageAnalysisResult,
  SceneAnalysis,
} from "@/types/generated/tauri-bindings"

// ============================================================================
// Unified Content Analysis Interface
// ============================================================================

/** Унифицированный интерфейс для результатов анализа контента */
export interface UnifiedContentAnalysis {
  // Metadata
  analysisId: string
  videoPath: string
  status: "pending" | "in_progress" | "completed" | "failed" | "partially_completed"
  createdAt: string
  processingTimeMs: number

  // Video Info
  videoInfo: {
    duration: number
    fps: number
    resolution: { width: number; height: number }
    codec: string
    fileSize: number
  }

  // Audio Analysis
  audioAnalysis?: {
    hasAudio: boolean
    duration: number
    channels: number
    sampleRate: number
    bitrate: number
    quality: number // 0-100

    // Speech & Music
    speechSegments: Array<{ start: number; end: number; confidence: number }>
    musicSegments: Array<{ start: number; end: number; genre?: string }>

    // Transcription
    transcription?: {
      fullText: string
      segments: Array<{
        start: number
        end: number
        text: string
        confidence: number
      }>
      language: string
    }

    // Emotional analysis
    emotionalTone: string
    energyLevel: number
  }

  // Visual Analysis
  visualAnalysis?: {
    // Scenes
    scenes: Array<{
      startTime: number
      endTime: number
      sceneType: string
      confidence: number
      description: string
    }>

    // Objects
    objects: Array<{
      timestamp: number
      detectedObjects: Array<{
        className: string
        confidence: number
        bbox: [number, number, number, number]
      }>
    }>

    // Faces
    faces: Array<{
      timestamp: number
      detectedFaces: Array<{
        confidence: number
        emotion?: string
        age?: number
        gender?: string
        bbox: [number, number, number, number]
      }>
    }>

    // Composition
    composition?: {
      overallQuality: number // 0-100
      aestheticScore: number // 0-100
      ruleOfThirds: boolean
      symmetryScore: number // 0-100
    }
  }

  // Key Moments (for montage)
  keyMoments?: Array<{
    timestamp: number
    duration: number
    category: string
    score: number
    description: string
    tags: string[]
  }>

  // Quality Metrics
  qualityMetrics: {
    overall: number // 0-100
    video: number // 0-100
    audio: number // 0-100
    technical: number // 0-100
  }

  // Recommendations
  editingRecommendations?: Array<{
    type: string
    description: string
    confidence: number
    suggestedAction: string
    timeRange?: { start: number; end: number }
  }>
}

// ============================================================================
// Mapper Functions
// ============================================================================

/**
 * Преобразует ComprehensiveAnalysisResult в UnifiedContentAnalysis
 */
export function mapComprehensiveAnalysisToUnified(result: ComprehensiveAnalysisResult): UnifiedContentAnalysis {
  // Извлекаем scenes и конвертируем в нужный формат
  const scenes =
    result.scene_analysis?.scenes?.map((scene: SceneAnalysis) => ({
      startTime: scene.startTime,
      endTime: scene.endTime,
      sceneType: String(scene.sceneType),
      confidence: scene.confidence,
      description: scene.description || "",
    })) ?? []

  // Извлекаем key moments из combined_insights
  const keyMoments =
    result.combined_insights?.key_moments?.map((km: KeyMomentInsight) => ({
      timestamp: km.timestamp,
      duration: km.duration,
      category: km.moment_type,
      score: km.importance,
      description: km.reason, // Используем reason как description
      tags: [], // Tags не доступны в новой структуре
    })) ?? []

  return {
    // Metadata
    analysisId: result.analysis_id,
    videoPath: "", // TODO: Передавать из вызывающего кода
    status: mapAnalysisStatus(result.status),
    createdAt: new Date().toISOString(), // metadata не содержит timestamp
    processingTimeMs: result.performance_metrics.total_processing_time,

    // Video Info (минимальная информация, т.к. детали не доступны в новой структуре)
    videoInfo: {
      duration: result.scene_analysis?.avg_scene_duration
        ? result.scene_analysis.avg_scene_duration * result.scene_analysis.total_scenes
        : 0,
      fps: 0, // Не доступно
      resolution: { width: 0, height: 0 }, // Не доступно
      codec: "unknown",
      fileSize: 0, // Не доступно
    },

    // Audio Analysis (упрощенная версия - многие поля недоступны в новой структуре)
    audioAnalysis: result.audio_analysis
      ? {
          hasAudio: result.audio_analysis.basic_metrics.has_audio,
          duration: 0, // TODO: Преобразовать из структуры { seconds: number }
          channels: result.audio_analysis.basic_metrics.channels,
          sampleRate: 0, // TODO: Преобразовать из структуры { hz: number }
          bitrate: result.audio_analysis.basic_metrics.bitrate || 0,
          quality: 0, // TODO: Рассчитать из доступных метрик

          speechSegments: [], // TODO: Не доступно в текущей структуре
          musicSegments: [], // TODO: Не доступно в текущей структуре

          transcription: undefined, // TODO: Не доступно в текущей структуре

          emotionalTone: "neutral", // TODO: Преобразовать из AudioEmotionalTone
          energyLevel: 50, // TODO: Не доступно
        }
      : undefined,

    // Visual Analysis
    visualAnalysis: result.scene_analysis
      ? ({
          scenes,
          objects: [],
          faces: [],
          composition: result.content_analysis?.avg_composition
            ? {
                overallQuality: result.content_analysis.avg_composition.overall * 100,
                aestheticScore: 0, // TODO: Поле aesthetic не существует в CompositionScore
                ruleOfThirds: result.content_analysis.avg_composition.ruleOfThirds,
                symmetryScore: result.content_analysis.avg_composition.symmetry * 100,
              }
            : undefined,
        } as UnifiedContentAnalysis["visualAnalysis"])
      : undefined,

    // Key Moments
    keyMoments,

    // Quality Metrics
    qualityMetrics: calculateQualityMetrics(result),

    // Recommendations
    editingRecommendations:
      result.editing_recommendations?.map((rec: EditingRecommendation) => ({
        type: rec.recommendation_type,
        description: rec.description,
        confidence: rec.priority / 100,
        suggestedAction: rec.description, // Using description as action
        timeRange:
          rec.timestamp !== null && rec.duration !== null
            ? { start: rec.timestamp, end: rec.timestamp + rec.duration }
            : undefined,
      })) ?? [],
  }
}

/**
 * Преобразует AnalysisStatus из Rust в TypeScript формат
 */
function mapAnalysisStatus(status: string): "pending" | "in_progress" | "completed" | "failed" | "partially_completed" {
  switch (status) {
    case "Pending":
      return "pending"
    case "InProgress":
      return "in_progress"
    case "Completed":
      return "completed"
    case "Failed":
      return "failed"
    case "PartiallyCompleted":
      return "partially_completed"
    default:
      return "completed"
  }
}

/**
 * Преобразует MontageAnalysisResult в упрощенный UnifiedContentAnalysis
 */
export function mapMontageAnalysisToUnified(result: MontageAnalysisResult): Partial<UnifiedContentAnalysis> {
  return {
    analysisId: result.analysis_id,
    videoPath: result.video_id,
    status: "completed",
    createdAt: new Date().toISOString(),
    processingTimeMs: 0, // Not available from MontageAnalysisResult

    videoInfo: {
      duration: result.duration,
      fps: 0,
      resolution: { width: 0, height: 0 },
      codec: "unknown",
      fileSize: 0,
    },

    keyMoments: result.key_moments.map((km: any) => ({
      timestamp: km.timestamp,
      duration: km.duration,
      category: km.category,
      score: km.total_score,
      description: km.description,
      tags: km.tags,
    })),

    qualityMetrics: {
      overall: result.quality_score,
      video: result.motion_score,
      audio: result.audio_quality,
      technical: (result.quality_score + result.motion_score) / 2,
    },
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Рассчитывает общее качество аудио на основе метрик
 */
function calculateAudioQuality(audioAnalysis: any): number {
  // Простая эвристика: комбинация битрейта и отсутствия проблем качества
  const bitrateScore = Math.min((audioAnalysis.basic_metrics.bitrate / 320000) * 100, 100)
  const qualityIssuesCount = audioAnalysis.ffmpeg_analysis?.quality_issues?.length ?? 0
  const qualityPenalty = qualityIssuesCount * 10

  return Math.max(0, Math.min(100, bitrateScore - qualityPenalty))
}

/**
 * Рассчитывает метрики качества на основе результатов анализа
 */
function calculateQualityMetrics(result: ComprehensiveAnalysisResult): {
  overall: number
  video: number
  audio: number
  technical: number
} {
  // Video quality из content_analysis
  const videoQuality = result.content_analysis?.quality.overall ? result.content_analysis.quality.overall * 100 : 50

  // Audio quality
  const audioQuality = 50 // TODO: Рассчитать из доступных audio метрик

  // Technical quality из vision_analysis
  const technicalQuality = result.vision_analysis?.visual_quality_avg
    ? result.vision_analysis.visual_quality_avg * 100
    : 50

  // Overall quality
  const overall = (videoQuality + audioQuality + technicalQuality) / 3

  return {
    overall: Math.round(overall),
    video: Math.round(videoQuality),
    audio: Math.round(audioQuality),
    technical: Math.round(technicalQuality),
  }
}

/**
 * Рассчитывает техническое качество (разрешение, кодек, etc.)
 */
function calculateTechnicalQuality(result: ComprehensiveAnalysisResult): number {
  // Новая структура не содержит детальной video информации
  // Используем visual_quality_avg из vision_analysis
  return result.vision_analysis?.visual_quality_avg ? result.vision_analysis.visual_quality_avg * 100 : 50

  // DEPRECATED CODE BELOW (kept for reference)
  /*
  const { resolution, fps, codec } = result.video_analysis.basic_info

  // Resolution score
  const pixels = resolution.width * resolution.height
  let resolutionScore = 0
  if (pixels >= 3840 * 2160)
    resolutionScore = 100 // 4K+
  else if (pixels >= 1920 * 1080)
    resolutionScore = 85 // 1080p
  else if (pixels >= 1280 * 720)
    resolutionScore = 70 // 720p
  else resolutionScore = 50

  // FPS score
  let fpsScore = 0
  if (fps >= 60) fpsScore = 100
  else if (fps >= 30) fpsScore = 80
  else if (fps >= 24) fpsScore = 60
  else fpsScore = 40

  // Codec score (простая эвристика)
  const goodCodecs = ["h264", "h265", "hevc", "vp9", "av1"]
  const codecScore = goodCodecs.some((c) => codec.toLowerCase().includes(c)) ? 100 : 60

  return (resolutionScore + fpsScore + codecScore) / 3
  */
}

/**
 * Type guard для проверки ComprehensiveAnalysisResult
 */
export function isComprehensiveAnalysisResult(value: unknown): value is ComprehensiveAnalysisResult {
  return (
    typeof value === "object" && value !== null && "analysis_id" in value && "status" in value && "video_path" in value
  )
}

/**
 * Type guard для проверки MontageAnalysisResult
 */
export function isMontageAnalysisResult(value: unknown): value is MontageAnalysisResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "video_id" in value &&
    "key_moments" in value &&
    "analysis_id" in value
  )
}
