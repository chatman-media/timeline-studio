/**
 * Player Provider V2
 *
 * Новая версия player provider с синхронизацией через backend
 */

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

import { AppCommands } from "@/domains/project-management/machines/app-machine"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import type { MediaFile } from "@/features/media/types/media"
import { useUserSettings } from "@/features/user-settings"
import { createLogger } from "@/lib/tauri-logger"
import { isServiceEnabled } from "@/shared/config/service-config"
import type { ProjectState } from "@/types/generated/state-types"

const logger = createLogger("video-player:player-provider")

interface PlayerContextType {
  // Состояние воспроизведения (синхронизировано с backend)
  currentTime: number
  isPlaying: boolean
  playbackRate: number

  // Speed ramping (локальное состояние)
  speedRampingEnabled: boolean
  currentPlaybackRate: number
  basePlaybackRate: number

  // Локальное состояние плеера
  volume: number
  duration: number
  isVideoLoading: boolean
  isVideoReady: boolean
  isSeeking: boolean
  isChangingCamera: boolean
  isRecording: boolean
  isResizableMode: boolean

  // Медиа контент
  currentVideo: MediaFile | null
  previewMedia: MediaFile | null
  videoSource: "browser" | "timeline"
  selectedClipId: string | null

  // Эффекты и фильтры (локальные для preview)
  appliedEffects: Array<{ id: string; name: string; params: any }>
  appliedFilters: Array<{ id: string; name: string; params: any }>
  appliedTemplate: { id: string; name: string } | null

  // Prerender настройки
  prerenderSettings: {
    prerenderEnabled: boolean
    prerenderQuality: number
    prerenderSegmentDuration: number
    prerenderApplyEffects: boolean
    prerenderAutoPrerender: boolean
  }

  // Локальные действия (не затрагивают backend)
  setCurrentVideo: (video: MediaFile | null) => void
  setVolume: (volume: number) => void
  setDuration: (duration: number) => void
  setVideoLoading: (isLoading: boolean) => void
  setVideoReady: (isReady: boolean) => void
  setIsSeeking: (isSeeking: boolean) => void
  setIsChangingCamera: (isChangingCamera: boolean) => void
  setIsRecording: (isRecording: boolean) => void
  setIsResizableMode: (isResizableMode: boolean) => void
  setPreviewMedia: (media: MediaFile | null) => void
  setVideoSource: (source: "browser" | "timeline") => void

  // Действия для эффектов/фильтров (локальные preview)
  applyEffect: (effect: { id: string; name: string; params: any }) => void
  applyFilter: (filter: { id: string; name: string; params: any }) => void
  applyTemplate: (template: { id: string; name: string }, files: MediaFile[]) => void
  clearEffects: () => void
  clearFilters: () => void
  clearTemplate: () => void

  // Prerender
  setPrerenderSettings: (settings: Partial<PlayerContextType["prerenderSettings"]>) => void

  // Speed ramping методы (локальные)
  setSpeedRampingEnabled: (enabled: boolean) => void
  updatePlaybackRate: (rate: number) => void
  setBasePlaybackRate: (rate: number) => void

  // Backend команды (асинхронные)
  play: () => Promise<void>
  pause: () => Promise<void>
  seek: (time: number) => Promise<void>
  setPlaybackRate: (rate: number) => Promise<void>

  // Player-specific backend команды
  playerSetMedia: (mediaId: string, startTime?: number) => Promise<void>
  playerSetVolume: (volume: number) => Promise<void>
  playerSelectClip: (clipId: string) => Promise<void>
  playerClearSelection: () => Promise<void>
  playerSetSource: (source: "browser" | "timeline") => Promise<void>
  playerApplyEffect: (effectId: string, params: Record<string, any>) => Promise<void>
  playerApplyFilter: (filterId: string, params: Record<string, any>) => Promise<void>
  playerApplyTemplate: (templateId: string, mediaIds: string[]) => Promise<void>
  playerClearEffects: () => Promise<void>
  playerClearFilters: () => Promise<void>
  playerClearTemplate: () => Promise<void>
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

interface PlayerProviderProps {
  children: React.ReactNode
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  const userSettings = useUserSettings()
  const [backendSync] = useState(() => getBackendSync())
  const isVideoPlayerServiceEnabled = isServiceEnabled("VIDEO_PLAYER")

  // Backend состояние (синхронизированное)
  const [backendState, setBackendState] = useState<ProjectState | null>(null)

  // Локальное состояние плеера
  const [localState, setLocalState] = useState({
    volume: (userSettings.playerVolume || 50) / 100, // Конвертируем из процентов (0-100) в диапазон (0-1)
    duration: 0,
    isVideoLoading: false,
    isVideoReady: false,
    isSeeking: false,
    isChangingCamera: false,
    isRecording: false,
    isResizableMode: false,

    // Speed ramping
    speedRampingEnabled: false,
    currentPlaybackRate: 1.0,
    basePlaybackRate: 1.0,
    currentVideo: null as MediaFile | null,
    previewMedia: null as MediaFile | null,
    videoSource: "timeline" as "browser" | "timeline",
    appliedEffects: [] as Array<{ id: string; name: string; params: any }>,
    appliedFilters: [] as Array<{ id: string; name: string; params: any }>,
    appliedTemplate: null as { id: string; name: string } | null,
    prerenderSettings: {
      prerenderEnabled: false,
      prerenderQuality: 80,
      prerenderSegmentDuration: 10,
      prerenderApplyEffects: true,
      prerenderAutoPrerender: false,
    },
  })

  // Подписка на backend состояние
  useEffect(() => {
    if (!isVideoPlayerServiceEnabled) {
      return
    }

    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setBackendState(state)
    })

    return unsubscribe
  }, [backendSync, isVideoPlayerServiceEnabled])

  // Backend команды
  const executeCommand = async (command: any) => {
    try {
      const result = await backendSync.executeCommand(command)

      logger.debug("player command executed", { result })
      if (!result?.success) {
        throw new Error(result?.error || "Command failed")
      }
      return result.data
    } catch (error) {
      logger.error("player command failed", { error })
      // throw error
    }
  }

  const play = async () => {
    if (!isVideoPlayerServiceEnabled) {
      return
    }
    await executeCommand({ type: "Play", params: {} })
  }

  const pause = async () => {
    if (!isVideoPlayerServiceEnabled) {
      return
    }
    await executeCommand({ type: "Pause", params: {} })
  }

  const seek = async (time: number) => {
    if (!isVideoPlayerServiceEnabled) {
      return
    }
    await executeCommand({ type: "Seek", params: { time } })
  }

  const setPlaybackRateBackend = async (rate: number) => {
    if (!isVideoPlayerServiceEnabled) {
      return
    }
    await executeCommand({ type: "SetPlaybackRate", params: { rate } })
  }

  // Player-specific backend команды
  const playerSetMedia = async (mediaId: string, startTime?: number) => {
    if (!isVideoPlayerServiceEnabled) {
      return
    }

    // Проверяем, что mediaId не пустой
    if (!mediaId) {
      logger.error("playerSetMedia called with empty mediaId")
      return
    }

    await executeCommand(AppCommands.playerSetMedia(mediaId, startTime))
  }

  const playerSetVolumeBackend = async (volume: number) => {
    await executeCommand(AppCommands.playerSetVolume(volume))
  }

  const playerSelectClip = async (clipId: string) => {
    await executeCommand(AppCommands.playerSelectClip(clipId))
  }

  const playerClearSelection = async () => {
    await executeCommand(AppCommands.playerClearSelection())
  }

  const playerSetSourceBackend = async (source: "browser" | "timeline") => {
    await executeCommand(AppCommands.playerSetSource(source))
  }

  const playerApplyEffectBackend = async (effectId: string, params: Record<string, any>) => {
    await executeCommand(AppCommands.playerApplyEffect(effectId, params))
  }

  const playerApplyFilterBackend = async (filterId: string, params: Record<string, any>) => {
    await executeCommand(AppCommands.playerApplyFilter(filterId, params))
  }

  const playerApplyTemplateBackend = async (templateId: string, mediaIds: string[]) => {
    await executeCommand(AppCommands.playerApplyTemplate(templateId, mediaIds))
  }

  const playerClearEffectsBackend = async () => {
    await executeCommand(AppCommands.playerClearEffects())
  }

  const playerClearFiltersBackend = async () => {
    await executeCommand(AppCommands.playerClearFilters())
  }

  const playerClearTemplateBackend = async () => {
    await executeCommand(AppCommands.playerClearTemplate())
  }

  // Локальные действия
  const setCurrentVideo = (video: MediaFile | null) => {
    setLocalState((prev) => ({ ...prev, currentVideo: video }))
  }

  const setVolume = (volume: number) => {
    setLocalState((prev) => ({ ...prev, volume }))
    userSettings.handlePlayerVolumeChange(volume * 100) // Конвертируем обратно в проценты для user settings
  }

  const setDuration = (duration: number) => {
    setLocalState((prev) => ({ ...prev, duration }))
  }

  const setVideoLoading = (isLoading: boolean) => {
    setLocalState((prev) => ({ ...prev, isVideoLoading: isLoading }))
  }

  const setVideoReady = (isReady: boolean) => {
    setLocalState((prev) => ({ ...prev, isVideoReady: isReady }))
  }

  const setIsSeeking = (isSeeking: boolean) => {
    setLocalState((prev) => ({ ...prev, isSeeking }))
  }

  const setIsChangingCamera = (isChangingCamera: boolean) => {
    setLocalState((prev) => ({ ...prev, isChangingCamera }))
  }

  const setIsRecording = (isRecording: boolean) => {
    setLocalState((prev) => ({ ...prev, isRecording }))
  }

  const setIsResizableMode = (isResizableMode: boolean) => {
    setLocalState((prev) => ({ ...prev, isResizableMode }))
  }

  const setPreviewMedia = (media: MediaFile | null) => {
    setLocalState((prev) => ({ ...prev, previewMedia: media }))
  }

  const setVideoSource = (source: "browser" | "timeline") => {
    setLocalState((prev) => ({ ...prev, videoSource: source }))
  }

  // Эффекты и фильтры (локальные для preview)
  const applyEffect = (effect: { id: string; name: string; params: any }) => {
    setLocalState((prev) => ({
      ...prev,
      appliedEffects: [...prev.appliedEffects, effect],
    }))
  }

  const applyFilter = (filter: { id: string; name: string; params: any }) => {
    setLocalState((prev) => ({
      ...prev,
      appliedFilters: [...prev.appliedFilters, filter],
    }))
  }

  const applyTemplate = (template: { id: string; name: string }, _files: MediaFile[]) => {
    setLocalState((prev) => ({
      ...prev,
      appliedTemplate: template,
    }))
  }

  const clearEffects = () => {
    setLocalState((prev) => ({ ...prev, appliedEffects: [] }))
  }

  const clearFilters = () => {
    setLocalState((prev) => ({ ...prev, appliedFilters: [] }))
  }

  const clearTemplate = () => {
    setLocalState((prev) => ({ ...prev, appliedTemplate: null }))
  }

  // Speed ramping методы
  const setSpeedRampingEnabled = (enabled: boolean) => {
    setLocalState((prev) => ({ ...prev, speedRampingEnabled: enabled }))
  }

  const updatePlaybackRate = (rate: number) => {
    setLocalState((prev) => ({ ...prev, currentPlaybackRate: rate }))
  }

  const setBasePlaybackRate = (rate: number) => {
    setLocalState((prev) => ({ ...prev, basePlaybackRate: rate }))
  }

  const setPrerenderSettings = (settings: Partial<PlayerContextType["prerenderSettings"]>) => {
    setLocalState((prev) => ({
      ...prev,
      prerenderSettings: { ...prev.prerenderSettings, ...settings },
    }))
  }

  // Извлекаем состояние воспроизведения из backend
  const defaultPlaybackState = {
    currentTime: 0,
    isPlaying: false,
    playbackRate: 1,
    volume: 1.0,
    currentMediaId: null,
    selectedClipId: null,
    videoSource: "browser" as const,
    appliedEffects: [],
    appliedFilters: [],
    appliedTemplate: null,
    isLoading: false,
    isSeeking: false,
    duration: 0,
  }

  const playbackState = backendState?.playback_state

  // Контекстное значение
  const contextValue: PlayerContextType = {
    // Backend состояние
    currentTime: playbackState ? playbackState.current_time : defaultPlaybackState.currentTime,
    isPlaying: playbackState ? playbackState.is_playing : defaultPlaybackState.isPlaying,
    playbackRate: playbackState ? playbackState.playback_rate : defaultPlaybackState.playbackRate,

    // Локальное состояние с override для backend значений
    ...localState,

    // Override некоторых значений из backend (только если backend состояние существует)
    volume: playbackState ? playbackState.volume || localState.volume : localState.volume,
    videoSource: playbackState ? playbackState.video_source || localState.videoSource : localState.videoSource,
    duration: playbackState ? playbackState.duration : localState.duration,
    isSeeking: playbackState ? playbackState.is_seeking : localState.isSeeking,
    isVideoLoading: playbackState ? playbackState.is_loading : localState.isVideoLoading,
    selectedClipId: playbackState ? playbackState.selected_clip_id || null : null,

    // Локальные действия
    setCurrentVideo,
    setVolume,
    setDuration,
    setVideoLoading,
    setVideoReady,
    setIsSeeking,
    setIsChangingCamera,
    setIsRecording,
    setIsResizableMode,
    setPreviewMedia,
    setVideoSource,
    applyEffect,
    applyFilter,
    applyTemplate,
    clearEffects,
    clearFilters,
    clearTemplate,
    setPrerenderSettings,

    // Speed ramping методы
    setSpeedRampingEnabled,
    updatePlaybackRate,
    setBasePlaybackRate,

    // Backend команды
    play,
    pause,
    seek,
    setPlaybackRate: setPlaybackRateBackend,

    // Player-specific backend команды
    playerSetMedia,
    playerSetVolume: playerSetVolumeBackend,
    playerSelectClip,
    playerClearSelection,
    playerSetSource: playerSetSourceBackend,
    playerApplyEffect: playerApplyEffectBackend,
    playerApplyFilter: playerApplyFilterBackend,
    playerApplyTemplate: playerApplyTemplateBackend,
    playerClearEffects: playerClearEffectsBackend,
    playerClearFilters: playerClearFiltersBackend,
    playerClearTemplate: playerClearTemplateBackend,
  }

  return <PlayerContext.Provider value={contextValue}>{children}</PlayerContext.Provider>
}

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext)

  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider")
  }

  return context
}

export type { PlayerContextType }
