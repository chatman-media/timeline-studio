/**
 * Сервис обнаружения коллизий переходов
 */

import type { TimelineTransition as CoreTimelineTransition } from "@/core/types"
import type { TimelineClip, TimelineProject, TimelineTrack } from "@/features/timeline/types"

// Используем базовый core тип для совместимости с resources
type TimelineTransition = CoreTimelineTransition

export interface TransitionCollision {
  transition1: TimelineTransition
  transition2: TimelineTransition
  type: "overlap" | "adjacent" | "clip-boundary"
  severity: "warning" | "error"
  message: string
}

/**
 * Обнаружить все коллизии переходов в проекте
 */
export function detectAllCollisions(project: TimelineProject): TransitionCollision[] {
  const collisions: TransitionCollision[] = []

  // Проверяем каждый трек
  const allTracks = [...project.sections.flatMap((s) => s.tracks), ...project.globalTracks]

  for (const track of allTracks) {
    const trackCollisions = detectTrackCollisions(project, track)
    collisions.push(...trackCollisions)
  }

  return collisions
}

/**
 * Обнаружить коллизии на конкретном треке
 */
export function detectTrackCollisions(project: TimelineProject, track: TimelineTrack): TransitionCollision[] {
  const collisions: TransitionCollision[] = []

  if (!track.transitions || track.transitions.length === 0) {
    return collisions
  }

  // Получаем все переходы трека
  if (!project.resources.timelineTransitions) {
    return collisions
  }

  const transitions = track.transitions
    .map((id) => project.resources.timelineTransitions?.find((t) => t.id === id))
    .filter((t) => t !== undefined)
    .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0)) as TimelineTransition[]

  // Проверяем пересечения между переходами
  for (let i = 0; i < transitions.length; i++) {
    const transition1 = transitions[i]
    if (!transition1) continue

    // Проверяем с последующими переходами
    for (let j = i + 1; j < transitions.length; j++) {
      const transition2 = transitions[j]
      if (!transition2) continue
      const collision = checkTransitionOverlap(transition1, transition2)
      if (collision) {
        collisions.push(collision)
      }
    }

    // Проверяем границы клипов
    const clipCollisions = checkClipBoundaries(transition1, track.clips)
    collisions.push(...clipCollisions)
  }

  return collisions
}

/**
 * Проверить пересечение двух переходов
 */
function checkTransitionOverlap(t1: TimelineTransition, t2: TimelineTransition): TransitionCollision | null {
  const t1End = t1.position + t1.duration
  const t2End = t2.position + t2.duration

  // Полное пересечение
  if (
    (t1.position >= t2.position && t1.position < t2End) ||
    (t1End > t2.position && t1End <= t2End) ||
    (t1.position <= t2.position && t1End >= t2End)
  ) {
    return {
      transition1: t1,
      transition2: t2,
      type: "overlap",
      severity: "error",
      message: `Переходы пересекаются: ${t1.position.toFixed(2)}s-${t1End.toFixed(2)}s и ${t2.position.toFixed(2)}s-${t2End.toFixed(2)}s`,
    }
  }

  // Слишком близкие переходы (менее 0.1 секунды)
  const minGap = 0.1
  if (Math.abs(t1End - t2.position) < minGap || Math.abs(t2End - t1.position) < minGap) {
    return {
      transition1: t1,
      transition2: t2,
      type: "adjacent",
      severity: "warning",
      message: `Переходы расположены слишком близко (менее ${minGap}s)`,
    }
  }

  return null
}

/**
 * Проверить выход перехода за границы клипов
 */
function checkClipBoundaries(transition: TimelineTransition, clips: TimelineClip[]): TransitionCollision[] {
  const collisions: TransitionCollision[] = []
  const transitionEnd = transition.position + transition.duration

  // Для переходов типа "in"
  if (transition.type === "in" && transition.endClipId) {
    const clip = clips.find((c) => c.id === transition.endClipId)
    if (clip) {
      if (transition.position < clip.startTime) {
        collisions.push({
          transition1: transition,
          transition2: transition, // Используем тот же переход для единообразия
          type: "clip-boundary",
          severity: "error",
          message: `Переход на вход начинается до начала клипа (${transition.position.toFixed(2)}s < ${clip.startTime.toFixed(2)}s)`,
        })
      }
      if (transitionEnd > clip.startTime + clip.duration) {
        collisions.push({
          transition1: transition,
          transition2: transition,
          type: "clip-boundary",
          severity: "error",
          message: "Переход на вход выходит за границы клипа",
        })
      }
    }
  }

  // Для переходов типа "out"
  if (transition.type === "out" && transition.startClipId) {
    const clip = clips.find((c) => c.id === transition.startClipId)
    if (clip) {
      const clipEnd = clip.startTime + clip.duration
      if (transition.position < clip.startTime) {
        collisions.push({
          transition1: transition,
          transition2: transition,
          type: "clip-boundary",
          severity: "error",
          message: "Переход на выход начинается до начала клипа",
        })
      }
      if (transitionEnd > clipEnd) {
        collisions.push({
          transition1: transition,
          transition2: transition,
          type: "clip-boundary",
          severity: "error",
          message: `Переход на выход заканчивается после конца клипа (${transitionEnd.toFixed(2)}s > ${clipEnd.toFixed(2)}s)`,
        })
      }
    }
  }

  // Для переходов типа "between"
  if (transition.type === "between" && transition.startClipId && transition.endClipId) {
    const startClip = clips.find((c) => c.id === transition.startClipId)
    const endClip = clips.find((c) => c.id === transition.endClipId)

    if (startClip && endClip) {
      const startClipEnd = startClip.startTime + startClip.duration
      const gap = endClip.startTime - startClipEnd

      // Проверяем, что переход помещается в промежуток между клипами
      if (transition.duration > gap + 0.01) {
        // Небольшой допуск для точности
        collisions.push({
          transition1: transition,
          transition2: transition,
          type: "clip-boundary",
          severity: "error",
          message: `Переход между клипами (${transition.duration.toFixed(2)}s) не помещается в промежуток (${gap.toFixed(2)}s)`,
        })
      }

      // Проверяем центрирование перехода
      const expectedPosition = startClipEnd - transition.duration / 2
      if (Math.abs(transition.position - expectedPosition) > 0.1) {
        collisions.push({
          transition1: transition,
          transition2: transition,
          type: "clip-boundary",
          severity: "warning",
          message: "Переход между клипами смещён от оптимальной позиции",
        })
      }
    }
  }

  return collisions
}

/**
 * Предложить исправления для коллизии
 */
export function suggestCollisionFixes(collision: TransitionCollision): Array<{
  description: string
  action: () => Partial<TimelineTransition>
}> {
  const fixes: Array<{
    description: string
    action: () => Partial<TimelineTransition>
  }> = []

  switch (collision.type) {
    case "overlap": {
      // Сократить длительность первого перехода
      const t1End = collision.transition1.position + collision.transition1.duration
      const newDuration1 = collision.transition2.position - collision.transition1.position - 0.1
      if (newDuration1 > 0.1) {
        fixes.push({
          description: `Сократить первый переход до ${newDuration1.toFixed(2)}s`,
          action: () => ({ duration: newDuration1 }),
        })
      }

      // Сдвинуть второй переход
      const newPosition2 = t1End + 0.1
      fixes.push({
        description: `Сдвинуть второй переход на ${newPosition2.toFixed(2)}s`,
        action: () => ({ position: newPosition2 }),
      })
      break
    }

    case "adjacent": {
      // Увеличить промежуток
      const gap = 0.2
      fixes.push({
        description: `Сдвинуть второй переход на ${gap}s вправо`,
        action: () => ({
          position: collision.transition2.position + gap,
        }),
      })
      break
    }

    case "clip-boundary":
      // Для выхода за границы - корректируем позицию или длительность
      if (collision.message.includes("начинается до")) {
        fixes.push({
          description: "Сдвинуть переход к началу клипа",
          action: () => ({
            position: collision.transition1.position + 0.1,
          }),
        })
      } else if (collision.message.includes("выходит за")) {
        fixes.push({
          description: "Сократить длительность перехода",
          action: () => ({
            duration: collision.transition1.duration * 0.8,
          }),
        })
      }
      break

    default:
      // Неизвестный тип коллизии - общие исправления
      fixes.push({
        description: "Удалить переход",
        action: () => ({ duration: 0 }),
      })
      break
  }

  // Всегда предлагаем удаление как крайний вариант
  fixes.push({
    description: "Удалить переход",
    action: () => ({ isEnabled: false }),
  })

  return fixes
}

/**
 * Автоматически исправить все коллизии
 */
export function autoFixCollisions(project: TimelineProject, collisions: TransitionCollision[]): TimelineProject {
  const updatedProject = { ...project }

  // Проверяем наличие timelineTransitions
  if (!updatedProject.resources.timelineTransitions) {
    return updatedProject
  }

  // Группируем коллизии по трекам для эффективной обработки
  const collisionsByTrack = new Map<string, TransitionCollision[]>()

  for (const collision of collisions) {
    const trackId = collision.transition1.trackId
    if (trackId) {
      if (!collisionsByTrack.has(trackId)) {
        collisionsByTrack.set(trackId, [])
      }
      collisionsByTrack.get(trackId)!.push(collision)
    }
  }

  // Обрабатываем каждый трек
  for (const [trackId, trackCollisions] of collisionsByTrack) {
    // Сортируем коллизии по позиции для последовательной обработки
    const sortedCollisions = trackCollisions.sort((a, b) => a.transition1.position - b.transition1.position)

    for (const collision of sortedCollisions) {
      const fixes = suggestCollisionFixes(collision)
      if (fixes.length > 0) {
        // Применяем первое предложенное исправление
        const fix = fixes[0].action()

        // Обновляем переход в проекте
        const transitionIndex = updatedProject.resources.timelineTransitions?.findIndex(
          (t) => t.id === collision.transition1.id,
        )

        if (transitionIndex !== undefined && transitionIndex !== -1 && updatedProject.resources.timelineTransitions) {
          updatedProject.resources.timelineTransitions[transitionIndex] = {
            ...updatedProject.resources.timelineTransitions[transitionIndex],
            ...fix,
          }
        }
      }
    }
  }

  return updatedProject
}
