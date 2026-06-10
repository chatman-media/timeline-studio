/**
 * Video Fade Service
 * Provides video fade in/out operations for timeline clips
 */

import type { VideoFadeKeyframe } from "@timeline-studio/core/types/timeline"
import type { TimelineClip } from "../types"

export interface VideoFadeOptions {
  type: "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out"
  duration: number // в секундах
  targetOpacity?: number // конечная прозрачность (0-1)
}

export class VideoFadeService {
  /**
   * Применяет fade in к видео клипу
   */
  static applyFadeIn(clip: TimelineClip, options: VideoFadeOptions): TimelineClip {
    const fadeKeyframes = VideoFadeService.generateFadeKeyframes("in", options)

    return {
      ...clip,
      opacity: options.targetOpacity ?? 1,
      fadeIn: {
        duration: options.duration,
        type: options.type,
        keyframes: fadeKeyframes,
      },
      // Добавляем opacity keyframes к существующим
      opacityKeyframes: VideoFadeService.mergeOpacityKeyframes(
        clip.opacityKeyframes || [],
        fadeKeyframes,
        0, // fade in начинается с начала клипа
      ),
    }
  }

  /**
   * Применяет fade out к видео клипу
   */
  static applyFadeOut(clip: TimelineClip, options: VideoFadeOptions): TimelineClip {
    const fadeKeyframes = VideoFadeService.generateFadeKeyframes("out", options)
    const fadeStartTime = clip.duration - options.duration

    return {
      ...clip,
      fadeOut: {
        duration: options.duration,
        type: options.type,
        keyframes: fadeKeyframes,
      },
      // Добавляем opacity keyframes к существующим
      opacityKeyframes: VideoFadeService.mergeOpacityKeyframes(
        clip.opacityKeyframes || [],
        fadeKeyframes,
        fadeStartTime,
      ),
    }
  }

  /**
   * Создает crossfade между двумя видео клипами
   */
  static createCrossfade(
    clipA: TimelineClip,
    clipB: TimelineClip,
    crossfadeDuration: number,
    fadeType: VideoFadeOptions["type"] = "cosine",
  ): { clipA: TimelineClip; clipB: TimelineClip } {
    // Проверяем перекрытие клипов
    const overlapStart = clipB.startTime
    const overlapEnd = clipA.startTime + clipA.duration
    const overlapDuration = overlapEnd - overlapStart

    if (overlapDuration < crossfadeDuration) {
      throw new Error("Clips do not overlap enough for crossfade")
    }

    // Применяем fade out к первому клипу
    const fadedClipA = VideoFadeService.applyFadeOut(clipA, {
      type: fadeType,
      duration: crossfadeDuration,
      targetOpacity: 0,
    })

    // Применяем fade in ко второму клипу
    const fadedClipB = VideoFadeService.applyFadeIn(clipB, {
      type: fadeType,
      duration: crossfadeDuration,
      targetOpacity: 1,
    })

    return {
      clipA: fadedClipA,
      clipB: fadedClipB,
    }
  }

  /**
   * Генерирует keyframes для fade эффекта
   */
  private static generateFadeKeyframes(direction: "in" | "out", options: VideoFadeOptions): VideoFadeKeyframe[] {
    const keyframes: VideoFadeKeyframe[] = []
    const steps = Math.ceil(options.duration * 30) // 30 keyframes в секунду
    const targetOpacity = options.targetOpacity ?? (direction === "in" ? 1 : 0)
    const startOpacity = direction === "in" ? 0 : 1

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps
      const time = (i / steps) * options.duration
      const factor = VideoFadeService.calculateFadeFactor(direction === "in" ? progress : 1 - progress, options.type)

      const opacity = startOpacity + (targetOpacity - startOpacity) * factor

      keyframes.push({
        time,
        opacity,
        easing: options.type,
      })
    }

    return keyframes
  }

  /**
   * Вычисляет коэффициент fade для заданного прогресса
   */
  private static calculateFadeFactor(progress: number, type: VideoFadeOptions["type"]): number {
    switch (type) {
      case "linear":
        return progress

      case "exponential":
        return progress ** 2

      case "logarithmic":
        return 1 - (1 - progress) ** 2

      case "cosine":
        return (1 - Math.cos(progress * Math.PI)) / 2

      case "ease-in":
        return progress * progress

      case "ease-out":
        return 1 - (1 - progress) * (1 - progress)

      case "ease-in-out":
        return progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2

      default:
        return progress
    }
  }

  /**
   * Объединяет существующие opacity keyframes с новыми fade keyframes
   */
  private static mergeOpacityKeyframes(
    existing: VideoFadeKeyframe[],
    fadeKeyframes: VideoFadeKeyframe[],
    startOffset: number,
  ): VideoFadeKeyframe[] {
    // Конвертируем fade keyframes с учетом offset
    const offsetFadeKeyframes = fadeKeyframes.map((kf) => ({
      ...kf,
      time: kf.time + startOffset,
    }))

    // Фильтруем существующие keyframes, которые не конфликтуют с fade
    const fadeEndTime = startOffset + (fadeKeyframes[fadeKeyframes.length - 1]?.time || 0)
    const filteredExisting = existing.filter((kf) => kf.time < startOffset || kf.time > fadeEndTime)

    // Объединяем и сортируем по времени
    return [...filteredExisting, ...offsetFadeKeyframes].sort((a, b) => a.time - b.time)
  }

  /**
   * Удаляет fade in с клипа
   */
  static removeFadeIn(clip: TimelineClip): TimelineClip {
    const fadeInDuration = clip.fadeIn?.duration || 0

    return {
      ...clip,
      fadeIn: undefined,
      opacityKeyframes: clip.opacityKeyframes?.filter((kf: VideoFadeKeyframe) => kf.time > fadeInDuration) || [],
    }
  }

  /**
   * Удаляет fade out с клипа
   */
  static removeFadeOut(clip: TimelineClip): TimelineClip {
    const fadeOutStartTime = clip.duration - (clip.fadeOut?.duration || 0)

    return {
      ...clip,
      fadeOut: undefined,
      opacityKeyframes: clip.opacityKeyframes?.filter((kf: VideoFadeKeyframe) => kf.time < fadeOutStartTime) || [],
    }
  }

  /**
   * Проверяет, имеет ли клип fade эффекты
   */
  static hasFadeEffects(clip: TimelineClip): boolean {
    return !!(clip.fadeIn || clip.fadeOut)
  }

  /**
   * Получает текущую opacity для заданного времени с учетом fade
   */
  static getOpacityAtTime(clip: TimelineClip, time: number): number {
    // Время относительно начала клипа
    const relativeTime = time - clip.startTime

    // Проверяем границы
    if (relativeTime < 0 || relativeTime > clip.duration) {
      return 0
    }

    // Если есть opacity keyframes, интерполируем между ними
    if (clip.opacityKeyframes && clip.opacityKeyframes.length > 0) {
      return VideoFadeService.interpolateOpacity(clip.opacityKeyframes, relativeTime)
    }

    // Иначе используем базовую opacity
    return clip.opacity
  }

  /**
   * Интерполирует opacity между keyframes
   */
  private static interpolateOpacity(keyframes: VideoFadeKeyframe[], time: number): number {
    // Находим окружающие keyframes
    let prevKeyframe: VideoFadeKeyframe | null = null
    let nextKeyframe: VideoFadeKeyframe | null = null

    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i].time <= time) {
        prevKeyframe = keyframes[i]
      } else {
        nextKeyframe = keyframes[i]
        break
      }
    }

    // Если время до первого keyframe
    if (!prevKeyframe && nextKeyframe) {
      return nextKeyframe.opacity
    }

    // Если время после последнего keyframe
    if (prevKeyframe && !nextKeyframe) {
      return prevKeyframe.opacity
    }

    // Если нет keyframes
    if (!prevKeyframe || !nextKeyframe) {
      return 1
    }

    // Интерполируем между keyframes
    const duration = nextKeyframe.time - prevKeyframe.time
    const progress = (time - prevKeyframe.time) / duration
    const easing = prevKeyframe.easing || "linear"
    const factor = VideoFadeService.calculateFadeFactor(progress, easing)

    return prevKeyframe.opacity + (nextKeyframe.opacity - prevKeyframe.opacity) * factor
  }
}
