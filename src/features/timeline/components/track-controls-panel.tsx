/**
 * TrackControlsPanel - Левая панель управления треками
 *
 * Компонент для профессионального управления треками:
 * - Отображение списка треков
 * - Добавление новых треков
 * - Управление видимостью и блокировкой
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@timeline-studio/ui/components/resizable"
import { Eye, EyeOff, Image, Lock, Music, Type, Unlock, Video, Volume2 } from "lucide-react"
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
    <div className={cn("h-full bg-muted/30 border-r", className)} data-oid="ycgnrb0">
      <ResizablePanelGroup direction="vertical" data-oid="-co_pf8">
        {/* Панель треков */}
        <ResizablePanel defaultSize={60} minSize={40} data-oid="f-1_1uk">
          <div className="flex flex-col h-full" data-oid="pf24u.8">
            {/* Список треков */}
            <div className="flex-1 overflow-auto" data-oid="ap25.g4">
              {tracks.length === 0 ? (
                <div className="p-4 text-center" data-oid="63rl8mz">
                  <p className="text-xs text-muted-foreground" data-oid="sk.urai">
                    Треки не найдены
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2" data-oid="hooi21m">
                  <h4
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2"
                    data-oid="v9hn4uu"
                  >
                    Треки проекта
                  </h4>
                  {tracks.map((track) => {
                    const trackTypeInfo = TRACK_TYPES.find((t) => t.type === track.type)
                    const Icon = trackTypeInfo?.icon || Video

                    return (
                      <div
                        key={track.id}
                        className="p-3 bg-background rounded-md border shadow-sm space-y-2"
                        data-oid="kx2w2vo"
                      >
                        {/* Заголовок трека */}
                        <div className="flex items-center justify-between" data-oid="ew9trke">
                          <div className="flex items-center min-w-0 flex-1" data-oid="z-0.l0g">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full mr-2 shrink-0",
                                trackTypeInfo?.color || "bg-gray-500",
                              )}
                              data-oid="lp4_sqk"
                            />

                            <Icon className="w-3 h-3 mr-2 shrink-0" data-oid="4_fc8u2" />
                            <span className="text-xs font-medium truncate" data-oid="12pnxwe">
                              {track.name}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs ml-2" data-oid="5v033me">
                            {track.type}
                          </Badge>
                        </div>

                        {/* Контролы трека */}
                        <div className="flex items-center gap-1" data-oid="wa_:u1s">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleTrackVisibility(track.id)}
                            aria-label="toggle visibility"
                            title={track.isHidden ? "Показать трек" : "Скрыть трек"}
                            data-oid=":tgou8b"
                          >
                            {!track.isHidden ? (
                              <Eye className="w-3 h-3" data-oid="4un9bn6" />
                            ) : (
                              <EyeOff className="w-3 h-3 text-muted-foreground" data-oid="d_8y-28" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleTrackLock(track.id)}
                            aria-label="toggle lock"
                            title={track.isLocked ? "Разблокировать трек" : "Заблокировать трек"}
                            data-oid="m4r5zkb"
                          >
                            {track.isLocked ? (
                              <Lock className="w-3 h-3 text-muted-foreground" data-oid=":rww41:" />
                            ) : (
                              <Unlock className="w-3 h-3" data-oid="3dher49" />
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

        <ResizableHandle data-oid="t7w5lj8" />

        {/* Панель персон */}
        <ResizablePanel defaultSize={40} minSize={30} data-oid="6so24fm">
          <div className="p-2" data-oid="6ryd89p">
            <PersonsPanel data-oid="w7tbuep" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
