/**
 * DI Container для домена AI Tools
 * Управляет зависимостями и жизненным циклом сервисов
 */

import { createLogger } from "@/lib/tauri-logger"
import { ConsoleAIToolLogger, NoOpAIToolLogger } from "./base/base-ai-tool"
import { ExecutionEngine } from "./base/execution-engine"
import { ToolRegistry } from "./base/tool-registry"
import type { AIToolLogger, AIToolsConfig } from "./types"

const logger = createLogger("Container")

/**
 * Интерфейс DI контейнера для AI Tools
 */
export interface IAIToolsContainer {
  // Основные сервисы
  getToolRegistry(): ToolRegistry
  getExecutionEngine(): ExecutionEngine
  getLogger(): AIToolLogger

  // Конфигурация
  getConfig(): AIToolsConfig
  updateConfig(config: Partial<AIToolsConfig>): void

  // Жизненный цикл
  initialize(): Promise<void>
  shutdown(): Promise<void>

  // Регистрация сервисов
  registerService<T>(name: string, service: T): void
  getService<T>(name: string): T | undefined
}

/**
 * Реализация DI контейнера для AI Tools
 */
export class AIToolsContainer implements IAIToolsContainer {
  private static instance: AIToolsContainer
  private services = new Map<string, any>()
  private initialized = false
  private config: AIToolsConfig

  private constructor() {
    this.config = this.getDefaultConfig()
    this.initializeServices()
  }

  /**
   * Получить единственный экземпляр контейнера
   */
  public static getInstance(): AIToolsContainer {
    if (!AIToolsContainer.instance) {
      AIToolsContainer.instance = new AIToolsContainer()
    }
    return AIToolsContainer.instance
  }

  /**
   * Инициализация сервисов
   */
  private initializeServices(): void {
    // Регистрируем основные сервисы
    this.services.set("ToolRegistry", ToolRegistry.getInstance())
    this.services.set("ExecutionEngine", ExecutionEngine.getInstance())

    // Регистрируем логгер в зависимости от конфигурации
    const logger = this.config.enableLogging ? new ConsoleAIToolLogger("[AITools]") : new NoOpAIToolLogger()
    this.services.set("Logger", logger)
  }

  /**
   * Получить конфигурацию по умолчанию
   */
  private getDefaultConfig(): AIToolsConfig {
    return {
      defaultTimeout: 30000,
      defaultRetries: 1,
      enableLogging: true,
      enableMetrics: true,
      maxConcurrentExecutions: 10,
      cacheResults: false,
      cacheTTL: 300000, // 5 минут
    }
  }

  /**
   * Инициализация контейнера
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      logger.info("[AIToolsContainer] Инициализация контейнера AI Tools...")

      // Настраиваем ExecutionEngine
      const executionEngine = this.getExecutionEngine()
      executionEngine.setMaxConcurrentExecutions(this.config.maxConcurrentExecutions)

      // Подписываемся на события для логирования
      if (this.config.enableLogging) {
        const logger = this.getLogger()

        executionEngine.addEventListener("execution:started", (event) => {
          logger.info(`Начато выполнение инструмента: ${event.toolName}`, { executionId: event.executionId })
        })

        executionEngine.addEventListener("execution:completed", (event) => {
          logger.info(`Завершено выполнение инструмента: ${event.toolName}`, {
            executionId: event.executionId,
            success: event.result.success,
            executionTime: event.result.executionTime,
          })
        })

        executionEngine.addEventListener("execution:failed", (event) => {
          logger.error(`Ошибка выполнения инструмента: ${event.toolName}`, {
            executionId: event.executionId,
            error: event.error.message,
          })
        })
      }

      this.initialized = true
      logger.info("[AIToolsContainer] Контейнер AI Tools инициализирован успешно")
    } catch (error) {
      logger.error("[AIToolsContainer] Ошибка инициализации контейнера:", { error })
      throw error
    }
  }

  /**
   * Завершение работы контейнера
   */
  public async shutdown(): Promise<void> {
    if (!this.initialized) {
      return
    }

    try {
      logger.info("[AIToolsContainer] Завершение работы контейнера AI Tools...")

      // Сбрасываем состояние ExecutionEngine
      const executionEngine = this.getExecutionEngine()
      executionEngine.reset()

      // Очищаем реестр инструментов
      const toolRegistry = this.getToolRegistry()
      toolRegistry.clear()

      this.initialized = false
      logger.info("[AIToolsContainer] Контейнер AI Tools завершил работу")
    } catch (error) {
      logger.error("[AIToolsContainer] Ошибка при завершении работы контейнера:", { error })
      throw error
    }
  }

  /**
   * Получить реестр инструментов
   */
  public getToolRegistry(): ToolRegistry {
    return this.services.get("ToolRegistry")
  }

  /**
   * Получить движок выполнения
   */
  public getExecutionEngine(): ExecutionEngine {
    return this.services.get("ExecutionEngine")
  }

  /**
   * Получить логгер
   */
  public getLogger(): AIToolLogger {
    return this.services.get("Logger")
  }

  /**
   * Получить конфигурацию
   */
  public getConfig(): AIToolsConfig {
    return { ...this.config }
  }

  /**
   * Обновить конфигурацию
   */
  public updateConfig(newConfig: Partial<AIToolsConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // Обновляем сервисы в соответствии с новой конфигурацией
    this.updateServicesConfig()
  }

  /**
   * Обновление конфигурации сервисов
   */
  private updateServicesConfig(): void {
    // Обновляем ExecutionEngine
    const executionEngine = this.getExecutionEngine()
    executionEngine.setMaxConcurrentExecutions(this.config.maxConcurrentExecutions)

    // Обновляем логгер
    const newLogger = this.config.enableLogging ? new ConsoleAIToolLogger("[AITools]") : new NoOpAIToolLogger()
    this.services.set("Logger", newLogger)
  }

  /**
   * Регистрация произвольного сервиса
   */
  public registerService<T>(name: string, service: T): void {
    this.services.set(name, service)
    logger.info("[AIToolsContainer] Зарегистрирован сервис:", { name })
  }

  /**
   * Получение произвольного сервиса
   */
  public getService<T>(name: string): T | undefined {
    return this.services.get(name)
  }

  /**
   * Проверка инициализации
   */
  public isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Получение статистики контейнера
   */
  public getContainerStats() {
    const toolRegistry = this.getToolRegistry()
    const executionEngine = this.getExecutionEngine()

    return {
      initialized: this.initialized,
      registeredServices: this.services.size,
      toolRegistryStats: toolRegistry.getStatistics(),
      executionEngineMetrics: executionEngine.getMetrics(),
      activeExecutions: executionEngine.getActiveExecutions().length,
      config: this.config,
    }
  }

  /**
   * Сброс контейнера (для тестирования)
   */
  public reset(): void {
    this.services.clear()
    this.initialized = false
    this.config = this.getDefaultConfig()
    this.initializeServices()
  }
}

/**
 * Фабричная функция для получения контейнера
 */
export function getAIToolsContainer(): AIToolsContainer {
  return AIToolsContainer.getInstance()
}

/**
 * Утилитарные функции для работы с контейнером
 */
export const AIToolsContainerUtils = {
  /**
   * Инициализация контейнера с конфигурацией
   */
  async initializeWithConfig(config: Partial<AIToolsConfig>): Promise<AIToolsContainer> {
    const container = getAIToolsContainer()
    container.updateConfig(config)
    await container.initialize()
    return container
  },

  /**
   * Быстрая настройка для разработки
   */
  async setupForDevelopment(): Promise<AIToolsContainer> {
    return this.initializeWithConfig({
      enableLogging: true,
      enableMetrics: true,
      defaultTimeout: 60000, // Увеличенный таймаут для отладки
      maxConcurrentExecutions: 5,
    })
  },

  /**
   * Быстрая настройка для продакшена
   */
  async setupForProduction(): Promise<AIToolsContainer> {
    return this.initializeWithConfig({
      enableLogging: false,
      enableMetrics: true,
      defaultTimeout: 30000,
      maxConcurrentExecutions: 20,
      cacheResults: true,
      cacheTTL: 600000, // 10 минут
    })
  },

  /**
   * Настройка для тестирования
   */
  async setupForTesting(): Promise<AIToolsContainer> {
    const container = getAIToolsContainer()
    container.reset() // Сбрасываем состояние

    return this.initializeWithConfig({
      enableLogging: false,
      enableMetrics: false,
      defaultTimeout: 5000,
      maxConcurrentExecutions: 2,
    })
  },
}
