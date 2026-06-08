/**
 * Timeline Hook - модульный агрегатор
 *
 * Объединяет все модульные хуки в единый интерфейс для обратной совместимости
 */

import {
  useTimelineClips,
  useTimelineEffects,
  useTimelineMarkers,
  useTimelinePlayback,
  useTimelineProject,
  useTimelineSelection,
  useTimelineTracks,
} from "@/features/timeline/providers/timeline-providers"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("UseTimeline")

export interface TimelineContextType {
  // Project управление
  project: ReturnType<typeof useTimelineProject>["project"]
  isLoading: ReturnType<typeof useTimelineProject>["isLoading"]
  hasUnsavedChanges: ReturnType<typeof useTimelineProject>["hasUnsavedChanges"]
  createProject: ReturnType<typeof useTimelineProject>["createProject"]
  saveProject: ReturnType<typeof useTimelineProject>["saveProject"]
  loadProject: ReturnType<typeof useTimelineProject>["loadProject"]
  backend: ReturnType<typeof useTimelineProject>["backend"]

  // Playback управление
  isPlaying: ReturnType<typeof useTimelinePlayback>["isPlaying"]
  currentTime: ReturnType<typeof useTimelinePlayback>["currentTime"]
  playbackRate: ReturnType<typeof useTimelinePlayback>["playbackRate"]
  duration: ReturnType<typeof useTimelinePlayback>["duration"]
  play: ReturnType<typeof useTimelinePlayback>["play"]
  pause: ReturnType<typeof useTimelinePlayback>["pause"]
  stop: ReturnType<typeof useTimelinePlayback>["stop"]
  seek: ReturnType<typeof useTimelinePlayback>["seek"]
  setPlaybackRate: ReturnType<typeof useTimelinePlayback>["setPlaybackRate"]

  // Tracks управление
  tracks: ReturnType<typeof useTimelineTracks>["tracks"]
  activeTrackId: ReturnType<typeof useTimelineTracks>["activeTrackId"]
  addTrack: ReturnType<typeof useTimelineTracks>["addTrack"]
  removeTrack: ReturnType<typeof useTimelineTracks>["removeTrack"]
  updateTrack: ReturnType<typeof useTimelineTracks>["updateTrack"]
  reorderTracks: ReturnType<typeof useTimelineTracks>["reorderTracks"]
  setActiveTrack: ReturnType<typeof useTimelineTracks>["setActiveTrack"]

  // Clips управление
  clips: ReturnType<typeof useTimelineClips>["clips"]
  addClip: ReturnType<typeof useTimelineClips>["addClip"]
  removeClip: ReturnType<typeof useTimelineClips>["removeClip"]
  moveClip: ReturnType<typeof useTimelineClips>["moveClip"]
  trimClip: ReturnType<typeof useTimelineClips>["trimClip"]
  splitClip: ReturnType<typeof useTimelineClips>["splitClip"]
  updateClip: ReturnType<typeof useTimelineClips>["updateClip"]
  batchUpdateClips: ReturnType<typeof useTimelineClips>["batchUpdateClips"]

  // Selection управление
  selectedClipIds: ReturnType<typeof useTimelineSelection>["selectedClipIds"]
  selectedTrackIds: ReturnType<typeof useTimelineSelection>["selectedTrackIds"]
  selectClips: ReturnType<typeof useTimelineSelection>["selectClips"]
  selectTracks: ReturnType<typeof useTimelineSelection>["selectTracks"]
  clearSelection: ReturnType<typeof useTimelineSelection>["clearSelection"]
  copyClips: ReturnType<typeof useTimelineSelection>["copyClips"]
  cutClips: ReturnType<typeof useTimelineSelection>["cutClips"]
  pasteClips: ReturnType<typeof useTimelineSelection>["pasteClips"]
  deleteSelected: ReturnType<typeof useTimelineSelection>["deleteSelected"]

  // Effects управление
  applyEffect: ReturnType<typeof useTimelineEffects>["applyEffect"]
  removeEffect: ReturnType<typeof useTimelineEffects>["removeEffect"]
  applyFilter: ReturnType<typeof useTimelineEffects>["applyFilter"]
  removeFilter: ReturnType<typeof useTimelineEffects>["removeFilter"]
  applyTransition: ReturnType<typeof useTimelineEffects>["applyTransition"]
  removeTransition: ReturnType<typeof useTimelineEffects>["removeTransition"]

  // Markers управление
  markers: ReturnType<typeof useTimelineMarkers>["markers"]
  addMarker: ReturnType<typeof useTimelineMarkers>["addMarker"]
  updateMarker: ReturnType<typeof useTimelineMarkers>["updateMarker"]
  removeMarker: ReturnType<typeof useTimelineMarkers>["removeMarker"]
  goToMarker: ReturnType<typeof useTimelineMarkers>["goToMarker"]

  // Legacy методы для обратной совместимости
  addSection: (name: string, start: number, end: number) => Promise<void>
  removeSection: (sectionId: string) => Promise<void>
  selectSections: (sectionIds: string[]) => void
  setTimeScale: (scale: number) => void
  setScrollPosition: (position: { x: number; y: number }) => void
  setEditMode: (mode: string) => void
  toggleSnap: () => void
  copySelection: () => Promise<void>
  cutSelection: () => Promise<void>
  paste: (targetId: string, position: number) => Promise<void>
  send: (event: any) => void

  // Error handling
  error: string | null
  clearError: () => void
}

/**
 * Агрегирующий хук для обратной совместимости
 * Объединяет все модульные провайдеры в единый интерфейс
 */
export function useTimeline(): TimelineContextType {
  const project = useTimelineProject()
  const playback = useTimelinePlayback()
  const tracks = useTimelineTracks()
  const clips = useTimelineClips()
  const selection = useTimelineSelection()
  const effects = useTimelineEffects()
  const markers = useTimelineMarkers()

  return {
    // Project
    project: project.project,
    isLoading: project.isLoading,
    hasUnsavedChanges: project.hasUnsavedChanges,
    createProject: project.createProject,
    saveProject: project.saveProject,
    loadProject: project.loadProject,
    backend: project.backend,

    // Playback
    isPlaying: playback.isPlaying,
    currentTime: playback.currentTime,
    playbackRate: playback.playbackRate,
    duration: playback.duration,
    play: playback.play,
    pause: playback.pause,
    stop: playback.stop,
    seek: playback.seek,
    setPlaybackRate: playback.setPlaybackRate,

    // Tracks
    tracks: tracks.tracks,
    activeTrackId: tracks.activeTrackId,
    addTrack: tracks.addTrack,
    removeTrack: tracks.removeTrack,
    updateTrack: tracks.updateTrack,
    reorderTracks: tracks.reorderTracks,
    setActiveTrack: tracks.setActiveTrack,

    // Clips
    clips: clips.clips,
    addClip: clips.addClip,
    removeClip: clips.removeClip,
    moveClip: clips.moveClip,
    trimClip: clips.trimClip,
    splitClip: clips.splitClip,
    updateClip: clips.updateClip,
    batchUpdateClips: clips.batchUpdateClips,

    // Selection
    selectedClipIds: selection.selectedClipIds,
    selectedTrackIds: selection.selectedTrackIds,
    selectClips: selection.selectClips,
    selectTracks: selection.selectTracks,
    clearSelection: selection.clearSelection,
    copyClips: selection.copyClips,
    cutClips: selection.cutClips,
    pasteClips: selection.pasteClips,
    deleteSelected: selection.deleteSelected,

    // Effects
    applyEffect: effects.applyEffect,
    removeEffect: effects.removeEffect,
    applyFilter: effects.applyFilter,
    removeFilter: effects.removeFilter,
    applyTransition: effects.applyTransition,
    removeTransition: effects.removeTransition,

    // Markers
    markers: markers.markers,
    addMarker: markers.addMarker,
    updateMarker: markers.updateMarker,
    removeMarker: markers.removeMarker,
    goToMarker: markers.goToMarker,

    // Legacy методы для обратной совместимости
    addSection: async (_name: string, _start: number, _end: number) => {
      logger.warn("addSection is deprecated - sections are not implemented in the new architecture")
    },
    removeSection: async (_sectionId: string) => {
      logger.warn("removeSection is deprecated - sections are not implemented in the new architecture")
    },
    selectSections: (_sectionIds: string[]) => {
      logger.warn("selectSections is deprecated - sections are not implemented in the new architecture")
    },
    setTimeScale: (_scale: number) => {
      logger.warn("setTimeScale is deprecated - use UI state management instead")
    },
    setScrollPosition: (_position: { x: number; y: number }) => {
      logger.warn("setScrollPosition is deprecated - use UI state management instead")
    },
    setEditMode: (_mode: string) => {
      logger.warn("setEditMode is deprecated - use UI state management instead")
    },
    toggleSnap: () => {
      logger.warn("toggleSnap is deprecated - use UI state management instead")
    },
    copySelection: async () => {
      await selection.copyClips()
    },
    cutSelection: async () => {
      await selection.cutClips()
    },
    paste: async (targetId: string, position: number) => {
      await selection.pasteClips(targetId, position)
    },
    send: (_event: any) => {
      logger.warn("send is deprecated - use specific provider methods instead")
    },

    // Error handling
    error: null,
    clearError: () => {
      // No-op for now - errors handled by individual providers
    },
  }
}

// Legacy export для обратной совместимости
export { useTimeline as useTimelineV2 }
