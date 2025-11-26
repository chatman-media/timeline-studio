import type React from "react"

import { useFavorites } from "@/features/app-state"
import { SubtitlePreview } from "@/features/subtitles/components/subtitle-preview"
import { useSubtitles } from "@/features/subtitles/hooks/use-subtitle-styles"
import type { SubtitleStyleTemplate } from "@/features/subtitles/types/subtitles"

import type { ListAdapter, ListItem, PreviewComponentProps } from "../types/list"

// Адаптер типа для SubtitleStyleTemplate чтобы соответствовать ListItem
type SubtitleListItem = SubtitleStyleTemplate & ListItem

/**
 * Компонент превью для стилей субтитров
 */
const SubtitlePreviewWrapper: React.FC<PreviewComponentProps<SubtitleStyleTemplate>> = ({
  item: style,
  size,
  viewMode,
  onClick,
  onDragStart,
}) => {
  const handleClick = () => {
    onClick?.(style)
  }

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart?.(style, e)
  }

  // Для стилей субтитров SubtitlePreview ожидает другие пропсы
  const previewSize = typeof size === "number" ? size : size.width
  const previewWidth = typeof size === "number" ? size : size.width
  const previewHeight = typeof size === "number" ? size : size.height

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50"
        onClick={handleClick}
        onDragStart={handleDragStart}
        draggable
      >
        {/* Subtitle preview sample */}
        <div className="shrink-0 w-16 h-9 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
          <span
            className="text-xs text-center"
            style={{
              fontFamily: style.style.fontFamily || "inherit",
              fontSize: "8px",
              fontWeight: style.style.fontWeight || "normal",
              color: style.style.color || "#000",
              textShadow: style.style.textShadow || "none",
            }}
          >
            Abc
          </span>
        </div>

        {/* Style Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{style.labels?.ru || style.labels?.en || style.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {style.description?.ru || style.description?.en || ""}
          </div>
        </div>

        {/* Category */}
        <div className="shrink-0 text-xs text-muted-foreground">{style.category}</div>

        {/* Complexity */}
        <div className="shrink-0 text-xs text-muted-foreground">{style.complexity}</div>

        {/* Font Family */}
        <div className="shrink-0 text-xs text-muted-foreground">{style.style.fontFamily || "default"}</div>
      </div>
    )
  }

  // Thumbnails mode - use the original SubtitlePreview component
  return (
    <div onDragStart={handleDragStart} draggable>
      <SubtitlePreview
        style={style}
        onClick={handleClick}
        size={previewSize}
        previewWidth={previewWidth}
        previewHeight={previewHeight}
      />
    </div>
  )
}

/**
 * Хук для создания адаптера стилей субтитров
 */
export function useSubtitlesAdapter(): ListAdapter<SubtitleListItem> {
  const { subtitles, loading, error } = useSubtitles()
  const { isItemFavorite } = useFavorites()

  return {
    // Хук для получения данных
    useData: () => ({
      items: subtitles,
      loading,
      error: error ? new Error(error) : null,
    }),

    // Компонент превью
    PreviewComponent: SubtitlePreviewWrapper,

    // Функция для получения значения сортировки
    getSortValue: (style, sortBy) => {
      switch (sortBy) {
        case "name":
          return (style.labels?.ru || style.labels?.en || style.name).toLowerCase()

        case "category":
          return style.category.toLowerCase()

        case "complexity": {
          // Определяем порядок сложности: basic < intermediate < advanced
          const complexityOrder = { basic: 0, intermediate: 1, advanced: 2 }
          return complexityOrder[style.complexity || "basic"]
        }

        case "font":
          return (style.style.fontFamily || "default").toLowerCase()

        default:
          return (style.labels?.ru || style.labels?.en || style.name).toLowerCase()
      }
    },

    // Функция для получения текста для поиска
    getSearchableText: (style) => {
      const texts = [
        style.name,
        style.labels?.ru || "",
        style.labels?.en || "",
        style.description?.ru || "",
        style.description?.en || "",
        style.category,
        style.style.fontFamily || "",
        ...(style.tags || []),
      ]
      return texts.filter(Boolean)
    },

    // Функция для получения значения группировки
    getGroupValue: (style, groupBy) => {
      switch (groupBy) {
        case "category":
          return style.category || "other"

        case "complexity":
          return style.complexity || "basic"

        case "font":
          return style.style.fontFamily || "default"

        case "tags":
          // Группируем по первому тегу или "untagged"
          return style.tags && style.tags.length > 0 ? style.tags[0] : "untagged"

        default:
          return ""
      }
    },

    // Функция для фильтрации по типу
    matchesFilter: (style, filterType) => {
      if (filterType === "all") return true

      // Фильтрация по сложности
      if (["basic", "intermediate", "advanced"].includes(filterType)) {
        return (style.complexity || "basic") === filterType
      }

      // Фильтрация по категории
      if (["basic", "cinematic", "stylized", "minimal", "animated", "modern"].includes(filterType)) {
        return style.category === filterType
      }

      return true
    },

    // Обработчики импорта не нужны для стилей субтитров (они встроенные)
    importHandlers: undefined,

    // Проверка избранного
    isFavorite: (style) => isItemFavorite(style, "subtitle"),

    // Тип для системы избранного
    favoriteType: "subtitle",
  }
}
