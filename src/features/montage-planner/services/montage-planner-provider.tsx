/**
 * Provider for Smart Montage Planner with BackendSync integration
 * Simplified provider that works with the new BackendSync architecture
 */

import { listen } from "@tauri-apps/api/event"
import { useActor } from "@xstate/react"
import { createContext, useContext, useEffect, useState } from "react"
import { type MontagePlannerEvent, montagePlannerMachine } from "@/domains/ai-services/machines/montage-planner-machine"
import { createLogger } from "@/lib/tauri-logger"
import { useAppSettings } from "../../app-state"

const logger = createLogger("MontagePlannerProvider")

// Context type
interface MontagePlannerContextType {
  state: any // XState machine state
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
  // Connection status
  isConnected: boolean
  error: string | null
}

// Create context
const MontagePlannerContext = createContext<MontagePlannerContextType | null>(null)

// Provider component
interface MontagePlannerProviderProps {
  children: any
}

/**
 * Montage Planner Provider с интеграцией BackendSync
 *
 * Упрощенный провайдер который работает с новой архитектурой BackendSync
 */
export function MontagePlannerProvider({ children }: MontagePlannerProviderProps) {
  const [state, send] = useActor(montagePlannerMachine, {})
  const [error, setError] = useState<string | null>(null)
  const { connectionError } = useAppSettings()

  // Listen for Tauri events from montage planner
  useEffect(() => {
    let unsubscribeProgress: (() => void) | null = null
    let unsubscribeVideoAnalyzed: (() => void) | null = null
    let unsubscribeAudioAnalyzed: (() => void) | null = null
    let unsubscribeFragments: (() => void) | null = null
    let unsubscribeMoments: (() => void) | null = null

    // Set up event listeners
    const setupListeners = async () => {
      try {
        // Progress updates
        unsubscribeProgress = await listen<any>("montage-analysis-progress", (event) => {
          send({ type: "ANALYSIS_PROGRESS", progress: event.payload })
        })

        // Video analysis results
        unsubscribeVideoAnalyzed = await listen<{ videoId: string; analysis: any }>(
          "montage-video-analyzed",
          (event) => {
            send({
              type: "VIDEO_ANALYZED",
              videoId: event.payload.videoId,
              analysis: event.payload.analysis,
            })
          },
        )

        // Audio analysis results
        unsubscribeAudioAnalyzed = await listen<{ videoId: string; analysis: any }>(
          "montage-audio-analyzed",
          (event) => {
            send({
              type: "AUDIO_ANALYZED",
              videoId: event.payload.videoId,
              analysis: event.payload.analysis,
            })
          },
        )

        // Fragment detection results
        unsubscribeFragments = await listen<{ fragments: any[] }>("montage-fragments-detected", (event) => {
          send({
            type: "FRAGMENTS_DETECTED",
            fragments: event.payload.fragments,
          })
        })

        // Moment scoring results
        unsubscribeMoments = await listen<{ scores: any[] }>("montage-moments-scored", (event) => {
          send({
            type: "MOMENTS_SCORED",
            scores: event.payload.scores,
          })
        })
      } catch (err) {
        void logger.error("Failed to setup event listeners", { error: String(err) })
        setError(err instanceof Error ? err.message : "Failed to setup event listeners")
      }
    }

    void setupListeners()

    // Cleanup
    return () => {
      const safeUnlisten = (fn: (() => void) | null) => {
        try {
          fn?.()
        } catch {
          // Ignore unlisten errors
        }
      }
      safeUnlisten(unsubscribeProgress)
      safeUnlisten(unsubscribeVideoAnalyzed)
      safeUnlisten(unsubscribeAudioAnalyzed)
      safeUnlisten(unsubscribeFragments)
      safeUnlisten(unsubscribeMoments)
    }
  }, [send])

  // Derived state
  const context = (state?.context as any) || {}
  const isAnalyzing = Boolean(context.isAnalyzing)
  const isGenerating = Boolean(context.isGenerating)
  const isOptimizing = Boolean(context.isOptimizing)
  const hasVideos = Boolean(context.videoIds?.length)
  const hasFragments = Boolean(context.fragments?.length)
  const hasPlan = Boolean(context.currentPlan)
  const canGeneratePlan = hasFragments && !isAnalyzing && !isGenerating && !isOptimizing
  const canOptimizePlan = hasPlan && !isAnalyzing && !isGenerating && !isOptimizing
  const progress = Number(context.progress?.progress) || 0
  const progressMessage = context.progress?.message || getProgressMessage(context.progress?.phase || "idle")
  const isConnected = !connectionError

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
    error: error || connectionError,
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
    idle: "Ready",
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
