/**
 * Music-specific types for Timeline
 * TODO: Consider migrating to @/domains/video-editing/types
 */

import type { TimelineClip } from "@/core/types/timeline"

/**
 * Музыкальный клип - расширение для музыкальных треков
 */
export interface MusicClip extends TimelineClip {
  // Музыкальные метаданные
  bpm?: number // Beats per minute
  key?: string // Музыкальная тональность (C, D, Em, etc.)
  genre?: string // Жанр музыки
  mood?: string // Настроение трека
  energy?: number // Уровень энергичности (0-1)

  // Структура трека
  markers?: MusicMarker[] // Маркеры в музыке (verse, chorus, etc.)

  // Аудио настройки
  fadeIn?: {
    duration: number // Длительность fade-in в секундах
    curve?: "linear" | "exponential" | "logarithmic"
  }

  fadeOut?: {
    duration: number // Длительность fade-out в секундах
    curve?: "linear" | "exponential" | "logarithmic"
  }

  // Эквалайзер (базовые частоты)
  equalizer?: {
    bass: number // -1 до 1
    mid: number // -1 до 1
    treble: number // -1 до 1
  }

  // Эффекты
  reverb?: number // 0-1
  compression?: number // 0-1

  // Синхронизация с видео
  syncToVideo?: boolean // Синхронизировать с видео (влияет на speed ramping)
  beatSync?: boolean // Синхронизировать нарезку по битам
}

/**
 * Маркер в музыкальном треке
 */
export interface MusicMarker {
  id: string
  time: number // Время в секундах от начала трека
  type: "intro" | "verse" | "chorus" | "bridge" | "outro" | "drop" | "break" | "custom"
  name?: string // Пользовательское название
  intensity?: number // Интенсивность момента (0-1)
}

/**
 * Файл музыки для библиотеки
 */
export interface MusicFile {
  id: string
  name: string
  filePath: string

  // Технические параметры
  duration: number
  sampleRate: number
  channels: number
  bitrate?: number
  format: string // mp3, wav, flac, etc.

  // Музыкальные метаданные
  artist?: string
  album?: string
  bpm?: number
  key?: string
  genre?: string
  mood?: string
  energy?: number

  // Правовая информация
  license?: "royalty-free" | "copyright" | "creative-commons" | "custom"
  licenseDetails?: string
  copyright?: string

  // Теги и категоризация
  tags: string[]
  category?: string

  // Предварительный анализ
  waveformData?: number[] // Данные волновой формы для отображения
  spectrogramData?: number[][] // Данные спектрограммы
  analysisComplete?: boolean

  // Метаданные
  fileSize: number
  createdAt: Date
  updatedAt: Date
  lastUsed?: Date
}

/**
 * Тип для проверки, является ли клип музыкальным
 */
export function isMusicClip(clip: TimelineClip): clip is MusicClip {
  // Проверяем по типу трека - нужно получить трек по trackId
  return "bpm" in clip || "fadeIn" in clip || "fadeOut" in clip
}
