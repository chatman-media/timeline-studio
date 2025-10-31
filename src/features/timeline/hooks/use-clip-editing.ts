import { useCallback, useRef, useState } from "react"
import type { TimelineClip as DomainTimelineClip } from "@/domains/video-editing/types"
import { EDIT_MODES } from "../types/edit-modes"
import { getClipTrimBounds, getSlideBounds, getSlipBounds } from "../utils/edit-operations"
import { DEFAULT_SNAP_CONFIG, findSnapPoints, snapTime } from "../utils/snap-engine"
import { useEditModeContext } from "./use-edit-mode"
import { useTimeline } from "./use-timeline"

interface UseClipEditingOptions {
  snapConfig?: typeof DEFAULT_SNAP_CONFIG
  onEditStart?: () => void
  onEditEnd?: (committed: boolean) => void
}

export function useClipEditing(clipId: string, options: UseClipEditingOptions = {}) {
  const { project, currentTime, send } = useTimeline()
  
  // Мок UI state для восстановления функциональности
  const uiState = { timeScale: 50 } // TODO: Получать из контекста
  const { editMode } = useEditModeContext()
  const [isEditing, setIsEditing] = useState(false)
  const [preview, setPreview] = useState<{
    startTime: number
    duration: number
    offset?: number
  } | null>(null)

  const editStartRef = useRef<{
    startTime: number
    duration: number
    offset: number
    mouseX: number
  } | null>(null)

  const snapConfig = options.snapConfig || DEFAULT_SNAP_CONFIG

  // Find the clip and track
  const { clip, track } = (() => {
    if (!project) return { clip: null, track: null }

    for (const section of project.sections) {
      for (const track of section.tracks) {
        const clip = track.clips.find((c) => c.id === clipId)
        if (clip) return { clip, track }
      }
    }

    for (const track of project.globalTracks) {
      const clip = track.clips.find((c) => c.id === clipId)
      if (clip) return { clip, track }
    }

    return { clip: null, track: null }
  })()

  // Start trim operation
  const handleTrimStart = useCallback(
    (_edge: "start" | "end", mouseX: number) => {
      if (!clip || !track) return

      editStartRef.current = {
        startTime: clip.startTime,
        duration: clip.duration,
        offset: (clip as DomainTimelineClip).sourceIn || 0, // domain клипы используют sourceIn
        mouseX,
      }

      setIsEditing(true)
      options.onEditStart?.()
    },
    [clip, track, options],
  )

  // Handle trim movement
  const handleTrimMove = useCallback(
    (deltaX: number) => {
      if (!clip || !track || !editStartRef.current || !project) return

      const timeScale = uiState.timeScale
      const timeDelta = deltaX / timeScale

      // Calculate new values based on edit mode
      let newStartTime = editStartRef.current.startTime
      let newDuration = editStartRef.current.duration
      let newOffset = editStartRef.current.offset

      switch (editMode) {
        case EDIT_MODES.TRIM: {
          // Simple trim without ripple
          const bounds = getClipTrimBounds(clip as any, "start", track as any)

          if (timeDelta > 0) {
            // Trimming start forward
            newStartTime = Math.min(editStartRef.current.startTime + timeDelta, bounds.max)
            newDuration = editStartRef.current.duration - (newStartTime - editStartRef.current.startTime)
            newOffset = editStartRef.current.offset + (newStartTime - editStartRef.current.startTime)
          } else {
            // Trimming start backward
            newStartTime = Math.max(editStartRef.current.startTime + timeDelta, bounds.min)
            newDuration = editStartRef.current.duration - (newStartTime - editStartRef.current.startTime)
            newOffset = editStartRef.current.offset + (newStartTime - editStartRef.current.startTime)
          }
          break
        }

        case EDIT_MODES.RIPPLE:
          // Ripple trim affects subsequent clips
          // This is handled by the state machine
          newStartTime = editStartRef.current.startTime + timeDelta
          newDuration = editStartRef.current.duration - timeDelta
          newOffset = editStartRef.current.offset + timeDelta
          break

        case EDIT_MODES.SLIP: {
          // Slip only changes offset
          const slipBounds = getSlipBounds(clip as any)
          newOffset = Math.max(slipBounds.min, Math.min(slipBounds.max, editStartRef.current.offset + timeDelta))
          break
        }

        case EDIT_MODES.SLIDE: {
          // Slide moves clip and adjusts neighbors
          const slideBounds = getSlideBounds(clip as any, track as any)
          const slideAmount = Math.max(slideBounds.min, Math.min(slideBounds.max, timeDelta))
          newStartTime = editStartRef.current.startTime + slideAmount
          break
        }

        default:
          // No changes for other modes
          break
      }

      // Apply snapping
      const snapPoints = findSnapPoints(
        project as any,
        0,
        project.duration * timeScale,
        timeScale,
        currentTime,
        snapConfig,
        clipId,
      )

      const snappedResult = snapTime(newStartTime, snapPoints, timeScale, snapConfig)
      if (snappedResult.snapped) {
        newStartTime = snappedResult.time
      }

      setPreview({
        startTime: newStartTime,
        duration: newDuration,
        offset: newOffset,
      })
    },
    [clip, track, editMode, project, uiState, currentTime, snapConfig],
  )

  // Complete trim operation
  const handleTrimEnd = useCallback(
    (committed: boolean) => {
      if (!clip || !track || !preview) return

      if (committed) {
        switch (editMode) {
          case EDIT_MODES.TRIM:
            send({
              type: "TRIM_CLIP",
              clipId,
              newStartTime: preview.startTime,
              newDuration: preview.duration,
            })
            break

          case EDIT_MODES.RIPPLE:
            send({
              type: "RIPPLE_EDIT",
              clipId,
              edge: "start",
              delta: preview.startTime - clip.startTime,
            })
            break

          case EDIT_MODES.SLIP:
            send({
              type: "SLIP_EDIT",
              clipId,
              delta: preview.offset! - ((clip as DomainTimelineClip).sourceIn || 0),
            })
            break

          case EDIT_MODES.SLIDE:
            send({
              type: "SLIDE_EDIT",
              clipId,
              delta: preview.startTime - clip.startTime,
            })
            break

          default:
            // No action for other modes
            break
        }
      }

      setIsEditing(false)
      setPreview(null)
      editStartRef.current = null
      options.onEditEnd?.(committed)
    },
    [clip, preview, editMode, send, clipId, options],
  )

  // Split clip at position
  const handleSplit = useCallback(
    (time: number) => {
      if (!clip) return

      if (time > clip.startTime && time < clip.startTime + clip.duration) {
        send({
          type: "SPLIT_CLIP",
          clipId,
          splitTime: time,
        })
      }
    },
    [clip, clipId, send],
  )

  return {
    isEditing,
    preview,
    handleTrimStart,
    handleTrimMove,
    handleTrimEnd,
    handleSplit,
    clip,
    track,
  }
}
