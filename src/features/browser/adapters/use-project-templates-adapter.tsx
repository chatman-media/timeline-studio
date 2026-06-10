import { useFavorites } from "@timeline-studio/core/hooks"
import type React from "react"
import { useMemo } from "react"
import { allProjectTemplates } from "@/features/project-templates"
import type { ProjectTemplate } from "@/features/project-templates/types"

import type { ListAdapter, ListItem, PreviewComponentProps } from "../types/list"

// Адаптер типа для ProjectTemplate чтобы соответствовать ListItem
type ProjectTemplateListItem = ProjectTemplate & ListItem

/**
 * Компонент превью для шаблонов проектов
 */
const ProjectTemplatePreviewWrapper: React.FC<PreviewComponentProps<ProjectTemplate>> = ({
  item: template,
  viewMode,
  onClick,
}) => {
  const handleClick = () => {
    onClick?.(template)
  }

  // Определяем категории и платформы для отображения
  const categoryLabel = {
    youtube: "YouTube",
    social: "Social Media",
    podcast: "Podcast",
    tutorial: "Tutorial",
    commercial: "Commercial",
    presentation: "Presentation",
  }[template.category]

  const platformLabel = template.targetPlatform
    ? {
        youtube: "YouTube",
        instagram: "Instagram",
        tiktok: "TikTok",
        facebook: "Facebook",
        twitter: "Twitter",
        custom: "Custom",
      }[template.targetPlatform]
    : "Any"

  // Форматирование длительности
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50"
        onClick={handleClick}
        data-oid="o4t06h4"
      >
        {/* Template preview thumbnail */}
        <div
          className="shrink-0 w-16 h-9 bg-linear-to-br from-blue-500 to-purple-600 rounded overflow-hidden relative flex items-center justify-center"
          data-oid="x:lxncc"
        >
          {template.thumbnail ? (
            <img
              src={template.thumbnail}
              alt={template.name.ru}
              className="w-full h-full object-cover"
              data-oid="jqzvrr0"
            />
          ) : (
            <div className="text-white text-xs font-bold" data-oid="1i15:2k">
              {template.aspectRatio}
            </div>
          )}

          {/* Aspect ratio badge */}
          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded" data-oid=".x5jqpj">
            {template.aspectRatio}
          </div>
        </div>

        {/* Template Info */}
        <div className="flex-1 min-w-0" data-oid="adnew-v">
          <div className="font-medium text-sm truncate" data-oid="1djoaar">
            {template.name.ru}
          </div>
          <div className="text-xs text-muted-foreground truncate" data-oid="1armd93">
            {template.description?.ru || categoryLabel}
          </div>
        </div>

        {/* Category */}
        <div className="shrink-0 text-xs text-muted-foreground" data-oid="cux-b4p">
          {categoryLabel}
        </div>

        {/* Platform */}
        <div className="shrink-0 text-xs text-muted-foreground" data-oid="m-xxfdu">
          {platformLabel}
        </div>

        {/* Duration */}
        <div className="shrink-0 text-xs text-muted-foreground" data-oid="9sz79gx">
          {formatDuration(template.estimatedDuration)}
        </div>

        {/* Sections count */}
        <div className="shrink-0 text-xs text-muted-foreground" data-oid="wdw6qlu">
          {template.structure.sections.length} sections
        </div>
      </div>
    )
  }

  // Thumbnails mode - card view
  return (
    <div
      className="group cursor-pointer rounded-lg border overflow-hidden transition-all hover:border-primary hover:shadow-md"
      onClick={handleClick}
      data-oid="5tycisz"
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-video bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center"
        data-oid="37c5my-"
      >
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name.ru}
            className="w-full h-full object-cover"
            data-oid="oo4b4_e"
          />
        ) : (
          <div className="text-white text-2xl font-bold" data-oid="ebk4b1h">
            {template.aspectRatio}
          </div>
        )}

        {/* Aspect ratio badge */}
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded" data-oid="qcqcuta">
          {template.aspectRatio}
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded" data-oid="2nye65h">
          {formatDuration(template.estimatedDuration)}
        </div>
      </div>

      {/* Info */}
      <div className="p-3" data-oid="pnj3fa1">
        <div className="font-medium text-sm mb-1 truncate" data-oid="yn2ol4g">
          {template.name.ru}
        </div>
        <div className="text-xs text-muted-foreground mb-2 line-clamp-2" data-oid="d9pn5ib">
          {template.description?.ru || categoryLabel}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1" data-oid="8-8a488">
          <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded" data-oid="g-gg.1.">
            {categoryLabel}
          </span>
          <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded" data-oid=".no8.pl">
            {platformLabel}
          </span>
          <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded" data-oid="plajov.">
            {template.structure.sections.length} частей
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Хук для создания адаптера шаблонов проектов
 */
export function useProjectTemplatesAdapter(): ListAdapter<ProjectTemplateListItem> {
  const { isItemFavorite } = useFavorites()

  const listAdapter: ListAdapter<ProjectTemplateListItem> = useMemo(
    () => ({
      // Хук для получения данных
      useData: () => ({
        items: allProjectTemplates as ProjectTemplateListItem[],
        loading: false,
        error: null,
      }),

      // Компонент превью
      PreviewComponent: ProjectTemplatePreviewWrapper as unknown as React.ComponentType<
        PreviewComponentProps<ProjectTemplateListItem>
      >,

      // Функция для получения значения сортировки
      getSortValue: (template, sortBy) => {
        switch (sortBy) {
          case "name":
            return template.name.ru.toLowerCase()

          case "category":
            return template.category.toLowerCase()

          case "platform":
            return (template.targetPlatform || "custom").toLowerCase()

          case "duration":
            return template.estimatedDuration

          case "aspectRatio":
            return template.aspectRatio

          case "sections":
            return template.structure.sections.length

          default:
            return template.name.ru.toLowerCase()
        }
      },

      // Функция для получения текста для поиска
      getSearchableText: (template) => {
        const texts: string[] = [
          template.name.ru,
          template.name.en,
          template.description?.ru || "",
          template.description?.en || "",
          template.category,
          template.targetPlatform || "",
          template.aspectRatio,
          ...(template.tags?.ru || []),
          ...(template.tags?.en || []),
        ]

        return texts.filter(Boolean)
      },

      // Функция для получения значения группировки
      getGroupValue: (template, groupBy) => {
        switch (groupBy) {
          case "category":
            return {
              youtube: "YouTube",
              social: "Social Media",
              podcast: "Podcast",
              tutorial: "Tutorial",
              commercial: "Commercial",
              presentation: "Presentation",
            }[template.category]

          case "platform":
            if (!template.targetPlatform || template.targetPlatform === "custom") return "Any Platform"
            return (
              {
                youtube: "YouTube",
                instagram: "Instagram",
                tiktok: "TikTok",
                facebook: "Facebook",
                twitter: "Twitter",
              }[template.targetPlatform] || "Other"
            )

          case "aspectRatio":
            return template.aspectRatio

          case "duration":
            const duration = template.estimatedDuration
            if (duration <= 60) return "Короткие (≤1 мин)"
            if (duration <= 300) return "Средние (1-5 мин)"
            if (duration <= 600) return "До 10 мин"
            if (duration <= 1800) return "До 30 мин"
            if (duration <= 3600) return "До 1 часа"
            return "Длинные (>1 часа)"

          default:
            return ""
        }
      },

      // Функция для фильтрации по типу
      matchesFilter: (template, filterType) => {
        if (filterType === "all") return true

        // Фильтрация по категории
        if (["youtube", "social", "podcast", "tutorial", "commercial", "presentation"].includes(filterType)) {
          return template.category === filterType
        }

        // Фильтрация по платформе
        if (["youtube-platform", "instagram", "tiktok", "facebook", "twitter"].includes(filterType)) {
          const platform = filterType.replace("-platform", "")
          return template.targetPlatform === platform
        }

        // Фильтрация по соотношению сторон
        if (["16:9", "9:16", "1:1", "4:3"].includes(filterType)) {
          return template.aspectRatio === filterType
        }

        // Фильтрация по длительности
        if (filterType.startsWith("duration-")) {
          const duration = template.estimatedDuration
          const type = filterType.replace("duration-", "")

          if (type === "short") return duration <= 60
          if (type === "medium") return duration > 60 && duration <= 600
          if (type === "long") return duration > 600
        }

        return true
      },

      // Обработчики импорта не нужны для шаблонов (они встроенные)
      importHandlers: undefined,

      // Проверка избранного
      isFavorite: (template) =>
        isItemFavorite(
          {
            id: template.id,
            path: "",
            name: template.name.ru,
          },
          "template",
        ),

      // Тип для системы избранного
      favoriteType: "template",
    }),
    [isItemFavorite],
  )

  return listAdapter
}
