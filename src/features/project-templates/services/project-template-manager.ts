/**
 * Project Template Manager
 * Управление шаблонами проектов
 */

import { allProjectTemplates } from "../lib/templates"
import type {
  ProjectTemplate,
  ProjectTemplateFilter,
  ProjectTemplateSortBy,
  ProjectTemplateSortOrder,
} from "../types/project-template"

export class ProjectTemplateManager {
  private templates: Map<string, ProjectTemplate>
  private customTemplates: Map<string, ProjectTemplate>

  constructor() {
    this.templates = new Map()
    this.customTemplates = new Map()
    this.loadBuiltInTemplates()
  }

  /**
   * Загружает встроенные шаблоны
   */
  private loadBuiltInTemplates(): void {
    allProjectTemplates.forEach((template) => {
      this.templates.set(template.id, template)
    })
  }

  /**
   * Получить все шаблоны
   */
  getAllTemplates(): ProjectTemplate[] {
    return [...this.templates.values(), ...this.customTemplates.values()]
  }

  /**
   * Получить шаблон по ID
   */
  getTemplateById(id: string): ProjectTemplate | undefined {
    return this.templates.get(id) || this.customTemplates.get(id)
  }

  /**
   * Получить шаблоны с фильтрацией
   */
  getFilteredTemplates(filter: ProjectTemplateFilter): ProjectTemplate[] {
    let templates = this.getAllTemplates()

    if (filter.category) {
      templates = templates.filter((t) => t.category === filter.category)
    }

    if (filter.platform) {
      templates = templates.filter((t) => t.targetPlatform === filter.platform)
    }

    if (filter.aspectRatio) {
      templates = templates.filter((t) => t.aspectRatio === filter.aspectRatio)
    }

    if (filter.duration) {
      templates = templates.filter((t) => {
        const duration = t.estimatedDuration
        const matchesMin = !filter.duration?.min || duration >= filter.duration.min
        const matchesMax = !filter.duration?.max || duration <= filter.duration.max
        return matchesMin && matchesMax
      })
    }

    return templates
  }

  /**
   * Сортировка шаблонов
   */
  sortTemplates(
    templates: ProjectTemplate[],
    sortBy: ProjectTemplateSortBy,
    order: ProjectTemplateSortOrder = "asc",
  ): ProjectTemplate[] {
    const sorted = [...templates]

    sorted.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "name":
          comparison = a.name.en.localeCompare(b.name.en)
          break
        case "duration":
          comparison = a.estimatedDuration - b.estimatedDuration
          break
        case "category":
          comparison = a.category.localeCompare(b.category)
          break
        case "platform":
          comparison = (a.targetPlatform || "").localeCompare(b.targetPlatform || "")
          break
      }

      return order === "asc" ? comparison : -comparison
    })

    return sorted
  }

  /**
   * Поиск шаблонов
   */
  searchTemplates(query: string, lang: "ru" | "en" = "en"): ProjectTemplate[] {
    const lowerQuery = query.toLowerCase()
    return this.getAllTemplates().filter((template) => {
      const name = template.name[lang].toLowerCase()
      const description = template.description?.[lang]?.toLowerCase() || ""
      const tags = template.tags?.[lang]?.map((t) => t.toLowerCase()) || []

      return (
        name.includes(lowerQuery) || description.includes(lowerQuery) || tags.some((tag) => tag.includes(lowerQuery))
      )
    })
  }

  /**
   * Добавить кастомный шаблон
   */
  addCustomTemplate(template: ProjectTemplate): void {
    // Проверяем что ID уникален
    if (this.templates.has(template.id) || this.customTemplates.has(template.id)) {
      throw new Error(`Template with ID "${template.id}" already exists`)
    }

    this.customTemplates.set(template.id, template)
  }

  /**
   * Обновить кастомный шаблон
   */
  updateCustomTemplate(id: string, updates: Partial<ProjectTemplate>): void {
    const template = this.customTemplates.get(id)
    if (!template) {
      throw new Error(`Custom template with ID "${id}" not found`)
    }

    // Запрещаем изменение ID
    if (updates.id && updates.id !== id) {
      throw new Error("Cannot change template ID")
    }

    const updated = { ...template, ...updates, id }
    this.customTemplates.set(id, updated)
  }

  /**
   * Удалить кастомный шаблон
   */
  deleteCustomTemplate(id: string): void {
    // Нельзя удалять встроенные шаблоны
    if (this.templates.has(id)) {
      throw new Error("Cannot delete built-in template")
    }

    if (!this.customTemplates.delete(id)) {
      throw new Error(`Custom template with ID "${id}" not found`)
    }
  }

  /**
   * Получить статистику шаблонов
   */
  getStatistics(): {
    total: number
    byCategory: Record<string, number>
    byPlatform: Record<string, number>
    byAspectRatio: Record<string, number>
  } {
    const templates = this.getAllTemplates()

    const stats = {
      total: templates.length,
      byCategory: {} as Record<string, number>,
      byPlatform: {} as Record<string, number>,
      byAspectRatio: {} as Record<string, number>,
    }

    templates.forEach((template) => {
      // По категории
      stats.byCategory[template.category] = (stats.byCategory[template.category] || 0) + 1

      // По платформе
      if (template.targetPlatform) {
        stats.byPlatform[template.targetPlatform] = (stats.byPlatform[template.targetPlatform] || 0) + 1
      }

      // По соотношению сторон
      stats.byAspectRatio[template.aspectRatio] = (stats.byAspectRatio[template.aspectRatio] || 0) + 1
    })

    return stats
  }

  /**
   * Экспорт кастомного шаблона в JSON
   */
  exportTemplate(id: string): string {
    const template = this.customTemplates.get(id)
    if (!template) {
      throw new Error(`Custom template with ID "${id}" not found`)
    }

    return JSON.stringify(template, null, 2)
  }

  /**
   * Импорт шаблона из JSON
   */
  importTemplate(json: string): ProjectTemplate {
    try {
      const template = JSON.parse(json) as ProjectTemplate

      // Валидация основных полей
      if (!template.id || !template.name || !template.category) {
        throw new Error("Invalid template: missing required fields")
      }

      // Генерируем новый ID если такой уже существует
      let finalId = template.id
      let counter = 1
      while (this.templates.has(finalId) || this.customTemplates.has(finalId)) {
        finalId = `${template.id}-${counter}`
        counter++
      }

      const imported = { ...template, id: finalId }
      this.addCustomTemplate(imported)

      return imported
    } catch (error) {
      throw new Error(`Failed to import template: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
}

// Singleton экземпляр
export const projectTemplateManager = new ProjectTemplateManager()
