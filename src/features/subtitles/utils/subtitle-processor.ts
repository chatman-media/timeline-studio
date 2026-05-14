import type { SubtitleStyleTemplate } from "../types/subtitles"

/**
 * Интерфейс для сырых данных стиля субтитров из JSON
 */
interface RawSubtitleStyleTemplateData {
  id: string
  name: string
  category: string
  complexity: string
  tags: string[]
  description: {
    ru: string
    en: string
  }
  labels: {
    ru: string
    en: string
    es?: string
    fr?: string
    de?: string
  }
  style: Record<string, any>
}

/**
 * Интерфейс для данных стилей субтитров из JSON файла
 */
interface SubtitleStyleTemplatesDataFile {
  version: string
  lastUpdated: string
  totalStyles: number
  categories: string[]
  styles: RawSubtitleStyleTemplateData[]
}

/**
 * Обрабатывает сырые данные стилей субтитров из JSON и преобразует их в типизированные объекты
 * @param rawStyles - Массив сырых данных стилей
 * @returns Массив обработанных стилей субтитров
 */
export function processSubtitleStyleTemplates(rawStyles: RawSubtitleStyleTemplateData[]): SubtitleStyleTemplate[] {
  return rawStyles.map((rawStyle) => ({
    id: rawStyle.id,
    name: rawStyle.name,
    category: rawStyle.category as SubtitleStyleTemplate["category"],
    complexity: rawStyle.complexity as SubtitleStyleTemplate["complexity"],
    tags: rawStyle.tags as SubtitleStyleTemplate["tags"],
    description: rawStyle.description,
    labels: rawStyle.labels,
    style: rawStyle.style,
  }))
}

/**
 * Валидирует структуру данных стилей субтитров
 * @param data - Данные для валидации
 * @returns true если данные валидны, false в противном случае
 */
export function validateSubtitleStyleTemplatesData(data: any): data is SubtitleStyleTemplatesDataFile {
  if (!data || typeof data !== "object") {
    return false
  }

  // Проверяем обязательные поля
  if (!data.version || !data.styles || !Array.isArray(data.styles)) {
    return false
  }

  // Проверяем структуру каждого стиля
  return data.styles.every((style: any) => {
    return (
      style &&
      typeof style.id === "string" &&
      typeof style.name === "string" &&
      typeof style.category === "string" &&
      typeof style.complexity === "string" &&
      Array.isArray(style.tags) &&
      style.description &&
      typeof style.description.ru === "string" &&
      typeof style.description.en === "string" &&
      style.labels &&
      typeof style.labels.ru === "string" &&
      typeof style.labels.en === "string" &&
      style.style &&
      typeof style.style === "object"
    )
  })
}

/**
 * Создает fallback стиль субтитров для случаев ошибок
 * @param id - ID стиля
 * @returns Базовый стиль субтитров
 */
export function createFallbackSubtitleStyleTemplate(id: string): SubtitleStyleTemplate {
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    category: "basic",
    complexity: "basic",
    tags: ["fallback"],
    description: {
      ru: `Базовый стиль ${id}`,
      en: `Basic style ${id}`,
    },
    labels: {
      ru: id.charAt(0).toUpperCase() + id.slice(1),
      en: id.charAt(0).toUpperCase() + id.slice(1),
    },
    style: {
      fontFamily: "Arial, sans-serif",
      fontSize: 24,
      fontWeight: "normal",
      fontStyle: "normal",
      color: "#ffffff",
      textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)",
      textAlign: "center",
      lineHeight: 1.4,
    },
  }
}

/**
 * Фильтрует стили субтитров по поисковому запросу
 * @param styles - Массив стилей
 * @param query - Поисковый запрос
 * @param lang - Язык для поиска
 * @returns Отфильтрованный массив стилей
 */
export function searchSubtitleStyleTemplates(
  styles: SubtitleStyleTemplate[],
  query: string,
  lang: "ru" | "en" = "ru",
): SubtitleStyleTemplate[] {
  if (!query.trim()) {
    return styles
  }

  const lowercaseQuery = query.toLowerCase()

  return styles.filter(
    (style) =>
      (style.labels?.[lang] || style.name || "").toLowerCase().includes(lowercaseQuery) ||
      (style.description?.[lang] || "").toLowerCase().includes(lowercaseQuery) ||
      (style.tags || []).some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
  )
}

/**
 * Группирует стили субтитров по указанному критерию
 * @param styles - Массив стилей
 * @param groupBy - Критерий группировки
 * @returns Объект с группами стилей
 */
export function groupSubtitleStyleTemplates(
  styles: SubtitleStyleTemplate[],
  groupBy: "category" | "complexity" | "tags" | "none",
): Record<string, SubtitleStyleTemplate[]> {
  if (groupBy === "none") {
    return { all: styles }
  }

  const groups: Record<string, SubtitleStyleTemplate[]> = {}

  styles.forEach((style) => {
    let groupKey = ""

    switch (groupBy) {
      case "category":
        groupKey = style.category || "other"
        break
      case "complexity":
        groupKey = style.complexity || "basic"
        break
      case "tags":
        groupKey = style.tags && style.tags.length > 0 ? style.tags[0] : "untagged"
        break
      default:
        groupKey = "ungrouped"
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(style)
  })

  return groups
}

/**
 * Сортирует стили субтитров по указанному критерию
 * @param styles - Массив стилей
 * @param sortBy - Критерий сортировки
 * @param order - Порядок сортировки
 * @returns Отсортированный массив стилей
 */
export function sortSubtitleStyleTemplates(
  styles: SubtitleStyleTemplate[],
  sortBy: "name" | "complexity" | "category",
  order: "asc" | "desc" = "asc",
): SubtitleStyleTemplate[] {
  const sorted = [...styles].sort((a, b) => {
    let result = 0

    switch (sortBy) {
      case "name": {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        result = nameA.localeCompare(nameB)
        break
      }

      case "complexity": {
        const complexityOrder = { basic: 0, intermediate: 1, advanced: 2 }
        const complexityA = complexityOrder[a.complexity || "basic"]
        const complexityB = complexityOrder[b.complexity || "basic"]
        result = complexityA - complexityB
        break
      }

      case "category": {
        const categoryA = (a.category || "").toLowerCase()
        const categoryB = (b.category || "").toLowerCase()
        result = categoryA.localeCompare(categoryB)
        break
      }

      default:
        result = 0
    }

    return order === "asc" ? result : -result
  })

  return sorted
}

// Экспорты функций с исправленными именами для обратной совместимости
export {
  createFallbackSubtitleStyleTemplate as createFallbackSubtitleStyle,
  processSubtitleStyleTemplates as processSubtitleStyles,
  validateSubtitleStyleTemplatesData as validateSubtitleStylesData,
}
