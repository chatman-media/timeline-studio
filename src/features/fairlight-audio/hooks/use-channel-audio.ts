import { useCallback, useEffect, useRef, useState } from "react"

import { type MediaFile } from "@/features/media"
import { useTimeline } from "@/features/timeline/hooks"
import { createLogger } from "@/lib/tauri-logger"
import { AudioFileManager } from "../services/audio-file-manager"
import { useAudioEngine } from "./use-audio-engine"

const logger = createLogger("UseChannelAudio")

export function useChannelAudio(channelId: string, trackId?: string) {
  const timeline = useTimeline()
  const fileManagerRef = useRef(new AudioFileManager())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map())
  const [activeClipId, setActiveClipId] = useState<string | null>(null)

  const { connectMediaElement, isInitialized } = useAudioEngine()

  // Find audio clips for this track
  const getAudioClipsForTrack = useCallback(() => {
    if (!timeline.project || !trackId) return []

    const clips: Array<{ id: string; mediaId: string; startTime: number }> = []

    if (timeline.project.sections) {
      timeline.project.sections.forEach((section) => {
        section.tracks.forEach((track) => {
          if (track.id === trackId) {
            track.clips.forEach((clip) => {
              if (clip.mediaId) {
                clips.push({
                  id: clip.id,
                  mediaId: clip.mediaId,
                  startTime: clip.startTime,
                })
              }
            })
          }
        })
      })
    }

    return clips
  }, [timeline.project, trackId])

  // Load audio files for all clips
  useEffect(() => {
    if (!trackId || !isInitialized) return

    const loadAudio = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const clips = getAudioClipsForTrack()
        logger.info(`[AudioLoader] Found ${clips.length} clips for track ${trackId}`)

        if (clips.length === 0) {
          setAudioElements(new Map())
          setActiveClipId(null)
          return
        }

        const newAudioElements = new Map<string, HTMLAudioElement>()

        // Load all clips
        for (const clip of clips) {
          logger.info(`[AudioLoader] Loading clip ${clip.id} with media ${clip.mediaId}`)

          // Get media file path from project resources
          const mediaFile = timeline.project?.resources?.media?.find((m) => m.id === clip.mediaId) as
            | MediaFile
            | undefined
          if (!mediaFile) {
            logger.error(`[AudioLoader] Media file ${clip.mediaId} not found in project resources`)
            continue
          }

          // Check if it's actually an audio file
          if (!mediaFile.isAudio) {
            logger.warn(`[AudioLoader] Media file ${clip.mediaId} is not marked as audio`)
          }

          logger.info(`[AudioLoader] Loading audio from: ${mediaFile.path}`)

          try {
            // Load audio file
            const audioFile = await fileManagerRef.current.loadAudioFile(clip.mediaId, mediaFile.path)

            if (audioFile.element) {
              newAudioElements.set(clip.id, audioFile.element)

              // Set start time offset for the clip
              audioFile.element.dataset.startTime = clip.startTime.toString()
            }
          } catch (clipErr) {
            logger.error(`[AudioLoader] Failed to load clip ${clip.id}:`, { error: clipErr })
          }
        }

        setAudioElements(newAudioElements)

        // Set the first clip as active if we have any
        if (newAudioElements.size > 0) {
          const firstClipId = clips[0].id
          setActiveClipId(firstClipId)

          // Connect the first clip to audio engine
          const firstElement = newAudioElements.get(firstClipId)
          if (firstElement) {
            connectMediaElement(channelId, firstElement)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audio")
        setAudioElements(new Map())
        setActiveClipId(null)
      } finally {
        setIsLoading(false)
      }
    }

    void loadAudio()

    // Cleanup
    return () => {
      if (trackId) {
        fileManagerRef.current.unloadAll()
      }
    }
  }, [trackId, channelId, isInitialized, connectMediaElement, getAudioClipsForTrack, timeline.project])

  // Find which clip should be playing at current time
  const updateActiveClip = useCallback(
    (currentTime: number) => {
      const clips = getAudioClipsForTrack()

      for (const clip of clips) {
        const clipStartTime = Number(audioElements.get(clip.id)?.dataset.startTime || clip.startTime)
        const element = audioElements.get(clip.id)

        if (element && currentTime >= clipStartTime && currentTime < clipStartTime + (element.duration || 0)) {
          if (activeClipId !== clip.id) {
            // Switch to new clip
            const prevElement = activeClipId ? audioElements.get(activeClipId) : null
            if (prevElement) {
              prevElement.pause()
            }

            setActiveClipId(clip.id)
            connectMediaElement(channelId, element)
          }
          return clip
        }
      }

      // No active clip
      if (activeClipId) {
        const prevElement = audioElements.get(activeClipId)
        if (prevElement) {
          prevElement.pause()
        }
        setActiveClipId(null)
      }

      return null
    },
    [audioElements, activeClipId, channelId, connectMediaElement, getAudioClipsForTrack],
  )

  // Playback control
  const play = useCallback(() => {
    if (!timeline.isPlaying) return

    const activeClip = updateActiveClip(timeline.currentTime)
    if (activeClip && activeClipId) {
      const element = audioElements.get(activeClipId)
      if (element) {
        const clipStartTime = Number(element.dataset.startTime || activeClip.startTime)
        element.currentTime = timeline.currentTime - clipStartTime
        void element.play()
      }
    }
  }, [audioElements, timeline.isPlaying, timeline.currentTime, activeClipId, updateActiveClip])

  const pause = useCallback(() => {
    audioElements.forEach((element) => {
      element.pause()
    })
  }, [audioElements])

  const seek = useCallback(
    (time: number) => {
      const activeClip = updateActiveClip(time)
      if (activeClip && activeClipId) {
        const element = audioElements.get(activeClipId)
        if (element) {
          const clipStartTime = Number(element.dataset.startTime || activeClip.startTime)
          element.currentTime = Math.max(0, time - clipStartTime)
        }
      }
    },
    [audioElements, activeClipId, updateActiveClip],
  )

  // Sync with timeline playback
  useEffect(() => {
    if (timeline.isPlaying) {
      play()
    } else {
      pause()
    }
  }, [timeline.isPlaying, play, pause])

  // Sync with timeline seek
  useEffect(() => {
    seek(timeline.currentTime)
  }, [timeline.currentTime, seek])

  return {
    isLoading,
    error,
    audioElement: activeClipId ? audioElements.get(activeClipId) || null : null,
    audioElements,
    activeClipId,
    play,
    pause,
    seek,
  }
}
