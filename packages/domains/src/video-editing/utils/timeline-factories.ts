/**
 * Factory functions for creating Timeline objects
 *
 * Canonical source in domains/video-editing/utils
 */

import type {
  Section,
  Timeline,
  TimelineClip,
  TimelineResources,
  TimelineSettings,
  Track,
  TrackType,
} from "@timeline-studio/domains/video-editing/types"
import type { MusicClip, MusicFile } from "@timeline-studio/domains/video-editing/types/music"
import type { SubtitleClip, SubtitleStyle } from "@timeline-studio/domains/video-editing/types/subtitles"

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Создает новый проект Timeline
 */
export function createTimelineProject(name: string, settings?: Partial<TimelineSettings>): Timeline {
  const defaultSettings: TimelineSettings = {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    aspectRatio: "16:9",
    sampleRate: 48000,
    channels: 2,
    bitDepth: 24,
    timeFormat: "timecode",
    snapToGrid: true,
    gridSize: 1,
    autoSave: true,
    autoSaveInterval: 300,
    ...settings,
  }

  return {
    id: `project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    duration: 0,
    fps: defaultSettings.fps,
    sampleRate: defaultSettings.sampleRate,
    sections: [],
    globalTracks: [],
    resources: createEmptyResources(),
    settings: defaultSettings,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: "2.0.0",
  }
}

/**
 * Создает пустой объект ресурсов
 */
function createEmptyResources(): TimelineResources {
  return {
    effects: [],
    filters: [],
    transitions: [],
    music: [],
    media: [],
  }
}

/**
 * Создает новую секцию Timeline
 */
export function createTimelineSection(
  name: string,
  startTime: number,
  duration: number,
  realStartTime?: Date,
  index = 0,
): Section {
  return {
    id: `section-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    index,
    name,
    startTime,
    endTime: startTime + duration,
    duration,
    realStartTime,
    realEndTime: realStartTime ? new Date(realStartTime.getTime() + duration * 1000) : undefined,
    tracks: [],
    isCollapsed: false,
  }
}

/**
 * Создает новый трек Timeline
 */
export function createTimelineTrack(name: string, type: TrackType, sectionId?: string): Track {
  return {
    id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    type,
    sectionId,
    order: 0,
    clips: [],
    // Двойные флаги для совместимости
    muted: false,
    solo: false,
    locked: false,
    expanded: true,
    isLocked: false,
    isMuted: false,
    isHidden: false,
    isSolo: false,
    volume: 1,
    pan: 0,
    height: type === "video" ? 120 : type === "audio" ? 80 : 60,
    trackEffects: [],
    trackFilters: [],
    transitions: [],
  }
}

/**
 * Создает новый клип Timeline
 */
export function createTimelineClip(
  mediaId: string,
  trackId: string,
  startTime: number,
  duration: number,
  mediaStartTime = 0,
  mediaDuration?: number,
): TimelineClip {
  return {
    id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: `Clip ${Date.now()}`,
    mediaId,
    trackId,
    startTime,
    duration,
    sourceIn: mediaStartTime,
    sourceOut: mediaStartTime + duration,
    mediaStartTime,
    mediaEndTime: mediaStartTime + duration,
    offset: mediaStartTime, // Initialize offset to match mediaStartTime
    mediaDuration,
    volume: 1,
    speed: 1,
    playbackRate: 1,
    isReversed: false,
    isMuted: false,
    opacity: 1,
    position: {
      x: 0.5,
      y: 0.5,
      width: 1,
      height: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    effects: [],
    filters: [],
    transitions: [],
    isSelected: false,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Создает новый субтитровый клип
 */
export function createSubtitleClip(
  text: string,
  trackId: string,
  startTime: number,
  duration: number,
  options?: {
    name?: string
    subtitleStyleId?: string
    position?: SubtitleClip["subtitlePosition"]
    animationIn?: SubtitleClip["animationIn"]
    animationOut?: SubtitleClip["animationOut"]
    formatting?: SubtitleClip["formatting"]
    opacity?: number
    enabled?: boolean
  },
): SubtitleClip {
  // Создаем базовый клип
  const baseClip = createTimelineClip(
    `subtitle-${Date.now()}`, // mediaId для субтитров генерируется
    trackId,
    startTime,
    duration,
  )

  // Расширяем его свойствами субтитра с полной совместимостью TimelineClip
  const subtitleClip: SubtitleClip = {
    ...baseClip,
    type: "subtitle" as const,
    name: options?.name || `Subtitle ${Date.now()}`,

    // Специфичные поля субтитров
    text,
    subtitleStyleId: options?.subtitleStyleId,
    style: options?.formatting, // Mapping для совместимости
    formatting: options?.formatting,
    subtitlePosition: options?.position,
    animationIn: options?.animationIn,
    animationOut: options?.animationOut,

    // Настройки субтитров
    wordWrap: true, // По умолчанию включен перенос слов
    maxWidth: 80, // По умолчанию 80% ширины экрана
    enabled: options?.enabled ?? true,

    // Переопределяем opacity если задан
    opacity: options?.opacity ?? baseClip.opacity,

    // Устанавливаем разумные значения для видео-специфичных полей
    volume: 0, // Субтитры не имеют звука
    position: options?.position
      ? {
          x: 0.5, // Центр по горизонтали
          y: 0.85, // Внизу экрана
          width: 0.8, // 80% ширины
          height: 0.1, // 10% высоты
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        }
      : undefined,
  }

  return subtitleClip
}

/**
 * Создает новый музыкальный клип
 */
export function createMusicClip(
  musicFileId: string,
  trackId: string,
  startTime: number,
  duration: number,
  options?: {
    bpm?: number
    key?: string
    genre?: string
    mood?: string
    energy?: number
    fadeIn?: MusicClip["fadeIn"]
    fadeOut?: MusicClip["fadeOut"]
    equalizer?: MusicClip["equalizer"]
    reverb?: number
    compression?: number
    syncToVideo?: boolean
    beatSync?: boolean
  },
): MusicClip {
  // Создаем базовый клип
  const baseClip = createTimelineClip(musicFileId, trackId, startTime, duration)

  // Расширяем его свойствами музыкального клипа
  const musicClip: MusicClip = {
    ...baseClip,
    bpm: options?.bpm,
    key: options?.key,
    genre: options?.genre,
    mood: options?.mood,
    energy: options?.energy,
    markers: [], // Пустой массив маркеров по умолчанию
    fadeIn: options?.fadeIn,
    fadeOut: options?.fadeOut,
    equalizer: options?.equalizer || {
      bass: 0,
      mid: 0,
      treble: 0,
    },
    reverb: options?.reverb || 0,
    compression: options?.compression || 0,
    syncToVideo: options?.syncToVideo || false,
    beatSync: options?.beatSync || false,
  }

  return musicClip
}

/**
 * Создает новый стиль субтитров
 */
export function createSubtitleStyle(
  name: string,
  options?: Partial<Omit<SubtitleStyle, "id" | "name" | "createdAt" | "updatedAt">>,
): SubtitleStyle {
  return {
    id: `subtitle-style-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    description: options?.description || "",

    // Шрифт и текст - значения по умолчанию
    fontFamily: options?.fontFamily || "Inter, system-ui, sans-serif",
    fontSize: options?.fontSize || 24,
    fontWeight: options?.fontWeight || "normal",
    fontStyle: options?.fontStyle || "normal",
    textAlign: options?.textAlign || "center",

    // Цвета
    color: options?.color || "#ffffff",
    backgroundColor: options?.backgroundColor || "rgba(0, 0, 0, 0.7)",
    strokeColor: options?.strokeColor,
    strokeWidth: options?.strokeWidth || 0,

    // Тени
    textShadow: options?.textShadow,

    // Позиционирование
    defaultPosition: options?.defaultPosition || {
      alignment: "bottom-center",
      marginX: 0,
      marginY: 50,
    },

    // Размеры и отступы
    padding: options?.padding || {
      top: 8,
      right: 12,
      bottom: 8,
      left: 12,
    },
    borderRadius: options?.borderRadius || 4,
    maxWidth: options?.maxWidth || 80,

    // Поведение
    wordWrap: options?.wordWrap ?? true,
    letterSpacing: options?.letterSpacing || 0,
    lineHeight: options?.lineHeight || 1.2,

    // Анимации
    defaultAnimationIn: options?.defaultAnimationIn,
    defaultAnimationOut: options?.defaultAnimationOut,

    // Метаданные
    isBuiltIn: options?.isBuiltIn || false,
    tags: options?.tags || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Создает встроенные стили субтитров по умолчанию
 */
export function createDefaultSubtitleStyles(): SubtitleStyle[] {
  return [
    createSubtitleStyle("Классический", {
      description: "Стандартный стиль с белым текстом и черным фоном",
      isBuiltIn: true,
      tags: ["классический", "стандартный"],
    }),

    createSubtitleStyle("Минималистичный", {
      description: "Чистый белый текст без фона",
      backgroundColor: "transparent",
      strokeColor: "#000000",
      strokeWidth: 2,
      textShadow: {
        offsetX: 1,
        offsetY: 1,
        blur: 2,
        color: "rgba(0, 0, 0, 0.8)",
      },
      isBuiltIn: true,
      tags: ["минимализм", "чистый"],
    }),

    createSubtitleStyle("Яркий", {
      description: "Выразительный стиль с желтым текстом",
      color: "#ffeb3b",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      fontSize: 28,
      fontWeight: "bold",
      borderRadius: 8,
      isBuiltIn: true,
      tags: ["яркий", "выразительный"],
    }),

    createSubtitleStyle("Элегантный", {
      description: "Изысканный стиль с засечками",
      fontFamily: "Georgia, Times, serif",
      fontSize: 26,
      fontStyle: "italic",
      color: "#f8f8f2",
      backgroundColor: "rgba(40, 42, 54, 0.9)",
      borderRadius: 6,
      padding: {
        top: 12,
        right: 16,
        bottom: 12,
        left: 16,
      },
      isBuiltIn: true,
      tags: ["элегантный", "засечки"],
    }),
  ]
}

/**
 * Создает файл музыки
 */
export function createMusicFile(
  name: string,
  filePath: string,
  duration: number,
  options?: Partial<Omit<MusicFile, "id" | "name" | "filePath" | "duration" | "createdAt" | "updatedAt">>,
): MusicFile {
  return {
    id: `music-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    filePath,
    duration,

    // Технические параметры
    sampleRate: options?.sampleRate || 44100,
    channels: options?.channels || 2,
    bitrate: options?.bitrate,
    format: options?.format || "mp3",

    // Музыкальные метаданные
    artist: options?.artist,
    album: options?.album,
    bpm: options?.bpm,
    key: options?.key,
    genre: options?.genre,
    mood: options?.mood,
    energy: options?.energy,

    // Правовая информация
    license: options?.license || "royalty-free",
    licenseDetails: options?.licenseDetails,
    copyright: options?.copyright,

    // Теги и категоризация
    tags: options?.tags || [],
    category: options?.category,

    // Анализ
    waveformData: options?.waveformData,
    spectrogramData: options?.spectrogramData,
    analysisComplete: options?.analysisComplete || false,

    // Метаданные
    fileSize: options?.fileSize || 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastUsed: options?.lastUsed,
  }
}
