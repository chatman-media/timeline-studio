/**
 * VideoClip - Компонент видео клипа
 */

import { Copy, Image, Scissors, Trash2, Video } from "lucide-react"
import React, { memo, useCallback, useMemo } from "react"

import { Button } from "@timeline-studio/ui/components/button"
import { cn } from "@/lib/utils"

import { useClips } from "../../hooks/clips/use-clips"
import { useTimeline } from "../../hooks/state/use-timeline"
import { timelinePlayerSync } from "../../services/timeline-player-sync"
import type { TimelineClip, TimelineTrack } from "../../types"
import { ClipDropZoneDnd } from "./clip-drop-zone-dnd"
import { ClipResourceIndicators } from "./clip-resource-indicators"
import { VideoFadeControls } from "./video-fade-controls"
import { VideoFadeVisualization } from "./video-fade-visualization"

interface VideoClipProps {
  clip: TimelineClip
  track: TimelineTrack
  pixelsPerSecond: number
  onUpdate?: (updates: Partial<TimelineClip>) => void
  onRemove?: () => void
}

// Мемоизируем компонент для предотвращения ненужных ререндеров
export const VideoClip = memo(
  function VideoClip({ clip, track, pixelsPerSecond, onUpdate, onRemove }: VideoClipProps) {
    const [isHovered, setIsHovered] = React.useState(false)
    const { selectClips, copySelection } = useTimeline()
    const { splitClip } = useClips()

    // Мемоизируем обработчики для предотвращения создания новых функций при каждом рендере
    const handleSelect = useCallback(() => {
      const newIsSelected = !clip.isSelected
      onUpdate?.({ isSelected: newIsSelected })

      // Синхронизируем с плеером при выборе
      if (newIsSelected) {
        void timelinePlayerSync.syncSelectedClip(clip)
      }
    }, [clip, onUpdate])

    const handleCopy = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()

        // Выделяем клип если он не выделен
        if (!clip.isSelected) {
          selectClips([clip.id], false)
        }

        // Копируем выделенные клипы
        copySelection()
      },
      [clip.id, clip.isSelected, selectClips, copySelection],
    )

    const handleSplit = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()

        // Разделяем клип в середине
        const splitTime = clip.startTime + clip.duration / 2
        void splitClip(clip.id, splitTime)
      },
      [clip.id, clip.startTime, clip.duration, splitClip],
    )

    const handleRemove = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        onRemove?.()
      },
      [onRemove],
    )

    // Мемоизируем вычисляемые значения
    const clipColor = useMemo(() => (track.type === "video" ? "bg-blue-500" : "bg-purple-500"), [track.type])

    const clipColorHover = useMemo(() => (track.type === "video" ? "bg-blue-600" : "bg-purple-600"), [track.type])

    // Вычисляем размеры клипа
    const clipWidth = useMemo(() => clip.duration * pixelsPerSecond, [clip.duration, pixelsPerSecond])
    const clipHeight = track.height

    // Мемоизируем прогресс бар вычисления
    const progressBarStyle = useMemo(
      () => ({
        marginLeft: `${(clip.mediaStartTime / (clip.mediaEndTime - clip.mediaStartTime + clip.duration)) * 100}%`,
        width: `${(clip.duration / (clip.mediaEndTime - clip.mediaStartTime + clip.duration)) * 100}%`,
      }),
      [clip.mediaStartTime, clip.mediaEndTime, clip.duration],
    )

    return (
      <ClipDropZoneDnd
        clip={clip}
        className={cn(
          "h-full w-full rounded border-2 transition-all duration-150",
          "flex flex-col overflow-hidden relative group",
          clipColor,
          isHovered && clipColorHover,
          clip.isSelected && "ring-2 ring-white ring-offset-1",
          clip.isLocked && "opacity-60",
        )}
        data-oid="h5zqn8j"
      >
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleSelect}
          className="h-full w-full"
          data-oid="cqytsi4"
        >
          {/* Заголовок клипа */}
          <div className="flex items-center justify-between p-1 bg-black/20" data-oid="asd.sxd">
            <div className="flex items-center gap-1 min-w-0" data-oid="fzr3sat">
              {track.type === "video" ? (
                <Video className="w-3 h-3 text-white shrink-0" data-oid="upqh:ao" />
              ) : (
                <Image className="w-3 h-3 text-white shrink-0" data-oid="5:0c2z-" />
              )}
              <span className="text-xs text-white truncate font-medium" data-oid="-d50x.i">
                {clip.name}
              </span>

              {/* Индикаторы ресурсов */}
              <ClipResourceIndicators clip={clip} className="ml-1" data-oid="yug649h" />
            </div>

            {/* Кнопки управления (показываются при наведении) */}
            {isHovered && !clip.isLocked && (
              <div className="flex items-center gap-0.5" data-oid="9efrk73">
                <VideoFadeControls clip={clip} className="w-4 h-4" data-oid="rba7..e" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-4 h-4 p-0 hover:bg-white/20"
                  onClick={handleCopy}
                  title="Копировать"
                  data-oid="b9vm3sf"
                >
                  <Copy className="w-2.5 h-2.5 text-white" data-oid="sd7aytr" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-4 h-4 p-0 hover:bg-white/20"
                  onClick={handleSplit}
                  title="Разделить"
                  data-oid="reb1wce"
                >
                  <Scissors className="w-2.5 h-2.5 text-white" data-oid="wxa.6ik" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-4 h-4 p-0 hover:bg-red-500/50"
                  onClick={handleRemove}
                  title="Удалить"
                  data-oid="aqnhz2h"
                >
                  <Trash2 className="w-2.5 h-2.5 text-white" data-oid="awbv.ew" />
                </Button>
              </div>
            )}
          </div>

          {/* Содержимое клипа */}
          <div className="flex-1 relative" data-oid="xnnp8z-">
            {/* Превью видео/изображения */}
            <div className="absolute inset-0 bg-linear-to-r from-black/10 to-transparent" data-oid="lcn:qg.">
              {/* TODO: Здесь будет превью кадра из видео */}
              <div className="w-full h-full flex items-center justify-center" data-oid="t9yxo1x">
                <span className="text-xs text-white/70" data-oid=":.srr_h">
                  {Math.round(clip.duration)}s
                </span>
              </div>
            </div>

            {/* Визуализация fade эффектов */}
            <VideoFadeVisualization
              clip={clip}
              width={clipWidth}
              height={clipHeight}
              pixelsPerSecond={pixelsPerSecond}
              data-oid="liztslv"
            />
          </div>

          {/* Полоса прогресса (показывает обрезку) */}
          <div className="h-1 bg-black/30 relative" data-oid="z.wiuaj">
            <div className="h-full bg-white/50" style={progressBarStyle} data-oid="cqtie5c" />
          </div>

          {/* Ручки для изменения размера */}
          {isHovered && !clip.isLocked && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 cursor-w-resize" data-oid="_-nyy7u" />
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 cursor-e-resize" data-oid="u7gfdzn" />
            </>
          )}
        </div>
      </ClipDropZoneDnd>
    )
  },
  (prevProps, nextProps) => {
    // Кастомная функция сравнения для оптимизации ререндеров
    // Проверяем только те свойства, которые действительно влияют на отображение
    return (
      prevProps.clip.id === nextProps.clip.id &&
      prevProps.clip.name === nextProps.clip.name &&
      prevProps.clip.startTime === nextProps.clip.startTime &&
      prevProps.clip.duration === nextProps.clip.duration &&
      prevProps.clip.isSelected === nextProps.clip.isSelected &&
      prevProps.clip.isLocked === nextProps.clip.isLocked &&
      prevProps.clip.effects.length === nextProps.clip.effects.length &&
      prevProps.clip.filters.length === nextProps.clip.filters.length &&
      prevProps.clip.transitions.length === nextProps.clip.transitions.length &&
      prevProps.clip.mediaStartTime === nextProps.clip.mediaStartTime &&
      prevProps.clip.mediaEndTime === nextProps.clip.mediaEndTime &&
      prevProps.clip.opacity === nextProps.clip.opacity &&
      prevProps.clip.fadeIn?.duration === nextProps.clip.fadeIn?.duration &&
      prevProps.clip.fadeIn?.type === nextProps.clip.fadeIn?.type &&
      prevProps.clip.fadeOut?.duration === nextProps.clip.fadeOut?.duration &&
      prevProps.clip.fadeOut?.type === nextProps.clip.fadeOut?.type &&
      prevProps.track.type === nextProps.track.type &&
      prevProps.track.height === nextProps.track.height &&
      prevProps.pixelsPerSecond === nextProps.pixelsPerSecond
    )
  },
)
