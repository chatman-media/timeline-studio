/**
 * Analyzer Presets - Предустановленные комбинации анализаторов
 */

import type { AnalyzerType } from "./analysis-progress"

export interface AnalyzerPreset {
  id: string
  name: string
  description: string
  analyzers: Set<AnalyzerType>
  isDefault: boolean // Встроенный preset или кастомный
  category: "speed" | "quality" | "custom"
  estimatedTime: string // Примерное время (строка для отображения)
}

/**
 * Встроенные preset'ы
 */
export const DEFAULT_PRESETS: AnalyzerPreset[] = [
  {
    id: "quick-scan",
    name: "Быстрый",
    description: "Базовый анализ для быстрого результата",
    analyzers: new Set(["scene_detection", "audio_quality", "moment_detection"]),
    isDefault: true,
    category: "speed",
    estimatedTime: "< 1 min",
  },
  {
    id: "balanced-analysis",
    name: "Сбалансированный",
    description: "Оптимальный баланс скорости и качества",
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
  },
  {
    id: "deep-analysis",
    name: "Максимальное качество",
    description: "Complete analysis with all available analyzers",
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
  },
  {
    id: "montage-focus",
    name: "Фокус на монтаж",
    description: "Анализ оптимизирован для создания нарезок",
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
  },
  {
    id: "quality-focus",
    name: "Фокус на качество",
    description: "Анализ качества контента",
    analyzers: new Set(["quality_assessment", "composition_analysis", "scene_detection", "audio_quality"]),
    isDefault: true,
    category: "quality",
    estimatedTime: "1-2 min",
  },
]

/**
 * Получить все default preset'ы
 */
export function getDefaultPresets(): AnalyzerPreset[] {
  return DEFAULT_PRESETS
}

/**
 * Получить preset по ID
 */
export function getPresetById(id: string, customPresets: AnalyzerPreset[] = []): AnalyzerPreset | undefined {
  // Сначала ищем в default
  const defaultPreset = DEFAULT_PRESETS.find((p) => p.id === id)
  if (defaultPreset) return defaultPreset

  // Затем в custom
  return customPresets.find((p) => p.id === id)
}

/**
 * Создать кастомный preset
 */
export function createCustomPreset(name: string, description: string, analyzers: Set<AnalyzerType>): AnalyzerPreset {
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
function calculateEstimatedTime(analyzers: Set<AnalyzerType>): string {
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

  if (preset.analyzers.length === 0) {
    errors.push("Preset должен содержать хотя бы один анализатор")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
