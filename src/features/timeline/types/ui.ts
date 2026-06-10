/**
 * Timeline UI State Types
 *
 * Типы для UI состояния таймлайна (не относятся к бизнес-логике)
 * Эти типы НЕ должны дублироваться в domain layer
 */

import type { TimelineClip, Track, TrackType } from "@/core/types/timeline"

/**
 * UI состояние таймлайна
 * Управляет визуальным отображением и взаимодействием пользователя
 */
export interface TimelineUIState {
  // Временная шкала
  currentTime: number
  playheadPosition: number

  // Масштаб и прокрутка
  timeScale: number // Пикселей на секунду
  scrollPosition: {
    x: number // Горизонтальная прокрутка
    y: number // Вертикальная прокрутка
  }

  // Выделение
  selectedClipIds: string[]
  selectedTrackIds: string[]
  selectedSectionIds: string[]

  // Режимы
  editMode: "select" | "cut" | "trim" | "move"
  snapMode: "none" | "grid" | "clips" | "markers"

  // Видимость
  visibleTrackTypes: TrackType[]
  collapsedSectionIds: string[]

  // Буфер обмена
  clipboard: {
    clips: TimelineClip[]
    tracks: Track[]
  }

  // История
  history: TimelineHistoryEntry[]
  historyIndex: number
  maxHistorySize: number
}

/**
 * Запись истории для undo/redo
 */
export interface TimelineHistoryEntry {
  id: string
  action: string
  timestamp: Date
  data: any // Сериализованное состояние
  description: string
}
