/**
 * Тесты для ToolRegistry
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { BaseAITool } from "../../base/base-ai-tool"
import { ToolRegistry } from "../../base/tool-registry"
import type { AIToolMetadata, IAITool } from "../../types"

// Тестовые инструменты
class TestTool extends BaseAITool {
  constructor(metadata: AIToolMetadata) {
    super(metadata)
  }

  async execute(input: any) {
    return this.executeWithErrorHandling(async () => ({ result: "test" }), input)
  }

  validate(input: any): boolean {
    return true
  }

  getSchema() {
    return { input: {}, output: {} }
  }
}

function createTestTool(name: string, domain: any = "core", category: any = "timeline", tags: string[] = []): IAITool {
  return new TestTool({
    name,
    domain,
    category,
    description: `Тестовый инструмент ${name}`,
    version: "1.0.0",
    author: "Test",
    tags,
    examples: [],
    dependencies: [],
  })
}

describe("ToolRegistry", () => {
  let registry: ToolRegistry

  beforeEach(() => {
    // Создаем новый экземпляр для каждого теста
    registry = new (ToolRegistry as any)()
    registry.clear()
  })

  describe("Регистрация инструментов", () => {
    it("должен регистрировать инструмент", () => {
      const tool = createTestTool("test-tool")

      expect(() => registry.register(tool)).not.toThrow()

      const retrieved = registry.get("test-tool")
      expect(retrieved).toBe(tool)
    })

    it("должен выбрасывать ошибку при дублировании имен", () => {
      const tool1 = createTestTool("duplicate-tool")
      const tool2 = createTestTool("duplicate-tool")

      registry.register(tool1)

      expect(() => registry.register(tool2)).toThrow("уже зарегистрирован")
    })

    it("должен обновлять индексы при регистрации", () => {
      const tool = createTestTool("indexed-tool", "core", "timeline", ["test", "index"])

      registry.register(tool)

      const byDomain = registry.getByDomain("core")
      const byCategory = registry.getByCategory("timeline")

      expect(byDomain).toContain(tool)
      expect(byCategory).toContain(tool)
    })
  })

  describe("Отмена регистрации", () => {
    it("должен отменять регистрацию инструмента", () => {
      const tool = createTestTool("removable-tool")

      registry.register(tool)
      expect(registry.get("removable-tool")).toBe(tool)

      registry.unregister("removable-tool")
      expect(registry.get("removable-tool")).toBeUndefined()
    })

    it("должен выбрасывать ошибку при попытке удалить несуществующий инструмент", () => {
      expect(() => registry.unregister("non-existent")).toThrow("не найден")
    })
  })

  describe("Получение инструментов", () => {
    beforeEach(() => {
      registry.register(createTestTool("tool1", "core", "timeline"))
      registry.register(createTestTool("tool2", "core", "browser"))
      registry.register(createTestTool("tool3", "analysis", "video-analysis"))
    })

    it("должен получать инструмент по имени", () => {
      const tool = registry.get("tool1")
      expect(tool?.metadata.name).toBe("tool1")
    })

    it("должен возвращать undefined для несуществующего инструмента", () => {
      const tool = registry.get("non-existent")
      expect(tool).toBeUndefined()
    })

    it("должен получать инструменты по домену", () => {
      const coreTools = registry.getByDomain("core")
      const analysisTools = registry.getByDomain("analysis")

      expect(coreTools).toHaveLength(2)
      expect(analysisTools).toHaveLength(1)
      expect(coreTools.map((t) => t.metadata.name)).toEqual(["tool1", "tool2"])
    })

    it("должен получать инструменты по категории", () => {
      const timelineTools = registry.getByCategory("timeline")
      const browserTools = registry.getByCategory("browser")

      expect(timelineTools).toHaveLength(1)
      expect(browserTools).toHaveLength(1)
      expect(timelineTools[0].metadata.name).toBe("tool1")
    })

    it("должен возвращать список всех инструментов", () => {
      const list = registry.list()

      expect(list).toHaveLength(3)
      expect(list.map((info) => info.name)).toEqual(["tool1", "tool2", "tool3"])
    })

    it("должен обновлять статистику использования", () => {
      const tool = registry.get("tool1")
      const info = registry.list().find((i) => i.name === "tool1")

      expect(info?.usageCount).toBe(1)
      expect(info?.lastUsed).toBeInstanceOf(Date)
    })
  })

  describe("Поиск инструментов", () => {
    beforeEach(() => {
      registry.register(createTestTool("video-editor", "core", "timeline", ["video", "editing"]))
      registry.register(createTestTool("audio-mixer", "core", "timeline", ["audio", "mixing"]))
      registry.register(createTestTool("video-analyzer", "analysis", "video-analysis", ["video", "analysis"]))
    })

    it("должен находить инструменты по точному совпадению имени", () => {
      const result = registry.search("video-editor")

      expect(result.totalResults).toBe(1)
      expect(result.tools[0].toolName).toBe("video-editor")
      expect(result.tools[0].score).toBeGreaterThanOrEqual(100)
    })

    it("должен находить инструменты по частичному совпадению", () => {
      const result = registry.search("video")

      expect(result.totalResults).toBe(2)
      // Проверяем, что оба инструмента найдены, порядок может отличаться
      const toolNames = result.tools.map((t) => t.toolName)
      expect(toolNames).toContain("video-editor")
      expect(toolNames).toContain("video-analyzer")
    })

    it("должен сортировать результаты по релевантности", () => {
      const result = registry.search("video")

      // video-editor должен быть выше, так как содержит "video" в имени
      expect(result.tools[0].score).toBeGreaterThan(result.tools[1].score)
    })

    it("должен поддерживать фильтры", () => {
      const result = registry.search("video", {
        domain: "analysis",
      })

      expect(result.totalResults).toBe(1)
      expect(result.tools[0].toolName).toBe("video-analyzer")
    })

    it("должен возвращать метаданные поиска", () => {
      const result = registry.search("test")

      expect(result.query).toBe("test")
      expect(result.executionTime).toBeGreaterThan(0)
      expect(result.appliedFilters).toEqual({})
      expect(result.metadata.searchAlgorithm).toBe("simple_text_matching")
    })

    it("должен генерировать предложения при малом количестве результатов", () => {
      const result = registry.search("xyz")

      expect(result.totalResults).toBe(0)
      expect(result.suggestions).toBeDefined()
    })
  })

  describe("Статистика", () => {
    beforeEach(() => {
      registry.register(createTestTool("tool1", "core", "timeline"))
      registry.register(createTestTool("tool2", "core", "browser"))
      registry.register(createTestTool("tool3", "analysis", "video-analysis"))

      // Симулируем использование
      registry.get("tool1")
      registry.get("tool1")
      registry.get("tool2")
    })

    it("должен возвращать общую статистику", () => {
      const stats = registry.getStatistics()

      expect(stats.totalTools).toBe(3)
      expect(stats.byDomain.core).toBe(2)
      expect(stats.byDomain.analysis).toBe(1)
      expect(stats.byCategory.timeline).toBe(1)
      expect(stats.byCategory.browser).toBe(1)
    })

    it("должен отслеживать самые используемые инструменты", () => {
      const stats = registry.getStatistics()

      expect(stats.mostUsed).toHaveLength(3)
      expect(stats.mostUsed[0].name).toBe("tool1")
      expect(stats.mostUsed[0].usageCount).toBe(2)
      expect(stats.mostUsed[1].name).toBe("tool2")
      expect(stats.mostUsed[1].usageCount).toBe(1)
    })
  })

  describe("Очистка реестра", () => {
    it("должен очищать все данные", () => {
      registry.register(createTestTool("tool1"))
      registry.register(createTestTool("tool2"))

      expect(registry.list()).toHaveLength(2)

      registry.clear()

      expect(registry.list()).toHaveLength(0)
      expect(registry.get("tool1")).toBeUndefined()
    })
  })

  describe("Singleton pattern", () => {
    it("должен возвращать один и тот же экземпляр", () => {
      const instance1 = ToolRegistry.getInstance()
      const instance2 = ToolRegistry.getInstance()

      expect(instance1).toBe(instance2)
    })
  })
})
