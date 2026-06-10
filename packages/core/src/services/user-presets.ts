/**
 * User Presets Service
 * Управление пользовательскими пресетами эффектов.
 */

import type { UserPreset } from "@timeline-studio/core/types"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("CoreUserPresetsService")

const PRESETS_STORAGE_KEY = "timeline-studio:effect-presets"

export interface PresetsCollection {
  version: string
  presets: UserPreset[]
  favorites: string[]
}

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

    const collection = await loadPresetsCollection()
    collection.presets.push(preset)

    if (preset.favorite) {
      collection.favorites.push(preset.id)
    }

    await savePresetsCollection(collection)

    void logger.info("User preset saved", { presetId: preset.id, effectId })
    return preset
  } catch (error) {
    void logger.error("Error saving user preset", { error })
    throw error
  }
}

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

export async function loadPresetsForEffect(effectId: string): Promise<UserPreset[]> {
  try {
    const collection = await loadPresetsCollection()
    return collection.presets.filter((p) => p.effectId === effectId)
  } catch (error) {
    void logger.error("Error loading presets for effect", { error })
    throw error
  }
}

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

    const preset = collection.presets[presetIndex]
    const updatedPreset: UserPreset = {
      ...preset,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    collection.presets[presetIndex] = updatedPreset

    if (updates.favorite !== undefined) {
      if (updates.favorite) {
        if (!collection.favorites.includes(presetId)) {
          collection.favorites.push(presetId)
        }
      } else {
        collection.favorites = collection.favorites.filter((id) => id !== presetId)
      }
    }

    await savePresetsCollection(collection)

    void logger.info("User preset updated", { presetId })
    return updatedPreset
  } catch (error) {
    void logger.error("Error updating user preset", { error })
    throw error
  }
}

export async function deleteUserPreset(presetId: string): Promise<void> {
  try {
    const collection = await loadPresetsCollection()

    collection.presets = collection.presets.filter((p) => p.id !== presetId)
    collection.favorites = collection.favorites.filter((id) => id !== presetId)

    await savePresetsCollection(collection)

    void logger.info("User preset deleted", { presetId })
  } catch (error) {
    void logger.error("Error deleting user preset", { error })
    throw error
  }
}

export async function getAllUserPresets(): Promise<UserPreset[]> {
  try {
    const collection = await loadPresetsCollection()
    return collection.presets
  } catch (error) {
    void logger.error("Error loading all user presets", { error })
    throw error
  }
}

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

    return {
      version: "1.0",
      presets: [],
      favorites: [],
    }
  }
}

async function savePresetsCollection(collection: PresetsCollection): Promise<void> {
  try {
    collection.version = "1.0"
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(collection))
  } catch (error) {
    void logger.error("Error saving presets collection to localStorage", { error })
    throw error
  }
}
