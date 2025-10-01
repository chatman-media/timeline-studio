/**
 * Вспомогательные функции для Player AI инструментов
 */

import type { CurrentMedia, PlayerState, PlayerStateAccess } from "../types"

// Глобальная переменная для доступа к состоянию плеера
let playerStateAccess: PlayerStateAccess | null = null

/**
 * Устанавливает доступ к состоянию плеера
 */
export function setPlayerStateAccess(access: PlayerStateAccess | null): void {
  playerStateAccess = access
}

/**
 * Получает доступ к состоянию плеера
 */
export function getPlayerStateAccess(): PlayerStateAccess | null {
  return playerStateAccess
}

/**
 * Проверяет, настроен ли доступ к плееру
 */
export function hasPlayerAccess(): boolean {
  return playerStateAccess !== null
}

/**
 * Парсит FPS в различных форматах
 */
export function parseFps(frameRate: string): number {
  // Парсим fps в формате "30/1" или "29.97"
  if (frameRate.includes("/")) {
    const [num, den] = frameRate.split("/").map(Number)
    return den ? num / den : 0
  }
  return Number.parseFloat(frameRate) || 0
}

/**
 * Получает текущее состояние плеера
 */
export function getPlayerState(): PlayerState | null {
  if (typeof window === "undefined") return null

  // Получаем состояние из глобального контекста
  const playerContext = (window as any).playerContext
  if (!playerContext) return null

  return {
    isPlaying: playerContext.isPlaying || false,
    currentTime: playerContext.currentTime || 0,
    duration: playerContext.duration || 0,
    volume: playerContext.volume || 1,
    playbackSpeed: playerContext.playbackSpeed || 1,
    loop: playerContext.loop || false,
    muted: playerContext.muted || false,
  }
}

/**
 * Получает текущее медиа в плеере
 */
export function getCurrentMedia(): CurrentMedia | null {
  if (typeof window === "undefined") return null

  const playerContext = (window as any).playerContext
  if (!playerContext || !playerContext.currentMedia) return null

  return playerContext.currentMedia
}

/**
 * Устанавливает состояние плеера
 */
export function setPlayerState(updates: Partial<PlayerState>): void {
  if (typeof window === "undefined") return

  const playerContext = (window as any).playerContext
  if (!playerContext) return

  Object.assign(playerContext, updates)
}

/**
 * Проверяет, есть ли загруженное медиа
 */
export function hasLoadedMedia(): boolean {
  const media = getCurrentMedia()
  return !!media && !!media.path
}

/**
 * Форматирует время в читаемый формат
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

/**
 * Вычисляет процент загрузки
 */
export function calculateLoadingProgress(loaded: number, total: number): number {
  if (total === 0) return 0
  return Math.round((loaded / total) * 100)
}

/**
 * Проверяет поддерживаемые форматы медиа
 */
export function getSupportedMediaFormats(): string[] {
  return [
    "mp4",
    "webm",
    "ogg",
    "mov",
    "avi",
    "mkv", // видео
    "mp3",
    "wav",
    "aac",
    "flac",
    "ogg", // аудио
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg", // изображения
  ]
}

/**
 * Определяет тип медиа по расширению
 */
export function getMediaType(filename: string): "video" | "audio" | "image" | "unknown" {
  const extension = filename.split(".").pop()?.toLowerCase()
  if (!extension) return "unknown"

  const videoFormats = ["mp4", "webm", "ogg", "mov", "avi", "mkv"]
  const audioFormats = ["mp3", "wav", "aac", "flac", "ogg"]
  const imageFormats = ["jpg", "jpeg", "png", "gif", "webp", "svg"]

  if (videoFormats.includes(extension)) return "video"
  if (audioFormats.includes(extension)) return "audio"
  if (imageFormats.includes(extension)) return "image"

  return "unknown"
}
