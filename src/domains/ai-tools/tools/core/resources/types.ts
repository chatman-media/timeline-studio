/**
 * Типы для AI инструментов работы с ресурсами
 */

import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { MediaFile } from "@/features/media/types/media"
import type { ResourcesContextType } from "@/features/resources/services/resources-provider"

/**
 * Результат выполнения инструмента для ресурсов
 */
export interface ResourceToolResult {
  success: boolean
  message: string
  data?: {
    addedResources?: string[]
    removedResources?: string[]
    analysis?: any
    suggestions?: string[]
    warnings?: string[]
  }
  errors?: string[]
  nextActions?: string[]
}

/**
 * Типы событий для ресурсов, которые могут генерировать инструменты
 */
export type ResourceToolEvent =
  | { type: "RESOURCE_ADDED"; resourceId: string; resourceType: string; reason: string }
  | { type: "RESOURCE_REMOVED"; resourceId: string; reason: string }
  | { type: "RESOURCES_BULK_ADDED"; count: number; criteria: any; reason: string }
  | { type: "RESOURCE_UPDATED"; resourceId: string; changes: any; reason: string }
  | { type: "RESOURCES_ANALYZED"; analysis: any }
  | { type: "RESOURCES_CLEANUP"; removedCount: number; criteria: any }

/**
 * Интерфейс для доступа к состоянию Resources Provider
 */
export interface ResourcesStateAccess {
  getResourcesProvider: () => ResourcesContextType
  addMediaFile: (file: MediaFile) => Promise<void>
  addEffect: (effect: VideoEffect) => Promise<void>
  addFilter: (filter: VideoFilter) => Promise<void>
  addResource: (resourceType: string, resource: any) => Promise<void>
  removeResource: (resourceId: string, type: string) => Promise<void>
  updateResource: (resourceId: string, params: Record<string, any>) => Promise<void>
  getResourceStats: () => {
    totalMedia: number
    totalEffects: number
    totalFilters: number
    totalSize: number
    totalDuration: number
  }
}

/**
 * Параметры для анализа ресурсов
 */
export interface AnalyzeResourcesParams {
  resourceType: "all" | "media" | "music" | "effect" | "filter" | "transition" | "template" | "styleTemplate"
  includeStats?: boolean
  filter?: {
    addedAfter?: string
    addedBy?: string
  }
}

/**
 * Параметры для добавления ресурса
 */
export interface AddResourceParams {
  resourceType: "media" | "music" | "effect" | "filter" | "transition" | "template" | "styleTemplate"
  resourceId: string
  reason: string
  autoApply?: boolean
}

/**
 * Параметры для массового добавления ресурсов
 */
export interface BulkAddResourcesParams {
  criteria: {
    resourceType: "media" | "music" | "effect" | "filter" | "transition" | "template" | "styleTemplate"
    selectionMethod: "all" | "filtered" | "recent" | "favorites" | "smart"
    filters?: {
      searchQuery?: string
      dateRange?: {
        start: string
        end: string
      }
      fileTypes?: Array<"video" | "audio" | "image">
      minDuration?: number
      maxDuration?: number
      tags?: string[]
    }
    maxCount?: number
  }
  reason: string
}

/**
 * Параметры для удаления ресурса
 */
export interface RemoveResourceParams {
  resourceId: string
  reason: string
  removeFromTimeline?: boolean
}

/**
 * Параметры для предложения дополнительных ресурсов
 */
export interface SuggestResourcesParams {
  baseContent?: Array<{
    resourceId: string
    resourceType: string
  }>
  projectType:
    | "wedding"
    | "travel"
    | "corporate"
    | "social"
    | "documentary"
    | "education"
    | "music-video"
    | "commercial"
  mood: "energetic" | "calm" | "dramatic" | "romantic" | "professional" | "playful" | "serious" | "uplifting"
  targetDuration?: number
  includeAutoAdd?: boolean
}

/**
 * Параметры для обновления ресурса
 */
export interface UpdateResourceParams {
  resourceId: string
  newParameters: Record<string, any>
  reason: string
}

/**
 * Параметры для анализа совместимости
 */
export interface CompatibilityParams {
  resourceIds: string[]
  checkAgainst?: "project-settings" | "other-resources" | "timeline-structure" | "all"
  includeRecommendations?: boolean
}

/**
 * Параметры для статистики использования
 */
export interface UsageStatsParams {
  timeRange?: {
    start: string
    end: string
  }
  groupBy?: "type" | "date" | "source" | "usage-frequency"
  includeUnused?: boolean
}

/**
 * Параметры для очистки ресурсов
 */
export interface CleanupParams {
  dryRun?: boolean
  criteria?: {
    unusedForDays?: number
    resourceTypes?: string[]
    excludeFavorites?: boolean
  }
  reason: string
}

/**
 * Параметры для экспорта списка ресурсов
 */
export interface ExportListParams {
  format: "json" | "csv" | "text" | "markdown"
  includeMetadata?: boolean
  filterCriteria?: {
    resourceTypes?: string[]
    usedOnly?: boolean
    addedAfter?: string
  }
}
