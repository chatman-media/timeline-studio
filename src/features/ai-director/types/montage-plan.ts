/**
 * AI Montage Plan Types
 * Структура плана монтажа, создаваемого AI Director
 *
 * LEGACY: Этот файл deprecated, типы мигрированы в core/types/unified-montage
 * Сохранен для обратной совместимости с реэкспортом из unified
 */

// Re-export unified types as legacy types
export type {
  MontageMusicSettings,
  MontageTextSettings,
  TransitionType,
  UnifiedMontagePlan as MontagePlan,
  UnifiedMontageStyle as MontageStyle,
} from "@/core/types/unified-montage"

// Import types for local use
import type {
  UnifiedMontagePlan as MontagePlan,
  UnifiedMontageStyle as MontageStyle,
  TransitionType,
} from "@/core/types/unified-montage"

// Legacy clip type - kept for backward compatibility
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

// Helper functions to convert between legacy and unified types
import type { UnifiedFragment } from "@/core/types/unified-montage"

/**
 * Converts UnifiedFragment to legacy MontageClip
 */
export function fragmentToClip(fragment: UnifiedFragment): MontageClip {
  return {
    fileId: fragment.videoId,
    filePath: fragment.filePath || "",
    startTime: fragment.startTime,
    endTime: fragment.endTime,
    duration: fragment.duration,
    reason: fragment.reason || fragment.description || "",
    qualityScore: fragment.qualityScore || fragment.analysis?.quality,
    metadata: fragment.metadata,
  }
}

/**
 * Converts legacy MontageClip to UnifiedFragment
 */
export function clipToFragment(clip: MontageClip): UnifiedFragment {
  return {
    id: `${clip.fileId}-${clip.startTime}`,
    videoId: clip.fileId,
    filePath: clip.filePath,
    startTime: clip.startTime,
    endTime: clip.endTime,
    duration: clip.duration,
    objects: [],
    people: [],
    tags: [],
    reason: clip.reason,
    qualityScore: clip.qualityScore,
    metadata: clip.metadata,
  }
}

// DEPRECATED BELOW - kept for compatibility only
// Use UnifiedMontageStyle from unified types instead

/**
 * @deprecated Use UnifiedMontageStyle from @/core/types/unified-montage
 */
export type _LegacyMontageStyle =
  | "dynamic" // Быстрый, энергичный
  | "calm" // Спокойный, медленный
  | "balanced" // Сбалансированный
  | "cinematic" // Кинематографический
  | "vlog" // Vlog стиль
  | "highlights" // Подборка лучших моментов
  | "tutorial" // Обучающий

// Legacy transition type - kept for backward compatibility
export interface MontageTransition {
  type: TransitionType
  duration: number
  afterClipIndex?: number
  atTime?: number
}

/**
 * Запрос на создание монтажа от пользователя
 */
export interface MontageRequest {
  /** Текст запроса пользователя */
  userMessage: string
  /** Целевая длительность (если указана) */
  targetDuration?: number
  /** Предпочитаемый стиль */
  style?: MontageStyle
  /** Дополнительные параметры */
  parameters?: {
    /** Добавить музыку */
    addMusic?: boolean
    /** Стиль музыки */
    musicStyle?: string
    /** Добавить переходы */
    addTransitions?: boolean
    /** Добавить титры */
    addTitles?: boolean
    /** Минимальная длина клипа (секунды) */
    minClipDuration?: number
    /** Максимальная длина клипа (секунды) */
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
 * Состояние процесса создания монтажа
 */
export interface MontageCreationState {
  /** Текущий статус */
  status: MontageCreationStatus
  /** Прогресс (0-100) */
  progress: number
  /** Текущая операция */
  currentOperation?: string
  /** План монтажа (когда готов) */
  plan?: MontagePlan
  /** Ошибка (если есть) */
  error?: string
}
