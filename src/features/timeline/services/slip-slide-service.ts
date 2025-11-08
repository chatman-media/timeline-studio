/**
 * SLIP/SLIDE Edit Service
 * Реализует полную функциональность SLIP и SLIDE редактирования
 */

import type { TimelineClip, TimelineProject, TimelineTrack } from "../types"
import { findSlideAdjacentClips, getSlideBounds, getSlipBounds } from "../utils/edit-operations"

export interface SlipEditResult {
  success: boolean
  updatedClip?: TimelineClip
  error?: string
}

export interface SlideEditResult {
  success: boolean
  updatedClips?: TimelineClip[]
  error?: string
}

export class SlipSlideService {
  /**
   * Выполняет SLIP редактирование клипа
   * SLIP изменяет только offset медиа внутри клипа, не изменяя его позицию на таймлайне
   */
  static performSlipEdit(clip: TimelineClip, deltaOffset: number, _track: TimelineTrack): SlipEditResult {
    // Получаем границы для slip
    const bounds = getSlipBounds(clip)

    // Вычисляем новый offset с учетом границ
    const newOffset = Math.max(bounds.min, Math.min(bounds.max, clip.offset + deltaOffset))

    // Если offset не изменился, возвращаем ошибку
    if (newOffset === clip.offset) {
      return {
        success: false,
        error: "Достигнут предел slip редактирования",
      }
    }

    // Создаем обновленный клип
    const updatedClip: TimelineClip = {
      ...clip,
      offset: newOffset,
      // Обновляем временные метки медиа
      mediaStartTime: newOffset,
      mediaEndTime: newOffset + clip.duration,
    }

    return {
      success: true,
      updatedClip,
    }
  }

  /**
   * Выполняет SLIDE редактирование клипа
   * SLIDE перемещает клип, одновременно изменяя длительность соседних клипов
   */
  static performSlideEdit(clip: TimelineClip, deltaPosition: number, track: TimelineTrack): SlideEditResult {
    // Находим соседние клипы
    const { prev, next } = findSlideAdjacentClips(clip, track)

    // Проверяем, есть ли соседние клипы для slide
    if (!prev && !next) {
      return {
        success: false,
        error: "Нет соседних клипов для slide редактирования",
      }
    }

    // Получаем границы для slide
    const bounds = getSlideBounds(clip, track)

    // Вычисляем фактическое смещение с учетом границ
    const actualDelta = Math.max(bounds.min, Math.min(bounds.max, deltaPosition))

    if (actualDelta === 0) {
      return {
        success: false,
        error: "Достигнут предел slide редактирования",
      }
    }

    const updatedClips: TimelineClip[] = []

    // Обновляем основной клип
    updatedClips.push({
      ...clip,
      startTime: clip.startTime + actualDelta,
    })

    // Обновляем предыдущий клип (увеличиваем/уменьшаем его длину)
    if (prev) {
      updatedClips.push({
        ...prev,
        duration: prev.duration + actualDelta,
      })
    }

    // Обновляем следующий клип (уменьшаем/увеличиваем его длину и сдвигаем)
    if (next) {
      updatedClips.push({
        ...next,
        startTime: next.startTime + actualDelta,
        duration: next.duration - actualDelta,
        // Также нужно обновить offset для следующего клипа
        offset: next.offset + actualDelta,
        mediaStartTime: next.mediaStartTime + actualDelta,
      })
    }

    return {
      success: true,
      updatedClips,
    }
  }

  /**
   * Проверяет, можно ли выполнить SLIP редактирование
   */
  static canSlipEdit(clip: TimelineClip): boolean {
    const bounds = getSlipBounds(clip)
    return bounds.max > 0 || bounds.min < 0
  }

  /**
   * Проверяет, можно ли выполнить SLIDE редактирование
   */
  static canSlideEdit(clip: TimelineClip, track: TimelineTrack): boolean {
    const { prev, next } = findSlideAdjacentClips(clip, track)
    return !!(prev || next)
  }

  /**
   * Вычисляет визуальные подсказки для SLIP редактирования
   */
  static getSlipVisualHints(
    clip: TimelineClip,
    currentOffset: number,
  ): {
    availableMediaStart: number
    availableMediaEnd: number
    currentViewStart: number
    currentViewEnd: number
  } {
    const mediaDuration = clip.mediaDuration || clip.duration

    return {
      availableMediaStart: 0,
      availableMediaEnd: mediaDuration,
      currentViewStart: clip.offset + currentOffset,
      currentViewEnd: clip.offset + currentOffset + clip.duration,
    }
  }

  /**
   * Вычисляет визуальные подсказки для SLIDE редактирования
   */
  static getSlideVisualHints(
    clip: TimelineClip,
    track: TimelineTrack,
    currentDelta: number,
  ): {
    newClipPosition: number
    prevClipEnd?: number
    nextClipStart?: number
  } {
    const { prev, next } = findSlideAdjacentClips(clip, track)

    return {
      newClipPosition: clip.startTime + currentDelta,
      prevClipEnd: prev ? prev.startTime + prev.duration + currentDelta : undefined,
      nextClipStart: next ? next.startTime + currentDelta : undefined,
    }
  }

  /**
   * Применяет SLIP редактирование к проекту
   */
  static applySlipToProject(project: TimelineProject, clipId: string, deltaOffset: number): TimelineProject | null {
    // Находим клип и трек
    let targetTrack: TimelineTrack | null = null
    let targetClip: TimelineClip | null = null

    // Ищем в секциях
    for (const section of project.sections) {
      for (const track of section.tracks) {
        const clip = track.clips.find((c: TimelineClip) => c.id === clipId)
        if (clip) {
          targetTrack = track
          targetClip = clip
          break
        }
      }
      if (targetClip) break
    }

    // Ищем в глобальных треках
    if (!targetClip) {
      for (const track of project.globalTracks) {
        const clip = track.clips.find((c: TimelineClip) => c.id === clipId)
        if (clip) {
          targetTrack = track
          targetClip = clip
          break
        }
      }
    }

    if (!targetTrack || !targetClip) return null

    const result = SlipSlideService.performSlipEdit(targetClip, deltaOffset, targetTrack)
    if (!result.success || !result.updatedClip) return null

    // Создаем обновленный проект
    const updatedProject = { ...project }

    // Обновляем клип в треке
    const updateTrack = (track: TimelineTrack): TimelineTrack => {
      if (track.id === targetTrack!.id) {
        return {
          ...track,
          clips: track.clips.map((c) => (c.id === clipId ? result.updatedClip! : c)),
        }
      }
      return track
    }

    // Обновляем секции
    updatedProject.sections = project.sections.map((section: TimelineProject["sections"][0]) => ({
      ...section,
      tracks: section.tracks.map(updateTrack),
    }))

    // Обновляем глобальные треки
    updatedProject.globalTracks = project.globalTracks.map(updateTrack)

    return updatedProject
  }

  /**
   * Применяет SLIDE редактирование к проекту
   */
  static applySlideToProject(project: TimelineProject, clipId: string, deltaPosition: number): TimelineProject | null {
    // Находим клип и трек
    let targetTrack: TimelineTrack | null = null
    let targetClip: TimelineClip | null = null

    // Ищем клип
    for (const section of project.sections) {
      for (const track of section.tracks) {
        const clip = track.clips.find((c: TimelineClip) => c.id === clipId)
        if (clip) {
          targetTrack = track
          targetClip = clip
          break
        }
      }
      if (targetClip) break
    }

    if (!targetClip) {
      for (const track of project.globalTracks) {
        const clip = track.clips.find((c: TimelineClip) => c.id === clipId)
        if (clip) {
          targetTrack = track
          targetClip = clip
          break
        }
      }
    }

    if (!targetTrack || !targetClip) return null

    const result = SlipSlideService.performSlideEdit(targetClip, deltaPosition, targetTrack)
    if (!result.success || !result.updatedClips) return null

    // Создаем обновленный проект
    const updatedProject = { ...project }

    // Создаем map обновленных клипов для быстрого поиска
    const updatedClipsMap = new Map(result.updatedClips.map((clip: TimelineClip) => [clip.id, clip]))

    // Обновляем треки
    const updateTrack = (track: TimelineTrack): TimelineTrack => {
      if (track.id === targetTrack!.id) {
        return {
          ...track,
          clips: track.clips.map((c: TimelineClip) => updatedClipsMap.get(c.id) || c),
        }
      }
      return track
    }

    // Обновляем секции
    updatedProject.sections = project.sections.map((section: TimelineProject["sections"][0]) => ({
      ...section,
      tracks: section.tracks.map(updateTrack),
    }))

    // Обновляем глобальные треки
    updatedProject.globalTracks = project.globalTracks.map(updateTrack)

    return updatedProject
  }
}
