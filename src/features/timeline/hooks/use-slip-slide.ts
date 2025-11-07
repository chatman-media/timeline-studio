/**
 * Hook для SLIP/SLIDE редактирования
 * Предоставляет удобный интерфейс для выполнения SLIP и SLIDE операций
 */

import { useCallback, useRef, useState } from "react"
import { SlipSlideService } from "../services/slip-slide-service"
import type { TimelineClip, TimelineTrack } from "../types"
import { EDIT_MODES } from "../types/edit-modes"
import { useEditModeContext } from "./use-edit-mode"
import { useTimeline } from "./use-timeline"

export interface SlipSlidePreview {
  mode: "slip" | "slide"
  clipId: string
  delta: number
  visualHints: any
}

export interface UseSlipSlideReturn {
  // Состояние
  isEditing: boolean
  preview: SlipSlidePreview | null

  // Операции SLIP
  startSlip: (clipId: string, mouseX: number) => void
  updateSlip: (mouseX: number) => void
  commitSlip: () => void
  cancelSlip: () => void
  canSlip: (clipId: string) => boolean

  // Операции SLIDE
  startSlide: (clipId: string, mouseX: number) => void
  updateSlide: (mouseX: number) => void
  commitSlide: () => void
  cancelSlide: () => void
  canSlide: (clipId: string) => boolean
}

export function useSlipSlide(): UseSlipSlideReturn {
  const { project, saveProject, uiState } = useTimeline()
  const { editMode } = useEditModeContext()
  const [isEditing, setIsEditing] = useState(false)
  const [preview, setPreview] = useState<SlipSlidePreview | null>(null)

  const editStartRef = useRef<{
    clipId: string
    mode: "slip" | "slide"
    startMouseX: number
    startOffset: number
    startPosition: number
    clip: TimelineClip
    track: TimelineTrack
  } | null>(null)

  // Находит клип и трек по ID
  const findClipAndTrack = useCallback(
    (clipId: string): { clip: TimelineClip | null; track: TimelineTrack | null } => {
      if (!project) return { clip: null, track: null }

      // Ищем в секциях
      for (const section of project.sections) {
        for (const track of section.tracks) {
          const clip = track.clips.find((c) => c.id === clipId)
          if (clip) return { clip, track }
        }
      }

      // Ищем в глобальных треках
      for (const track of project.globalTracks) {
        const clip = track.clips.find((c) => c.id === clipId)
        if (clip) return { clip, track }
      }

      return { clip: null, track: null }
    },
    [project],
  )

  // SLIP операции
  const startSlip = useCallback(
    (clipId: string, mouseX: number) => {
      if (editMode !== EDIT_MODES.SLIP) return

      const { clip, track } = findClipAndTrack(clipId)
      if (!clip || !track) return

      editStartRef.current = {
        clipId,
        mode: "slip",
        startMouseX: mouseX,
        startOffset: clip.offset,
        startPosition: clip.startTime,
        clip,
        track,
      }

      setIsEditing(true)
      setPreview({
        mode: "slip",
        clipId,
        delta: 0,
        visualHints: SlipSlideService.getSlipVisualHints(clip, 0),
      })
    },
    [editMode, findClipAndTrack],
  )

  const updateSlip = useCallback(
    (mouseX: number) => {
      if (!editStartRef.current || editStartRef.current.mode !== "slip") return

      const deltaX = mouseX - editStartRef.current.startMouseX
      const deltaTime = deltaX / uiState.timeScale

      const visualHints = SlipSlideService.getSlipVisualHints(editStartRef.current.clip, deltaTime)

      setPreview({
        mode: "slip",
        clipId: editStartRef.current.clipId,
        delta: deltaTime,
        visualHints,
      })
    },
    [uiState.timeScale],
  )

  const commitSlip = useCallback(async () => {
    if (!editStartRef.current || !preview || preview.mode !== "slip" || !project) return

    const updatedProject = SlipSlideService.applySlipToProject(project, editStartRef.current.clipId, preview.delta)

    if (updatedProject) {
      // В новой архитектуре saveProject не принимает параметры
      // Изменения уже применены к project через updateClip
      await saveProject()
    }

    setIsEditing(false)
    setPreview(null)
    editStartRef.current = null
  }, [preview, project, saveProject])

  const cancelSlip = useCallback(() => {
    setIsEditing(false)
    setPreview(null)
    editStartRef.current = null
  }, [])

  const canSlip = useCallback(
    (clipId: string): boolean => {
      const { clip } = findClipAndTrack(clipId)
      return clip ? SlipSlideService.canSlipEdit(clip) : false
    },
    [findClipAndTrack],
  )

  // SLIDE операции
  const startSlide = useCallback(
    (clipId: string, mouseX: number) => {
      if (editMode !== EDIT_MODES.SLIDE) return

      const { clip, track } = findClipAndTrack(clipId)
      if (!clip || !track) return

      editStartRef.current = {
        clipId,
        mode: "slide",
        startMouseX: mouseX,
        startOffset: clip.offset,
        startPosition: clip.startTime,
        clip,
        track,
      }

      setIsEditing(true)
      setPreview({
        mode: "slide",
        clipId,
        delta: 0,
        visualHints: SlipSlideService.getSlideVisualHints(clip, track, 0),
      })
    },
    [editMode, findClipAndTrack],
  )

  const updateSlide = useCallback(
    (mouseX: number) => {
      if (!editStartRef.current || editStartRef.current.mode !== "slide") return

      const deltaX = mouseX - editStartRef.current.startMouseX
      const deltaTime = deltaX / uiState.timeScale

      const visualHints = SlipSlideService.getSlideVisualHints(
        editStartRef.current.clip,
        editStartRef.current.track,
        deltaTime,
      )

      setPreview({
        mode: "slide",
        clipId: editStartRef.current.clipId,
        delta: deltaTime,
        visualHints,
      })
    },
    [uiState.timeScale],
  )

  const commitSlide = useCallback(async () => {
    if (!editStartRef.current || !preview || preview.mode !== "slide" || !project) return

    const updatedProject = SlipSlideService.applySlideToProject(project, editStartRef.current.clipId, preview.delta)

    if (updatedProject) {
      // В новой архитектуре saveProject не принимает параметры
      // Изменения уже применены к project через updateClip
      await saveProject()
    }

    setIsEditing(false)
    setPreview(null)
    editStartRef.current = null
  }, [preview, project, saveProject])

  const cancelSlide = useCallback(() => {
    setIsEditing(false)
    setPreview(null)
    editStartRef.current = null
  }, [])

  const canSlide = useCallback(
    (clipId: string): boolean => {
      const { clip, track } = findClipAndTrack(clipId)
      return clip && track ? SlipSlideService.canSlideEdit(clip, track) : false
    },
    [findClipAndTrack],
  )

  return {
    isEditing,
    preview,
    startSlip,
    updateSlip,
    commitSlip,
    cancelSlip,
    canSlip,
    startSlide,
    updateSlide,
    commitSlide,
    cancelSlide,
    canSlide,
  }
}
