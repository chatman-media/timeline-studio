/**
 * Типы для Scene Analysis Engine
 */

import { SceneAnalysis } from "@/domains/ai-services"
import type { ContentType, Genre, KeyMoment } from "../../shared/types/content-analysis"

export interface SceneAnalysisConfig {
  // FFmpeg параметры
  ffmpeg: {
    sceneThreshold: number // 0-1
    minSceneLength: number // секунды
    keyframeInterval: number // секунды между ключевыми кадрами
    qualitySampleRate: number // кадров в секунду для анализа качества
  }

  // Computer Vision параметры
  vision: {
    enableObjectDetection: boolean
    enableFaceDetection: boolean
    enableTextRecognition: boolean
    enableActivityDetection: boolean
    confidenceThreshold: number // 0-1
  }

  // AI анализ
  ai: {
    enableContentClassification: boolean
    enableMoodDetection: boolean
    enableGenreDetection: boolean
    model?: string // Какую AI модель использовать
  }

  // Character Analysis
  enableCharacterAnalysis: boolean

  // Производительность
  performance: {
    parallel: boolean
    maxThreads: number
    cacheResults: boolean
  }
}

export interface SceneAnalysisResult {
  scenes: SceneAnalysis[]
  keyMoments: KeyMoment[]
  classification: {
    contentType: ContentType
    genres: Genre[]
    confidence: number
  }
  summary: {
    totalScenes: number
    averageSceneDuration: number
    dominantColors: string[]
    visualComplexity: number // 0-1
    audioProfile: AudioProfile
    demographics?: any
  }
  timeline: TimelineData
  // Интеграция с montage-planner
  persons?: any[]
  fragments?: any[]
  personStats?: any
  // Анализ персонажей и отношений
  characterAnalysis?: import("./services/character-analysis").CharacterAnalysisResult
}

export interface AudioProfile {
  hasSpeech: boolean
  hasMusic: boolean
  hasSilence: boolean
  speechPercentage: number
  musicPercentage: number
  averageVolume: number
  dynamicRange: number
}

export interface TimelineData {
  duration: number
  segments: TimelineSegment[]
  keyframes: KeyframeData[]
}

export interface TimelineSegment {
  start: number
  end: number
  type: SegmentType
  confidence: number
  metadata?: any
}

export enum SegmentType {
  INTRO = "intro",
  MAIN_CONTENT = "main_content",
  TRANSITION = "transition",
  OUTRO = "outro",
  CREDITS = "credits",
}

export interface KeyframeData {
  timestamp: number
  thumbnailPath: string
  features: VisualFeatures
  importance: number // 0-1
}

export interface VisualFeatures {
  dominantColors: ColorInfo[]
  composition: CompositionMetrics
  lighting: LightingInfo
  motion: MotionMetrics
}

export interface ColorInfo {
  hex: string
  percentage: number
  name?: string
}

export interface CompositionMetrics {
  ruleOfThirds: number // 0-1
  symmetry: number // 0-1
  balance: number // 0-1
  leadingLines: boolean
  goldenRatio: number // 0-1
}

export interface LightingInfo {
  brightness: number // 0-1
  contrast: number // 0-1
  type: LightingType
  quality: number // 0-1
}

export enum LightingType {
  NATURAL = "natural",
  ARTIFICIAL = "artificial",
  MIXED = "mixed",
  LOW_KEY = "low_key",
  HIGH_KEY = "high_key",
}

export interface MotionMetrics {
  intensity: number // 0-1
  direction: MotionDirection
  speed: number // pixels per second
  cameraMovement: CameraMovement
}

export enum MotionDirection {
  STATIC = "static",
  LEFT = "left",
  RIGHT = "right",
  UP = "up",
  DOWN = "down",
  DIAGONAL = "diagonal",
  CHAOTIC = "chaotic",
}

export interface CameraMovement {
  type: CameraMovementType
  intensity: number // 0-1
  smooth: boolean
}

export enum CameraMovementType {
  STATIC = "static",
  PAN = "pan",
  TILT = "tilt",
  ZOOM = "zoom",
  DOLLY = "dolly",
  HANDHELD = "handheld",
  TRACKING = "tracking",
}

// Типы для анализа переходов между сценами
export interface SceneTransition {
  fromScene: number
  toScene: number
  startTime: number
  endTime: number
  duration: number
  type: TransitionType
  confidence: number
  smoothness: number
  visualImpact: number
  metadata: {
    colorChange: number
    motionChange: number
    audioChange: number
    isNaturalCut: boolean
    requiresAttention: boolean
  }
}

export type TransitionType =
  | "cut"
  | "fade_in"
  | "fade_out"
  | "fade_through"
  | "dissolve"
  | "wipe"
  | "wipe_left"
  | "wipe_right"
  | "wipe_up"
  | "wipe_down"
  | "morph"

export interface TransitionQuality {
  confidence: number // Уверенность в определении типа (0-1)
  smoothness: number // Плавность перехода (0-1)
  visualImpact: number // Визуальное воздействие (0-1)
}

export interface SceneChangeMetrics {
  colorHistogramChange: number // Изменение цветовой гистограммы (0-1)
  motionVectorChange: number // Изменение векторов движения (0-1)
  audioLevelChange: number // Изменение уровня звука (дБ)
  brightnessChange: number // Изменение яркости (0-1)
}
