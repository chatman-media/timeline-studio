// Script Generation Types

import type { EmotionalTone, Genre, SceneAnalysis } from "./content-analysis"

// Script Types
export interface GeneratedScript {
  id: string
  title: string
  genre: Genre[]
  duration: number
  structure: NarrativeStructure
  scenes: ScriptScene[]
  characters?: Character[]
  dialogue?: Dialogue[]
  voiceover?: Voiceover[]
  metadata: ScriptMetadata
}

export interface NarrativeStructure {
  type: NarrativeType
  acts: Act[]
  turningPoints: TurningPoint[]
  climax?: Climax
  resolution?: ScriptResolution
}

export enum NarrativeType {
  THREE_ACT = "three_act",
  FIVE_ACT = "five_act",
  HEROS_JOURNEY = "heros_journey",
  NONLINEAR = "nonlinear",
  EPISODIC = "episodic",
  CIRCULAR = "circular",
  LINEAR = "LINEAR",
}

export interface Act {
  number: number
  title: string
  description: string
  scenes: string[] // Scene IDs
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
  CRISIS = "crisis",
  CLIMAX = "climax",
  RESOLUTION = "resolution",
}

export interface Climax {
  timestamp: number
  duration: number
  description: string
  emotionalPeak: number // 0-1
}

export interface ScriptResolution {
  timestamp: number
  type: ResolutionType
  description: string
}

export enum ResolutionType {
  HAPPY = "happy",
  SAD = "sad",
  OPEN = "open",
  TWIST = "twist",
  AMBIGUOUS = "ambiguous",
}

// Script Scenes
export interface ScriptScene {
  id: string
  number: number
  title: string
  description: string
  location?: string
  timeOfDay?: TimeOfDay | string
  duration: number
  visualElements: VisualElement[]
  audioElements: AudioElement[]
  actions?: Action[]
  transitions?: ScriptTransition[]
  linkedSceneAnalysis?: SceneAnalysis
  // Дополнительные поля для работы движка
  type?: string // Тип сцены
  timestamp?: number // Временная метка начала сцены
  characters?: SceneCharacter[] // Персонажи в сцене
  voiceover?: string // Текст закадрового голоса
}

export interface SceneCharacter {
  id: string
  name: string
  role?: string
}

export enum TimeOfDay {
  DAWN = "dawn",
  MORNING = "morning",
  DAY = "day",
  AFTERNOON = "afternoon",
  DUSK = "dusk",
  NIGHT = "night",
}

export interface VisualElement {
  type: VisualElementType | string
  description: string
  timing?: ScriptTiming
  importance?: ScriptImportance
  subjects?: string[] // Список субъектов в элементе
}

export enum VisualElementType {
  ESTABLISHING_SHOT = "establishing_shot",
  CLOSE_UP = "close_up",
  MEDIUM_SHOT = "medium_shot",
  WIDE_SHOT = "wide_shot",
  OVER_SHOULDER = "over_shoulder",
  POV = "pov",
  CUTAWAY = "cutaway",
  INSERT = "insert",
  ACTION_SHOT = "action_shot",
  ACTION = "action",
  DETAIL_SHOT = "detail_shot",
}

export interface AudioElement {
  type: AudioElementType | string
  description: string
  timing?: ScriptTiming
  volume?: VolumeLevel
}

export enum AudioElementType {
  DIALOGUE = "dialogue",
  VOICEOVER = "voiceover",
  MUSIC = "music",
  SOUND_EFFECT = "sound_effect",
  AMBIENCE = "ambience",
  SILENCE = "silence",
}

export interface Action {
  description: string
  character?: string
  timing: ScriptTiming
}

export interface ScriptTransition {
  type: ScriptTransitionType
  to: string // Scene ID
  description?: string
}

export enum ScriptTransitionType {
  CUT_TO = "cut_to",
  FADE_TO = "fade_to",
  DISSOLVE_TO = "dissolve_to",
  MATCH_CUT = "match_cut",
  JUMP_CUT = "jump_cut",
  SMASH_CUT = "smash_cut",
  IRIS = "iris",
  WIPE = "wipe",
}

// Characters and Dialogue
export interface Character {
  id: string
  name: string
  role: CharacterRole
  description?: string
  appearances: CharacterAppearance[]
}

export enum CharacterRole {
  PROTAGONIST = "protagonist",
  ANTAGONIST = "antagonist",
  SUPPORTING = "supporting",
  MINOR = "minor",
  NARRATOR = "narrator",
}

export interface CharacterAppearance {
  sceneId: string
  timestamp: number
  duration: number
}

export interface Dialogue {
  id: string
  sceneId: string
  character: string
  text: string
  timing: ScriptTiming
  emotion?: EmotionalTone
  direction?: string
}

export interface Voiceover {
  id: string
  sceneId: string
  narrator?: string
  text: string
  timing: ScriptTiming
  style: VoiceoverStyle
}

export enum VoiceoverStyle {
  NARRATIVE = "narrative",
  DOCUMENTARY = "documentary",
  POETIC = "poetic",
  CONVERSATIONAL = "conversational",
  DRAMATIC = "dramatic",
  INSTRUCTIONAL = "instructional",
}

// Script Metadata
export interface ScriptMetadata {
  createdAt: Date
  updatedAt: Date
  version: number
  language: string
  targetAudience?: string
  tone: EmotionalTone
  pacing: Pacing
  style: ScriptStyle
  adaptedForPersons?: boolean
  personInstructions?: string
  detectedPersonsCount?: number
}

export interface Pacing {
  overall: PaceType
  variations: PaceVariation[]
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

export interface ScriptStyle {
  visual: VisualStyle
  narrative: NarrativeStyle
  editing: EditingStyle
}

export enum VisualStyle {
  CINEMATIC = "cinematic",
  DOCUMENTARY = "documentary",
  MINIMALIST = "minimalist",
  DYNAMIC = "dynamic",
  ARTISTIC = "artistic",
  REALISTIC = "realistic",
}

export enum NarrativeStyle {
  LINEAR = "linear",
  NONLINEAR = "nonlinear",
  STREAM_OF_CONSCIOUSNESS = "stream_of_consciousness",
  MONTAGE = "montage",
  PARALLEL = "parallel",
}

export enum EditingStyle {
  CONTINUITY = "continuity",
  MONTAGE = "montage",
  JUMP_CUT = "jump_cut",
  CROSS_CUTTING = "cross_cutting",
  MATCH_CUT = "match_cut",
}

// Script Generation Parameters
export interface ScriptGenerationParams {
  style: ScriptStyle
  genre: Genre[]
  duration?: number
  targetAudience?: string
  tone?: EmotionalTone
  includeDialogue?: boolean
  includeVoiceover?: boolean
  narrativeStructure?: NarrativeType
  customPrompt?: string
}

// Script Templates
export interface ScriptTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  structure: NarrativeStructure
  defaultParams: ScriptGenerationParams
  examples?: string[]
}

export enum TemplateCategory {
  FILM = "film",
  DOCUMENTARY = "documentary",
  COMMERCIAL = "commercial",
  EDUCATIONAL = "educational",
  SOCIAL_MEDIA = "social_media",
  CORPORATE = "corporate",
  WEDDING = "wedding",
  TRAVEL = "travel",
  VLOG = "vlog",
}

// Common Types
export interface ScriptTiming {
  start: number
  end: number
  duration: number
}

export enum ScriptImportance {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum VolumeLevel {
  MUTE = "mute",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  MAX = "max",
}
