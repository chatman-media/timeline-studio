/**
 * Unified AI Orchestrator
 *
 * Координирует работу AI Director (Rust backend) с Montage Planner и другими AI сервисами.
 * Заменяет старый ai-orchestrator.ts с интеграцией нового AI Director workflow.
 *
 * Основные функции:
 * - Координация comprehensive analysis через AI Director
 * - Интеграция с Montage Planner для генерации планов монтажа
 * - Event dispatching через Domain Event Bus
 * - Progress tracking и error handling
 * - Унифицированный API для AI операций
 */

import { invoke } from "@tauri-apps/api/core"
import type {
  ContentAnalysisCompletedEvent,
  ContentAnalysisStartedEvent,
  MontagePlanGeneratedEvent,
} from "@/domains/shared/events"
import { DOMAIN_EVENTS, eventBus } from "@/domains/shared/events"
import { aiDirectorService } from "@/features/ai-director/services/ai-director-service"
import { createLogger } from "@/lib/tauri-logger"
import type { AIDirectorConfig, ComprehensiveAnalysisResult } from "@/types/generated/tauri-bindings"
import type {
  AnalysisOptions,
  MontageAnalysisResult,
  MontagePlan,
  PlanStatistics,
  PlanValidation,
} from "@/types/montage-planner-rust"
import {
  mapComprehensiveAnalysisToUnified,
  mapMontageAnalysisToUnified,
  type UnifiedContentAnalysis,
} from "../mappers/ai-director-mapper"

const logger = createLogger({ module: "UnifiedOrchestrator" })

// ============================================================================
// Types
// ============================================================================

export interface AnalysisWorkflow {
  workflowId: string
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled"
  videoPath: string
  startTime: Date
  endTime?: Date
  stages: {
    aiDirector: "pending" | "in_progress" | "completed" | "failed"
    montagePlanner: "pending" | "in_progress" | "completed" | "failed"
    integration: "pending" | "in_progress" | "completed" | "failed"
  }
  results: {
    comprehensive?: ComprehensiveAnalysisResult
    montage?: MontageAnalysisResult
    unified?: UnifiedContentAnalysis
  }
  errors: Array<{
    stage: string
    error: string
    timestamp: Date
  }>
}

export interface BatchAnalysisWorkflow {
  batchId: string
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled"
  videoPaths: string[]
  startTime: Date
  endTime?: Date
  completedCount: number
  failedCount: number
  workflows: Map<string, AnalysisWorkflow>
}

export interface OrchestratorOptions {
  enableProgressEvents?: boolean
  enableErrorRecovery?: boolean
  maxRetries?: number
  timeoutMs?: number
}

// ============================================================================
// Unified Orchestrator Service
// ============================================================================

export class UnifiedOrchestrator {
  private static instance: UnifiedOrchestrator | null = null

  private activeWorkflows = new Map<string, AnalysisWorkflow>()
  private activeBatches = new Map<string, BatchAnalysisWorkflow>()
  private options: Required<OrchestratorOptions>

  private constructor(options?: OrchestratorOptions) {
    this.options = {
      enableProgressEvents: options?.enableProgressEvents ?? true,
      enableErrorRecovery: options?.enableErrorRecovery ?? true,
      maxRetries: options?.maxRetries ?? 3,
      timeoutMs: options?.timeoutMs ?? 300000, // 5 minutes default
    }

    logger.info("UnifiedOrchestrator инициализирован", { options: this.options })
    this.setupEventListeners()
  }

  static getInstance(options?: OrchestratorOptions): UnifiedOrchestrator {
    if (!UnifiedOrchestrator.instance) {
      UnifiedOrchestrator.instance = new UnifiedOrchestrator(options)
    }
    return UnifiedOrchestrator.instance
  }

  // ============================================================================
  // Event Listeners Setup
  // ============================================================================

  private setupEventListeners() {
    // Слушаем события из других доменов для автоматического запуска анализа
    eventBus.subscribe(
      async (event) => {
        logger.debug("Получено событие из другого домена", { type: event.type })

        switch (event.type) {
          case DOMAIN_EVENTS.MEDIA.FILES_IMPORTED:
            // Автоматический анализ для новых файлов (если включено)
            const files = event.payload as any
            if (files?.length > 0) {
              logger.info("Обнаружены новые медиафайлы, можно запустить анализ", {
                count: files.length,
              })
              // TODO: Добавить настройку для автоматического анализа
            }
            break

          case DOMAIN_EVENTS.VIDEO.TIMELINE_CREATED:
            logger.info("Создан новый таймлайн, AI может предложить улучшения")
            break
        }
      },
      {
        filter: {
          source: ["media-management", "video-editing"],
        },
      },
    )
  }

  // ============================================================================
  // Comprehensive Analysis Workflow
  // ============================================================================

  /**
   * Запускает полный анализ видео через AI Director + Montage Planner
   */
  async analyzeComprehensive(
    videoPath: string,
    config?: {
      aiDirectorConfig?: AIDirectorConfig
      montageOptions?: AnalysisOptions
      skipMontageAnalysis?: boolean
    },
  ): Promise<{
    workflowId: string
    comprehensive: ComprehensiveAnalysisResult
    montage?: MontageAnalysisResult
    unified: UnifiedContentAnalysis
  }> {
    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substring(7)}`

    logger.info("Запуск comprehensive analysis workflow", {
      workflowId,
      videoPath,
      skipMontageAnalysis: config?.skipMontageAnalysis,
    })

    // Создаем workflow
    const workflow: AnalysisWorkflow = {
      workflowId,
      status: "in_progress",
      videoPath,
      startTime: new Date(),
      stages: {
        aiDirector: "in_progress",
        montagePlanner: "pending",
        integration: "pending",
      },
      results: {},
      errors: [],
    }

    this.activeWorkflows.set(workflowId, workflow)

    // Публикуем событие о начале анализа
    await this.publishAnalysisStartedEvent(workflowId, [videoPath])

    try {
      // Stage 1: AI Director Comprehensive Analysis
      logger.info("Stage 1: AI Director comprehensive analysis", { workflowId })
      const comprehensiveResult = await aiDirectorService.analyzeComprehensive(videoPath, config?.aiDirectorConfig)

      workflow.stages.aiDirector = "completed"
      workflow.results.comprehensive = comprehensiveResult
      logger.info("Stage 1: AI Director analysis завершен", { workflowId })

      // Stage 2: Montage Planner Analysis (optional)
      let montageResult: MontageAnalysisResult | undefined

      if (!config?.skipMontageAnalysis) {
        try {
          logger.info("Stage 2: Montage Planner analysis", { workflowId })
          workflow.stages.montagePlanner = "in_progress"

          const montageOptions: AnalysisOptions = config?.montageOptions ?? {
            enable_object_detection: true,
            enable_face_detection: true,
            enable_emotion_analysis: true,
            enable_composition_analysis: true,
            enable_audio_analysis: true,
            frame_sample_rate: 1.0,
            quality_threshold: 50.0,
            max_moments: 50,
            frame_sampling_rate: 1.0,
          }

          // Вызываем Rust команду analyze_montage_videos
          const montageResults = await invoke<MontageAnalysisResult[]>("analyze_montage_videos", {
            videoIds: [videoPath],
            options: montageOptions,
          })

          if (montageResults && montageResults.length > 0) {
            montageResult = montageResults[0]
            workflow.stages.montagePlanner = "completed"
            workflow.results.montage = montageResult
            logger.info("Stage 2: Montage Planner analysis завершен", { workflowId })
          }
        } catch (error) {
          workflow.stages.montagePlanner = "failed"
          workflow.errors.push({
            stage: "montagePlanner",
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date(),
          })
          logger.error("Stage 2: Montage Planner analysis ошибка", { workflowId, error })
          // Продолжаем даже если montage analysis не удался
        }
      } else {
        workflow.stages.montagePlanner = "completed"
      }

      // Stage 3: Integration - создаем unified результат
      logger.info("Stage 3: Integration - создание unified результата", { workflowId })
      workflow.stages.integration = "in_progress"

      const unifiedResult: UnifiedContentAnalysis = mapComprehensiveAnalysisToUnified(comprehensiveResult)

      // Дополняем unified result данными из montage analysis
      if (montageResult) {
        const montageUnified = mapMontageAnalysisToUnified(montageResult)
        // Merge key moments
        if (montageUnified.keyMoments) {
          unifiedResult.keyMoments = montageUnified.keyMoments
        }
      }

      workflow.stages.integration = "completed"
      workflow.results.unified = unifiedResult
      workflow.status = "completed"
      workflow.endTime = new Date()

      logger.info("Comprehensive analysis workflow завершен успешно", {
        workflowId,
        duration: workflow.endTime.getTime() - workflow.startTime.getTime(),
      })

      // Публикуем событие о завершении анализа
      await this.publishAnalysisCompletedEvent(workflowId, unifiedResult)

      return {
        workflowId,
        comprehensive: comprehensiveResult,
        montage: montageResult,
        unified: unifiedResult,
      }
    } catch (error) {
      workflow.status = "failed"
      workflow.endTime = new Date()
      workflow.errors.push({
        stage: "workflow",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      })

      logger.error("Comprehensive analysis workflow провален", { workflowId, error })

      throw new Error(`Comprehensive analysis failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Запускает batch analysis для нескольких видео
   */
  async analyzeBatch(
    videoPaths: string[],
    config?: {
      aiDirectorConfig?: AIDirectorConfig
      montageOptions?: AnalysisOptions
      skipMontageAnalysis?: boolean
    },
  ): Promise<{
    batchId: string
    results: Array<{
      videoPath: string
      workflowId: string
      comprehensive: ComprehensiveAnalysisResult
      montage?: MontageAnalysisResult
      unified: UnifiedContentAnalysis
      success: boolean
      error?: string
    }>
  }> {
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(7)}`

    logger.info("Запуск batch analysis", { batchId, count: videoPaths.length })

    const batch: BatchAnalysisWorkflow = {
      batchId,
      status: "in_progress",
      videoPaths,
      startTime: new Date(),
      completedCount: 0,
      failedCount: 0,
      workflows: new Map(),
    }

    this.activeBatches.set(batchId, batch)

    const results: Array<{
      videoPath: string
      workflowId: string
      comprehensive: ComprehensiveAnalysisResult
      montage?: MontageAnalysisResult
      unified: UnifiedContentAnalysis
      success: boolean
      error?: string
    }> = []

    // Анализируем каждый файл последовательно
    for (const videoPath of videoPaths) {
      try {
        const result = await this.analyzeComprehensive(videoPath, config)
        results.push({
          videoPath,
          workflowId: result.workflowId,
          comprehensive: result.comprehensive,
          montage: result.montage,
          unified: result.unified,
          success: true,
        })
        batch.completedCount++
      } catch (error) {
        results.push({
          videoPath,
          workflowId: "",
          comprehensive: {} as ComprehensiveAnalysisResult,
          unified: {} as UnifiedContentAnalysis,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
        batch.failedCount++
        logger.error("Batch analysis: ошибка анализа файла", { videoPath, error })
      }
    }

    batch.status = "completed"
    batch.endTime = new Date()

    logger.info("Batch analysis завершен", {
      batchId,
      total: videoPaths.length,
      completed: batch.completedCount,
      failed: batch.failedCount,
    })

    return {
      batchId,
      results,
    }
  }

  // ============================================================================
  // Montage Planning Operations
  // ============================================================================

  /**
   * Генерирует plan монтажа на основе проанализированных видео
   */
  async generateMontagePlan(
    videoIds: string[],
    options: AnalysisOptions,
  ): Promise<{
    analysisResults: MontageAnalysisResult[]
    plan?: MontagePlan
  }> {
    logger.info("Генерация montage plan", { videoCount: videoIds.length })

    try {
      // Анализируем видео для монтажа
      const analysisResults = await invoke<MontageAnalysisResult[]>("analyze_montage_videos", {
        videoIds,
        options,
      })

      logger.info("Montage analysis завершен", { resultsCount: analysisResults.length })

      // TODO: Здесь можно добавить генерацию плана монтажа на основе результатов
      // Пока возвращаем только результаты анализа

      return {
        analysisResults,
      }
    } catch (error) {
      logger.error("Ошибка генерации montage plan", { error })
      throw error
    }
  }

  /**
   * Оптимизирует существующий plan монтажа
   */
  async optimizeMontagePlan(plan: MontagePlan, preferences?: Record<string, unknown>): Promise<MontagePlan> {
    logger.info("Оптимизация montage plan", { planId: plan.id })

    try {
      const optimizedPlan = await invoke<MontagePlan>("optimize_montage_plan", {
        plan,
        preferences: preferences ?? {},
      })

      logger.info("Montage plan оптимизирован", { planId: optimizedPlan.id })

      // Публикуем событие о генерации плана
      await eventBus.publish<MontagePlanGeneratedEvent>(
        DOMAIN_EVENTS.AI_SERVICES.MONTAGE_PLAN_GENERATED,
        "ai-services",
        {
          planId: optimizedPlan.id,
          plan: optimizedPlan as any, // TODO: Fix type mismatch
          mediaFiles: [], // TODO: Get from context
          style: optimizedPlan.style as any,
          duration: optimizedPlan.total_duration,
        },
      )

      return optimizedPlan
    } catch (error) {
      logger.error("Ошибка оптимизации montage plan", { error })
      throw error
    }
  }

  /**
   * Валидирует plan монтажа
   */
  async validateMontagePlan(plan: MontagePlan): Promise<PlanValidation> {
    logger.info("Валидация montage plan", { planId: plan.id })

    try {
      const validation = await invoke<PlanValidation>("validate_montage_plan", {
        plan,
      })

      logger.info("Montage plan валидирован", {
        planId: plan.id,
        isValid: validation.is_valid,
        errorsCount: validation.errors.length,
        warningsCount: validation.warnings.length,
      })

      return validation
    } catch (error) {
      logger.error("Ошибка валидации montage plan", { error })
      throw error
    }
  }

  /**
   * Рассчитывает статистику для плана монтажа
   */
  async calculatePlanStatistics(plan: MontagePlan): Promise<PlanStatistics> {
    logger.info("Расчет статистики montage plan", { planId: plan.id })

    try {
      const statistics = await invoke<PlanStatistics>("calculate_plan_statistics", {
        plan,
      })

      logger.info("Статистика montage plan рассчитана", { planId: plan.id })

      return statistics
    } catch (error) {
      logger.error("Ошибка расчета статистики montage plan", { error })
      throw error
    }
  }

  // ============================================================================
  // Workflow Management
  // ============================================================================

  /**
   * Получить информацию о workflow
   */
  getWorkflow(workflowId: string): AnalysisWorkflow | undefined {
    return this.activeWorkflows.get(workflowId)
  }

  /**
   * Получить информацию о batch
   */
  getBatch(batchId: string): BatchAnalysisWorkflow | undefined {
    return this.activeBatches.get(batchId)
  }

  /**
   * Получить список активных workflows
   */
  getActiveWorkflows(): AnalysisWorkflow[] {
    return Array.from(this.activeWorkflows.values())
  }

  /**
   * Получить список активных batches
   */
  getActiveBatches(): BatchAnalysisWorkflow[] {
    return Array.from(this.activeBatches.values())
  }

  /**
   * Отменить workflow
   */
  cancelWorkflow(workflowId: string): boolean {
    const workflow = this.activeWorkflows.get(workflowId)
    if (workflow && workflow.status === "in_progress") {
      workflow.status = "cancelled"
      workflow.endTime = new Date()
      logger.info("Workflow отменен", { workflowId })
      return true
    }
    return false
  }

  /**
   * Очистить завершенные workflows
   */
  cleanupCompletedWorkflows(): number {
    let cleaned = 0
    for (const [workflowId, workflow] of this.activeWorkflows.entries()) {
      if (workflow.status === "completed" || workflow.status === "failed" || workflow.status === "cancelled") {
        this.activeWorkflows.delete(workflowId)
        cleaned++
      }
    }
    logger.info("Очищены завершенные workflows", { count: cleaned })
    return cleaned
  }

  // ============================================================================
  // Event Publishing
  // ============================================================================

  private async publishAnalysisStartedEvent(workflowId: string, mediaFiles: string[]) {
    if (!this.options.enableProgressEvents) return

    await eventBus.publish<ContentAnalysisStartedEvent>(
      DOMAIN_EVENTS.AI_SERVICES.CONTENT_ANALYSIS_STARTED,
      "ai-services",
      {
        analysisId: workflowId,
        mediaFiles: mediaFiles as any[],
        analysisTypes: ["comprehensive", "montage", "scene", "object", "emotion"],
      },
    )
  }

  private async publishAnalysisCompletedEvent(workflowId: string, result: UnifiedContentAnalysis) {
    if (!this.options.enableProgressEvents) return

    await eventBus.publish<ContentAnalysisCompletedEvent>(
      DOMAIN_EVENTS.AI_SERVICES.CONTENT_ANALYSIS_COMPLETED,
      "ai-services",
      {
        analysisId: workflowId,
        results: result as any,
        duration: result.processingTimeMs,
      },
    )
  }

  // ============================================================================
  // System Status
  // ============================================================================

  /**
   * Получить системный статус
   */
  async getSystemStatus() {
    logger.info("Получение системного статуса")

    try {
      const status = await aiDirectorService.getSystemStatus()

      logger.info("Системный статус получен", { status })

      return status
    } catch (error) {
      logger.error("Ошибка получения системного статуса", { error })
      throw error
    }
  }

  /**
   * Health check всех сервисов
   */
  async healthCheck() {
    logger.info("Health check всех сервисов")

    try {
      const [aiDirectorHealth, aiDirectorAvailable] = await Promise.all([
        aiDirectorService.healthCheck(),
        aiDirectorService.checkAvailability(),
      ])

      const isHealthy = aiDirectorHealth.overall_status === "healthy" && aiDirectorAvailable

      logger.info("Health check завершен", { isHealthy })

      return {
        isHealthy,
        aiDirector: {
          health: aiDirectorHealth,
          available: aiDirectorAvailable,
        },
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      logger.error("Ошибка health check", { error })
      throw error
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Очистить все данные orchestrator
   */
  cleanup() {
    logger.info("Очистка UnifiedOrchestrator", {
      activeWorkflows: this.activeWorkflows.size,
      activeBatches: this.activeBatches.size,
    })

    this.activeWorkflows.clear()
    this.activeBatches.clear()
  }

  /**
   * Reset singleton instance (для тестирования)
   */
  static resetInstance() {
    if (UnifiedOrchestrator.instance) {
      UnifiedOrchestrator.instance.cleanup()
      UnifiedOrchestrator.instance = null
    }
  }
}

// Export singleton instance
export const unifiedOrchestrator = UnifiedOrchestrator.getInstance()
