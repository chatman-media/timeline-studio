import { Heart, Plus } from "lucide-react"
import { memo } from "react"
import { formatDuration } from "@/lib/date"
import { cn, formatResolution } from "@/lib/utils"

interface PreviewOverlayProps {
  /** Размер превью для адаптивных стилей */
  size: number

  /** Длительность в секундах */
  duration?: number

  /** Тип контента (badge) */
  type?: string

  /** Иконка типа */
  typeIcon?: React.ReactNode

  /** Разрешение */
  resolution?: { width: number; height: number }

  /** Показывать кнопку избранного */
  showFavoriteButton?: boolean

  /** Элемент в избранном */
  isFavorite?: boolean

  /** Callback для toggle favorite */
  onToggleFavorite?: () => void

  /** Показывать кнопку добавления */
  showAddButton?: boolean

  /** Элемент уже добавлен */
  isAdded?: boolean

  /** Callback для добавления */
  onAdd?: () => void
}

/**
 * Overlay для превью с badges и кнопками действий
 */
export const PreviewOverlay = memo(function PreviewOverlay({
  size,
  duration,
  type,
  typeIcon,
  resolution,
  showFavoriteButton = false,
  isFavorite = false,
  onToggleFavorite,
  showAddButton = false,
  isAdded = false,
  onAdd,
}: PreviewOverlayProps) {
  const isSmall = size <= 100

  // Стили для badges
  const badgeBase = cn(
    "pointer-events-none absolute rounded-xs bg-black/60 text-white",
    isSmall ? "px-0.5 py-0 text-[11px]" : "px-1 py-0.5 text-xs",
  )

  // Стили для кнопок
  const buttonBase = cn(
    "absolute flex items-center justify-center rounded-xs bg-black/60 text-white transition-colors hover:bg-black/80",
    isSmall ? "h-4 w-4" : "h-5 w-5",
  )

  return (
    <>
      {/* Duration badge - top right, offset from favorite */}
      {duration !== undefined && duration > 0 && (
        <div className={cn(badgeBase, isSmall ? "top-0.5 right-5" : "top-1 right-7")} style={{ zIndex: 20 }}>
          {formatDuration(duration, 0, true)}
        </div>
      )}

      {/* Type badge with icon - bottom left */}
      {(type || typeIcon) && (
        <div
          className={cn(badgeBase, "flex items-center gap-0.5", isSmall ? "bottom-0.5 left-0.5" : "bottom-1 left-1")}
          style={{ zIndex: 10 }}
        >
          {typeIcon}
          {type && <span>{type}</span>}
        </div>
      )}

      {/* Resolution badge - bottom left, next to type */}
      {resolution && (
        <div className={cn(badgeBase, isSmall ? "bottom-0.5 left-[22px]" : "bottom-1 left-7")} style={{ zIndex: 20 }}>
          {formatResolution(resolution.width, resolution.height)}
        </div>
      )}

      {/* Favorite button - top right */}
      {showFavoriteButton && (
        <button
          type="button"
          className={cn(buttonBase, isSmall ? "top-0.5 right-0.5" : "top-1 right-1")}
          style={{ zIndex: 30 }}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite?.()
          }}
        >
          <Heart size={isSmall ? 10 : 12} className={cn(isFavorite && "fill-red-500 text-red-500")} />
        </button>
      )}

      {/* Add button - bottom right */}
      {showAddButton && (
        <button
          type="button"
          className={cn(
            buttonBase,
            isSmall ? "bottom-0.5 right-0.5" : "bottom-1 right-1",
            isAdded && "bg-green-600/80 hover:bg-green-600",
          )}
          style={{ zIndex: 30 }}
          onClick={(e) => {
            e.stopPropagation()
            onAdd?.()
          }}
        >
          <Plus size={isSmall ? 10 : 12} className={cn(isAdded && "rotate-45")} />
        </button>
      )}
    </>
  )
})
