/**
 * Загрузчик эффектов
 * Автоматически загружает все эффекты из JSON файлов
 */

import { createLogger } from "@/lib/tauri-logger"
import type { BaseEffect } from "../types/unified-effects"
// Импорт эффектов по категориям
import artisticEffects from "./effects/artistic-effects.json"
import cinematicEffects from "./effects/cinematic-effects.json"
import colorCorrectionEffects from "./effects/color-correction-effects.json"
import creativeEffects from "./effects/creative-effects.json"
import distortionEffects from "./effects/distortion-effects.json"
import motionEffects from "./effects/motion-effects.json"
import technicalEffects from "./effects/technical-effects.json"
import vintageEffects from "./effects/vintage-effects.json"

const logger = createLogger("EffectsLoader")

// Типизация для мигрированных данных
interface MigratedEffectsData {
  version: string
  category: string
  migratedAt: string
  stats: {
    total: number
    migrated: number
    skipped: number
    successRate: string
    errors: Array<{ effectId: string; error: string }>
  }
  effects: any[] // Используем any[], так как JSON содержит строковые значения вместо enum
}

// Функция для извлечения эффектов из мигрированных данных
function extractEffects(data: MigratedEffectsData): BaseEffect[] {
  return data.effects || []
}

// Экспорт всех эффектов по категориям
export const effectsByCategory = {
  colorCorrection: extractEffects(colorCorrectionEffects as MigratedEffectsData),
  vintage: extractEffects(vintageEffects as MigratedEffectsData),
  artistic: extractEffects(artisticEffects as MigratedEffectsData),
  cinematic: extractEffects(cinematicEffects as MigratedEffectsData),
  creative: extractEffects(creativeEffects as MigratedEffectsData),
  technical: extractEffects(technicalEffects as MigratedEffectsData),
  motion: extractEffects(motionEffects as MigratedEffectsData),
  distortion: extractEffects(distortionEffects as MigratedEffectsData),
}

// Все эффекты в одном массиве
export const allEffects: BaseEffect[] = [
  ...effectsByCategory.colorCorrection,
  ...effectsByCategory.vintage,
  ...effectsByCategory.artistic,
  ...effectsByCategory.cinematic,
  ...effectsByCategory.creative,
  ...effectsByCategory.technical,
  ...effectsByCategory.motion,
  ...effectsByCategory.distortion,
]

// Статистика эффектов
export const effectsStats = {
  totalCategories: 8,
  totalEffects: allEffects.length,
  effectsByCategory: {
    colorCorrection: effectsByCategory.colorCorrection.length,
    vintage: effectsByCategory.vintage.length,
    artistic: effectsByCategory.artistic.length,
    cinematic: effectsByCategory.cinematic.length,
    creative: effectsByCategory.creative.length,
    technical: effectsByCategory.technical.length,
    motion: effectsByCategory.motion.length,
    distortion: effectsByCategory.distortion.length,
  },
}

// Функция для загрузки эффектов в EffectManager
export function loadEffects(effectManager: any) {
  let loaded = 0
  let errors = 0

  for (const effect of allEffects) {
    try {
      effectManager.registerEffect(effect)
      loaded++
    } catch (error) {
      void logger.error(`Failed to register effect ${effect.id}`, { error })
      errors++
    }
  }

  void logger.info(`✅ Loaded ${loaded} effects`)
  if (errors > 0) {
    void logger.warn(`⚠️  Failed to load ${errors} effects`)
  }

  return { loaded, errors }
}

// Функция для поиска эффекта по ID
export function findEffect(effectId: string): BaseEffect | undefined {
  return allEffects.find((effect) => effect.id === effectId)
}

// Функция для получения эффектов по категории
export function getEffectsByCategory(category: string): BaseEffect[] {
  return allEffects.filter((effect) => effect.category === category)
}

// Функция для получения эффектов по тегам
export function getEffectsByTags(tags: string[]): BaseEffect[] {
  return allEffects.filter((effect) => tags.some((tag) => effect.tags.includes(tag)))
}

// Экспорт для обратной совместимости
export {
  allEffects as allMigratedEffects,
  allEffects as migratedEffectsLibrary,
  effectsByCategory as migratedEffects,
  loadEffects as loadMigratedEffects,
  findEffect as findMigratedEffect,
  getEffectsByCategory as getMigratedEffectsByCategory,
  getEffectsByTags as getMigratedEffectsByTags,
  effectsStats as migrationStats,
}
