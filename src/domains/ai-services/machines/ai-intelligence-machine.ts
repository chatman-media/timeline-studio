/**
 * AI Intelligence State Machine
 *
 * Машина состояний для AI анализа с интеграцией AI Director:
 * - AI Director (Rust backend) для comprehensive analysis
 * - Unified Orchestrator для координации
 * - Реальные Tauri команды вместо mock сервисов
 */

import { assign, emit, fromPromise, setup } from "xstate"
import { createLogger } from "@/lib/tauri-logger"
import type { AnalysisOptions, MontageAnalysisResult, MontagePlan } from "@/types/montage-planner-rust"
import type { UnifiedContentAnalysis } from "../mappers/ai-director-mapper"
import type { AIDirectorConfig, ComprehensiveAnalysisResult } from "../services/ai-director"
import { aiDirectorService } from "../services/ai-director"
import { unifiedOrchestrator } from "../services/unified-orchestrator"

const logger = createLogger({ module: "AIIntelligence" })

// ============================================================================
// Types
// ============================================================================

export interface AIIntelligenceContext {
  // Current media files
  mediaFiles: string[] // video paths
  currentVideoPath: string | null

  // Analysis configuration
  aiDirectorConfig: AIDirectorConfig | null
  montageOptions: AnalysisOptions | null

  // Analysis results
  comprehensiveResults: Map<string, ComprehensiveAnalysisResult>
  montageResults: Map<string, MontageAnalysisResult>
  unifiedAnalyses: Map<string, UnifiedContentAnalysis>
  currentMontageplan: MontagePlan | null

  // Workflow tracking
  currentWorkflowId: string | null
  currentBatchId: string | null

  // Progress
  progress: {
    stage: string // "idle" | "initialization" | "ai_director" | "montage" | "integration" | "complete"
    progress: number // 0-100
    message: string
  }

  // Status
  isAnalyzing: boolean
  isBatchAnalyzing: boolean
  isGeneratingPlan: boolean

  // Error handling
  error: string | null
  warnings: string[]

  // System status
  systemAvailable: boolean
  capabilities: any | null
}

export type AIIntelligenceEvent =
  // Analysis operations
  | { type: "ANALYZE_VIDEO"; videoPath: string; config?: AIDirectorConfig }
  | { type: "ANALYZE_BATCH"; videoPaths: string[]; config?: AIDirectorConfig }
  | { type: "GENERATE_MONTAGE_PLAN"; videoIds: string[]; options?: AnalysisOptions }

  // Configuration
  | { type: "UPDATE_AI_DIRECTOR_CONFIG"; config: Partial<AIDirectorConfig> }
  | { type: "UPDATE_MONTAGE_OPTIONS"; options: Partial<AnalysisOptions> }

  // System operations
  | { type: "CHECK_SYSTEM_STATUS" }
  | { type: "HEALTH_CHECK" }

  // Progress events (from Unified Orchestrator)
  | { type: "ANALYSIS_PROGRESS"; stage: string; progress: number; message: string }
  | { type: "ANALYSIS_COMPLETED"; videoPath: string; result: UnifiedContentAnalysis }
  | { type: "ANALYSIS_FAILED"; error: string }

  // Plan operations
  | { type: "OPTIMIZE_PLAN"; plan: MontagePlan; preferences?: Record<string, unknown> }
  | { type: "VALIDATE_PLAN"; plan: MontagePlan }
  | { type: "CALCULATE_PLAN_STATISTICS"; plan: MontagePlan }

  // State management
  | { type: "CLEAR_RESULTS" }
  | { type: "CLEAR_ERROR" }
  | { type: "CANCEL_ANALYSIS" }
  | { type: "RESET" }

// ============================================================================
// Actors (async operations)
// ============================================================================

/**
 * Comprehensive Video Analysis Actor
 * Использует Unified Orchestrator для анализа через AI Director + Montage Planner
 */
const analyzeVideoActor = fromPromise(
  async ({
    input,
  }: {
    input: {
      videoPath: string
      aiDirectorConfig?: AIDirectorConfig
      montageOptions?: AnalysisOptions
    }
  }) => {
    logger.info("Запуск comprehensive video analysis", { videoPath: input.videoPath })

    const result = await unifiedOrchestrator.analyzeComprehensive(input.videoPath, {
      aiDirectorConfig: input.aiDirectorConfig,
      montageOptions: input.montageOptions,
      skipMontageAnalysis: false,
    })

    logger.info("Comprehensive analysis завершен", {
      workflowId: result.workflowId,
      videoPath: input.videoPath,
    })

    return result
  },
)

/**
 * Batch Video Analysis Actor
 */
const analyzeBatchActor = fromPromise(
  async ({
    input,
  }: {
    input: {
      videoPaths: string[]
      aiDirectorConfig?: AIDirectorConfig
      montageOptions?: AnalysisOptions
    }
  }) => {
    logger.info("Запуск batch analysis", { count: input.videoPaths.length })

    const result = await unifiedOrchestrator.analyzeBatch(input.videoPaths, {
      aiDirectorConfig: input.aiDirectorConfig,
      montageOptions: input.montageOptions,
      skipMontageAnalysis: false,
    })

    logger.info("Batch analysis завершен", {
      batchId: result.batchId,
      count: input.videoPaths.length,
    })

    return result
  },
)

/**
 * Montage Plan Generation Actor
 */
const generateMontagePlanActor = fromPromise(
  async ({
    input,
  }: {
    input: {
      videoIds: string[]
      options: AnalysisOptions
    }
  }) => {
    logger.info("Генерация montage plan", { videoCount: input.videoIds.length })

    const result = await unifiedOrchestrator.generateMontagePlan(input.videoIds, input.options)

    logger.info("Montage plan сгенерирован", { resultsCount: result.analysisResults.length })

    return result
  },
)

/**
 * System Status Check Actor
 */
const checkSystemStatusActor = fromPromise(async () => {
  logger.info("Проверка системного статуса")

  const status = await aiDirectorService.getSystemStatus()

  logger.info("Системный статус получен", { status: status.health.overall_status })

  return status
})

/**
 * Health Check Actor
 */
const healthCheckActor = fromPromise(async () => {
  logger.info("Health check")

  const health = await unifiedOrchestrator.healthCheck()

  logger.info("Health check завершен", { isHealthy: health.isHealthy })

  return health
})

// ============================================================================
// Default Context
// ============================================================================

const createDefaultContext = (): AIIntelligenceContext => ({
  mediaFiles: [],
  currentVideoPath: null,
  aiDirectorConfig: null,
  montageOptions: null,
  comprehensiveResults: new Map(),
  montageResults: new Map(),
  unifiedAnalyses: new Map(),
  currentMontageplan: null,
  currentWorkflowId: null,
  currentBatchId: null,
  progress: {
    stage: "idle",
    progress: 0,
    message: "Готов к анализу",
  },
  isAnalyzing: false,
  isBatchAnalyzing: false,
  isGeneratingPlan: false,
  error: null,
  warnings: [],
  systemAvailable: false,
  capabilities: null,
})

// ============================================================================
// State Machine Definition
// ============================================================================

export const aiIntelligenceMachine = setup({
  types: {
    context: {} as AIIntelligenceContext,
    events: {} as AIIntelligenceEvent,
  },
  actors: {
    analyzeVideoActor,
    analyzeBatchActor,
    generateMontagePlanActor,
    checkSystemStatusActor,
    healthCheckActor,
  },
}).createMachine({
  id: "aiIntelligenceV2",
  initial: "idle",
  context: createDefaultContext(),

  states: {
    // ========================================
    // Idle - готов к работе
    // ========================================
    idle: {
      on: {
        ANALYZE_VIDEO: {
          target: "analyzingVideo",
          actions: assign({
            currentVideoPath: ({ event }) => event?.videoPath || "",
            error: null,
            isAnalyzing: true,
            progress: {
              stage: "initialization",
              progress: 0,
              message: "Подготовка к анализу...",
            },
          }),
        },
        ANALYZE_BATCH: {
          target: "analyzingBatch",
          actions: assign(({ event }) => {
            const videoPaths = "videoPaths" in event ? event.videoPaths : []
            return {
              mediaFiles: videoPaths,
              error: null,
              isBatchAnalyzing: true,
              progress: {
                stage: "initialization",
                progress: 0,
                message: `Подготовка batch анализа (${videoPaths.length} файлов)...`,
              },
            }
          }),
        },
        GENERATE_MONTAGE_PLAN: {
          target: "generatingPlan",
          actions: assign({
            mediaFiles: ({ event }) => event?.videoIds || [],
            error: null,
            isGeneratingPlan: true,
            progress: {
              stage: "initialization",
              progress: 0,
              message: "Подготовка к генерации плана монтажа...",
            },
          }),
        },
        CHECK_SYSTEM_STATUS: {
          target: "checkingSystem",
        },
        HEALTH_CHECK: {
          target: "healthChecking",
        },
        UPDATE_AI_DIRECTOR_CONFIG: {
          actions: assign({
            aiDirectorConfig: ({ context, event }) =>
              ({
                ...(context.aiDirectorConfig || {}),
                ...event.config,
              }) as AIDirectorConfig,
          }),
        },
        UPDATE_MONTAGE_OPTIONS: {
          actions: assign({
            montageOptions: ({ context, event }) =>
              ({
                ...(context.montageOptions || {}),
                ...event.options,
              }) as AnalysisOptions,
          }),
        },
        CLEAR_RESULTS: {
          actions: assign({
            comprehensiveResults: new Map(),
            montageResults: new Map(),
            unifiedAnalyses: new Map(),
            currentMontageplan: null,
            currentWorkflowId: null,
            currentBatchId: null,
          }),
        },
        RESET: {
          actions: assign(createDefaultContext()),
        },
      },
    },

    // ========================================
    // Analyzing Single Video
    // ========================================
    analyzingVideo: {
      invoke: {
        id: "analyzeVideo",
        src: "analyzeVideoActor",
        input: ({ context }) => ({
          videoPath: context.currentVideoPath!,
          aiDirectorConfig: context.aiDirectorConfig || undefined,
          montageOptions: context.montageOptions || undefined,
        }),
        onDone: {
          target: "idle",
          actions: [
            assign({
              currentWorkflowId: ({ event }) => event.output.workflowId,
              comprehensiveResults: ({ context, event }) => {
                const newMap = new Map(context.comprehensiveResults)
                newMap.set(context.currentVideoPath!, event.output.comprehensive)
                return newMap
              },
              montageResults: ({ context, event }) => {
                if (!event.output.montage) return context.montageResults
                const newMap = new Map(context.montageResults)
                newMap.set(context.currentVideoPath!, event.output.montage)
                return newMap
              },
              unifiedAnalyses: ({ context, event }) => {
                const newMap = new Map(context.unifiedAnalyses)
                newMap.set(context.currentVideoPath!, event.output.unified)
                return newMap
              },
              isAnalyzing: false,
              progress: {
                stage: "complete",
                progress: 100,
                message: "Анализ завершен",
              },
            }),
            emit(({ context, event }) => ({
              type: "ANALYSIS_COMPLETED",
              videoPath: context.currentVideoPath!,
              result: event.output.unified,
            })),
          ],
        },
        onError: {
          target: "idle",
          actions: assign({
            error: ({ event }) => (event.error instanceof Error ? event.error.message : String(event.error)),
            isAnalyzing: false,
            progress: {
              stage: "idle",
              progress: 0,
              message: "Ошибка анализа",
            },
          }),
        },
      },
      on: {
        ANALYSIS_PROGRESS: {
          actions: assign({
            progress: ({ event }) => ({
              stage: event.stage,
              progress: event.progress,
              message: event.message,
            }),
          }),
        },
        CANCEL_ANALYSIS: {
          target: "idle",
          actions: assign({
            isAnalyzing: false,
            progress: {
              stage: "idle",
              progress: 0,
              message: "Анализ отменен",
            },
          }),
        },
      },
    },

    // ========================================
    // Analyzing Batch
    // ========================================
    analyzingBatch: {
      invoke: {
        id: "analyzeBatch",
        src: "analyzeBatchActor",
        input: ({ context }) => ({
          videoPaths: context.mediaFiles,
          aiDirectorConfig: context.aiDirectorConfig || undefined,
          montageOptions: context.montageOptions || undefined,
        }),
        onDone: {
          target: "idle",
          actions: [
            assign({
              currentBatchId: ({ event }) => event.output.batchId,
              comprehensiveResults: ({ event }) => {
                const newMap = new Map()
                event.output.results.forEach((r: any) => {
                  if (r.success && r.comprehensive) {
                    newMap.set(r.videoPath, r.comprehensive)
                  }
                })
                return newMap
              },
              unifiedAnalyses: ({ event }) => {
                const newMap = new Map()
                event.output.results.forEach((r: any) => {
                  if (r.success && r.unified) {
                    newMap.set(r.videoPath, r.unified)
                  }
                })
                return newMap
              },
              isBatchAnalyzing: false,
              progress: {
                stage: "complete",
                progress: 100,
                message: "Batch анализ завершен",
              },
            }),
          ],
        },
        onError: {
          target: "idle",
          actions: assign({
            error: ({ event }) => (event.error instanceof Error ? event.error.message : String(event.error)),
            isBatchAnalyzing: false,
            progress: {
              stage: "idle",
              progress: 0,
              message: "Ошибка batch анализа",
            },
          }),
        },
      },
      on: {
        ANALYSIS_PROGRESS: {
          actions: assign({
            progress: ({ event }) => ({
              stage: event.stage,
              progress: event.progress,
              message: event.message,
            }),
          }),
        },
        CANCEL_ANALYSIS: {
          target: "idle",
          actions: assign({
            isBatchAnalyzing: false,
            progress: {
              stage: "idle",
              progress: 0,
              message: "Batch анализ отменен",
            },
          }),
        },
      },
    },

    // ========================================
    // Generating Montage Plan
    // ========================================
    generatingPlan: {
      invoke: {
        id: "generateMontagePlan",
        src: "generateMontagePlanActor",
        input: ({ context }) => ({
          videoIds: context.mediaFiles,
          options: context.montageOptions || {
            enable_object_detection: true,
            enable_face_detection: true,
            enable_emotion_analysis: true,
            enable_composition_analysis: true,
            enable_audio_analysis: true,
            frame_sample_rate: 1.0,
            quality_threshold: 50.0,
            max_moments: 50,
            frame_sampling_rate: 1.0,
          },
        }),
        onDone: {
          target: "idle",
          actions: [
            assign({
              montageResults: ({ event }) => {
                const newMap = new Map()
                event.output.analysisResults.forEach((result: MontageAnalysisResult) => {
                  newMap.set(result.video_id, result)
                })
                return newMap
              },
              currentMontageplan: ({ event }) => event.output.plan || null,
              isGeneratingPlan: false,
              progress: {
                stage: "complete",
                progress: 100,
                message: "План монтажа сгенерирован",
              },
            }),
          ],
        },
        onError: {
          target: "idle",
          actions: assign({
            error: ({ event }) => (event.error instanceof Error ? event.error.message : String(event.error)),
            isGeneratingPlan: false,
            progress: {
              stage: "idle",
              progress: 0,
              message: "Ошибка генерации плана",
            },
          }),
        },
      },
      on: {
        CANCEL_ANALYSIS: {
          target: "idle",
          actions: assign({
            isGeneratingPlan: false,
            progress: {
              stage: "idle",
              progress: 0,
              message: "Генерация плана отменена",
            },
          }),
        },
      },
    },

    // ========================================
    // Checking System Status
    // ========================================
    checkingSystem: {
      invoke: {
        id: "checkSystemStatus",
        src: "checkSystemStatusActor",
        onDone: {
          target: "idle",
          actions: assign({
            systemAvailable: true,
            capabilities: ({ event }) => event.output.capabilities,
          }),
        },
        onError: {
          target: "idle",
          actions: assign({
            systemAvailable: false,
            error: ({ event }) => (event.error instanceof Error ? event.error.message : String(event.error)),
          }),
        },
      },
    },

    // ========================================
    // Health Checking
    // ========================================
    healthChecking: {
      invoke: {
        id: "healthCheck",
        src: "healthCheckActor",
        onDone: {
          target: "idle",
          actions: assign({
            systemAvailable: ({ event }) => event.output.isHealthy,
          }),
        },
        onError: {
          target: "idle",
          actions: assign({
            systemAvailable: false,
            error: ({ event }) => (event.error instanceof Error ? event.error.message : String(event.error)),
          }),
        },
      },
    },
  },

  on: {
    CLEAR_ERROR: {
      actions: assign({
        error: null,
      }),
    },
  },
})

// ============================================================================
// Type Exports
// ============================================================================

export type AIIntelligenceMachine = typeof aiIntelligenceMachine
export type AIIntelligenceSnapshot = ReturnType<AIIntelligenceMachine["getInitialSnapshot"]>
