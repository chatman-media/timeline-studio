import { useEffect, useState } from "react"
import { logError, logInfo } from "@/lib/tauri-logger"
import type { StyleTemplate, StyleTemplateFilter, StyleTemplateSortBy, StyleTemplateSortOrder } from "../types"

interface UseStyleTemplatesReturn {
  templates: StyleTemplate[]
  loading: boolean
  error: string | null
  filteredTemplates: StyleTemplate[]
  setFilter: (filter: StyleTemplateFilter) => void
  setSorting: (sortBy: StyleTemplateSortBy, order: StyleTemplateSortOrder) => void
  getTemplateById: (id: string) => StyleTemplate | undefined
  getTemplatesByCategory: (category: string) => StyleTemplate[]
}

/**
 * Хук для работы со стилистическими шаблонами
 * Загружает шаблоны из JSON файла и предоставляет методы для фильтрации и сортировки
 */
export function useStyleTemplates(): UseStyleTemplatesReturn {
  const [templates, setTemplates] = useState<StyleTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<StyleTemplateFilter>({})
  const [sortBy, setSortBy] = useState<StyleTemplateSortBy>("name")
  const [sortOrder, setSortOrder] = useState<StyleTemplateSortOrder>("asc")

  // Загрузка шаблонов из JSON файла
  useEffect(() => {
    const loadTemplates = async () => {
      logInfo("useStyleTemplates", "Starting style templates loading")
      try {
        setLoading(true)
        setError(null)

        // Современный подход с динамическим импортом
        try {
          const { default: data } = await import("../data/style-templates.json")

          if (!data.templates || !Array.isArray(data.templates)) {
            throw new Error("Неверная структура данных шаблонов")
          }

          logInfo("useStyleTemplates", `Successfully loaded ${data.templates.length} style templates from JSON`)
          setTemplates(data.templates as unknown as StyleTemplate[])
        } catch (importError) {
          logInfo("useStyleTemplates", "JSON import failed, falling back to test data")

          // Fallback: тестовые данные
          const testTemplates: StyleTemplate[] = [
            {
              id: "modern-intro-1",
              name: {
                ru: "Современное интро",
                en: "Modern Intro",
              },
              category: "intro",
              style: "modern",
              aspectRatio: "16:9",
              duration: 3,
              hasText: true,
              hasAnimation: true,
              thumbnail: undefined,
              previewVideo: undefined,
              tags: {
                ru: ["интро", "современный", "текст", "анимация"],
                en: ["intro", "modern", "text", "animation"],
              },
              description: {
                ru: "Современное интро с анимированным текстом",
                en: "Modern intro with animated text",
              },
              elements: [],
            },
            {
              id: "minimal-outro-1",
              name: {
                ru: "Минималистичная концовка",
                en: "Minimal Outro",
              },
              category: "outro",
              style: "minimal",
              aspectRatio: "16:9",
              duration: 4,
              hasText: true,
              hasAnimation: true,
              thumbnail: undefined,
              previewVideo: undefined,
              tags: {
                ru: ["концовка", "минимализм", "чистый", "простой"],
                en: ["outro", "minimal", "clean", "simple"],
              },
              description: {
                ru: "Минималистичная концовка с простой анимацией",
                en: "Minimalist outro with simple animation",
              },
              elements: [],
            },
            {
              id: "corporate-lower-third-1",
              name: {
                ru: "Корпоративная нижняя треть",
                en: "Corporate Lower Third",
              },
              category: "lower-third",
              style: "corporate",
              aspectRatio: "16:9",
              duration: 5,
              hasText: true,
              hasAnimation: true,
              thumbnail: undefined,
              tags: {
                ru: ["нижняя треть", "корпоративный", "профессиональный"],
                en: ["lower-third", "corporate", "professional"],
              },
              description: {
                ru: "Профессиональная нижняя треть для корпоративных видео",
                en: "Professional lower third for corporate videos",
              },
              elements: [],
            },
          ]

          logInfo("useStyleTemplates", `Loaded ${testTemplates.length} test style templates as fallback`)
          setTemplates(testTemplates)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Неизвестная ошибка"
        logError("useStyleTemplates", `Failed to load style templates: ${errorMsg}`)
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    void loadTemplates()
  }, [])

  // Фильтрация шаблонов
  const filteredTemplates = templates
    .filter((template) => {
      // Фильтр по категории
      if (filter.category && template.category !== filter.category) {
        return false
      }

      // Фильтр по стилю
      if (filter.style && template.style !== filter.style) {
        return false
      }

      // Фильтр по соотношению сторон
      if (filter.aspectRatio && template.aspectRatio !== filter.aspectRatio) {
        return false
      }

      // Фильтр по наличию текста
      if (filter.hasText !== undefined && template.hasText !== filter.hasText) {
        return false
      }

      // Фильтр по наличию анимации
      if (filter.hasAnimation !== undefined && template.hasAnimation !== filter.hasAnimation) {
        return false
      }

      // Фильтр по длительности
      if (filter.duration) {
        if (filter.duration.min !== undefined && template.duration < filter.duration.min) {
          return false
        }
        if (filter.duration.max !== undefined && template.duration > filter.duration.max) {
          return false
        }
      }

      return true
    })
    .sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "name": {
          // Обрабатываем name как объект с языками
          const nameA = typeof a.name === "string" ? a.name : a.name?.ru || a.name?.en || ""
          const nameB = typeof b.name === "string" ? b.name : b.name?.ru || b.name?.en || ""
          comparison = nameA.localeCompare(nameB)
          break
        }
        case "duration":
          comparison = a.duration - b.duration
          break
        case "category":
          comparison = a.category.localeCompare(b.category)
          break
        case "style":
          comparison = a.style.localeCompare(b.style)
          break
        default:
          comparison = 0
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

  // Получение шаблона по ID
  const getTemplateById = (id: string): StyleTemplate | undefined => {
    return templates.find((template) => template.id === id)
  }

  // Получение шаблонов по категории
  const getTemplatesByCategory = (category: string): StyleTemplate[] => {
    return templates.filter((template) => template.category === category)
  }

  // Функция для установки сортировки
  const setSorting = (newSortBy: StyleTemplateSortBy, newSortOrder: StyleTemplateSortOrder) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  return {
    templates,
    loading,
    error,
    filteredTemplates,
    setFilter,
    setSorting,
    getTemplateById,
    getTemplatesByCategory,
  }
}
