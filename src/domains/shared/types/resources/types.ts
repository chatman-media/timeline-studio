/**
 * Resource Types
 *
 * Типы для ресурсов timeline (медиа, эффекты, фильтры, переходы, шаблоны)
 * Перемещено из src/features/resources/types.ts
 */

import type { MediaFile } from "@/domains/media-management"
import type { VideoFilter } from "@/domains/video-editing/types/filters"
import type { MediaTemplate, StyleTemplate, SubtitleStyleTemplate } from "@/domains/video-editing/types/templates"
import type { Transition } from "@/domains/video-editing/types/transitions"
import type { BaseEffect as VideoEffect } from "@/domains/video-editing/types/unified-effects"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("Resources:Types")

// Общий интерфейс для всех ресурсов
export interface Resource {
  id: string
  type: ResourceType
  name: string
  resourceId: string // ID оригинального ресурса (эффекта, фильтра, перехода или шаблона)
  addedAt: number // Время добавления ресурса
}

// Типы ресурсов
export type ResourceType =
  | "media"
  | "music"
  | "subtitle"
  | "effect"
  | "filter"
  | "transition"
  | "template"
  | "styleTemplate"

// Интерфейс для медиафайлов
export interface MediaResource extends Resource {
  type: "media"
  file: MediaFile
  params?: Record<string, any> // Параметры медиафайла
}

// Интерфейс для музыкальных файлов
export interface MusicResource extends Resource {
  type: "music"
  file: MediaFile
  params?: Record<string, any> // Параметры музыкального файла
}

// Интерфейс для стилей субтитров
export interface SubtitleResource extends Resource {
  type: "subtitle"
  style: SubtitleStyleTemplate
  params?: Record<string, any> // Параметры стиля субтитров
}

// Интерфейс для эффектов
export interface EffectResource extends Resource {
  type: "effect"
  effect: VideoEffect
  params?: Record<string, any> // Параметры эффекта
}

// Интерфейс для фильтров
export interface FilterResource extends Resource {
  type: "filter"
  filter: VideoFilter
  params?: Record<string, any> // Параметры фильтра
}

// Интерфейс для переходов
export interface TransitionResource extends Resource {
  type: "transition"
  transition: Transition
  params?: Record<string, any> // Параметры перехода
}

// Интерфейс для шаблонов
export interface TemplateResource extends Resource {
  type: "template"
  template: MediaTemplate
  params?: Record<string, any> // Параметры шаблона
}

// Интерфейс для стилистических шаблонов
export interface StyleTemplateResource extends Resource {
  type: "styleTemplate"
  template: StyleTemplate
  params?: Record<string, any> // Параметры стилистического шаблона
}

// Тип для всех ресурсов
export type TimelineResource =
  | MediaResource
  | MusicResource
  | SubtitleResource
  | EffectResource
  | FilterResource
  | TransitionResource
  | TemplateResource
  | StyleTemplateResource

// Функция для создания ресурса медиафайла
export function createMediaResource(file: MediaFile): MediaResource {
  return {
    id: `media-${file.id}-${Date.now()}`,
    type: "media",
    name: file.name,
    resourceId: file.id,
    addedAt: Date.now(),
    file,
    params: {},
  }
}

// Функция для создания ресурса музыкального файла
export function createMusicResource(file: MediaFile): MusicResource {
  return {
    id: `music-${file.id}-${Date.now()}`,
    type: "music",
    name: file.name,
    resourceId: file.id,
    addedAt: Date.now(),
    file,
    params: {},
  }
}

// Функция для создания ресурса стиля субтитров
export function createSubtitleResource(style: SubtitleStyleTemplate): SubtitleResource {
  return {
    id: `subtitle-${style.id}-${Date.now()}`,
    type: "subtitle",
    name: style.name,
    resourceId: style.id,
    addedAt: Date.now(),
    style,
    params: {},
  }
}

// Функция для создания ресурса эффекта
export function createEffectResource(effect: VideoEffect): EffectResource {
  if (!effect || !effect.id || !effect.name) {
    logger.errorSync("[createEffectResource] Invalid effect object", { effect })
    throw new Error("Invalid effect object provided to createEffectResource")
  }

  return {
    id: `effect-${effect.id}-${Date.now()}`,
    type: "effect",
    name: typeof effect.name === "string" ? effect.name : effect.name.en || effect.name.ru || "Effect",
    resourceId: effect.id,
    addedAt: Date.now(),
    effect,
    params: effect.parameters
      ? effect.parameters.reduce<Record<string, any>>((acc, param) => {
          acc[param.id] = param.defaultValue
          return acc
        }, {})
      : {},
  }
}

// Функция для создания ресурса фильтра
export function createFilterResource(filter: VideoFilter): FilterResource {
  if (!filter || !filter.id || !filter.name) {
    logger.errorSync("[createFilterResource] Invalid filter object", { filter })
    throw new Error("Invalid filter object provided to createFilterResource")
  }

  return {
    id: `filter-${filter.id}-${Date.now()}`,
    type: "filter",
    name: filter.name,
    resourceId: filter.id,
    addedAt: Date.now(),
    filter,
    params: filter.params ? { ...filter.params } : {},
  }
}

// Функция для создания ресурса перехода
export function createTransitionResource(transition: Transition): TransitionResource {
  if (!transition || !transition.id) {
    logger.errorSync("[createTransitionResource] Invalid transition object", { transition })
    throw new Error("Invalid transition object provided to createTransitionResource")
  }

  logger.infoSync("Creating transition resource from", { transitionId: transition.id })
  const resource: TransitionResource = {
    id: `transition-${transition.id}-${Date.now()}`,
    type: "transition",
    name: transition.labels?.ru || transition.id,
    resourceId: transition.id,
    addedAt: Date.now(),
    transition,
    params: transition.parameters ? { ...transition.parameters } : {},
  }
  logger.infoSync("Created transition resource", { resourceId: resource.id })
  return resource
}

// Функция для создания ресурса шаблона
export function createTemplateResource(template: MediaTemplate): TemplateResource {
  return {
    id: `template-${template.id}-${Date.now()}`,
    type: "template",
    name: template.id,
    resourceId: template.id,
    addedAt: Date.now(),
    template,
    params: {},
  }
}

// Функция для создания ресурса стилистического шаблона
export function createStyleTemplateResource(template: StyleTemplate): StyleTemplateResource {
  return {
    id: `styleTemplate-${template.id}-${Date.now()}`,
    type: "styleTemplate",
    name: template.name.ru,
    resourceId: template.id,
    addedAt: Date.now(),
    template,
    params: {},
  }
}
