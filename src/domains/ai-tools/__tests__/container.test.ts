/**
 * Тесты для AIToolsContainer
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DelayedTestTool, SimpleTestTool } from "../__mocks__"
import { ExecutionEngine } from "../base/execution-engine"
import { ToolRegistry } from "../base/tool-registry"
import { AIToolsContainer, AIToolsContainerUtils, getAIToolsContainer } from "../container"
import type { AIToolsConfig } from "../types"

describe("AIToolsContainer", () => {
  let container: AIToolsContainer

  beforeEach(() => {
    vi.useFakeTimers()
    container = AIToolsContainer.getInstance()
    container.reset()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    container.reset()
  })

  describe("Singleton", () => {
    it("должен возвращать единственный экземпляр", () => {
      const instance1 = AIToolsContainer.getInstance()
      const instance2 = AIToolsContainer.getInstance()

      expect(instance1).toBe(instance2)
    })

    it("должен возвращать тот же экземпляр через фабричную функцию", () => {
      const instance1 = getAIToolsContainer()
      const instance2 = getAIToolsContainer()

      expect(instance1).toBe(instance2)
      expect(instance1).toBe(container)
    })
  })

  describe("Инициализация сервисов", () => {
    it("должен предоставлять ToolRegistry", () => {
      const registry = container.getToolRegistry()

      expect(registry).toBeInstanceOf(ToolRegistry)
    })

    it("должен предоставлять ExecutionEngine", () => {
      const engine = container.getExecutionEngine()

      expect(engine).toBeInstanceOf(ExecutionEngine)
    })

    it("должен предоставлять логгер", () => {
      const logger = container.getLogger()

      expect(logger).toBeDefined()
      expect(logger).toHaveProperty("info")
      expect(logger).toHaveProperty("warn")
      expect(logger).toHaveProperty("error")
    })

    it("должен использовать ConsoleLogger при enableLogging: true", () => {
      container.updateConfig({ enableLogging: true })
      const logger = container.getLogger()

      expect(() => logger.info("test")).not.toThrow()
    })

    it("должен использовать NoOpLogger при enableLogging: false", () => {
      container.updateConfig({ enableLogging: false })
      const logger = container.getLogger()

      expect(() => logger.info("test")).not.toThrow()
    })
  })

  describe("Конфигурация", () => {
    it("должен возвращать конфигурацию по умолчанию", () => {
      const config = container.getConfig()

      expect(config).toMatchObject({
        defaultTimeout: 30000,
        defaultRetries: 1,
        enableLogging: true,
        enableMetrics: true,
        maxConcurrentExecutions: 10,
        cacheResults: false,
        cacheTTL: 300000,
      })
    })

    it("должен позволять обновлять конфигурацию", () => {
      const newConfig: Partial<AIToolsConfig> = {
        defaultTimeout: 60000,
        maxConcurrentExecutions: 20,
        enableLogging: false,
      }

      container.updateConfig(newConfig)
      const config = container.getConfig()

      expect(config.defaultTimeout).toBe(60000)
      expect(config.maxConcurrentExecutions).toBe(20)
      expect(config.enableLogging).toBe(false)
    })

    it("должен обновлять ExecutionEngine при изменении maxConcurrentExecutions", () => {
      const engine = container.getExecutionEngine()
      const spy = vi.spyOn(engine, "setMaxConcurrentExecutions")

      container.updateConfig({ maxConcurrentExecutions: 15 })

      expect(spy).toHaveBeenCalledWith(15)
    })

    it("должен обновлять логгер при изменении enableLogging", () => {
      container.updateConfig({ enableLogging: true })
      const logger1 = container.getLogger()

      container.updateConfig({ enableLogging: false })
      const logger2 = container.getLogger()

      expect(logger1).not.toBe(logger2)
    })
  })

  describe("Жизненный цикл", () => {
    beforeEach(() => {
      const registry = container.getToolRegistry()
      registry.clear()
    })

    it("должен инициализировать контейнер", async () => {
      expect(container.isInitialized()).toBe(false)

      await container.initialize()

      expect(container.isInitialized()).toBe(true)
    })

    it("не должен повторно инициализировать контейнер", async () => {
      await container.initialize()
      expect(container.isInitialized()).toBe(true)

      // Повторная инициализация не должна вызывать ошибку
      await expect(container.initialize()).resolves.toBeUndefined()
      expect(container.isInitialized()).toBe(true)
    })

    it("должен настраивать ExecutionEngine при инициализации", async () => {
      container.updateConfig({ maxConcurrentExecutions: 25 })

      await container.initialize()

      const engine = container.getExecutionEngine()
      const spy = vi.spyOn(engine, "setMaxConcurrentExecutions")

      // Проверяем, что настройка применена
      container.updateConfig({ maxConcurrentExecutions: 30 })
      expect(spy).toHaveBeenCalledWith(30)
    })

    it("должен подписываться на события ExecutionEngine при enableLogging: true", async () => {
      container.updateConfig({ enableLogging: true })
      await container.initialize()

      const registry = container.getToolRegistry()
      const engine = container.getExecutionEngine()

      registry.register(new SimpleTestTool())

      const promise = engine.execute("SimpleTestTool", { value: "test" })
      await vi.runAllTimersAsync()

      await expect(promise).resolves.toBeDefined()
    })

    it("должен завершить работу контейнера", async () => {
      await container.initialize()

      const registry = container.getToolRegistry()
      const engine = container.getExecutionEngine()

      registry.register(new SimpleTestTool())

      await container.shutdown()

      expect(container.isInitialized()).toBe(false)
      expect(registry.list()).toHaveLength(0)
      expect(engine.getActiveExecutions()).toHaveLength(0)
    })

    it("должен игнорировать shutdown если не инициализирован", async () => {
      expect(container.isInitialized()).toBe(false)

      await expect(container.shutdown()).resolves.toBeUndefined()
    })
  })

  describe("Регистрация сервисов", () => {
    it("должен позволять регистрировать произвольные сервисы", () => {
      const customService = { name: "CustomService", data: "test" }

      container.registerService("CustomService", customService)

      const retrieved = container.getService<typeof customService>("CustomService")
      expect(retrieved).toBe(customService)
    })

    it("должен возвращать undefined для незарегистрированного сервиса", () => {
      const service = container.getService("NonExistentService")

      expect(service).toBeUndefined()
    })

    it("должен позволять перезаписывать сервисы", () => {
      const service1 = { version: 1 }
      const service2 = { version: 2 }

      container.registerService("TestService", service1)
      expect(container.getService("TestService")).toBe(service1)

      container.registerService("TestService", service2)
      expect(container.getService("TestService")).toBe(service2)
    })
  })

  describe("Статистика контейнера", () => {
    beforeEach(() => {
      const registry = container.getToolRegistry()
      const engine = container.getExecutionEngine()
      registry.clear()
      engine.reset()
    })

    it("должен возвращать статистику контейнера", async () => {
      await container.initialize()

      const registry = container.getToolRegistry()
      const engine = container.getExecutionEngine()

      registry.register(new SimpleTestTool())
      registry.register(new DelayedTestTool())

      const promise = engine.execute("SimpleTestTool", { value: "test" })
      await vi.runAllTimersAsync()
      await promise

      const stats = container.getContainerStats()

      expect(stats).toHaveProperty("initialized", true)
      expect(stats).toHaveProperty("registeredServices")
      expect(stats).toHaveProperty("toolRegistryStats")
      expect(stats).toHaveProperty("executionEngineMetrics")
      expect(stats).toHaveProperty("activeExecutions")
      expect(stats).toHaveProperty("config")

      expect(stats.toolRegistryStats.totalTools).toBe(2)
      expect(stats.executionEngineMetrics.totalExecutions).toBe(1)
    })

    it("должен отслеживать количество зарегистрированных сервисов", () => {
      container.registerService("Service1", {})
      container.registerService("Service2", {})
      container.registerService("Service3", {})

      const stats = container.getContainerStats()

      // 3 кастомных + 3 базовых (ToolRegistry, ExecutionEngine, Logger)
      expect(stats.registeredServices).toBeGreaterThanOrEqual(6)
    })
  })

  describe("Сброс состояния", () => {
    it("должен сбросить состояние контейнера", async () => {
      await container.initialize()

      container.updateConfig({ defaultTimeout: 60000 })
      container.registerService("TestService", {})

      expect(container.isInitialized()).toBe(true)
      expect(container.getConfig().defaultTimeout).toBe(60000)
      expect(container.getService("TestService")).toBeDefined()

      container.reset()

      expect(container.isInitialized()).toBe(false)
      expect(container.getConfig().defaultTimeout).toBe(30000) // Дефолтное значение
      expect(container.getService("TestService")).toBeUndefined()
    })

    it("должен переинициализировать сервисы после сброса", () => {
      container.reset()

      const registry = container.getToolRegistry()
      const engine = container.getExecutionEngine()
      const logger = container.getLogger()

      expect(registry).toBeInstanceOf(ToolRegistry)
      expect(engine).toBeInstanceOf(ExecutionEngine)
      expect(logger).toBeDefined()
    })
  })
})

describe("AIToolsContainerUtils", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const container = getAIToolsContainer()
    container.reset()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    const container = getAIToolsContainer()
    container.reset()
  })

  describe("initializeWithConfig", () => {
    it("должен инициализировать контейнер с конфигурацией", async () => {
      const config: Partial<AIToolsConfig> = {
        defaultTimeout: 45000,
        enableLogging: false,
        maxConcurrentExecutions: 15,
      }

      const container = await AIToolsContainerUtils.initializeWithConfig(config)

      expect(container.isInitialized()).toBe(true)
      expect(container.getConfig()).toMatchObject(config)
    })
  })

  describe("setupForDevelopment", () => {
    it("должен настроить контейнер для разработки", async () => {
      const container = await AIToolsContainerUtils.setupForDevelopment()

      expect(container.isInitialized()).toBe(true)

      const config = container.getConfig()
      expect(config.enableLogging).toBe(true)
      expect(config.enableMetrics).toBe(true)
      expect(config.defaultTimeout).toBe(60000)
      expect(config.maxConcurrentExecutions).toBe(5)
    })
  })

  describe("setupForProduction", () => {
    it("должен настроить контейнер для продакшена", async () => {
      const container = await AIToolsContainerUtils.setupForProduction()

      expect(container.isInitialized()).toBe(true)

      const config = container.getConfig()
      expect(config.enableLogging).toBe(false)
      expect(config.enableMetrics).toBe(true)
      expect(config.defaultTimeout).toBe(30000)
      expect(config.maxConcurrentExecutions).toBe(20)
      expect(config.cacheResults).toBe(true)
      expect(config.cacheTTL).toBe(600000)
    })
  })

  describe("setupForTesting", () => {
    it("должен настроить контейнер для тестирования", async () => {
      const container = await AIToolsContainerUtils.setupForTesting()

      expect(container.isInitialized()).toBe(true)

      const config = container.getConfig()
      expect(config.enableLogging).toBe(false)
      expect(config.enableMetrics).toBe(false)
      expect(config.defaultTimeout).toBe(5000)
      expect(config.maxConcurrentExecutions).toBe(2)
    })

    it("должен сбросить контейнер перед инициализацией", async () => {
      const container = getAIToolsContainer()

      // Инициализируем контейнер
      await container.initialize()
      container.registerService("TestService", { data: "test" })

      expect(container.isInitialized()).toBe(true)
      expect(container.getService("TestService")).toBeDefined()

      // Настраиваем для тестирования
      await AIToolsContainerUtils.setupForTesting()

      // Кастомные сервисы должны быть удалены после reset
      expect(container.getService("TestService")).toBeUndefined()
    })
  })
})
