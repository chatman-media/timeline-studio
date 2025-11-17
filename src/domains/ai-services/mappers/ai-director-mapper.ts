/**
 * AI Director Result Mapper
 *
 * Преобразует результаты AI Director (Rust backend) в унифицированный формат
 * для использования в TypeScript приложении
 */

// Use types from ai-director and montage-planner
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
    result.scene_analysis?.scenes?.map((scene) => ({
      startTime: scene.start_time,
      endTime: scene.end_time,
      sceneType: String("unknown"), // scene type not available in simple structure
      confidence: scene.confidence,
      description: scene.description || "",
    })) ?? []

  // Key moments не доступны в базовой структуре ComprehensiveAnalysisResult
  const keyMoments: Array<{
    timestamp: number
    duration: number
    category: string
    score: number
    description: string
    tags: string[]
  }> = []

  return {
    // Metadata
    analysisId: result.analysis_id,
    videoPath: "", // TODO: Передавать из вызывающего кода
    status: mapAnalysisStatus(result.status),
    createdAt: result.started_at,
    processingTimeMs: result.total_duration_ms || 0,

    // Video Info
    videoInfo: {
      duration: result.video_analysis?.duration || 0,
      fps: result.video_analysis?.fps || 0,
      resolution: {
        width: result.video_analysis?.width || 0,
        height: result.video_analysis?.height || 0,
      },
      codec: result.video_analysis?.codec || "unknown",
      fileSize: 0, // Не доступно
    },

    // Audio Analysis
    audioAnalysis: result.audio_analysis
      ? {
          hasAudio: true,
          duration: result.audio_analysis.duration,
          channels: 0, // Not available in UnifiedAudioAnalysisResult
          sampleRate: 0, // Not available
          bitrate: 0, // Not available
          quality: 0, // TODO: Рассчитать из доступных метрик

          speechSegments: [], // TODO: Не доступно в текущей структуре
          musicSegments: [], // TODO: Не доступно в текущей структуре

          transcription: result.audio_analysis.transcription
            ? {
                fullText: result.audio_analysis.transcription,
                segments: [],
                language: "unknown",
              }
            : undefined,

          emotionalTone: "neutral",
          energyLevel: 50,
        }
      : undefined,

    // Visual Analysis
    visualAnalysis: result.scene_analysis
      ? ({
          scenes,
          objects:
            result.object_detection?.objects.map((obj) => ({
              timestamp: obj.timestamp,
              detectedObjects: [
                {
                  className: obj.label,
                  confidence: obj.confidence,
                  bbox: obj.bbox,
                },
              ],
            })) || [],
          faces:
            result.face_recognition?.faces.map((face) => ({
              timestamp: face.timestamp,
              detectedFaces: [
                {
                  confidence: face.confidence,
                  bbox: face.bbox,
                },
              ],
            })) || [],
          composition: undefined, // Not available in current structure
        } as UnifiedContentAnalysis["visualAnalysis"])
      : undefined,

    // Key Moments
    keyMoments,

    // Quality Metrics
    qualityMetrics: calculateQualityMetrics(result),

    // Recommendations - not available in current structure
    editingRecommendations: [],
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
function calculateAudioQuality(audioAnalysis: ComprehensiveAnalysisResult["audio_analysis"]): number {
  if (!audioAnalysis) return 0

  // Простая эвристика на основе loudness и silence
  const loudnessScore = Math.abs(audioAnalysis.loudness) < 40 ? 100 : 60
  const silenceScore = audioAnalysis.silence_percentage < 20 ? 100 : 50

  return Math.round((loudnessScore + silenceScore) / 2)
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
  // Video quality - простая эвристика на основе разрешения и FPS
  const videoQuality = result.video_analysis
    ? Math.min(
        100,
        ((result.video_analysis.width * result.video_analysis.height) / (1920 * 1080)) * 50 +
          (result.video_analysis.fps / 60) * 50,
      )
    : 50

  // Audio quality - на основе доступных метрик
  const audioQuality = result.audio_analysis ? 70 : 50

  // Technical quality - средняя из video и audio
  const technicalQuality = (videoQuality + audioQuality) / 2

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

  const { width, height, fps, codec } = result.video_analysis

  // Resolution score
  const pixels = width * height
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
  const codecScore = codec && goodCodecs.some((c) => codec.toLowerCase().includes(c)) ? 100 : 60

  return (resolutionScore + fpsScore + codecScore) / 3
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
