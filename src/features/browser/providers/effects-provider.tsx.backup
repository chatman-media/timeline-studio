"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"

import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { ResourceType } from "@/features/resources/types"
import type { Transition } from "@/features/transitions/types/transitions"

import type {
  EffectsProviderAPI,
  EffectsProviderContext,
  EffectsProviderProps,
  LoadingConfig,
  LoadingState,
  LoadResult,
  Resource,
  ResourceCache,
  ResourceSource,
  ResourceStats,
  SearchOptions,
  SourceConfig,
} from "../types/effects-provider"

// Константы по умолчанию
const DEFAULT_CONFIG: LoadingConfig = {
  initialSources: ["built-in"],
  backgroundLoadDelay: 1000,
  enableCaching: true,
  maxCacheSize: 50 * 1024 * 1024, // 50MB
}

const DEFAULT_SOURCE_CONFIGS: Record<ResourceSource, SourceConfig> = {
  "built-in": {
    source: "built-in",
    enabled: true,
    priority: 10,
    timeout: 5000,
  },
  local: {
    source: "local",
    enabled: true,
    priority: 8,
    timeout: 3000,
  },
  remote: {
    source: "remote",
    enabled: false, // Отключен по умолчанию
    priority: 5,
    timeout: 10000,
  },
  imported: {
    source: "imported",
    enabled: true,
    priority: 6,
    timeout: 5000,
  },
}

/**
 * Контекст для EffectsProvider
 */
const EffectsProviderContextValue = createContext<EffectsProviderContext | null>(null)

/**
 * Внутренняя реализация EffectsProvider API
 */
class EffectsProviderImpl implements EffectsProviderAPI {
  private resources = new Map<string, Resource[]>()
  private cache: ResourceCache = {}
  private loadingState: LoadingState = {
    isLoading: false,
    loadedSources: new Set(),
    loadingQueue: [],
    error: null,
    progress: 0,
  }
  private sourceConfigs: Record<ResourceSource, SourceConfig> = { ...DEFAULT_SOURCE_CONFIGS }
  private eventListeners: {
    loadingStateChange: ((state: LoadingState) => void)[]
    resourcesUpdate: ((type: ResourceType, resources: Resource[]) => void)[]
    error: ((error: string, source?: ResourceSource) => void)[]
  } = {
    loadingStateChange: [],
    resourcesUpdate: [],
    error: [],
  }

  constructor(private config: LoadingConfig) {}

  // === Получение ресурсов ===

  getEffects(source?: ResourceSource): VideoEffect[] {
    return this.getResources<VideoEffect>("effect", source)
  }

  getFilters(source?: ResourceSource): VideoFilter[] {
    return this.getResources<VideoFilter>("filter", source)
  }

  getTransitions(source?: ResourceSource): Transition[] {
    return this.getResources<Transition>("transition", source)
  }

  getResources<T extends Resource>(type: ResourceType, source?: ResourceSource): T[] {
    const key = source ? `${type}:${source}` : type
    const resources = this.resources.get(key) || []

    if (source) {
      return resources as T[]
    }

    // Если источник не указан, объединяем ресурсы из всех загруженных источников
    const allResources: T[] = []
    console.log(`[getResources] Looking for ${type} in loaded sources:`, {
      type,
      loadedSources: Array.from(this.loadingState.loadedSources),
      availableKeys: Array.from(this.resources.keys()),
    })

    for (const loadedSource of this.loadingState.loadedSources) {
      const sourceKey = `${type}:${loadedSource}`
      const sourceResources = this.resources.get(sourceKey) || []
      console.log(`[getResources] Checking ${sourceKey}: found ${sourceResources.length} items`)
      allResources.push(...(sourceResources as T[]))
    }

    return allResources
  }

  getResourceById(type: ResourceType, id: string): Resource | null {
    const resources = this.getResources(type)
    return resources.find((r) => r.id === id) || null
  }

  // === Поиск и фильтрация ===

  searchResources<T extends Resource>(type: ResourceType, options: SearchOptions): T[] {
    let resources = this.getResources<T>(type, options.source)

    console.log(`[searchResources] Initial search for ${type}:`, {
      options,
      initialCount: resources.length,
    })

    // Поиск по тексту
    if (options.query) {
      const query = options.query.toLowerCase()
      resources = resources.filter((resource) => {
        const name =
          "name" in resource
            ? typeof resource.name === "object"
              ? Object.values(resource.name).join(" ").toLowerCase()
              : resource.name?.toLowerCase() || ""
            : ""
        const labels =
          "labels" in resource && typeof resource.labels === "object"
            ? Object.values(resource.labels).join(" ").toLowerCase()
            : ""
        const description =
          "description" in resource
            ? typeof resource.description === "object"
              ? Object.values(resource.description).join(" ").toLowerCase()
              : (resource.description as unknown as string)?.toLowerCase() || ""
            : ""

        return name.includes(query) || labels.includes(query) || description.includes(query)
      })
    }

    // Фильтрация по категории
    if (options.category) {
      resources = resources.filter((resource) => "category" in resource && resource.category === options.category)
    }

    // Фильтрация по тегам
    if (options.tags && options.tags.length > 0) {
      resources = resources.filter((resource) => {
        if (!("tags" in resource) || !Array.isArray(resource.tags)) return false
        return options.tags!.some((tag) => (resource as any).tags.includes(tag))
      })
    }

    // Фильтрация по сложности
    if (options.complexity) {
      resources = resources.filter((resource) => "complexity" in resource && resource.complexity === options.complexity)
    }

    // Пагинация
    if (options.offset || options.limit) {
      const start = options.offset || 0
      const end = options.limit ? start + options.limit : undefined
      resources = resources.slice(start, end)
    }

    return resources
  }

  getResourcesByCategory<T extends Resource>(type: ResourceType, category: string): T[] {
    return this.searchResources<T>(type, { category })
  }

  getResourcesByTags<T extends Resource>(type: ResourceType, tags: string[]): T[] {
    return this.searchResources<T>(type, { tags })
  }

  getResourcesByComplexity<T extends Resource>(type: ResourceType, complexity: string): T[] {
    return this.searchResources<T>(type, { complexity })
  }

  // === Управление источниками ===

  async loadSource(source: ResourceSource): Promise<LoadResult> {
    if (this.loadingState.loadingQueue.includes(source)) {
      return {
        success: false,
        data: [],
        error: "Source is already loading",
        source,
        timestamp: Date.now(),
      }
    }

    this.updateLoadingState({
      isLoading: true,
      loadingQueue: [...this.loadingState.loadingQueue, source],
      error: null,
    })

    try {
      const result = await this.loadSourceData(source)

      this.updateLoadingState({
        loadedSources: new Set([...this.loadingState.loadedSources, source]),
        loadingQueue: this.loadingState.loadingQueue.filter((s) => s !== source),
        isLoading: this.loadingState.loadingQueue.length > 1,
        progress: (this.loadingState.loadedSources.size / Object.keys(this.sourceConfigs).length) * 100,
      })

      // Уведомляем подписчиков об обновлении ресурсов
      ;(["effect", "filter", "transition"] as ResourceType[]).forEach((type) => {
        const resources = this.getResources(type, source)
        this.eventListeners.resourcesUpdate.forEach((callback) => callback(type, resources))
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      this.updateLoadingState({
        loadingQueue: this.loadingState.loadingQueue.filter((s) => s !== source),
        isLoading: this.loadingState.loadingQueue.length > 1,
        error: errorMessage,
      })

      this.eventListeners.error.forEach((callback) => callback(errorMessage, source))

      return {
        success: false,
        data: [],
        error: errorMessage,
        source,
        timestamp: Date.now(),
      }
    }
  }

  private async loadSourceData(source: ResourceSource): Promise<LoadResult> {
    switch (source) {
      case "built-in":
        return this.loadBuiltInResources()
      case "local":
        return this.loadLocalResources()
      case "remote":
        return this.loadRemoteResources()
      case "imported":
        return this.loadImportedResources()
      default:
        throw new Error(`Unknown source: ${source}`)
    }
  }

  private async loadBuiltInResources(): Promise<LoadResult> {
    try {
      // Используем оптимизированные ленивые загрузчики
      const { loadAllResourcesLazy } = await import("../services/resource-loaders")

      const results = await loadAllResourcesLazy()

      // Сохраняем ресурсы в кэш только если загрузка успешна
      if (results.effects.success) {
        this.resources.set("effect:built-in", results.effects.data)
        console.log(`Loaded ${results.effects.data.length} effects`)
        // Уведомляем об обновлении ресурсов
        this.eventListeners.resourcesUpdate.forEach((callback) => callback("effect", results.effects.data))
      }
      if (results.filters.success) {
        this.resources.set("filter:built-in", results.filters.data)
        console.log(`Loaded ${results.filters.data.length} filters`)
        // Уведомляем об обновлении ресурсов
        this.eventListeners.resourcesUpdate.forEach((callback) => callback("filter", results.filters.data))
      }
      if (results.transitions.success) {
        this.resources.set("transition:built-in", results.transitions.data)
        console.log(`Loaded ${results.transitions.data.length} transitions`)
        // Уведомляем об обновлении ресурсов
        this.eventListeners.resourcesUpdate.forEach((callback) => callback("transition", results.transitions.data))
      }

      // Проверяем наличие ошибок
      const errors = [
        !results.effects.success ? results.effects.error : null,
        !results.filters.success ? results.filters.error : null,
        !results.transitions.success ? results.transitions.error : null,
      ].filter(Boolean)

      if (errors.length > 0) {
        throw new Error(`Failed to load some resources: ${errors.join(", ")}`)
      }

      const totalResources = results.effects.data.length + results.filters.data.length + results.transitions.data.length

      return {
        success: true,
        data: [],
        source: "built-in",
        timestamp: Date.now(),
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to load built-in resources: ${errorMessage}`)
    }
  }

  private async loadLocalResources(): Promise<LoadResult> {
    // TODO: Реализовать загрузку локальных ресурсов из localStorage/IndexedDB
    this.resources.set("effect:local", [])
    this.resources.set("filter:local", [])
    this.resources.set("transition:local", [])

    return {
      success: true,
      data: [],
      source: "local",
      timestamp: Date.now(),
    }
  }

  private async loadRemoteResources(): Promise<LoadResult> {
    // TODO: Реализовать загрузку удаленных ресурсов
    this.resources.set("effect:remote", [])
    this.resources.set("filter:remote", [])
    this.resources.set("transition:remote", [])

    return {
      success: true,
      data: [],
      source: "remote",
      timestamp: Date.now(),
    }
  }

  private async loadImportedResources(): Promise<LoadResult> {
    // TODO: Реализовать загрузку импортированных ресурсов
    this.resources.set("effect:imported", [])
    this.resources.set("filter:imported", [])
    this.resources.set("transition:imported", [])

    return {
      success: true,
      data: [],
      source: "imported",
      timestamp: Date.now(),
    }
  }

  isSourceLoaded(source: ResourceSource): boolean {
    return this.loadingState.loadedSources.has(source)
  }

  async refreshSource(source: ResourceSource): Promise<LoadResult> {
    // Удаляем из кэша
    this.clearSourceCache(source)

    // Удаляем из загруженных источников
    this.loadingState.loadedSources.delete(source)

    // Загружаем заново
    return this.loadSource(source)
  }

  async preloadCategory(_type: ResourceType, _category: string): Promise<LoadResult> {
    // TODO: Реализовать предзагрузку категории
    return {
      success: true,
      data: [],
      source: "built-in",
      timestamp: Date.now(),
    }
  }

  getSourceConfig(source: ResourceSource): SourceConfig | null {
    return this.sourceConfigs[source] || null
  }

  updateSourceConfig(source: ResourceSource, config: Partial<SourceConfig>): void {
    this.sourceConfigs[source] = { ...this.sourceConfigs[source], ...config }
  }

  // === Состояние и статистика ===

  getLoadingState(): LoadingState {
    return { ...this.loadingState }
  }

  getStats(): ResourceStats {
    const stats: ResourceStats = {
      total: 0,
      byType: { effect: 0, filter: 0, transition: 0, media: 0, music: 0, subtitle: 0, template: 0, styleTemplate: 0 },
      bySource: { "built-in": 0, local: 0, remote: 0, imported: 0 },
      cacheSize: this.getCacheSize(),
      memoryUsage: 0, // TODO: Подсчитать использование памяти
    }

    // Подсчитываем ресурсы по типам
    stats.byType.effect = this.getEffects().length
    stats.byType.filter = this.getFilters().length
    stats.byType.transition = this.getTransitions().length
    stats.total = Number(stats.byType.effect) + Number(stats.byType.filter) + Number(stats.byType.transition)

    // Подсчитываем ресурсы по источникам
    for (const source of this.loadingState.loadedSources) {
      stats.bySource[source] =
        this.getEffects(source).length + this.getFilters(source).length + this.getTransitions(source).length
    }

    return stats
  }

  getCacheSize(): number {
    return JSON.stringify(this.cache).length
  }

  // === Кэширование ===

  clearCache(type?: ResourceType): void {
    if (type) {
      // Очищаем кэш для конкретного типа
      for (const key of this.resources.keys()) {
        if (key.startsWith(type)) {
          this.resources.delete(key)
        }
      }
    } else {
      // Очищаем весь кэш
      this.resources.clear()
      this.cache = {}
    }
  }

  clearSourceCache(source: ResourceSource): void {
    for (const key of this.resources.keys()) {
      if (key.endsWith(`:${source}`)) {
        this.resources.delete(key)
      }
    }
  }

  invalidateCache(): void {
    this.clearCache()
    this.loadingState.loadedSources.clear()
  }

  // === События ===

  onLoadingStateChange(callback: (state: LoadingState) => void): () => void {
    this.eventListeners.loadingStateChange.push(callback)
    return () => {
      const index = this.eventListeners.loadingStateChange.indexOf(callback)
      if (index > -1) {
        this.eventListeners.loadingStateChange.splice(index, 1)
      }
    }
  }

  onResourcesUpdate(callback: (type: ResourceType, resources: Resource[]) => void): () => void {
    this.eventListeners.resourcesUpdate.push(callback)
    return () => {
      const index = this.eventListeners.resourcesUpdate.indexOf(callback)
      if (index > -1) {
        this.eventListeners.resourcesUpdate.splice(index, 1)
      }
    }
  }

  onError(callback: (error: string, source?: ResourceSource) => void): () => void {
    this.eventListeners.error.push(callback)
    return () => {
      const index = this.eventListeners.error.indexOf(callback)
      if (index > -1) {
        this.eventListeners.error.splice(index, 1)
      }
    }
  }

  // === Очистка состояния ===

  /**
   * Очищает все состояние провайдера для тестов
   */
  cleanup(): void {
    // Очищаем ресурсы
    this.resources.clear()

    // Очищаем кэш
    this.cache = {}

    // Сбрасываем состояние загрузки
    this.loadingState = {
      isLoading: false,
      loadedSources: new Set(),
      loadingQueue: [],
      error: null,
      progress: 0,
    }

    // Очищаем слушатели событий
    this.eventListeners.loadingStateChange = []
    this.eventListeners.resourcesUpdate = []
    this.eventListeners.error = []
  }

  // === Внутренние методы ===

  private updateLoadingState(updates: Partial<LoadingState>): void {
    this.loadingState = { ...this.loadingState, ...updates }
    this.eventListeners.loadingStateChange.forEach((callback) => callback(this.loadingState))
  }
}

// === Экспорт для тестов ===

// Глобальная переменная для хранения инстанса для очистки в тестах
let globalProviderInstance: EffectsProviderImpl | null = null

/**
 * Очищает глобальное состояние провайдера (для тестов)
 */
export function resetEffectsProviderState(): void {
  if (globalProviderInstance) {
    globalProviderInstance.cleanup()
  }
}

/**
 * Компонент EffectsProvider
 */
export function EffectsProvider({ children, config = {}, onError }: EffectsProviderProps) {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])
  const [isInitialized, setIsInitialized] = useState(false)
  const apiRef = useRef<EffectsProviderImpl | null>(null)

  // Создаем API инстанс
  if (!apiRef.current) {
    apiRef.current = new EffectsProviderImpl(finalConfig)
    globalProviderInstance = apiRef.current
  }

  const api = apiRef.current

  // Инициализация при монтировании
  useEffect(() => {
    let cancelled = false
    let unsubscribeError: (() => void) | undefined
    let backgroundTimer: NodeJS.Timeout | undefined

    const initialize = async () => {
      try {
        // Подписываемся на ошибки
        unsubscribeError = api.onError((error, source) => {
          console.error(`EffectsProvider error from ${source}:`, error)
          onError?.(error)
        })

        // Загружаем начальные источники
        const loadPromises = finalConfig.initialSources.map((source) => api.loadSource(source))

        await Promise.allSettled(loadPromises)

        if (!cancelled) {
          setIsInitialized(true)

          // Запускаем фоновую загрузку других источников
          backgroundTimer = setTimeout(() => {
            if (!cancelled) {
              const backgroundSources: ResourceSource[] = ["local", "imported"]
              backgroundSources.forEach((source) => {
                if (!api.isSourceLoaded(source)) {
                  api.loadSource(source).catch((error: unknown) => {
                    const errorMessage = error instanceof Error ? error.message : String(error)
                    console.warn(`Background loading failed for ${source}:`, errorMessage)
                  })
                }
              })
            }
          }, finalConfig.backgroundLoadDelay)
        }
      } catch (error) {
        console.error("EffectsProvider initialization failed:", error)
        onError?.(error instanceof Error ? error.message : String(error))
      }
    }

    void initialize()

    return () => {
      cancelled = true
      if (backgroundTimer) {
        clearTimeout(backgroundTimer)
      }
      if (unsubscribeError) {
        unsubscribeError()
      }
    }
  }, [finalConfig, api, onError])

  const contextValue = useMemo<EffectsProviderContext>(
    () => ({
      api,
      config: finalConfig,
      isInitialized,
    }),
    [api, finalConfig, isInitialized],
  )

  return <EffectsProviderContextValue.Provider value={contextValue}>{children}</EffectsProviderContextValue.Provider>
}

/**
 * Хук для использования EffectsProvider
 */
export function useEffectsProvider(): EffectsProviderContext {
  const context = useContext(EffectsProviderContextValue)

  if (!context) {
    throw new Error("useEffectsProvider must be used within an EffectsProvider")
  }

  return context
}

export type { EffectsProviderAPI, EffectsProviderContext, EffectsProviderProps }
