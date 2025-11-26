/**
 * VirtualizedTrack - Оптимизированный компонент трека
 * Использует виртуализацию для клипов внутри трека
 */

import type React from "react"
import { cn } from "@/lib/utils"
import type { TimelineTrack } from "../../types"
import { TrackHeightAdjuster } from "../track-height-adjuster"
import { TrackHeader } from "./track-header"
import { VirtualizedTrackContent } from "./virtualized-track-content"

interface VirtualizedTrackProps {
  track: TimelineTrack | null
  timeScale?: number // Пикселей на секунду
  currentTime?: number
  containerWidth: number
  scrollOffset: number
  isSelected?: boolean
  onSelect?: (trackId: string) => void
  onUpdate?: (track: TimelineTrack) => void
  onMuteToggle?: (trackId: string) => void
  onLockToggle?: (trackId: string) => void
  onHeightChange?: (trackId: string, height: number) => void
  className?: string
  style?: React.CSSProperties
}

export function VirtualizedTrack({
  track,
  timeScale = 100,
  currentTime = 0,
  containerWidth,
  scrollOffset,
  isSelected = false,
  onSelect,
  onUpdate,
  onHeightChange,
  className,
  style,
}: VirtualizedTrackProps) {
  // Обработка null track
  if (!track) {
    return (
      <div
        data-testid="timeline-track"
        className={cn("flex border-b border-border bg-background track", className)}
        style={style}
      >
        <div className="p-4 text-muted-foreground">Invalid track</div>
      </div>
    )
  }

  const handleSelect = () => {
    onSelect?.(track.id)
  }

  const handleUpdate = (updates: Partial<TimelineTrack>) => {
    onUpdate?.({ ...track, ...updates })
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: Using div instead of button because TrackHeader contains nested interactive elements (buttons). A button cannot contain other buttons per HTML spec.
    <div
      data-testid="timeline-track"
      role="button"
      tabIndex={0}
      className={cn(
        "flex border-b border-border bg-background track relative",
        "hover:bg-accent/5 transition-colors cursor-pointer",
        isSelected && "bg-accent/10 border-accent",
        track.isHidden && "opacity-50",
        "w-full p-0",
        className,
      )}
      style={{ height: track.height, ...style }}
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleSelect()
        }
      }}
    >
      {/* Заголовок трека (фиксированная ширина) */}
      <div className="shrink-0 w-48 border-r border-border">
        <TrackHeader track={track} isSelected={isSelected} onUpdate={handleUpdate} />
      </div>

      {/* Виртуализированное содержимое трека */}
      <div className="flex-1 relative overflow-hidden">
        <VirtualizedTrackContent
          track={track}
          timeScale={timeScale}
          currentTime={currentTime}
          containerWidth={containerWidth}
          scrollOffset={scrollOffset}
          onUpdate={handleUpdate}
        />
      </div>

      {/* Регулятор высоты трека */}
      {onHeightChange && (
        <TrackHeightAdjuster trackId={track.id} currentHeight={track.height} onHeightChange={onHeightChange} />
      )}
    </div>
  )
}
