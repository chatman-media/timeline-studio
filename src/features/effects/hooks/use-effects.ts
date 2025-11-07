import { useCallback, useEffect, useState } from "react"

import { useTranslation } from "react-i18next"
import type { BaseEffect } from "@/features/effects/types"
import { createLogger, logError, logInfo } from "@/lib/tauri-logger"
import { allMigratedEffects, migratedEffects } from "../data/effects-loader"

const logger = createLogger({ module: "UseEffects" })

// Используем мигрированные эффекты из новой системы

interface UseEffectsReturn {
  effects: BaseEffect[]
  loading: boolean
  error: string | null
  reload: () => void
  isReady: boolean
}

/**
 * Хок для загрузки и управления эффектами из новой унифицированной системы
 */
export function useEffects(): UseEffectsReturn {
  const { t } = useTranslation()
  const [effects, setEffects] = useState<BaseEffect[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Загружает эффекты из новой унифицированной системы
   */
  const loadEffects = useCallback(() => {
    logInfo("useEffects", "Loading effects from unified system")

    try {
      setLoading(true)
      setError(null)

      // Используем мигрированные эффекты
      setEffects(allMigratedEffects)

      logInfo("useEffects", `Loaded ${allMigratedEffects.length} effects from unified system`)
      logger.info(
        `✅ ${t("effects.messages.effectsLoaded", "Loaded {{count}} effects from unified system", { count: allMigratedEffects.length })}`,
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("effects.errors.unknownError", "Unknown error")
      setError(t("effects.errors.failedToLoadEffects", "Failed to load effects: {{error}}", { error: errorMessage }))

      // В случае ошибки используем пустой массив
      setEffects([])

      logError("useEffects", "Failed to load effects", err)
      logger.error(`❌ ${t("effects.errors.fallbackEffects", "Failed to load effects")}:`, err)
    } finally {
      setLoading(false)
    }
  }, [t])

  // Загружаем эффекты при монтировании компонента
  useEffect(() => {
    loadEffects()
  }, [loadEffects])

  return {
    effects,
    loading,
    error,
    reload: loadEffects,
    isReady: !loading && effects.length > 0,
  }
}

/**
 * Хук для получения конкретного эффекта по ID
 * Примечание: Названо useEffectById, чтобы избежать конфликта с React.useEffect
 */
export function useEffectById(effectId: string): BaseEffect | null {
  const { effects, isReady } = useEffects()

  if (!isReady) {
    return null
  }

  return effects.find((effect) => effect.id === effectId) || null
}

/**
 * Хук для получения эффектов по категории
 */
export function useEffectsByCategory(category: string): BaseEffect[] {
  const { effects, isReady } = useEffects()

  if (!isReady) {
    return []
  }

  return effects.filter((effect) => effect.category === category)
}

/**
 * Хук для поиска эффектов
 */
export function useEffectsSearch(query: string, lang: "ru" | "en" = "ru"): BaseEffect[] {
  const { effects, isReady } = useEffects()

  if (!isReady || !query.trim()) {
    return effects
  }

  const lowercaseQuery = query.toLowerCase()

  return effects.filter(
    (effect) =>
      (effect.name[lang] || effect.name.en || "").toLowerCase().includes(lowercaseQuery) ||
      (effect.description?.[lang] || effect.description?.en || "").toLowerCase().includes(lowercaseQuery) ||
      (effect.tags || []).some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
  )
}

/**
 * Хук для получения эффектов по категориям
 */
export function useEffectCategories() {
  return {
    colorCorrection: migratedEffects.colorCorrection,
    vintage: migratedEffects.vintage,
    artistic: migratedEffects.artistic,
    cinematic: migratedEffects.cinematic,
    creative: migratedEffects.creative,
    technical: migratedEffects.technical,
    motion: migratedEffects.motion,
    distortion: migratedEffects.distortion,
  }
}
