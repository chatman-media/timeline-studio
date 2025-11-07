/**
 * Analysis Storage Service
 *
 * Сервис для хранения и управления результатами AI анализа видео
 * Обеспечивает персистентность анализов между сессиями
 */

import { createLogger } from "@/lib/tauri-logger"
import type { ComprehensiveAnalysisResult, MontageAnalysisResult } from "@/types/generated/tauri-bindings"
import type { UnifiedContentAnalysis } from "../mappers/ai-director-mapper"

const logger = createLogger({ module: "AnalysisStorageService" })

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  COMPREHENSIVE_ANALYSES: "ai-director:comprehensive-analyses",
  MONTAGE_ANALYSES: "ai-director:montage-analyses",
  UNIFIED_ANALYSES: "ai-director:unified-analyses",
  ANALYSIS_METADATA: "ai-director:analysis-metadata",
} as const

// ============================================================================
// Types
// ============================================================================

/**
 * Метаданные анализа
 */
export interface AnalysisMetadata {
  /** ID анализа */
  analysisId: string
  /** Путь к видео файлу */
  videoPath: string
  /** Дата создания анализа */
  createdAt: number
  /** Дата последнего обновления */
  updatedAt: number
  /** Workflow ID из AI Director */
  workflowId?: string
  /** Продолжительность анализа (ms) */
  duration?: number
  /** Успешность анализа */
  success: boolean
  /** Ошибки (если были) */
  errors?: string[]
}

/**
 * Опции для сохранения анализа
 */
export interface SaveAnalysisOptions {
  /** Перезаписать существующий анализ */
  overwrite?: boolean
  /** Сохранить метаданные */
  saveMetadata?: boolean
}

/**
 * Результат операции хранилища
 */
export interface StorageResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// Analysis Storage Service Class
// ============================================================================

export class AnalysisStorageService {
  private static instance: AnalysisStorageService | null = null

  private constructor() {
    // Singleton
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  static getInstance(): AnalysisStorageService {
    if (!AnalysisStorageService.instance) {
      AnalysisStorageService.instance = new AnalysisStorageService()
    }
    return AnalysisStorageService.instance
  }

  // ============================================================================
  // Comprehensive Analysis Storage
  // ============================================================================

  /**
   * Сохранить comprehensive analysis result
   */
  async saveComprehensiveAnalysis(
    videoPath: string,
    result: ComprehensiveAnalysisResult,
    options: SaveAnalysisOptions = {},
  ): Promise<StorageResult<string>> {
    try {
      const { overwrite = true, saveMetadata = true } = options

      // Загружаем существующие анализы
      const analyses = await this.loadComprehensiveAnalyses()

      // Проверяем существование
      if (analyses[videoPath] && !overwrite) {
        return {
          success: false,
          error: `Analysis for ${videoPath} already exists. Use overwrite: true to replace.`,
        }
      }

      // Сохраняем анализ
      analyses[videoPath] = result
      await this.saveToStorage(STORAGE_KEYS.COMPREHENSIVE_ANALYSES, analyses)

      // Сохраняем метаданные
      if (saveMetadata) {
        const metadata: AnalysisMetadata = {
          analysisId: result.analysis_id,
          videoPath,
          createdAt: analyses[videoPath] ? Date.now() : Date.now(),
          updatedAt: Date.now(),
          workflowId: result.analysis_id,
          duration: result.total_duration_ms,
          success: result.status === "completed",
          errors: result.errors.length > 0 ? result.errors : undefined,
        }
        await this.saveAnalysisMetadata(metadata)
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

  /**
   * Загрузить comprehensive analysis для видео
   */
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

  /**
   * Загрузить все comprehensive analyses
   */
  async loadComprehensiveAnalyses(): Promise<Record<string, ComprehensiveAnalysisResult>> {
    return this.loadFromStorage<Record<string, ComprehensiveAnalysisResult>>(STORAGE_KEYS.COMPREHENSIVE_ANALYSES, {})
  }

  /**
   * Удалить comprehensive analysis
   */
  async deleteComprehensiveAnalysis(videoPath: string): Promise<StorageResult> {
    try {
      const analyses = await this.loadComprehensiveAnalyses()
      const analysis = analyses[videoPath]

      if (!analysis) {
        return { success: false, error: `No analysis found for ${videoPath}` }
      }

      delete analyses[videoPath]
      await this.saveToStorage(STORAGE_KEYS.COMPREHENSIVE_ANALYSES, analyses)

      // Удаляем метаданные
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

  // ============================================================================
  // Montage Analysis Storage
  // ============================================================================

  /**
   * Сохранить montage analysis result
   */
  async saveMontageAnalysis(
    videoPath: string,
    result: MontageAnalysisResult,
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

  /**
   * Загрузить montage analysis для видео
   */
  async loadMontageAnalysis(videoPath: string): Promise<StorageResult<MontageAnalysisResult>> {
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

  /**
   * Загрузить все montage analyses
   */
  async loadMontageAnalyses(): Promise<Record<string, MontageAnalysisResult>> {
    return this.loadFromStorage<Record<string, MontageAnalysisResult>>(STORAGE_KEYS.MONTAGE_ANALYSES, {})
  }

  // ============================================================================
  // Unified Analysis Storage
  // ============================================================================

  /**
   * Сохранить unified analysis
   */
  async saveUnifiedAnalysis(videoPath: string, analysis: UnifiedContentAnalysis): Promise<StorageResult> {
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

  /**
   * Загрузить unified analysis
   */
  async loadUnifiedAnalysis(videoPath: string): Promise<StorageResult<UnifiedContentAnalysis>> {
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

  /**
   * Загрузить все unified analyses
   */
  async loadUnifiedAnalyses(): Promise<Record<string, UnifiedContentAnalysis>> {
    return this.loadFromStorage<Record<string, UnifiedContentAnalysis>>(STORAGE_KEYS.UNIFIED_ANALYSES, {})
  }

  // ============================================================================
  // Metadata Management
  // ============================================================================

  /**
   * Сохранить метаданные анализа
   */
  private async saveAnalysisMetadata(metadata: AnalysisMetadata): Promise<void> {
    const allMetadata = await this.loadAllMetadata()
    allMetadata[metadata.analysisId] = metadata
    await this.saveToStorage(STORAGE_KEYS.ANALYSIS_METADATA, allMetadata)
  }

  /**
   * Загрузить метаданные анализа
   */
  async loadAnalysisMetadata(analysisId: string): Promise<AnalysisMetadata | null> {
    const allMetadata = await this.loadAllMetadata()
    return allMetadata[analysisId] || null
  }

  /**
   * Загрузить все метаданные
   */
  async loadAllMetadata(): Promise<Record<string, AnalysisMetadata>> {
    return this.loadFromStorage<Record<string, AnalysisMetadata>>(STORAGE_KEYS.ANALYSIS_METADATA, {})
  }

  /**
   * Удалить метаданные анализа
   */
  private async deleteAnalysisMetadata(analysisId: string): Promise<void> {
    const allMetadata = await this.loadAllMetadata()
    delete allMetadata[analysisId]
    await this.saveToStorage(STORAGE_KEYS.ANALYSIS_METADATA, allMetadata)
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Проверить наличие анализа для видео
   */
  async hasAnalysis(videoPath: string): Promise<boolean> {
    const comprehensive = await this.loadComprehensiveAnalyses()
    return videoPath in comprehensive
  }

  /**
   * Получить список всех проанализированных видео
   */
  async getAnalyzedVideos(): Promise<string[]> {
    const analyses = await this.loadComprehensiveAnalyses()
    return Object.keys(analyses)
  }

  /**
   * Очистить все анализы
   */
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

  /**
   * Получить статистику хранилища
   */
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

  // ============================================================================
  // Private Storage Methods
  // ============================================================================

  /**
   * Сохранить данные в localStorage
   */
  private async saveToStorage<T>(key: string, data: T): Promise<void> {
    try {
      const serialized = JSON.stringify(data)
      localStorage.setItem(key, serialized)
    } catch (error) {
      logger.error("Failed to save to storage", { key, error })
      throw error
    }
  }

  /**
   * Загрузить данные из localStorage
   */
  private async loadFromStorage<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const serialized = localStorage.getItem(key)
      if (!serialized) {
        return defaultValue
      }
      return JSON.parse(serialized) as T
    } catch (error) {
      logger.error("Failed to load from storage", { key, error })
      return defaultValue
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

// Export singleton instance
export const analysisStorageService = AnalysisStorageService.getInstance()
