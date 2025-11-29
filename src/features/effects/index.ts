/**
 * Unified Effects System - Единая система эффектов
 * Главный экспорт новой архитектуры эффектов
 */

// ============================================================================
// ТИПЫ
// ============================================================================

// Импорты для createEffectManager
import { loadMigratedEffects as loadMigratedEffectsFn } from "./data/effects-loader"
import { basicEffectsLibrary } from "./presets/basic-effects"
import { colorCorrectionEffectsLibrary } from "./presets/color-correction-effects"
import { stylizeEffectsLibrary } from "./presets/stylize-effects"
import { EffectManager } from "./services/effect-manager"
import { WebGL2UnifiedRenderer } from "./services/webgl2-unified-renderer"

// Импорт типов для утилит
import type {
  BaseEffect,
  EffectCategory,
  EffectParameter,
  EffectPreset,
  EffectProcessingType,
  EffectScope,
  ParameterType,
} from "./types/unified-effects"

export type {
  // Интерфейсы эффектов
  BaseEffect,
  BlendMode,
  CanvasProcessor,
  CSSProcessor,
  // Кеширование
  EffectCache,
  // Основные типы
  EffectCategory,
  // События
  EffectEvent,
  EffectEventCallback,
  EffectEventType,
  // Экспорт/импорт
  EffectExportData,
  EffectGroup,
  EffectKeyframe,
  EffectMask,
  EffectParameter,
  EffectPreset,
  EffectProcessingType,
  EffectScope,
  EffectStack,
  FFmpegProcessor,
  ParameterType,
  // Процессоры
  WebGLProcessor,
} from "./types/unified-effects"

// ============================================================================
// СЕРВИСЫ
// ============================================================================

export { EffectManager } from "./services/effect-manager"
export { WebGL2EffectProcessor } from "./services/webgl2-effect-processor"
export {
  type RenderContext,
  type RenderResult,
  WebGL2UnifiedRenderer,
  WebGL2UnifiedRenderer as UnifiedEffectsRenderer,
} from "./services/webgl2-unified-renderer"

// ============================================================================
// ХУКИ
// ============================================================================

export { useUnifiedEffects } from "./hooks/use-unified-effects"
export type { UseUserPresetsOptions, UseUserPresetsReturn } from "./hooks/use-user-presets"
export { useUserPresets } from "./hooks/use-user-presets"

// ============================================================================
// БИБЛИОТЕКИ ЭФФЕКТОВ
// ============================================================================

// Мигрированные эффекты
export {
  allMigratedEffects,
  findMigratedEffect,
  getMigratedEffectsByCategory,
  getMigratedEffectsByTags,
  loadMigratedEffects,
  migratedEffects,
  migratedEffectsLibrary,
  migrationStats,
} from "./data/effects-loader"
export {
  basicEffectsLibrary,
  colorCorrectionEffect,
  gaussianBlurEffect,
  vintageEffect,
} from "./presets/basic-effects"
export {
  colorCorrectionEffectsLibrary,
  colorWheelsEffect,
  hslCorrectionEffect,
  liftGammaGainEffect,
} from "./presets/color-correction-effects"
export {
  cartoonEffect,
  filmEmulationEffect,
  glitchEffect,
  stylizeEffectsLibrary,
} from "./presets/stylize-effects"

// ============================================================================
// УТИЛИТЫ
// ============================================================================

/**
 * Создает новый менеджер эффектов с предустановленными эффектами
 */
export function createEffectManager(
  options: { loadBasicEffects?: boolean; loadMigratedEffects?: boolean; loadProfessionalEffects?: boolean } = {},
): EffectManager {
  const { loadBasicEffects = true, loadMigratedEffects = true, loadProfessionalEffects = true } = options

  const manager = new EffectManager()

  if (loadBasicEffects) {
    manager.registerEffects(basicEffectsLibrary)
  }

  if (loadProfessionalEffects) {
    manager.registerEffects(colorCorrectionEffectsLibrary)
    manager.registerEffects(stylizeEffectsLibrary)
  }

  if (loadMigratedEffects) {
    loadMigratedEffectsFn(manager)
  }

  return manager
}

/**
 * Создает новый рендерер эффектов
 */
export function createEffectRenderer(): WebGL2UnifiedRenderer {
  return new WebGL2UnifiedRenderer()
}

/**
 * Создает новый WebGL2 рендерер эффектов
 */
export function createWebGL2EffectRenderer(): WebGL2UnifiedRenderer {
  return new WebGL2UnifiedRenderer()
}

/**
 * Проверяет совместимость эффекта с областью применения
 */
export function isEffectCompatible(effect: BaseEffect, targetScope: EffectScope): boolean {
  return effect.scope.includes(targetScope)
}

/**
 * Получает все категории эффектов
 */
export function getAllEffectCategories(): EffectCategory[] {
  return [
    "color_correction",
    "color_grading",
    "color_match",
    "luts",
    "blur_sharpen",
    "stylize",
    "distort",
    "lighting",
    "noise_grain",
    "transform",
    "keying",
    "motion",
    "temporal",
    "audio_effects",
    "text_graphics",
    "transitions",
  ]
}

/**
 * Получает все области применения эффектов
 */
export function getAllEffectScopes(): EffectScope[] {
  return ["clip", "track", "sequence", "global"]
}

/**
 * Получает все типы обработки эффектов
 */
export function getAllProcessingTypes(): EffectProcessingType[] {
  return ["realtime", "render", "hybrid"]
}

/**
 * Создает базовый параметр эффекта
 */
export function createEffectParameter(
  id: string,
  name: { en: string; ru: string },
  type: ParameterType,
  defaultValue: any,
  options?: Partial<EffectParameter>,
): EffectParameter {
  return {
    id,
    name,
    type,
    defaultValue,
    animatable: true,
    visible: true,
    enabled: true,
    ...options,
  }
}

/**
 * Создает базовый пресет эффекта
 */
export function createEffectPreset(
  id: string,
  name: { en: string; ru: string },
  parameters: Record<string, any>,
  options?: Partial<EffectPreset>,
): EffectPreset {
  return {
    id,
    name,
    parameters,
    tags: [],
    ...options,
  }
}

/**
 * Валидирует структуру BaseEffect
 */
export function validateEffect(effect: BaseEffect): string[] {
  const errors: string[] = []

  if (!effect.id) errors.push("Effect ID is required")
  if (!effect.name.en) errors.push("Effect name (English) is required")
  if (!effect.category) errors.push("Effect category is required")
  if (!effect.scope || effect.scope.length === 0) {
    errors.push("Effect scope is required")
  }
  if (!effect.version) errors.push("Effect version is required")
  if (!effect.parameters) errors.push("Effect parameters are required")

  // Проверяем процессоры
  if (!effect.processors || Object.keys(effect.processors).length === 0) {
    errors.push("At least one processor is required")
  }

  // Валидируем параметры
  for (const param of effect.parameters) {
    if (!param.id) errors.push(`Parameter ID is required: ${param.name.en}`)
    if (!param.name.en) errors.push(`Parameter name (English) is required: ${param.id}`)
    if (param.defaultValue === undefined) {
      errors.push(`Parameter default value is required: ${param.id}`)
    }
  }

  return errors
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

export const EFFECT_CATEGORIES: Record<EffectCategory, { en: string; ru: string }> = {
  color_correction: { en: "Color Correction", ru: "Цветокоррекция" },
  color_grading: { en: "Color Grading", ru: "Цветовая градация" },
  color_match: { en: "Color Match", ru: "Сопоставление цветов" },
  luts: { en: "LUTs", ru: "LUT таблицы" },
  blur_sharpen: { en: "Blur & Sharpen", ru: "Размытие и резкость" },
  stylize: { en: "Stylize", ru: "Стилизация" },
  distort: { en: "Distort", ru: "Искажение" },
  lighting: { en: "Lighting", ru: "Освещение" },
  noise_grain: { en: "Noise & Grain", ru: "Шум и зерно" },
  transform: { en: "Transform", ru: "Преобразование" },
  keying: { en: "Keying", ru: "Кеинг" },
  motion: { en: "Motion", ru: "Движение" },
  temporal: { en: "Temporal", ru: "Временные" },
  audio_effects: { en: "Audio Effects", ru: "Аудио эффекты" },
  text_graphics: { en: "Text & Graphics", ru: "Текст и графика" },
  transitions: { en: "Transitions", ru: "Переходы" },
}

export const EFFECT_SCOPES: Record<EffectScope, { en: string; ru: string }> = {
  clip: { en: "Clip", ru: "Клип" },
  track: { en: "Track", ru: "Трек" },
  sequence: { en: "Sequence", ru: "Последовательность" },
  global: { en: "Global", ru: "Глобальный" },
}

export const PROCESSING_TYPES: Record<EffectProcessingType, { en: string; ru: string }> = {
  realtime: { en: "Real-time", ru: "Реальное время" },
  render: { en: "Render", ru: "Рендеринг" },
  hybrid: { en: "Hybrid", ru: "Гибридный" },
}

// ============================================================================
// МИГРАЦИЯ ИЗ СТАРОЙ СИСТЕМЫ
// ============================================================================

/**
 * Конвертирует старый VideoEffect в новый BaseEffect
 * Для совместимости со старой системой
 */
export function migrateVideoEffect(oldEffect: any): BaseEffect {
  // Базовая конвертация - можно расширить по мере необходимости
  return {
    id: oldEffect.id,
    name: {
      en: oldEffect.name || oldEffect.labels?.en || "Unknown Effect",
      ru: oldEffect.labels?.ru || oldEffect.name || "Неизвестный эффект",
    },
    category: mapOldCategoryToNew(oldEffect.category || "stylize"),
    scope: ["clip"], // По умолчанию только для клипов
    processingType: "hybrid",
    version: "1.0.0",
    tags: oldEffect.tags || [],
    complexity: mapOldComplexityToNew(oldEffect.complexity || "basic"),
    gpuAccelerated: false,
    parameters: migrateParameters(oldEffect.params || {}),
    presets: oldEffect.presets
      ? Object.entries(oldEffect.presets).map(([id, preset]: [string, any]) => ({
          id,
          name: preset.name || { en: id, ru: id },
          parameters: preset.params || {},
          tags: [],
        }))
      : [],
    processors: {
      css: oldEffect.cssFilter
        ? {
            filter: oldEffect.cssFilter,
          }
        : undefined,
      ffmpeg: oldEffect.ffmpegCommand
        ? {
            filter: oldEffect.ffmpegCommand,
          }
        : undefined,
    },
  }
}

function mapOldCategoryToNew(oldCategory: string): EffectCategory {
  const mapping: Record<string, EffectCategory> = {
    "color-correction": "color_correction",
    artistic: "stylize",
    vintage: "stylize",
    cinematic: "stylize",
    creative: "stylize",
    technical: "color_correction",
    motion: "motion",
    distortion: "distort",
  }

  return mapping[oldCategory] || "stylize"
}

function mapOldComplexityToNew(oldComplexity: string): "low" | "medium" | "high" | "extreme" {
  const mapping: Record<string, "low" | "medium" | "high" | "extreme"> = {
    basic: "low",
    intermediate: "medium",
    advanced: "high",
  }

  return mapping[oldComplexity] || "medium"
}

function migrateParameters(oldParams: Record<string, any>): EffectParameter[] {
  return Object.entries(oldParams).map(([id, value]) => ({
    id,
    name: { en: id.charAt(0).toUpperCase() + id.slice(1), ru: id },
    type: typeof value === "number" ? "number" : ("text" as ParameterType),
    defaultValue: value,
    animatable: true,
    visible: true,
    enabled: true,
  }))
}
