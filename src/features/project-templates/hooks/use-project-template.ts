/**
 * Hook для работы с шаблонами проектов
 */

import { useCallback, useMemo, useState } from "react"
import type { TimelineStudioProject } from "@timeline-studio/core/types/project"
import type { Sequence } from "@/features/timeline/types/sequence"
import { createLogger } from "@/lib/tauri-logger"

import {
  type ApplyTemplateOptions,
  projectTemplateManager,
  templateApplier,
  templateValidator,
  type ValidationResult,
} from "../services"
import type { ProjectTemplate, ProjectTemplateFilter, ProjectTemplateSortBy } from "../types/project-template"

const logger = createLogger("useProjectTemplate")

export interface UseProjectTemplateReturn {
  // Данные
  templates: ProjectTemplate[]
  selectedTemplate: ProjectTemplate | null
  validationResult: ValidationResult | null

  // Состояние
  isApplying: boolean
  isValidating: boolean
  error: Error | null

  // Действия
  selectTemplate: (id: string) => void
  clearSelection: () => void
  applyTemplate: (project: TimelineStudioProject, options?: Partial<ApplyTemplateOptions>) => Promise<Sequence>
  validateTemplate: (template: ProjectTemplate) => ValidationResult
  addCustomTemplate: (template: ProjectTemplate) => void
  deleteCustomTemplate: (id: string) => void

  // Фильтрация и поиск
  filterTemplates: (filter: ProjectTemplateFilter) => void
  searchTemplates: (query: string, lang?: "ru" | "en") => void
  sortTemplates: (sortBy: ProjectTemplateSortBy, order?: "asc" | "desc") => void
  resetFilters: () => void

  // Утилиты
  getTemplateById: (id: string) => ProjectTemplate | undefined
  previewTemplate: (template: ProjectTemplate) => ReturnType<typeof templateApplier.previewTemplate>
  exportTemplate: (id: string) => string
  importTemplate: (json: string) => ProjectTemplate
}

export function useProjectTemplate(): UseProjectTemplateReturn {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Фильтры
  const [currentFilter, setCurrentFilter] = useState<ProjectTemplateFilter | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortBy, setSortBy] = useState<ProjectTemplateSortBy>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Получение шаблонов с применением фильтров
  const templates = useMemo(() => {
    let result = projectTemplateManager.getAllTemplates()

    // Поиск
    if (searchQuery) {
      result = projectTemplateManager.searchTemplates(searchQuery)
    }

    // Фильтрация
    if (currentFilter) {
      result = projectTemplateManager.getFilteredTemplates(currentFilter)
    }

    // Сортировка
    result = projectTemplateManager.sortTemplates(result, sortBy, sortOrder)

    return result
  }, [currentFilter, searchQuery, sortBy, sortOrder])

  /**
   * Выбор шаблона
   */
  const selectTemplate = useCallback((id: string) => {
    const template = projectTemplateManager.getTemplateById(id)
    if (template) {
      setSelectedTemplate(template)
      setError(null)

      // Автоматическая валидация при выборе
      const validation = templateValidator.validate(template)
      setValidationResult(validation)

      logger.info("Template selected", { templateId: id, valid: validation.valid })
    }
  }, [])

  /**
   * Очистка выбора
   */
  const clearSelection = useCallback(() => {
    setSelectedTemplate(null)
    setValidationResult(null)
    setError(null)
  }, [])

  /**
   * Применение шаблона к проекту
   */
  const applyTemplate = useCallback(
    async (project: TimelineStudioProject, options?: Partial<ApplyTemplateOptions>): Promise<Sequence> => {
      if (!selectedTemplate) {
        throw new Error("No template selected")
      }

      setIsApplying(true)
      setError(null)

      try {
        // Валидация перед применением
        const validation = templateValidator.validate(selectedTemplate)
        if (!validation.valid) {
          throw new Error(`Template validation failed: ${validation.errors.map((e) => e.message).join(", ")}`)
        }

        const defaultOptions: ApplyTemplateOptions = {
          mode: "new",
          applyProjectSettings: true,
          createMarkers: true,
          createTracks: true,
          ...options,
        }

        const sequence = await templateApplier.applyTemplate(project, selectedTemplate, defaultOptions)

        logger.info("Template applied successfully", {
          templateId: selectedTemplate.id,
          sequenceId: sequence.id,
        })

        return sequence
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to apply template")
        setError(error)
        logger.error("Failed to apply template", { error })
        throw error
      } finally {
        setIsApplying(false)
      }
    },
    [selectedTemplate],
  )

  /**
   * Валидация шаблона
   */
  const validateTemplate = useCallback((template: ProjectTemplate): ValidationResult => {
    setIsValidating(true)
    try {
      const result = templateValidator.validate(template)
      setValidationResult(result)
      return result
    } finally {
      setIsValidating(false)
    }
  }, [])

  /**
   * Добавление кастомного шаблона
   */
  const addCustomTemplate = useCallback((template: ProjectTemplate) => {
    try {
      // Валидация перед добавлением
      const validation = templateValidator.validate(template)
      if (!validation.valid) {
        throw new Error(`Invalid template: ${validation.errors.map((e) => e.message).join(", ")}`)
      }

      projectTemplateManager.addCustomTemplate(template)
      logger.info("Custom template added", { templateId: template.id })
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to add template")
      setError(error)
      throw error
    }
  }, [])

  /**
   * Удаление кастомного шаблона
   */
  const deleteCustomTemplate = useCallback(
    (id: string) => {
      try {
        projectTemplateManager.deleteCustomTemplate(id)

        // Если удалили выбранный шаблон, очищаем выбор
        if (selectedTemplate?.id === id) {
          clearSelection()
        }

        logger.info("Custom template deleted", { templateId: id })
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to delete template")
        setError(error)
        throw error
      }
    },
    [selectedTemplate, clearSelection],
  )

  /**
   * Фильтрация шаблонов
   */
  const filterTemplates = useCallback((filter: ProjectTemplateFilter) => {
    setCurrentFilter(filter)
    setSearchQuery("") // Сброс поиска при фильтрации
  }, [])

  /**
   * Поиск шаблонов
   */
  const searchTemplates = useCallback((query: string, _lang: "ru" | "en" = "en") => {
    setSearchQuery(query)
    setCurrentFilter(null) // Сброс фильтров при поиске
  }, [])

  /**
   * Сортировка шаблонов
   */
  const sortTemplates = useCallback((newSortBy: ProjectTemplateSortBy, order: "asc" | "desc" = "asc") => {
    setSortBy(newSortBy)
    setSortOrder(order)
  }, [])

  /**
   * Сброс фильтров
   */
  const resetFilters = useCallback(() => {
    setCurrentFilter(null)
    setSearchQuery("")
    setSortBy("name")
    setSortOrder("asc")
  }, [])

  /**
   * Получение шаблона по ID
   */
  const getTemplateById = useCallback((id: string) => {
    return projectTemplateManager.getTemplateById(id)
  }, [])

  /**
   * Предпросмотр шаблона
   */
  const previewTemplate = useCallback((template: ProjectTemplate) => {
    return templateApplier.previewTemplate(template)
  }, [])

  /**
   * Экспорт шаблона
   */
  const exportTemplate = useCallback((id: string): string => {
    try {
      return projectTemplateManager.exportTemplate(id)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to export template")
      setError(error)
      throw error
    }
  }, [])

  /**
   * Импорт шаблона
   */
  const importTemplate = useCallback((json: string): ProjectTemplate => {
    try {
      const template = projectTemplateManager.importTemplate(json)
      logger.info("Template imported", { templateId: template.id })
      return template
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to import template")
      setError(error)
      throw error
    }
  }, [])

  return {
    // Данные
    templates,
    selectedTemplate,
    validationResult,

    // Состояние
    isApplying,
    isValidating,
    error,

    // Действия
    selectTemplate,
    clearSelection,
    applyTemplate,
    validateTemplate,
    addCustomTemplate,
    deleteCustomTemplate,

    // Фильтрация и поиск
    filterTemplates,
    searchTemplates,
    sortTemplates,
    resetFilters,

    // Утилиты
    getTemplateById,
    previewTemplate,
    exportTemplate,
    importTemplate,
  }
}
