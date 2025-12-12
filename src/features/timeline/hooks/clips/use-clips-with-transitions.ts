/**
 * Hook для работы с клипами с поддержкой синхронизации переходов
 * Обёртка над useClips с дополнительной логикой синхронизации
 */

import { useCallback } from "react"
import type { TimelineProject } from "@/features/timeline/types"
import { createLogger } from "@/lib/tauri-logger"
import { useClips } from "../clips/use-clips"
import { useTimeline } from "../state/use-timeline"
import { useTransitionSync } from "../use-transition-sync"

const logger = createLogger("UseClipsWithTransitions")

export function useClipsWithTransitions() {
  const clips = useClips()
  const { project } = useTimeline()

  // Временная заглушка для updateProject
  // В реальной реализации это должно обновлять проект через backend
  const updateProject = useCallback(() => {
    logger.warn("Project transition updates not yet integrated with backend")
  }, [])

  const { syncMoveClip, syncTrimClip, syncRemoveClip, syncSplitClip, findClip } = useTransitionSync({
    project: project as TimelineProject | null,
    updateProject,
  })

  // Переопределяем методы с синхронизацией переходов

  /**
   * Перемещение клипа с синхронизацией переходов
   */
  const moveClipWithTransitions = useCallback(
    (clipId: string, newTrackId: string, newStartTime: number) => {
      // Находим старые параметры клипа
      const clip = findClip(clipId)
      if (!clip) {
        clips.moveClip(clipId, newTrackId, newStartTime)
        return
      }

      const oldTrackId = clip.trackId
      const oldPosition = clip.startTime
      const duration = clip.duration

      // Сначала перемещаем клип
      clips.moveClip(clipId, newTrackId, newStartTime)

      // Затем синхронизируем переходы
      syncMoveClip(clipId, oldTrackId, newTrackId, oldPosition, newStartTime, duration)
    },
    [clips, findClip, syncMoveClip],
  )

  /**
   * Обрезка клипа с синхронизацией переходов
   */
  const trimClipWithTransitions = useCallback(
    (clipId: string, newStartTime: number, newDuration: number) => {
      // Находим старые параметры клипа
      const clip = findClip(clipId)
      if (!clip) {
        clips.trimClip(clipId, newStartTime, newDuration)
        return
      }

      const trackId = clip.trackId
      const oldStartTime = clip.startTime
      const oldDuration = clip.duration

      // Сначала обрезаем клип
      clips.trimClip(clipId, newStartTime, newDuration)

      // Затем синхронизируем переходы
      syncTrimClip(clipId, trackId, oldStartTime, newStartTime, oldDuration, newDuration)
    },
    [clips, findClip, syncTrimClip],
  )

  /**
   * Удаление клипа с синхронизацией переходов
   */
  const removeClipWithTransitions = useCallback(
    (clipId: string) => {
      // Сначала синхронизируем переходы (удаляем связанные)
      syncRemoveClip(clipId)

      // Затем удаляем сам клип
      clips.removeClip(clipId)
    },
    [clips, syncRemoveClip],
  )

  /**
   * Разделение клипа с синхронизацией переходов
   */
  const splitClipWithTransitions = useCallback(
    (clipId: string, splitTime: number) => {
      // Сначала разделяем клип
      clips.splitClip(clipId, splitTime)

      // TODO: Получить IDs новых клипов после разделения
      // В текущей реализации splitClip не возвращает новые IDs
      // Это нужно будет исправить в основном хуке
      logger.warn("Split clip transition sync requires clip IDs from split operation")
    },
    [clips],
  )

  // Возвращаем все методы из оригинального хука, заменяя только те, что требуют синхронизации
  return {
    ...clips,
    moveClip: moveClipWithTransitions,
    trimClip: trimClipWithTransitions,
    removeClip: removeClipWithTransitions,
    splitClip: splitClipWithTransitions,
  }
}

// Типы для удобства
export type UseClipsWithTransitionsReturn = ReturnType<typeof useClipsWithTransitions>
