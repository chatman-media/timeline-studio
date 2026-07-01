/**
 * Analyzer Presets - Предустановленные комбинации анализаторов
 * С поддержкой разных типов медиа (видео, аудио, изображения)
 */

import type { AnalyzerType, VlmModelType } from "./analysis-progress"

// ============================================================================
// Media Types
// ============================================================================

/** Типы медиа для анализа */
export type MediaAnalysisType = "video" | "audio" | "image"

/** Уровень детализации анализа */
export type AnalysisLevel = "quick" | "balanced" | "comprehensive" | "custom"

// ============================================================================
// Analyzers by Media Type
// ============================================================================

/** Какие анализаторы доступны для какого типа медиа */
export const ANALYZERS_BY_MEDIA_TYPE: Record<MediaAnalysisType, AnalyzerType[]> = {
  video: [
    // Visual
    "scene_detection",
    "object_detection",
    "face_detection",
    "motion_analysis",
    "composition_analysis",
    "person_recognition",
    "visual_quality",
    // Audio
    "audio_quality",
    "speech_recognition",
    "speech_detection",
    "music_detection",
    "silence_detection",
    "sound_events",
    // Content
    "mood_analysis",
    "content_classification",
    "quality_assessment",
    "moment_detection",
    "vlm_analysis",
  ],
  audio: [
    "audio_quality",
    "speech_recognition",
    "speech_detection",
    "music_detection",
    "silence_detection",
    "sound_events",
    "mood_analysis", // audio-based mood analysis
  ],
  image: [
    "object_detection",
    "face_detection",
    "person_recognition",
    "composition_analysis",
    "quality_assessment",
    "visual_quality",
    "content_classification",
    "vlm_analysis",
  ],
}

/** Категории анализаторов для UI */
export interface AnalyzerCategory {
  id: string
  name: string
  nameRu: string
  /** Russian description */
  description: string
  /** English description */
  descriptionEn: string
  analyzers: AnalyzerType[]
  availableFor: MediaAnalysisType[]
  icon?: string
}

export const ANALYZER_CATEGORIES: AnalyzerCategory[] = [
  {
    id: "visual_detection",
    name: "Object Detection",
    nameRu: "Детекция объектов",
    description: "Распознавание лиц, объектов, людей",
    descriptionEn: "Face, object, and person recognition",
    analyzers: ["face_detection", "object_detection", "person_recognition"],
    availableFor: ["video", "image"],
    icon: "scan",
  },
  {
    id: "scene_analysis",
    name: "Scene Analysis",
    nameRu: "Анализ сцен",
    description: "Детекция сцен, переходов, движения",
    descriptionEn: "Scene, transition, and motion detection",
    analyzers: ["scene_detection", "motion_analysis"],
    availableFor: ["video"],
    icon: "film",
  },
  {
    id: "audio_analysis",
    name: "Audio Analysis",
    nameRu: "Аудио анализ",
    description: "Речь, музыка, качество звука",
    descriptionEn: "Speech, music, audio quality",
    analyzers: [
      "audio_quality",
      "speech_recognition",
      "speech_detection",
      "music_detection",
      "silence_detection",
      "sound_events",
    ],
    availableFor: ["video", "audio"],
    icon: "audio-lines",
  },
  {
    id: "quality",
    name: "Quality Assessment",
    nameRu: "Оценка качества",
    description: "Качество изображения, композиция",
    descriptionEn: "Image quality, composition",
    analyzers: ["quality_assessment", "visual_quality", "composition_analysis"],
    availableFor: ["video", "audio", "image"],
    icon: "sparkles",
  },
  {
    id: "content_intelligence",
    name: "AI Content Analysis",
    nameRu: "AI анализ контента",
    description: "Настроение, классификация, VLM",
    descriptionEn: "Mood, classification, VLM",
    analyzers: ["mood_analysis", "content_classification", "moment_detection", "vlm_analysis"],
    availableFor: ["video", "audio", "image"],
    icon: "brain",
  },
]

// ============================================================================
// Preset Types
// ============================================================================

export interface AnalyzerPreset {
  id: string
  name: string
  nameRu: string
  description: string
  descriptionRu: string
  analyzers: Set<AnalyzerType>
  isDefault: boolean
  category: "speed" | "quality" | "custom"
  estimatedTime: string
  /** Для каких типов медиа этот пресет */
  mediaTypes: MediaAnalysisType[]
  /** VLM модель (если включен vlm_analysis) */
  vlmModel?: VlmModelType
}

export interface MediaPresetConfig {
  mediaType: MediaAnalysisType
  level: AnalysisLevel
  analyzers: Set<AnalyzerType>
  vlmModel?: VlmModelType
  estimatedTimeSeconds: number
  description: string
  descriptionRu: string
}

// ============================================================================
// Presets by Media Type
// ============================================================================

/** Пресеты для видео */
const VIDEO_PRESETS: Record<Exclude<AnalysisLevel, "custom">, Omit<MediaPresetConfig, "mediaType" | "level">> = {
  quick: {
    analyzers: new Set(["scene_detection", "audio_quality"]),
    estimatedTimeSeconds: 30,
    description: "Basic scene and audio analysis",
    descriptionRu: "Базовый анализ сцен и звука",
  },
  balanced: {
    analyzers: new Set([
      "scene_detection",
      "face_detection",
      "audio_quality",
      "speech_recognition",
      "mood_analysis",
      "quality_assessment",
      "moment_detection",
    ]),
    estimatedTimeSeconds: 120,
    description: "Scenes, faces, speech, mood",
    descriptionRu: "Сцены, лица, речь, настроение",
  },
  comprehensive: {
    analyzers: new Set(ANALYZERS_BY_MEDIA_TYPE.video),
    vlmModel: "moondream2",
    estimatedTimeSeconds: 300,
    description: "Full analysis with AI Vision",
    descriptionRu: "Полный анализ с AI Vision",
  },
}

/** Пресеты для аудио */
const AUDIO_PRESETS: Record<Exclude<AnalysisLevel, "custom">, Omit<MediaPresetConfig, "mediaType" | "level">> = {
  quick: {
    analyzers: new Set(["audio_quality", "silence_detection"]),
    estimatedTimeSeconds: 15,
    description: "Quality and silence detection",
    descriptionRu: "Качество и детекция тишины",
  },
  balanced: {
    analyzers: new Set(["audio_quality", "speech_recognition", "music_detection", "silence_detection"]),
    estimatedTimeSeconds: 60,
    description: "Speech, music, quality",
    descriptionRu: "Речь, музыка, качество",
  },
  comprehensive: {
    analyzers: new Set(ANALYZERS_BY_MEDIA_TYPE.audio),
    estimatedTimeSeconds: 120,
    description: "Full audio analysis",
    descriptionRu: "Полный аудио анализ",
  },
}

/** Пресеты для изображений */
const IMAGE_PRESETS: Record<Exclude<AnalysisLevel, "custom">, Omit<MediaPresetConfig, "mediaType" | "level">> = {
  quick: {
    analyzers: new Set(["object_detection", "quality_assessment"]),
    estimatedTimeSeconds: 5,
    description: "Objects and quality",
    descriptionRu: "Объекты и качество",
  },
  balanced: {
    analyzers: new Set(["object_detection", "face_detection", "composition_analysis", "quality_assessment"]),
    estimatedTimeSeconds: 15,
    description: "Objects, faces, composition",
    descriptionRu: "Объекты, лица, композиция",
  },
  comprehensive: {
    analyzers: new Set(ANALYZERS_BY_MEDIA_TYPE.image),
    vlmModel: "moondream2",
    estimatedTimeSeconds: 30,
    description: "Full analysis with AI Vision",
    descriptionRu: "Полный анализ с AI Vision",
  },
}

const PRESETS_BY_MEDIA_TYPE = {
  video: VIDEO_PRESETS,
  audio: AUDIO_PRESETS,
  image: IMAGE_PRESETS,
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Получить пресет для конкретного типа медиа и уровня
 */
export function getMediaPreset(mediaType: MediaAnalysisType, level: AnalysisLevel): MediaPresetConfig {
  if (level === "custom") {
    return {
      mediaType,
      level,
      analyzers: new Set(),
      estimatedTimeSeconds: 0,
      description: "Custom selection",
      descriptionRu: "Выберите анализаторы вручную",
    }
  }

  const presetData = PRESETS_BY_MEDIA_TYPE[mediaType][level]
  return {
    mediaType,
    level,
    ...presetData,
  }
}

/**
 * Получить все доступные пресеты для типа медиа
 */
export function getPresetsForMediaType(mediaType: MediaAnalysisType): MediaPresetConfig[] {
  const levels: Exclude<AnalysisLevel, "custom">[] = ["quick", "balanced", "comprehensive"]
  return levels.map((level) => getMediaPreset(mediaType, level))
}

/**
 * Получить анализаторы, доступные для типа медиа
 */
export function getAvailableAnalyzers(mediaType: MediaAnalysisType): AnalyzerType[] {
  return ANALYZERS_BY_MEDIA_TYPE[mediaType]
}

/**
 * Получить категории анализаторов для типа медиа
 */
export function getCategoriesForMediaType(mediaType: MediaAnalysisType): AnalyzerCategory[] {
  return ANALYZER_CATEGORIES.filter((cat) => cat.availableFor.includes(mediaType))
}

/**
 * Определить тип медиа по расширению файла
 */
export function detectMediaType(filePath: string): MediaAnalysisType {
  const ext = filePath.toLowerCase().split(".").pop() || ""

  const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm", "m4v", "wmv", "flv"]
  const audioExtensions = ["mp3", "wav", "aac", "flac", "m4a", "ogg", "wma"]
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "heic"]

  if (videoExtensions.includes(ext)) return "video"
  if (audioExtensions.includes(ext)) return "audio"
  if (imageExtensions.includes(ext)) return "image"

  // Default to video
  return "video"
}

/**
 * Получить смешанный пресет для нескольких типов медиа
 * (union анализаторов, которые применимы ко всем выбранным типам)
 */
export function getMixedMediaPreset(mediaTypes: MediaAnalysisType[], level: AnalysisLevel): Set<AnalyzerType> {
  if (mediaTypes.length === 0) return new Set()

  if (level === "custom") return new Set()

  // Для смешанного набора берем union всех анализаторов
  const allAnalyzers = new Set<AnalyzerType>()

  for (const mediaType of mediaTypes) {
    const preset = getMediaPreset(mediaType, level)
    for (const analyzer of preset.analyzers) {
      allAnalyzers.add(analyzer)
    }
  }

  return allAnalyzers
}

/**
 * Форматирование времени
 */
export function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) return "< 1 мин"
  if (seconds < 120) return "~1 мин"
  if (seconds < 300) return `${Math.round(seconds / 60)} мин`
  return `${Math.round(seconds / 60)}+ мин`
}

// ============================================================================
// Legacy Presets (backward compatibility)
// ============================================================================

/**
 * Встроенные preset'ы (legacy format)
 */
export const DEFAULT_PRESETS: AnalyzerPreset[] = [
  {
    id: "quick-scan",
    name: "Quick",
    nameRu: "Быстрый",
    description: "Basic analysis for fast results",
    descriptionRu: "Базовый анализ для быстрого результата",
    analyzers: new Set(["scene_detection", "audio_quality", "moment_detection"]),
    isDefault: true,
    category: "speed",
    estimatedTime: "< 1 min",
    mediaTypes: ["video"],
  },
  {
    id: "balanced-analysis",
    name: "Balanced",
    nameRu: "Сбалансированный",
    description: "Optimal balance of speed and quality",
    descriptionRu: "Оптимальный баланс скорости и качества",
    analyzers: new Set([
      "scene_detection",
      "audio_quality",
      "moment_detection",
      "face_detection",
      "object_detection",
      "quality_assessment",
      "mood_analysis",
    ]),
    isDefault: true,
    category: "quality",
    estimatedTime: "2-3 min",
    mediaTypes: ["video"],
  },
  {
    id: "deep-analysis",
    name: "Comprehensive",
    nameRu: "Максимальное качество",
    description: "Complete analysis with all available analyzers",
    descriptionRu: "Полный анализ со всеми доступными анализаторами",
    analyzers: new Set([
      "scene_detection",
      "object_detection",
      "face_detection",
      "motion_analysis",
      "composition_analysis",
      "audio_quality",
      "speech_recognition",
      "music_detection",
      "sound_events",
      "silence_detection",
      "mood_analysis",
      "content_classification",
      "quality_assessment",
      "moment_detection",
      "vlm_analysis",
    ]),
    isDefault: true,
    category: "quality",
    estimatedTime: "5-10 min",
    mediaTypes: ["video"],
    vlmModel: "moondream2",
  },
  {
    id: "montage-focus",
    name: "Montage Focus",
    nameRu: "Фокус на монтаж",
    description: "Optimized for creating montages",
    descriptionRu: "Анализ оптимизирован для создания нарезок",
    analyzers: new Set([
      "scene_detection",
      "moment_detection",
      "audio_quality",
      "music_detection",
      "motion_analysis",
      "mood_analysis",
    ]),
    isDefault: true,
    category: "custom",
    estimatedTime: "1-2 min",
    mediaTypes: ["video"],
  },
  {
    id: "quality-focus",
    name: "Quality Focus",
    nameRu: "Фокус на качество",
    description: "Focus on video/audio quality assessment",
    descriptionRu: "Анализ качества видео и аудио",
    analyzers: new Set(["quality_assessment", "composition_analysis", "visual_quality", "audio_quality"]),
    isDefault: true,
    category: "quality",
    estimatedTime: "2-3 min",
    mediaTypes: ["video", "audio", "image"],
  },
  {
    id: "audio-only",
    name: "Audio Analysis",
    nameRu: "Анализ аудио",
    description: "Full audio analysis for audio files",
    descriptionRu: "Полный анализ для аудио файлов",
    analyzers: new Set(ANALYZERS_BY_MEDIA_TYPE.audio),
    isDefault: true,
    category: "quality",
    estimatedTime: "1-2 min",
    mediaTypes: ["audio"],
  },
  {
    id: "image-analysis",
    name: "Image Analysis",
    nameRu: "Анализ изображений",
    description: "Full analysis for images",
    descriptionRu: "Полный анализ для изображений",
    analyzers: new Set(ANALYZERS_BY_MEDIA_TYPE.image),
    isDefault: true,
    category: "quality",
    estimatedTime: "< 1 min",
    mediaTypes: ["image"],
    vlmModel: "moondream2",
  },
]

/**
 * Получить все default preset'ы
 */
export function getDefaultPresets(): AnalyzerPreset[] {
  return DEFAULT_PRESETS
}

/**
 * Получить пресеты для конкретного типа медиа (legacy)
 */
export function getPresetsForMedia(mediaType: MediaAnalysisType): AnalyzerPreset[] {
  return DEFAULT_PRESETS.filter((p) => p.mediaTypes.includes(mediaType))
}

/**
 * Получить preset по ID
 */
export function getPresetById(id: string, customPresets: AnalyzerPreset[] = []): AnalyzerPreset | undefined {
  const defaultPreset = DEFAULT_PRESETS.find((p) => p.id === id)
  if (defaultPreset) return defaultPreset
  return customPresets.find((p) => p.id === id)
}

/**
 * Создать кастомный preset
 */
export function createCustomPreset(
  name: string,
  description: string,
  analyzers: Set<AnalyzerType>,
  mediaTypes: MediaAnalysisType[] = ["video"],
): AnalyzerPreset {
  return {
    id: `preset-custom-${Date.now()}`,
    name,
    nameRu: name,
    description,
    descriptionRu: description,
    analyzers,
    isDefault: false,
    category: "custom",
    estimatedTime: calculateEstimatedTime(analyzers),
    mediaTypes,
  }
}

/**
 * Вычислить примерное время выполнения для набора анализаторов
 */
export function calculateEstimatedTime(analyzers: Set<AnalyzerType>): string {
  const count = analyzers.size

  if (count <= 3) return "< 1 min"
  if (count <= 7) return "2-3 min"
  if (count <= 12) return "5-10 min"
  return "10+ min"
}

/**
 * Валидация preset'а
 */
export function validatePreset(preset: AnalyzerPreset): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!preset.name || preset.name.trim().length === 0) {
    errors.push("Имя preset'а не может быть пустым")
  }

  if (preset.name.length > 50) {
    errors.push("Имя preset'а слишком длинное (максимум 50 символов)")
  }

  if (preset.analyzers.size === 0) {
    errors.push("Preset должен содержать хотя бы один анализатор")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
