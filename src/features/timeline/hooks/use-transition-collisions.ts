/**
 * Hook для обнаружения и управления коллизиями переходов
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import type { TimelineProject, TimelineTrack } from "@/features/timeline/types"
import { createLogger } from "@/lib/tauri-logger"
import {
  autoFixCollisions,
  detectAllCollisions,
  detectTrackCollisions,
  suggestCollisionFixes,
  type TransitionCollision,
} from "../services/transition-collision-detector"
import { useTimeline } from "../state/use-timeline"

const logger = createLogger("UseTransitionCollisions")

interface UseTransitionCollisionsReturn {
  // Все коллизии в проекте
  allCollisions: TransitionCollision[]

  // Коллизии по трекам
  collisionsByTrack: Map<string, TransitionCollision[]>

  // Функции проверки
  getTrackCollisions: (trackId: string) => TransitionCollision[]
  hasCollisions: (trackId?: string) => boolean

  // Функции исправления
  suggestFixes: (collision: TransitionCollision) => Array<{
    description: string
    action: () => void
  }>
  fixCollision: (collision: TransitionCollision, fixIndex: number) => void
  autoFixAll: () => void

  // Состояние
  isChecking: boolean
  lastCheckTime: Date | null
}

export function useTransitionCollisions(): UseTransitionCollisionsReturn {
  const { project } = useTimeline()
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null)
  const [collisions, setCollisions] = useState<TransitionCollision[]>([])

  // Обнаружение коллизий при изменении проекта
  useEffect(() => {
    if (!project) {
      setCollisions([])
      return
    }

    setIsChecking(true)

    // Используем setTimeout для предотвращения блокировки UI
    const timeoutId = setTimeout(() => {
      const detected = detectAllCollisions(project as unknown as TimelineProject)
      setCollisions(detected)
      setLastCheckTime(new Date())
      setIsChecking(false)
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [project])

  // Группировка коллизий по трекам
  const collisionsByTrack = useMemo(() => {
    const map = new Map<string, TransitionCollision[]>()

    for (const collision of collisions) {
      const trackId = collision.transition1.trackId
      if (trackId) {
        if (!map.has(trackId)) {
          map.set(trackId, [])
        }
        map.get(trackId)!.push(collision)
      }
    }

    return map
  }, [collisions])

  // Получить коллизии для конкретного трека
  const getTrackCollisions = useCallback(
    (trackId: string): TransitionCollision[] => {
      return collisionsByTrack.get(trackId) || []
    },
    [collisionsByTrack],
  )

  // Проверить наличие коллизий
  const hasCollisions = useCallback(
    (trackId?: string): boolean => {
      if (trackId) {
        return (collisionsByTrack.get(trackId) || []).length > 0
      }
      return collisions.length > 0
    },
    [collisions, collisionsByTrack],
  )

  // Предложить исправления для коллизии
  const suggestFixes = useCallback(
    (collision: TransitionCollision) => {
      const fixes = suggestCollisionFixes(collision)

      return fixes.map((fix) => ({
        description: fix.description,
        action: () => {
          if (!project) return

          const updates = fix.action()

          // TODO: Интегрировать с системой обновления проекта
          logger.info("Apply fix:", { transitionId: collision.transition1.id, updates })
        },
      }))
    },
    [project],
  )

  // Исправить конкретную коллизию
  const fixCollision = useCallback(
    (collision: TransitionCollision, fixIndex: number) => {
      const fixes = suggestFixes(collision)
      if (fixes[fixIndex]) {
        fixes[fixIndex].action()
      }
    },
    [suggestFixes],
  )

  // Автоматически исправить все коллизии
  const autoFixAll = useCallback(() => {
    if (!project || collisions.length === 0) return

    const fixedProject = autoFixCollisions(project as unknown as TimelineProject, collisions)

    // TODO: Обновить проект через систему управления состоянием
    logger.info("Auto-fixed project:", { fixedProject })
  }, [project, collisions])

  return {
    allCollisions: collisions,
    collisionsByTrack,
    getTrackCollisions,
    hasCollisions,
    suggestFixes,
    fixCollision,
    autoFixAll,
    isChecking,
    lastCheckTime,
  }
}

/**
 * Hook для проверки коллизий на конкретном треке
 */
export function useTrackTransitionCollisions(trackId: string) {
  const { project } = useTimeline()
  const [collisions, setCollisions] = useState<TransitionCollision[]>([])

  useEffect(() => {
    if (!project || !trackId) {
      setCollisions([])
      return
    }

    // Находим трек
    const track = findTrack(project as unknown as TimelineProject, trackId)
    if (!track) {
      setCollisions([])
      return
    }

    // Обнаруживаем коллизии
    const detected = detectTrackCollisions(project as unknown as TimelineProject, track)
    setCollisions(detected)
  }, [project, trackId])

  return collisions
}

// Вспомогательная функция для поиска трека
function findTrack(project: TimelineProject, trackId: string): TimelineTrack | undefined {
  // Ищем в секциях
  for (const section of project.sections) {
    const track = section.tracks.find((t) => t.id === trackId)
    if (track) return track
  }

  // Ищем в глобальных треках
  return project.globalTracks.find((t) => t.id === trackId)
}
