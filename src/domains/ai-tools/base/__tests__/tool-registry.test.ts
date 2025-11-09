/**
 * Тесты для ToolRegistry
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { ToolRegistry } from "../tool-registry"
import { SimpleTestTool, DelayedTestTool, ErrorTestTool, InvalidInputTestTool } from "../../__mocks__"

describe("ToolRegistry", () => {
  let registry: ToolRegistry

  beforeEach(() => {
    registry = ToolRegistry.getInstance()
    registry.clear()
  })

  afterEach(() => {
    registry.clear()
  })

  describe("Singleton", () => {
    it("должен возвращать единственный экземпляр", () => {
      const instance1 = ToolRegistry.getInstance()
      const instance2 = ToolRegistry.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe("Регистрация инструментов", () => {
    it("должен успешно регистрировать инструмент", () => {
      const tool = new SimpleTestTool()

      expect(() => registry.register(tool)).not.toThrow()

      const registered = registry.get("SimpleTestTool")
      expect(registered).toBe(tool)
    })

    it("должен выбросить ошибку при дублирующейся регистрации", () => {
      const tool1 = new SimpleTestTool()
      const tool2 = new SimpleTestTool()

      registry.register(tool1)

      expect(() => registry.register(tool2)).toThrow(
        'Инструмент с именем "SimpleTestTool" уже зарегистрирован',
      )
    })

    it("должен корректно регистрировать несколько инструментов", () => {
      const tool1 = new SimpleTestTool()
      const tool2 = new DelayedTestTool()
      const tool3 = new ErrorTestTool()

      registry.register(tool1)
      registry.register(tool2)
      registry.register(tool3)

      expect(registry.get("SimpleTestTool")).toBe(tool1)
      expect(registry.get("DelayedTestTool")).toBe(tool2)
      expect(registry.get("ErrorTestTool")).toBe(tool3)
    })

    it("должен создавать информацию об инструменте при регистрации", () => {
      const tool = new SimpleTestTool()
      registry.register(tool)

      const tools = registry.list()
      expect(tools).toHaveLength(1)
      expect(tools[0]).toMatchObject({
        name: "SimpleTestTool",
        domain: "core",
        category: "timeline",
        isLoaded: true,
        usageCount: 0,
      })
    })
  })

  describe("Отмена регистрации", () => {
    it("должен успешно отменить регистрацию инструмента", () => {
      const tool = new SimpleTestTool()
      registry.register(tool)

      expect(registry.get("SimpleTestTool")).toBe(tool)

      registry.unregister("SimpleTestTool")

      expect(registry.get("SimpleTestTool")).toBeUndefined()
    })

    it("должен выбросить ошибку при отмене регистрации несуществующего инструмента", () => {
      expect(() => registry.unregister("NonExistentTool")).toThrow('Инструмент "NonExistentTool" не найден')
    })

    it("должен очистить все индексы при отмене регистрации", () => {
      const tool = new SimpleTestTool()
      registry.register(tool)

      const beforeUnregister = registry.getByDomain("core")
      expect(beforeUnregister).toHaveLength(1)

      registry.unregister("SimpleTestTool")

      const afterUnregister = registry.getByDomain("core")
      expect(afterUnregister).toHaveLength(0)
    })
  })

  describe("Получение инструментов", () => {
    beforeEach(() => {
      registry.register(new SimpleTestTool())
      registry.register(new DelayedTestTool())
      registry.register(new ErrorTestTool())
      registry.register(new InvalidInputTestTool())
    })

    it("должен получать инструмент по имени", () => {
      const tool = registry.get("SimpleTestTool")

      expect(tool).toBeInstanceOf(SimpleTestTool)
      expect(tool?.getToolName()).toBe("SimpleTestTool")
    })

    it("должен возвращать undefined для несуществующего инструмента", () => {
      const tool = registry.get("NonExistentTool")

      expect(tool).toBeUndefined()
    })

    it("должен увеличивать счетчик использования при получении инструмента", () => {
      const toolsBefore = registry.list()
      const toolInfo = toolsBefore.find((t) => t.name === "SimpleTestTool")!
      const usageCountBefore = toolInfo.usageCount

      registry.get("SimpleTestTool")
      registry.get("SimpleTestTool")

      const toolsAfter = registry.list()
      const toolInfoAfter = toolsAfter.find((t) => t.name === "SimpleTestTool")!

      expect(toolInfoAfter.usageCount).toBe(usageCountBefore + 2)
    })

    it("должен устанавливать lastUsed при получении инструмента", () => {
      const toolsBefore = registry.list()
      const toolInfo = toolsBefore.find((t) => t.name === "SimpleTestTool")!
      expect(toolInfo.lastUsed).toBeUndefined()

      registry.get("SimpleTestTool")

      const toolsAfter = registry.list()
      const toolInfoAfter = toolsAfter.find((t) => t.name === "SimpleTestTool")!
      expect(toolInfoAfter.lastUsed).toBeInstanceOf(Date)
    })
  })

  describe("Получение по домену", () => {
    beforeEach(() => {
      registry.register(new SimpleTestTool()) // core
      registry.register(new DelayedTestTool()) // analysis
      registry.register(new ErrorTestTool()) // core
      registry.register(new InvalidInputTestTool()) // automation
    })

    it("должен получать инструменты по домену core", () => {
      const coreTools = registry.getByDomain("core")

      expect(coreTools).toHaveLength(2)
      expect(coreTools.map((t) => t.getToolName())).toContain("SimpleTestTool")
      expect(coreTools.map((t) => t.getToolName())).toContain("ErrorTestTool")
    })

    it("должен получать инструменты по домену analysis", () => {
      const analysisTools = registry.getByDomain("analysis")

      expect(analysisTools).toHaveLength(1)
      expect(analysisTools[0].getToolName()).toBe("DelayedTestTool")
    })

    it("должен получать инструменты по домену automation", () => {
      const automationTools = registry.getByDomain("automation")

      expect(automationTools).toHaveLength(1)
      expect(automationTools[0].getToolName()).toBe("InvalidInputTestTool")
    })

    it("должен возвращать пустой массив для домена без инструментов", () => {
      const integrationTools = registry.getByDomain("integration")

      expect(integrationTools).toHaveLength(0)
    })
  })

  describe("Получение по категории", () => {
    beforeEach(() => {
      registry.register(new SimpleTestTool()) // timeline
      registry.register(new DelayedTestTool()) // video-analysis
      registry.register(new ErrorTestTool()) // timeline
      registry.register(new InvalidInputTestTool()) // batch-processing
    })

    it("должен получать инструменты по категории timeline", () => {
      const timelineTools = registry.getByCategory("timeline")

      expect(timelineTools).toHaveLength(2)
      expect(timelineTools.map((t) => t.getToolName())).toContain("SimpleTestTool")
      expect(timelineTools.map((t) => t.getToolName())).toContain("ErrorTestTool")
    })

    it("должен получать инструменты по категории video-analysis", () => {
      const videoTools = registry.getByCategory("video-analysis")

      expect(videoTools).toHaveLength(1)
      expect(videoTools[0].getToolName()).toBe("DelayedTestTool")
    })

    it("должен возвращать пустой массив для категории без инструментов", () => {
      const resourceTools = registry.getByCategory("resources")

      expect(resourceTools).toHaveLength(0)
    })
  })

  describe("Список инструментов", () => {
    it("должен возвращать список всех зарегистрированных инструментов", () => {
      registry.register(new SimpleTestTool())
      registry.register(new DelayedTestTool())
      registry.register(new ErrorTestTool())

      const tools = registry.list()

      expect(tools).toHaveLength(3)
      expect(tools.map((t) => t.name)).toContain("SimpleTestTool")
      expect(tools.map((t) => t.name)).toContain("DelayedTestTool")
      expect(tools.map((t) => t.name)).toContain("ErrorTestTool")
    })

    it("должен возвращать пустой массив для пустого реестра", () => {
      const tools = registry.list()

      expect(tools).toHaveLength(0)
    })
  })

  describe("Поиск инструментов", () => {
    beforeEach(() => {
      registry.register(new SimpleTestTool())
      registry.register(new DelayedTestTool())
      registry.register(new ErrorTestTool())
      registry.register(new InvalidInputTestTool())
    })

    it("должен находить инструменты по полному имени", () => {
      const result = registry.search("SimpleTestTool")

      expect(result.totalResults).toBe(1)
      expect(result.tools[0].toolName).toBe("SimpleTestTool")
      expect(result.tools[0].score).toBeGreaterThan(0)
    })

    it("должен находить инструменты по частичному совпадению имени", () => {
      const result = registry.search("test")

      expect(result.totalResults).toBeGreaterThan(0)
      expect(result.tools.map((t) => t.toolName)).toContain("SimpleTestTool")
    })

    it("должен находить инструменты по описанию", () => {
      const result = registry.search("simple")

      expect(result.totalResults).toBeGreaterThan(0)
      const found = result.tools.find((t) => t.toolName === "SimpleTestTool")
      expect(found).toBeDefined()
    })

    it("должен находить инструменты по тегам", () => {
      const result = registry.search("delay")

      expect(result.totalResults).toBeGreaterThan(0)
      const found = result.tools.find((t) => t.toolName === "DelayedTestTool")
      expect(found).toBeDefined()
    })

    it("должен сортировать результаты по релевантности", () => {
      const result = registry.search("test")

      expect(result.tools.length).toBeGreaterThan(1)
      // Результаты должны быть отсортированы по убыванию score
      for (let i = 1; i < result.tools.length; i++) {
        expect(result.tools[i - 1].score).toBeGreaterThanOrEqual(result.tools[i].score)
      }
    })

    it("должен применять фильтры по домену", () => {
      const result = registry.search("test", { domain: "core" })

      expect(result.totalResults).toBeGreaterThan(0)
      result.tools.forEach((tool) => {
        expect(tool.metadata.domain).toBe("core")
      })
    })

    it("должен применять фильтры по категории", () => {
      const result = registry.search("test", { category: "timeline" })

      expect(result.totalResults).toBeGreaterThan(0)
      result.tools.forEach((tool) => {
        expect(tool.metadata.category).toBe("timeline")
      })
    })

    it("должен применять фильтры по тегам", () => {
      const result = registry.search("tool", { tags: ["test"] })

      expect(result.totalResults).toBeGreaterThan(0)
      result.tools.forEach((tool) => {
        expect(tool.metadata.tags).toContain("test")
      })
    })

    it("должен возвращать пустой результат для несуществующего запроса", () => {
      const result = registry.search("nonexistent12345")

      expect(result.totalResults).toBe(0)
      expect(result.tools).toHaveLength(0)
    })

    it("должен включать метаданные в результаты поиска", () => {
      const result = registry.search("test")

      expect(result.metadata).toBeDefined()
      expect(result.metadata.searchAlgorithm).toBe("simple_text_matching")
      expect(result.metadata.indexVersion).toBeTruthy()
    })

    it("должен возвращать executionTime", () => {
      const result = registry.search("test")

      expect(result.executionTime).toBeGreaterThan(0)
    })

    it("должен предоставлять highlights для совпадений", () => {
      const result = registry.search("simple")

      const found = result.tools.find((t) => t.toolName === "SimpleTestTool")
      expect(found).toBeDefined()
      expect(found?.highlights).toBeDefined()
    })

    it("должен предоставлять matchedFields для совпадений", () => {
      const result = registry.search("simple")

      const found = result.tools.find((t) => t.toolName === "SimpleTestTool")
      expect(found).toBeDefined()
      expect(found?.matchedFields).toBeInstanceOf(Array)
      expect(found?.matchedFields.length).toBeGreaterThan(0)
    })
  })

  describe("Статистика", () => {
    beforeEach(() => {
      registry.register(new SimpleTestTool()) // core, timeline
      registry.register(new DelayedTestTool()) // analysis, video-analysis
      registry.register(new ErrorTestTool()) // core, timeline
      registry.register(new InvalidInputTestTool()) // automation, batch-processing
    })

    it("должен возвращать общее количество инструментов", () => {
      const stats = registry.getStatistics()

      expect(stats.totalTools).toBe(4)
    })

    it("должен группировать инструменты по доменам", () => {
      const stats = registry.getStatistics()

      expect(stats.byDomain.core).toBe(2)
      expect(stats.byDomain.analysis).toBe(1)
      expect(stats.byDomain.automation).toBe(1)
    })

    it("должен группировать инструменты по категориям", () => {
      const stats = registry.getStatistics()

      expect(stats.byCategory.timeline).toBe(2)
      expect(stats.byCategory["video-analysis"]).toBe(1)
      expect(stats.byCategory["batch-processing"]).toBe(1)
    })

    it("должен отслеживать наиболее используемые инструменты", () => {
      // Используем инструменты с разной частотой
      registry.get("SimpleTestTool")
      registry.get("SimpleTestTool")
      registry.get("SimpleTestTool")
      registry.get("DelayedTestTool")
      registry.get("DelayedTestTool")
      registry.get("ErrorTestTool")

      const stats = registry.getStatistics()

      expect(stats.mostUsed).toHaveLength(4)
      expect(stats.mostUsed[0].name).toBe("SimpleTestTool")
      expect(stats.mostUsed[0].usageCount).toBe(3)
      expect(stats.mostUsed[1].name).toBe("DelayedTestTool")
      expect(stats.mostUsed[1].usageCount).toBe(2)
    })

    it("должен ограничивать список наиболее используемых инструментов топ-10", () => {
      const stats = registry.getStatistics()

      expect(stats.mostUsed.length).toBeLessThanOrEqual(10)
    })
  })

  describe("Очистка реестра", () => {
    it("должен очистить все инструменты", () => {
      registry.register(new SimpleTestTool())
      registry.register(new DelayedTestTool())
      registry.register(new ErrorTestTool())

      expect(registry.list()).toHaveLength(3)

      registry.clear()

      expect(registry.list()).toHaveLength(0)
    })

    it("должен очистить все индексы", () => {
      registry.register(new SimpleTestTool())
      registry.register(new DelayedTestTool())

      expect(registry.getByDomain("core")).toHaveLength(1)
      expect(registry.getByDomain("analysis")).toHaveLength(1)

      registry.clear()

      expect(registry.getByDomain("core")).toHaveLength(0)
      expect(registry.getByDomain("analysis")).toHaveLength(0)
    })

    it("должен переинициализировать индексы доменов после очистки", () => {
      registry.clear()

      expect(() => registry.getByDomain("core")).not.toThrow()
      expect(() => registry.getByDomain("analysis")).not.toThrow()
      expect(() => registry.getByDomain("automation")).not.toThrow()
      expect(() => registry.getByDomain("integration")).not.toThrow()
    })
  })
})
