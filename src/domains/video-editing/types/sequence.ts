/**
 * Sequence (бывший Timeline) - монтажная последовательность
 * Основная единица редактирования в проекте
 */

import type { Transition, VideoEffect, VideoFilter } from "@/domains/video-editing/types"

import type { TimelineClip, Track } from "./timeline"

/**
 * Тип секвенции
 */
export type SequenceType = "main" | "nested" | "multicam" | "vr360"

/**
 * Настройки секвенции
 */
export interface SequenceSettings {
  /** Разрешение видео */
  resolution: {
    width: number
    height: number
  }

  /** Частота кадров */
  frameRate: number

  /** Соотношение сторон */
  aspectRatio: string

  /** Длительность в секундах */
  duration: number

  /** Временная база (например, 30000/1001 для 29.97 fps) */
  timebase?: {
    numerator: number
    denominator: number
  }

  /** Настройки аудио */
  audio: {
    sampleRate: number // 44100, 48000, 96000
    bitDepth: number // 16, 24, 32
    channels: number // 2 (stereo), 6 (5.1), etc
  }

  /** Цветовое пространство */
  colorSpace?: "rec709" | "rec2020" | "p3" | "srgb"

  /** HDR настройки */
  hdr?: {
    enabled: boolean
    type: "hlg" | "pq" | "dolby"
    maxLuminance?: number
  }
}

/**
 * Маркер на таймлайне
 */
export interface SequenceMarker {
  id: string
  name: string
  time: number // Время в секундах
  duration?: number // Длительность (для маркеров-регионов)
  color: string
  type: "standard" | "chapter" | "todo" | "comment"
  comment?: string
}

/**
 * История изменений для undo/redo
 */
export interface HistoryState {
  id: string
  timestamp: Date
  action: string
  snapshot: any // Снимок состояния
  size: number // Размер в байтах
}

/**
 * Мастер-клип (вложенная секвенция)
 */
export interface MasterClip {
  id: string
  sequenceId: string // ID вложенной секвенции
  name: string
  inPoint: number // Точка входа
  outPoint: number // Точка выхода
  speed: number // Скорость воспроизведения
}

/**
 * Ресурсы секвенции
 */
export interface SequenceResources {
  /** Эффекты, используемые в секвенции */
  effects: Map<string, VideoEffect>

  /** Фильтры */
  filters: Map<string, VideoFilter>

  /** Переходы */
  transitions: Map<string, Transition>

  /** Цветокоррекция */
  colorGrades: Map<string, ColorGrade>

  /** Титры и текст */
  titles: Map<string, Title>

  /** Генераторы (цветные подложки, шум, etc) */
  generators: Map<string, Generator>
}

/**
 * Цветокоррекция
 */
export interface ColorGrade {
  id: string
  name: string
  type: "basic" | "curves" | "wheels" | "lut"
  settings: any // Специфичные для типа настройки
  lutPath?: string // Путь к LUT файлу
}

/**
 * Титр/текст
 */
export interface Title {
  id: string
  type: "simple" | "lower-third" | "credits" | "animated"
  text: string
  style: {
    fontFamily: string
    fontSize: number
    fontWeight: string
    color: string
    backgroundColor?: string
    outline?: {
      width: number
      color: string
    }
    shadow?: {
      x: number
      y: number
      blur: number
      color: string
    }
  }
  animation?: {
    in: "fade" | "slide" | "typewriter" | "custom"
    out: "fade" | "slide" | "custom"
    duration: number
  }
  position: {
    x: number // Процент от ширины
    y: number // Процент от высоты
    anchor: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
  }
}

/**
 * Генератор
 */
export interface Generator {
  id: string
  type: "solid" | "gradient" | "noise" | "bars" | "countdown"
  name: string
  settings: any // Специфичные для типа настройки
}

/**
 * Композиция секвенции
 */
export interface SequenceComposition {
  /** Видео/аудио треки */
  tracks: Track[]

  /** Мастер-клипы (вложенные секвенции) */
  masterClips: MasterClip[]

  /** Регионы автоматизации */
  automation?: AutomationRegion[]
}

/**
 * Регион автоматизации
 */
export interface AutomationRegion {
  id: string
  parameter: string // Какой параметр автоматизируется
  startTime: number
  endTime: number
  keyframes: Array<{
    time: number
    value: number
    curve: "linear" | "bezier" | "step"
  }>
}

/**
 * Основная структура секвенции
 */
export interface Sequence {
  /** Уникальный идентификатор */
  id: string

  /** Название секвенции */
  name: string

  /** Тип секвенции */
  type: SequenceType

  /** Настройки секвенции */
  settings: SequenceSettings

  /** Композиция (треки и клипы) */
  composition: SequenceComposition

  /** Ресурсы секвенции */
  resources: SequenceResources

  /** Маркеры */
  markers: SequenceMarker[]

  /** История изменений */
  history: HistoryState[]

  /** Текущая позиция в истории */
  historyPosition: number

  /** Метаданные */
  metadata: {
    created: Date
    modified: Date
    thumbnail?: string // Путь к превью
    notes?: string // Заметки
    tags?: string[] // Теги для организации
  }

  /** Настройки рендеринга */
  renderSettings?: {
    inPoint?: number // Точка входа для рендера
    outPoint?: number // Точка выхода для рендера
    selectedTracks?: string[] // Только выбранные треки
    useProxy?: boolean // Использовать прокси
  }
}

/**
 * Операции с секвенцией
 */
export interface SequenceOperations {
  /** Создать новую секвенцию */
  createSequence(name: string, settings: SequenceSettings): Sequence

  /** Дублировать секвенцию */
  duplicateSequence(sequence: Sequence): Sequence

  /** Создать вложенную секвенцию из выбранных клипов */
  createNestedSequence(clips: TimelineClip[], name: string): Sequence

  /** Экспортировать секвенцию в XML (для обмена с другими программами) */
  exportToXML(sequence: Sequence): string

  /** Импортировать секвенцию из XML */
  importFromXML(xml: string): Sequence

  /** Оптимизировать секвенцию (удалить неиспользуемые ресурсы) */
  optimizeSequence(sequence: Sequence): Sequence

  /** Анализировать секвенцию */
  analyzeSequence(sequence: Sequence): {
    duration: number
    clipCount: number
    trackCount: number
    effectCount: number
    issues: string[] // Потенциальные проблемы
  }
}
