/**
 * Clip Transform Utilities
 *
 * Централизованная конвертация между Rust Clip и TypeScript TimelineClip
 * Используется во всех backend event handlers для консистентности
 */

import type { Clip, ClipData } from "@/types/generated/tauri-bindings"
import type { TimelineClip } from "../types"

/**
 * Конвертирует Rust Clip в TimelineClip
 *
 * @param clip - Клип из backend
 * @param trackId - ID трека, в который добавляется клип
 * @returns Конвертированный TimelineClip
 */
export function convertClipToTimelineClip(clip: Clip, trackId: string): TimelineClip {
  return {
    id: clip.id,
    name: clip.name,
    mediaId: clip.media_id,
    trackId,
    startTime: clip.timeline_in,
    duration: clip.timeline_out - clip.timeline_in,
    sourceIn: clip.source_in,
    sourceOut: clip.source_out,

    // Media timing (required fields)
    mediaStartTime: clip.source_in,
    mediaEndTime: clip.source_out,
    offset: 0,

    // Playback
    playbackRate: clip.playback_rate,
    speed: clip.playback_rate,
    isReversed: false,

    // State
    isSelected: false,
    isLocked: !clip.enabled,
    isMuted: false,

    // Audio/Visual
    volume: 1.0,
    opacity: 1.0,
    position: {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },

    // Effects/Filters/Transitions
    effects: [],
    filters: [],
    transitions: [],

    // Timestamps
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Конвертирует ClipData (из событий) в TimelineClip
 * ClipData имеет меньше полей чем Clip, поэтому используем значения по умолчанию
 *
 * @param clipData - Данные клипа из события (ClipAdded, ClipSplit и др.)
 * @param trackId - ID трека
 * @returns Конвертированный TimelineClip
 */
export function convertClipDataToTimelineClip(clipData: ClipData, trackId: string): TimelineClip {
  return {
    id: clipData.id,
    name: clipData.name,
    mediaId: clipData.media_id,
    trackId,
    startTime: clipData.timeline_in,
    duration: clipData.timeline_out - clipData.timeline_in,
    sourceIn: clipData.source_in,
    sourceOut: clipData.source_out,

    // Media timing (required fields)
    mediaStartTime: clipData.source_in,
    mediaEndTime: clipData.source_out,
    offset: 0,

    // Playback - defaults since ClipData doesn't have these
    playbackRate: 1.0,
    speed: 1.0,
    isReversed: false,

    // State - defaults
    isSelected: false,
    isLocked: false,
    isMuted: false,

    // Audio/Visual
    volume: 1.0,
    opacity: 1.0,
    position: {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },

    // Effects/Filters/Transitions
    effects: [],
    filters: [],
    transitions: [],

    // Timestamps
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Конвертирует массив Rust Clips в TimelineClips
 *
 * @param clips - Массив клипов из backend
 * @param trackId - ID трека
 * @returns Массив конвертированных TimelineClips, отсортированный по startTime
 */
export function convertClipsToTimelineClips(clips: Clip[], trackId: string): TimelineClip[] {
  return clips.map((clip) => convertClipToTimelineClip(clip, trackId)).sort((a, b) => a.startTime - b.startTime)
}

/**
 * Обновляет существующий TimelineClip с данными из Rust Clip
 *
 * @param existingClip - Существующий TimelineClip
 * @param updatedClip - Обновленный Clip из backend
 * @returns Обновленный TimelineClip с сохранением frontend-only полей
 */
export function updateTimelineClipFromBackend(existingClip: TimelineClip, updatedClip: Clip): TimelineClip {
  return {
    ...existingClip,
    name: updatedClip.name,
    startTime: updatedClip.timeline_in,
    duration: updatedClip.timeline_out - updatedClip.timeline_in,
    sourceIn: updatedClip.source_in,
    sourceOut: updatedClip.source_out,
    mediaStartTime: updatedClip.source_in,
    mediaEndTime: updatedClip.source_out,
    playbackRate: updatedClip.playback_rate,
    speed: updatedClip.playback_rate,
    isLocked: !updatedClip.enabled,
    updatedAt: new Date(),
  }
}
