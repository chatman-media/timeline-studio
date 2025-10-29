/**
 * Timeline Domain Providers
 *
 * Модульная система провайдеров для работы с расширенной timeline машиной.
 * Каждый провайдер отвечает за свою область ответственности.
 */

import { useSelector } from "@xstate/react"
import { createContext, type ReactNode, useContext, useEffect, useState } from "react"
import type { MediaFile } from "@/domains/ai-services/types/montage-planner"
// Используем типы из доменов вместо features
import type { TimelineClip as DomainTimelineClip, Timeline, Track } from "../types"

// Временный alias для совместимости
type TimelineProject = Timeline
type TimelineTrack = Track
type TimelineClip = DomainTimelineClip

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import type { ProjectState } from "@/types/generated/tauri-bindings"
import { getVideoEditingOrchestrator } from "../services/video-editing-orchestrator"
import { transformBackendProjectToTimeline } from "../utils/project-transform"

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
    backendProject: ProjectState | null
  }
}

const TimelineProjectContext = createContext<TimelineProjectContext | null>(null)

export function TimelineProjectProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline
  const backendSync = getBackendSync()

  const project = useSelector(timelineActor, (state) => state.context.project)
  const isLoading = useSelector(timelineActor, (state) => state.context.isLoading)
  const hasUnsavedChanges = useSelector(timelineActor, (state) => state.context.hasUnsavedChanges)

  // Подписка на изменения backend состояния
  const [backendProject, setBackendProject] = useState<ProjectState | null>(null)

  useEffect(() => {
    // Подписываемся на изменения backend состояния
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setBackendProject(state)

      // Преобразуем backend project в Timeline структуру
      if (state.project) {
        const transformedProject = transformBackendProjectToTimeline(state.project)
        if (transformedProject) {
          timelineActor.send({
            type: "PROJECT_UPDATED",
            project: transformedProject,
          })
        }
      }
    })

    // Получаем начальное состояние
    backendSync.getProjectState().then((state) => {
      if (state) {
        setBackendProject(state)
        
        // Преобразуем начальный проект
        if (state.project) {
          const transformedProject = transformBackendProjectToTimeline(state.project)
          if (transformedProject) {
            timelineActor.send({
              type: "PROJECT_UPDATED", 
              project: transformedProject,
            })
          }
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [backendSync, timelineActor])

  // Используем преобразованный проект или проект из машины состояний
  const finalProject = project || transformBackendProjectToTimeline(backendProject?.project)

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

  return <TimelineProjectContext.Provider value={contextValue}>{children}</TimelineProjectContext.Provider>
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
  const backendSync = getBackendSync()

  const isPlaying = useSelector(playerActor, (state) => state.matches("playing"))
  const currentTime = useSelector(playerActor, (state) => state.context.currentTime)
  const duration = useSelector(playerActor, (state) => state.context.duration)
  const playbackRate = useSelector(playerActor, (state) => state.context.playbackRate)

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
          params: {},
        })
        playerActor.send({ type: "PLAY" })
      } catch (error) {
        console.error("Failed to play:", error)
        // В случае ошибки все равно обновляем локальное состояние
        playerActor.send({ type: "PLAY" })
      }
    },
    pause: async () => {
      try {
        // Синхронизируем паузу с backend
        await backendSync.executeCommand({
          type: "Pause",
          params: {},
        })
        playerActor.send({ type: "PAUSE" })
      } catch (error) {
        console.error("Failed to pause:", error)
        // В случае ошибки все равно обновляем локальное состояние
        playerActor.send({ type: "PAUSE" })
      }
    },
    stop: async () => {
      try {
        // Синхронизируем остановку с backend
        await backendSync.executeCommand({
          type: "Stop",
          params: {},
        })
        playerActor.send({ type: "STOP" })
      } catch (error) {
        console.error("Failed to stop:", error)
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
        console.error("Failed to seek:", error)
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
        console.error("Failed to set playback rate:", error)
        // В случае ошибки все равно обновляем локальное состояние
        playerActor.send({ type: "SET_PLAYBACK_RATE", rate })
      }
    },
  }

  return <TimelinePlaybackContext.Provider value={contextValue}>{children}</TimelinePlaybackContext.Provider>
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
  addTrack: (type: any, name?: string, sectionId?: string) => Promise<void>
  removeTrack: (trackId: string) => Promise<void>
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => Promise<void>
  reorderTracks: (sectionId: string, trackIds: string[]) => Promise<void>
  setActiveTrack: (trackId: string | null) => void
}

const TimelineTracksContext = createContext<TimelineTracksContext | null>(null)

export function TimelineTracksProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline
  const backendSync = getBackendSync()

  const project = useSelector(timelineActor, (state) => state.context.project)
  const activeTrackId = useSelector(timelineActor, (state) => state.context.activeTrackId)

  const tracks = project?.globalTracks || []

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
        console.error("Failed to remove track:", error)
        throw error
      }
    },
    updateTrack: async (trackId: string, updates: Partial<TimelineTrack>) => {
      try {
        // Выполняем команду на backend
        await backendSync.executeCommand({
          type: "UpdateTrack",
          params: { track_id: trackId, updates },
        })

        // Обновляем локальное состояние
        timelineActor.send({ type: "UPDATE_TRACK", trackId, updates })
      } catch (error) {
        console.error("Failed to update track:", error)
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
        console.error("Failed to reorder tracks:", error)
        throw error
      }
    },
    setActiveTrack: (trackId: string | null) => {
      timelineActor.send({ type: "SET_ACTIVE_TRACK", trackId })
    },
  }

  return <TimelineTracksContext.Provider value={contextValue}>{children}</TimelineTracksContext.Provider>
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
  const backendSync = getBackendSync()

  const project = useSelector(timelineActor, (state) => state.context.project)

  // Собираем все клипы из всех треков
  const clips = project?.globalTracks.flatMap((track) => track.clips) || []

  const contextValue: TimelineClipsContext = {
    clips,
    addClip: orchestrator.addClip.bind(orchestrator),
    removeClip: async (clipId: string) => {
      try {
        // Сначала выполняем команду на backend
        await orchestrator.executeCommand({
          type: "DeleteClip",
          params: { clip_id: clipId },
        })

        // Обновляем локальное состояние только после успешного backend вызова
        timelineActor.send({ type: "REMOVE_CLIP", clipId })
      } catch (error) {
        console.error("Failed to remove clip:", error)
        throw error
      }
    },
    moveClip: async (clipId: string, trackId: string, time: number) => {
      try {
        // Сначала выполняем команду на backend
        await orchestrator.executeCommand({
          type: "MoveClip",
          params: { clip_id: clipId, track_id: trackId, time },
        })

        // Обновляем локальное состояние только после успешного backend вызова
        timelineActor.send({ type: "MOVE_CLIP", clipId, trackId, time })
      } catch (error) {
        console.error("Failed to move clip:", error)
        throw error
      }
    },
    trimClip: async (clipId: string, startTime: number, endTime: number) => {
      try {
        // Сначала выполняем команду на backend
        await orchestrator.executeCommand({
          type: "TrimClip",
          params: { clip_id: clipId, start: startTime, end: endTime },
        })

        // Обновляем локальное состояние только после успешного backend вызова
        timelineActor.send({ type: "TRIM_CLIP", clipId, startTime, endTime })
      } catch (error) {
        console.error("Failed to trim clip:", error)
        throw error
      }
    },
    splitClip: async (clipId: string, time: number) => {
      try {
        // Пытаемся выполнить команду на backend (если доступна)
        await backendSync.executeCommand({
          type: "SplitClip",
          params: { clip_id: clipId, time },
        })

        // Обновляем локальное состояние
        timelineActor.send({ type: "SPLIT_CLIP", clipId, time })
      } catch (error) {
        console.warn("SplitClip command not available in backend, updating UI only:", error)
        // Если команда не доступна, просто обновляем UI состояние
        timelineActor.send({ type: "SPLIT_CLIP", clipId, time })
      }
    },
    updateClip: async (clipId: string, updates: Partial<TimelineClip>) => {
      try {
        // Выполняем команду на backend
        await backendSync.executeCommand({
          type: "UpdateClip",
          params: { clip_id: clipId, updates },
        })

        // Обновляем локальное состояние
        timelineActor.send({ type: "UPDATE_CLIP", clipId, updates })
      } catch (error) {
        console.error("Failed to update clip:", error)
        throw error
      }
    },
    batchUpdateClips: async (clips: TimelineClip[]) => {
      try {
        // Выполняем команду на backend
        await backendSync.executeCommand({
          type: "BatchUpdateClips",
          params: { clips },
        })

        // Обновляем локальное состояние
        timelineActor.send({ type: "BATCH_UPDATE_CLIPS", clips })
      } catch (error) {
        console.error("Failed to batch update clips:", error)
        throw error
      }
    },
  }

  return <TimelineClipsContext.Provider value={contextValue}>{children}</TimelineClipsContext.Provider>
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
  const backendSync = getBackendSync()

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
          params: { clip_ids: clipIds, add_to_selection: addToSelection },
        })
        timelineActor.send({ type: "SELECT_CLIPS", clipIds, addToSelection })
      } catch (error) {
        console.error("Failed to select clips:", error)
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "SELECT_CLIPS", clipIds, addToSelection })
      }
    },
    selectTracks: async (trackIds: string[], addToSelection?: boolean) => {
      try {
        // Синхронизируем выбор треков с backend
        await backendSync.executeCommand({
          type: "SelectTracks",
          params: { track_ids: trackIds, add_to_selection: addToSelection },
        })
        timelineActor.send({ type: "SELECT_TRACKS", trackIds, addToSelection })
      } catch (error) {
        console.error("Failed to select tracks:", error)
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "SELECT_TRACKS", trackIds, addToSelection })
      }
    },
    selectSections: async (sectionIds: string[], addToSelection?: boolean) => {
      try {
        // Синхронизируем выбор секций с backend
        await backendSync.executeCommand({
          type: "SelectSections",
          params: { section_ids: sectionIds, add_to_selection: addToSelection },
        })
        timelineActor.send({ type: "SELECT_SECTIONS", sectionIds, addToSelection })
      } catch (error) {
        console.error("Failed to select sections:", error)
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "SELECT_SECTIONS", sectionIds, addToSelection })
      }
    },
    clearSelection: async () => {
      try {
        // Синхронизируем очистку выбора с backend
        await backendSync.executeCommand({
          type: "ClearSelection",
          params: {},
        })
        timelineActor.send({ type: "CLEAR_SELECTION" })
      } catch (error) {
        console.error("Failed to clear selection:", error)
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
        console.error("Failed to copy clips:", error)
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
        console.error("Failed to cut clips:", error)
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
        console.error("Failed to paste clips:", error)
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "PASTE_CLIPS", trackId, time })
      }
    },
    deleteSelected: async () => {
      try {
        // Синхронизируем удаление выбранных элементов с backend
        await backendSync.executeCommand({
          type: "DeleteSelected",
          params: {
            clip_ids: selectedClipIds,
            track_ids: selectedTrackIds,
            section_ids: selectedSectionIds,
          },
        })
        timelineActor.send({ type: "DELETE_SELECTED" })
      } catch (error) {
        console.error("Failed to delete selected:", error)
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "DELETE_SELECTED" })
      }
    },
  }

  return <TimelineSelectionContext.Provider value={contextValue}>{children}</TimelineSelectionContext.Provider>
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
  const backendSync = getBackendSync()

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
        console.error("Failed to apply effect:", error)
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
        console.error("Failed to remove effect:", error)
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
        console.error("Failed to apply filter:", error)
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
        console.error("Failed to remove filter:", error)
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
        timelineActor.send({ type: "APPLY_TRANSITION", clipId, transitionId, params })
      } catch (error) {
        console.error("Failed to apply transition:", error)
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "APPLY_TRANSITION", clipId, transitionId, params })
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
        console.error("Failed to remove transition:", error)
        // В случае ошибки все равно обновляем локальное состояние
        timelineActor.send({ type: "REMOVE_TRANSITION", clipId, transitionId })
      }
    },
  }

  return <TimelineEffectsContext.Provider value={contextValue}>{children}</TimelineEffectsContext.Provider>
}

export function useTimelineEffects() {
  const context = useContext(TimelineEffectsContext)
  if (!context) {
    throw new Error("useTimelineEffects must be used within TimelineEffectsProvider")
  }
  return context
}

// ===========================
// Combined Timeline Provider
// ===========================
export function TimelineProvider({ children }: { children: ReactNode }) {
  return (
    <TimelineProjectProvider>
      <TimelinePlaybackProvider>
        <TimelineTracksProvider>
          <TimelineClipsProvider>
            <TimelineSelectionProvider>
              <TimelineEffectsProvider>{children}</TimelineEffectsProvider>
            </TimelineSelectionProvider>
          </TimelineClipsProvider>
        </TimelineTracksProvider>
      </TimelinePlaybackProvider>
    </TimelineProjectProvider>
  )
}
