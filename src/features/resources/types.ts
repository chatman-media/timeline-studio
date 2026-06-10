/**
 * UI-facing resource types for the resources panel.
 * Keep this file independent from domain packages so the feature can be
 * extracted through package-boundary slices without changing runtime data.
 */

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("Resources:Types")

export interface ResourceMediaFile {
  id: string
  name: string
  path: string
  type: any
  duration?: number
  size?: number
  createdAt?: Date
  updatedAt?: Date
  width?: number
  height?: number
  fps?: number
  bitrate?: number
  thumbnail?: string
  thumbnailPath?: string
  probeData?: any
  metadata?: {
    type: "Video" | "Audio" | "Image"
    [key: string]: any
  }
  isVideo?: boolean
  isImage?: boolean
  isAudio?: boolean
  isAddedToTimeline?: boolean
  isIncluded?: boolean
  isUnavailable?: boolean
  isLoadingMetadata?: boolean
  [key: string]: any
}

export interface ResourceEffect {
  id?: string
  name?: string | { en?: string; ru?: string }
  parameters?: Array<{
    id: string
    defaultValue?: any
    [key: string]: any
  }>
  [key: string]: any
}

export interface ResourceFilter {
  id?: string
  name?: string
  params?: Record<string, any>
  [key: string]: any
}

export interface ResourceTransition {
  id?: string
  labels?: {
    ru?: string
    en?: string
  }
  parameters?: Record<string, any>
  [key: string]: any
}

export interface ResourceTemplate {
  id: string
  [key: string]: any
}

export interface ResourceStyleTemplate {
  id: string
  name: string | { ru?: string; en?: string }
  [key: string]: any
}

export interface ResourceSubtitleStyle {
  id: string
  name: string
  [key: string]: any
}

export interface Resource {
  id: string
  type: ResourceType
  name: string
  resourceId: string
  addedAt: number
}

export type ResourceType =
  | "media"
  | "music"
  | "subtitle"
  | "effect"
  | "filter"
  | "transition"
  | "template"
  | "styleTemplate"

export interface MediaResource extends Resource {
  type: "media"
  file: ResourceMediaFile
  params?: Record<string, any>
}

export interface MusicResource extends Resource {
  type: "music"
  file: ResourceMediaFile
  params?: Record<string, any>
}

export interface SubtitleResource extends Resource {
  type: "subtitle"
  style: ResourceSubtitleStyle
  params?: Record<string, any>
}

export interface EffectResource extends Resource {
  type: "effect"
  effect: ResourceEffect
  params?: Record<string, any>
}

export interface FilterResource extends Resource {
  type: "filter"
  filter: ResourceFilter
  params?: Record<string, any>
}

export interface TransitionResource extends Resource {
  type: "transition"
  transition: ResourceTransition
  params?: Record<string, any>
}

export interface TemplateResource extends Resource {
  type: "template"
  template: ResourceTemplate
  params?: Record<string, any>
}

export interface StyleTemplateResource extends Resource {
  type: "styleTemplate"
  template: ResourceStyleTemplate
  params?: Record<string, any>
}

export type TimelineResource =
  | MediaResource
  | MusicResource
  | SubtitleResource
  | EffectResource
  | FilterResource
  | TransitionResource
  | TemplateResource
  | StyleTemplateResource

export function createMediaResource(file: ResourceMediaFile): MediaResource {
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

export function createMusicResource(file: ResourceMediaFile): MusicResource {
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

export function createSubtitleResource(style: ResourceSubtitleStyle): SubtitleResource {
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

export function createEffectResource(effect: ResourceEffect): EffectResource {
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

export function createFilterResource(filter: ResourceFilter): FilterResource {
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

export function createTransitionResource(transition: ResourceTransition): TransitionResource {
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

export function createTemplateResource(template: ResourceTemplate): TemplateResource {
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

export function createStyleTemplateResource(template: ResourceStyleTemplate): StyleTemplateResource {
  return {
    id: `styleTemplate-${template.id}-${Date.now()}`,
    type: "styleTemplate",
    name: typeof template.name === "string" ? template.name : template.name.ru || template.name.en || template.id,
    resourceId: template.id,
    addedAt: Date.now(),
    template,
    params: {},
  }
}
