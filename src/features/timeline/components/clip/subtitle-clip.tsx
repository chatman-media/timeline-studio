import type React from "react"
import { useCallback, useRef, useState } from "react"
import { useSubtitleStyles } from "@/features/subtitles"
import type { SubtitleClip as SubtitleClipType } from "@/features/subtitles/types"
import { cn } from "@/lib/utils"
import { useTimeline } from "../../hooks/state/use-timeline"
import { useTimelineSelection } from "../../hooks/state/use-timeline-selection"

interface SubtitleClipProps {
  clip: SubtitleClipType
  trackHeight: number
  isSelected?: boolean
  isDragging?: boolean
  onMouseDown?: (e: React.MouseEvent) => void
  onDoubleClick?: (e: React.MouseEvent) => void
}

export function SubtitleClip({
  clip,
  trackHeight,
  isSelected = false,
  isDragging = false,
  onMouseDown,
  onDoubleClick,
}: SubtitleClipProps) {
  const { updateClip } = useTimeline()
  const { selectClip } = useTimelineSelection()
  const { getComputedStyle, getStyleById } = useSubtitleStyles()

  // Используем фиксированное значение pixelsPerSecond
  // TODO: Получать из UI state provider когда он будет реализован
  const pixelsPerSecond = 50

  // Расчет позиции и размера
  const left = clip.startTime * pixelsPerSecond
  const width = clip.duration * pixelsPerSecond

  // Обработка клика
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectClip(clip.id)
  }

  // Получение стиля субтитров
  const style = getComputedStyle(clip.subtitleStyleId, clip.formatting)
  const subtitleStyle = clip.subtitleStyleId ? getStyleById(clip.subtitleStyleId) : undefined

  // Определение цвета клипа на timeline в зависимости от стиля
  const getClipBackgroundColor = () => {
    if (subtitleStyle) {
      // Генерируем цвет на основе имени стиля для визуального различия
      const hash = subtitleStyle.name.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0)
        return a & a
      }, 0)
      const hue = Math.abs(hash) % 360
      return `hsl(${hue} 70% 50%)`
    }
    return "hsl(25 95% 50%)" // Оранжевый для субтитров без стиля
  }

  // Состояние для отслеживания изменения размера
  const [isResizing, setIsResizing] = useState(false)
  const resizeType = useRef<"start" | "end" | null>(null)
  const initialMouseX = useRef(0)
  const initialStartTime = useRef(0)
  const initialDuration = useRef(0)

  // Обработчики изменения размера
  const handleResizeStart = useCallback(
    (e: MouseEvent) => {
      if (!resizeType.current) return

      e.preventDefault()
      const deltaX = e.clientX - initialMouseX.current
      const deltaTime = deltaX / pixelsPerSecond

      let newStartTime = initialStartTime.current
      let newDuration = initialDuration.current

      if (resizeType.current === "start") {
        // Изменение начала клипа
        newStartTime = Math.max(0, initialStartTime.current + deltaTime)
        newDuration = initialDuration.current - (newStartTime - initialStartTime.current)

        // Минимальная длительность 0.1 секунды
        if (newDuration < 0.1) {
          newDuration = 0.1
          newStartTime = initialStartTime.current + initialDuration.current - 0.1
        }
      } else if (resizeType.current === "end") {
        // Изменение конца клипа
        newDuration = Math.max(0.1, initialDuration.current + deltaTime)
      }

      // Обновляем клип
      void updateClip(clip.id, {
        startTime: newStartTime,
        duration: newDuration,
      })
    },
    [clip.id, clip.mediaStartTime, pixelsPerSecond, updateClip],
  )

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    resizeType.current = null
    document.removeEventListener("mousemove", handleResizeStart)
    document.removeEventListener("mouseup", handleResizeEnd)
  }, [handleResizeStart])

  const startResize = useCallback(
    (type: "start" | "end", e: React.MouseEvent) => {
      e.stopPropagation()
      setIsResizing(true)
      resizeType.current = type
      initialMouseX.current = e.clientX
      initialStartTime.current = clip.startTime
      initialDuration.current = clip.duration

      document.addEventListener("mousemove", handleResizeStart)
      document.addEventListener("mouseup", handleResizeEnd)
    },
    [clip.startTime, clip.duration, handleResizeStart, handleResizeEnd],
  )

  // Обрезка текста если он слишком длинный
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return `${text.substring(0, maxLength - 3)}...`
  }

  return (
    <div
      data-testid="subtitle-clip"
      className={cn(
        "absolute rounded-md overflow-hidden cursor-move transition-all",
        "border-2 hover:brightness-110",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        (isDragging || isResizing) && "opacity-50",
      )}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        height: `${trackHeight - 8}px`,
        top: "4px",
        backgroundColor: getClipBackgroundColor(),
        borderColor: isSelected ? "hsl(var(--primary))" : "transparent",
      }}
      onClick={handleClick}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      {/* Градиент для визуальной глубины */}
      <div className="absolute inset-0 bg-linear-to-b from-white/20 to-transparent" style={{ pointerEvents: "none" }} />

      {/* Информация о клипе */}
      <div className="relative h-full flex flex-col justify-between p-2">
        {/* Текст субтитра */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{truncateText(clip.text, 50)}</p>
            {subtitleStyle && width > 120 && (
              <p className="text-[10px] text-white/60 truncate mt-1">{subtitleStyle.name}</p>
            )}
          </div>
        </div>

        {/* Индикаторы анимаций */}
        <div className="flex items-center gap-1">
          {clip.animationIn && (
            <span className="text-[10px] bg-black/30 text-white px-1 rounded">{clip.animationIn.type}</span>
          )}
          {clip.animationOut && (
            <span className="text-[10px] bg-black/30 text-white px-1 rounded">{clip.animationOut.type}</span>
          )}
        </div>

        {/* Временные метки */}
        {width > 80 && (
          <div className="absolute bottom-1 right-1">
            <span className="text-[10px] text-white/80">{clip.duration.toFixed(1)}s</span>
          </div>
        )}
      </div>

      {/* Ручки для изменения размера */}
      {isSelected && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-2 bg-black/20 hover:bg-black/40 cursor-ew-resize transition-colors"
            onMouseDown={(e) => startResize("start", e)}
            title="Изменить начало клипа"
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-2 bg-black/20 hover:bg-black/40 cursor-ew-resize transition-colors"
            onMouseDown={(e) => startResize("end", e)}
            title="Изменить конец клипа"
          />
        </>
      )}
    </div>
  )
}
