/**
 * Montage Planner Tauri Commands for AI Services Domain
 */

import { invoke } from "@tauri-apps/api/core"
import type {
  AnalysisOptions,
  AnalysisProgress,
  Fragment,
  MomentScore,
  MontagePlan,
  PlanGenerationOptions,
  PlanStatistics,
  PlanValidation,
} from "../types/montage-planner"

/**
 * Video Analysis Commands
 */
export async function analyzeMontagVideos(
  videoIds: string[],
  options: AnalysisOptions,
): Promise<{
  fragments: Fragment[]
  momentScores: MomentScore[]
  videoAnalysis: any
  audioAnalysis: any
}> {
  console.log("[Montage Planner] Analyzing videos:", videoIds.length)
  return invoke("analyze_montage_videos", {
    videoIds,
    options,
  })
}

export async function analyzeVideoComposition(videoPath: string, options?: Partial<AnalysisOptions>): Promise<any> {
  console.log("[Montage Planner] Analyzing video composition:", videoPath)
  return invoke("analyze_video_composition", {
    videoPath,
    options: options || {},
  })
}

export async function detectKeyMoments(videoPath: string, analysisResults: any): Promise<MomentScore[]> {
  console.log("[Montage Planner] Detecting key moments:", videoPath)
  return invoke("detect_key_moments", {
    videoPath,
    analysisResults,
  })
}

export async function getAnalysisProgress(): Promise<AnalysisProgress> {
  return invoke("get_analysis_progress")
}

/**
 * Plan Generation Commands
 */
export async function generateMontagePlan(fragments: Fragment[], options: PlanGenerationOptions): Promise<MontagePlan> {
  console.log("[Montage Planner] Generating montage plan with", fragments.length, "fragments")
  return invoke("generate_montage_plan", {
    fragments,
    options,
  })
}

export async function optimizeMontagePlan(plan: MontagePlan, preferences: any = {}): Promise<MontagePlan> {
  console.log("[Montage Planner] Optimizing montage plan:", plan.id)
  return invoke("optimize_montage_plan", {
    plan,
    preferences,
  })
}

/**
 * Plan Validation and Statistics
 */
export async function validateMontagePlan(plan: MontagePlan): Promise<PlanValidation> {
  console.log("[Montage Planner] Validating montage plan:", plan.id)
  return invoke("validate_montage_plan", {
    plan,
  })
}

export async function calculatePlanStatistics(plan: MontagePlan): Promise<PlanStatistics> {
  console.log("[Montage Planner] Calculating plan statistics:", plan.id)
  return invoke("calculate_plan_statistics", {
    plan,
  })
}

/**
 * Plan Application and Export
 */
export async function applyMontagePlan(plan: MontagePlan): Promise<void> {
  console.log("[Montage Planner] Applying montage plan to timeline:", plan.id)
  return invoke("apply_montage_plan", {
    plan,
  })
}

export async function exportMontagePlan(plan: MontagePlan, format: string): Promise<void> {
  console.log("[Montage Planner] Exporting montage plan:", plan.id, "format:", format)
  return invoke("export_montage_plan", {
    plan,
    format,
  })
}

/**
 * Configuration Commands
 */
export async function updateCompositionWeights(weights: Record<string, number>): Promise<void> {
  console.log("[Montage Planner] Updating composition weights")
  return invoke("update_composition_weights", {
    weights,
  })
}
