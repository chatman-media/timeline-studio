import { Type } from "lucide-react"
import type React from "react"

import { useFavorites } from "@/core/hooks"
import { SubtitlePreview } from "@/features/subtitles/components/subtitle-preview"
import { useSubtitles } from "@/features/subtitles/hooks/use-subtitle-styles"
import type { SubtitleStyleTemplate } from "@/features/subtitles/types/subtitles"
import type { PreviewConfig } from "../components/preview/types"
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
        data-oid="-dr23hy"
      >
        {/* Subtitle preview sample */}
        <div
          className="shrink-0 w-16 h-9 bg-gray-100 rounded overflow-hidden flex items-center justify-center"
          data-oid="uvni9im"
        >
          <span
            className="text-xs text-center"
            style={{
              fontFamily: style.style.fontFamily || "inherit",
              fontSize: "8px",
              fontWeight: style.style.fontWeight || "normal",
              color: style.style.color || "#000",
              textShadow: style.style.textShadow || "none",
            }}
            data-oid="ds-tgyf"
          >
            Abc
          </span>
        </div>

        {/* Style Info */}
        <div className="flex-1 min-w-0" data-oid="dt7942o">
          <div className="font-medium text-sm truncate" data-oid="9.epp8_">
            {style.labels?.ru || style.labels?.en || style.name}
          </div>
          <div className="text-xs text-muted-foreground truncate" data-oid=".afs:4v">
            {style.description?.ru || style.description?.en || ""}
          </div>
        </div>

        {/* Category */}
        <div className="shrink-0 text-xs text-muted-foreground" data-oid="-bh.e_3">
          {style.category}
        </div>

        {/* Complexity */}
        <div className="shrink-0 text-xs text-muted-foreground" data-oid="wb3w54.">
          {style.complexity}
        </div>

        {/* Font Family */}
        <div className="shrink-0 text-xs text-muted-foreground" data-oid="ct1x22t">
          {style.style.fontFamily || "default"}
        </div>
      </div>
    )
  }

  // Thumbnails mode - use the original SubtitlePreview component
  return (
    <div onDragStart={handleDragStart} draggable data-oid="atr61_w">
      <SubtitlePreview
        style={style}
        onClick={handleClick}
        size={previewSize}
        previewWidth={previewWidth}
        previewHeight={previewHeight}
        data-oid="odvei_6"
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

    // Конфигурация для UniversalPreview
    previewConfig: {
      // Субтитры не имеют thumbnail
      thumbnailUrl: undefined,

      // Тип
      showType: true,
      getType: () => "subtitle",
      getTypeIcon: () => <Type className="size-3" />,

      // Информация
      getTitle: (style) => style.labels?.ru || style.labels?.en || style.name,
      getSubtitle: (style) => style.description?.ru || style.description?.en || "",
      getTags: (style) => {
        const tags: string[] = []
        if (style.category) tags.push(style.category)
        if (style.complexity) tags.push(style.complexity)
        if (style.style.fontFamily) tags.push(style.style.fontFamily)
        return tags
      },
      getMetadata: (style) => {
        const metadata: Array<{ icon?: React.ReactNode; label: string }> = []
        if (style.category) {
          metadata.push({ label: style.category })
        }
        if (style.complexity) {
          metadata.push({ label: style.complexity })
        }
        return metadata
      },

      // Кнопки
      showFavoriteButton: true,
      showAddButton: false, // Субтитры применяются, а не добавляются
    } as PreviewConfig<SubtitleListItem>,
  }
}
