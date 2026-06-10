/**
 * Subtitle types
 *
 * Template types re-exported from canonical source in video-editing domain
 */

export type {
  SubtitleAlignment,
  SubtitleAnimation,
  SubtitleAnimationType,
  SubtitleCategory,
  SubtitleCategoryInfo,
  SubtitleComplexity,
  SubtitleDirection,
  SubtitleEasing,
  SubtitleInlineStyle,
  SubtitlePosition,
  SubtitleStyleTemplate,
  SubtitleTag,
} from "@timeline-studio/core/types/subtitles"

// Import types for use in interfaces below
import type { SubtitleAnimation, SubtitleInlineStyle, SubtitlePosition } from "@timeline-studio/core/types/subtitles"

/**
 * Интерфейс для субтитра с временными метками
 */
export interface Subtitle {
  id: string // Уникальный ID субтитра
  startTime: number // Время начала (в секундах)
  endTime: number // Время окончания (в секундах)
  text: string // Текст субтитра
  style?: any // Стиль субтитра
  speaker?: string // Говорящий (если известно)
  confidence?: number // Уверенность распознавания (0-1)
  language?: string // Язык субтитра
}

/**
 * Унифицированный интерфейс для клипа субтитров на таймлайне
 * Объединяет функциональность из subtitles и timeline модулей
 * Расширяет базовый TimelineClip всеми необходимыми полями
 */
export interface SubtitleClip {
  // ============= БАЗОВЫЕ ПОЛЯ TIMELINECLIP =============
  id: string
  name: string
  type: "subtitle"

  // Связь с медиафайлом (для субтитров может быть пустым)
  mediaId: string
  mediaFile?: any // MediaFile для совместимости

  // Позиция на треке
  trackId: string
  startTime: number
  duration: number

  // Обрезка исходного медиа (для субтитров используем startTime и duration)
  mediaStartTime: number
  mediaEndTime: number
  offset: number
  mediaDuration?: number

  // J-Cut / L-Cut support (не применимо к субтитрам, но нужно для совместимости)
  audioOffset?: number
  linkedClipId?: string
  isLinked?: boolean

  // Настройки клипа (со значениями по умолчанию для субтитров)
  volume: number // 0-1 (не применимо к субтитрам, но нужно для совместимости)
  speed: number // Скорость воспроизведения
  playbackRate?: number
  maintainPitch?: boolean
  isReversed: boolean

  // Speed ramping (не применимо к субтитрам, но нужно для совместимости)
  speedRamping?: any

  // Визуальные настройки
  position?: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
    scaleX: number
    scaleY: number
  }
  opacity: number // 0-1

  // Video fade эффекты (не применимо к субтитрам, но нужно для совместимости)
  fadeIn?: {
    duration: number
    type?: "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out"
    keyframes?: any[]
  }

  fadeOut?: {
    duration: number
    type?: "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out"
    keyframes?: any[]
  }

  // Keyframes для анимации opacity
  opacityKeyframes?: any[]

  // Шаблоны (не применимо к субтитрам, но нужно для совместимости)
  templateId?: string
  templateCell?: number

  // Применяемые ресурсы (пустые массивы для субтитров)
  effects: any[]
  filters: any[]
  transitions: any[]
  styleTemplate?: any
  colorGrading?: any

  // Keyframe анимации
  keyframes?: any[]

  // Состояние
  isSelected: boolean
  isLocked: boolean

  // Метаданные
  createdAt: Date
  updatedAt: Date

  // ============= СПЕЦИФИЧНЫЕ ПОЛЯ СУБТИТРОВ =============

  // Содержание субтитра
  text: string

  // Стиль субтитра
  subtitleStyleId?: string // Ссылка на стиль из ресурсов
  style?: SubtitleInlineStyle // Inline переопределения стиля
  formatting?: SubtitleInlineStyle // Альтернативное название для совместимости

  // Позиционирование субтитра
  subtitlePosition?: SubtitlePosition

  // Анимации
  animationIn?: SubtitleAnimation
  animationOut?: SubtitleAnimation

  // Дополнительные настройки субтитров
  wordWrap?: boolean
  maxWidth?: number // Максимальная ширина в процентах
  enabled?: boolean // Включен ли субтитр

  // Дополнительные поля для совместимости
  sourceId?: string
  metadata?: Record<string, any>
}

/**
 * Результат импорта файла субтитров
 */
export interface SubtitleImportResult {
  content: string
  format: string
  file_name: string
}

/**
 * Опции экспорта субтитров
 */
export interface SubtitleExportOptions {
  format: "srt" | "vtt" | "ass"
  content: string
  output_path: string
}
