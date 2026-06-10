/**
 * Player Provider V2
 *
 * Новая версия player provider с синхронизацией через backend
 */

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { isServiceEnabled } from "@/config/service-config"
import { container } from "@/core/container"
import { useUserSettings } from "@/core/hooks/use-user-settings"
import type { MediaFile } from "@/core/types"
import { AppCommands } from "@/domains/project-management/machines/app-machine"
import { usePlaybackTimeSync } from "@/core/hooks/use-playback-time-sync"
import { type CommandPriority, CommandQueue } from "@/core/services/video-player-command-queue"
import { defaultShouldRetry, retryWithBackoff } from "@/core/utils/retry-helper"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectState } from "@/types/generated/tauri-bindings"

const logger = createLogger("video-player:player-provider")

// Вынесено за пределы компонента для предотвращения пересоздания каждый рендер
const DEFAULT_PLAYBACK_STATE = {
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
} as const

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
  appliedTemplate: { id: string; name: string; files: MediaFile[] } | null

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

// Отдельный контекст для времени воспроизведения (обновляется 60fps)
// Это позволяет компонентам, которым нужно только время, подписаться только на этот контекст
const PlaybackTimeContext = createContext<number>(0)

interface PlayerProviderProps {
  children: React.ReactNode
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  const userSettings = useUserSettings()
  const [backendSync] = useState(() => container.getBackend())
  const isVideoPlayerServiceEnabled = isServiceEnabled("VIDEO_PLAYER")

  // Создаем CommandQueue для гарантированного порядка выполнения команд
  const commandQueue = useMemo(
    () =>
      new CommandQueue({
        concurrency: 1, // Последовательное выполнение команд
        maxQueueSize: 50,
        commandTimeout: 10000, // 10 секунд на команду
      }),
    [],
  )

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
    isPlaying: false, // Локальное состояние воспроизведения (fallback когда backend отключен)

    // Speed ramping
    speedRampingEnabled: false,
    currentPlaybackRate: 1.0,
    basePlaybackRate: 1.0,
    currentVideo: null as MediaFile | null,
    previewMedia: null as MediaFile | null,
    videoSource: (userSettings.playerVideoSource || "browser") as "browser" | "timeline",
    appliedEffects: [] as Array<{ id: string; name: string; params: any }>,
    appliedFilters: [] as Array<{ id: string; name: string; params: any }>,
    appliedTemplate: null as { id: string; name: string; files: MediaFile[] } | null,
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

    const unsubscribe = backendSync.onStateChange((state) => {
      setBackendState(state)
    })

    return unsubscribe
  }, [backendSync, isVideoPlayerServiceEnabled])

  // Периодическая синхронизация времени с backend (L2)
  const handleBackendTimeSync = useCallback(
    (time: number) => {
      if (!isVideoPlayerServiceEnabled) {
        return
      }

      // Отправляем checkpoint в backend (throttled - раз в секунду)
      executeCommand({
        type: "UpdatePlaybackTime",
        params: { time },
      }).catch((error) => {
        logger.error("Failed to sync playback time with backend", { error })
      })
    },
    [isVideoPlayerServiceEnabled],
  )

  // Используем хук для плавного обновления времени (L1: 60fps)
  const playbackState = backendState?.playback_state
  // Валидация времени: если значение слишком большое (>100000 секунд ≈ 27 часов),
  // это скорее всего Unix timestamp или мусор - сбрасываем на 0
  const validatedInitialTime =
    playbackState?.current_time && playbackState.current_time < 100000 ? playbackState.current_time : 0

  // Определяем isPlaying: используем локальное состояние когда backend отключен
  const effectiveIsPlaying = isVideoPlayerServiceEnabled ? (playbackState?.is_playing ?? false) : localState.isPlaying

  const currentDisplayTime = usePlaybackTimeSync({
    isPlaying: effectiveIsPlaying,
    videoId: localState.currentVideo?.id, // Сбрасываем время при смене видео
    syncInterval: 1000, // Синхронизация с backend раз в секунду
    onBackendSync: handleBackendTimeSync,
    initialTime: validatedInitialTime,
  })

  /**
   * Определяет приоритет команды
   */
  const getCommandPriority = useCallback((command: any): CommandPriority => {
    // Критичные команды (высокий приоритет)
    const highPriorityCommands = ["Play", "Pause", "Stop", "Seek"]

    if (highPriorityCommands.includes(command.type)) {
      return "high"
    }

    // Синхронизация времени (низкий приоритет)
    if (command.type === "UpdatePlaybackTime") {
      return "low"
    }

    // Остальные команды (обычный приоритет)
    return "normal"
  }, [])

  /**
   * Выполняет команду с retry logic и через CommandQueue
   */
  const executeCommand = useCallback(
    async (command: any) => {
      if (!isVideoPlayerServiceEnabled) {
        return
      }

      const priority = getCommandPriority(command)

      return commandQueue.enqueue(async () => {
        // Выполняем команду с retry logic
        return retryWithBackoff(
          async () => {
            const result = await backendSync.executeCommand(command)

            logger.debug("player command executed", {
              command: command.type,
              result,
            })

            if (!result?.success) {
              throw new Error(result?.error || "Command failed")
            }

            return result.data
          },
          {
            maxRetries: 3,
            initialDelay: 100,
            shouldRetry: defaultShouldRetry,
            onRetry: (error, attempt, delay) => {
              logger.warn("Retrying command", {
                command: command.type,
                attempt: attempt + 1,
                delay: `${delay}ms`,
                error: error.message,
              })
            },
          },
        )
      }, priority)
    },
    [backendSync, commandQueue, getCommandPriority, isVideoPlayerServiceEnabled],
  )

  const play = useCallback(async () => {
    // Fallback: используем локальное состояние когда backend отключен
    if (!isVideoPlayerServiceEnabled) {
      setLocalState((prev) => ({ ...prev, isPlaying: true }))
      logger.debug("play (local fallback)")
      return
    }
    await executeCommand({ type: "Play", params: {} })
  }, [isVideoPlayerServiceEnabled, executeCommand])

  const pause = useCallback(async () => {
    // Fallback: используем локальное состояние когда backend отключен
    if (!isVideoPlayerServiceEnabled) {
      setLocalState((prev) => ({ ...prev, isPlaying: false }))
      logger.debug("pause (local fallback)")
      return
    }
    await executeCommand({ type: "Pause", params: {} })
  }, [isVideoPlayerServiceEnabled, executeCommand])

  const seek = useCallback(
    async (time: number) => {
      // Fallback: обновляем локальное время когда backend отключен
      if (!isVideoPlayerServiceEnabled) {
        // Находим video элемент и устанавливаем время напрямую
        const videoElement = document.querySelector("video[data-player-video]") as HTMLVideoElement
        if (videoElement) {
          videoElement.currentTime = time
          logger.debug("seek (local fallback)", { time })
        }
        return
      }
      await executeCommand({ type: "Seek", params: { time } })
    },
    [isVideoPlayerServiceEnabled, executeCommand],
  )

  const setPlaybackRateBackend = useCallback(
    async (rate: number) => {
      if (!isVideoPlayerServiceEnabled) {
        return
      }
      await executeCommand({ type: "SetPlaybackRate", params: { rate } })
    },
    [isVideoPlayerServiceEnabled, executeCommand],
  )

  // Player-specific backend команды
  const playerSetMedia = useCallback(
    async (mediaId: string, startTime?: number) => {
      // Проверяем, что mediaId не пустой
      if (!mediaId) {
        logger.error("playerSetMedia called with empty mediaId")
        return
      }

      // Fallback: когда backend отключен, просто логируем
      if (!isVideoPlayerServiceEnabled) {
        logger.debug("playerSetMedia (local fallback)", { mediaId, startTime })
        // Устанавливаем начальное время на video элементе
        if (startTime !== undefined && startTime > 0) {
          const videoElement = document.querySelector("video[data-player-video]") as HTMLVideoElement
          if (videoElement) {
            videoElement.currentTime = startTime
          }
        }
        return
      }

      await executeCommand(AppCommands.playerSetMedia(mediaId, startTime))
    },
    [isVideoPlayerServiceEnabled, executeCommand],
  )

  const playerSetVolumeBackend = useCallback(
    async (volume: number) => {
      if (!isVideoPlayerServiceEnabled) {
        setLocalState((prev) => ({ ...prev, volume }))
        return
      }
      await executeCommand(AppCommands.playerSetVolume(volume))
    },
    [isVideoPlayerServiceEnabled, executeCommand],
  )

  const playerSelectClip = useCallback(
    async (clipId: string) => {
      if (!isVideoPlayerServiceEnabled) {
        logger.debug("playerSelectClip (local fallback)", { clipId })
        return
      }
      await executeCommand(AppCommands.playerSelectClip(clipId))
    },
    [isVideoPlayerServiceEnabled, executeCommand],
  )

  const playerClearSelection = useCallback(async () => {
    if (!isVideoPlayerServiceEnabled) {
      logger.debug("playerClearSelection (local fallback)")
      return
    }
    await executeCommand(AppCommands.playerClearSelection())
  }, [isVideoPlayerServiceEnabled, executeCommand])

  const playerSetSourceBackend = useCallback(
    async (source: "browser" | "timeline") => {
      // Fallback: обновляем локальное состояние
      if (!isVideoPlayerServiceEnabled) {
        setLocalState((prev) => ({ ...prev, videoSource: source }))
        logger.debug("playerSetSource (local fallback)", { source })
        return
      }
      await executeCommand(AppCommands.playerSetSource(source))
    },
    [isVideoPlayerServiceEnabled, executeCommand],
  )

  const playerApplyEffectBackend = useCallback(
    async (effectId: string, params: Record<string, any>) => {
      await executeCommand(AppCommands.playerApplyEffect(effectId, params))
    },
    [executeCommand],
  )

  const playerApplyFilterBackend = useCallback(
    async (filterId: string, params: Record<string, any>) => {
      await executeCommand(AppCommands.playerApplyFilter(filterId, params))
    },
    [executeCommand],
  )

  const playerApplyTemplateBackend = useCallback(
    async (templateId: string, mediaIds: string[]) => {
      await executeCommand(AppCommands.playerApplyTemplate(templateId, mediaIds))
    },
    [executeCommand],
  )

  const playerClearEffectsBackend = useCallback(async () => {
    await executeCommand(AppCommands.playerClearEffects())
  }, [executeCommand])

  const playerClearFiltersBackend = useCallback(async () => {
    await executeCommand(AppCommands.playerClearFilters())
  }, [executeCommand])

  const playerClearTemplateBackend = useCallback(async () => {
    await executeCommand(AppCommands.playerClearTemplate())
  }, [executeCommand])

  // Локальные действия
  const setCurrentVideo = useCallback((video: MediaFile | null) => {
    setLocalState((prev) => ({
      ...prev,
      currentVideo: video,
      duration: 0, // Сбрасываем duration при смене видео
      isPlaying: false, // Останавливаем воспроизведение при смене видео
    }))
  }, [])

  const setVolume = useCallback(
    (volume: number) => {
      setLocalState((prev) => ({ ...prev, volume }))
      userSettings.updatePlayerVolume(volume * 100) // Конвертируем обратно в проценты для user settings
    },
    [userSettings],
  )

  const setDuration = useCallback((duration: number) => {
    setLocalState((prev) => ({ ...prev, duration }))
  }, [])

  const setVideoLoading = useCallback((isLoading: boolean) => {
    setLocalState((prev) => ({ ...prev, isVideoLoading: isLoading }))
  }, [])

  const setVideoReady = useCallback((isReady: boolean) => {
    setLocalState((prev) => ({ ...prev, isVideoReady: isReady }))
  }, [])

  const setIsSeeking = useCallback((isSeeking: boolean) => {
    setLocalState((prev) => ({ ...prev, isSeeking }))
  }, [])

  const setIsChangingCamera = useCallback((isChangingCamera: boolean) => {
    setLocalState((prev) => ({ ...prev, isChangingCamera }))
  }, [])

  const setIsRecording = useCallback((isRecording: boolean) => {
    setLocalState((prev) => ({ ...prev, isRecording }))
  }, [])

  const setIsResizableMode = useCallback((isResizableMode: boolean) => {
    setLocalState((prev) => ({ ...prev, isResizableMode }))
  }, [])

  const setPreviewMedia = useCallback((media: MediaFile | null) => {
    setLocalState((prev) => ({ ...prev, previewMedia: media }))
  }, [])

  const setVideoSource = useCallback(
    (source: "browser" | "timeline") => {
      setLocalState((prev) => ({ ...prev, videoSource: source }))
      userSettings.updatePlayerVideoSource(source) // Сохраняем в user settings
    },
    [userSettings],
  )

  // Эффекты и фильтры (локальные для preview)
  const applyEffect = useCallback((effect: { id: string; name: string; params: any }) => {
    setLocalState((prev) => ({
      ...prev,
      appliedEffects: [...prev.appliedEffects, effect],
    }))
  }, [])

  const applyFilter = useCallback((filter: { id: string; name: string; params: any }) => {
    setLocalState((prev) => ({
      ...prev,
      appliedFilters: [...prev.appliedFilters, filter],
    }))
  }, [])

  const applyTemplate = useCallback((template: { id: string; name: string }, files: MediaFile[]) => {
    setLocalState((prev) => ({
      ...prev,
      appliedTemplate: {
        ...template,
        files,
      },
    }))
  }, [])

  const clearEffects = useCallback(() => {
    setLocalState((prev) => ({ ...prev, appliedEffects: [] }))
  }, [])

  const clearFilters = useCallback(() => {
    setLocalState((prev) => ({ ...prev, appliedFilters: [] }))
  }, [])

  const clearTemplate = useCallback(() => {
    setLocalState((prev) => ({ ...prev, appliedTemplate: null }))
  }, [])

  // Speed ramping методы
  const setSpeedRampingEnabled = useCallback((enabled: boolean) => {
    setLocalState((prev) => ({ ...prev, speedRampingEnabled: enabled }))
  }, [])

  const updatePlaybackRate = useCallback((rate: number) => {
    setLocalState((prev) => ({ ...prev, currentPlaybackRate: rate }))
  }, [])

  const setBasePlaybackRate = useCallback((rate: number) => {
    setLocalState((prev) => ({ ...prev, basePlaybackRate: rate }))
  }, [])

  const setPrerenderSettings = useCallback((settings: Partial<PlayerContextType["prerenderSettings"]>) => {
    setLocalState((prev) => ({
      ...prev,
      prerenderSettings: { ...prev.prerenderSettings, ...settings },
    }))
  }, [])

  // Контекстное значение - мемоизируем для предотвращения лишних ре-рендеров
  const contextValue: PlayerContextType = useMemo(
    () => ({
      // Сначала spread локального состояния
      ...localState,

      // currentTime доступно через отдельный хук usePlaybackTime для оптимизации
      // Здесь используем 0, т.к. компоненты должны использовать usePlaybackTime()
      currentTime: 0, // Используйте usePlaybackTime() для получения актуального времени
      // Используем локальное isPlaying если backend отключен
      isPlaying: isVideoPlayerServiceEnabled
        ? playbackState
          ? playbackState.is_playing
          : DEFAULT_PLAYBACK_STATE.isPlaying
        : localState.isPlaying,
      playbackRate: playbackState ? playbackState.playback_rate : DEFAULT_PLAYBACK_STATE.playbackRate,

      // Override некоторых значений из backend (только если backend состояние существует и сервис включен)
      volume:
        isVideoPlayerServiceEnabled && playbackState ? playbackState.volume || localState.volume : localState.volume,
      videoSource:
        isVideoPlayerServiceEnabled && playbackState
          ? playbackState.video_source || localState.videoSource
          : localState.videoSource,
      duration: isVideoPlayerServiceEnabled && playbackState ? playbackState.duration : localState.duration,
      isSeeking: isVideoPlayerServiceEnabled && playbackState ? playbackState.is_seeking : localState.isSeeking,
      isVideoLoading:
        isVideoPlayerServiceEnabled && playbackState ? playbackState.is_loading : localState.isVideoLoading,
      selectedClipId: isVideoPlayerServiceEnabled && playbackState ? playbackState.selected_clip_id || null : null,

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
    }),
    [
      localState,
      // currentDisplayTime удалён из зависимостей - используйте usePlaybackTime()
      isVideoPlayerServiceEnabled,
      playbackState,
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
      setSpeedRampingEnabled,
      updatePlaybackRate,
      setBasePlaybackRate,
      play,
      pause,
      seek,
      setPlaybackRateBackend,
      playerSetMedia,
      playerSetVolumeBackend,
      playerSelectClip,
      playerClearSelection,
      playerSetSourceBackend,
      playerApplyEffectBackend,
      playerApplyFilterBackend,
      playerApplyTemplateBackend,
      playerClearEffectsBackend,
      playerClearFiltersBackend,
      playerClearTemplateBackend,
    ],
  )

  return (
    <PlaybackTimeContext.Provider value={currentDisplayTime}>
      <PlayerContext.Provider value={contextValue} data-oid="-x1hxvz">
        {children}
      </PlayerContext.Provider>
    </PlaybackTimeContext.Provider>
  )
}

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext)

  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider")
  }

  // ВНИМАНИЕ: currentTime в этом контексте всегда 0 для оптимизации производительности
  // Для получения актуального времени воспроизведения используйте usePlaybackTime()
  return context
}

/**
 * Хук для получения только времени воспроизведения (обновляется 60fps)
 * Используйте этот хук вместо usePlayer, если вам нужно только время
 * Это оптимизирует производительность, т.к. компонент не будет ре-рендериться
 * при изменениях других свойств плеера
 */
export function usePlaybackTime(): number {
  return useContext(PlaybackTimeContext)
}

export type { PlayerContextType }
