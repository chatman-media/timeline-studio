import type { VideoFilter } from "./filters"
import type { MediaFile } from "./media"
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
