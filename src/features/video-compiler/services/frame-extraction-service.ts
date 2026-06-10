import type { CompilerSubtitle } from "@/core/types/video-editing"
import { indexedDBCacheService } from "@/features/media/hooks/media-management"
import { createLogger } from "@/lib/tauri-logger"
import {
  extractRecognitionFrames as extractRecognitionFramesTauri,
  extractSubtitleFrames as extractSubtitleFramesTauri,
  extractTimelineFrames as extractTimelineFramesTauri,
} from "./compiler-commands"

const logger = createLogger("FrameExtractionService")

export enum ExtractionPurpose {
  TimelinePreview = "timeline_preview",
  ObjectDetection = "object_detection",
  SceneRecognition = "scene_recognition",
  TextRecognition = "text_recognition",
  SubtitleAnalysis = "subtitle_analysis",
}

export interface TimelineFrame {
  timestamp: number
  frameData: string
  isKeyframe: boolean
}

export interface RecognitionFrame {
  timestamp: number
  frameData: Uint8Array
  resolution: [number, number]
  sceneChangeScore?: number
  isKeyframe: boolean
}

export interface SubtitleFrame {
  subtitleId: string
  subtitleText: string
  timestamp: number
  frameData: Uint8Array
  startTime: number
  endTime: number
}

export class FrameExtractionService {
  private static instance: FrameExtractionService

  static getInstance(): FrameExtractionService {
    if (!FrameExtractionService.instance) {
      FrameExtractionService.instance = new FrameExtractionService()
    }
    return FrameExtractionService.instance
  }

  async extractTimelineFrames(
    videoPath: string,
    duration: number,
    interval = 1.0,
    maxFrames?: number,
  ): Promise<TimelineFrame[]> {
    try {
      const frames = await extractTimelineFramesTauri({
        video_path: videoPath,
        duration,
        interval,
        max_frames: maxFrames,
      })

      return frames.map((frame) => ({
        timestamp: frame.timestamp,
        frameData: frame.frame_data,
        isKeyframe: frame.is_keyframe,
      }))
    } catch (error) {
      void logger.error("Failed to extract timeline frames:", { error })
      throw error
    }
  }

  async extractRecognitionFrames(
    videoPath: string,
    purpose: ExtractionPurpose,
    interval = 1.0,
  ): Promise<RecognitionFrame[]> {
    try {
      const frames = await extractRecognitionFramesTauri(videoPath, purpose.toString(), interval)

      return frames.map((frame) => ({
        timestamp: frame.timestamp,
        frameData: new Uint8Array(frame.frame_data),
        resolution: frame.resolution,
        sceneChangeScore: frame.scene_change_score,
        isKeyframe: frame.is_keyframe,
      }))
    } catch (error) {
      void logger.error("Failed to extract recognition frames:", { error })
      throw error
    }
  }

  async extractSubtitleFrames(videoPath: string, subtitles: CompilerSubtitle[]): Promise<SubtitleFrame[]> {
    try {
      const frames = await extractSubtitleFramesTauri(
        videoPath,
        subtitles.map((subtitle) => ({
          id: subtitle.id,
          text: subtitle.text,
          start_time: subtitle.start_time,
          end_time: subtitle.end_time,
          position: subtitle.position,
          style: subtitle.style,
          animations: subtitle.animations,
          enabled: subtitle.enabled,
        })),
      )

      return frames.map((frame) => ({
        subtitleId: frame.subtitle_id,
        subtitleText: frame.subtitle_text,
        timestamp: frame.timestamp,
        frameData: new Uint8Array(frame.frame_data),
        startTime: frame.start_time,
        endTime: frame.end_time,
      }))
    } catch (error) {
      void logger.error("Failed to extract subtitle frames:", { error })
      throw error
    }
  }

  createPreviewElement(frameData: string, timestamp: number): HTMLImageElement {
    const img = new Image()
    img.src = `data:image/jpeg;base64,${frameData}`
    img.alt = `Frame at ${timestamp.toFixed(2)}s`
    if (img.dataset) {
      img.dataset.timestamp = timestamp.toString()
    }
    return img
  }

  async drawFrameToCanvas(frameData: Uint8Array, canvas: HTMLCanvasElement): Promise<void> {
    const blob = new Blob([frameData.buffer as BlobPart], { type: "image/jpeg" })
    const img = new Image()
    const url = URL.createObjectURL(blob)

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)
        resolve()
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("Failed to load image"))
      }

      img.src = url
    })
  }

  async generateSmartTimelinePreviews(
    videoPath: string,
    duration: number,
    containerWidth: number,
    frameWidth = 160,
  ): Promise<TimelineFrame[]> {
    const maxFrames = Math.floor(containerWidth / frameWidth)
    const interval = duration / maxFrames

    return this.extractTimelineFrames(videoPath, duration, Math.max(interval, 0.5), maxFrames)
  }

  async cacheFramesInIndexedDB(videoPath: string, frames: TimelineFrame[]): Promise<void> {
    try {
      await indexedDBCacheService.cacheTimelineFrames(videoPath, frames)
      void logger.info(`Cached ${frames.length} timeline frames for ${videoPath}`)
    } catch (error) {
      void logger.error("Failed to cache timeline frames:", { error })
    }
  }

  async getCachedFrames(videoPath: string): Promise<TimelineFrame[] | null> {
    try {
      const cachedFrames = await indexedDBCacheService.getCachedTimelineFrames(videoPath)
      if (cachedFrames) {
        void logger.info(`Retrieved ${cachedFrames.length} cached frames for ${videoPath}`)
      }
      return cachedFrames
    } catch (error) {
      void logger.error("Failed to retrieve cached frames:", { error })
      return null
    }
  }

  async cacheRecognitionFrames(videoPath: string, frames: RecognitionFrame[]): Promise<void> {
    try {
      await indexedDBCacheService.cacheRecognitionFrames(videoPath, frames)
      void logger.info(`Cached ${frames.length} recognition frames for ${videoPath}`)
    } catch (error) {
      void logger.error("Failed to cache recognition frames:", { error })
    }
  }

  async getCachedRecognitionFrames(videoPath: string): Promise<RecognitionFrame[] | null> {
    try {
      const cachedFrames = await indexedDBCacheService.getCachedRecognitionFrames(videoPath)
      if (cachedFrames) {
        void logger.info(`Retrieved ${cachedFrames.length} cached recognition frames for ${videoPath}`)
      }
      return cachedFrames
    } catch (error) {
      void logger.error("Failed to retrieve cached recognition frames:", { error })
      return null
    }
  }

  async cacheSubtitleFrames(videoPath: string, frames: SubtitleFrame[]): Promise<void> {
    try {
      await indexedDBCacheService.cacheSubtitleFrames(videoPath, frames)
      void logger.info(`Cached ${frames.length} subtitle frames for ${videoPath}`)
    } catch (error) {
      void logger.error("Failed to cache subtitle frames:", { error })
    }
  }

  async getCachedSubtitleFrames(videoPath: string): Promise<SubtitleFrame[] | null> {
    try {
      const cachedFrames = await indexedDBCacheService.getCachedSubtitleFrames(videoPath)
      if (cachedFrames) {
        void logger.info(`Retrieved ${cachedFrames.length} cached subtitle frames for ${videoPath}`)
      }
      return cachedFrames
    } catch (error) {
      void logger.error("Failed to retrieve cached subtitle frames:", { error })
      return null
    }
  }

  async clearFrameCache(): Promise<void> {
    try {
      await indexedDBCacheService.clearFrameCache()
      await indexedDBCacheService.clearRecognitionCache()
      await indexedDBCacheService.clearSubtitleCache()
      void logger.info("Frame cache cleared")
    } catch (error) {
      void logger.error("Failed to clear frame cache:", { error })
      throw error
    }
  }
}

export const frameExtractionService = FrameExtractionService.getInstance()
