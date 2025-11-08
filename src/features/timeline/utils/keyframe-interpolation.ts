/**
 * Утилиты для keyframe интерполяции в реальном времени
 */

import type { AnimatableProperty } from "../services/keyframe-animation-service"
import type { TimelineClip, TimelineKeyframe } from "../types"

export interface InterpolatedValues {
  opacity?: number
  position?: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
    scaleX: number
    scaleY: number
  }
  volume?: number
  speed?: number
}

export type InterpolatedPosition = NonNullable<InterpolatedValues["position"]>

/**
 * Получает все интерполированные значения для клипа в указанное время
 */
export function getInterpolatedClipValues(clip: TimelineClip, relativeTime: number): InterpolatedValues {
  if (!clip.keyframes || clip.keyframes.length === 0) {
    return getDefaultClipValues(clip)
  }

  const values: InterpolatedValues = {}

  // Группируем keyframes по свойствам
  const keyframesByProperty = new Map<string, TimelineKeyframe[]>()
  for (const kf of clip.keyframes) {
    if (!keyframesByProperty.has(kf.property)) {
      keyframesByProperty.set(kf.property, [])
    }
    keyframesByProperty.get(kf.property)!.push(kf)
  }

  // Интерполируем каждое свойство
  for (const [property, keyframes] of keyframesByProperty) {
    const sortedKeyframes = keyframes.sort((a, b) => a.time - b.time)
    const interpolatedValue = interpolateProperty(sortedKeyframes, relativeTime)

    // Применяем интерполированное значение
    applyInterpolatedValue(values, property as AnimatableProperty, interpolatedValue, clip)
  }

  // Заполняем недостающие значения дефолтными
  return fillDefaultValues(values, clip)
}

/**
 * Интерполирует значение свойства между keyframes
 */
function interpolateProperty(keyframes: TimelineKeyframe[], time: number): unknown {
  if (keyframes.length === 0) return undefined
  if (keyframes.length === 1) return keyframes[0].value

  // Если время до первого keyframe
  if (time <= keyframes[0].time) {
    return keyframes[0].value
  }

  // Если время после последнего keyframe
  if (time >= keyframes[keyframes.length - 1].time) {
    return keyframes[keyframes.length - 1].value
  }

  // Находим два keyframe между которыми находится время
  for (let i = 0; i < keyframes.length - 1; i++) {
    const currentKf = keyframes[i]
    const nextKf = keyframes[i + 1]

    if (time >= currentKf.time && time <= nextKf.time) {
      return interpolateBetweenKeyframes(currentKf, nextKf, time)
    }
  }

  return keyframes[keyframes.length - 1].value
}

/**
 * Интерполирует между двумя keyframes
 */
function interpolateBetweenKeyframes(currentKf: TimelineKeyframe, nextKf: TimelineKeyframe, time: number): unknown {
  const duration = nextKf.time - currentKf.time
  const progress = duration > 0 ? (time - currentKf.time) / duration : 0

  // Применяем функцию интерполяции
  const easedProgress = applyEasing(progress, currentKf.interpolation)

  // Интерполируем значение
  if (typeof currentKf.value === "number" && typeof nextKf.value === "number") {
    return currentKf.value + (nextKf.value - currentKf.value) * easedProgress
  }

  // Для step интерполяции возвращаем текущее значение до середины, затем следующее
  if (currentKf.interpolation === "step") {
    return progress < 0.5 ? currentKf.value : nextKf.value
  }

  // Для не-числовых значений используем step
  return progress < 0.5 ? currentKf.value : nextKf.value
}

/**
 * Применяет функцию сглаживания к прогрессу
 */
function applyEasing(progress: number, type: TimelineKeyframe["interpolation"]): number {
  switch (type) {
    case "linear":
      return progress

    case "ease":
      return 0.25 * Math.sin(Math.PI * progress - Math.PI / 2) + 0.5 + 0.25 * progress

    case "ease-in":
      return progress * progress

    case "ease-out":
      return 1 - (1 - progress) * (1 - progress)

    case "ease-in-out":
      return progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2

    case "step":
      return progress < 0.5 ? 0 : 1

    case "bezier":
      // Для bezier можно добавить более сложную логику
      // Пока используем ease-in-out как fallback
      return progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2

    default:
      return progress
  }
}

/**
 * Применяет интерполированное значение к результату
 */
function applyInterpolatedValue(
  values: InterpolatedValues,
  property: AnimatableProperty,
  value: unknown,
  clip: TimelineClip,
): void {
  switch (property) {
    case "opacity":
      if (typeof value === "number") {
        values.opacity = value
      }
      break

    case "position.x":
      if (!values.position) values.position = getDefaultPosition(clip)
      if (typeof value === "number") {
        values.position.x = value
      }
      break

    case "position.y":
      if (!values.position) values.position = getDefaultPosition(clip)
      if (typeof value === "number") {
        values.position.y = value
      }
      break

    case "position.width":
      if (!values.position) values.position = getDefaultPosition(clip)
      if (typeof value === "number") {
        values.position.width = value
      }
      break

    case "position.height":
      if (!values.position) values.position = getDefaultPosition(clip)
      if (typeof value === "number") {
        values.position.height = value
      }
      break

    case "position.rotation":
      if (!values.position) values.position = getDefaultPosition(clip)
      if (typeof value === "number") {
        values.position.rotation = value
      }
      break

    case "position.scaleX":
      if (!values.position) values.position = getDefaultPosition(clip)
      if (typeof value === "number") {
        values.position.scaleX = value
      }
      break

    case "position.scaleY":
      if (!values.position) values.position = getDefaultPosition(clip)
      if (typeof value === "number") {
        values.position.scaleY = value
      }
      break

    case "volume":
      if (typeof value === "number") {
        values.volume = value
      }
      break

    case "speed":
      if (typeof value === "number") {
        values.speed = value
      }
      break
  }
}

/**
 * Получает дефолтные значения для клипа
 */
function getDefaultClipValues(clip: TimelineClip): InterpolatedValues {
  return {
    opacity: clip.opacity ?? 1,
    position: getDefaultPosition(clip),
    volume: clip.volume ?? 1,
    speed: clip.speed ?? 1,
  }
}

/**
 * Получает дефолтную позицию для клипа
 */
function getDefaultPosition(clip: TimelineClip): InterpolatedPosition {
  return {
    x: clip.position?.x ?? 0,
    y: clip.position?.y ?? 0,
    width: clip.position?.width ?? 1,
    height: clip.position?.height ?? 1,
    rotation: clip.position?.rotation ?? 0,
    scaleX: clip.position?.scaleX ?? 1,
    scaleY: clip.position?.scaleY ?? 1,
  }
}

/**
 * Заполняет недостающие значения дефолтными
 */
function fillDefaultValues(values: InterpolatedValues, clip: TimelineClip): InterpolatedValues {
  const defaults = getDefaultClipValues(clip)
  const defaultPosition = defaults.position ?? getDefaultPosition(clip)

  return {
    opacity: values.opacity ?? defaults.opacity,
    position: {
      x: values.position?.x ?? defaultPosition.x,
      y: values.position?.y ?? defaultPosition.y,
      width: values.position?.width ?? defaultPosition.width,
      height: values.position?.height ?? defaultPosition.height,
      rotation: values.position?.rotation ?? defaultPosition.rotation,
      scaleX: values.position?.scaleX ?? defaultPosition.scaleX,
      scaleY: values.position?.scaleY ?? defaultPosition.scaleY,
    },
    volume: values.volume ?? defaults.volume,
    speed: values.speed ?? defaults.speed,
  }
}

/**
 * Проверяет, есть ли keyframes для указанного свойства
 */
export function hasKeyframesForProperty(clip: TimelineClip, property: AnimatableProperty): boolean {
  return clip.keyframes?.some((kf) => kf.property === property) ?? false
}

/**
 * Получает все свойства, которые имеют keyframes
 */
export function getAnimatedProperties(clip: TimelineClip): AnimatableProperty[] {
  if (!clip.keyframes) return []

  const properties = new Set<AnimatableProperty>()
  for (const kf of clip.keyframes) {
    properties.add(kf.property as AnimatableProperty)
  }

  return Array.from(properties)
}

/**
 * Получает диапазон значений для свойства (min/max)
 */
export function getPropertyValueRange(
  clip: TimelineClip,
  property: AnimatableProperty,
): { min: number; max: number } | null {
  if (!clip.keyframes) return null

  const propertyKeyframes = clip.keyframes.filter((kf) => kf.property === property)
  if (propertyKeyframes.length === 0) return null

  const values = propertyKeyframes.map((kf) => kf.value).filter((v) => typeof v === "number") as number[]

  if (values.length === 0) return null

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

/**
 * Создает CSS transform строку для позиционных свойств
 */
export function createTransformString(position: InterpolatedPosition | undefined): string {
  if (!position) return ""

  const transforms: string[] = []

  if (position.x !== 0 || position.y !== 0) {
    transforms.push(`translate(${position.x * 100}%, ${position.y * 100}%)`)
  }

  if (position.scaleX !== 1 || position.scaleY !== 1) {
    transforms.push(`scale(${position.scaleX}, ${position.scaleY})`)
  }

  if (position.rotation !== 0) {
    transforms.push(`rotate(${position.rotation}deg)`)
  }

  return transforms.join(" ")
}

/**
 * Создает CSS свойства для размеров
 */
export function createSizeStyles(position: InterpolatedPosition | undefined): React.CSSProperties {
  if (!position) return {}

  return {
    width: `${position.width * 100}%`,
    height: `${position.height * 100}%`,
  }
}
