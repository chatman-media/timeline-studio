/**
 * Тесты для custom-templates-storage
 */

import { beforeEach, describe, expect, it } from "vitest"
import type { StyleTemplate } from "../../types"
import {
  addCustomTemplate,
  clearCustomTemplates,
  deleteCustomTemplate,
  getCustomTemplate,
  isCustomTemplate,
  loadCustomTemplates,
  saveCustomTemplates,
  updateCustomTemplate,
} from "../../utils/custom-templates-storage"

describe("custom-templates-storage", () => {
  const mockTemplate: StyleTemplate = {
    id: "custom-1",
    name: { ru: "Пользовательский", en: "Custom" },
    category: "intro",
    style: "modern",
    aspectRatio: "16:9",
    duration: 3,
    hasText: true,
    hasAnimation: true,
    elements: [],
  }

  beforeEach(() => {
    // Очищаем localStorage перед каждым тестом
    localStorage.clear()
  })

  describe("loadCustomTemplates", () => {
    it("должен возвращать пустой массив, если нет сохраненных шаблонов", () => {
      const templates = loadCustomTemplates()
      expect(templates).toEqual([])
    })

    it("должен загружать сохраненные шаблоны", () => {
      const templates = [mockTemplate]
      localStorage.setItem("timeline-studio-custom-templates", JSON.stringify(templates))

      const loaded = loadCustomTemplates()
      expect(loaded).toEqual(templates)
    })
  })

  describe("saveCustomTemplates", () => {
    it("должен сохранять шаблоны в localStorage", () => {
      const templates = [mockTemplate]
      saveCustomTemplates(templates)

      const stored = localStorage.getItem("timeline-studio-custom-templates")
      expect(stored).toBe(JSON.stringify(templates))
    })
  })

  describe("addCustomTemplate", () => {
    it("должен добавлять новый шаблон", () => {
      addCustomTemplate(mockTemplate)

      const loaded = loadCustomTemplates()
      expect(loaded).toHaveLength(1)
      expect(loaded[0]).toEqual(mockTemplate)
    })

    it("должен выбрасывать ошибку при добавлении дубликата", () => {
      addCustomTemplate(mockTemplate)

      expect(() => {
        addCustomTemplate(mockTemplate)
      }).toThrow('Шаблон с ID "custom-1" уже существует')
    })
  })

  describe("updateCustomTemplate", () => {
    it("должен обновлять существующий шаблон", () => {
      addCustomTemplate(mockTemplate)

      const updated = { ...mockTemplate, duration: 5 }
      updateCustomTemplate(updated)

      const loaded = loadCustomTemplates()
      expect(loaded[0].duration).toBe(5)
    })

    it("должен выбрасывать ошибку при обновлении несуществующего шаблона", () => {
      expect(() => {
        updateCustomTemplate(mockTemplate)
      }).toThrow('Шаблон с ID "custom-1" не найден')
    })
  })

  describe("deleteCustomTemplate", () => {
    it("должен удалять шаблон", () => {
      addCustomTemplate(mockTemplate)
      deleteCustomTemplate("custom-1")

      const loaded = loadCustomTemplates()
      expect(loaded).toHaveLength(0)
    })

    it("должен выбрасывать ошибку при удалении несуществующего шаблона", () => {
      expect(() => {
        deleteCustomTemplate("non-existent")
      }).toThrow('Шаблон с ID "non-existent" не найден')
    })
  })

  describe("getCustomTemplate", () => {
    it("должен возвращать шаблон по ID", () => {
      addCustomTemplate(mockTemplate)

      const template = getCustomTemplate("custom-1")
      expect(template).toEqual(mockTemplate)
    })

    it("должен возвращать null для несуществующего шаблона", () => {
      const template = getCustomTemplate("non-existent")
      expect(template).toBe(null)
    })
  })

  describe("isCustomTemplate", () => {
    it("должен возвращать true для пользовательского шаблона", () => {
      addCustomTemplate(mockTemplate)

      expect(isCustomTemplate("custom-1")).toBe(true)
    })

    it("должен возвращать false для несуществующего шаблона", () => {
      expect(isCustomTemplate("non-existent")).toBe(false)
    })
  })

  describe("clearCustomTemplates", () => {
    it("должен удалять все пользовательские шаблоны", () => {
      addCustomTemplate(mockTemplate)
      clearCustomTemplates()

      const loaded = loadCustomTemplates()
      expect(loaded).toHaveLength(0)
    })
  })
})
