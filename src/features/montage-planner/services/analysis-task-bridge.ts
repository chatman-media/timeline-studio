/**
 * Analysis Task Bridge
 *
 * Мост между frontend AnalysisTask UI и backend UnifiedOrchestrator.
 * Преобразует AnalysisWorkflow в AnalysisTask и подписывается на события прогресса.
 *
 * Основные функции:
 * - Конвертация AnalysisWorkflow → AnalysisTask
 * - Подписка на события прогресса (AI_DIRECTOR_ANALYSIS_PROGRESS)
 * - Запуск анализа через UnifiedOrchestrator
 * - Отмена задач анализа
 */

import type { AnalysisWorkflow } from "@/domains/ai-services/services/unified-orchestrator"
import { unifiedOrchestrator } from "@/domains/ai-services/services/unified-orchestrator"
import type {
  AIDirectorAnalysisProgressEvent,
  AIDirectorStageCompletedEvent,
  ContentAnalysisCompletedEvent,
  ContentAnalysisStartedEvent,
} from "@/domains/shared/events"
import { DOMAIN_EVENTS, eventBus } from "@/domains/shared/events"
import { createLogger } from "@/lib/tauri-logger"
import { AnalysisTaskStatus } from "../types/analysis-task"
import type { AnalysisTask, AnalysisTaskOptions, AnalysisTaskProgress } from "../types/analysis-task"

const logger = createLogger({ module: "AnalysisTaskBridge" })

// ============================================================================
// Type Mapping Utilities
// ============================================================================

/**
 * Маппинг stage status из AnalysisWorkflow в AnalysisTaskStatus
 */
function mapStageToStatus(
  aiDirector: string,
  montagePlanner: string,
  integration: string,
  overallStatus: string,
): AnalysisTaskStatus {
  // Если workflow в целом провален или отменен
  if (overallStatus === "failed") return AnalysisTaskStatus.Failed
  if (overallStatus === "cancelled") return AnalysisTaskStatus.Cancelled
  if (overallStatus === "completed") return AnalysisTaskStatus.Completed

  // Определяем текущий stage на основе прогресса
  if (overallStatus === "pending") return AnalysisTaskStatus.Pending

  if (aiDirector === "in_progress") return AnalysisTaskStatus.AnalyzingVideo
  if (aiDirector === "failed") return AnalysisTaskStatus.Failed

  if (montagePlanner === "in_progress") return AnalysisTaskStatus.AnalyzingAudio
  if (montagePlanner === "failed") return AnalysisTaskStatus.Failed

  if (integration === "in_progress") return AnalysisTaskStatus.GeneratingPlan
  if (integration === "failed") return AnalysisTaskStatus.Failed

  // Если все completed, но overall status еще in_progress
  if (aiDirector === "completed" && montagePlanner === "completed" && integration === "completed") {
    return AnalysisTaskStatus.Completed
  }

  // По умолчанию - initializing
  return AnalysisTaskStatus.Initializing
}

/**
 * Вычисление процента прогресса из stages
 */
function calculateProgress(stages: AnalysisWorkflow["stages"]): number {
  let completed = 0
  const total = 3 // aiDirector, montagePlanner, integration

  if (stages.aiDirector === "completed") completed++
  if (stages.montagePlanner === "completed") completed++
  if (stages.integration === "completed") completed++

  return Math.round((completed / total) * 100)
}

/**
 * Получить имя видео из пути
 * Поддерживает как Unix (/), так и Windows (\) разделители
 */
function getVideoName(videoPath: string): string {
  const parts = videoPath.split(/[/\\]/)
  return parts[parts.length - 1] || videoPath
}

/**
 * Маппинг AnalysisTaskStatus → AnalysisPhase
 */
function mapStatusToPhase(status: AnalysisTaskStatus): string {
  switch (status) {
    case AnalysisTaskStatus.Pending:
    case AnalysisTaskStatus.Initializing:
      return "initializing"
    case AnalysisTaskStatus.AnalyzingVideo:
      return "analyzing_video"
    case AnalysisTaskStatus.AnalyzingAudio:
      return "analyzing_audio"
    case AnalysisTaskStatus.DetectingMoments:
      return "detecting_moments"
    case AnalysisTaskStatus.GeneratingPlan:
      return "generating_plan"
    case AnalysisTaskStatus.Completed:
      return "complete"
    default:
      return "initializing"
  }
}

/**
 * Конвертация AnalysisWorkflow → AnalysisTask
 */
function convertWorkflowToTask(workflow: AnalysisWorkflow): AnalysisTask {
  const status = mapStageToStatus(
    workflow.stages.aiDirector,
    workflow.stages.montagePlanner,
    workflow.stages.integration,
    workflow.status,
  )

  const progress: AnalysisTaskProgress = {
    percentage: calculateProgress(workflow.stages),
    phase: mapStatusToPhase(status) as any, // AnalysisPhase type
    current_file: workflow.videoPath,
    message: undefined, // Обновляется из событий прогресса
    eta: undefined, // Обновляется из событий прогресса
  }

  const task: AnalysisTask = {
    id: workflow.workflowId,
    video_path: workflow.videoPath,
    video_name: getVideoName(workflow.videoPath),
    status,
    created_at: workflow.startTime.toISOString(),
    started_at: workflow.startTime.toISOString(),
    completed_at: workflow.endTime?.toISOString(),
    progress,
    error_message: workflow.errors.length > 0 ? workflow.errors[workflow.errors.length - 1].error : undefined,
    // Результаты пока не маппим полностью - требуется сложная конвертация типов
    // В будущем можно добавить детальный маппинг через as any или создать полный converter
    results: workflow.results.unified ? (undefined as any) : undefined,
  }

  return task
}

// ============================================================================
// Analysis Task Bridge Service
// ============================================================================

export class AnalysisTaskBridge {
  private static instance: AnalysisTaskBridge | null = null

  // Кэш задач с дополнительными данными из событий
  private tasksCache = new Map<string, AnalysisTask>()
  private progressCallbacks = new Set<(task: AnalysisTask) => void>()

  private constructor() {
    logger.info("AnalysisTaskBridge инициализирован")
    this.setupEventListeners()
  }

  static getInstance(): AnalysisTaskBridge {
    if (!AnalysisTaskBridge.instance) {
      AnalysisTaskBridge.instance = new AnalysisTaskBridge()
    }
    return AnalysisTaskBridge.instance
  }

  // ============================================================================
  // Event Listeners
  // ============================================================================

  private setupEventListeners() {
    // Подписываемся на события прогресса
    eventBus.subscribe<AIDirectorAnalysisProgressEvent>(
      (event) => {
        const { analysisId, progress, estimatedTimeRemaining, message } = event.payload

        logger.debug("Получено событие прогресса анализа", {
          analysisId,
          progress,
          estimatedTimeRemaining,
        })

        // Обновляем кэш задачи
        const cachedTask = this.tasksCache.get(analysisId)
        if (cachedTask) {
          cachedTask.progress.percentage = Math.round(progress * 100)
          cachedTask.progress.eta = estimatedTimeRemaining
          cachedTask.progress.message = message

          // Уведомляем подписчиков
          this.notifyProgressCallbacks(cachedTask)
        } else {
          // Если задачи нет в кэше, загружаем из orchestrator
          void this.refreshTaskFromOrchestrator(analysisId)
        }
      },
      {
        filter: {
          type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_ANALYSIS_PROGRESS,
        },
      },
    )

    // Подписываемся на завершение stage
    eventBus.subscribe<AIDirectorStageCompletedEvent>(
      (event) => {
        const { analysisId, stage, success } = event.payload

        logger.debug("Получено событие завершения stage", { analysisId, stage, success })

        void this.refreshTaskFromOrchestrator(analysisId)
      },
      {
        filter: {
          type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_STAGE_COMPLETED,
        },
      },
    )

    // Подписываемся на начало анализа
    eventBus.subscribe<ContentAnalysisStartedEvent>(
      (event) => {
        const { analysisId } = event.payload

        logger.info("Получено событие начала анализа", { analysisId })

        void this.refreshTaskFromOrchestrator(analysisId)
      },
      {
        filter: {
          type: DOMAIN_EVENTS.AI_SERVICES.CONTENT_ANALYSIS_STARTED,
        },
      },
    )

    // Подписываемся на завершение анализа
    eventBus.subscribe<ContentAnalysisCompletedEvent>(
      (event) => {
        const { analysisId } = event.payload

        logger.info("Получено событие завершения анализа", { analysisId })

        void this.refreshTaskFromOrchestrator(analysisId)
      },
      {
        filter: {
          type: DOMAIN_EVENTS.AI_SERVICES.CONTENT_ANALYSIS_COMPLETED,
        },
      },
    )
  }

  /**
   * Обновить задачу из orchestrator и уведомить подписчиков
   */
  private async refreshTaskFromOrchestrator(workflowId: string) {
    try {
      const workflow = unifiedOrchestrator.getWorkflow(workflowId)
      if (workflow) {
        const task = convertWorkflowToTask(workflow)
        this.tasksCache.set(workflowId, task)
        this.notifyProgressCallbacks(task)
      }
    } catch (error) {
      logger.error("Ошибка обновления задачи из orchestrator", { workflowId, error })
    }
  }

  /**
   * Уведомить все подписки о прогресе
   */
  private notifyProgressCallbacks(task: AnalysisTask) {
    this.progressCallbacks.forEach((callback) => {
      try {
        callback(task)
      } catch (error) {
        logger.error("Ошибка вызова progress callback", { taskId: task.id, error })
      }
    })
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Получить список активных задач анализа
   */
  async getActiveTasks(): Promise<AnalysisTask[]> {
    try {
      logger.debug("Получение активных задач анализа")

      const workflows = unifiedOrchestrator.getActiveWorkflows()
      const tasks = workflows.map((workflow) => {
        // Проверяем кэш для актуального прогресса
        const cachedTask = this.tasksCache.get(workflow.workflowId)
        if (cachedTask) {
          return cachedTask
        }

        // Конвертируем workflow в task
        const task = convertWorkflowToTask(workflow)
        this.tasksCache.set(workflow.workflowId, task)
        return task
      })

      logger.debug("Активные задачи получены", { count: tasks.length })
      return tasks
    } catch (error) {
      logger.error("Ошибка получения активных задач", { error })
      throw error
    }
  }

  /**
   * Получить конкретную задачу по ID
   */
  async getTask(taskId: string): Promise<AnalysisTask | null> {
    try {
      logger.debug("Получение задачи", { taskId })

      // Проверяем кэш
      const cachedTask = this.tasksCache.get(taskId)
      if (cachedTask) {
        return cachedTask
      }

      // Загружаем из orchestrator
      const workflow = unifiedOrchestrator.getWorkflow(taskId)
      if (!workflow) {
        logger.debug("Задача не найдена", { taskId })
        return null
      }

      const task = convertWorkflowToTask(workflow)
      this.tasksCache.set(taskId, task)
      return task
    } catch (error) {
      logger.error("Ошибка получения задачи", { taskId, error })
      throw error
    }
  }

  /**
   * Запустить анализ видео
   */
  async startAnalysis(videoPath: string, options?: AnalysisTaskOptions): Promise<string> {
    try {
      logger.info("Запуск анализа видео", { videoPath, options })

      // Запускаем comprehensive analysis через orchestrator
      // Используем типы as any для упрощения, так как типы могут не совпадать точно
      const result = await unifiedOrchestrator.analyzeComprehensive(videoPath, {
        aiDirectorConfig: options?.aiDirectorConfig as any,
        montageOptions: options?.montageOptions as any,
        skipMontageAnalysis: options?.skipMontageAnalysis ?? false,
      })

      logger.info("Анализ запущен успешно", { workflowId: result.workflowId })

      // Обновляем кэш
      await this.refreshTaskFromOrchestrator(result.workflowId)

      return result.workflowId
    } catch (error) {
      logger.error("Ошибка запуска анализа", { videoPath, error })
      throw error
    }
  }

  /**
   * Отменить задачу анализа
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      logger.info("Отмена задачи анализа", { taskId })

      const success = unifiedOrchestrator.cancelWorkflow(taskId)

      if (success) {
        // Обновляем кэш
        await this.refreshTaskFromOrchestrator(taskId)
        logger.info("Задача отменена успешно", { taskId })
      } else {
        logger.warn("Не удалось отменить задачу", { taskId })
      }

      return success
    } catch (error) {
      logger.error("Ошибка отмены задачи", { taskId, error })
      throw error
    }
  }

  /**
   * Подписаться на обновления прогресса
   */
  subscribeToProgress(callback: (task: AnalysisTask) => void): () => void {
    logger.debug("Добавлена подписка на прогресс")
    this.progressCallbacks.add(callback)

    // Возвращаем функцию отписки
    return () => {
      logger.debug("Удалена подписка на прогресс")
      this.progressCallbacks.delete(callback)
    }
  }

  /**
   * Очистить кэш задач
   */
  clearCache() {
    logger.info("Очистка кэша задач", { cacheSize: this.tasksCache.size })
    this.tasksCache.clear()
  }

  /**
   * Reset singleton instance (для тестирования)
   */
  static resetInstance() {
    if (AnalysisTaskBridge.instance) {
      AnalysisTaskBridge.instance.clearCache()
      AnalysisTaskBridge.instance = null
    }
  }
}

// Export singleton instance
export const analysisTaskBridge = AnalysisTaskBridge.getInstance()
