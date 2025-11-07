import { useCallback, useEffect, useState } from "react"

import { useTranslation } from "react-i18next"
import { createLogger, type LogContext } from "@/lib/tauri-logger"
import subtitleStylesData from "../data/subtitle-styles.json"
import type { SubtitleStyleTemplate } from "../types/subtitles"
import {
  createFallbackSubtitleStyleTemplate,
  processSubtitleStyleTemplates,
  validateSubtitleStyleTemplatesData,
} from "../utils/subtitle-processor"

const logger = createLogger("UseSubtitleStyles")

// Импортируем JSON файл напрямую - в Tauri это работает отлично

interface UseSubtitlesReturn {
  subtitles: SubtitleStyleTemplate[]
  loading: boolean
  error: string | null
  reload: () => void
  isReady: boolean
}

/**
 * Хук для загрузки и управления субтитрами из JSON файла
 */
export function useSubtitles(): UseSubtitlesReturn {
  const { t } = useTranslation()
  const [subtitles, setSubtitles] = useState<SubtitleStyleTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Загружает стили субтитров из импортированного JSON файла
   */
  const loadStyles = useCallback(() => {
    try {
      setLoading(true)
      setError(null)

      // Используем импортированные данные - в Tauri это работает мгновенно
      const data = subtitleStylesData

      // Валидируем данные
      if (!validateSubtitleStyleTemplatesData(data)) {
        throw new Error(t("subtitles.errors.invalidStylesData", "Invalid subtitle styles data structure"))
      }

      // Обрабатываем стили (преобразуем в типизированные объекты)
      const processedStyles = processSubtitleStyleTemplates(data.styles)

      setSubtitles(processedStyles)

      logger.info(
        `✅ ${t("subtitles.messages.stylesLoaded", "Loaded {{count}} subtitle styles from JSON", { count: processedStyles.length })}`,
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("subtitles.errors.unknownError", "Unknown error")
      setError(
        t("subtitles.errors.failedToLoadStyles", "Failed to load subtitle styles: {{error}}", { error: errorMessage }),
      )

      // Создаем fallback стили в случае ошибки
      const fallbackStyles = [
        createFallbackSubtitleStyleTemplate("basic-white"),
        createFallbackSubtitleStyleTemplate("basic-yellow"),
        createFallbackSubtitleStyleTemplate("minimal-clean"),
      ]

      setSubtitles(fallbackStyles)

      void logger.error(`❌ ${t("subtitles.errors.fallbackStyles", "Failed to load subtitle styles, using fallback")}:`, { error: err } as LogContext)
    } finally {
      setLoading(false)
    }
  }, [t])

  // Загружаем стили при монтировании компонента
  useEffect(() => {
    loadStyles()
  }, [loadStyles])

  return {
    subtitles,
    loading,
    error,
    reload: loadStyles,
    isReady: !loading && subtitles.length > 0,
  }
}

/**
 * Хук для получения конкретного субтитра по ID
 */
export function useSubtitleById(subtitleId: string): SubtitleStyleTemplate | null {
  const { subtitles, isReady } = useSubtitles()

  if (!isReady) {
    return null
  }

  return subtitles.find((subtitle: SubtitleStyleTemplate) => subtitle.id === subtitleId) || null
}

/**
 * Хук для получения субтитров по категории
 */
export function useSubtitlesByCategory(category: string): SubtitleStyleTemplate[] {
  const { subtitles, isReady } = useSubtitles()

  if (!isReady) {
    return []
  }

  return subtitles.filter((subtitle: SubtitleStyleTemplate) => subtitle.category === category)
}

/**
 * Хук для поиска субтитров
 */
export function useSubtitlesSearch(query: string, lang: "ru" | "en" = "ru"): SubtitleStyleTemplate[] {
  const { subtitles, isReady } = useSubtitles()

  if (!isReady || !query.trim()) {
    return subtitles
  }

  const lowercaseQuery = query.toLowerCase()

  return subtitles.filter(
    (subtitle: SubtitleStyleTemplate) =>
      (subtitle.labels?.[lang] || subtitle.name || "").toLowerCase().includes(lowercaseQuery) ||
      (subtitle.description?.[lang] || "").toLowerCase().includes(lowercaseQuery) ||
      (subtitle.tags || []).some((tag: string) => tag.toLowerCase().includes(lowercaseQuery)),
  )
}
