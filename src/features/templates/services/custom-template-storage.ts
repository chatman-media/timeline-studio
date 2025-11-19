/**
 * Сервис для сохранения и загрузки кастомных шаблонов
 * Использует localStorage для хранения пользовательских шаблонов
 */

import { createLogger } from "@/lib/tauri-logger"
import type { MediaTemplateConfig } from "../lib/template-config"

const logger = createLogger({ module: "CustomTemplateStorage" })

const STORAGE_KEY = "timeline-studio-custom-templates"

export interface CustomTemplate extends MediaTemplateConfig {
  customName: string
  createdAt: number
  updatedAt: number
}

/**
 * Сохраняет кастомный шаблон
 */
export function saveCustomTemplate(template: MediaTemplateConfig, customName: string): CustomTemplate {
  try {
    const customTemplates = getCustomTemplates()

    // Создаем уникальный ID на основе имени и времени
    const customId = `custom-${customName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`

    const customTemplate: CustomTemplate = {
      ...template,
      id: customId,
      customName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    customTemplates.push(customTemplate)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTemplates))

    logger.info("Custom template saved", { id: customId, name: customName })
    return customTemplate
  } catch (error) {
    logger.error("Failed to save custom template", { error })
    throw error
  }
}

/**
 * Получает все кастомные шаблоны
 */
export function getCustomTemplates(): CustomTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const templates = JSON.parse(stored) as CustomTemplate[]
    return templates.sort((a, b) => b.updatedAt - a.updatedAt) // Сортируем по дате обновления
  } catch (error) {
    logger.error("Failed to load custom templates", { error })
    return []
  }
}

/**
 * Получает кастомный шаблон по ID
 */
export function getCustomTemplate(id: string): CustomTemplate | undefined {
  const templates = getCustomTemplates()
  return templates.find((t) => t.id === id)
}

/**
 * Обновляет существующий кастомный шаблон
 */
export function updateCustomTemplate(id: string, updates: Partial<MediaTemplateConfig>): CustomTemplate | null {
  try {
    const customTemplates = getCustomTemplates()
    const index = customTemplates.findIndex((t) => t.id === id)

    if (index === -1) {
      logger.warn("Custom template not found for update", { id })
      return null
    }

    customTemplates[index] = {
      ...customTemplates[index],
      ...updates,
      id, // Сохраняем оригинальный ID
      updatedAt: Date.now(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTemplates))
    logger.info("Custom template updated", { id })

    return customTemplates[index]
  } catch (error) {
    logger.error("Failed to update custom template", { error, id })
    return null
  }
}

/**
 * Удаляет кастомный шаблон
 */
export function deleteCustomTemplate(id: string): boolean {
  try {
    const customTemplates = getCustomTemplates()
    const filtered = customTemplates.filter((t) => t.id !== id)

    if (filtered.length === customTemplates.length) {
      logger.warn("Custom template not found for deletion", { id })
      return false
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    logger.info("Custom template deleted", { id })
    return true
  } catch (error) {
    logger.error("Failed to delete custom template", { error, id })
    return false
  }
}

/**
 * Экспортирует кастомный шаблон в JSON
 */
export function exportCustomTemplate(id: string): string | null {
  const template = getCustomTemplate(id)
  if (!template) return null

  try {
    return JSON.stringify(template, null, 2)
  } catch (error) {
    logger.error("Failed to export custom template", { error, id })
    return null
  }
}

/**
 * Импортирует кастомный шаблон из JSON
 */
export function importCustomTemplate(jsonData: string): CustomTemplate | null {
  try {
    const template = JSON.parse(jsonData) as CustomTemplate

    // Валидация базовых полей
    if (!template.split || !template.screens) {
      logger.error("Invalid template data", { template })
      return null
    }

    // Создаем новый ID для импортированного шаблона
    const importedTemplate: CustomTemplate = {
      ...template,
      id: `custom-imported-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const customTemplates = getCustomTemplates()
    customTemplates.push(importedTemplate)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTemplates))

    logger.info("Custom template imported", { id: importedTemplate.id })
    return importedTemplate
  } catch (error) {
    logger.error("Failed to import custom template", { error })
    return null
  }
}

/**
 * Очищает все кастомные шаблоны (осторожно!)
 */
export function clearCustomTemplates(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    logger.info("All custom templates cleared")
  } catch (error) {
    logger.error("Failed to clear custom templates", { error })
  }
}
