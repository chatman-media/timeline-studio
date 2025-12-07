/**
 * Интерфейсы для сервисов анализа медиа
 * Позволяют избежать прямых зависимостей от конкретных реализаций
 */

// Реэкспорт MediaFile из canonical source
export type { MediaFile } from "@/domains/media-management/types"

// Import for local usage
import type { MediaFile } from "@/domains/media-management/types"

export interface VideoMetadata {
  format: string
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
  hasAudio: boolean
  audioChannels?: number
  audioSampleRate?: number
  codec?: string
}

export interface Scene {
  id: string
  startTime: number
  endTime: number
  duration: number
  confidence: number
  keyFrames?: string[]
  description?: string
}

// Re-export from shared types
export type {
  KeyFrameExtractionOptions,
  KeyFrameExtractionResult,
} from "@/domains/shared/types/media-analysis"

// Import for local usage
import type { KeyFrameExtractionOptions as KeyFrameOptions } from "@/domains/shared/types/media-analysis"

export interface QualityAnalysisResult {
  overall: number // 0-100
  video?: {
    sharpness: number
    brightness: number
    contrast: number
    saturation: number
    noise: number
    stability: number
  }
  audio?: {
    clarity: number
    volume: number
    clipping: boolean
    noiseLevel: number
  }
  issues?: string[]
  recommendations?: string[]
}

export interface SilenceDetectionResult {
  silentSegments: SilentSegment[]
  totalSilenceDuration: number
  speechRatio: number
}

export interface SilentSegment {
  startTime: number
  endTime: number
  duration: number
  confidence: number
}

export interface MotionAnalysisResult {
  motionIntensity: number // 0-100
  motionVectors?: MotionVector[]
  cameraMovement?: {
    type: "static" | "pan" | "tilt" | "zoom" | "shake"
    intensity: number
  }
  stabilityScore: number
}

export interface MotionVector {
  timestamp: number
  x: number
  y: number
  magnitude: number
  direction: number
}

export interface FrameAnalysis {
  id: string
  timestamp: number
  objects: DetectedObject[]
  text: ExtractedText[]
  composition: CompositionAnalysis
  colors: ColorAnalysis
  quality: {
    sharpness: number
    brightness: number
    contrast: number
  }
}

export interface DetectedObject {
  class: string
  confidence: number
  boundingBox: BoundingBox
  attributes?: Record<string, any>
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface ExtractedText {
  text: string
  confidence: number
  boundingBox: BoundingBox
  language?: string
}

export interface CompositionAnalysis {
  ruleOfThirds: {
    score: number
    points: Point2D[]
  }
  leadingLines: {
    score: number
    lines: Line2D[]
  }
  balance: {
    score: number
    centerOfMass: Point2D
  }
  symmetry: {
    score: number
    axis?: "horizontal" | "vertical" | "both"
  }
}

export interface Point2D {
  x: number
  y: number
}

export interface Line2D {
  start: Point2D
  end: Point2D
  angle: number
}

export interface ColorAnalysis {
  dominantColors: Color[]
  palette: Color[]
  temperature: "warm" | "cool" | "neutral"
  saturation: "high" | "medium" | "low"
  brightness: "bright" | "medium" | "dark"
}

export interface Color {
  r: number
  g: number
  b: number
  hex: string
  percentage: number
}

// Фабрика сервисов анализа
export interface MediaAnalysisFactory {
  createFFmpegService(): IFFmpegAnalysisService
  createVisionService(): IVisionService

  // Составные сервисы
  createContentAnalysisService(): IContentAnalysisService

  // Утилиты
  isFFmpegAvailable(): Promise<boolean>
  getAvailableServices(): Promise<string[]>
}

export interface ContentAnalysisOptions {
  analysisDepth?: "quick" | "normal" | "deep"
  includeSceneDetection?: boolean
  includeQualityAnalysis?: boolean
  includeVisionAnalysis?: boolean
  includeMotionAnalysis?: boolean
  outputDir?: string
}

// Опции для различных типов анализа
export interface SceneDetectionOptions {
  threshold?: number
  minSceneLength?: number
}

export interface QualityAnalysisOptions {
  sampleRate?: number
  enableNoiseDetection?: boolean
  enableStabilityCheck?: boolean
}

export interface SilenceDetectionOptions {
  threshold?: number
  minDuration?: number
}

export interface MotionAnalysisOptions {
  sensitivity?: number
  blockSize?: number
}

// KeyFrameExtractionOptions импортируется из shared types (строка 41)
// Если нужно расширить, создайте новый интерфейс:
// export interface ExtendedKeyFrameExtractionOptions extends KeyFrameExtractionOptions { ... }

export interface AudioAnalysisOptions {
  enableSpectralAnalysis?: boolean
  enableLoudnessAnalysis?: boolean
}

export interface VideoAnalysisOptions {
  includeSceneDetection?: boolean
  includeQualityAnalysis?: boolean
  includeMotionAnalysis?: boolean
  analysisDepth?: "quick" | "normal" | "deep"
  outputDir?: string
  // Дополнительные опции анализа
  sceneDetection?: SceneDetectionOptions
  qualityAnalysis?: QualityAnalysisOptions
  silenceDetection?: SilenceDetectionOptions
  motionAnalysis?: MotionAnalysisOptions
  keyFrameExtraction?: KeyFrameOptions
  audioAnalysis?: AudioAnalysisOptions
}

// Object Detection Types for Object Tracking
export interface ObjectDetection {
  id: string
  label: string
  confidence: number
  boundingBox: BoundingBox
  frameNumber: number
  timestamp: number
}

// Типы для совместимости с существующим кодом
export interface VideoAnalysisResult {
  duration: number
  fps: number
  resolution: { width: number; height: number }
  codec: string
  bitrate: number
  scenes: Array<{ start: number; end: number; confidence: number }>
  quality: {
    overall: number
    sharpness: number
    noise: number
    compression: number
    motionIntensity: number
  }
}

export interface AudioAnalysisResult {
  duration: number
  channels: number
  sampleRate: number
  bitrate: number
  codec: string
  volume: {
    average: number
    peak: number
    min: number
    max: number
  }
  silentSegments: Array<{ start: number; end: number }>
}

export interface FrameAnalysisResult {
  objects: Array<{
    label: string
    confidence: number
    bbox: { x: number; y: number; width: number; height: number }
  }>
  faces: Array<{
    confidence: number
    bbox: { x: number; y: number; width: number; height: number }
    emotions: Record<string, number>
  }>
  text: Array<{
    text: string
    confidence: number
    bbox: { x: number; y: number; width: number; height: number }
  }>
  scene: {
    type: string
    confidence: number
    attributes: string[]
  }
  nsfw: {
    safe: number
    suggestive: number
    explicit: number
  }
}

export interface SceneDetectionResult {
  start: number
  end: number
  confidence: number
}

export interface ContentAnalysisResult {
  id: string
  mediaFile: MediaFile
  video: VideoAnalysisResult
  audio: AudioAnalysisResult
  metadata?: VideoMetadata
  quality?: QualityAnalysisResult
  motion?: MotionAnalysisResult
  scenes: Array<{
    start: number
    end: number
    confidence: number
    id: string
    description?: string
    objects?: string[]
    keyframes?: string[]
  }>
  scenesDetection?: {
    scenes: Array<{
      start: number
      end: number
      confidence: number
      id: string
      description?: string
      objects?: string[]
      keyframes?: string[]
    }>
    method: "threshold" | "histogram" | "optical_flow" | "ai"
    confidence: number
  }
  transcript: {
    text: string
    segments: Array<{
      start: number
      end: number
      text: string
      confidence: number
    }>
  }
  summary: string
  tags: string[]
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
  processingTime?: number
}

// Дополнительные интерфейсы для FFmpeg сервиса
export interface IFFmpegAnalysisService {
  analyzeVideo(file: MediaFile): Promise<VideoAnalysisResult>
  analyzeAudio(file: MediaFile): Promise<AudioAnalysisResult>
  extractFrames(file: MediaFile, timestamps: number[]): Promise<string[]>
  extractAudioSegment(file: MediaFile, start: number, end: number): Promise<string>

  // Методы для обработки файлов и путей (overloaded)
  getVideoMetadata(path: string): Promise<VideoMetadata>

  // detectScenes с поддержкой разных сигнатур
  detectScenes(
    pathOrFile: string | MediaFile,
    optionsOrThreshold?:
      | { sensitivity?: number; minSceneDuration?: number; method?: "threshold" | "histogram" }
      | number,
  ): Promise<SceneDetectionResult[]>

  analyzeQuality(
    path: string,
    options?: {
      checkVideo?: boolean
      checkAudio?: boolean
      deepAnalysis?: boolean
    },
  ): Promise<QualityAnalysisResult>
  detectSilence(
    path: string,
    options?: {
      threshold?: number
      minDuration?: number
    },
  ): Promise<SilenceDetectionResult>
  analyzeMotion(
    path: string,
    options?: {
      sensitivity?: number
      stabilityCheck?: boolean
    },
  ): Promise<MotionAnalysisResult>
  extractKeyframes(
    path: string,
    options?: {
      count?: number
      interval?: number
      outputDir?: string
    },
  ): Promise<string[]>
  convertToFormat(inputPath: string, outputPath: string, format: string): Promise<boolean>
}

export interface IVisionService {
  analyzeFrame(imagePath: string): Promise<FrameAnalysisResult>
  analyzeVideo(videoPath: string, sampleRate?: number): Promise<FrameAnalysisResult[]>
  detectFaces(imagePath: string): Promise<any[]>
  recognizeText(imagePath: string): Promise<string>

  // Для совместимости с новыми интерфейсами
  analyzeFrames(imagePaths: string[]): Promise<FrameAnalysis[]>
  detectObjects(imagePath: string): Promise<DetectedObject[]>
  extractText(imagePath: string): Promise<ExtractedText[]>
  analyzeComposition(imagePath: string): Promise<CompositionAnalysis>
  analyzeColors(imagePath: string): Promise<ColorAnalysis>
}

export interface IContentAnalysisService {
  analyzeContent(file: MediaFile): Promise<ContentAnalysisResult>
  analyzeMultiple(files: MediaFile[]): Promise<ContentAnalysisResult[]>
  generateSummary(analysis: ContentAnalysisResult): Promise<string>
  extractKeyMoments(
    analysis: ContentAnalysisResult,
    count?: number,
  ): Promise<Array<{ timestamp: number; description: string; confidence: number }>>

  // Для совместимости с новыми интерфейсами
  analyzeMedia(file: MediaFile, options?: ContentAnalysisOptions): Promise<ContentAnalysisResult>
  batchAnalyzeMedia(files: MediaFile[], options?: ContentAnalysisOptions): Promise<ContentAnalysisResult[]>
}
