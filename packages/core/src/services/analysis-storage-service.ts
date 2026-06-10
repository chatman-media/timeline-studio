import { createLogger } from "@/lib/tauri-logger"
import type { ComprehensiveAnalysisResult } from "../types/ai-director"

const logger = createLogger({ module: "AnalysisStorageService" })

const STORAGE_KEYS = {
  COMPREHENSIVE_ANALYSES: "ai-director:comprehensive-analyses",
  MONTAGE_ANALYSES: "ai-director:montage-analyses",
  UNIFIED_ANALYSES: "ai-director:unified-analyses",
  ANALYSIS_METADATA: "ai-director:analysis-metadata",
} as const

export interface AnalysisMetadata {
  analysisId: string
  videoPath: string
  createdAt: number
  updatedAt: number
  workflowId?: string
  duration?: number
  success: boolean
  errors?: string[]
}

export interface SaveAnalysisOptions {
  overwrite?: boolean
  saveMetadata?: boolean
}

export interface StorageResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export class AnalysisStorageService {
  private static instance: AnalysisStorageService | null = null

  private constructor() {}

  static getInstance(): AnalysisStorageService {
    if (!AnalysisStorageService.instance) {
      AnalysisStorageService.instance = new AnalysisStorageService()
    }
    return AnalysisStorageService.instance
  }

  async saveComprehensiveAnalysis(
    videoPath: string,
    result: ComprehensiveAnalysisResult,
    options: SaveAnalysisOptions = {},
  ): Promise<StorageResult<string>> {
    try {
      const { overwrite = true, saveMetadata = true } = options
      const analyses = await this.loadComprehensiveAnalyses()

      if (analyses[videoPath] && !overwrite) {
        return {
          success: false,
          error: `Analysis for ${videoPath} already exists. Use overwrite: true to replace.`,
        }
      }

      analyses[videoPath] = result
      await this.saveToStorage(STORAGE_KEYS.COMPREHENSIVE_ANALYSES, analyses)

      if (saveMetadata) {
        await this.saveAnalysisMetadata({
          analysisId: result.analysis_id,
          videoPath,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          workflowId: result.analysis_id,
          duration: result.total_duration_ms,
          success: result.status === "completed",
          errors: result.errors.length > 0 ? result.errors : undefined,
        })
      }

      logger.info("Comprehensive analysis saved", { videoPath, analysisId: result.analysis_id })
      return { success: true, data: result.analysis_id }
    } catch (error) {
      logger.error("Failed to save comprehensive analysis", { videoPath, error })
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async loadComprehensiveAnalysis(videoPath: string): Promise<StorageResult<ComprehensiveAnalysisResult>> {
    try {
      const analyses = await this.loadComprehensiveAnalyses()
      const analysis = analyses[videoPath]

      if (!analysis) {
        return {
          success: false,
          error: `No comprehensive analysis found for ${videoPath}`,
        }
      }

      return { success: true, data: analysis }
    } catch (error) {
      logger.error("Failed to load comprehensive analysis", { videoPath, error })
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async loadComprehensiveAnalyses(): Promise<Record<string, ComprehensiveAnalysisResult>> {
    return this.loadFromStorage<Record<string, ComprehensiveAnalysisResult>>(STORAGE_KEYS.COMPREHENSIVE_ANALYSES, {})
  }

  async deleteComprehensiveAnalysis(videoPath: string): Promise<StorageResult> {
    try {
      const analyses = await this.loadComprehensiveAnalyses()
      const analysis = analyses[videoPath]

      if (!analysis) {
        return { success: false, error: `No analysis found for ${videoPath}` }
      }

      delete analyses[videoPath]
      await this.saveToStorage(STORAGE_KEYS.COMPREHENSIVE_ANALYSES, analyses)
      await this.deleteAnalysisMetadata(analysis.analysis_id)

      logger.info("Comprehensive analysis deleted", { videoPath })
      return { success: true }
    } catch (error) {
      logger.error("Failed to delete comprehensive analysis", { videoPath, error })
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async saveMontageAnalysis(
    videoPath: string,
    result: unknown,
    options: SaveAnalysisOptions = {},
  ): Promise<StorageResult<string>> {
    try {
      const { overwrite = true } = options
      const analyses = await this.loadMontageAnalyses()

      if (analyses[videoPath] && !overwrite) {
        return {
          success: false,
          error: `Montage analysis for ${videoPath} already exists.`,
        }
      }

      analyses[videoPath] = result
      await this.saveToStorage(STORAGE_KEYS.MONTAGE_ANALYSES, analyses)

      logger.info("Montage analysis saved", { videoPath })
      return { success: true, data: videoPath }
    } catch (error) {
      logger.error("Failed to save montage analysis", { videoPath, error })
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async loadMontageAnalysis(videoPath: string): Promise<StorageResult<unknown>> {
    try {
      const analyses = await this.loadMontageAnalyses()
      const analysis = analyses[videoPath]

      if (!analysis) {
        return {
          success: false,
          error: `No montage analysis found for ${videoPath}`,
        }
      }

      return { success: true, data: analysis }
    } catch (error) {
      logger.error("Failed to load montage analysis", { videoPath, error })
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async loadMontageAnalyses(): Promise<Record<string, unknown>> {
    return this.loadFromStorage<Record<string, unknown>>(STORAGE_KEYS.MONTAGE_ANALYSES, {})
  }

  async saveUnifiedAnalysis(videoPath: string, analysis: unknown): Promise<StorageResult> {
    try {
      const analyses = await this.loadUnifiedAnalyses()
      analyses[videoPath] = analysis
      await this.saveToStorage(STORAGE_KEYS.UNIFIED_ANALYSES, analyses)

      logger.info("Unified analysis saved", { videoPath })
      return { success: true }
    } catch (error) {
      logger.error("Failed to save unified analysis", { videoPath, error })
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async loadUnifiedAnalysis(videoPath: string): Promise<StorageResult<unknown>> {
    try {
      const analyses = await this.loadUnifiedAnalyses()
      const analysis = analyses[videoPath]

      if (!analysis) {
        return {
          success: false,
          error: `No unified analysis found for ${videoPath}`,
        }
      }

      return { success: true, data: analysis }
    } catch (error) {
      logger.error("Failed to load unified analysis", { videoPath, error })
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async loadUnifiedAnalyses(): Promise<Record<string, unknown>> {
    return this.loadFromStorage<Record<string, unknown>>(STORAGE_KEYS.UNIFIED_ANALYSES, {})
  }

  async loadAnalysisMetadata(analysisId: string): Promise<AnalysisMetadata | null> {
    const allMetadata = await this.loadAllMetadata()
    return allMetadata[analysisId] || null
  }

  async loadAllMetadata(): Promise<Record<string, AnalysisMetadata>> {
    return this.loadFromStorage<Record<string, AnalysisMetadata>>(STORAGE_KEYS.ANALYSIS_METADATA, {})
  }

  async hasAnalysis(videoPath: string): Promise<boolean> {
    const comprehensive = await this.loadComprehensiveAnalyses()
    return videoPath in comprehensive
  }

  async getAnalyzedVideos(): Promise<string[]> {
    const analyses = await this.loadComprehensiveAnalyses()
    return Object.keys(analyses)
  }

  async clearAll(): Promise<StorageResult> {
    try {
      await this.saveToStorage(STORAGE_KEYS.COMPREHENSIVE_ANALYSES, {})
      await this.saveToStorage(STORAGE_KEYS.MONTAGE_ANALYSES, {})
      await this.saveToStorage(STORAGE_KEYS.UNIFIED_ANALYSES, {})
      await this.saveToStorage(STORAGE_KEYS.ANALYSIS_METADATA, {})

      logger.info("All analyses cleared")
      return { success: true }
    } catch (error) {
      logger.error("Failed to clear analyses", { error })
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async getStorageStats(): Promise<{
    comprehensiveCount: number
    montageCount: number
    unifiedCount: number
    totalSize: number
  }> {
    const comprehensive = await this.loadComprehensiveAnalyses()
    const montage = await this.loadMontageAnalyses()
    const unified = await this.loadUnifiedAnalyses()

    const totalSize =
      JSON.stringify(comprehensive).length + JSON.stringify(montage).length + JSON.stringify(unified).length

    return {
      comprehensiveCount: Object.keys(comprehensive).length,
      montageCount: Object.keys(montage).length,
      unifiedCount: Object.keys(unified).length,
      totalSize,
    }
  }

  private async saveAnalysisMetadata(metadata: AnalysisMetadata): Promise<void> {
    const allMetadata = await this.loadAllMetadata()
    allMetadata[metadata.analysisId] = metadata
    await this.saveToStorage(STORAGE_KEYS.ANALYSIS_METADATA, allMetadata)
  }

  private async deleteAnalysisMetadata(analysisId: string): Promise<void> {
    const allMetadata = await this.loadAllMetadata()
    delete allMetadata[analysisId]
    await this.saveToStorage(STORAGE_KEYS.ANALYSIS_METADATA, allMetadata)
  }

  private async saveToStorage<T>(key: string, data: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      logger.error("Failed to save to storage", { key, error })
      throw error
    }
  }

  private async loadFromStorage<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const serialized = localStorage.getItem(key)
      if (!serialized) return defaultValue
      return JSON.parse(serialized) as T
    } catch (error) {
      logger.error("Failed to load from storage", { key, error })
      return defaultValue
    }
  }
}

export const analysisStorageService = AnalysisStorageService.getInstance()
