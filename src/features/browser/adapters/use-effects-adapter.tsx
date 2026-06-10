import { Sparkles } from "lucide-react"
import type React from "react"
import { useTranslation } from "react-i18next"

import { useFavorites } from "@timeline-studio/core/hooks"
import { calculateDimensionsWithAspectRatio } from "@timeline-studio/core/utils/preview-sizes"
import { useEffectsAdapter as useUnifiedEffectsAdapter } from "@/features/browser/hooks/use-resources"
import { useDraggable } from "@/features/drag-drop"
import { EffectPreview } from "@/features/effects/components/effect-preview"
import type { BaseEffect } from "@/features/effects/types"
import { useProjectSettings } from "@/features/project-settings/hooks/use-project-settings"
import { cn } from "@/lib/utils"
import type { PreviewConfig } from "../components/preview/types"
import type { ListAdapter, ListItem, PreviewComponentProps } from "../types/list"

// Адаптер типа для BaseEffect чтобы соответствовать ListItem
type EffectListItem = BaseEffect & ListItem

/**
 * Компонент превью для эффектов
 * Использует пропорции проекта для корректного отображения
 */
const EffectPreviewWrapper: React.FC<PreviewComponentProps<BaseEffect>> = ({
  item: effect,
  size,
  viewMode,
  onClick,
}) => {
  const { i18n } = useTranslation()
  const { settings } = useProjectSettings()

  // Получаем пропорции из настроек проекта
  const projectAspectRatio = settings?.aspectRatio?.value
  const aspectWidth = projectAspectRatio?.width ?? 16
  const aspectHeight = projectAspectRatio?.height ?? 9

  const handleClick = () => {
    onClick?.(effect)
  }

  // Используем DragDropManager для перетаскивания
  const dragProps = useDraggable(
    "effect",
    () => effect,
    () => ({
      url: `/effects/${effect.id}.png`,
      width: 120,
      height: 80,
    }),
  )

  // Рассчитываем размеры с учётом пропорций проекта
  const previewSize = typeof size === "number" ? size : size.width
  // size применяется к длинному краю (ширина для 16:9, высота для 9:16)
  // Минимум 100px применяется к длинному краю
  const { width: previewWidth, height: previewHeight } = calculateDimensionsWithAspectRatio(
    previewSize,
    { width: aspectWidth, height: aspectHeight },
    true, // минимум 100px
  )

  // Вычисляем размеры для list view thumbnail с учетом пропорций проекта
  const { width: listThumbWidth, height: listThumbHeight } = calculateDimensionsWithAspectRatio(
    64, // базовый размер для list view (длинный край)
    { width: aspectWidth, height: aspectHeight },
    false, // без минимума для маленьких thumbnails
  )

  // Получаем локализованное имя
  const effectName = effect.name?.ru || effect.name?.[i18n.language] || effect.name?.en || effect.id

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer w-full"
        onClick={handleClick}
        {...dragProps}
        data-oid="gwtgevm"
      >
        {/* Effect Preview - с учётом пропорций проекта */}
        <div className="shrink-0 rounded overflow-hidden bg-muted" data-oid="kgc_4td">
          <EffectPreview
            effect={effect}
            onClick={handleClick}
            size={listThumbHeight}
            width={listThumbWidth}
            height={listThumbHeight}
            data-oid="qz.jont"
          />
        </div>

        {/* Effect Info */}
        <div className="flex-1 min-w-0" data-oid="3g-nf4y">
          <div className="font-medium text-sm truncate" data-oid="-s84lsw">
            {effectName}
          </div>
          <div className="text-xs text-muted-foreground truncate" data-oid="z-.7crr">
            {effect.description?.ru || effect.description?.[i18n.language] || effect.description?.en || ""}
          </div>
        </div>

        {/* Category & Complexity badges */}
        <div className="shrink-0 flex gap-1.5" data-oid="h3p2p6h">
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{effect.category}</span>
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              effect.complexity === "low" && "bg-green-500/20 text-green-600",
              effect.complexity === "medium" && "bg-yellow-500/20 text-yellow-600",
              effect.complexity === "high" && "bg-red-500/20 text-red-600",
              effect.complexity === "extreme" && "bg-purple-500/20 text-purple-600",
            )}
          >
            {effect.complexity}
          </span>
        </div>
      </div>
    )
  }

  // Grid/Thumbnails mode - с учётом пропорций проекта
  return (
    <div {...dragProps} data-oid="6wk50rm">
      {/* Effect Preview с пропорциями проекта */}
      <EffectPreview
        effect={effect}
        onClick={handleClick}
        size={previewHeight}
        width={previewWidth}
        height={previewHeight}
        data-oid=":5cmqbj"
      />
    </div>
  )
}

/**
 * Хук для создания адаптера эффектов
 * Мигрирован на унифицированную систему browser-хуков
 */
export function useEffectsAdapter(): ListAdapter<EffectListItem> {
  const { isItemFavorite } = useFavorites()

  // Используем унифицированный адаптер с конфигурацией для эффектов
  const adapter = useUnifiedEffectsAdapter({
    PreviewComponent: EffectPreviewWrapper,
    customHandlers: {
      getSortValue: (effect: BaseEffect, sortBy: string) => {
        switch (sortBy) {
          case "name":
            // effect.name - это объект с локализацией, используем английскую версию
            return (effect.name?.en || effect.name?.ru || "").toLowerCase()
          case "category":
            return effect.category.toLowerCase()
          case "complexity": {
            // Определяем порядок сложности: basic < intermediate < advanced
            const complexityOrder: Record<string, number> = {
              low: 0,
              medium: 1,
              high: 2,
              extreme: 3,
            }
            return complexityOrder[effect.complexity || "low"]
          }
          case "processingType":
            return effect.processingType
          default:
            return (effect.name?.en || effect.name?.ru || "").toLowerCase()
        }
      },
      getSearchableText: (effect: BaseEffect) => {
        const texts = [
          effect.name?.ru || "",
          effect.name?.en || "",
          // labels removed - not in BaseEffect
          effect.description?.ru || "",
          effect.description?.en || "",
          effect.category,
          effect.processingType,
          ...(effect.tags || []),
        ]

        return texts.filter(Boolean)
      },
      getGroupValue: (effect: BaseEffect, groupBy: string) => {
        switch (groupBy) {
          case "category":
            return effect.category || "other"
          case "complexity":
            return effect.complexity || "basic"
          case "processingType":
            return effect.processingType || "render"
          case "tags":
            // Группируем по первому тегу или "untagged"
            return effect.tags && effect.tags.length > 0 ? effect.tags[0] : "untagged"
          default:
            return ""
        }
      },
      matchesFilter: (effect: BaseEffect, filterType: string) => {
        if (filterType === "all") return true

        // Фильтрация по сложности
        if (["basic", "intermediate", "advanced"].includes(filterType)) {
          return (effect.complexity || "basic") === filterType
        }

        // Фильтрация по категории
        if (
          ["color-correction", "artistic", "vintage", "cinematic", "creative", "technical", "distortion"].includes(
            filterType,
          )
        ) {
          return effect.category === filterType
        }

        return true
      },
    },
  })

  // Adapter data ready

  // Извлекаем только поля, соответствующие ListAdapter
  const listAdapter: ListAdapter<EffectListItem> = {
    useData: () => {
      const result = adapter.useData()
      return {
        ...result,
        items: result.items as EffectListItem[],
        error: result.error ? new Error(result.error) : null,
      }
    },
    PreviewComponent: EffectPreviewWrapper as unknown as React.ComponentType<PreviewComponentProps<EffectListItem>>,
    getSortValue: adapter.getSortValue,
    getSearchableText: adapter.getSearchableText,
    getGroupValue: adapter.getGroupValue,
    matchesFilter: adapter.matchesFilter,
    importHandlers: adapter.importHandlers,
    favoriteType: adapter.favoriteType,
    // Проверка избранного (переопределяем)
    isFavorite: (effect: EffectListItem) => isItemFavorite(effect, "effect"),

    // Конфигурация для UniversalPreview
    previewConfig: {
      // Эффекты используют EffectPreview для thumbnail
      thumbnailUrl: (effect) => `/effects/${effect.id}.png`,

      // Aspect ratio от проекта (по умолчанию 16:9)
      aspectRatio: [16, 9],

      // Тип
      showType: true,
      getType: (effect) => effect.category,
      getTypeIcon: () => <Sparkles className="size-3" />,

      // Информация
      getTitle: (effect) => effect.name?.ru || effect.name?.en || effect.id,
      getSubtitle: (effect) => effect.description?.ru || effect.description?.en || "",
      getTags: (effect) => {
        const tags: string[] = []
        if (effect.category) tags.push(effect.category)
        if (effect.complexity) tags.push(effect.complexity)
        if (effect.processingType) tags.push(effect.processingType)
        if (effect.tags) tags.push(...effect.tags)
        return tags
      },
      getMetadata: (effect) => {
        const metadata: Array<{ icon?: React.ReactNode; label: string }> = []
        if (effect.category) {
          metadata.push({ label: effect.category })
        }
        if (effect.complexity) {
          metadata.push({ label: effect.complexity })
        }
        return metadata
      },

      // Кнопки
      showFavoriteButton: true,
      showAddButton: true,
    } as PreviewConfig<EffectListItem>,
  }

  return listAdapter
}
