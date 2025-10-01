/**
 * Пользовательские эффекты для новой унифицированной системы
 * Управление пользовательскими пресетами и избранными эффектами
 */

import { invoke } from "@tauri-apps/api/core"
import { ProjectSchema } from "@/domains/video-editing/types/video-compiler"
import type { BaseEffect, EffectPreset } from "../types/unified-effects"

// Счетчик для генерации уникальных ID пресетов
let presetIdCounter = 1

/**
 * Интерфейс для пользовательского эффекта
 */
export interface UserEffect extends BaseEffect {
  createdAt: string
  updatedAt: string
  author?: string
  isCustom: true
}

/**
 * Интерфейс для коллекции пользовательских эффектов
 */
export interface UserEffectsCollection {
  version: string
  name: string
  description?: string
  effects: UserEffect[]
  createdAt: string
  updatedAt: string
}

/**
 * Сохраняет пользовательский эффект в файловую систему
 */
export async function saveUserEffect(effect: BaseEffect, fileName: string): Promise<string> {
  try {
    const userEffect: UserEffect = {
      ...effect,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true,
    }

    const filePath = await invoke<string>("save_user_effect", {
      fileName,
      effect: JSON.stringify(userEffect),
    })

    return filePath
  } catch (error) {
    console.error("Error saving user effect:", error)
    throw error
  }
}

/**
 * Загружает пользовательский эффект из файла
 */
export async function loadUserEffect(filePath: string): Promise<UserEffect> {
  try {
    const effectData = await invoke<string>("load_user_effect", { filePath })
    return JSON.parse(effectData) as UserEffect
  } catch (error) {
    console.error("Error loading user effect:", error)
    throw error
  }
}

/**
 * Сохраняет коллекцию эффектов в файл
 */
export async function saveEffectsCollection(collection: UserEffectsCollection, fileName: string): Promise<string> {
  try {
    const filePath = await invoke<string>("save_effects_collection", {
      fileName,
      collection: JSON.stringify(collection),
    })

    return filePath
  } catch (error) {
    console.error("Error saving effects collection:", error)
    throw error
  }
}

/**
 * Загружает коллекцию эффектов из файла
 */
export async function loadEffectsCollection(filePath: string): Promise<UserEffectsCollection> {
  try {
    const collectionData = await invoke<string>("load_effects_collection", { filePath })
    return JSON.parse(collectionData) as UserEffectsCollection
  } catch (error) {
    console.error("Error loading effects collection:", error)
    throw error
  }
}

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
 * Получает список всех пользовательских эффектов
 */
export async function getUserEffectsList(): Promise<string[]> {
  try {
    const files = await invoke<string[]>("get_user_effects_list")
    return files
  } catch (error) {
    console.error("Error getting user effects list:", error)
    return []
  }
}

/**
 * Удаляет пользовательский эффект
 */
export async function deleteUserEffect(filePath: string): Promise<void> {
  try {
    await invoke("delete_user_effect", { filePath })
  } catch (error) {
    console.error("Error deleting user effect:", error)
    throw error
  }
}

/**
 * Создает пользовательский эффект на основе существующего
 */
export async function duplicateAsUserEffect(effect: BaseEffect, newName: string, fileName: string): Promise<string> {
  const userEffect: BaseEffect = {
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

  return saveUserEffect(userEffect, fileName)
}

/**
 * Валидирует пользовательский эффект
 */
export function validateUserEffect(effect: any): effect is UserEffect {
  if (!effect || typeof effect !== "object") {
    return false
  }

  // Проверяем базовые поля BaseEffect
  const requiredFields = ["id", "name", "category", "scope", "parameters", "processors"]
  const hasBaseFields = requiredFields.every((field) => field in effect)

  // Проверяем специфичные для UserEffect поля
  const hasUserFields =
    "isCustom" in effect && effect.isCustom === true && "createdAt" in effect && "updatedAt" in effect

  return hasBaseFields && hasUserFields
}

/**
 * Создает коллекцию из массива эффектов
 */
export function createEffectsCollection(
  effects: BaseEffect[],
  name: string,
  description?: string,
): UserEffectsCollection {
  const now = new Date().toISOString()

  const userEffects: UserEffect[] = effects.map((effect) => ({
    ...effect,
    createdAt: now,
    updatedAt: now,
    isCustom: true,
  }))

  return {
    version: "2.0.0",
    name,
    description,
    effects: userEffects,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Мержит две коллекции эффектов
 */
export function mergeEffectsCollections(
  collection1: UserEffectsCollection,
  collection2: UserEffectsCollection,
): UserEffectsCollection {
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

// ============ Команды управления эффектами в проекте ============

/**
 * Добавить эффект к клипу
 */
export async function addEffectToClip(
  projectSchema: ProjectSchema,
  clipId: string,
  effectId: string,
): Promise<ProjectSchema> {
  try {
    return await invoke<ProjectSchema>("add_effect_to_clip", {
      clipId,
      effectId,
      projectSchema,
    })
  } catch (error) {
    console.error("Failed to add effect to clip:", error)
    throw error
  }
}

/**
 * Добавить фильтр к клипу
 */
export async function addFilterToClip(
  projectSchema: ProjectSchema,
  clipId: string,
  filterId: string,
): Promise<ProjectSchema> {
  try {
    return await invoke<ProjectSchema>("add_filter_to_clip", {
      clipId,
      filterId,
      projectSchema,
    })
  } catch (error) {
    console.error("Failed to add filter to clip:", error)
    throw error
  }
}

/**
 * Удалить эффект из клипа
 */
export async function removeEffectFromClip(
  projectSchema: ProjectSchema,
  clipId: string,
  effectId: string,
): Promise<ProjectSchema> {
  try {
    return await invoke<ProjectSchema>("remove_effect_from_clip", {
      clipId,
      effectId,
      projectSchema,
    })
  } catch (error) {
    console.error("Failed to remove effect from clip:", error)
    throw error
  }
}

/**
 * Удалить фильтр из клипа
 */
export async function removeFilterFromClip(
  projectSchema: ProjectSchema,
  clipId: string,
  filterId: string,
): Promise<ProjectSchema> {
  try {
    return await invoke<ProjectSchema>("remove_filter_from_clip", {
      clipId,
      filterId,
      projectSchema,
    })
  } catch (error) {
    console.error("Failed to remove filter from clip:", error)
    throw error
  }
}

/**
 * Создать новый эффект
 */
export async function createEffect(effectType: string, parameters: Record<string, any>): Promise<any> {
  try {
    return await invoke("create_effect", {
      effectType,
      parameters,
    })
  } catch (error) {
    console.error("Failed to create effect:", error)
    throw error
  }
}

/**
 * Создать новый фильтр
 */
export async function createFilter(filterType: string, parameters: Record<string, any>): Promise<any> {
  try {
    return await invoke("create_filter", {
      filterType,
      parameters,
    })
  } catch (error) {
    console.error("Failed to create filter:", error)
    throw error
  }
}
