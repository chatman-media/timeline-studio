/**
 * Montage Planner Types for AI Services Domain
 *
 * Перенесено из src/features/montage-planner/types/
 */

import type { TransitionParameters, VideoEffect } from "@/domains/video-editing/types/effects"
// Import types from video-editing domain
import type { MediaFile } from "@/domains/video-editing/types/media"

// Re-export for convenience
export type Transition = TransitionParameters
export type { MediaFile, VideoEffect }

// Person identification
export interface Person {
  id: string
  name: string
  confidence: number
}

// Fragment represents a segment of video selected for the montage
export interface Fragment {
  id: string
  videoId: string
  sourceFile?: MediaFile
  startTime: number // in seconds
  endTime: number // in seconds
  duration: number
  screenshotPath?: string
  objects: string[] // detected objects from YOLO
  people: Person[] // identified people
  transitionId?: string // ID of transition to apply
  transition?: Transition
  effectId?: string // ID of effect to apply
  effect?: VideoEffect
  analysis: FragmentAnalysis
}

export interface FragmentAnalysis {
  quality: number // 0-1
  motion: number // 0-1
  faceCount: number
  objectsOfInterest: string[]
  audioQuality: number // 0-1
  musicBeats?: number[] // timestamps of detected beats
  sentiment?: "positive" | "negative" | "neutral"
  duration: number
  brightnessVariation: number // 0-1
  colorfulness: number // 0-1
  sharpness: number // 0-1
  contrast: number // 0-1
  visualComplexity: number // 0-1
  audioLoudness: number // dB
  speechPresence: boolean
}

// Complete montage plan
export interface MontagePlan {
  id: string
  title: string
  fragments: Fragment[]
  totalDuration: number
  targetDuration?: number
  style: string
  instructions: string
  createdAt: Date
  updatedAt: Date
  version: number
  metadata: {
    analysisDuration: number
    generationDuration: number
    averageQuality: number
    totalFragments: number
  }
}

// Analysis options configuration
export interface AnalysisOptions {
  enableObjectDetection: boolean
  enableFaceRecognition: boolean
  enableAudioAnalysis: boolean
  enableMotionAnalysis: boolean
  enableSentimentAnalysis: boolean
  qualityThreshold: number // minimum quality score 0-1
  maxFragmentDuration: number // in seconds
  minFragmentDuration: number // in seconds
  preferredAspectRatio?: number // width/height
}

// Plan generation options
export interface PlanGenerationOptions {
  targetDuration?: number // in seconds
  style: string // e.g., "dynamic", "calm", "energetic"
  musicSync: boolean
  transitionStyle?: string
  maxCuts: number
  prioritizeQuality: boolean
  prioritizeMotion: boolean
  prioritizeFaces: boolean
  geneticAlgorithm: {
    populationSize: number
    generations: number
    mutationRate: number
    crossoverRate: number
  }
}

// Video analysis results
export interface VideoAnalysis {
  videoId: string
  duration: number
  fragments: Fragment[]
  quality: number
  motion: number
  faces: number
  objects: string[]
  dominant_colors: string[]
  brightness: number
  contrast: number
  sharpness: number
  noise: number
  stability: number
}

// Audio analysis results
export interface AudioAnalysis {
  videoId: string
  duration: number
  averageVolume: number
  maxVolume: number
  silencePercentage: number
  speechPercentage: number
  musicPercentage: number
  beats: number[] // timestamps
  tempo?: number // BPM
  quality: number
}

// Analysis progress tracking
export enum AnalysisPhase {
  INITIALIZATION = "initialization",
  VIDEO_LOADING = "video_loading",
  OBJECT_DETECTION = "object_detection",
  FACE_RECOGNITION = "face_recognition",
  AUDIO_ANALYSIS = "audio_analysis",
  MOTION_ANALYSIS = "motion_analysis",
  FRAGMENT_SCORING = "fragment_scoring",
  PLAN_GENERATION = "plan_generation",
  PLAN_OPTIMIZATION = "plan_optimization",
  COMPLETED = "completed",
  ERROR = "error",
}

export interface AnalysisProgress {
  phase: AnalysisPhase
  videoProgress: Map<string, number> // videoId -> progress (0-1)
  overallProgress: number // 0-1
  currentVideo?: string
  estimatedTimeRemaining?: number // in seconds
  message?: string
  error?: string
}

// Moment scoring for genetic algorithm
export interface MomentScore {
  fragmentId: string
  timestamp: number
  score: number
  factors: {
    quality: number
    motion: number
    faces: number
    objects: number
    audio: number
    uniqueness: number
  }
}

// Plan validation results
export interface PlanValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  quality: number // overall quality score 0-1
}

// Plan statistics
export interface PlanStatistics {
  totalDuration: number
  averageFragmentDuration: number
  fragmentCount: number
  transitionCount: number
  averageQuality: number
  qualityDistribution: {
    low: number // 0-0.3
    medium: number // 0.3-0.7
    high: number // 0.7-1.0
  }
  motionIntensity: number // average motion
  faceTime: number // total time with faces visible
  objectDiversity: number // unique objects count
  audioQuality: number
}
