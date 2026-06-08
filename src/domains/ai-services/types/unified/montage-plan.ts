/**
 * Unified Montage Plan Types
 *
 * Объединяет типы из:
 * - features/ai-director/types/montage-plan.ts
 * - domains/ai-services/types/montage-planner.ts
 * - features/montage-planner/types/index.ts
 * - types/montage-planner-rust.ts
 *
 * Создает единый источник истины для всех модулей
 */

import type { MediaFile } from "@/domains/media-management/types"
import type { Transition } from "@/domains/video-editing/types/transitions"
import type { BaseEffect as VideoEffect } from "@/domains/video-editing/types/unified-effects"

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Unified Montage Style
 * Объединяет простой union type и сложный object style
 */
export type UnifiedMontageStyle =
  | "dynamic" // Быстрый, энергичный
  | "calm" // Спокойный, медленный
  | "balanced" // Сбалансированный
  | "cinematic" // Кинематографический
  | "vlog" // Vlog стиль
  | "highlights" // Подборка лучших моментов
  | "tutorial" // Обучающий
  | "energetic" // Энергичный (из montage-planner)

/**
 * Unified Montage Style Parameters
 * Расширенные параметры стиля монтажа
 */
export interface UnifiedMontageStyleParams {
  name: UnifiedMontageStyle
  cutting: {
    minClipDuration: number // секунды
    maxClipDuration: number // секунды
    avgClipDuration: number // секунды
    rhythm: "slow" | "medium" | "fast" | "varied"
  }
  pacing: {
    intensity: number // 0-1
    variation: number // 0-1 (насколько сильно меняется темп)
    crescendo: boolean // нарастание к концу
  }
  transitions: {
    preferredTypes: TransitionType[]
    avgDuration: number // секунды
    frequency: number // 0-1 (как часто использовать переходы)
  }
}

/**
 * Transition Types
 */
export type TransitionType =
  | "cut" // Прямая склейка
  | "cross_dissolve" // Затухание/появление
  | "fade_to_black" // Затухание в черный
  | "wipe" // Вытеснение
  | "slide" // Слайд

/**
 * Unified Transition
 */
export interface UnifiedTransition {
  type: TransitionType
  duration: number // секунды
  afterClipIndex?: number // индекс клипа, после которого применяется
  atTime?: number // время в секундах от начала монтажа
  parameters?: Record<string, unknown> // дополнительные параметры
}

// ============================================================================
// FRAGMENT & CLIP
// ============================================================================

/**
 * Person Identification
 */
export interface Person {
  id: string
  name: string
  confidence: number
}

/**
 * Moment Score - детальная оценка фрагмента
 * (из features/montage-planner)
 */
export interface MomentScore {
  timestamp: number
  duration: number
  scores: {
    visual: number // 0-100, визуальная привлекательность
    technical: number // 0-100, техническое качество
    emotional: number // 0-100, эмоциональное воздействие
    narrative: number // 0-100, нарративная ценность
    action: number // 0-100, уровень действия
    composition: number // 0-100, композиция кадра
  }
  totalScore: number // 0-100, взвешенное среднее
  category: MomentCategory
  weight?: number // 0-1, вес важности для оптимизации
  rank?: number // 1-n, ранг среди всех моментов
}

/**
 * Moment Categories
 */
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

/**
 * Fragment Analysis - простая оценка фрагмента
 * (из domains/ai-services)
 */
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

/**
 * Unified Fragment
 * Объединяет Fragment (montage-planner) и MontageClip (ai-director)
 */
export interface UnifiedFragment {
  id: string
  videoId: string
  sourceFile?: MediaFile
  filePath?: string // для совместимости с MontageClip

  // Временные характеристики
  startTime: number // секунды
  endTime: number // секунды
  duration: number // секунды

  // Визуальные данные
  screenshotPath?: string
  objects: string[] // обнаруженные объекты (YOLO)
  people: Person[] // идентифицированные люди

  // Эффекты и переходы
  transitionId?: string
  transition?: Transition | UnifiedTransition
  effectId?: string
  effect?: VideoEffect

  // Оценка и анализ (поддержка обоих форматов)
  score?: MomentScore // детальная оценка (montage-planner)
  analysis?: FragmentAnalysis // простая оценка (ai-services)
  qualityScore?: number // 0-1 (ai-director)

  // Дополнительная информация
  tags: string[]
  description?: string
  reason?: string // причина выбора (ai-director)
  metadata?: {
    hasAudio?: boolean
    hasFaces?: boolean
    hasObjects?: boolean
    mood?: string
    sceneType?: string
  }
}

export interface MontageClip {
  fileId: string
  filePath: string
  startTime: number
  endTime: number
  duration: number
  reason: string
  qualityScore?: number
  metadata?: {
    hasAudio?: boolean
    hasFaces?: boolean
    hasObjects?: boolean
    mood?: string
    sceneType?: string
  }
}

// ============================================================================
// SEQUENCES (из montage-planner)
// ============================================================================

/**
 * Sequence Type
 */
export type SequenceType = "intro" | "main" | "outro" | "transition" | "highlight"

/**
 * Sequence - группа связанных фрагментов
 */
export interface Sequence {
  id: string
  type: SequenceType
  fragments: UnifiedFragment[]
  duration: number
  startTime: number // время начала в итоговом монтаже
  endTime: number // время окончания
  description?: string
  metadata?: {
    theme?: string
    mood?: string
    energy?: number // 0-1
  }
}

// ============================================================================
// MUSIC & TEXT
// ============================================================================

/**
 * Music Settings
 */
export interface MontageMusicSettings {
  style?: string
  volume?: number // 0-1
  startTime?: number // секунды
  fadeIn?: number // секунды
  fadeOut?: number // секунды
  filePath?: string // путь к музыкальному файлу
  syncToBeats?: boolean // синхронизация с битами
}

/**
 * Text Settings
 */
export interface MontageTextSettings {
  content: string
  startTime: number // секунды в итоговом монтаже
  duration: number // секунды
  style?: "title" | "subtitle" | "caption" | "credit"
  position?: "top" | "center" | "bottom"
  fontSize?: number
  color?: string
  animation?: string
}

// ============================================================================
// UNIFIED MONTAGE PLAN
// ============================================================================

/**
 * Plan Metadata
 */
export interface PlanMetadata {
  // Статистика анализа
  analysisDuration?: number // секунды
  generationDuration?: number // секунды

  // Качество и оценка
  averageQuality: number // 0-1
  totalFragments?: number

  // Файлы
  sourceFilesCount?: number
  usedFilesCount?: number
  usagePercentage?: number

  // Дополнительная информация
  [key: string]: unknown
}

/**
 * Unified Montage Plan
 *
 * Объединяет все версии MontagePlan в единый тип с поддержкой:
 * - Legacy clips (ai-director)
 * - Modern sequences (montage-planner)
 * - Оба формата оценки (MomentScore и FragmentAnalysis)
 */
export interface UnifiedMontagePlan {
  // Основная информация
  id: string
  name: string // используем name вместо title
  title?: string // для обратной совместимости
  description?: string

  // Стиль монтажа
  style: UnifiedMontageStyle | string // поддержка строковых стилей
  styleParams?: UnifiedMontageStyleParams // расширенные параметры

  // Контент монтажа
  sequences?: Sequence[] // современный формат (montage-planner)
  clips?: UnifiedFragment[] // legacy формат (ai-director)
  fragments?: UnifiedFragment[] // альтернативное название (ai-services)

  // Длительность
  targetDuration?: number // желаемая длительность (секунды)
  totalDuration: number // фактическая длительность (секунды)
  actualDuration?: number // alias для totalDuration

  // Переходы
  transitions: UnifiedTransition[]

  // Музыка и текст
  music?: MontageMusicSettings
  musicSettings?: MontageMusicSettings // alias
  texts?: MontageTextSettings[]
  textSettings?: MontageTextSettings // alias (single text)

  // Оценка качества
  qualityScore?: number // общая оценка 0-1
  engagementScore?: number // оценка вовлеченности 0-1
  coherenceScore?: number // оценка связности 0-1

  // Метаданные
  metadata: PlanMetadata
  instructions?: string // инструкции для применения

  // Временные метки
  createdAt: Date
  updatedAt: Date

  // Версионирование
  version: number
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * План валидации
 */
export interface PlanValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  quality: number // 0-1
}

/**
 * Статистика плана
 */
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
  motionIntensity: number // средняя интенсивность движения
  faceTime: number // общее время с лицами
  objectDiversity: number // количество уникальных объектов
  audioQuality: number
}

/**
 * Запрос на создание монтажа
 */
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

/**
 * Статус создания монтажа
 */
export type MontageCreationStatus =
  | "idle"
  | "analyzing_request"
  | "selecting_clips"
  | "arranging_clips"
  | "adding_transitions"
  | "adding_music"
  | "completed"
  | "error"

/**
 * Состояние процесса создания
 */
export interface MontageCreationState {
  status: MontageCreationStatus
  progress: number // 0-100
  currentOperation?: string
  plan?: UnifiedMontagePlan
  error?: string
}
