/**
 * Пользовательские эффекты - утилиты
 * Вспомогательные функции для работы с эффектами (без backend вызовов)
 *
 * Примечание: Функции с backend вызовами (invoke) перенесены в
 * @/domains/video-editing/services/effects
 */

import { createLogger } from "@/lib/tauri-logger"
import type { BaseEffect, EffectPreset } from "../types/unified-effects"

const logger = createLogger("UserEffectsUtils")

// Счетчик для генерации уникальных ID пресетов
let presetIdCounter = 1

/**
 * Экспортирует эффект с пользовательскими настройками
 */
export function prepareEffectForExport(
  effect: BaseEffect,
  customParams?: Record<string, any>,
  presetName?: string,
): BaseEffect {
  const exportEffect = { ...effect }

  // Если есть пользовательские параметры, создаем новый пресет
  if (customParams && presetName) {
    const customPreset: EffectPreset = {
      id: `custom_${presetIdCounter++}`,
      name: {
        ru: presetName,
        en: presetName,
      },
      description: {
        ru: "Пользовательская настройка",
        en: "Custom configuration",
      },
      parameters: customParams,
      tags: ["custom", "user"],
    }

    // В новой системе presets всегда массив
    if (Array.isArray(exportEffect.presets)) {
      exportEffect.presets = [...exportEffect.presets, customPreset]
    } else {
      // Если presets отсутствует, создаем массив
      exportEffect.presets = [customPreset]
    }
  }

  return exportEffect
}

/**
 * Создает пользовательский эффект на основе существующего
 */
export function duplicateEffect(effect: BaseEffect, newName: string): BaseEffect {
  return {
    ...effect,
    id: `user_effect_${Date.now()}`,
    name: {
      ...effect.name,
      en: newName,
      ru: newName,
    },
    version: "1.0.0",
    tags: [...(effect.tags || []), "custom", "user"],
  }
}

/**
 * Валидирует пользовательский эффект
 */
export function validateUserEffect(effect: any): boolean {
  if (!effect || typeof effect !== "object") {
    void logger.warn("Invalid effect: not an object")
    return false
  }

  // Проверяем базовые поля BaseEffect
  const requiredFields = ["id", "name", "category", "scope", "parameters", "processors"]
  const hasBaseFields = requiredFields.every((field) => {
    const hasField = field in effect
    if (!hasField) {
      void logger.warn(`Invalid effect: missing field "${field}"`)
    }
    return hasField
  })

  return hasBaseFields
}

/**
 * Создает коллекцию из массива эффектов
 */
export function createEffectsCollection(effects: BaseEffect[], name: string, description?: string) {
  const now = new Date().toISOString()

  return {
    version: "2.0.0",
    name,
    description,
    effects: effects.map((effect) => ({
      ...effect,
      createdAt: now,
      updatedAt: now,
      isCustom: true,
    })),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Мержит две коллекции эффектов
 */
export function mergeEffectsCollections(collection1: any, collection2: any) {
  const mergedEffects = [...collection1.effects]

  // Добавляем эффекты из второй коллекции, если их еще нет
  for (const effect of collection2.effects) {
    if (!mergedEffects.some((e) => e.id === effect.id)) {
      mergedEffects.push(effect)
    }
  }

  return {
    version: "2.0.0",
    name: `${collection1.name} + ${collection2.name}`,
    description: `Merged from "${collection1.name}" and "${collection2.name}"`,
    effects: mergedEffects,
    createdAt: collection1.createdAt,
    updatedAt: new Date().toISOString(),
  }
}

// ============================================================================
// РЕЭКСПОРТ ИЗ ДОМЕНА (для обратной совместимости)
// ============================================================================

export type { UserEffect, UserEffectsCollection } from "@/domains/video-editing/services/effects"
export {
  addEffectToClip,
  addFilterToClip,
  createEffect,
  createFilter,
  deleteUserEffect,
  getUserEffectsList,
  loadEffectsCollection,
  loadUserEffect,
  removeEffectFromClip,
  removeFilterFromClip,
  saveEffectsCollection,
  saveUserEffect,
} from "@/domains/video-editing/services/effects"
