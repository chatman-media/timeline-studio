import type { MediaFile } from "./media"
import type { Transition } from "./transitions"

export type UnifiedMontageStyle =
  | "dynamic"
  | "calm"
  | "balanced"
  | "cinematic"
  | "vlog"
  | "highlights"
  | "tutorial"
  | "energetic"

export interface UnifiedMontageStyleParams {
  name: UnifiedMontageStyle
  cutting: {
    minClipDuration: number
    maxClipDuration: number
    avgClipDuration: number
    rhythm: "slow" | "medium" | "fast" | "varied"
  }
  pacing: {
    intensity: number
    variation: number
    crescendo: boolean
  }
  transitions: {
    preferredTypes: TransitionType[]
    avgDuration: number
    frequency: number
  }
}

export type TransitionType = "cut" | "cross_dissolve" | "fade_to_black" | "wipe" | "slide"

export interface UnifiedTransition {
  type: TransitionType
  duration: number
  afterClipIndex?: number
  atTime?: number
  parameters?: Record<string, unknown>
}

export interface Person {
  id: string
  name: string
  confidence: number
}

export interface MomentScore {
  timestamp: number
  duration: number
  scores: {
    visual: number
    technical: number
    emotional: number
    narrative: number
    action: number
    composition: number
  }
  totalScore: number
  category: MomentCategory
  weight?: number
  rank?: number
}

export enum MomentCategory {
  Highlight = "highlight",
  Transition = "transition",
  BRoll = "b-roll",
  Opening = "opening",
  Closing = "closing",
  Comedy = "comedy",
  Drama = "drama",
  Action = "action",
}

export interface FragmentAnalysis {
  quality: number
  motion: number
  faceCount: number
  objectsOfInterest: string[]
  audioQuality: number
  musicBeats?: number[]
  sentiment?: "positive" | "negative" | "neutral"
  duration: number
  brightnessVariation: number
  colorfulness: number
  sharpness: number
  contrast: number
  visualComplexity: number
  audioLoudness: number
  speechPresence: boolean
}

export interface UnifiedFragment {
  id: string
  videoId: string
  sourceFile?: MediaFile | string
  filePath?: string
  startTime: number
  endTime: number
  duration: number
  screenshotPath?: string
  objects: string[]
  people: Person[]
  transitionId?: string
  transition?: Transition | UnifiedTransition
  effectId?: string
  effect?: unknown
  score?: MomentScore
  analysis?: FragmentAnalysis
  qualityScore?: number
  tags: string[]
  description?: string
  reason?: string
  metadata?: {
    hasAudio?: boolean
    hasFaces?: boolean
    hasObjects?: boolean
    mood?: string
    sceneType?: string
  }
}

export interface Sequence {
  id: string
  type: SequenceType
  fragments: UnifiedFragment[]
  duration: number
  startTime: number
  endTime: number
  description?: string
  metadata?: {
    theme?: string
    mood?: string
    energy?: number
  }
}

export type SequenceType = "intro" | "main" | "outro" | "transition" | "highlight"

export interface MontageMusicSettings {
  style?: string
  volume?: number
  startTime?: number
  fadeIn?: number
  fadeOut?: number
  filePath?: string
  syncToBeats?: boolean
}

export interface MontageTextSettings {
  content: string
  startTime: number
  duration: number
  style?: "title" | "subtitle" | "caption" | "credit"
  position?: "top" | "center" | "bottom"
  fontSize?: number
  color?: string
  animation?: string
}

export interface PlanMetadata {
  analysisDuration?: number
  generationDuration?: number
  averageQuality: number
  totalFragments?: number
  sourceFilesCount?: number
  usedFilesCount?: number
  usagePercentage?: number
  [key: string]: unknown
}

export interface UnifiedMontagePlan {
  id: string
  name: string
  title?: string
  description?: string
  style: UnifiedMontageStyle | string
  styleParams?: UnifiedMontageStyleParams
  sequences?: Sequence[]
  clips?: UnifiedFragment[]
  fragments?: UnifiedFragment[]
  targetDuration?: number
  totalDuration: number
  actualDuration?: number
  transitions: UnifiedTransition[]
  music?: MontageMusicSettings
  musicSettings?: MontageMusicSettings
  texts?: MontageTextSettings[]
  textSettings?: MontageTextSettings
  qualityScore?: number
  engagementScore?: number
  coherenceScore?: number
  metadata: PlanMetadata
  instructions?: string
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface MontageRequest {
  userMessage: string
  targetDuration?: number
  style?: UnifiedMontageStyle
  parameters?: {
    addMusic?: boolean
    musicStyle?: string
    addTransitions?: boolean
    addTitles?: boolean
    minClipDuration?: number
    maxClipDuration?: number
  }
}

export type MontageCreationStatus =
  | "idle"
  | "analyzing_request"
  | "selecting_clips"
  | "arranging_clips"
  | "adding_transitions"
  | "adding_music"
  | "completed"
  | "error"

export interface MontageCreationState {
  status: MontageCreationStatus
  progress: number
  currentOperation?: string
  plan?: UnifiedMontagePlan
  error?: string
}
