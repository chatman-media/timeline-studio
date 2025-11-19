/**
 * Hook для управления analyzer presets
 */

import { useCallback, useState } from "react"

import type { AnalyzerType } from "../types/analysis-progress"
import type { AnalyzerPreset } from "../types/analyzer-presets"
import { DEFAULT_PRESETS } from "../types/analyzer-presets"

interface PresetComparison {
  preset1: AnalyzerPreset
  preset2: AnalyzerPreset
  differences: {
    onlyIn1: Set<AnalyzerType>
    onlyIn2: Set<AnalyzerType>
    additionalIn2: Set<AnalyzerType>
    common: Set<AnalyzerType>
  }
}

type UseCase = "montage" | "preview" | "archival" | "quality"

export function useAnalyzerPresets() {
  const [selectedPreset, setSelectedPreset] = useState<AnalyzerPreset | null>(null)
  const [customPresets, setCustomPresets] = useState<AnalyzerPreset[]>([])
  const [comparison, setComparison] = useState<PresetComparison | null>(null)
  const [recommendedPreset, setRecommendedPreset] = useState<AnalyzerPreset | null>(null)

  // Объединенный список presets (default + custom)
  const presets = [...DEFAULT_PRESETS, ...customPresets]

  // Выбор preset
  const selectPreset = useCallback(
    (id: string) => {
      const preset = presets.find((p) => p.id === id)
      setSelectedPreset(preset || null)
    },
    [presets],
  )

  // Получить выбранные анализаторы
  const getSelectedAnalyzers = useCallback((): Set<AnalyzerType> => {
    if (!selectedPreset) return new Set()
    return new Set(selectedPreset.analyzers)
  }, [selectedPreset])

  // Очистка выбора
  const clearSelection = useCallback(() => {
    setSelectedPreset(null)
  }, [])

  // Создание кастомного preset
  const createCustomPreset = useCallback(
    (options: { name: string; description: string; analyzers: Set<AnalyzerType> }) => {
      const newPreset: AnalyzerPreset = {
        id: `custom-${Date.now()}`,
        name: options.name,
        description: options.description,
        analyzers: Array.from(options.analyzers),
        isDefault: false,
        category: "custom",
        estimatedTime: Array.from(options.analyzers).length * 30, // Простая оценка
      }

      setCustomPresets((prev) => [...prev, newPreset])
    },
    [],
  )

  // Удаление кастомного preset
  const deleteCustomPreset = useCallback(
    (id: string) => {
      // Не даем удалять default presets
      const preset = presets.find((p) => p.id === id)
      if (preset?.isDefault) return

      setCustomPresets((prev) => prev.filter((p) => p.id !== id))
    },
    [presets],
  )

  // Обновление кастомного preset
  const updateCustomPreset = useCallback(
    (
      id: string,
      updates: {
        name?: string
        description?: string
        analyzers?: Set<AnalyzerType>
      },
    ) => {
      setCustomPresets((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p

          return {
            ...p,
            ...(updates.name && { name: updates.name }),
            ...(updates.description && { description: updates.description }),
            ...(updates.analyzers && { analyzers: Array.from(updates.analyzers) }),
          }
        }),
      )
    },
    [],
  )

  // Получение рекомендации по use case
  const getRecommendation = useCallback((useCase: UseCase) => {
    let recommended: AnalyzerPreset | null = null

    switch (useCase) {
      case "montage":
        recommended = DEFAULT_PRESETS.find((p) => p.id === "montage-focus") || DEFAULT_PRESETS[0]
        break
      case "preview":
        recommended = DEFAULT_PRESETS.find((p) => p.id === "quick-scan") || DEFAULT_PRESETS[0]
        break
      case "archival":
        recommended = DEFAULT_PRESETS.find((p) => p.id === "deep-analysis") || DEFAULT_PRESETS[2]
        break
      case "quality":
        recommended = DEFAULT_PRESETS.find((p) => p.id === "quality-focus") || DEFAULT_PRESETS[4]
        break
    }

    setRecommendedPreset(recommended)
  }, [])

  // Сравнение двух presets
  const comparePresets = useCallback(
    (id1: string, id2: string) => {
      const preset1 = presets.find((p) => p.id === id1)
      const preset2 = presets.find((p) => p.id === id2)

      if (!preset1 || !preset2) return

      const onlyIn1 = new Set<AnalyzerType>()
      const onlyIn2 = new Set<AnalyzerType>()
      const common = new Set<AnalyzerType>()

      // Анализируем различия
      preset1.analyzers.forEach((a) => {
        if (preset2.analyzers.has(a)) {
          common.add(a)
        } else {
          onlyIn1.add(a)
        }
      })

      preset2.analyzers.forEach((a) => {
        if (!preset1.analyzers.has(a)) {
          onlyIn2.add(a)
        }
      })

      setComparison({
        preset1,
        preset2,
        differences: {
          onlyIn1,
          onlyIn2,
          additionalIn2: onlyIn2, // Alias для совместимости
          common,
        },
      })
    },
    [presets],
  )

  // Экспорт preset
  const exportPreset = useCallback((): string => {
    if (!selectedPreset) return ""

    // Преобразуем Set в массив для JSON сериализации
    const exportData = {
      ...selectedPreset,
      analyzers: Array.from(selectedPreset.analyzers),
    }

    return JSON.stringify(exportData, null, 2)
  }, [selectedPreset])

  // Импорт preset
  const importPreset = useCallback((json: string) => {
    try {
      const data = JSON.parse(json)

      const imported: AnalyzerPreset = {
        id: data.id || `imported-${Date.now()}`,
        name: data.name,
        description: data.description,
        analyzers: Array.isArray(data.analyzers) ? data.analyzers : [],
        isDefault: data.isDefault || false,
        category: data.category || "custom",
        estimatedTime: data.estimatedTime || 0,
      }

      // Добавляем в кастомные presets
      setCustomPresets((prev) => [...prev, imported])
    } catch (error) {
      throw new Error(`Failed to import preset: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }, [])

  return {
    // State
    presets,
    selectedPreset,
    customPresets,
    comparison,
    recommendedPreset,

    // Actions
    selectPreset,
    getSelectedAnalyzers,
    clearSelection,
    createCustomPreset,
    deleteCustomPreset,
    updateCustomPreset,
    getRecommendation,
    comparePresets,
    exportPreset,
    importPreset,
  }
}
