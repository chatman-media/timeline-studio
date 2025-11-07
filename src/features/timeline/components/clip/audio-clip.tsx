/**
 * AudioClip - Компонент аудио клипа
 */

import { Copy, Music, Scissors, Sparkles, Trash2, Volume2 } from "lucide-react"
import React from "react"

import { Button } from "@/components/ui/button"
import { useModal } from "@/features/modals/services"
import { createLogger } from "@/lib/tauri-logger"
import { convertToAssetUrl } from "@/lib/tauri-utils"
import { cn } from "@/lib/utils"
import { useClips } from "../../hooks"
import { timelinePlayerSync } from "../../services/timeline-player-sync"
import type { AppliedEffect, TimelineClip, TimelineTrack } from "../../types"
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
  const { openModal } = useModal()

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
    >
      {/* Заголовок клипа */}
      <div className="flex items-center justify-between p-1 bg-black/20">
        <div className="flex items-center gap-1 min-w-0">
          <Music className="w-3 h-3 text-white flex-shrink-0" />
          <span className="text-xs text-white truncate font-medium">{clip.name}</span>
        </div>

        {/* Кнопки управления */}
        {isHovered && !clip.isLocked && (
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-white/20"
              onClick={handleEffects}
              title="Эффекты"
            >
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-white/20"
              onClick={handleCopy}
              title="Копировать"
            >
              <Copy className="w-2.5 h-2.5 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-white/20"
              onClick={handleSplit}
              title="Разделить"
            >
              <Scissors className="w-2.5 h-2.5 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-red-500/50"
              onClick={handleRemove}
              title="Удалить"
            >
              <Trash2 className="w-2.5 h-2.5 text-white" />
            </Button>
          </div>
        )}
      </div>

      {/* Содержимое клипа - визуализация аудио */}
      <div className="flex-1 relative p-1">
        {/* Waveform компонент */}
        {audioUrl ? (
          <Waveform audioUrl={audioUrl} className="w-full h-full" />
        ) : (
          // Fallback waveform visualization
          <div className="h-full flex items-end justify-between gap-px">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="bg-white/50 rounded-sm flex-1 min-w-px animate-pulse"
                style={{ height: `${30 + Math.sin(i * 0.5) * 20}%` }}
              />
            ))}
          </div>
        )}

        {/* Индикатор громкости */}
        <div className="absolute top-1 right-1 flex items-center gap-1">
          <Volume2 className="w-2.5 h-2.5 text-white/70" />
          <span className="text-xs text-white/70">{Math.round(clip.volume * 100)}%</span>
        </div>

        {/* Индикаторы эффектов */}
        {clip.effects.length > 0 && (
          <div className="absolute bottom-1 left-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Эффекты применены" />
          </div>
        )}

        {/* Индикаторы фильтров */}
        {clip.filters.length > 0 && (
          <div className="absolute bottom-1 left-4">
            <div className="w-2 h-2 bg-green-400 rounded-full" title="Фильтры применены" />
          </div>
        )}
      </div>

      {/* Информация о длительности */}
      <div className="px-1 py-0.5 bg-black/30">
        <span className="text-xs text-white/70">{Math.round(clip.duration)}s</span>
      </div>

      {/* Ручки для изменения размера */}
      {isHovered && !clip.isLocked && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 cursor-w-resize" />
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 cursor-e-resize" />
        </>
      )}
    </div>
  )
}
