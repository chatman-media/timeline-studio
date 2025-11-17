/**
 * Backend Event Handlers для Timeline Machine
 *
 * Обрабатывает события от Rust backend и обновляет состояние машины
 * Используется паттерн Command-Event для синхронизации
 */

import { createLogger } from "@/lib/tauri-logger"
import type { ProjectEvent } from "@/types/generated/state-types"
import type { TimelineClip, Track } from "../types"
import { convertClipToTimelineClip } from "../utils/clip-transform"
import { validateClip, validateProjectEvent } from "../utils/type-validation"
import type { TimelineExtendedContext } from "./timeline-extended-machine"

const logger = createLogger("BackendEventHandlers")

/**
 * Главный обработчик backend событий
 */
export function handleBackendEvent(
  context: TimelineExtendedContext,
  event: ProjectEvent,
): Partial<TimelineExtendedContext> {
  // Валидация события перед обработкой
  if (!validateProjectEvent(event)) {
    logger.error("Invalid backend event, skipping", { event })
    return {
      error: `Invalid backend event: ${String((event as any)?.type ?? "unknown")}`,
    }
  }

  logger.info("Handling backend event:", { event: event.type })

  switch (event.type) {
    // Project Lifecycle Events
    case "ProjectCreated":
      return handleProjectCreated(context, event)
    case "ProjectOpened":
      return handleProjectOpened(context, event)
    case "ProjectSaved":
      return handleProjectSaved(context, event)
    case "ProjectClosed":
      return handleProjectClosed(context, event)

    // Clip Events
    case "ClipAdded":
      return handleClipAdded(context, event)
    case "ClipMoved":
      return handleClipMoved(context, event)
    case "ClipTrimmed":
      return handleClipTrimmed(context, event)
    case "ClipDeleted":
      return handleClipDeleted(context, event)
    case "ClipUpdated":
      return handleClipUpdated(context, event)
    case "ClipSplit":
      return handleClipSplit(context, event)

    // Track Events
    case "TrackAdded":
      return handleTrackAdded(context, event)
    case "TrackDeleted":
      return handleTrackDeleted(context, event)
    case "TrackUpdated":
      return handleTrackUpdated(context, event)

    // Media Events
    case "MediaAdded":
      return handleMediaAdded(context, event)
    case "MediaRemoved":
      return handleMediaRemoved(context, event)
    case "MediaUpdated":
      return handleMediaUpdated(context, event)

    // Playback Events
    case "PlaybackStarted":
      return handlePlaybackStarted(context, event)
    case "PlaybackStopped":
      return handlePlaybackStopped(context, event)
    case "PlaybackSeeked":
      return handlePlaybackSeeked(context, event)
    case "PlaybackRateChanged":
      return handlePlaybackRateChanged(context, event)

    default:
      logger.debug("Unhandled backend event type:", { type: event.type })
      return {}
  }
}

// ============================================================================
// Project Lifecycle Handlers
// ============================================================================

function handleProjectCreated(
  _context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "ProjectCreated" }>,
): Partial<TimelineExtendedContext> {
  logger.info("Project created:", { projectId: event.payload.project_id })

  // Проект создан на backend, ждем полной синхронизации через PROJECT_UPDATED
  return {
    isLoading: false,
    hasUnsavedChanges: false,
  }
}

function handleProjectOpened(
  _context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "ProjectOpened" }>,
): Partial<TimelineExtendedContext> {
  logger.info("Project opened:", { path: event.payload.path })

  return {
    isLoading: false,
    hasUnsavedChanges: false,
  }
}

function handleProjectSaved(
  _context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "ProjectSaved" }>,
): Partial<TimelineExtendedContext> {
  logger.info("Project saved:", { path: event.payload.path })

  return {
    hasUnsavedChanges: false,
  }
}

function handleProjectClosed(
  _context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "ProjectClosed" }>,
): Partial<TimelineExtendedContext> {
  logger.info("Project closed:", { projectId: event.payload.project_id })

  return {
    project: null,
    hasUnsavedChanges: false,
    selectedClipIds: [],
    selectedTrackIds: [],
    selectedSectionIds: [],
  }
}

// ============================================================================
// Clip Handlers
// ============================================================================

function handleClipAdded(
  context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "ClipAdded" }>,
): Partial<TimelineExtendedContext> {
  const { track_id, clip } = event.payload

  if (!context.project) {
    logger.warn("Cannot add clip - no project loaded")
    return {}
  }

  // Валидация клипа
  if (!validateClip(clip)) {
    logger.error("Invalid clip in ClipAdded event", { clip })
    return { error: "Invalid clip data" }
  }

  logger.info("Adding clip to track:", { trackId: track_id, clipId: clip.id })

  // Создаем новый project с обновленным клипом
  const updatedProject = { ...context.project }

  // Ищем трек в globalTracks или sections
  let trackFound = false

  // Проверяем globalTracks
  if (updatedProject.globalTracks) {
    updatedProject.globalTracks = updatedProject.globalTracks.map((track) => {
      if (track.id === track_id) {
        trackFound = true
        const newClip = convertClipToTimelineClip(clip, track_id)

        return {
          ...track,
          clips: [...track.clips, newClip].sort((a, b) => a.startTime - b.startTime),
        }
      }
      return track
    })
  }

  // Проверяем sections
  if (!trackFound && updatedProject.sections) {
    updatedProject.sections = updatedProject.sections.map((section) => ({
      ...section,
      tracks: section.tracks.map((track) => {
        if (track.id === track_id) {
          trackFound = true
          const newClip = convertClipToTimelineClip(clip, track_id)

          return {
            ...track,
            clips: [...track.clips, newClip].sort((a, b) => a.startTime - b.startTime),
          }
        }
        return track
      }),
    }))
  }

  if (!trackFound) {
    logger.warn("Track not found for clip:", { trackId: track_id })
    return {}
  }

  return {
    project: updatedProject,
    hasUnsavedChanges: true,
  }
}

function handleClipMoved(
  context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "ClipMoved" }>,
): Partial<TimelineExtendedContext> {
  const { clip_id, new_track_id, new_time } = event.payload

  if (!context.project) {
    logger.warn("Cannot move clip - no project loaded")
    return {}
  }

  logger.info("Moving clip:", { clipId: clip_id, newTrackId: new_track_id, newTime: new_time })

  const updatedProject = { ...context.project }
  let movedClip: TimelineClip | null = null

  // ОПТИМИЗАЦИЯ: Один проход вместо двух (O(n) вместо O(n²))
  // Удаляем клип из старого трека И добавляем в новый трек за одну итерацию
  const moveClipInTrack = (track: Track): Track => {
    // Удаляем клип из этого трека (если он здесь)
    const clipIndex = track.clips.findIndex((c) => c.id === clip_id)
    let updatedTrack = track

    if (clipIndex !== -1) {
      movedClip = { ...track.clips[clipIndex] }
      updatedTrack = {
        ...track,
        clips: track.clips.filter((c) => c.id !== clip_id),
      }
    }

    // Если это целевой трек, добавляем клип сюда
    if (track.id === new_track_id && movedClip) {
      const updatedMovedClip: TimelineClip = {
        ...movedClip,
        trackId: new_track_id,
        startTime: new_time,
      }

      return {
        ...updatedTrack,
        clips: [...updatedTrack.clips, updatedMovedClip].sort((a, b) => a.startTime - b.startTime),
      }
    }

    return updatedTrack
  }

  // Один проход по всем трекам
  if (updatedProject.globalTracks) {
    updatedProject.globalTracks = updatedProject.globalTracks.map(moveClipInTrack)
  }
  if (updatedProject.sections) {
    updatedProject.sections = updatedProject.sections.map((section) => ({
      ...section,
      tracks: section.tracks.map(moveClipInTrack),
    }))
  }

  if (!movedClip) {
    logger.warn("Clip not found for move:", { clipId: clip_id })
    return {}
  }

  return {
    project: updatedProject,
    hasUnsavedChanges: true,
  }
}

function handleClipTrimmed(
  context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "ClipTrimmed" }>,
): Partial<TimelineExtendedContext> {
  const { clip_id, new_in, new_out } = event.payload

  if (!context.project) {
    logger.warn("Cannot trim clip - no project loaded")
    return {}
  }

  logger.info("Trimming clip:", { clipId: clip_id, newIn: new_in, newOut: new_out })

  const updatedProject = { ...context.project }

  const updateClipInTrack = (track: Track): Track => ({
    ...track,
    clips: track.clips.map((clip) => {
      if (clip.id === clip_id) {
        return {
          ...clip,
          startTime: new_in,
          duration: new_out - new_in,
        }
      }
      return clip
    }),
  })

  if (updatedProject.globalTracks) {
    updatedProject.globalTracks = updatedProject.globalTracks.map(updateClipInTrack)
  }
  if (updatedProject.sections) {
    updatedProject.sections = updatedProject.sections.map((section) => ({
      ...section,
      tracks: section.tracks.map(updateClipInTrack),
    }))
  }

  return {
    project: updatedProject,
    hasUnsavedChanges: true,
  }
}

function handleClipDeleted(
  context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "ClipDeleted" }>,
): Partial<TimelineExtendedContext> {
  const { clip_id } = event.payload

  if (!context.project) {
    logger.warn("Cannot delete clip - no project loaded")
    return {}
  }

  logger.info("Deleting clip:", { clipId: clip_id })

  const updatedProject = { ...context.project }

  const removeClipFromTrack = (track: Track): Track => ({
    ...track,
    clips: track.clips.filter((c) => c.id !== clip_id),
  })

  if (updatedProject.globalTracks) {
    updatedProject.globalTracks = updatedProject.globalTracks.map(removeClipFromTrack)
  }
  if (updatedProject.sections) {
    updatedProject.sections = updatedProject.sections.map((section) => ({
      ...section,
      tracks: section.tracks.map(removeClipFromTrack),
    }))
  }

  return {
    project: updatedProject,
    hasUnsavedChanges: true,
    selectedClipIds: context.selectedClipIds.filter((id) => id !== clip_id),
  }
}

function handleClipUpdated(
  context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "ClipUpdated" }>,
): Partial<TimelineExtendedContext> {
  const { clip_id, changes } = event.payload

  if (!context.project) {
    logger.warn("Cannot update clip - no project loaded")
    return {}
  }

  logger.info("Updating clip:", { clipId: clip_id, changes })

  const updatedProject = { ...context.project }

  const updateClipInTrack = (track: Track): Track => ({
    ...track,
    clips: track.clips.map((clip) => {
      if (clip.id === clip_id) {
        return {
          ...clip,
          ...(changes.name && { name: changes.name }),
          ...(changes.playback_rate && { playbackRate: changes.playback_rate, speed: changes.playback_rate }),
          ...(changes.volume !== undefined && changes.volume !== null && { volume: changes.volume ?? 1 }),
        }
      }
      return clip
    }),
  })

  if (updatedProject.globalTracks) {
    updatedProject.globalTracks = updatedProject.globalTracks.map(updateClipInTrack)
  }
  if (updatedProject.sections) {
    updatedProject.sections = updatedProject.sections.map((section) => ({
      ...section,
      tracks: section.tracks.map(updateClipInTrack),
    }))
  }

  return {
    project: updatedProject,
    hasUnsavedChanges: true,
  }
}

function handleClipSplit(
  context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "ClipSplit" }>,
): Partial<TimelineExtendedContext> {
  const { original_clip_id, left_clip, right_clip, track_id } = event.payload

  if (!context.project) {
    logger.warn("Cannot split clip - no project loaded")
    return {}
  }

  logger.info("Splitting clip:", { originalId: original_clip_id, leftId: left_clip.id, rightId: right_clip.id })

  const updatedProject = { ...context.project }

  const splitClipInTrack = (track: Track): Track => {
    if (track.id !== track_id) return track

    // Удаляем оригинальный клип и добавляем два новых
    const clips = track.clips.filter((c) => c.id !== original_clip_id)

    const leftTimelineClip = convertClipToTimelineClip(left_clip, track_id)
    const rightTimelineClip = convertClipToTimelineClip(right_clip, track_id)

    return {
      ...track,
      clips: [...clips, leftTimelineClip, rightTimelineClip].sort((a, b) => a.startTime - b.startTime),
    }
  }

  if (updatedProject.globalTracks) {
    updatedProject.globalTracks = updatedProject.globalTracks.map(splitClipInTrack)
  }
  if (updatedProject.sections) {
    updatedProject.sections = updatedProject.sections.map((section) => ({
      ...section,
      tracks: section.tracks.map(splitClipInTrack),
    }))
  }

  return {
    project: updatedProject,
    hasUnsavedChanges: true,
  }
}

// ============================================================================
// Track Handlers
// ============================================================================

function handleTrackAdded(
  context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "TrackAdded" }>,
): Partial<TimelineExtendedContext> {
  const { track } = event.payload

  if (!context.project) {
    logger.warn("Cannot add track - no project loaded")
    return {}
  }

  logger.info("Adding track:", { trackId: track.id, name: track.name })

  // Backend добавил трек - будет полная синхронизация через PROJECT_UPDATED
  return {
    hasUnsavedChanges: true,
  }
}

function handleTrackDeleted(
  context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "TrackDeleted" }>,
): Partial<TimelineExtendedContext> {
  const { track_id } = event.payload

  if (!context.project) {
    logger.warn("Cannot delete track - no project loaded")
    return {}
  }

  logger.info("Deleting track:", { trackId: track_id })

  const updatedProject = { ...context.project }

  // Удаляем из globalTracks
  if (updatedProject.globalTracks) {
    updatedProject.globalTracks = updatedProject.globalTracks.filter((t) => t.id !== track_id)
  }

  // Удаляем из sections
  if (updatedProject.sections) {
    updatedProject.sections = updatedProject.sections.map((section) => ({
      ...section,
      tracks: section.tracks.filter((t) => t.id !== track_id),
    }))
  }

  return {
    project: updatedProject,
    hasUnsavedChanges: true,
    selectedTrackIds: context.selectedTrackIds.filter((id) => id !== track_id),
    activeTrackId: context.activeTrackId === track_id ? null : context.activeTrackId,
  }
}

function handleTrackUpdated(
  context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "TrackUpdated" }>,
): Partial<TimelineExtendedContext> {
  const { track_id, changes } = event.payload

  if (!context.project) {
    logger.warn("Cannot update track - no project loaded")
    return {}
  }

  logger.info("Updating track:", { trackId: track_id, changes })

  const updatedProject = { ...context.project }

  const updateTrack = (track: Track): Track => {
    if (track.id !== track_id) return track

    return {
      ...track,
      ...(changes.name && { name: changes.name }),
      ...(changes.enabled !== undefined && changes.enabled !== null && { isLocked: !changes.enabled }),
      ...(changes.locked !== undefined && changes.locked !== null && { isLocked: changes.locked ?? false }),
      ...(changes.volume !== undefined && changes.volume !== null && { volume: changes.volume ?? 1 }),
      ...(changes.height !== undefined && changes.height !== null && { height: changes.height ?? 100 }),
    }
  }

  if (updatedProject.globalTracks) {
    updatedProject.globalTracks = updatedProject.globalTracks.map(updateTrack)
  }
  if (updatedProject.sections) {
    updatedProject.sections = updatedProject.sections.map((section) => ({
      ...section,
      tracks: section.tracks.map(updateTrack),
    }))
  }

  return {
    project: updatedProject,
    hasUnsavedChanges: true,
  }
}

// ============================================================================
// Media Handlers (будут обрабатываться через media pool)
// ============================================================================

function handleMediaAdded(
  _context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "MediaAdded" }>,
): Partial<TimelineExtendedContext> {
  logger.info("Media added to pool:", { mediaId: event.payload.media.id })
  return {} // Media pool обрабатывается отдельно
}

function handleMediaRemoved(
  _context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "MediaRemoved" }>,
): Partial<TimelineExtendedContext> {
  logger.info("Media removed from pool:", { mediaId: event.payload.media_id })
  return {} // Media pool обрабатывается отдельно
}

function handleMediaUpdated(
  _context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "MediaUpdated" }>,
): Partial<TimelineExtendedContext> {
  logger.info("Media updated in pool:", { mediaId: event.payload.media_id })
  return {} // Media pool обрабатывается отдельно
}

// ============================================================================
// Playback Handlers
// ============================================================================

function handlePlaybackStarted(
  _context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "PlaybackStarted" }>,
): Partial<TimelineExtendedContext> {
  logger.info("Playback started:", { time: event.payload.time })

  return {
    isPlaying: true,
    currentTime: event.payload.time,
  }
}

function handlePlaybackStopped(
  _context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "PlaybackStopped" }>,
): Partial<TimelineExtendedContext> {
  logger.info("Playback stopped:", { time: event.payload.time })

  return {
    isPlaying: false,
    currentTime: event.payload.time,
  }
}

function handlePlaybackSeeked(
  _context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "PlaybackSeeked" }>,
): Partial<TimelineExtendedContext> {
  logger.info("Playback seeked:", { time: event.payload.time })

  return {
    currentTime: event.payload.time,
  }
}

function handlePlaybackRateChanged(
  _context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "PlaybackRateChanged" }>,
): Partial<TimelineExtendedContext> {
  logger.info("Playback rate changed:", { rate: event.payload.rate })

  return {
    playbackRate: event.payload.rate,
  }
}
