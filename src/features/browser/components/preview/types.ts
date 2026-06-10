import type { ReactNode } from "react"

import type { ViewMode } from "@timeline-studio/core/types"
import type { PreviewSize } from "@/features/browser/types/list"

// Re-export for convenience
export type { PreviewSize }

/**
 * Действие в превью
 */
export interface PreviewAction {
  id: string
  icon: ReactNode
  label: string
  onClick: () => void
  variant?: "default" | "primary" | "danger"
}

/**
 * Конфигурация для отображения превью
 */
export interface PreviewConfig<T = any> {
  // === Media preview ===

  /** URL превью изображения */
  thumbnailUrl?: string | ((item: T) => string | undefined)

  /** URL для video preview при hover */
  videoPreviewUrl?: string | ((item: T) => string | undefined)

  /** Показывать видео при hover */
  showVideoOnHover?: boolean

  /** Соотношение сторон [width, height], по умолчанию [16, 9] */
  aspectRatio?: [number, number] | ((item: T) => [number, number])

  // === Badges ===

  /** Показывать badge с длительностью */
  showDuration?: boolean

  /** Получить длительность в секундах */
  getDuration?: (item: T) => number | undefined

  /** Показывать badge с типом */
  showType?: boolean

  /** Получить тип для badge */
  getType?: (item: T) => string | undefined

  /** Иконка типа */
  getTypeIcon?: (item: T) => ReactNode

  /** Показывать badge с разрешением */
  showResolution?: boolean

  /** Получить разрешение */
  getResolution?: (item: T) => { width: number; height: number } | undefined

  // === Info ===

  /** Получить заголовок */
  getTitle: (item: T) => string

  /** Получить подзаголовок */
  getSubtitle?: (item: T) => string | undefined

  /** Получить теги */
  getTags?: (item: T) => string[]

  /** Получить метаданные для list view */
  getMetadata?: (item: T) => Array<{ icon?: ReactNode; label: string }>

  // === Actions ===

  /** Дополнительные действия */
  actions?: PreviewAction[] | ((item: T) => PreviewAction[])

  /** Показывать кнопку "Добавить" */
  showAddButton?: boolean

  /** Показывать кнопку "Избранное" */
  showFavoriteButton?: boolean
}

/**
 * Пропсы для UniversalPreview
 */
export interface UniversalPreviewProps<T> {
  /** Элемент для отображения */
  item: T

  /** Размер превью */
  size: number | PreviewSize

  /** Режим отображения */
  viewMode: ViewMode

  /** Конфигурация превью */
  config: PreviewConfig<T>

  // === Callbacks ===

  /** Клик по превью */
  onClick?: () => void

  /** Начало перетаскивания */
  onDragStart?: (e: React.DragEvent) => void

  /** Добавить на таймлайн */
  onAddToTimeline?: () => void

  /** Переключить избранное */
  onToggleFavorite?: () => void

  // === State ===

  /** Элемент выбран */
  isSelected?: boolean

  /** Элемент в избранном */
  isFavorite?: boolean

  /** Элемент добавлен на таймлайн/в ресурсы */
  isAdded?: boolean
}
