/**
 * User Effects Service
 * Управление пользовательскими эффектами
 * Операции с файловой системой и backend командами
 */

import { invoke } from "@tauri-apps/api/core"
import type { ProjectSchema } from "@/domains/video-editing/types/video-compiler"
import type { BaseEffect } from "@/features/effects/types/unified-effects"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("UserEffectsService")

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

// ============================================================================
// CRUD ОПЕРАЦИИ С ПОЛЬЗОВАТЕЛЬСКИМИ ЭФФЕКТАМИ
// ============================================================================

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

    void logger.info("User effect saved", { fileName, filePath })
    return filePath
  } catch (error) {
    void logger.error("Error saving user effect", { error })
    throw error
  }
}

/**
 * Загружает пользовательский эффект из файла
 */
export async function loadUserEffect(filePath: string): Promise<UserEffect> {
  try {
    const effectData = await invoke<string>("load_user_effect", { filePath })
    const effect = JSON.parse(effectData) as UserEffect

    void logger.info("User effect loaded", { filePath })
    return effect
  } catch (error) {
    void logger.error("Error loading user effect", { error })
    throw error
  }
}

/**
 * Получает список всех пользовательских эффектов
 */
export async function getUserEffectsList(): Promise<string[]> {
  try {
    const files = await invoke<string[]>("get_user_effects_list")
    void logger.info("User effects list loaded", { count: files.length })
    return files
  } catch (error) {
    void logger.error("Error getting user effects list", { error })
    return []
  }
}

/**
 * Удаляет пользовательский эффект
 */
export async function deleteUserEffect(filePath: string): Promise<void> {
  try {
    await invoke("delete_user_effect", { filePath })
    void logger.info("User effect deleted", { filePath })
  } catch (error) {
    void logger.error("Error deleting user effect", { error })
    throw error
  }
}

// ============================================================================
// ОПЕРАЦИИ С КОЛЛЕКЦИЯМИ ЭФФЕКТОВ
// ============================================================================

/**
 * Сохраняет коллекцию эффектов в файл
 */
export async function saveEffectsCollection(collection: UserEffectsCollection, fileName: string): Promise<string> {
  try {
    const filePath = await invoke<string>("save_effects_collection", {
      fileName,
      collection: JSON.stringify(collection),
    })

    void logger.info("Effects collection saved", { fileName, filePath })
    return filePath
  } catch (error) {
    void logger.error("Error saving effects collection", { error })
    throw error
  }
}

/**
 * Загружает коллекцию эффектов из файла
 */
export async function loadEffectsCollection(filePath: string): Promise<UserEffectsCollection> {
  try {
    const collectionData = await invoke<string>("load_effects_collection", { filePath })
    const collection = JSON.parse(collectionData) as UserEffectsCollection

    void logger.info("Effects collection loaded", { filePath })
    return collection
  } catch (error) {
    void logger.error("Error loading effects collection", { error })
    throw error
  }
}

// ============================================================================
// ПРИМЕНЕНИЕ ЭФФЕКТОВ К КЛИПАМ (BACKEND КОМАНДЫ)
// ============================================================================

/**
 * Добавить эффект к клипу
 */
export async function addEffectToClip(
  projectSchema: ProjectSchema,
  clipId: string,
  effectId: string,
): Promise<ProjectSchema> {
  try {
    const updatedSchema = await invoke<ProjectSchema>("add_effect_to_clip", {
      clipId,
      effectId,
      projectSchema,
    })

    void logger.info("Effect added to clip", { clipId, effectId })
    return updatedSchema
  } catch (error) {
    void logger.error("Failed to add effect to clip", { error })
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
    const updatedSchema = await invoke<ProjectSchema>("add_filter_to_clip", {
      clipId,
      filterId,
      projectSchema,
    })

    void logger.info("Filter added to clip", { clipId, filterId })
    return updatedSchema
  } catch (error) {
    void logger.error("Failed to add filter to clip", { error })
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
    const updatedSchema = await invoke<ProjectSchema>("remove_effect_from_clip", {
      clipId,
      effectId,
      projectSchema,
    })

    void logger.info("Effect removed from clip", { clipId, effectId })
    return updatedSchema
  } catch (error) {
    void logger.error("Failed to remove effect from clip", { error })
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
    const updatedSchema = await invoke<ProjectSchema>("remove_filter_from_clip", {
      clipId,
      filterId,
      projectSchema,
    })

    void logger.info("Filter removed from clip", { clipId, filterId })
    return updatedSchema
  } catch (error) {
    void logger.error("Failed to remove filter from clip", { error })
    throw error
  }
}

// ============================================================================
// СОЗДАНИЕ НОВЫХ ЭФФЕКТОВ И ФИЛЬТРОВ
// ============================================================================

/**
 * Создать новый эффект
 */
export async function createEffect(effectType: string, parameters: Record<string, any>): Promise<any> {
  try {
    const effect = await invoke("create_effect", {
      effectType,
      parameters,
    })

    void logger.info("Effect created", { effectType })
    return effect
  } catch (error) {
    void logger.error("Failed to create effect", { error })
    throw error
  }
}

/**
 * Создать новый фильтр
 */
export async function createFilter(filterType: string, parameters: Record<string, any>): Promise<any> {
  try {
    const filter = await invoke("create_filter", {
      filterType,
      parameters,
    })

    void logger.info("Filter created", { filterType })
    return filter
  } catch (error) {
    void logger.error("Failed to create filter", { error })
    throw error
  }
}
