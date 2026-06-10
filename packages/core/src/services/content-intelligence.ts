import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("CoreContentIntelligence")

export interface SceneAnalysisResult {
  id: string
  fileId: string
  startTime: number
  endTime: number
  duration: number
  sceneType: string
  confidence: number
  keyFrames: number[]
  description?: string
  visual?: {
    dominantColors: string[]
    brightness: number
    contrast: number
    saturation: number
    motionLevel: number
    compositionScore: number
    sharpness: number
    noiseLevel: number
  }
  audio?: {
    hasSpeech: boolean
    hasMusic: boolean
    volumeLevel: number
    clarity: number
  }
  objects: string[]
  persons: string[]
  transition?: any
}

export async function analyzeScenesByPath(filePath: string): Promise<SceneAnalysisResult[]> {
  logger.info("Analyzing scenes by path", { filePath })
  return invoke("analyze_scenes_by_path_command", {
    filePath,
  })
}
