/**
 * TrackControlsPanel - Левая панель управления треками
 *
 * Компонент для профессионального управления треками:
 * - Отображение списка треков
 * - Добавление новых треков
 * - Управление видимостью и блокировкой
 */

import { Eye, EyeOff, Image, Lock, Music, Type, Unlock, Video, Volume2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { cn } from "@/lib/utils"
import { useTracks } from "../hooks/state/use-tracks"
import { PersonsPanel } from "./persons-panel"

// Типы треков с иконками и цветами
const TRACK_TYPES = [
  {
    type: "video" as const,
    label: "Видео",
    icon: Video,
    color: "bg-blue-500",
    description: "Видео треки",
  },
  {
    type: "audio" as const,
    label: "Аудио",
    icon: Volume2,
    color: "bg-green-500",
    description: "Аудио треки",
  },
  {
    type: "image" as const,
    label: "Изображения",
    icon: Image,
    color: "bg-purple-500",
    description: "Изображения и фото",
  },
  {
    type: "music" as const,
    label: "Музыка",
    icon: Music,
    color: "bg-orange-500",
    description: "Музыкальные треки",
  },
  {
    type: "subtitle" as const,
    label: "Субтитры",
    icon: Type,
    color: "bg-yellow-500",
    description: "Текст и субтитры",
  },
]

interface TrackControlsPanelProps {
  className?: string
}

export function TrackControlsPanel({ className }: TrackControlsPanelProps) {
  const { tracks, toggleTrackVisibility, toggleTrackLock } = useTracks()

  return (
    <div className={cn("h-full bg-muted/30 border-r", className)}>
      <ResizablePanelGroup direction="vertical">
        {/* Панель треков */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="flex flex-col h-full">
            {/* Список треков */}
            <div className="flex-1 overflow-auto">
              {tracks.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Треки не найдены</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2">
                    Треки проекта
                  </h4>
                  {tracks.map((track) => {
                    const trackTypeInfo = TRACK_TYPES.find((t) => t.type === track.type)
                    const Icon = trackTypeInfo?.icon || Video

                    return (
                      <div key={track.id} className="p-3 bg-background rounded-md border shadow-sm space-y-2">
                        {/* Заголовок трека */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center min-w-0 flex-1">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full mr-2 shrink-0",
                                trackTypeInfo?.color || "bg-gray-500",
                              )}
                            />
                            <Icon className="w-3 h-3 mr-2 shrink-0" />
                            <span className="text-xs font-medium truncate">{track.name}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs ml-2">
                            {track.type}
                          </Badge>
                        </div>

                        {/* Контролы трека */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleTrackVisibility(track.id)}
                            aria-label="toggle visibility"
                            title={track.isHidden ? "Показать трек" : "Скрыть трек"}
                          >
                            {!track.isHidden ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3 text-muted-foreground" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleTrackLock(track.id)}
                            aria-label="toggle lock"
                            title={track.isLocked ? "Разблокировать трек" : "Заблокировать трек"}
                          >
                            {track.isLocked ? (
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            ) : (
                              <Unlock className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Панель персон */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="p-2">
            <PersonsPanel />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
