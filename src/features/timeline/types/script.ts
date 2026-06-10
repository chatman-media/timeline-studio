/**
 * Script/Storyboard панель типы
 * Сценарий монтажа между Analysis и Timeline
 */

import type { MediaFile } from "@/core/types"

/**
 * План монтажа (сценарий/раскадровка)
 */
export interface ScriptPlan {
  /** Уникальный ID плана */
  id: string
  /** Название плана */
  name: string
  /** Целевая длительность в секундах */
  targetDuration: number
  /** Стиль монтажа */
  style: MontageStyle
  /** Сцены в плане */
  scenes: ScriptScene[]
  /** Настройки генерации */
  settings: PlanSettings
  /** Статистика плана */
  stats: PlanStats
  /** Дата создания */
  createdAt: Date
  /** Дата последнего изменения */
  updatedAt: Date
}

/**
 * Сцена в плане монтажа
 */
export interface ScriptScene {
  /** Уникальный ID сцены */
  id: string
  /** Порядковый номер в плане */
  order: number
  /** ID фрагмента из анализа */
  fragmentId: string
  /** Время начала в исходном файле (секунды) */
  startTime: number
  /** Время окончания в исходном файле (секунды) */
  endTime: number
  /** Длительность сцены (секунды) */
  duration: number
  /** Тип перехода к следующей сцене */
  transition: TransitionType
  /** Заметки к сцене */
  notes?: string
  /** Привязанный аудио трек */
  musicTrack?: string
  /** Примененные эффекты */
  effects?: string[]
}

/**
 * Фрагмент из AI анализа для библиотеки
 */
export interface ScriptFragment {
  /** Уникальный ID фрагмента */
  id: string
  /** ID файла из которого фрагмент */
  fileId: string
  /** Медиа файл */
  file?: MediaFile
  /** Время начала (секунды) */
  startTime: number
  /** Время окончания (секунды) */
  endTime: number
  /** Длительность (секунды) */
  duration: number
  /** Путь к превью кадру */
  thumbnail?: string
  /** Оценка качества (0-100) */
  qualityScore: number
  /** Теги сцены */
  tags: string[]
  /** Эмоции (happy, exciting, calm, etc.) */
  emotions: string[]
  /** Объекты на сцене */
  objects: string[]
  /** Количество лиц */
  facesCount?: number
}

/**
 * Настройки генерации плана
 */
export interface PlanSettings {
  /** Приоритет качества видео */
  prioritizeQuality: boolean
  /** Приоритет эмоциональной вовлеченности */
  prioritizeEngagement: boolean
  /** Синхронизация с музыкой */
  syncWithMusic: boolean
  /** Включать сцены с лицами */
  includeFaces: boolean
  /** Включать динамичные сцены */
  includeDynamic: boolean
  /** Уровень темпа (0-100, медленный-быстрый) */
  paceLevel: number
  /** Сложность переходов (0-100, простые-сложные) */
  transitionComplexity: number
}

/**
 * Статистика плана
 */
export interface PlanStats {
  /** Количество сцен */
  totalScenes: number
  /** Количество переходов */
  totalTransitions: number
  /** Общая длительность (секунды) */
  totalDuration: number
  /** Оценка качества (0-100) */
  qualityScore: number
  /** Оценка вовлеченности (0-100) */
  engagementScore: number
  /** Оценка связности (0-100) */
  coherenceScore: number
}

/**
 * Типы переходов между сценами
 */
export type TransitionType = "CUT" | "FADE" | "DISSOLVE" | "WIPE" | "SLIDE" | "ZOOM"

/**
 * Стили монтажа
 */
export type MontageStyle =
  | "dynamic-action"
  | "cinematic-drama"
  | "music-video"
  | "documentary"
  | "social-media"
  | "corporate"

/**
 * Режимы отображения раскадровки
 */
export type StoryboardViewMode = "cards" | "timeline" | "grid"

/**
 * Фильтры для библиотеки фрагментов
 */
export interface FragmentFilters {
  /** Минимальная оценка качества */
  minQuality?: number
  /** Эмоции для фильтра */
  emotions?: string[]
  /** Теги для фильтра */
  tags?: string[]
  /** Минимальная длительность */
  minDuration?: number
  /** Максимальная длительность */
  maxDuration?: number
  /** Только с лицами */
  onlyWithFaces?: boolean
}
