/**
 * Workflow Automation Tauri Commands for AI Services Domain
 * Video workflow automation and project management
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("WorkflowAutomation")

/**
 * Directory Management Commands
 */
export async function createDirectory(path: string): Promise<void> {
  return invoke("create_directory", { path })
}

/**
 * Audio Extraction Commands
 */
export async function extractAudioForWhisper(options: {
  videoFilePath: string
  outputFormat: string
}): Promise<string> {
  logger.info("Extracting audio for Whisper", { videoPath: options.videoFilePath, format: options.outputFormat })
  return invoke("extract_audio_for_whisper", options)
}

/**
 * Whisper Transcription Commands
 */
export async function whisperTranscribeOpenai(options: {
  audioFilePath: string
  apiKey: string
  model: string
  language: string
  responseFormat: string
}): Promise<any> {
  logger.info("Transcribing with Whisper (OpenAI)", {
    audioPath: options.audioFilePath,
    model: options.model,
    language: options.language,
  })
  return invoke("whisper_transcribe_openai", options)
}

/**
 * Timeline and Project Commands
 */
export async function createTimelineProject(options: { projectData: string; outputPath: string }): Promise<void> {
  logger.info("Creating timeline project", { outputPath: options.outputPath })
  return invoke("create_timeline_project", options)
}

export async function compileWorkflowVideo(options: {
  projectFile: string
  outputPath: string
  settings: string
}): Promise<any> {
  logger.info("Compiling workflow video", { projectFile: options.projectFile, outputPath: options.outputPath })
  return invoke("compile_workflow_video", options)
}

/**
 * Montage Plan Commands
 */
export async function applyMontagePlan(plan: any): Promise<void> {
  logger.info("Applying montage plan")
  return invoke("apply_montage_plan", { plan })
}

export async function exportMontagePlan(options: { plan: any; format: string }): Promise<void> {
  logger.info("Exporting montage plan", { format: options.format })
  return invoke("export_montage_plan", options)
}

export async function analyzeMontagelVideos(options: { videoIds: string[]; options: any }): Promise<any> {
  logger.info("Analyzing videos for montage", { videoCount: options.videoIds.length })
  return invoke("analyze_montage_videos", options)
}

export async function generateMontagePlan(options: { fragments: any[]; options: any }): Promise<any> {
  logger.info("Generating montage plan", { fragmentCount: options.fragments.length })
  return invoke("generate_montage_plan", options)
}

export async function optimizeMontagePlan(options: { plan: any; preferences: any }): Promise<any> {
  logger.info("Optimizing montage plan")
  return invoke("optimize_montage_plan", options)
}

export async function validateMontagePlan(plan: any): Promise<any> {
  logger.info("Validating montage plan")
  return invoke("validate_montage_plan", { plan })
}

export async function calculatePlanStatistics(plan: any): Promise<any> {
  logger.info("Calculating plan statistics")
  return invoke("calculate_plan_statistics", { plan })
}
