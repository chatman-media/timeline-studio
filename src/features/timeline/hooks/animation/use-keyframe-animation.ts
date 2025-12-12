/**
 * Hook для работы с keyframe анимациями клипов
 */

import { useCallback } from "react"
import { useTimelineKeyframes as useDomainTimelineKeyframes } from "@/domains/video-editing"
import {
  type AnimatableProperty,
  type AnimationResult,
  type InterpolationType,
  KeyframeAnimationService,
} from "../services/keyframe-animation-service"
import { useTimeline } from "../state/use-timeline"
import type { TimelineClip, TimelineKeyframe } from "../types"

export interface UseKeyframeAnimationReturn {
  // Основные операции с keyframes
  addKeyframe: (
    clipId: string,
    property: AnimatableProperty,
    time: number,
    value: any,
    interpolation?: InterpolationType,
  ) => Promise<AnimationResult>

  removeKeyframe: (clipId: string, keyframeId: string) => Promise<AnimationResult>

  updateKeyframe: (clipId: string, keyframeId: string, updates: Partial<TimelineKeyframe>) => Promise<AnimationResult>

  // Получение данных
  getValueAtTime: (clipId: string, property: AnimatableProperty, time: number) => any
  getPropertyKeyframes: (clipId: string, property: AnimatableProperty) => TimelineKeyframe[]

  // Создание анимаций
  createAnimation: (
    clipId: string,
    property: AnimatableProperty,
    fromValue: any,
    toValue: any,
    startTime?: number,
    duration?: number,
    interpolation?: InterpolationType,
  ) => Promise<AnimationResult>

  createFadeIn: (clipId: string, duration?: number, interpolation?: InterpolationType) => Promise<AnimationResult>
  createFadeOut: (clipId: string, duration?: number, interpolation?: InterpolationType) => Promise<AnimationResult>

  createScaleAnimation: (
    clipId: string,
    fromScale: number,
    toScale: number,
    startTime?: number,
    duration?: number,
    interpolation?: InterpolationType,
  ) => Promise<AnimationResult>

  createMovementAnimation: (
    clipId: string,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    startTime?: number,
    duration?: number,
    interpolation?: InterpolationType,
  ) => Promise<AnimationResult>

  createRotationAnimation: (
    clipId: string,
    fromRotation: number,
    toRotation: number,
    startTime?: number,
    duration?: number,
    interpolation?: InterpolationType,
  ) => Promise<AnimationResult>

  // Утилиты
  clearPropertyKeyframes: (clipId: string, property: AnimatableProperty) => Promise<AnimationResult>
  copyKeyframes: (sourceClipId: string, targetClipId: string, property?: AnimatableProperty) => Promise<AnimationResult>
  optimizeKeyframes: (clipId: string, tolerance?: number) => Promise<AnimationResult>

  // Предустановленные анимации
  createPresetAnimation: (
    clipId: string,
    preset:
      | "fadeIn"
      | "fadeOut"
      | "zoomIn"
      | "zoomOut"
      | "slideInLeft"
      | "slideInRight"
      | "slideInUp"
      | "slideInDown"
      | "rotate360",
    duration?: number,
  ) => Promise<AnimationResult>
}

export function useKeyframeAnimation(): UseKeyframeAnimationReturn {
  const { clips } = useTimeline()
  const domainKeyframes = useDomainTimelineKeyframes()

  // Получает клип по ID
  const getClip = useCallback(
    (clipId: string): TimelineClip | undefined => {
      return clips.find((clip) => clip.id === clipId)
    },
    [clips],
  )

  // Основные операции с keyframes - делегируем в domain provider
  const addKeyframe = useCallback(
    async (
      clipId: string,
      property: AnimatableProperty,
      time: number,
      value: any,
      interpolation: InterpolationType = "linear",
    ): Promise<AnimationResult> => {
      const clip = getClip(clipId)
      if (!clip) {
        return { success: false, error: `Clip ${clipId} not found` }
      }

      try {
        await domainKeyframes.addKeyframe(clipId, property, time, value, interpolation)
        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
    [getClip, domainKeyframes],
  )

  const removeKeyframe = useCallback(
    async (clipId: string, keyframeId: string): Promise<AnimationResult> => {
      const clip = getClip(clipId)
      if (!clip) {
        return { success: false, error: `Clip ${clipId} not found` }
      }

      try {
        await domainKeyframes.removeKeyframe(clipId, keyframeId)
        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
    [getClip, domainKeyframes],
  )

  const updateKeyframe = useCallback(
    async (clipId: string, keyframeId: string, updates: Partial<TimelineKeyframe>): Promise<AnimationResult> => {
      const clip = getClip(clipId)
      if (!clip) {
        return { success: false, error: `Clip ${clipId} not found` }
      }

      try {
        await domainKeyframes.updateKeyframe(clipId, keyframeId, {
          time: updates.time,
          value: updates.value,
          interpolation: updates.interpolation,
          easeIn: (updates as any).easeIn,
          easeOut: (updates as any).easeOut,
        })
        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
    [getClip, domainKeyframes],
  )

  // Получение данных - используем domain provider
  const getValueAtTime = useCallback(
    (clipId: string, property: AnimatableProperty, time: number): any => {
      const clip = getClip(clipId)
      if (!clip) return undefined

      return KeyframeAnimationService.getValueAtTime(clip, property, time)
    },
    [getClip],
  )

  const getPropertyKeyframes = useCallback(
    (clipId: string, property: AnimatableProperty): TimelineKeyframe[] => {
      // Используем domain provider для получения keyframes
      return domainKeyframes.getPropertyKeyframes(clipId, property) as TimelineKeyframe[]
    },
    [domainKeyframes],
  )

  // Создание анимаций - используем domain provider напрямую
  const createAnimation = useCallback(
    async (
      clipId: string,
      property: AnimatableProperty,
      fromValue: any,
      toValue: any,
      startTime: number = 0,
      duration: number = 1,
      interpolation: InterpolationType = "ease-in-out",
    ): Promise<AnimationResult> => {
      const clip = getClip(clipId)
      if (!clip) {
        return { success: false, error: `Clip ${clipId} not found` }
      }

      try {
        // Добавляем два keyframe: начальный и конечный
        await domainKeyframes.addKeyframe(clipId, property, startTime, fromValue, interpolation)
        await domainKeyframes.addKeyframe(clipId, property, startTime + duration, toValue, interpolation)
        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
    [getClip, domainKeyframes],
  )

  const createFadeIn = useCallback(
    async (
      clipId: string,
      duration: number = 1,
      interpolation: InterpolationType = "ease-out",
    ): Promise<AnimationResult> => {
      const clip = getClip(clipId)
      if (!clip) {
        return { success: false, error: `Clip ${clipId} not found` }
      }

      try {
        // Fade in: opacity от 0 до 1
        await domainKeyframes.addKeyframe(clipId, "opacity", 0, 0, interpolation)
        await domainKeyframes.addKeyframe(clipId, "opacity", duration, 1, interpolation)
        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
    [getClip, domainKeyframes],
  )

  const createFadeOut = useCallback(
    async (
      clipId: string,
      duration: number = 1,
      interpolation: InterpolationType = "ease-in",
    ): Promise<AnimationResult> => {
      const clip = getClip(clipId)
      if (!clip) {
        return { success: false, error: `Clip ${clipId} not found` }
      }

      try {
        // Fade out: opacity от 1 до 0 в конце клипа
        const clip = getClip(clipId)
        if (!clip) return { success: false, error: `Clip ${clipId} not found` }

        const clipDuration = (clip as any).duration || 1
        await domainKeyframes.addKeyframe(clipId, "opacity", clipDuration - duration, 1, interpolation)
        await domainKeyframes.addKeyframe(clipId, "opacity", clipDuration, 0, interpolation)
        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
    [getClip, domainKeyframes],
  )

  const createScaleAnimation = useCallback(
    async (
      clipId: string,
      fromScale: number,
      toScale: number,
      startTime: number = 0,
      duration: number = 1,
      interpolation: InterpolationType = "ease-in-out",
    ): Promise<AnimationResult> => {
      const clip = getClip(clipId)
      if (!clip) {
        return { success: false, error: `Clip ${clipId} not found` }
      }

      try {
        // Scale animation: изменение масштаба
        await domainKeyframes.addKeyframe(clipId, "scale", startTime, fromScale, interpolation)
        await domainKeyframes.addKeyframe(clipId, "scale", startTime + duration, toScale, interpolation)
        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
    [getClip, domainKeyframes],
  )

  const createMovementAnimation = useCallback(
    async (
      clipId: string,
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      startTime: number = 0,
      duration: number = 1,
      interpolation: InterpolationType = "ease-in-out",
    ): Promise<AnimationResult> => {
      const clip = getClip(clipId)
      if (!clip) {
        return { success: false, error: `Clip ${clipId} not found` }
      }

      try {
        // Movement animation: position.x и position.y
        await domainKeyframes.addKeyframe(clipId, "position.x", startTime, fromX, interpolation)
        await domainKeyframes.addKeyframe(clipId, "position.x", startTime + duration, toX, interpolation)
        await domainKeyframes.addKeyframe(clipId, "position.y", startTime, fromY, interpolation)
        await domainKeyframes.addKeyframe(clipId, "position.y", startTime + duration, toY, interpolation)
        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
    [getClip, domainKeyframes],
  )

  const createRotationAnimation = useCallback(
    async (
      clipId: string,
      fromRotation: number,
      toRotation: number,
      startTime: number = 0,
      duration: number = 1,
      interpolation: InterpolationType = "linear",
    ): Promise<AnimationResult> => {
      const clip = getClip(clipId)
      if (!clip) {
        return { success: false, error: `Clip ${clipId} not found` }
      }

      try {
        // Rotation animation: изменение угла поворота
        await domainKeyframes.addKeyframe(clipId, "rotation", startTime, fromRotation, interpolation)
        await domainKeyframes.addKeyframe(clipId, "rotation", startTime + duration, toRotation, interpolation)
        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
    [getClip, domainKeyframes],
  )

  // Утилиты - используем domain provider
  const clearPropertyKeyframes = useCallback(
    async (clipId: string, property: AnimatableProperty): Promise<AnimationResult> => {
      const clip = getClip(clipId)
      if (!clip) {
        return { success: false, error: `Clip ${clipId} not found` }
      }

      try {
        await domainKeyframes.clearPropertyKeyframes(clipId, property)
        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
    [getClip, domainKeyframes],
  )

  const copyKeyframes = useCallback(
    async (sourceClipId: string, targetClipId: string, property?: AnimatableProperty): Promise<AnimationResult> => {
      const sourceClip = getClip(sourceClipId)
      const targetClip = getClip(targetClipId)

      if (!sourceClip) {
        return { success: false, error: `Source clip ${sourceClipId} not found` }
      }
      if (!targetClip) {
        return { success: false, error: `Target clip ${targetClipId} not found` }
      }

      try {
        // Получаем keyframes из source clip
        const keyframes = property
          ? domainKeyframes.getPropertyKeyframes(sourceClipId, property)
          : domainKeyframes.getClipKeyframes(sourceClipId)

        // Копируем каждый keyframe в target clip
        for (const kf of keyframes) {
          await domainKeyframes.addKeyframe(
            targetClipId,
            kf.property,
            kf.time,
            kf.value,
            kf.interpolation,
            kf.easeIn,
            kf.easeOut,
          )
        }
        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
    [getClip, domainKeyframes],
  )

  const optimizeKeyframes = useCallback(
    async (clipId: string, tolerance: number = 0.001): Promise<AnimationResult> => {
      const clip = getClip(clipId)
      if (!clip) {
        return { success: false, error: `Clip ${clipId} not found` }
      }

      // Используем KeyframeAnimationService для оптимизации (локальное вычисление)
      const result = KeyframeAnimationService.optimizeKeyframes(clip, tolerance)

      // Если оптимизация успешна, применяем изменения через backend
      if (result.success && result.updatedClip) {
        try {
          // Очищаем все keyframes
          const properties = new Set(domainKeyframes.getClipKeyframes(clipId).map((kf) => kf.property))
          for (const prop of properties) {
            await domainKeyframes.clearPropertyKeyframes(clipId, prop)
          }

          // Добавляем оптимизированные keyframes
          for (const kf of result.updatedClip.keyframes || []) {
            await domainKeyframes.addKeyframe(
              clipId,
              kf.property,
              kf.time,
              kf.value,
              kf.interpolation,
              (kf as any).easeIn,
              (kf as any).easeOut,
            )
          }
          return { success: true }
        } catch (error) {
          return { success: false, error: String(error) }
        }
      }

      return result
    },
    [getClip, domainKeyframes],
  )

  // Предустановленные анимации - используем обновленные функции
  const createPresetAnimation = useCallback(
    async (
      clipId: string,
      preset:
        | "fadeIn"
        | "fadeOut"
        | "zoomIn"
        | "zoomOut"
        | "slideInLeft"
        | "slideInRight"
        | "slideInUp"
        | "slideInDown"
        | "rotate360",
      duration: number = 1,
    ): Promise<AnimationResult> => {
      const clip = getClip(clipId)
      if (!clip) {
        return { success: false, error: `Clip ${clipId} not found` }
      }

      switch (preset) {
        case "fadeIn":
          return createFadeIn(clipId, duration)

        case "fadeOut":
          return createFadeOut(clipId, duration)

        case "zoomIn":
          return createScaleAnimation(clipId, 0, 1, 0, duration, "ease-out")

        case "zoomOut": {
          const clipDuration = (clip as any).duration || 1
          return createScaleAnimation(clipId, 1, 0, clipDuration - duration, duration, "ease-in")
        }

        case "slideInLeft":
          return createMovementAnimation(clipId, -1, 0, 0, 0, 0, duration, "ease-out")

        case "slideInRight":
          return createMovementAnimation(clipId, 1, 0, 0, 0, 0, duration, "ease-out")

        case "slideInUp":
          return createMovementAnimation(clipId, 0, 1, 0, 0, 0, duration, "ease-out")

        case "slideInDown":
          return createMovementAnimation(clipId, 0, -1, 0, 0, 0, duration, "ease-out")

        case "rotate360":
          return createRotationAnimation(clipId, 0, 360, 0, duration, "linear")

        default:
          return { success: false, error: `Unknown preset: ${preset}` }
      }
    },
    [getClip, createFadeIn, createFadeOut, createScaleAnimation, createMovementAnimation, createRotationAnimation],
  )

  return {
    // Основные операции с keyframes
    addKeyframe,
    removeKeyframe,
    updateKeyframe,

    // Получение данных
    getValueAtTime,
    getPropertyKeyframes,

    // Создание анимаций
    createAnimation,
    createFadeIn,
    createFadeOut,
    createScaleAnimation,
    createMovementAnimation,
    createRotationAnimation,

    // Утилиты
    clearPropertyKeyframes,
    copyKeyframes,
    optimizeKeyframes,

    // Предустановленные анимации
    createPresetAnimation,
  }
}
