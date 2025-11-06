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
import type { MediaFile } from "@/features/media/types/media"
import type { FfprobeData } from "@/features/media/types/ffprobe"
import type { StyleTemplate } from "@/features/style-templates/types"
import type { SubtitleStyleTemplate } from "@/features/subtitles/types"
import type { MediaTemplate } from "@/features/templates/lib/templates"
import type { Transition } from "@/features/transitions/types/transitions"

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

  console.log("ResourcesProvider: Using projectState from appMachine", backendState)

  // Функция для выполнения backend команд
  const executeCommand = useCallback(
    async (command: any) => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await backendSync.executeCommand(command)
        if (!result.success) {
          throw new Error(result.error || "Command failed")
        }

        return result.data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(errorMessage)
        console.error("Resources command failed:", err)
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
      console.log("ResourcesProvider: Adding media", file.path)

      // Сохраняем метаданные в кэш перед добавлением в backend
      if (file.probeData && file.probeData.streams && file.probeData.streams.length > 0) {
        metadataCacheRef.current.set(file.path, file.probeData)
        console.log("ResourcesProvider: Cached metadata for", file.path, "streams:", file.probeData.streams.length)
      }

      // ДЕДУПЛИКАЦИЯ: Проверяем существование медиа по path перед добавлением
      const mediaPool = backendState?.project?.media_pool
      if (mediaPool?.items) {
        const alreadyExists = Object.values(mediaPool.items).some((item) => item && item.path === file.path)
        if (alreadyExists) {
          console.log("ResourcesProvider: Media already added, skipping:", file.path)
          return
        }
      }

      const mediaType = file.isVideo ? "Video" : file.isAudio ? "Audio" : "Image"
      const result = await executeCommand({
        type: "AddMedia",
        params: { path: file.path, media_type: mediaType },
      })
      console.log("ResourcesProvider: AddMedia result", result)
    },
    [executeCommand, backendState],
  )

  const addMusic = useCallback(
    async (file: MediaFile) => {
      // Сохраняем метаданные в кэш перед добавлением в backend
      if (file.probeData && file.probeData.streams && file.probeData.streams.length > 0) {
        metadataCacheRef.current.set(file.path, file.probeData)
        console.log("ResourcesProvider: Cached metadata for music", file.path, "streams:", file.probeData.streams.length)
      }

      // ДЕДУПЛИКАЦИЯ: Проверяем существование музыки по path перед добавлением
      const mediaPool = backendState?.project?.media_pool
      if (mediaPool?.items) {
        const alreadyExists = Object.values(mediaPool.items).some((item) => item && item.path === file.path)
        if (alreadyExists) {
          console.log("ResourcesProvider: Music already added, skipping:", file.path)
          return
        }
      }

      await executeCommand({
        type: "AddMedia",
        params: { path: file.path, media_type: "Audio" },
      })
    },
    [executeCommand, backendState],
  )

  const addSubtitle = useCallback(
    async (style: SubtitleStyleTemplate) => {
      await executeCommand({
        type: "SaveResource",
        params: {
          resource_id: style.id,
          resource_type: "subtitle",
          data: style,
          metadata: {},
        },
      })
    },
    [executeCommand],
  )

  const addEffect = useCallback(
    async (effect: VideoEffect) => {
      await executeCommand({
        type: "SaveResource",
        params: {
          resource_id: effect.id,
          resource_type: "effect",
          data: effect,
          metadata: {},
        },
      })
    },
    [executeCommand],
  )

  const addFilter = useCallback(
    async (filter: VideoFilter) => {
      await executeCommand({
        type: "SaveResource",
        params: {
          resource_id: filter.id,
          resource_type: "filter",
          data: filter,
          metadata: {},
        },
      })
    },
    [executeCommand],
  )

  const addTransition = useCallback(
    async (transition: Transition) => {
      await executeCommand({
        type: "SaveResource",
        params: {
          resource_id: transition.id,
          resource_type: "transition",
          data: transition,
          metadata: {},
        },
      })
    },
    [executeCommand],
  )

  const addTemplate = useCallback(
    async (template: MediaTemplate) => {
      await executeCommand({
        type: "SaveResource",
        params: {
          resource_id: template.id,
          resource_type: "template",
          data: template,
          metadata: {},
        },
      })
    },
    [executeCommand],
  )

  const addStyleTemplate = useCallback(
    async (template: StyleTemplate) => {
      await executeCommand({
        type: "SaveResource",
        params: {
          resource_id: template.id,
          resource_type: "styleTemplate",
          data: template,
          metadata: {},
        },
      })
    },
    [executeCommand],
  )

  const removeResource = useCallback(
    async (resourceId: string, resourceType: string = "media") => {
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
    },
    [executeCommand],
  )

  const updateResource = useCallback(
    async (resourceId: string, params: Record<string, any>) => {
      await executeCommand({
        type: "UpdateMedia",
        params: { mediaId: resourceId, updates: params },
      })
    },
    [executeCommand],
  )

  const clearResources = useCallback(async () => {
    const resourceTypes = ["effect", "filter", "transition", "template", "styleTemplate", "subtitle"]
    for (const resourceType of resourceTypes) {
      await executeCommand({
        type: "LoadResources",
        params: {
          resource_type: resourceType,
          source: "local",
          category: null,
        },
      })
    }
  }, [executeCommand])

  // Извлекаем ресурсы из backend состояния
  // Пока backend не содержит все типы ресурсов, создаем пустые массивы
  const mediaPool = backendState?.project?.media_pool ?? null
  if (!mediaPool) {
    // Если пусто — логируем предупреждение и используем пустые наборы при дальнейшем преобразовании
    console.warn("ResourcesProvider: MediaPool from backend is undefined or empty; using empty defaults")
  } else {
    console.log("ResourcesProvider: MediaPool from backend", mediaPool)
  }

  // Конвертируем медиа из backend в MediaResource формат
  const mediaResources: MediaResource[] = mediaPool?.items
    ? Object.values(mediaPool.items)
        .filter(
          (item): item is NonNullable<typeof item> =>
            item !== null && item !== undefined && (item.media_type === "Video" || item.media_type === "Image"),
        )
        .map((item) => {
          // Проверяем кэш метаданных для этого файла
          const cachedProbeData = metadataCacheRef.current.get(item.path)

          const file: MediaFile = {
            id: item.id,
            name: item.name,
            path: item.path,
            size: 0, // Backend не предоставляет размер файла
            isVideo: item.media_type === "Video",
            isAudio: false,
            isImage: item.media_type === "Image",
            isLoadingMetadata: false,
            // Используем метаданные из кэша если они есть, иначе пустые
            probeData: cachedProbeData || { streams: [], format: {} },
            duration: item.duration || 0,
          }

          // Логируем для отладки
          if (cachedProbeData) {
            console.log(
              "ResourcesProvider: Restored metadata from cache for",
              item.path,
              "streams:",
              cachedProbeData.streams?.length || 0,
            )
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
        .filter(
          (item): item is NonNullable<typeof item> =>
            item !== null && item !== undefined && item.media_type === "Audio",
        )
        .map((item) => {
          // Проверяем кэш метаданных для этого файла
          const cachedProbeData = metadataCacheRef.current.get(item.path)

          const file: MediaFile = {
            id: item.id,
            name: item.name,
            path: item.path,
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
            console.log(
              "ResourcesProvider: Restored metadata from cache for music",
              item.path,
              "streams:",
              cachedProbeData.streams?.length || 0,
            )
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
