import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { ResourceType } from "@/core/types"
import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { Transition } from "@/features/transitions/types/transitions"
import { createLogger } from "@/lib/tauri-logger"
import { useBrowserResourcesProvider } from "../providers/browser-resources-provider"
import type {
  LoadingState,
  Resource,
  ResourceSource,
  ResourceStats,
  SearchOptions,
} from "../types/browser-resources-provider"

const logger = createLogger("UseResources")

/**
 * Хук для получения всех эффектов
 */
export function useEffects(source?: ResourceSource) {
  const { api, isInitialized } = useBrowserResourcesProvider()
  const [effects, setEffects] = useState<VideoEffect[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateEffects = () => {
      const allEffects = api.getEffects(source)
      logger.info("[useEffects] Getting effects:", {
        source,
        isInitialized,
        effects: allEffects,
      })
      setEffects(allEffects)
      setLoading(false)
    }

    updateEffects()

    // Подписываемся на обновления
    const unsubscribe = api.onResourcesUpdate((type, _resources) => {
      if (type === "effect") {
        logger.info("[useEffects] Effects update event received")
        updateEffects()
      }
    })

    return unsubscribe
  }, [api, source, isInitialized])

  return { effects, loading }
}

/**
 * Хук для получения всех фильтров
 */
export function useFilters(source?: ResourceSource) {
  const { api } = useBrowserResourcesProvider()
  const [filters, setFilters] = useState<VideoFilter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateFilters = () => {
      setFilters(api.getFilters(source))
      setLoading(false)
    }

    updateFilters()

    // Подписываемся на обновления
    const unsubscribe = api.onResourcesUpdate((type, _resources) => {
      if (type === "filter") {
        updateFilters()
      }
    })

    return unsubscribe
  }, [api, source])

  return { filters, loading }
}

/**
 * Хук для получения всех переходов
 */
export function useTransitions(source?: ResourceSource) {
  const { api } = useBrowserResourcesProvider()
  const [transitions, setTransitions] = useState<Transition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateTransitions = () => {
      setTransitions(api.getTransitions(source))
      setLoading(false)
    }

    updateTransitions()

    // Подписываемся на обновления
    const unsubscribe = api.onResourcesUpdate((type, _resources) => {
      if (type === "transition") {
        updateTransitions()
      }
    })

    return unsubscribe
  }, [api, source])

  return { transitions, loading }
}

/**
 * Хук для получения ресурсов по типу
 */
export function useResources(type: ResourceType, source?: ResourceSource) {
  const { api } = useBrowserResourcesProvider()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateResources = () => {
      setResources(api.getResources(type, source))
      setLoading(false)
    }

    updateResources()

    // Подписываемся на обновления
    const unsubscribe = api.onResourcesUpdate((resourceType, _updatedResources) => {
      if (resourceType === type) {
        updateResources()
      }
    })

    return unsubscribe
  }, [api, type, source])

  return { resources, loading }
}

/**
 * Хук для получения ресурса по ID
 */
export function useResourceById(type: ResourceType, id: string) {
  const { api } = useBrowserResourcesProvider()
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateResource = () => {
      setResource(api.getResourceById(type, id))
      setLoading(false)
    }

    updateResource()

    // Подписываемся на обновления
    const unsubscribe = api.onResourcesUpdate((resourceType) => {
      if (resourceType === type) {
        updateResource()
      }
    })

    return unsubscribe
  }, [api, type, id])

  return { resource, loading }
}

/**
 * Хук для поиска ресурсов
 */
export function useResourcesSearch(type: ResourceType, options: SearchOptions) {
  const { api } = useBrowserResourcesProvider()
  const [results, setResults] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  // Мемоизируем опции для предотвращения лишних перерендеров
  const memoizedOptions = useMemo(
    () => options,
    [
      options.query,
      options.category,
      JSON.stringify(options.tags),
      options.complexity,
      options.source,
      options.limit,
      options.offset,
    ],
  )

  useEffect(() => {
    const updateResults = () => {
      const searchResults = api.searchResources(type, memoizedOptions)
      logger.info(`[useResourcesSearch] Searching ${type}:`, {
        options: memoizedOptions,
        results: searchResults,
      })
      setResults(searchResults)
      setLoading(false)
    }

    updateResults()

    // Подписываемся на обновления
    const unsubscribe = api.onResourcesUpdate((resourceType) => {
      if (resourceType === type) {
        logger.info(`[useResourcesSearch] Resource update for ${type}`)
        updateResults()
      }
    })

    return unsubscribe
  }, [api, type, memoizedOptions])

  return { results, loading }
}

/**
 * Хук для получения ресурсов по категории
 */
export function useResourcesByCategory(type: ResourceType, category: string) {
  return useResourcesSearch(type, { category })
}

/**
 * Хук для получения ресурсов по тегам
 */
export function useResourcesByTags(type: ResourceType, tags: string[]) {
  return useResourcesSearch(type, { tags })
}

/**
 * Хук для получения ресурсов по сложности
 */
export function useResourcesByComplexity(type: ResourceType, complexity: string) {
  return useResourcesSearch(type, { complexity })
}

/**
 * Хук для получения состояния загрузки
 */
export function useLoadingState() {
  const { api } = useBrowserResourcesProvider()
  const [loadingState, setLoadingState] = useState<LoadingState>(api.getLoadingState())

  useEffect(() => {
    const unsubscribe = api.onLoadingStateChange(setLoadingState)
    return unsubscribe
  }, [api])

  return loadingState
}

/**
 * Хук для получения статистики ресурсов
 */
export function useResourcesStats() {
  const { api } = useBrowserResourcesProvider()
  const [stats, setStats] = useState<ResourceStats>(api.getStats())

  useEffect(() => {
    const updateStats = () => {
      setStats(api.getStats())
    }

    updateStats()

    // Обновляем статистику при изменении ресурсов
    const unsubscribe = api.onResourcesUpdate(() => {
      updateStats()
    })

    return unsubscribe
  }, [api])

  return stats
}

/**
 * Хук для управления источниками данных
 */
export function useResourceSources() {
  const { api } = useBrowserResourcesProvider()
  const loadingState = useLoadingState()

  const loadSource = useCallback(
    async (source: ResourceSource) => {
      return api.loadSource(source)
    },
    [api],
  )

  const refreshSource = useCallback(
    async (source: ResourceSource) => {
      return api.refreshSource(source)
    },
    [api],
  )

  const isSourceLoaded = useCallback(
    (source: ResourceSource) => {
      return api.isSourceLoaded(source)
    },
    [api],
  )

  const getSourceConfig = useCallback(
    (source: ResourceSource) => {
      return api.getSourceConfig(source)
    },
    [api],
  )

  const updateSourceConfig = useCallback(
    (source: ResourceSource, config: any) => {
      api.updateSourceConfig(source, config)
    },
    [api],
  )

  return {
    loadSource,
    refreshSource,
    isSourceLoaded,
    getSourceConfig,
    updateSourceConfig,
    loadingState,
  }
}

/**
 * Хук для управления кэшем
 */
export function useResourcesCache() {
  const { api } = useBrowserResourcesProvider()

  const clearCache = useCallback(
    (type?: ResourceType) => {
      api.clearCache(type)
    },
    [api],
  )

  const clearSourceCache = useCallback(
    (source: ResourceSource) => {
      api.clearSourceCache(source)
    },
    [api],
  )

  const invalidateCache = useCallback(() => {
    api.invalidateCache()
  }, [api])

  const getCacheSize = useCallback(() => {
    return api.getCacheSize()
  }, [api])

  return {
    clearCache,
    clearSourceCache,
    invalidateCache,
    getCacheSize,
  }
}

/**
 * Конфигурация для создания адаптера ресурсов
 */
export interface ResourceAdapterConfig {
  /** Тип ресурса */
  type: ResourceType
  /** Опции поиска */
  searchOptions?: SearchOptions
  /** Компонент для превью */
  PreviewComponent?: React.ComponentType<any>
  /** Обработчики импорта */
  importHandlers?: {
    importFile?: () => Promise<void>
    importFolder?: () => Promise<void>
    isImporting?: boolean
  }
  /** Кастомные функции для сортировки и группировки */
  customHandlers?: {
    getSortValue?: (item: any, sortBy: string) => string | number
    getSearchableText?: (item: any) => string[]
    getGroupValue?: (item: any, groupBy: string) => string
    matchesFilter?: (item: any, filterType: string) => boolean
  }
}

/**
 * Унифицированный хук-адаптер для Browser компонента
 * Заменяет отдельные useEffectsAdapter, useFiltersAdapter, useTransitionsAdapter
 */
export function useResourcesAdapter(config: ResourceAdapterConfig) {
  const { type, searchOptions = {}, PreviewComponent, importHandlers, customHandlers } = config
  const { results: items, loading } = useResourcesSearch(type, searchOptions)
  const loadingState = useLoadingState()
  const stats = useResourcesStats()

  return useMemo(
    () => ({
      // Данные
      items,
      loading: loading || loadingState.isLoading,
      error: loadingState.error,
      stats,

      // Методы для поиска и фильтрации
      search: (query: string) => ({ ...searchOptions, query }),
      filterByCategory: (category: string) => ({ ...searchOptions, category }),
      filterByTag: (tag: string) => ({ ...searchOptions, tags: [tag] }),
      filterByTags: (tags: string[]) => ({ ...searchOptions, tags }),
      filterByComplexity: (complexity: string) => ({ ...searchOptions, complexity }),

      // Пагинация
      paginate: (offset: number, limit: number) => ({ ...searchOptions, offset, limit }),

      // ListAdapter интерфейс
      useData: () => ({
        items,
        loading: loading || loadingState.isLoading,
        error: loadingState.error,
      }),
      PreviewComponent,
      getSortValue:
        customHandlers?.getSortValue ||
        ((item: any, sortBy: string) => {
          switch (sortBy) {
            case "name":
              return item.name?.toLowerCase() || ""
            case "category":
              return item.category?.toLowerCase() || ""
            default:
              return item.name?.toLowerCase() || ""
          }
        }),
      getSearchableText:
        customHandlers?.getSearchableText ||
        ((item: any) =>
          [
            item.name,
            item.labels?.ru || "",
            item.labels?.en || "",
            item.description?.ru || "",
            item.description?.en || "",
            item.category,
            ...(item.tags || []),
          ].filter(Boolean)),
      getGroupValue:
        customHandlers?.getGroupValue ||
        ((item: any, groupBy: string) => {
          switch (groupBy) {
            case "category":
              return item.category || "other"
            case "type":
              return item.type || "unknown"
            default:
              return ""
          }
        }),
      matchesFilter:
        customHandlers?.matchesFilter ||
        ((item: any, filterType: string) => {
          if (filterType === "all") return true
          return item.category === filterType || item.complexity === filterType
        }),
      importHandlers,
      favoriteType: type,
    }),
    [items, loading, loadingState, stats, searchOptions, PreviewComponent, importHandlers, customHandlers, type],
  )
}

/**
 * Упрощенная версия для обратной совместимости
 */
export function useResourcesAdapterLegacy(type: ResourceType, options: SearchOptions = {}) {
  return useResourcesAdapter({ type, searchOptions: options })
}

// Типизированные версии хуков для конкретных ресурсов
export const useEffectsSearch = (options: SearchOptions) => useResourcesSearch("effect", options)

export const useFiltersSearch = (options: SearchOptions) => useResourcesSearch("filter", options)

export const useTransitionsSearch = (options: SearchOptions) => useResourcesSearch("transition", options)

// Типизированные адаптеры для каждого типа ресурса
export const useEffectsAdapter = (options?: Partial<ResourceAdapterConfig>) =>
  useResourcesAdapter({ type: "effect", ...options })

export const useFiltersAdapter = (options?: Partial<ResourceAdapterConfig>) =>
  useResourcesAdapter({ type: "filter", ...options })

export const useTransitionsAdapter = (options?: Partial<ResourceAdapterConfig>) =>
  useResourcesAdapter({ type: "transition", ...options })

export const useTemplatesAdapter = (options?: Partial<ResourceAdapterConfig>) =>
  useResourcesAdapter({ type: "template", ...options })

export const useStyleTemplatesAdapter = (options?: Partial<ResourceAdapterConfig>) =>
  useResourcesAdapter({ type: "styleTemplate", ...options })
