import { useCallback, useEffect, useState } from "react"

import { useTranslation } from "react-i18next"
import type { VideoFilter } from "@/features/filters/types/filters"
import { logError, logInfo } from "@/lib/tauri-logger"

import filtersData from "../data/filters.json"
import { createFallbackFilter, processFilters, validateFiltersData } from "../utils/filter-processor"

// Импортируем JSON файл напрямую - в Tauri это работает отлично

interface UseFiltersReturn {
  filters: VideoFilter[]
  loading: boolean
  error: string | null
  reload: () => void
  isReady: boolean
}

/**
 * Хук для загрузки и управления фильтрами из JSON файла
 */
export function useFilters(): UseFiltersReturn {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<VideoFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Загружает фильтры из импортированного JSON файла
   */
  const loadFilters = useCallback(() => {
    logInfo("useFilters", "Loading filters from JSON data")

    try {
      setLoading(true)
      setError(null)

      // Используем импортированные данные - в Tauri это работает мгновенно
      const data = filtersData

      // Валидируем данные
      if (!validateFiltersData(data)) {
        throw new Error(t("filters.errors.invalidFiltersData", "Invalid filters data structure"))
      }

      // Обрабатываем фильтры (преобразуем в типизированные объекты)
      const processedFilters = processFilters(data.filters)

      setFilters(processedFilters)

      logInfo("useFilters", `Loaded ${processedFilters.length} filters from JSON`, { count: processedFilters.length })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("filters.errors.unknownError", "Unknown error")
      setError(t("filters.errors.failedToLoadFilters", "Failed to load filters: {{error}}", { error: errorMessage }))

      // Создаем fallback фильтры в случае ошибки
      const fallbackFilters = [
        createFallbackFilter("neutral"),
        createFallbackFilter("brightness"),
        createFallbackFilter("contrast"),
      ]

      setFilters(fallbackFilters)

      logError("useFilters", "Failed to load filters, using fallback", err)
    } finally {
      setLoading(false)
    }
  }, [t])

  // Загружаем фильтры при монтировании компонента
  useEffect(() => {
    loadFilters()
  }, [loadFilters])

  return {
    filters,
    loading,
    error,
    reload: loadFilters,
    isReady: !loading && filters.length > 0,
  }
}

/**
 * Хук для получения конкретного фильтра по ID
 */
export function useFilterById(filterId: string): VideoFilter | null {
  const { filters, isReady } = useFilters()

  if (!isReady) {
    return null
  }

  return filters.find((filter) => filter.id === filterId) || null
}

/**
 * Хук для получения фильтров по категории
 */
export function useFiltersByCategory(category: string): VideoFilter[] {
  const { filters, isReady } = useFilters()

  if (!isReady) {
    return []
  }

  return filters.filter((filter) => filter.category === category)
}

/**
 * Хук для поиска фильтров
 */
export function useFiltersSearch(query: string, lang: "ru" | "en" = "ru"): VideoFilter[] {
  const { filters, isReady } = useFilters()

  if (!isReady || !query.trim()) {
    return filters
  }

  const lowercaseQuery = query.toLowerCase()

  return filters.filter(
    (filter) =>
      (filter.labels?.[lang] || filter.name || "").toLowerCase().includes(lowercaseQuery) ||
      // (filter.description?.[lang] || "").toLowerCase().includes(lowercaseQuery) ||
      (filter.tags || []).some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
  )
}
