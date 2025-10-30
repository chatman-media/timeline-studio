"use client"

import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react"
import { type Actor, createActor, setup } from "xstate"
// import { aiIntelligenceMachine } from "@/domains/ai-services/machines/ai-intelligence-machine"
// Временно используем упрощенную машину-заглушку

// Упрощенная машина для AI Intelligence
const aiIntelligenceMachine = setup({
  types: {} as {
    context: {
      currentProject: any
      analysisResults: any
      error: string | null
    }
    events: 
      | { type: "START_ANALYSIS"; mediaFiles: any[]; config: any }
      | { type: "ANALYSIS_COMPLETE"; results: any; analysis: any }
      | { type: "SCRIPT_GENERATED"; script: any }
      | { type: "PLATFORM_ADAPTATION_COMPLETE"; content: any }
      | { type: "UPDATE_PROGRESS"; step: string; progress: number }
      | { type: "ERROR"; error: string }
  }
}).createMachine({
  id: "aiIntelligence",
  initial: "idle",
  context: {
    currentProject: null,
    analysisResults: null,
    error: null
  },
  states: {
    idle: {
      on: {
        START_ANALYSIS: "analyzing"
      }
    },
    analyzing: {
      on: {
        ANALYSIS_COMPLETE: "completed",
        UPDATE_PROGRESS: "analyzing",
        ERROR: "error"
      }
    },
    completed: {
      on: {
        START_ANALYSIS: "analyzing",
        SCRIPT_GENERATED: "completed",
        PLATFORM_ADAPTATION_COMPLETE: "completed"
      }
    },
    error: {
      on: {
        START_ANALYSIS: "analyzing"
      }
    }
  }
})

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import type { ProjectState } from "@/types/generated/tauri-bindings"

interface AIIntelligenceContextType {
  actor: Actor<typeof aiIntelligenceMachine> | null
  isConnected: boolean
  error: string | null
}

const AIIntelligenceContext = createContext<AIIntelligenceContextType | null>(null)

interface AIIntelligenceProviderProps {
  children: ReactNode
}

/**
 * AI Intelligence Provider с интеграцией BackendSync
 *
 * Синхронизирует состояние AI анализа с backend через BackendSync
 */
export function AIIntelligenceProvider({ children }: AIIntelligenceProviderProps) {
  const [actor, setActor] = useState<Actor<typeof aiIntelligenceMachine> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initializedRef = useRef(false)
  const backendSync = getBackendSync()

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true

      // Создаем актор машины
      const newActor = createActor(aiIntelligenceMachine)

      // Подписываемся на события актора для синхронизации с backend
      newActor.subscribe((snapshot) => {
        // Синхронизируем ключевые события с backend
        if (snapshot.event) {
          switch (snapshot.event.type) {
            case "START_ANALYSIS":
              // Отправляем команду начала анализа на backend
              backendSync
                .executeCommand({
                  type: "AI",
                  params: {
                    type: "StartContentAnalysis",
                    params: {
                      mediaFiles: snapshot.event.mediaFiles,
                      config: snapshot.event.config,
                    },
                  },
                })
                .catch((err) => {
                  console.error("[AIIntelligence] Failed to sync START_ANALYSIS:", err)
                  setError(err.message)
                })
              break

            case "ANALYSIS_COMPLETE":
              // Сохраняем результаты анализа в backend
              backendSync
                .executeCommand({
                  type: "AI",
                  params: {
                    type: "SaveAnalysisResults",
                    params: {
                      analysis: snapshot.event.analysis,
                    },
                  },
                })
                .catch((err) => {
                  console.error("[AIIntelligence] Failed to sync ANALYSIS_COMPLETE:", err)
                  setError(err.message)
                })
              break

            case "SCRIPT_GENERATED":
              // Сохраняем сгенерированный скрипт
              backendSync
                .executeCommand({
                  type: "AI",
                  params: {
                    type: "SaveGeneratedScript",
                    params: {
                      script: snapshot.event.script,
                    },
                  },
                })
                .catch((err) => {
                  console.error("[AIIntelligence] Failed to sync SCRIPT_GENERATED:", err)
                  setError(err.message)
                })
              break

            case "PLATFORM_ADAPTATION_COMPLETE":
              // Сохраняем адаптированный контент
              backendSync
                .executeCommand({
                  type: "AI",
                  params: {
                    type: "SaveAdaptedContent",
                    params: {
                      content: snapshot.event.content,
                    },
                  },
                })
                .catch((err) => {
                  console.error("[AIIntelligence] Failed to sync PLATFORM_ADAPTATION_COMPLETE:", err)
                  setError(err.message)
                })
              break
          }
        }
      })

      newActor.start()
      setActor(newActor)

      // Подписываемся на изменения backend состояния
      const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
        setIsConnected(true)

        // Синхронизируем состояние AI анализа из backend
        if (state.ai_state) {
          // Обновляем состояние машины на основе backend
          if (state.ai_state.analysis_results) {
            newActor.send({
              type: "ANALYSIS_COMPLETE",
              analysis: state.ai_state.analysis_results,
            })
          }

          if (state.ai_state.generated_scripts) {
            newActor.send({
              type: "SCRIPT_GENERATED",
              script: state.ai_state.generated_scripts,
            })
          }

          if (state.ai_state.adapted_content) {
            newActor.send({
              type: "PLATFORM_ADAPTATION_COMPLETE",
              content: state.ai_state.adapted_content,
            })
          }
        }
      })

      // Подписываемся на события backend
      const unsubscribeEvents = backendSync.onEvent((event) => {
        if (event.type === "AI_ANALYSIS_PROGRESS") {
          newActor.send({
            type: "UPDATE_PROGRESS",
            step: event.data.step,
            progress: event.data.progress,
          })
        }
      })

      return () => {
        newActor.stop()
        unsubscribe()
        unsubscribeEvents()
      }
    }
  }, [backendSync])

  const contextValue = useMemo(() => ({ actor, isConnected, error }), [actor, isConnected, error])

  return <AIIntelligenceContext.Provider value={contextValue}>{children}</AIIntelligenceContext.Provider>
}

export function useAIIntelligence() {
  const context = useContext(AIIntelligenceContext)
  if (!context) {
    throw new Error("useAIIntelligence must be used within AIIntelligenceProvider")
  }
  return context
}

export { AIIntelligenceContext }
