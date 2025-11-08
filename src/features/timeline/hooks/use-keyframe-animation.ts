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
import type { TimelineClip, TimelineKeyframe } from "../types"
import { useTimeline } from "./use-timeline"

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
          easeIn: updates.easeIn,
          easeOut: updates.easeOut,
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

  // Создание анимаций
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

      const result = KeyframeAnimationService.createAnimation(
        clip,
        property,
        fromValue,
        toValue,
        startTime,
        duration,
        interpolation,
      )
      return updateClipWithResult(result)
    },
    [getClip, updateClipWithResult],
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

      const result = KeyframeAnimationService.createFadeIn(clip, duration, interpolation)
      return updateClipWithResult(result)
    },
    [getClip, updateClipWithResult],
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

      const result = KeyframeAnimationService.createFadeOut(clip, duration, interpolation)
      return updateClipWithResult(result)
    },
    [getClip, updateClipWithResult],
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

      const result = KeyframeAnimationService.createScaleAnimation(
        clip,
        fromScale,
        toScale,
        startTime,
        duration,
        interpolation,
      )
      return updateClipWithResult(result)
    },
    [getClip, updateClipWithResult],
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

      const result = KeyframeAnimationService.createMovementAnimation(
        clip,
        fromX,
        fromY,
        toX,
        toY,
        startTime,
        duration,
        interpolation,
      )
      return updateClipWithResult(result)
    },
    [getClip, updateClipWithResult],
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

      const result = KeyframeAnimationService.createRotationAnimation(
        clip,
        fromRotation,
        toRotation,
        startTime,
        duration,
        interpolation,
      )
      return updateClipWithResult(result)
    },
    [getClip, updateClipWithResult],
  )

  // Утилиты
  const clearPropertyKeyframes = useCallback(
    async (clipId: string, property: AnimatableProperty): Promise<AnimationResult> => {
      const clip = getClip(clipId)
      if (!clip) {
        return { success: false, error: `Clip ${clipId} not found` }
      }

      const result = KeyframeAnimationService.clearPropertyKeyframes(clip, property)
      return updateClipWithResult(result)
    },
    [getClip, updateClipWithResult],
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

      const result = KeyframeAnimationService.copyKeyframes(sourceClip, targetClip, property)
      return updateClipWithResult(result)
    },
    [getClip, updateClipWithResult],
  )

  const optimizeKeyframes = useCallback(
    async (clipId: string, tolerance: number = 0.001): Promise<AnimationResult> => {
      const clip = getClip(clipId)
      if (!clip) {
        return { success: false, error: `Clip ${clipId} not found` }
      }

      const result = KeyframeAnimationService.optimizeKeyframes(clip, tolerance)
      return updateClipWithResult(result)
    },
    [getClip, updateClipWithResult],
  )

  // Предустановленные анимации
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

      let result: AnimationResult

      switch (preset) {
        case "fadeIn":
          result = KeyframeAnimationService.createFadeIn(clip, duration)
          break

        case "fadeOut":
          result = KeyframeAnimationService.createFadeOut(clip, duration)
          break

        case "zoomIn":
          result = KeyframeAnimationService.createScaleAnimation(clip, 0, 1, 0, duration, "ease-out")
          break

        case "zoomOut":
          result = KeyframeAnimationService.createScaleAnimation(
            clip,
            1,
            0,
            clip.duration - duration,
            duration,
            "ease-in",
          )
          break

        case "slideInLeft":
          result = KeyframeAnimationService.createMovementAnimation(clip, -1, 0, 0, 0, 0, duration, "ease-out")
          break

        case "slideInRight":
          result = KeyframeAnimationService.createMovementAnimation(clip, 1, 0, 0, 0, 0, duration, "ease-out")
          break

        case "slideInUp":
          result = KeyframeAnimationService.createMovementAnimation(clip, 0, 1, 0, 0, 0, duration, "ease-out")
          break

        case "slideInDown":
          result = KeyframeAnimationService.createMovementAnimation(clip, 0, -1, 0, 0, 0, duration, "ease-out")
          break

        case "rotate360":
          result = KeyframeAnimationService.createRotationAnimation(clip, 0, 360, 0, duration, "linear")
          break

        default:
          return { success: false, error: `Unknown preset: ${preset}` }
      }

      return updateClipWithResult(result)
    },
    [getClip, updateClipWithResult],
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
