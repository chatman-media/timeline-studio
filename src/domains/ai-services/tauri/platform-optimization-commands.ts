/**
 * Platform Optimization Tauri Commands for AI Services Domain
 * Video optimization for social media platforms
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("PlatformOptimization")

/**
 * FFmpeg Metadata and Analysis Commands
 */
export async function ffmpegGetMetadata(filePath: string): Promise<any> {
  return invoke("ffmpeg_get_metadata", { filePath })
}

export async function ffmpegQuickAnalysis(filePath: string): Promise<any> {
  return invoke("ffmpeg_quick_analysis", { filePath })
}

export async function ffmpegDetectScenes(options: {
  filePath: string
  threshold: number
  minSceneLength: number
}): Promise<any> {
  logger.info("Detecting scenes", { filePath: options.filePath, threshold: options.threshold })
  return invoke("ffmpeg_detect_scenes", options)
}

/**
 * FFmpeg Optimization Commands
 */
export async function ffmpegOptimizeForPlatform(options: {
  inputPath: string
  outputPath: string
  targetWidth: number
  targetHeight: number
  targetBitrate: number
  targetFramerate: number
  audioCodec: string
  videoCodec: string
  cropToFit: boolean
}): Promise<any> {
  logger.info("Optimizing video for platform", {
    inputPath: options.inputPath,
    resolution: `${options.targetWidth}x${options.targetHeight}`,
    bitrate: options.targetBitrate,
  })
  return invoke("ffmpeg_optimize_for_platform", options)
}

export async function ffmpegGenerateThumbnail(options: {
  videoPath: string
  outputPath: string
  timestamp: number
}): Promise<string> {
  logger.info("Generating thumbnail", { videoPath: options.videoPath, timestamp: options.timestamp })
  return invoke("ffmpeg_generate_thumbnail", options)
}

/**
 * Image Processing Commands
 */
export async function convertImageToBase64(imagePath: string): Promise<string> {
  return invoke("convert_image_to_base64", { imagePath })
}

/**
 * Multimodal Analysis Commands
 */
export async function extractFramesForMultimodalAnalysis(options: {
  clipId: string
  samplingRate: number
  maxFrames: number
}): Promise<Array<{ imagePath: string; timestamp: number }>> {
  logger.info("Extracting frames for multimodal analysis", {
    clipId: options.clipId,
    samplingRate: options.samplingRate,
    maxFrames: options.maxFrames,
  })
  return invoke("extract_frames_for_multimodal_analysis", options)
}
