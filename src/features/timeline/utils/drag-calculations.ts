/**
 * Utilities for drag and drop position calculations
 */

import { type MediaFile, MediaType } from "../../media/types/media"

import type { TimelineClip, TimelineProject, TrackType } from "../types"

import type { TimelineMarker } from "../types/markers"

// ============================================================================
// TYPES
// ============================================================================

export interface SnapTarget {
  position: number
  type: "grid" | "clip-start" | "clip-end" | "marker" | "playhead"
  distance: number // in pixels
  clipId?: string
  markerId?: string
  label?: string
}

/**
 * Calculate timeline position from mouse coordinates
 */
export function calculateTimelinePosition(
  mouseX: number,
  containerRect: DOMRect,
  scrollLeft: number,
  timeScale: number,
): number {
  // Get relative position within the container
  const relativeX = mouseX - containerRect.left + scrollLeft

  // Convert pixels to time using the time scale
  const timePosition = Math.max(0, relativeX / timeScale)

  return timePosition
}

/**
 * Snap position to various targets based on snap mode
 */
export function snapToTargets(
  position: number,
  snapMode: "none" | "grid" | "clips" | "markers",
  options: {
    gridInterval?: number
    project?: TimelineProject
    snapThreshold?: number // pixels
    timeScale?: number
    excludeClipId?: string // для исключения текущего перетаскиваемого клипа
  } = {},
): { snappedPosition: number; snapTarget?: SnapTarget } {
  const { gridInterval = 1, project, snapThreshold = 10, timeScale = 100, excludeClipId } = options

  if (snapMode === "none") {
    return { snappedPosition: position }
  }

  const snapTargets: SnapTarget[] = []

  // Grid snapping
  if (snapMode === "grid" || snapMode === "clips") {
    const gridPosition = Math.round(position / gridInterval) * gridInterval
    snapTargets.push({
      position: gridPosition,
      type: "grid",
      distance: Math.abs(position - gridPosition) * timeScale,
    })
  }

  // Clip snapping
  if ((snapMode === "clips" || snapMode === "markers") && project) {
    const clipTargets = getClipSnapTargets(project, position, timeScale, snapThreshold, excludeClipId)
    snapTargets.push(...clipTargets)
  }

  // Marker snapping
  if (snapMode === "markers" && project?.markers) {
    const markerTargets = getMarkerSnapTargets(project.markers as any, position, timeScale, snapThreshold)
    snapTargets.push(...markerTargets)
  }

  // Найти ближайший snap target
  const validTargets = snapTargets.filter((target) => target.distance <= snapThreshold)

  if (validTargets.length === 0) {
    return { snappedPosition: position }
  }

  // Сортируем по расстоянию и берем ближайший
  const closestTarget = validTargets.sort((a, b) => a.distance - b.distance)[0]

  return {
    snappedPosition: closestTarget.position,
    snapTarget: closestTarget,
  }
}

/**
 * Check if a media file can be dropped on a track type
 */
export function canDropOnTrack(mediaFile: MediaFile, trackType: TrackType): boolean {
  // Video files can go on video tracks
  if (mediaFile.isVideo && trackType === "Video") {
    return true
  }

  // Audio files can go on audio tracks
  if (mediaFile.isAudio && (trackType === "Audio" || trackType === "Music")) {
    return true
  }

  // Image files can go on video tracks (as static images)
  if (mediaFile.isImage && trackType === "Video") {
    return true
  }

  return false
}

/**
 * Get the appropriate track type for a media file
 */
export function getTrackTypeForMediaFile(mediaFile: MediaFile): TrackType {
  if (mediaFile.isVideo) {
    return "Video"
  }

  if (mediaFile.isAudio) {
    return "Audio"
  }

  if (mediaFile.isImage) {
    return "Video" // Images are displayed on video tracks
  }

  // Check media type from file
  if (mediaFile.type === MediaType.Video) return "Video"
  if (mediaFile.type === MediaType.Audio) return "Audio"

  // Check probeData if available
  if (mediaFile.probeData?.streams) {
    const hasVideo = mediaFile.probeData.streams.some((stream: any) => stream.codec_type === "video")
    const hasAudio = mediaFile.probeData.streams.some((stream: any) => stream.codec_type === "audio")

    if (hasVideo) return "Video"
    if (hasAudio) return "Audio"
  }

  // Default to video track
  return "Video"
}

/**
 * Get snap targets from clips
 */
function getClipSnapTargets(
  project: TimelineProject,
  position: number,
  timeScale: number,
  snapThreshold: number,
  excludeClipId?: string,
): SnapTarget[] {
  const targets: SnapTarget[] = []

  // Собираем все клипы из всех треков и секций
  const allClips: TimelineClip[] = []

  // Клипы из секций
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => {
      allClips.push(...track.clips)
    })
  })

  // Глобальные клипы
  allClips.push(...project.globalTracks.flatMap((track) => track.clips))

  // Создаем snap targets для начала и конца каждого клипа
  allClips.forEach((clip) => {
    if (clip.id === excludeClipId) return // Исключаем перетаскиваемый клип

    const startDistance = Math.abs(position - clip.startTime) * timeScale
    const endDistance = Math.abs(position - (clip.startTime + clip.duration)) * timeScale

    if (startDistance <= snapThreshold) {
      targets.push({
        position: clip.startTime,
        type: "clip-start",
        distance: startDistance,
        clipId: clip.id,
        label: `${clip.name} (начало)`,
      })
    }

    if (endDistance <= snapThreshold) {
      targets.push({
        position: clip.startTime + clip.duration,
        type: "clip-end",
        distance: endDistance,
        clipId: clip.id,
        label: `${clip.name} (конец)`,
      })
    }
  })

  return targets
}

/**
 * Get snap targets from markers
 */
function getMarkerSnapTargets(
  markers: TimelineMarker[],
  position: number,
  timeScale: number,
  snapThreshold: number,
): SnapTarget[] {
  const targets: SnapTarget[] = []

  markers.forEach((marker) => {
    const distance = Math.abs(position - marker.time) * timeScale

    if (distance <= snapThreshold) {
      targets.push({
        position: marker.time,
        type: "marker",
        distance,
        markerId: marker.id,
        label: marker.name || "Маркер",
      })
    }
  })

  return targets
}

/**
 * Find insertion point avoiding overlaps with existing clips
 */
export function findInsertionPoint(
  targetTime: number,
  trackId: string,
  clipDuration: number,
  project?: TimelineProject,
  options: {
    avoidOverlaps?: boolean
    snapToClips?: boolean
    snapThreshold?: number
    timeScale?: number
  } = {},
): { insertionTime: number; snapTarget?: SnapTarget } {
  if (!project) {
    return { insertionTime: Math.max(0, targetTime) }
  }

  const { avoidOverlaps = true, snapToClips = false, snapThreshold = 10, timeScale = 100 } = options

  // Находим целевой трек
  let targetTrack: { clips: TimelineClip[] } | undefined

  // Поиск в секциях
  for (const section of project.sections) {
    const track = section.tracks.find((t) => t.id === trackId)
    if (track) {
      targetTrack = track
      break
    }
  }

  // Поиск в глобальных треках
  if (!targetTrack) {
    targetTrack = project.globalTracks.find((t) => t.id === trackId)
  }

  if (!targetTrack) {
    return { insertionTime: Math.max(0, targetTime) }
  }

  // Snap to clips если включено
  if (snapToClips) {
    const snapTargets = getClipSnapTargets(project, targetTime, timeScale, snapThreshold)
    const validTargets = snapTargets.filter(
      (target) => Math.abs(target.position - targetTime) * timeScale <= snapThreshold,
    )

    if (validTargets.length > 0) {
      const closestTarget = validTargets.sort((a, b) => a.distance - b.distance)[0]
      targetTime = closestTarget.position
    }
  }

  // Избежание пересечений если включено
  if (avoidOverlaps) {
    const insertionEndTime = targetTime + clipDuration

    // Проверяем пересечения с существующими клипами
    const hasOverlap = targetTrack.clips.some((clip) => {
      const clipStart = clip.startTime
      const clipEnd = clip.startTime + clip.duration

      return (
        (targetTime >= clipStart && targetTime < clipEnd) ||
        (insertionEndTime > clipStart && insertionEndTime <= clipEnd) ||
        (targetTime <= clipStart && insertionEndTime >= clipEnd)
      )
    })

    if (hasOverlap) {
      // Найти первое доступное место после targetTime
      const sortedClips = [...targetTrack.clips].sort((a, b) => a.startTime - b.startTime)

      for (let i = 0; i < sortedClips.length; i++) {
        const clip = sortedClips[i]
        const nextClip = sortedClips[i + 1]

        const clipEnd = clip.startTime + clip.duration
        const nextClipStart = nextClip ? nextClip.startTime : Number.POSITIVE_INFINITY

        // Если есть достаточно места между клипами
        if (clipEnd >= targetTime && nextClipStart - clipEnd >= clipDuration) {
          return { insertionTime: Math.max(0, clipEnd) }
        }
      }

      // Если нет места между клипами, поставить в конец
      const lastClip = sortedClips[sortedClips.length - 1]
      if (lastClip) {
        return { insertionTime: lastClip.startTime + lastClip.duration }
      }
    }
  }

  return { insertionTime: Math.max(0, targetTime) }
}

/**
 * Legacy function for backward compatibility
 */
export function snapToGrid(
  position: number,
  snapMode: "none" | "grid" | "clips" | "markers",
  gridInterval = 1,
): number {
  const result = snapToTargets(position, snapMode, { gridInterval })
  return result.snappedPosition
}
