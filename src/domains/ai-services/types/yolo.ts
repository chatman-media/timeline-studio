/**
 * Интерфейсы для работы с данными распознавания YOLO
 *
 * Canonical source in domains/ai-services/types
 */

/**
 * Информация об обнаруженном объекте
 */
export interface YoloDetection {
  /** Класс объекта (человек, машина и т.д.) */
  class: string
  /** Уверенность в распознавании (0-1) */
  confidence: number
  /** Ограничивающий прямоугольник */
  bbox: {
    /** Координата X (относительная, 0-1) */
    x: number
    /** Координата Y (относительная, 0-1) */
    y: number
    /** Ширина (относительная, 0-1) */
    width: number
    /** Высота (относительная, 0-1) */
    height: number
  }
  /** ID для отслеживания объекта между кадрами (опционально) */
  trackId?: number
}

/**
 * Данные распознавания для одного кадра
 */
export interface YoloFrameData {
  /** Временная метка кадра (в секундах от начала видео) */
  timestamp: number
  /** Массив обнаруженных объектов */
  detections: YoloDetection[]
}

/**
 * Данные распознавания для всего видео
 */
export interface YoloVideoData {
  /** ID видео */
  videoId: string
  /** Имя видеофайла */
  videoName: string
  /** Путь к видеофайлу */
  videoPath: string
  /** Длительность видео в секундах */
  duration?: number
  /** Абсолютное время начала видео (Unix timestamp) */
  startTime?: number
  /** Данные распознавания по кадрам */
  frames: YoloFrameData[]
  /** Метаданные распознавания */
  metadata?: {
    /** Модель YOLO, использованная для распознавания */
    model: string
    /** Версия модели */
    version: string
    /** Дата и время распознавания */
    processedAt: string
    /** Частота кадров при распознавании */
    fps?: number
    /** Дополнительные параметры */
    [key: string]: any
  }
}

/**
 * Сводная информация о распознанных объектах в видео
 */
export interface YoloVideoSummary {
  /** ID видео */
  videoId: string
  /** Имя видеофайла */
  videoName: string
  /** Общее количество кадров с распознаванием */
  frameCount: number
  /** Список всех уникальных классов объектов в видео */
  detectedClasses: string[]
  /** Количество объектов каждого класса */
  classCounts: Record<string, number>
  /** Временные диапазоны, где присутствуют определенные классы объектов */
  classTimeRanges: Record<string, Array<{ start: number; end: number }>>
}
