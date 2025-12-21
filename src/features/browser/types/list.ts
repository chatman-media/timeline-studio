import type { ReactNode } from "react"

import type { ViewMode } from "@/domains/browser"
import type { PreviewConfig } from "@/features/browser/components/preview/types"

/**
 * Размер превью для элементов списка
 */
export interface PreviewSize {
  width: number
  height: number
}

/**
 * Базовый интерфейс для элементов списка
 */
export interface ListItem {
  id: string
  name: string
  [key: string]: any
}

/**
 * Группа элементов после группировки
 */
export interface GroupedItems<T> {
  title: string
  items: T[]
}

/**
 * Конфигурация фильтров
 */
export interface FilterConfig {
  searchQuery: string
  showFavoritesOnly: boolean
  filterType: string
}

/**
 * Конфигурация для импорта
 */
export interface ImportHandlers {
  importFile?: () => Promise<void>
  importFolder?: () => Promise<void>
  isImporting?: boolean
}

/**
 * Результат от хука данных
 */
export interface DataResult<T> {
  items: T[]
  loading: boolean
  error?: Error | null
}

/**
 * Пропсы для компонента превью
 */
export interface PreviewComponentProps<T> {
  item: T
  size: PreviewSize
  viewMode: ViewMode
  onClick?: (item: T) => void
  onDragStart?: (item: T, event: React.DragEvent) => void
  onAddToTimeline?: (item: T) => void
  isSelected?: boolean
  isFavorite?: boolean
  onToggleFavorite?: (item: T) => void
}

/**
 * Адаптер для работы с конкретным типом контента
 */
export interface ListAdapter<T extends ListItem> {
  /**
   * Хук для получения данных
   */
  useData: () => DataResult<T>

  /**
   * Компонент для отображения превью элемента
   */
  PreviewComponent: React.ComponentType<PreviewComponentProps<T>>

  /**
   * Функция для получения значения для сортировки
   */
  getSortValue: (item: T, sortBy: string) => string | number

  /**
   * Функция для получения текста для поиска
   */
  getSearchableText: (item: T) => string[]

  /**
   * Функция для получения значения для группировки
   */
  getGroupValue: (item: T, groupBy: string) => string

  /**
   * Функция для фильтрации по типу
   */
  matchesFilter?: (item: T, filterType: string) => boolean

  /**
   * Обработчики импорта
   */
  importHandlers?: ImportHandlers

  /**
   * Дополнительные кнопки для тулбара
   */
  extraToolbarButtons?: ReactNode

  /**
   * Кастомная функция для определения, является ли элемент избранным
   */
  isFavorite?: (item: T) => boolean

  /**
   * Тип элемента для системы избранного
   */
  favoriteType: string

  /**
   * Конфигурация для UniversalPreview (опционально)
   * Если указана, можно использовать UniversalPreview вместо кастомного PreviewComponent
   */
  previewConfig?: PreviewConfig<T>
}

/**
 * Пропсы для универсального компонента списка
 */
export interface UniversalListProps<T extends ListItem> {
  adapter: ListAdapter<T>
  onItemSelect?: (item: T) => void
  onItemDragStart?: (item: T, event: React.DragEvent) => void
  className?: string
}
