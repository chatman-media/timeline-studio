/**
 * Dependency Injection Container
 * Централизованный контейнер для всех AI сервисов
 */

import { createMediaAnalysisFactory } from "./analysis/factory"
import type { IFFmpegAnalysisService, IVisionService } from "./analysis/interfaces"
import { ModelManagerImpl } from "./model-manager"
import { createAIProviderFactory } from "./providers/factory"
import type {
  AIProviderFactory,
  AIServiceConfig,
  IAIProvider,
  IUnifiedAIService,
  MediaAnalysisFactory,
  ModelConfig,
  ModelManager,
  OrchestrationFactory,
} from "./providers/interfaces"
import { EnhancedUnifiedAIService } from "./unified-ai-service"

// Типы для регистрации сервисов
export type ServiceFactory<T = any> = (...deps: any[]) => T | Promise<T>
export type ServiceLifecycle = "singleton" | "transient" | "scoped"

interface ServiceRegistration {
  factory: ServiceFactory
  dependencies: string[]
  lifecycle: ServiceLifecycle
  instance?: any
}

export class AIDIContainer {
  private static instance: AIDIContainer | null = null

  private config: AIServiceConfig | null = null
  private providerFactory: AIProviderFactory | null = null
  private analysisFactory: MediaAnalysisFactory | null = null
  private orchestrationFactory: OrchestrationFactory | null = null
  private unifiedService: IUnifiedAIService | null = null
  private modelManager: ModelManager | null = null

  private initialized = false

  // Реестр сервисов для DI
  private services = new Map<string, ServiceRegistration>()
  private resolving = new Set<string>() // Для обнаружения циклических зависимостей

  private constructor() {
    this.registerCoreServices()
  }

  // Публичный конструктор для тестов
  static createTestInstance(): AIDIContainer {
    const instance = new AIDIContainer()
    return instance
  }

  static getInstance(): AIDIContainer {
    if (!AIDIContainer.instance) {
      AIDIContainer.instance = new AIDIContainer()
    }
    return AIDIContainer.instance
  }

  // Конфигурация
  configure(config: AIServiceConfig): void {
    this.config = config
    this.initialized = false // Требует повторной инициализации
  }

  getConfig(): AIServiceConfig {
    if (!this.config) {
      throw new Error("AI Service not configured. Call configure() first.")
    }
    return this.config
  }

  // Инициализация
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    if (!this.config) {
      // Используем конфигурацию по умолчанию
      this.config = this.getDefaultConfig()
    }

    // Создаем фабрики
    this.providerFactory = createAIProviderFactory()
    this.analysisFactory = createMediaAnalysisFactory()

    // Создаем менеджер моделей
    this.modelManager = new ModelManagerImpl(this.providerFactory)

    // Создаем унифицированный сервис
    this.unifiedService = EnhancedUnifiedAIService.getInstance({
      providerFactory: this.providerFactory,
      modelManager: this.modelManager,
    })

    // Инициализируем компоненты
    await this.initializeComponents()

    this.initialized = true
  }

  private async initializeComponents(): Promise<void> {
    // Проверяем доступность провайдеров
    const availableProviders = await this.providerFactory!.getAvailableProviders()
    console.log("Available AI providers:", availableProviders)

    // Анализ сервисы доступны после создания фабрики
    console.log("Analysis factory initialized")

    // Инициализируем модели
    await this.modelManager!.getAvailableModels()
  }

  isInitialized(): boolean {
    return this.initialized
  }

  // ===========================
  // Enhanced DI functionality
  // ===========================

  /**
   * Регистрация сервиса с зависимостями
   */
  register<T>(
    name: string,
    factory: ServiceFactory<T>,
    options: {
      dependencies?: string[]
      lifecycle?: ServiceLifecycle
    } = {},
  ): void {
    const { dependencies = [], lifecycle = "singleton" } = options

    this.services.set(name, {
      factory,
      dependencies,
      lifecycle,
      instance: lifecycle === "singleton" ? undefined : null,
    })
  }

  /**
   * Регистрация singleton сервиса (синтаксический сахар)
   */
  registerSingleton<T>(name: string, factory: ServiceFactory<T>, dependencies: string[] = []): void {
    this.register(name, factory, { dependencies, lifecycle: "singleton" })
  }

  /**
   * Регистрация transient сервиса (создается каждый раз)
   */
  registerTransient<T>(name: string, factory: ServiceFactory<T>, dependencies: string[] = []): void {
    this.register(name, factory, { dependencies, lifecycle: "transient" })
  }

  /**
   * Получить сервис с автоматическим разрешением зависимостей
   */
  async resolve<T>(name: string): Promise<T> {
    // Проверка циклических зависимостей
    if (this.resolving.has(name)) {
      throw new Error(`Circular dependency detected: ${Array.from(this.resolving).join(" -> ")} -> ${name}`)
    }

    const registration = this.services.get(name)
    if (!registration) {
      throw new Error(`Service '${name}' not registered`)
    }

    // Для singleton проверяем кэш
    if (registration.lifecycle === "singleton" && registration.instance) {
      return registration.instance
    }

    this.resolving.add(name)

    try {
      // Разрешаем зависимости
      const deps = await Promise.all(registration.dependencies.map((dep) => this.resolve(dep)))

      // Создаем экземпляр
      const instance = await registration.factory(...deps)

      // Кэшируем для singleton
      if (registration.lifecycle === "singleton") {
        registration.instance = instance
      }

      return instance
    } finally {
      this.resolving.delete(name)
    }
  }

  /**
   * Синхронная версия resolve (только для уже созданных singleton)
   */
  get<T>(name: string): T {
    const registration = this.services.get(name)
    if (!registration) {
      throw new Error(`Service '${name}' not registered`)
    }

    if (registration.lifecycle === "singleton" && registration.instance) {
      return registration.instance
    }

    throw new Error(`Service '${name}' not yet resolved. Use resolve() first.`)
  }

  /**
   * Проверить наличие сервиса
   */
  has(name: string): boolean {
    return this.services.has(name)
  }

  /**
   * Регистрация core сервисов
   */
  private registerCoreServices(): void {
    // AI Provider Factory
    this.registerSingleton("AIProviderFactory", () => createAIProviderFactory())

    // FFmpeg Service
    this.registerSingleton("FFmpegService", async () => {
      const { FFmpegAdapter } = await import("./analysis/ffmpeg")
      return new FFmpegAdapter()
    }, [])

    // Vision Service
    this.registerSingleton("VisionService", async () => {
      const { VisionAdapter } = await import("./analysis/vision")
      return new VisionAdapter()
    }, [])

    // Content Analysis Service
    this.registerSingleton(
      "ContentAnalysisService",
      async (ffmpegService: IFFmpegAnalysisService, visionService: IVisionService) => {
        const { ContentAnalysisService } = await import("./analysis/content")
        return new ContentAnalysisService(ffmpegService, visionService)
      },
      ["FFmpegService", "VisionService"],
    )

    // Media Analysis Factory - обновленный подход
    this.registerSingleton(
      "MediaAnalysisFactory",
      async (ffmpegService: IFFmpegAnalysisService, visionService: IVisionService) => {
        const { MediaAnalysisFactoryImpl } = await import("./analysis/factory")
        return new MediaAnalysisFactoryImpl(ffmpegService, visionService)
      },
      ["FFmpegService", "VisionService"],
    )

    // Model Manager
    this.registerSingleton(
      "ModelManager",
      (providerFactory: AIProviderFactory) => new ModelManagerImpl(providerFactory),
      ["AIProviderFactory"],
    )

    // Unified AI Service
    this.registerSingleton(
      "UnifiedAIService",
      (providerFactory: AIProviderFactory, modelManager: ModelManager) =>
        EnhancedUnifiedAIService.getInstance({ providerFactory, modelManager }),
      ["AIProviderFactory", "ModelManager"],
    )

    // Scene Analysis Engine
    this.registerSingleton("SceneAnalysisEngine", () => this.createSceneAnalysisEngine(), [])

    // Content Analyzer - связывает Scene Analysis Engine с AI сервисами
    this.registerSingleton(
      "ContentAnalyzer",
      (sceneEngine: any, unifiedService: IUnifiedAIService) => this.createContentAnalyzer(sceneEngine, unifiedService),
      ["SceneAnalysisEngine", "UnifiedAIService"],
    )
  }

  // Получение сервисов
  getProviderFactory(): AIProviderFactory {
    this.ensureInitialized()
    return this.providerFactory!
  }

  getAnalysisFactory(): MediaAnalysisFactory {
    this.ensureInitialized()
    return this.analysisFactory!
  }

  getOrchestrationFactory(): OrchestrationFactory {
    this.ensureInitialized()
    if (!this.orchestrationFactory) {
      throw new Error("Orchestration factory not implemented yet")
    }
    return this.orchestrationFactory!
  }

  getUnifiedAIService(): IUnifiedAIService {
    this.ensureInitialized()
    return this.unifiedService!
  }

  getModelManager(): ModelManager {
    this.ensureInitialized()
    return this.modelManager!
  }

  // Получение конкретных провайдеров
  getClaudeProvider(): IAIProvider {
    return this.getProviderFactory().createClaudeProvider()
  }

  getOpenAIProvider(): IAIProvider {
    return this.getProviderFactory().createOpenAIProvider()
  }

  getDeepSeekProvider(): IAIProvider {
    return this.getProviderFactory().createDeepSeekProvider()
  }

  getOllamaProvider(_baseUrl?: string): IAIProvider {
    // Пока используем без baseUrl, так как интерфейс не поддерживает параметры
    return this.getProviderFactory().createOllamaProvider()
  }

  // Утилиты
  async getProviderStatus(): Promise<Record<string, boolean>> {
    this.ensureInitialized()

    const providers = ["claude", "openai", "deepseek", "ollama"]
    const statuses: Record<string, boolean> = {}

    await Promise.all(
      providers.map(async (provider) => {
        try {
          statuses[provider] = await this.providerFactory!.isProviderAvailable(provider)
        } catch {
          statuses[provider] = false
        }
      }),
    )

    return statuses
  }

  async getBestModelForTask(
    task: "analysis" | "generation" | "chat" | "code",
    options?: any,
  ): Promise<ModelConfig | null> {
    this.ensureInitialized()
    return await this.modelManager!.getBestModelForTask(task, options)
  }

  // Очистка ресурсов
  async dispose(): Promise<void> {
    if (this.unifiedService) {
      this.unifiedService.clearCache()
    }

    // Фабрики не требуют явного dispose

    this.providerFactory = null
    this.analysisFactory = null
    this.orchestrationFactory = null
    this.unifiedService = null
    this.modelManager = null
    this.initialized = false
  }

  // Приватные методы
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("AI Service not initialized. Call initialize() first.")
    }
  }

  private getDefaultConfig(): AIServiceConfig {
    return {
      providers: {
        claude: {},
        openai: {},
        deepseek: {},
        ollama: {
          baseUrl: "http://localhost:11434",
        },
      },
    }
  }

  /**
   * Создает Scene Analysis Engine
   */
  private async createSceneAnalysisEngine(): Promise<any> {
    try {
      const { SceneAnalysisEngine } = await import(
        "@/features/ai-content-intelligence/engines/scene-analysis/services/scene-analysis-engine"
      )
      const engine = new SceneAnalysisEngine()
      await engine.initialize()
      return engine
    } catch (error) {
      console.error("Failed to create SceneAnalysisEngine:", error)
      // Возвращаем заглушку при ошибке
      return {
        process: async () => ({
          scenes: [],
          duration: 0,
          keyMoments: [],
          metadata: { fps: 30, resolution: "1920x1080" },
        }),
        initialize: async () => {},
      }
    }
  }

  /**
   * Создает Content Analyzer с интеграцией Scene Analysis Engine и AI сервисов
   */
  private createContentAnalyzer(sceneEngine: any, unifiedService: IUnifiedAIService): any {
    return {
      /**
       * Анализирует профиль контента
       */
      async analyzeContentProfile(params: { mediaFiles?: string[]; analysisScope?: string }) {
        try {
          if (!params.mediaFiles || params.mediaFiles.length === 0) {
            return {
              contentStyle: "unknown",
              engagementPatterns: null,
            }
          }

          // Используем Scene Analysis Engine для анализа видео
          const videoPath = params.mediaFiles[0]
          const analysis = await sceneEngine.analyzeVideo(videoPath, {
            enableSceneDetection: true,
            enableObjectTracking: false,
            analysisType: "basic",
          })

          return {
            contentStyle: this.classifyContentStyle(analysis),
            engagementPatterns: this.extractEngagementPatterns(analysis),
            scenes: analysis.scenes,
            duration: analysis.duration,
          }
        } catch (error) {
          console.error("Content profile analysis failed:", error)
          return {
            contentStyle: "unknown",
            engagementPatterns: null,
          }
        }
      },

      /**
       * Генерирует рекомендации для платформы
       */
      async generatePlatformRecommendations(params: { platform?: string; content?: any; includeSeo?: boolean }) {
        try {
          // Создаем промпт для AI
          const prompt = `Создай рекомендации для адаптации контента под платформу ${params.platform}. 
          ${params.includeSeo ? "Включи SEO рекомендации." : ""}
          
          Контент: ${JSON.stringify(params.content)}
          
          Верни рекомендации в формате JSON:
          {
            "description": "Оптимизированное описание",
            "thumbnailTips": ["совет1", "совет2", "совет3"]
          }`

          const response = await unifiedService.sendRequest(
            "claude-3-haiku-20240307",
            [{ role: "user", content: prompt }],
            {
              maxTokens: 1000,
              temperature: 0.7,
            },
          )

          try {
            return JSON.parse(response.content)
          } catch {
            return {
              description: "Оптимизированное описание для платформы",
              thumbnailTips: ["Используйте яркие цвета", "Добавьте четкий текст", "Покажите эмоции"],
            }
          }
        } catch (error) {
          console.error("Platform recommendations generation failed:", error)
          return {
            description: "Стандартные рекомендации",
            thumbnailTips: [],
          }
        }
      },

      // Вспомогательные методы
      classifyContentStyle: (analysis: any) => {
        if (!analysis.scenes || analysis.scenes.length === 0) return "unknown"

        const avgSceneLength = analysis.duration / analysis.scenes.length
        if (avgSceneLength < 3000) return "dynamic"
        if (avgSceneLength > 10000) return "contemplative"
        return "standard"
      },

      extractEngagementPatterns: (analysis: any) => {
        if (!analysis.scenes) return null

        return {
          totalScenes: analysis.scenes.length,
          averageSceneLength: analysis.duration / analysis.scenes.length,
          hasVariation: analysis.scenes.length > 3,
        }
      },
    }
  }

  // Статические методы для удобства
  static async createAndInitialize(config?: AIServiceConfig): Promise<AIDIContainer> {
    const container = AIDIContainer.getInstance()

    if (config) {
      container.configure(config)
    }

    await container.initialize()
    return container
  }

  static getInstanceSafe(): AIDIContainer | null {
    return AIDIContainer.instance
  }

  static resetInstance(): void {
    AIDIContainer.instance = null
  }
}

// Глобальные функции для удобства
export async function initializeAIServices(config?: AIServiceConfig): Promise<AIDIContainer> {
  return await AIDIContainer.createAndInitialize(config)
}

export function getAIContainer(): AIDIContainer {
  const container = AIDIContainer.getInstanceSafe()
  if (!container) {
    throw new Error("AI Services not initialized. Call initializeAIServices() first.")
  }
  return container
}

export function getAIContainerSafe(): AIDIContainer | null {
  return AIDIContainer.getInstanceSafe()
}
