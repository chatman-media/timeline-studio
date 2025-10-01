/**
 * XState machine for Smart Montage Planner - AI Services Domain
 * Manages the state of video analysis, plan generation, and optimization
 *
 * Перенесено из src/features/montage-planner/services/montage-planner-machine.ts
 */

import { invoke } from "@tauri-apps/api/core"
import { assign, fromPromise, setup } from "xstate"

// Import types from domain
import type {
  AnalysisOptions,
  AnalysisProgress,
  AudioAnalysis,
  Fragment,
  MediaFile,
  MomentScore,
  MontagePlan,
  PlanGenerationOptions,
  PlanStatistics,
  PlanValidation,
  VideoAnalysis,
} from "../types/montage-planner"

// Import enum as value (not type)
import { AnalysisPhase } from "../types/montage-planner"

// Machine context
export interface MontagePlannerContext {
  // Input data
  videoIds: string[]
  mediaFiles: Map<string, MediaFile>
  instructions: string
  selectedStyle: string
  targetDuration?: number
  analysisOptions: AnalysisOptions
  generationOptions: PlanGenerationOptions

  // Analysis results
  videoAnalyses: Map<string, VideoAnalysis>
  audioAnalyses: Map<string, AudioAnalysis>
  fragments: Fragment[]
  momentScores: MomentScore[]

  // Generated plan
  currentPlan: MontagePlan | null
  planHistory: MontagePlan[]
  planStatistics: PlanStatistics | null
  planValidation: PlanValidation | null

  // Progress and state
  progress: AnalysisProgress
  isAnalyzing: boolean
  isGenerating: boolean
  isOptimizing: boolean
  error: string | null
}

// Machine events
export type MontagePlannerEvent =
  | { type: "ADD_VIDEO"; videoId: string; file: MediaFile }
  | { type: "REMOVE_VIDEO"; videoId: string }
  | { type: "UPDATE_INSTRUCTIONS"; instructions: string }
  | { type: "SELECT_STYLE"; styleId: string }
  | { type: "SET_TARGET_DURATION"; duration: number }
  | { type: "UPDATE_ANALYSIS_OPTIONS"; options: Partial<AnalysisOptions> }
  | { type: "UPDATE_GENERATION_OPTIONS"; options: Partial<PlanGenerationOptions> }
  | { type: "START_ANALYSIS" }
  | { type: "CANCEL_ANALYSIS" }
  | { type: "ANALYSIS_PROGRESS"; progress: AnalysisProgress }
  | { type: "VIDEO_ANALYZED"; videoId: string; analysis: VideoAnalysis }
  | { type: "AUDIO_ANALYZED"; videoId: string; analysis: AudioAnalysis }
  | { type: "FRAGMENTS_DETECTED"; fragments: Fragment[] }
  | { type: "MOMENTS_SCORED"; scores: MomentScore[] }
  | { type: "ANALYSIS_COMPLETE"; fragments: Fragment[]; videoAnalysis: any; audioAnalysis: any }
  | { type: "GENERATE_PLAN" }
  | { type: "PLAN_GENERATED"; plan: MontagePlan }
  | { type: "GENERATION_COMPLETE"; plan: MontagePlan }
  | { type: "OPTIMIZE_PLAN" }
  | { type: "PLAN_OPTIMIZED"; plan: MontagePlan }
  | { type: "OPTIMIZATION_COMPLETE"; plan: MontagePlan }
  | { type: "VALIDATE_PLAN" }
  | { type: "PLAN_VALIDATED"; validation: PlanValidation }
  | { type: "VALIDATION_COMPLETE"; validation: PlanValidation }
  | { type: "CALCULATE_STATISTICS" }
  | { type: "STATISTICS_CALCULATED"; statistics: PlanStatistics }
  | { type: "APPLY_PLAN_TO_TIMELINE" }
  | { type: "EXPORT_PLAN"; format: string }
  | { type: "EDIT_FRAGMENT"; fragmentId: string; updates: Partial<Fragment> }
  | { type: "REORDER_FRAGMENTS"; sourceIndex: number; targetIndex: number }
  | { type: "ERROR"; message: string }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET" }

// Machine definition
export const montagePlannerMachine = setup({
  types: {
    context: {} as MontagePlannerContext,
    events: {} as MontagePlannerEvent,
  },
  actions: {
    // Input management
    addVideo: assign({
      videoIds: ({ context, event }) => {
        if (event.type !== "ADD_VIDEO") return context.videoIds
        if (context.videoIds.includes(event.videoId)) return context.videoIds
        return [...context.videoIds, event.videoId]
      },
      mediaFiles: ({ context, event }) => {
        if (event.type !== "ADD_VIDEO") return context.mediaFiles
        if (context.mediaFiles.has(event.videoId)) return context.mediaFiles
        const newMap = new Map(context.mediaFiles)
        newMap.set(event.videoId, event.file)
        return newMap
      },
    }),

    removeVideo: assign({
      videoIds: ({ context, event }) => {
        if (event.type !== "REMOVE_VIDEO") return context.videoIds
        return context.videoIds.filter((id: string) => id !== event.videoId)
      },
      mediaFiles: ({ context, event }) => {
        if (event.type !== "REMOVE_VIDEO") return context.mediaFiles
        const newMap = new Map(context.mediaFiles)
        newMap.delete(event.videoId)
        return newMap
      },
    }),

    updateInstructions: assign({
      instructions: ({ event }) => (event.type === "UPDATE_INSTRUCTIONS" ? event.instructions : ""),
    }),

    selectStyle: assign({
      selectedStyle: ({ event }) => (event.type === "SELECT_STYLE" ? event.styleId : ""),
    }),

    setTargetDuration: assign({
      targetDuration: ({ event }) => (event.type === "SET_TARGET_DURATION" ? event.duration : undefined),
    }),

    updateAnalysisOptions: assign({
      analysisOptions: ({ context, event }) => {
        if (event.type !== "UPDATE_ANALYSIS_OPTIONS") return context.analysisOptions
        return { ...context.analysisOptions, ...event.options }
      },
    }),

    updateGenerationOptions: assign({
      generationOptions: ({ context, event }) => {
        if (event.type !== "UPDATE_GENERATION_OPTIONS") return context.generationOptions
        return { ...context.generationOptions, ...event.options }
      },
    }),

    // Analysis actions
    startAnalysis: assign({
      isAnalyzing: true,
      error: null,
      progress: {
        phase: AnalysisPhase.INITIALIZATION,
        videoProgress: new Map(),
        overallProgress: 0,
      },
    }),

    stopAnalysis: assign({
      isAnalyzing: false,
    }),

    updateProgress: assign({
      progress: ({ event }) =>
        event.type === "ANALYSIS_PROGRESS"
          ? event.progress
          : {
              phase: AnalysisPhase.INITIALIZATION,
              videoProgress: new Map(),
              overallProgress: 0,
            },
    }),

    storeVideoAnalysis: assign({
      videoAnalyses: ({ context, event }) => {
        if (event.type !== "VIDEO_ANALYZED") return context.videoAnalyses
        const newMap = new Map(context.videoAnalyses)
        newMap.set(event.videoId, event.analysis)
        return newMap
      },
    }),

    storeAudioAnalysis: assign({
      audioAnalyses: ({ context, event }) => {
        if (event.type !== "AUDIO_ANALYZED") return context.audioAnalyses
        const newMap = new Map(context.audioAnalyses)
        newMap.set(event.videoId, event.analysis)
        return newMap
      },
    }),

    storeFragments: assign({
      fragments: ({ event }) => (event.type === "FRAGMENTS_DETECTED" ? event.fragments : []),
    }),

    storeMomentScores: assign({
      momentScores: ({ event }) => (event.type === "MOMENTS_SCORED" ? event.scores : []),
    }),

    // Plan generation actions
    startGeneration: assign({
      isGenerating: true,
      error: null,
    }),

    stopGeneration: assign({
      isGenerating: false,
    }),

    storePlan: assign({
      currentPlan: ({ event }) =>
        event.type === "PLAN_GENERATED" ||
        event.type === "PLAN_OPTIMIZED" ||
        event.type === "GENERATION_COMPLETE" ||
        event.type === "OPTIMIZATION_COMPLETE"
          ? event.plan
          : null,
      planHistory: ({ context, event }) => {
        if (
          event.type === "PLAN_GENERATED" ||
          event.type === "PLAN_OPTIMIZED" ||
          event.type === "GENERATION_COMPLETE" ||
          event.type === "OPTIMIZATION_COMPLETE"
        ) {
          return [...context.planHistory, event.plan]
        }
        return context.planHistory
      },
    }),

    // Optimization actions
    startOptimization: assign({
      isOptimizing: true,
      error: null,
    }),

    stopOptimization: assign({
      isOptimizing: false,
    }),

    // Validation and statistics
    storeValidation: assign({
      planValidation: ({ event }) => (event.type === "PLAN_VALIDATED" ? event.validation : null),
    }),

    storeStatistics: assign({
      planStatistics: ({ event }) => (event.type === "STATISTICS_CALCULATED" ? event.statistics : null),
    }),

    // Fragment editing
    editFragment: assign({
      fragments: ({ context, event }) => {
        if (event.type !== "EDIT_FRAGMENT") return context.fragments
        return context.fragments.map((fragment: Fragment) =>
          fragment.id === event.fragmentId ? { ...fragment, ...event.updates } : fragment,
        )
      },
    }),

    reorderFragments: assign({
      fragments: ({ context, event }) => {
        if (event.type !== "REORDER_FRAGMENTS") return context.fragments
        const newFragments = [...context.fragments]
        const [removed] = newFragments.splice(event.sourceIndex, 1)
        newFragments.splice(event.targetIndex, 0, removed)
        return newFragments
      },
    }),

    // Error handling
    setError: assign({
      error: ({ event }) => (event.type === "ERROR" ? event.message : null),
    }),

    setInvokeError: assign({
      error: ({ event }) => {
        // Handle XState error events
        if (typeof event === "object" && event !== null && "error" in event) {
          return String((event as any).error || "Unknown invoke error")
        }
        return "Invoke error occurred"
      },
    }),

    clearError: assign({
      error: null,
    }),

    // Reset
    resetContext: assign({
      videoIds: [],
      mediaFiles: new Map(),
      instructions: "",
      selectedStyle: "dynamic-action",
      targetDuration: undefined,
      videoAnalyses: new Map(),
      audioAnalyses: new Map(),
      fragments: [],
      momentScores: [],
      currentPlan: null,
      planHistory: [],
      planStatistics: null,
      planValidation: null,
      progress: {
        phase: AnalysisPhase.INITIALIZATION,
        videoProgress: new Map(),
        overallProgress: 0,
      },
      isAnalyzing: false,
      isGenerating: false,
      isOptimizing: false,
      error: null,
    }),

    // Timeline integration actions
    applyPlanToTimeline: async ({ context }: { context: MontagePlannerContext }) => {
      console.log("[Montage Planner] Applying plan to timeline")
      if (context.currentPlan) {
        try {
          await invoke("apply_montage_plan", { plan: context.currentPlan })
        } catch (error) {
          console.error("[Montage Planner] Failed to apply plan:", error)
        }
      }
    },

    exportPlan: async ({ context, event }: { context: MontagePlannerContext; event: MontagePlannerEvent }) => {
      console.log("[Montage Planner] Exporting plan")
      if (context.currentPlan && event.type === "EXPORT_PLAN") {
        try {
          await invoke("export_montage_plan", {
            plan: context.currentPlan,
            format: event.format,
          })
        } catch (error) {
          console.error("[Montage Planner] Failed to export plan:", error)
        }
      }
    },
  },
  actors: {
    // Video analysis service
    analyzeVideos: fromPromise(
      async ({ input }: { input: { videoIds: string[]; analysisOptions: AnalysisOptions } }) => {
        return invoke("analyze_montage_videos", {
          videoIds: input.videoIds,
          options: input.analysisOptions,
        }).catch((error: unknown) => {
          throw new Error(`Video analysis failed: ${String(error)}`)
        })
      },
    ),

    // Plan generation service
    generatePlan: fromPromise(
      async ({ input }: { input: { fragments: Fragment[]; generationOptions: PlanGenerationOptions } }) => {
        return invoke("generate_montage_plan", {
          fragments: input.fragments,
          options: input.generationOptions,
        }).catch((error: unknown) => {
          throw new Error(`Plan generation failed: ${String(error)}`)
        })
      },
    ),

    // Plan optimization service
    optimizePlan: fromPromise(async ({ input }: { input: { plan: MontagePlan; preferences: any } }) => {
      return invoke("optimize_montage_plan", {
        plan: input.plan,
        preferences: input.preferences,
      }).catch((error: unknown) => {
        throw new Error(`Plan optimization failed: ${String(error)}`)
      })
    }),

    // Validation service
    validatePlan: fromPromise(async ({ input }: { input: { plan: MontagePlan } }) => {
      return invoke("validate_montage_plan", {
        plan: input.plan,
      }).catch((error: unknown) => {
        throw new Error(`Plan validation failed: ${String(error)}`)
      })
    }),

    // Statistics calculation
    calculateStatistics: fromPromise(async ({ input }: { input: { plan: MontagePlan } }) => {
      return invoke("calculate_plan_statistics", {
        plan: input.plan,
      }).catch((error: unknown) => {
        throw new Error(`Statistics calculation failed: ${String(error)}`)
      })
    }),
  },
}).createMachine({
  id: "ai-services-montage-planner",
  initial: "idle",
  context: {
    videoIds: [],
    mediaFiles: new Map(),
    instructions: "",
    selectedStyle: "dynamic-action",
    targetDuration: undefined,
    analysisOptions: {
      enableObjectDetection: true,
      enableFaceRecognition: true,
      enableAudioAnalysis: true,
      enableMotionAnalysis: true,
      enableSentimentAnalysis: false,
      qualityThreshold: 0.7,
      maxFragmentDuration: 30,
      minFragmentDuration: 1,
    },
    generationOptions: {
      targetDuration: undefined,
      style: "dynamic-action",
      musicSync: false,
      maxCuts: 100,
      prioritizeQuality: true,
      prioritizeMotion: false,
      prioritizeFaces: true,
      geneticAlgorithm: {
        populationSize: 50,
        generations: 100,
        mutationRate: 0.1,
        crossoverRate: 0.8,
      },
    },
    videoAnalyses: new Map(),
    audioAnalyses: new Map(),
    fragments: [],
    momentScores: [],
    currentPlan: null,
    planHistory: [],
    planStatistics: null,
    planValidation: null,
    progress: {
      phase: AnalysisPhase.INITIALIZATION,
      videoProgress: new Map(),
      overallProgress: 0,
    },
    isAnalyzing: false,
    isGenerating: false,
    isOptimizing: false,
    error: null,
  },
  states: {
    idle: {
      on: {
        ADD_VIDEO: {
          actions: ["addVideo"],
        },
        REMOVE_VIDEO: {
          actions: ["removeVideo"],
        },
        UPDATE_INSTRUCTIONS: {
          actions: ["updateInstructions"],
        },
        SELECT_STYLE: {
          actions: ["selectStyle"],
        },
        SET_TARGET_DURATION: {
          actions: ["setTargetDuration"],
        },
        UPDATE_ANALYSIS_OPTIONS: {
          actions: ["updateAnalysisOptions"],
        },
        UPDATE_GENERATION_OPTIONS: {
          actions: ["updateGenerationOptions"],
        },
        START_ANALYSIS: {
          target: "analyzing",
          guard: ({ context }) => context.videoIds.length > 0,
        },
        GENERATE_PLAN: {
          target: "generating",
          guard: ({ context }) => context.fragments.length > 0,
        },
        OPTIMIZE_PLAN: {
          target: "optimizing",
          guard: ({ context }) => context.currentPlan !== null,
        },
        EDIT_FRAGMENT: {
          actions: ["editFragment"],
        },
        REORDER_FRAGMENTS: {
          actions: ["reorderFragments"],
        },
        RESET: {
          actions: ["resetContext"],
        },
        CLEAR_ERROR: {
          actions: ["clearError"],
        },
        ERROR: {
          actions: ["setError"],
        },
      },
    },

    analyzing: {
      entry: ["startAnalysis"],
      exit: ["stopAnalysis"],
      invoke: {
        src: "analyzeVideos",
        input: ({ context }) => ({
          videoIds: context.videoIds,
          analysisOptions: context.analysisOptions,
        }),
        onDone: {
          target: "idle",
          actions: [
            assign({
              fragments: ({ event }) => {
                const output = event.output as any
                return output?.fragments || []
              },
              momentScores: ({ event }) => {
                const output = event.output as any
                return output?.momentScores || []
              },
            }),
          ],
        },
        onError: {
          target: "error",
          actions: ["setInvokeError"],
        },
      },
      on: {
        ANALYSIS_PROGRESS: {
          actions: ["updateProgress"],
        },
        VIDEO_ANALYZED: {
          actions: ["storeVideoAnalysis"],
        },
        AUDIO_ANALYZED: {
          actions: ["storeAudioAnalysis"],
        },
        FRAGMENTS_DETECTED: {
          actions: ["storeFragments"],
        },
        MOMENTS_SCORED: {
          actions: ["storeMomentScores"],
        },
        CANCEL_ANALYSIS: {
          target: "idle",
        },
      },
    },

    generating: {
      entry: "startGeneration",
      exit: "stopGeneration",
      invoke: {
        src: "generatePlan",
        input: ({ context }) => ({
          fragments: context.fragments,
          generationOptions: {
            ...context.generationOptions,
            style: context.selectedStyle,
            targetDuration: context.targetDuration,
          },
        }),
        onDone: {
          target: "validating",
          actions: ["storePlan"],
        },
        onError: {
          target: "error",
          actions: ["setInvokeError"],
        },
      },
    },

    validating: {
      entry: assign({
        planValidation: ({ context }) => ({
          isValid: context.currentPlan !== null,
          issues: [],
          suggestions: [],
          score: context.currentPlan ? 85 : 0,
          errors: [],
          warnings: [],
          quality: 0,
        }),
      }),
      always: {
        target: "calculating",
      },
    },

    calculating: {
      entry: assign({
        planStatistics: ({ context }) => ({
          totalClips: context.fragments.length,
          totalDuration: context.targetDuration || 0,
          averageClipLength:
            context.fragments.length > 0 ? (context.targetDuration || 0) / context.fragments.length : 0,
          transitionCount: Math.max(0, context.fragments.length - 1),
          complexity: context.fragments.length > 10 ? "high" : ("medium" as any),
          averageFragmentDuration: 0,
          fragmentCount: 0,
          averageQuality: 0,
          qualityDistribution: { low: 0, medium: 0, high: 0 },
          motionIntensity: 0,
          faceTime: 0,
          objectDiversity: 0,
          audioQuality: 0,
        }),
      }),
      always: {
        target: "ready",
      },
    },

    ready: {
      on: {
        OPTIMIZE_PLAN: {
          target: "optimizing",
        },
        APPLY_PLAN_TO_TIMELINE: {
          actions: "applyPlanToTimeline",
        },
        EXPORT_PLAN: {
          actions: "exportPlan",
        },
        EDIT_FRAGMENT: {
          actions: ["editFragment"],
        },
        REORDER_FRAGMENTS: {
          actions: ["reorderFragments"],
        },
        GENERATE_PLAN: {
          target: "generating",
        },
        START_ANALYSIS: {
          target: "analyzing",
        },
        RESET: {
          target: "idle",
          actions: ["resetContext"],
        },
        CLEAR_ERROR: {
          actions: ["clearError"],
        },
        ERROR: {
          actions: ["setError"],
        },
      },
    },

    optimizing: {
      entry: [
        "startOptimization",
        assign({
          currentPlan: ({ context }) => {
            if (!context.currentPlan) return null
            // Simple optimization - improve timing and transitions
            const optimizedPlan = {
              ...context.currentPlan,
              optimized: true,
            }
            return optimizedPlan
          },
        }),
      ],
      exit: "stopOptimization",
      always: {
        target: "validating",
      },
    },

    error: {
      on: {
        CLEAR_ERROR: {
          target: "idle",
          actions: ["clearError"],
        },
        RESET: {
          target: "idle",
          actions: ["resetContext"],
        },
      },
    },
  },
})

/**
 * Тип машины состояний montage planner
 */
export type MontagePlannerMachine = typeof montagePlannerMachine
