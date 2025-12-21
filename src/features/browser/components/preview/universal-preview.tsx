import { memo, useMemo } from "react"

import { cn } from "@/lib/utils"
import { PreviewInfo } from "./preview-info"
import { PreviewMedia } from "./preview-media"
import { PreviewOverlay } from "./preview-overlay"
import type { PreviewSize, UniversalPreviewProps } from "./types"

/**
 * Вычисляет значение из конфига (строка, функция или undefined)
 */
function resolveValue<T, R>(value: R | ((item: T) => R) | undefined, item: T): R | undefined {
  if (value === undefined) return undefined
  if (typeof value === "function") {
    return (value as (item: T) => R)(item)
  }
  return value
}

/**
 * Универсальный компонент превью для всех типов контента
 *
 * Поддерживает:
 * - Медиа (video/image/audio) с hover preview
 * - Badges (duration, type, resolution)
 * - Кнопки действий (favorite, add)
 * - Разные view modes (list, grid, thumbnails)
 * - Конфигурируемый через PreviewConfig
 */
export const UniversalPreview = memo(function UniversalPreview<T>({
  item,
  size,
  viewMode,
  config,
  onClick,
  onDragStart,
  onAddToTimeline,
  onToggleFavorite,
  isSelected = false,
  isFavorite = false,
  isAdded = false,
}: UniversalPreviewProps<T>) {
  // Нормализуем size
  const normalizedSize: PreviewSize = useMemo(() => {
    if (typeof size === "number") {
      // Вычисляем ширину по aspect ratio
      const aspectRatio = resolveValue(config.aspectRatio, item) || [16, 9]
      const height = size
      const width = Math.round((height * aspectRatio[0]) / aspectRatio[1])
      return { width, height }
    }
    return size
  }, [size, config.aspectRatio, item])

  // Получаем значения из конфига
  const thumbnailUrl = resolveValue(config.thumbnailUrl, item)
  const videoUrl = resolveValue(config.videoPreviewUrl, item)
  const title = config.getTitle(item)
  const subtitle = config.getSubtitle?.(item)
  const tags = config.getTags?.(item)
  const metadata = config.getMetadata?.(item)
  const duration = config.getDuration?.(item)
  const type = config.getType?.(item)
  const typeIcon = config.getTypeIcon?.(item)
  const resolution = config.getResolution?.(item)

  // Обработчик drag
  const handleDragStart = (e: React.DragEvent) => {
    onDragStart?.(e)
  }

  // === LIST VIEW ===
  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-2 rounded-md cursor-pointer w-full transition-colors",
          "hover:bg-accent/50",
          isSelected && "bg-accent",
        )}
        onClick={onClick}
        draggable={!!onDragStart}
        onDragStart={handleDragStart}
      >
        {/* Thumbnail */}
        <div className="shrink-0 rounded overflow-hidden bg-muted">
          <PreviewMedia
            thumbnailUrl={thumbnailUrl}
            videoUrl={videoUrl}
            showVideoOnHover={config.showVideoOnHover}
            width={64}
            height={40}
            alt={title}
          />
        </div>

        {/* Info */}
        <PreviewInfo title={title} subtitle={subtitle} tags={tags} metadata={metadata} variant="list" />

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-1">
          {config.showFavoriteButton && (
            <button
              type="button"
              className={cn("p-1 rounded hover:bg-accent", isFavorite && "text-red-500")}
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite?.()
              }}
            >
              ♥
            </button>
          )}
        </div>
      </div>
    )
  }

  // === GRID / THUMBNAILS VIEW ===
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden cursor-pointer transition-colors",
        isSelected && "ring-2 ring-primary",
      )}
      style={{ width: normalizedSize.width }}
      onClick={onClick}
      draggable={!!onDragStart}
      onDragStart={handleDragStart}
    >
      {/* Media с overlay */}
      <div className="relative">
        <PreviewMedia
          thumbnailUrl={thumbnailUrl}
          videoUrl={videoUrl}
          showVideoOnHover={config.showVideoOnHover}
          width={normalizedSize.width}
          height={normalizedSize.height}
          alt={title}
        />

        {/* Overlay с badges и кнопками */}
        <PreviewOverlay
          size={normalizedSize.height}
          duration={config.showDuration ? duration : undefined}
          type={config.showType ? type : undefined}
          typeIcon={typeIcon}
          resolution={config.showResolution ? resolution : undefined}
          showFavoriteButton={config.showFavoriteButton}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          showAddButton={config.showAddButton}
          isAdded={isAdded}
          onAdd={onAddToTimeline}
        />
      </div>

      {/* Info под превью */}
      <PreviewInfo title={title} variant="compact" />
    </div>
  )
})
