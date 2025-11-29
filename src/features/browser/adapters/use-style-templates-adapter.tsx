import type React from "react"

import { useFavorites } from "@/core/hooks"
import { useStyleTemplatesAdapter as useUnifiedStyleTemplatesAdapter } from "@/features/browser/hooks/use-resources"
import { StyleTemplateDragSource } from "@/features/style-templates/components/style-template-drag-source"
import { StyleTemplatePreview } from "@/features/style-templates/components/style-template-preview"
import type { StyleTemplate } from "@/features/style-templates/types"

import type { ListAdapter, ListItem, PreviewComponentProps } from "../types/list"

// Адаптер типа для StyleTemplate чтобы соответствовать ListItem
type StyleTemplateListItem = StyleTemplate & ListItem

/**
 * Компонент превью для стилистических шаблонов
 */
const StyleTemplatePreviewWrapper: React.FC<PreviewComponentProps<StyleTemplate>> = ({
  item: template,
  size,
  viewMode,
  onClick,
  onAddToTimeline,
}) => {
  const handleClick = () => {
    onClick?.(template)
  }

  const handleSelect = (_templateId: string) => {
    // Template selected
    onAddToTimeline?.(template)
  }

  // Для стилистических шаблонов StyleTemplatePreview ожидает другие пропсы
  const previewSize = typeof size === "number" ? size : size.width
  const previewWidth = typeof size === "number" ? size : size.width
  const previewHeight = typeof size === "number" ? size : size.height

  if (viewMode === "list") {
    return (
      <StyleTemplateDragSource template={template}>
        <div
          className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50"
          onClick={handleClick}
        >
          {/* Template preview thumbnail */}
          <div className="shrink-0 w-16 h-9 bg-gray-100 rounded overflow-hidden relative">
            {template.thumbnail ? (
              <img
                src={template.thumbnail}
                alt={typeof template.name === "string" ? template.name : template.name.ru}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {(typeof template.name === "string" ? template.name : template.name.ru).substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}

            {/* Animation indicator */}
            {template.hasAnimation && <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />}
          </div>

          {/* Template Info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {typeof template.name === "string" ? template.name : template.name.ru}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {(typeof template.description === "string" ? template.description : template.description?.ru) ||
                `${template.category} • ${template.style}`}
            </div>
          </div>

          {/* Category */}
          <div className="shrink-0 text-xs text-muted-foreground">{template.category}</div>

          {/* Style */}
          <div className="shrink-0 text-xs text-muted-foreground">{template.style}</div>

          {/* Duration */}
          <div className="shrink-0 text-xs text-muted-foreground">{template.duration}s</div>

          {/* Features */}
          <div className="shrink-0 flex gap-1">
            {template.hasText && <div className="w-2 h-2 bg-blue-500 rounded-full" title="Содержит текст" />}
            {template.hasAnimation && <div className="w-2 h-2 bg-green-500 rounded-full" title="Содержит анимацию" />}
          </div>
        </div>
      </StyleTemplateDragSource>
    )
  }

  // Thumbnails mode - use the original StyleTemplatePreview component
  return (
    <StyleTemplateDragSource template={template}>
      <StyleTemplatePreview
        template={template}
        size={previewSize}
        onSelect={handleSelect}
        previewWidth={previewWidth}
        previewHeight={previewHeight}
      />
    </StyleTemplateDragSource>
  )
}

/**
 * Хук для создания адаптера стилистических шаблонов
 * Мигрирован на унифицированную систему browser-хуков
 */
export function useStyleTemplatesAdapter(): ListAdapter<StyleTemplateListItem> {
  const { isItemFavorite } = useFavorites()

  // Используем унифицированный адаптер с конфигурацией для стилистических шаблонов
  const { items, loading, error, stats, ...restAdapter } = useUnifiedStyleTemplatesAdapter({
    PreviewComponent: StyleTemplatePreviewWrapper,
    customHandlers: {
      getSortValue: (template: StyleTemplate, sortBy: string) => {
        switch (sortBy) {
          case "name":
            return (typeof template.name === "string" ? template.name : template.name.ru).toLowerCase()
          case "category":
            return template.category.toLowerCase()
          case "style":
            return template.style.toLowerCase()
          case "duration":
            return template.duration
          case "aspectRatio":
            return template.aspectRatio
          default:
            return (typeof template.name === "string" ? template.name : template.name.ru).toLowerCase()
        }
      },
      getSearchableText: (template: StyleTemplate) => {
        const texts: string[] = [
          typeof template.name === "string" ? template.name : template.name.ru,
          typeof template.name === "string" ? "" : template.name.en,
          typeof template.description === "string" ? template.description : template.description?.ru || "",
          typeof template.description === "string" ? "" : template.description?.en || "",
          template.category,
          template.style,
          template.aspectRatio,
          ...(Array.isArray(template.tags) ? template.tags : template.tags?.ru || []),
          ...(Array.isArray(template.tags) ? [] : template.tags?.en || []),
        ]
        return texts.filter(Boolean)
      },
      getGroupValue: (template: StyleTemplate, groupBy: string) => {
        switch (groupBy) {
          case "category":
            return template.category || "other"
          case "style":
            return template.style || "other"
          case "aspectRatio":
            return template.aspectRatio || "16:9"
          case "duration":
            if (template.duration <= 3) return "Короткие (≤3с)"
            if (template.duration <= 10) return "Средние (3-10с)"
            return "Длинные (>10с)"
          case "features":
            if (template.hasText && template.hasAnimation) return "Текст + анимация"
            if (template.hasText) return "С текстом"
            if (template.hasAnimation) return "С анимацией"
            return "Базовые"
          default:
            return ""
        }
      },
      matchesFilter: (template: StyleTemplate, filterType: string) => {
        if (filterType === "all") return true

        // Фильтрация по категории
        if (["intro", "outro", "lower-third", "title", "transition", "overlay"].includes(filterType)) {
          return template.category === filterType
        }

        // Фильтрация по стилю
        if (["modern", "vintage", "minimal", "corporate", "creative", "cinematic"].includes(filterType)) {
          return template.style === filterType
        }

        // Фильтрация по соотношению сторон
        if (["16:9", "9:16", "1:1"].includes(filterType)) {
          return template.aspectRatio === filterType
        }

        // Фильтрация по наличию текста
        if (filterType === "hasText") {
          return template.hasText
        }

        // Фильтрация по наличию анимации
        if (filterType === "hasAnimation") {
          return template.hasAnimation
        }

        return true
      },
    },
  })

  // Извлекаем только поля, соответствующие ListAdapter
  const listAdapter: ListAdapter<StyleTemplateListItem> = {
    useData: () => ({
      items: items as StyleTemplateListItem[],
      loading,
      error: error ? new Error(error) : null,
    }),
    PreviewComponent: StyleTemplatePreviewWrapper as unknown as React.ComponentType<
      PreviewComponentProps<StyleTemplateListItem>
    >,
    getSortValue: restAdapter.getSortValue,
    getSearchableText: restAdapter.getSearchableText,
    getGroupValue: restAdapter.getGroupValue,
    matchesFilter: restAdapter.matchesFilter,
    importHandlers: restAdapter.importHandlers,
    favoriteType: restAdapter.favoriteType,
    // Проверка избранного (переопределяем)
    isFavorite: (template: StyleTemplateListItem) =>
      isItemFavorite(
        {
          id: template.id,
          path: "",
          name: typeof template.name === "string" ? template.name : (template.name as any).ru,
        },
        "template",
      ),
  }

  return listAdapter
}
