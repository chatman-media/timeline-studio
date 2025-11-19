import type { ProjectTemplate } from "../types"
import { podcastTemplates } from "./podcast-templates"
import { socialTemplates } from "./social-templates"
import { youtubeTemplates } from "./youtube-templates"

/**
 * Все шаблоны проектов
 */
export const allProjectTemplates: ProjectTemplate[] = [
  ...youtubeTemplates,
  ...socialTemplates,
  ...podcastTemplates,
]

/**
 * Группировка шаблонов по категориям
 */
export const projectTemplatesByCategory = {
  youtube: youtubeTemplates,
  social: socialTemplates,
  podcast: podcastTemplates,
  tutorial: youtubeTemplates.filter((t) => t.category === "tutorial"),
  commercial: [], // Заглушка для будущих шаблонов
  presentation: [], // Заглушка для будущих шаблонов
} as const

/**
 * Группировка шаблонов по платформам
 */
export const projectTemplatesByPlatform = {
  youtube: allProjectTemplates.filter((t) => t.targetPlatform === "youtube"),
  instagram: allProjectTemplates.filter((t) => t.targetPlatform === "instagram"),
  tiktok: allProjectTemplates.filter((t) => t.targetPlatform === "tiktok"),
  facebook: allProjectTemplates.filter((t) => t.targetPlatform === "facebook"),
  twitter: allProjectTemplates.filter((t) => t.targetPlatform === "twitter"),
  custom: allProjectTemplates.filter((t) => !t.targetPlatform || t.targetPlatform === "custom"),
} as const

/**
 * Получить шаблон по ID
 */
export function getProjectTemplateById(id: string): ProjectTemplate | undefined {
  return allProjectTemplates.find((t) => t.id === id)
}

/**
 * Получить шаблоны по категории
 */
export function getProjectTemplatesByCategory(category: ProjectTemplate["category"]): ProjectTemplate[] {
  return allProjectTemplates.filter((t) => t.category === category)
}

/**
 * Получить шаблоны по платформе
 */
export function getProjectTemplatesByPlatform(platform: string): ProjectTemplate[] {
  return allProjectTemplates.filter((t) => t.targetPlatform === platform)
}

/**
 * Получить шаблоны по соотношению сторон
 */
export function getProjectTemplatesByAspectRatio(aspectRatio: string): ProjectTemplate[] {
  return allProjectTemplates.filter((t) => t.aspectRatio === aspectRatio)
}

// Экспорты
export { youtubeTemplates, socialTemplates, podcastTemplates }
