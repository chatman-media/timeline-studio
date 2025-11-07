/**
 * Unified Analysis Hook
 *
 * React hook для работы с Unified Orchestrator - координатор AI Director + Montage Planner
 * Предоставляет высокоуровневый API для запуска comprehensive analysis workflow
 */

import { useCallback, useEffect, useState } from "react"
import type { AIDirectorConfig } from "@/types/generated/tauri-bindings"
import { createLogger } from "@/lib/tauri-logger"
import type {
  AnalysisOptions,
  MontageAnalysisResult,
  MontagePlan,
  PlanStatistics,
  PlanValidation,
} from "@/types/montage-planner-rust"
import type { UnifiedContentAnalysis } from "../mappers/ai-director-mapper"
import type { AnalysisWorkflow, BatchAnalysisWorkflow } from "../services/unified-orchestrator"
import { unifiedOrchestrator } from "../services/unified-orchestrator"

const logger = createLogger({ module: "useUnifiedAnalysis" })

// ============================================================================
// Types
// ============================================================================

export interface UnifiedAnalysisState {
  // Current workflow
  currentWorkflow: AnalysisWorkflow | null
  currentBatch: BatchAnalysisWorkflow | null

  // Analysis results
  latestResult: UnifiedContentAnalysis | null
  latestMontageResult: MontageAnalysisResult | null

  // Status
  isAnalyzing: boolean
  isBatchAnalyzing: boolean
  isGeneratingPlan: boolean

  // Progress
  progress: number // 0-100
  currentStage: string | null

  // Error
  error: string | null

  // Active workflows count
  activeWorkflowsCount: number
  activeBatchesCount: number
}

export interface UnifiedAnalysisHook {
  // State
  state: UnifiedAnalysisState

  // Comprehensive Analysis
  analyzeComprehensive: (
    videoPath: string,
    config?: {
      aiDirectorConfig?: AIDirectorConfig
      montageOptions?: AnalysisOptions
      skipMontageAnalysis?: boolean
    },
  ) => Promise<{
    workflowId: string
    unified: UnifiedContentAnalysis
  }>

  // Batch Analysis
  analyzeBatch: (
    videoPaths: string[],
    config?: {
      aiDirectorConfig?: AIDirectorConfig
      montageOptions?: AnalysisOptions
      skipMontageAnalysis?: boolean
    },
  ) => Promise<{
    batchId: string
    results: Array<{
      videoPath: string
      success: boolean
      unified?: UnifiedContentAnalysis
      error?: string
    }>
  }>

  // Montage Planning
  generateMontagePlan: (
    videoIds: string[],
    options: AnalysisOptions,
  ) => Promise<{
    analysisResults: MontageAnalysisResult[]
    plan?: MontagePlan
  }>

  optimizeMontagePlan: (plan: MontagePlan, preferences?: Record<string, unknown>) => Promise<MontagePlan>

  validateMontagePlan: (plan: MontagePlan) => Promise<PlanValidation>

  calculatePlanStatistics: (plan: MontagePlan) => Promise<PlanStatistics>

  // Workflow Management
  getWorkflow: (workflowId: string) => AnalysisWorkflow | undefined
  getBatch: (batchId: string) => BatchAnalysisWorkflow | undefined
  cancelWorkflow: (workflowId: string) => boolean
  clearCompletedWorkflows: () => number

  // System Status
  getSystemStatus: () => Promise<any>
  healthCheck: () => Promise<any>

  // State Management
  clearError: () => void
  clearResults: () => void
  reset: () => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useUnifiedAnalysis(): UnifiedAnalysisHook {
  const [state, setState] = useState<UnifiedAnalysisState>({
    currentWorkflow: null,
    currentBatch: null,
    latestResult: null,
    latestMontageResult: null,
    isAnalyzing: false,
    isBatchAnalyzing: false,
    isGeneratingPlan: false,
    progress: 0,
    currentStage: null,
    error: null,
    activeWorkflowsCount: 0,
    activeBatchesCount: 0,
  })

  // Update active workflows count periodically
  useEffect(() => {
    const updateCounts = () => {
      const workflows = unifiedOrchestrator.getActiveWorkflows()
      const batches = unifiedOrchestrator.getActiveBatches()
      setState((prev) => ({
        ...prev,
        activeWorkflowsCount: workflows.length,
        activeBatchesCount: batches.length,
      }))
    }

    // Update immediately
    updateCounts()

    // Update every 2 seconds
    const interval = setInterval(updateCounts, 2000)

    return () => clearInterval(interval)
  }, [])

  // ============================================================================
  // Comprehensive Analysis
  // ============================================================================

  const analyzeComprehensive = useCallback(
    async (
      videoPath: string,
      config?: {
        aiDirectorConfig?: AIDirectorConfig
        montageOptions?: AnalysisOptions
        skipMontageAnalysis?: boolean
      },
    ): Promise<{
      workflowId: string
      unified: UnifiedContentAnalysis
    }> => {
      logger.info("Запуск comprehensive analysis", { videoPath, config })

      setState((prev) => ({
        ...prev,
        isAnalyzing: true,
        progress: 0,
        currentStage: "initialization",
        error: null,
      }))

      try {
        const result = await unifiedOrchestrator.analyzeComprehensive(videoPath, config)

        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          progress: 100,
          currentStage: "completed",
          currentWorkflow: unifiedOrchestrator.getWorkflow(result.workflowId) || null,
          latestResult: result.unified,
          latestMontageResult: result.montage || null,
        }))

        logger.info("Comprehensive analysis завершен", { workflowId: result.workflowId })

        return {
          workflowId: result.workflowId,
          unified: result.unified,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: errorMessage,
        }))
        logger.error("Comprehensive analysis ошибка", { error })
        throw error
      }
    },
    [],
  )

  // ============================================================================
  // Batch Analysis
  // ============================================================================

  const analyzeBatch = useCallback(
    async (
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
        success: boolean
        unified?: UnifiedContentAnalysis
        error?: string
      }>
    }> => {
      logger.info("Запуск batch analysis", { count: videoPaths.length })

      setState((prev) => ({
        ...prev,
        isBatchAnalyzing: true,
        progress: 0,
        currentStage: "batch_processing",
        error: null,
      }))

      try {
        const result = await unifiedOrchestrator.analyzeBatch(videoPaths, config)

        setState((prev) => ({
          ...prev,
          isBatchAnalyzing: false,
          progress: 100,
          currentStage: "completed",
          currentBatch: unifiedOrchestrator.getBatch(result.batchId) || null,
        }))

        logger.info("Batch analysis завершен", { batchId: result.batchId })

        return {
          batchId: result.batchId,
          results: result.results.map((r) => ({
            videoPath: r.videoPath,
            success: r.success,
            unified: r.unified,
            error: r.error,
          })),
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        setState((prev) => ({
          ...prev,
          isBatchAnalyzing: false,
          error: errorMessage,
        }))
        logger.error("Batch analysis ошибка", { error })
        throw error
      }
    },
    [],
  )

  // ============================================================================
  // Montage Planning
  // ============================================================================

  const generateMontagePlan = useCallback(
    async (
      videoIds: string[],
      options: AnalysisOptions,
    ): Promise<{
      analysisResults: MontageAnalysisResult[]
      plan?: MontagePlan
    }> => {
      logger.info("Генерация montage plan", { videoCount: videoIds.length })

      setState((prev) => ({
        ...prev,
        isGeneratingPlan: true,
        error: null,
      }))

      try {
        const result = await unifiedOrchestrator.generateMontagePlan(videoIds, options)

        setState((prev) => ({
          ...prev,
          isGeneratingPlan: false,
        }))

        logger.info("Montage plan сгенерирован", { resultsCount: result.analysisResults.length })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        setState((prev) => ({
          ...prev,
          isGeneratingPlan: false,
          error: errorMessage,
        }))
        logger.error("Ошибка генерации montage plan", { error })
        throw error
      }
    },
    [],
  )

  const optimizeMontagePlan = useCallback(
    async (plan: MontagePlan, preferences?: Record<string, unknown>): Promise<MontagePlan> => {
      logger.info("Оптимизация montage plan", { planId: plan.id })

      try {
        const optimized = await unifiedOrchestrator.optimizeMontagePlan(plan, preferences)
        logger.info("Montage plan оптимизирован", { planId: optimized.id })
        return optimized
      } catch (error) {
        logger.error("Ошибка оптимизации montage plan", { error })
        throw error
      }
    },
    [],
  )

  const validateMontagePlan = useCallback(async (plan: MontagePlan): Promise<PlanValidation> => {
    logger.info("Валидация montage plan", { planId: plan.id })

    try {
      const validation = await unifiedOrchestrator.validateMontagePlan(plan)
      logger.info("Montage plan валидирован", {
        planId: plan.id,
        isValid: validation.is_valid,
      })
      return validation
    } catch (error) {
      logger.error("Ошибка валидации montage plan", { error })
      throw error
    }
  }, [])

  const calculatePlanStatistics = useCallback(async (plan: MontagePlan): Promise<PlanStatistics> => {
    logger.info("Расчет статистики montage plan", { planId: plan.id })

    try {
      const statistics = await unifiedOrchestrator.calculatePlanStatistics(plan)
      logger.info("Статистика montage plan рассчитана", { planId: plan.id })
      return statistics
    } catch (error) {
      logger.error("Ошибка расчета статистики montage plan", { error })
      throw error
    }
  }, [])

  // ============================================================================
  // Workflow Management
  // ============================================================================

  const getWorkflow = useCallback((workflowId: string): AnalysisWorkflow | undefined => {
    return unifiedOrchestrator.getWorkflow(workflowId)
  }, [])

  const getBatch = useCallback((batchId: string): BatchAnalysisWorkflow | undefined => {
    return unifiedOrchestrator.getBatch(batchId)
  }, [])

  const cancelWorkflow = useCallback((workflowId: string): boolean => {
    logger.info("Отмена workflow", { workflowId })
    return unifiedOrchestrator.cancelWorkflow(workflowId)
  }, [])

  const clearCompletedWorkflows = useCallback((): number => {
    const count = unifiedOrchestrator.cleanupCompletedWorkflows()
    logger.info("Очищены завершенные workflows", { count })
    setState((prev) => ({
      ...prev,
      activeWorkflowsCount: unifiedOrchestrator.getActiveWorkflows().length,
    }))
    return count
  }, [])

  // ============================================================================
  // System Status
  // ============================================================================

  const getSystemStatus = useCallback(async () => {
    logger.info("Получение системного статуса")
    return await unifiedOrchestrator.getSystemStatus()
  }, [])

  const healthCheck = useCallback(async () => {
    logger.info("Health check")
    return await unifiedOrchestrator.healthCheck()
  }, [])

  // ============================================================================
  // State Management
  // ============================================================================

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  const clearResults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      latestResult: null,
      latestMontageResult: null,
      currentWorkflow: null,
      currentBatch: null,
    }))
  }, [])

  const reset = useCallback(() => {
    unifiedOrchestrator.cleanup()
    setState({
      currentWorkflow: null,
      currentBatch: null,
      latestResult: null,
      latestMontageResult: null,
      isAnalyzing: false,
      isBatchAnalyzing: false,
      isGeneratingPlan: false,
      progress: 0,
      currentStage: null,
      error: null,
      activeWorkflowsCount: 0,
      activeBatchesCount: 0,
    })
    logger.info("Unified analysis сброшен")
  }, [])

  return {
    state,
    analyzeComprehensive,
    analyzeBatch,
    generateMontagePlan,
    optimizeMontagePlan,
    validateMontagePlan,
    calculatePlanStatistics,
    getWorkflow,
    getBatch,
    cancelWorkflow,
    clearCompletedWorkflows,
    getSystemStatus,
    healthCheck,
    clearError,
    clearResults,
    reset,
  }
}
