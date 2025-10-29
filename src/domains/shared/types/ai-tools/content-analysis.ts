// Content Analysis Types

import { AudioAnalysis } from "@/domains/ai-services/types"
import { QualityAnalysisResult, VideoMetadata } from "../media-analysis"

// Дополнительные типы для AI Intelligence Machine
export enum NarrativeType {
  THREE_ACT = "three_act",
  HERO_JOURNEY = "hero_journey",
  STORY_CIRCLE = "story_circle",
  NON_LINEAR = "non_linear",
  EPISODIC = "episodic",
  DOCUMENTARY = "documentary",
}

export enum PaceType {
  SLOW = "slow",
  MODERATE = "moderate",
  FAST = "fast",
  DYNAMIC = "dynamic",
}

export enum ProcessingStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

// Временный тип для VideoAnalysis пока не найден точный импорт
export interface VideoAnalysis {
  metadata?: VideoMetadata
  quality?: QualityAnalysisResult
  // Дополнительные поля будут добавлены позже
}

// Scene Analysis Types
export interface SceneAnalysis {
  id: string
  startTime: number
  endTime: number
  duration: number
  type: SceneType
  keyFrames: KeyFrame[]
  quality: QualityMetrics
  content: ContentElements
  transitions: SceneTransition[]
}

// Alias for SceneAnalysis to match usage in other files
export interface SceneInfo {
  id: string
  type: string
  startTime: number
  endTime: number
  duration: number
  confidence: number
}

export enum SceneType {
  ACTION = "action",
  DIALOGUE = "dialogue",
  LANDSCAPE = "landscape",
  CLOSEUP = "closeup",
  ESTABLISHING = "establishing",
  MONTAGE = "montage",
  TRANSITION = "transition",
}

export interface KeyFrame {
  time: number
  timestamp: number
  thumbnailPath: string
  composition: CompositionAnalysis
  isKeyMoment: boolean
  score: number
  features?: {
    colorHistogram?: number[]
    motionVectors?: Array<[number, number]>
  }
}

export interface CompositionAnalysis {
  ruleOfThirds: number // 0-1 score
  balance: number
  leadingLines: boolean
  depth: number
  colorHarmony: number
}

// Quality Metrics
export interface QualityMetrics {
  overall: number // 0-100
  sharpness: number
  brightness: number
  contrast: number
  saturation: number
  stability: number
  noise: number
}

// Content Elements
export interface ContentElements {
  objects: ObjectDetection[]
  faces: FaceDetection[]
  text: TextDetection[]
  activities: ActivityDetection[]
  identifiedPersons?: any[] // For person tracking
}

export interface ObjectDetection {
  id: string
  label: string
  confidence: number
  boundingBox: BoundingBox
  frameNumbers: number[]
}

export interface FaceDetection {
  id: string
  personId?: string // For person tracking
  confidence: number
  boundingBox: BoundingBox
  landmarks?: FaceLandmarks
  emotion?: EmotionDetection
}

export interface TextDetection {
  text: string
  confidence: number
  boundingBox: BoundingBox
  language?: string
}

export interface ActivityDetection {
  activity: string
  confidence: number
  startFrame: number
  endFrame: number
}

// Scene Transitions
export interface SceneTransition {
  type: TransitionType
  direction: "incoming" | "outgoing"
  targetSceneId: string
  startTime: number
  endTime: number
  duration: number
  confidence: number
  metadata?: {
    smoothness?: number
    visualImpact?: number
    colorChange?: number
    motionChange?: number
    audioChange?: number
    isNaturalCut?: boolean
    requiresAttention?: boolean
  }
}

export enum TransitionType {
  CUT = "cut",
  FADE_IN = "fade_in",
  FADE_OUT = "fade_out",
  FADE_THROUGH = "fade_through",
  DISSOLVE = "dissolve",
  WIPE = "wipe",
  WIPE_LEFT = "wipe_left",
  WIPE_RIGHT = "wipe_right",
  WIPE_UP = "wipe_up",
  WIPE_DOWN = "wipe_down",
  MORPH = "morph",
}

// Unified Content Analysis
export interface UnifiedContentAnalysis {
  // Media info
  mediaFile: MediaFileInfo

  // Scene analysis
  scenes: SceneAnalysis[]
  keyMoments: KeyMoment[]

  // Content classification
  contentType: ContentType
  genres: Genre[]
  mood: EmotionalTone
  targetAudience: Audience

  // Technical analysis
  technicalSpecs: TechnicalSpecs
  qualityMetrics: QualityMetrics

  // Detections
  detections: ContentDetections

  // AI insights
  insights: ContentInsights

  // Existing video/audio analysis from FFmpeg
  videoAnalysis?: VideoAnalysis
  audioAnalysis?: AudioAnalysis
}

export interface MediaFileInfo {
  path: string
  filename: string
  name: string
  size: number
  format: string
  duration: number
}

export interface KeyMoment {
  id: string
  timestamp: number
  duration: number
  type: KeyMomentType
  score: number
  description: string
  sceneId: string
}

export enum KeyMomentType {
  CLIMAX = "climax",
  EMOTIONAL_PEAK = "emotional_peak",
  ACTION_PEAK = "action_peak",
  DIALOGUE_HIGHLIGHT = "dialogue_highlight",
  VISUAL_HIGHLIGHT = "visual_highlight",
  AUDIO_PEAK = "audio_peak",
}

// Content Classification
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
  HORROR = "horror",
  ROMANCE = "romance",
  SCIFI = "scifi",
  DOCUMENTARY = "documentary",
  EDUCATIONAL = "educational",
  LIFESTYLE = "lifestyle",
  TRAVEL = "travel",
  TECH = "tech",
  FASHION = "fashion",
  FOOD = "food",
  FITNESS = "fitness",
  GENERAL = "general",
}

export interface EmotionalTone {
  primary: Emotion
  secondary?: Emotion
  intensity: number // 0-1
}

export enum Emotion {
  HAPPY = "happy",
  SAD = "sad",
  EXCITED = "excited",
  CALM = "calm",
  TENSE = "tense",
  INSPIRING = "inspiring",
  MYSTERIOUS = "mysterious",
  ROMANTIC = "romantic",
  COMEDIC = "comedic",
  DRAMATIC = "dramatic",
}

export interface Audience {
  ageRange: AgeRange
  interests: string[]
  demographics: Demographics
}

export interface AgeRange {
  min: number
  max: number
}

export interface Demographics {
  primary: string
  secondary?: string[]
}

// Technical Specs
export interface TechnicalSpecs {
  resolution: Resolution
  frameRate: number
  bitrate: number
  codec: string
  audioChannels: number
  audioCodec: string
  audioBitrate: number
  duration: number
}

export interface Resolution {
  width: number
  height: number
  aspectRatio: string
}

// Content Detections
export interface ContentDetections {
  objects: ObjectDetection[]
  faces: FaceDetection[]
  text: TextDetection[]
  audio: AudioDetections
  scenes: SceneDetection[]
}

export interface AudioDetections {
  speech: SpeechDetection[]
  music: MusicDetection[]
  soundEffects: SoundEffect[]
  silence: SilenceDetection[]
}

export interface SpeechDetection {
  startTime: number
  endTime: number
  transcript?: string
  speaker?: string
  language?: string
  confidence: number
}

export interface MusicDetection {
  startTime: number
  endTime: number
  genre?: string
  mood?: string
  tempo?: number
}

export interface SoundEffect {
  startTime: number
  endTime: number
  type: string
  description: string
}

export interface SilenceDetection {
  startTime: number
  endTime: number
  duration: number
}

export interface SceneDetection {
  sceneNumber: number
  startTime: number
  endTime: number
  duration: number
  changeScore: number
}

export interface ContentSuggestion {
  type: SuggestionType
  description: string
  priority: Priority
  affectedScenes?: string[]
}

export enum SuggestionType {
  EDIT = "edit",
  EFFECT = "effect",
  TRANSITION = "transition",
  AUDIO = "audio",
  COLOR = "color",
  PACING = "pacing",
}

export interface ContentWarning {
  type: WarningType
  description: string
  severity: Severity
  timestamp?: number
}

export enum WarningType {
  QUALITY = "quality",
  CONTENT = "content",
  TECHNICAL = "technical",
  COPYRIGHT = "copyright",
}

export interface ContentOpportunity {
  type: OpportunityType
  description: string
  potentialImpact: Impact
  implementation: string
}

export enum OpportunityType {
  ENGAGEMENT = "engagement",
  NARRATIVE = "narrative",
  VISUAL = "visual",
  AUDIO = "audio",
  PLATFORM = "platform",
}

// Common Types
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface FaceLandmarks {
  leftEye: Point
  rightEye: Point
  nose: Point
  mouth: Point
  leftEar?: Point
  rightEar?: Point
}

export interface Point {
  x: number
  y: number
}

export interface EmotionDetection {
  emotion: Emotion
  confidence: number
}

export enum Priority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum Severity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

export enum Impact {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  VERY_HIGH = "very_high",
}

// Classification types
export interface ContentClassification {
  primary: ClassificationResult
  secondary: ClassificationResult[]
  confidence: number
  tags: string[]
  warnings?: string[]
}

export interface ClassificationResult {
  category: string
  subcategory?: string
  confidence: number
  reasoning?: string
}

// Content Insights interface
export interface ContentInsights {
  summary: string
  highlights: string[]
  suggestions: string[]
  warnings: string[]
  opportunities: string[]
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  marketingAngles: string[]
  targetDemographics: string[]
  qualityMetrics?: QualityMetrics
  mood?: {
    dominantEmotion: string
    intensity: number
    valence: number
    arousal: number
  }
  improvements?: string[] // legacy field for compatibility
}

// Re-export key types for easier access
export type {
  ContentInsights as InsightsData,
  UnifiedContentAnalysis as UnifiedAnalysis,
  SceneAnalysis as SceneData,
  KeyFrame as FrameData,
}

