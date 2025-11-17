/**
 * Clip Effects Service
 * Сервис для применения эффектов к клипам Timeline
 */

import type { BaseEffect } from "@/features/effects/types"
import { createLogger } from "@/lib/tauri-logger"
import { generateId } from "@/lib/utils"
import type { AppliedEffect, TimelineClip, TimelineProject, TimelineTrack } from "../types"
import { createAppliedEffect } from "./resource-manager"

const logger = createLogger("ClipEffectsService")

export interface ApplyEffectOptions {
  effectId: string
  effect: BaseEffect
  customParams?: Record<string, any>
  position?: "start" | "end" // Позиция в цепочке эффектов
  replaceExisting?: boolean // Заменить существующие эффекты того же типа
}

export interface RemoveEffectOptions {
  appliedEffectId: string
}

export interface UpdateEffectOptions {
  appliedEffectId: string
  customParams?: Record<string, any>
  enabled?: boolean
  order?: number
}

export interface ReorderEffectsOptions {
  effectIds: string[] // Новый порядок ID эффектов
}

/**
 * Применяет эффект к клипу
 */
export function applyEffectToClip(
  project: TimelineProject,
  clipId: string,
  options: ApplyEffectOptions,
): TimelineProject {
  void logger.info("Applying effect to clip", { clipId, effectId: options.effectId })

  // Находим клип
  const { clip, track, sectionIndex } = findClipInProject(project, clipId)
  if (!clip || !track) {
    void logger.error("Clip not found", { clipId })
    throw new Error(`Clip ${clipId} not found`)
  }

  // Создаем AppliedEffect
  const { project: updatedProject, appliedEffect } = createAppliedEffect(project, options.effect, options.customParams)

  // Заменяем существующие эффекты того же типа, если нужно
  let effects = clip.effects || []
  if (options.replaceExisting) {
    effects = effects.filter((e) => {
      const existingEffect = updatedProject.resources.effects.find((ef) => ef.id === e.effectId)
      return existingEffect?.category !== options.effect.category
    })
  }

  // Определяем порядок нового эффекта
  appliedEffect.order = options.position === "start" ? 0 : Math.max(0, ...effects.map((e) => e.order || 0)) + 1

  // Если вставляем в начало, сдвигаем порядок остальных эффектов
  if (options.position === "start") {
    effects = effects.map((e) => ({
      ...e,
      order: (e.order || 0) + 1,
    }))
  }

  // Добавляем новый эффект
  effects.push(appliedEffect)

  // Обновляем клип
  const updatedClip: TimelineClip = {
    ...clip,
    effects,
    updatedAt: new Date(),
  }

  // Обновляем проект
  return updateClipInProject(updatedProject, clipId, updatedClip, track.id, sectionIndex)
}

/**
 * Удаляет эффект с клипа
 */
export function removeEffectFromClip(
  project: TimelineProject,
  clipId: string,
  options: RemoveEffectOptions,
): TimelineProject {
  void logger.info("Removing effect from clip", { clipId, appliedEffectId: options.appliedEffectId })

  const { clip, track, sectionIndex } = findClipInProject(project, clipId)
  if (!clip || !track) {
    void logger.error("Clip not found", { clipId })
    throw new Error(`Clip ${clipId} not found`)
  }

  // Удаляем эффект
  const effects = (clip.effects || []).filter((e) => e.id !== options.appliedEffectId)

  // Обновляем клип
  const updatedClip: TimelineClip = {
    ...clip,
    effects,
    updatedAt: new Date(),
  }

  return updateClipInProject(project, clipId, updatedClip, track.id, sectionIndex)
}

/**
 * Обновляет параметры эффекта на клипе
 */
export function updateEffectOnClip(
  project: TimelineProject,
  clipId: string,
  options: UpdateEffectOptions,
): TimelineProject {
  void logger.info("Updating effect on clip", { clipId, appliedEffectId: options.appliedEffectId })

  const { clip, track, sectionIndex } = findClipInProject(project, clipId)
  if (!clip || !track) {
    void logger.error("Clip not found", { clipId })
    throw new Error(`Clip ${clipId} not found`)
  }

  // Обновляем параметры эффекта
  const effects = (clip.effects || []).map((e) => {
    if (e.id !== options.appliedEffectId) return e

    return {
      ...e,
      customParams: options.customParams !== undefined ? options.customParams : e.customParams,
      enabled: options.enabled !== undefined ? options.enabled : e.enabled,
      order: options.order !== undefined ? options.order : e.order,
    }
  })

  // Обновляем клип
  const updatedClip: TimelineClip = {
    ...clip,
    effects,
    updatedAt: new Date(),
  }

  return updateClipInProject(project, clipId, updatedClip, track.id, sectionIndex)
}

/**
 * Меняет порядок эффектов на клипе
 */
export function reorderEffectsOnClip(
  project: TimelineProject,
  clipId: string,
  options: ReorderEffectsOptions,
): TimelineProject {
  void logger.info("Reordering effects on clip", { clipId, effectIds: options.effectIds })

  const { clip, track, sectionIndex } = findClipInProject(project, clipId)
  if (!clip || !track) {
    void logger.error("Clip not found", { clipId })
    throw new Error(`Clip ${clipId} not found`)
  }

  // Создаем новый порядок эффектов
  const effects = options.effectIds
    .map((id, index) => {
      const effect = clip.effects?.find((e) => e.id === id)
      if (!effect) return null
      return { ...effect, order: index }
    })
    .filter(Boolean) as AppliedEffect[]

  // Обновляем клип
  const updatedClip: TimelineClip = {
    ...clip,
    effects,
    updatedAt: new Date(),
  }

  return updateClipInProject(project, clipId, updatedClip, track.id, sectionIndex)
}

/**
 * Применяет эффекты к нескольким клипам (batch operation)
 */
export function applyEffectToBatch(
  project: TimelineProject,
  clipIds: string[],
  options: ApplyEffectOptions,
): TimelineProject {
  void logger.info("Applying effect to batch", { clipIds, effectId: options.effectId })

  let updatedProject = project

  for (const clipId of clipIds) {
    try {
      updatedProject = applyEffectToClip(updatedProject, clipId, options)
    } catch (error) {
      void logger.error("Failed to apply effect to clip in batch", { clipId, error })
    }
  }

  return updatedProject
}

/**
 * Удаляет все эффекты с клипа
 */
export function clearEffectsFromClip(project: TimelineProject, clipId: string): TimelineProject {
  void logger.info("Clearing all effects from clip", { clipId })

  const { clip, track, sectionIndex } = findClipInProject(project, clipId)
  if (!clip || !track) {
    void logger.error("Clip not found", { clipId })
    throw new Error(`Clip ${clipId} not found`)
  }

  // Удаляем все эффекты
  const updatedClip: TimelineClip = {
    ...clip,
    effects: [],
    updatedAt: new Date(),
  }

  return updateClipInProject(project, clipId, updatedClip, track.id, sectionIndex)
}

/**
 * Копирует эффекты с одного клипа на другой
 */
export function copyEffects(project: TimelineProject, sourceClipId: string, targetClipId: string): TimelineProject {
  void logger.info("Copying effects between clips", { sourceClipId, targetClipId })

  const { clip: sourceClip } = findClipInProject(project, sourceClipId)
  const { clip: targetClip, track, sectionIndex } = findClipInProject(project, targetClipId)

  if (!sourceClip || !targetClip || !track) {
    void logger.error("Source or target clip not found", { sourceClipId, targetClipId })
    throw new Error("Source or target clip not found")
  }

  // Копируем эффекты с новыми ID
  const copiedEffects: AppliedEffect[] = (sourceClip.effects || []).map((e) => ({
    ...e,
    id: `applied-${e.effectId}-${Date.now()}-${generateId()}`,
  }))

  // Обновляем целевой клип
  const updatedClip: TimelineClip = {
    ...targetClip,
    effects: copiedEffects,
    updatedAt: new Date(),
  }

  return updateClipInProject(project, targetClipId, updatedClip, track.id, sectionIndex)
}

/**
 * Переключает состояние эффекта (enabled/disabled)
 */
export function toggleEffectOnClip(project: TimelineProject, clipId: string, appliedEffectId: string): TimelineProject {
  const { clip, track, sectionIndex } = findClipInProject(project, clipId)
  if (!clip || !track) {
    throw new Error(`Clip ${clipId} not found`)
  }

  const effects = (clip.effects || []).map((e) => {
    if (e.id !== appliedEffectId) return e
    return { ...e, enabled: !e.enabled }
  })

  const updatedClip: TimelineClip = {
    ...clip,
    effects,
    updatedAt: new Date(),
  }

  return updateClipInProject(project, clipId, updatedClip, track.id, sectionIndex)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Находит клип в проекте и возвращает его вместе с треком и индексом секции
 */
function findClipInProject(
  project: TimelineProject,
  clipId: string,
): { clip: TimelineClip | null; track: TimelineTrack | null; sectionIndex: number } {
  // Ищем в секциях
  for (let i = 0; i < project.sections.length; i++) {
    const section = project.sections[i]
    for (const track of section.tracks) {
      const clip = track.clips.find((c) => c.id === clipId)
      if (clip) {
        return { clip, track, sectionIndex: i }
      }
    }
  }

  // Ищем в глобальных треках
  for (const track of project.globalTracks) {
    const clip = track.clips.find((c) => c.id === clipId)
    if (clip) {
      return { clip, track, sectionIndex: -1 }
    }
  }

  return { clip: null, track: null, sectionIndex: -1 }
}

/**
 * Обновляет клип в проекте
 */
function updateClipInProject(
  project: TimelineProject,
  clipId: string,
  updatedClip: TimelineClip,
  trackId: string,
  sectionIndex: number,
): TimelineProject {
  const newProject = { ...project, updatedAt: new Date() }

  if (sectionIndex >= 0) {
    // Обновляем в секции
    newProject.sections = [...project.sections]
    newProject.sections[sectionIndex] = {
      ...project.sections[sectionIndex],
      tracks: project.sections[sectionIndex].tracks.map((track) => {
        if (track.id !== trackId) return track
        return {
          ...track,
          clips: track.clips.map((clip) => (clip.id === clipId ? updatedClip : clip)),
        }
      }),
    }
  } else {
    // Обновляем в глобальных треках
    newProject.globalTracks = project.globalTracks.map((track) => {
      if (track.id !== trackId) return track
      return {
        ...track,
        clips: track.clips.map((clip) => (clip.id === clipId ? updatedClip : clip)),
      }
    })
  }

  return newProject
}
