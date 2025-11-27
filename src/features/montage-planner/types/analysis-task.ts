/**
 * Analysis Task Types
 *
 * Типы для работы с задачами AI анализа видео
 */

import type {
  AnalysisPhase,
  AnalysisProgress,
  AudioContentAnalysis,
  MomentScore,
  MontagePlan,
  VideoCompositionAnalysis,
} from "./index"

/**
 * Статус задачи анализа
 */
export enum AnalysisTaskStatus {
  Pending = "pending",
  Initializing = "initializing",
  AnalyzingVideo = "analyzing_video",
  AnalyzingAudio = "analyzing_audio",
  DetectingMoments = "detecting_moments",
  GeneratingPlan = "generating_plan",
  Completed = "completed",
  Failed = "failed",
  Cancelled = "cancelled",
}

/**
 * Прогресс задачи анализа
 */
export interface AnalysisTaskProgress {
  /** Процент выполнения (0-100) */
  percentage: number
  /** Текущая фаза анализа */
  phase: AnalysisPhase
  /** Текущий файл */
  current_file?: string
  /** Сообщение о прогрессе */
  message?: string
  /** Оценка оставшегося времени (секунды) */
  eta?: number
}

/**
 * Результаты анализа
 */
export interface AnalysisResults {
  /** Анализ видео композиции */
  videoAnalysis?: VideoCompositionAnalysis
  /** Анализ аудио контента */
  audioAnalysis?: AudioContentAnalysis
  /** Обнаруженные ключевые моменты */
  momentScores?: MomentScore[]
  /** Сгенерированный монтажный план */
  montagePlan?: MontagePlan
}

/**
 * Задача AI анализа видео
 */
export interface AnalysisTask {
  /** ID задачи */
  id: string
  /** Путь к видео файлу */
  video_path: string
  /** Название видео файла */
  video_name: string
  /** Статус задачи */
  status: AnalysisTaskStatus
  /** Время создания (ISO 8601) */
  created_at: string
  /** Время начала выполнения (ISO 8601) */
  started_at?: string
  /** Время завершения (ISO 8601) */
  completed_at?: string
  /** Прогресс выполнения */
  progress: AnalysisTaskProgress
  /** Результаты анализа */
  results?: AnalysisResults
  /** Сообщение об ошибке */
  error_message?: string
  /** Дополнительные метаданные */
  metadata?: {
    /** Размер файла (байты) */
    file_size?: number
    /** Длительность видео (секунды) */
    duration?: number
    /** Разрешение */
    resolution?: { width: number; height: number }
    /** Frame rate */
    frame_rate?: number
  }
}

/**
 * Настройки анализа
 */
export interface AnalysisTaskOptions {
  /** Включить анализ видео */
  enable_video_analysis?: boolean
  /** Включить анализ аудио */
  enable_audio_analysis?: boolean
  /** Включить обнаружение моментов */
  enable_moment_detection?: boolean
  /** Генерировать монтажный план */
  generate_montage_plan?: boolean
  /** Порог качества (0-100) */
  quality_threshold?: number
  /** Частота сэмплирования (кадры в секунду) */
  sample_rate?: number
  /** Стиль монтажа для плана */
  montage_style?: string
}

/**
 * Запрос на создание задачи анализа
 */
export interface CreateAnalysisTaskRequest {
  /** Путь к видео файлу */
  video_path: string
  /** Опции анализа */
  options?: AnalysisTaskOptions
}

/**
 * Статистика задач анализа
 */
export interface AnalysisTaskStatistics {
  /** Всего задач */
  total_tasks: number
  /** Активных задач */
  active_tasks: number
  /** Завершенных задач */
  completed_tasks: number
  /** Неудачных задач */
  failed_tasks: number
  /** Среднее время анализа (секунды) */
  average_analysis_time: number
  /** Общее время анализа (секунды) */
  total_analysis_time: number
}
