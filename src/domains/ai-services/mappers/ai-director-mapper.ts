/**
 * AI Director Result Mapper
 *
 * Преобразует результаты AI Director (Rust backend) в унифицированный формат
 * для использования в TypeScript приложении
 */

import type { ComprehensiveAnalysisResult } from "@/features/ai-director/types/ai-director"
import type { MontageAnalysisResult } from "@/types/montage-planner-rust"

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
    video: number   // 0-100
    audio: number   // 0-100
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
export function mapComprehensiveAnalysisToUnified(
  result: ComprehensiveAnalysisResult
): UnifiedContentAnalysis {
  return {
    // Metadata
    analysisId: result.analysis_id,
    videoPath: result.video_path,
    status: result.status,
    createdAt: result.created_at,
    processingTimeMs: result.processing_time_ms,

    // Video Info
    videoInfo: {
      duration: result.video_analysis?.basic_info.duration ?? 0,
      fps: result.video_analysis?.basic_info.fps ?? 0,
      resolution: result.video_analysis?.basic_info.resolution ?? { width: 0, height: 0 },
      codec: result.video_analysis?.basic_info.codec ?? "unknown",
      fileSize: result.video_analysis?.basic_info.file_size ?? 0,
    },

    // Audio Analysis
    audioAnalysis: result.audio_analysis
      ? {
          hasAudio: result.audio_analysis.basic_metrics.has_audio,
          duration: result.audio_analysis.basic_metrics.duration,
          channels: result.audio_analysis.basic_metrics.channels,
          sampleRate: result.audio_analysis.basic_metrics.sample_rate,
          bitrate: result.audio_analysis.basic_metrics.bitrate,
          quality: calculateAudioQuality(result.audio_analysis),

          speechSegments: result.audio_analysis.montage_analysis?.speech_segments ?? [],
          musicSegments: result.audio_analysis.montage_analysis?.music_segments ?? [],

          transcription: result.audio_analysis.whisper_transcription
            ? {
                fullText: result.audio_analysis.whisper_transcription.full_text,
                segments: result.audio_analysis.whisper_transcription.segments,
                language: result.audio_analysis.whisper_transcription.detected_language,
              }
            : undefined,

          emotionalTone: result.audio_analysis.montage_analysis?.emotional_tone ?? "neutral",
          energyLevel: result.audio_analysis.montage_analysis?.energy_level ?? 50,
        }
      : undefined,

    // Visual Analysis
    visualAnalysis: result.video_analysis
      ? {
          scenes: result.video_analysis.scene_analysis ?? [],
          objects: result.video_analysis.object_detection ?? [],
          faces: result.video_analysis.face_analysis?.map(fa => ({
            timestamp: fa.timestamp,
            detectedFaces: fa.faces,
          })) ?? [],
          composition: result.video_analysis.composition_analysis
            ? {
                overallQuality: result.video_analysis.composition_analysis.overall_quality * 100,
                aestheticScore: result.video_analysis.composition_analysis.aesthetic_score * 100,
                ruleOfThirds: result.video_analysis.composition_analysis.rule_of_thirds,
                symmetryScore: result.video_analysis.composition_analysis.symmetry_score * 100,
              }
            : undefined,
        }
      : undefined,

    // Quality Metrics
    qualityMetrics: calculateQualityMetrics(result),

    // Recommendations
    editingRecommendations: result.editing_recommendations,
  }
}

/**
 * Преобразует MontageAnalysisResult в упрощенный UnifiedContentAnalysis
 */
export function mapMontageAnalysisToUnified(
  result: MontageAnalysisResult
): Partial<UnifiedContentAnalysis> {
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

    keyMoments: result.key_moments.map(km => ({
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
  // Video quality
  const videoQuality = result.video_analysis?.composition_analysis?.overall_quality
    ? result.video_analysis.composition_analysis.overall_quality * 100
    : 50

  // Audio quality
  const audioQuality = result.audio_analysis
    ? calculateAudioQuality(result.audio_analysis)
    : 50

  // Technical quality (resolution, codec, etc.)
  const technicalQuality = calculateTechnicalQuality(result)

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
  if (!result.video_analysis) return 50

  const { resolution, fps, codec } = result.video_analysis.basic_info

  // Resolution score
  const pixels = resolution.width * resolution.height
  let resolutionScore = 0
  if (pixels >= 3840 * 2160) resolutionScore = 100 // 4K+
  else if (pixels >= 1920 * 1080) resolutionScore = 85 // 1080p
  else if (pixels >= 1280 * 720) resolutionScore = 70 // 720p
  else resolutionScore = 50

  // FPS score
  let fpsScore = 0
  if (fps >= 60) fpsScore = 100
  else if (fps >= 30) fpsScore = 80
  else if (fps >= 24) fpsScore = 60
  else fpsScore = 40

  // Codec score (простая эвристика)
  const goodCodecs = ["h264", "h265", "hevc", "vp9", "av1"]
  const codecScore = goodCodecs.some(c => codec.toLowerCase().includes(c)) ? 100 : 60

  return (resolutionScore + fpsScore + codecScore) / 3
}

/**
 * Type guard для проверки ComprehensiveAnalysisResult
 */
export function isComprehensiveAnalysisResult(
  value: unknown
): value is ComprehensiveAnalysisResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "analysis_id" in value &&
    "status" in value &&
    "video_path" in value
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
