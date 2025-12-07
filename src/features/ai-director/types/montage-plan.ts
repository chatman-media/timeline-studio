/**
 * AI Montage Plan Types
 * Структура плана монтажа, создаваемого AI Director
 *
 * LEGACY: Этот файл deprecated, типы мигрированы в domains/ai-services/types/unified
 * Сохранен для обратной совместимости с реэкспортом из unified
 */

// Re-export unified types as legacy types
export type {
  UnifiedMontageStyle as MontageStyle,
  UnifiedMontagePlan as MontagePlan,
  TransitionType,
  MontageMusicSettings,
  MontageTextSettings,
} from "@/domains/ai-services/types/unified"

// Legacy clip type - map to UnifiedFragment
import type { UnifiedFragment } from "@/domains/ai-services/types/unified"

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

// DEPRECATED BELOW - kept for compatibility only
// Use UnifiedMontageStyle from unified types instead

/**
 * @deprecated Use UnifiedMontageStyle from @/domains/ai-services/types/unified
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
