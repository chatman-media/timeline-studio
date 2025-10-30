/**
 * Хук для управления content pipeline
 * Предоставляет удобный интерфейс для работы с пайплайном обработки контента
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type { AIConfig } from "@/domains/shared/types/ai-tools/ai-config"
import {
  AccuracyLevel,
  AIProvider,
  AnalysisDepth,
  SpeedPriority,
  StepType,
} from "@/domains/shared/types/ai-tools/ai-config"
import type { IntelligentContent, PipelineProgress } from "@/domains/shared/types/ai-tools/pipeline"
import { ProcessingStatus } from "@/domains/shared/types/ai-tools/pipeline"
import { PipelineConfig, PipelineEvent } from "../unified-pipeline/unified-content-pipeline"
import { useAIIntelligence } from "./use-ai-intelligence"

interface BatchProgress {
  total: number
  completed: number
  failed: number
  inProgress: number
  items: Array<{
    id: string
    status: ProcessingStatus
  }>
}

interface UseContentPipelineOptions {
  config?: PipelineConfig
  onEvent?: (event: PipelineEvent) => void
  onProgress?: (progress: PipelineProgress) => void
  onBatchProgress?: (progress: BatchProgress) => void
}

interface UseContentPipelineReturn {
  // Состояние pipeline
  isRunning: boolean
  isPaused: boolean
  progress: PipelineProgress | null
  currentStep: string | null
  results: IntelligentContent[]
  errors: Error[]

  // Управление pipeline
  startPipeline: (mediaFiles: MediaFile[], config?: PipelineConfig) => Promise<IntelligentContent>
  pausePipeline: () => Promise<void>
  resumePipeline: () => Promise<void>
  stopPipeline: () => Promise<void>

  // Batch обработка
  processBatch: (config: BatchProcessingConfig) => Promise<IntelligentContent[]>

  // Утилиты
  clearResults: () => void
  exportResults: (format: "json" | "csv") => Promise<Blob>
  getStepDuration: (stepName: string) => number | null
}

interface MediaFile {
  path: string
  name: string
  size?: number
}

interface BatchProcessingConfig {
  items: Array<{
    id: string
    mediaFiles: string[]
    config?: Partial<AIConfig>
  }>
  parallel: boolean
  maxConcurrent: number
  continueOnError: boolean
}

export function useContentPipeline(options: UseContentPipelineOptions = {}): UseContentPipelineReturn {
  const { config: defaultConfig, onEvent, onProgress, onBatchProgress } = options

  // AI Intelligence хук
  const ai = useAIIntelligence({
    onProgress,
    onError: (error) => {
      setErrors((prev) => [...prev, error])
    },
  })

  // Состояние
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState<PipelineProgress | null>(null)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [results, setResults] = useState<IntelligentContent[]>([])
  const [errors, setErrors] = useState<Error[]>([])

  // Refs
  const batchAbortControllerRef = useRef<AbortController>(null)
  const stepTimingsRef = useRef<Map<string, number>>(new Map())

  // Обработка событий pipeline
  useEffect(() => {
    if (ai.progress) {
      setProgress(ai.progress)
      setCurrentStep(ai.progress.currentStep)

      // Записываем timing для шагов
      ai.progress.steps.forEach((step) => {
        if (step.status === ProcessingStatus.COMPLETED && step.progress === 100) {
          // Здесь можно записать timing, если он доступен
        }
      })
    }
  }, [ai.progress])

  // Запустить pipeline
  const startPipeline = useCallback(
    async (mediaFiles: MediaFile[], config?: PipelineConfig): Promise<IntelligentContent> => {
      try {
        setIsRunning(true)
        setIsPaused(false)
        setErrors([])

        const pipelineConfig = config || defaultConfig
        if (!pipelineConfig) {
          throw new Error("Pipeline configuration is required")
        }

        // Преобразуем PipelineConfig в AIConfig
        const aiConfig = convertPipelineConfigToAIConfig(pipelineConfig)

        const result = await ai.processProject(mediaFiles, aiConfig)
        setResults((prev) => [...prev, result])

        return result
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        setErrors((prev) => [...prev, err])
        throw err
      } finally {
        setIsRunning(false)
        setCurrentStep(null)
      }
    },
    [defaultConfig, ai],
  )

  // Приостановить pipeline
  const pausePipeline = useCallback(async () => {
    if (isRunning && !isPaused) {
      await ai.pausePipeline()
      setIsPaused(true)
    }
  }, [isRunning, isPaused, ai])

  // Возобновить pipeline
  const resumePipeline = useCallback(async () => {
    if (isRunning && isPaused) {
      await ai.resumePipeline()
      setIsPaused(false)
    }
  }, [isRunning, isPaused, ai])

  // Остановить pipeline
  const stopPipeline = useCallback(async () => {
    if (isRunning) {
      await ai.cancelPipeline()
      setIsRunning(false)
      setIsPaused(false)
      setCurrentStep(null)
    }
  }, [isRunning, ai])

  // Batch обработка
  const processBatch = useCallback(
    async (batchConfig: BatchProcessingConfig): Promise<IntelligentContent[]> => {
      const results: IntelligentContent[] = []
      const batchErrors: Error[] = []

      // Создаем abort controller для отмены
      batchAbortControllerRef.current = new AbortController()

      try {
        setIsRunning(true)

        const totalItems = batchConfig.items.length
        let completedItems = 0
        let failedItems = 0

        // Функция обновления прогресса
        const updateBatchProgress = () => {
          const progress: BatchProgress = {
            total: totalItems,
            completed: completedItems,
            failed: failedItems,
            inProgress: batchConfig.parallel
              ? Math.min(batchConfig.maxConcurrent, totalItems - completedItems - failedItems)
              : completedItems + failedItems < totalItems
                ? 1
                : 0,
            items: batchConfig.items.map((item, index) => ({
              id: item.id,
              status:
                index < completedItems
                  ? ProcessingStatus.COMPLETED
                  : index < completedItems + failedItems
                    ? ProcessingStatus.FAILED
                    : ProcessingStatus.PENDING,
            })),
          }

          onBatchProgress?.(progress)
        }

        // Обработка одного элемента
        const processItem = async (item: (typeof batchConfig.items)[0]) => {
          if (batchAbortControllerRef.current?.signal.aborted) {
            throw new Error("Batch processing cancelled")
          }

          try {
            const aiConfig = item.config
              ? {
                  ...convertPipelineConfigToAIConfig(defaultConfig!),
                  ...item.config,
                }
              : convertPipelineConfigToAIConfig(defaultConfig!)

            const result = await ai.processProject(
              item.mediaFiles.map((path) => ({
                path,
                name: path.split("/").pop()!,
              })),
              aiConfig,
            )

            completedItems++
            results.push(result)
            updateBatchProgress()

            return result
          } catch (error) {
            failedItems++
            const err = error instanceof Error ? error : new Error(String(error))
            batchErrors.push(err)
            updateBatchProgress()

            if (!batchConfig.continueOnError) {
              throw err
            }
          }
        }

        // Выполнение обработки
        if (batchConfig.parallel) {
          // Параллельная обработка с ограничением
          const chunks = []
          for (let i = 0; i < batchConfig.items.length; i += batchConfig.maxConcurrent) {
            chunks.push(batchConfig.items.slice(i, i + batchConfig.maxConcurrent))
          }

          for (const chunk of chunks) {
            await Promise.all(chunk.map(processItem))
          }
        } else {
          // Последовательная обработка
          for (const item of batchConfig.items) {
            await processItem(item)
          }
        }

        setResults((prev) => [...prev, ...results])
        setErrors((prev) => [...prev, ...batchErrors])

        return results
      } finally {
        setIsRunning(false)
        batchAbortControllerRef.current = null
      }
    },
    [defaultConfig, ai, onBatchProgress],
  )

  // Очистить результаты
  const clearResults = useCallback(() => {
    setResults([])
    setErrors([])
  }, [])

  // Экспорт результатов
  const exportResults = useCallback(
    async (format: "json" | "csv"): Promise<Blob> => {
      if (format === "json") {
        const data = JSON.stringify(results, null, 2)
        return new Blob([data], { type: "application/json" })
      }
      // CSV экспорт - упрощенная версия
      const headers = ["ID", "Project ID", "Created", "Content Type", "Duration", "Quality"]
      const rows = results.map((r) => [
        r.id,
        r.projectId,
        r.createdAt.toISOString(),
        r.analysis.contentType,
        r.analysis.technicalSpecs.duration,
        r.analysis.qualityMetrics.overall,
      ])

      const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

      return new Blob([csv], { type: "text/csv" })
    },
    [results],
  )

  // Получить длительность шага
  const getStepDuration = useCallback((stepName: string): number | null => {
    return stepTimingsRef.current.get(stepName) || null
  }, [])

  return {
    // Состояние
    isRunning,
    isPaused,
    progress,
    currentStep,
    results,
    errors,

    // Управление
    startPipeline,
    pausePipeline,
    resumePipeline,
    stopPipeline,

    // Batch
    processBatch,

    // Утилиты
    clearResults,
    exportResults,
    getStepDuration,
  }
}

// Вспомогательная функция конвертации конфигурации
function convertPipelineConfigToAIConfig(pipelineConfig: PipelineConfig): AIConfig {
  // Проверяем валидность конфигурации
  if (!pipelineConfig || !pipelineConfig.steps) {
    throw new Error("Invalid pipeline configuration: steps are required")
  }

  // Анализируем шаги pipeline для определения включенных функций
  const stepTypes = new Set(pipelineConfig.steps.map((step) => step.type))

  // Определяем настройки провайдера по умолчанию
  const defaultProvider: AIProvider = AIProvider.OPENAI

  // Создаем базовую конфигурацию AI
  const aiConfig: AIConfig = {
    providers: [
      {
        provider: defaultProvider,
        model: "gpt-4-turbo-preview",
        maxTokens: 4096,
        temperature: 0.7,
        stream: false,
      },
    ],
    defaultProvider,

    // Определяем функции на основе шагов pipeline
    features: {
      sceneAnalysis: stepTypes.has(StepType.ANALYZE),
      scriptGeneration: stepTypes.has(StepType.GENERATE),
      multiPlatform: stepTypes.has(StepType.ADAPT),
      contentClassification: stepTypes.has(StepType.CLASSIFY),
      qualityEnhancement: stepTypes.has(StepType.ENHANCE),
      autoSuggestions: true, // Всегда включено для лучшего UX
    },

    // Настройки обработки
    processing: {
      parallel: true,
      maxConcurrent: 3,
      batchSize: 10,
      cacheResults: true,
      cacheDuration: 24, // 24 часа
      retryAttempts: 3,
      timeout: 300, // 5 минут
    },

    // Настройки качества
    quality: {
      analysisDepth: AnalysisDepth.STANDARD,
      accuracy: AccuracyLevel.BALANCED,
      speed: SpeedPriority.NORMAL,
      resourceUsage: {
        maxCPU: 80,
        maxRAM: 4096,
        maxDiskSpace: 1024,
      },
    },
  }

  // Обрабатываем специфичные настройки шагов
  for (const step of pipelineConfig.steps) {
    switch (step.type) {
      case StepType.ANALYZE:
        // Настройки для анализа
        if (step.config?.depth) {
          switch (step.config.depth) {
            case "basic":
              aiConfig.quality.analysisDepth = AnalysisDepth.BASIC
              break
            case "detailed":
              aiConfig.quality.analysisDepth = AnalysisDepth.DETAILED
              break
            case "comprehensive":
              aiConfig.quality.analysisDepth = AnalysisDepth.COMPREHENSIVE
              break
            default:
              // Keep default value
              break
          }
        }
        break

      case StepType.GENERATE:
        // Настройки для генерации
        if (step.config?.scriptParams) {
          aiConfig.scriptParams = step.config.scriptParams
        }
        break

      case StepType.ADAPT:
        // Настройки для адаптации платформ
        if (step.config?.platforms) {
          aiConfig.platforms = step.config.platforms
        }
        break

      case StepType.CLASSIFY:
        // Настройки для классификации контента
        aiConfig.features.contentClassification = true
        break

      case StepType.ENHANCE:
        // Настройки для улучшения качества
        aiConfig.features.qualityEnhancement = true
        if (step.config?.accuracy) {
          switch (step.config.accuracy) {
            case "fast":
              aiConfig.quality.accuracy = AccuracyLevel.FAST
              break
            case "accurate":
              aiConfig.quality.accuracy = AccuracyLevel.ACCURATE
              break
            case "maximum":
              aiConfig.quality.accuracy = AccuracyLevel.MAXIMUM
              break
            default:
              // Keep default value
              break
          }
        }
        break
      default:
        // Unknown step type, skip
        break
    }
  }

  // Обрабатываем глобальные настройки производительности
  if (pipelineConfig.steps.length >= 5) {
    // Для больших pipeline увеличиваем параллелизм
    aiConfig.processing.maxConcurrent = 5
    aiConfig.processing.batchSize = 15
  }

  // Определяем приоритет скорости на основе количества шагов
  if (pipelineConfig.steps.length <= 2) {
    aiConfig.quality.speed = SpeedPriority.FAST
  } else if (pipelineConfig.steps.length >= 5) {
    aiConfig.quality.speed = SpeedPriority.QUALITY
  }

  // Настройки языков если есть
  const languageSteps = pipelineConfig.steps.filter((step) => step.config?.language)
  if (languageSteps.length > 0) {
    const languages = languageSteps.map((step) => step.config.language).filter(Boolean)
    if (languages.length > 0) {
      aiConfig.languages = {
        source: "auto", // Автоопределение
        targets: Array.from(new Set(languages)), // Уникальные языки
        autoDetect: true,
        preserveOriginal: true,
      }
    }
  }

  return aiConfig
}
