/**
 * Keyframe Animation Service
 * Provides keyframe animation functionality for timeline clips
 */

import type { TimelineClip, TimelineKeyframe } from "../types"

export type AnimatableProperty =
  | "opacity"
  | "position.x"
  | "position.y"
  | "position.width"
  | "position.height"
  | "position.rotation"
  | "position.scaleX"
  | "position.scaleY"
  | "volume"
  | "speed"

export type InterpolationType = "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "bezier" | "step"

export interface KeyframeValue {
  time: number // время в секундах относительно начала клипа
  value: number | string | boolean // значение свойства
  interpolation: InterpolationType
  // Для bezier кривых
  bezierControlPoints?: {
    cp1x: number
    cp1y: number
    cp2x: number
    cp2y: number
  }
}

export interface AnimationTrack {
  id: string
  property: AnimatableProperty
  keyframes: KeyframeValue[]
  enabled: boolean
  locked?: boolean
}

export interface AnimationResult {
  success: boolean
  updatedClip?: TimelineClipWithKeyframes
  error?: string
}

// Расширяем TimelineClip для поддержки keyframes
export interface TimelineClipWithKeyframes extends TimelineClip {
  keyframes?: TimelineKeyframe[]
}

export class KeyframeAnimationService {
  /**
   * Добавляет keyframe для указанного свойства
   */
  static addKeyframe(
    clip: TimelineClipWithKeyframes,
    property: AnimatableProperty,
    time: number,
    value: number | string | boolean,
    interpolation: InterpolationType = "linear",
  ): AnimationResult {
    try {
      // Создаем копию клипа
      const updatedClip = { ...clip }

      // Инициализируем массив keyframes если его нет
      if (!updatedClip.keyframes) {
        updatedClip.keyframes = []
      }

      // Проверяем валидность времени
      if (time < 0 || time > clip.duration) {
        return {
          success: false,
          error: `Time ${time} is out of clip duration bounds (0-${clip.duration})`,
        }
      }

      // Создаем новый keyframe
      const newKeyframe: TimelineKeyframe = {
        id: `kf_${Date.now()}_${Math.random()}`,
        time,
        property,
        value,
        interpolation,
      }

      // Удаляем существующий keyframe в этом времени для этого свойства
      updatedClip.keyframes = updatedClip.keyframes.filter(
        (kf: TimelineKeyframe) => !(kf.time === time && kf.property === property),
      )

      // Добавляем новый keyframe
      updatedClip.keyframes.push(newKeyframe)

      // Сортируем keyframes по времени
      updatedClip.keyframes.sort((a: TimelineKeyframe, b: TimelineKeyframe) => a.time - b.time)

      return {
        success: true,
        updatedClip,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Удаляет keyframe
   */
  static removeKeyframe(clip: TimelineClipWithKeyframes, keyframeId: string): AnimationResult {
    try {
      const updatedClip = { ...clip }

      if (!updatedClip.keyframes) {
        return { success: true, updatedClip }
      }

      updatedClip.keyframes = updatedClip.keyframes.filter((kf: TimelineKeyframe) => kf.id !== keyframeId)

      return {
        success: true,
        updatedClip,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Обновляет keyframe
   */
  static updateKeyframe(
    clip: TimelineClipWithKeyframes,
    keyframeId: string,
    updates: Partial<TimelineKeyframe>,
  ): AnimationResult {
    try {
      const updatedClip = { ...clip }

      if (!updatedClip.keyframes) {
        return {
          success: false,
          error: "No keyframes found in clip",
        }
      }

      const keyframeIndex = updatedClip.keyframes.findIndex((kf: TimelineKeyframe) => kf.id === keyframeId)
      if (keyframeIndex === -1) {
        return {
          success: false,
          error: `Keyframe ${keyframeId} not found`,
        }
      }

      // Обновляем keyframe
      updatedClip.keyframes[keyframeIndex] = {
        ...updatedClip.keyframes[keyframeIndex],
        ...updates,
      }

      // Пересортируем если время изменилось
      if (updates.time !== undefined) {
        updatedClip.keyframes.sort((a: TimelineKeyframe, b: TimelineKeyframe) => a.time - b.time)
      }

      return {
        success: true,
        updatedClip,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Получает значение свойства в указанное время с интерполяцией
   */
  static getValueAtTime(
    clip: TimelineClipWithKeyframes,
    property: AnimatableProperty,
    time: number,
  ): number | string | boolean {
    if (!clip.keyframes || clip.keyframes.length === 0) {
      return KeyframeAnimationService.getDefaultValue(clip, property)
    }

    // Получаем keyframes для этого свойства, отсортированные по времени
    const propertyKeyframes = clip.keyframes
      .filter((kf: TimelineKeyframe) => kf.property === property)
      .sort((a: TimelineKeyframe, b: TimelineKeyframe) => a.time - b.time)

    if (propertyKeyframes.length === 0) {
      return KeyframeAnimationService.getDefaultValue(clip, property)
    }

    // Если время до первого keyframe
    if (time <= propertyKeyframes[0].time) {
      return propertyKeyframes[0].value
    }

    // Если время после последнего keyframe
    if (time >= propertyKeyframes[propertyKeyframes.length - 1].time) {
      return propertyKeyframes[propertyKeyframes.length - 1].value
    }

    // Находим два keyframe между которыми находится время
    for (let i = 0; i < propertyKeyframes.length - 1; i++) {
      const currentKf = propertyKeyframes[i]
      const nextKf = propertyKeyframes[i + 1]

      if (time >= currentKf.time && time <= nextKf.time) {
        return KeyframeAnimationService.interpolateValues(currentKf, nextKf, time)
      }
    }

    return KeyframeAnimationService.getDefaultValue(clip, property)
  }

  /**
   * Получает дефолтное значение для свойства
   */
  private static getDefaultValue(clip: TimelineClipWithKeyframes, property: AnimatableProperty): number {
    switch (property) {
      case "opacity":
        return clip.opacity ?? 1
      case "position.x":
        return clip.position?.x ?? 0
      case "position.y":
        return clip.position?.y ?? 0
      case "position.width":
        return clip.position?.width ?? 1
      case "position.height":
        return clip.position?.height ?? 1
      case "position.rotation":
        return clip.position?.rotation ?? 0
      case "position.scaleX":
        return clip.position?.scaleX ?? 1
      case "position.scaleY":
        return clip.position?.scaleY ?? 1
      case "volume":
        return clip.volume ?? 1
      case "speed":
        return clip.speed ?? 1
      default:
        return 0
    }
  }

  /**
   * Интерполирует значения между двумя keyframes
   */
  private static interpolateValues(
    currentKf: TimelineKeyframe,
    nextKf: TimelineKeyframe,
    time: number,
  ): number | string | boolean {
    const duration = nextKf.time - currentKf.time
    const progress = (time - currentKf.time) / duration

    // Применяем функцию интерполяции
    const easedProgress = KeyframeAnimationService.applyEasing(progress, currentKf.interpolation)

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
  private static applyEasing(progress: number, type: InterpolationType): number {
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

      default:
        return progress
    }
  }

  /**
   * Создает анимацию между двумя значениями
   */
  static createAnimation(
    clip: TimelineClipWithKeyframes,
    property: AnimatableProperty,
    fromValue: number | string | boolean,
    toValue: number | string | boolean,
    startTime: number = 0,
    duration: number = 1,
    interpolation: InterpolationType = "ease-in-out",
  ): AnimationResult {
    try {
      let updatedClip = clip

      // Добавляем keyframe в начале
      const startResult = KeyframeAnimationService.addKeyframe(updatedClip, property, startTime, fromValue, "linear")
      if (!startResult.success || !startResult.updatedClip) {
        return startResult
      }
      updatedClip = startResult.updatedClip

      // Добавляем keyframe в конце
      const endResult = KeyframeAnimationService.addKeyframe(
        updatedClip,
        property,
        startTime + duration,
        toValue,
        interpolation,
      )
      if (!endResult.success || !endResult.updatedClip) {
        return endResult
      }

      return {
        success: true,
        updatedClip: endResult.updatedClip,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Удаляет все keyframes для указанного свойства
   */
  static clearPropertyKeyframes(clip: TimelineClipWithKeyframes, property: AnimatableProperty): AnimationResult {
    try {
      const updatedClip = { ...clip }

      if (!updatedClip.keyframes) {
        return { success: true, updatedClip }
      }

      updatedClip.keyframes = updatedClip.keyframes.filter((kf: TimelineKeyframe) => kf.property !== property)

      return {
        success: true,
        updatedClip,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Получает все keyframes для указанного свойства
   */
  static getPropertyKeyframes(clip: TimelineClipWithKeyframes, property: AnimatableProperty): TimelineKeyframe[] {
    if (!clip.keyframes) return []

    return clip.keyframes
      .filter((kf: TimelineKeyframe) => kf.property === property)
      .sort((a: TimelineKeyframe, b: TimelineKeyframe) => a.time - b.time)
  }

  /**
   * Создает fade in анимацию для opacity
   */
  static createFadeIn(
    clip: TimelineClipWithKeyframes,
    duration: number = 1,
    interpolation: InterpolationType = "ease-out",
  ): AnimationResult {
    return KeyframeAnimationService.createAnimation(clip, "opacity", 0, 1, 0, duration, interpolation)
  }

  /**
   * Создает fade out анимацию для opacity
   */
  static createFadeOut(
    clip: TimelineClipWithKeyframes,
    duration: number = 1,
    interpolation: InterpolationType = "ease-in",
  ): AnimationResult {
    const startTime = clip.duration - duration
    return KeyframeAnimationService.createAnimation(clip, "opacity", 1, 0, startTime, duration, interpolation)
  }

  /**
   * Создает масштабирование (zoom in/out)
   */
  static createScaleAnimation(
    clip: TimelineClipWithKeyframes,
    fromScale: number,
    toScale: number,
    startTime: number = 0,
    duration: number = 1,
    interpolation: InterpolationType = "ease-in-out",
  ): AnimationResult {
    try {
      let updatedClip = clip

      // Анимируем scaleX
      const scaleXResult = KeyframeAnimationService.createAnimation(
        updatedClip,
        "position.scaleX",
        fromScale,
        toScale,
        startTime,
        duration,
        interpolation,
      )
      if (!scaleXResult.success || !scaleXResult.updatedClip) {
        return scaleXResult
      }
      updatedClip = scaleXResult.updatedClip

      // Анимируем scaleY
      const scaleYResult = KeyframeAnimationService.createAnimation(
        updatedClip,
        "position.scaleY",
        fromScale,
        toScale,
        startTime,
        duration,
        interpolation,
      )

      return scaleYResult
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Создает анимацию движения
   */
  static createMovementAnimation(
    clip: TimelineClipWithKeyframes,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    startTime: number = 0,
    duration: number = 1,
    interpolation: InterpolationType = "ease-in-out",
  ): AnimationResult {
    try {
      let updatedClip = clip

      // Анимируем X
      const xResult = KeyframeAnimationService.createAnimation(
        updatedClip,
        "position.x",
        fromX,
        toX,
        startTime,
        duration,
        interpolation,
      )
      if (!xResult.success || !xResult.updatedClip) {
        return xResult
      }
      updatedClip = xResult.updatedClip

      // Анимируем Y
      const yResult = KeyframeAnimationService.createAnimation(
        updatedClip,
        "position.y",
        fromY,
        toY,
        startTime,
        duration,
        interpolation,
      )

      return yResult
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Создает анимацию вращения
   */
  static createRotationAnimation(
    clip: TimelineClipWithKeyframes,
    fromRotation: number,
    toRotation: number,
    startTime: number = 0,
    duration: number = 1,
    interpolation: InterpolationType = "linear",
  ): AnimationResult {
    return KeyframeAnimationService.createAnimation(
      clip,
      "position.rotation",
      fromRotation,
      toRotation,
      startTime,
      duration,
      interpolation,
    )
  }

  /**
   * Копирует keyframes с одного клипа на другой
   */
  static copyKeyframes(
    sourceClip: TimelineClipWithKeyframes,
    targetClip: TimelineClipWithKeyframes,
    property?: AnimatableProperty,
  ): AnimationResult {
    try {
      const updatedClip = { ...targetClip }

      if (!sourceClip.keyframes || sourceClip.keyframes.length === 0) {
        return { success: true, updatedClip }
      }

      // Фильтруем keyframes если указано конкретное свойство
      const keyframesToCopy = property
        ? sourceClip.keyframes.filter((kf: TimelineKeyframe) => kf.property === property)
        : sourceClip.keyframes

      if (!updatedClip.keyframes) {
        updatedClip.keyframes = []
      }

      // Удаляем существующие keyframes для копируемых свойств
      const propertiesToCopy = new Set(keyframesToCopy.map((kf: TimelineKeyframe) => kf.property))
      updatedClip.keyframes = updatedClip.keyframes.filter((kf: TimelineKeyframe) => !propertiesToCopy.has(kf.property))

      // Добавляем скопированные keyframes с новыми ID
      for (const kf of keyframesToCopy) {
        updatedClip.keyframes.push({
          ...kf,
          id: `kf_${Date.now()}_${Math.random()}`,
        })
      }

      // Сортируем по времени
      updatedClip.keyframes.sort((a: TimelineKeyframe, b: TimelineKeyframe) => a.time - b.time)

      return {
        success: true,
        updatedClip,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Оптимизирует keyframes (удаляет избыточные)
   */
  static optimizeKeyframes(clip: TimelineClipWithKeyframes, tolerance: number = 0.001): AnimationResult {
    try {
      const updatedClip = { ...clip }

      if (!updatedClip.keyframes || updatedClip.keyframes.length <= 2) {
        return { success: true, updatedClip }
      }

      // Группируем по свойствам
      const keyframesByProperty = new Map<string, TimelineKeyframe[]>()
      for (const kf of updatedClip.keyframes as TimelineKeyframe[]) {
        if (!keyframesByProperty.has(kf.property)) {
          keyframesByProperty.set(kf.property, [])
        }
        keyframesByProperty.get(kf.property)!.push(kf)
      }

      const optimizedKeyframes: TimelineKeyframe[] = []

      // Оптимизируем каждое свойство отдельно
      for (const [property, keyframes] of keyframesByProperty) {
        if (keyframes.length <= 2) {
          optimizedKeyframes.push(...keyframes)
          continue
        }

        // Сортируем по времени
        keyframes.sort((a, b) => a.time - b.time)

        // Добавляем первый keyframe
        optimizedKeyframes.push(keyframes[0])

        // Проверяем промежуточные keyframes
        for (let i = 1; i < keyframes.length - 1; i++) {
          const prev = keyframes[i - 1]
          const current = keyframes[i]
          const next = keyframes[i + 1]

          // Оптимизируем только числовые значения
          if (typeof prev.value === "number" && typeof current.value === "number" && typeof next.value === "number") {
            // Вычисляем ожидаемое значение через линейную интерполяцию
            const expectedValue =
              prev.value + (next.value - prev.value) * ((current.time - prev.time) / (next.time - prev.time))

            // Если текущее значение существенно отличается, сохраняем keyframe
            if (Math.abs(current.value - expectedValue) > tolerance) {
              optimizedKeyframes.push(current)
            }
          } else {
            // Для не-числовых значений всегда сохраняем keyframe
            optimizedKeyframes.push(current)
          }
        }

        // Добавляем последний keyframe
        optimizedKeyframes.push(keyframes[keyframes.length - 1])
      }

      updatedClip.keyframes = optimizedKeyframes.sort((a, b) => a.time - b.time)

      return {
        success: true,
        updatedClip,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
