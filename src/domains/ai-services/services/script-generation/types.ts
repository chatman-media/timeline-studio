/**
 * Script Generation Types
 */

import type { Person } from "@/features/montage-planner/types"
import type { MediaFile } from "../../types/media"

// Базовые типы для генерации сценариев
export interface ScriptGenerationConfig {
  // AI настройки
  ai: {
    model: string
    temperature: number
    maxTokens: number
    enableStreaming: boolean
  }

  // Настройки генерации
  generation: {
    includeSceneDescriptions: boolean
    includeVisualCues: boolean
    includeAudioCues: boolean
    includeTransitions: boolean
    generateDialogue: boolean
    generateVoiceover: boolean
    adaptToSceneAnalysis: boolean
  }

  // Настройки структуры
  structure: {
    defaultNarrativeType: NarrativeType
    minSceneLength: number // секунды
    maxSceneLength: number // секунды
    targetPacing: "slow" | "medium" | "fast"
  }

  // Настройки языка
  language: {
    primaryLanguage: string
    tone: "formal" | "casual" | "professional" | "creative"
    vocabulary: "simple" | "standard" | "advanced"
  }
}

export interface ScriptGenerationContext {
  analysis: SceneAnalysis[]
  metadata: VideoContextMetadata
  userPrompt?: string
  references?: ScriptReference[]
  constraints?: ScriptConstraints
  detectedPersons?: Person[]
  characters?: Character[]
  personStats?: {
    personAppearances?: Record<string, number>
    screenTimeByPerson?: Record<string, number>
  }
  targetAudience?: string
}

export interface VideoContextMetadata {
  duration: number
  title?: string
  tags?: string[]
  location?: string
  date?: Date
  description?: string
}

export interface ScriptReference {
  type: "style" | "tone" | "structure" | "content"
  value: string
  weight?: number
}

export interface ScriptConstraints {
  maxDuration?: number
  minDuration?: number
  requiredElements?: string[]
  bannedElements?: string[]
  targetRating?: "G" | "PG" | "PG-13" | "R"
}

export interface ScriptGenerationResult extends GeneratedScript {
  quality: ScriptQuality
  improvements: ScriptImprovement[]
  alternatives: ScriptAlternative[]
}

export interface ScriptQuality {
  overall: number // 0-1
  structure: number
  pacing: number
  coherence: number
  creativity: number
  audienceAppeal: number
  dialogue?: number
  characterDevelopment?: number
}

export interface ScriptImprovement {
  type: ImprovementType
  description: string
  impact: "low" | "medium" | "high"
  implementation?: string
}

export type ImprovementType =
  | "structure"
  | "pacing"
  | "dialogue"
  | "character"
  | "conflict"
  | "resolution"
  | "theme"
  | "tone"

export interface ScriptAlternative {
  id: string
  type: "different_style" | "different_structure" | "variation"
  description: string
  preview: string
  differences: string[]
}

// Narrative types
export enum NarrativeType {
  THREE_ACT = "three_act",
  FIVE_ACT = "five_act",
  HEROS_JOURNEY = "hero_journey",
  NONLINEAR = "nonlinear",
  EPISODIC = "episodic",
  CIRCULAR = "circular",
}

// Script generation params
export interface ScriptGenerationParams {
  narrativeStructure?: NarrativeType
  genre?: string[]
  tone?: EmotionalTone
  style?: ScriptStyle
  includeDialogue?: boolean
  includeVoiceover?: boolean
  targetDuration?: number
  adaptToContent?: boolean
}

export interface ScriptStyle {
  narrative?: "documentary" | "dramatic" | "comedic" | "informative" | "artistic"
  visual?: "cinematic" | "minimal" | "dynamic" | "static"
  pacing?: "slow" | "medium" | "fast" | "variable"
}

export interface EmotionalTone {
  primary: Emotion
  secondary?: Emotion
  intensity: number // 0-1
}

export enum Emotion {
  HAPPY = "happy",
  SAD = "sad",
  ANGRY = "angry",
  FEARFUL = "fearful",
  SURPRISED = "surprised",
  DISGUSTED = "disgusted",
  CALM = "calm",
  EXCITED = "excited",
  NOSTALGIC = "nostalgic",
  INSPIRATIONAL = "inspirational",
}

// Scene and Script types
export interface SceneAnalysis {
  confidence: number
  keyFrames: never[]
  id: string
  type: string
  startTime: number
  endTime: number
  duration: number
  content?: any
  description?: string
}

export interface GeneratedScript {
  id: string
  title: string
  genre: string[]
  duration: number
  structure: NarrativeStructure
  scenes: ScriptScene[]
  characters: Character[]
  dialogue: Dialogue[]
  voiceover: Voiceover[]
  metadata: ScriptMetadata
}

export interface NarrativeStructure {
  type: NarrativeType
  acts: Act[]
  turningPoints: TurningPoint[]
  climax?: TurningPoint
}

export interface Act {
  number: number
  title: string
  description: string
  scenes: string[] // scene IDs
  duration: number
}

export interface TurningPoint {
  timestamp: number
  type: TurningPointType
  description: string
  impact: number // 0-1
}

export enum TurningPointType {
  INCITING_INCIDENT = "inciting_incident",
  PLOT_POINT = "plot_point",
  MIDPOINT = "midpoint",
  CLIMAX = "climax",
  RESOLUTION = "resolution",
}

export interface ScriptScene {
  id: string
  number: number
  title: string
  description: string
  location?: string
  timeOfDay?: string
  duration: number
  type?: string
  timestamp?: number
  visualElements: VisualElement[]
  audioElements: AudioElement[]
  actions?: Action[]
  transitions?: Transition[]
  characters?: string[] // character IDs
  linkedSceneAnalysis?: any
}

export interface VisualElement {
  type: VisualElementType | string
  element?: string
  description: string
  timing?: Timing
  subjects?: string[]
}

export enum VisualElementType {
  ESTABLISHING_SHOT = "establishing_shot",
  CLOSE_UP = "close_up",
  MEDIUM_SHOT = "medium_shot",
  WIDE_SHOT = "wide_shot",
  ACTION_SHOT = "action_shot",
  REACTION_SHOT = "reaction_shot",
  CUTAWAY = "cutaway",
  INSERT = "insert",
}

export interface AudioElement {
  type: AudioElementType
  description: string
  timing?: Timing
}

export enum AudioElementType {
  DIALOGUE = "dialogue",
  VOICEOVER = "voiceover",
  MUSIC = "music",
  SOUND_EFFECT = "sound_effect",
  AMBIENT = "ambient",
}

export interface Action {
  type: "movement" | "gesture" | "interaction" | "effect"
  description: string
  subject?: string
  timing?: Timing
}

export interface Transition {
  type: "cut" | "fade" | "dissolve" | "wipe" | "match_cut"
  duration: number
  toScene?: string
}

export interface Character {
  id: string
  name: string
  role: CharacterRole
  description?: string
  traits?: string[]
  appearances: string[] // scene IDs
}

export enum CharacterRole {
  PROTAGONIST = "protagonist",
  ANTAGONIST = "antagonist",
  DEUTERAGONIST = "deuteragonist",
  SUPPORTING = "supporting",
  MINOR = "minor",
}

export interface Dialogue {
  id: string
  sceneId: string
  character: string
  text: string
  emotion?: Emotion
  timing?: Timing
}

export interface Voiceover {
  id: string
  sceneId: string
  text: string
  narrator?: string
  timing?: Timing
}

export interface Timing {
  start: number
  end: number
  duration: number
}

export interface ScriptMetadata {
  createdAt: Date
  updatedAt: Date
  version: number
  language: string
  tone: EmotionalTone
  pacing: Pacing
  style?: ScriptStyle
  targetAudience?: string
  adaptedForPersons?: boolean
  personInstructions?: string
}

export interface Pacing {
  overall: PaceType
  variations?: PaceVariation[]
}

export enum PaceType {
  SLOW = "slow",
  MODERATE = "moderate",
  FAST = "fast",
  VARIABLE = "variable",
}

export interface PaceVariation {
  startTime: number
  endTime: number
  pace: PaceType
  reason?: string
}

// Unified content analysis types (from ai-content-intelligence)
export interface UnifiedContentAnalysis {
  mediaFile: MediaFile
  scenes: any[]
}
