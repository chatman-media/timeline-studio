/**
 * Хук для прямой работы с AI Orchestrator
 * Предоставляет низкоуровневый доступ к функциям оркестратора
 */

import { useCallback, useRef, useState } from "react"
import { AIEngine } from "@/domains/ai-services/services"
import { AIIntelligenceOrchestrator, useAIIntelligenceContext } from ".."

interface UseAIOrchestratorOptions {
  engines?: {
    sceneAnalyzer?: AIEngine
    scriptGenerator?: AIEngine
    multiPlatformAdapter?: AIEngine
  }
}

interface UseAIOrchestratorReturn {
  // Состояние
  isInitialized: boolean
  isInitializing: boolean
  initError: Error | null

  // Методы
  initialize: () => Promise<void>
  getOrchestrator: () => AIIntelligenceOrchestrator
  setEngine: (name: "sceneAnalyzer" | "scriptGenerator" | "multiPlatformAdapter", engine: AIEngine) => Promise<void>
}

export function useAIOrchestrator(options: UseAIOrchestratorOptions = {}): UseAIOrchestratorReturn {
  const { engines } = options
  const context = useAIIntelligenceContext()
  const actor = context?.actor

  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [initError, setInitError] = useState<Error | null>(null)

  const orchestratorRef = useRef<AIIntelligenceOrchestrator | null>(null)
  const enginesRef = useRef(engines)

  // Получить оркестратор
  const getOrchestrator = useCallback(() => {
    if (!orchestratorRef.current && actor) {
      orchestratorRef.current = new AIIntelligenceOrchestrator(actor)
    }
    if (!orchestratorRef.current) {
      throw new Error(
        "AIIntelligenceOrchestrator not initialized. Make sure component is wrapped in AIIntelligenceProvider.",
      )
    }
    return orchestratorRef.current
  }, [actor])

  // Инициализировать с движками
  const initialize = useCallback(async () => {
    if (isInitialized || isInitializing) return

    try {
      setIsInitializing(true)
      setInitError(null)

      const orchestrator = getOrchestrator()
      await orchestrator.initialize(enginesRef.current)

      setIsInitialized(true)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setInitError(error)
      throw error
    } finally {
      setIsInitializing(false)
    }
  }, [isInitialized, isInitializing, getOrchestrator])

  // Установить движок динамически
  const setEngine = useCallback(
    async (name: "sceneAnalyzer" | "scriptGenerator" | "multiPlatformAdapter", engine: AIEngine) => {
      // Обновляем ссылку на движки
      enginesRef.current = {
        ...enginesRef.current,
        [name]: engine,
      }

      // Если оркестратор уже инициализирован, обновляем движок
      if (isInitialized && orchestratorRef.current) {
        await orchestratorRef.current.initialize({
          [name]: engine,
        })
      }
    },
    [isInitialized],
  )

  return {
    isInitialized,
    isInitializing,
    initError,
    initialize,
    getOrchestrator,
    setEngine,
  }
}
