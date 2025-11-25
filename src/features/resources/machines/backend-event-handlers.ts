/**
 * Backend Event Handlers для Resources
 *
 * Обрабатывает события от Rust backend и обновляет состояние resources
 * Используется паттерн Command-Event для синхронизации
 */

import { MediaType as LocalMediaType } from "@/features/media/types/media"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectEvent } from "@/types/generated/state-types-extensions"
import type {
  EffectResource,
  FilterResource,
  MediaResource,
  MusicResource,
  StyleTemplateResource,
  SubtitleResource,
  TemplateResource,
  TransitionResource,
} from "../types"

const logger = createLogger("Resources:BackendEventHandlers")

/**
 * Контекст для обработки resource событий
 */
export interface ResourcesContext {
  mediaResources: MediaResource[]
  musicResources: MusicResource[]
  effectResources: EffectResource[]
  filterResources: FilterResource[]
  transitionResources: TransitionResource[]
  templateResources: TemplateResource[]
  styleTemplateResources: StyleTemplateResource[]
  subtitleResources: SubtitleResource[]
  isLoading: boolean
  error: string | null
}

/**
 * Главный обработчик backend событий для Resources
 */
export function handleBackendEvent(context: ResourcesContext, event: ProjectEvent): Partial<ResourcesContext> {
  logger.info("Handling backend event:", { eventType: event.type })

  switch (event.type) {
    // Project events - очищаем все ресурсы при создании/закрытии проекта
    case "ProjectCreated":
    case "ProjectClosed":
      return handleProjectReset()

    // Media events
    case "MediaAdded":
      return handleMediaAdded(context, event)
    case "MediaRemoved":
      return handleMediaRemoved(context, event)
    case "MediaUpdated":
      return handleMediaUpdated(context, event)

    // Effect events
    case "EffectAdded":
      return handleEffectAdded(context, event)
    case "EffectRemoved":
      return handleEffectRemoved(context, event)

    // Filter events
    case "FilterAdded":
      return handleFilterAdded(context, event)
    case "FilterRemoved":
      return handleFilterRemoved(context, event)

    // Transition events
    case "TransitionAdded":
      return handleTransitionAdded(context, event)
    case "TransitionRemoved":
      return handleTransitionRemoved(context, event)

    // Template events
    case "TemplateAdded":
      return handleTemplateAdded(context, event)
    case "TemplateRemoved":
      return handleTemplateRemoved(context, event)

    // Style template events
    case "StyleTemplateAdded":
      return handleStyleTemplateAdded(context, event)
    case "StyleTemplateRemoved":
      return handleStyleTemplateRemoved(context, event)

    // Subtitle events
    case "SubtitleAdded":
      return handleSubtitleAdded(context, event)
    case "SubtitleRemoved":
      return handleSubtitleRemoved(context, event)

    default:
      logger.debug("Unhandled backend event type:", { type: event.type })
      return {}
  }
}

// ============================================================================
// Project Handlers
// ============================================================================

/**
 * Обработка события ProjectCreated/ProjectClosed
 * Очищает все ресурсы для нового/закрытого проекта
 */
function handleProjectReset(): Partial<ResourcesContext> {
  logger.info("Resetting all resources for new/closed project")

  return {
    mediaResources: [],
    musicResources: [],
    effectResources: [],
    filterResources: [],
    transitionResources: [],
    templateResources: [],
    styleTemplateResources: [],
    subtitleResources: [],
    isLoading: false,
    error: null,
  }
}

// ============================================================================
// Media Handlers
// ============================================================================

function handleMediaAdded(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "MediaAdded" }>,
): Partial<ResourcesContext> {
  const { media } = event.payload

  logger.info("Adding media resource:", { mediaId: media.id, name: media.name, mediaType: media.media_type })

  // Определяем тип media (Video/Image или Audio)
  const isAudio = media.media_type === "Audio"

  if (isAudio) {
    // Добавляем как музыку
    const musicResource: MusicResource = {
      id: media.id,
      type: "music",
      name: media.name,
      resourceId: media.id,
      addedAt: Date.now(),
      file: {
        id: media.id,
        name: media.name,
        path: media.path,
        type: LocalMediaType.Audio,
        size: 0,
        isVideo: false,
        isAudio: true,
        isImage: false,
        isLoadingMetadata: false,
        probeData: { streams: [], format: {} },
        duration: media.duration || 0,
      },
      params: {},
    }

    return {
      musicResources: [...context.musicResources, musicResource],
    }
  }
  // Добавляем как медиа (видео или изображение)
  const isVideo = media.media_type === "Video"
  const mediaResource: MediaResource = {
    id: media.id,
    type: "media",
    name: media.name,
    resourceId: media.id,
    addedAt: Date.now(),
    file: {
      id: media.id,
      name: media.name,
      path: media.path,
      type: isVideo ? LocalMediaType.Video : LocalMediaType.StillImage,
      size: 0,
      isVideo,
      isAudio: false,
      isImage: !isVideo,
      isLoadingMetadata: false,
      probeData: { streams: [], format: {} },
      duration: media.duration || 0,
    },
    params: {},
  }

  return {
    mediaResources: [...context.mediaResources, mediaResource],
  }
}

function handleMediaRemoved(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "MediaRemoved" }>,
): Partial<ResourcesContext> {
  const { media_id } = event.payload

  logger.info("Removing media resource:", { mediaId: media_id })

  // Удаляем из обоих массивов (может быть либо media, либо music)
  return {
    mediaResources: context.mediaResources.filter((r) => r.id !== media_id),
    musicResources: context.musicResources.filter((r) => r.id !== media_id),
  }
}

function handleMediaUpdated(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "MediaUpdated" }>,
): Partial<ResourcesContext> {
  const { media_id, changes } = event.payload

  logger.info("Updating media resource:", { mediaId: media_id, changes })

  // Обновляем в mediaResources
  const updatedMediaResources = context.mediaResources.map((resource) => {
    if (resource.id === media_id) {
      return {
        ...resource,
        name: changes.name || resource.name,
        file: {
          ...resource.file,
          name: changes.name || resource.file.name,
        },
      }
    }
    return resource
  })

  // Обновляем в musicResources
  const updatedMusicResources = context.musicResources.map((resource) => {
    if (resource.id === media_id) {
      return {
        ...resource,
        name: changes.name || resource.name,
        file: {
          ...resource.file,
          name: changes.name || resource.file.name,
        },
      }
    }
    return resource
  })

  return {
    mediaResources: updatedMediaResources,
    musicResources: updatedMusicResources,
  }
}

// ============================================================================
// Effect Handlers
// ============================================================================

function handleEffectAdded(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "EffectAdded" }>,
): Partial<ResourcesContext> {
  const { effect_id, name } = event.payload

  logger.info("Adding effect resource:", { effectId: effect_id, name })

  // Проверяем, не добавлен ли уже
  const exists = context.effectResources.some((r) => r.resourceId === effect_id)
  if (exists) {
    logger.debug("Effect already exists, skipping:", { effectId: effect_id })
    return {}
  }

  const effectResource: EffectResource = {
    id: `effect-${effect_id}-${Date.now()}`,
    type: "effect",
    name,
    resourceId: effect_id,
    addedAt: Date.now(),
    effect: {
      id: effect_id,
      name,
      parameters: [],
    } as any,
    params: {},
  }

  return {
    effectResources: [...context.effectResources, effectResource],
  }
}

function handleEffectRemoved(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "EffectRemoved" }>,
): Partial<ResourcesContext> {
  const { effect_id } = event.payload

  logger.info("Removing effect resource:", { effectId: effect_id })

  return {
    effectResources: context.effectResources.filter((r) => r.resourceId !== effect_id),
  }
}

// ============================================================================
// Filter Handlers
// ============================================================================

function handleFilterAdded(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "FilterAdded" }>,
): Partial<ResourcesContext> {
  const { filter_id, name } = event.payload

  logger.info("Adding filter resource:", { filterId: filter_id, name })

  // Проверяем, не добавлен ли уже
  const exists = context.filterResources.some((r) => r.resourceId === filter_id)
  if (exists) {
    logger.debug("Filter already exists, skipping:", { filterId: filter_id })
    return {}
  }

  const filterResource: FilterResource = {
    id: `filter-${filter_id}-${Date.now()}`,
    type: "filter",
    name,
    resourceId: filter_id,
    addedAt: Date.now(),
    filter: {
      id: filter_id,
      name,
      params: {},
    } as any,
    params: {},
  }

  return {
    filterResources: [...context.filterResources, filterResource],
  }
}

function handleFilterRemoved(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "FilterRemoved" }>,
): Partial<ResourcesContext> {
  const { filter_id } = event.payload

  logger.info("Removing filter resource:", { filterId: filter_id })

  return {
    filterResources: context.filterResources.filter((r) => r.resourceId !== filter_id),
  }
}

// ============================================================================
// Transition Handlers
// ============================================================================

function handleTransitionAdded(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "TransitionAdded" }>,
): Partial<ResourcesContext> {
  const { transition_id, name } = event.payload

  logger.info("Adding transition resource:", { transitionId: transition_id, name })

  // Проверяем, не добавлен ли уже
  const exists = context.transitionResources.some((r) => r.resourceId === transition_id)
  if (exists) {
    logger.debug("Transition already exists, skipping:", { transitionId: transition_id })
    return {}
  }

  const transitionResource: TransitionResource = {
    id: `transition-${transition_id}-${Date.now()}`,
    type: "transition",
    name,
    resourceId: transition_id,
    addedAt: Date.now(),
    transition: {
      id: transition_id,
      labels: { ru: name, en: name },
      parameters: {},
    } as any,
    params: {},
  }

  return {
    transitionResources: [...context.transitionResources, transitionResource],
  }
}

function handleTransitionRemoved(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "TransitionRemoved" }>,
): Partial<ResourcesContext> {
  const { transition_id } = event.payload

  logger.info("Removing transition resource:", { transitionId: transition_id })

  return {
    transitionResources: context.transitionResources.filter((r) => r.resourceId !== transition_id),
  }
}

// ============================================================================
// Template Handlers
// ============================================================================

function handleTemplateAdded(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "TemplateAdded" }>,
): Partial<ResourcesContext> {
  const { template_id, name } = event.payload

  logger.info("Adding template resource:", { templateId: template_id, name })

  // Проверяем, не добавлен ли уже
  const exists = context.templateResources.some((r) => r.resourceId === template_id)
  if (exists) {
    logger.debug("Template already exists, skipping:", { templateId: template_id })
    return {}
  }

  const templateResource: TemplateResource = {
    id: `template-${template_id}-${Date.now()}`,
    type: "template",
    name,
    resourceId: template_id,
    addedAt: Date.now(),
    template: {
      id: template_id,
    } as any,
    params: {},
  }

  return {
    templateResources: [...context.templateResources, templateResource],
  }
}

function handleTemplateRemoved(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "TemplateRemoved" }>,
): Partial<ResourcesContext> {
  const { template_id } = event.payload

  logger.info("Removing template resource:", { templateId: template_id })

  return {
    templateResources: context.templateResources.filter((r) => r.resourceId !== template_id),
  }
}

// ============================================================================
// Style Template Handlers
// ============================================================================

function handleStyleTemplateAdded(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "StyleTemplateAdded" }>,
): Partial<ResourcesContext> {
  const { template_id, name } = event.payload

  logger.info("Adding style template resource:", { templateId: template_id, name })

  // Проверяем, не добавлен ли уже
  const exists = context.styleTemplateResources.some((r) => r.resourceId === template_id)
  if (exists) {
    logger.debug("Style template already exists, skipping:", { templateId: template_id })
    return {}
  }

  const styleTemplateResource: StyleTemplateResource = {
    id: `styleTemplate-${template_id}-${Date.now()}`,
    type: "styleTemplate",
    name,
    resourceId: template_id,
    addedAt: Date.now(),
    template: {
      id: template_id,
      name: { ru: name, en: name },
    } as any,
    params: {},
  }

  return {
    styleTemplateResources: [...context.styleTemplateResources, styleTemplateResource],
  }
}

function handleStyleTemplateRemoved(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "StyleTemplateRemoved" }>,
): Partial<ResourcesContext> {
  const { template_id } = event.payload

  logger.info("Removing style template resource:", { templateId: template_id })

  return {
    styleTemplateResources: context.styleTemplateResources.filter((r) => r.resourceId !== template_id),
  }
}

// ============================================================================
// Subtitle Handlers
// ============================================================================

function handleSubtitleAdded(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "SubtitleAdded" }>,
): Partial<ResourcesContext> {
  const { subtitle_id, name } = event.payload

  logger.info("Adding subtitle resource:", { subtitleId: subtitle_id, name })

  // Проверяем, не добавлен ли уже
  const exists = context.subtitleResources.some((r) => r.resourceId === subtitle_id)
  if (exists) {
    logger.debug("Subtitle already exists, skipping:", { subtitleId: subtitle_id })
    return {}
  }

  const subtitleResource: SubtitleResource = {
    id: `subtitle-${subtitle_id}-${Date.now()}`,
    type: "subtitle",
    name,
    resourceId: subtitle_id,
    addedAt: Date.now(),
    style: {
      id: subtitle_id,
      name,
    } as any,
    params: {},
  }

  return {
    subtitleResources: [...context.subtitleResources, subtitleResource],
  }
}

function handleSubtitleRemoved(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "SubtitleRemoved" }>,
): Partial<ResourcesContext> {
  const { subtitle_id } = event.payload

  logger.info("Removing subtitle resource:", { subtitleId: subtitle_id })

  return {
    subtitleResources: context.subtitleResources.filter((r) => r.resourceId !== subtitle_id),
  }
}
