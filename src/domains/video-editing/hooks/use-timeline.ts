/**
 * Hook для работы с Timeline
 */

import { useCallback, useEffect, useState } from "react"
import type { TimelineExtendedContext } from "../machines/timeline-extended-machine"
import { getVideoEditingOrchestrator } from "../services/video-editing-orchestrator"

export function useTimeline() {
  const [orchestrator] = useState(() => getVideoEditingOrchestrator())
  const [state, setState] = useState<TimelineExtendedContext>(() => orchestrator.getTimelineState().context)

  // Подписка на изменения состояния
  useEffect(() => {
    const subscription = orchestrator.subscribeToTimeline((state) => {
      setState(state.context)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [orchestrator])

  // UI управление - используем timeline actor напрямую
  const setTimeScale = useCallback(
    (scale: number) => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({ type: "SET_TIME_SCALE", scale })
    },
    [orchestrator],
  )

  const setScrollPosition = useCallback(
    (x: number, y: number) => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({
        type: "SET_SCROLL_POSITION",
        x,
        y,
      })
    },
    [orchestrator],
  )

  const setEditMode = useCallback(
    (mode: "select" | "cut" | "trim" | "move") => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({ type: "SET_EDIT_MODE", mode })
    },
    [orchestrator],
  )

  const setSnapMode = useCallback(
    (mode: "none" | "grid" | "clips" | "markers") => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({ type: "SET_SNAP_MODE", mode })
    },
    [orchestrator],
  )

  // Selection управление
  const selectClip = useCallback(
    (clipId: string, addToSelection = false) => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({
        type: "SELECT_CLIPS",
        clipIds: [clipId],
        addToSelection,
      })
    },
    [orchestrator],
  )

  const selectTrack = useCallback(
    (trackId: string, addToSelection = false) => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({
        type: "SELECT_TRACKS",
        trackIds: [trackId],
        addToSelection,
      })
    },
    [orchestrator],
  )

  const selectMultipleClips = useCallback(
    (clipIds: string[], addToSelection = false) => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({
        type: "SELECT_CLIPS",
        clipIds,
        addToSelection,
      })
    },
    [orchestrator],
  )

  const clearSelection = useCallback(() => {
    const timelineActor = orchestrator.getActors().timeline
    timelineActor.send({ type: "CLEAR_SELECTION" })
  }, [orchestrator])

  // Clipboard операции
  const copyClips = useCallback(() => {
    const timelineActor = orchestrator.getActors().timeline
    timelineActor.send({ type: "COPY_CLIPS" })
  }, [orchestrator])

  const cutClips = useCallback(() => {
    const timelineActor = orchestrator.getActors().timeline
    timelineActor.send({ type: "CUT_CLIPS" })
  }, [orchestrator])

  const pasteClips = useCallback(
    (trackId: string, time: number) => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({
        type: "PASTE_CLIPS",
        trackId,
        time,
      })
    },
    [orchestrator],
  )

  const deleteSelected = useCallback(() => {
    const timelineActor = orchestrator.getActors().timeline
    timelineActor.send({ type: "DELETE_SELECTED" })
  }, [orchestrator])

  // Drag операции
  const startDragClip = useCallback(
    (clipId: string) => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({
        type: "START_DRAG_CLIP",
        clipId,
      })
    },
    [orchestrator],
  )

  const startDragTrack = useCallback(
    (trackId: string) => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({
        type: "START_DRAG_TRACK",
        trackId,
      })
    },
    [orchestrator],
  )

  const startDragResource = useCallback(
    (resourceType: "transition" | "effect" | "filter", resourceId: string) => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({
        type: "START_DRAG_RESOURCE",
        resourceType,
        resourceId,
      })
    },
    [orchestrator],
  )

  const endDrag = useCallback(() => {
    const timelineActor = orchestrator.getActors().timeline
    timelineActor.send({ type: "END_DRAG" })
  }, [orchestrator])

  // Toggle функции
  const toggleRecording = useCallback(() => {
    const timelineActor = orchestrator.getActors().timeline
    timelineActor.send({ type: "TOGGLE_RECORDING" })
  }, [orchestrator])

  const toggleWaveforms = useCallback(() => {
    const timelineActor = orchestrator.getActors().timeline
    timelineActor.send({ type: "TOGGLE_WAVEFORMS" })
  }, [orchestrator])

  const toggleThumbnails = useCallback(() => {
    const timelineActor = orchestrator.getActors().timeline
    timelineActor.send({ type: "TOGGLE_THUMBNAILS" })
  }, [orchestrator])

  const toggleMarkers = useCallback(() => {
    const timelineActor = orchestrator.getActors().timeline
    timelineActor.send({ type: "TOGGLE_MARKERS" })
  }, [orchestrator])

  // Project операции
  const createProject = useCallback(
    (name: string, settings?: any) => {
      orchestrator.createProject(name, settings)
    },
    [orchestrator],
  )

  const loadProject = useCallback(
    (path: string) => {
      orchestrator.loadProject(path)
    },
    [orchestrator],
  )

  const saveProject = useCallback(() => {
    orchestrator.saveProject()
  }, [orchestrator])

  // Clip операции через orchestrator
  const addClip = useCallback(
    (trackId: string, mediaFile: any, time: number) => {
      orchestrator.addClip(trackId, mediaFile, time)
    },
    [orchestrator],
  )

  const addTrack = useCallback(
    (type: any, name?: string, sectionId?: string) => {
      orchestrator.addTrack(type, name, sectionId)
    },
    [orchestrator],
  )

  return {
    // Состояние
    ...state,

    // UI управление
    setTimeScale,
    setScrollPosition,
    setEditMode,
    setSnapMode,

    // Selection
    selectClip,
    selectTrack,
    selectMultipleClips,
    clearSelection,

    // Clipboard
    copyClips,
    cutClips,
    pasteClips,
    deleteSelected,

    // Drag операции
    startDragClip,
    startDragTrack,
    startDragResource,
    endDrag,

    // Toggle функции
    toggleRecording,
    toggleWaveforms,
    toggleThumbnails,
    toggleMarkers,

    // Project операции
    createProject,
    loadProject,
    saveProject,

    // Clip/Track операции
    addClip,
    addTrack,

    // Вспомогательные свойства
    hasProject: state.project !== null,
    hasUnsavedChanges: state.hasUnsavedChanges,
    hasSelection: state.selectedClipIds.length > 0 || state.selectedTrackIds.length > 0,
    hasClipboard: state.clipboard !== null,
    isDragging: state.isDragging,
    isRecording: state.isRecording,
  }
}
