import type { VideoFilter } from "./filters"
import type { MediaFile } from "./media"
import type { SubtitleStyleTemplate } from "./subtitles"
import type { MediaTemplate } from "./templates"
import type { Transition } from "./transitions"

export type ResourceType =
  | "media"
  | "music"
  | "subtitle"
  | "effect"
  | "filter"
  | "transition"
  | "template"
  | "styleTemplate"

export interface Resource {
  id: string
  type: ResourceType
  name: string
  resourceId: string
  addedAt: number
}

export interface MediaResource extends Resource {
  type: "media"
  file: MediaFile
  params?: Record<string, unknown>
}

export interface MusicResource extends Resource {
  type: "music"
  file: MediaFile
  params?: Record<string, unknown>
}

export interface SubtitleResource extends Resource {
  type: "subtitle"
  style: SubtitleStyleTemplate
  params?: Record<string, unknown>
}

export interface EffectResource extends Resource {
  type: "effect"
  effect: any
  params?: Record<string, unknown>
}

export interface FilterResource extends Resource {
  type: "filter"
  filter: VideoFilter
  params?: Record<string, unknown>
}

export interface TransitionResource extends Resource {
  type: "transition"
  transition: Transition
  params?: Record<string, unknown>
}

export interface TemplateResource extends Resource {
  type: "template"
  template: MediaTemplate
  params?: Record<string, unknown>
}

export interface StyleTemplateResource extends Resource {
  type: "styleTemplate"
  template: any
  params?: Record<string, unknown>
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
