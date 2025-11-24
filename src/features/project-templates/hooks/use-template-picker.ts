/**
 * Hook для Template Picker UI
 */

import { useCallback, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"

import { projectTemplateManager } from "../services"
import type { ProjectTemplate, ProjectTemplateFilter } from "../types/project-template"

const logger = createLogger("useTemplatePicker")

export interface UseTemplatePickerOptions {
  /** Начальный фильтр */
  initialFilter?: ProjectTemplateFilter

  /** Начальная категория */
  initialCategory?: string

  /** Режим выбора: одиночный или множественный */
  mode?: "single" | "multiple"

  /** Callback при выборе шаблона */
  onSelect?: (template: ProjectTemplate) => void

  /** Callback при изменении выбора */
  onSelectionChange?: (templates: ProjectTemplate[]) => void
}

export interface UseTemplatePickerReturn {
  // Данные
  templates: ProjectTemplate[]
  selectedTemplates: ProjectTemplate[]
  categories: string[]
  platforms: string[]

  // Состояние
  currentCategory: string | null
  currentPlatform: string | null
  searchQuery: string
  viewMode: "grid" | "list"

  // Действия - выбор
  selectTemplate: (template: ProjectTemplate) => void
  deselectTemplate: (id: string) => void
  toggleTemplate: (template: ProjectTemplate) => void
  clearSelection: () => void
  isSelected: (id: string) => boolean

  // Действия - фильтрация
  setCategory: (category: string | null) => void
  setPlatform: (platform: string | null) => void
  setSearchQuery: (query: string) => void
  clearFilters: () => void

  // Действия - вид
  setViewMode: (mode: "grid" | "list") => void

  // Утилиты
  getTemplatesByCategory: (category: string) => ProjectTemplate[]
  getTemplatesByPlatform: (platform: string) => ProjectTemplate[]
  getStatistics: () => {
    total: number
    byCategory: Record<string, number>
    byPlatform: Record<string, number>
  }
}

export function useTemplatePicker(options: UseTemplatePickerOptions = {}): UseTemplatePickerReturn {
  const { initialFilter, initialCategory, mode = "single", onSelect, onSelectionChange } = options

  // Состояние выбора
  const [selectedTemplates, setSelectedTemplates] = useState<ProjectTemplate[]>([])

  // Состояние фильтров
  const [currentCategory, setCurrentCategoryState] = useState<string | null>(initialCategory || null)
  const [currentPlatform, setCurrentPlatformState] = useState<string | null>(initialFilter?.platform || null)
  const [searchQuery, setSearchQueryState] = useState("")

  // Состояние UI
  const [viewMode, setViewModeState] = useState<"grid" | "list">("grid")

  // Получение отфильтрованных шаблонов
  const getFilteredTemplates = useCallback((): ProjectTemplate[] => {
    let result: ProjectTemplate[] = []

    // Поиск
    if (searchQuery) {
      result = projectTemplateManager.searchTemplates(searchQuery)
    } else {
      result = projectTemplateManager.getAllTemplates()
    }

    // Фильтрация по категории
    if (currentCategory) {
      result = result.filter((t) => t.category === currentCategory)
    }

    // Фильтрация по платформе
    if (currentPlatform) {
      result = result.filter((t) => t.targetPlatform === currentPlatform)
    }

    return result
  }, [searchQuery, currentCategory, currentPlatform])

  const templates = getFilteredTemplates()

  // Получение уникальных категорий
  const categories = Array.from(new Set(projectTemplateManager.getAllTemplates().map((t) => t.category)))

  // Получение уникальных платформ
  const platforms = Array.from(
    new Set(
      projectTemplateManager
        .getAllTemplates()
        .map((t) => t.targetPlatform)
        .filter((p): p is NonNullable<typeof p> => p !== undefined),
    ),
  ) as string[]

  /**
   * Выбор шаблона
   */
  const selectTemplate = useCallback(
    (template: ProjectTemplate) => {
      if (mode === "single") {
        setSelectedTemplates([template])
        onSelect?.(template)
        onSelectionChange?.([template])
      } else {
        const isAlreadySelected = selectedTemplates.some((t) => t.id === template.id)
        if (!isAlreadySelected) {
          const newSelection = [...selectedTemplates, template]
          setSelectedTemplates(newSelection)
          onSelect?.(template)
          onSelectionChange?.(newSelection)
        }
      }

      logger.info("Template selected", { templateId: template.id })
    },
    [mode, selectedTemplates, onSelect, onSelectionChange],
  )

  /**
   * Отмена выбора шаблона
   */
  const deselectTemplate = useCallback(
    (id: string) => {
      const newSelection = selectedTemplates.filter((t) => t.id !== id)
      setSelectedTemplates(newSelection)
      onSelectionChange?.(newSelection)

      logger.info("Template deselected", { templateId: id })
    },
    [selectedTemplates, onSelectionChange],
  )

  /**
   * Переключение выбора шаблона
   */
  const toggleTemplate = useCallback(
    (template: ProjectTemplate) => {
      const isCurrentlySelected = selectedTemplates.some((t) => t.id === template.id)

      if (isCurrentlySelected) {
        deselectTemplate(template.id)
      } else {
        selectTemplate(template)
      }
    },
    [selectedTemplates, selectTemplate, deselectTemplate],
  )

  /**
   * Очистка выбора
   */
  const clearSelection = useCallback(() => {
    setSelectedTemplates([])
    onSelectionChange?.([])
  }, [onSelectionChange])

  /**
   * Проверка выбран ли шаблон
   */
  const isSelected = useCallback(
    (id: string): boolean => {
      return selectedTemplates.some((t) => t.id === id)
    },
    [selectedTemplates],
  )

  /**
   * Установка категории
   */
  const setCategory = useCallback((category: string | null) => {
    setCurrentCategoryState(category)
    logger.info("Category filter changed", { category })
  }, [])

  /**
   * Установка платформы
   */
  const setPlatform = useCallback((platform: string | null) => {
    setCurrentPlatformState(platform)
    logger.info("Platform filter changed", { platform })
  }, [])

  /**
   * Установка поискового запроса
   */
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query)
    logger.info("Search query changed", { query })
  }, [])

  /**
   * Очистка всех фильтров
   */
  const clearFilters = useCallback(() => {
    setCurrentCategoryState(null)
    setCurrentPlatformState(null)
    setSearchQueryState("")
    logger.info("Filters cleared")
  }, [])

  /**
   * Установка режима отображения
   */
  const setViewMode = useCallback((mode: "grid" | "list") => {
    setViewModeState(mode)
  }, [])

  /**
   * Получение шаблонов по категории
   */
  const getTemplatesByCategory = useCallback((category: string): ProjectTemplate[] => {
    return projectTemplateManager.getFilteredTemplates({ category })
  }, [])

  /**
   * Получение шаблонов по платформе
   */
  const getTemplatesByPlatform = useCallback((platform: string): ProjectTemplate[] => {
    return projectTemplateManager.getFilteredTemplates({ platform })
  }, [])

  /**
   * Получение статистики
   */
  const getStatistics = useCallback(() => {
    return projectTemplateManager.getStatistics()
  }, [])

  return {
    // Данные
    templates,
    selectedTemplates,
    categories,
    platforms,

    // Состояние
    currentCategory,
    currentPlatform,
    searchQuery,
    viewMode,

    // Действия - выбор
    selectTemplate,
    deselectTemplate,
    toggleTemplate,
    clearSelection,
    isSelected,

    // Действия - фильтрация
    setCategory,
    setPlatform,
    setSearchQuery,
    clearFilters,

    // Действия - вид
    setViewMode,

    // Утилиты
    getTemplatesByCategory,
    getTemplatesByPlatform,
    getStatistics,
  }
}
