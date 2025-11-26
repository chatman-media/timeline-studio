/**
 * Bridge between unified effects system and preview renderer
 * Конвертирует эффекты из унифицированной системы в формат preview
 */

import type { EffectManager } from "@/features/effects/services/effect-manager"
import type { AppliedEffect, BaseEffect, EffectCategory, EffectScope } from "@/features/effects/types/unified-effects"

import type { Effect, EffectType } from "../types"

/**
 * Преобразование scope из unified в preview формат
 */
function mapEffectScope(scope: EffectScope): "clip" | "track" | "global" {
  if (scope === "sequence") return "track" // sequence мапится на track
  return scope
}

/**
 * Маппинг категорий унифицированных эффектов в типы preview
 */
const CATEGORY_TO_PREVIEW_TYPE: Record<string, EffectType> = {
  color_correction: "color_correction",
  color_grading: "color_grading",
  color_match: "color_correction",
  luts: "lut",
  blur_sharpen: "blur",
  stylize: "film_emulation",
  distort: "lens_distortion",
  lighting: "vignette",
  noise_grain: "grain",
  transform: "transform",
  keying: "chroma_key",
  motion: "motion_blur",
  temporal: "motion_blur",
  audio_effects: "color_correction", // Fallback
  text_graphics: "color_correction", // Fallback
  transitions: "color_correction", // Fallback
}

/**
 * Конвертирует эффект из детализированной категории в базовый тип
 */
function getPreviewTypeFromEffect(effect: BaseEffect): EffectType {
  // Сначала проверяем прямое соответствие по ID
  if (effect.id.includes("blur")) return "blur"
  if (effect.id.includes("sharpen")) return "sharpen"
  if (effect.id.includes("glow")) return "glow"
  if (effect.id.includes("shadow")) return "shadow"
  if (effect.id.includes("glitch")) return "glitch"
  if (effect.id.includes("cartoon")) return "cartoon"
  if (effect.id.includes("chromatic")) return "chromatic_aberration"
  if (effect.id.includes("depth")) return "depth_of_field"

  // Затем используем маппинг категорий
  return CATEGORY_TO_PREVIEW_TYPE[effect.category] || "color_correction"
}

export class UnifiedEffectsBridge {
  private effectManager: EffectManager

  constructor(effectManager: EffectManager) {
    this.effectManager = effectManager
  }

  /**
   * Конвертирует BaseEffect в формат Preview Effect
   */
  convertToPreviewEffect(baseEffect: BaseEffect, appliedEffect?: AppliedEffect): Effect {
    const type = getPreviewTypeFromEffect(baseEffect)

    // Получаем параметры
    const params = this.extractParameters(baseEffect, appliedEffect)

    return {
      id: appliedEffect?.id || `preview_${baseEffect.id}`,
      type,
      enabled: appliedEffect?.enabled ?? true,
      parameters: this.convertParameters(type, params),
      intensity: params.intensity ?? params.mix ?? 1.0,
      category: baseEffect.category,
      scope: mapEffectScope(baseEffect.scope[0] || "clip"),
      blendMode: params.blendMode,
    }
  }

  /**
   * Извлекает параметры из эффекта
   */
  private extractParameters(baseEffect: BaseEffect, appliedEffect?: AppliedEffect): Record<string, any> {
    const params: Record<string, any> = {}

    // Сначала берем дефолтные параметры
    baseEffect.parameters.forEach((param) => {
      params[param.id] = param.defaultValue
    })

    // Если есть примененный эффект, перезаписываем значения
    if (appliedEffect) {
      // parameters is Record<string, any> per AppliedEffect type
      Object.entries(appliedEffect.parameters).forEach(([key, value]) => {
        params[key] = value
      })
    }

    return params
  }

  /**
   * Конвертирует параметры для конкретного типа эффекта
   */
  private convertParameters(type: EffectType, params: Record<string, any>): Record<string, any> {
    switch (type) {
      case "color_correction":
        return {
          brightness: params.brightness ?? params.luminance ?? 0,
          contrast: params.contrast ?? 1,
          saturation: params.saturation ?? 1,
          hue: params.hue ?? params.hue_shift ?? 0,
          temperature: params.temperature ?? 0,
          tint: params.tint ?? 0,
        }

      case "color_grading":
        return {
          lift: {
            r: params.lift_r ?? 0,
            g: params.lift_g ?? 0,
            b: params.lift_b ?? 0,
            luminance: params.lift_luminance ?? 0,
          },
          gamma: {
            r: params.gamma_r ?? 1,
            g: params.gamma_g ?? 1,
            b: params.gamma_b ?? 1,
            luminance: params.gamma_luminance ?? 1,
          },
          gain: {
            r: params.gain_r ?? 1,
            g: params.gain_g ?? 1,
            b: params.gain_b ?? 1,
            luminance: params.gain_luminance ?? 1,
          },
          offset: {
            r: params.offset_r ?? 0,
            g: params.offset_g ?? 0,
            b: params.offset_b ?? 0,
          },
        }

      case "blur":
        return {
          radius: params.radius ?? params.amount ?? 5,
          type: params.blur_type ?? "gaussian",
          direction: params.direction ?? 0,
        }

      case "glow":
        return {
          intensity: params.intensity ?? params.glow_intensity ?? 0.5,
          radius: params.radius ?? params.glow_radius ?? 20,
          threshold: params.threshold ?? params.glow_threshold ?? 0.5,
          color: params.glow_color ? [params.glow_color.r, params.glow_color.g, params.glow_color.b] : undefined,
        }

      case "glitch":
        return {
          type: params.glitch_type ?? "digital",
          intensity: params.intensity ?? params.glitch_amount ?? 0.5,
          frequency: params.frequency ?? params.glitch_frequency ?? 0.1,
          blockSize: params.block_size ?? 10,
        }

      case "film_emulation":
        return {
          type: params.film_type ?? "kodak",
          grain: params.grain_amount ?? 0.3,
          vignette: params.vignette_intensity ?? 0.2,
          colorShift: params.color_shift ?? 0.5,
        }

      case "vignette":
        return {
          intensity: params.intensity ?? 0.5,
          smoothness: params.smoothness ?? params.radius ?? 0.5,
        }

      case "grain":
        return {
          amount: params.grain_amount ?? params.amount ?? params.intensity ?? 0.1,
          size: params.grain_size ?? params.size ?? 1.0,
          time: performance.now() * 0.001,
        }

      case "transform":
        return {
          scaleX: params.scale_x ?? params.scale ?? 1,
          scaleY: params.scale_y ?? params.scale ?? 1,
          rotation: params.rotation ?? 0,
          translateX: params.position_x ?? params.x ?? 0,
          translateY: params.position_y ?? params.y ?? 0,
          skewX: params.skew_x ?? 0,
          skewY: params.skew_y ?? 0,
        }

      case "chroma_key":
        return {
          keyColor: params.key_color ?? [0, 255, 0],
          threshold: params.threshold ?? 0.4,
          smoothness: params.smoothness ?? 0.1,
          spill: params.spill_suppression ?? 0.2,
        }

      default:
        // Возвращаем параметры как есть для неизвестных типов
        return params
    }
  }

  /**
   * Получает все эффекты для preview из EffectManager
   */
  getAllPreviewEffects(): Effect[] {
    const allEffects = this.effectManager.getAllEffects()
    return allEffects.map((effect) => this.convertToPreviewEffect(effect))
  }

  /**
   * Получает эффекты по категории
   */
  getEffectsByCategory(category: EffectCategory): Effect[] {
    const effects = this.effectManager.getEffectsByCategory(category)
    return effects.map((effect) => this.convertToPreviewEffect(effect))
  }

  /**
   * Создает цепочку эффектов из пресета
   */
  createEffectChainFromPreset(_presetId: string): Effect[] {
    // Здесь можно интегрировать с системой пресетов
    const effects: Effect[] = []

    // TODO: Загрузить пресет и конвертировать его эффекты

    return effects
  }
}
