/**
 * Расширенные типы для системы маркеров Timeline
 */

import type { TimelineMarker } from "@/features/timeline/types"

// Реэкспорт базового типа
export type { TimelineMarker } from "@/features/timeline/types"

// Типы маркеров
export type MarkerType = "chapter" | "section" | "note" | "export" | "todo" | "sync" | "cue" | "important" | "warning"

// Цвета маркеров по типу
export const MarkerColors: Record<MarkerType, string> = {
  chapter: "#3b82f6", // blue
  section: "#10b981", // green
  note: "#f59e0b", // yellow
  export: "#ef4444", // red
  todo: "#8b5cf6", // purple
  sync: "#06b6d4", // cyan
  cue: "#ec4899", // pink
  important: "#dc2626", // red-600
  warning: "#ea580c", // orange-600
}

// Иконки маркеров по типу
export const MarkerIcons: Record<MarkerType, string> = {
  chapter: "bookmark",
  section: "folder",
  note: "sticky-note",
  export: "download",
  todo: "check-square",
  sync: "refresh-cw",
  cue: "play-circle",
  important: "alert-circle",
  warning: "alert-triangle",
}

// Расширенный интерфейс маркера
export interface ExtendedTimelineMarker extends TimelineMarker {
  // Дополнительные свойства
  duration?: number // Для маркеров с длительностью (регионов)
  linkedMarkers?: string[] // Связанные маркеры
  tags?: string[] // Теги для фильтрации
  isLocked?: boolean // Защита от изменений

  // Метаданные
  createdBy?: string
  createdAt?: Date
  modifiedAt?: Date

  // Экспорт
  includeInExport?: boolean // Включать в экспорт
  exportFormat?: "chapter" | "subtitle" | "metadata" // Формат экспорта
}

// Операции с маркерами
export interface MarkerOperation {
  type: "add" | "remove" | "update" | "move"
  markerId: string
  timestamp: number
  userId?: string
}

// Группа маркеров
export interface MarkerGroup {
  id: string
  name: string
  markerIds: string[]
  color?: string
  isCollapsed?: boolean
}

// Фильтры маркеров
export interface MarkerFilter {
  types?: MarkerType[]
  tags?: string[]
  timeRange?: {
    start: number
    end: number
  }
  search?: string
}

// Экспорт маркеров
export interface MarkerExport {
  format: "json" | "csv" | "srt" | "fcpxml" | "edl"
  markers: ExtendedTimelineMarker[]
  options?: {
    includeTimecode?: boolean
    includeDescriptions?: boolean
    timecodeFormat?: "hh:mm:ss" | "hh:mm:ss:ff" | "frames"
  }
}

// Утилиты для работы с маркерами
export function createMarker(
  time: number,
  name: string,
  type: MarkerType = "note",
  description?: string,
): ExtendedTimelineMarker {
  return {
    id: `marker-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    name,
    time,
    type,
    description,
    color: MarkerColors[type],
    createdAt: new Date(),
    modifiedAt: new Date(),
    includeInExport: true,
  }
}

export function formatMarkerTime(time: number, fps = 30): string {
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = Math.floor(time % 60)
  const frames = Math.floor((time % 1) * fps)

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`
}

export function parseMarkerTime(timecode: string, fps = 30): number {
  const parts = timecode.split(":")
  if (parts.length !== 4) {
    throw new Error("Invalid timecode format")
  }

  const [hours, minutes, seconds, frames] = parts.map((p) => Number.parseInt(p, 10))
  return hours * 3600 + minutes * 60 + seconds + frames / fps
}

// Проверка пересечения маркеров
export function markersOverlap(marker1: ExtendedTimelineMarker, marker2: ExtendedTimelineMarker): boolean {
  if (!marker1.duration || !marker2.duration) {
    return false
  }

  const end1 = marker1.time + marker1.duration
  const end2 = marker2.time + marker2.duration

  return marker1.time < end2 && marker2.time < end1
}

// Сортировка маркеров по времени
export function sortMarkersByTime(markers: ExtendedTimelineMarker[]): ExtendedTimelineMarker[] {
  return [...markers].sort((a, b) => a.time - b.time)
}

// Фильтрация маркеров
export function filterMarkers(markers: ExtendedTimelineMarker[], filter: MarkerFilter): ExtendedTimelineMarker[] {
  return markers.filter((marker) => {
    // Фильтр по типу
    if (filter.types && !filter.types.includes(marker.type!)) {
      return false
    }

    // Фильтр по тегам
    if (filter.tags && marker.tags) {
      const hasTag = filter.tags.some((tag) => marker.tags?.includes(tag))
      if (!hasTag) return false
    }

    // Фильтр по времени
    if (filter.timeRange) {
      if (marker.time < filter.timeRange.start || marker.time > filter.timeRange.end) {
        return false
      }
    }

    // Фильтр по поиску
    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      const inName = marker.name.toLowerCase().includes(searchLower)
      const inDescription = marker.description?.toLowerCase().includes(searchLower)
      const inTags = marker.tags?.some((tag) => tag.toLowerCase().includes(searchLower))

      if (!inName && !inDescription && !inTags) {
        return false
      }
    }

    return true
  })
}
