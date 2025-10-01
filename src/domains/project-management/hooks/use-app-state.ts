/**
 * Hook для работы с состоянием приложения
 */

import { useCallback, useEffect, useState } from "react"
import type { ProjectCommand, ProjectState, TrackType } from "@/types/generated/tauri-bindings"
import { getProjectManagementOrchestrator } from "../services/project-management-orchestrator"

export function useAppState() {
  const [orchestrator] = useState(() => getProjectManagementOrchestrator())
  const [projectState, setProjectState] = useState<ProjectState | null>(() => orchestrator.getProjectState())
  const [isConnected, setIsConnected] = useState(() => orchestrator.isConnected())
  const [connectionError, setConnectionError] = useState(() => orchestrator.getConnectionError())

  // Подписка на изменения состояния
  useEffect(() => {
    const subscription = orchestrator.subscribeToProjectState((state) => {
      setProjectState(state)
      setIsConnected(orchestrator.isConnected())
      setConnectionError(orchestrator.getConnectionError())
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [orchestrator])

  // Команды для timeline
  const addTrack = useCallback(
    async (name: string, trackType: TrackType, index?: number) => {
      const command: ProjectCommand = {
        type: "AddTrack",
        params: { name, track_type: trackType, index: index ?? null },
      }
      return orchestrator.executeCommand(command)
    },
    [orchestrator],
  )

  const deleteTrack = useCallback(
    async (trackId: string) => {
      const command: ProjectCommand = {
        type: "DeleteTrack",
        params: { track_id: trackId },
      }
      return orchestrator.executeCommand(command)
    },
    [orchestrator],
  )

  const addClip = useCallback(
    async (trackId: string, mediaId: string, time: number) => {
      const command: ProjectCommand = {
        type: "AddClip",
        params: { track_id: trackId, media_id: mediaId, time },
      }
      return orchestrator.executeCommand(command)
    },
    [orchestrator],
  )

  const deleteClip = useCallback(
    async (clipId: string) => {
      const command: ProjectCommand = {
        type: "DeleteClip",
        params: { clip_id: clipId },
      }
      return orchestrator.executeCommand(command)
    },
    [orchestrator],
  )

  // Команды для воспроизведения
  const play = useCallback(async () => {
    const command: ProjectCommand = {
      type: "Play",
    }
    return orchestrator.executeCommand(command)
  }, [orchestrator])

  const pause = useCallback(async () => {
    const command: ProjectCommand = {
      type: "Pause",
    }
    return orchestrator.executeCommand(command)
  }, [orchestrator])

  const seek = useCallback(
    async (time: number) => {
      const command: ProjectCommand = {
        type: "Seek",
        params: { time },
      }
      return orchestrator.executeCommand(command)
    },
    [orchestrator],
  )

  return {
    // Состояние
    projectState,
    isConnected,
    connectionError,

    // Timeline команды
    addTrack,
    deleteTrack,
    addClip,
    deleteClip,

    // Playback команды
    play,
    pause,
    seek,

    // Удобные геттеры
    timeline: projectState?.project?.timeline || null,
    currentTime: projectState?.playback_state?.current_time || 0,
    isPlaying: projectState?.playback_state?.is_playing || false,
    duration: projectState?.project?.timeline?.duration || 0,
  }
}
