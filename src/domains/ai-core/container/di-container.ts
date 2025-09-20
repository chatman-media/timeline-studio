/**
 * AI Core Dependency Injection Container
 * Централизованное управление зависимостями AI сервисов
 */

import type { AIServiceConfig } from "../types"

// Типы для регистрации сервисов
export type ServiceFactory<T = any> = (...deps: any[]) => T | Promise<T>
export type ServiceLifecycle = "singleton" | "transient" | "scoped"

interface ServiceRegistration {
  factory: ServiceFactory
  dependencies: string[]
  lifecycle: ServiceLifecycle
  instance?: any
}

export interface AIDIContainer {
  // Регистрация сервисов
  register<T>(name: string, factory: ServiceFactory<T>, dependencies?: string[]): void
  registerSingleton<T>(name: string, factory: ServiceFactory<T>, dependencies?: string[]): void
  registerTransient<T>(name: string, factory: ServiceFactory<T>, dependencies?: string[]): void

  // Разрешение зависимостей
  resolve<T>(name: string): Promise<T>
  resolveAll<T>(...names: string[]): Promise<T[]>

  // Проверки
  has(name: string): boolean
  isInitialized(): boolean

  // Конфигурация
  configure(config: AIServiceConfig): void
  getConfig(): AIServiceConfig

  // Инициализация и очистка
  initialize(): Promise<void>
  dispose(): Promise<void>
}

export class AICoreDIContainer implements AIDIContainer {
  private static instance: AICoreDIContainer | null = null

  private config: AIServiceConfig | null = null
  private initialized = false

  // Реестр сервисов для DI
  private services = new Map<string, ServiceRegistration>()
  private resolving = new Set<string>() // Для обнаружения циклических зависимостей
  private scopedInstances = new Map<string, any>() // Для scoped сервисов

  private constructor() {
    this.registerCoreServices()
  }

  // Публичный конструктор для тестов
  static createTestInstance(): AICoreDIContainer {
    const instance = new AICoreDIContainer()
    return instance
  }

  static getInstance(): AICoreDIContainer {
    if (!AICoreDIContainer.instance) {
      AICoreDIContainer.instance = new AICoreDIContainer()
    }
    return AICoreDIContainer.instance
  }

  // Регистрация сервисов
  register<T>(name: string, factory: ServiceFactory<T>, dependencies: string[] = []): void {
    this.registerService(name, factory, dependencies, "transient")
  }

  registerSingleton<T>(name: string, factory: ServiceFactory<T>, dependencies: string[] = []): void {
    this.registerService(name, factory, dependencies, "singleton")
  }

  registerTransient<T>(name: string, factory: ServiceFactory<T>, dependencies: string[] = []): void {
    this.registerService(name, factory, dependencies, "transient")
  }

  registerScoped<T>(name: string, factory: ServiceFactory<T>, dependencies: string[] = []): void {
    this.registerService(name, factory, dependencies, "scoped")
  }

  private registerService(
    name: string,
    factory: ServiceFactory,
    dependencies: string[],
    lifecycle: ServiceLifecycle,
  ): void {
    this.services.set(name, {
      factory,
      dependencies,
      lifecycle,
    })
  }

  // Разрешение зависимостей
  async resolve<T>(name: string): Promise<T> {
    // Проверяем циклические зависимости
    if (this.resolving.has(name)) {
      throw new Error(`Circular dependency detected: ${name}`)
    }

    const registration = this.services.get(name)
    if (!registration) {
      throw new Error(`Service not registered: ${name}`)
    }

    try {
      this.resolving.add(name)

      // Для singleton проверяем кэш
      if (registration.lifecycle === "singleton" && registration.instance !== undefined) {
        return registration.instance
      }

      // Для scoped проверяем локальный кэш
      if (registration.lifecycle === "scoped" && this.scopedInstances.has(name)) {
        return this.scopedInstances.get(name)
      }

      // Разрешаем зависимости
      const deps = await Promise.all(registration.dependencies.map((dep) => this.resolve(dep)))

      // Создаем экземпляр
      const instance = await registration.factory(...deps)

      // Кэшируем в зависимости от lifecycle
      if (registration.lifecycle === "singleton") {
        registration.instance = instance
      } else if (registration.lifecycle === "scoped") {
        this.scopedInstances.set(name, instance)
      }

      return instance
    } finally {
      this.resolving.delete(name)
    }
  }

  async resolveAll<T>(...names: string[]): Promise<T[]> {
    return Promise.all(names.map((name) => this.resolve<T>(name)))
  }

  // Проверки
  has(name: string): boolean {
    return this.services.has(name)
  }

  isInitialized(): boolean {
    return this.initialized
  }

  // Конфигурация
  configure(config: AIServiceConfig): void {
    this.config = config
    this.initialized = false // Требует повторной инициализации
  }

  getConfig(): AIServiceConfig {
    if (!this.config) {
      // Возвращаем конфигурацию по умолчанию
      return this.getDefaultConfig()
    }
    return this.config
  }

  // Инициализация
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    if (!this.config) {
      this.config = this.getDefaultConfig()
    }

    // Регистрируем провайдеры и фабрики с конфигурацией
    this.registerProvidersWithConfig()

    this.initialized = true
  }

  // Очистка ресурсов
  async dispose(): Promise<void> {
    // Очищаем singleton экземпляры
    for (const [_name, registration] of this.services) {
      if (registration.lifecycle === "singleton" && registration.instance) {
        // Если у экземпляра есть метод dispose, вызываем его
        if (typeof registration.instance.dispose === "function") {
          await registration.instance.dispose()
        }
        registration.instance = undefined
      }
    }

    // Очищаем scoped экземпляры
    this.scopedInstances.clear()

    this.initialized = false
  }

  // Создание нового scope
  createScope(): AIDIContainer {
    // TODO: Реализовать создание дочернего контейнера для scoped сервисов
    return this
  }

  // Приватные методы
  private registerCoreServices(): void {
    // Регистрируем провайдеры и фабрики
    Promise.all([
      import("../providers/register").then((module) => {
        if (module.registerAIProviders) {
          module.registerAIProviders(this)
        }
      }),
      import("../services").then((module) => {
        if (module.registerAICoreServices) {
          module.registerAICoreServices(this)
        }
      }),
    ]).catch((error) => {
      console.error("Failed to register core services:", error)
    })
  }

  private registerProvidersWithConfig(): void {
    const config = this.getConfig()

    // Обновляем конфигурацию провайдеров
    if (config.providers) {
      // Claude
      if (config.providers.claude?.apiKey) {
        process.env.ANTHROPIC_API_KEY = config.providers.claude.apiKey
      }

      // OpenAI
      if (config.providers.openai?.apiKey) {
        process.env.OPENAI_API_KEY = config.providers.openai.apiKey
      }

      // DeepSeek
      if (config.providers.deepseek?.apiKey) {
        process.env.DEEPSEEK_API_KEY = config.providers.deepseek.apiKey
      }

      // Grok
      if (config.providers.grok?.apiKey) {
        process.env.GROK_API_KEY = config.providers.grok.apiKey
      }

      // Ollama
      if (config.providers.ollama?.baseUrl) {
        process.env.OLLAMA_BASE_URL = config.providers.ollama.baseUrl
      }
    }
  }

  private getDefaultConfig(): AIServiceConfig {
    return {
      providers: {
        claude: {
          apiKey: process.env.ANTHROPIC_API_KEY,
          maxRetries: 3,
        },
        openai: {
          apiKey: process.env.OPENAI_API_KEY,
          maxRetries: 3,
        },
        deepseek: {
          apiKey: process.env.DEEPSEEK_API_KEY,
          maxRetries: 3,
        },
        ollama: {
          baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        },
        grok: {
          apiKey: process.env.GROK_API_KEY,
          maxRetries: 3,
        },
      },
      cache: {
        enabled: true,
        ttl: 600000, // 10 минут
        maxSize: 1000,
      },
      retry: {
        maxAttempts: 3,
        delay: 1000,
        backoff: "exponential",
      },
      fallback: {
        enabled: true,
        models: ["claude-3-5-sonnet-20241022", "gpt-4o-mini", "grok-2-mini"],
      },
    }
  }
}

// Экспорт глобального экземпляра
export function getAIContainer(): AIDIContainer {
  return AICoreDIContainer.getInstance()
}

// Функция для инициализации AI Core
export async function initializeAICore(config?: AIServiceConfig): Promise<AIDIContainer> {
  const container = getAIContainer()

  if (config) {
    container.configure(config)
  }

  await container.initialize()
  return container
}

// Экспорт для тестов
export function createTestContainer(): AIDIContainer {
  return AICoreDIContainer.createTestInstance()
}
