/**
 * Hook для работы с эффектами клипов Timeline
 * Интегрирует Effects Feature с Timeline
 */

import { useCallback } from "react"
import type { AppliedEffect, BaseEffect } from "@/domains/video-editing/types/unified-effects"
import { createLogger } from "@/lib/tauri-logger"
import {
  applyEffectToBatch,
  applyEffectToClip,
  clearEffectsFromClip,
  copyEffects,
  removeEffectFromClip,
  reorderEffectsOnClip,
  toggleEffectOnClip,
  updateEffectOnClip,
} from "../services/clip-effects-service"
import type { TimelineProject } from "../types"

const logger = createLogger("useClipEffects")

export interface UseClipEffectsOptions {
  project: TimelineProject
  onProjectUpdate: (project: TimelineProject) => void
}

export interface UseClipEffectsReturn {
  // Применение эффектов
  applyEffect: (clipId: string, effect: BaseEffect, customParams?: Record<string, any>) => void
  applyEffectToMultiple: (clipIds: string[], effect: BaseEffect, customParams?: Record<string, any>) => void

  // Удаление эффектов
  removeEffect: (clipId: string, appliedEffectId: string) => void
  clearEffects: (clipId: string) => void

  // Обновление эффектов
  updateEffect: (
    clipId: string,
    appliedEffectId: string,
    updates: {
      parameters?: Record<string, any>
      enabled?: boolean
      order?: number
    },
  ) => void
  toggleEffect: (clipId: string, appliedEffectId: string) => void

  // Управление порядком
  reorderEffects: (clipId: string, effectIds: string[]) => void

  // Копирование
  copyEffectsBetweenClips: (sourceClipId: string, targetClipId: string) => void

  // Получение эффектов клипа
  getClipEffects: (clipId: string) => AppliedEffect[]
  getClipEffectsWithDetails: (clipId: string) => Array<{ applied: AppliedEffect; effect: BaseEffect | null }>
}

/**
 * Хук для работы с эффектами клипов в Timeline
 */
export function useClipEffects({ project, onProjectUpdate }: UseClipEffectsOptions): UseClipEffectsReturn {
  /**
   * Применяет эффект к клипу
   */
  const applyEffect = useCallback(
    (clipId: string, effect: BaseEffect, customParams?: Record<string, any>) => {
      try {
        void logger.info("Applying effect to clip via hook", { clipId, effectId: effect.id })

        const updatedProject = applyEffectToClip(project, clipId, {
          effectId: effect.id,
          effect,
          customParams,
        })

        onProjectUpdate(updatedProject)
      } catch (error) {
        void logger.error("Failed to apply effect to clip", { clipId, error })
        throw error
      }
    },
    [project, onProjectUpdate],
  )

  /**
   * Применяет эффект к нескольким клипам
   */
  const applyEffectToMultiple = useCallback(
    (clipIds: string[], effect: BaseEffect, customParams?: Record<string, any>) => {
      try {
        void logger.info("Applying effect to multiple clips", { clipIds, effectId: effect.id })

        const updatedProject = applyEffectToBatch(project, clipIds, {
          effectId: effect.id,
          effect,
          customParams,
        })

        onProjectUpdate(updatedProject)
      } catch (error) {
        void logger.error("Failed to apply effect to multiple clips", { clipIds, error })
        throw error
      }
    },
    [project, onProjectUpdate],
  )

  /**
   * Удаляет эффект с клипа
   */
  const removeEffect = useCallback(
    (clipId: string, appliedEffectId: string) => {
      try {
        void logger.info("Removing effect from clip", { clipId, appliedEffectId })

        const updatedProject = removeEffectFromClip(project, clipId, { appliedEffectId })
        onProjectUpdate(updatedProject)
      } catch (error) {
        void logger.error("Failed to remove effect from clip", { clipId, appliedEffectId, error })
        throw error
      }
    },
    [project, onProjectUpdate],
  )

  /**
   * Удаляет все эффекты с клипа
   */
  const clearEffects = useCallback(
    (clipId: string) => {
      try {
        void logger.info("Clearing effects from clip", { clipId })

        const updatedProject = clearEffectsFromClip(project, clipId)
        onProjectUpdate(updatedProject)
      } catch (error) {
        void logger.error("Failed to clear effects from clip", { clipId, error })
        throw error
      }
    },
    [project, onProjectUpdate],
  )

  /**
   * Обновляет параметры эффекта
   */
  const updateEffect = useCallback(
    (
      clipId: string,
      appliedEffectId: string,
      updates: {
        parameters?: Record<string, any>
        enabled?: boolean
        order?: number
      },
    ) => {
      try {
        void logger.info("Updating effect on clip", { clipId, appliedEffectId, updates })

        const updatedProject = updateEffectOnClip(project, clipId, {
          appliedEffectId,
          ...updates,
        })

        onProjectUpdate(updatedProject)
      } catch (error) {
        void logger.error("Failed to update effect on clip", { clipId, appliedEffectId, error })
        throw error
      }
    },
    [project, onProjectUpdate],
  )

  /**
   * Переключает состояние эффекта
   */
  const toggleEffect = useCallback(
    (clipId: string, appliedEffectId: string) => {
      try {
        void logger.info("Toggling effect on clip", { clipId, appliedEffectId })

        const updatedProject = toggleEffectOnClip(project, clipId, appliedEffectId)
        onProjectUpdate(updatedProject)
      } catch (error) {
        void logger.error("Failed to toggle effect on clip", { clipId, appliedEffectId, error })
        throw error
      }
    },
    [project, onProjectUpdate],
  )

  /**
   * Меняет порядок эффектов
   */
  const reorderEffects = useCallback(
    (clipId: string, effectIds: string[]) => {
      try {
        void logger.info("Reordering effects on clip", { clipId, effectIds })

        const updatedProject = reorderEffectsOnClip(project, clipId, { effectIds })
        onProjectUpdate(updatedProject)
      } catch (error) {
        void logger.error("Failed to reorder effects on clip", { clipId, error })
        throw error
      }
    },
    [project, onProjectUpdate],
  )

  /**
   * Копирует эффекты между клипами
   */
  const copyEffectsBetweenClips = useCallback(
    (sourceClipId: string, targetClipId: string) => {
      try {
        void logger.info("Copying effects between clips", { sourceClipId, targetClipId })

        const updatedProject = copyEffects(project, sourceClipId, targetClipId)
        onProjectUpdate(updatedProject)
      } catch (error) {
        void logger.error("Failed to copy effects between clips", { sourceClipId, targetClipId, error })
        throw error
      }
    },
    [project, onProjectUpdate],
  )

  /**
   * Получает эффекты клипа
   */
  const getClipEffects = useCallback(
    (clipId: string): AppliedEffect[] => {
      // Ищем клип в секциях
      for (const section of project.sections) {
        for (const track of section.tracks) {
          const clip = track.clips.find((c) => c.id === clipId)
          if (clip) {
            return clip.effects || []
          }
        }
      }

      // Ищем в глобальных треках
      for (const track of project.globalTracks) {
        const clip = track.clips.find((c) => c.id === clipId)
        if (clip) {
          return clip.effects || []
        }
      }

      return []
    },
    [project],
  )

  /**
   * Получает эффекты клипа с полными данными
   */
  const getClipEffectsWithDetails = useCallback(
    (clipId: string): Array<{ applied: AppliedEffect; effect: BaseEffect | null }> => {
      const appliedEffects = getClipEffects(clipId)

      return appliedEffects.map((applied) => {
        const effect = project.resources.effects.find((e) => e.id === applied.effectId) || null
        return { applied, effect: effect as unknown as BaseEffect | null }
      })
    },
    [project, getClipEffects],
  )

  return {
    applyEffect,
    applyEffectToMultiple,
    removeEffect,
    clearEffects,
    updateEffect,
    toggleEffect,
    reorderEffects,
    copyEffectsBetweenClips,
    getClipEffects,
    getClipEffectsWithDetails,
  }
}
