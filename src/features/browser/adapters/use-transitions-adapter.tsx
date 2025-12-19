import type React from "react"

import { useFavorites } from "@/core/hooks"
import type { MediaFile } from "@/domains/media-management"
import { useTransitionsAdapter as useUnifiedTransitionsAdapter } from "@/features/browser/hooks/use-resources"
import { useDraggable } from "@/features/drag-drop"
import { TransitionPreview } from "@/features/transitions/components/transition-preview"
import type { Transition } from "@/features/transitions/types/transitions"

import type { ListAdapter, ListItem, PreviewComponentProps } from "../types/list"

// Адаптер типа для Transition чтобы соответствовать ListItem
type TransitionListItem = Transition & ListItem

/**
 * Компонент превью для переходов
 */
const TransitionPreviewWrapper: React.FC<PreviewComponentProps<Transition>> = ({
  item: transition,
  size,
  viewMode,
  onClick,
}) => {
  const handleClick = () => {
    onClick?.(transition)
  }

  // Используем DragDropManager для перетаскивания
  const dragProps = useDraggable(
    "transition",
    () => transition,
    () => ({
      url: `/transitions/${transition.type}.png`, // Preview URL if available
      width: 120,
      height: 80,
    }),
  )

  // Демонстрационные видео для превью переходов
  // Статические файлы из public/, не используем convertVideoSrc
  const demoVideos = {
    source: {
      path: "/t1.mp4", // Статичный файл из public/, не нужен convertVideoSrc
    } as MediaFile,
    target: {
      path: "/t2.mp4", // Статичный файл из public/, не нужен convertVideoSrc
    } as MediaFile,
  }

  // Для переходов TransitionPreview ожидает другие пропсы
  const previewSize = typeof size === "number" ? size : size.width
  const previewWidth = typeof size === "number" ? size : size.width
  const previewHeight = typeof size === "number" ? size : size.height

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50"
        onClick={handleClick}
        {...dragProps}
        data-oid="17hlcl_"
      >
        {/* Transition preview thumbnail */}
        <div className="shrink-0 w-12 h-9 bg-gray-200 rounded overflow-hidden relative" data-oid="p4_sdph">
          <video
            src="/t1.mp4" // Статичный файл из public/, не нужен convertVideoSrc
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            data-oid="px7.xiz"
          />

          <div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-pulse"
            data-oid="s1s9c1-"
          />
        </div>

        {/* Transition Info */}
        <div className="flex-1 min-w-0" data-oid="4:jurmv">
          <div className="font-medium text-sm truncate" data-oid="6_d2tno">
            {transition.labels?.ru || transition.labels?.en || transition.name}
          </div>
          <div className="text-xs text-muted-foreground truncate" data-oid="g4_23sm">
            {transition.description?.ru || transition.description?.en || ""}
          </div>
        </div>

        {/* Category */}
        <div className="shrink-0 text-xs text-muted-foreground" data-oid="a95cmfi">
          {transition.category}
        </div>

        {/* Complexity */}
        <div className="shrink-0 text-xs text-muted-foreground" data-oid="l8d-chx">
          {transition.complexity}
        </div>

        {/* Duration */}
        <div className="shrink-0 text-xs text-muted-foreground" data-oid="avak:9u">
          {transition.duration?.default || "1"}s
        </div>
      </div>
    )
  }

  // Thumbnails mode - use the original TransitionPreview component
  return (
    <div {...dragProps} data-oid="zt:oh-2">
      <TransitionPreview
        transition={transition}
        sourceVideo={demoVideos.source}
        targetVideo={demoVideos.target}
        transitionType={transition.type}
        onClick={handleClick}
        size={previewSize}
        previewWidth={previewWidth}
        previewHeight={previewHeight}
        data-oid="0d1:9.1"
      />
    </div>
  )
}

/**
 * Хук для создания адаптера переходов
 * Мигрирован на унифицированную систему browser-хуков
 */
export function useTransitionsAdapter(): ListAdapter<TransitionListItem> {
  const { isItemFavorite } = useFavorites()

  // Используем унифицированный адаптер с конфигурацией для переходов
  const { items, loading, error, stats, ...restAdapter } = useUnifiedTransitionsAdapter({
    PreviewComponent: TransitionPreviewWrapper,
    customHandlers: {
      getSortValue: (transition: Transition, sortBy: string) => {
        switch (sortBy) {
          case "name":
            return (transition.labels?.ru || transition.labels?.en || transition.name || "").toLowerCase()
          case "category":
            return transition.category.toLowerCase()
          case "complexity": {
            // Определяем порядок сложности: basic < intermediate < advanced
            const complexityOrder: Record<string, number> = {
              basic: 0,
              intermediate: 1,
              advanced: 2,
            }
            return complexityOrder[transition.complexity || "basic"]
          }
          case "duration":
            return transition.duration?.default || 1
          case "type":
            return transition.type.toLowerCase()
          default:
            return (transition.labels?.ru || transition.labels?.en || transition.name || "").toLowerCase()
        }
      },
      getSearchableText: (transition: Transition) => {
        const texts = [
          transition.name || "",
          transition.labels?.ru || "",
          transition.labels?.en || "",
          transition.description?.ru || "",
          transition.description?.en || "",
          transition.category,
          transition.type,
          ...(transition.tags || []),
        ]

        return texts.filter(Boolean)
      },
      getGroupValue: (transition: Transition, groupBy: string) => {
        switch (groupBy) {
          case "category":
            return transition.category || "other"
          case "complexity":
            return transition.complexity || "basic"
          case "type":
            return transition.type || "unknown"
          case "tags":
            // Группируем по первому тегу или "untagged"
            return transition.tags && transition.tags.length > 0 ? transition.tags[0] : "untagged"
          case "duration": {
            const duration = transition.duration?.default || 1
            if (duration <= 1) return "Короткие (≤1с)"
            if (duration <= 3) return "Средние (1-3с)"
            return "Длинные (>3с)"
          }
          default:
            return ""
        }
      },
      matchesFilter: (transition: Transition, filterType: string) => {
        if (filterType === "all") return true

        // Фильтрация по сложности
        if (["basic", "intermediate", "advanced"].includes(filterType)) {
          return (transition.complexity || "basic") === filterType
        }

        // Фильтрация по категории
        if (["basic", "advanced", "creative", "3d", "artistic", "cinematic"].includes(filterType)) {
          return transition.category === filterType
        }

        return true
      },
    },
  })

  // Извлекаем только поля, соответствующие ListAdapter
  const listAdapter: ListAdapter<TransitionListItem> = {
    useData: () => ({
      items: items as TransitionListItem[],
      loading,
      error: error ? new Error(error) : null,
    }),
    PreviewComponent: TransitionPreviewWrapper as React.ComponentType<PreviewComponentProps<TransitionListItem>>,
    getSortValue: restAdapter.getSortValue,
    getSearchableText: restAdapter.getSearchableText,
    getGroupValue: restAdapter.getGroupValue,
    matchesFilter: restAdapter.matchesFilter,
    importHandlers: restAdapter.importHandlers,
    favoriteType: restAdapter.favoriteType,
    // Проверка избранного (переопределяем)
    isFavorite: (transition: TransitionListItem) => isItemFavorite(transition, "transition"),
  }

  return listAdapter
}
