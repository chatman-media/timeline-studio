/**
 * Resources Provider V2
 *
 * Новая версия с интеграцией backend state management
 */

import { container } from "@timeline-studio/core/container"
import { useApp } from "@timeline-studio/core/hooks/use-app"
import type {
  FfprobeData,
  MediaFile,
  MediaTemplate,
  StyleTemplate,
  SubtitleStyleTemplate,
  Transition,
  BaseEffect as VideoEffect,
  VideoFilter,
} from "@timeline-studio/core/types"
import { MediaType as LocalMediaType } from "@timeline-studio/core/types"
// Backend event handlers removed - simplified architecture
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
} from "@timeline-studio/core/types/resources"
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react"
import { logError, logInfo } from "@/lib/tauri-logger"
import type { MediaItem, MediaType, ProjectEvent } from "@/types/generated/tauri-bindings"

// Tauri MediaType is simplified: "Video" | "Audio" | "Image"
// We use a type alias to distinguish from our canonical MediaType enum
type TauriMediaType = MediaType

/**
 * Convert local MediaType enum to Rust MediaType
 */
function convertToRustMediaType(localType: LocalMediaType | undefined): TauriMediaType {
  if (!localType) return "Video"

  switch (localType) {
    case LocalMediaType.Video:
    case LocalMediaType.VideoWithAudio:
      return "Video"
    case LocalMediaType.Audio:
    case LocalMediaType.Music:
    case LocalMediaType.Voiceover:
    case LocalMediaType.SFX:
    case LocalMediaType.Ambient:
      return "Audio"
    case LocalMediaType.StillImage:
    case LocalMediaType.ImageSequence:
      return "Image"
    default:
      return "Video"
  }
}

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
  isAdded: (resourceId: string, type: string, filePath?: string) => boolean
}

const ResourcesContext = createContext<ResourcesContextType | undefined>(undefined)

interface ResourcesProviderProps {
  children: ReactNode
}

export function ResourcesProvider({ children }: ResourcesProviderProps) {
  const [backendSync] = useState(() => container.getBackend())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Кэш метаданных медиа файлов (path -> probeData)
  // Сохраняем метаданные чтобы не терять их при обновлении из backend
  const metadataCacheRef = useRef<Map<string, FfprobeData>>(new Map())

  // Используем projectState из appMachine вместо прямой подписки на backendSync
  const { projectState } = useApp()
  const backendState = projectState

  // State для инкрементальных обновлений через события
  const [resourcesState, setResourcesState] = useState<{
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
  }>({
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
  })

  logInfo("ResourcesProvider: Initialized with projectState", {
    projectId: backendState?.project?.id || "no-project",
  })

  // Функция для выполнения backend команд
  const executeCommand = useCallback(
    async (command: any) => {
      logInfo("ResourcesProvider: Executing command", {
        commandType: command.type,
      })
      try {
        setIsLoading(true)
        setError(null)

        const result = await backendSync.executeCommand(command)
        if (!result.success) {
          throw new Error(result.error || "Command failed")
        }

        logInfo("ResourcesProvider: Command executed successfully", {
          commandType: command.type,
        })
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

  // Subscribe to backend events for incremental updates
  useEffect(() => {
    const handleEvent = (event: ProjectEvent) => {
      // Список событий для Resources
      const resourceEventTypes = [
        "MediaAdded",
        "MediaRemoved",
        "MediaUpdated",
        "EffectAdded",
        "EffectRemoved",
        "FilterAdded",
        "FilterRemoved",
        "TransitionAdded",
        "TransitionRemoved",
        "TemplateAdded",
        "TemplateRemoved",
        "StyleTemplateAdded",
        "StyleTemplateRemoved",
        "SubtitleAdded",
        "SubtitleRemoved",
      ]

      if (resourceEventTypes.includes(event.type)) {
        logInfo("ResourcesProvider: Backend event detected, applying incremental update", {
          eventType: event.type,
        })

        // Simplified: just trigger re-sync from backend state
        // (instead of complex incremental updates)
        logInfo("ResourcesProvider: Event detected, will use backend state on next render")
      }
    }

    // Subscribe to backend events
    const unsubscribe = backendSync.onEvent(handleEvent)

    return () => {
      unsubscribe()
    }
  }, [backendSync])

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
          // Файл уже существует в media_pool - просто помечаем его как ресурс
          logInfo("ResourcesProvider: Media already exists, marking as resource", {
            path: file.path,
          })

          // Находим существующий медиафайл и получаем его ID
          const existingMedia = Object.values(mediaPool.items).find((item) => {
            if (!item || typeof item !== "object") return false
            const media = item as MediaItem
            return "path" in media && media.path === file.path
          }) as MediaItem | undefined

          if (existingMedia?.id) {
            await executeCommand({
              type: "SetMediaAsResource",
              params: {
                media_id: existingMedia.id,
                is_resource: true,
              },
            })
            logInfo("ResourcesProvider: Existing media marked as resource", {
              path: file.path,
              mediaId: existingMedia.id,
              frontendId: file.id,
            })
          }
          return
        }
      }

      // Добавляем медиа через backend команду
      try {
        // Convert local MediaType to Rust MediaType
        const mediaType = convertToRustMediaType(file.type)
        logInfo("ResourcesProvider: Converting media type before AddMedia", {
          path: file.path,
          localType: file.type,
          rustType: mediaType,
          isVideo: file.isVideo,
          isImage: file.isImage,
          isAudio: file.isAudio,
        })
        const result = await executeCommand({
          type: "AddMedia",
          params: {
            path: file.path,
            media_type: mediaType,
          },
        })

        // Получаем media_id из результата и помечаем как ресурс
        const resultObj = result as { media_id?: string; id?: string } | null
        const mediaId = resultObj?.media_id || resultObj?.id
        if (mediaId) {
          await executeCommand({
            type: "SetMediaAsResource",
            params: {
              media_id: mediaId,
              is_resource: true,
            },
          })
          logInfo("ResourcesProvider: Media marked as resource", {
            path: file.path,
            mediaId,
            frontendId: file.id, // Для сравнения frontend ID vs backend ID
          })
        }

        logInfo("ResourcesProvider: Media added successfully", {
          path: file.path,
          localType: file.type,
          rustType: mediaType,
        })
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
          logInfo("ResourcesProvider: Music already exists, skipping", {
            path: file.path,
          })
          return
        }
      }

      // Добавляем музыку через backend команду (используем Rust MediaType "Audio")
      try {
        const result = await executeCommand({
          type: "AddMedia",
          params: {
            path: file.path,
            media_type: "Audio" as TauriMediaType, // Rust expects "Audio" (PascalCase)
          },
        })

        // Получаем media_id из результата и помечаем как ресурс
        const resultObj = result as { media_id?: string; id?: string } | null
        const mediaId = resultObj?.media_id || resultObj?.id
        if (mediaId) {
          await executeCommand({
            type: "SetMediaAsResource",
            params: {
              media_id: mediaId,
              is_resource: true,
            },
          })
          logInfo("ResourcesProvider: Music marked as resource", {
            path: file.path,
            mediaId,
          })
        }

        logInfo("ResourcesProvider: Music added successfully", {
          path: file.path,
        })
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
      logInfo("ResourcesProvider: Adding subtitle resource", {
        styleId: style.id,
      })
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
        logInfo("ResourcesProvider: Subtitle resource added successfully", {
          styleId: style.id,
        })
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
        logInfo("ResourcesProvider: Effect resource added successfully", {
          effectId: effect.id,
        })
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
        logInfo("ResourcesProvider: Filter resource added successfully", {
          filterId: filter.id,
        })
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
        logInfo("ResourcesProvider: Transition resource added successfully", {
          transitionId: transition.id,
        })
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
        logInfo("ResourcesProvider: Template resource added successfully", {
          templateId: template.id,
        })
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
        if (resourceType === "media" || resourceType === "music") {
          await executeCommand({
            type: "RemoveMedia",
            params: { media_id: resourceId },
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
        logInfo("ResourcesProvider: Resource removed successfully", {
          resourceId,
        })
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
          params: { media_id: resourceId, updates: params },
        })
        logInfo("ResourcesProvider: Resource updated successfully", {
          resourceId,
        })
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
        logInfo("ResourcesProvider: Loading resources for type", {
          resourceType,
        })
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

  // Синхронизация с backend state при инициализации проекта
  useEffect(() => {
    if (!backendState?.project) {
      // Нет проекта - очищаем state
      setResourcesState({
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
      })
      return
    }

    // Инициализируем из backend state
    logInfo("ResourcesProvider: Initializing from backend state", {
      projectId: backendState.project.id,
    })

    const mediaPool = backendState.project.media_pool ?? null

    if (!mediaPool) {
      logInfo("ResourcesProvider: MediaPool from backend is empty, using empty defaults")
    } else {
      const itemCount = Object.values(mediaPool.items || {}).length
      const resourceCount = Object.values(mediaPool.items || {}).filter(
        (item) => item && typeof item === "object" && (item as MediaItem).is_resource === true,
      ).length
      logInfo("ResourcesProvider: MediaPool loaded from backend", {
        itemCount,
        resourceCount,
      })
    }

    // Конвертируем ТОЛЬКО медиа с is_resource=true в MediaResource формат
    // is_resource устанавливается когда пользователь явно добавляет файл через "+"
    const mediaResources: MediaResource[] = mediaPool?.items
      ? Object.values(mediaPool.items)
          .filter((item): item is MediaItem => {
            if (!item || typeof item !== "object") return false
            const mediaItem = item as MediaItem
            const mediaType = String(mediaItem.media_type)
            // Проверяем что это видео/изображение И is_resource = true
            return (
              "media_type" in mediaItem &&
              (mediaType === "Video" || mediaType === "Image") &&
              mediaItem.is_resource === true
            )
          })
          .map((item) => {
            // Проверяем кэш метаданных для этого файла
            const cachedProbeData = metadataCacheRef.current.get(item.path)
            const mediaType = String(item.media_type)

            // Log media type for debugging
            logInfo("ResourcesProvider: Converting media item", {
              id: item.id,
              name: item.name,
              mediaType,
              hasCache: !!cachedProbeData,
            })

            const file: MediaFile = {
              id: item.id,
              name: item.name,
              path: item.path,
              type: mediaType === "Video" ? LocalMediaType.Video : LocalMediaType.StillImage,
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

    // Конвертируем ТОЛЬКО музыку с is_resource=true в MusicResource формат
    const musicResources: MusicResource[] = mediaPool?.items
      ? Object.values(mediaPool.items)
          .filter((item): item is MediaItem => {
            if (!item || typeof item !== "object") return false
            const mediaItem = item as MediaItem
            const mediaType = String(mediaItem.media_type)
            // Проверяем что это аудио И is_resource = true
            return "media_type" in mediaItem && mediaType === "Audio" && mediaItem.is_resource === true
          })
          .map((item) => {
            // Проверяем кэш метаданных для этого файла
            const cachedProbeData = metadataCacheRef.current.get(item.path)

            const file: MediaFile = {
              id: item.id,
              name: item.name,
              path: item.path,
              type: LocalMediaType.Audio,
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

    // Extract resources from backend state
    const effectsPool = backendState?.project?.effects_pool ?? {}
    const effectResources: EffectResource[] = Object.values(effectsPool).map((item: any) => ({
      id: item.id,
      type: "effect" as const,
      name: item.name,
      resourceId: item.effect_id,
      addedAt: item.added_at * 1000, // Convert to milliseconds
      effect: {
        id: item.effect_id,
        name: item.name,
        parameters: item.parameters,
      } as any,
      params: item.parameters,
    }))

    const filtersPool = backendState?.project?.filters_pool ?? {}
    const filterResources: FilterResource[] = Object.values(filtersPool).map((item: any) => ({
      id: item.id,
      type: "filter" as const,
      name: item.name,
      resourceId: item.filter_id,
      addedAt: item.added_at * 1000,
      filter: {
        id: item.filter_id,
        name: item.name,
        params: item.parameters,
      } as any,
      params: item.parameters,
    }))

    const transitionsPool = backendState?.project?.transitions_pool ?? {}
    const transitionResources: TransitionResource[] = Object.values(transitionsPool).map((item: any) => ({
      id: item.id,
      type: "transition" as const,
      name: item.name,
      resourceId: item.transition_id,
      addedAt: item.added_at * 1000,
      transition: {
        id: item.transition_id,
        labels: { ru: item.name, en: item.name },
        parameters: item.parameters,
      } as any,
      params: item.parameters,
    }))

    const templatesPool = backendState?.project?.templates_pool ?? {}
    const templateResources: TemplateResource[] = Object.values(templatesPool).map((item: any) => ({
      id: item.id,
      type: "template" as const,
      name: item.name,
      resourceId: item.template_id,
      addedAt: item.added_at * 1000,
      template: item.data, // Store full template data
      params: {},
    }))

    const styleTemplatesPool = backendState?.project?.style_templates_pool ?? {}
    const styleTemplateResources: StyleTemplateResource[] = Object.values(styleTemplatesPool).map((item: any) => ({
      id: item.id,
      type: "styleTemplate" as const,
      name: item.name,
      resourceId: item.template_id,
      addedAt: item.added_at * 1000,
      template: item.data, // Store full template data
      params: {},
    }))

    const subtitlesPool = backendState.project.subtitles_pool ?? {}
    const subtitleResources: SubtitleResource[] = Object.values(subtitlesPool).map((item: any) => ({
      id: item.id,
      type: "subtitle" as const,
      name: item.name,
      resourceId: item.style_id,
      addedAt: item.added_at * 1000,
      style: item.data, // Store full subtitle style data
      params: {},
    }))

    // Устанавливаем все ресурсы в state
    setResourcesState({
      mediaResources,
      musicResources,
      effectResources,
      filterResources,
      transitionResources,
      templateResources,
      styleTemplateResources,
      subtitleResources,
      isLoading: false,
      error: null,
    })

    logInfo("ResourcesProvider: State initialized from backend", {
      mediaCount: mediaResources.length,
      musicCount: musicResources.length,
      effectsCount: effectResources.length,
      filtersCount: filterResources.length,
      transitionsCount: transitionResources.length,
      templatesCount: templateResources.length,
      styleTemplatesCount: styleTemplateResources.length,
      subtitlesCount: subtitleResources.length,
    })
  }, [backendState])

  // Извлекаем ресурсы из state для использования в контексте
  const resources: TimelineResource[] = [
    ...resourcesState.mediaResources,
    ...resourcesState.musicResources,
    ...resourcesState.subtitleResources,
    ...resourcesState.effectResources,
    ...resourcesState.filterResources,
    ...resourcesState.transitionResources,
    ...resourcesState.templateResources,
    ...resourcesState.styleTemplateResources,
  ]

  // Утилиты - определяем ПОСЛЕ всех массивов ресурсов
  const getResourceById = useCallback(
    (resourceId: string) => {
      return resources.find((resource) => resource.resourceId === resourceId)
    },
    [resources],
  )

  const getResourcesByType = useCallback(
    (type: string) => {
      switch (type) {
        case "media":
          return resourcesState.mediaResources
        case "music":
          return resourcesState.musicResources
        case "subtitle":
          return resourcesState.subtitleResources
        case "effect":
          return resourcesState.effectResources
        case "filter":
          return resourcesState.filterResources
        case "transition":
          return resourcesState.transitionResources
        case "template":
          return resourcesState.templateResources
        case "styleTemplate":
          return resourcesState.styleTemplateResources
        default:
          return []
      }
    },
    [resourcesState],
  )

  // Контекстное значение
  const contextValue: ResourcesContextType = {
    // Ресурсы
    resources,
    mediaResources: resourcesState.mediaResources,
    musicResources: resourcesState.musicResources,
    subtitleResources: resourcesState.subtitleResources,
    effectResources: resourcesState.effectResources,
    filterResources: resourcesState.filterResources,
    transitionResources: resourcesState.transitionResources,
    templateResources: resourcesState.templateResources,
    styleTemplateResources: resourcesState.styleTemplateResources,

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
      return resourcesState.musicResources.some((resource) => resource.file.path === file.path)
    },
    isSubtitleAdded: (style: SubtitleStyleTemplate) => {
      return resourcesState.subtitleResources.some((resource) => resource.style.id === style.id)
    },
    isTemplateAdded: (template: MediaTemplate) => {
      return resourcesState.templateResources.some((resource) => resource.template.id === template.id)
    },
    isEffectAdded: (effect: VideoEffect) => {
      return resourcesState.effectResources.some((resource) => resource.effect.id === effect.id)
    },
    isFilterAdded: (filter: VideoFilter) => {
      return resourcesState.filterResources.some((resource) => resource.filter.id === filter.id)
    },
    isTransitionAdded: (transition: Transition) => {
      return resourcesState.transitionResources.some((resource) => resource.transition.id === transition.id)
    },
    isStyleTemplateAdded: (template: StyleTemplate) => {
      return resourcesState.styleTemplateResources.some((resource) => resource.template.id === template.id)
    },
    isAdded: (resourceId: string, type: string, filePath?: string) => {
      // Для медиа и музыки проверяем флаг is_resource в backend state
      // is_resource = true означает что файл явно добавлен в ресурсы пользователем (через "+")
      if (type === "media" || type === "music") {
        const mediaPool = backendState?.project?.media_pool
        if (!mediaPool?.items) return false

        // Ищем медиа по filePath (приоритет) или по ID (fallback)
        const mediaItem = Object.values(mediaPool.items).find((item) => {
          if (!item || typeof item !== "object") return false
          const media = item as MediaItem

          // Приоритет: проверка по filePath (если передан)
          if (filePath && media.path === filePath) {
            return media.is_resource === true
          }

          // Fallback: проверка по ID (для обратной совместимости)
          return media.id === resourceId && media.is_resource === true
        }) as MediaItem | undefined

        return !!mediaItem
      }

      // Для других типов ресурсов (эффекты, фильтры и т.д.) проверяем по старой логике
      const resources = getResourcesByType(type)
      return resources.some((resource) => resource.id === resourceId || resource.resourceId === resourceId)
    },
  }

  return (
    <ResourcesContext.Provider value={contextValue} data-oid="4c7mbat">
      {children}
    </ResourcesContext.Provider>
  )
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
