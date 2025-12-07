"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { container } from "@/core/container"
import type { ResourceType } from "@/domains/shared/types/resources"
import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { Transition } from "@/features/transitions/types/transitions"
import { createLogger } from "@/lib/tauri-logger"

import { handleBackendEvent as processBackendEvent } from "../machines/resource-backend-event-handlers"

// ProjectEvent is defined locally in resource-backend-event-handlers
type ProjectEvent = Parameters<typeof processBackendEvent>[1]

// Define ProjectState type locally
interface ProjectState {
  project: any | null
  ui_state: any
  playback_state: any
  version: number
}

const logger = createLogger("BrowserResourcesProvider")

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
} from "../types/browser-resources-provider"

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
 * Контекст для BrowserResourcesProvider (библиотека доступных ресурсов для Browser)
 */
const BrowserResourcesProviderContextValue = createContext<EffectsProviderContext | null>(null)

/**
 * Внутренняя реализация EffectsProvider API с интеграцией BackendSync
 */
class BrowserResourcesProviderImpl implements EffectsProviderAPI {
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
  private backendSync = container.getBackend()
  private isBackendConnected = false

  // Кэш для мемоизации результатов getResources
  private resourcesCache = new Map<string, { resources: Resource[]; timestamp: number }>()
  private readonly CACHE_TTL = 1000 // 1 секунда

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

    // Если запрашиваем конкретный источник - возвращаем напрямую без кэша
    if (source) {
      const resources = this.resources.get(key) || []
      return resources as T[]
    }

    // Проверяем кэш для агрегированных ресурсов
    const cacheKey = `aggregated:${type}`
    const cached = this.resourcesCache.get(cacheKey)
    const now = Date.now()

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      // Кэш еще актуален - возвращаем закэшированный результат
      return cached.resources as T[]
    }

    // Если источник не указан, объединяем ресурсы из всех загруженных источников
    const allResources: T[] = []

    // Логируем только если кэш устарел или отсутствует
    if (!cached) {
      logger.debugSync("Looking for resources in loaded sources", {
        type,
        loadedSources: Array.from(this.loadingState.loadedSources),
        availableKeys: Array.from(this.resources.keys()),
      })
    }

    for (const loadedSource of this.loadingState.loadedSources) {
      const sourceKey = `${type}:${loadedSource}`
      const sourceResources = this.resources.get(sourceKey) || []

      // Логируем только при первой загрузке
      if (!cached) {
        logger.debugSync("Checking source resources", { sourceKey, count: sourceResources.length })
      }

      allResources.push(...(sourceResources as T[]))
    }

    // Дедупликация ресурсов по id (если один и тот же ресурс загружен из разных источников)
    const uniqueResources = Array.from(new Map(allResources.map((resource) => [resource.id, resource])).values())

    // Логируем дедупликацию только если были дубликаты
    if (!cached && allResources.length !== uniqueResources.length) {
      logger.debugSync("Deduplicated resources", {
        type,
        before: allResources.length,
        after: uniqueResources.length,
        removed: allResources.length - uniqueResources.length,
      })
    }

    // Сохраняем результат в кэш
    this.resourcesCache.set(cacheKey, { resources: uniqueResources, timestamp: now })

    return uniqueResources
  }

  getResourceById(type: ResourceType, id: string): Resource | null {
    const resources = this.getResources(type)
    return resources.find((r) => r.id === id) || null
  }

  // === Поиск и фильтрация ===

  searchResources<T extends Resource>(type: ResourceType, options: SearchOptions): T[] {
    let resources = this.getResources<T>(type, options.source)

    logger.debugSync("Initial search for resources", {
      type,
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

      // Синхронизируем загруженные ресурсы с backend
      if (this.isBackendConnected && (source === "imported" || source === "local")) {
        this.syncResourcesWithBackend(source)
      }

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
        logger.debugSync("Loaded effects", { count: results.effects.data.length })
        // Уведомляем об обновлении ресурсов
        this.eventListeners.resourcesUpdate.forEach((callback) => callback("effect", results.effects.data))
      }
      if (results.filters.success) {
        this.resources.set("filter:built-in", results.filters.data)
        logger.debugSync("Loaded filters", { count: results.filters.data.length })
        // Уведомляем об обновлении ресурсов
        this.eventListeners.resourcesUpdate.forEach((callback) => callback("filter", results.filters.data))
      }
      if (results.transitions.success) {
        this.resources.set("transition:built-in", results.transitions.data)
        logger.debugSync("Loaded transitions", { count: results.transitions.data.length })
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
    // Event-driven подход: вместо прямой загрузки ресурсов,
    // мы ждем, что backend отправит события EffectAdded, FilterAdded, TransitionAdded
    // для локальных ресурсов при инициализации проекта

    if (this.isBackendConnected) {
      try {
        // Отправляем команду для инициализации загрузки,
        // но НЕ обновляем state напрямую - ждем события
        await this.backendSync.executeCommand({
          type: "LoadResources" as any,
          params: {
            resource_type: "effect",
            source: "local",
            category: null,
          },
        } as any)

        logger.debugSync("Initiated local resources loading from backend, waiting for events")

        // Backend отправит события EffectAdded, FilterAdded, TransitionAdded
        // которые обработает handleBackendEvent()
        return {
          success: true,
          data: [],
          source: "local",
          timestamp: Date.now(),
        }
      } catch (error) {
        void logger.error("Failed to initiate local resources loading", { error: String(error) })
      }
    }

    // Fallback: инициализируем пустыми массивами
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
    // Event-driven подход: команда инициирует загрузку,
    // backend отправит события для добавленных ресурсов

    if (this.isBackendConnected) {
      try {
        await this.backendSync.executeCommand({
          type: "LoadResources" as any,
          params: {
            resource_type: "effect",
            source: "remote",
            category: null,
          },
        } as any)

        logger.debugSync("Initiated remote resources loading from backend, waiting for events")

        // Backend отправит события EffectAdded, FilterAdded, TransitionAdded
        return {
          success: true,
          data: [],
          source: "remote",
          timestamp: Date.now(),
        }
      } catch (error) {
        void logger.error("Failed to initiate remote resources loading", { error: String(error) })
      }
    }

    // Fallback: инициализируем пустыми массивами
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
    // Event-driven подход: команда инициирует загрузку,
    // backend отправит события ImportedMediaAdded, EffectAdded и т.д.

    if (this.isBackendConnected) {
      try {
        await this.backendSync.executeCommand({
          type: "LoadResources" as any,
          params: {
            resource_type: "effect",
            source: "imported",
            category: null,
          },
        } as any)

        logger.debugSync("Initiated imported resources loading from backend, waiting for events")

        // Backend отправит события ImportedMediaAdded, EffectAdded, FilterAdded, TransitionAdded
        return {
          success: true,
          data: [],
          source: "imported",
          timestamp: Date.now(),
        }
      } catch (error) {
        void logger.error("Failed to initiate imported resources loading", { error: String(error) })
      }
    }

    // Fallback: инициализируем пустыми массивами
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

  async preloadCategory(type: ResourceType, category: string): Promise<LoadResult> {
    if (this.isBackendConnected) {
      try {
        await this.backendSync.executeCommand({
          type: "PreloadCategory" as any,
          params: {
            resource_type: type,
            category,
          },
        } as any)
      } catch (error) {
        void logger.error("Failed to preload category", { error: String(error) })
      }
    }

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

    if (this.isBackendConnected) {
      this.backendSync
        .executeCommand({
          type: "SyncResources" as any,
          params: {
            source,
          },
        } as any)
        .catch((error) => {
          void logger.error("Failed to sync source config", { error: String(error) })
        })
    }
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
      memoryUsage: this.estimateMemoryUsage(),
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

  /**
   * Оценка использования памяти в байтах
   * Приблизительный расчет на основе количества и размера ресурсов
   */
  private estimateMemoryUsage(): number {
    let totalBytes = 0

    // Оценка размера одного ресурса (средний размер объекта в памяти)
    const AVERAGE_RESOURCE_SIZE = 1024 // ~1KB на ресурс (метаданные, строки, функции)

    // Подсчитываем память для каждого типа ресурсов
    const effectsCount = this.getEffects().length
    const filtersCount = this.getFilters().length
    const transitionsCount = this.getTransitions().length

    totalBytes += (effectsCount + filtersCount + transitionsCount) * AVERAGE_RESOURCE_SIZE

    // Добавляем память кэша
    totalBytes += this.getCacheSize()

    return totalBytes
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

  // === BackendSync интеграция ===

  setBackendConnected(connected: boolean): void {
    this.isBackendConnected = connected
  }

  /**
   * Обрабатывает backend события для инкрементального обновления ресурсов
   */
  handleBackendEvent(event: ProjectEvent): void {
    const context = {
      resources: this.resources,
      loadedSources: this.loadingState.loadedSources,
      isLoading: this.loadingState.isLoading,
      error: this.loadingState.error,
    }

    const result = processBackendEvent(context, event)

    // Применяем изменения
    if (result.resources) {
      this.resources = result.resources
      // Очищаем кэш агрегированных ресурсов
      this.resourcesCache.clear()
    }

    if (result.loadedSources) {
      this.loadingState.loadedSources = result.loadedSources
    }

    if (result.shouldRefreshSource) {
      // Асинхронно перезагружаем источник
      this.refreshSource(result.shouldRefreshSource).catch((error: unknown) => {
        void logger.error("Failed to refresh source after backend event", {
          source: result.shouldRefreshSource,
          error: String(error),
        })
      })
    }

    if (result.error) {
      this.updateLoadingState({ error: result.error })
    }

    // Уведомляем подписчиков об обновлении
    if (result.resources) {
      ;(["effect", "filter", "transition", "template", "styleTemplate", "subtitle", "media"] as ResourceType[]).forEach(
        (type) => {
          const resources = this.getResources(type)
          this.eventListeners.resourcesUpdate.forEach((callback) => callback(type, resources))
        },
      )
    }
  }

  async syncResourcesWithBackend(source: ResourceSource): Promise<void> {
    if (!this.isBackendConnected) return

    const effects = this.getEffects(source)
    const filters = this.getFilters(source)
    const transitions = this.getTransitions(source)

    try {
      await this.backendSync.executeCommand({
        type: "SyncResources" as any,
        params: {
          source,
        },
      } as any)
      logger.debugSync("Synced resources with backend", { source })
    } catch (error) {
      void logger.error("Failed to sync resources", { source, error: String(error) })
    }
  }

  async importResource(type: ResourceType, resource: Resource): Promise<boolean> {
    try {
      if (this.isBackendConnected) {
        // Event-driven подход: отправляем команду,
        // backend ответит событием EffectAdded/FilterAdded/etc.
        const response = await this.backendSync.executeCommand({
          type: "SaveResource" as any,
          params: {
            resource_id: resource.id,
            resource_type: type,
            data: resource as any,
            metadata: {},
          },
        } as any)

        if (!response.success) {
          throw new Error(response.error || "Failed to import resource")
        }

        logger.debugSync("Resource import initiated, waiting for backend event", {
          resourceId: resource.id,
          type,
        })

        // НЕ обновляем state напрямую - ждем события от backend
        // События EffectAdded, FilterAdded, TransitionAdded, etc.
        // обработает handleBackendEvent()
      } else {
        // Fallback: если backend не подключен, обновляем локально
        const key = `${type}:imported`
        const currentResources = this.resources.get(key) || []
        this.resources.set(key, [...currentResources, resource])

        // Уведомляем об обновлении
        this.eventListeners.resourcesUpdate.forEach((callback) => callback(type, this.getResources(type)))
      }

      return true
    } catch (error) {
      void logger.error("Failed to import resource", { error: String(error) })
      this.eventListeners.error.forEach((callback) =>
        callback(error instanceof Error ? error.message : String(error), "imported"),
      )
      return false
    }
  }

  async deleteResource(type: ResourceType, id: string, source: ResourceSource): Promise<boolean> {
    try {
      if (this.isBackendConnected) {
        // Event-driven подход: отправляем команду,
        // backend ответит событием EffectRemoved/FilterRemoved/etc.
        const response = await this.backendSync.executeCommand({
          type: "DeleteResource" as any,
          params: {
            resource_id: id,
            resource_type: type,
          },
        } as any)

        if (!response.success) {
          throw new Error(response.error || "Failed to delete resource")
        }

        logger.debugSync("Resource deletion initiated, waiting for backend event", {
          resourceId: id,
          type,
        })

        // НЕ обновляем state напрямую - ждем события от backend
        // События EffectRemoved, FilterRemoved, TransitionRemoved, etc.
        // обработает handleBackendEvent()
      } else {
        // Fallback: если backend не подключен, обновляем локально
        const key = `${type}:${source}`
        const currentResources = this.resources.get(key) || []
        this.resources.set(
          key,
          currentResources.filter((r) => r.id !== id),
        )

        // Уведомляем об обновлении
        this.eventListeners.resourcesUpdate.forEach((callback) => callback(type, this.getResources(type)))
      }

      return true
    } catch (error) {
      void logger.error("Failed to delete resource", { error: String(error) })
      this.eventListeners.error.forEach((callback) =>
        callback(error instanceof Error ? error.message : String(error), source),
      )
      return false
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
    this.resourcesCache.clear()

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

    // Очищаем кэш агрегированных ресурсов при изменении загруженных источников
    if (updates.loadedSources) {
      this.resourcesCache.clear()
    }
  }
}

// === Экспорт для тестов ===

// Глобальная переменная для хранения инстанса для очистки в тестах
let globalProviderInstance: BrowserResourcesProviderImpl | null = null

/**
 * Очищает глобальное состояние провайдера (для тестов)
 */
export function resetEffectsProviderState(): void {
  if (globalProviderInstance) {
    globalProviderInstance.cleanup()
  }
}

/**
 * Browser Resources Provider - управляет библиотекой ДОСТУПНЫХ ресурсов для Browser
 *
 * @description
 * Этот провайдер управляет библиотекой ресурсов, доступных для выбора в Browser компоненте.
 * Он отделён от ResourcesProvider, который управляет ресурсами, УЖЕ ДОБАВЛЕННЫМИ на timeline.
 *
 * @responsibilities Отвечает за:
 * - ✅ Загрузку встроенных ресурсов (effects, filters, transitions) из JSON
 * - ✅ Получение импортированных медиа файлов от backend
 * - ✅ Кэширование для производительности
 * - ✅ Поиск и фильтрацию ресурсов
 *
 * @notResponsible НЕ управляет:
 * - ❌ Timeline resources (это `ResourcesProvider` в `src/features/resources`)
 * - ❌ UI состоянием Browser (это `BrowserStateProvider`)
 * - ❌ Применением эффектов на видео
 *
 * @backendIntegration BackendSync интеграция:
 * - Восстановление импортированных медиа файлов при открытии проекта
 * - Синхронизация пользовательских ресурсов
 * - Уведомления об изменениях ресурсов
 *
 * @example
 * ```tsx
 * // Правильное использование
 * <BrowserResourcesProvider>
 *   <BrowserComponent />
 * </BrowserResourcesProvider>
 *
 * // Или с deprecated именем (обратная совместимость)
 * <EffectsProvider>
 *   <BrowserComponent />
 * </EffectsProvider>
 * ```
 *
 * @deprecated Имя `EffectsProvider` устарело. Используйте `BrowserResourcesProvider`.
 * @see BrowserResourcesProvider
 * @see useBrowserResourcesProvider
 */
export function EffectsProvider({ children, config = {}, onError }: EffectsProviderProps) {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isBackendConnected, setIsBackendConnected] = useState(false)
  const apiRef = useRef<BrowserResourcesProviderImpl | null>(null)
  const backendSync = container.getBackend()

  // Создаем API инстанс
  if (!apiRef.current) {
    apiRef.current = new BrowserResourcesProviderImpl(finalConfig)
    globalProviderInstance = apiRef.current
  }

  const api = apiRef.current

  // Синхронизация с BackendSync
  useEffect(() => {
    logger.debugSync("Initializing BackendSync integration")

    // Подписываемся на изменения backend состояния
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setIsBackendConnected(true)
      api.setBackendConnected(true)

      // Восстанавливаем пользовательские ресурсы из backend
      if ((state as any).resources_state) {
        logger.debugSync("Restoring resources from backend state")
        // Backend может отправлять уже загруженные ресурсы
        // для быстрой инициализации
      }
    })

    // Подписываемся на события backend
    const unsubscribeEvents = backendSync.onEvent((event) => {
      logger.debugSync("Backend event received", { eventType: event.type })

      // Список событий для Browser Resources
      const browserResourceEventTypes = [
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
        // Media events (unified architecture 2025-11)
        "MediaAdded",
        "MediaRemoved",
        // Legacy ImportedMedia events (backward compatibility)
        "ImportedMediaAdded",
        "ImportedMediaRemoved",
        "ImportedMediaUpdated",
        "ImportedMediaCleared",
      ]

      if (browserResourceEventTypes.includes(event.type)) {
        logger.debugSync("Browser resource event detected, applying update", { eventType: event.type })
        api.handleBackendEvent(event)
      }
    })

    return () => {
      unsubscribe()
      unsubscribeEvents()
    }
  }, [api, backendSync])

  // Инициализация при монтировании
  useEffect(() => {
    let cancelled = false
    let unsubscribeError: (() => void) | undefined
    let backgroundTimer: NodeJS.Timeout | undefined

    const initialize = async () => {
      try {
        // Подписываемся на ошибки
        unsubscribeError = api.onError((error, source) => {
          void logger.error("Error from source", { source, error })
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

              // Если подключен backend, загружаем и remote
              if (isBackendConnected) {
                backgroundSources.push("remote")
              }

              backgroundSources.forEach((source) => {
                if (!api.isSourceLoaded(source)) {
                  api.loadSource(source).catch((error: unknown) => {
                    const errorMessage = error instanceof Error ? error.message : String(error)
                    logger.warnSync("Background loading failed for source", { source, error: errorMessage })
                  })
                }
              })
            }
          }, finalConfig.backgroundLoadDelay)
        }
      } catch (error) {
        void logger.error("EffectsProvider initialization failed", { error: String(error) })
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
  }, [finalConfig, api, onError, isBackendConnected])

  const contextValue = useMemo<EffectsProviderContext>(
    () => ({
      api,
      config: finalConfig,
      isInitialized,
      // Добавляем статус backend соединения в контекст
      isBackendConnected,
    }),
    [api, finalConfig, isInitialized, isBackendConnected],
  )

  return (
    <BrowserResourcesProviderContextValue.Provider value={contextValue}>
      {children}
    </BrowserResourcesProviderContextValue.Provider>
  )
}

/**
 * Хук для доступа к Browser Resources Provider контексту
 *
 * @description
 * Предоставляет доступ к библиотеке ДОСТУПНЫХ ресурсов для Browser компонента.
 * Этот хук используется для получения эффектов, фильтров, переходов и медиа файлов,
 * доступных для выбора пользователем.
 *
 * @returns {EffectsProviderContext} Контекст провайдера с ресурсами и API
 * @throws {Error} Если хук используется вне BrowserResourcesProvider
 *
 * @example
 * ```tsx
 * function BrowserTab() {
 *   const { getResources, isLoading } = useBrowserResourcesProvider()
 *   const effects = getResources('effect')
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <div>
 *       {effects.map(effect => (
 *         <EffectCard key={effect.id} effect={effect} />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see EffectsProviderContext
 * @see BrowserResourcesProvider
 */
export function useBrowserResourcesProvider(): EffectsProviderContext {
  const context = useContext(BrowserResourcesProviderContextValue)

  if (!context) {
    throw new Error("useBrowserResourcesProvider must be used within a BrowserResourcesProvider")
  }

  return context
}

// Новое имя (рекомендуется)
export { EffectsProvider as BrowserResourcesProvider }

// ===  Deprecated exports для обратной совместимости ===
/**
 * @deprecated Используйте useBrowserResourcesProvider вместо useEffectsProvider
 *
 * План миграции (v2.0.0):
 * 1. Обновить все внутренние использования на useBrowserResourcesProvider
 * 2. Обновить все тесты
 * 3. Добавить console.warn с предупреждением о deprecated API
 * 4. Удалить в следующей мажорной версии (v2.0.0)
 *
 * Текущие использования:
 * - src/features/browser/hooks/use-resources.ts (10 раз)
 * - src/features/browser/__tests__/providers/effects-provider.test.tsx (4 раза)
 * - src/features/browser/__tests__/components/browser-content.test.tsx (1 раз)
 * - src/features/browser/__tests__/adapters/browser-adapter-mocks.ts (1 раз)
 */
export const useEffectsProvider = useBrowserResourcesProvider

export type { EffectsProviderAPI, EffectsProviderContext, EffectsProviderProps }
