// Категории переходов
export type TransitionCategory =
  | "basic" // Базовые
  | "advanced" // Продвинутые
  | "creative" // Креативные
  | "3d" // 3D
  | "artistic" // Художественные
  | "cinematic" // Кинематографические
  | "dynamic" // Динамические (particles, liquid, organic)
  | "glitch" // Глитч эффекты (digital artifacts, distortions)
  | "light" // Световые (light leaks, lens flares)
  | "film" // Пленочные (film burns, projector effects)
  | "motion" // Движение (motion blur, speed effects)
  | "seamless" // Бесшовные (content-aware transitions)

// Сложность перехода
export type TransitionComplexity = "basic" | "intermediate" | "advanced" | "gpu-required"

// Направление перехода
export type TransitionDirection = "left" | "right" | "up" | "down" | "center" | "radial"

// Плавность перехода
export type TransitionEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bounce"

// Длительность перехода
export interface TransitionDuration {
  min: number
  max: number
  default: number
}

// Параметры перехода (расширенные)
export interface TransitionParameter {
  direction?: TransitionDirection
  easing?: TransitionEasing
  intensity?: number
  scale?: number
  smoothness?: number
  blur?: {
    enabled?: boolean
    amount?: number
    type?: "gaussian" | "motion" | "radial"
  }
  color?: {
    enabled?: boolean
    tint?: string
    saturation?: number
    brightness?: number
  }
  perspective?: {
    enabled?: boolean
    rotationX?: number
    rotationY?: number
    rotationZ?: number
  }
}

// Пресет перехода
export interface TransitionPreset {
  id: string
  transitionId: string
  name: string
  parameters: TransitionParameter
}

// Тип перехода (для маппинга)
export type TransitionType = string

// Теги для переходов
export type TransitionTag =
  | "zoom"
  | "scale"
  | "smooth"
  | "fade"
  | "opacity"
  | "classic"
  | "slide"
  | "movement"
  | "direction"
  | "size"
  | "transform"
  | "rotate"
  | "spin"
  | "flip"
  | "mirror"
  | "push"
  | "displacement"
  | "squeeze"
  | "compress"
  | "elastic"
  | "diagonal"
  | "angle"
  | "spiral"
  | "rotation"
  | "3d"
  | "complex"
  | "fallback"
  | "wipe"
  | "horizontal"
  | "vertical"
  | "radial"
  | "circular"
  | "center"
  | "cube"
  | "page"
  | "turn"
  | "book"
  | "creative"
  | "ripple"
  | "water"
  | "wave"
  | "distortion"
  | "pixel"
  | "digital"
  | "retro"
  | "8bit"
  | "dissolve"
  | "noise"
  | "morph"
  | "fluid"
  | "glitch"
  | "modern"
  | "kaleidoscope"
  | "geometric"
  | "artistic"
  | "shatter"
  | "break"
  | "glass"
  | "dramatic"
  | "burn"
  | "fire"
  | "cinematic"
  | "blinds"
  | "stripes"
  | "iris"
  | "camera"
  | "swirl"
  | "twist"
  | "blur"
  | "motion"
  | "speed"
  | "tv"
  | "static"
  | "analog"

/**
 * Интерфейс для перехода (объединенная структура)
 */
export interface Transition {
  id: string // Уникальный идентификатор
  type: string // Тип перехода для ffmpeg
  name?: string // Название (для обратной совместимости)
  labels: {
    ru: string
    en: string
    es?: string
    fr?: string
    de?: string
  } // Локализованные названия
  description: {
    ru: string
    en: string
  } // Описание перехода
  category: TransitionCategory // Категория перехода
  complexity: TransitionComplexity // Сложность перехода
  tags: TransitionTag[] // Теги перехода
  duration: {
    min: number // минимальная длительность в секундах
    max: number // максимальная длительность в секундах
    default: number // длительность по умолчанию
  }
  parameters?: {
    // Базовые параметры
    direction?: "left" | "right" | "up" | "down" | "center" | "radial"
    easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bounce"
    intensity?: number // от 0 до 1
    scale?: number // масштаб для zoom эффектов
    smoothness?: number // плавность перехода

    // Расширенные параметры
    blur?: {
      enabled?: boolean
      amount?: number // 0-100
      type?: "gaussian" | "motion" | "radial"
    }

    color?: {
      enabled?: boolean
      tint?: string // Hex color
      saturation?: number // -100 to 100
      brightness?: number // -100 to 100
    }

    // 3D параметры (для будущего использования)
    perspective?: {
      enabled?: boolean
      rotationX?: number
      rotationY?: number
      rotationZ?: number
    }
  }
  // FFmpeg команда для применения перехода
  ffmpegCommand: (params: { fps: number; width?: number; height?: number; scale?: number; duration?: number }) => string
  previewPath?: string // Путь к превью (для обратной совместимости)
  gpuAccelerated?: boolean // Поддержка GPU ускорения
  webglShader?: string // Имя WebGL шейдера для превью
}
