/**
 * Provider for Smart Montage Planner
 * Manages the XState machine and provides context to child components
 */

import { listen } from "@tauri-apps/api/event"
import { useActor } from "@xstate/react"
import type React from "react"
import { createContext, useContext, useEffect } from "react"
import type { AnalysisProgress } from "../types"
import { type MontagePlannerEvent, montagePlannerMachine } from "./montage-planner-machine"

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
}

// Create context
const MontagePlannerContext = createContext<MontagePlannerContextType | null>(null)

// Provider component
interface MontagePlannerProviderProps {
  children: React.ReactNode
}

export function MontagePlannerProvider({ children }: MontagePlannerProviderProps) {
  const [state, send] = useActor(montagePlannerMachine)

  // Listen for Tauri events
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
      })

      // Video analysis results
      unsubscribeVideoAnalyzed = await listen<{ videoId: string; analysis: any }>("montage-video-analyzed", (event) => {
        send({
          type: "VIDEO_ANALYZED",
          videoId: event.payload.videoId,
          analysis: event.payload.analysis,
        })
      })

      // Audio analysis results
      unsubscribeAudioAnalyzed = await listen<{ videoId: string; analysis: any }>("montage-audio-analyzed", (event) => {
        send({
          type: "AUDIO_ANALYZED",
          videoId: event.payload.videoId,
          analysis: event.payload.analysis,
        })
      })

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
    }

    void setupListeners()

    // Cleanup
    return () => {
      unsubscribeProgress?.()
      unsubscribeVideoAnalyzed?.()
      unsubscribeAudioAnalyzed?.()
      unsubscribeFragments?.()
      unsubscribeMoments?.()
    }
  }, [send])

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
