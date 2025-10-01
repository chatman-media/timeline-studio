/**
 * Hook для управления эффектами на клипах timeline
 */

import { useCallback } from "react"
import type { ProjectSchema } from "@/domains/video-editing/types"
import {
  addEffectToClip,
  addFilterToClip,
  removeEffectFromClip,
  removeFilterFromClip,
} from "@/features/effects/utils/user-effects"
import type { TimelineProject } from "../types/timeline"
import { useTimeline } from "./use-timeline"

// Простой адаптер для конвертации TimelineProject в ProjectSchema
function timelineProjectToSchema(project: TimelineProject): ProjectSchema {
  return project as any // Временное решение для совместимости типов
}

export function useTimelineEffects() {
  const { project, saveProject } = useTimeline()

  const applyEffect = useCallback(
    async (clipId: string, effectId: string, _params?: Record<string, any>) => {
      if (!project) return

      try {
        // Применяем эффект через backend API
        await addEffectToClip(timelineProjectToSchema(project), clipId, effectId)

        // Сохраняем проект
        await saveProject()
      } catch (error) {
        console.error("Failed to apply effect:", error)
        throw error
      }
    },
    [project, saveProject],
  )

  const removeEffect = useCallback(
    async (clipId: string, effectId: string) => {
      if (!project) return

      try {
        // Удаляем эффект через backend API
        await removeEffectFromClip(timelineProjectToSchema(project), clipId, effectId)

        // Сохраняем проект
        await saveProject()
      } catch (error) {
        console.error("Failed to remove effect:", error)
        throw error
      }
    },
    [project, saveProject],
  )

  const applyFilter = useCallback(
    async (clipId: string, filterId: string, _params?: Record<string, any>) => {
      if (!project) return

      try {
        // Применяем фильтр через backend API
        await addFilterToClip(timelineProjectToSchema(project), clipId, filterId)

        // Сохраняем проект
        await saveProject()
      } catch (error) {
        console.error("Failed to apply filter:", error)
        throw error
      }
    },
    [project, saveProject],
  )

  const removeFilter = useCallback(
    async (clipId: string, filterId: string) => {
      if (!project) return

      try {
        // Удаляем фильтр через backend API
        await removeFilterFromClip(timelineProjectToSchema(project), clipId, filterId)

        // Сохраняем проект
        await saveProject()
      } catch (error) {
        console.error("Failed to remove filter:", error)
        throw error
      }
    },
    [project, saveProject],
  )

  const applyTransition = useCallback(
    async (clipId: string, transitionId: string, params?: Record<string, any>) => {
      // TODO: Имплементировать backend команду для переходов
      console.log("Applying transition via backend:", { clipId, transitionId, params })

      try {
        // Пока что оставляем заглушку, поскольку backend команда еще не создана
        // await applyTransitionToClip(project, clipId, transitionId)

        // Сохраняем проект
        await saveProject()
      } catch (error) {
        console.error("Failed to apply transition:", error)
        throw error
      }
    },
    [project, saveProject],
  )

  // Методы для получения эффектов/фильтров/переходов
  const getClipEffects = useCallback(
    (clipId: string) => {
      if (!project) return []

      // Найти клип в проекте и вернуть его эффекты
      const allClips = project.sections
        .flatMap((section) => section.tracks.flatMap((track) => track.clips))
        .concat(project.globalTracks.flatMap((track) => track.clips))

      const clip = allClips.find((c) => c.id === clipId)
      return clip?.effects || []
    },
    [project],
  )

  const getClipFilters = useCallback(
    (clipId: string) => {
      if (!project) return []

      const allClips = project.sections
        .flatMap((section) => section.tracks.flatMap((track) => track.clips))
        .concat(project.globalTracks.flatMap((track) => track.clips))

      const clip = allClips.find((c) => c.id === clipId)
      return clip?.filters || []
    },
    [project],
  )

  const getClipTransitions = useCallback(
    (clipId: string) => {
      if (!project) return []

      const allClips = project.sections
        .flatMap((section) => section.tracks.flatMap((track) => track.clips))
        .concat(project.globalTracks.flatMap((track) => track.clips))

      const clip = allClips.find((c) => c.id === clipId)
      return clip?.transitions || []
    },
    [project],
  )

  return {
    applyEffect,
    removeEffect,
    applyFilter,
    removeFilter,
    applyTransition,
    getClipEffects,
    getClipFilters,
    getClipTransitions,
  }
}
