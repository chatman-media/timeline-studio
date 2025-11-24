/**
 * Hook для работы с шаблонами монтажа
 */

import { useCallback, useState } from "react"

import type { MontageTemplate, MontageTemplateParameters } from "../types/montage-templates"
import { BUILT_IN_TEMPLATES } from "../types/montage-templates"

interface TemplateComparison {
  template1: MontageTemplate
  template2: MontageTemplate
  differences: {
    targetDuration?: { t1: number; t2: number }
    aspectRatio?: { t1?: string; t2?: string }
    clipCount?: { t1: number; t2: number }
  }
}

interface TemplateRecommendation {
  id: string
  score: number
  template: MontageTemplate
}

interface RecommendationCriteria {
  targetDuration?: number
  style?: string
  aspectRatio?: string
}

export function useMontageTemplate() {
  const [selectedTemplate, setSelectedTemplate] = useState<MontageTemplate | null>(null)
  const [customizedTemplate, setCustomizedTemplate] = useState<MontageTemplate | null>(null)
  const [customTemplates, setCustomTemplates] = useState<MontageTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<MontageTemplate[]>(BUILT_IN_TEMPLATES)
  const [comparison, setComparison] = useState<TemplateComparison | null>(null)
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([])

  // Объединенный список всех шаблонов (встроенные + кастомные)
  const availableTemplates = [...BUILT_IN_TEMPLATES, ...customTemplates]

  // Выбор шаблона
  const selectTemplate = useCallback(
    (templateOrId: MontageTemplate | string) => {
      if (typeof templateOrId === "string") {
        const template = availableTemplates.find((t) => t.id === templateOrId)
        setSelectedTemplate(template || null)
      } else {
        setSelectedTemplate(templateOrId)
      }
      // Сбрасываем кастомизацию при новом выборе
      setCustomizedTemplate(null)
    },
    [availableTemplates],
  )

  // Очистка выбора
  const clearSelection = useCallback(() => {
    setSelectedTemplate(null)
    setCustomizedTemplate(null)
  }, [])

  // Фильтрация по категории
  const filterByCategory = useCallback(
    (category: MontageTemplate["category"]) => {
      const filtered = availableTemplates.filter((t) => t.category === category)
      setFilteredTemplates(filtered)
    },
    [availableTemplates],
  )

  // Фильтрация по нескольким категориям
  const filterByCategories = useCallback(
    (categories: MontageTemplate["category"][]) => {
      const filtered = availableTemplates.filter((t) => categories.includes(t.category))
      setFilteredTemplates(filtered)
    },
    [availableTemplates],
  )

  // Поиск по имени
  const searchTemplates = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase()
      const filtered = filteredTemplates.filter(
        (t) => t.name.toLowerCase().includes(lowerQuery) || t.description.toLowerCase().includes(lowerQuery),
      )
      setFilteredTemplates(filtered)
    },
    [filteredTemplates],
  )

  // Поиск по тегам
  const searchByTags = useCallback(
    (tags: string[]) => {
      const filtered = availableTemplates.filter((t) => tags.some((tag) => t.tags.includes(tag)))
      setFilteredTemplates(filtered)
    },
    [availableTemplates],
  )

  // Очистка всех фильтров
  const clearFilters = useCallback(() => {
    setFilteredTemplates(availableTemplates)
  }, [availableTemplates])

  // Кастомизация параметров
  const customizeParameters = useCallback(
    (params: Partial<MontageTemplateParameters>) => {
      if (!selectedTemplate) return

      const customized: MontageTemplate = {
        ...selectedTemplate,
        parameters: {
          ...selectedTemplate.parameters,
          ...params,
        },
      }
      setCustomizedTemplate(customized)
    },
    [selectedTemplate],
  )

  // Сброс кастомизации
  const resetCustomization = useCallback(() => {
    setCustomizedTemplate(null)
  }, [])

  // Сравнение двух шаблонов
  const compareTemplates = useCallback(
    (id1: string, id2: string) => {
      const t1 = availableTemplates.find((t) => t.id === id1)
      const t2 = availableTemplates.find((t) => t.id === id2)

      if (!t1 || !t2) return

      const diff: TemplateComparison["differences"] = {}

      if (t1.parameters.targetDuration !== t2.parameters.targetDuration) {
        diff.targetDuration = { t1: t1.parameters.targetDuration, t2: t2.parameters.targetDuration }
      }

      if (t1.parameters.aspectRatio !== t2.parameters.aspectRatio) {
        diff.aspectRatio = { t1: t1.parameters.aspectRatio, t2: t2.parameters.aspectRatio }
      }

      if (t1.parameters.clipCount.preferred !== t2.parameters.clipCount.preferred) {
        diff.clipCount = {
          t1: t1.parameters.clipCount.preferred,
          t2: t2.parameters.clipCount.preferred,
        }
      }

      setComparison({
        template1: t1,
        template2: t2,
        differences: diff,
      })
    },
    [availableTemplates],
  )

  // Очистка сравнения
  const clearComparison = useCallback(() => {
    setComparison(null)
  }, [])

  // Получение рекомендаций
  const getRecommendations = useCallback(
    (criteria: RecommendationCriteria) => {
      const scored: TemplateRecommendation[] = availableTemplates.map((template) => {
        let score = 0

        // Оценка по длительности
        if (criteria.targetDuration) {
          const durationDiff = Math.abs(template.parameters.targetDuration - criteria.targetDuration)
          const durationScore = Math.max(0, 1 - durationDiff / criteria.targetDuration)
          score += durationScore * 0.4
        }

        // Оценка по стилю
        if (criteria.style && template.style === criteria.style) {
          score += 0.3
        }

        // Оценка по соотношению сторон
        if (criteria.aspectRatio && template.parameters.aspectRatio === criteria.aspectRatio) {
          score += 0.3
        }

        return {
          id: template.id,
          score,
          template,
        }
      })

      // Сортируем по оценке
      scored.sort((a, b) => b.score - a.score)
      setRecommendations(scored)
    },
    [availableTemplates],
  )

  // Сохранение как кастомного шаблона
  const saveAsCustomTemplate = useCallback(
    (metadata: { name: string; description: string }) => {
      if (!selectedTemplate) return

      const customTemplate: MontageTemplate = {
        ...selectedTemplate,
        id: `custom-${Date.now()}`,
        name: metadata.name,
        description: metadata.description,
        isBuiltIn: false,
        category: "custom",
        createdAt: new Date(),
      }

      setCustomTemplates((prev) => [...prev, customTemplate])
    },
    [selectedTemplate],
  )

  // Удаление кастомного шаблона
  const deleteCustomTemplate = useCallback((id: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Экспорт шаблона
  const exportTemplate = useCallback(() => {
    if (!selectedTemplate) return ""
    return JSON.stringify(selectedTemplate, null, 2)
  }, [selectedTemplate])

  // Импорт шаблона
  const importTemplate = useCallback((json: string) => {
    try {
      const template = JSON.parse(json) as MontageTemplate

      // Валидация обязательных полей
      if (!template.id || !template.name || !template.style || !template.parameters) {
        throw new Error("Invalid template structure")
      }

      setSelectedTemplate(template)
    } catch (error) {
      throw new Error(`Failed to import template: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }, [])

  return {
    // State
    selectedTemplate,
    customizedTemplate,
    availableTemplates,
    customTemplates,
    filteredTemplates,
    comparison,
    recommendations,

    // Actions
    selectTemplate,
    clearSelection,
    filterByCategory,
    filterByCategories,
    searchTemplates,
    searchByTags,
    clearFilters,
    customizeParameters,
    resetCustomization,
    compareTemplates,
    clearComparison,
    getRecommendations,
    saveAsCustomTemplate,
    deleteCustomTemplate,
    exportTemplate,
    importTemplate,
  }
}
