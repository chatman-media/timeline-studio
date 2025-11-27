/**
 * Timeline Architecture - Архитектура данных Timeline
 *
 * Принципы:
 * 1. Четкая иерархия: Project -> Section -> Track -> Clip
 * 2. Разделение бизнес-логики и UI состояния
 * 3. Единообразие типов и идентификаторов
 * 4. Поддержка всех видов контента (видео, аудио, изображения, титры)
 * 5. Интеграция с системой ресурсов (эффекты, фильтры, переходы)
 */

import type { MediaFile } from "@/domains/video-editing/types"
import type { VideoEffect } from "../../effects/types"
import type { VideoFilter } from "../../filters/types/filters"
import type { StyleTemplate } from "../../style-templates/types/style-template"
import type { SubtitleClip } from "../../subtitles/types"
import type { MediaTemplate } from "../../templates/lib/template-config"
import type { Transition } from "../../transitions/types/transitions"
import type { SpeedRampingConfig } from "./speed-ramping"
import type { TimelineTransition } from "./timeline-transition"

// ============================================================================
// CORE TIMELINE TYPES
// ============================================================================

/**
 * Централизованное хранилище ресурсов проекта
 */
export interface ProjectResources {
  // Визуальные эффекты
  effects: VideoEffect[]

  // Фильтры цветокоррекции
  filters: VideoFilter[]

  // Переходы между клипами (базовые)
  transitions: Transition[]

  // Переходы на таймлайне (расширенные)
  timelineTransitions: TimelineTransition[]

  // Шаблоны многокамерных раскладок
  templates: MediaTemplate[]

  // Стилестические шаблоны (интро, титры)
  styleTemplates: StyleTemplate[]

  // Стили субтитров
  subtitleStyles: SubtitleStyle[]

  // Музыкальные треки
  music: MusicFile[]

  // Медиафайлы проекта
  media: MediaFile[]
}

/**
 * Маркер времени для навигации и экспорта секций
 */
export interface TimelineMarker {
  id: string
  name: string
  time: number // Время в секундах
  color?: string // Цвет маркера
  type?: "chapter" | "section" | "note" | "export" | "todo" | "sync" | "cue" | "important" | "warning" // Тип маркера
  description?: string
  metadata?: Record<string, any> // Дополнительные метаданные для AI-маркеров и группировки
}

/**
 * Проект Timeline - корневой объект
 */
export interface TimelineProject {
  id: string
  name: string
  description?: string

  // Временные параметры
  duration: number // Общая длительность проекта в секундах
  fps: number // Частота кадров проекта
  sampleRate: number // Частота дискретизации аудио

  // Структура проекта
  sections: TimelineSection[]
  globalTracks: TimelineTrack[] // Глобальные треки (музыка, титры)

  // Маркеры времени для навигации и экспорта
  markers?: TimelineMarker[]

  // Speed ramping конфигурации для клипов
  speedRampingConfigs?: Record<string, SpeedRampingConfig>

  // Централизованное хранилище всех ресурсов проекта
  resources: ProjectResources

  // Настройки
  settings: TimelineProjectSettings

  // Метаданные
  createdAt: Date
  updatedAt: Date
  version: string
}

/**
 * Секция Timeline - группа треков по времени/дате
 */
export interface TimelineSection {
  id: string
  index: number
  name: string

  // Временные границы
  startTime: number // Начало секции в проекте (секунды)
  endTime: number // Конец секции в проекте (секунды)
  duration: number // Длительность секции

  // Реальное время (для синхронизации с датами съемки)
  realStartTime?: Date
  realEndTime?: Date

  // Треки в секции
  tracks: TimelineTrack[]

  // Настройки секции
  isCollapsed: boolean
  color?: string
  tags?: string[]
}

/**
 * Трек Timeline - контейнер для клипов одного типа
 */
export interface TimelineTrack {
  id: string
  name: string
  type: TrackType

  // Иерархия
  sectionId?: string // null для глобальных треков
  parentTrackId?: string // Для вложенных треков
  order: number // Порядок отображения

  // Клипы на треке
  clips: TimelineClip[]

  // Переходы на треке (между клипами и на границах)
  transitions: string[] // IDs переходов из resources.timelineTransitions

  // Настройки трека
  isLocked: boolean
  isMuted: boolean
  isHidden: boolean
  isSolo: boolean

  // Аудио настройки
  volume: number // 0-1
  pan: number // -1 (левый) до 1 (правый)

  // Визуальные настройки
  height: number // Высота трека в пикселях
  color?: string

  // Ресурсы трека (применяются ко всем клипам)
  trackEffects: AppliedEffect[]
  trackFilters: AppliedFilter[]
}

/**
 * Клип Timeline - отдельный медиа-элемент на треке
 */
export interface TimelineClip {
  id: string
  name: string
  type?: "video" | "audio" | "image" | "subtitle" | "title" // Тип клипа

  // Связь с медиафайлом
  mediaId: string
  mediaFile?: MediaFile // Опциональная ссылка для удобства

  // Позиция на треке
  trackId: string
  startTime: number // Начало клипа на треке (секунды)
  duration: number // Длительность клипа

  // Обрезка исходного медиа
  mediaStartTime: number // Начало в исходном файле
  mediaEndTime: number // Конец в исходном файле
  offset: number // Смещение от начала медиафайла (для slip редактирования)
  mediaDuration?: number // Полная длительность исходного медиафайла

  // J-Cut / L-Cut support
  audioOffset?: number // Смещение аудио относительно видео (+ для J-cut, - для L-cut)
  linkedClipId?: string // ID связанного клипа (для аудио/видео пары)
  isLinked?: boolean // Связаны ли аудио и видео

  // Настройки клипа
  volume: number // 0-1
  speed: number // Скорость воспроизведения (1.0 = нормальная)
  playbackRate?: number // Коэффициент скорости для rate stretch (1.0 = нормальная)
  maintainPitch?: boolean // Сохранять высоту тона при изменении скорости
  isReversed: boolean

  // Speed ramping
  speedRamping?: SpeedRampingConfig

  // Визуальные настройки (для видео)
  position?: ClipPosition
  opacity: number // 0-1

  // Video fade эффекты
  fadeIn?: {
    duration: number // Длительность fade-in в секундах
    type?: "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out"
    keyframes?: VideoFadeKeyframe[] // Кастомные keyframes для сложных fade
  }

  fadeOut?: {
    duration: number // Длительность fade-out в секундах
    type?: "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out"
    keyframes?: VideoFadeKeyframe[] // Кастомные keyframes для сложных fade
  }

  // Keyframes для анимации opacity
  opacityKeyframes?: VideoFadeKeyframe[]

  // Шаблоны многокамерных раскладок
  templateId?: string // ID шаблона для многокамерной раскладки
  templateCell?: number // Индекс ячейки в шаблоне (0-based)

  // Порядок в мультикамерной группе
  multicamOrder?: number // Порядок угла в мультикамерной группе (0-based)

  // Применяемые ресурсы
  effects: AppliedEffect[]
  filters: AppliedFilter[]
  transitions: AppliedTransition[]
  styleTemplate?: AppliedStyleTemplate // Применяемый стильный шаблон
  colorGrading?: AppliedColorGrading // Цветокоррекция

  // Keyframe анимации
  keyframes?: TimelineKeyframe[]

  // Состояние
  isSelected: boolean
  isLocked: boolean

  // Метаданные
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface VideoFadeKeyframe {
  time: number // время в секундах относительно начала клипа
  opacity: number // значение прозрачности (0-1)
  easing?: "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out"
}

export type TrackType =
  | "video"
  | "audio"
  | "image"
  | "title"
  | "subtitle"
  | "music"
  | "voiceover"
  | "sfx" // Sound effects
  | "ambient" // Ambient audio

export interface ClipPosition {
  x: number // 0-1 (относительно размера кадра)
  y: number // 0-1
  width: number // 0-1
  height: number // 0-1
  rotation: number // Градусы
  scaleX: number // Масштаб по X
  scaleY: number // Масштаб по Y
}

export interface TimelineProjectSettings {
  // Видео настройки
  resolution: {
    width: number
    height: number
  }
  fps: number
  aspectRatio: string

  // Аудио настройки
  sampleRate: number
  channels: number
  bitDepth: number

  // Timeline настройки
  timeFormat: "timecode" | "seconds" | "frames"
  snapToGrid: boolean
  gridSize: number // В секундах

  // Автосохранение
  autoSave: boolean
  autoSaveInterval: number // В секундах
}

// ============================================================================
// APPLIED RESOURCES TYPES
// ============================================================================

/**
 * Применение эффекта с кастомными параметрами
 */
export interface AppliedEffect {
  id: string
  effectId: string // Ссылка на эффект в resources.effects

  // Временные параметры (для анимированных эффектов)
  startTime?: number // Относительно клипа/трека
  duration?: number

  // Кастомные параметры для этого применения
  // Переопределяют дефолтные параметры эффекта
  customParams?: Record<string, any>

  // Состояние
  enabled: boolean
  order: number // Порядок применения в цепочке
}

/**
 * Применение фильтра с кастомными параметрами
 */
export interface AppliedFilter {
  id: string
  filterId: string // Ссылка на фильтр в resources.filters

  // Временные параметры
  startTime?: number
  duration?: number

  // Кастомные параметры для этого применения
  customParams?: Record<string, any>

  isEnabled: boolean
  order: number
}

/**
 * Применение перехода между клипами
 */
export interface AppliedTransition {
  id: string
  transitionId: string // Ссылка на переход в resources.transitions

  // Переходы всегда имеют длительность
  duration: number

  // Тип перехода
  type: "in" | "out" | "cross" // Вход, выход, кроссфейд

  // Кастомные параметры
  customParams?: Record<string, any>

  isEnabled: boolean
}

/**
 * Применение стильного шаблона
 */
export interface AppliedStyleTemplate {
  id: string
  styleTemplateId: string // Ссылка на шаблон в resources.styleTemplates

  // Кастомизация текстов и других параметров
  customizations?: {
    texts?: Record<string, string> // id элемента -> новый текст
    colors?: Record<string, string> // id элемента -> новый цвет
    // и т.д.
  }

  isEnabled: boolean
}

/**
 * Применение цветокоррекции
 */
export interface AppliedColorGrading {
  id: string

  // Color Wheels
  colorWheels: {
    lift: { r: number; g: number; b: number }
    gamma: { r: number; g: number; b: number }
    gain: { r: number; g: number; b: number }
    offset: { r: number; g: number; b: number }
  }

  // Basic Parameters
  basicParameters: {
    temperature: number // -100 to 100
    tint: number // -100 to 100
    contrast: number // -100 to 100
    pivot: number // 0 to 1
    saturation: number // -100 to 100
    hue: number // -180 to 180
    luminance: number // -100 to 100
  }

  // Curves
  curves: {
    master: Array<{ x: number; y: number; id: string }>
    red: Array<{ x: number; y: number; id: string }>
    green: Array<{ x: number; y: number; id: string }>
    blue: Array<{ x: number; y: number; id: string }>
  }

  // LUT
  lut: {
    file: string | null
    intensity: number // 0 to 100
    isEnabled: boolean
  }

  // Preset reference
  presetId?: string

  isEnabled: boolean
}

// ============================================================================
// UI STATE TYPES (отдельно от бизнес-логики)
// ============================================================================

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
    tracks: TimelineTrack[]
  }

  // История
  history: TimelineHistoryEntry[]
  historyIndex: number
  maxHistorySize: number
}

export interface TimelineHistoryEntry {
  id: string
  action: string
  timestamp: Date
  data: any // Сериализованное состояние
  description: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface TimelineKeyframe {
  id: string
  time: number
  property: string
  value: any
  interpolation: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "bezier" | "step"
  easeIn?: number
  easeOut?: number
}

// ============================================================================
// SUBTITLE TYPES
/**
 * Тип для проверки, является ли клип субтитром
 */
export function isSubtitleClip(clip: TimelineClip): clip is SubtitleClip {
  // Проверяем по типу клипа
  return clip.type === "subtitle" && "text" in clip
}

/**
 * Стиль субтитров - определяет внешний вид и поведение субтитров
 */
export interface SubtitleStyle {
  id: string
  name: string
  description?: string

  // Шрифт и текст
  fontFamily: string
  fontSize: number // В пикселях
  fontWeight: "normal" | "bold" | "lighter" | "bolder" | number
  fontStyle: "normal" | "italic" | "oblique"
  textAlign: "left" | "center" | "right" | "justify"

  // Цвета
  color: string // Основной цвет текста
  backgroundColor?: string // Фон текста
  strokeColor?: string // Цвет обводки
  strokeWidth?: number // Толщина обводки

  // Тени и эффекты
  textShadow?: {
    offsetX: number
    offsetY: number
    blur: number
    color: string
  }

  // Позиционирование по умолчанию
  defaultPosition: {
    alignment:
      | "top-left"
      | "top-center"
      | "top-right"
      | "middle-left"
      | "middle-center"
      | "middle-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right"
    marginX: number // Отступ по горизонтали в пикселях
    marginY: number // Отступ по вертикали в пикселях
  }

  // Размеры и отступы
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
  borderRadius?: number
  maxWidth?: number // В процентах от ширины экрана

  // Поведение
  wordWrap: boolean
  letterSpacing?: number
  lineHeight?: number // Множитель (1.0 = нормальная высота)

  // Анимации по умолчанию
  defaultAnimationIn?: {
    type: "fade" | "slide" | "typewriter" | "scale" | "wave"
    duration: number
    easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
  }

  defaultAnimationOut?: {
    type: "fade" | "slide" | "scale"
    duration: number
    easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
  }

  // Метаданные
  isBuiltIn: boolean // Встроенный стиль (нельзя удалить)
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

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
