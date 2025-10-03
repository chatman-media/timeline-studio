import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { AIIntelligenceOrchestrator } from "@/domains/ai-services/services/ai-orchestrator"
import {
  AdaptedContent,
  AIConfig,
  Content,
  GeneratedScript,
  IntelligentContent,
  MediaFile,
  PlatformId,
  ScriptGenerationParams,
  UnifiedContentAnalysis,
} from "@/domains/ai-services/types"
import { MediaInfo } from "@/domains/media-management"
import { AIIntelligenceContext } from "../services/ai-intelligence-provider"

interface UseAIIntelligenceOptions {
  autoInitialize?: boolean
  onProgress?: (progress: any) => void
  onComplete?: (result: IntelligentContent) => void
  onError?: (error: Error) => void
}

interface UseAIIntelligenceReturn {
  // Состояние
  isInitialized: boolean
  isProcessing: boolean
  progress: any
  error: Error | null
  result: IntelligentContent | null

  // Основные методы
  analyzeContent: (mediaFiles: MediaInfo[], config?: Partial<AIConfig>) => Promise<UnifiedContentAnalysis>
  generateScript: (analysis: UnifiedContentAnalysis, params: ScriptGenerationParams) => Promise<GeneratedScript>
  adaptForPlatforms: (content: Content, platforms: PlatformId[]) => Promise<AdaptedContent[]>
  processProject: (mediaFiles: MediaInfo[], config: AIConfig) => Promise<IntelligentContent>

  // Управление pipeline
  pausePipeline: () => Promise<void>
  resumePipeline: () => Promise<void>
  cancelPipeline: () => Promise<void>

  // Утилиты
  reset: () => void
  getOrchestrator: () => AIIntelligenceOrchestrator
}

export function useAIIntelligence({
  autoInitialize = true,
  onProgress,
  onComplete,
  onError,
}: UseAIIntelligenceOptions = {}): UseAIIntelligenceReturn {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<IntelligentContent | null>(null)

  const context = useContext(AIIntelligenceContext)
  const actor = context?.actor

  // Refs
  const orchestratorRef = useRef<AIIntelligenceOrchestrator>(null)

  // Инициализация оркестратора
  useEffect(() => {
    if (autoInitialize && !orchestratorRef.current && actor) {
      orchestratorRef.current = new AIIntelligenceOrchestrator(actor)
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

        // Use processContent for analysis
        const pipelineControl = await orchestrator.processContent(mediaFiles, {
          ...config,
          analysis: { enabled: true, type: "content" },
        } as AIConfig)

        // Wait for completion and extract analysis
        return new Promise((resolve, reject) => {
          const unsubscribe = pipelineControl.onEvent((event) => {
            if (event.type === "analysis_complete") {
              unsubscribe()
              const result = orchestrator.getResult()
              if (result?.analysis) {
                resolve(result.analysis)
              } else {
                reject(new Error("Analysis failed"))
              }
            } else if (event.type === "error") {
              unsubscribe()
              reject(new Error(event.data?.message || "Analysis failed"))
            }
          })

          pipelineControl.onProgress((progress) => {
            setProgress(progress)
            onProgress?.(progress)
          })
        })
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [getOrchestrator, onProgress, onError],
  )

  // Генерировать сценарий
  const generateScript = useCallback(
    async (analysis: UnifiedContentAnalysis, params: ScriptGenerationParams): Promise<GeneratedScript> => {
      try {
        setError(null)
        setIsProcessing(true)

        const orchestrator = getOrchestrator()

        // Create a mock media file for script generation
        const mockMediaFile: MediaFile = {
          id: "mock",
          url: "",
          type: "video",
          duration: 0,
          metadata: {},
        }

        const pipelineControl = await orchestrator.processContent([mockMediaFile], {
          analysis: { enabled: false },
          scriptGeneration: {
            enabled: true,
            analysis: analysis,
            params: params,
          },
        } as AIConfig)

        return new Promise((resolve, reject) => {
          const unsubscribe = pipelineControl.onEvent((event) => {
            if (event.type === "script_generated") {
              unsubscribe()
              const result = orchestrator.getResult()
              if (result?.script) {
                resolve(result.script)
              } else {
                reject(new Error("Script generation failed"))
              }
            } else if (event.type === "error") {
              unsubscribe()
              reject(new Error(event.data?.message || "Script generation failed"))
            }
          })

          pipelineControl.onProgress((progress) => {
            setProgress(progress)
            onProgress?.(progress)
          })
        })
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [getOrchestrator, onProgress, onError],
  )

  // Адаптировать для платформ
  const adaptForPlatforms = useCallback(
    async (content: Content, platforms: PlatformId[]): Promise<AdaptedContent[]> => {
      try {
        setError(null)
        setIsProcessing(true)

        const orchestrator = getOrchestrator()

        // Create a mock media file for platform adaptation
        const mockMediaFile: MediaFile = {
          id: "mock",
          url: "",
          type: "video",
          duration: 0,
          metadata: { content },
        }

        const pipelineControl = await orchestrator.processContent([mockMediaFile], {
          analysis: { enabled: false },
          platformAdaptation: {
            enabled: true,
            content: content,
            platforms: platforms,
          },
        } as AIConfig)

        return new Promise((resolve, reject) => {
          const unsubscribe = pipelineControl.onEvent((event) => {
            if (event.type === "platform_adaptation_complete") {
              unsubscribe()
              const result = orchestrator.getResult()
              if (result?.adaptations) {
                resolve(result.adaptations)
              } else {
                reject(new Error("Platform adaptation failed"))
              }
            } else if (event.type === "error") {
              unsubscribe()
              reject(new Error(event.data?.message || "Platform adaptation failed"))
            }
          })

          pipelineControl.onProgress((progress) => {
            setProgress(progress)
            onProgress?.(progress)
          })
        })
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [getOrchestrator, onProgress, onError],
  )

  // Обработать проект полностью
  const processProject = useCallback(
    async (mediaFiles: MediaFile[], config: AIConfig): Promise<IntelligentContent> => {
      try {
        setError(null)
        setIsProcessing(true)
        setProgress(null)

        const orchestrator = getOrchestrator()
        const pipelineControl = await orchestrator.processContent(mediaFiles, config)

        return new Promise((resolve, reject) => {
          const unsubscribe = pipelineControl.onEvent((event) => {
            if (event.type === "pipeline_complete") {
              unsubscribe()
              const result = orchestrator.getResult()
              if (result) {
                setResult(result)
                onComplete?.(result)
                resolve(result)
              } else {
                reject(new Error("Project processing failed"))
              }
            } else if (event.type === "error") {
              unsubscribe()
              reject(new Error(event.data?.message || "Project processing failed"))
            }
          })

          pipelineControl.onProgress((progress) => {
            setProgress(progress)
            onProgress?.(progress)
          })
        })
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [getOrchestrator, onProgress, onComplete, onError],
  )

  // Управление pipeline
  const pausePipeline = useCallback(async () => {
    // These methods are now handled by the pipeline control
    console.warn("pausePipeline is deprecated. Use pipeline control from processProject instead.")
  }, [])

  const resumePipeline = useCallback(async () => {
    console.warn("resumePipeline is deprecated. Use pipeline control from processProject instead.")
  }, [])

  const cancelPipeline = useCallback(async () => {
    console.warn("cancelPipeline is deprecated. Use pipeline control from processProject instead.")
  }, [])

  // Сброс состояния
  const reset = useCallback(() => {
    setError(null)
    setProgress(null)
    setResult(null)
    setIsProcessing(false)
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

    // Управление pipeline (deprecated)
    pausePipeline,
    resumePipeline,
    cancelPipeline,

    // Утилиты
    reset,
    getOrchestrator,
  }
}
