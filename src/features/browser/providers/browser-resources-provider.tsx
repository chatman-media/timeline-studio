"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { ResourceType } from "@/features/resources/types"
import type { Transition } from "@/features/transitions/types/transitions"
import type { ProjectState } from "@/types/generated/tauri-bindings"

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
  private backendSync = getBackendSync()
  private isBackendConnected = false

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
    if (this.isBackendConnected) {
      try {
        const response = await this.backendSync.executeCommand({
          type: "LoadResources",
          params: {
            resource_type: "effect",
            source: "local",
            category: null,
          },
        })

        if (response.success && response.data) {
          const { effects = [], filters = [], transitions = [] } = response.data as any
          this.resources.set("effect:local", effects)
          this.resources.set("filter:local", filters)
          this.resources.set("transition:local", transitions)

          console.log("[BrowserResourcesProvider] Loaded local resources from backend:", {
            effects: effects.length,
            filters: filters.length,
            transitions: transitions.length,
          })

          return {
            success: true,
            data: [...effects, ...filters, ...transitions],
            source: "local",
            timestamp: Date.now(),
          }
        }
      } catch (error) {
        console.error("[BrowserResourcesProvider] Failed to load local resources from backend:", error)
      }
    }

    // Fallback к пустым ресурсам
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
    if (this.isBackendConnected) {
      try {
        const response = await this.backendSync.executeCommand({
          type: "LoadResources",
          params: {
            resource_type: "effect",
            source: "remote",
            category: null,
          },
        })

        if (response.success && response.data) {
          const { effects = [], filters = [], transitions = [] } = response.data as any
          this.resources.set("effect:remote", effects)
          this.resources.set("filter:remote", filters)
          this.resources.set("transition:remote", transitions)

          return {
            success: true,
            data: [...effects, ...filters, ...transitions],
            source: "remote",
            timestamp: Date.now(),
          }
        }
      } catch (error) {
        console.error("[BrowserResourcesProvider] Failed to load remote resources:", error)
      }
    }

    // Fallback к пустым ресурсам
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
    if (this.isBackendConnected) {
      try {
        const response = await this.backendSync.executeCommand({
          type: "LoadResources",
          params: {
            resource_type: "effect",
            source: "imported",
            category: null,
          },
        })

        if (response.success && response.data) {
          const { effects = [], filters = [], transitions = [] } = response.data as any
          this.resources.set("effect:imported", effects)
          this.resources.set("filter:imported", filters)
          this.resources.set("transition:imported", transitions)

          return {
            success: true,
            data: [...effects, ...filters, ...transitions],
            source: "imported",
            timestamp: Date.now(),
          }
        }
      } catch (error) {
        console.error("[BrowserResourcesProvider] Failed to load imported resources:", error)
      }
    }

    // Fallback к пустым ресурсам
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
          type: "PreloadCategory",
          params: {
            resource_type: type,
            category,
          },
        })
      } catch (error) {
        console.error("[BrowserResourcesProvider] Failed to preload category:", error)
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
          type: "SyncResources",
          params: {
            source,
          },
        })
        .catch((error) => {
          console.error("[BrowserResourcesProvider] Failed to sync source config:", error)
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

  // === BackendSync интеграция ===

  setBackendConnected(connected: boolean): void {
    this.isBackendConnected = connected
  }

  async syncResourcesWithBackend(source: ResourceSource): Promise<void> {
    if (!this.isBackendConnected) return

    const effects = this.getEffects(source)
    const filters = this.getFilters(source)
    const transitions = this.getTransitions(source)

    try {
      await this.backendSync.executeCommand({
        type: "SyncResources",
        params: {
          source,
        },
      })
      console.log(`[BrowserResourcesProvider] Synced ${source} resources with backend`)
    } catch (error) {
      console.error(`[BrowserResourcesProvider] Failed to sync ${source} resources:`, error)
    }
  }

  async importResource(type: ResourceType, resource: Resource): Promise<boolean> {
    try {
      if (this.isBackendConnected) {
        const response = await this.backendSync.executeCommand({
          type: "SaveResource",
          params: {
            resource_id: resource.id,
            resource_type: type,
            data: resource as any,
            metadata: {},
          },
        })

        if (!response.success) {
          throw new Error(response.error || "Failed to import resource")
        }
      }

      // Добавляем в локальный кэш
      const key = `${type}:imported`
      const currentResources = this.resources.get(key) || []
      this.resources.set(key, [...currentResources, resource])

      // Уведомляем об обновлении
      this.eventListeners.resourcesUpdate.forEach((callback) => callback(type, this.getResources(type)))

      return true
    } catch (error) {
      console.error("[BrowserResourcesProvider] Failed to import resource:", error)
      this.eventListeners.error.forEach((callback) =>
        callback(error instanceof Error ? error.message : String(error), "imported"),
      )
      return false
    }
  }

  async deleteResource(type: ResourceType, id: string, source: ResourceSource): Promise<boolean> {
    try {
      if (this.isBackendConnected) {
        const response = await this.backendSync.executeCommand({
          type: "DeleteResource",
          params: {
            resource_id: id,
            resource_type: type,
          },
        })

        if (!response.success) {
          throw new Error(response.error || "Failed to delete resource")
        }
      }

      // Удаляем из локального кэша
      const key = `${type}:${source}`
      const currentResources = this.resources.get(key) || []
      this.resources.set(
        key,
        currentResources.filter((r) => r.id !== id),
      )

      // Уведомляем об обновлении
      this.eventListeners.resourcesUpdate.forEach((callback) => callback(type, this.getResources(type)))

      return true
    } catch (error) {
      console.error("[BrowserResourcesProvider] Failed to delete resource:", error)
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
 * Отвечает за:
 * - Загрузку встроенных ресурсов (effects, filters, transitions)
 * - Получение импортированных медиа от backend
 * - Кэширование для производительности
 *
 * НЕ управляет:
 * - ❌ Timeline resources (это ResourcesProvider)
 * - ❌ UI состоянием (это BrowserStateProvider)
 *
 * BackendSync интеграция:
 * - Сохранение пользовательских ресурсов
 * - Загрузка удаленных ресурсов
 * - Синхронизация импортированных ресурсов
 */
export function EffectsProvider({ children, config = {}, onError }: EffectsProviderProps) {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isBackendConnected, setIsBackendConnected] = useState(false)
  const apiRef = useRef<BrowserResourcesProviderImpl | null>(null)
  const backendSync = getBackendSync()

  // Создаем API инстанс
  if (!apiRef.current) {
    apiRef.current = new BrowserResourcesProviderImpl(finalConfig)
    globalProviderInstance = apiRef.current
  }

  const api = apiRef.current

  // Синхронизация с BackendSync
  useEffect(() => {
    console.log("[BrowserResourcesProvider] Initializing BackendSync integration")

    // Подписываемся на изменения backend состояния
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setIsBackendConnected(true)
      api.setBackendConnected(true)

      // Восстанавливаем пользовательские ресурсы из backend
      if ((state as any).resources_state) {
        console.log("[BrowserResourcesProvider] Restoring resources from backend state")
        // Backend может отправлять уже загруженные ресурсы
        // для быстрой инициализации
      }
    })

    // Подписываемся на события backend
    const unsubscribeEvents = backendSync.onEvent((event) => {
      // TODO: Добавить правильные типы событий для ресурсов
      console.log("[BrowserResourcesProvider] Backend event received:", event.type)

      // Временно отключено до добавления правильных типов событий
      // switch (event.type) {
      //   case "RESOURCE_IMPORTED":
      //     api.refreshSource("imported")
      //     break
      //   case "RESOURCE_DELETED":
      //     if (event.data?.source) {
      //       api.refreshSource(event.data.source)
      //     }
      //     break
      //   case "REMOTE_RESOURCES_UPDATED":
      //     api.refreshSource("remote")
      //     break
      // }
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

              // Если подключен backend, загружаем и remote
              if (isBackendConnected) {
                backgroundSources.push("remote")
              }

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

  return <BrowserResourcesProviderContextValue.Provider value={contextValue}>{children}</BrowserResourcesProviderContextValue.Provider>
}

/**
 * Хук для использования BrowserResourcesProvider
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
// TODO: Удалить в следующей мажорной версии

/**
 * @deprecated Используйте useBrowserResourcesProvider вместо useEffectsProvider
 */
export const useEffectsProvider = useBrowserResourcesProvider

export type { EffectsProviderAPI, EffectsProviderContext, EffectsProviderProps }
