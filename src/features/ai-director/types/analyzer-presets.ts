/**
 * Analyzer Presets - Предустановленные комбинации анализаторов
 */

import type { AnalyzerType } from "./analysis-progress"

export interface AnalyzerPreset {
  id: string
  name: string
  description: string
  analyzers: AnalyzerType[]
  isDefault: boolean // Встроенный preset или кастомный
  category: "speed" | "quality" | "custom"
  estimatedTime: number // Примерное время на 1 минуту видео (секунды)
}

/**
 * Встроенные preset'ы
 */
export const DEFAULT_PRESETS: Record<string, AnalyzerPreset> = {
  fast: {
    id: "preset-fast",
    name: "Быстрый",
    description: "Базовый анализ для быстрого результата",
    analyzers: ["scene_detection", "audio_quality", "moment_detection"],
    isDefault: true,
    category: "speed",
    estimatedTime: 60, // ~1 минута
  },
  balanced: {
    id: "preset-balanced",
    name: "Сбалансированный",
    description: "Оптимальный баланс скорости и качества",
    analyzers: [
      "scene_detection",
      "audio_quality",
      "moment_detection",
      "face_detection",
      "object_detection",
      "quality_assessment",
      "mood_analysis",
    ],
    isDefault: true,
    category: "quality",
    estimatedTime: 180, // ~3 минуты
  },
  quality: {
    id: "preset-quality",
    name: "Максимальное качество",
    description: "Полный анализ всеми доступными анализаторами",
    analyzers: [
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
    ],
    isDefault: true,
    category: "quality",
    estimatedTime: 600, // ~10 минут
  },
  video_only: {
    id: "preset-video-only",
    name: "Только видео",
    description: "Анализ визуального контента без звука",
    analyzers: ["scene_detection", "object_detection", "face_detection", "motion_analysis", "composition_analysis"],
    isDefault: true,
    category: "custom",
    estimatedTime: 150,
  },
  audio_only: {
    id: "preset-audio-only",
    name: "Только аудио",
    description: "Анализ звуковой дорожки без видео",
    analyzers: ["audio_quality", "speech_recognition", "music_detection", "sound_events", "silence_detection"],
    isDefault: true,
    category: "custom",
    estimatedTime: 90,
  },
  highlights: {
    id: "preset-highlights",
    name: "Highlights",
    description: "Поиск ключевых моментов для создания нарезок",
    analyzers: [
      "scene_detection",
      "moment_detection",
      "audio_quality",
      "music_detection",
      "motion_analysis",
      "mood_analysis",
    ],
    isDefault: true,
    category: "custom",
    estimatedTime: 120,
  },
  vlog: {
    id: "preset-vlog",
    name: "Vlog",
    description: "Анализ для vlog контента",
    analyzers: ["face_detection", "mood_analysis", "scene_detection", "music_detection", "vlm_analysis"],
    isDefault: true,
    category: "custom",
    estimatedTime: 180,
  },
  interview: {
    id: "preset-interview",
    name: "Интервью",
    description: "Анализ интервью и разговорного контента",
    analyzers: [
      "face_detection",
      "speech_recognition",
      "audio_quality",
      "silence_detection",
      "scene_detection",
      "moment_detection",
    ],
    isDefault: true,
    category: "custom",
    estimatedTime: 150,
  },
  sports: {
    id: "preset-sports",
    name: "Спорт",
    description: "Анализ спортивных событий и матчей",
    analyzers: [
      "motion_analysis",
      "moment_detection",
      "scene_detection",
      "object_detection",
      "audio_quality",
      "sound_events",
    ],
    isDefault: true,
    category: "custom",
    estimatedTime: 140,
  },
  tutorial: {
    id: "preset-tutorial",
    name: "Обучение",
    description: "Анализ обучающих видео и туториалов",
    analyzers: [
      "speech_recognition",
      "scene_detection",
      "silence_detection",
      "quality_assessment",
      "vlm_analysis",
      "moment_detection",
    ],
    isDefault: true,
    category: "custom",
    estimatedTime: 200,
  },
  music_video: {
    id: "preset-music-video",
    name: "Музыкальное видео",
    description: "Анализ музыкальных клипов",
    analyzers: [
      "music_detection",
      "scene_detection",
      "motion_analysis",
      "composition_analysis",
      "mood_analysis",
      "face_detection",
    ],
    isDefault: true,
    category: "custom",
    estimatedTime: 130,
  },
}

/**
 * Получить все default preset'ы
 */
export function getDefaultPresets(): AnalyzerPreset[] {
  return Object.values(DEFAULT_PRESETS)
}

/**
 * Получить preset по ID
 */
export function getPresetById(id: string, customPresets: AnalyzerPreset[] = []): AnalyzerPreset | undefined {
  // Сначала ищем в default
  const defaultPreset = Object.values(DEFAULT_PRESETS).find((p) => p.id === id)
  if (defaultPreset) return defaultPreset

  // Затем в custom
  return customPresets.find((p) => p.id === id)
}

/**
 * Создать кастомный preset
 */
export function createCustomPreset(name: string, description: string, analyzers: AnalyzerType[]): AnalyzerPreset {
  return {
    id: `preset-custom-${Date.now()}`,
    name,
    description,
    analyzers,
    isDefault: false,
    category: "custom",
    estimatedTime: calculateEstimatedTime(analyzers),
  }
}

/**
 * Вычислить примерное время выполнения для набора анализаторов
 */
function calculateEstimatedTime(analyzers: AnalyzerType[]): number {
  // Базовое время для каждого типа анализатора (секунды на минуту видео)
  const timeMap: Record<AnalyzerType, number> = {
    scene_detection: 30,
    object_detection: 45,
    face_detection: 40,
    motion_analysis: 25,
    composition_analysis: 20,
    audio_quality: 15,
    speech_recognition: 60,
    music_detection: 20,
    sound_events: 15,
    silence_detection: 10,
    mood_analysis: 15,
    content_classification: 20,
    quality_assessment: 10,
    moment_detection: 25,
    vlm_analysis: 120,
  }

  return analyzers.reduce((total, type) => total + (timeMap[type] || 30), 0)
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

  if (preset.analyzers.length === 0) {
    errors.push("Preset должен содержать хотя бы один анализатор")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
