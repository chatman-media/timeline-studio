/**
 * AudioClip - Компонент аудио клипа
 */

import { Copy, Music, Scissors, Sparkles, Trash2, Volume2 } from "lucide-react"
import React from "react"

import { Button } from "@/components/ui/button"
import { useModals } from "@/core/hooks"
import type { AppliedEffect } from "@/domains/video-editing/types/unified-effects"
import { createLogger } from "@/lib/tauri-logger"
import { convertToAssetUrl } from "@/lib/tauri-utils"
import { cn } from "@/lib/utils"
import { useClips } from "../../hooks"
import { timelinePlayerSync } from "../../services/timeline-player-sync"
import type { TimelineClip, TimelineTrack } from "../../types"
import Waveform from "../track/waveform"

const logger = createLogger("AudioClip")

interface AudioClipProps {
  clip: TimelineClip
  track: TimelineTrack
  onUpdate?: (updates: Partial<TimelineClip>) => void
  onRemove?: () => void
}

/**
 * Renders an audio clip component with waveform visualization and control buttons.
 *
 * @param {AudioClipProps["clip"]} clip - The audio clip data, including id, name, duration, volume, and state.
 * @param {AudioClipProps["track"]} track - The track data used for styling based on type.
 * @param {(update: Partial<AudioClipProps["clip"]>) => void} [onUpdate] - Callback invoked when the clip is updated.
 * @param {() => void} [onRemove] - Callback invoked when the clip is removed.
 * @returns {JSX.Element} The AudioClip component.
 */
export function AudioClip({ clip, track, onUpdate, onRemove }: AudioClipProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const { updateClip } = useClips()
  const { openModal } = useModals()

  const handleSelect = () => {
    const newIsSelected = !clip.isSelected
    onUpdate?.({ isSelected: newIsSelected })

    // Синхронизируем с плеером при выборе
    if (newIsSelected) {
      void timelinePlayerSync.syncSelectedClip(clip)
    }
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    logger.info("Copy audio clip:", { clipId: clip.id })
  }

  const handleSplit = (e: React.MouseEvent) => {
    e.stopPropagation()
    logger.info("Split audio clip:", { clipId: clip.id })
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.()
  }

  const handleEffects = (e: React.MouseEvent) => {
    e.stopPropagation()
    openModal("audio-effects", {
      clip,
      track,
      onApplyEffects: handleApplyEffects,
    })
  }

  const handleApplyEffects = (effects: AppliedEffect[]) => {
    updateClip(clip.id, {
      effects: effects,
    })
  }

  // Определяем цвет клипа в зависимости от типа аудио
  const getClipColor = () => {
    switch (track.type) {
      case "music":
        return "bg-pink-500"
      case "voiceover":
        return "bg-cyan-500"
      case "sfx":
        return "bg-red-500"
      case "ambient":
        return "bg-gray-500"
      default:
        return "bg-green-500"
    }
  }

  const getClipColorHover = () => {
    switch (track.type) {
      case "music":
        return "bg-pink-600"
      case "voiceover":
        return "bg-cyan-600"
      case "sfx":
        return "bg-red-600"
      case "ambient":
        return "bg-gray-600"
      default:
        return "bg-green-600"
    }
  }

  const clipColor = getClipColor()
  const clipColorHover = getClipColorHover()

  // Получаем URL аудио файла через Tauri API
  const audioUrl = React.useMemo(() => {
    if (!clip.mediaFile?.path) return null
    // Конвертируем локальный путь в asset URL для Tauri
    return convertToAssetUrl(clip.mediaFile.path)
  }, [clip.mediaFile?.path])

  return (
    <div
      className={cn(
        "h-full w-full rounded border-2 transition-all duration-150",
        "flex flex-col overflow-hidden relative group",
        clipColor,
        isHovered && clipColorHover,
        clip.isSelected && "ring-2 ring-white ring-offset-1",
        clip.isLocked && "opacity-60",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSelect}
      data-oid="7st0wmq"
    >
      {/* Заголовок клипа */}
      <div className="flex items-center justify-between p-1 bg-black/20" data-oid="ulbc-52">
        <div className="flex items-center gap-1 min-w-0" data-oid="sm_tris">
          <Music className="w-3 h-3 text-white shrink-0" data-oid="jkfi5wi" />
          <span className="text-xs text-white truncate font-medium" data-oid="-dxifxn">
            {clip.name}
          </span>
        </div>

        {/* Кнопки управления */}
        {isHovered && !clip.isLocked && (
          <div className="flex items-center gap-0.5" data-oid="7pjleju">
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-white/20"
              onClick={handleEffects}
              title="Эффекты"
              data-oid="e7o23cj"
            >
              <Sparkles className="w-2.5 h-2.5 text-white" data-oid="ybwvtgi" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-white/20"
              onClick={handleCopy}
              title="Копировать"
              data-oid="svcnv_r"
            >
              <Copy className="w-2.5 h-2.5 text-white" data-oid="b0xmkda" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-white/20"
              onClick={handleSplit}
              title="Разделить"
              data-oid="i-qyg72"
            >
              <Scissors className="w-2.5 h-2.5 text-white" data-oid="m:9ye_i" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-red-500/50"
              onClick={handleRemove}
              title="Удалить"
              data-oid="g7j1xju"
            >
              <Trash2 className="w-2.5 h-2.5 text-white" data-oid="5e_6xx6" />
            </Button>
          </div>
        )}
      </div>

      {/* Содержимое клипа - визуализация аудио */}
      <div className="flex-1 relative p-1" data-oid="hjmvlb8">
        {/* Waveform компонент */}
        {audioUrl ? (
          <Waveform audioUrl={audioUrl} className="w-full h-full" data-oid="iw:8om2" />
        ) : (
          // Fallback waveform visualization
          <div className="h-full flex items-end justify-between gap-px" data-oid="s7ug2.g">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="bg-white/50 rounded-sm flex-1 min-w-px animate-pulse"
                style={{ height: `${30 + Math.sin(i * 0.5) * 20}%` }}
                data-oid="9zbjw_q"
              />
            ))}
          </div>
        )}

        {/* Индикатор громкости */}
        <div className="absolute top-1 right-1 flex items-center gap-1" data-oid="y0f:-kf">
          <Volume2 className="w-2.5 h-2.5 text-white/70" data-oid="4ltknik" />
          <span className="text-xs text-white/70" data-oid="o0:5kuo">
            {Math.round(clip.volume * 100)}%
          </span>
        </div>

        {/* Индикаторы эффектов */}
        {clip.effects.length > 0 && (
          <div className="absolute bottom-1 left-1" data-oid="9z:31y9">
            <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Эффекты применены" data-oid="tr0129:" />
          </div>
        )}

        {/* Индикаторы фильтров */}
        {clip.filters.length > 0 && (
          <div className="absolute bottom-1 left-4" data-oid="oq3xx17">
            <div className="w-2 h-2 bg-green-400 rounded-full" title="Фильтры применены" data-oid="zb6dacu" />
          </div>
        )}
      </div>

      {/* Информация о длительности */}
      <div className="px-1 py-0.5 bg-black/30" data-oid="qo68q8z">
        <span className="text-xs text-white/70" data-oid="zhrf96e">
          {Math.round(clip.duration)}s
        </span>
      </div>

      {/* Ручки для изменения размера */}
      {isHovered && !clip.isLocked && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 cursor-w-resize" data-oid="ihk96-1" />
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 cursor-e-resize" data-oid="d3smkjm" />
        </>
      )}
    </div>
  )
}
