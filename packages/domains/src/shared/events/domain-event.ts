/**
 * Domain Event Types
 *
 * Базовые типы для событий между доменами
 */

/**
 * Базовый интерфейс для всех доменных событий
 */
export interface DomainEvent<T = unknown> {
  /** Уникальный идентификатор события */
  id: string
  /** Тип события (например: 'media.imported', 'timeline.updated') */
  type: string
  /** Домен-источник события */
  source: DomainName
  /** Временная метка события */
  timestamp: number
  /** Данные события */
  payload: T
  /** Метаданные события */
  metadata?: EventMetadata
}

/**
 * Метаданные события
 */
export interface EventMetadata {
  /** ID пользователя, инициировавшего событие */
  userId?: string
  /** ID сессии */
  sessionId?: string
  /** Корреляционный ID для трейсинга */
  correlationId?: string
  /** Дополнительные метаданные */
  [key: string]: unknown
}

/**
 * Названия доменов
 */
export type DomainName =
  | "ai-services"
  | "browser"
  | "media-management"
  | "video-editing"
  | "project-management"
  | "system-integration"
  | "shared"

/**
 * Обработчик событий
 */
export type EventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>

/**
 * Отписка от события
 */
export type Unsubscribe = () => void

/**
 * Фильтр событий
 */
export interface EventFilter {
  /** Фильтр по типу события (поддерживает wildcards: 'media.*') */
  type?: string | string[]
  /** Фильтр по домену-источнику */
  source?: DomainName | DomainName[]
  /** Кастомный фильтр */
  custom?: (event: DomainEvent) => boolean
}

/**
 * Опции подписки на события
 */
export interface SubscriptionOptions {
  /** Фильтр событий */
  filter?: EventFilter
  /** Приоритет обработчика (больше = выше приоритет) */
  priority?: number
  /** Обрабатывать событие только один раз */
  once?: boolean
  /** Таймаут обработки (мс) */
  timeout?: number
}

/**
 * Результат публикации события
 */
export interface PublishResult {
  /** ID опубликованного события */
  eventId: string
  /** Количество обработчиков, получивших событие */
  handlerCount: number
  /** Ошибки при обработке (если были) */
  errors?: Error[]
}
