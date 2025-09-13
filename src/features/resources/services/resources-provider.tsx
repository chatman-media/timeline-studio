/**
 * Resources Provider V2
 *
 * Новая версия с интеграцией backend state management
 */

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { MediaFile } from "@/features/media/types/media"
import type { StyleTemplate } from "@/features/style-templates/types"
import type { SubtitleStyleTemplate } from "@/features/subtitles/types"
import type { MediaTemplate } from "@/features/templates/lib/templates"
import type { Transition } from "@/features/transitions/types/transitions"
import type { ProjectState } from "@/types/generated/tauri-bindings"

import {
  createMediaResource,
  createMusicResource,
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
  removeResource: (resourceId: string) => Promise<void>
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

const ResourcesContextV2 = createContext<ResourcesContextType | undefined>(undefined)

interface ResourcesProviderV2Props {
  children: React.ReactNode
}

export function ResourcesProviderV2({ children }: ResourcesProviderV2Props) {
  const [backendSync] = useState(() => getBackendSync())
  const [backendState, setBackendState] = useState<ProjectState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Подписка и подключение к backend состоянию
  useEffect(() => {
    let mounted = true
    console.log("ResourcesProvider: Setting up backend state subscription and connecting")
    // Подписываемся на обновления состояния
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      console.log("ResourcesProvider: Backend state updated", state)
      if (mounted) {
        setBackendState(state)
        setError(null)
      }
    })

    // Попытка подключиться и получить начальное состояние
    void (async () => {
      try {
        await backendSync.connect()
        const initialState = await backendSync.getProjectState()
        if (initialState && mounted) {
          setBackendState(initialState)
        }
      } catch (e) {
        console.error("ResourcesProvider: Failed to connect to backendSync:", e)
        setError(e instanceof Error ? e.message : String(e))
      }
    })()

    return () => {
      mounted = false
      // отписываемся
      try {
        unsubscribe()
      } catch {
        // ignore
      }
      void backendSync.disconnect()
    }
  }, [backendSync])

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
      // Определяем тип медиа на основе свойств файла
      const mediaType = file.isVideo ? "Video" : file.isAudio ? "Audio" : "Image"
      const result = await executeCommand({
        type: "AddMedia",
        params: { path: file.path, media_type: mediaType },
      })
      console.log("ResourcesProvider: AddMedia result", result)
    },
    [executeCommand],
  )

  const addMusic = useCallback(
    async (file: MediaFile) => {
      await executeCommand({
        type: "AddMedia",
        params: { path: file.path, media_type: "Audio" },
      })
    },
    [executeCommand],
  )

  const addSubtitle = useCallback(async (_style: SubtitleStyleTemplate) => {
    // Для субтитров пока используем локальное хранение
    // Так как backend команды для них ещё нет
    console.warn("Subtitle resources not yet integrated with backend")
  }, [])

  const addEffect = useCallback(async (_effect: VideoEffect) => {
    // Эффекты пока остаются локальными
    console.warn("Effect resources not yet integrated with backend")
  }, [])

  const addFilter = useCallback(async (_filter: VideoFilter) => {
    // Фильтры пока остаются локальными
    console.warn("Filter resources not yet integrated with backend")
  }, [])

  const addTransition = useCallback(async (_transition: Transition) => {
    // Переходы пока остаются локальными
    console.warn("Transition resources not yet integrated with backend")
  }, [])

  const addTemplate = useCallback(async (_template: MediaTemplate) => {
    // Шаблоны пока остаются локальными
    console.warn("Template resources not yet integrated with backend")
  }, [])

  const addStyleTemplate = useCallback(async (_template: StyleTemplate) => {
    // Стилистические шаблоны пока остаются локальными
    console.warn("Style template resources not yet integrated with backend")
  }, [])

  const removeResource = useCallback(
    async (resourceId: string) => {
      await executeCommand({
        type: "RemoveMedia",
        params: { mediaId: resourceId },
      })
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
    // Нужна команда для очистки всех ресурсов
    console.warn("Clear resources command not yet implemented in backend")
  }, [])

  // Утилиты
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
    [backendState],
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
    [backendState],
  )

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
        .map((item) =>
          createMediaResource({
            id: item.id,
            name: item.name,
            path: item.path,
            size: 0, // Backend не предоставляет размер файла
            isVideo: item.media_type === "Video",
            isAudio: false,
            isImage: item.media_type === "Image",
            isLoadingMetadata: false,
            probeData: { streams: [], format: {} },
            duration: item.duration || 0,
          }),
        )
    : []

  const musicResources: MusicResource[] = mediaPool?.items
    ? Object.values(mediaPool.items)
        .filter(
          (item): item is NonNullable<typeof item> =>
            item !== null && item !== undefined && item.media_type === "Audio",
        )
        .map((item) =>
          createMusicResource({
            id: item.id,
            name: item.name,
            path: item.path,
            size: 0, // Backend не предоставляет размер файла
            isVideo: false,
            isAudio: true,
            isImage: false,
            isLoadingMetadata: false,
            probeData: { streams: [], format: {} },
            duration: item.duration || 0,
          }),
        )
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
      return resources.some((resource) => resource.id === resourceId || resource.resourceId === resourceId)
    },
  }

  return <ResourcesContextV2.Provider value={contextValue}>{children}</ResourcesContextV2.Provider>
}

export function useResourcesV2(): ResourcesContextType {
  const context = useContext(ResourcesContextV2)

  if (!context) {
    throw new Error("useResourcesV2 must be used within ResourcesProviderV2")
  }

  return context
}

// Экспорт типов
export type { ResourcesContextType }

// Экспорт для обратной совместимости
export { ResourcesProviderV2 as ResourcesProvider }
export { useResourcesV2 as useResources }
