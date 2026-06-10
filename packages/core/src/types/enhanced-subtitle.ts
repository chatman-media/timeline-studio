export interface EnhancedSubtitleInput {
  operation:
    | "auto_generate_from_video"
    | "generate_from_audio"
    | "extract_from_visual_text"
    | "combine_audio_visual"
    | "scene_based_subtitles"
    | "speaker_identification"
    | "multilingual_detection"
    | "smart_timing_optimization"
  clipId: string
  language?: string
  outputLanguages?: string[]
  useSpeechRecognition?: boolean
  useOCR?: boolean
  useSceneAnalysis?: boolean
  usePersonIdentification?: boolean
  aiProvider?: "whisper" | "azure" | "google" | "unified"
  confidenceThreshold?: number
  maxSubtitleLength?: number
  minSubtitleDuration?: number
  maxSubtitleDuration?: number
  autoCorrectGrammar?: boolean
  autoCapitalization?: boolean
  removeFiller?: boolean
  optimizeReading?: boolean
  includeEmotionalCues?: boolean
  includeSpeakerLabels?: boolean
  includeSceneDescriptions?: boolean
  styleTemplate?: "standard" | "broadcast" | "social" | "accessibility"
}

export interface SubtitleItem {
  id: string
  startTime: number
  endTime: number
  text: string
  speaker?: string
}

export interface EnhancedSubtitleResult {
  operation: string
  success: boolean
  subtitles: SubtitleItem[]
  sources: {
    fromSpeech: SubtitleItem[]
    fromOCR: SubtitleItem[]
    fromSceneAnalysis: SubtitleItem[]
    combined: SubtitleItem[]
  }
  quality: {
    speechRecognitionAccuracy?: number
    ocrAccuracy?: number
    overallConfidence: number
    languageDetectionAccuracy?: number
  }
  processing: {
    detectedLanguages: string[]
    identifiedSpeakers: number
    processedScenes: number
    ocrTextBlocks: number
    totalProcessingTime: number
  }
  recommendations: string[]
  warnings?: string[]
  analysisData?: unknown
}

export interface EnhancedSubtitleExecutionOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
  enableLogging?: boolean
  metadata?: Record<string, unknown>
}

export interface EnhancedSubtitleToolResult<T = EnhancedSubtitleResult> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
  warnings?: string[]
  executionTime: number
  toolName: string
  executionId: string
  metadata?: Record<string, unknown>
}
