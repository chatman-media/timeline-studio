import { Palette } from "lucide-react"
import type React from "react"

import { useFavorites } from "@/core/hooks"
import { useFiltersAdapter as useUnifiedFiltersAdapter } from "@/features/browser/hooks/use-resources"
import { useDraggable } from "@/features/drag-drop"
import { FilterPreview } from "@/features/filters/components/filter-preview"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { PreviewConfig } from "../components/preview/types"
import type { ListAdapter, PreviewComponentProps } from "../types/list"

/**
 * Компонент превью для фильтров
 */
const FilterPreviewWrapper: React.FC<PreviewComponentProps<VideoFilter>> = ({
  item: filter,
  size,
  viewMode,
  onClick,
}) => {
  const handleClick = () => {
    onClick?.(filter)
  }

  // Используем DragDropManager для перетаскивания
  const dragProps = useDraggable(
    "filter",
    () => filter,
    () => ({
      url: `/filters/${filter.name}.png`, // Preview URL if available
      width: 120,
      height: 80,
    }),
  )

  // Для фильтров FilterPreview ожидает другие пропсы
  const previewSize = typeof size === "number" ? size : size.width
  const previewWidth = typeof size === "number" ? size : size.width
  const previewHeight = typeof size === "number" ? size : size.height

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50"
        onClick={handleClick}
        {...dragProps}
        data-oid="b.v3fei"
      >
        {/* Filter preview thumbnail */}
        <div className="shrink-0 w-12 h-9 bg-gray-200 rounded overflow-hidden" data-oid="4yfkgth">
          <video
            src="/t1.mp4"
            className="w-full h-full object-cover"
            style={{ filter: getFilterPreviewStyle(filter) }}
            muted
            playsInline
            preload="metadata"
            data-oid="-u:t5e."
          />
        </div>

        {/* Filter Info */}
        <div className="flex-1 min-w-0" data-oid="7_c5a8k">
          <div className="font-medium text-sm truncate" data-oid="csm9-6q">
            {filter.labels?.ru || filter.name}
          </div>
          <div className="text-xs text-muted-foreground truncate" data-oid="37z_3h.">
            {filter.description?.en || ""}
          </div>
        </div>

        {/* Category */}
        <div className="shrink-0 text-xs text-muted-foreground" data-oid="92jk03e">
          {filter.category}
        </div>

        {/* Complexity */}
        <div className="shrink-0 text-xs text-muted-foreground" data-oid="19kvkno">
          {filter.complexity}
        </div>
      </div>
    )
  }

  // Thumbnails mode - use the original FilterPreview component
  return (
    <div {...dragProps} data-oid="unybggm">
      <FilterPreview
        filter={filter}
        onClick={handleClick}
        size={previewSize}
        previewWidth={previewWidth}
        previewHeight={previewHeight}
        data-oid="lkwjb1l"
      />
    </div>
  )
}

/**
 * Функция для получения CSS-фильтра для превью
 */
function getFilterPreviewStyle(filter: VideoFilter): string {
  if (!filter.params) return ""

  const { brightness, contrast, saturation, hue, temperature, tint } = filter.params

  const filters = []

  if (brightness !== undefined) filters.push(`brightness(${Math.max(0, 1 + brightness)})`)
  if (contrast !== undefined) filters.push(`contrast(${Math.max(0, contrast)})`)
  if (saturation !== undefined) filters.push(`saturate(${Math.max(0, saturation)})`)
  if (hue !== undefined) filters.push(`hue-rotate(${hue}deg)`)

  // Простая эмуляция температуры
  if (temperature !== undefined) {
    const tempValue = Math.abs(temperature) * 0.01
    if (temperature > 0) {
      filters.push(`sepia(${Math.min(1, tempValue)})`)
    } else {
      filters.push(`hue-rotate(${temperature * 2}deg)`)
    }
  }

  if (tint !== undefined) filters.push(`hue-rotate(${tint}deg)`)

  return filters.join(" ")
}

/**
 * Хук для создания адаптера фильтров
 * Мигрирован на унифицированную систему browser-хуков
 */
export function useFiltersAdapter(): ListAdapter<VideoFilter> {
  const { isItemFavorite } = useFavorites()

  // Используем унифицированный адаптер с конфигурацией для фильтров
  const { items, loading, error, stats, ...restAdapter } = useUnifiedFiltersAdapter({
    PreviewComponent: FilterPreviewWrapper,
    customHandlers: {
      getSortValue: (filter: VideoFilter, sortBy: string) => {
        switch (sortBy) {
          case "name":
            return filter.name.toLowerCase()
          case "category":
            return filter.category.toLowerCase()
          case "complexity": {
            // Определяем порядок сложности: basic < intermediate < advanced
            const complexityOrder: Record<string, number> = {
              basic: 0,
              intermediate: 1,
              advanced: 2,
            }
            return complexityOrder[filter.complexity || "basic"]
          }
          default:
            return filter.name.toLowerCase()
        }
      },
      getSearchableText: (filter: VideoFilter) => {
        const texts = [
          filter.name,
          filter.labels?.ru || "",
          filter.labels?.en || "",
          filter.description?.en || "",
          filter.category,
          ...(filter.tags || []),
        ]

        return texts.filter(Boolean)
      },
      getGroupValue: (filter: VideoFilter, groupBy: string) => {
        switch (groupBy) {
          case "category":
            return filter.category || "other"
          case "complexity":
            return filter.complexity || "basic"
          case "tags":
            // Группируем по первому тегу или "untagged"
            return filter.tags && filter.tags.length > 0 ? filter.tags[0] : "untagged"
          default:
            return ""
        }
      },
      matchesFilter: (filter: VideoFilter, filterType: string) => {
        if (filterType === "all") return true

        // Фильтрация по сложности
        if (["basic", "intermediate", "advanced"].includes(filterType)) {
          return (filter.complexity || "basic") === filterType
        }

        // Фильтрация по категории
        if (["color-correction", "creative", "cinematic", "vintage", "technical", "artistic"].includes(filterType)) {
          return filter.category === filterType
        }

        return true
      },
    },
  })

  return {
    ...restAdapter,
    // Данные с правильной типизацией
    useData: () => ({
      items: items as VideoFilter[],
      loading,
      error: error ? new Error(error) : null,
    }),
    // Компонент превью
    PreviewComponent: FilterPreviewWrapper,
    // Проверка избранного (переопределяем)
    isFavorite: (filter: VideoFilter) => isItemFavorite(filter, "filter"),

    // Конфигурация для UniversalPreview
    previewConfig: {
      // Фильтры используют FilterPreview для thumbnail
      thumbnailUrl: (filter) => `/filters/${filter.name}.png`,

      // Aspect ratio
      aspectRatio: [16, 9],

      // Тип
      showType: true,
      getType: (filter) => filter.category,
      getTypeIcon: () => <Palette className="size-3" />,

      // Информация
      getTitle: (filter) => filter.labels?.ru || filter.name,
      getSubtitle: (filter) => filter.description?.en || "",
      getTags: (filter) => {
        const tags: string[] = []
        if (filter.category) tags.push(filter.category)
        if (filter.complexity) tags.push(filter.complexity)
        if (filter.tags) tags.push(...filter.tags)
        return tags
      },
      getMetadata: (filter) => {
        const metadata: Array<{ icon?: React.ReactNode; label: string }> = []
        if (filter.category) {
          metadata.push({ label: filter.category })
        }
        if (filter.complexity) {
          metadata.push({ label: filter.complexity })
        }
        return metadata
      },

      // Кнопки
      showFavoriteButton: true,
      showAddButton: true,
    } as PreviewConfig<VideoFilter>,
  }
}
