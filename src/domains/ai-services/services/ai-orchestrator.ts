/**
 * AI Services Orchestrator
 *
 * Координирует работу AI сервисов и публикует события
 */

import { type Actor, type ActorRefFrom, createActor } from "xstate"
import {
  type ChatMessageSentEvent,
  type ContentAnalysisStartedEvent,
  DOMAIN_EVENTS,
  eventBus,
  type MontagePlanGeneratedEvent,
} from "@/domains/shared/events"
import { type AIIntelligenceMachine, aiIntelligenceMachine } from "../machines/ai-intelligence-machine"
import { type ChatMachine, chatMachine } from "../machines/chat-machine"
import { type MontagePlannerMachine, montagePlannerMachine } from "../machines/montage-planner-machine"

// Import types from ai-intelligence
import type {
  AdaptedContent,
  AIConfig,
  GeneratedScript,
  IntelligentContent,
  PlatformId,
  ProcessedMoment,
  ScriptGenerationParams,
  UnifiedContentAnalysis,
} from "../types/ai-intelligence"

export class AIServicesOrchestrator {
  private static instance: AIServicesOrchestrator | null = null

  private chatActor: ActorRefFrom<ChatMachine>
  private intelligenceActor: ActorRefFrom<AIIntelligenceMachine>
  private montagePlannerActor: ActorRefFrom<MontagePlannerMachine>

  private constructor() {
    // Создаем акторы
    this.chatActor = createActor(chatMachine)
    this.intelligenceActor = createActor(aiIntelligenceMachine)
    this.montagePlannerActor = createActor(montagePlannerMachine)

    // Запускаем акторы
    this.chatActor.start()
    this.intelligenceActor.start()
    this.montagePlannerActor.start()

    // Настраиваем обработчики событий
    this.setupEventHandlers()

    // Настраиваем публикацию событий из машин
    this.setupEventPublishing()
  }

  static getInstance(): AIServicesOrchestrator {
    if (!AIServicesOrchestrator.instance) {
      AIServicesOrchestrator.instance = new AIServicesOrchestrator()
    }
    return AIServicesOrchestrator.instance
  }

  /**
   * Настройка обработчиков входящих событий
   */
  private setupEventHandlers() {
    // Слушаем события из других доменов
    eventBus.subscribe(
      async (event) => {
        console.log("[AI Orchestrator] Received event:", event.type)

        switch (event.type) {
          case DOMAIN_EVENTS.MEDIA.FILES_IMPORTED:
            // Запускаем анализ для новых файлов
            const files = event.payload as any
            if (files?.length > 0) {
              await this.startContentAnalysis(files)
            }
            break

          case DOMAIN_EVENTS.VIDEO.TIMELINE_CREATED:
            // Можем предложить AI оптимизацию для нового таймлайна
            console.log("New timeline created, AI can suggest improvements")
            break
        }
      },
      {
        filter: {
          // Слушаем события из media и video доменов
          source: ["media-management", "video-editing"],
        },
      },
    )
  }

  /**
   * Настройка публикации событий из машин
   */
  private setupEventPublishing() {
    // Подписываемся на изменения состояния chat машины
    this.chatActor.subscribe((snapshot) => {
      const { context } = snapshot

      // Публикуем событие при отправке сообщения
      if (snapshot.matches("processing") && context.chatMessages.length > 0) {
        const lastMessage = context.chatMessages[context.chatMessages.length - 1]
        if (lastMessage.role === "user") {
          eventBus.publish<ChatMessageSentEvent>(DOMAIN_EVENTS.AI_SERVICES.CHAT_MESSAGE_SENT, "ai-services", {
            sessionId: context.currentSessionId || "default",
            message: {
              id: lastMessage.id,
              content: lastMessage.content,
              role: lastMessage.role,
            },
          })
        }
      }
    })

    // Подписываемся на изменения montage planner
    this.montagePlannerActor.subscribe((snapshot) => {
      if (snapshot.matches("ready") && snapshot.context.currentPlan) {
        const plan = snapshot.context.currentPlan
        const mediaFiles = Array.from(snapshot.context.mediaFiles.values())

        eventBus.publish<MontagePlanGeneratedEvent>(DOMAIN_EVENTS.AI_SERVICES.MONTAGE_PLAN_GENERATED, "ai-services", {
          planId: plan.id,
          plan: plan,
          mediaFiles: mediaFiles,
          style: plan.style,
          duration: plan.totalDuration,
        })
      }
    })
  }

  /**
   * Запуск анализа контента
   */
  async startContentAnalysis(files: any[]) {
    const analysisId = `analysis-${Date.now()}`

    // Публикуем событие о начале анализа
    await eventBus.publish<ContentAnalysisStartedEvent>(
      DOMAIN_EVENTS.AI_SERVICES.CONTENT_ANALYSIS_STARTED,
      "ai-services",
      {
        analysisId,
        mediaFiles: files,
        analysisTypes: ["scene", "object", "emotion", "transcript"],
      },
    )

    // Запускаем анализ через intelligence машину
    this.intelligenceActor.send({
      type: "START_ANALYSIS",
      mediaFiles: files,
      config: {
        providers: [
          {
            provider: "openai" as any, // Will be properly typed when AI provider is configured
            apiKey: "",
            model: "gpt-4-vision-preview",
          },
        ],
        defaultProvider: "openai" as any,
        features: {
          sceneAnalysis: true,
          scriptGeneration: false,
          multiPlatform: false,
          personIdentification: true,
          contentClassification: true,
          qualityEnhancement: false,
          autoSuggestions: true,
        },
        processing: {
          parallel: true,
          maxConcurrent: 2,
          batchSize: 10,
          cacheResults: true,
          cacheDuration: 24,
          retryAttempts: 3,
          timeout: 300,
        },
        quality: {
          analysisDepth: "standard" as any,
          accuracy: "balanced" as any,
          speed: "normal" as any,
          resourceUsage: {
            maxCPU: 80,
            maxRAM: 4096,
            maxGPU: 90,
            maxDiskSpace: 1024,
          },
        },
      },
    })
  }

  /**
   * Получить акторы для прямого взаимодействия
   */
  getActors() {
    return {
      chat: this.chatActor,
      intelligence: this.intelligenceActor,
      montagePlanner: this.montagePlannerActor,
    }
  }

  /**
   * Остановить оркестратор
   */
  stop() {
    this.chatActor.stop()
    this.intelligenceActor.stop()
    this.montagePlannerActor.stop()
    AIServicesOrchestrator.instance = null
  }
}

// Pipeline types for compatibility
export interface PipelineEvent {
  type: string
  timestamp: Date
  data: any
}

export interface PipelineProgress {
  overall: number // 0-100
  currentStep: string
  steps: Array<{
    name: string
    progress: number
    status: string
  }>
  estimatedTimeRemaining?: number
  messages: Array<{
    timestamp: Date
    level: string
    message: string
    details?: any
  }>
  details?: string
}

export interface PipelineControl {
  pause(): Promise<void>
  resume(): Promise<void>
  cancel(): Promise<void>
  getProgress(): PipelineProgress
  onProgress(callback: (progress: PipelineProgress) => void): () => void
  onEvent(callback: (event: PipelineEvent) => void): () => void
}

// AI Engine interface for compatibility
interface AIEngine {
  name: string
  initialize(): Promise<void>
  process(data: any, config: any): Promise<any>
}

interface MediaFile {
  path: string
  name: string
  size?: number
}

interface Content {
  analysis: UnifiedContentAnalysis
  script?: GeneratedScript
}

/**
 * AI Intelligence Orchestrator v2
 * Migrated from features/ai-content-intelligence/shared/services/ai-intelligence-orchestrator.ts
 * Uses XState machine for state management
 */
export class AIIntelligenceOrchestrator {
  private actor: Actor<typeof aiIntelligenceMachine>
  private eventListeners = new Map<string, Set<(event: PipelineEvent) => void>>()
  private progressListeners = new Set<(progress: PipelineProgress) => void>()

  // Engines (will be loaded via DI)
  private sceneAnalyzer?: AIEngine
  private scriptGenerator?: AIEngine
  private multiPlatformAdapter?: AIEngine
  private engineFactory?: any

  constructor(actor: Actor<typeof aiIntelligenceMachine>) {
    this.actor = actor
  }

  /**
   * Initialize engines via DI
   */
  public async initialize(engines?: {
    sceneAnalyzer?: AIEngine
    scriptGenerator?: AIEngine
    multiPlatformAdapter?: AIEngine
  }): Promise<void> {
    // If engines are passed explicitly, use them (for backward compatibility)
    if (engines) {
      if (engines.sceneAnalyzer) {
        this.sceneAnalyzer = engines.sceneAnalyzer
        await this.sceneAnalyzer.initialize()
      }

      if (engines.scriptGenerator) {
        this.scriptGenerator = engines.scriptGenerator
        await this.scriptGenerator.initialize()
      }

      if (engines.multiPlatformAdapter) {
        this.multiPlatformAdapter = engines.multiPlatformAdapter
        await this.multiPlatformAdapter.initialize()
      }
    } else {
      // Load engines via DI factory
      try {
        // TODO: Implement DI container integration
        console.log("DI container integration not yet implemented")
      } catch (error) {
        console.warn("Failed to load engines via DI:", error)
      }
    }
  }

  /**
   * Process content with AI intelligence pipeline
   */
  public async processContent(mediaFiles: MediaFile[], config: AIConfig): Promise<PipelineControl> {
    // Start the machine
    this.actor.send({
      type: "START_ANALYSIS",
      mediaFiles,
      config,
    })

    // Return control interface
    return {
      pause: async () => {
        this.actor.send({ type: "PAUSE" })
      },
      resume: async () => {
        this.actor.send({ type: "RESUME" })
      },
      cancel: async () => {
        this.actor.send({ type: "CANCEL" })
      },
      getProgress: () => this.getCurrentProgress(),
      onProgress: (callback) => {
        this.progressListeners.add(callback)
        return () => this.progressListeners.delete(callback)
      },
      onEvent: (callback) => {
        const listeners = this.eventListeners.get("all") || new Set()
        listeners.add(callback)
        this.eventListeners.set("all", listeners)
        return () => listeners.delete(callback)
      },
    }
  }

  private getCurrentProgress(): PipelineProgress {
    const context = this.actor.getSnapshot().context
    return {
      overall: context.progress || 0,
      currentStep: context.currentStep || "initializing",
      steps:
        context.steps?.map((step) => ({
          name: step.name,
          progress: step.status === "completed" ? 100 : step.status === "running" ? 50 : 0,
          status: step.status,
        })) || [],
      messages: [],
    }
  }

  /**
   * Get current result
   */
  public getResult(): IntelligentContent | null {
    const context = this.actor.getSnapshot().context
    return context.result || null
  }

  /**
   * Subscribe to specific events
   */
  public on(eventType: string, callback: (event: PipelineEvent) => void): () => void {
    const listeners = this.eventListeners.get(eventType) || new Set()
    listeners.add(callback)
    this.eventListeners.set(eventType, listeners)
    return () => listeners.delete(callback)
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    this.eventListeners.clear()
    this.progressListeners.clear()
  }
}
