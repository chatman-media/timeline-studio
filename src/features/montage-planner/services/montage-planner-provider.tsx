/**
 * Provider for Smart Montage Planner with BackendSync integration
 * Manages the XState machine and provides context to child components
 */

import { listen } from "@tauri-apps/api/event"
import { useActor } from "@xstate/react"
import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import type { ProjectState } from "@/types/generated/tauri-bindings"
import type { AnalysisProgress, MontagePlan } from "../types"
import { type MontagePlannerEvent, montagePlannerMachine } from "@/domains/ai-services/machines/montage-planner-machine"

// Context type
interface MontagePlannerContextType {
  state: ReturnType<typeof montagePlannerMachine>["resolveState"]
  send: (event: MontagePlannerEvent) => void
  // Derived state helpers
  isAnalyzing: boolean
  isGenerating: boolean
  isOptimizing: boolean
  hasVideos: boolean
  hasFragments: boolean
  hasPlan: boolean
  canGeneratePlan: boolean
  canOptimizePlan: boolean
  progress: number
  progressMessage: string
  // BackendSync status
  isConnected: boolean
  error: string | null
}

// Create context
const MontagePlannerContext = createContext<MontagePlannerContextType | null>(null)

// Provider component
interface MontagePlannerProviderProps {
  children: React.ReactNode
}

/**
 * Montage Planner Provider с интеграцией BackendSync
 * 
 * Синхронизирует состояние планировщика монтажа с backend
 */
export function MontagePlannerProvider({ children }: MontagePlannerProviderProps) {
  const [state, send] = useActor(montagePlannerMachine)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const backendSync = getBackendSync()

  // Listen for Tauri events and sync with backend
  useEffect(() => {
    let unsubscribeProgress: (() => void) | null = null
    let unsubscribeVideoAnalyzed: (() => void) | null = null
    let unsubscribeAudioAnalyzed: (() => void) | null = null
    let unsubscribeFragments: (() => void) | null = null
    let unsubscribeMoments: (() => void) | null = null

    // Set up event listeners
    const setupListeners = async () => {
      // Progress updates
      unsubscribeProgress = await listen<AnalysisProgress>("montage-analysis-progress", (event) => {
        send({ type: "ANALYSIS_PROGRESS", progress: event.payload })
        
        // Синхронизируем прогресс с backend
        backendSync.executeCommand({
          type: "AI",
          params: {
            type: "UpdateMontageProgress",
            params: {
              progress: event.payload,
            },
          },
        }).catch((err) => {
          console.error("[MontagePlanner] Failed to sync progress:", err)
          setError(err.message)
        })
      })

      // Video analysis results
      unsubscribeVideoAnalyzed = await listen<{ videoId: string; analysis: any }>("montage-video-analyzed", (event) => {
        send({
          type: "VIDEO_ANALYZED",
          videoId: event.payload.videoId,
          analysis: event.payload.analysis,
        })
        
        // Сохраняем анализ видео в backend
        backendSync.executeCommand({
          type: "AI",
          params: {
            type: "SaveVideoAnalysis",
            params: {
              videoId: event.payload.videoId,
              analysis: event.payload.analysis,
            },
          },
        }).catch((err) => {
          console.error("[MontagePlanner] Failed to save video analysis:", err)
          setError(err.message)
        })
      })

      // Audio analysis results
      unsubscribeAudioAnalyzed = await listen<{ videoId: string; analysis: any }>("montage-audio-analyzed", (event) => {
        send({
          type: "AUDIO_ANALYZED",
          videoId: event.payload.videoId,
          analysis: event.payload.analysis,
        })
        
        // Сохраняем анализ аудио в backend
        backendSync.executeCommand({
          type: "AI",
          params: {
            type: "SaveAudioAnalysis",
            params: {
              videoId: event.payload.videoId,
              analysis: event.payload.analysis,
            },
          },
        }).catch((err) => {
          console.error("[MontagePlanner] Failed to save audio analysis:", err)
          setError(err.message)
        })
      })

      // Fragment detection results
      unsubscribeFragments = await listen<{ fragments: any[] }>("montage-fragments-detected", (event) => {
        send({
          type: "FRAGMENTS_DETECTED",
          fragments: event.payload.fragments,
        })
        
        // Сохраняем фрагменты в backend
        backendSync.executeCommand({
          type: "AI",
          params: {
            type: "SaveDetectedFragments",
            params: {
              fragments: event.payload.fragments,
            },
          },
        }).catch((err) => {
          console.error("[MontagePlanner] Failed to save fragments:", err)
          setError(err.message)
        })
      })

      // Moment scoring results
      unsubscribeMoments = await listen<{ scores: any[] }>("montage-moments-scored", (event) => {
        send({
          type: "MOMENTS_SCORED",
          scores: event.payload.scores,
        })
        
        // Сохраняем оценки моментов в backend
        backendSync.executeCommand({
          type: "AI",
          params: {
            type: "SaveMomentScores",
            params: {
              scores: event.payload.scores,
            },
          },
        }).catch((err) => {
          console.error("[MontagePlanner] Failed to save moment scores:", err)
          setError(err.message)
        })
      })
    }

    void setupListeners()

    // Подписываемся на изменения backend состояния
    const unsubscribeBackend = backendSync.onStateChange((state: ProjectState) => {
      setIsConnected(true)
      
      // Синхронизируем состояние монтажного планировщика из backend
      if (state.montage_state) {
        // Восстанавливаем анализы видео
        if (state.montage_state.video_analyses) {
          Object.entries(state.montage_state.video_analyses).forEach(([videoId, analysis]) => {
            send({
              type: "VIDEO_ANALYZED",
              videoId,
              analysis,
            })
          })
        }
        
        // Восстанавливаем анализы аудио
        if (state.montage_state.audio_analyses) {
          Object.entries(state.montage_state.audio_analyses).forEach(([videoId, analysis]) => {
            send({
              type: "AUDIO_ANALYZED", 
              videoId,
              analysis,
            })
          })
        }
        
        // Восстанавливаем фрагменты
        if (state.montage_state.fragments) {
          send({
            type: "FRAGMENTS_DETECTED",
            fragments: state.montage_state.fragments,
          })
        }
        
        // Восстанавливаем план монтажа
        if (state.montage_state.current_plan) {
          send({
            type: "PLAN_GENERATED",
            plan: state.montage_state.current_plan as MontagePlan,
          })
        }
      }
    })

    // Подписываемся на события backend
    const unsubscribeEvents = backendSync.onEvent((event) => {
      if (event.type === "MONTAGE_ANALYSIS_STARTED") {
        send({ type: "START_ANALYSIS" })
      } else if (event.type === "MONTAGE_PLAN_REQUESTED") {
        send({ type: "GENERATE_PLAN" })
      }
    })

    // Cleanup
    return () => {
      unsubscribeProgress?.()
      unsubscribeVideoAnalyzed?.()
      unsubscribeAudioAnalyzed?.()
      unsubscribeFragments?.()
      unsubscribeMoments?.()
      unsubscribeBackend()
      unsubscribeEvents()
    }
  }, [send, backendSync])

  // Синхронизация команд с backend
  useEffect(() => {
    // Подписываемся на события актора для синхронизации с backend
    const subscription = state.subscribe((snapshot) => {
      if (snapshot.event) {
        switch (snapshot.event.type) {
          case "START_ANALYSIS":
            // Запускаем анализ на backend
            backendSync.executeCommand({
              type: "AI",
              params: {
                type: "StartMontageAnalysis",
                params: {
                  videoIds: snapshot.context.videoIds,
                  mediaFiles: Array.from(snapshot.context.mediaFiles.entries()),
                  instructions: snapshot.context.instructions,
                  options: snapshot.context.analysisOptions,
                },
              },
            }).catch((err) => {
              console.error("[MontagePlanner] Failed to start analysis:", err)
              setError(err.message)
            })
            break
            
          case "GENERATE_PLAN":
            // Генерируем план на backend
            backendSync.executeCommand({
              type: "AI",
              params: {
                type: "GenerateMontagePlan",
                params: {
                  fragments: snapshot.context.fragments,
                  instructions: snapshot.context.instructions,
                  style: snapshot.context.selectedStyle,
                  targetDuration: snapshot.context.targetDuration,
                  options: snapshot.context.generationOptions,
                },
              },
            }).catch((err) => {
              console.error("[MontagePlanner] Failed to generate plan:", err)
              setError(err.message)
            })
            break
            
          case "OPTIMIZE_PLAN":
            // Оптимизируем план на backend
            backendSync.executeCommand({
              type: "AI",
              params: {
                type: "OptimizeMontagePlan",
                params: {
                  plan: snapshot.context.currentPlan,
                  options: snapshot.context.generationOptions,
                },
              },
            }).catch((err) => {
              console.error("[MontagePlanner] Failed to optimize plan:", err)
              setError(err.message)
            })
            break
        }
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [state, backendSync])

  // Derived state
  const context = state?.context || {}
  const isAnalyzing = context.isAnalyzing
  const isGenerating = context.isGenerating
  const isOptimizing = context.isOptimizing
  const hasVideos = context.videoIds.length > 0
  const hasFragments = context.fragments.length > 0
  const hasPlan = context.currentPlan !== null
  const canGeneratePlan = hasFragments && !isAnalyzing && !isGenerating && !isOptimizing
  const canOptimizePlan = hasPlan && !isAnalyzing && !isGenerating && !isOptimizing
  const progress = context.progress.progress
  const progressMessage = context.progress.message || getProgressMessage(context.progress.phase)

  // Context value
  const value: MontagePlannerContextType = {
    state,
    send,
    isAnalyzing,
    isGenerating,
    isOptimizing,
    hasVideos,
    hasFragments,
    hasPlan,
    canGeneratePlan,
    canOptimizePlan,
    progress,
    progressMessage,
    isConnected,
    error,
  }

  return <MontagePlannerContext.Provider value={value}>{children}</MontagePlannerContext.Provider>
}

// Hook to use the context
export function useMontagePlanner() {
  const context = useContext(MontagePlannerContext)
  if (!context) {
    throw new Error("useMontagePlanner must be used within MontagePlannerProvider")
  }
  return context
}

// Helper to get progress message based on phase
function getProgressMessage(phase: string): string {
  const messages: Record<string, string> = {
    initializing: "Initializing analysis...",
    extracting_frames: "Extracting key frames...",
    analyzing_video: "Analyzing video content...",
    analyzing_audio: "Analyzing audio...",
    detecting_moments: "Detecting key moments...",
    generating_plan: "Generating montage plan...",
    optimizing_plan: "Optimizing plan...",
    complete: "Analysis complete!",
  }
  return messages[phase] || "Processing..."
}