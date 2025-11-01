import { useCallback, useRef } from "react"

import { cn } from "@/lib/utils"
import { useTimelineMarkers } from "../../hooks/use-timeline-markers"
import { TimelineMarker } from "./timeline-marker"

interface TimelineMarkersLayerProps {
  timeScale: number
  scrollOffset: number
  containerWidth: number
  currentTime: number
  duration: number
  className?: string
}

export function TimelineMarkersLayer({
  timeScale,
  scrollOffset,
  containerWidth: _containerWidth,
  currentTime,
  duration,
  className,
}: TimelineMarkersLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const { markers, updateMarker, removeMarker, goToMarker } = useTimelineMarkers()

  // Обработка перетаскивания маркера
  const handleMarkerDrag = useCallback(
    (markerId: string, newTime: number) => {
      // Ограничиваем время в пределах timeline
      const clampedTime = Math.max(0, Math.min(duration, newTime))
      updateMarker(markerId, { time: clampedTime })
    },
    [duration, updateMarker],
  )

  // Обработка клика на маркер
  const handleMarkerClick = useCallback(
    (markerId: string) => {
      goToMarker(markerId)
    },
    [goToMarker],
  )

  // Обработка удаления маркера
  const handleMarkerDelete = useCallback(
    (markerId: string) => {
      removeMarker(markerId)
    },
    [removeMarker],
  )

  return (
    <div
      ref={layerRef}
      data-testid="timeline-markers-layer"
      className={cn("absolute top-0 left-0 right-0 h-8 pointer-events-none z-30", className)}
      style={{
        transform: `translateX(-${scrollOffset}px)`,
        width: `${duration * timeScale}px`,
      }}
    >
      {/* Линия текущего времени */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-40"
        style={{
          left: `${currentTime * timeScale}px`,
        }}
      />

      {/* Маркеры */}
      {markers.map((marker) => (
        <TimelineMarker
          key={marker.id}
          marker={marker}
          timeScale={timeScale}
          isSelected={false}
          onDrag={handleMarkerDrag}
          onClick={handleMarkerClick}
          onDelete={handleMarkerDelete}
        />
      ))}
    </div>
  )
}
