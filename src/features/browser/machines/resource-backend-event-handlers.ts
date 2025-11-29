/**
 * Backend Event Handlers для Browser Resources
 *
 * Обрабатывает события от Rust backend и обновляет состояние доступных ресурсов в Browser
 * Используется паттерн Command-Event для синхронизации
 *
 * @description
 * Этот файл отвечает за обработку backend событий, связанных с ресурсами,
 * которые доступны для выбора в Browser компоненте (не те, что уже на timeline).
 * События включают добавление/удаление эффектов, фильтров, переходов и других ресурсов.
 */

import { createLogger } from "@/lib/tauri-logger"
import type { Resource, ResourceSource } from "../types/browser-resources-provider"

const logger = createLogger("BrowserResources:BackendEventHandlers")

// Define ProjectEvent type locally since import is not working
type ProjectEvent =
  | { type: "EffectAdded"; payload: { effect_id: string; name: string } }
  | { type: "EffectRemoved"; payload: { effect_id: string } }
  | { type: "FilterAdded"; payload: { filter_id: string; name: string } }
  | { type: "FilterRemoved"; payload: { filter_id: string } }
  | { type: "TransitionAdded"; payload: { transition_id: string; name: string } }
  | { type: "TransitionRemoved"; payload: { transition_id: string } }
  | { type: "TemplateAdded"; payload: { template_id: string; name: string } }
  | { type: "TemplateRemoved"; payload: { template_id: string } }
  | { type: "StyleTemplateAdded"; payload: { template_id: string; name: string } }
  | { type: "StyleTemplateRemoved"; payload: { template_id: string } }
  | { type: "SubtitleAdded"; payload: { subtitle_id: string; name: string } }
  | { type: "SubtitleRemoved"; payload: { subtitle_id: string } }
  // Media events (unified architecture 2025-11)
  | { type: "MediaAdded"; payload: { media: { id: string; name: string } } }
  | { type: "MediaRemoved"; payload: { media_id: string } }
  // Legacy ImportedMedia events - kept for backward compatibility
  | { type: "ImportedMediaAdded"; payload: { media: { id: string; name: string } } }
  | { type: "ImportedMediaRemoved"; payload: { media_id: string } }
  | { type: "ImportedMediaUpdated"; payload: { media_id: string } }
  | { type: "ImportedMediaCleared"; payload: Record<string, never> }
  | { type: string; payload?: any }

/**
 * Контекст для обработки browser resource событий
 */
export interface BrowserResourcesContext {
  resources: Map<string, Resource[]>
  loadedSources: Set<ResourceSource>
  isLoading: boolean
  error: string | null
}

/**
 * Результат обработки события
 */
export interface EventHandlerResult {
  resources?: Map<string, Resource[]>
  loadedSources?: Set<ResourceSource>
  shouldRefreshSource?: ResourceSource
  error?: string | null
}

/**
 * Главный обработчик backend событий для Browser Resources
 */
export function handleBackendEvent(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  logger.debugSync("Handling backend event", { eventType: event.type })

  switch (event.type) {
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

    // Media events (unified architecture 2025-11)
    case "MediaAdded":
      return handleMediaAdded(context, event)
    case "MediaRemoved":
      return handleMediaRemoved(context, event)

    // Legacy ImportedMedia events - redirect to Media handlers
    case "ImportedMediaAdded":
      return handleImportedMediaAdded(context, event)
    case "ImportedMediaRemoved":
      return handleImportedMediaRemoved(context, event)
    case "ImportedMediaUpdated":
      return handleImportedMediaUpdated(context, event)
    case "ImportedMediaCleared":
      // No-op: imported_media storage removed
      return {}

    default:
      logger.debugSync("Unhandled backend event type", { type: event.type })
      return {}
  }
}

// ============================================================================
// Effect Handlers
// ============================================================================

function handleEffectAdded(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "EffectAdded") return {}
  const { effect_id, name } = event.payload

  logger.info("Adding effect to browser library", { effectId: effect_id, name })

  // Определяем источник (для пользовательских эффектов используем "imported")
  const source: ResourceSource = "imported"
  const key = `effect:${source}`

  const currentResources = context.resources.get(key) || []

  // Проверяем, не добавлен ли уже
  const exists = currentResources.some((r) => r.id === effect_id)
  if (exists) {
    logger.debugSync("Effect already exists in browser library, skipping", { effectId: effect_id })
    return {}
  }

  // Создаем новый ресурс (только базовые поля, остальные будут заполнены позже)
  const newResource: Resource = {
    id: effect_id,
    name,
    type: "effect",
  } as Resource

  // Обновляем Map
  const newResources = new Map(context.resources)
  newResources.set(key, [...currentResources, newResource])

  return {
    resources: newResources,
    loadedSources: new Set([...context.loadedSources, source]),
  }
}

function handleEffectRemoved(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "EffectRemoved") return {}
  const { effect_id } = event.payload

  logger.info("Removing effect from browser library", { effectId: effect_id })

  const source: ResourceSource = "imported"
  const key = `effect:${source}`

  const currentResources = context.resources.get(key) || []
  const filteredResources = currentResources.filter((r) => r.id !== effect_id)

  const newResources = new Map(context.resources)
  newResources.set(key, filteredResources)

  return {
    resources: newResources,
  }
}

// ============================================================================
// Filter Handlers
// ============================================================================

function handleFilterAdded(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "FilterAdded") return {}
  const { filter_id, name } = event.payload

  logger.info("Adding filter to browser library", { filterId: filter_id, name })

  const source: ResourceSource = "imported"
  const key = `filter:${source}`

  const currentResources = context.resources.get(key) || []

  const exists = currentResources.some((r) => r.id === filter_id)
  if (exists) {
    logger.debugSync("Filter already exists in browser library, skipping", { filterId: filter_id })
    return {}
  }

  const newResource: Resource = {
    id: filter_id,
    name,
    type: "filter",
  } as Resource

  const newResources = new Map(context.resources)
  newResources.set(key, [...currentResources, newResource])

  return {
    resources: newResources,
    loadedSources: new Set([...context.loadedSources, source]),
  }
}

function handleFilterRemoved(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "FilterRemoved") return {}
  const { filter_id } = event.payload

  logger.info("Removing filter from browser library", { filterId: filter_id })

  const source: ResourceSource = "imported"
  const key = `filter:${source}`

  const currentResources = context.resources.get(key) || []
  const filteredResources = currentResources.filter((r) => r.id !== filter_id)

  const newResources = new Map(context.resources)
  newResources.set(key, filteredResources)

  return {
    resources: newResources,
  }
}

// ============================================================================
// Transition Handlers
// ============================================================================

function handleTransitionAdded(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "TransitionAdded") return {}
  const { transition_id, name } = event.payload

  logger.info("Adding transition to browser library", { transitionId: transition_id, name })

  const source: ResourceSource = "imported"
  const key = `transition:${source}`

  const currentResources = context.resources.get(key) || []

  const exists = currentResources.some((r) => r.id === transition_id)
  if (exists) {
    logger.debugSync("Transition already exists in browser library, skipping", { transitionId: transition_id })
    return {}
  }

  const newResource: Resource = {
    id: transition_id,
    name,
    type: "transition",
  } as Resource

  const newResources = new Map(context.resources)
  newResources.set(key, [...currentResources, newResource])

  return {
    resources: newResources,
    loadedSources: new Set([...context.loadedSources, source]),
  }
}

function handleTransitionRemoved(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "TransitionRemoved") return {}
  const { transition_id } = event.payload

  logger.info("Removing transition from browser library", { transitionId: transition_id })

  const source: ResourceSource = "imported"
  const key = `transition:${source}`

  const currentResources = context.resources.get(key) || []
  const filteredResources = currentResources.filter((r) => r.id !== transition_id)

  const newResources = new Map(context.resources)
  newResources.set(key, filteredResources)

  return {
    resources: newResources,
  }
}

// ============================================================================
// Template Handlers
// ============================================================================

function handleTemplateAdded(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "TemplateAdded") return {}
  const { template_id, name } = event.payload

  logger.info("Adding template to browser library", { templateId: template_id, name })

  const source: ResourceSource = "imported"
  const key = `template:${source}`

  const currentResources = context.resources.get(key) || []

  const exists = currentResources.some((r) => r.id === template_id)
  if (exists) {
    logger.debugSync("Template already exists in browser library, skipping", { templateId: template_id })
    return {}
  }

  const newResource: Resource = {
    id: template_id,
    name,
    type: "template",
  } as Resource

  const newResources = new Map(context.resources)
  newResources.set(key, [...currentResources, newResource])

  return {
    resources: newResources,
    loadedSources: new Set([...context.loadedSources, source]),
  }
}

function handleTemplateRemoved(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "TemplateRemoved") return {}
  const { template_id } = event.payload

  logger.info("Removing template from browser library", { templateId: template_id })

  const source: ResourceSource = "imported"
  const key = `template:${source}`

  const currentResources = context.resources.get(key) || []
  const filteredResources = currentResources.filter((r) => r.id !== template_id)

  const newResources = new Map(context.resources)
  newResources.set(key, filteredResources)

  return {
    resources: newResources,
  }
}

// ============================================================================
// Style Template Handlers
// ============================================================================

function handleStyleTemplateAdded(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "StyleTemplateAdded") return {}
  const { template_id, name } = event.payload

  logger.info("Adding style template to browser library", { templateId: template_id, name })

  const source: ResourceSource = "imported"
  const key = `styleTemplate:${source}`

  const currentResources = context.resources.get(key) || []

  const exists = currentResources.some((r) => r.id === template_id)
  if (exists) {
    logger.debugSync("Style template already exists in browser library, skipping", { templateId: template_id })
    return {}
  }

  const newResource: Resource = {
    id: template_id,
    name,
    type: "styleTemplate",
  } as Resource

  const newResources = new Map(context.resources)
  newResources.set(key, [...currentResources, newResource])

  return {
    resources: newResources,
    loadedSources: new Set([...context.loadedSources, source]),
  }
}

function handleStyleTemplateRemoved(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "StyleTemplateRemoved") return {}
  const { template_id } = event.payload

  logger.info("Removing style template from browser library", { templateId: template_id })

  const source: ResourceSource = "imported"
  const key = `styleTemplate:${source}`

  const currentResources = context.resources.get(key) || []
  const filteredResources = currentResources.filter((r) => r.id !== template_id)

  const newResources = new Map(context.resources)
  newResources.set(key, filteredResources)

  return {
    resources: newResources,
  }
}

// ============================================================================
// Subtitle Handlers
// ============================================================================

function handleSubtitleAdded(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "SubtitleAdded") return {}
  const { subtitle_id, name } = event.payload

  logger.info("Adding subtitle to browser library", { subtitleId: subtitle_id, name })

  const source: ResourceSource = "imported"
  const key = `subtitle:${source}`

  const currentResources = context.resources.get(key) || []

  const exists = currentResources.some((r) => r.id === subtitle_id)
  if (exists) {
    logger.debugSync("Subtitle already exists in browser library, skipping", { subtitleId: subtitle_id })
    return {}
  }

  const newResource: Resource = {
    id: subtitle_id,
    name,
    type: "subtitle",
  } as Resource

  const newResources = new Map(context.resources)
  newResources.set(key, [...currentResources, newResource])

  return {
    resources: newResources,
    loadedSources: new Set([...context.loadedSources, source]),
  }
}

function handleSubtitleRemoved(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "SubtitleRemoved") return {}
  const { subtitle_id } = event.payload

  logger.info("Removing subtitle from browser library", { subtitleId: subtitle_id })

  const source: ResourceSource = "imported"
  const key = `subtitle:${source}`

  const currentResources = context.resources.get(key) || []
  const filteredResources = currentResources.filter((r) => r.id !== subtitle_id)

  const newResources = new Map(context.resources)
  newResources.set(key, filteredResources)

  return {
    resources: newResources,
  }
}

// ============================================================================
// Media Handlers (unified architecture 2025-11)
// ============================================================================

function handleMediaAdded(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "MediaAdded") return {}
  const { media } = event.payload

  logger.info("Adding media to browser library", { mediaId: media.id, name: media.name })

  const source: ResourceSource = "imported"
  const key = `media:${source}`

  const currentResources = context.resources.get(key) || []

  const exists = currentResources.some((r) => r.id === media.id)
  if (exists) {
    logger.debugSync("Media already exists in browser library, skipping", { mediaId: media.id })
    return {}
  }

  const newResource: Resource = {
    id: media.id,
    name: media.name,
    type: "media",
  } as Resource

  const newResources = new Map(context.resources)
  newResources.set(key, [...currentResources, newResource])

  return {
    resources: newResources,
    loadedSources: new Set([...context.loadedSources, source]),
  }
}

function handleMediaRemoved(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "MediaRemoved") return {}
  const { media_id } = event.payload

  logger.info("Removing media from browser library", { mediaId: media_id })

  const source: ResourceSource = "imported"
  const key = `media:${source}`

  const currentResources = context.resources.get(key) || []
  const filteredResources = currentResources.filter((r) => r.id !== media_id)

  const newResources = new Map(context.resources)
  newResources.set(key, filteredResources)

  return {
    resources: newResources,
  }
}

// ============================================================================
// Legacy Imported Media Handlers (backward compatibility)
// ============================================================================

function handleImportedMediaAdded(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "ImportedMediaAdded") return {}
  const { media } = event.payload

  logger.info("Adding imported media to browser library", { mediaId: media.id, name: media.name })

  // Импортированные медиа файлы относятся к источнику "imported"
  const source: ResourceSource = "imported"
  const key = `media:${source}`

  const currentResources = context.resources.get(key) || []

  const exists = currentResources.some((r) => r.id === media.id)
  if (exists) {
    logger.debugSync("Imported media already exists in browser library, skipping", { mediaId: media.id })
    return {}
  }

  const newResource: Resource = {
    id: media.id,
    name: media.name,
    type: "media",
  } as Resource

  const newResources = new Map(context.resources)
  newResources.set(key, [...currentResources, newResource])

  return {
    resources: newResources,
    loadedSources: new Set([...context.loadedSources, source]),
  }
}

function handleImportedMediaRemoved(context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "ImportedMediaRemoved") return {}
  const { media_id } = event.payload

  logger.info("Removing imported media from browser library", { mediaId: media_id })

  const source: ResourceSource = "imported"
  const key = `media:${source}`

  const currentResources = context.resources.get(key) || []
  const filteredResources = currentResources.filter((r) => r.id !== media_id)

  const newResources = new Map(context.resources)
  newResources.set(key, filteredResources)

  return {
    resources: newResources,
  }
}

function handleImportedMediaUpdated(_context: BrowserResourcesContext, event: ProjectEvent): EventHandlerResult {
  if (event.type !== "ImportedMediaUpdated") return {}
  const { media_id } = event.payload

  logger.info("Imported media updated, triggering refresh", { mediaId: media_id })

  // Для обновлений проще всего перезагрузить источник
  return {
    shouldRefreshSource: "imported",
  }
}

// NOTE (2025-11): handleImportedMediaCleared removed - no longer needed
// imported_media storage removed in unified architecture
