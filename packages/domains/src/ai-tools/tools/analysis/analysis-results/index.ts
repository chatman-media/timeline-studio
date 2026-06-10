/**
 * Analysis Results Tools
 * Инструменты для получения результатов AI анализа видео
 */

import { analysisStorageService } from "@timeline-studio/domains/ai-services/services/analysis-storage-service"

import { BaseAITool } from "../../../base"
import type { AIToolExecutionOptions, AIToolMetadata, AIToolResult, IAITool } from "../../../types"

// ============================================================================
// Types
// ============================================================================

interface GetAnalysisResultsInput {
  /** Путь к видео файлу или "all" для всех */
  videoPath?: string
  /** Тип анализа: comprehensive, montage, unified или all */
  analysisType?: "comprehensive" | "montage" | "unified" | "all"
  /** Включить метаданные */
  includeMetadata?: boolean
}

interface AnalysisResultsOutput {
  success: boolean
  videoPath?: string
  analysisType: string
  results: {
    comprehensive?: any
    montage?: any
    unified?: any
  }
  metadata?: any
  analyzedVideos?: string[]
  stats?: {
    comprehensiveCount: number
    montageCount: number
    unifiedCount: number
  }
}

// ============================================================================
// GET ANALYSIS RESULTS TOOL
// ============================================================================

export class GetAnalysisResultsTool extends BaseAITool implements IAITool {
  metadata: AIToolMetadata = {
    name: "get-analysis-results",
    displayName: "Получить результаты анализа",
    description:
      "Получает результаты AI Director анализа для видео. Можно запросить данные для конкретного видео или список всех проанализированных видео.",
    domain: "analysis",
    category: "content-intelligence",
    tags: ["analysis", "ai-director", "video", "results", "data"],
    version: "1.0.0",
    author: "Timeline Studio",
    dependencies: [],
    inputSchema: {
      type: "object",
      properties: {
        videoPath: {
          type: "string",
          description:
            'Путь к видео файлу. Оставьте пустым или "all" для получения списка всех проанализированных видео',
        },
        analysisType: {
          type: "string",
          enum: ["comprehensive", "montage", "unified", "all"],
          description: "Тип анализа для получения. По умолчанию: all",
        },
        includeMetadata: {
          type: "boolean",
          description: "Включить метаданные анализа (даты, длительность и т.д.)",
        },
      },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        videoPath: { type: "string" },
        analysisType: { type: "string" },
        results: { type: "object" },
        metadata: { type: "object" },
        analyzedVideos: { type: "array", items: { type: "string" } },
        stats: { type: "object" },
      },
    },
    examples: [
      {
        description: "Получить все результаты анализа для видео",
        input: { videoPath: "/path/to/video.mp4", analysisType: "all" },
        expectedOutput: { success: true, results: {} },
      },
      {
        description: "Получить список всех проанализированных видео",
        input: { videoPath: "all" },
        expectedOutput: { success: true, analyzedVideos: [] },
      },
    ],
  }

  async execute(
    input: GetAnalysisResultsInput,
    options?: AIToolExecutionOptions,
  ): Promise<AIToolResult<AnalysisResultsOutput>> {
    return this.executeWithErrorHandling(
      async (_context) => {
        const { videoPath, analysisType = "all", includeMetadata = true } = input

        // Если запрос на все видео или не указан путь
        if (!videoPath || videoPath === "all") {
          const analyzedVideos = await analysisStorageService.getAnalyzedVideos()
          const stats = await analysisStorageService.getStorageStats()

          return {
            success: true,
            analysisType: "list",
            results: {},
            analyzedVideos,
            stats,
          }
        }

        // Получаем результаты для конкретного видео
        const results: AnalysisResultsOutput["results"] = {}
        let metadata: any

        if (analysisType === "comprehensive" || analysisType === "all") {
          const comprehensive = await analysisStorageService.loadComprehensiveAnalysis(videoPath)
          if (comprehensive.success && comprehensive.data) {
            results.comprehensive = comprehensive.data

            // Загружаем метаданные
            if (includeMetadata && comprehensive.data.analysis_id) {
              metadata = await analysisStorageService.loadAnalysisMetadata(comprehensive.data.analysis_id)
            }
          }
        }

        if (analysisType === "montage" || analysisType === "all") {
          const montage = await analysisStorageService.loadMontageAnalysis(videoPath)
          if (montage.success && montage.data) {
            results.montage = montage.data
          }
        }

        if (analysisType === "unified" || analysisType === "all") {
          const unified = await analysisStorageService.loadUnifiedAnalysis(videoPath)
          if (unified.success && unified.data) {
            results.unified = unified.data
          }
        }

        const hasResults = Object.keys(results).length > 0

        return {
          success: hasResults,
          videoPath,
          analysisType,
          results,
          metadata: includeMetadata ? metadata : undefined,
        }
      },
      input,
      options,
    )
  }

  validate(input: any): boolean {
    // Валидация не строгая - все поля опциональны
    return typeof input === "object" && input !== null
  }

  getSchema(): { input: any; output: any } {
    return {
      input: this.metadata.inputSchema,
      output: this.metadata.outputSchema,
    }
  }
}

// ============================================================================
// LIST MEDIA FILES TOOL
// ============================================================================

export class ListProjectMediaTool extends BaseAITool implements IAITool {
  metadata: AIToolMetadata = {
    name: "list-project-media",
    displayName: "Список медиа в проекте",
    description: "Получает список всех медиа файлов, добавленных в проект, с их основной информацией",
    domain: "analysis",
    category: "content-intelligence",
    tags: ["media", "project", "files", "list"],
    version: "1.0.0",
    author: "Timeline Studio",
    dependencies: [],
    inputSchema: {
      type: "object",
      properties: {
        includeAnalysisStatus: {
          type: "boolean",
          description: "Включить статус анализа для каждого файла",
        },
      },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        files: {
          type: "array",
          items: {
            type: "object",
            properties: {
              path: { type: "string" },
              name: { type: "string" },
              hasAnalysis: { type: "boolean" },
            },
          },
        },
        totalCount: { type: "number" },
      },
    },
    examples: [
      {
        description: "Получить список всех медиа файлов",
        input: { includeAnalysisStatus: true },
        expectedOutput: { success: true, files: [], totalCount: 0 },
      },
    ],
  }

  async execute(
    input: { includeAnalysisStatus?: boolean },
    options?: AIToolExecutionOptions,
  ): Promise<AIToolResult<any>> {
    return this.executeWithErrorHandling(
      async (_context) => {
        // Получаем список проанализированных видео из storage
        const analyzedVideos = await analysisStorageService.getAnalyzedVideos()

        const files = analyzedVideos.map((path) => ({
          path,
          name: path.split("/").pop() || path,
          hasAnalysis: true,
        }))

        return {
          success: true,
          files,
          totalCount: files.length,
        }
      },
      input,
      options,
    )
  }

  validate(input: any): boolean {
    return typeof input === "object" && input !== null
  }

  getSchema(): { input: any; output: any } {
    return {
      input: this.metadata.inputSchema,
      output: this.metadata.outputSchema,
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

export const analysisResultsTools = [new GetAnalysisResultsTool(), new ListProjectMediaTool()]

export const ANALYSIS_RESULTS_TOOLS_COUNT = analysisResultsTools.length
