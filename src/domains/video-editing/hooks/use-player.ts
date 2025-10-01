/**
 * Hook для работы с Player
 */

import { useCallback, useEffect, useState } from "react"
import type { PlayerContext } from "../machines/player-machine"
import { getVideoEditingOrchestrator } from "../services/video-editing-orchestrator"
import type { MediaFile } from "../types"

export function usePlayer() {
  const [orchestrator] = useState(() => getVideoEditingOrchestrator())
  const [state, setState] = useState<PlayerContext>(() => orchestrator.getPlayerState().context)

  // Подписка на изменения состояния
  useEffect(() => {
    const subscription = orchestrator.subscribeToPlayer((state) => {
      setState(state.context)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [orchestrator])

  // Управление воспроизведением
  const loadVideo = useCallback(
    (video: MediaFile) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({ type: "LOAD_VIDEO", video })
    },
    [orchestrator],
  )

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

  const setPlaybackRate = useCallback(
    (rate: number) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({ type: "SET_PLAYBACK_RATE", rate })
    },
    [orchestrator],
  )

  const setVolume = useCallback(
    (volume: number) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({ type: "SET_VOLUME", volume })
    },
    [orchestrator],
  )

  // Speed Ramping
  const toggleSpeedRamping = useCallback(() => {
    const playerActor = orchestrator.getActors().player
    playerActor.send({ type: "TOGGLE_SPEED_RAMPING" })
  }, [orchestrator])

  const setBasePlaybackRate = useCallback(
    (rate: number) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({
        type: "SET_BASE_PLAYBACK_RATE",
        rate,
      })
    },
    [orchestrator],
  )

  // Управление источником видео
  const setVideoSource = useCallback(
    (source: "browser" | "timeline") => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({
        type: "SET_VIDEO_SOURCE",
        source,
      })
    },
    [orchestrator],
  )

  const setPreviewMedia = useCallback(
    (media: MediaFile | null) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({
        type: "SET_PREVIEW_MEDIA",
        media,
      })
    },
    [orchestrator],
  )

  // Управление эффектами - используем player actor напрямую
  const applyEffect = useCallback(
    (effect: { id: string; name: string; params: any }) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({
        type: "APPLY_EFFECT",
        effect,
      })
    },
    [orchestrator],
  )

  const removeEffect = useCallback(
    (effectId: string) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({
        type: "REMOVE_EFFECT",
        effectId,
      })
    },
    [orchestrator],
  )

  // Управление фильтрами
  const applyFilter = useCallback(
    (filter: { id: string; name: string; params: any }) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({
        type: "APPLY_FILTER",
        filter,
      })
    },
    [orchestrator],
  )

  const removeFilter = useCallback(
    (filterId: string) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({
        type: "REMOVE_FILTER",
        filterId,
      })
    },
    [orchestrator],
  )

  // Управление шаблонами
  const applyTemplate = useCallback(
    (template: { id: string; name: string; files: MediaFile[] }) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({
        type: "APPLY_TEMPLATE",
        template,
      })
    },
    [orchestrator],
  )

  const removeTemplate = useCallback(() => {
    const playerActor = orchestrator.getActors().player
    playerActor.send({ type: "REMOVE_TEMPLATE" })
  }, [orchestrator])

  // Режим изменения размера
  const setResizableMode = useCallback(
    (enabled: boolean) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({
        type: "SET_RESIZABLE_MODE",
        enabled,
      })
    },
    [orchestrator],
  )

  // Управление записью - используем player actor
  const startRecording = useCallback(() => {
    const playerActor = orchestrator.getActors().player
    playerActor.send({ type: "START_RECORDING" })
  }, [orchestrator])

  const stopRecording = useCallback(() => {
    const playerActor = orchestrator.getActors().player
    playerActor.send({ type: "STOP_RECORDING" })
  }, [orchestrator])

  // Настройки пререндера
  const setPrerenderEnabled = useCallback(
    (enabled: boolean) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({
        type: "SET_PRERENDER_ENABLED",
        enabled,
      })
    },
    [orchestrator],
  )

  const setPrerenderQuality = useCallback(
    (quality: number) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({
        type: "SET_PRERENDER_QUALITY",
        quality,
      })
    },
    [orchestrator],
  )

  const setPrerenderSegmentDuration = useCallback(
    (duration: number) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({
        type: "SET_PRERENDER_SEGMENT_DURATION",
        duration,
      })
    },
    [orchestrator],
  )

  const setPrerenderApplyEffects = useCallback(
    (apply: boolean) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({
        type: "SET_PRERENDER_APPLY_EFFECTS",
        apply,
      })
    },
    [orchestrator],
  )

  const setPrerenderAuto = useCallback(
    (auto: boolean) => {
      const playerActor = orchestrator.getActors().player
      playerActor.send({
        type: "SET_PRERENDER_AUTO",
        auto,
      })
    },
    [orchestrator],
  )

  return {
    // Состояние
    ...state,

    // Управление видео
    loadVideo,
    play,
    pause,
    stop,
    seek,
    setPlaybackRate,
    setVolume,

    // Speed Ramping
    toggleSpeedRamping,
    setBasePlaybackRate,

    // Управление источником
    setVideoSource,
    setPreviewMedia,

    // Управление эффектами
    applyEffect,
    removeEffect,

    // Управление фильтрами
    applyFilter,
    removeFilter,

    // Управление шаблонами
    applyTemplate,
    removeTemplate,

    // Режимы
    setResizableMode,

    // Запись
    startRecording,
    stopRecording,

    // Настройки пререндера
    setPrerenderEnabled,
    setPrerenderQuality,
    setPrerenderSegmentDuration,
    setPrerenderApplyEffects,
    setPrerenderAuto,

    // Вспомогательные функции
    hasVideo: state.video !== null,
    canPlay: state.isVideoReady && !state.isPlaying,
    canPause: state.isPlaying,
    hasEffects: state.appliedEffects.length > 0,
    hasFilters: state.appliedFilters.length > 0,
    hasTemplate: state.appliedTemplate !== null,
  }
}
