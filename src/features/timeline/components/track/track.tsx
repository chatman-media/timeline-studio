/**
 * Track - Основной компонент трека Timeline
 *
 * Отображает трек с заголовком и содержимым (клипами)
 */

import type React from "react"

import { cn } from "@/lib/utils"

import type { TimelineTrack } from "../../types"
import { TrackHeightAdjuster } from "../track-height-adjuster"
import { TrackContent } from "./track-content"
import { TrackHeader } from "./track-header"

interface TrackProps {
  track: TimelineTrack | null
  timeScale?: number // Пикселей на секунду
  currentTime?: number
  isSelected?: boolean
  onSelect?: (trackId: string) => void
  onUpdate?: (track: TimelineTrack) => void
  onMuteToggle?: (trackId: string) => void
  onLockToggle?: (trackId: string) => void
  onHeightChange?: (trackId: string, height: number) => void
  className?: string
  style?: React.CSSProperties
}

export function TrackComponent({
  track,
  timeScale = 100,
  currentTime = 0,
  isSelected = false,
  onSelect,
  onUpdate,
  onHeightChange,
  className,
  style,
}: TrackProps) {
  // Обработка null track
  if (!track) {
    return (
      <div
        data-testid="timeline-track"
        className={cn("flex border-b border-border bg-background track", className)}
        style={style}
        data-oid="6ahqklv"
      >
        <div className="p-4 text-muted-foreground" data-oid="is26a_5">
          Invalid track
        </div>
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
      data-oid="24jz58."
    >
      {/* Заголовок трека (фиксированная ширина) */}
      <div className="shrink-0 w-48 border-r border-border" data-oid="yd7yl83">
        <TrackHeader track={track} isSelected={isSelected} onUpdate={handleUpdate} data-oid="u4m:.4p" />
      </div>

      {/* Содержимое трека (клипы) */}
      <div className="flex-1 relative overflow-hidden" data-oid="864hk0d">
        <TrackContent
          track={track}
          timeScale={timeScale}
          currentTime={currentTime}
          onUpdate={handleUpdate}
          data-oid="5y7m8_f"
        />
      </div>

      {/* Регулятор высоты трека */}
      {onHeightChange && (
        <TrackHeightAdjuster
          trackId={track.id}
          currentHeight={track.height}
          onHeightChange={onHeightChange}
          data-oid="ycq6jhz"
        />
      )}
    </div>
  )
}
