/**
 * Content Analysis Types
 * Типы для анализа и классификации контента
 */

// Speech Detection Types
export interface SpeechDetection {
  startTime: number
  endTime: number
  text?: string
  transcript?: string
  speaker?: string
  language?: string
  confidence: number
  words?: Array<{
    word: string
    startTime: number
    endTime: number
    confidence: number
  }>
}

// Content Classification Types
export enum ContentType {
  NARRATIVE = "narrative",
  DOCUMENTARY = "documentary",
  TUTORIAL = "tutorial",
  VLOG = "vlog",
  MUSIC_VIDEO = "music_video",
  COMMERCIAL = "commercial",
  NEWS = "news",
  SPORTS = "sports",
  GAMING = "gaming",
}

export enum Genre {
  ACTION = "action",
  COMEDY = "comedy",
  DRAMA = "drama",
  DOCUMENTARY = "documentary",
  EDUCATIONAL = "educational",
  LIFESTYLE = "lifestyle",
  TECH = "tech",
  BEAUTY = "beauty",
  COOKING = "cooking",
  TRAVEL = "travel",
  FITNESS = "fitness",
  MUSIC = "music",
  ART = "art",
  SCIENCE = "science",
  GENERAL = "general",
}

export enum Emotion {
  HAPPY = "happy",
  SAD = "sad",
  EXCITED = "excited",
  CALM = "calm",
  TENSE = "tense",
  ROMANTIC = "romantic",
  INSPIRING = "inspiring",
  FUNNY = "funny",
  SERIOUS = "serious",
  NEUTRAL = "neutral",
}

export interface Audience {
  ageRange: { min: number; max: number }
  interests: string[]
  demographics: {
    primary: string
    secondary: string[]
  }
}

export interface ClassificationResult {
  category: string
  subcategory?: string
  confidence: number
  reasoning?: string
}

export interface ContentClassification {
  primary: ClassificationResult
  secondary: ClassificationResult[]
  confidence: number
  tags: string[]
  warnings: string[]
}

export interface EmotionalTone {
  primary: Emotion
  secondary?: Emotion
  intensity: number // 0-1
}

export interface SceneAnalysis {
  id: string
  startTime: number
  endTime: number
  duration: number
  type: string
  confidence: number
  description?: string
  content?: {
    objects?: Array<{
      class: string
      confidence: number
      boundingBox: {
        x: number
        y: number
        width: number
        height: number
      }
    }>
    text?: Array<{
      text: string
      confidence: number
    }>
  }
  keyFrames?: Array<{
    timestamp: number
    features?: {
      colorHistogram?: number[]
    }
    composition?: {
      colorHarmony: number
    }
  }>
}
