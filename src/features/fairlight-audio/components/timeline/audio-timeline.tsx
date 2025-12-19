import { useCallback, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useAudioClipEditor } from "../../hooks/use-audio-clip-editor"
import type { AudioClip } from "../../services/audio-clip-editor"
import { AudioClipEditorComponent } from "../editor/audio-clip-editor"
import { AudioClipComponent } from "./audio-clip"

const logger = createLogger("AudioTimeline")

interface AudioTrack {
  id: string
  name: string
  clips: AudioClip[]
  isMuted: boolean
  isSolo: boolean
}

interface AudioTimelineProps {
  tracks: AudioTrack[]
  pixelsPerSecond?: number
  trackHeight?: number
  onTracksUpdate: (tracks: AudioTrack[]) => void
}

export function AudioTimeline({ tracks, pixelsPerSecond = 50, trackHeight = 80, onTracksUpdate }: AudioTimelineProps) {
  const [selectedClip, setSelectedClip] = useState<{
    trackId: string
    clipId: string
  } | null>(null)

  const { splitClip } = useAudioClipEditor()

  const handleClipUpdate = useCallback(
    (trackId: string, updatedClip: AudioClip) => {
      const updatedTracks = tracks.map((track) => {
        if (track.id !== trackId) return track

        return {
          ...track,
          clips: track.clips.map((clip) => (clip.id === updatedClip.id ? updatedClip : clip)),
        }
      })

      onTracksUpdate(updatedTracks)
    },
    [tracks, onTracksUpdate],
  )

  const handleClipSplit = useCallback(
    async (trackId: string, clipId: string, splitTime: number) => {
      const track = tracks.find((t) => t.id === trackId)
      const clip = track?.clips.find((c) => c.id === clipId)

      if (!track || !clip) return

      try {
        const [firstPart, secondPart] = await splitClip(clip, splitTime)

        const updatedTracks = tracks.map((t) => {
          if (t.id !== trackId) return t

          return {
            ...t,
            clips: t.clips.flatMap((c) => (c.id === clipId ? [firstPart, secondPart] : c)),
          }
        })

        onTracksUpdate(updatedTracks)
      } catch (error) {
        logger.error("Failed to split clip:", { error })
      }
    },
    [tracks, onTracksUpdate, splitClip],
  )

  const handleClipPositionChange = useCallback(
    (trackId: string, clipId: string, newStartTime: number) => {
      const updatedTracks = tracks.map((track) => {
        if (track.id !== trackId) return track

        return {
          ...track,
          clips: track.clips.map((clip) => (clip.id === clipId ? { ...clip, startTime: newStartTime } : clip)),
        }
      })

      onTracksUpdate(updatedTracks)
    },
    [tracks, onTracksUpdate],
  )

  const handleClipDurationChange = useCallback(
    (trackId: string, clipId: string, newDuration: number) => {
      const updatedTracks = tracks.map((track) => {
        if (track.id !== trackId) return track

        return {
          ...track,
          clips: track.clips.map((clip) => (clip.id === clipId ? { ...clip, duration: newDuration } : clip)),
        }
      })

      onTracksUpdate(updatedTracks)
    },
    [tracks, onTracksUpdate],
  )

  const selectedClipData = selectedClip
    ? tracks.find((t) => t.id === selectedClip.trackId)?.clips.find((c) => c.id === selectedClip.clipId)
    : null

  return (
    <div className="flex h-full" data-oid="r8aihr6">
      {/* Timeline tracks */}
      <div className="flex-1 bg-zinc-950 overflow-x-auto overflow-y-auto" data-oid="yfdbpkb">
        <div className="min-w-[2000px]" data-oid="uv9_x3i">
          {/* Time ruler */}
          <div className="h-8 bg-zinc-900 border-b border-zinc-800 relative" data-oid="zbqh:qh">
            {Array.from({ length: 41 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-zinc-700"
                style={{ left: `${i * pixelsPerSecond}px` }}
                data-oid="vmi:-qc"
              >
                <span className="absolute top-1 left-1 text-xs text-zinc-400" data-oid="gcw9vmt">
                  {i}s
                </span>
              </div>
            ))}
          </div>

          {/* Tracks */}
          {tracks.map((track) => (
            <div
              key={track.id}
              className={cn("relative border-b border-zinc-800", track.isMuted && "opacity-50")}
              style={{ height: `${trackHeight}px` }}
              data-oid="6i_c4ln"
            >
              {/* Track header */}
              <div
                className="absolute left-0 top-0 w-32 h-full bg-zinc-900 border-r border-zinc-800 flex items-center px-2 z-10"
                data-oid="wjw2dhm"
              >
                <span className="text-sm text-zinc-300 truncate" data-oid="0y452r5">
                  {track.name}
                </span>
              </div>

              {/* Clips */}
              <div className="absolute left-32 right-0 top-0 bottom-0" data-oid="7ycl6ve">
                {track.clips.map((clip) => (
                  <AudioClipComponent
                    key={clip.id}
                    clip={clip}
                    pixelsPerSecond={pixelsPerSecond}
                    trackHeight={trackHeight}
                    isSelected={selectedClip?.trackId === track.id && selectedClip?.clipId === clip.id}
                    onSelect={() => setSelectedClip({ trackId: track.id, clipId: clip.id })}
                    onPositionChange={(time) => handleClipPositionChange(track.id, clip.id, time)}
                    onDurationChange={(duration) => handleClipDurationChange(track.id, clip.id, duration)}
                    data-oid="0vcbqpv"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clip editor panel */}
      {selectedClipData && selectedClip && (
        <div className="w-80 bg-zinc-900 border-l border-zinc-800 p-4 overflow-y-auto" data-oid="1ngydgi">
          <AudioClipEditorComponent
            clip={selectedClipData}
            onUpdate={(updatedClip) => handleClipUpdate(selectedClip.trackId, updatedClip)}
            onSplit={(splitTime) => handleClipSplit(selectedClip.trackId, selectedClip.clipId, splitTime)}
            data-oid="6r6eyhc"
          />
        </div>
      )}
    </div>
  )
}
