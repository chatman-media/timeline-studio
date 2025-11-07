/**
 * Montage Planner Tauri Commands for AI Services Domain
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"
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

const logger = createLogger("MontagePlannerCommands")

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
  logger.infoSync("Analyzing videos", { videoCount: videoIds.length })
  return invoke("analyze_montage_videos", {
    videoIds,
    options,
  })
}

export async function analyzeVideoComposition(videoPath: string, options?: Partial<AnalysisOptions>): Promise<any> {
  logger.infoSync("Analyzing video composition", { videoPath })
  return invoke("analyze_video_composition", {
    videoPath,
    options: options || {},
  })
}

export async function detectKeyMoments(videoPath: string, analysisResults: any): Promise<MomentScore[]> {
  logger.infoSync("Detecting key moments", { videoPath })
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
  logger.infoSync("Generating montage plan", { fragmentCount: fragments.length })
  return invoke("generate_montage_plan", {
    fragments,
    options,
  })
}

export async function optimizeMontagePlan(plan: MontagePlan, preferences: any = {}): Promise<MontagePlan> {
  logger.infoSync("Optimizing montage plan", { planId: plan.id })
  return invoke("optimize_montage_plan", {
    plan,
    preferences,
  })
}

/**
 * Plan Validation and Statistics
 */
export async function validateMontagePlan(plan: MontagePlan): Promise<PlanValidation> {
  logger.debugSync("Validating montage plan", { planId: plan.id })
  return invoke("validate_montage_plan", {
    plan,
  })
}

export async function calculatePlanStatistics(plan: MontagePlan): Promise<PlanStatistics> {
  logger.debugSync("Calculating plan statistics", { planId: plan.id })
  return invoke("calculate_plan_statistics", {
    plan,
  })
}

/**
 * Plan Application and Export
 */
export async function applyMontagePlan(plan: MontagePlan): Promise<void> {
  logger.infoSync("Applying montage plan to timeline", { planId: plan.id })
  return invoke("apply_montage_plan", {
    plan,
  })
}

export async function exportMontagePlan(plan: MontagePlan, format: string): Promise<void> {
  logger.infoSync("Exporting montage plan", { planId: plan.id, format })
  return invoke("export_montage_plan", {
    plan,
    format,
  })
}

/**
 * Configuration Commands
 */
export async function updateCompositionWeights(weights: Record<string, number>): Promise<void> {
  logger.debugSync("Updating composition weights", { weightCount: Object.keys(weights).length })
  return invoke("update_composition_weights", {
    weights,
  })
}
