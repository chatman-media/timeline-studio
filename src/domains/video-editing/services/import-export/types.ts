/**
 * Типы для Import/Export функциональности
 */

// Временная заглушка для MediaFile пока модуль недоступен
import type { Timeline } from "../../types"

interface MediaFile {
  id: string
  name: string
  path: string
  size: number
  isVideo?: boolean
  isAudio?: boolean
  isImage?: boolean
  duration?: number
}

// Поддерживаемые форматы
export type ImportFormat = "edl" | "fcpxml" | "aaf" | "json"
export type ExportFormat = "edl" | "fcpxml" | "aaf" | "davinci" | "json" | "xml" | "csv"

// Опции импорта
export interface ImportOptions {
  format: ImportFormat
  frameRate?: number // FPS по умолчанию если не указан в файле
  defaultTrackType?: "video" | "audio"
  preserveMediaPaths?: boolean
  autoFixMissingMedia?: boolean
}

// Результат импорта
export interface ImportResult {
  success: boolean
  project?: Timeline
  errors: ImportError[]
  warnings: ImportWarning[]
  mediaFiles: MediaFile[]
}

// Ошибка импорта
export interface ImportError {
  line?: number
  message: string
  code: string
}

// Предупреждение импорта
export interface ImportWarning {
  line?: number
  message: string
  code: string
}

// Ссылка на медиафайл
export interface MediaReference {
  originalPath: string
  exists: boolean
  resolvedPath?: string
  alternativePaths?: string[]
}

// Опции экспорта
export interface ExportOptions {
  format: ExportFormat
  includeDisabledClips?: boolean
  includeEffects?: boolean
  includeTransitions?: boolean
  includeMarkers?: boolean
  consolidateMedia?: boolean
  relativePaths?: boolean
  customSettings?: Record<string, any>
}

// EDL специфичные типы
export interface EDLEvent {
  eventNumber: number
  reel: string
  trackType: "V" | "A" | "AA" | "B" // Video, Audio, Audio 2, Both
  editType: "C" | "D" | "W" | "K" // Cut, Dissolve, Wipe, Key
  sourceIn: string // Timecode
  sourceOut: string // Timecode
  recordIn: string // Timecode
  recordOut: string // Timecode
  comment?: string
}

// FCPXML специфичные типы
export interface FCPXMLResource {
  id: string
  name: string
  src: string
  hasVideo?: boolean
  hasAudio?: boolean
  duration?: string
  start?: string
  format?: FCPXMLFormat
}

export interface FCPXMLFormat {
  id: string
  name: string
  frameDuration: string
  width?: number
  height?: number
  audioRate?: number
}

export interface FCPXMLEvent {
  name: string
  projects: FCPXMLProjectRef[]
}

export interface FCPXMLProjectRef {
  name: string
  ref: string
  sequence?: FCPXMLSequenceRef
}

export interface FCPXMLSequenceRef {
  format: string
  duration: string
  spine: FCPXMLClipRef[]
}

export interface FCPXMLClipRef {
  name: string
  ref: string
  offset?: string
  duration?: string
  start?: string
  enabled?: boolean
  lane?: number
  adjustments?: FCPXMLAdjustment[]
  effects?: FCPXMLEffect[]
  transitions?: FCPXMLTransition[]
}

export interface FCPXMLAdjustment {
  type: "volume" | "opacity" | "speed" | "color"
  amount: string
  enabled?: boolean
}

export interface FCPXMLEffect {
  name: string
  ref: string
  enabled?: boolean
  parameters?: Record<string, any>
}

export interface FCPXMLTransition {
  name: string
  duration: string
  type: "video" | "audio"
  parameters?: Record<string, any>
}

// Интерфейсы для импортеров/экспортеров
export interface Importer {
  import(content: string, options: ImportOptions): Promise<ImportResult>
  validateContent(content: string): boolean
}

export interface Exporter {
  export(project: Timeline, options: ExportOptions): Promise<string>
  getFileExtension(): string
  getMimeType(): string
}

// Утилиты для работы с timecode
export interface Timecode {
  hours: number
  minutes: number
  seconds: number
  frames: number
}

export function parseTimecode(timecode: string, _frameRate: number): Timecode {
  const parts = timecode.split(":")
  if (parts.length !== 4) {
    throw new Error(`Invalid timecode format: ${timecode}`)
  }

  return {
    hours: Number.parseInt(parts[0], 10),
    minutes: Number.parseInt(parts[1], 10),
    seconds: Number.parseInt(parts[2], 10),
    frames: Number.parseInt(parts[3], 10),
  }
}

export function timecodeToSeconds(timecode: Timecode, frameRate: number): number {
  return timecode.hours * 3600 + timecode.minutes * 60 + timecode.seconds + timecode.frames / frameRate
}

export function secondsToTimecode(seconds: number, frameRate: number): Timecode {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const frames = Math.floor((seconds % 1) * frameRate)

  return { hours, minutes, seconds: secs, frames }
}

export function formatTimecode(timecode: Timecode): string {
  const pad = (n: number, width = 2) => String(n).padStart(width, "0")
  return `${pad(timecode.hours)}:${pad(timecode.minutes)}:${pad(timecode.seconds)}:${pad(timecode.frames)}`
}
