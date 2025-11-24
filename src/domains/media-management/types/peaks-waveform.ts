/**
 * Peaks.js Waveform Types
 * Типы для интеграции peaks.js в Timeline Studio
 */

// Re-export официальных типов из peaks.js
export type {
  JsonWaveformData as AudiowaveformData,
  PeaksInstance,
  PeaksOptions,
  Point,
  PointOptions as PeaksPoint,
  Segment,
  SegmentOptions as PeaksSegment,
} from "peaks.js"

/**
 * Опции генерации waveform данных
 */
export interface WaveformDataOptions {
  /** Pixels per second */
  pixelsPerSecond?: number

  /** Bits (8 или 16) */
  bits?: 8 | 16

  /** Split channels */
  splitChannels?: boolean

  /** Width (для PNG) */
  width?: number

  /** Height (для PNG) */
  height?: number

  /** Цвет */
  color?: string
}

/**
 * Результат генерации waveform данных
 */
export interface WaveformDataResult {
  /** Путь к JSON файлу */
  jsonPath: string

  /** Длительность аудио */
  duration: number

  /** Sample rate */
  sampleRate: number

  /** Количество каналов */
  channels: number

  /** Размер данных */
  dataSize: number
}

/**
 * Peaks.js hook result
 */
export interface UsePeaksResult {
  /** Peaks instance */
  peaks: import("peaks.js").PeaksInstance | null

  /** Container refs */
  overviewRef: React.RefObject<HTMLDivElement | null>
  zoomviewRef: React.RefObject<HTMLDivElement | null>

  /** Loading state */
  isLoading: boolean

  /** Error state */
  error: Error | null

  /** Инициализирован */
  isReady: boolean

  /** Helpers */
  addSegment: (segment: Omit<import("peaks.js").SegmentOptions, "id">) => void
  addPoint: (point: Omit<import("peaks.js").PointOptions, "id">) => void
  clearSegments: () => void
  clearPoints: () => void
  seek: (time: number) => void
  play: () => void
  pause: () => void
}
