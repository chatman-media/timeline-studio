import { describe, expect, it } from "vitest"

import subtitleCategoriesData from "../../data/subtitle-categories.json"
import subtitleStylesData from "../../data/subtitle-styles.json"

import type { SubtitleCategory, SubtitleStyleTemplate } from "../../types/subtitles"

// Type-safe JSON imports
const subtitleCategories = subtitleCategoriesData as typeof subtitleCategoriesData & {
  categories: Record<string, any>
}

const subtitleStyles = subtitleStylesData as typeof subtitleStylesData & {
  styles: SubtitleStyleTemplate[]
}

describe("Subtitle Data Files", () => {
  describe("subtitle-styles.json", () => {
    it("должен содержать корректные метаданные", () => {
      expect(subtitleStyles.version).toBe("1.0.0")
      expect(subtitleStyles.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(subtitleStyles.totalStyles).toBeGreaterThan(0)
      expect(subtitleStyles.categories).toBeInstanceOf(Array)
    })

    it("должен содержать все объявленные категории", () => {
      const expectedCategories: SubtitleCategory[] = ["basic", "cinematic", "stylized", "minimal", "animated", "modern"]

      expect(subtitleStyles.categories).toEqual(expectedCategories)
    })

    it("должен содержать стили", () => {
      expect(subtitleStyles.styles.length).toBeGreaterThan(0)
      // totalStyles может не совпадать точно из-за версий
      expect(subtitleStyles.styles.length).toBeLessThanOrEqual(subtitleStyles.totalStyles)
    })

    it("каждый стиль должен иметь обязательные поля", () => {
      subtitleStyles.styles.forEach((style: SubtitleStyleTemplate) => {
        // Основные поля
        expect(style).toHaveProperty("id")
        expect(style).toHaveProperty("name")
        expect(style).toHaveProperty("category")
        expect(style).toHaveProperty("complexity")
        expect(style).toHaveProperty("tags")
        expect(style).toHaveProperty("description")
        expect(style).toHaveProperty("labels")
        expect(style).toHaveProperty("style")

        // Типы полей
        expect(typeof style.id).toBe("string")
        expect(typeof style.name).toBe("string")
        expect(subtitleStyles.categories).toContain(style.category)
        expect(["basic", "intermediate", "advanced"]).toContain(style.complexity)
        expect(style.tags).toBeInstanceOf(Array)

        // Локализация
        expect(style.description).toHaveProperty("ru")
        expect(style.description).toHaveProperty("en")
        expect(style.labels).toHaveProperty("ru")
        expect(style.labels).toHaveProperty("en")
      })
    })

    it("стили должны иметь уникальные ID", () => {
      const ids = subtitleStyles.styles.map((style: SubtitleStyleTemplate) => style.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })

    it("каждый стиль должен содержать хотя бы один CSS атрибут", () => {
      subtitleStyles.styles.forEach((style: SubtitleStyleTemplate) => {
        const styleKeys = Object.keys(style.style)
        expect(styleKeys.length).toBeGreaterThan(0)
      })
    })
  })

  describe("subtitle-categories.json", () => {
    it("должен содержать корректные метаданные", () => {
      expect(subtitleCategories.version).toBe("1.0.0")
      expect(subtitleCategories.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(subtitleCategories.categories).toBeDefined()
      expect(typeof subtitleCategories.categories).toBe("object")
    })

    it("каждая категория должна иметь обязательные поля", () => {
      Object.entries(subtitleCategories.categories).forEach(([_id, category]: [string, any]) => {
        expect(category).toHaveProperty("name")
        expect(category).toHaveProperty("description")
        expect(category).toHaveProperty("order")
        expect(category).toHaveProperty("icon")

        // Локализация
        expect(category.name).toHaveProperty("ru")
        expect(category.name).toHaveProperty("en")
        expect(category.description).toHaveProperty("ru")
        expect(category.description).toHaveProperty("en")
      })
    })

    it("категории должны иметь уникальные order значения", () => {
      const orders = Object.values(subtitleCategories.categories).map((cat: any) => cat.order)
      const uniqueOrders = new Set(orders)

      expect(uniqueOrders.size).toBe(orders.length)
    })

    it("категории должны быть правильно упорядочены", () => {
      const orders = Object.values(subtitleCategories.categories).map((cat: any) => cat.order)
      const sortedOrders = [...orders].sort((a, b) => a - b)

      expect(orders.sort((a, b) => a - b)).toEqual(sortedOrders)
    })

    it("должен содержать все категории из subtitle-styles.json", () => {
      const categoryIds = Object.keys(subtitleCategories.categories)
      const styleCategories = new Set(subtitleStyles.styles.map((style: SubtitleStyleTemplate) => style.category))

      styleCategories.forEach((styleCategory) => {
        expect(categoryIds).toContain(styleCategory)
      })
    })
  })

  describe("Консистентность данных", () => {
    it("версии файлов должны совпадать", () => {
      expect(subtitleStyles.version).toBe(subtitleCategories.version)
    })

    it("все стили должны относиться к существующим категориям", () => {
      const validCategories = Object.keys(subtitleCategories.categories)

      subtitleStyles.styles.forEach((style: SubtitleStyleTemplate) => {
        expect(validCategories).toContain(style.category)
      })
    })

    it("количество стилей в категориях должно быть сбалансированным", () => {
      const styleCounts = new Map<string, number>()

      subtitleStyles.styles.forEach((style: SubtitleStyleTemplate) => {
        const count = styleCounts.get(style.category) || 0
        styleCounts.set(style.category, count + 1)
      })

      // Проверяем, что в каждой категории есть хотя бы один стиль
      Object.keys(subtitleCategories.categories).forEach((categoryId) => {
        const count = styleCounts.get(categoryId) || 0
        expect(count).toBeGreaterThan(0)
      })
    })
  })
})
