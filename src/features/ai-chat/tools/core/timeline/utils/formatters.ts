/**
 * Форматирование данных для Timeline
 */

import type { TimelineClip } from "@/features/timeline/types/timeline"

export function formatTimecode(seconds: number, fps: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const frames = Math.floor((seconds % 1) * fps)

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(frames).padStart(2, "0")}`
}

export function extractDateFromClip(clip: TimelineClip): Date {
  // Извлечение даты из метаданных клипа
  if (clip.createdAt) return new Date(clip.createdAt)

  // Попытка извлечь дату из mediaFile.createdAt если доступно
  if (clip.mediaFile?.createdAt) {
    return new Date(clip.mediaFile.createdAt)
  }

  // Попытка извлечь дату из mediaFile.probeData
  if (clip.mediaFile?.probeData?.format?.tags?.creation_time) {
    return new Date(clip.mediaFile.probeData.format.tags.creation_time)
  }

  // Попытка извлечь дату из имени файла (если есть паттерн даты)
  if (clip.name) {
    const dateMatch = /(\d{4})-(\d{2})-(\d{2})/.exec(clip.name)
    if (dateMatch) {
      return new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`)
    }
  }

  // Fallback - текущая дата
  return new Date()
}

export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function escapeCsv(unsafe: string): string {
  if (unsafe.includes('"') || unsafe.includes(",") || unsafe.includes("\n")) {
    return `"${unsafe.replace(/"/g, '""')}"`
  }
  return unsafe
}
