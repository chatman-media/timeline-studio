import type React from "react";

import { useFavorites } from "@/features/app-state";
import { useTransitionsAdapter as useUnifiedTransitionsAdapter } from "@/features/browser/hooks/use-resources";
import { useDraggable } from "@/features/drag-drop";
import type { MediaFile } from "@/features/media/types/media";
import { TransitionPreview } from "@/features/transitions/components/transition-preview";
import type { Transition } from "@/features/transitions/types/transitions";
import { convertVideoSrc } from "@/lib/tauri-utils";

import type {
  ListAdapter,
  ListItem,
  PreviewComponentProps,
} from "../types/list";

// Адаптер типа для Transition чтобы соответствовать ListItem
type TransitionListItem = Transition & ListItem;

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
    onClick?.(transition);
  };

  // Используем DragDropManager для перетаскивания
  const dragProps = useDraggable(
    "transition",
    () => transition,
    () => ({
      url: `/transitions/${transition.type}.png`, // Preview URL if available
      width: 120,
      height: 80,
    }),
  );

  // Демонстрационные видео для превью переходов
  // В development режиме используем прямые пути, в production - через public
  const demoVideos = {
    source: {
      path: window.location.hostname === "localhost" ? "/t1.mp4" : "./t1.mp4",
    } as MediaFile,
    target: {
      path: window.location.hostname === "localhost" ? "/t2.mp4" : "./t2.mp4",
    } as MediaFile,
  };

  // Для переходов TransitionPreview ожидает другие пропсы
  const previewSize = typeof size === "number" ? size : size.width;
  const previewWidth = typeof size === "number" ? size : size.width;
  const previewHeight = typeof size === "number" ? size : size.height;

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50"
        onClick={handleClick}
        {...dragProps}
      >
        {/* Transition preview thumbnail */}
        <div className="shrink-0 w-12 h-9 bg-gray-200 rounded overflow-hidden relative">
          <video
            src={convertVideoSrc(
              window.location.hostname === "localhost" ? "/t1.mp4" : "./t1.mp4",
            )}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        </div>

        {/* Transition Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {transition.labels?.ru || transition.labels?.en || transition.name}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {transition.description?.ru || transition.description?.en || ""}
          </div>
        </div>

        {/* Category */}
        <div className="shrink-0 text-xs text-muted-foreground">
          {transition.category}
        </div>

        {/* Complexity */}
        <div className="shrink-0 text-xs text-muted-foreground">
          {transition.complexity}
        </div>

        {/* Duration */}
        <div className="shrink-0 text-xs text-muted-foreground">
          {transition.duration?.default || "1"}s
        </div>
      </div>
    );
  }

  // Thumbnails mode - use the original TransitionPreview component
  return (
    <div {...dragProps}>
      <TransitionPreview
        transition={transition}
        sourceVideo={demoVideos.source}
        targetVideo={demoVideos.target}
        transitionType={transition.type}
        onClick={handleClick}
        size={previewSize}
        previewWidth={previewWidth}
        previewHeight={previewHeight}
      />
    </div>
  );
};

/**
 * Хук для создания адаптера переходов
 * Мигрирован на унифицированную систему browser-хуков
 */
export function useTransitionsAdapter(): ListAdapter<TransitionListItem> {
  const { isItemFavorite } = useFavorites();

  // Используем унифицированный адаптер с конфигурацией для переходов
  const { items, loading, error, stats, ...restAdapter } =
    useUnifiedTransitionsAdapter({
      PreviewComponent: TransitionPreviewWrapper,
      customHandlers: {
        getSortValue: (transition: Transition, sortBy: string) => {
          switch (sortBy) {
            case "name":
              return (
                transition.labels?.ru ||
                transition.labels?.en ||
                transition.name ||
                ""
              ).toLowerCase();
            case "category":
              return transition.category.toLowerCase();
            case "complexity": {
              // Определяем порядок сложности: basic < intermediate < advanced
              const complexityOrder: Record<string, number> = {
                basic: 0,
                intermediate: 1,
                advanced: 2,
              };
              return complexityOrder[transition.complexity || "basic"];
            }
            case "duration":
              return transition.duration?.default || 1;
            case "type":
              return transition.type.toLowerCase();
            default:
              return (
                transition.labels?.ru ||
                transition.labels?.en ||
                transition.name ||
                ""
              ).toLowerCase();
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
          ];
          return texts.filter(Boolean);
        },
        getGroupValue: (transition: Transition, groupBy: string) => {
          switch (groupBy) {
            case "category":
              return transition.category || "other";
            case "complexity":
              return transition.complexity || "basic";
            case "type":
              return transition.type || "unknown";
            case "tags":
              // Группируем по первому тегу или "untagged"
              return transition.tags && transition.tags.length > 0
                ? transition.tags[0]
                : "untagged";
            case "duration": {
              const duration = transition.duration?.default || 1;
              if (duration <= 1) return "Короткие (≤1с)";
              if (duration <= 3) return "Средние (1-3с)";
              return "Длинные (>3с)";
            }
            default:
              return "";
          }
        },
        matchesFilter: (transition: Transition, filterType: string) => {
          if (filterType === "all") return true;

          // Фильтрация по сложности
          if (["basic", "intermediate", "advanced"].includes(filterType)) {
            return (transition.complexity || "basic") === filterType;
          }

          // Фильтрация по категории
          if (
            [
              "basic",
              "advanced",
              "creative",
              "3d",
              "artistic",
              "cinematic",
            ].includes(filterType)
          ) {
            return transition.category === filterType;
          }

          return true;
        },
      },
    });

  // Извлекаем только поля, соответствующие ListAdapter
  const listAdapter: ListAdapter<TransitionListItem> = {
    useData: () => ({
      items: items as TransitionListItem[],
      loading,
      error: error ? new Error(error) : null,
    }),
    PreviewComponent: TransitionPreviewWrapper as React.ComponentType<
      PreviewComponentProps<TransitionListItem>
    >,
    getSortValue: restAdapter.getSortValue,
    getSearchableText: restAdapter.getSearchableText,
    getGroupValue: restAdapter.getGroupValue,
    matchesFilter: restAdapter.matchesFilter,
    importHandlers: restAdapter.importHandlers,
    favoriteType: restAdapter.favoriteType,
    // Проверка избранного (переопределяем)
    isFavorite: (transition: TransitionListItem) =>
      isItemFavorite(transition, "transition"),
  };

  return listAdapter;
}
