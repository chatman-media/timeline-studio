/**
 * AI Director XState Machine
 * Управляет состоянием AI Director системы анализа
 */

import { invoke } from "@tauri-apps/api/core"
import { assign, fromPromise, setup } from "xstate"
import type {
  AIDirectorConfig,
  AIDirectorEvent,
  AnalysisError,
  AnalysisProgress,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  HealthCheckResult,
  SystemCapabilities,
} from "../types/ai-director"

// Machine context
interface AIDirectorContext {
  // Configuration
  config: AIDirectorConfig | null
  capabilities: SystemCapabilities | null
  health: HealthCheckResult | null

  // Current analysis
  currentAnalysis: ComprehensiveAnalysisResult | null
  analysisProgress: AnalysisProgress | null

  // Results history
  results: ComprehensiveAnalysisResult[]

  // Error handling
  errors: AnalysisError[]

  // UI state
  isLoading: boolean
  autoRefresh: boolean
  lastUpdate: string | null
}

// Default context
const defaultContext: AIDirectorContext = {
  config: null,
  capabilities: null,
  health: null,
  currentAnalysis: null,
  analysisProgress: null,
  results: [],
  errors: [],
  isLoading: false,
  autoRefresh: true,
  lastUpdate: null,
}

// Machine definition
export const aiDirectorMachine = setup({
  types: {
    context: {} as AIDirectorContext,
    events: {} as AIDirectorEvent,
  },
  actions: {
    // Loading states
    setLoading: assign({
      isLoading: true,
    }),

    setLoaded: assign({
      isLoading: false,
      lastUpdate: () => new Date().toISOString(),
    }),

    // Data updates
    updateCapabilities: assign({
      capabilities: ({ event }) => {
        if (event.type === "GET_CAPABILITIES") {
          // Will be updated by service call
          return null
        }
        return null
      },
    }),

    updateHealth: assign({
      health: ({ event }) => {
        if (event.type === "HEALTH_CHECK") {
          // Will be updated by service call
          return null
        }
        return null
      },
    }),

    updateConfig: assign({
      config: ({ context, event }) => {
        if (event.type === "GET_DEFAULT_CONFIG") {
          // Will be updated by service call
          return context.config
        }
        return context.config
      },
    }),

    setCurrentAnalysis: assign({
      currentAnalysis: ({ event }) => {
        // Handle ANALYSIS_COMPLETED event
        if (event.type === "ANALYSIS_COMPLETED") {
          return event.result
        }
        // Handle xstate.done.actor.* events (from invoke onDone)
        if ("output" in event) {
          return event.output as ComprehensiveAnalysisResult
        }
        return null
      },
    }),

    updateProgress: assign({
      analysisProgress: ({ event }) => {
        if (event.type === "ANALYSIS_PROGRESS") {
          return event.progress
        }
        return null
      },
    }),

    addResult: assign({
      results: ({ context, event }) => {
        // Handle ANALYSIS_COMPLETED event
        if (event.type === "ANALYSIS_COMPLETED") {
          return [...context.results, event.result]
        }
        // Handle xstate.done.actor.* events (from invoke onDone)
        if ("output" in event) {
          return [...context.results, event.output as ComprehensiveAnalysisResult]
        }
        return context.results
      },
    }),

    // Error handling
    addError: assign({
      errors: ({ context, event }) => {
        if (event.type === "ANALYSIS_ERROR") {
          return [...context.errors, event.error]
        }
        return context.errors
      },
    }),

    clearErrors: assign({
      errors: [],
    }),

    clearResults: assign({
      results: [],
      currentAnalysis: null,
      analysisProgress: null,
    }),

    setAutoRefresh: assign({
      autoRefresh: ({ event }) => {
        if (event.type === "SET_AUTO_REFRESH") {
          return event.enabled
        }
        return true
      },
    }),
  },

  actors: {
    // Get system capabilities
    getCapabilities: fromPromise(async (): Promise<SystemCapabilities> => {
      const result = await invoke<SystemCapabilities>("ai_director_get_capabilities")
      return result
    }),

    // Health check
    healthCheck: fromPromise(async (): Promise<HealthCheckResult> => {
      const result = await invoke<HealthCheckResult>("ai_director_health_check")
      return result
    }),

    // Get default config
    getDefaultConfig: fromPromise(async ({ input }: { input: { mode: string } }): Promise<AIDirectorConfig> => {
      const result = await invoke<AIDirectorConfig>("ai_director_get_default_config", {
        mode: input.mode,
      })
      return result
    }),

    // Validate config
    validateConfig: fromPromise(
      async ({ input }: { input: { config: AIDirectorConfig } }): Promise<ConfigValidationResult> => {
        const result = await invoke<ConfigValidationResult>("ai_director_validate_config", {
          config: input.config,
        })
        return result
      },
    ),

    // Start comprehensive analysis
    startComprehensiveAnalysis: fromPromise(
      async ({
        input,
      }: {
        input: { videoPath: string; config?: AIDirectorConfig }
      }): Promise<ComprehensiveAnalysisResult> => {
        const result = await invoke<ComprehensiveAnalysisResult>("ai_director_analyze_comprehensive", {
          videoPath: input.videoPath,
          config: input.config,
        })
        return result
      },
    ),

    // Start quick analysis
    startQuickAnalysis: fromPromise(
      async ({ input }: { input: { videoPath: string } }): Promise<ComprehensiveAnalysisResult> => {
        const result = await invoke<ComprehensiveAnalysisResult>("ai_director_analyze_quick", {
          videoPath: input.videoPath,
        })
        return result
      },
    ),

    // Start batch analysis
    startBatchAnalysis: fromPromise(
      async ({
        input,
      }: {
        input: { filePaths: string[]; config?: AIDirectorConfig }
      }): Promise<ComprehensiveAnalysisResult[]> => {
        const result = await invoke<ComprehensiveAnalysisResult[]>("ai_director_analyze_batch", {
          filePaths: input.filePaths,
          config: input.config,
        })
        return result
      },
    ),
  },
}).createMachine({
  id: "ai-director",
  initial: "loading",
  context: defaultContext,

  states: {
    loading: {
      entry: "setLoading",
      invoke: {
        src: "getCapabilities",
        onDone: {
          target: "idle",
          actions: [
            "setLoaded",
            assign({
              capabilities: ({ event }) => event.output,
            }),
          ],
        },
        onError: {
          target: "error",
          actions: [
            "setLoaded",
            assign({
              errors: ({ event }) => [
                {
                  analysisId: "system",
                  stage: "initialization",
                  error: String(event.error),
                },
              ],
            }),
          ],
        },
      },
    },

    idle: {
      entry: "setLoaded",
      on: {
        START_COMPREHENSIVE_ANALYSIS: {
          target: "analyzing",
        },
        START_QUICK_ANALYSIS: {
          target: "quickAnalyzing",
        },
        START_BATCH_ANALYSIS: {
          target: "batchAnalyzing",
        },
        GET_CAPABILITIES: {
          target: "gettingCapabilities",
        },
        GET_DEFAULT_CONFIG: {
          target: "gettingConfig",
        },
        VALIDATE_CONFIG: {
          target: "validatingConfig",
        },
        HEALTH_CHECK: {
          target: "healthChecking",
        },
        ANALYSIS_PROGRESS: {
          actions: "updateProgress",
        },
        ANALYSIS_ERROR: {
          actions: "addError",
        },
        ANALYSIS_COMPLETED: {
          actions: ["setCurrentAnalysis", "addResult"],
        },
        CLEAR_ERRORS: {
          actions: "clearErrors",
        },
        CLEAR_RESULTS: {
          actions: "clearResults",
        },
        SET_AUTO_REFRESH: {
          actions: "setAutoRefresh",
        },
        REFRESH_STATUS: {
          target: "refreshing",
        },
      },
    },

    analyzing: {
      entry: "setLoading",
      invoke: {
        src: "startComprehensiveAnalysis",
        input: ({ event }) => {
          if (event.type === "START_COMPREHENSIVE_ANALYSIS") {
            return {
              videoPath: event.videoPath,
              config: event.config,
            }
          }
          throw new Error("Invalid event type for analyzing state")
        },
        onDone: {
          target: "idle",
          actions: ["setLoaded", "setCurrentAnalysis", "addResult"],
        },
        onError: {
          target: "idle",
          actions: [
            "setLoaded",
            assign({
              errors: ({ context, event }) => [
                ...context.errors,
                {
                  analysisId: "unknown",
                  stage: "comprehensive_analysis",
                  error: String(event.error),
                },
              ],
            }),
          ],
        },
      },
    },

    quickAnalyzing: {
      entry: "setLoading",
      invoke: {
        src: "startQuickAnalysis",
        input: ({ event }) => {
          if (event.type === "START_QUICK_ANALYSIS") {
            return {
              videoPath: event.videoPath,
            }
          }
          throw new Error("Invalid event type for quickAnalyzing state")
        },
        onDone: {
          target: "idle",
          actions: ["setLoaded", "setCurrentAnalysis", "addResult"],
        },
        onError: {
          target: "idle",
          actions: [
            "setLoaded",
            assign({
              errors: ({ context, event }) => [
                ...context.errors,
                {
                  analysisId: "unknown",
                  stage: "quick_analysis",
                  error: String(event.error),
                },
              ],
            }),
          ],
        },
      },
    },

    batchAnalyzing: {
      entry: "setLoading",
      invoke: {
        src: "startBatchAnalysis",
        input: ({ event }) => {
          if (event.type === "START_BATCH_ANALYSIS") {
            return {
              filePaths: event.filePaths,
              config: event.config,
            }
          }
          throw new Error("Invalid event type for batchAnalyzing state")
        },
        onDone: {
          target: "idle",
          actions: [
            "setLoaded",
            assign({
              results: ({ context, event }) => [...context.results, ...event.output],
            }),
          ],
        },
        onError: {
          target: "idle",
          actions: [
            "setLoaded",
            assign({
              errors: ({ context, event }) => [
                ...context.errors,
                {
                  analysisId: "unknown",
                  stage: "batch_analysis",
                  error: String(event.error),
                },
              ],
            }),
          ],
        },
      },
    },

    gettingCapabilities: {
      entry: "setLoading",
      invoke: {
        src: "getCapabilities",
        onDone: {
          target: "idle",
          actions: [
            "setLoaded",
            assign({
              capabilities: ({ event }) => event.output,
            }),
          ],
        },
        onError: {
          target: "idle",
          actions: ["setLoaded", "addError"],
        },
      },
    },

    gettingConfig: {
      entry: "setLoading",
      invoke: {
        src: "getDefaultConfig",
        input: ({ event }) => {
          if (event.type === "GET_DEFAULT_CONFIG") {
            return {
              mode: event.mode,
            }
          }
          throw new Error("Invalid event type for gettingConfig state")
        },
        onDone: {
          target: "idle",
          actions: [
            "setLoaded",
            assign({
              config: ({ event }) => event.output,
            }),
          ],
        },
        onError: {
          target: "idle",
          actions: ["setLoaded", "addError"],
        },
      },
    },

    validatingConfig: {
      entry: "setLoading",
      invoke: {
        src: "validateConfig",
        input: ({ event }) => {
          if (event.type === "VALIDATE_CONFIG") {
            return {
              config: event.config,
            }
          }
          throw new Error("Invalid event type for validatingConfig state")
        },
        onDone: {
          target: "idle",
          actions: "setLoaded",
        },
        onError: {
          target: "idle",
          actions: ["setLoaded", "addError"],
        },
      },
    },

    healthChecking: {
      entry: "setLoading",
      invoke: {
        src: "healthCheck",
        onDone: {
          target: "idle",
          actions: [
            "setLoaded",
            assign({
              health: ({ event }) => event.output,
            }),
          ],
        },
        onError: {
          target: "idle",
          actions: ["setLoaded", "addError"],
        },
      },
    },

    refreshing: {
      entry: "setLoading",
      invoke: {
        src: "getCapabilities",
        onDone: {
          target: "idle",
          actions: [
            "setLoaded",
            assign({
              capabilities: ({ event }) => event.output,
            }),
          ],
        },
        onError: {
          target: "idle",
          actions: ["setLoaded", "addError"],
        },
      },
    },

    error: {
      on: {
        CLEAR_ERRORS: {
          target: "idle",
          actions: "clearErrors",
        },
        REFRESH_STATUS: {
          target: "loading",
        },
      },
    },
  },
})
