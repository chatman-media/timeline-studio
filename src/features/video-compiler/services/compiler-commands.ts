import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("VideoCompilerFrameCommands")

export async function extractTimelineFrames(request: {
  video_path: string
  duration: number
  interval: number
  max_frames?: number
}): Promise<any[]> {
  logger.debugSync("Extracting timeline frames")
  return invoke("extract_timeline_frames", { request })
}

export async function extractRecognitionFrames(videoPath: string, purpose: string, interval: number): Promise<any[]> {
  logger.debugSync("Extracting recognition frames", { videoPath, purpose })
  return invoke("extract_recognition_frames", {
    video_path: videoPath,
    purpose,
    interval,
  })
}

export async function extractSubtitleFrames(videoPath: string, subtitles: any[]): Promise<any[]> {
  logger.debugSync("Extracting subtitle frames", { videoPath })
  return invoke("extract_subtitle_frames", {
    video_path: videoPath,
    subtitles,
  })
}
