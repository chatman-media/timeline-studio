/**
 * Type Validation Utilities
 *
 * Runtime валидация типов на границах Rust ↔ TypeScript
 * Обеспечивает type safety при обмене данными между backend и frontend
 */

import { createLogger } from "@/lib/tauri-logger"
import type { Clip, Project, ProjectEvent, Track as RustTrack } from "@/types/generated/tauri-bindings"

const logger = createLogger("TypeValidation")

/**
 * Валидирует Rust Clip перед конвертацией в TimelineClip
 */
export function validateClip(clip: unknown): clip is Clip {
  if (!clip || typeof clip !== "object") {
    logger.error("Invalid clip: not an object", { clip })
    return false
  }

  const c = clip as Partial<Clip>

  // Обязательные поля
  const required = [
    "id",
    "media_id",
    "name",
    "timeline_in",
    "timeline_out",
    "source_in",
    "source_out",
    "playback_rate",
    "enabled",
  ]

  for (const field of required) {
    if (!(field in c)) {
      logger.error(`Invalid clip: missing field '${field}'`, { clip })
      return false
    }
  }

  // Валидация типов
  if (typeof c.id !== "string" || !c.id) {
    logger.error("Invalid clip: id must be non-empty string", { clip })
    return false
  }

  if (typeof c.media_id !== "string" || !c.media_id) {
    logger.error("Invalid clip: media_id must be non-empty string", { clip })
    return false
  }

  if (typeof c.timeline_in !== "number" || c.timeline_in < 0) {
    logger.error("Invalid clip: timeline_in must be non-negative number", { clip })
    return false
  }

  if (typeof c.timeline_out !== "number" || c.timeline_out <= c.timeline_in) {
    logger.error("Invalid clip: timeline_out must be greater than timeline_in", { clip })
    return false
  }

  if (typeof c.playback_rate !== "number" || c.playback_rate <= 0) {
    logger.error("Invalid clip: playback_rate must be positive number", { clip })
    return false
  }

  return true
}

/**
 * Валидирует Rust Track
 */
export function validateTrack(track: unknown): track is RustTrack {
  if (!track || typeof track !== "object") {
    logger.error("Invalid track: not an object", { track })
    return false
  }

  const t = track as Partial<RustTrack>

  // Обязательные поля
  if (!t.id || typeof t.id !== "string") {
    logger.error("Invalid track: id must be non-empty string", { track })
    return false
  }

  if (!t.name || typeof t.name !== "string") {
    logger.error("Invalid track: name must be non-empty string", { track })
    return false
  }

  if (!t.track_type || typeof t.track_type !== "string") {
    logger.error("Invalid track: track_type must be string", { track })
    return false
  }

  // Валидация track_type enum
  const validTrackTypes = ["Video", "Audio", "Title", "Music", "Voiceover", "Sfx", "Ambient"]
  if (!validTrackTypes.includes(t.track_type)) {
    logger.error(`Invalid track: track_type must be one of ${validTrackTypes.join(", ")}`, { track })
    return false
  }

  // Валидация clips
  if (!Array.isArray(t.clips)) {
    logger.error("Invalid track: clips must be array", { track })
    return false
  }

  for (const clip of t.clips) {
    if (!validateClip(clip)) {
      logger.error("Invalid track: contains invalid clip", { track })
      return false
    }
  }

  return true
}

/**
 * Валидирует Project
 */
export function validateProject(project: unknown): project is Project {
  if (!project || typeof project !== "object") {
    logger.error("Invalid project: not an object", { project })
    return false
  }

  const p = project as Partial<Project>

  // Обязательные поля
  if (!p.id || typeof p.id !== "string") {
    logger.error("Invalid project: id must be non-empty string", { project })
    return false
  }

  if (!p.timeline || typeof p.timeline !== "object") {
    logger.error("Invalid project: timeline must be object", { project })
    return false
  }

  if (!Array.isArray(p.timeline.tracks)) {
    logger.error("Invalid project: timeline.tracks must be array", { project })
    return false
  }

  // Валидация треков
  for (const track of p.timeline.tracks) {
    if (!validateTrack(track)) {
      logger.error("Invalid project: contains invalid track", { project })
      return false
    }
  }

  return true
}

/**
 * Валидирует ProjectEvent
 */
export function validateProjectEvent(event: unknown): event is ProjectEvent {
  if (!event || typeof event !== "object") {
    logger.error("Invalid event: not an object", { event })
    return false
  }

  const e = event as Partial<ProjectEvent>

  if (!e.type || typeof e.type !== "string") {
    logger.error("Invalid event: type must be string", { event })
    return false
  }

  if (!e.payload || typeof e.payload !== "object") {
    logger.error("Invalid event: payload must be object", { event })
    return false
  }

  // Специфичная валидация для каждого типа события
  switch (e.type) {
    case "ClipAdded":
      if (!e.payload.track_id || !e.payload.clip) {
        logger.error("Invalid ClipAdded event: missing track_id or clip", { event })
        return false
      }
      if (!validateClip(e.payload.clip)) {
        logger.error("Invalid ClipAdded event: invalid clip", { event })
        return false
      }
      break

    case "ClipMoved":
      if (!e.payload.clip_id || !e.payload.new_track_id || typeof e.payload.new_time !== "number") {
        logger.error("Invalid ClipMoved event: missing required fields", { event })
        return false
      }
      break

    case "ClipDeleted":
      if (!e.payload.clip_id || typeof e.payload.clip_id !== "string") {
        logger.error("Invalid ClipDeleted event: missing clip_id", { event })
        return false
      }
      break

    case "TrackAdded":
      if (!e.payload.track) {
        logger.error("Invalid TrackAdded event: missing track", { event })
        return false
      }
      if (!validateTrack(e.payload.track)) {
        logger.error("Invalid TrackAdded event: invalid track", { event })
        return false
      }
      break

    // Добавьте другие типы событий по мере необходимости
  }

  return true
}

/**
 * Type guard с автоматическим логированием
 */
export function assertValid<T>(
  value: unknown,
  validator: (v: unknown) => v is T,
  errorMessage: string,
): asserts value is T {
  if (!validator(value)) {
    logger.error(errorMessage, { value })
    throw new Error(`${errorMessage}: ${JSON.stringify(value)}`)
  }
}
