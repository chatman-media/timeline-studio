/**
 * Timeline Transition Manager
 * Управление переходами на треках таймлайна
 */

import type { Transition } from "@/domains/video-editing/types"
import type { TimelineProject, TimelineTrack } from "@/features/timeline/types"
import type { TimelineTransition } from "../types/timeline-transition"
import {
  addTimelineTransitionToResources,
  createTimelineTransition,
  updateTimelineTransitionProperties,
} from "./resource-manager"

/**
 * Добавить переход между клипами
 */
export function addTransitionBetweenClips(
  project: TimelineProject,
  trackId: string,
  leftClipId: string,
  rightClipId: string,
  transitionResource: Transition,
  duration?: number,
): { project: TimelineProject; transition: TimelineTransition } {
  const track = findTrack(project, trackId)
  if (!track) {
    throw new Error(`Track ${trackId} not found`)
  }

  const leftClip = track.clips.find((c) => c.id === leftClipId)
  const rightClip = track.clips.find((c) => c.id === rightClipId)

  if (!leftClip || !rightClip) {
    throw new Error("Clips not found")
  }

  // Проверяем, что клипы соседние
  const leftEnd = leftClip.startTime + leftClip.duration
  const rightStart = rightClip.startTime

  if (Math.abs(leftEnd - rightStart) > 0.01) {
    throw new Error("Clips are not adjacent")
  }

  // Создаём переход
  const transitionDuration = duration || transitionResource.duration.default
  const position = leftEnd - transitionDuration / 2

  const { project: updatedProject, timelineTransition } = createTimelineTransition(project, transitionResource, {
    trackId,
    position,
    duration: transitionDuration,
    type: "between",
    parameters: {
      direction: transitionResource.parameters?.direction,
      intensity: transitionResource.parameters?.intensity || 1,
      easing: (transitionResource.parameters?.easing as any) ?? "easeInOut",
      blur: transitionResource.parameters?.blur
        ? {
            amount: transitionResource.parameters.blur.amount || 10,
            type: transitionResource.parameters.blur.type || "gaussian",
            quality: "medium",
          }
        : undefined,
      color: transitionResource.parameters?.color
        ? {
            tint: transitionResource.parameters.color.tint,
            saturation: transitionResource.parameters.color.saturation,
            brightness: transitionResource.parameters.color.brightness,
            contrast: 0,
            temperature: 0,
          }
        : undefined,
    },
  })

  // Обновляем связи с клипами
  const transition = {
    ...timelineTransition,
    startClipId: leftClipId,
    endClipId: rightClipId,
    trackId,
  }

  // Добавляем переход в ресурсы и трек
  const finalProject = addTimelineTransitionToResources(updatedProject, transition)
  const updatedTrack = findTrack(finalProject, trackId)
  if (updatedTrack) {
    updatedTrack.transitions = [...(updatedTrack.transitions || []), transition.id]
  }

  return { project: finalProject, transition }
}

/**
 * Добавить переход на вход клипа
 */
export function addTransitionIn(
  project: TimelineProject,
  trackId: string,
  clipId: string,
  transitionResource: Transition,
  duration?: number,
): { project: TimelineProject; transition: TimelineTransition } {
  const track = findTrack(project, trackId)
  if (!track) {
    throw new Error(`Track ${trackId} not found`)
  }

  const clip = track.clips.find((c) => c.id === clipId)
  if (!clip) {
    throw new Error(`Clip ${clipId} not found`)
  }

  const transitionDuration = duration || transitionResource.duration.default
  const position = clip.startTime

  const { project: updatedProject, timelineTransition } = createTimelineTransition(project, transitionResource, {
    trackId,
    position,
    duration: transitionDuration,
    type: "in",
    parameters: {
      intensity: transitionResource.parameters?.intensity || 1,
      easing: (transitionResource.parameters?.easing as any) ?? "easeInOut",
      direction: transitionResource.parameters?.direction,
      ...transitionResource.parameters,
    } as any,
  })

  // Обновляем связи
  const transition = {
    ...timelineTransition,
    endClipId: clipId,
    trackId,
  }

  // Добавляем в ресурсы и трек
  const finalProject = addTimelineTransitionToResources(updatedProject, transition)
  const updatedTrack = findTrack(finalProject, trackId)
  if (updatedTrack) {
    updatedTrack.transitions = [...(updatedTrack.transitions || []), transition.id]
  }

  return { project: finalProject, transition }
}

/**
 * Добавить переход на выход клипа
 */
export function addTransitionOut(
  project: TimelineProject,
  trackId: string,
  clipId: string,
  transitionResource: Transition,
  duration?: number,
): { project: TimelineProject; transition: TimelineTransition } {
  const track = findTrack(project, trackId)
  if (!track) {
    throw new Error(`Track ${trackId} not found`)
  }

  const clip = track.clips.find((c) => c.id === clipId)
  if (!clip) {
    throw new Error(`Clip ${clipId} not found`)
  }

  const transitionDuration = duration || transitionResource.duration.default
  const position = clip.startTime + clip.duration - transitionDuration

  const { project: updatedProject, timelineTransition } = createTimelineTransition(project, transitionResource, {
    trackId,
    position,
    duration: transitionDuration,
    type: "out",
    parameters: {
      intensity: transitionResource.parameters?.intensity || 1,
      easing: (transitionResource.parameters?.easing as any) ?? "easeInOut",
      direction: transitionResource.parameters?.direction,
      ...transitionResource.parameters,
    } as any,
  })

  // Обновляем связи
  const transition = {
    ...timelineTransition,
    startClipId: clipId,
    trackId,
  }

  // Добавляем в ресурсы и трек
  const finalProject = addTimelineTransitionToResources(updatedProject, transition)
  const updatedTrack = findTrack(finalProject, trackId)
  if (updatedTrack) {
    updatedTrack.transitions = [...(updatedTrack.transitions || []), transition.id]
  }

  return { project: finalProject, transition }
}

/**
 * Получить переходы трека
 */
export function getTrackTransitions(project: TimelineProject, trackId: string): TimelineTransition[] {
  const track = findTrack(project, trackId)
  if (!track || !track.transitions) {
    return []
  }

  return track.transitions
    .map((id) => project.resources.timelineTransitions.find((t) => t.id === id))
    .filter((t): t is TimelineTransition => t !== undefined)
}

/**
 * Проверить коллизии переходов
 */
export function checkTransitionCollisions(
  project: TimelineProject,
  trackId: string,
  position: number,
  duration: number,
  excludeId?: string,
): boolean {
  const transitions = getTrackTransitions(project, trackId)
  const endPosition = position + duration

  return transitions.some((t) => {
    if (t.id === excludeId) return false
    const tEnd = t.position + t.duration
    return (
      (position >= t.position && position < tEnd) ||
      (endPosition > t.position && endPosition <= tEnd) ||
      (position <= t.position && endPosition >= tEnd)
    )
  })
}

/**
 * Автоматическая корректировка переходов при изменении клипов
 */
export function adjustTransitionsForClipChange(
  project: TimelineProject,
  trackId: string,
  clipId: string,
  oldPosition: number,
  newPosition: number,
  oldDuration: number,
  newDuration: number,
): TimelineProject {
  let updatedProject = { ...project }
  const transitions = getTrackTransitions(project, trackId)

  transitions.forEach((transition) => {
    let needsUpdate = false
    const updates: Partial<TimelineTransition> = {}

    // Переход между клипами
    if (transition.type === "between") {
      if (transition.startClipId === clipId) {
        // Корректируем позицию перехода
        const shift = newPosition + newDuration - (oldPosition + oldDuration)
        updates.position = transition.position + shift
        needsUpdate = true
      } else if (transition.endClipId === clipId) {
        // Корректируем позицию перехода
        const shift = newPosition - oldPosition
        updates.position = transition.position + shift
        needsUpdate = true
      }
    }
    // Переход на вход
    else if (transition.type === "in" && transition.endClipId === clipId) {
      updates.position = newPosition
      needsUpdate = true
    }
    // Переход на выход
    else if (transition.type === "out" && transition.startClipId === clipId) {
      const positionChanged = newPosition !== oldPosition
      const durationChanged = newDuration !== oldDuration

      if (positionChanged && !durationChanged) {
        // Только позиция изменилась (trim начала) - сдвигаем переход
        const shift = newPosition - oldPosition
        updates.position = transition.position + shift
      } else if (positionChanged && durationChanged) {
        // Изменилось и то и другое (trim с обеих сторон) - сдвигаем на изменение позиции
        const shift = newPosition - oldPosition
        updates.position = transition.position + shift
      } else if (durationChanged) {
        // Только длительность изменилась (trim конца) - пересчитываем по концу клипа
        updates.position = newPosition + newDuration - transition.duration
      }
      needsUpdate = true
    }

    if (needsUpdate) {
      updatedProject = updateTimelineTransitionProperties(updatedProject, transition.id, updates)
    }
  })

  return updatedProject
}

/**
 * Удалить переход
 */
export function removeTransition(project: TimelineProject, transitionId: string): TimelineProject {
  const updatedProject = { ...project }

  // Удаляем из ресурсов
  updatedProject.resources.timelineTransitions = updatedProject.resources.timelineTransitions.filter(
    (t) => t.id !== transitionId,
  )

  // Удаляем из треков
  updatedProject.sections.forEach((section) => {
    section.tracks.forEach((track) => {
      if (track.transitions) {
        track.transitions = track.transitions.filter((id) => id !== transitionId)
      }
    })
  })

  updatedProject.globalTracks.forEach((track) => {
    if (track.transitions) {
      track.transitions = track.transitions.filter((id) => id !== transitionId)
    }
  })

  return updatedProject
}

/**
 * Найти трек в проекте
 */
function findTrack(project: TimelineProject, trackId: string): TimelineTrack | undefined {
  // Ищем в секциях
  for (const section of project.sections) {
    const track = section.tracks.find((t) => t.id === trackId)
    if (track) return track
  }

  // Ищем в глобальных треках
  return project.globalTracks.find((t) => t.id === trackId)
}

/**
 * Получить все переходы клипа
 */
export function getClipTransitions(
  project: TimelineProject,
  clipId: string,
): {
  in: TimelineTransition | null
  out: TimelineTransition | null
  betweenBefore: TimelineTransition | null
  betweenAfter: TimelineTransition | null
} {
  const transitions = project.resources.timelineTransitions

  return {
    in: transitions.find((t) => t.type === "in" && t.endClipId === clipId) || null,
    out: transitions.find((t) => t.type === "out" && t.startClipId === clipId) || null,
    betweenBefore: transitions.find((t) => t.type === "between" && t.endClipId === clipId) || null,
    betweenAfter: transitions.find((t) => t.type === "between" && t.startClipId === clipId) || null,
  }
}

/**
 * Применить пресет перехода ко всем стыкам клипов на треке
 */
export function applyTransitionPresetToTrack(
  project: TimelineProject,
  trackId: string,
  transitionResource: Transition,
  duration?: number,
): TimelineProject {
  const track = findTrack(project, trackId)
  if (!track || track.clips.length < 2) {
    return project
  }

  let updatedProject = { ...project }

  // Сортируем клипы по времени
  const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime)

  // Применяем переходы между соседними клипами
  for (let i = 0; i < sortedClips.length - 1; i++) {
    const leftClip = sortedClips[i]
    const rightClip = sortedClips[i + 1]

    const leftEnd = leftClip.startTime + leftClip.duration
    const rightStart = rightClip.startTime

    // Проверяем, что клипы соседние
    if (Math.abs(leftEnd - rightStart) < 0.01) {
      const result = addTransitionBetweenClips(
        updatedProject,
        trackId,
        leftClip.id,
        rightClip.id,
        transitionResource,
        duration,
      )
      updatedProject = result.project
    }
  }

  return updatedProject
}
