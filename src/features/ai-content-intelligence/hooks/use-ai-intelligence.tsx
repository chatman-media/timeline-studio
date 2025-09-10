/**
 * Главный хук для работы с AI Content Intelligence
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { GeneratedScript, PipelineControl, PipelineProgress, ScriptGenerationParams } from "@/domains/ai-services"
import {
  AdaptedContent,
  AIConfig,
  IntelligentContent,
  PlatformId,
  UnifiedContentAnalysis,
} from "@/domains/ai-services/types"
import { AIIntelligenceOrchestrator } from ".."
import { useAIIntelligence as useAIIntelligenceContext } from "../services/ai-intelligence-provider"

interface UseAIIntelligenceOptions {
  autoInitialize?: boolean
  onProgress?: (progress: PipelineProgress) => void
  onError?: (error: Error) => void
  onComplete?: (result: IntelligentContent) => void
}

interface UseAIIntelligenceReturn {
  // Состояние
  isInitialized: boolean
  isProcessing: boolean
  progress: PipelineProgress | null
  error: Error | null
  result: IntelligentContent | null

  // Основные методы
  analyzeContent: (mediaFiles: MediaFile[], config?: Partial<AIConfig>) => Promise<UnifiedContentAnalysis>
  generateScript: (analysis: UnifiedContentAnalysis, params: ScriptGenerationParams) => Promise<GeneratedScript>
  adaptForPlatforms: (content: Content, platforms: PlatformId[]) => Promise<AdaptedContent[]>
  processProject: (mediaFiles: MediaFile[], config: AIConfig) => Promise<IntelligentContent>

  // Управление pipeline
  pausePipeline: () => Promise<void>
  resumePipeline: () => Promise<void>
  cancelPipeline: () => Promise<void>

  // Утилиты
  reset: () => void
  getOrchestrator: () => AIIntelligenceOrchestrator
}

interface MediaFile {
  path: string
  name: string
  size?: number
}

interface Content {
  analysis: UnifiedContentAnalysis
  script?: GeneratedScript
}

export function useAIIntelligence(options: UseAIIntelligenceOptions = {}): UseAIIntelligenceReturn {
  const { autoInitialize = true, onProgress, onError, onComplete } = options

  // Состояние
  const [isInitialized, setIsInitialized] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<PipelineProgress | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<IntelligentContent | null>(null)

  // Get AI Intelligence context
  const context = useAIIntelligenceContext()
  const actor = context?.actor

  // Refs
  const orchestratorRef = useRef<AIIntelligenceOrchestrator>(null)
  const pipelineControlRef = useRef<PipelineControl>(null)

  // Инициализация оркестратора
  useEffect(() => {
    if (autoInitialize && !orchestratorRef.current && actor) {
      orchestratorRef.current = new AIIntelligenceOrchestrator(actor)

      // Инициализация движков происходит лениво при первом использовании
      setIsInitialized(true)
    }
  }, [autoInitialize, actor])

  // Получить оркестратор
  const getOrchestrator = useCallback(() => {
    if (!orchestratorRef.current && actor) {
      orchestratorRef.current = new AIIntelligenceOrchestrator(actor)
      setIsInitialized(true)
    }
    if (!orchestratorRef.current) {
      throw new Error(
        "AIIntelligenceOrchestrator not initialized. Make sure component is wrapped in AIIntelligenceProvider.",
      )
    }
    return orchestratorRef.current
  }, [actor])

  // Анализировать контент
  const analyzeContent = useCallback(
    async (mediaFiles: MediaFile[], config?: Partial<AIConfig>): Promise<UnifiedContentAnalysis> => {
      try {
        setError(null)
        setIsProcessing(true)

        const orchestrator = getOrchestrator()
        const analysis = await orchestrator.analyzeContent(mediaFiles, config)

        return analysis
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [getOrchestrator, onError],
  )

  // Генерировать сценарий
  const generateScript = useCallback(
    async (analysis: UnifiedContentAnalysis, params: ScriptGenerationParams): Promise<GeneratedScript> => {
      try {
        setError(null)
        setIsProcessing(true)

        const orchestrator = getOrchestrator()
        const script = await orchestrator.generateScript(analysis, params)

        return script
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [getOrchestrator, onError],
  )

  // Адаптировать для платформ
  const adaptForPlatforms = useCallback(
    async (content: Content, platforms: PlatformId[]): Promise<AdaptedContent[]> => {
      try {
        setError(null)
        setIsProcessing(true)

        const orchestrator = getOrchestrator()
        const adaptations = await orchestrator.adaptForPlatforms(content, platforms)

        return adaptations
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [getOrchestrator, onError],
  )

  // Обработать проект полностью
  const processProject = useCallback(
    async (mediaFiles: MediaFile[], config: AIConfig): Promise<IntelligentContent> => {
      try {
        setError(null)
        setIsProcessing(true)
        setProgress(null)

        const orchestrator = getOrchestrator()

        // Создаем контрол для управления pipeline
        pipelineControlRef.current = orchestrator.createPipelineControl()

        // Подписываемся на прогресс
        const unsubscribeProgress = pipelineControlRef.current?.onProgress((progress) => {
          setProgress(progress)
          onProgress?.(progress)
        })

        // Подписываемся на события
        const unsubscribeEvents = pipelineControlRef.current?.onEvent((event) => {
          console.log("Pipeline event:", event.type, event.data)
        })

        try {
          const result = await orchestrator.processProject(mediaFiles, config)
          setResult(result)
          onComplete?.(result)
          return result
        } finally {
          // Отписываемся от событий
          unsubscribeProgress()
          unsubscribeEvents()
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsProcessing(false)
        pipelineControlRef.current = null
      }
    },
    [getOrchestrator, onProgress, onComplete, onError],
  )

  // Управление pipeline
  const pausePipeline = useCallback(async () => {
    if (pipelineControlRef.current) {
      await pipelineControlRef.current.pause()
    }
  }, [])

  const resumePipeline = useCallback(async () => {
    if (pipelineControlRef.current) {
      await pipelineControlRef.current.resume()
    }
  }, [])

  const cancelPipeline = useCallback(async () => {
    if (pipelineControlRef.current) {
      await pipelineControlRef.current.cancel()
      setIsProcessing(false)
      setProgress(null)
    }
  }, [])

  // Сброс состояния
  const reset = useCallback(() => {
    setError(null)
    setProgress(null)
    setResult(null)
    setIsProcessing(false)
    pipelineControlRef.current = null
  }, [])

  return {
    // Состояние
    isInitialized,
    isProcessing,
    progress,
    error,
    result,

    // Основные методы
    analyzeContent,
    generateScript,
    adaptForPlatforms,
    processProject,

    // Управление pipeline
    pausePipeline,
    resumePipeline,
    cancelPipeline,

    // Утилиты
    reset,
    getOrchestrator,
  }
}
