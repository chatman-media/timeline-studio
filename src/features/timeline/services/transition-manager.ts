/**
 * Transition Manager - управление переходами между клипами
 */

import type { Transition } from "@/features/transitions/types/transitions"
import { createLogger } from "@/lib/tauri-logger"
import { generateId } from "@/lib/utils"
import type { AppliedTransition, TimelineClip, TimelineProject } from "../types"

const logger = createLogger("TransitionManager")

export interface TransitionApplication {
  leftClipId: string
  rightClipId: string
  transitionId: string
  duration: number
  parameters?: Record<string, any>
}

export class TransitionManager {
  /**
   * Применить переход между двумя клипами
   */
  static applyTransitionBetweenClips(project: TimelineProject, application: TransitionApplication): TimelineProject {
    const { leftClipId, rightClipId, transitionId, duration, parameters = {} } = application

    // Находим клипы
    const leftClip = TransitionManager.findClipInProject(project, leftClipId)
    const rightClip = TransitionManager.findClipInProject(project, rightClipId)

    if (!leftClip || !rightClip) {
      logger.error("Clips not found for transition")
      return project
    }

    // Проверяем, что клипы на одном треке и рядом друг с другом
    if (leftClip.trackId !== rightClip.trackId) {
      logger.error("Clips must be on the same track for transition")
      return project
    }

    // Проверяем, что правый клип начинается после левого
    const leftClipEnd = leftClip.startTime + leftClip.duration
    const gap = rightClip.startTime - leftClipEnd

    if (Math.abs(gap) > 0.1) {
      // Допускаем небольшую погрешность
      logger.error("Clips must be adjacent for transition")
      return project
    }

    // Создаем переходы для обоих клипов
    const outTransition: AppliedTransition = {
      id: generateId(),
      transitionId,
      type: "out",
      duration,
      customParams: parameters,
      isEnabled: true,
    }

    const inTransition: AppliedTransition = {
      id: generateId(),
      transitionId,
      type: "in",
      duration,
      customParams: parameters,
      isEnabled: true,
    }

    // Обновляем клипы
    const updatedProject = TransitionManager.updateClipInProject(project, leftClipId, {
      transitions: [...leftClip.transitions.filter((t) => t.type !== "out"), outTransition],
    })

    return TransitionManager.updateClipInProject(updatedProject, rightClipId, {
      transitions: [...rightClip.transitions.filter((t) => t.type !== "in"), inTransition],
    })
  }

  /**
   * Удалить переход между клипами
   */
  static removeTransitionBetweenClips(
    project: TimelineProject,
    leftClipId: string,
    rightClipId: string,
  ): TimelineProject {
    // Находим клипы
    const leftClip = TransitionManager.findClipInProject(project, leftClipId)
    const rightClip = TransitionManager.findClipInProject(project, rightClipId)

    if (!leftClip || !rightClip) {
      return project
    }

    // Удаляем out переход из левого клипа
    const updatedProject = TransitionManager.updateClipInProject(project, leftClipId, {
      transitions: leftClip.transitions.filter((t) => t.type !== "out"),
    })

    // Удаляем in переход из правого клипа
    return TransitionManager.updateClipInProject(updatedProject, rightClipId, {
      transitions: rightClip.transitions.filter((t) => t.type !== "in"),
    })
  }

  /**
   * Обновить параметры перехода
   */
  static updateTransitionParameters(
    project: TimelineProject,
    clipId: string,
    transitionId: string,
    parameters: Record<string, any>,
  ): TimelineProject {
    const clip = TransitionManager.findClipInProject(project, clipId)
    if (!clip) return project

    const updatedTransitions = clip.transitions.map((t) =>
      t.id === transitionId ? { ...t, customParams: { ...t.customParams, ...parameters } } : t,
    )

    return TransitionManager.updateClipInProject(project, clipId, {
      transitions: updatedTransitions,
    })
  }

  /**
   * Получить все переходы между клипами на треке
   */
  static getTrackTransitions(
    project: TimelineProject,
    trackId: string,
  ): Array<{
    leftClip: TimelineClip
    rightClip: TimelineClip
    transition: AppliedTransition
  }> {
    const transitions: Array<{
      leftClip: TimelineClip
      rightClip: TimelineClip
      transition: AppliedTransition
    }> = []

    // Находим трек
    const track = TransitionManager.findTrackInProject(project, trackId)
    if (!track) return transitions

    // Сортируем клипы по времени
    const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime)

    // Проверяем пары соседних клипов
    for (let i = 0; i < sortedClips.length - 1; i++) {
      const leftClip = sortedClips[i]
      const rightClip = sortedClips[i + 1]

      // Проверяем есть ли переход
      const outTransition = leftClip.transitions.find((t) => t.type === "out")
      const inTransition = rightClip.transitions.find((t) => t.type === "in")

      if (outTransition && inTransition && outTransition.transitionId === inTransition.transitionId) {
        transitions.push({
          leftClip,
          rightClip,
          transition: outTransition,
        })
      }
    }

    return transitions
  }

  /**
   * Проверить можно ли применить переход между клипами
   */
  static canApplyTransition(leftClip: TimelineClip, rightClip: TimelineClip, transition: Transition): boolean {
    // Переходы можно применять только между видео/изображениями
    const isLeftCompatible = leftClip.type === "video" || leftClip.type === "image"
    const isRightCompatible = rightClip.type === "video" || rightClip.type === "image"

    if (!isLeftCompatible || !isRightCompatible) {
      return false
    }

    // Проверяем, что клипы на одном треке
    if (leftClip.trackId !== rightClip.trackId) {
      return false
    }

    // Проверяем, что клипы рядом
    const leftClipEnd = leftClip.startTime + leftClip.duration
    const gap = Math.abs(rightClip.startTime - leftClipEnd)

    if (gap > 0.1) {
      return false
    }

    // Проверяем минимальную длительность клипов для перехода
    const minDuration = transition.duration?.min || 1.0
    if (leftClip.duration < minDuration || rightClip.duration < minDuration) {
      return false
    }

    return true
  }

  /**
   * Автоматически определить оптимальную длительность перехода
   */
  static calculateOptimalTransitionDuration(
    leftClip: TimelineClip,
    rightClip: TimelineClip,
    baseTransition: Transition,
  ): number {
    const baseDuration = baseTransition.duration?.default || 1.0
    const maxAllowed = baseTransition.duration?.max || baseDuration * 2
    const maxDuration = Math.min(
      leftClip.duration * 0.5, // Не более половины длины клипа
      rightClip.duration * 0.5,
      maxAllowed, // Не более максимальной длительности перехода
    )

    return Math.min(baseDuration, maxDuration)
  }

  // ============================================================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ============================================================================

  private static findClipInProject(project: TimelineProject, clipId: string): TimelineClip | null {
    for (const section of project.sections) {
      for (const track of section.tracks) {
        const clip = track.clips.find((c) => c.id === clipId)
        if (clip) return clip
      }
    }

    for (const track of project.globalTracks) {
      const clip = track.clips.find((c) => c.id === clipId)
      if (clip) return clip
    }

    return null
  }

  private static findTrackInProject(project: TimelineProject, trackId: string) {
    for (const section of project.sections) {
      const track = section.tracks.find((t) => t.id === trackId)
      if (track) return track
    }

    const globalTrack = project.globalTracks.find((t) => t.id === trackId)
    if (globalTrack) return globalTrack

    return null
  }

  private static updateClipInProject(
    project: TimelineProject,
    clipId: string,
    updates: Partial<TimelineClip>,
  ): TimelineProject {
    return {
      ...project,
      sections: project.sections.map((section) => ({
        ...section,
        tracks: section.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => (clip.id === clipId ? { ...clip, ...updates } : clip)),
        })),
      })),
      globalTracks: project.globalTracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => (clip.id === clipId ? { ...clip, ...updates } : clip)),
      })),
    }
  }
}
