/**
 * Типы для экспорта переходов через FFmpeg
 */

import type { TimelineTransition } from "@/core/types/transitions"
import type { Transition } from "@/features/transitions/types/transitions"

import type { ExportSettings } from "./export-types"

/**
 * Расширенные настройки экспорта с поддержкой переходов
 */
export interface TransitionExportSettings extends ExportSettings {
  // Настройки переходов
  includeTransitions?: boolean
  transitionQuality?: "low" | "medium" | "high" | "maximum"
  transitionRenderMode?: "software" | "gpu" | "auto"
  optimizeTransitions?: boolean

  // Производительность
  transitionCacheSize?: number // MB
  parallelTransitionProcessing?: boolean
  maxConcurrentTransitions?: number

  // Совместимость
  fallbackToBasicTransitions?: boolean
  exportTransitionMetadata?: boolean

  // Отладка
  debugTransitions?: boolean
  logTransitionTiming?: boolean
}

/**
 * Информация о переходе для экспорта
 */
export interface TransitionExportInfo {
  transition: TimelineTransition
  resource: Transition
  trackId: string

  // Временные параметры
  startTime: number
  endTime: number
  duration: number

  // Клипы-участники
  sourceClipId?: string
  targetClipId?: string

  // Параметры рендеринга
  renderQuality: number
  gpuAccelerated: boolean

  // Метаданные
  shaderType: string
  customParameters: Record<string, any> // Параметры из domain типа (гибкие)
}

/**
 * Конфигурация рендеринга перехода для FFmpeg
 */
export interface FFmpegTransitionConfig {
  id: string
  type: TransitionType

  // Временные параметры
  startTime: number
  duration: number

  // Параметры эффекта
  parameters: TransitionFFmpegParameters

  // Файлы-источники
  inputA: string // Путь к исходному видео
  inputB: string // Путь к целевому видео

  // Выходной файл
  output: string

  // Настройки качества
  quality: number
  resolution: { width: number; height: number }

  // GPU ускорение
  useGpu: boolean
  gpuDevice?: string
}

/**
 * Типы переходов, поддерживаемые FFmpeg
 */
export type TransitionType =
  | "fade"
  | "dissolve"
  | "wipe_left"
  | "wipe_right"
  | "wipe_up"
  | "wipe_down"
  | "slide_left"
  | "slide_right"
  | "slide_up"
  | "slide_down"
  | "zoom_in"
  | "zoom_out"
  | "rotate_cw"
  | "rotate_ccw"
  | "circle_open"
  | "circle_close"
  | "pixelate"
  | "blur"
  | "custom"

/**
 * Параметры перехода для FFmpeg
 */
export interface TransitionFFmpegParameters {
  // Общие параметры
  intensity?: number
  direction?: "left" | "right" | "up" | "down" | "center" | "radial"

  // Размытие
  blur?: {
    enabled: boolean
    amount: number
    type: "gaussian" | "motion" | "radial"
  }

  // Цветовые эффекты
  color?: {
    enabled: boolean
    tint?: string
    saturation?: number
    brightness?: number
  }

  // Геометрические параметры
  geometry?: {
    centerX?: number
    centerY?: number
    angle?: number
    scale?: number
  }

  // Кастомные параметры для сложных переходов
  custom?: Record<string, any>
}

/**
 * Статус экспорта перехода
 */
export interface TransitionExportStatus {
  transitionId: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  startTime?: Date
  endTime?: Date
  error?: string

  // Метрики производительности
  renderTimeMs?: number
  outputSizeBytes?: number
  gpuUsed?: boolean
}

/**
 * Результат экспорта переходов
 */
export interface TransitionExportResult {
  success: boolean
  totalTransitions: number
  processedTransitions: number
  failedTransitions: TransitionExportStatus[]

  // Файлы результата
  outputPath: string
  tempFiles: string[]

  // Метрики
  totalRenderTime: number
  averageTransitionTime: number
  gpuAccelerated: boolean

  // Логи
  ffmpegLogs: string[]
  errors: string[]
  warnings: string[]
}

/**
 * Настройки оптимизации переходов
 */
export interface TransitionOptimizationSettings {
  // Кэширование
  enableTransitionCache: boolean
  cacheDirectory?: string
  maxCacheSize: number // MB

  // Пре-рендеринг
  prerenderTransitions: boolean
  prerenderQuality: number

  // Батчинг
  batchSimilarTransitions: boolean
  maxBatchSize: number

  // Параллелизм
  enableParallelProcessing: boolean
  maxWorkers: number

  // Качество vs скорость
  prioritizeSpeed: boolean
  adaptiveQuality: boolean

  // Fallback стратегии
  enableFallbacks: boolean
  fallbackToSoftware: boolean
  skipFailedTransitions: boolean
}

/**
 * Конфигурация FFmpeg команды для переходов
 */
export interface FFmpegTransitionCommand {
  // Входные параметры
  inputs: Array<{
    path: string
    options: string[]
  }>

  // Фильтры
  filterGraph: string

  // Выходные параметры
  output: {
    path: string
    options: string[]
  }

  // Дополнительные параметры
  globalOptions: string[]

  // Метаданные
  metadata: {
    transitionId: string
    transitionType: string
    duration: number
    quality: number
  }
}

/**
 * Маппинг переходов Timeline Studio -> FFmpeg
 */
export const TRANSITION_FFMPEG_MAPPING: Record<string, TransitionType> = {
  // Базовые переходы
  fade: "fade",
  dissolve: "dissolve",
  crossfade: "fade",

  // Wipe переходы
  "wipe-left": "wipe_left",
  "wipe-right": "wipe_right",
  "wipe-up": "wipe_up",
  "wipe-down": "wipe_down",

  // Slide переходы
  "slide-left": "slide_left",
  "slide-right": "slide_right",
  "slide-up": "slide_up",
  "slide-down": "slide_down",

  // Zoom переходы
  "zoom-in": "zoom_in",
  "zoom-out": "zoom_out",

  // Поворот
  rotate: "rotate_cw",
  "rotate-ccw": "rotate_ccw",

  // Геометрические
  circle: "circle_open",
  "circle-close": "circle_close",

  // Эффекты
  pixelate: "pixelate",
  blur: "blur",

  // Fallback
  "*": "fade", // Для неизвестных переходов
}

/**
 * Шаблоны FFmpeg команд для различных типов переходов
 */
export const FFMPEG_TRANSITION_TEMPLATES: Record<TransitionType, string> = {
  fade: "xfade=transition=fade:duration={duration}:offset={offset}",
  dissolve: "xfade=transition=dissolve:duration={duration}:offset={offset}",
  wipe_left: "xfade=transition=wipeleft:duration={duration}:offset={offset}",
  wipe_right: "xfade=transition=wiperight:duration={duration}:offset={offset}",
  wipe_up: "xfade=transition=wipeup:duration={duration}:offset={offset}",
  wipe_down: "xfade=transition=wipedown:duration={duration}:offset={offset}",
  slide_left: "xfade=transition=slideleft:duration={duration}:offset={offset}",
  slide_right: "xfade=transition=slideright:duration={duration}:offset={offset}",
  slide_up: "xfade=transition=slideup:duration={duration}:offset={offset}",
  slide_down: "xfade=transition=slidedown:duration={duration}:offset={offset}",
  zoom_in: "xfade=transition=fadegrays:duration={duration}:offset={offset}",
  zoom_out: "xfade=transition=fadeblack:duration={duration}:offset={offset}",
  rotate_cw: "xfade=transition=fadewhite:duration={duration}:offset={offset}",
  rotate_ccw: "xfade=transition=fadewhite:duration={duration}:offset={offset}",
  circle_open: "xfade=transition=circleopen:duration={duration}:offset={offset}",
  circle_close: "xfade=transition=circleclose:duration={duration}:offset={offset}",
  pixelate: "xfade=transition=pixelize:duration={duration}:offset={offset}",
  blur: "xfade=transition=fadeblack:duration={duration}:offset={offset}",
  custom: "xfade=transition=fade:duration={duration}:offset={offset}", // Fallback
}
