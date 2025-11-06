import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { ResourceType } from "@/features/resources/types"
import type { StyleTemplate } from "@/features/style-templates/types"
import type { Transition } from "@/features/transitions/types/transitions"

/**
 * Источники данных ресурсов (по аналогии с Filmora)
 */
export type ResourceSource =
  | "built-in" // Встроенные ресурсы из JSON файлов
  | "local" // Локальные пользовательские ресурсы
  | "remote" // Ресурсы из базы данных сервера
  | "imported" // Импортированные файлы (.cube, .lut, .preset)

/**
 * Базовый интерфейс для любого ресурса
 */
export type Resource = VideoEffect | VideoFilter | Transition | StyleTemplate

/**
 * Состояние загрузки ресурсов
 */
export interface LoadingState {
  isLoading: boolean
  loadedSources: Set<ResourceSource>
  loadingQueue: ResourceSource[]
  error: string | null
  progress: number // 0-100
}

/**
 * Конфигурация загрузки
 */
export interface LoadingConfig {
  /** Источники для загрузки при инициализации */
  initialSources: ResourceSource[]
  /** Активная вкладка браузера для приоритетной загрузки */
  activeTab?: ResourceType
  /** Задержка для фоновой загрузки (мс) */
  backgroundLoadDelay: number
  /** Включить ли кэширование */
  enableCaching: boolean
  /** Максимальный размер кэша */
  maxCacheSize: number
}

/**
 * Опции для поиска и фильтрации
 */
export interface SearchOptions {
  /** Текст для поиска */
  query?: string
  /** Фильтр по категории */
  category?: string
  /** Фильтр по тегам */
  tags?: string[]
  /** Фильтр по сложности */
  complexity?: string
  /** Источник данных */
  source?: ResourceSource
  /** Лимит результатов */
  limit?: number
  /** Смещение для пагинации */
  offset?: number
}

/**
 * Результат операции загрузки
 */
export interface LoadResult<T = Resource[]> {
  success: boolean
  data: T
  error?: string
  source: ResourceSource
  timestamp: number
}

/**
 * Кэш для ресурсов
 */
export type ResourceCache = Record<
  string,
  {
    data: Resource[]
    timestamp: number
    source: ResourceSource
    size: number
  }
>

/**
 * Конфигурация источника данных
 */
export interface SourceConfig {
  /** Источник данных */
  source: ResourceSource
  /** URL для удаленного источника */
  url?: string
  /** Путь к локальным файлам */
  path?: string
  /** Включен ли источник */
  enabled: boolean
  /** Приоритет загрузки (1-10) */
  priority: number
  /** Таймаут для загрузки (мс) */
  timeout: number
}

/**
 * Статистика по ресурсам
 */
export interface ResourceStats {
  total: number
  byType: Record<ResourceType, number>
  bySource: Record<ResourceSource, number>
  cacheSize: number
  memoryUsage: number
}

/**
 * API для работы с ресурсами
 */
export interface EffectsProviderAPI {
  // === Получение ресурсов ===

  /** Получить все эффекты */
  getEffects(source?: ResourceSource): VideoEffect[]

  /** Получить все фильтры */
  getFilters(source?: ResourceSource): VideoFilter[]

  /** Получить все переходы */
  getTransitions(source?: ResourceSource): Transition[]

  /** Получить ресурсы по типу */
  getResources<T extends Resource>(type: ResourceType, source?: ResourceSource): T[]

  /** Получить ресурс по ID */
  getResourceById(type: ResourceType, id: string): Resource | null

  // === Поиск и фильтрация ===

  /** Поиск ресурсов */
  searchResources<T extends Resource>(type: ResourceType, options: SearchOptions): T[]

  /** Получить ресурсы по категории */
  getResourcesByCategory<T extends Resource>(type: ResourceType, category: string): T[]

  /** Получить ресурсы по тегам */
  getResourcesByTags<T extends Resource>(type: ResourceType, tags: string[]): T[]

  /** Получить ресурсы по сложности */
  getResourcesByComplexity<T extends Resource>(type: ResourceType, complexity: string): T[]

  // === Управление источниками ===

  /** Загрузить источник данных */
  loadSource(source: ResourceSource): Promise<LoadResult>

  /** Проверить загружен ли источник */
  isSourceLoaded(source: ResourceSource): boolean

  /** Обновить источник данных */
  refreshSource(source: ResourceSource): Promise<LoadResult>

  /** Загрузить ресурсы определенной категории */
  preloadCategory(type: ResourceType, category: string): Promise<LoadResult>

  /** Получить конфигурацию источника */
  getSourceConfig(source: ResourceSource): SourceConfig | null

  /** Обновить конфигурацию источника */
  updateSourceConfig(source: ResourceSource, config: Partial<SourceConfig>): void

  // === Состояние и статистика ===

  /** Получить состояние загрузки */
  getLoadingState(): LoadingState

  /** Получить статистику по ресурсам */
  getStats(): ResourceStats

  /** Получить размер кэша в байтах */
  getCacheSize(): number

  // === Кэширование ===

  /** Очистить кэш */
  clearCache(type?: ResourceType): void

  /** Очистить кэш источника */
  clearSourceCache(source: ResourceSource): void

  /** Принудительно обновить кэш */
  invalidateCache(): void

  // === События ===

  /** Подписаться на события загрузки */
  onLoadingStateChange(callback: (state: LoadingState) => void): () => void

  /** Подписаться на обновления ресурсов */
  onResourcesUpdate(callback: (type: ResourceType, resources: Resource[]) => void): () => void

  /** Подписаться на ошибки */
  onError(callback: (error: string, source?: ResourceSource) => void): () => void
}

/**
 * Контекст для EffectsProvider
 */
export interface EffectsProviderContext {
  api: EffectsProviderAPI
  config: LoadingConfig
  isInitialized: boolean
}

/**
 * Пропсы для EffectsProvider компонента
 */
export interface EffectsProviderProps {
  children: React.ReactNode
  config?: Partial<LoadingConfig>
  onError?: (error: string) => void
}
