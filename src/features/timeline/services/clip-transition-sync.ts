/**
 * Clip-Transition Synchronization Service
 * Синхронизация переходов при операциях с клипами
 */

import type { TimelineTransition as CoreTimelineTransition } from "@timeline-studio/core/types"
import type { TimelineProject } from "@/features/timeline/types"

// Используем базовый core тип для совместимости с resources
type TimelineTransition = CoreTimelineTransition

import { updateTimelineTransitionProperties } from "./resource-manager"
import {
  adjustTransitionsForClipChange,
  checkTransitionCollisions,
  getClipTransitions,
  removeTransition,
} from "./timeline-transition-manager"

/**
 * Обновить переходы при перемещении клипа
 */
export function syncTransitionsOnClipMove(
  project: TimelineProject,
  clipId: string,
  oldTrackId: string,
  newTrackId: string,
  oldPosition: number,
  newPosition: number,
  oldDuration: number,
): TimelineProject {
  let updatedProject = { ...project }

  // Если клип перемещён на другой трек, удаляем все связанные переходы
  if (oldTrackId !== newTrackId) {
    const transitions = getClipTransitions(project, clipId)

    // Удаляем все переходы связанные с клипом
    if (transitions.in) {
      updatedProject = removeTransition(updatedProject, transitions.in.id)
    }
    if (transitions.out) {
      updatedProject = removeTransition(updatedProject, transitions.out.id)
    }
    if (transitions.betweenBefore) {
      updatedProject = removeTransition(updatedProject, transitions.betweenBefore.id)
    }
    if (transitions.betweenAfter) {
      updatedProject = removeTransition(updatedProject, transitions.betweenAfter.id)
    }
  } else {
    // Клип остался на том же треке - корректируем позиции переходов
    updatedProject = adjustTransitionsForClipChange(
      updatedProject,
      oldTrackId,
      clipId,
      oldPosition,
      newPosition,
      oldDuration,
      oldDuration,
    )
  }

  return updatedProject
}

/**
 * Обновить переходы при обрезке клипа
 */
export function syncTransitionsOnClipTrim(
  project: TimelineProject,
  clipId: string,
  trackId: string,
  oldStartTime: number,
  newStartTime: number,
  oldDuration: number,
  newDuration: number,
): TimelineProject {
  return adjustTransitionsForClipChange(project, trackId, clipId, oldStartTime, newStartTime, oldDuration, newDuration)
}

/**
 * Обработать переходы при удалении клипа
 */
export function syncTransitionsOnClipDelete(project: TimelineProject, clipId: string): TimelineProject {
  let updatedProject = { ...project }
  const transitions = getClipTransitions(project, clipId)

  // Удаляем все переходы связанные с клипом
  if (transitions.in) {
    updatedProject = removeTransition(updatedProject, transitions.in.id)
  }
  if (transitions.out) {
    updatedProject = removeTransition(updatedProject, transitions.out.id)
  }
  if (transitions.betweenBefore) {
    updatedProject = removeTransition(updatedProject, transitions.betweenBefore.id)
  }
  if (transitions.betweenAfter) {
    updatedProject = removeTransition(updatedProject, transitions.betweenAfter.id)
  }

  return updatedProject
}

/**
 * Обработать переходы при разрезании клипа
 */
export function syncTransitionsOnClipSplit(
  project: TimelineProject,
  originalClipId: string,
  leftClipId: string,
  rightClipId: string,
  splitTime: number,
): TimelineProject {
  let updatedProject = { ...project }
  const transitions = getClipTransitions(project, originalClipId)

  // Переход на вход остаётся с левым клипом
  if (transitions.in) {
    updatedProject = updateTimelineTransitionProperties(updatedProject, transitions.in.id, {
      endClipId: leftClipId,
    })
  }

  // Переход на выход переходит к правому клипу
  if (transitions.out) {
    const newPosition = splitTime + (transitions.out.position - splitTime)
    updatedProject = updateTimelineTransitionProperties(updatedProject, transitions.out.id, {
      startClipId: rightClipId,
      position: newPosition,
    })
  }

  // Переход "до" остаётся с левым клипом
  if (transitions.betweenBefore) {
    updatedProject = updateTimelineTransitionProperties(updatedProject, transitions.betweenBefore.id, {
      endClipId: leftClipId,
    })
  }

  // Переход "после" переходит к правому клипу
  if (transitions.betweenAfter) {
    updatedProject = updateTimelineTransitionProperties(updatedProject, transitions.betweenAfter.id, {
      startClipId: rightClipId,
    })
  }

  return updatedProject
}

/**
 * Проверить и устранить коллизии переходов после операции
 */
export function resolveTransitionCollisions(
  project: TimelineProject,
  trackId: string,
  changedTransitionId?: string,
): TimelineProject {
  let updatedProject = { ...project }
  const track = findTrack(project, trackId)
  if (!track || !track.transitions || !project.resources.timelineTransitions) return updatedProject

  const transitions = track.transitions
    .map((id) => project.resources.timelineTransitions?.find((t) => t.id === id))
    .filter((t) => t !== undefined)
    .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0)) as TimelineTransition[]

  // Проверяем каждый переход на коллизии
  for (let i = 0; i < transitions.length; i++) {
    const transition = transitions[i]
    if (!transition) continue

    // Пропускаем изменённый переход
    if (transition.id === changedTransitionId) continue

    // Проверяем коллизию с предыдущими переходами
    for (let j = 0; j < i; j++) {
      const prevTransition = transitions[j]
      if (!prevTransition) continue
      const prevEnd = prevTransition.position + prevTransition.duration

      if (prevEnd > transition.position) {
        // Коллизия! Сдвигаем текущий переход
        const newPosition = prevEnd + 0.1 // Небольшой отступ
        updatedProject = updateTimelineTransitionProperties(updatedProject, transition.id, { position: newPosition })
      }
    }
  }

  return updatedProject
}

/**
 * Валидация возможности добавления перехода
 */
export function canAddTransition(
  project: TimelineProject,
  trackId: string,
  position: number,
  duration: number,
  excludeId?: string,
): boolean {
  // Проверяем коллизии с существующими переходами
  if (checkTransitionCollisions(project, trackId, position, duration, excludeId)) {
    return false
  }

  // Проверяем, что переход не выходит за границы клипов
  const track = findTrack(project, trackId)
  if (!track) return false

  const clips = track.clips.sort((a, b) => a.startTime - b.startTime)
  const transitionEnd = position + duration

  // Для перехода между клипами проверяем, что он находится в области стыка
  for (let i = 0; i < clips.length - 1; i++) {
    const leftClip = clips[i]
    const rightClip = clips[i + 1]
    const leftEnd = leftClip.startTime + leftClip.duration
    const rightStart = rightClip.startTime

    // Если переход находится в области между клипами
    if (position >= leftEnd - duration / 2 && transitionEnd <= rightStart + duration / 2) {
      return true
    }
  }

  // Для переходов на вход/выход проверяем границы клипов
  for (const clip of clips) {
    const clipEnd = clip.startTime + clip.duration

    // Переход на вход
    if (position === clip.startTime && transitionEnd <= clip.startTime + duration) {
      return true
    }

    // Переход на выход
    if (position >= clipEnd - duration && transitionEnd === clipEnd) {
      return true
    }
  }

  return false
}

/**
 * Найти трек в проекте
 */
function findTrack(project: TimelineProject, trackId: string) {
  // Ищем в секциях
  for (const section of project.sections) {
    const track = section.tracks.find((t) => t.id === trackId)
    if (track) return track
  }

  // Ищем в глобальных треках
  return project.globalTracks.find((t) => t.id === trackId)
}
