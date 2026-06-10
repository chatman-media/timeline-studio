/**
 * User Presets Service
 * Управление пользовательскими пресетами эффектов
 * Сохранение и загрузка пользовательских настроек
 */

import type { EffectPreset } from "@timeline-studio/domains/video-editing/types/unified-effects"
import { createLogger } from "@/lib/tauri-logger"
import { loadFile, saveFile } from "../../tauri/compiler-commands"

const logger = createLogger("UserPresetsService")

const PRESETS_STORAGE_KEY = "timeline-studio:effect-presets"

/**
 * Интерфейс для пользовательского пресета
 */
export interface UserPreset {
  id: string
  effectId: string
  name: string
  description?: string
  params: Record<string, any>
  tags?: string[]
  createdAt: string
  updatedAt: string
  favorite?: boolean
}

/**
 * Интерфейс для коллекции пресетов
 */
export interface PresetsCollection {
  version: string
  presets: UserPreset[]
  favorites: string[] // IDs избранных пресетов
}

/**
 * Сохраняет пользовательский пресет
 */
export async function saveUserPreset(
  effectId: string,
  name: string,
  params: Record<string, any>,
  options?: {
    description?: string
    tags?: string[]
    favorite?: boolean
  },
): Promise<UserPreset> {
  try {
    const preset: UserPreset = {
      id: `preset-${effectId}-${Date.now()}`,
      effectId,
      name,
      description: options?.description,
      params,
      tags: options?.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      favorite: options?.favorite ?? false,
    }

    // Загружаем существующие пресеты
    const collection = await loadPresetsCollection()

    // Добавляем новый пресет
    collection.presets.push(preset)

    if (preset.favorite) {
      collection.favorites.push(preset.id)
    }

    // Сохраняем обновленную коллекцию
    await savePresetsCollection(collection)

    void logger.info("User preset saved", { presetId: preset.id, effectId })

    return preset
  } catch (error) {
    void logger.error("Error saving user preset", { error })
    throw error
  }
}

/**
 * Загружает пользовательский пресет по ID
 */
export async function loadUserPreset(presetId: string): Promise<UserPreset | null> {
  try {
    const collection = await loadPresetsCollection()
    const preset = collection.presets.find((p) => p.id === presetId)

    if (!preset) {
      void logger.warn("Preset not found", { presetId })
      return null
    }

    return preset
  } catch (error) {
    void logger.error("Error loading user preset", { error })
    throw error
  }
}

/**
 * Загружает все пресеты для конкретного эффекта
 */
export async function loadPresetsForEffect(effectId: string): Promise<UserPreset[]> {
  try {
    const collection = await loadPresetsCollection()
    return collection.presets.filter((p) => p.effectId === effectId)
  } catch (error) {
    void logger.error("Error loading presets for effect", { error })
    throw error
  }
}

/**
 * Обновляет пользовательский пресет
 */
export async function updateUserPreset(
  presetId: string,
  updates: {
    name?: string
    description?: string
    params?: Record<string, any>
    tags?: string[]
    favorite?: boolean
  },
): Promise<UserPreset> {
  try {
    const collection = await loadPresetsCollection()
    const presetIndex = collection.presets.findIndex((p) => p.id === presetId)

    if (presetIndex === -1) {
      throw new Error(`Preset ${presetId} not found`)
    }

    // Обновляем пресет
    const preset = collection.presets[presetIndex]
    const updatedPreset: UserPreset = {
      ...preset,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    collection.presets[presetIndex] = updatedPreset

    // Обновляем избранное
    if (updates.favorite !== undefined) {
      if (updates.favorite) {
        if (!collection.favorites.includes(presetId)) {
          collection.favorites.push(presetId)
        }
      } else {
        collection.favorites = collection.favorites.filter((id) => id !== presetId)
      }
    }

    // Сохраняем обновленную коллекцию
    await savePresetsCollection(collection)

    void logger.info("User preset updated", { presetId })

    return updatedPreset
  } catch (error) {
    void logger.error("Error updating user preset", { error })
    throw error
  }
}

/**
 * Удаляет пользовательский пресет
 */
export async function deleteUserPreset(presetId: string): Promise<void> {
  try {
    const collection = await loadPresetsCollection()

    // Удаляем пресет
    collection.presets = collection.presets.filter((p) => p.id !== presetId)

    // Удаляем из избранного
    collection.favorites = collection.favorites.filter((id) => id !== presetId)

    // Сохраняем обновленную коллекцию
    await savePresetsCollection(collection)

    void logger.info("User preset deleted", { presetId })
  } catch (error) {
    void logger.error("Error deleting user preset", { error })
    throw error
  }
}

/**
 * Получает все пользовательские пресеты
 */
export async function getAllUserPresets(): Promise<UserPreset[]> {
  try {
    const collection = await loadPresetsCollection()
    return collection.presets
  } catch (error) {
    void logger.error("Error loading all user presets", { error })
    throw error
  }
}

/**
 * Получает избранные пресеты
 */
export async function getFavoritePresets(): Promise<UserPreset[]> {
  try {
    const collection = await loadPresetsCollection()
    return collection.presets.filter((p) => collection.favorites.includes(p.id))
  } catch (error) {
    void logger.error("Error loading favorite presets", { error })
    throw error
  }
}

/**
 * Импортирует пресеты из файла
 */
export async function importPresets(filePath: string): Promise<number> {
  try {
    const importedData = await loadFile(filePath)
    const importedCollection: PresetsCollection = JSON.parse(importedData)

    const currentCollection = await loadPresetsCollection()

    // Объединяем пресеты (избегаем дубликатов)
    const existingIds = new Set(currentCollection.presets.map((p) => p.id))
    const newPresets = importedCollection.presets.filter((p) => !existingIds.has(p.id))

    currentCollection.presets.push(...newPresets)
    currentCollection.favorites.push(
      ...importedCollection.favorites.filter((id) => !currentCollection.favorites.includes(id)),
    )

    await savePresetsCollection(currentCollection)

    void logger.info("Presets imported", { count: newPresets.length })

    return newPresets.length
  } catch (error) {
    void logger.error("Error importing presets", { error })
    throw error
  }
}

/**
 * Экспортирует пресеты в файл
 */
export async function exportPresets(presetIds: string[], filePath: string): Promise<void> {
  try {
    const collection = await loadPresetsCollection()

    const exportCollection: PresetsCollection = {
      version: collection.version,
      presets: collection.presets.filter((p) => presetIds.includes(p.id)),
      favorites: collection.favorites.filter((id) => presetIds.includes(id)),
    }

    await saveFile({
      path: filePath,
      content: JSON.stringify(exportCollection, null, 2),
    })

    void logger.info("Presets exported", { count: exportCollection.presets.length })
  } catch (error) {
    void logger.error("Error exporting presets", { error })
    throw error
  }
}

/**
 * Очищает все пользовательские пресеты
 */
export async function clearAllPresets(): Promise<void> {
  try {
    const emptyCollection: PresetsCollection = {
      version: "1.0",
      presets: [],
      favorites: [],
    }

    await savePresetsCollection(emptyCollection)

    void logger.info("All presets cleared")
  } catch (error) {
    void logger.error("Error clearing presets", { error })
    throw error
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Загружает коллекцию пресетов из localStorage
 */
async function loadPresetsCollection(): Promise<PresetsCollection> {
  try {
    const stored = localStorage.getItem(PRESETS_STORAGE_KEY)

    if (!stored) {
      return {
        version: "1.0",
        presets: [],
        favorites: [],
      }
    }

    return JSON.parse(stored) as PresetsCollection
  } catch (error) {
    void logger.error("Error loading presets collection from localStorage", { error })

    // Возвращаем пустую коллекцию в случае ошибки
    return {
      version: "1.0",
      presets: [],
      favorites: [],
    }
  }
}

/**
 * Сохраняет коллекцию пресетов в localStorage
 */
async function savePresetsCollection(collection: PresetsCollection): Promise<void> {
  try {
    collection.version = "1.0"
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(collection))
  } catch (error) {
    void logger.error("Error saving presets collection to localStorage", { error })
    throw error
  }
}

/**
 * Конвертирует UserPreset в EffectPreset для использования с эффектами
 */
export function convertUserPresetToEffectPreset(userPreset: UserPreset): EffectPreset {
  return {
    id: userPreset.id,
    name: typeof userPreset.name === "string" ? { en: userPreset.name, ru: userPreset.name } : userPreset.name,
    description:
      typeof userPreset.description === "string" || userPreset.description === undefined
        ? userPreset.description
          ? { en: userPreset.description, ru: userPreset.description }
          : undefined
        : userPreset.description,
    parameters: userPreset.params,
    tags: userPreset.tags || [],
  }
}
