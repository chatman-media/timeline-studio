/**
 * Unified Effects System - Единая архитектура эффектов
 * Вдохновлена DaVinci Resolve и Filmora
 */

// ============================================================================
// ОСНОВНЫЕ КАТЕГОРИИ ЭФФЕКТОВ (как в профессиональных NLE)
// ============================================================================

export type EffectCategory =
  // Color
  | "color_correction" // Базовая цветокоррекция (Lift/Gamma/Gain)
  | "color_grading" // Профессиональная цветокоррекция (Color Wheels)
  | "color_match" // Сопоставление цветов
  | "luts" // Look-Up Tables

  // Blur & Sharpen
  | "blur_sharpen" // Размытие и резкость

  // Stylize
  | "stylize" // Стилизация (винтаж, кинематограф)

  // Distort
  | "distort" // Искажения (lens distortion, fisheye)

  // Light
  | "lighting" // Освещение (glow, flare, vignette)

  // Noise & Grain
  | "noise_grain" // Шум и зерно

  // Transform
  | "transform" // Геометрические преобразования

  // Keying
  | "keying" // Хромакей и кеинг

  // Motion
  | "motion" // Движение (stabilization, motion blur)

  // Temporal
  | "temporal" // Временные эффекты (speed, reverse, echo)

  // Audio
  | "audio_effects" // Аудио эффекты

  // Text & Graphics
  | "text_graphics" // Текст и графика

  // Transitions
  | "transitions" // Переходы

// ============================================================================
// ТИПЫ ЭФФЕКТОВ ПО ОБЛАСТИ ПРИМЕНЕНИЯ
// ============================================================================

export type EffectScope =
  | "clip" // Применяется к клипу
  | "track" // Применяется к треку
  | "sequence" // Применяется к последовательности
  | "global" // Глобальный эффект

export type EffectProcessingType =
  | "realtime" // Real-time обработка (GPU/WebGL)
  | "render" // Требует рендеринга (CPU/FFmpeg)
  | "hybrid" // Комбинированная обработка

// ============================================================================
// ПАРАМЕТРЫ ЭФФЕКТОВ
// ============================================================================

export type ParameterType =
  | "number" // Число (slider)
  | "boolean" // Переключатель
  | "color" // Цвет
  | "point" // Точка (x, y)
  | "angle" // Угол
  | "dropdown" // Выпадающий список
  | "file" // Файл (LUT, изображение)
  | "text" // Текст
  | "keyframes" // Ключевые кадры

export interface EffectParameter {
  id: string
  name: {
    en: string
    ru: string
    [key: string]: string
  }
  type: ParameterType

  // Значения
  defaultValue: any
  currentValue?: any

  // Ограничения для числовых параметров
  min?: number
  max?: number
  step?: number
  unit?: string // px, %, deg, etc.

  // Опции для dropdown
  options?: Array<{
    value: any
    label: {
      en: string
      ru: string
      [key: string]: string
    }
  }>

  // Группировка параметров
  group?: string

  // Видимость и доступность
  visible?: boolean
  enabled?: boolean

  // Анимация
  animatable?: boolean
  keyframes?: EffectKeyframe[]
}

export interface EffectKeyframe {
  time: number // Время в секундах
  value: any // Значение параметра
  interpolation?: "linear" | "bezier" | "ease" | "hold"

  // Для безье интерполяции
  inTangent?: { x: number; y: number }
  outTangent?: { x: number; y: number }
}

// ============================================================================
// ОСНОВНАЯ СТРУКТУРА ЭФФЕКТА
// ============================================================================

export interface BaseEffect {
  // Идентификация
  id: string
  name: {
    en: string
    ru: string
    [key: string]: string
  }
  description?: {
    en: string
    ru: string
    [key: string]: string
  }

  // Классификация
  category: EffectCategory
  scope: EffectScope[]
  processingType: EffectProcessingType

  // Версия и совместимость
  version: string
  minVersion?: string // Минимальная версия Timeline Studio

  // Метаданные
  tags: string[]
  author?: string
  license?: string

  // Производительность
  complexity: "low" | "medium" | "high" | "extreme"
  gpuAccelerated: boolean

  // Параметры
  parameters: EffectParameter[]

  // Пресеты
  presets: EffectPreset[]

  // Превью
  thumbnail?: string
  preview?: string // Видео превью

  // Обработчики
  processors: {
    webgl?: WebGLProcessor
    css?: CSSProcessor
    ffmpeg?: FFmpegProcessor
    canvas?: CanvasProcessor
  }
}

// ============================================================================
// ПРОЦЕССОРЫ ЭФФЕКТОВ
// ============================================================================

export interface WebGLProcessor {
  vertexShader?: string
  fragmentShader: string
  uniforms: Record<string, any>
  textures?: string[]
}

export interface CSSProcessor {
  filter: (params: Record<string, any>) => string
  transform?: (params: Record<string, any>) => string
  additionalStyles?: (params: Record<string, any>) => Record<string, string>
}

export interface FFmpegProcessor {
  filter: (params: Record<string, any>) => string
  complex?: boolean // Требует complex filter graph
  inputs?: number // Количество входных потоков
}

export interface CanvasProcessor {
  process: (ctx: CanvasRenderingContext2D, params: Record<string, any>, frame: ImageData) => ImageData
}

// ============================================================================
// ПРЕСЕТЫ И ШАБЛОНЫ
// ============================================================================

export interface EffectPreset {
  id: string
  name: {
    en: string
    ru: string
    [key: string]: string
  }
  description?: {
    en: string
    ru: string
    [key: string]: string
  }

  // Значения параметров
  parameters: Record<string, any>

  // Метаданные
  thumbnail?: string
  tags: string[]
  category?: string // Подкатегория пресета

  // Пользовательский пресет
  isUserPreset?: boolean
  createdAt?: Date
  modifiedAt?: Date
}

// ============================================================================
// ПРИМЕНЕНИЕ ЭФФЕКТОВ
// ============================================================================

export interface AppliedEffect {
  // Идентификация
  id: string // Уникальный ID применения
  effectId: string // ID базового эффекта

  // Таймлайн
  startTime: number // Начало в секундах
  duration?: number // Длительность (undefined = до конца клипа)

  // Параметры
  parameters: Record<string, any>

  // Состояние
  enabled: boolean
  order: number // Порядок в стеке эффектов

  // Анимация
  keyframes: Record<string, EffectKeyframe[]> // ID параметра -> ключевые кадры

  // Маски (аналогично DaVinci Resolve)
  masks: EffectMask[]

  // Режим наложения
  blendMode: BlendMode
  opacity: number // 0-1

  // Метаданные
  label?: string // Пользовательская метка
  color?: string // Цвет для визуального различения
  notes?: string // Заметки пользователя

  // Версии
  effectVersion: string // Версия эффекта на момент применения
  createdAt: Date
  modifiedAt: Date
}

// ============================================================================
// МАСКИ И РЕЖИМЫ НАЛОЖЕНИЯ
// ============================================================================

export interface EffectMask {
  id: string
  name: string

  // Тип маски
  type: "rectangle" | "ellipse" | "polygon" | "bezier" | "freehand" | "gradient"

  // Геометрия
  points: Array<{ x: number; y: number }>

  // Свойства
  feather: number // Растушевка
  opacity: number // Непрозрачность маски
  invert: boolean // Инвертировать маску

  // Анимация маски
  keyframes: Record<string, EffectKeyframe[]>
}

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "soft_light"
  | "hard_light"
  | "color_dodge"
  | "color_burn"
  | "darken"
  | "lighten"
  | "difference"
  | "exclusion"

// ============================================================================
// СТЕК ЭФФЕКТОВ (как в DaVinci Resolve)
// ============================================================================

export interface EffectStack {
  id: string
  name?: string

  // Применённые эффекты в порядке выполнения
  effects: AppliedEffect[]

  // Группы эффектов
  groups: EffectGroup[]

  // Общие настройки
  enabled: boolean
  collapsed?: boolean
}

export interface EffectGroup {
  id: string
  name: string
  effectIds: string[] // ID эффектов в группе

  // Состояние группы
  enabled: boolean
  collapsed: boolean

  // Групповые операции
  opacity: number
  blendMode: BlendMode
}

// ============================================================================
// СИСТЕМА КЕШИРОВАНИЯ
// ============================================================================

export interface EffectCache {
  // Параметры кеширования
  maxMemoryMB: number
  maxDiskMB: number

  // Стратегия
  strategy: "memory" | "disk" | "hybrid"

  // Статистика
  hits: number
  misses: number
  evictions: number
}

// ============================================================================
// ЭКСПОРТ И ИМПОРТ
// ============================================================================

export interface EffectExportData {
  version: string
  effects: BaseEffect[]
  presets: EffectPreset[]
  metadata: {
    exportedAt: Date
    exportedBy?: string
    description?: string
  }
}

export interface EffectImportData {
  version: string
  effects: BaseEffect[]
  presets: EffectPreset[]
  metadata: {
    importedAt: Date
    importedBy?: string
    description?: string
  }
}

// ============================================================================
// СОБЫТИЯ И КОЛБЕКИ
// ============================================================================

export type EffectEventType =
  | "parameter_changed"
  | "effect_applied"
  | "effect_removed"
  | "preset_applied"
  | "keyframe_added"
  | "keyframe_removed"
  | "mask_added"
  | "mask_removed"

export interface EffectEvent {
  type: EffectEventType
  effectId: string
  appliedEffectId?: string
  parameterId?: string
  oldValue?: any
  newValue?: any
  timestamp: Date
}

export type EffectEventCallback = (event: EffectEvent) => void
