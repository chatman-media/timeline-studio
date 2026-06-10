/**
 * Hook для работы с пользовательскими пресетами эффектов
 */

import {
  deleteUserPreset,
  getAllUserPresets,
  loadPresetsForEffect,
  loadUserPreset,
  saveUserPreset,
  updateUserPreset,
} from "@timeline-studio/core/services/user-presets"
import type { UserPreset } from "@timeline-studio/core/types"
import { useCallback, useEffect, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("useUserPresets")

export interface UseUserPresetsOptions {
  effectId?: string // Если указан, загружаются только пресеты для этого эффекта
  autoLoad?: boolean // Автоматически загружать пресеты при монтировании
}

export interface UseUserPresetsReturn {
  // Данные
  presets: UserPreset[]
  loading: boolean
  error: string | null

  // Операции
  savePreset: (
    effectId: string,
    name: string,
    params: Record<string, any>,
    options?: {
      description?: string
      tags?: string[]
      favorite?: boolean
    },
  ) => Promise<UserPreset>
  loadPreset: (presetId: string) => Promise<UserPreset | null>
  updatePreset: (
    presetId: string,
    updates: {
      name?: string
      description?: string
      params?: Record<string, any>
      tags?: string[]
      favorite?: boolean
    },
  ) => Promise<UserPreset>
  deletePreset: (presetId: string) => Promise<void>

  // Фильтрация
  getPresetsForEffect: (effectId: string) => UserPreset[]
  getFavorites: () => UserPreset[]

  // Утилиты
  reload: () => Promise<void>
  clearError: () => void
}

/**
 * Хук для управления пользовательскими пресетами эффектов
 */
export function useUserPresets(options: UseUserPresetsOptions = {}): UseUserPresetsReturn {
  const { effectId, autoLoad = true } = options

  const [presets, setPresets] = useState<UserPreset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Загружает пресеты
   */
  const loadPresets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let loadedPresets: UserPreset[]

      if (effectId) {
        // Загружаем пресеты для конкретного эффекта
        loadedPresets = await loadPresetsForEffect(effectId)
      } else {
        // Загружаем все пресеты
        loadedPresets = await getAllUserPresets()
      }

      setPresets(loadedPresets)
      void logger.info("Presets loaded", { count: loadedPresets.length, effectId })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to load presets: ${errorMessage}`)
      void logger.error("Error loading presets", { error: err })
    } finally {
      setLoading(false)
    }
  }, [effectId])

  /**
   * Сохраняет новый пресет
   */
  const savePreset = useCallback(
    async (
      effectId: string,
      name: string,
      params: Record<string, any>,
      options?: {
        description?: string
        tags?: string[]
        favorite?: boolean
      },
    ) => {
      try {
        setError(null)
        const preset = await saveUserPreset(effectId, name, params, options)

        // Обновляем локальный список
        setPresets((prev) => [...prev, preset])

        void logger.info("Preset saved", { presetId: preset.id })

        return preset
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(`Failed to save preset: ${errorMessage}`)
        void logger.error("Error saving preset", { error: err })
        throw err
      }
    },
    [],
  )

  /**
   * Загружает конкретный пресет
   */
  const loadPreset = useCallback(async (presetId: string) => {
    try {
      setError(null)
      const preset = await loadUserPreset(presetId)
      return preset
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to load preset: ${errorMessage}`)
      void logger.error("Error loading preset", { error: err })
      throw err
    }
  }, [])

  /**
   * Обновляет пресет
   */
  const updatePreset = useCallback(
    async (
      presetId: string,
      updates: {
        name?: string
        description?: string
        params?: Record<string, any>
        tags?: string[]
        favorite?: boolean
      },
    ) => {
      try {
        setError(null)
        const updatedPreset = await updateUserPreset(presetId, updates)

        // Обновляем локальный список
        setPresets((prev) => prev.map((p) => (p.id === presetId ? updatedPreset : p)))

        void logger.info("Preset updated", { presetId })

        return updatedPreset
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(`Failed to update preset: ${errorMessage}`)
        void logger.error("Error updating preset", { error: err })
        throw err
      }
    },
    [],
  )

  /**
   * Удаляет пресет
   */
  const deletePreset = useCallback(async (presetId: string) => {
    try {
      setError(null)
      await deleteUserPreset(presetId)

      // Обновляем локальный список
      setPresets((prev) => prev.filter((p) => p.id !== presetId))

      void logger.info("Preset deleted", { presetId })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to delete preset: ${errorMessage}`)
      void logger.error("Error deleting preset", { error: err })
      throw err
    }
  }, [])

  /**
   * Получает пресеты для конкретного эффекта
   */
  const getPresetsForEffect = useCallback(
    (effectId: string) => {
      return presets.filter((p) => p.effectId === effectId)
    },
    [presets],
  )

  /**
   * Получает избранные пресеты
   */
  const getFavorites = useCallback(() => {
    return presets.filter((p) => p.favorite === true)
  }, [presets])

  /**
   * Очищает ошибку
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Автоматически загружаем пресеты при монтировании
   */
  useEffect(() => {
    if (autoLoad) {
      void loadPresets()
    }
  }, [autoLoad, loadPresets])

  return {
    presets,
    loading,
    error,
    savePreset,
    loadPreset,
    updatePreset,
    deletePreset,
    getPresetsForEffect,
    getFavorites,
    reload: loadPresets,
    clearError,
  }
}
