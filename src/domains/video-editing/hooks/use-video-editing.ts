/**
 * Hook для работы с Video Editing доменом
 */

import { useCallback, useEffect, useState } from "react"
import type { PlayerContext } from "../machines/player-machine"
import type { TimelineExtendedContext } from "../machines/timeline-extended-machine"
import { getVideoEditingOrchestrator } from "../services/video-editing-orchestrator"
import type { MediaFile } from "../types"

export function useVideoEditing() {
  const [orchestrator] = useState(() => getVideoEditingOrchestrator())
  const [timelineState, setTimelineState] = useState<TimelineExtendedContext>(
    () => orchestrator.getTimelineState().context,
  )
  const [playerState, setPlayerState] = useState<PlayerContext>(() => orchestrator.getPlayerState().context)

  // Подписка на изменения состояния
  useEffect(() => {
    const timelineSub = orchestrator.subscribeToTimeline((state) => {
      setTimelineState(state.context)
    })

    const playerSub = orchestrator.subscribeToPlayer((state) => {
      setPlayerState(state.context)
    })

    return () => {
      timelineSub.unsubscribe()
      playerSub.unsubscribe()
    }
  }, [orchestrator])

  // Project управление
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

  // Player управление
  const play = useCallback(() => {
    orchestrator.play()
  }, [orchestrator])

  const pause = useCallback(() => {
    orchestrator.pause()
  }, [orchestrator])

  const stop = useCallback(() => {
    orchestrator.stopPlayback()
  }, [orchestrator])

  const seek = useCallback(
    (time: number) => {
      orchestrator.seek(time)
    },
    [orchestrator],
  )

  const loadVideo = useCallback(
    (video: MediaFile) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({ type: "LOAD_VIDEO", video })
    },
    [orchestrator],
  )

  // Track управление
  const addTrack = useCallback(
    (type: any, name?: string, sectionId?: string) => {
      orchestrator.addTrack(type, name, sectionId)
    },
    [orchestrator],
  )

  // Clip управление
  const addClip = useCallback(
    (trackId: string, mediaFile: any, time: number) => {
      orchestrator.addClip(trackId, mediaFile, time)
    },
    [orchestrator],
  )

  // Timeline UI управление
  const setTimeScale = useCallback(
    (scale: number) => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({ type: "SET_TIME_SCALE", scale })
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
    (clipId: string) => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({
        type: "SELECT_CLIPS",
        clipIds: [clipId],
        addToSelection: false,
      })
    },
    [orchestrator],
  )

  const selectTrack = useCallback(
    (trackId: string) => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({
        type: "SELECT_TRACKS",
        trackIds: [trackId],
        addToSelection: false,
      })
    },
    [orchestrator],
  )

  const selectSection = useCallback(
    (sectionId: string) => {
      const timelineActor = orchestrator.getActors().timeline
      timelineActor.send({
        type: "SELECT_SECTIONS",
        sectionIds: [sectionId],
        addToSelection: false,
      })
    },
    [orchestrator],
  )

  const clearSelection = useCallback(() => {
    const timelineActor = orchestrator.getActors().timeline
    timelineActor.send({ type: "CLEAR_SELECTION" })
  }, [orchestrator])

  // Recording управление
  const startRecording = useCallback(() => {
    const playerActor = orchestrator.getActors().player
    playerActor.send({ type: "START_RECORDING" })
  }, [orchestrator])

  const stopRecording = useCallback(() => {
    const playerActor = orchestrator.getActors().player
    playerActor.send({ type: "STOP_RECORDING" })
  }, [orchestrator])

  return {
    // Состояние
    timeline: timelineState,
    player: playerState,

    // Project операции
    createProject,
    loadProject,
    saveProject,

    // Playback управление
    play,
    pause,
    stop,
    seek,
    loadVideo,

    // Timeline операции
    addTrack,
    addClip,

    // UI управление
    setTimeScale,
    setEditMode,
    setSnapMode,

    // Selection
    selectClip,
    selectTrack,
    selectSection,
    clearSelection,

    // Recording
    startRecording,
    stopRecording,

    // Состояние shortcuts
    isPlaying: playerState.isPlaying,
    hasProject: timelineState.project !== null,
    hasUnsavedChanges: timelineState.hasUnsavedChanges,
    hasSelection: timelineState.selectedClipIds.length > 0 || timelineState.selectedTrackIds.length > 0,
    currentTime: playerState.currentTime,
    duration: playerState.duration,
    isRecording: playerState.isRecording || timelineState.isRecording,
  }
}
