import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("MontagePlannerCommands")

export async function analyzeVideoCompositionWithProcessor(
  videoPath: string,
  processorId: string,
  options?: Record<string, any>,
): Promise<any> {
  logger.infoSync("Analyzing video composition with processor", { videoPath, processorId })
  return invoke("analyze_video_composition", {
    videoPath,
    processorId,
    options: options || {},
  })
}

export async function detectKeyMomentsFromDetections(detections: any[], qualityScores: number[]): Promise<any[]> {
  logger.infoSync("Detecting key moments from detections", { detectionsCount: detections.length })
  return invoke("detect_key_moments", {
    detections,
    qualityScores,
  })
}

export async function generateMontagePlanFromMoments(
  moments: any[],
  config: any,
  sourceFiles: string[],
): Promise<any> {
  logger.infoSync("Generating montage plan from moments", { momentsCount: moments.length })
  return invoke("generate_montage_plan", {
    moments,
    config,
    sourceFiles,
  })
}

export async function analyzeVideoQuality(videoPath: string): Promise<any> {
  logger.infoSync("Analyzing video quality", { videoPath })
  return invoke("analyze_video_quality", {
    videoPath,
  })
}

export async function analyzeFrameQuality(videoPath: string, timestamp: number): Promise<any> {
  logger.infoSync("Analyzing frame quality", { videoPath, timestamp })
  return invoke("analyze_frame_quality", {
    videoPath,
    timestamp,
  })
}

export async function analyzeAudioContent(audioPath: string): Promise<any> {
  logger.infoSync("Analyzing audio content", { audioPath })
  return invoke("analyze_audio_content", {
    audioPath,
  })
}
