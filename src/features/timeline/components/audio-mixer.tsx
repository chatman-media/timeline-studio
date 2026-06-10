import { Button } from "@timeline-studio/ui/components/button"
import { Label } from "@timeline-studio/ui/components/label"
import { Slider } from "@timeline-studio/ui/components/slider"
import { AudioWaveform, Headphones, Mic, Music, Volume2, VolumeX, Wind } from "lucide-react"
import { useMemo } from "react"
import type { TimelineTrack, TrackType } from "@/features/timeline/types"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useTimeline } from "../hooks/state/use-timeline"
import { useTracks } from "../hooks/state/use-tracks"

const logger = createLogger("AudioMixer")

interface AudioMixerProps {
  className?: string
}

/**
 * Аудио микшер для управления громкостью и эффектами аудио треков
 */
export function AudioMixer({ className }: AudioMixerProps) {
  const { project } = useTimeline()
  const { updateTrack } = useTracks()

  // Получаем все аудио треки
  const audioTracks = useMemo(() => {
    if (!project) return []

    type AudioTrackWithSection = TimelineTrack & { sectionName: string }
    const tracks: AudioTrackWithSection[] = []

    // Собираем треки из секций
    project.sections?.forEach((section) => {
      section.tracks.forEach((track) => {
        if (isAudioTrack(track.type)) {
          tracks.push({
            ...track,
            sectionName: section.name,
            // Map from domain Track to features TimelineTrack properties
            transitions: [],
            isLocked: track.locked ?? false,
            isMuted: track.muted ?? false,
            isHidden: false,
            isSolo: track.solo ?? false,
            trackEffects: [],
            trackFilters: [],
          } as AudioTrackWithSection)
        }
      })
    })

    // Добавляем глобальные треки
    project.globalTracks?.forEach((track) => {
      if (isAudioTrack(track.type)) {
        tracks.push({
          ...track,
          sectionName: "Global",
          // Map from domain Track to features TimelineTrack properties
          transitions: [],
          isLocked: track.locked ?? false,
          isMuted: track.muted ?? false,
          isHidden: false,
          isSolo: track.solo ?? false,
          trackEffects: [],
          trackFilters: [],
        } as AudioTrackWithSection)
      }
    })

    return tracks
  }, [project])

  const getTrackIcon = (type: TrackType) => {
    switch (type) {
      case "audio":
        return <Volume2 className="h-4 w-4" data-oid="v8o4--y" />
      case "music":
        return <Music className="h-4 w-4" data-oid="_can8y-" />
      case "voiceover":
        return <Mic className="h-4 w-4" data-oid="4_aq7g4" />
      case "sfx":
        return <AudioWaveform className="h-4 w-4" data-oid="8zfez-y" />
      case "ambient":
        return <Wind className="h-4 w-4" data-oid="3xfp.98" />
      default:
        return <Volume2 className="h-4 w-4" data-oid="e.r.g8j" />
    }
  }

  const getTrackColor = (type: TrackType) => {
    switch (type) {
      case "audio":
        return "bg-blue-500"
      case "music":
        return "bg-purple-500"
      case "voiceover":
        return "bg-green-500"
      case "sfx":
        return "bg-orange-500"
      case "ambient":
        return "bg-cyan-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleVolumeChange = (trackId: string, value: number[]) => {
    void updateTrack(trackId, { volume: value[0] })
  }

  const handleMute = (trackId: string, currentMuted: boolean) => {
    void updateTrack(trackId, { isMuted: !currentMuted })
  }

  const handleSolo = (trackId: string, currentSolo: boolean) => {
    void updateTrack(trackId, { isSolo: !currentSolo })
  }

  if (audioTracks.length === 0) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)} data-oid="1jid7a5">
        <p data-oid="u0qlcyz">Нет аудио треков</p>
        <p className="text-sm mt-2" data-oid="5b4yg:d">
          Добавьте аудио файлы на timeline
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4 p-4", className)} data-oid="fk4cmf5">
      <div className="flex items-center justify-between mb-4" data-oid="e2im.t4">
        <h3 className="text-lg font-semibold" data-oid="eq1ahal">
          Аудио микшер
        </h3>
        <div className="flex items-center gap-2" data-oid="rta61tb">
          <Label className="text-sm text-muted-foreground" data-oid="hsv1m56">
            Master
          </Label>
          <Slider
            className="w-24"
            min={0}
            max={1.5}
            step={0.01}
            defaultValue={[1]}
            onValueChange={(value) => {
              // TODO: Implement master volume
              logger.info("Master volume:", { volume: value[0] })
            }}
            data-oid="1aetngy"
          />
        </div>
      </div>

      <div className="space-y-3" data-oid="01pqw8i">
        {audioTracks.map((track) => (
          <div key={track.id} className="bg-secondary/50 rounded-lg p-3 space-y-3" data-oid="6kgjefu">
            {/* Заголовок трека */}
            <div className="flex items-center justify-between" data-oid=".5yjrz_">
              <div className="flex items-center gap-2" data-oid="rxd4swf">
                <div className={cn("w-2 h-8 rounded", getTrackColor(track.type))} data-oid="-j9me-v" />
                {getTrackIcon(track.type)}
                <div data-oid="p39che1">
                  <p className="font-medium text-sm" data-oid="mvcqxly">
                    {track.name}
                  </p>
                  <p className="text-xs text-muted-foreground" data-oid=":r2nqgv">
                    {track.sectionName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1" data-oid="g3239p6">
                <Button
                  size="icon"
                  variant={track.isSolo ? "default" : "ghost"}
                  className="h-7 w-7"
                  onClick={() => handleSolo(track.id, track.isSolo)}
                  title="Solo"
                  data-oid="u4f3.5_"
                >
                  <Headphones className="h-3 w-3" data-oid="peb1rtn" />
                </Button>
                <Button
                  size="icon"
                  variant={track.isMuted ? "destructive" : "ghost"}
                  className="h-7 w-7"
                  onClick={() => handleMute(track.id, track.isMuted)}
                  title={track.isMuted ? "Unmute" : "Mute"}
                  data-oid="-22nkj1"
                >
                  <VolumeX className="h-3 w-3" data-oid="8soj3uh" />
                </Button>
              </div>
            </div>

            {/* Контролы громкости и панорамы */}
            <div className="space-y-2" data-oid="xo-a7ej">
              {/* Громкость */}
              <div className="flex items-center gap-3" data-oid="_03ic1x">
                <Label className="text-xs w-12" data-oid="pae15.3">
                  Vol
                </Label>
                <Slider
                  className="flex-1"
                  min={0}
                  max={2}
                  step={0.01}
                  value={[track.volume]}
                  onValueChange={(value) => handleVolumeChange(track.id, value)}
                  disabled={track.isMuted}
                  data-oid="l73cel2"
                />

                <span className="text-xs w-10 text-right" data-oid="6pxpejq">
                  {Math.round(track.volume * 100)}%
                </span>
              </div>

              {/* Панорама */}
              <div className="flex items-center gap-3" data-oid="5dohxb2">
                <Label className="text-xs w-12" data-oid="2emkfb2">
                  Pan
                </Label>
                <Slider
                  className="flex-1"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={[(track as any).pan || 0]}
                  onValueChange={(value) => updateTrack(track.id, { pan: value[0] } as any)}
                  disabled={track.isMuted}
                  data-oid="p.yw0yb"
                />

                <span className="text-xs w-10 text-right" data-oid="x-:rwby">
                  {(track as any).pan === 0
                    ? "C"
                    : (track as any).pan > 0
                      ? `${Math.round((track as any).pan * 100)}R`
                      : `${Math.round(-(track as any).pan * 100)}L`}
                </span>
              </div>
            </div>

            {/* VU метр (заглушка) */}
            <div className="h-2 bg-background rounded-full overflow-hidden" data-oid="5iyb6sm">
              <div
                className="h-full bg-linear-to-r from-green-500 via-yellow-500 to-red-500"
                style={{
                  width: `${track.isMuted ? 0 : 60 + Math.random() * 20}%`,
                  transition: "width 100ms",
                }}
                data-oid="nzzwg8w"
              />
            </div>

            {/* Индикаторы эффектов */}
            {(track as any).trackEffects?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1" data-oid="s8khpyw">
                {(track as any).trackEffects.map((_: any, index: number) => (
                  <div
                    key={index}
                    className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded"
                    data-oid="dm4va1x"
                  >
                    FX
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Проверка, является ли трек аудио треком
function isAudioTrack(type: TrackType): boolean {
  return ["audio", "music", "voiceover", "sfx", "ambient"].includes(type)
}
