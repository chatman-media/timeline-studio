/**
 * Утилиты для работы с Timeline
 */

import type { MediaFile } from "@/features/media/types/media"
import type {
  TimelineClip,
  TimelineProject,
  TimelineSection,
  TimelineTrack,
  TrackType,
} from "@/features/timeline/types"

// ============================================================================
// PROJECT UTILITIES
// ============================================================================

/**
 * Вычисляет общую длительность проекта
 */
export function calculateProjectDuration(project: TimelineProject): number {
  if (!project?.sections || project.sections.length === 0) return 0

  const lastSection = project.sections.reduce((latest, section) =>
    section.endTime > latest.endTime ? section : latest,
  )

  return lastSection.endTime
}

/**
 * Получает все треки проекта (включая глобальные и из секций)
 */
export function getAllTracks(project: TimelineProject | null | undefined): TimelineTrack[] {
  if (!project) return []
  const sectionTracks = (project.sections || []).flatMap((section) => section.tracks || [])
  return [...(project.globalTracks || []), ...sectionTracks]
}

/**
 * Получает все клипы проекта
 */
export function getAllClips(project: TimelineProject | null | undefined): TimelineClip[] {
  return getAllTracks(project).flatMap((track) => track.clips || [])
}

/**
 * Находит секцию по времени
 */
export function findSectionAtTime(project: TimelineProject, time: number): TimelineSection | null {
  if (!project?.sections) return null
  return project.sections.find((section) => time >= section.startTime && time <= section.endTime) || null
}

// ============================================================================
// TRACK UTILITIES
// ============================================================================

/**
 * Получает треки определенного типа
 */
export function getTracksByType(project: TimelineProject, type: TrackType): TimelineTrack[] {
  return getAllTracks(project).filter((track) => track.type === type)
}

/**
 * Сортирует треки по порядку
 */
export function sortTracksByOrder(tracks: TimelineTrack[]): TimelineTrack[] {
  return [...tracks].sort((a, b) => a.order - b.order)
}

/**
 * Находит трек по ID
 */
export function findTrackById(project: TimelineProject, trackId: string): TimelineTrack | null {
  return getAllTracks(project).find((track) => track.id === trackId) || null
}

/**
 * Проверяет, есть ли место для клипа на треке
 */
export function canPlaceClipOnTrack(
  track: TimelineTrack,
  startTime: number,
  duration: number,
  excludeClipId?: string,
): boolean {
  const endTime = startTime + duration

  return !track.clips.some((clip) => {
    if (excludeClipId && clip.id === excludeClipId) return false

    const clipEndTime = clip.startTime + clip.duration
    return !(endTime <= clip.startTime || startTime >= clipEndTime)
  })
}

// ============================================================================
// CLIP UTILITIES
// ============================================================================

/**
 * Находит клип по ID
 */
export function findClipById(project: TimelineProject, clipId: string): TimelineClip | null {
  return getAllClips(project).find((clip) => clip.id === clipId) || null
}

/**
 * Получает клипы в временном диапазоне
 */
export function getClipsInTimeRange(project: TimelineProject, startTime: number, endTime: number): TimelineClip[] {
  return getAllClips(project).filter((clip) => {
    const clipEndTime = clip.startTime + clip.duration
    return !(clipEndTime <= startTime || clip.startTime >= endTime)
  })
}

/**
 * Сортирует клипы по времени начала
 */
export function sortClipsByTime(clips: TimelineClip[]): TimelineClip[] {
  return [...clips].sort((a, b) => a.startTime - b.startTime)
}

/**
 * Находит ближайший клип к указанному времени
 */
export function findNearestClip(project: TimelineProject, time: number, trackType?: TrackType): TimelineClip | null {
  let clips = getAllClips(project)

  if (trackType) {
    const tracks = getTracksByType(project, trackType)
    clips = tracks.flatMap((track) => track.clips)
  }

  if (clips.length === 0) return null

  return clips.reduce((nearest, clip) => {
    const clipCenter = clip.startTime + clip.duration / 2
    const nearestCenter = nearest.startTime + nearest.duration / 2

    return Math.abs(clipCenter - time) < Math.abs(nearestCenter - time) ? clip : nearest
  })
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

/**
 * Конвертирует секунды в тайм-код (HH:MM:SS:FF)
 */
export function secondsToTimecode(seconds: number, fps = 30): string {
  const totalFrames = Math.floor(seconds * fps)
  const frames = totalFrames % fps
  const totalSeconds = Math.floor(totalFrames / fps)
  const secs = totalSeconds % 60
  const mins = Math.floor(totalSeconds / 60) % 60
  const hours = Math.floor(totalSeconds / 3600)

  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`
}

/**
 * Конвертирует тайм-код в секунды
 */
export function timecodeToSeconds(timecode: string, fps = 30): number {
  const parts = timecode.split(":").map(Number)
  if (parts.length !== 4) throw new Error("Invalid timecode format")

  const [hours, mins, secs, frames] = parts
  return hours * 3600 + mins * 60 + secs + frames / fps
}

/**
 * Привязывает время к сетке
 */
export function snapToGrid(time: number, gridSize: number): number {
  return Math.round(time / gridSize) * gridSize
}

/**
 * Привязывает время к ближайшему клипу
 */
export function snapToClip(time: number, project: TimelineProject, snapDistance = 0.1): number {
  const clips = getAllClips(project)
  let nearestTime = time
  let minDistance = snapDistance

  clips.forEach((clip) => {
    // Проверяем начало клипа
    const startDistance = Math.abs(time - clip.startTime)
    if (startDistance < minDistance) {
      nearestTime = clip.startTime
      minDistance = startDistance
    }

    // Проверяем конец клипа
    const endTime = clip.startTime + clip.duration
    const endDistance = Math.abs(time - endTime)
    if (endDistance < minDistance) {
      nearestTime = endTime
      minDistance = endDistance
    }
  })

  return nearestTime
}

// ============================================================================
// SELECTION UTILITIES
// ============================================================================

/**
 * Получает выделенные клипы
 */
export function getSelectedClips(project: TimelineProject): TimelineClip[] {
  return getAllClips(project).filter((clip) => clip.isSelected)
}

/**
 * Выделяет клипы в прямоугольной области
 */
export function selectClipsInArea(
  project: TimelineProject,
  startTime: number,
  endTime: number,
  trackIds: string[],
): TimelineClip[] {
  const tracks = trackIds.map((id) => findTrackById(project, id)).filter(Boolean) as TimelineTrack[]
  const clips = tracks.flatMap((track) => track.clips)

  return clips.filter((clip) => {
    const clipEndTime = clip.startTime + clip.duration
    return !(clipEndTime <= startTime || clip.startTime >= endTime)
  })
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Валидирует структуру проекта
 */
export function validateProject(project: TimelineProject): string[] {
  const errors: string[] = []

  // Проверяем секции
  if (project?.sections) {
    project.sections.forEach((section) => {
      if (section.startTime < 0) {
        errors.push(`Section ${section.name}: start time cannot be negative`)
      }
      if (section.duration <= 0) {
        errors.push(`Section ${section.name}: duration must be positive`)
      }
      if (section.endTime !== section.startTime + section.duration) {
        errors.push(`Section ${section.name}: end time mismatch`)
      }
    })
  }

  // Проверяем треки
  getAllTracks(project).forEach((track) => {
    track.clips.forEach((clip) => {
      if (clip.startTime < 0) {
        errors.push(`Clip ${clip.name}: start time cannot be negative`)
      }
      if (clip.duration <= 0) {
        errors.push(`Clip ${clip.name}: duration must be positive`)
      }
      if (clip.mediaStartTime < 0) {
        errors.push(`Clip ${clip.name}: media start time cannot be negative`)
      }
    })
  })

  return errors
}

/**
 * Проверяет совместимость медиафайла с треком
 */
export function isMediaCompatibleWithTrack(media: MediaFile, track: TimelineTrack): boolean {
  switch (track.type) {
    case "video":
      return media.isVideo || false
    case "audio":
    case "music":
    case "voiceover":
    case "sfx":
    case "ambient":
      return media.isAudio || false
    case "image":
      return media.isImage || false
    default:
      return false
  }
}
