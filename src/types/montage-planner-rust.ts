/**
 * TypeScript types for Montage Planner Rust commands
 * Generated manually from src-tauri/src/montage_planner/types.rs
 *
 * These types correspond to the Rust backend and are used with Tauri invoke commands
 */

// ============================================================================
// Enums
// ============================================================================

export enum MomentCategory {
  Action = "Action",
  Drama = "Drama",
  Comedy = "Comedy",
  Transition = "Transition",
  Highlight = "Highlight",
  Opening = "Opening",
  Closing = "Closing",
  BRoll = "BRoll",
}

export enum MontageStyle {
  DynamicAction = "DynamicAction",
  CinematicDrama = "CinematicDrama",
  MusicVideo = "MusicVideo",
  Documentary = "Documentary",
  SocialMedia = "SocialMedia",
  Corporate = "Corporate",
  Travel = "Travel",
  Wedding = "Wedding",
}

export enum TransitionType {
  Cut = "Cut",
  Fade = "Fade",
  Dissolve = "Dissolve",
  Wipe = "Wipe",
  Slide = "Slide",
  Zoom = "Zoom",
  Spin = "Spin",
}

export enum EasingType {
  Linear = "Linear",
  EaseIn = "EaseIn",
  EaseOut = "EaseOut",
  EaseInOut = "EaseInOut",
  Bounce = "Bounce",
}

// ============================================================================
// Core Types
// ============================================================================

/** Detailed scoring for moments */
export interface MomentScores {
  visual: number // 0-100: visual appeal
  technical: number // 0-100: technical quality
  emotional: number // 0-100: emotional impact
  narrative: number // 0-100: narrative value
  action: number // 0-100: action level
  composition: number // 0-100: frame composition
}

/** Moment detection result for montage planning */
export interface DetectedMoment {
  timestamp: number
  duration: number
  category: MomentCategory
  scores: MomentScores
  total_score: number
  description: string
  tags: string[]
}

/** Analysis options for montage planning */
export interface AnalysisOptions {
  enable_object_detection: boolean
  enable_face_detection: boolean
  enable_emotion_analysis: boolean
  enable_composition_analysis: boolean
  enable_audio_analysis: boolean
  frame_sample_rate: number // frames per second to analyze
  quality_threshold: number // minimum quality for inclusion
  max_moments?: number | null // limit number of detected moments
  frame_sampling_rate: number // frames per second sampling rate
}

/** Montage analysis result (simplified from ComprehensiveAnalysisResult) */
export interface MontageAnalysisResult {
  video_id: string
  duration: number
  quality_score: number
  motion_score: number
  faces_detected: number
  objects_detected: string[]
  audio_quality: number
  key_moments: DetectedMoment[]
  analysis_id: string
}

/** Quality distribution stats */
export interface QualityDistribution {
  low: number // 0-0.3
  medium: number // 0.3-0.7
  high: number // 0.7-1.0
}

/** Plan statistics */
export interface PlanStatistics {
  total_duration: number
  average_fragment_duration: number
  fragment_count: number
  transition_count: number
  average_quality: number
  quality_distribution: QualityDistribution
  motion_intensity: number
  face_time: number
  object_diversity: number
  audio_quality: number
}

/** Plan validation result */
export interface PlanValidation {
  is_valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  quality: number // overall quality score 0-1
}

/** Color correction parameters */
export interface ColorCorrection {
  brightness: number // -100 to 100
  contrast: number // -100 to 100
  saturation: number // -100 to 100
  hue: number // -180 to 180
}

/** Crop region definition */
export interface CropRegion {
  x: number // 0-1 (percentage)
  y: number // 0-1 (percentage)
  width: number // 0-1 (percentage)
  height: number // 0-1 (percentage)
}

/** Adjustments to apply to a clip */
export interface ClipAdjustments {
  speed_multiplier?: number | null
  color_correction?: ColorCorrection | null
  stabilization: boolean
  crop?: CropRegion | null
  fade_in?: number | null
  fade_out?: number | null
}

/** Individual clip in montage plan */
export interface MontageClip {
  id: string
  source_file: string
  start_time: number
  end_time: number
  duration: number
  moment: DetectedMoment
  adjustments: ClipAdjustments
  order: number
}

/** Transition between clips */
export interface TransitionPlan {
  from_clip: string
  to_clip: string
  transition_type: TransitionType
  duration: number
  easing: EasingType
}

/** Generated montage plan */
export interface MontagePlan {
  id: string
  name: string
  style: MontageStyle
  total_duration: number
  clips: MontageClip[]
  transitions: TransitionPlan[]
  quality_score: number
  engagement_score: number
  created_at: string
}

// ============================================================================
// Helper Types for Tauri Commands
// ============================================================================

/** Input for analyze_montage_videos command */
export interface AnalyzeMontageVideosInput {
  videoIds: string[]
  options: AnalysisOptions
}

/** Input for optimize_montage_plan command */
export interface OptimizeMontagePlanInput {
  plan: MontagePlan
  preferences: Record<string, unknown>
}

/** Input for validate_montage_plan command */
export interface ValidateMontagePlanInput {
  plan: MontagePlan
}

/** Input for calculate_plan_statistics command */
export interface CalculatePlanStatisticsInput {
  plan: MontagePlan
}

// ============================================================================
// Type Guards
// ============================================================================

export function isMomentCategory(value: string): value is MomentCategory {
  return Object.values(MomentCategory).includes(value as MomentCategory)
}

export function isMontageStyle(value: string): value is MontageStyle {
  return Object.values(MontageStyle).includes(value as MontageStyle)
}

export function isTransitionType(value: string): value is TransitionType {
  return Object.values(TransitionType).includes(value as TransitionType)
}

export function isEasingType(value: string): value is EasingType {
  return Object.values(EasingType).includes(value as EasingType)
}
