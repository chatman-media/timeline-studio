/**
 * Тесты для prompt templates
 */

import { describe, expect, it } from "vitest"
import { CONTEXTUAL_PROMPTS, EMPTY_STATE_PROMPTS, UNIVERSAL_PROMPTS } from "../prompt-templates"

describe("Prompt Templates", () => {
  describe("UNIVERSAL_PROMPTS", () => {
    it("должен содержать все универсальные промпты", () => {
      expect(UNIVERSAL_PROMPTS).toBeDefined()
      expect(UNIVERSAL_PROMPTS.length).toBeGreaterThan(0)
    })

    it("каждый промпт должен иметь требуемые поля", () => {
      UNIVERSAL_PROMPTS.forEach((prompt) => {
        expect(prompt).toHaveProperty("id")
        expect(prompt).toHaveProperty("emoji")
        expect(prompt).toHaveProperty("text")
        expect(prompt).toHaveProperty("category")
        expect(prompt).toHaveProperty("priority")

        expect(typeof prompt.id).toBe("string")
        expect(typeof prompt.emoji).toBe("string")
        expect(typeof prompt.text).toBe("string")
        expect(typeof prompt.category).toBe("string")
        expect(typeof prompt.priority).toBe("number")
      })
    })

    it("должен содержать платформенные промпты", () => {
      const platformPrompts = UNIVERSAL_PROMPTS.filter((p) => p.category === "platform")

      expect(platformPrompts.length).toBeGreaterThan(0)
      expect(platformPrompts.some((p) => p.text.includes("TikTok"))).toBe(true)
      expect(platformPrompts.some((p) => p.text.includes("Instagram"))).toBe(true)
      expect(platformPrompts.some((p) => p.text.includes("YouTube"))).toBe(true)
    })

    it("должен содержать быстрые промпты", () => {
      const quickPrompts = UNIVERSAL_PROMPTS.filter((p) => p.category === "quick")

      expect(quickPrompts.length).toBeGreaterThan(0)
      expect(quickPrompts.some((p) => p.text.includes("тизер"))).toBe(true)
      expect(quickPrompts.some((p) => p.text.includes("трейлер"))).toBe(true)
    })

    it("все промпты должны иметь уникальные ID", () => {
      const ids = UNIVERSAL_PROMPTS.map((p) => p.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })

    it("приоритеты должны быть положительными числами", () => {
      UNIVERSAL_PROMPTS.forEach((prompt) => {
        expect(prompt.priority).toBeGreaterThan(0)
      })
    })
  })

  describe("CONTEXTUAL_PROMPTS", () => {
    it("должен содержать контекстные промпты", () => {
      expect(CONTEXTUAL_PROMPTS).toBeDefined()
      expect(CONTEXTUAL_PROMPTS.length).toBeGreaterThan(0)
    })

    it("каждый промпт должен иметь requiredConditions", () => {
      CONTEXTUAL_PROMPTS.forEach((prompt) => {
        expect(prompt).toHaveProperty("requiredConditions")
        expect(typeof prompt.requiredConditions).toBe("object")
      })
    })

    it("должен содержать музыкальные промпты", () => {
      const musicPrompts = CONTEXTUAL_PROMPTS.filter((p) => p.requiredConditions?.hasMusic === true)

      expect(musicPrompts.length).toBeGreaterThan(0)
      expect(musicPrompts.some((p) => p.text.includes("музык"))).toBe(true)
    })

    it("должен содержать промпты для динамичных сцен", () => {
      const dynamicPrompts = CONTEXTUAL_PROMPTS.filter((p) => p.requiredConditions?.minScenes !== undefined)

      expect(dynamicPrompts.length).toBeGreaterThan(0)
      expect(
        dynamicPrompts.some(
          (p) =>
            p.text.toLowerCase().includes("динамичн") ||
            p.text.toLowerCase().includes("энергичн") ||
            p.text.toLowerCase().includes("спорт"),
        ),
      ).toBe(true)
    })

    it("должен содержать промпты для обнаружения лиц", () => {
      const facePrompts = CONTEXTUAL_PROMPTS.filter((p) => p.requiredConditions?.hasFaces === true)

      expect(facePrompts.length).toBeGreaterThan(0)
      expect(facePrompts.some((p) => p.text.includes("люд"))).toBe(true)
    })

    it("должен содержать промпты для длинных сцен", () => {
      const longScenePrompts = CONTEXTUAL_PROMPTS.filter((p) => p.requiredConditions?.avgSceneDuration !== undefined)

      expect(longScenePrompts.length).toBeGreaterThan(0)
      expect(
        longScenePrompts.some(
          (p) =>
            p.text.toLowerCase().includes("кинематограф") ||
            p.text.toLowerCase().includes("медитатив") ||
            p.text.toLowerCase().includes("плавн"),
        ),
      ).toBe(true)
    })

    it("должен содержать промпты для низкого качества", () => {
      const qualityPrompts = CONTEXTUAL_PROMPTS.filter((p) => p.requiredConditions?.hasLowQuality === true)

      expect(qualityPrompts.length).toBeGreaterThan(0)
      expect(qualityPrompts.some((p) => p.text.includes("качеств"))).toBe(true)
    })

    it("должен содержать промпты для речи", () => {
      const speechPrompts = CONTEXTUAL_PROMPTS.filter((p) => p.requiredConditions?.hasSpeech === true)

      expect(speechPrompts.length).toBeGreaterThan(0)
      expect(
        speechPrompts.some(
          (p) =>
            p.text.toLowerCase().includes("влог") ||
            p.text.toLowerCase().includes("документальн") ||
            p.text.toLowerCase().includes("разговор"),
        ),
      ).toBe(true)
    })

    it("должен содержать промпты для монтажа", () => {
      const montagePrompts = CONTEXTUAL_PROMPTS.filter((p) => p.category === "montage")

      expect(montagePrompts.length).toBeGreaterThan(0)
      expect(montagePrompts.some((p) => p.text.includes("монтаж"))).toBe(true)
    })

    it("все промпты должны иметь уникальные ID", () => {
      const ids = CONTEXTUAL_PROMPTS.map((p) => p.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })

    it("requiredConditions должны быть валидными", () => {
      CONTEXTUAL_PROMPTS.forEach((prompt) => {
        const conditions = prompt.requiredConditions

        if (conditions) {
          // Проверяем типы условий
          if ("hasMusic" in conditions) {
            expect(typeof conditions.hasMusic).toBe("boolean")
          }
          if ("hasFaces" in conditions) {
            expect(typeof conditions.hasFaces).toBe("boolean")
          }
          if ("hasSpeech" in conditions) {
            expect(typeof conditions.hasSpeech).toBe("boolean")
          }
          if ("hasLowQuality" in conditions) {
            expect(typeof conditions.hasLowQuality).toBe("boolean")
          }
          if ("hasScenes" in conditions) {
            expect(typeof conditions.hasScenes).toBe("boolean")
          }
          if ("minScenes" in conditions) {
            expect(typeof conditions.minScenes).toBe("number")
            expect(conditions.minScenes).toBeGreaterThan(0)
          }
          if ("avgSceneDuration" in conditions) {
            expect(typeof conditions.avgSceneDuration).toBe("number")
            expect(conditions.avgSceneDuration).toBeGreaterThan(0)
          }
        }
      })
    })
  })

  describe("EMPTY_STATE_PROMPTS", () => {
    it("должен содержать промпты для пустого состояния", () => {
      expect(EMPTY_STATE_PROMPTS).toBeDefined()
      expect(EMPTY_STATE_PROMPTS.length).toBeGreaterThan(0)
    })

    it("каждый промпт должен иметь требуемые поля", () => {
      EMPTY_STATE_PROMPTS.forEach((prompt) => {
        expect(prompt).toHaveProperty("id")
        expect(prompt).toHaveProperty("emoji")
        expect(prompt).toHaveProperty("text")
        expect(prompt).toHaveProperty("category")
        expect(prompt).toHaveProperty("priority")
      })
    })

    it("должен содержать помогающие промпты", () => {
      expect(EMPTY_STATE_PROMPTS.some((p) => p.text.includes("импортировать"))).toBe(true)
      expect(EMPTY_STATE_PROMPTS.some((p) => p.text.includes("начать"))).toBe(true)
      expect(EMPTY_STATE_PROMPTS.some((p) => p.text.includes("умеет"))).toBe(true)
    })

    it("все промпты должны быть категории universal", () => {
      EMPTY_STATE_PROMPTS.forEach((prompt) => {
        expect(prompt.category).toBe("universal")
      })
    })

    it("все промпты должны иметь уникальные ID", () => {
      const ids = EMPTY_STATE_PROMPTS.map((p) => p.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe("Общие проверки", () => {
    it("все ID должны быть уникальными между всеми категориями", () => {
      const allIds = [...UNIVERSAL_PROMPTS, ...CONTEXTUAL_PROMPTS, ...EMPTY_STATE_PROMPTS].map((p) => p.id)

      const uniqueIds = new Set(allIds)

      expect(uniqueIds.size).toBe(allIds.length)
    })

    it("приоритеты должны помогать правильной сортировке", () => {
      // Контекстные промпты обычно имеют более высокий приоритет
      const allPrompts = [...UNIVERSAL_PROMPTS, ...CONTEXTUAL_PROMPTS]
      const sortedByPriority = [...allPrompts].sort((a, b) => b.priority - a.priority)

      // Проверяем, что приоритеты являются числами и различаются
      expect(sortedByPriority.every((p) => typeof p.priority === "number")).toBe(true)

      // Проверяем, что есть разброс в приоритетах
      const priorities = allPrompts.map((p) => p.priority)
      const uniquePriorities = new Set(priorities)
      expect(uniquePriorities.size).toBeGreaterThan(1)
    })

    it("все промпты должны иметь эмодзи", () => {
      const allPrompts = [...UNIVERSAL_PROMPTS, ...CONTEXTUAL_PROMPTS, ...EMPTY_STATE_PROMPTS]

      allPrompts.forEach((prompt) => {
        expect(prompt.emoji.length).toBeGreaterThan(0)
      })
    })

    it("все промпты должны иметь читаемый текст", () => {
      const allPrompts = [...UNIVERSAL_PROMPTS, ...CONTEXTUAL_PROMPTS, ...EMPTY_STATE_PROMPTS]

      allPrompts.forEach((prompt) => {
        expect(prompt.text.length).toBeGreaterThan(10)
      })
    })
  })
})
