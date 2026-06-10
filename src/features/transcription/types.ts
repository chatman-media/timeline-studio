/**
 * UI-facing transcription types.
 * Keep these contracts local to the feature so UI code does not depend on
 * ai-services domain type barrels while the service bridge is still legacy.
 */

export interface TranscriptionOptions {
  language?: string
  task: "transcribe" | "translate"
  modelSize: "tiny" | "base" | "small" | "medium" | "large-v1" | "large-v2" | "large-v3"
  wordTimestamps: boolean
  vadFilter: boolean
  maxSegmentLength?: number
  provider?: "openai" | "local" | "faster-whisper"
  device?: "auto" | "cpu" | "cuda" | "mps"
  computeType?: "auto" | "int8" | "float16" | "float32"
}

export interface TranscriptionSegment {
  id: number
  start: number
  end: number
  text: string
  words?: TranscriptionWord[]
  confidence?: number
  speaker?: string
}

export interface TranscriptionWord {
  word: string
  start: number
  end: number
  confidence?: number
}

export interface TranscriptionResult {
  segments: TranscriptionSegment[]
  language: string
  languageProbability: number
  duration: number
  text: string
  processingTime?: number
}

export interface TranscriptionProgress {
  status: "idle" | "initializing" | "processing" | "completed" | "error"
  progress: number
  message?: string
  currentTime?: number
  totalTime?: number
}

export interface ModelInfo {
  name: string
  size: string
  params?: string
  englishOnly?: boolean
  isDownloaded: boolean
}

export type SubtitleFormat = "srt" | "vtt" | "ass"

export interface WhisperIntegrationOptions {
  provider?: "whisper" | "faster-whisper" | "openai"
  modelSize?: "tiny" | "base" | "small" | "medium" | "large-v3"
  language?: string
  wordTimestamps?: boolean
  vadFilter?: boolean
  device?: "auto" | "cpu" | "cuda" | "mps"
  computeType?: "auto" | "int8" | "float16" | "float32"
}
