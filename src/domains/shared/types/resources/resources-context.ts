import type { MediaFile } from "@/domains/media-management"
import type {
  EffectResource,
  FilterResource,
  MediaResource,
  MusicResource,
  StyleTemplateResource,
  SubtitleResource,
  TemplateResource,
  TimelineResource,
  TransitionResource,
} from "@/domains/shared/types/resources/types"
import type { VideoFilter } from "@/domains/video-editing/types/filters"
import type { MediaTemplate, StyleTemplate, SubtitleStyleTemplate } from "@/domains/video-editing/types/templates"
import type { Transition } from "@/domains/video-editing/types/transitions"
import type { BaseEffect as VideoEffect } from "@/domains/video-editing/types/unified-effects"

export interface ResourcesContextType {
  resources: TimelineResource[]
  mediaResources: MediaResource[]
  musicResources: MusicResource[]
  subtitleResources: SubtitleResource[]
  effectResources: EffectResource[]
  filterResources: FilterResource[]
  transitionResources: TransitionResource[]
  templateResources: TemplateResource[]
  styleTemplateResources: StyleTemplateResource[]

  isLoading: boolean
  error: string | null

  addMedia: (file: MediaFile) => Promise<void>
  addMusic: (file: MediaFile) => Promise<void>
  addSubtitle: (style: SubtitleStyleTemplate) => Promise<void>
  addEffect: (effect: VideoEffect) => Promise<void>
  addFilter: (filter: VideoFilter) => Promise<void>
  addTransition: (transition: Transition) => Promise<void>
  addTemplate: (template: MediaTemplate) => Promise<void>
  addStyleTemplate: (template: StyleTemplate) => Promise<void>

  removeResource: (resourceId: string, resourceType?: string) => Promise<void>
  updateResource: (resourceId: string, params: Record<string, any>) => Promise<void>
  clearResources: () => Promise<void>

  getResourceById: (resourceId: string) => TimelineResource | undefined
  getResourcesByType: (type: string) => TimelineResource[]
  isMusicAdded: (file: MediaFile) => boolean
  isSubtitleAdded: (style: SubtitleStyleTemplate) => boolean
  isTemplateAdded: (template: MediaTemplate) => boolean
  isEffectAdded: (effect: VideoEffect) => boolean
  isFilterAdded: (filter: VideoFilter) => boolean
  isTransitionAdded: (transition: Transition) => boolean
  isStyleTemplateAdded: (template: StyleTemplate) => boolean
  isAdded: (resourceId: string, type: string, filePath?: string) => boolean
}
