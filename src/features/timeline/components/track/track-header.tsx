/**
 * TrackHeader - Заголовок трека с элементами управления
 */

import { Eye, EyeOff, Image, Lock, Mic, Music, Type, Unlock, Video, Volume2, VolumeX } from "lucide-react"
import React from "react"

import { Button } from "@timeline-studio/ui/components/button"
import { Input } from "@timeline-studio/ui/components/input"
import { Slider } from "@timeline-studio/ui/components/slider"
import { cn } from "@/lib/utils"

import type { TimelineTrack, TrackType } from "../../types"

interface TrackHeaderProps {
  track: TimelineTrack
  isSelected?: boolean
  onUpdate?: (updates: Partial<TimelineTrack>) => void
}

// Иконки для разных типов треков
const TRACK_TYPE_ICONS: Record<TrackType, React.ComponentType<any>> = {
  video: Video,
  audio: Music,
  image: Image,
  title: Type,
  subtitle: Type,
  music: Music,
  voiceover: Mic,
  sfx: Music,
  ambient: Music,
}

// Цвета для разных типов треков
const TRACK_TYPE_COLORS: Record<TrackType, string> = {
  video: "text-blue-500",
  audio: "text-green-500",
  image: "text-purple-500",
  title: "text-orange-500",
  subtitle: "text-yellow-500",
  music: "text-pink-500",
  voiceover: "text-cyan-500",
  sfx: "text-red-500",
  ambient: "text-gray-500",
}

export function TrackHeader({ track, isSelected, onUpdate }: TrackHeaderProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editName, setEditName] = React.useState(track.name)

  const IconComponent = TRACK_TYPE_ICONS[track.type]
  const iconColor = TRACK_TYPE_COLORS[track.type]

  const handleNameSubmit = () => {
    onUpdate?.({ name: editName.trim() || track.name })
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit()
    } else if (e.key === "Escape") {
      setEditName(track.name)
      setIsEditing(false)
    }
  }

  const toggleMute = () => {
    onUpdate?.({ isMuted: !track.isMuted })
  }

  const toggleLock = () => {
    onUpdate?.({ isLocked: !track.isLocked })
  }

  const toggleVisibility = () => {
    onUpdate?.({ isHidden: !track.isHidden })
  }

  const handleVolumeChange = (value: number[]) => {
    onUpdate?.({ volume: value[0] })
  }

  return (
    <div
      className={cn(
        "h-full p-2 flex flex-col justify-between",
        "bg-muted/30 border-r border-border",
        isSelected && "bg-accent/20",
      )}
      data-oid="wo2wfgv"
    >
      {/* Верхняя часть - иконка типа и название */}
      <div className="space-y-2" data-oid="a.55vjk">
        {/* Иконка типа трека */}
        <div className="flex items-center gap-2" data-oid="7yngm_4">
          <IconComponent className={cn("w-4 h-4", iconColor)} data-oid="im57o:c" />
          <span className="text-xs text-muted-foreground uppercase" data-oid="gjyb4dw">
            {track.type}
          </span>
        </div>

        {/* Название трека */}
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyPress}
            className="h-6 text-xs"
            autoFocus
            data-oid="vvofr2u"
          />
        ) : (
          <div
            className="text-sm font-medium cursor-pointer hover:bg-accent/20 px-1 py-0.5 rounded"
            onClick={() => setIsEditing(true)}
            title="Нажмите для редактирования"
            data-oid="xp8_31m"
          >
            {track.name}
          </div>
        )}
      </div>

      {/* Средняя часть - слайдер громкости (для аудио треков) */}
      {(track.type === "audio" ||
        track.type === "music" ||
        track.type === "voiceover" ||
        track.type === "sfx" ||
        track.type === "ambient") && (
        <div className="py-2" data-oid="msjfxro">
          <div className="text-xs text-muted-foreground mb-1" data-oid=":y6mgt.">
            Громкость: {Math.round(track.volume * 100)}%
          </div>
          <Slider
            value={[track.volume]}
            onValueChange={handleVolumeChange}
            max={1}
            min={0}
            step={0.01}
            className="w-full"
            data-oid="hoek3mb"
          />
        </div>
      )}

      {/* Нижняя часть - кнопки управления */}
      <div className="flex items-center gap-1" data-oid=".guah4n">
        {/* Кнопка видимости */}
        <Button
          variant="ghost"
          size="sm"
          className="w-6 h-6 p-0"
          onClick={toggleVisibility}
          title={track.isHidden ? "Показать трек" : "Скрыть трек"}
          data-oid="k6i287e"
        >
          {track.isHidden ? (
            <EyeOff className="w-3 h-3" data-oid="_.27tar" />
          ) : (
            <Eye className="w-3 h-3" data-oid="fh0dd_b" />
          )}
        </Button>

        {/* Кнопка блокировки */}
        <Button
          variant="ghost"
          size="sm"
          className="w-6 h-6 p-0"
          onClick={toggleLock}
          title={track.isLocked ? "Разблокировать трек" : "Заблокировать трек"}
          data-testid="track-lock-button"
          data-oid="_t2w9e1"
        >
          {track.isLocked ? (
            <Lock className="w-3 h-3" data-oid="1q9f19w" />
          ) : (
            <Unlock className="w-3 h-3" data-oid="a7i7s:-" />
          )}
        </Button>

        {/* Кнопка отключения звука (для аудио треков) */}
        {(track.type === "audio" ||
          track.type === "music" ||
          track.type === "voiceover" ||
          track.type === "sfx" ||
          track.type === "ambient") && (
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0"
            onClick={toggleMute}
            title={track.isMuted ? "Включить звук" : "Отключить звук"}
            data-testid="track-mute-button"
            data-oid="bpqxjhr"
          >
            {track.isMuted ? (
              <VolumeX className="w-3 h-3" data-oid="-c:i39r" />
            ) : (
              <Volume2 className="w-3 h-3" data-oid="y5-rpie" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
