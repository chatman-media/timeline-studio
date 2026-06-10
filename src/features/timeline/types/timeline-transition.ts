/**
 * Timeline Transition Types
 * Продвинутая система переходов как отдельных объектов на таймлайне
 */

import type { TimelineTransitionBase } from "@timeline-studio/core/types"
import type { EasingFunction } from "../../video-player/services/transitions-preview"

/**
 * Переход как отдельный объект на таймлайне
 * Использует базовый domain тип с более строгими параметрами TransitionParameters
 */
export interface TimelineTransition extends Omit<TimelineTransitionBase<TransitionParameters>, "keyframes" | "curve"> {
  // Keyframes с расширенным типом
  keyframes: TransitionKeyframe[]

  // Кривая перехода (обязательная в feature типе)
  curve: TransitionCurve

  // Дополнительные поля feature типа
  renderCache?: RenderCacheInfo
}

/**
 * Расширенные параметры перехода
 */
export interface TransitionParameters {
  // Базовые параметры (совместимо с текущими)
  direction?: "left" | "right" | "up" | "down" | "center" | "radial"
  easing?: EasingFunction
  intensity?: number
  scale?: number
  smoothness?: number

  // Новые параметры
  blur?: {
    enabled?: boolean
    amount: number // 0-100
    type: "gaussian" | "motion" | "radial"
    quality?: "low" | "medium" | "high"
  }

  color?: {
    enabled?: boolean
    tint?: string // Hex color
    saturation?: number // -100 to 100
    brightness?: number // -100 to 100
    contrast?: number // -100 to 100
    temperature?: number // -100 to 100 (cold to warm)
  }

  mask?: {
    shape: "rectangle" | "circle" | "polygon" | "custom"
    feather: number // 0-100
    invert: boolean
    customPath?: string // SVG path for custom shape
  }

  // 3D параметры
  perspective?: {
    rotationX: number // degrees
    rotationY: number // degrees
    rotationZ: number // degrees
    depth: number // 0-1000
    vanishingPoint?: { x: number; y: number } // normalized 0-1
  }

  // Динамические параметры
  particles?: {
    count: number // 10-10000
    size: number // 1-100
    speed: number // 0-10
    gravity: number // -10 to 10
    turbulence?: number // 0-10
    color?: string // Hex color
    emissionShape?: "point" | "line" | "circle" | "rectangle"
  }

  // Glitch параметры
  glitch?: {
    intensity: number // 0-100
    frequency: number // 0-100
    rgbSplit: number // 0-50
    scanLines: boolean
    noiseAmount: number // 0-100
    blockSize?: number // 1-50
  }
}

/**
 * Keyframe для анимации параметров
 * Расширяет базовый TimelineKeyframe с дополнительными полями
 */
export interface TransitionKeyframe {
  id: string
  time: number // 0-1 нормализованное время относительно длительности перехода
  property: string // Совместимо с TimelineKeyframe.property
  parameter?: string // Дополнительное поле: путь к параметру (e.g., "blur.amount", "color.brightness")
  value: any // Значение параметра
  interpolation: "linear" | "bezier" | "hold" | "step" | "ease" | "ease-in" | "ease-out" | "ease-in-out" // Расширенный набор
  controlPoints?: [number, number, number, number] // Для bezier интерполяции
}

/**
 * Кривая перехода
 */
export interface TransitionCurve {
  type: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "custom" | "bounce"
  points: CurvePoint[] // Точки кривой для custom типа
  presets?: {
    // Предустановленные кривые
    name: string
    description?: string
  }
}

/**
 * Точка на кривой
 */
export interface CurvePoint {
  id: string
  x: number // 0-1
  y: number // 0-1
  handleIn?: { x: number; y: number } // Bezier handle
  handleOut?: { x: number; y: number } // Bezier handle
}

/**
 * Информация о кеше рендеринга
 */
export interface RenderCacheInfo {
  status: "none" | "generating" | "ready" | "error"
  cachedFrames?: number
  totalFrames?: number
  cachePath?: string
  lastModified?: Date
  error?: string
}

/**
 * Категории переходов (расширенные)
 */
export type TransitionCategory =
  | "basic"
  | "advanced"
  | "creative"
  | "3d"
  | "artistic"
  | "cinematic"
  | "dynamic" // Новое: Particle, liquid, organic
  | "glitch" // Новое: Digital artifacts, distortions
  | "light" // Новое: Light leaks, lens flares
  | "film" // Новое: Film burns, projector effects
  | "motion" // Новое: Motion blur, speed effects
  | "seamless" // Новое: Content-aware transitions

/**
 * Сложность перехода
 */
export type TransitionComplexity = "basic" | "intermediate" | "advanced" | "gpu-required"

/**
 * Метаданные перехода для UI
 */
export interface TransitionMetadata {
  id: string
  name: string
  category: TransitionCategory
  complexity: TransitionComplexity
  tags: string[]
  thumbnail?: string
  preview?: string // Видео превью
  gpuRequired: boolean
  supportedParameters: string[] // Список поддерживаемых параметров
  defaultDuration: number
  minDuration: number
  maxDuration: number
}
