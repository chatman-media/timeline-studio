/**
 * Resource Manager Service
 *
 * Централизованное управление ресурсами проекта (эффекты, фильтры, шаблоны и т.д.)
 * Автоматически добавляет используемые ресурсы в проект
 */

import type { MediaFile } from "@/domains/media-management"
import type { Transition, VideoFilter } from "@/domains/video-editing/types"
import type { BaseEffect } from "@/domains/video-editing/types/unified-effects"
import type { StyleTemplate } from "@/features/style-templates/types/style-template"
import type { MediaTemplate } from "@/features/templates/lib/templates"

import type {
  AppliedEffect,
  AppliedFilter,
  AppliedStyleTemplate,
  AppliedTransition,
  MusicFile,
  ProjectResources,
  SubtitleStyle,
  TimelineProject,
} from "@/features/timeline/types"
import type { TimelineTransition } from "../types/timeline-transition"

/**
 * Создает пустой объект ресурсов
 */
function createEmptyResources(): ProjectResources {
  return {
    effects: [],
    filters: [],
    transitions: [],
    timelineTransitions: [],
    templates: [],
    styleTemplates: [],
    subtitleStyles: [],
    music: [],
    media: [],
  }
}

/**
 * Добавляет эффект в ресурсы проекта если его там еще нет
 */
export function addEffectToResources(project: TimelineProject, effect: BaseEffect): TimelineProject {
  if (!project.resources) {
    project.resources = createEmptyResources()
  }

  // Проверяем, есть ли уже такой эффект
  const exists = project.resources.effects.some((e) => e.id === effect.id)
  if (!exists) {
    project.resources.effects.push(effect)
  }

  return project
}

/**
 * Добавляет фильтр в ресурсы проекта если его там еще нет
 */
export function addFilterToResources(project: TimelineProject, filter: VideoFilter): TimelineProject {
  if (!project.resources) {
    project.resources = createEmptyResources()
  }

  const exists = project.resources.filters.some((f) => f.id === filter.id)
  if (!exists) {
    project.resources.filters.push(filter)
  }

  return project
}

/**
 * Добавляет переход в ресурсы проекта если его там еще нет
 */
export function addTransitionToResources(project: TimelineProject, transition: Transition): TimelineProject {
  if (!project.resources) {
    project.resources = createEmptyResources()
  }

  const exists = project.resources.transitions.some((t) => t.id === transition.id)
  if (!exists) {
    project.resources.transitions.push(transition)
  }

  return project
}

/**
 * Добавляет переход таймлайна в ресурсы проекта если его там еще нет
 */
export function addTimelineTransitionToResources(
  project: TimelineProject,
  timelineTransition: TimelineTransition,
): TimelineProject {
  if (!project.resources) {
    project.resources = createEmptyResources()
  }

  const exists = project.resources.timelineTransitions.some((t) => t.id === timelineTransition.id)
  if (!exists) {
    project.resources.timelineTransitions.push(timelineTransition)
  }

  return project
}

/**
 * Добавляет шаблон в ресурсы проекта если его там еще нет
 */
export function addTemplateToResources(project: TimelineProject, template: MediaTemplate): TimelineProject {
  if (!project.resources) {
    project.resources = createEmptyResources()
  }

  const exists = project.resources.templates.some((t) => t.id === template.id)
  if (!exists) {
    project.resources.templates.push(template)
  }

  return project
}

/**
 * Добавляет стильный шаблон в ресурсы проекта если его там еще нет
 */
export function addStyleTemplateToResources(project: TimelineProject, styleTemplate: StyleTemplate): TimelineProject {
  if (!project.resources) {
    project.resources = createEmptyResources()
  }

  const exists = project.resources.styleTemplates.some((st) => st.id === styleTemplate.id)
  if (!exists) {
    project.resources.styleTemplates.push(styleTemplate)
  }

  return project
}

/**
 * Добавляет медиафайл в ресурсы проекта если его там еще нет
 */
export function addMediaToResources(project: TimelineProject, media: MediaFile): TimelineProject {
  if (!project.resources) {
    project.resources = createEmptyResources()
  }

  const exists = project.resources.media.some((m) => m.id === media.id)
  if (!exists) {
    project.resources.media.push(media as any)
  }

  return project
}

/**
 * Добавляет стиль субтитров в ресурсы проекта если его там еще нет
 */
export function addSubtitleStyleToResources(project: TimelineProject, subtitleStyle: SubtitleStyle): TimelineProject {
  if (!project.resources) {
    project.resources = createEmptyResources()
  }

  const exists = project.resources.subtitleStyles.some((s) => s.id === subtitleStyle.id)
  if (!exists) {
    project.resources.subtitleStyles.push(subtitleStyle)
  }

  return project
}

/**
 * Добавляет музыкальный файл в ресурсы проекта если его там еще нет
 */
export function addMusicToResources(project: TimelineProject, musicFile: MusicFile): TimelineProject {
  if (!project.resources) {
    project.resources = createEmptyResources()
  }

  const exists = project.resources.music.some((m) => m.id === musicFile.id)
  if (!exists) {
    project.resources.music.push(musicFile)
  }

  return project
}

/**
 * Создает применение эффекта с автоматическим добавлением в ресурсы
 */
export function createAppliedEffect(
  project: TimelineProject,
  effect: BaseEffect,
  customParams?: Record<string, any>,
): { project: TimelineProject; appliedEffect: AppliedEffect } {
  // Добавляем эффект в ресурсы
  project = addEffectToResources(project, effect)

  // Создаем применение согласно unified-effects.ts
  const appliedEffect: AppliedEffect = {
    id: `applied-${effect.id}-${Date.now()}`,
    effectId: effect.id,
    startTime: 0,
    parameters: customParams || {},
    enabled: true,
    order: 0,
    keyframes: {},
    masks: [],
    blendMode: "normal" as const,
    opacity: 1,
    effectVersion: effect.version || "1.0",
    createdAt: new Date(),
    modifiedAt: new Date(),
  }

  return { project, appliedEffect }
}

/**
 * Создает применение фильтра с автоматическим добавлением в ресурсы
 */
export function createAppliedFilter(
  project: TimelineProject,
  filter: VideoFilter,
  customParams?: Record<string, any>,
): { project: TimelineProject; appliedFilter: AppliedFilter } {
  // Добавляем фильтр в ресурсы
  project = addFilterToResources(project, filter)

  // Создаем применение
  const appliedFilter: AppliedFilter = {
    id: `applied-${filter.id}-${Date.now()}`,
    filterId: filter.id,
    customParams,
    isEnabled: true,
    order: 0,
  }

  return { project, appliedFilter }
}

/**
 * Создает применение перехода с автоматическим добавлением в ресурсы
 */
export function createAppliedTransition(
  project: TimelineProject,
  transition: Transition,
  duration: number,
  type: "in" | "out" | "cross",
  customParams?: Record<string, any>,
): { project: TimelineProject; appliedTransition: AppliedTransition } {
  // Добавляем переход в ресурсы
  project = addTransitionToResources(project, transition)

  // Создаем применение
  const appliedTransition: AppliedTransition = {
    id: `applied-${transition.id}-${Date.now()}`,
    transitionId: transition.id,
    duration,
    type,
    customParams,
    isEnabled: true,
  }

  return { project, appliedTransition }
}

/**
 * Создает переход таймлайна с автоматическим добавлением в ресурсы
 */
export function createTimelineTransition(
  project: TimelineProject,
  transitionResource: Transition,
  options: {
    trackId: string
    position: number
    duration: number
    type: "between" | "in" | "out" | "adjustment"
    startClipId?: string
    endClipId?: string
    parameters?: TimelineTransition["parameters"]
    keyframes?: TimelineTransition["keyframes"]
  },
): { project: TimelineProject; timelineTransition: TimelineTransition } {
  // Добавляем базовый переход в ресурсы
  project = addTransitionToResources(project, transitionResource)

  // Создаем TimelineTransition
  const timelineTransition: TimelineTransition = {
    id: `timeline-transition-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    transitionId: transitionResource.id,
    type: options.type,
    position: options.position,
    duration: options.duration,
    startClipId: options.startClipId,
    endClipId: options.endClipId,
    trackId: options.trackId,
    parameters:
      options.parameters ||
      ({
        intensity: transitionResource.parameters?.intensity || 1.0,
        easing: (transitionResource.parameters?.easing as any) ?? "easeInOut",
        ...transitionResource.parameters,
      } as TimelineTransition["parameters"]),
    keyframes: options.keyframes || [],
    curve: {
      type: transitionResource.parameters?.easing || "ease-in-out",
      points: [],
    },
    isEnabled: true,
    isLocked: false,
    renderCache: undefined,
  }

  // Добавляем TimelineTransition в ресурсы
  project = addTimelineTransitionToResources(project, timelineTransition)

  return { project, timelineTransition }
}

/**
 * Создает применение стильного шаблона с автоматическим добавлением в ресурсы
 */
export function createAppliedStyleTemplate(
  project: TimelineProject,
  styleTemplate: StyleTemplate,
  customizations?: AppliedStyleTemplate["customizations"],
): { project: TimelineProject; appliedStyleTemplate: AppliedStyleTemplate } {
  // Добавляем шаблон в ресурсы
  project = addStyleTemplateToResources(project, styleTemplate)

  // Создаем применение
  const appliedStyleTemplate: AppliedStyleTemplate = {
    id: `applied-${styleTemplate.id}-${Date.now()}`,
    styleTemplateId: styleTemplate.id,
    customizations,
    isEnabled: true,
  }

  return { project, appliedStyleTemplate }
}

/**
 * Очищает неиспользуемые ресурсы из проекта
 */
export function cleanupUnusedResources(project: TimelineProject): TimelineProject {
  if (!project.resources) return project

  // Собираем все используемые ID ресурсов
  const usedEffectIds = new Set<string>()
  const usedFilterIds = new Set<string>()
  const usedTransitionIds = new Set<string>()
  const usedTimelineTransitionIds = new Set<string>()
  const usedTemplateIds = new Set<string>()
  const usedStyleTemplateIds = new Set<string>()
  const usedSubtitleStyleIds = new Set<string>()
  const usedMusicIds = new Set<string>()
  const usedMediaIds = new Set<string>()

  // Проходим по всем трекам и клипам
  const collectUsedResources = (tracks: any[]) => {
    tracks.forEach((track) => {
      // Ресурсы трека
      track.trackEffects?.forEach((e: AppliedEffect) => usedEffectIds.add(e.effectId))
      track.trackFilters?.forEach((f: AppliedFilter) => usedFilterIds.add(f.filterId))

      // Ресурсы клипов
      track.clips?.forEach((clip: any) => {
        clip.effects?.forEach((e: AppliedEffect) => usedEffectIds.add(e.effectId))
        clip.filters?.forEach((f: AppliedFilter) => usedFilterIds.add(f.filterId))
        clip.transitions?.forEach((t: AppliedTransition) => usedTransitionIds.add(t.transitionId))
        if (clip.templateId) usedTemplateIds.add(clip.templateId)
        if (clip.styleTemplate?.styleTemplateId) usedStyleTemplateIds.add(clip.styleTemplate.styleTemplateId)
        if (clip.mediaId) usedMediaIds.add(clip.mediaId)

        // Субтитровые клипы
        if (clip.subtitleStyleId) usedSubtitleStyleIds.add(clip.subtitleStyleId)

        // Музыкальные клипы (музыка хранится как mediaId, но может иметь дополнительные ссылки)
        if (clip.bpm || clip.fadeIn || clip.fadeOut) {
          // Это музыкальный клип, добавляем его mediaId в музыкальные ресурсы
          if (clip.mediaId) usedMusicIds.add(clip.mediaId)
        }
      })

      // Переходы таймлайна на треке
      track.timelineTransitions?.forEach((t: TimelineTransition) => {
        usedTimelineTransitionIds.add(t.id)
        // Также добавляем базовый переход, на который ссылается TimelineTransition
        usedTransitionIds.add(t.transitionId)
      })
    })
  }

  // Собираем из секций
  project.sections?.forEach((section) => {
    collectUsedResources(section.tracks)
  })

  // Собираем из глобальных треков
  if (project.globalTracks) {
    collectUsedResources(project.globalTracks)
  }

  // Фильтруем ресурсы, оставляя только используемые
  return {
    ...project,
    resources: {
      effects: project.resources.effects.filter((e) => usedEffectIds.has(e.id)),
      filters: project.resources.filters.filter((f) => usedFilterIds.has(f.id)),
      transitions: project.resources.transitions.filter((t) => usedTransitionIds.has(t.id)),
      timelineTransitions:
        project.resources.timelineTransitions?.filter((t) => usedTimelineTransitionIds.has(t.id)) || [],
      templates: project.resources.templates.filter((t) => usedTemplateIds.has(t.id)),
      styleTemplates: project.resources.styleTemplates.filter((st) => usedStyleTemplateIds.has(st.id)),
      subtitleStyles: project.resources.subtitleStyles.filter((s) => usedSubtitleStyleIds.has(s.id)),
      music: project.resources.music.filter((m) => usedMusicIds.has(m.id)),
      media: project.resources.media.filter((m) => usedMediaIds.has(m.id)),
    },
  }
}

/**
 * Обновляет параметры TimelineTransition в ресурсах
 */
export function updateTimelineTransitionParameters(
  project: TimelineProject,
  transitionId: string,
  newParameters: Partial<TimelineTransition["parameters"]>,
): TimelineProject {
  if (!project.resources?.timelineTransitions) return project

  const transitionIndex = project.resources.timelineTransitions.findIndex((t) => t.id === transitionId)
  if (transitionIndex === -1) return project

  const updatedTransition = {
    ...project.resources.timelineTransitions[transitionIndex],
    parameters: {
      ...project.resources.timelineTransitions[transitionIndex].parameters,
      ...newParameters,
    },
  }

  const updatedTransitions = [...project.resources.timelineTransitions]
  updatedTransitions[transitionIndex] = updatedTransition

  return {
    ...project,
    resources: {
      ...project.resources,
      timelineTransitions: updatedTransitions,
    },
  }
}

/**
 * Обновляет основные свойства TimelineTransition в ресурсах
 */
export function updateTimelineTransitionProperties(
  project: TimelineProject,
  transitionId: string,
  properties: Partial<
    Pick<TimelineTransition, "startClipId" | "endClipId" | "position" | "duration" | "trackId" | "type">
  >,
): TimelineProject {
  if (!project.resources?.timelineTransitions) return project

  const transitionIndex = project.resources.timelineTransitions.findIndex((t) => t.id === transitionId)
  if (transitionIndex === -1) return project

  const updatedTransition = {
    ...project.resources.timelineTransitions[transitionIndex],
    ...properties,
  }

  const updatedTransitions = [...project.resources.timelineTransitions]
  updatedTransitions[transitionIndex] = updatedTransition

  return {
    ...project,
    resources: {
      ...project.resources,
      timelineTransitions: updatedTransitions,
    },
  }
}

/**
 * Добавляет keyframe к TimelineTransition
 */
export function addKeyframeToTimelineTransition(
  project: TimelineProject,
  transitionId: string,
  keyframe: TimelineTransition["keyframes"][0],
): TimelineProject {
  if (!project.resources?.timelineTransitions) return project

  const transitionIndex = project.resources.timelineTransitions.findIndex((t) => t.id === transitionId)
  if (transitionIndex === -1) return project

  const updatedTransition = {
    ...project.resources.timelineTransitions[transitionIndex],
    keyframes: [...project.resources.timelineTransitions[transitionIndex].keyframes, keyframe].sort(
      (a, b) => a.time - b.time,
    ),
  }

  const updatedTransitions = [...project.resources.timelineTransitions]
  updatedTransitions[transitionIndex] = updatedTransition

  return {
    ...project,
    resources: {
      ...project.resources,
      timelineTransitions: updatedTransitions,
    },
  }
}

/**
 * Удаляет keyframe из TimelineTransition
 */
export function removeKeyframeFromTimelineTransition(
  project: TimelineProject,
  transitionId: string,
  keyframeId: string,
): TimelineProject {
  if (!project.resources?.timelineTransitions) return project

  const transitionIndex = project.resources.timelineTransitions.findIndex((t) => t.id === transitionId)
  if (transitionIndex === -1) return project

  const updatedTransition = {
    ...project.resources.timelineTransitions[transitionIndex],
    keyframes: project.resources.timelineTransitions[transitionIndex].keyframes.filter((k) => k.id !== keyframeId),
  }

  const updatedTransitions = [...project.resources.timelineTransitions]
  updatedTransitions[transitionIndex] = updatedTransition

  return {
    ...project,
    resources: {
      ...project.resources,
      timelineTransitions: updatedTransitions,
    },
  }
}

/**
 * Получает TimelineTransition по ID
 */
export function getTimelineTransitionById(project: TimelineProject, transitionId: string): TimelineTransition | null {
  return project.resources?.timelineTransitions?.find((t) => t.id === transitionId) || null
}

/**
 * Клонирует TimelineTransition с новыми параметрами
 */
export function cloneTimelineTransition(
  project: TimelineProject,
  sourceTransitionId: string,
  overrides?: Partial<TimelineTransition>,
): { project: TimelineProject; timelineTransition: TimelineTransition } | null {
  const sourceTransition = getTimelineTransitionById(project, sourceTransitionId)
  if (!sourceTransition) return null

  const clonedTransition: TimelineTransition = {
    ...sourceTransition,
    id: `timeline-transition-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    renderCache: undefined,
    ...overrides,
  }

  const updatedProject = addTimelineTransitionToResources(project, clonedTransition)

  return { project: updatedProject, timelineTransition: clonedTransition }
}
