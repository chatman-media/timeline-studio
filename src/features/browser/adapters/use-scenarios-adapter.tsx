import type React from "react"
import { useMemo } from "react"

import { useFavorites } from "@/core/hooks"
import { allScenarios } from "@/features/scenarios"
import type { Scenario } from "@/features/scenarios/types"

import type { ListAdapter, ListItem, PreviewComponentProps } from "../types/list"

// Адаптер типа для Scenario чтобы соответствовать ListItem
type ScenarioListItem = Scenario & ListItem

/**
 * Компонент превью для сценариев
 */
const ScenarioPreviewWrapper: React.FC<PreviewComponentProps<Scenario>> = ({ item: scenario, viewMode, onClick }) => {
  const handleClick = () => {
    onClick?.(scenario)
  }

  // Определяем категории и сложность для отображения
  const categoryLabel = {
    automation: "Автоматизация",
    structure: "Структура",
    effects: "Эффекты",
    workflow: "Workflow",
  }[scenario.category]

  const difficultyLabel = {
    beginner: "Начальный",
    intermediate: "Средний",
    advanced: "Продвинутый",
  }[scenario.difficulty]

  const difficultyColor = {
    beginner: "bg-green-500",
    intermediate: "bg-yellow-500",
    advanced: "bg-red-500",
  }[scenario.difficulty]

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50"
        onClick={handleClick}
      >
        {/* Icon */}
        <div className="shrink-0 w-10 h-10 bg-linear-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
          {scenario.icon || scenario.name.ru.substring(0, 2).toUpperCase()}
        </div>

        {/* Scenario Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{scenario.name.ru}</div>
          <div className="text-xs text-muted-foreground truncate">{scenario.description.ru}</div>
        </div>

        {/* Category */}
        <div className="shrink-0 text-xs text-muted-foreground">{categoryLabel}</div>

        {/* Difficulty */}
        <div className="shrink-0 flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${difficultyColor}`} />
          <span className="text-xs text-muted-foreground">{difficultyLabel}</span>
        </div>

        {/* Time */}
        <div className="shrink-0 text-xs text-muted-foreground">~{scenario.estimatedTime} мин</div>

        {/* Steps */}
        <div className="shrink-0 text-xs text-muted-foreground">{scenario.steps.length} шагов</div>

        {/* AI badge */}
        {scenario.requirements.aiAssisted && (
          <div className="shrink-0 text-xs bg-purple-500/20 text-purple-600 px-2 py-0.5 rounded">AI</div>
        )}
      </div>
    )
  }

  // Thumbnails mode - card view
  return (
    <div
      className="group cursor-pointer rounded-lg border overflow-hidden transition-all hover:border-primary hover:shadow-md"
      onClick={handleClick}
    >
      {/* Header */}
      <div className="relative aspect-video bg-linear-to-br from-purple-500 to-pink-600 flex items-center justify-center">
        {scenario.thumbnail ? (
          <img src={scenario.thumbnail} alt={scenario.name.ru} className="w-full h-full object-cover" />
        ) : (
          <div className="text-white text-4xl font-bold">{scenario.icon || scenario.name.ru.substring(0, 2)}</div>
        )}

        {/* Difficulty badge */}
        <div className={`absolute top-2 right-2 ${difficultyColor} text-white text-xs px-2 py-1 rounded`}>
          {difficultyLabel}
        </div>

        {/* AI badge */}
        {scenario.requirements.aiAssisted && (
          <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">AI</div>
        )}

        {/* Time badge */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          ~{scenario.estimatedTime} мин
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="font-medium text-sm mb-1 truncate">{scenario.name.ru}</div>
        <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{scenario.description.ru}</div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded">{categoryLabel}</span>
          <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded">{scenario.steps.length} шагов</span>
          {scenario.requirements.requiresMusic && (
            <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded">Музыка</span>
          )}
          {scenario.requirements.requiresIntro && (
            <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded">Intro</span>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Хук для создания адаптера сценариев
 */
export function useScenariosAdapter(): ListAdapter<ScenarioListItem> {
  const { isItemFavorite } = useFavorites()

  const listAdapter: ListAdapter<ScenarioListItem> = useMemo(
    () => ({
      // Хук для получения данных
      useData: () => ({
        items: allScenarios as ScenarioListItem[],
        loading: false,
        error: null,
      }),

      // Компонент превью
      PreviewComponent: ScenarioPreviewWrapper as unknown as React.ComponentType<
        PreviewComponentProps<ScenarioListItem>
      >,

      // Функция для получения значения сортировки
      getSortValue: (scenario, sortBy) => {
        switch (sortBy) {
          case "name":
            return scenario.name.ru.toLowerCase()

          case "category":
            return scenario.category.toLowerCase()

          case "difficulty":
            return { beginner: 1, intermediate: 2, advanced: 3 }[scenario.difficulty]

          case "time":
            return scenario.estimatedTime

          case "steps":
            return scenario.steps.length

          default:
            return scenario.name.ru.toLowerCase()
        }
      },

      // Функция для получения текста для поиска
      getSearchableText: (scenario) => {
        const texts: string[] = [
          scenario.name.ru,
          scenario.name.en,
          scenario.description.ru,
          scenario.description.en,
          scenario.category,
          scenario.difficulty,
          ...(scenario.tags?.ru || []),
          ...(scenario.tags?.en || []),
          ...scenario.steps.map((s) => s.name.ru),
        ]
        return texts.filter(Boolean)
      },

      // Функция для получения значения группировки
      getGroupValue: (scenario, groupBy) => {
        switch (groupBy) {
          case "category":
            return {
              automation: "Автоматизация",
              structure: "Структура",
              effects: "Эффекты",
              workflow: "Workflow",
            }[scenario.category]

          case "difficulty":
            return {
              beginner: "Начальный",
              intermediate: "Средний",
              advanced: "Продвинутый",
            }[scenario.difficulty]

          case "time":
            const time = scenario.estimatedTime
            if (time <= 5) return "Быстрые (≤5 мин)"
            if (time <= 10) return "Средние (5-10 мин)"
            return "Долгие (>10 мин)"

          case "ai":
            return scenario.requirements.aiAssisted ? "С AI" : "Без AI"

          default:
            return ""
        }
      },

      // Функция для фильтрации по типу
      matchesFilter: (scenario, filterType) => {
        if (filterType === "all") return true

        // Фильтрация по категории
        if (["automation", "structure", "effects", "workflow"].includes(filterType)) {
          return scenario.category === filterType
        }

        // Фильтрация по сложности
        if (["beginner", "intermediate", "advanced"].includes(filterType)) {
          return scenario.difficulty === filterType
        }

        // Фильтрация по AI
        if (filterType === "ai") {
          return scenario.requirements.aiAssisted === true
        }

        // Фильтрация по требованиям
        if (filterType === "requires-music") {
          return scenario.requirements.requiresMusic === true
        }

        if (filterType === "requires-intro") {
          return scenario.requirements.requiresIntro === true
        }

        if (filterType === "requires-outro") {
          return scenario.requirements.requiresOutro === true
        }

        return true
      },

      // Обработчики импорта не нужны для сценариев (они встроенные)
      importHandlers: undefined,

      // Проверка избранного
      isFavorite: (scenario) =>
        isItemFavorite(
          {
            id: scenario.id,
            path: "",
            name: scenario.name.ru,
          },
          "template",
        ),

      // Тип для системы избранного
      favoriteType: "template",
    }),
    [isItemFavorite],
  )

  return listAdapter
}
