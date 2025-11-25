/**
 * AI Director Analysis Progress Types
 * Детальные типы для отслеживания прогресса анализа по файлам и анализаторам
 */

// ============================================================================
// Analyzer Types
// ============================================================================

export type AnalyzerType =
  // Video analyzers
  | "scene_detection"
  | "object_detection"
  | "face_detection"
  | "motion_analysis"
  | "composition_analysis"
  // Audio analyzers
  | "audio_quality"
  | "speech_recognition"
  | "speech_detection" // Alias for speech_recognition in v3 UI
  | "music_detection"
  | "sound_events"
  | "silence_detection"
  // Content analyzers
  | "mood_analysis"
  | "content_classification"
  | "quality_assessment"
  | "visual_quality" // Alias for quality_assessment in v3 UI
  | "moment_detection"
  | "person_recognition" // Person recognition in v3 UI
  | "vlm_analysis"

export interface AnalyzerMetadata {
  type: AnalyzerType
  displayName: string
  category: "video" | "audio" | "content"
  description: string
  estimatedDuration: number // в секундах
  icon?: string
}

// ============================================================================
// Analyzer Progress
// ============================================================================

export type AnalyzerStatus = "pending" | "running" | "completed" | "error" | "skipped"

export interface AnalyzerProgress {
  type: AnalyzerType
  status: AnalyzerStatus
  progress: number // 0-100
  startTime?: string
  endTime?: string
  duration?: number // в миллисекундах
  details?: string
  result?: AnalyzerResult
  error?: string
}

export interface AnalyzerResult {
  type: AnalyzerType
  success: boolean
  data?: any
  metadata?: {
    processingTime: number
    itemsFound?: number // кол-во найденных сцен/объектов/моментов
    confidence?: number
    [key: string]: any
  }
}

// ============================================================================
// File Analysis Progress
// ============================================================================

export type FileAnalysisStatus = "pending" | "analyzing" | "completed" | "error" | "cancelled"

export interface FileAnalysisProgress {
  /** Unique file ID (alias for fileId for backward compatibility) */
  id?: string
  fileId: string
  filePath: string
  fileName: string
  status: FileAnalysisStatus
  progress: number // 0-100 (общий прогресс по файлу)
  analyzers: AnalyzerProgress[]
  startTime?: string
  endTime?: string
  duration?: number // в миллисекундах
  error?: string
  /** Current analysis stage (for UI display) */
  currentStage?: string
  /** Estimated time remaining in seconds */
  eta?: number
  // Статистика
  stats?: {
    totalAnalyzers: number
    completedAnalyzers: number
    failedAnalyzers: number
    skippedAnalyzers: number
  }
}

// ============================================================================
// Batch Analysis Progress
// ============================================================================

export type BatchAnalysisStatus = "idle" | "running" | "completed" | "error" | "cancelled"

export interface BatchAnalysisProgress {
  /** Unique batch ID */
  id?: string
  /** Batch ID (for backward compatibility) */
  batchId?: string
  status: BatchAnalysisStatus
  files?: FileAnalysisProgress[]
  startTime?: string
  endTime?: string
  duration?: number
  /** Configuration mode used for this batch */
  configMode?: string
  /** Direct access fields for convenience */
  totalFiles?: number
  completedFiles?: number
  progress?: number // 0-100
  estimatedTimeRemaining?: number // in seconds
  currentFilePath?: string
  // Общая статистика
  stats?: {
    totalFiles: number
    completedFiles: number
    failedFiles: number
    totalProgress: number // 0-100 (средний прогресс всех файлов)
  }
}

// ============================================================================
// Analysis Configuration
// ============================================================================

export interface AnalysisConfig {
  /** Включенные анализаторы */
  enabledAnalyzers: Set<AnalyzerType>
  /** Настройки для каждого анализатора */
  analyzerSettings?: Partial<Record<AnalyzerType, any>>
  /** Параллельная обработка файлов */
  parallelFiles?: number // макс кол-во файлов одновременно (default: 2)
  /** Таймаут на файл */
  fileTimeout?: number // в секундах
}

// ============================================================================
// Analysis Events (для real-time обновлений)
// ============================================================================

export type AnalysisProgressEvent =
  // Batch events
  | {
      type: "batch_started"
      batchId: string
      totalFiles: number
    }
  | {
      type: "batch_progress"
      batchId: string
      progress: number
    }
  | {
      type: "batch_completed"
      batchId: string
      duration: number
    }
  | {
      type: "batch_error"
      batchId: string
      error: string
    }
  // File events
  | {
      type: "file_started"
      batchId: string
      fileId: string
      filePath: string
    }
  | {
      type: "file_progress"
      batchId: string
      fileId: string
      progress: number
    }
  | {
      type: "file_completed"
      batchId: string
      fileId: string
      duration: number
    }
  | {
      type: "file_error"
      batchId: string
      fileId: string
      error: string
    }
  // Analyzer events
  | {
      type: "analyzer_started"
      batchId: string
      fileId: string
      analyzer: AnalyzerType
    }
  | {
      type: "analyzer_progress"
      batchId: string
      fileId: string
      analyzer: AnalyzerType
      progress: number
      details?: string
    }
  | {
      type: "analyzer_completed"
      batchId: string
      fileId: string
      analyzer: AnalyzerType
      result: AnalyzerResult
      duration: number
    }
  | {
      type: "analyzer_error"
      batchId: string
      fileId: string
      analyzer: AnalyzerType
      error: string
    }

// ============================================================================
// Helper Functions
// ============================================================================

export const ANALYZER_METADATA: Record<AnalyzerType, AnalyzerMetadata> = {
  // Video
  scene_detection: {
    type: "scene_detection",
    displayName: "Scene Detection",
    category: "video",
    description: "Определение сцен и переходов",
    estimatedDuration: 30,
  },
  object_detection: {
    type: "object_detection",
    displayName: "Object Detection",
    category: "video",
    description: "Распознавание объектов (YOLO)",
    estimatedDuration: 60,
  },
  face_detection: {
    type: "face_detection",
    displayName: "Face Detection",
    category: "video",
    description: "Детекция лиц",
    estimatedDuration: 45,
  },
  motion_analysis: {
    type: "motion_analysis",
    displayName: "Motion Analysis",
    category: "video",
    description: "Анализ движения",
    estimatedDuration: 40,
  },
  composition_analysis: {
    type: "composition_analysis",
    displayName: "Composition Analysis",
    category: "video",
    description: "Оценка композиции кадра",
    estimatedDuration: 35,
  },
  // Audio
  audio_quality: {
    type: "audio_quality",
    displayName: "Audio Quality",
    category: "audio",
    description: "Оценка качества звука",
    estimatedDuration: 20,
  },
  speech_recognition: {
    type: "speech_recognition",
    displayName: "Speech Recognition",
    category: "audio",
    description: "Распознавание речи (Whisper)",
    estimatedDuration: 90,
  },
  music_detection: {
    type: "music_detection",
    displayName: "Music Detection",
    category: "audio",
    description: "Детекция музыки",
    estimatedDuration: 25,
  },
  sound_events: {
    type: "sound_events",
    displayName: "Sound Events",
    category: "audio",
    description: "Определение звуковых событий",
    estimatedDuration: 30,
  },
  silence_detection: {
    type: "silence_detection",
    displayName: "Silence Detection",
    category: "audio",
    description: "Детекция тишины",
    estimatedDuration: 15,
  },
  speech_detection: {
    type: "speech_detection",
    displayName: "Speech Detection",
    category: "audio",
    description: "Определение речевых сегментов",
    estimatedDuration: 30,
  },
  // Content
  person_recognition: {
    type: "person_recognition",
    displayName: "Person Recognition",
    category: "video",
    description: "Распознавание персон",
    estimatedDuration: 55,
  },
  visual_quality: {
    type: "visual_quality",
    displayName: "Visual Quality",
    category: "video",
    description: "Оценка визуального качества",
    estimatedDuration: 30,
  },
  mood_analysis: {
    type: "mood_analysis",
    displayName: "Mood Analysis",
    category: "content",
    description: "Определение настроения",
    estimatedDuration: 50,
  },
  content_classification: {
    type: "content_classification",
    displayName: "Content Classification",
    category: "content",
    description: "Классификация контента",
    estimatedDuration: 40,
  },
  quality_assessment: {
    type: "quality_assessment",
    displayName: "Quality Assessment",
    category: "content",
    description: "Общая оценка качества",
    estimatedDuration: 35,
  },
  moment_detection: {
    type: "moment_detection",
    displayName: "Moment Detection",
    category: "content",
    description: "Поиск ключевых моментов",
    estimatedDuration: 45,
  },
  vlm_analysis: {
    type: "vlm_analysis",
    displayName: "VLM Analysis",
    category: "content",
    description: "Vision Language Model (LLaVA/GPT-4V)",
    estimatedDuration: 120,
  },
}

/**
 * Получить метаданные анализатора по типу
 */
export function getAnalyzerMetadata(type: AnalyzerType): AnalyzerMetadata {
  return ANALYZER_METADATA[type]
}

/**
 * Получить все анализаторы определенной категории
 */
export function getAnalyzersByCategory(category: "video" | "audio" | "content"): AnalyzerMetadata[] {
  return Object.values(ANALYZER_METADATA).filter((meta) => meta.category === category)
}

/**
 * Вычислить общий прогресс файла на основе прогресса анализаторов
 */
export function calculateFileProgress(analyzers: AnalyzerProgress[]): number {
  if (analyzers.length === 0) return 0

  const totalProgress = analyzers.reduce((sum, analyzer) => sum + analyzer.progress, 0)
  return Math.round(totalProgress / analyzers.length)
}

/**
 * Вычислить общий прогресс batch на основе прогресса файлов
 */
export function calculateBatchProgress(files: FileAnalysisProgress[]): number {
  if (files.length === 0) return 0

  const totalProgress = files.reduce((sum, file) => sum + file.progress, 0)
  return Math.round(totalProgress / files.length)
}

/**
 * Создать начальный прогресс файла
 */
export function createInitialFileProgress(
  fileId: string,
  filePath: string,
  fileName: string,
  enabledAnalyzers: AnalyzerType[],
): FileAnalysisProgress {
  return {
    fileId,
    filePath,
    fileName,
    status: "pending",
    progress: 0,
    analyzers: enabledAnalyzers.map((type) => ({
      type,
      status: "pending",
      progress: 0,
    })),
    stats: {
      totalAnalyzers: enabledAnalyzers.length,
      completedAnalyzers: 0,
      failedAnalyzers: 0,
      skippedAnalyzers: 0,
    },
  }
}

/**
 * Обновить прогресс анализатора в файле
 */
export function updateAnalyzerProgress(
  fileProgress: FileAnalysisProgress,
  analyzerType: AnalyzerType,
  update: Partial<AnalyzerProgress>,
): FileAnalysisProgress {
  const updatedAnalyzers = fileProgress.analyzers.map((analyzer) =>
    analyzer.type === analyzerType ? { ...analyzer, ...update } : analyzer,
  )

  const stats = {
    totalAnalyzers: updatedAnalyzers.length,
    completedAnalyzers: updatedAnalyzers.filter((a) => a.status === "completed").length,
    failedAnalyzers: updatedAnalyzers.filter((a) => a.status === "error").length,
    skippedAnalyzers: updatedAnalyzers.filter((a) => a.status === "skipped").length,
  }

  return {
    ...fileProgress,
    analyzers: updatedAnalyzers,
    progress: calculateFileProgress(updatedAnalyzers),
    stats,
  }
}
