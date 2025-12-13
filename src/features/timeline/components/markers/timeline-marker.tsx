import {
  AlertCircle,
  AlertTriangle,
  Bookmark,
  CheckSquare,
  Download,
  FolderOpen,
  PlayCircle,
  RefreshCw,
  StickyNote,
  Trash2,
} from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { type ExtendedTimelineMarker, MarkerColors, type MarkerType } from "../../types/markers"

interface TimelineMarkerProps {
  marker: ExtendedTimelineMarker
  timeScale: number
  isSelected: boolean
  onDrag?: (markerId: string, newTime: number) => void
  onClick?: (markerId: string) => void
  onDelete?: (markerId: string) => void
}

const markerIcons: Record<MarkerType, React.ReactNode> = {
  chapter: <Bookmark className="w-3 h-3" />,
  section: <FolderOpen className="w-3 h-3" />,
  note: <StickyNote className="w-3 h-3" />,
  export: <Download className="w-3 h-3" />,
  todo: <CheckSquare className="w-3 h-3" />,
  sync: <RefreshCw className="w-3 h-3" />,
  cue: <PlayCircle className="w-3 h-3" />,
  important: <AlertCircle className="w-3 h-3" />,
  warning: <AlertTriangle className="w-3 h-3" />,
  timeline: <Bookmark className="w-3 h-3" />,
}

export function TimelineMarker({ marker, timeScale, isSelected, onDrag, onClick, onDelete }: TimelineMarkerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartTime, setDragStartTime] = useState(0)
  const markerRef = useRef<HTMLDivElement>(null)

  const markerType = marker.type!
  const markerColor = MarkerColors[markerType] || "#6b7280"
  const markerIcon = markerIcons[markerType] || <Bookmark className="w-3 h-3" />

  // Начало перетаскивания
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (marker.isLocked) return

      e.preventDefault()
      e.stopPropagation()

      setIsDragging(true)
      setDragStartX(e.clientX)
      setDragStartTime(marker.time)
    },
    [marker.isLocked, marker.time],
  )

  // Перетаскивание
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !onDrag) return

      const deltaX = e.clientX - dragStartX
      const deltaTime = deltaX / timeScale
      const newTime = dragStartTime + deltaTime

      onDrag(marker.id, newTime)
    },
    [isDragging, dragStartX, dragStartTime, timeScale, marker.id, onDrag],
  )

  // Окончание перетаскивания
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Глобальные обработчики событий для перетаскивания
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Обработка клика
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (onClick && !isDragging) {
        e.stopPropagation()
        onClick(marker.id)
      }
    },
    [onClick, marker.id, isDragging],
  )

  // Форматирование времени
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const frames = Math.floor((time % 1) * 30) // Предполагаем 30 fps
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${frames.toString().padStart(2, "0")}`
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                ref={markerRef}
                data-testid="timeline-marker"
                className={cn(
                  "absolute top-0 w-6 h-6 -translate-x-1/2 cursor-pointer pointer-events-auto",
                  "transition-all duration-150",
                  isDragging && "scale-110",
                  isSelected && "ring-2 ring-primary",
                  marker.isLocked && "opacity-60 cursor-not-allowed",
                )}
                style={{
                  left: `${marker.time * timeScale}px`,
                  zIndex: isDragging ? 50 : 30,
                }}
                onMouseDown={handleMouseDown}
                onClick={handleClick}
              >
                {/* Треугольник маркера */}
                <svg width="24" height="24" viewBox="0 0 24 24" className="absolute top-0 left-0">
                  <path d="M12 2 L20 10 L12 18 L4 10 Z" fill={markerColor} stroke="white" strokeWidth="1" />
                </svg>

                {/* Иконка маркера */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-white">{markerIcon}</div>

                {/* Флаг для маркеров с длительностью */}
                {marker.duration && marker.duration > 0 && (
                  <div
                    className="absolute top-4 h-4 opacity-30"
                    style={{
                      width: `${marker.duration * timeScale}px`,
                      backgroundColor: markerColor,
                      left: "50%",
                    }}
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <div className="font-semibold">{marker.name}</div>
                <div className="text-xs text-muted-foreground">{formatTime(marker.time)}</div>
                {marker.description && <div className="text-xs">{marker.description}</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => onClick?.(marker.id)}>Go to Marker</ContextMenuItem>
        <ContextMenuItem onClick={() => onDelete?.(marker.id)} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Marker
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
