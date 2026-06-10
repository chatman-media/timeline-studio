/**
 * AI Event Bridge
 *
 * Мост между Tauri events (Rust backend) и Domain Event Bus (TypeScript)
 * Обеспечивает двунаправленную синхронизацию событий между Rust и TypeScript
 *
 * Функции:
 * - Слушает Tauri events из AI Director (Rust)
 * - Преобразует в Domain Events (TypeScript)
 * - Публикует через Domain Event Bus
 * - Обеспечивает типобезопасность event mapping
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event"
import { DOMAIN_EVENTS, eventBus } from "@timeline-studio/domains/shared/events"
import type {
  AIDirectorAnalysisCompletedEvent,
  AIDirectorAnalysisErrorEvent,
  AIDirectorAnalysisProgressEvent,
  AIDirectorBatchCompletedEvent,
  AIDirectorStageCompletedEvent,
} from "@timeline-studio/domains/shared/events/ai-services-events"
import { isDesktop } from "@/lib/environment"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "AIEventBridge" })

// ============================================================================
// Tauri Event Names (emitted from Rust)
// ============================================================================

const TAURI_EVENTS = {
  // AI Director Analysis Events
  ANALYSIS_PROGRESS: "ai-director:analysis-progress",
  ANALYSIS_COMPLETED: "ai-director:analysis-completed",
  ANALYSIS_ERROR: "ai-director:analysis-error",
  ANALYSIS_STAGE_COMPLETED: "ai-director:stage-completed",

  // Batch Analysis Events
  BATCH_PROGRESS: "ai-director:batch-progress",
  BATCH_COMPLETED: "ai-director:batch-completed",

  // System Events
  SYSTEM_STATUS_CHANGED: "ai-director:system-status",
  CAPABILITIES_UPDATED: "ai-director:capabilities-updated",
} as const

// ============================================================================
// Tauri Event Payload Types (from Rust)
// ============================================================================

interface TauriAnalysisProgress {
  analysis_id: string
  stage: string
  progress: number
  message?: string
  estimated_time_remaining?: number
}

interface TauriAnalysisCompleted {
  analysis_id: string
  video_path: string
  success: boolean
  total_duration_ms: number
  stages_completed: string[]
  errors: string[]
}

interface TauriAnalysisError {
  analysis_id: string
  stage: string
  error: string
}

interface TauriStageCompleted {
  analysis_id: string
  stage: string
  duration_ms: number
  success: boolean
  error?: string
}

interface TauriBatchCompleted {
  batch_id: string
  total_files: number
  success_count: number
  failed_count: number
  total_duration_ms: number
}

// ============================================================================
// AI Event Bridge Class
// ============================================================================

export class AIEventBridge {
  private static instance: AIEventBridge | null = null
  private unlisteners: UnlistenFn[] = []
  private isInitialized = false
  private isEnabled = true

  private constructor() {
    // Singleton
  }

  /**
   * Получить экземпляр bridge (Singleton)
   */
  static getInstance(): AIEventBridge {
    if (!AIEventBridge.instance) {
      AIEventBridge.instance = new AIEventBridge()
    }
    return AIEventBridge.instance
  }

  /**
   * Инициализировать bridge и начать слушать события
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn("AIEventBridge уже инициализирован")
      return
    }

    // Check if running in Tauri environment
    if (!isDesktop()) {
      logger.warn("AIEventBridge is only available in Tauri environment, skipping initialization")
      this.isInitialized = false
      return
    }

    logger.info("Инициализация AIEventBridge")

    try {
      // Подписываемся на Tauri события
      await this.setupTauriListeners()

      this.isInitialized = true
      logger.info("AIEventBridge успешно инициализирован")
    } catch (error) {
      logger.error("Ошибка инициализации AIEventBridge", { error })
      throw error
    }
  }

  /**
   * Настроить слушателей Tauri событий
   */
  private async setupTauriListeners(): Promise<void> {
    // Analysis Progress
    const unlistenProgress = await listen<TauriAnalysisProgress>(TAURI_EVENTS.ANALYSIS_PROGRESS, (event) => {
      if (!this.isEnabled) return
      this.handleAnalysisProgress(event.payload)
    })
    this.unlisteners.push(unlistenProgress)

    // Analysis Completed
    const unlistenCompleted = await listen<TauriAnalysisCompleted>(TAURI_EVENTS.ANALYSIS_COMPLETED, (event) => {
      if (!this.isEnabled) return
      this.handleAnalysisCompleted(event.payload)
    })
    this.unlisteners.push(unlistenCompleted)

    // Analysis Error
    const unlistenError = await listen<TauriAnalysisError>(TAURI_EVENTS.ANALYSIS_ERROR, (event) => {
      if (!this.isEnabled) return
      this.handleAnalysisError(event.payload)
    })
    this.unlisteners.push(unlistenError)

    // Stage Completed
    const unlistenStage = await listen<TauriStageCompleted>(TAURI_EVENTS.ANALYSIS_STAGE_COMPLETED, (event) => {
      if (!this.isEnabled) return
      this.handleStageCompleted(event.payload)
    })
    this.unlisteners.push(unlistenStage)

    // Batch Completed
    const unlistenBatch = await listen<TauriBatchCompleted>(TAURI_EVENTS.BATCH_COMPLETED, (event) => {
      if (!this.isEnabled) return
      this.handleBatchCompleted(event.payload)
    })
    this.unlisteners.push(unlistenBatch)

    logger.info("Tauri event listeners настроены", {
      listenersCount: this.unlisteners.length,
    })
  }

  // ============================================================================
  // Event Handlers - преобразование Tauri → Domain Events
  // ============================================================================

  /**
   * Обработка прогресса анализа
   */
  private handleAnalysisProgress(payload: TauriAnalysisProgress): void {
    logger.debug("Получено Tauri событие: analysis-progress", {
      analysisId: payload.analysis_id,
      stage: payload.stage,
      progress: payload.progress,
    })

    const domainEvent: AIDirectorAnalysisProgressEvent = {
      analysisId: payload.analysis_id,
      stage: payload.stage,
      progress: payload.progress,
      message: payload.message || `Анализ в процессе: ${payload.stage}`,
      estimatedTimeRemaining: payload.estimated_time_remaining,
    }

    eventBus.publish(DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_ANALYSIS_PROGRESS, "ai-services", domainEvent)
  }

  /**
   * Обработка завершения анализа
   */
  private handleAnalysisCompleted(payload: TauriAnalysisCompleted): void {
    logger.info("Получено Tauri событие: analysis-completed", {
      analysisId: payload.analysis_id,
      videoPath: payload.video_path,
      success: payload.success,
    })

    const domainEvent: AIDirectorAnalysisCompletedEvent = {
      analysisId: payload.analysis_id,
      videoPath: payload.video_path,
      success: payload.success,
      totalDuration: payload.total_duration_ms,
      stagesCompleted: payload.stages_completed,
      errors: payload.errors,
    }

    eventBus.publish(DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_ANALYSIS_COMPLETED, "ai-services", domainEvent)
  }

  /**
   * Обработка ошибки анализа
   */
  private handleAnalysisError(payload: TauriAnalysisError): void {
    logger.error("Получено Tauri событие: analysis-error", {
      analysisId: payload.analysis_id,
      stage: payload.stage,
      error: payload.error,
    })

    const domainEvent: AIDirectorAnalysisErrorEvent = {
      analysisId: payload.analysis_id,
      stage: payload.stage,
      error: payload.error,
      timestamp: Date.now(),
    }

    eventBus.publish(DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_ANALYSIS_ERROR, "ai-services", domainEvent)
  }

  /**
   * Обработка завершения стадии
   */
  private handleStageCompleted(payload: TauriStageCompleted): void {
    logger.debug("Получено Tauri событие: stage-completed", {
      analysisId: payload.analysis_id,
      stage: payload.stage,
      success: payload.success,
    })

    const domainEvent: AIDirectorStageCompletedEvent = {
      analysisId: payload.analysis_id,
      stage: payload.stage,
      duration: payload.duration_ms,
      success: payload.success,
      error: payload.error,
    }

    eventBus.publish(DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_STAGE_COMPLETED, "ai-services", domainEvent)
  }

  /**
   * Обработка завершения batch анализа
   */
  private handleBatchCompleted(payload: TauriBatchCompleted): void {
    logger.info("Получено Tauri событие: batch-completed", {
      batchId: payload.batch_id,
      totalFiles: payload.total_files,
      successCount: payload.success_count,
    })

    const domainEvent: AIDirectorBatchCompletedEvent = {
      batchId: payload.batch_id,
      totalFiles: payload.total_files,
      successCount: payload.success_count,
      failedCount: payload.failed_count,
      totalDuration: payload.total_duration_ms,
    }

    eventBus.publish(DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_BATCH_COMPLETED, "ai-services", domainEvent)
  }

  // ============================================================================
  // Control Methods
  // ============================================================================

  /**
   * Включить bridge (по умолчанию включен)
   */
  enable(): void {
    this.isEnabled = true
    logger.info("AIEventBridge включен")
  }

  /**
   * Отключить bridge (временно останавливает передачу событий)
   */
  disable(): void {
    this.isEnabled = false
    logger.info("AIEventBridge отключен")
  }

  /**
   * Проверить, инициализирован ли bridge
   */
  getIsInitialized(): boolean {
    return this.isInitialized
  }

  /**
   * Проверить, включен ли bridge
   */
  getIsEnabled(): boolean {
    return this.isEnabled
  }

  /**
   * Получить количество активных слушателей
   */
  getListenersCount(): number {
    return this.unlisteners.length
  }

  /**
   * Очистить все слушатели
   */
  async cleanup(): Promise<void> {
    logger.info("Очистка AIEventBridge", {
      listenersCount: this.unlisteners.length,
    })

    // Отписываемся от всех Tauri событий с защитой от ошибок
    for (const unlisten of this.unlisteners) {
      try {
        unlisten()
      } catch (error) {
        logger.warn("Ошибка при отписке от события", { error })
      }
    }

    this.unlisteners = []
    this.isInitialized = false

    logger.info("AIEventBridge очищен")
  }

  /**
   * Переинициализировать bridge
   */
  async reinitialize(): Promise<void> {
    logger.info("Переинициализация AIEventBridge")
    await this.cleanup()
    await this.initialize()
  }

  /**
   * Reset singleton instance (для тестирования)
   */
  static resetInstance(): void {
    if (AIEventBridge.instance) {
      AIEventBridge.instance.cleanup()
      AIEventBridge.instance = null
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

// Export singleton instance
export const aiEventBridge = AIEventBridge.getInstance()

// Export Tauri event names for reference
export { TAURI_EVENTS }
