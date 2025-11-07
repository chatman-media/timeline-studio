/**
 * Процессор эффектов для новой унифицированной системы
 * Обрабатывает и валидирует эффекты BaseEffect
 */

import { createLogger } from "@/lib/tauri-logger"
import type { BaseEffect, EffectParameter, EffectPreset } from "../types/unified-effects"

const logger = createLogger("EffectProcessor")

/**
 * Интерфейс для сырых данных эффекта из JSON (старый формат)
 */
interface RawEffectData {
  id: string
  name: string
  type: string
  duration: number
  category: string
  complexity: string
  tags: string[]
  description: {
    ru: string
    en: string
    [key: string]: string
  }
  ffmpegCommand: string
  cssFilter?: string
  params: Record<string, any>
  previewPath: string
  labels: {
    ru: string
    en: string
    [key: string]: string
  }
  presets?: Record<string, any>
}

/**
 * Создает функцию из строкового шаблона с параметрами
 */
function createFunctionFromTemplate(template: string | undefined | null) {
  return (params: Record<string, any> = {}) => {
    if (typeof template !== "string") {
      return ""
    }

    return template.replace(/\{(\w+)\}/g, (match, key) => {
      const value = params[key]
      return value !== undefined ? value.toString() : match
    })
  }
}

/**
 * Конвертирует старые параметры в новый формат EffectParameter
 */
function convertParameters(oldParams: Record<string, any>): EffectParameter[] {
  return Object.entries(oldParams).map(([id, defaultValue]) => {
    const type = typeof defaultValue === "number" ? "number" : typeof defaultValue === "boolean" ? "boolean" : "text"

    const param: EffectParameter = {
      id,
      name: {
        en:
          id.charAt(0).toUpperCase() +
          id
            .slice(1)
            .replace(/([A-Z])/g, " $1")
            .trim(),
        ru: translateParameterName(id),
      },
      type: type as any,
      defaultValue,
      animatable: type === "number",
      visible: true,
      enabled: true,
    }

    // Добавляем ограничения для известных параметров
    if (type === "number") {
      const ranges = getParameterRange(id)
      if (ranges) {
        Object.assign(param, ranges)
      }
    }

    return param
  })
}

/**
 * Получает диапазон значений для параметра
 */
function getParameterRange(paramId: string): { min: number; max: number; step: number } | null {
  const ranges: Record<string, { min: number; max: number; step: number }> = {
    intensity: { min: 0, max: 2, step: 0.01 },
    brightness: { min: -1, max: 1, step: 0.01 },
    contrast: { min: 0, max: 2, step: 0.01 },
    saturation: { min: 0, max: 2, step: 0.01 },
    hue: { min: -180, max: 180, step: 1 },
    temperature: { min: -100, max: 100, step: 1 },
    tint: { min: -100, max: 100, step: 1 },
    radius: { min: 0, max: 100, step: 0.1 },
    amount: { min: 0, max: 100, step: 1 },
    speed: { min: 0.1, max: 10, step: 0.1 },
    angle: { min: 0, max: 360, step: 1 },
    threshold: { min: 0, max: 1, step: 0.01 },
  }

  return ranges[paramId] || null
}

/**
 * Переводит название параметра
 */
function translateParameterName(id: string): string {
  const translations: Record<string, string> = {
    intensity: "Интенсивность",
    brightness: "Яркость",
    contrast: "Контраст",
    saturation: "Насыщенность",
    hue: "Оттенок",
    temperature: "Температура",
    tint: "Тонирование",
    radius: "Радиус",
    amount: "Количество",
    speed: "Скорость",
    angle: "Угол",
    threshold: "Порог",
  }

  return translations[id] || id
}

/**
 * Конвертирует пресеты в новый формат
 */
function convertPresets(oldPresets?: Record<string, any>): EffectPreset[] {
  if (!oldPresets) return []

  return Object.entries(oldPresets).map(([id, preset]) => ({
    id,
    name: preset.name || { en: id, ru: id },
    description: preset.description,
    parameters: preset.params || {},
    tags: [],
  }))
}

/**
 * Обрабатывает сырые данные эффекта и преобразует в BaseEffect
 */
export function processEffect(rawEffect: RawEffectData): BaseEffect {
  if (!rawEffect || typeof rawEffect !== "object") {
    throw new Error("processEffect: Invalid effect data")
  }

  if (!rawEffect.id || !rawEffect.name) {
    throw new Error(`processEffect: Effect missing required fields - id: ${rawEffect.id}, name: ${rawEffect.name}`)
  }

  // Конвертируем в новый формат BaseEffect
  const processedEffect: BaseEffect = {
    // Основная информация
    id: `effect_${rawEffect.id}`,
    name: rawEffect.labels || {
      en: rawEffect.name,
      ru: rawEffect.name,
    },
    description: rawEffect.description,

    // Категория и область применения
    category: mapOldCategoryToNew(rawEffect.category),
    scope: determineScope(rawEffect),
    processingType: determineProcessingType(rawEffect),

    // Версия и метаданные
    version: "1.0.0",
    tags: rawEffect.tags || [],
    complexity: mapComplexity(rawEffect.complexity),
    gpuAccelerated: !!rawEffect.cssFilter,

    // Параметры
    parameters: convertParameters(rawEffect.params || {}),
    presets: convertPresets(rawEffect.presets),

    // Превью
    preview: rawEffect.previewPath,

    // Процессоры
    processors: {
      css: rawEffect.cssFilter
        ? {
            filter: createFunctionFromTemplate(rawEffect.cssFilter),
          }
        : undefined,
      ffmpeg: {
        filter: createFunctionFromTemplate(rawEffect.ffmpegCommand),
      },
    },
  }

  return processedEffect
}

/**
 * Маппинг старых категорий в новые
 */
function mapOldCategoryToNew(oldCategory: string): any {
  const mapping: Record<string, string> = {
    "color-correction": "color_correction",
    vintage: "stylize",
    artistic: "stylize",
    cinematic: "stylize",
    creative: "stylize",
    technical: "color_correction",
    motion: "motion",
    distortion: "distort",
  }

  return mapping[oldCategory] || "stylize"
}

/**
 * Определяет область применения эффекта
 */
function determineScope(effect: RawEffectData): Array<"clip" | "track" | "sequence" | "global"> {
  // Временные эффекты только для клипов
  if (["speed", "reverse"].includes(effect.type)) {
    return ["clip"]
  }

  // Цветокоррекция может применяться везде
  if (effect.category === "color-correction") {
    return ["clip", "track", "sequence"]
  }

  // По умолчанию - клип и трек
  return ["clip", "track"]
}

/**
 * Определяет тип обработки
 */
function determineProcessingType(effect: RawEffectData): "realtime" | "render" | "hybrid" {
  if (effect.cssFilter && !effect.ffmpegCommand) {
    return "realtime"
  }

  if (effect.ffmpegCommand && !effect.cssFilter) {
    return "render"
  }

  return "hybrid"
}

/**
 * Маппинг сложности
 */
function mapComplexity(oldComplexity: string): "low" | "medium" | "high" | "extreme" {
  const mapping: Record<string, "low" | "medium" | "high" | "extreme"> = {
    basic: "low",
    intermediate: "medium",
    advanced: "high",
  }

  return mapping[oldComplexity] || "medium"
}

/**
 * Обрабатывает массив сырых эффектов
 */
export function processEffects(rawEffects: RawEffectData[]): BaseEffect[] {
  if (!Array.isArray(rawEffects)) {
    logger.error("processEffects: rawEffects is not an array", rawEffects)
    return []
  }

  return rawEffects
    .filter((effect) => effect != null)
    .map((effect) => {
      try {
        return processEffect(effect)
      } catch (error) {
        logger.error("processEffects: Failed to process effect", effect, error)
        return null
      }
    })
    .filter((effect): effect is BaseEffect => effect !== null)
}

/**
 * Валидирует структуру эффекта
 */
export function validateEffect(effect: any): effect is BaseEffect {
  if (!effect || typeof effect !== "object") {
    return false
  }

  const requiredFields = ["id", "name", "category", "scope", "processingType", "parameters", "processors"]
  return requiredFields.every((field) => field in effect && effect[field] !== undefined)
}

/**
 * Валидирует массив эффектов
 */
export function validateEffectsData(data: any): boolean {
  if (!data || !Array.isArray(data.effects)) {
    logger.error("validateEffectsData: Invalid data structure", data)
    return false
  }

  const validEffects = data.effects.filter((effect: any) => effect != null)
  if (validEffects.length !== data.effects.length) {
    logger.warn(`validateEffectsData: Found ${data.effects.length - validEffects.length} null/undefined effects`)
  }

  return validEffects.every(validateEffect)
}

/**
 * Создает fallback эффект в случае ошибки
 */
export function createFallbackEffect(id: string): BaseEffect {
  return {
    id: `effect_${id}`,
    name: {
      en: "Unknown Effect",
      ru: "Неизвестный эффект",
    },
    description: {
      en: "Effect not found",
      ru: "Эффект не найден",
    },
    category: "color_correction",
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    tags: [],
    complexity: "low",
    gpuAccelerated: false,
    parameters: [
      {
        id: "intensity",
        name: { en: "Intensity", ru: "Интенсивность" },
        type: "number",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.01,
        animatable: true,
        visible: true,
        enabled: true,
      },
    ],
    presets: [],
    processors: {
      css: {
        filter: () => "brightness(1)",
      },
      ffmpeg: {
        filter: () => "null",
      },
    },
  }
}
