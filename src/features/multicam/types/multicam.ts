/**
 * Типы для мультикамерной системы
 */

import type { TimelineClip } from "@/features/timeline/types/timeline"

/**
 * Метод синхронизации камер
 */
export type SyncMethod = "audio" | "timecode" | "manual" | "clapperboard" | "none" | "creation_time"

/**
 * Угол камеры в мультикамерной группе
 */
export interface MulticamAngle {
  id: string
  name: string
  clipId: string
  clip: TimelineClip
  mediaPath?: string
  preview?: string
  syncOffset: number
  isActive: boolean
}

/**
 * Статус синхронизации
 */
export type SyncStatus = "idle" | "syncing" | "success" | "error"

/**
 * Результат синхронизации клипа
 */
export interface SyncResult {
  clipId: string
  offset: number // Смещение в секундах
  confidence: number // 0-1, степень уверенности
  method: SyncMethod
}

/**
 * Точка синхронизации
 */
export interface SyncPoint {
  angleId: string
  timestamp: number
  confidence: number // 0-1, степень уверенности в точности синхронизации
  method: SyncMethod
}

/**
 * Конфигурация мультикамерной группы
 */
export interface MulticamConfig {
  id: string
  name: string
  angles: string[] // ID клипов
  activeCameraIndex: number
  syncPoints: SyncPoint[]
  createdAt: Date
  updatedAt: Date
}

/**
 * События переключения камер
 */
export interface CameraSwitchEvent {
  timestamp: number // Время на таймлайне
  fromAngle: number
  toAngle: number
  transition?: "cut" | "dissolve" | "wipe"
  duration?: number // Длительность перехода для dissolve/wipe
}

/**
 * Результат анализа для синхронизации
 */
export interface SyncAnalysisResult {
  method: SyncMethod
  confidence: number
  suggestedOffset: number
  details?: {
    audioCorrelation?: number
    timecodeMatch?: boolean
    clapperboardFrame?: number
  }
}

/**
 * Настройки отображения мультикамеры
 */
export interface MulticamDisplaySettings {
  layout: "grid" | "pip" | "side-by-side" | "custom"
  showLabels: boolean
  showTimecode: boolean
  highlightActive: boolean
  gridColumns?: number
  gridRows?: number
}

/**
 * Состояние воспроизведения мультикамеры
 */
export interface MulticamPlaybackState {
  isPlaying: boolean
  currentTime: number
  activeAngle: number
  syncEnabled: boolean
  soloAngle?: number // Если задан, воспроизводится только этот угол
}

/**
 * Команды управления мультикамерой
 */
export type MulticamCommand =
  | { type: "switch-camera"; angleIndex: number }
  | { type: "sync-all" }
  | { type: "sync-angle"; angleIndex: number; offset: number }
  | { type: "add-angle"; clipId: string }
  | { type: "remove-angle"; angleIndex: number }
  | { type: "reorder"; from: number; to: number }
  | { type: "toggle-sync" }
  | { type: "solo-angle"; angleIndex: number | null }
