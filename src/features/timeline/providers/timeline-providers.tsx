/**
 * Timeline Domain Providers
 *
 * Модульная система провайдеров для работы с расширенной timeline машиной.
 * Каждый провайдер отвечает за свою область ответственности.
 *
 * RACE CONDITIONS PREVENTION:
 * - Backend команды выполняются через BackendSync который имеет встроенную очередь
 * - Frontend state updates происходят синхронно через XState machine
 * - Backend events обрабатываются последовательно через BACKEND_EVENT action
 * - Debouncing/Throttling применяется к UI-triggered операциям
 */

import { useSelector } from "@xstate/react"
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("TimelineProviders")

// Используем типы из доменов
import type { MediaFile, Section, Timeline, TimelineClip, Track } from "@/domains/video-editing/types"

// Временный alias для совместимости
type TimelineProject = Timeline
type TimelineTrack = Track
type TimelineSection = Section

import { container } from "@/core/container"
import { getVideoEditingOrchestrator } from "@/domains/video-editing/services/video-editing-orchestrator"
import { transformProjectStateToTimeline } from "@/domains/video-editing/utils/project-transform"
import type { ProjectState as BackendProjectState } from "@/types/generated/tauri-bindings"

// ===========================
// Project Provider
// ===========================
interface TimelineProjectContext {
  project: TimelineProject | null
  isLoading: boolean
  hasUnsavedChanges: boolean
  createProject: (name: string, settings?: any) => Promise<void>
  saveProject: () => Promise<void>
  loadProject: (path: string) => Promise<void>
  backend: {
    isConnected: boolean
    backendProject: BackendProjectState | null
  }
}

const TimelineProjectContext = createContext<TimelineProjectContext | null>(null)

export function TimelineProjectProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline
  const backendSync = container.getBackend()

  const project = useSelector(timelineActor, (state) => state.context.project)
  const isLoading = useSelector(timelineActor, (state) => state.context.isLoading)
  const hasUnsavedChanges = useSelector(timelineActor, (state) => state.context.hasUnsavedChanges)

  // Подписка на изменения backend состояния
  const [backendProject, setBackendProject] = useState<BackendProjectState | null>(null)
  const lastProcessedVersionRef = useRef<number>(0)

  useEffect(() => {
    // Инициализируем backend sync если еще не подключен
    if (!backendSync.connected) {
      backendSync.connect().catch((error) => {
        logger.error("Failed to connect backend sync", { error })
      })
    }

    // ✅ НОВАЯ АРХИТЕКТУРА: Подписываемся на backend СОБЫТИЯ (не на state changes)
    const unsubscribeEvents = backendSync.onEvent(async (event) => {
      logger.info("[TimelineProjectProvider] Received backend event, forwarding to machine", {
        eventType: event.type,
      })

      // Отправляем событие напрямую в машину для инкрементальных обновлений
      timelineActor.send({
        type: "BACKEND_EVENT",
        event: event as any,
      })

      // При создании или открытии проекта - запрашиваем полное состояние
      if (event.type === "ProjectCreated" || event.type === "ProjectOpened") {
        logger.info("[TimelineProjectProvider] Project created/opened, fetching full state")
        try {
          const state = await backendSync.getProjectState()
          if (state && state.project) {
            const newVersion = state.version || 0
            lastProcessedVersionRef.current = newVersion
            setBackendProject(state)

            // Преобразуем и обновляем проект
            const transformedProject = transformProjectStateToTimeline(state)
            if (transformedProject) {
              logger.info("[TimelineProjectProvider] Updating project from backend state", {
                projectName: transformedProject.name,
              })
              timelineActor.send({
                type: "PROJECT_UPDATED",
                project: transformedProject,
              })
            }
          }
        } catch (error) {
          logger.error("[TimelineProjectProvider] Failed to fetch project state", { error })
        }
      }
    })

    // ✅ Подписываемся на state changes ТОЛЬКО для инициализации проекта
    // (когда проект открывается в первый раз)
    const unsubscribeState = backendSync.onStateChange((state: any) => {
      // Обновляем только если проекта еще нет
      if (!project) {
        const newVersion = state.version || 0
        lastProcessedVersionRef.current = newVersion
        setBackendProject(state)

        // Преобразуем начальное состояние
        const transformedProject = transformProjectStateToTimeline(state)
        if (transformedProject) {
          timelineActor.send({
            type: "PROJECT_UPDATED",
            project: transformedProject,
          })
        }
      }
    })

    // Получаем начальное состояние (только при mount)
    backendSync.getProjectState().then((state: any) => {
      if (state && state.project) {
        const newVersion = state.version || 0
        lastProcessedVersionRef.current = newVersion
        setBackendProject(state)

        // Преобразуем начальное состояние
        const transformedProject = transformProjectStateToTimeline(state)
        if (transformedProject) {
          timelineActor.send({
            type: "PROJECT_UPDATED",
            project: transformedProject,
          })
        }
      }
    })

    return () => {
      unsubscribeEvents()
      unsubscribeState()
    }
  }, [backendSync, timelineActor])

  // Мемоизируем преобразование backendProject для предотвращения лишних ререндеров
  const transformedBackendProject = useMemo(() => {
    if (!backendProject) return null
    return transformProjectStateToTimeline(backendProject)
  }, [backendProject])

  // Используем преобразованный проект или проект из машины состояний
  const finalProject = project || transformedBackendProject

  // Отладочная информация для project provider (только при изменениях)
  useEffect(() => {
    logger.debug("[TimelineProjectProvider] Project transformation:", {
      data: {
        hasProject: !!project,
        hasBackendProject: !!backendProject,
        hasFinalProject: !!finalProject,
        finalProjectSections: finalProject?.sections?.length || 0,
        finalProjectGlobalTracks: finalProject?.globalTracks?.length || 0,
        backendTimelineTracks: backendProject?.project?.timeline?.tracks?.length || 0,
      },
    })
  }, [project, backendProject, finalProject])

  const contextValue: TimelineProjectContext = {
    project: finalProject,
    isLoading,
    hasUnsavedChanges,
    createProject: orchestrator.createProject.bind(orchestrator),
    saveProject: orchestrator.saveProject.bind(orchestrator),
    loadProject: orchestrator.loadProject.bind(orchestrator),
    backend: {
      isConnected: backendSync.connected,
      backendProject,
    },
  }

  return (
    <TimelineProjectContext.Provider value={contextValue} data-oid="wdrjcw7">
      {children}
    </TimelineProjectContext.Provider>
  )
}

export function useTimelineProject() {
  const context = useContext(TimelineProjectContext)
  if (!context) {
    throw new Error("useTimelineProject must be used within TimelineProjectProvider")
  }
  return context
}

// ===========================
// Playback Provider
// ===========================
interface TimelinePlaybackContext {
  isPlaying: boolean
  currentTime: number
  playbackRate: number
  duration: number
  play: () => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setPlaybackRate: (rate: number) => void
}

const TimelinePlaybackContext = createContext<TimelinePlaybackContext | null>(null)

export function TimelinePlaybackProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const playerActor = orchestrator.getActors().player
  const backendSync = container.getBackend()

  const isPlaying = useSelector(playerActor, (state) => state.matches({ ready: "playing" }))
  const currentTime = useSelector(playerActor, (state) => state.context.currentTime)
  const duration = useSelector(playerActor, (state) => state.context.duration)
  const playbackRate = useSelector(playerActor, (state) => state.context.basePlaybackRate || 1)

  const contextValue: TimelinePlaybackContext = {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    play: async () => {
      try {
        // Синхронизируем воспроизведение с backend
        await backendSync.executeCommand({
          type: "Play",
        } as any)
        playerActor.send({ type: "PLAY" })
      } catch (error) {
        logger.error("Failed to play:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        playerActor.send({ type: "PLAY" })
      }
    },
    pause: async () => {
      try {
        // Синхронизируем паузу с backend
        await backendSync.executeCommand({
          type: "Pause",
        } as any)
        playerActor.send({ type: "PAUSE" })
      } catch (error) {
        logger.error("Failed to pause:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        playerActor.send({ type: "PAUSE" })
      }
    },
    stop: async () => {
      try {
        // Синхронизируем остановку с backend
        await backendSync.executeCommand({
          type: "Stop",
        } as any)
        playerActor.send({ type: "STOP" })
      } catch (error) {
        logger.error("Failed to stop:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        playerActor.send({ type: "STOP" })
      }
    },
    seek: async (time: number) => {
      try {
        // Синхронизируем поиск с backend
        await backendSync.executeCommand({
          type: "Seek",
          params: { time },
        })
        playerActor.send({ type: "SEEK", time })
      } catch (error) {
        logger.error("Failed to seek:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        playerActor.send({ type: "SEEK", time })
      }
    },
    setPlaybackRate: async (rate: number) => {
      try {
        // Синхронизируем изменение скорости воспроизведения с backend
        await backendSync.executeCommand({
          type: "SetPlaybackRate",
          params: { rate },
        })
        playerActor.send({ type: "SET_PLAYBACK_RATE", rate })
      } catch (error) {
        logger.error("Failed to set playback rate:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        playerActor.send({ type: "SET_PLAYBACK_RATE", rate })
      }
    },
  }

  return (
    <TimelinePlaybackContext.Provider value={contextValue} data-oid="bplnmln">
      {children}
    </TimelinePlaybackContext.Provider>
  )
}

export function useTimelinePlayback() {
  const context = useContext(TimelinePlaybackContext)
  if (!context) {
    throw new Error("useTimelinePlayback must be used within TimelinePlaybackProvider")
  }
  return context
}

// ===========================
// Tracks Provider
// ===========================
interface TimelineTracksContext {
  tracks: TimelineTrack[]
  activeTrackId: string | null
  addTrack: (type: any, name?: string, sectionId?: string) => Promise<string | null>
  removeTrack: (trackId: string) => Promise<void>
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => Promise<void>
  reorderTracks: (sectionId: string, trackIds: string[]) => Promise<void>
  setActiveTrack: (trackId: string | null) => void
}

const TimelineTracksContext = createContext<TimelineTracksContext | null>(null)

export function TimelineTracksProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline
  const backendSync = container.getBackend()

  const project = useSelector(timelineActor, (state) => state.context.project)
  const activeTrackId = useSelector(timelineActor, (state) => state.context.activeTrackId)

  // Собираем все треки из sections и globalTracks для совместимости
  const tracks = [
    ...(project?.globalTracks || []),
    ...(project?.sections?.flatMap((section) => section.tracks || []) || []),
  ]

  const contextValue: TimelineTracksContext = {
    tracks,
    activeTrackId,
    addTrack: orchestrator.addTrack.bind(orchestrator),
    removeTrack: async (trackId: string) => {
      try {
        // Сначала выполняем команду на backend
        await orchestrator.executeCommand({
          type: "DeleteTrack",
          params: { track_id: trackId },
        })

        // Обновляем локальное состояние только после успешного backend вызова
        timelineActor.send({ type: "REMOVE_TRACK", trackId })
      } catch (error) {
        logger.error("Failed to remove track:", { error: error })
        throw error
      }
    },
    updateTrack: async (trackId: string, updates: Partial<TimelineTrack>) => {
      try {
        // Преобразуем TimelineTrack updates в TrackUpdates для backend
        const trackUpdates = {
          name: updates.name ?? null,
          enabled:
            updates.isLocked !== undefined ? !updates.isLocked : updates.locked !== undefined ? !updates.locked : null,
          locked: updates.isLocked ?? updates.locked ?? null,
          volume: updates.volume ?? null,
          height: updates.height ?? null,
        }

        // Выполняем команду на backend
        await backendSync.executeCommand({
          type: "UpdateTrack",
          params: { track_id: trackId, updates: trackUpdates },
        })

        // Обновляем локальное состояние
        timelineActor.send({ type: "UPDATE_TRACK", trackId, updates })
      } catch (error) {
        logger.error("Failed to update track:", { error: error })
        throw error
      }
    },
    reorderTracks: async (sectionId: string, trackIds: string[]) => {
      try {
        // Выполняем команду на backend
        await backendSync.executeCommand({
          type: "ReorderTracks",
          params: { section_id: sectionId, track_ids: trackIds },
        })

        // Обновляем локальное состояние
        timelineActor.send({ type: "REORDER_TRACKS", sectionId, trackIds })
      } catch (error) {
        logger.error("Failed to reorder tracks:", { error: error })
        throw error
      }
    },
    setActiveTrack: (trackId: string | null) => {
      timelineActor.send({ type: "SET_ACTIVE_TRACK", trackId })
    },
  }

  return (
    <TimelineTracksContext.Provider value={contextValue} data-oid="y26fnra">
      {children}
    </TimelineTracksContext.Provider>
  )
}

export function useTimelineTracks() {
  const context = useContext(TimelineTracksContext)
  if (!context) {
    throw new Error("useTimelineTracks must be used within TimelineTracksProvider")
  }
  return context
}

// ===========================
// Clips Provider
// ===========================
interface TimelineClipsContext {
  clips: TimelineClip[]
  addClip: (trackId: string, mediaFile: MediaFile | string, time: number) => Promise<void>
  removeClip: (clipId: string) => Promise<void>
  moveClip: (clipId: string, trackId: string, time: number) => Promise<void>
  trimClip: (clipId: string, startTime: number, endTime: number) => Promise<void>
  splitClip: (clipId: string, time: number) => Promise<void>
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => Promise<void>
  batchUpdateClips: (clips: TimelineClip[]) => Promise<void>
}

const TimelineClipsContext = createContext<TimelineClipsContext | null>(null)

export function TimelineClipsProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline
  const backendSync = container.getBackend()

  const project = useSelector(timelineActor, (state) => state.context.project)

  // Собираем все клипы из всех треков (проверяем и sections, и globalTracks для совместимости)
  const clips = [
    ...(project?.globalTracks?.flatMap((track) => track.clips || []) || []),
    ...(project?.sections?.flatMap((section) => section.tracks?.flatMap((track) => track.clips || []) || []) || []),
  ]

  // Отладочная информация
  logger.debug("[TimelineClipsProvider] Project structure:", {
    data: {
      hasProject: !!project,
      hasGlobalTracks: !!project?.globalTracks,
      globalTracksLength: project?.globalTracks?.length || 0,
      hasSections: !!project?.sections,
      sectionsLength: project?.sections?.length || 0,
      sectionsTracksCount: project?.sections?.reduce((acc, section) => acc + section.tracks.length, 0) || 0,
      totalClips: clips.length,
      projectType: project ? typeof project : "null/undefined",
    },
  })

  const contextValue: TimelineClipsContext = {
    clips,
    addClip: orchestrator.addClip.bind(orchestrator),
    removeClip: async (clipId: string) => {
      try {
        // Выполняем команду на backend - state обновится через событие
        await orchestrator.executeCommand({
          type: "DeleteClip",
          params: { clip_id: clipId },
        })
        // НЕ обновляем локально - ждем событие ClipDeleted от backend
      } catch (error) {
        logger.error("Failed to remove clip:", { error: error })
        throw error
      }
    },
    moveClip: async (clipId: string, trackId: string, time: number) => {
      try {
        // Выполняем команду на backend - state обновится через событие
        await orchestrator.executeCommand({
          type: "MoveClip",
          params: { clip_id: clipId, track_id: trackId, time },
        })
        // НЕ обновляем локально - ждем событие ClipMoved от backend
      } catch (error) {
        logger.error("Failed to move clip:", { error: error })
        throw error
      }
    },
    trimClip: async (clipId: string, startTime: number, endTime: number) => {
      try {
        // Выполняем команду на backend - state обновится через событие
        await orchestrator.executeCommand({
          type: "TrimClip",
          params: { clip_id: clipId, start: startTime, end: endTime },
        })
        // НЕ обновляем локально - ждем событие ClipTrimmed от backend
      } catch (error) {
        logger.error("Failed to trim clip:", { error: error })
        throw error
      }
    },
    splitClip: async (clipId: string, time: number) => {
      try {
        // Выполняем команду на backend - state обновится через событие
        await backendSync.executeCommand({
          type: "SplitClip",
          params: { clip_id: clipId, time },
        })
        // НЕ обновляем локально - ждем событие ClipSplit от backend
      } catch (error) {
        logger.error("Failed to split clip:", { error: error })
        throw error
      }
    },
    updateClip: async (clipId: string, updates: Partial<TimelineClip>) => {
      try {
        // Преобразуем TimelineClip updates в ClipUpdates для backend
        const clipUpdates = {
          name: updates.name ?? null,
          playback_rate: updates.playbackRate ?? updates.speed ?? null,
          volume: updates.volume ?? null,
          enabled: updates.isMuted !== undefined ? !updates.isMuted : null,
        }

        // Выполняем команду на backend - state обновится через событие
        await backendSync.executeCommand({
          type: "UpdateClip",
          params: { clip_id: clipId, updates: clipUpdates },
        })
        // НЕ обновляем локально - ждем событие ClipUpdated от backend
      } catch (error) {
        logger.error("Failed to update clip:", { error: error })
        throw error
      }
    },
    batchUpdateClips: async (clips: TimelineClip[]) => {
      try {
        // BatchUpdateClips не существует в backend, используем последовательные UpdateClip
        for (const clip of clips) {
          const clipUpdates = {
            name: clip.name,
            playback_rate: clip.playbackRate ?? clip.speed,
            volume: clip.volume,
            enabled: !clip.isMuted,
          }
          await backendSync.executeCommand({
            type: "UpdateClip",
            params: { clip_id: clip.id, updates: clipUpdates },
          })
        }
        // НЕ обновляем локально - ждем события от backend
      } catch (error) {
        logger.error("Failed to batch update clips:", { error: error })
        throw error
      }
    },
  }

  return (
    <TimelineClipsContext.Provider value={contextValue} data-oid="ixpwpe6">
      {children}
    </TimelineClipsContext.Provider>
  )
}

export function useTimelineClips() {
  const context = useContext(TimelineClipsContext)
  if (!context) {
    throw new Error("useTimelineClips must be used within TimelineClipsProvider")
  }
  return context
}

// ===========================
// Selection Provider
// ===========================
interface TimelineSelectionContext {
  selectedClipIds: string[]
  selectedTrackIds: string[]
  selectedSectionIds: string[]
  selectClips: (clipIds: string[], addToSelection?: boolean) => void
  selectTracks: (trackIds: string[], addToSelection?: boolean) => void
  selectSections: (sectionIds: string[], addToSelection?: boolean) => void
  clearSelection: () => void
  copyClips: () => Promise<void>
  cutClips: () => Promise<void>
  pasteClips: (trackId: string, time: number) => Promise<void>
  deleteSelected: () => Promise<void>
}

const TimelineSelectionContext = createContext<TimelineSelectionContext | null>(null)

export function TimelineSelectionProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline
  const backendSync = container.getBackend()

  const selectedClipIds = useSelector(timelineActor, (state) => state.context.selectedClipIds)
  const selectedTrackIds = useSelector(timelineActor, (state) => state.context.selectedTrackIds)
  const selectedSectionIds = useSelector(timelineActor, (state) => state.context.selectedSectionIds)

  const contextValue: TimelineSelectionContext = {
    selectedClipIds,
    selectedTrackIds,
    selectedSectionIds,
    selectClips: async (clipIds: string[], addToSelection?: boolean) => {
      try {
        // Синхронизируем выбор клипов с backend
        await backendSync.executeCommand({
          type: "SelectClips",
          params: {
            clip_ids: clipIds,
            add_to_selection: addToSelection ?? false,
          },
        })
        timelineActor.send({ type: "SELECT_CLIPS", clipIds, addToSelection })
      } catch (error) {
        logger.error("Failed to select clips:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "SELECT_CLIPS", clipIds, addToSelection })
      }
    },
    selectTracks: async (trackIds: string[], addToSelection?: boolean) => {
      try {
        // Синхронизируем выбор треков с backend
        await backendSync.executeCommand({
          type: "SelectTracks",
          params: {
            track_ids: trackIds,
            add_to_selection: addToSelection ?? false,
          },
        })
        timelineActor.send({ type: "SELECT_TRACKS", trackIds, addToSelection })
      } catch (error) {
        logger.error("Failed to select tracks:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "SELECT_TRACKS", trackIds, addToSelection })
      }
    },
    selectSections: async (sectionIds: string[], addToSelection?: boolean) => {
      try {
        // Синхронизируем выбор секций с backend
        await backendSync.executeCommand({
          type: "SelectSections",
          params: {
            section_ids: sectionIds,
            add_to_selection: addToSelection ?? false,
          },
        })
        timelineActor.send({
          type: "SELECT_SECTIONS",
          sectionIds,
          addToSelection,
        })
      } catch (error) {
        logger.error("Failed to select sections:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({
          type: "SELECT_SECTIONS",
          sectionIds,
          addToSelection,
        })
      }
    },
    clearSelection: async () => {
      try {
        // Синхронизируем очистку выбора с backend
        await backendSync.executeCommand({
          type: "ClearSelection",
        })
        timelineActor.send({ type: "CLEAR_SELECTION" })
      } catch (error) {
        logger.error("Failed to clear selection:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "CLEAR_SELECTION" })
      }
    },
    copyClips: async () => {
      try {
        // Синхронизируем копирование клипов с backend
        await backendSync.executeCommand({
          type: "CopyClips",
          params: { clip_ids: selectedClipIds },
        })
        timelineActor.send({ type: "COPY_CLIPS" })
      } catch (error) {
        logger.error("Failed to copy clips:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "COPY_CLIPS" })
      }
    },
    cutClips: async () => {
      try {
        // Синхронизируем вырезание клипов с backend
        await backendSync.executeCommand({
          type: "CutClips",
          params: { clip_ids: selectedClipIds },
        })
        timelineActor.send({ type: "CUT_CLIPS" })
      } catch (error) {
        logger.error("Failed to cut clips:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "CUT_CLIPS" })
      }
    },
    pasteClips: async (trackId: string, time: number) => {
      try {
        // Синхронизируем вставку клипов с backend
        await backendSync.executeCommand({
          type: "PasteClips",
          params: { track_id: trackId, time },
        })
        timelineActor.send({ type: "PASTE_CLIPS", trackId, time })
      } catch (error) {
        logger.error("Failed to paste clips:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "PASTE_CLIPS", trackId, time })
      }
    },
    deleteSelected: async () => {
      try {
        // ПРИМЕЧАНИЕ: Используем отдельные команды для каждого элемента
        // Это более гибко, чем batch команда DeleteSelected, т.к. позволяет
        // обрабатывать ошибки для каждого элемента отдельно и поддерживает
        // транзакции. Если потребуется оптимизация, можно добавить batch API.
        for (const clipId of selectedClipIds) {
          await backendSync.executeCommand({
            type: "DeleteClip",
            params: { clip_id: clipId },
          })
        }
        for (const trackId of selectedTrackIds) {
          await backendSync.executeCommand({
            type: "DeleteTrack",
            params: { track_id: trackId },
          })
        }
        timelineActor.send({ type: "DELETE_SELECTED" })
      } catch (error) {
        logger.error("Failed to delete selected:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "DELETE_SELECTED" })
      }
    },
  }

  return (
    <TimelineSelectionContext.Provider value={contextValue} data-oid="njbycyg">
      {children}
    </TimelineSelectionContext.Provider>
  )
}

export function useTimelineSelection() {
  const context = useContext(TimelineSelectionContext)
  if (!context) {
    throw new Error("useTimelineSelection must be used within TimelineSelectionProvider")
  }
  return context
}

// ===========================
// Effects Provider
// ===========================
interface TimelineEffectsContext {
  applyEffect: (clipId: string, effectId: string, params?: any) => Promise<void>
  removeEffect: (clipId: string, effectId: string) => Promise<void>
  applyFilter: (clipId: string, filterId: string, params?: any) => Promise<void>
  removeFilter: (clipId: string, filterId: string) => Promise<void>
  applyTransition: (clipId: string, transitionId: string, params?: any) => Promise<void>
  removeTransition: (clipId: string, transitionId: string) => Promise<void>
}

const TimelineEffectsContext = createContext<TimelineEffectsContext | null>(null)

export function TimelineEffectsProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline
  const backendSync = container.getBackend()

  const contextValue: TimelineEffectsContext = {
    applyEffect: async (clipId: string, effectId: string, params?: any) => {
      try {
        // Синхронизируем применение эффекта с backend
        await backendSync.executeCommand({
          type: "ApplyEffect",
          params: { clip_id: clipId, effect_id: effectId, params },
        })
        timelineActor.send({ type: "APPLY_EFFECT", clipId, effectId, params })
      } catch (error) {
        logger.error("Failed to apply effect:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "APPLY_EFFECT", clipId, effectId, params })
      }
    },
    removeEffect: async (clipId: string, effectId: string) => {
      try {
        // Синхронизируем удаление эффекта с backend
        await backendSync.executeCommand({
          type: "RemoveEffect",
          params: { clip_id: clipId, effect_id: effectId },
        })
        timelineActor.send({ type: "REMOVE_EFFECT", clipId, effectId })
      } catch (error) {
        logger.error("Failed to remove effect:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "REMOVE_EFFECT", clipId, effectId })
      }
    },
    applyFilter: async (clipId: string, filterId: string, params?: any) => {
      try {
        // Синхронизируем применение фильтра с backend
        await backendSync.executeCommand({
          type: "ApplyFilter",
          params: { clip_id: clipId, filter_id: filterId, params },
        })
        timelineActor.send({ type: "APPLY_FILTER", clipId, filterId, params })
      } catch (error) {
        logger.error("Failed to apply filter:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "APPLY_FILTER", clipId, filterId, params })
      }
    },
    removeFilter: async (clipId: string, filterId: string) => {
      try {
        // Синхронизируем удаление фильтра с backend
        await backendSync.executeCommand({
          type: "RemoveFilter",
          params: { clip_id: clipId, filter_id: filterId },
        })
        timelineActor.send({ type: "REMOVE_FILTER", clipId, filterId })
      } catch (error) {
        logger.error("Failed to remove filter:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "REMOVE_FILTER", clipId, filterId })
      }
    },
    applyTransition: async (clipId: string, transitionId: string, params?: any) => {
      try {
        // Синхронизируем применение перехода с backend
        await backendSync.executeCommand({
          type: "ApplyTransition",
          params: { clip_id: clipId, transition_id: transitionId, params },
        })
        timelineActor.send({
          type: "APPLY_TRANSITION",
          clipId,
          transitionId,
          params,
        })
      } catch (error) {
        logger.error("Failed to apply transition:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({
          type: "APPLY_TRANSITION",
          clipId,
          transitionId,
          params,
        })
      }
    },
    removeTransition: async (clipId: string, transitionId: string) => {
      try {
        // Синхронизируем удаление перехода с backend
        await backendSync.executeCommand({
          type: "RemoveTransition",
          params: { clip_id: clipId, transition_id: transitionId },
        })
        timelineActor.send({ type: "REMOVE_TRANSITION", clipId, transitionId })
      } catch (error) {
        logger.error("Failed to remove transition:", { error: error })
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "REMOVE_TRANSITION", clipId, transitionId })
      }
    },
  }

  return (
    <TimelineEffectsContext.Provider value={contextValue} data-oid="an1-tqi">
      {children}
    </TimelineEffectsContext.Provider>
  )
}

export function useTimelineEffects() {
  const context = useContext(TimelineEffectsContext)
  if (!context) {
    throw new Error("useTimelineEffects must be used within TimelineEffectsProvider")
  }
  return context
}

// ===========================
// Markers Provider
// ===========================
interface TimelineMarkersContext {
  markers: any[] // TimelineMarker[] from domain types
  addMarker: (data: { name: string; time: number; type: string; color: string; description?: string }) => Promise<void>
  updateMarker: (markerId: string, updates: any) => Promise<void>
  removeMarker: (markerId: string) => Promise<void>
  goToMarker: (markerId: string) => void
}

const TimelineMarkersContext = createContext<TimelineMarkersContext | null>(null)

export function TimelineMarkersProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline
  const backendSync = container.getBackend()

  const project = useSelector(timelineActor, (state) => state.context.project)

  // Получаем маркеры из проекта, мемоизируем для предотвращения лишних ререндеров
  const markers = useMemo(() => {
    if (!project?.markers) return []
    return [...project.markers].sort((a, b) => a.time - b.time)
  }, [project?.markers])

  const contextValue: TimelineMarkersContext = {
    markers,
    addMarker: async (data) => {
      try {
        await backendSync.executeCommand({
          type: "AddMarker",
          params: {
            name: data.name,
            time: data.time,
            color: data.color,
            marker_type: data.type,
            description: data.description || null,
          },
        })
        // Backend обновит состояние через события
      } catch (error) {
        logger.error("Failed to add marker:", { error })
        throw error
      }
    },
    updateMarker: async (markerId: string, updates: any) => {
      try {
        await backendSync.executeCommand({
          type: "UpdateMarker",
          params: {
            marker_id: markerId,
            name: updates.name || null,
            time: updates.time || null,
            color: updates.color || null,
            description: updates.description || null,
          },
        })
        // Backend обновит состояние через события
      } catch (error) {
        logger.error("Failed to update marker:", { error })
        throw error
      }
    },
    removeMarker: async (markerId: string) => {
      try {
        await backendSync.executeCommand({
          type: "RemoveMarker",
          params: { marker_id: markerId },
        })
        // Backend обновит состояние через события
      } catch (error) {
        logger.error("Failed to remove marker:", { error })
        throw error
      }
    },
    goToMarker: (markerId: string) => {
      const marker = markers.find((m) => m.id === markerId)
      if (marker) {
        timelineActor.send({ type: "SEEK", time: marker.time })
      }
    },
  }

  return (
    <TimelineMarkersContext.Provider value={contextValue} data-oid="u86cu4-">
      {children}
    </TimelineMarkersContext.Provider>
  )
}

export function useTimelineMarkers() {
  const context = useContext(TimelineMarkersContext)
  if (!context) {
    throw new Error("useTimelineMarkers must be used within TimelineMarkersProvider")
  }
  return context
}

// ===========================
// Keyframes Provider
// ===========================
interface TimelineKeyframesContext {
  // Получение keyframes
  getClipKeyframes: (clipId: string) => any[]
  getPropertyKeyframes: (clipId: string, property: string) => any[]

  // Операции с keyframes
  addKeyframe: (
    clipId: string,
    property: string,
    time: number,
    value: any,
    interpolation?: string,
    easeIn?: number,
    easeOut?: number,
  ) => Promise<void>
  removeKeyframe: (clipId: string, keyframeId: string) => Promise<void>
  updateKeyframe: (
    clipId: string,
    keyframeId: string,
    updates: {
      time?: number
      value?: any
      interpolation?: string
      easeIn?: number
      easeOut?: number
    },
  ) => Promise<void>
  clearPropertyKeyframes: (clipId: string, property: string) => Promise<void>
}

const TimelineKeyframesContext = createContext<TimelineKeyframesContext | null>(null)

export function TimelineKeyframesProvider({ children }: { children: ReactNode }) {
  const backendSync = container.getBackend()
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline
  const project = useSelector(timelineActor, (state) => state.context.project)

  // Получение всех клипов из проекта
  const clips = useMemo(() => {
    const proj = project as any
    if (!proj?.timeline?.tracks) return []
    return proj.timeline.tracks.flatMap((track: any) => track.clips || [])
  }, [project])

  const getClipKeyframes = useCallback(
    (clipId: string) => {
      const clip = clips.find((c: any) => c.id === clipId)
      return clip?.keyframes || []
    },
    [clips],
  )

  const getPropertyKeyframes = useCallback(
    (clipId: string, property: string) => {
      const keyframes = getClipKeyframes(clipId)
      return keyframes.filter((kf: any) => kf.property === property)
    },
    [getClipKeyframes],
  )

  const contextValue: TimelineKeyframesContext = {
    getClipKeyframes,
    getPropertyKeyframes,
    addKeyframe: async (clipId, property, time, value, interpolation = "linear", easeIn?, easeOut?) => {
      try {
        await backendSync.executeCommand({
          type: "AddKeyframe",
          params: {
            clip_id: clipId,
            property,
            time,
            value,
            interpolation,
            ease_in: easeIn ?? null,
            ease_out: easeOut ?? null,
          },
        })
        // Backend обновит состояние через события
      } catch (error) {
        logger.error("Failed to add keyframe:", { error })
        throw error
      }
    },
    removeKeyframe: async (clipId, keyframeId) => {
      try {
        await backendSync.executeCommand({
          type: "RemoveKeyframe",
          params: {
            clip_id: clipId,
            keyframe_id: keyframeId,
          },
        })
        // Backend обновит состояние через события
      } catch (error) {
        logger.error("Failed to remove keyframe:", { error })
        throw error
      }
    },
    updateKeyframe: async (clipId, keyframeId, updates) => {
      try {
        await backendSync.executeCommand({
          type: "UpdateKeyframe",
          params: {
            clip_id: clipId,
            keyframe_id: keyframeId,
            time: updates.time || null,
            value: updates.value || null,
            interpolation: updates.interpolation || null,
            ease_in: updates.easeIn || null,
            ease_out: updates.easeOut || null,
          },
        })
        // Backend обновит состояние через события
      } catch (error) {
        logger.error("Failed to update keyframe:", { error })
        throw error
      }
    },
    clearPropertyKeyframes: async (clipId, property) => {
      try {
        await backendSync.executeCommand({
          type: "ClearPropertyKeyframes",
          params: {
            clip_id: clipId,
            property,
          },
        })
        // Backend обновит состояние через события
      } catch (error) {
        logger.error("Failed to clear property keyframes:", { error })
        throw error
      }
    },
  }

  return (
    <TimelineKeyframesContext.Provider value={contextValue} data-oid="01h59go">
      {children}
    </TimelineKeyframesContext.Provider>
  )
}

export function useTimelineKeyframes() {
  const context = useContext(TimelineKeyframesContext)
  if (!context) {
    throw new Error("useTimelineKeyframes must be used within TimelineKeyframesProvider")
  }
  return context
}

// ===========================
// Combined Timeline Provider
// ===========================
export function TimelineProvider({ children }: { children: ReactNode }) {
  return (
    <TimelineProjectProvider data-oid=":7vax56">
      <TimelinePlaybackProvider data-oid="k8vsa1.">
        <TimelineTracksProvider data-oid="22w.d9e">
          <TimelineClipsProvider data-oid="78mpg8b">
            <TimelineSelectionProvider data-oid="2a2n6li">
              <TimelineEffectsProvider data-oid="zp_w4hn">
                <TimelineMarkersProvider data-oid="l71oc2d">
                  <TimelineKeyframesProvider data-oid="t7j7qx2">{children}</TimelineKeyframesProvider>
                </TimelineMarkersProvider>
              </TimelineEffectsProvider>
            </TimelineSelectionProvider>
          </TimelineClipsProvider>
        </TimelineTracksProvider>
      </TimelinePlaybackProvider>
    </TimelineProjectProvider>
  )
}
