/**
 * Общие типы для анализа медиа файлов
 * Используются различными сервисами анализа
 * Перенесено из src/shared/types/media-analysis.ts
 */

export interface VideoMetadata {
  duration: number // в секундах
  width: number
  height: number
  fps: number
  bitrate: number
  codec: string
  format: string
  hasAudio: boolean
  audioCodec?: string
  audioChannels?: number
  audioSampleRate?: number
  fileSize: number
}

export interface SceneDetectionResult {
  scenes: Array<{
    startTime: number // в секундах
    endTime: number
    confidence: number
    thumbnailPath?: string
  }>
  totalScenes: number
  averageSceneLength: number
}

export interface QualityAnalysisResult {
  overall: number // 0-1, общая оценка качества
  sharpness: number // 0-1, резкость
  brightness: number // 0-1, яркость
  contrast: number // 0-1, контрастность
  saturation: number // 0-1, насыщенность
  noise: number // 0-1, уровень шума (меньше = лучше)
  stability: number // 0-1, стабилизация (дрожание камеры)
  issues: string[] // список обнаруженных проблем
}

export interface SilenceDetectionResult {
  silences: Array<{
    startTime: number
    endTime: number
    duration: number
    confidence: number
  }>
  totalSilenceDuration: number
  speechPercentage: number
}

export interface MotionAnalysisResult {
  motionIntensity: number // 0-1, интенсивность движения
  cameraMovement: {
    panning: number // 0-1, панорамирование
    tilting: number // 0-1, наклон
    zooming: number // 0-1, зум
    stability: number // 0-1, стабильность
  }
  objectMovement: number // 0-1, движение объектов в кадре
  motionProfile: Array<{
    timestamp: number
    intensity: number
  }>
}

export interface KeyFrameExtractionResult {
  keyFrames: Array<{
    timestamp: number
    imagePath: string
    confidence: number
    description?: string // если используется AI описание
  }>
  thumbnailPath: string // лучший кадр для превью
}

export interface AudioAnalysisResult {
  volume: {
    average: number // 0-1
    peak: number // 0-1
    rms: number // 0-1
  }
  frequency: {
    lowEnd: number // 0-1, басы
    midRange: number // 0-1, средние частоты
    highEnd: number // 0-1, высокие частоты
  }
  dynamics: {
    dynamicRange: number // 0-1
    compressionRatio: number
  }
  quality: {
    clipping: boolean
    noiseLevel: number // 0-1
    overallQuality: number // 0-1
  }
}

// Параметры анализа
export interface VideoAnalysisOptions {
  sceneDetection?: {
    threshold?: number // 0-1, чувствительность детекции сцен
    minSceneLength?: number // минимальная длина сцены в секундах
  }
  qualityAnalysis?: {
    sampleRate?: number // количество кадров для анализа в секунду
    enableNoiseDetection?: boolean
    enableStabilityCheck?: boolean
  }
  silenceDetection?: {
    threshold?: number // уровень тишины в dB
    minDuration?: number // минимальная длительность тишины в секундах
  }
  motionAnalysis?: {
    sensitivity?: number // 0-1, чувствительность к движению
  }
  keyFrameExtraction?: {
    count?: number // количество ключевых кадров
    quality?: "low" | "medium" | "high"
    aiDescription?: boolean // использовать AI для описания кадров
  }
  audioAnalysis?: {
    enableSpectralAnalysis?: boolean
    enableDynamicsAnalysis?: boolean
  }
}
