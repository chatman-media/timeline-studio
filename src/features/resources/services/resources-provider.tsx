/**
 * Resources Provider V2
 *
 * Новая версия с интеграцией backend state management
 */

import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from "react"

import { useAppSettings } from "@/features/app-state/hooks/use-app-settings"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { FfprobeData } from "@/features/media/types/ffprobe"
import { type MediaFile, MediaType } from "@/features/media/types/media"
import type { StyleTemplate } from "@/features/style-templates/types"
import type { SubtitleStyleTemplate } from "@/features/subtitles/types"
import type { MediaTemplate } from "@/features/templates/lib/templates"
import type { Transition } from "@/features/transitions/types/transitions"
import { logError, logInfo } from "@/lib/tauri-logger"
import type { MediaItem } from "@/types/generated/tauri-bindings"

import {
  type EffectResource,
  type FilterResource,
  type MediaResource,
  type MusicResource,
  type StyleTemplateResource,
  type SubtitleResource,
  type TemplateResource,
  type TimelineResource,
  type TransitionResource,
} from "../types"

interface ResourcesContextType {
  // Ресурсы (синхронизированы с backend через project state)
  resources: TimelineResource[]
  mediaResources: MediaResource[]
  musicResources: MusicResource[]
  subtitleResources: SubtitleResource[]
  effectResources: EffectResource[]
  filterResources: FilterResource[]
  transitionResources: TransitionResource[]
  templateResources: TemplateResource[]
  styleTemplateResources: StyleTemplateResource[]

  // Состояние загрузки
  isLoading: boolean
  error: string | null

  // Действия для добавления ресурсов (backend команды)
  addMedia: (file: MediaFile) => Promise<void>
  addMusic: (file: MediaFile) => Promise<void>
  addSubtitle: (style: SubtitleStyleTemplate) => Promise<void>
  addEffect: (effect: VideoEffect) => Promise<void>
  addFilter: (filter: VideoFilter) => Promise<void>
  addTransition: (transition: Transition) => Promise<void>
  addTemplate: (template: MediaTemplate) => Promise<void>
  addStyleTemplate: (template: StyleTemplate) => Promise<void>

  // Действия для удаления/обновления
  removeResource: (resourceId: string, resourceType?: string) => Promise<void>
  updateResource: (resourceId: string, params: Record<string, any>) => Promise<void>
  clearResources: () => Promise<void>

  // Утилиты
  getResourceById: (resourceId: string) => TimelineResource | undefined
  getResourcesByType: (type: string) => TimelineResource[]
  isMusicAdded: (file: MediaFile) => boolean
  isSubtitleAdded: (style: SubtitleStyleTemplate) => boolean
  isTemplateAdded: (template: MediaTemplate) => boolean
  isEffectAdded: (effect: VideoEffect) => boolean
  isFilterAdded: (filter: VideoFilter) => boolean
  isTransitionAdded: (transition: Transition) => boolean
  isStyleTemplateAdded: (template: StyleTemplate) => boolean
  isAdded: (resourceId: string, type: string) => boolean
}

const ResourcesContext = createContext<ResourcesContextType | undefined>(undefined)

interface ResourcesProviderProps {
  children: ReactNode
}

export function ResourcesProvider({ children }: ResourcesProviderProps) {
  const [backendSync] = useState(() => getBackendSync())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Кэш метаданных медиа файлов (path -> probeData)
  // Сохраняем метаданные чтобы не терять их при обновлении из backend
  const metadataCacheRef = useRef<Map<string, FfprobeData>>(new Map())

  // Используем projectState из appMachine вместо прямой подписки на backendSync
  const { projectState } = useAppSettings()
  const backendState = projectState

  logInfo("ResourcesProvider: Initialized with projectState", {
    projectId: backendState?.project?.id || "no-project",
  })

  // Функция для выполнения backend команд
  const executeCommand = useCallback(
    async (command: any) => {
      logInfo("ResourcesProvider: Executing command", { commandType: command.type })
      try {
        setIsLoading(true)
        setError(null)

        const result = await backendSync.executeCommand(command)
        if (!result.success) {
          throw new Error(result.error || "Command failed")
        }

        logInfo("ResourcesProvider: Command executed successfully", { commandType: command.type })
        return result.data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(errorMessage)
        logError("ResourcesProvider: Command execution failed", {
          commandType: command.type,
          error: errorMessage,
        })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [backendSync],
  )

  // Действия для добавления ресурсов
  const addMedia = useCallback(
    async (file: MediaFile) => {
      logInfo("ResourcesProvider: Adding media file", {
        name: file.name,
        path: file.path,
        duration: file.duration,
      })

      // Сохраняем метаданные в кэш перед добавлением в backend
      if (file.probeData && file.probeData.streams && file.probeData.streams.length > 0) {
        metadataCacheRef.current.set(file.path, file.probeData)
        logInfo("ResourcesProvider: Cached metadata", {
          path: file.path,
          streamsCount: file.probeData.streams.length,
        })
      }

      // ДЕДУПЛИКАЦИЯ: Проверяем существование медиа по path перед добавлением
      const mediaPool = backendState?.project?.media_pool
      if (mediaPool?.items) {
        const alreadyExists = Object.values(mediaPool.items).some((item) => {
          if (!item || typeof item !== "object") return false
          const mediaItem = item as MediaItem
          return "path" in mediaItem && mediaItem.path === file.path
        })
        if (alreadyExists) {
          logInfo("ResourcesProvider: Media already exists, skipping", { path: file.path })
          return
        }
      }

      // Добавляем медиа через backend команду
      try {
        await executeCommand({
          type: "AddMedia",
          params: {
            path: file.path,
            media_type: file.type,
          },
        })
        logInfo("ResourcesProvider: Media added successfully", { path: file.path })
      } catch (error) {
        logError("ResourcesProvider: Failed to add media", {
          path: file.path,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    [backendState, executeCommand],
  )

  const addMusic = useCallback(
    async (file: MediaFile) => {
      logInfo("ResourcesProvider: Adding music file", {
        name: file.name,
        path: file.path,
        duration: file.duration,
      })

      // Сохраняем метаданные в кэш перед добавлением в backend
      if (file.probeData && file.probeData.streams && file.probeData.streams.length > 0) {
        metadataCacheRef.current.set(file.path, file.probeData)
        logInfo("ResourcesProvider: Cached metadata for music", {
          path: file.path,
          streamsCount: file.probeData.streams.length,
        })
      }

      // ДЕДУПЛИКАЦИЯ: Проверяем существование музыки по path перед добавлением
      const mediaPool = backendState?.project?.media_pool
      if (mediaPool?.items) {
        const alreadyExists = Object.values(mediaPool.items).some((item) => {
          if (!item || typeof item !== "object") return false
          const mediaItem = item as MediaItem
          return "path" in mediaItem && mediaItem.path === file.path
        })
        if (alreadyExists) {
          logInfo("ResourcesProvider: Music already exists, skipping", { path: file.path })
          return
        }
      }

      // Добавляем музыку через backend команду (используем MediaType.Audio)
      try {
        await executeCommand({
          type: "AddMedia",
          params: {
            path: file.path,
            media_type: MediaType.Audio,
          },
        })
        logInfo("ResourcesProvider: Music added successfully", { path: file.path })
      } catch (error) {
        logError("ResourcesProvider: Failed to add music", {
          path: file.path,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    [backendState, executeCommand],
  )

  const addSubtitle = useCallback(
    async (style: SubtitleStyleTemplate) => {
      logInfo("ResourcesProvider: Adding subtitle resource", { styleId: style.id })
      try {
        await executeCommand({
          type: "SaveResource",
          params: {
            resource_id: style.id,
            resource_type: "subtitle",
            data: style,
            metadata: {},
          },
        })
        logInfo("ResourcesProvider: Subtitle resource added successfully", { styleId: style.id })
      } catch (error) {
        logError("ResourcesProvider: Failed to add subtitle", {
          styleId: style.id,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    [executeCommand],
  )

  const addEffect = useCallback(
    async (effect: VideoEffect) => {
      logInfo("ResourcesProvider: Adding effect resource", {
        effectId: effect.id,
        name: effect.name,
      })
      try {
        await executeCommand({
          type: "SaveResource",
          params: {
            resource_id: effect.id,
            resource_type: "effect",
            data: effect,
            metadata: {},
          },
        })
        logInfo("ResourcesProvider: Effect resource added successfully", { effectId: effect.id })
      } catch (error) {
        logError("ResourcesProvider: Failed to add effect", {
          effectId: effect.id,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    [executeCommand],
  )

  const addFilter = useCallback(
    async (filter: VideoFilter) => {
      logInfo("ResourcesProvider: Adding filter resource", {
        filterId: filter.id,
        name: filter.name,
      })
      try {
        await executeCommand({
          type: "SaveResource",
          params: {
            resource_id: filter.id,
            resource_type: "filter",
            data: filter,
            metadata: {},
          },
        })
        logInfo("ResourcesProvider: Filter resource added successfully", { filterId: filter.id })
      } catch (error) {
        logError("ResourcesProvider: Failed to add filter", {
          filterId: filter.id,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    [executeCommand],
  )

  const addTransition = useCallback(
    async (transition: Transition) => {
      logInfo("ResourcesProvider: Adding transition resource", {
        transitionId: transition.id,
        label: transition.labels?.ru || transition.labels?.en,
      })
      try {
        await executeCommand({
          type: "SaveResource",
          params: {
            resource_id: transition.id,
            resource_type: "transition",
            data: transition,
            metadata: {},
          },
        })
        logInfo("ResourcesProvider: Transition resource added successfully", { transitionId: transition.id })
      } catch (error) {
        logError("ResourcesProvider: Failed to add transition", {
          transitionId: transition.id,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    [executeCommand],
  )

  const addTemplate = useCallback(
    async (template: MediaTemplate) => {
      logInfo("ResourcesProvider: Adding template resource", {
        templateId: template.id,
      })
      try {
        await executeCommand({
          type: "SaveResource",
          params: {
            resource_id: template.id,
            resource_type: "template",
            data: template,
            metadata: {},
          },
        })
        logInfo("ResourcesProvider: Template resource added successfully", { templateId: template.id })
      } catch (error) {
        logError("ResourcesProvider: Failed to add template", {
          templateId: template.id,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    [executeCommand],
  )

  const addStyleTemplate = useCallback(
    async (template: StyleTemplate) => {
      const templateName = typeof template.name === "string" ? template.name : template.name?.ru || template.name?.en
      logInfo("ResourcesProvider: Adding style template resource", {
        templateId: template.id,
        name: templateName,
      })
      try {
        await executeCommand({
          type: "SaveResource",
          params: {
            resource_id: template.id,
            resource_type: "styleTemplate",
            data: template,
            metadata: {},
          },
        })
        logInfo("ResourcesProvider: Style template resource added successfully", { templateId: template.id })
      } catch (error) {
        logError("ResourcesProvider: Failed to add style template", {
          templateId: template.id,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    [executeCommand],
  )

  const removeResource = useCallback(
    async (resourceId: string, resourceType: string = "media") => {
      logInfo("ResourcesProvider: Removing resource", {
        resourceId,
        resourceType,
      })
      try {
        if (resourceType === "media") {
          await executeCommand({
            type: "RemoveMedia",
            params: { mediaId: resourceId },
          })
        } else {
          await executeCommand({
            type: "DeleteResource",
            params: {
              resource_id: resourceId,
              resource_type: resourceType,
            },
          })
        }
        logInfo("ResourcesProvider: Resource removed successfully", { resourceId })
      } catch (error) {
        logError("ResourcesProvider: Failed to remove resource", {
          resourceId,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    [executeCommand],
  )

  const updateResource = useCallback(
    async (resourceId: string, params: Record<string, any>) => {
      logInfo("ResourcesProvider: Updating resource", {
        resourceId,
        paramsKeys: Object.keys(params),
      })
      try {
        await executeCommand({
          type: "UpdateMedia",
          params: { mediaId: resourceId, updates: params },
        })
        logInfo("ResourcesProvider: Resource updated successfully", { resourceId })
      } catch (error) {
        logError("ResourcesProvider: Failed to update resource", {
          resourceId,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    [executeCommand],
  )

  const clearResources = useCallback(async () => {
    logInfo("ResourcesProvider: Clearing all resources")
    try {
      const resourceTypes = ["effect", "filter", "transition", "template", "styleTemplate", "subtitle"]
      for (const resourceType of resourceTypes) {
        logInfo("ResourcesProvider: Loading resources for type", { resourceType })
        await executeCommand({
          type: "LoadResources",
          params: {
            resource_type: resourceType,
            source: "local",
            category: null,
          },
        })
      }
      logInfo("ResourcesProvider: All resources cleared successfully")
    } catch (error) {
      logError("ResourcesProvider: Failed to clear resources", {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }, [executeCommand])

  // Извлекаем ресурсы из backend состояния
  // Пока backend не содержит все типы ресурсов, создаем пустые массивы
  const mediaPool = backendState?.project?.media_pool ?? null
  if (!mediaPool) {
    // Если пусто — логируем предупреждение и используем пустые наборы при дальнейшем преобразовании
    logInfo("ResourcesProvider: MediaPool from backend is empty, using empty defaults")
  } else {
    const itemCount = Object.values(mediaPool.items || {}).length
    logInfo("ResourcesProvider: MediaPool loaded from backend", { itemCount })
  }

  // Конвертируем медиа из backend в MediaResource формат
  const mediaResources: MediaResource[] = mediaPool?.items
    ? Object.values(mediaPool.items)
        .filter((item): item is MediaItem => {
          if (!item || typeof item !== "object") return false
          const mediaItem = item as MediaItem
          const mediaType = String(mediaItem.media_type)
          return "media_type" in mediaItem && (mediaType === "Video" || mediaType === "Image")
        })
        .map((item) => {
          // Проверяем кэш метаданных для этого файла
          const cachedProbeData = metadataCacheRef.current.get(item.path)
          const mediaType = String(item.media_type)

          const file: MediaFile = {
            id: item.id,
            name: item.name,
            path: item.path,
            type: mediaType === "Video" ? MediaType.Video : MediaType.StillImage,
            size: 0, // Backend не предоставляет размер файла
            isVideo: mediaType === "Video",
            isAudio: false,
            isImage: mediaType === "Image",
            isLoadingMetadata: false,
            // Используем метаданные из кэша если они есть, иначе пустые
            probeData: cachedProbeData || { streams: [], format: {} },
            duration: item.duration || 0,
          }

          // Логируем для отладки
          if (cachedProbeData) {
            logInfo("ResourcesProvider: Restored cached metadata", {
              path: item.path,
              streamsCount: cachedProbeData.streams?.length || 0,
            })
          }

          // Создаем MediaResource напрямую, используя backend ID
          return {
            id: item.id, // Используем ID от backend напрямую
            type: "media" as const,
            name: item.name,
            resourceId: item.id, // resourceId совпадает с id
            addedAt: Date.now(),
            file,
            params: {},
          }
        })
    : []

  const musicResources: MusicResource[] = mediaPool?.items
    ? Object.values(mediaPool.items)
        .filter((item): item is MediaItem => {
          if (!item || typeof item !== "object") return false
          const mediaItem = item as MediaItem
          const mediaType = String(mediaItem.media_type)
          return "media_type" in mediaItem && mediaType === "Audio"
        })
        .map((item) => {
          // Проверяем кэш метаданных для этого файла
          const cachedProbeData = metadataCacheRef.current.get(item.path)

          const file: MediaFile = {
            id: item.id,
            name: item.name,
            path: item.path,
            type: MediaType.Audio,
            size: 0, // Backend не предоставляет размер файла
            isVideo: false,
            isAudio: true,
            isImage: false,
            isLoadingMetadata: false,
            // Используем метаданные из кэша если они есть, иначе пустые
            probeData: cachedProbeData || { streams: [], format: {} },
            duration: item.duration || 0,
          }

          // Логируем для отладки
          if (cachedProbeData) {
            logInfo("ResourcesProvider: Restored cached metadata for music", {
              path: item.path,
              streamsCount: cachedProbeData.streams?.length || 0,
            })
          }

          // Создаем MusicResource напрямую, используя backend ID
          return {
            id: item.id, // Используем ID от backend напрямую
            type: "music" as const,
            name: item.name,
            resourceId: item.id, // resourceId совпадает с id
            addedAt: Date.now(),
            file,
            params: {},
          }
        })
    : []

  // Остальные ресурсы пока пустые (будут добавлены позже)
  const subtitleResources: SubtitleResource[] = []
  const effectResources: EffectResource[] = []
  const filterResources: FilterResource[] = []
  const transitionResources: TransitionResource[] = []
  const templateResources: TemplateResource[] = []
  const styleTemplateResources: StyleTemplateResource[] = []

  const resources: TimelineResource[] = [
    ...mediaResources,
    ...musicResources,
    ...subtitleResources,
    ...effectResources,
    ...filterResources,
    ...transitionResources,
    ...templateResources,
    ...styleTemplateResources,
  ]

  // Утилиты - определяем ПОСЛЕ всех массивов ресурсов
  const getResourceById = useCallback(
    (resourceId: string) => {
      const allResources = [
        ...mediaResources,
        ...musicResources,
        ...subtitleResources,
        ...effectResources,
        ...filterResources,
        ...transitionResources,
        ...templateResources,
        ...styleTemplateResources,
      ]
      return allResources.find((resource) => resource.resourceId === resourceId)
    },
    [
      mediaResources,
      musicResources,
      subtitleResources,
      effectResources,
      filterResources,
      transitionResources,
      templateResources,
      styleTemplateResources,
    ],
  )

  const getResourcesByType = useCallback(
    (type: string) => {
      switch (type) {
        case "media":
          return mediaResources
        case "music":
          return musicResources
        case "subtitle":
          return subtitleResources
        case "effect":
          return effectResources
        case "filter":
          return filterResources
        case "transition":
          return transitionResources
        case "template":
          return templateResources
        case "styleTemplate":
          return styleTemplateResources
        default:
          return []
      }
    },
    [
      mediaResources,
      musicResources,
      subtitleResources,
      effectResources,
      filterResources,
      transitionResources,
      templateResources,
      styleTemplateResources,
    ],
  )

  // Контекстное значение
  const contextValue: ResourcesContextType = {
    // Ресурсы
    resources,
    mediaResources,
    musicResources,
    subtitleResources,
    effectResources,
    filterResources,
    transitionResources,
    templateResources,
    styleTemplateResources,

    // Состояние
    isLoading,
    error,

    // Действия
    addMedia,
    addMusic,
    addSubtitle,
    addEffect,
    addFilter,
    addTransition,
    addTemplate,
    addStyleTemplate,
    removeResource,
    updateResource,
    clearResources,

    // Утилиты
    getResourceById,
    getResourcesByType,
    isMusicAdded: (file: MediaFile) => {
      return musicResources.some((resource) => (resource as any).data?.path === file.path)
    },
    isSubtitleAdded: (style: SubtitleStyleTemplate) => {
      return subtitleResources.some((resource) => (resource as any).data?.id === style.id)
    },
    isTemplateAdded: (template: MediaTemplate) => {
      return templateResources.some((resource) => (resource as any).data?.id === template.id)
    },
    isEffectAdded: (effect: VideoEffect) => {
      return effectResources.some((resource) => (resource as any).data?.id === effect.id)
    },
    isFilterAdded: (filter: VideoFilter) => {
      return filterResources.some((resource) => (resource as any).data?.id === filter.id)
    },
    isTransitionAdded: (transition: Transition) => {
      return transitionResources.some((resource) => (resource as any).data?.id === transition.id)
    },
    isStyleTemplateAdded: (template: StyleTemplate) => {
      return styleTemplateResources.some((resource) => (resource as any).data?.id === template.id)
    },
    isAdded: (resourceId: string, type: string) => {
      const resources = getResourcesByType(type)
      // Для медиа и музыки проверяем также по path
      if (type === "media" || type === "music") {
        const mediaRes = resources as (MediaResource | MusicResource)[]
        return mediaRes.some(
          (resource) =>
            resource.id === resourceId ||
            resource.resourceId === resourceId ||
            resource.file.path === resourceId || // Проверка по path
            resource.file.id === resourceId, // Проверка по ID файла
        )
      }
      return resources.some((resource) => resource.id === resourceId || resource.resourceId === resourceId)
    },
  }

  return <ResourcesContext.Provider value={contextValue}>{children}</ResourcesContext.Provider>
}

export function useResources(): ResourcesContextType {
  const context = useContext(ResourcesContext)

  if (!context) {
    throw new Error("useResources must be used within ResourcesProviderV2")
  }

  return context
}

// Экспорт типов
export type { ResourcesContextType }
