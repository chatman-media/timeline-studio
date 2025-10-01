/**
 * Main hook for Smart Montage Planner functionality
 * Provides a convenient API for interacting with the montage planner
 */

import { useCallback, useMemo } from "react"

import type { MediaFile } from "@/features/media/types/media"
import { formatTime } from "@/lib/date"
import { useMontagePlanner as useMontagePlannerContext } from "../services/montage-planner-provider"
import type { AnalysisOptions, ExportFormat, Fragment, PlanGenerationOptions } from "../types"
import { MONTAGE_STYLES } from "../types"
import { convertFragmentForAIServices, convertToAIServicesMediaFile } from "../utils/media-file-converter"

export function useMontagePlanner() {
  const {
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
  } = useMontagePlannerContext()

  const context = state?.context || {
    mediaFiles: new Map<string, MediaFile>(),
    fragments: [],
    videoIds: [],
    currentPlan: null,
    instructions: "",
    selectedStyle: "dynamic",
    targetDuration: null,
    error: null,
    planValidation: null,
    planStatistics: null,
  }

  // Video management
  const addVideo = useCallback(
    (videoId: string, file: MediaFile) => {
      send({ type: "ADD_VIDEO", videoId, file: convertToAIServicesMediaFile(file) })
    },
    [send],
  )

  const removeVideo = useCallback(
    (videoId: string) => {
      send({ type: "REMOVE_VIDEO", videoId })
    },
    [send],
  )

  // Instructions and settings
  const updateInstructions = useCallback(
    (instructions: string) => {
      send({ type: "UPDATE_INSTRUCTIONS", instructions })
    },
    [send],
  )

  const selectStyle = useCallback(
    (styleId: string) => {
      send({ type: "SELECT_STYLE", styleId })
    },
    [send],
  )

  const setTargetDuration = useCallback(
    (duration: number) => {
      send({ type: "SET_TARGET_DURATION", duration })
    },
    [send],
  )

  const updateAnalysisOptions = useCallback(
    (options: Partial<AnalysisOptions>) => {
      send({ type: "UPDATE_ANALYSIS_OPTIONS", options })
    },
    [send],
  )

  const updateGenerationOptions = useCallback(
    (options: Partial<PlanGenerationOptions>) => {
      send({ type: "UPDATE_GENERATION_OPTIONS", options })
    },
    [send],
  )

  // Analysis and generation
  const startAnalysis = useCallback(() => {
    send({ type: "START_ANALYSIS" })
  }, [send])

  const cancelAnalysis = useCallback(() => {
    send({ type: "CANCEL_ANALYSIS" })
  }, [send])

  const generatePlan = useCallback(() => {
    send({ type: "GENERATE_PLAN" })
  }, [send])

  const optimizePlan = useCallback(() => {
    send({ type: "OPTIMIZE_PLAN" })
  }, [send])

  // Fragment editing
  const editFragment = useCallback(
    (fragmentId: string, updates: Partial<Fragment>) => {
      send({ type: "EDIT_FRAGMENT", fragmentId, updates: convertFragmentForAIServices(updates) })
    },
    [send],
  )

  const reorderFragments = useCallback(
    (sourceIndex: number, targetIndex: number) => {
      send({ type: "REORDER_FRAGMENTS", sourceIndex, targetIndex })
    },
    [send],
  )

  // Plan actions
  const applyPlanToTimeline = useCallback(() => {
    send({ type: "APPLY_PLAN_TO_TIMELINE" })
  }, [send])

  const exportPlan = useCallback(
    (format: ExportFormat) => {
      send({ type: "EXPORT_PLAN", format })
    },
    [send],
  )

  const validatePlan = useCallback(() => {
    send({ type: "VALIDATE_PLAN" })
  }, [send])

  const calculateStatistics = useCallback(() => {
    send({ type: "CALCULATE_STATISTICS" })
  }, [send])

  // Reset
  const reset = useCallback(() => {
    send({ type: "RESET" })
  }, [send])

  // Clear error
  const clearError = useCallback(() => {
    send({ type: "CLEAR_ERROR" })
  }, [send])

  // Computed values
  const totalVideoDuration = useMemo(() => {
    if (!context.mediaFiles) return 0
    const files = Array.from(context.mediaFiles.values())
    return files.reduce((total: number, file: MediaFile) => {
      return total + (file?.duration || 0)
    }, 0)
  }, [context.mediaFiles])

  const totalFragmentsDuration = useMemo(() => {
    if (!context.fragments) return 0
    return context.fragments.reduce((total: number, fragment: Fragment) => {
      return total + (fragment.duration || 0)
    }, 0)
  }, [context.fragments])

  const utilizationRate = useMemo(() => {
    const videoDuration = totalVideoDuration
    if (videoDuration === 0) return 0
    return (totalFragmentsDuration / videoDuration) * 100
  }, [totalFragmentsDuration, totalVideoDuration])

  const planDuration = context.currentPlan?.totalDuration || 0
  const fragmentCount = context.fragments?.length || 0
  const videoCount = context.videoIds?.length || 0

  // Format helpers
  const formatDuration = useCallback((seconds: number) => {
    return formatTime(seconds)
  }, [])

  const getStyleName = useCallback((styleId: string) => {
    return styleId in MONTAGE_STYLES ? MONTAGE_STYLES[styleId].name : styleId
  }, [])

  return {
    // State
    state,
    context,
    send, // Expose send for tests
    currentPlan: context.currentPlan,
    fragments: context.fragments,
    videos: context.mediaFiles ? Array.from(context.mediaFiles.values()) : [],
    instructions: context.instructions,
    selectedStyle: context.selectedStyle,
    targetDuration: context.targetDuration,
    error: context.error,

    // Status flags
    isAnalyzing,
    isGenerating,
    isOptimizing,
    hasVideos,
    hasFragments,
    hasPlan,
    canGeneratePlan,
    canOptimizePlan,
    isBusy: isAnalyzing || isGenerating || isOptimizing,
    isReady: hasFragments && !isAnalyzing && !isGenerating && !isOptimizing,

    // Progress
    progress,
    progressMessage,

    // Statistics
    videoCount,
    fragmentCount,
    totalVideoDuration,
    totalFragmentsDuration,
    utilizationRate,
    planDuration,

    // Actions
    addVideo,
    removeVideo,
    updateInstructions,
    selectStyle,
    setTargetDuration,
    updateAnalysisOptions,
    updateGenerationOptions,
    startAnalysis,
    cancelAnalysis,
    generatePlan,
    optimizePlan,
    editFragment,
    reorderFragments,
    applyPlanToTimeline,
    exportPlan,
    validatePlan,
    calculateStatistics,
    reset,
    clearError,

    // Helpers
    formatDuration,
    getStyleName,

    // Validation results
    planValidation: context.planValidation,
    planStatistics: context.planStatistics,

    // Available styles
    availableStyles: Object.keys(MONTAGE_STYLES),
  }
}
