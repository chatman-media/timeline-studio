/**
 * Effects Adapter - Bridge between different effect systems
 * Унифицирует работу с эффектами из разных модулей
 */

import type { AppliedEffect as BaseAppliedEffect, BaseEffect } from "@/features/effects/types/unified-effects"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { AppliedColorGrading, AppliedEffect, AppliedFilter } from "@/features/timeline/types"

import type { EffectType, Effect as PreviewEffect } from "../types"

/**
 * Unified Effect для работы preview системы
 */
export interface UnifiedEffect extends PreviewEffect {
  source: "effects" | "filters" | "timeline" | "color_grading"
  originalId: string
  appliedEffectId?: string
}

/**
 * Маппинг категорий эффектов в типы preview
 */
const CATEGORY_TO_PREVIEW_TYPE: Record<string, EffectType> = {
  color_correction: "color_correction",
  color_grading: "color_correction",
  color_match: "color_correction",
  luts: "lut",
  blur_sharpen: "blur",
  stylize: "color_correction",
  distort: "lens_distortion",
  lighting: "vignette",
  noise_grain: "grain",
  transform: "transform",
  keying: "chroma_key",
  motion: "blur",
  temporal: "color_correction",
  audio_effects: "color_correction",
  text_graphics: "color_correction",
  transitions: "color_correction",
}

/**
 * Конвертирует BaseEffect в PreviewEffect
 */
export function convertBaseEffect(
  baseEffect: BaseEffect,
  appliedEffect?: AppliedEffect | BaseAppliedEffect,
): UnifiedEffect | null {
  const previewType = CATEGORY_TO_PREVIEW_TYPE[baseEffect.category]
  if (!previewType) return null

  // Получаем параметры
  const params = extractParametersFromBaseEffect(baseEffect, appliedEffect)
  const intensity = params.intensity ?? 1.0

  return {
    id: appliedEffect?.id ?? `effect_${baseEffect.id}`,
    type: previewType,
    enabled: appliedEffect?.enabled ?? true,
    parameters: convertBaseEffectParameters(baseEffect, params),
    intensity: intensity,
    source: "effects",
    originalId: baseEffect.id,
    appliedEffectId: appliedEffect?.id,
  }
}

/**
 * Извлекает параметры из BaseEffect
 */
function extractParametersFromBaseEffect(
  baseEffect: BaseEffect,
  appliedEffect?: AppliedEffect | BaseAppliedEffect,
): Record<string, any> {
  const params: Record<string, any> = {}

  // Сначала берем дефолтные параметры
  baseEffect.parameters.forEach((param) => {
    params[param.id] = param.defaultValue
  })

  // Если есть примененный эффект, перезаписываем значения
  if (appliedEffect) {
    if ("customParams" in appliedEffect && appliedEffect.customParams) {
      Object.assign(params, appliedEffect.customParams)
    } else if ("parameters" in appliedEffect && appliedEffect.parameters) {
      // parameters может быть объектом (ключ-значение) или массивом
      if (Array.isArray(appliedEffect.parameters)) {
        appliedEffect.parameters.forEach((param: any) => {
          params[param.parameterId] = param.value
        })
      } else {
        // Если это объект (Record<string, any>)
        Object.assign(params, appliedEffect.parameters)
      }
    }
  }

  return params
}

/**
 * Конвертирует параметры BaseEffect в параметры preview
 */
function convertBaseEffectParameters(baseEffect: BaseEffect, params: Record<string, any>): Record<string, any> {
  const converted: Record<string, any> = {}

  // Обрабатываем по категориям
  switch (baseEffect.category) {
    case "color_correction":
    case "color_grading":
      // Стандартные параметры цветокоррекции
      converted.brightness = params.brightness ?? params.luminance ?? 0
      converted.contrast = params.contrast ?? 1
      converted.saturation = params.saturation ?? 1
      converted.hue = params.hue ?? params.hue_shift ?? 0
      converted.temperature = params.temperature ?? 0
      converted.tint = params.tint ?? 0

      // Lift/Gamma/Gain
      if (params.lift_r !== undefined || params.lift_luminance !== undefined) {
        converted.lift = {
          r: params.lift_r ?? 0,
          g: params.lift_g ?? 0,
          b: params.lift_b ?? 0,
          luminance: params.lift_luminance ?? 0,
        }
      }
      if (params.gamma_r !== undefined || params.gamma_luminance !== undefined) {
        converted.gamma = {
          r: params.gamma_r ?? 1,
          g: params.gamma_g ?? 1,
          b: params.gamma_b ?? 1,
          luminance: params.gamma_luminance ?? 1,
        }
      }
      if (params.gain_r !== undefined || params.gain_luminance !== undefined) {
        converted.gain = {
          r: params.gain_r ?? 1,
          g: params.gain_g ?? 1,
          b: params.gain_b ?? 1,
          luminance: params.gain_luminance ?? 1,
        }
      }
      break

    case "blur_sharpen":
      if (baseEffect.id.includes("blur")) {
        converted.radius = params.radius ?? params.amount ?? 5
        converted.direction = [1, 0]
      } else {
        converted.intensity = params.intensity ?? params.amount ?? 1
      }
      break

    case "lighting":
      if (baseEffect.id.includes("vignette")) {
        converted.intensity = params.intensity ?? 0.5
        converted.smoothness = params.smoothness ?? params.radius ?? 0.5
      }
      break

    case "noise_grain":
      converted.amount = params.grain_amount ?? params.amount ?? params.intensity ?? 0.1
      converted.size = params.grain_size ?? params.size ?? 1.0
      converted.time = performance.now() * 0.001
      break

    case "distort":
      if (baseEffect.id.includes("chromatic")) {
        converted.intensity = params.intensity ?? params.amount ?? 1.0
      }
      break

    case "transform":
      converted.scale = params.scale ?? 1
      converted.rotation = params.rotation ?? 0
      converted.x = params.x ?? 0
      converted.y = params.y ?? 0
      break

    case "keying":
      converted.color = params.key_color ?? [0, 255, 0]
      converted.threshold = params.threshold ?? 0.4
      converted.smoothness = params.smoothness ?? 0.1
      break

    default:
      // Копируем все параметры как есть
      Object.assign(converted, params)
      break
  }

  return converted
}

/**
 * Конвертирует VideoFilter в PreviewEffect
 */
export function convertVideoFilter(videoFilter: VideoFilter, appliedFilter?: AppliedFilter): UnifiedEffect | null {
  // Большинство фильтров это цветокоррекция
  const previewType: EffectType = "color_correction"

  const params = { ...videoFilter.params, ...appliedFilter?.customParams }
  const intensity = appliedFilter?.customParams?.intensity ?? 1.0

  return {
    id: appliedFilter?.id ?? `filter_${videoFilter.id}`,
    type: previewType,
    enabled: appliedFilter?.isEnabled ?? true,
    parameters: convertFilterParameters(videoFilter, params),
    intensity: intensity,
    source: "filters",
    originalId: videoFilter.id,
    appliedEffectId: appliedFilter?.id,
  }
}

/**
 * Конвертирует AppliedColorGrading в PreviewEffect
 */
export function convertColorGrading(colorGrading: AppliedColorGrading): UnifiedEffect {
  const params = convertColorGradingParameters(colorGrading)

  return {
    id: colorGrading.id,
    type: "color_correction",
    enabled: colorGrading.isEnabled,
    parameters: params,
    intensity: 1.0,
    source: "color_grading",
    originalId: colorGrading.id,
  }
}

/**
 * Конвертирует параметры VideoFilter
 */
function convertFilterParameters(_filter: VideoFilter, params: Record<string, any>): Record<string, any> {
  const converted: Record<string, any> = {}

  // Стандартные параметры цветокоррекции
  converted.brightness = params.brightness || 0
  converted.contrast = params.contrast || 1
  converted.saturation = params.saturation || 1
  converted.hue = params.hue || 0
  converted.temperature = params.temperature || 0
  converted.tint = params.tint || 0

  return converted
}

/**
 * Конвертирует AppliedColorGrading в параметры preview
 */
function convertColorGradingParameters(colorGrading: AppliedColorGrading): Record<string, any> {
  const basic = colorGrading.basicParameters

  return {
    brightness: basic.luminance / 100, // -100-100 -> -1-1
    contrast: 1 + basic.contrast / 100, // -100-100 -> 0-2
    saturation: 1 + basic.saturation / 100, // -100-100 -> 0-2
    hue: basic.hue, // -180-180
    temperature: basic.temperature / 5, // -100-100 -> -20-20
    tint: basic.tint / 5, // -100-100 -> -20-20
  }
}

/**
 * Получить все доступные эффекты из всех источников
 */
export function getAllAvailableEffects(
  effects: BaseEffect[] = [],
  filters: VideoFilter[] = [],
  appliedEffects: AppliedEffect[] = [],
  appliedFilters: AppliedFilter[] = [],
  appliedColorGrading: AppliedColorGrading[] = [],
): UnifiedEffect[] {
  const result: UnifiedEffect[] = []

  // Добавляем применённые эффекты
  for (const applied of appliedEffects) {
    const baseEffect = effects.find((e) => e.id === applied.effectId)
    if (baseEffect) {
      const converted = convertBaseEffect(baseEffect, applied)
      if (converted) result.push(converted)
    }
  }

  // Добавляем применённые фильтры
  for (const applied of appliedFilters) {
    const baseFilter = filters.find((f) => f.id === applied.filterId)
    if (baseFilter) {
      const converted = convertVideoFilter(baseFilter, applied)
      if (converted) result.push(converted)
    }
  }

  // Добавляем цветокоррекцию
  for (const colorGrading of appliedColorGrading) {
    const converted = convertColorGrading(colorGrading)
    result.push(converted)
  }

  // Сортируем по order для правильной последовательности применения
  return result.sort((a, b) => {
    const orderA = appliedEffects.find((ae) => ae.id === a.appliedEffectId)?.order ?? 0
    const orderB = appliedEffects.find((ae) => ae.id === b.appliedEffectId)?.order ?? 0
    return orderA - orderB
  })
}

/**
 * Фильтрация эффектов по времени
 */
export function filterEffectsByTime(
  effects: UnifiedEffect[],
  currentTime: number,
  appliedEffects: AppliedEffect[] = [],
  appliedFilters: AppliedFilter[] = [],
): UnifiedEffect[] {
  return effects.filter((effect) => {
    // Находим соответствующий applied effect
    const applied =
      appliedEffects.find((ae) => ae.id === effect.appliedEffectId) ||
      appliedFilters.find((af) => af.id === effect.appliedEffectId)

    if (!applied) return true // Эффекты без временных ограничений всегда активны

    // Проверяем временные границы
    if (applied.startTime !== undefined && currentTime < applied.startTime) return false
    if (applied.duration !== undefined && applied.startTime !== undefined) {
      const endTime = applied.startTime + applied.duration
      if (currentTime > endTime) return false
    }

    return true
  })
}
