/**
 * React Hook for Analysis Storage
 *
 * Предоставляет удобный интерфейс для работы с хранилищем AI анализов
 */

import { useCallback, useEffect, useState } from "react"
import type { ComprehensiveAnalysisResult } from "@/features/ai-director/types/ai-director"
import { createLogger } from "@/lib/tauri-logger"
import type { MontageAnalysisResult } from "@/types/montage-planner-rust"
import type { UnifiedContentAnalysis } from "../mappers/ai-director-mapper"
import {
  type AnalysisMetadata,
  analysisStorageService,
  type SaveAnalysisOptions,
  type StorageResult,
} from "../services/analysis-storage-service"

const logger = createLogger({ module: "UseAnalysisStorage" })

// ============================================================================
// Hook Options
// ============================================================================

export interface UseAnalysisStorageOptions {
  /** Автоматически загружать анализ при монтировании */
  autoLoad?: boolean
  /** Путь к видео для автозагрузки */
  videoPath?: string
  /** Включить логирование */
  debug?: boolean
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseAnalysisStorageReturn {
  // State
  /** Comprehensive analysis для текущего видео */
  comprehensiveAnalysis: ComprehensiveAnalysisResult | null
  /** Montage analysis для текущего видео */
  montageAnalysis: MontageAnalysisResult | null
  /** Unified analysis для текущего видео */
  unifiedAnalysis: UnifiedContentAnalysis | null
  /** Метаданные анализа */
  metadata: AnalysisMetadata | null
  /** Идет загрузка */
  isLoading: boolean
  /** Ошибка */
  error: string | null

  // Methods - Comprehensive Analysis
  /** Сохранить comprehensive analysis */
  saveComprehensive: (
    videoPath: string,
    result: ComprehensiveAnalysisResult,
    options?: SaveAnalysisOptions,
  ) => Promise<StorageResult<string>>
  /** Загрузить comprehensive analysis */
  loadComprehensive: (videoPath: string) => Promise<StorageResult<ComprehensiveAnalysisResult>>
  /** Удалить comprehensive analysis */
  deleteComprehensive: (videoPath: string) => Promise<StorageResult>

  // Methods - Montage Analysis
  /** Сохранить montage analysis */
  saveMontage: (
    videoPath: string,
    result: MontageAnalysisResult,
    options?: SaveAnalysisOptions,
  ) => Promise<StorageResult<string>>
  /** Загрузить montage analysis */
  loadMontage: (videoPath: string) => Promise<StorageResult<MontageAnalysisResult>>

  // Methods - Unified Analysis
  /** Сохранить unified analysis */
  saveUnified: (videoPath: string, analysis: UnifiedContentAnalysis) => Promise<StorageResult>
  /** Загрузить unified analysis */
  loadUnified: (videoPath: string) => Promise<StorageResult<UnifiedContentAnalysis>>

  // Utility Methods
  /** Проверить наличие анализа */
  hasAnalysis: (videoPath: string) => Promise<boolean>
  /** Получить список проанализированных видео */
  getAnalyzedVideos: () => Promise<string[]>
  /** Очистить все анализы */
  clearAll: () => Promise<StorageResult>
  /** Получить статистику хранилища */
  getStats: () => Promise<{
    comprehensiveCount: number
    montageCount: number
    unifiedCount: number
    totalSize: number
  }>
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook для работы с хранилищем AI анализов
 *
 * @example
 * ```tsx
 * function AnalysisViewer({ videoPath }: { videoPath: string }) {
 *   const {
 *     comprehensiveAnalysis,
 *     isLoading,
 *     loadComprehensive,
 *     saveComprehensive,
 *   } = useAnalysisStorage({ videoPath, autoLoad: true })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!comprehensiveAnalysis) return <div>No analysis found</div>
 *
 *   return <div>Analysis: {comprehensiveAnalysis.analysis_id}</div>
 * }
 * ```
 */
export function useAnalysisStorage(options: UseAnalysisStorageOptions = {}): UseAnalysisStorageReturn {
  const { autoLoad = false, videoPath, debug = false } = options

  // State
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<ComprehensiveAnalysisResult | null>(null)
  const [montageAnalysis, setMontageAnalysis] = useState<MontageAnalysisResult | null>(null)
  const [unifiedAnalysis, setUnifiedAnalysis] = useState<UnifiedContentAnalysis | null>(null)
  const [metadata, setMetadata] = useState<AnalysisMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ============================================================================
  // Comprehensive Analysis Methods
  // ============================================================================

  const saveComprehensive = useCallback(
    async (
      videoPath: string,
      result: ComprehensiveAnalysisResult,
      options?: SaveAnalysisOptions,
    ): Promise<StorageResult<string>> => {
      setIsLoading(true)
      setError(null)

      try {
        const storageResult = await analysisStorageService.saveComprehensiveAnalysis(videoPath, result, options)

        if (storageResult.success) {
          setComprehensiveAnalysis(result)
          if (debug) {
            logger.debug("Comprehensive analysis saved", { videoPath, analysisId: result.analysis_id })
          }
        } else {
          setError(storageResult.error || "Failed to save analysis")
        }

        return storageResult
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [debug],
  )

  const loadComprehensive = useCallback(
    async (videoPath: string): Promise<StorageResult<ComprehensiveAnalysisResult>> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await analysisStorageService.loadComprehensiveAnalysis(videoPath)

        if (result.success && result.data) {
          setComprehensiveAnalysis(result.data)

          // Загружаем метаданные
          const meta = await analysisStorageService.loadAnalysisMetadata(result.data.analysis_id)
          setMetadata(meta)

          if (debug) {
            logger.debug("Comprehensive analysis loaded", { videoPath, analysisId: result.data.analysis_id })
          }
        } else {
          setError(result.error || "Failed to load analysis")
          setComprehensiveAnalysis(null)
          setMetadata(null)
        }

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [debug],
  )

  const deleteComprehensive = useCallback(
    async (videoPath: string): Promise<StorageResult> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await analysisStorageService.deleteComprehensiveAnalysis(videoPath)

        if (result.success) {
          setComprehensiveAnalysis(null)
          setMetadata(null)
          if (debug) {
            logger.debug("Comprehensive analysis deleted", { videoPath })
          }
        } else {
          setError(result.error || "Failed to delete analysis")
        }

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [debug],
  )

  // ============================================================================
  // Montage Analysis Methods
  // ============================================================================

  const saveMontage = useCallback(
    async (
      videoPath: string,
      result: MontageAnalysisResult,
      options?: SaveAnalysisOptions,
    ): Promise<StorageResult<string>> => {
      setIsLoading(true)
      setError(null)

      try {
        const storageResult = await analysisStorageService.saveMontageAnalysis(videoPath, result, options)

        if (storageResult.success) {
          setMontageAnalysis(result)
          if (debug) {
            logger.debug("Montage analysis saved", { videoPath })
          }
        } else {
          setError(storageResult.error || "Failed to save montage analysis")
        }

        return storageResult
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [debug],
  )

  const loadMontage = useCallback(
    async (videoPath: string): Promise<StorageResult<MontageAnalysisResult>> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await analysisStorageService.loadMontageAnalysis(videoPath)

        if (result.success && result.data) {
          setMontageAnalysis(result.data)
          if (debug) {
            logger.debug("Montage analysis loaded", { videoPath })
          }
        } else {
          setError(result.error || "Failed to load montage analysis")
          setMontageAnalysis(null)
        }

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [debug],
  )

  // ============================================================================
  // Unified Analysis Methods
  // ============================================================================

  const saveUnified = useCallback(
    async (videoPath: string, analysis: UnifiedContentAnalysis): Promise<StorageResult> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await analysisStorageService.saveUnifiedAnalysis(videoPath, analysis)

        if (result.success) {
          setUnifiedAnalysis(analysis)
          if (debug) {
            logger.debug("Unified analysis saved", { videoPath })
          }
        } else {
          setError(result.error || "Failed to save unified analysis")
        }

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [debug],
  )

  const loadUnified = useCallback(
    async (videoPath: string): Promise<StorageResult<UnifiedContentAnalysis>> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await analysisStorageService.loadUnifiedAnalysis(videoPath)

        if (result.success && result.data) {
          setUnifiedAnalysis(result.data)
          if (debug) {
            logger.debug("Unified analysis loaded", { videoPath })
          }
        } else {
          setError(result.error || "Failed to load unified analysis")
          setUnifiedAnalysis(null)
        }

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [debug],
  )

  // ============================================================================
  // Utility Methods
  // ============================================================================

  const hasAnalysis = useCallback(async (videoPath: string): Promise<boolean> => {
    return analysisStorageService.hasAnalysis(videoPath)
  }, [])

  const getAnalyzedVideos = useCallback(async (): Promise<string[]> => {
    return analysisStorageService.getAnalyzedVideos()
  }, [])

  const clearAll = useCallback(async (): Promise<StorageResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await analysisStorageService.clearAll()

      if (result.success) {
        setComprehensiveAnalysis(null)
        setMontageAnalysis(null)
        setUnifiedAnalysis(null)
        setMetadata(null)
        if (debug) {
          logger.debug("All analyses cleared")
        }
      } else {
        setError(result.error || "Failed to clear analyses")
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [debug])

  const getStats = useCallback(async () => {
    return analysisStorageService.getStorageStats()
  }, [])

  // ============================================================================
  // Auto-load Effect
  // ============================================================================

  useEffect(() => {
    if (autoLoad && videoPath) {
      Promise.all([loadComprehensive(videoPath), loadMontage(videoPath), loadUnified(videoPath)]).catch((error) => {
        logger.error("Failed to auto-load analyses", { videoPath, error })
      })
    }
  }, [autoLoad, videoPath, loadComprehensive, loadMontage, loadUnified])

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    comprehensiveAnalysis,
    montageAnalysis,
    unifiedAnalysis,
    metadata,
    isLoading,
    error,

    // Methods - Comprehensive
    saveComprehensive,
    loadComprehensive,
    deleteComprehensive,

    // Methods - Montage
    saveMontage,
    loadMontage,

    // Methods - Unified
    saveUnified,
    loadUnified,

    // Utility
    hasAnalysis,
    getAnalyzedVideos,
    clearAll,
    getStats,
  }
}
