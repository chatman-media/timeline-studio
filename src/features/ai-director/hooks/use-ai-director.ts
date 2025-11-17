/**
 * AI Director Hook
 * React hook для взаимодействия с AI Director (Rust backend)
 * Обеспечивает comprehensive analysis: audio, scene, vision, moment, content
 */

import { useCallback, useState } from "react"
import { logError, logInfo } from "@/lib/tauri-logger"

// AI Director types are not in tauri-bindings yet, using placeholder types
type AIDirectorConfig = any
type ComprehensiveAnalysisResult = any
type ConfigValidationResult = any
type HealthCheckResult = any
type SystemCapabilities = any

import * as TauriBindings from "@/types/generated/tauri-bindings"

// AI Director commands are not in bindings yet, create mock versions
const commands = {
  ...TauriBindings.commands,
  aiDirectorAnalyzeComprehensive: async (_path: string, _config: any): Promise<any> => ({
    status: "error" as const,
    error: "Not implemented",
  }),
  aiDirectorAnalyzeQuick: async (_path: string): Promise<any> => ({
    status: "error" as const,
    error: "Not implemented",
  }),
  aiDirectorAnalyzeBatch: async (_paths: string[], _config: any): Promise<any> => ({
    status: "error" as const,
    error: "Not implemented",
  }),
  aiDirectorGetDefaultConfig: async (_mode: string): Promise<any> => ({
    status: "error" as const,
    error: "Not implemented",
  }),
  aiDirectorValidateConfig: async (_config: any): Promise<any> => ({
    status: "error" as const,
    error: "Not implemented",
  }),
  aiDirectorGetCapabilities: async (): Promise<any> => ({ status: "error" as const, error: "Not implemented" }),
  aiDirectorHealthCheck: async (): Promise<any> => ({ status: "error" as const, error: "Not implemented" }),
}

export interface AIDirectorState {
  isAnalyzing: boolean
  analysisProgress: number // 0-100
  currentResult: ComprehensiveAnalysisResult | null
  error: string | null
  lastAnalyzedPath: string | null
}

export interface AIDirectorHook {
  // State
  state: AIDirectorState

  // Main analysis functions
  analyzeComprehensive: (videoPath: string, config?: AIDirectorConfig) => Promise<ComprehensiveAnalysisResult>
  analyzeQuick: (videoPath: string) => Promise<ComprehensiveAnalysisResult>
  analyzeBatch: (filePaths: string[], config?: AIDirectorConfig) => Promise<ComprehensiveAnalysisResult[]>

  // Configuration
  getDefaultConfig: (mode: "Fast" | "Balanced" | "Quality" | "Custom") => Promise<AIDirectorConfig>
  validateConfig: (config: AIDirectorConfig) => Promise<ConfigValidationResult>

  // System
  getCapabilities: () => Promise<SystemCapabilities>
  healthCheck: () => Promise<HealthCheckResult>

  // State management
  clearAnalysis: () => void
}

export function useAIDirector(): AIDirectorHook {
  logInfo("[useAIDirector] Инициализация AI Director хука")

  const [state, setState] = useState<AIDirectorState>({
    isAnalyzing: false,
    analysisProgress: 0,
    currentResult: null,
    error: null,
    lastAnalyzedPath: null,
  })

  // Comprehensive Analysis
  const analyzeComprehensive = useCallback(
    async (videoPath: string, config?: AIDirectorConfig): Promise<ComprehensiveAnalysisResult> => {
      logInfo("[useAIDirector] Запуск комплексного анализа", { videoPath, config } as Record<string, unknown>)
      setState((prev) => ({
        ...prev,
        isAnalyzing: true,
        analysisProgress: 0,
        error: null,
        lastAnalyzedPath: videoPath,
      }))

      try {
        const result = await commands.aiDirectorAnalyzeComprehensive(videoPath, config || null)

        if (result.status === "ok") {
          logInfo("[useAIDirector] Комплексный анализ завершен успешно", { videoPath } as Record<string, unknown>)
          setState((prev) => ({
            ...prev,
            isAnalyzing: false,
            analysisProgress: 100,
            currentResult: result.data,
          }))
          return result.data
        }
        throw new Error(result.error)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logError("[useAIDirector] Ошибка комплексного анализа", error as Record<string, unknown>)
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: errorMessage,
        }))
        throw error
      }
    },
    [],
  )

  // Quick Analysis
  const analyzeQuick = useCallback(async (videoPath: string): Promise<ComprehensiveAnalysisResult> => {
    logInfo("[useAIDirector] Запуск быстрого анализа", { videoPath } as Record<string, unknown>)
    setState((prev) => ({
      ...prev,
      isAnalyzing: true,
      analysisProgress: 0,
      error: null,
      lastAnalyzedPath: videoPath,
    }))

    try {
      const result = await commands.aiDirectorAnalyzeQuick(videoPath)

      if (result.status === "ok") {
        logInfo("[useAIDirector] Быстрый анализ завершен успешно", { videoPath } as Record<string, unknown>)
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          analysisProgress: 100,
          currentResult: result.data,
        }))
        return result.data
      }
      throw new Error(result.error)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logError("[useAIDirector] Ошибка быстрого анализа", error as Record<string, unknown>)
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
      }))
      throw error
    }
  }, [])

  // Batch Analysis
  const analyzeBatch = useCallback(
    async (filePaths: string[], config?: AIDirectorConfig): Promise<ComprehensiveAnalysisResult[]> => {
      logInfo("[useAIDirector] Запуск batch анализа", { filesCount: filePaths.length } as Record<string, unknown>)
      setState((prev) => ({
        ...prev,
        isAnalyzing: true,
        analysisProgress: 0,
        error: null,
      }))

      try {
        const result = await commands.aiDirectorAnalyzeBatch(filePaths, config || null)

        if (result.status === "ok") {
          logInfo("[useAIDirector] Batch анализ завершен успешно", { resultsCount: result.data.length } as Record<
            string,
            unknown
          >)
          setState((prev) => ({
            ...prev,
            isAnalyzing: false,
            analysisProgress: 100,
            // For batch, we store the last result
            currentResult: result.data[result.data.length - 1] || null,
          }))
          return result.data
        }
        throw new Error(result.error)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logError("[useAIDirector] Ошибка batch анализа", error as Record<string, unknown>)
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: errorMessage,
        }))
        throw error
      }
    },
    [],
  )

  // Get Default Config
  const getDefaultConfig = useCallback(
    async (mode: "Fast" | "Balanced" | "Quality" | "Custom"): Promise<AIDirectorConfig> => {
      const result = await commands.aiDirectorGetDefaultConfig(mode)
      if (result.status === "ok") {
        return result.data
      }
      throw new Error(result.error)
    },
    [],
  )

  // Validate Config
  const validateConfig = useCallback(async (config: AIDirectorConfig): Promise<ConfigValidationResult> => {
    const result = await commands.aiDirectorValidateConfig(config)
    if (result.status === "ok") {
      return result.data
    }
    throw new Error(result.error)
  }, [])

  // Get Capabilities
  const getCapabilities = useCallback(async (): Promise<SystemCapabilities> => {
    const result = await commands.aiDirectorGetCapabilities()
    if (result.status === "ok") {
      return result.data
    }
    throw new Error(result.error)
  }, [])

  // Health Check
  const healthCheck = useCallback(async (): Promise<HealthCheckResult> => {
    const result = await commands.aiDirectorHealthCheck()
    if (result.status === "ok") {
      return result.data
    }
    throw new Error(result.error)
  }, [])

  // Clear Analysis
  const clearAnalysis = useCallback(() => {
    setState({
      isAnalyzing: false,
      analysisProgress: 0,
      currentResult: null,
      error: null,
      lastAnalyzedPath: null,
    })
  }, [])

  return {
    state,
    analyzeComprehensive,
    analyzeQuick,
    analyzeBatch,
    getDefaultConfig,
    validateConfig,
    getCapabilities,
    healthCheck,
    clearAnalysis,
  }
}

// Re-export types for convenience
export type {
  AIDirectorConfig,
  ComprehensiveAnalysisResult,
  SystemCapabilities,
  ConfigValidationResult,
  HealthCheckResult,
}
