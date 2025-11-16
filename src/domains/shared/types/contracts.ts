/**
 * Service Contracts
 *
 * Интерфейсы для взаимодействия между доменами
 * Определяют контракты сервисов для обеспечения слабой связанности
 */

import type {
  AudioAnalysisResult,
  KeyFrameExtractionOptions,
  KeyFrameExtractionResult,
  MotionAnalysisResult,
  QualityAnalysisResult,
  SceneDetectionResult,
  SilenceDetectionResult,
  VideoAnalysisOptions,
  VideoMetadata,
} from "./media-analysis"

/**
 * Результат анализа медиа файла
 * Объединяет все типы анализа в одну структуру
 */
export interface MediaAnalysisResult {
  // Основная информация о файле
  filePath: string
  metadata: VideoMetadata

  // Результаты различных типов анализа
  sceneDetection?: SceneDetectionResult
  qualityAnalysis?: QualityAnalysisResult
  silenceDetection?: SilenceDetectionResult
  motionAnalysis?: MotionAnalysisResult
  keyFrames?: KeyFrameExtractionResult
  audioAnalysis?: AudioAnalysisResult

  // Метаинформация о процессе анализа
  analysisId: string
  timestamp: Date
  duration: number // время выполнения анализа в мс
  errors?: string[]
}

/**
 * Контракт для сервиса анализа медиа файлов
 *
 * Используется доменами:
 * - Media Management (анализ импортированных файлов)
 * - AI Services (анализ контента для рекомендаций)
 * - Video Editing (анализ для автоматического монтажа)
 */
export interface IMediaAnalysisContract {
  /**
   * Анализирует один медиа файл
   * @param filePath - Путь к файлу
   * @param options - Опции анализа
   * @returns Результат анализа
   */
  analyzeFile(filePath: string, options?: VideoAnalysisOptions): Promise<MediaAnalysisResult>

  /**
   * Анализирует несколько медиа файлов пакетно
   * @param filePaths - Массив путей к файлам
   * @param options - Опции анализа
   * @returns Массив результатов анализа
   */
  batchAnalyze(filePaths: string[], options?: VideoAnalysisOptions): Promise<MediaAnalysisResult[]>

  /**
   * Отменяет текущий процесс анализа
   * @param analysisId - ID анализа для отмены
   */
  cancelAnalysis(analysisId: string): Promise<void>

  /**
   * Получает прогресс текущего анализа
   * @param analysisId - ID анализа
   * @returns Прогресс от 0 до 1
   */
  getProgress(analysisId: string): number

  /**
   * Получает кэшированный результат анализа
   * @param filePath - Путь к файлу
   * @returns Кэшированный результат или null
   */
  getCachedResult(filePath: string): Promise<MediaAnalysisResult | null>

  /**
   * Извлекает ключевые кадры из видео
   * @param filePath - Путь к видео файлу
   * @param options - Опции извлечения
   * @returns Результат извлечения ключевых кадров
   */
  extractKeyFrames(filePath: string, options?: KeyFrameExtractionOptions): Promise<KeyFrameExtractionResult>
}

/**
 * Настройки экспорта видео
 */
export interface ExportSettings {
  // Формат экспорта
  format: "mp4" | "mov" | "avi" | "webm" | "mkv"
  codec: string

  // Параметры видео
  resolution?: {
    width: number
    height: number
  }
  fps?: number
  bitrate?: number
  quality?: "low" | "medium" | "high" | "ultra"

  // Параметры аудио
  audioCodec?: string
  audioBitrate?: number
  audioChannels?: number
  audioSampleRate?: number

  // Путь для сохранения
  outputPath: string

  // Дополнительные опции
  includeMetadata?: boolean
  optimizeForWeb?: boolean
  hardwareAcceleration?: boolean
}

/**
 * Результат экспорта
 */
export interface ExportResult {
  success: boolean
  outputPath: string
  fileSize: number
  duration: number // время экспорта в мс
  errors?: string[]
}

/**
 * Прогресс экспорта
 */
export interface ExportProgress {
  stage: "preparing" | "encoding" | "finalizing" | "completed" | "error"
  progress: number // 0-1
  currentFrame?: number
  totalFrames?: number
  estimatedTimeRemaining?: number // в секундах
  message?: string
}

/**
 * Контракт для сервиса экспорта видео
 *
 * Используется доменами:
 * - Video Editing (экспорт готового проекта)
 * - AI Services (экспорт результатов обработки)
 */
export interface IExportContract {
  /**
   * Экспортирует таймлайн в видео файл
   * @param timeline - Данные таймлайна для экспорта
   * @param settings - Настройки экспорта
   * @returns Путь к экспортированному файлу
   */
  export(timeline: any, settings: ExportSettings): Promise<ExportResult>

  /**
   * Получает прогресс текущего экспорта
   * @returns Прогресс экспорта
   */
  getProgress(): ExportProgress

  /**
   * Отменяет текущий процесс экспорта
   */
  cancel(): Promise<void>

  /**
   * Проверяет доступность кодека
   * @param codec - Название кодека
   * @returns true если кодек доступен
   */
  isCodecAvailable(codec: string): Promise<boolean>

  /**
   * Получает список доступных кодеков
   * @returns Массив названий кодеков
   */
  getAvailableCodecs(): Promise<string[]>

  /**
   * Оценивает размер экспортируемого файла
   * @param timeline - Данные таймлайна
   * @param settings - Настройки экспорта
   * @returns Примерный размер файла в байтах
   */
  estimateFileSize(timeline: any, settings: ExportSettings): Promise<number>
}

/**
 * Результат анализа контента AI
 */
export interface AnalysisResult {
  // Классификация контента
  category?: string
  tags?: string[]
  description?: string

  // Обнаруженные объекты и сцены
  objects?: Array<{
    name: string
    confidence: number
    timestamp?: number
  }>
  scenes?: Array<{
    description: string
    startTime: number
    endTime: number
  }>

  // Рекомендации
  suggestions?: string[]
  improvements?: string[]

  // Метаданные
  model: string
  processingTime: number
  confidence: number
}

/**
 * Опции для AI запроса
 */
export interface AIRequestOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  timeout?: number
}

/**
 * Результат AI запроса
 */
export interface AIResponse {
  content: string
  model: string
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  finishReason: "stop" | "length" | "error"
  metadata?: Record<string, any>
}

/**
 * Контракт для AI сервисов
 *
 * Используется доменами:
 * - AI Services (основная реализация)
 * - Video Editing (получение рекомендаций)
 * - Media Management (автоматическая классификация)
 */
export interface IAIServiceContract {
  /**
   * Отправляет запрос к AI модели
   * @param prompt - Текст запроса
   * @param context - Дополнительный контекст
   * @param options - Опции запроса
   * @returns Ответ от AI
   */
  sendRequest(prompt: string, context?: any, options?: AIRequestOptions): Promise<AIResponse>

  /**
   * Анализирует контент с помощью AI
   * @param content - Контент для анализа (текст, путь к файлу, данные)
   * @returns Результат анализа
   */
  analyzeContent(content: any): Promise<AnalysisResult>

  /**
   * Проверяет доступность AI сервиса
   * @returns true если сервис доступен
   */
  isAvailable(): Promise<boolean>

  /**
   * Получает информацию о текущей модели
   * @returns Информация о модели
   */
  getModelInfo(): Promise<{
    name: string
    version: string
    capabilities: string[]
  }>

  /**
   * Отменяет текущий запрос
   * @param requestId - ID запроса для отмены
   */
  cancelRequest(requestId: string): Promise<void>

  /**
   * Генерирует текст на основе промпта
   * @param prompt - Промпт для генерации
   * @param options - Опции генерации
   * @returns Сгенерированный текст
   */
  generateText(prompt: string, options?: AIRequestOptions): Promise<string>

  /**
   * Генерирует описание для изображения/видео
   * @param mediaPath - Путь к медиа файлу
   * @returns Описание контента
   */
  generateDescription(mediaPath: string): Promise<string>
}

/**
 * Контракт для сервиса нотификаций
 *
 * Используется всеми доменами для показа уведомлений пользователю
 */
export interface INotificationContract {
  /**
   * Показывает информационное уведомление
   * @param message - Текст сообщения
   * @param duration - Длительность показа в мс (опционально)
   */
  info(message: string, duration?: number): void

  /**
   * Показывает уведомление об успехе
   * @param message - Текст сообщения
   * @param duration - Длительность показа в мс (опционально)
   */
  success(message: string, duration?: number): void

  /**
   * Показывает предупреждение
   * @param message - Текст сообщения
   * @param duration - Длительность показа в мс (опционально)
   */
  warning(message: string, duration?: number): void

  /**
   * Показывает сообщение об ошибке
   * @param message - Текст сообщения
   * @param duration - Длительность показа в мс (опционально)
   */
  error(message: string, duration?: number): void

  /**
   * Закрывает уведомление
   * @param id - ID уведомления для закрытия
   */
  dismiss(id?: string): void
}

/**
 * Контракт для сервиса логирования
 *
 * Используется всеми доменами для логирования
 */
export interface ILoggerContract {
  debug(message: string, data?: any): void
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, error?: Error | any): void
}
