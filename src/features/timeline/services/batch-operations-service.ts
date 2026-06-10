/**
 * Batch Operations Service
 * Provides batch operations for multiple clips in timeline
 */

import type { AppliedEffect } from "@/core/types"
import type { TimelineClip, TimelineTrack } from "../types"
import { type VideoFadeOptions, VideoFadeService } from "./video-fade-service"

export interface BatchOperationResult {
  success: boolean
  processedClips: TimelineClip[]
  failedClips: Array<{
    clip: TimelineClip
    error: string
  }>
  totalProcessed: number
  totalFailed: number
}

export interface BatchMoveOptions {
  deltaTime: number // Смещение по времени в секундах
  maintainRelativePositions?: boolean // Сохранять относительные позиции между клипами
  snapToGrid?: boolean // Привязка к сетке
  gridSize?: number // Размер сетки в секундах
}

export interface BatchTrimOptions {
  trimStart?: number // Обрезать начало на N секунд
  trimEnd?: number // Обрезать конец на N секунд
  alignToPlayhead?: boolean // Выровнять по позиции курсора
  maintainDuration?: boolean // Сохранить длительность (для trim start)
}

export interface BatchSpeedOptions {
  speed: number // Новая скорость (1.0 = нормальная)
  maintainPitch?: boolean // Сохранить высоту тона
  adjustDuration?: boolean // Изменить длительность пропорционально скорости
}

export interface BatchEffectOptions {
  effect: AppliedEffect
  replaceExisting?: boolean // Заменить существующие эффекты того же типа
  position?: "start" | "end" // Где добавить эффект в цепочку
}

export interface BatchColorOptions {
  opacity?: number
  fadeIn?: VideoFadeOptions
  fadeOut?: VideoFadeOptions
  colorGrading?: any // Параметры цветокоррекции
}

export class BatchOperationsService {
  /**
   * Перемещает группу клипов
   */
  static moveClips(clips: TimelineClip[], tracks: TimelineTrack[], options: BatchMoveOptions): BatchOperationResult {
    const result: BatchOperationResult = {
      success: true,
      processedClips: [],
      failedClips: [],
      totalProcessed: 0,
      totalFailed: 0,
    }

    // Сортируем клипы по времени начала для правильной обработки
    const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime)

    // Если нужно сохранить относительные позиции, вычисляем базовое время
    const baseTime = options.maintainRelativePositions ? sortedClips[0]?.startTime || 0 : 0

    for (const clip of sortedClips) {
      try {
        let newStartTime = clip.startTime + options.deltaTime

        // Сохраняем относительную позицию
        if (options.maintainRelativePositions && sortedClips[0]) {
          const relativeOffset = clip.startTime - sortedClips[0].startTime
          newStartTime = baseTime + options.deltaTime + relativeOffset
        }

        // Привязка к сетке
        if (options.snapToGrid && options.gridSize) {
          newStartTime = Math.round(newStartTime / options.gridSize) * options.gridSize
        }

        // Проверяем коллизии с другими клипами на треке
        const track = tracks.find((t) => t.id === clip.trackId)
        if (track) {
          const hasCollision = track.clips.some(
            (c) =>
              c.id !== clip.id && newStartTime < c.startTime + c.duration && newStartTime + clip.duration > c.startTime,
          )

          if (hasCollision) {
            result.failedClips.push({
              clip,
              error: "Collision with other clips on track",
            })
            result.totalFailed++
            continue
          }
        }

        // Создаем обновленный клип
        const updatedClip: TimelineClip = {
          ...clip,
          startTime: newStartTime,
        }

        result.processedClips.push(updatedClip)
        result.totalProcessed++
      } catch (error) {
        result.failedClips.push({
          clip,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        result.totalFailed++
        result.success = false
      }
    }

    return result
  }

  /**
   * Обрезает группу клипов
   */
  static trimClips(clips: TimelineClip[], options: BatchTrimOptions): BatchOperationResult {
    const result: BatchOperationResult = {
      success: true,
      processedClips: [],
      failedClips: [],
      totalProcessed: 0,
      totalFailed: 0,
    }

    for (const clip of clips) {
      try {
        const updatedClip = { ...clip }

        // Обрезка начала
        if (options.trimStart !== undefined && options.trimStart > 0) {
          const maxTrim = clip.duration - 0.1 // Минимальная длительность 0.1 сек

          if (options.trimStart >= maxTrim) {
            result.failedClips.push({
              clip,
              error: "Trim amount exceeds clip duration",
            })
            result.totalFailed++
            continue
          }

          if (options.maintainDuration) {
            // Сдвигаем offset, сохраняя длительность
            updatedClip.offset = (updatedClip.offset || 0) + options.trimStart
            updatedClip.mediaStartTime = (updatedClip.mediaStartTime || 0) + options.trimStart
          } else {
            // Уменьшаем длительность и сдвигаем начало
            updatedClip.startTime += options.trimStart
            updatedClip.duration -= options.trimStart
            updatedClip.mediaStartTime = (updatedClip.mediaStartTime || 0) + options.trimStart
          }
        }

        // Обрезка конца
        if (options.trimEnd !== undefined && options.trimEnd > 0) {
          const maxTrim = updatedClip.duration - 0.1

          if (options.trimEnd >= maxTrim) {
            result.failedClips.push({
              clip,
              error: "Trim amount exceeds clip duration",
            })
            result.totalFailed++
            continue
          }

          updatedClip.duration -= options.trimEnd
          updatedClip.mediaEndTime =
            (updatedClip.mediaEndTime || updatedClip.mediaStartTime + updatedClip.duration) - options.trimEnd
        }

        result.processedClips.push(updatedClip)
        result.totalProcessed++
      } catch (error) {
        result.failedClips.push({
          clip,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        result.totalFailed++
        result.success = false
      }
    }

    return result
  }

  /**
   * Изменяет скорость группы клипов
   */
  static changeSpeed(clips: TimelineClip[], options: BatchSpeedOptions): BatchOperationResult {
    const result: BatchOperationResult = {
      success: true,
      processedClips: [],
      failedClips: [],
      totalProcessed: 0,
      totalFailed: 0,
    }

    for (const clip of clips) {
      try {
        const updatedClip: TimelineClip = {
          ...clip,
          speed: options.speed,
          playbackRate: options.speed,
          maintainPitch: options.maintainPitch,
        }

        // Изменяем длительность пропорционально скорости
        if (options.adjustDuration) {
          const speedFactor = 1 / options.speed
          updatedClip.duration = clip.duration * speedFactor

          // Корректируем mediaEndTime
          const mediaStart = clip.mediaStartTime || 0
          const mediaEnd = clip.mediaEndTime || mediaStart + clip.duration
          const mediaDuration = mediaEnd - mediaStart
          updatedClip.mediaEndTime = mediaStart + mediaDuration * speedFactor
        }

        result.processedClips.push(updatedClip)
        result.totalProcessed++
      } catch (error) {
        result.failedClips.push({
          clip,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        result.totalFailed++
        result.success = false
      }
    }

    return result
  }

  /**
   * Применяет эффект к группе клипов
   */
  static applyEffect(clips: TimelineClip[], options: BatchEffectOptions): BatchOperationResult {
    const result: BatchOperationResult = {
      success: true,
      processedClips: [],
      failedClips: [],
      totalProcessed: 0,
      totalFailed: 0,
    }

    for (const clip of clips) {
      try {
        let effects = [...(clip.effects || [])]

        // Удаляем существующие эффекты того же типа, если нужна замена
        if (options.replaceExisting) {
          effects = effects.filter((e) => e.effectId !== options.effect.effectId)
        }

        // Добавляем новый эффект
        const newEffect = {
          ...options.effect,
          id: `${options.effect.id}_${Date.now()}_${Math.random()}`, // Уникальный ID для каждого клипа
        }

        if (options.position === "start") {
          effects.unshift(newEffect)
        } else {
          effects.push(newEffect)
        }

        // Переиндексируем порядок
        effects.forEach((effect, index) => {
          effect.order = index
        })

        const updatedClip: TimelineClip = {
          ...clip,
          effects,
        }

        result.processedClips.push(updatedClip)
        result.totalProcessed++
      } catch (error) {
        result.failedClips.push({
          clip,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        result.totalFailed++
        result.success = false
      }
    }

    return result
  }

  /**
   * Применяет цветовые настройки к группе клипов
   */
  static applyColorSettings(clips: TimelineClip[], options: BatchColorOptions): BatchOperationResult {
    const result: BatchOperationResult = {
      success: true,
      processedClips: [],
      failedClips: [],
      totalProcessed: 0,
      totalFailed: 0,
    }

    for (const clip of clips) {
      try {
        let updatedClip = { ...clip }

        // Применяем opacity
        if (options.opacity !== undefined) {
          updatedClip.opacity = Math.max(0, Math.min(1, options.opacity))
        }

        // Применяем fade in
        if (options.fadeIn) {
          updatedClip = VideoFadeService.applyFadeIn(updatedClip, options.fadeIn)
        }

        // Применяем fade out
        if (options.fadeOut) {
          updatedClip = VideoFadeService.applyFadeOut(updatedClip, options.fadeOut)
        }

        // Применяем цветокоррекцию
        if (options.colorGrading) {
          ;(updatedClip as any).colorGrading = {
            ...options.colorGrading,
            id: `color_${Date.now()}_${Math.random()}`,
          }
        }

        result.processedClips.push(updatedClip)
        result.totalProcessed++
      } catch (error) {
        result.failedClips.push({
          clip,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        result.totalFailed++
        result.success = false
      }
    }

    return result
  }

  /**
   * Группирует клипы по трекам
   */
  static groupClipsByTrack(clips: TimelineClip[]): Map<string, TimelineClip[]> {
    const grouped = new Map<string, TimelineClip[]>()

    for (const clip of clips) {
      const trackClips = grouped.get(clip.trackId) || []
      trackClips.push(clip)
      grouped.set(clip.trackId, trackClips)
    }

    return grouped
  }

  /**
   * Выравнивает клипы по времени
   */
  static alignClips(
    clips: TimelineClip[],
    alignment: "start" | "end" | "center",
    referenceTime?: number,
  ): BatchOperationResult {
    const result: BatchOperationResult = {
      success: true,
      processedClips: [],
      failedClips: [],
      totalProcessed: 0,
      totalFailed: 0,
    }

    if (clips.length === 0) {
      return result
    }

    // Определяем опорное время
    let alignTime = referenceTime
    if (alignTime === undefined) {
      const times = clips.map((c) => {
        switch (alignment) {
          case "start":
            return c.startTime
          case "end":
            return c.startTime + c.duration
          case "center":
            return c.startTime + c.duration / 2
        }
      })
      alignTime = Math.min(...times)
    }

    // Выравниваем каждый клип
    for (const clip of clips) {
      try {
        let newStartTime: number

        switch (alignment) {
          case "start":
            newStartTime = alignTime
            break
          case "end":
            newStartTime = alignTime - clip.duration
            break
          case "center":
            newStartTime = alignTime - clip.duration / 2
            break
        }

        const updatedClip: TimelineClip = {
          ...clip,
          startTime: newStartTime,
        }

        result.processedClips.push(updatedClip)
        result.totalProcessed++
      } catch (error) {
        result.failedClips.push({
          clip,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        result.totalFailed++
        result.success = false
      }
    }

    return result
  }

  /**
   * Распределяет клипы равномерно
   */
  static distributeClips(
    clips: TimelineClip[],
    spacing: number, // Расстояние между клипами в секундах
    startTime?: number,
  ): BatchOperationResult {
    const result: BatchOperationResult = {
      success: true,
      processedClips: [],
      failedClips: [],
      totalProcessed: 0,
      totalFailed: 0,
    }

    if (clips.length === 0) {
      return result
    }

    // Сортируем клипы по текущему времени начала
    const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime)
    let currentTime = startTime ?? sortedClips[0].startTime

    for (const clip of sortedClips) {
      try {
        const updatedClip: TimelineClip = {
          ...clip,
          startTime: currentTime,
        }

        result.processedClips.push(updatedClip)
        result.totalProcessed++

        // Следующая позиция
        currentTime += clip.duration + spacing
      } catch (error) {
        result.failedClips.push({
          clip,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        result.totalFailed++
        result.success = false
      }
    }

    return result
  }

  /**
   * Создает переходы между выбранными клипами
   */
  static createTransitionsBetweenClips(
    clips: TimelineClip[],
    transitionDuration: number,
    _transitionType: string,
  ): BatchOperationResult {
    const result: BatchOperationResult = {
      success: true,
      processedClips: [],
      failedClips: [],
      totalProcessed: 0,
      totalFailed: 0,
    }

    // Группируем клипы по трекам
    const clipsByTrack = BatchOperationsService.groupClipsByTrack(clips)

    for (const [trackId, trackClips] of clipsByTrack) {
      // Сортируем клипы по времени
      const sortedClips = [...trackClips].sort((a, b) => a.startTime - b.startTime)

      // Создаем переходы между последовательными клипами
      for (let i = 0; i < sortedClips.length - 1; i++) {
        const clipA = sortedClips[i]
        const clipB = sortedClips[i + 1]

        try {
          // Проверяем, достаточно ли близко клипы для перехода
          const gap = clipB.startTime - (clipA.startTime + clipA.duration)

          if (gap > transitionDuration) {
            // Клипы слишком далеко друг от друга
            continue
          }

          // Сдвигаем второй клип для создания перекрытия
          const overlap = transitionDuration - gap
          const updatedClipB: TimelineClip = {
            ...clipB,
            startTime: clipB.startTime - overlap,
          }

          // Применяем video fade для crossfade эффекта
          const fadeOptions: VideoFadeOptions = {
            type: "cosine",
            duration: transitionDuration,
          }

          const fadedClipA = VideoFadeService.applyFadeOut(clipA, fadeOptions)
          const fadedClipB = VideoFadeService.applyFadeIn(updatedClipB, fadeOptions)

          result.processedClips.push(fadedClipA, fadedClipB)
          result.totalProcessed += 2
        } catch (error) {
          result.failedClips.push({
            clip: clipA,
            error: error instanceof Error ? error.message : "Unknown error",
          })
          result.totalFailed++
          result.success = false
        }
      }
    }

    return result
  }

  /**
   * Удаляет все эффекты с группы клипов
   */
  static removeAllEffects(clips: TimelineClip[]): BatchOperationResult {
    const result: BatchOperationResult = {
      success: true,
      processedClips: [],
      failedClips: [],
      totalProcessed: 0,
      totalFailed: 0,
    }

    for (const clip of clips) {
      try {
        const updatedClip: TimelineClip = {
          ...clip,
          effects: [],
          filters: [],
          fadeIn: undefined,
          fadeOut: undefined,
          opacityKeyframes: undefined,
        }

        result.processedClips.push(updatedClip)
        result.totalProcessed++
      } catch (error) {
        result.failedClips.push({
          clip,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        result.totalFailed++
        result.success = false
      }
    }

    return result
  }

  /**
   * Синхронизирует клипы по маркерам
   */
  static syncClipsByMarkers(
    clips: TimelineClip[],
    markerTime: number,
    syncPoint: "start" | "end" | "center" = "start",
  ): BatchOperationResult {
    const result: BatchOperationResult = {
      success: true,
      processedClips: [],
      failedClips: [],
      totalProcessed: 0,
      totalFailed: 0,
    }

    for (const clip of clips) {
      try {
        let newStartTime: number

        switch (syncPoint) {
          case "start":
            newStartTime = markerTime
            break
          case "end":
            newStartTime = markerTime - clip.duration
            break
          case "center":
            newStartTime = markerTime - clip.duration / 2
            break
        }

        const updatedClip: TimelineClip = {
          ...clip,
          startTime: Math.max(0, newStartTime), // Не допускаем отрицательное время
        }

        result.processedClips.push(updatedClip)
        result.totalProcessed++
      } catch (error) {
        result.failedClips.push({
          clip,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        result.totalFailed++
        result.success = false
      }
    }

    return result
  }
}
