/**
 * Утилиты для хранения пользовательских шаблонов в localStorage
 */

import { createLogger } from "@/lib/tauri-logger"
import type { StyleTemplate } from "../types"

const logger = createLogger("CustomTemplatesStorage")

const STORAGE_KEY = "timeline-studio-custom-templates"

/**
 * Загрузить пользовательские шаблоны из localStorage
 */
export function loadCustomTemplates(): StyleTemplate[] {
  try {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const templates = JSON.parse(stored) as StyleTemplate[]
    logger.info("Загружено пользовательских шаблонов:", { count: templates.length })
    return templates
  } catch (error) {
    logger.error("Ошибка загрузки пользовательских шаблонов:", { error })
    return []
  }
}

/**
 * Сохранить пользовательские шаблоны в localStorage
 */
export function saveCustomTemplates(templates: StyleTemplate[]): void {
  try {
    if (typeof window === "undefined") return

    const json = JSON.stringify(templates)
    localStorage.setItem(STORAGE_KEY, json)
    logger.info("Сохранено пользовательских шаблонов:", { count: templates.length })
  } catch (error) {
    logger.error("Ошибка сохранения пользовательских шаблонов:", { error })
    throw error
  }
}

/**
 * Добавить пользовательский шаблон
 */
export function addCustomTemplate(template: StyleTemplate): void {
  const templates = loadCustomTemplates()

  // Проверяем, не существует ли уже шаблон с таким ID
  const exists = templates.some((t) => t.id === template.id)
  if (exists) {
    throw new Error(`Шаблон с ID "${template.id}" уже существует`)
  }

  templates.push(template)
  saveCustomTemplates(templates)
}

/**
 * Обновить пользовательский шаблон
 */
export function updateCustomTemplate(template: StyleTemplate): void {
  const templates = loadCustomTemplates()
  const index = templates.findIndex((t) => t.id === template.id)

  if (index === -1) {
    throw new Error(`Шаблон с ID "${template.id}" не найден`)
  }

  templates[index] = template
  saveCustomTemplates(templates)
}

/**
 * Удалить пользовательский шаблон
 */
export function deleteCustomTemplate(templateId: string): void {
  const templates = loadCustomTemplates()
  const filtered = templates.filter((t) => t.id !== templateId)

  if (filtered.length === templates.length) {
    throw new Error(`Шаблон с ID "${templateId}" не найден`)
  }

  saveCustomTemplates(filtered)
}

/**
 * Получить пользовательский шаблон по ID
 */
export function getCustomTemplate(templateId: string): StyleTemplate | null {
  const templates = loadCustomTemplates()
  return templates.find((t) => t.id === templateId) || null
}

/**
 * Проверить, является ли шаблон пользовательским
 */
export function isCustomTemplate(templateId: string): boolean {
  const templates = loadCustomTemplates()
  return templates.some((t) => t.id === templateId)
}

/**
 * Очистить все пользовательские шаблоны
 */
export function clearCustomTemplates(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem(STORAGE_KEY)
  logger.info("Все пользовательские шаблоны удалены")
}
