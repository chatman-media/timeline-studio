/**
 * Media Metadata Service - Media Management Domain
 *
 * Сервис для извлечения и анализа метаданных медиа файлов
 */

import { invoke } from "@tauri-apps/api/core"
import type {
  MediaAnalysisResult,
  MediaMetadata,
  MediaMetadataService,
  QualityMetrics,
  SceneDetectionResult,
} from "../types"

class MediaMetadataServiceImpl implements MediaMetadataService {
  /**
   * Извлечение метаданных из медиа файла
   */
  async extractMetadata(filePath: string): Promise<MediaMetadata> {
    console.log(`[Media Metadata] Extracting metadata from: ${filePath}`)

    try {
      const metadata = await invoke<MediaMetadata>("extract_media_metadata", {
        path: filePath,
      })

      console.log("[Media Metadata] Extracted metadata:", metadata)
      return metadata
    } catch (error) {
      console.error("[Media Metadata] Failed to extract metadata:", error)
      throw new Error(`Failed to extract metadata: ${error}`)
    }
  }

  /**
   * Генерация thumbnail для видео файла
   */
  async generateThumbnail(filePath: string, time: number = 0): Promise<string> {
    console.log(`[Media Metadata] Generating thumbnail for: ${filePath} at ${time}s`)

    try {
      const thumbnailPath = await invoke<string>("generate_video_thumbnail", {
        videoPath: filePath,
        time,
      })

      console.log(`[Media Metadata] Generated thumbnail: ${thumbnailPath}`)
      return thumbnailPath
    } catch (error) {
      console.error("[Media Metadata] Failed to generate thumbnail:", error)
      throw new Error(`Failed to generate thumbnail: ${error}`)
    }
  }

  /**
   * Полный анализ медиа файла
   */
  async analyzeMedia(filePath: string): Promise<MediaAnalysisResult> {
    console.log(`[Media Metadata] Analyzing media: ${filePath}`)

    try {
      // Извлекаем метаданные
      const metadata = await this.extractMetadata(filePath)

      // Для видео файлов делаем дополнительный анализ
      let thumbnailPath: string | undefined
      let scenes: SceneDetectionResult[] | undefined
      let waveformData: Float32Array | undefined

      if (metadata.type === "Video") {
        // Генерируем thumbnail
        try {
          thumbnailPath = await this.generateThumbnail(filePath)
        } catch (error) {
          console.warn("[Media Metadata] Thumbnail generation failed:", error)
        }

        // Детекция сцен
        try {
          scenes = await this.detectScenes(filePath)
        } catch (error) {
          console.warn("[Media Metadata] Scene detection failed:", error)
        }
      } else if (metadata.type === "Audio") {
        // Генерируем waveform для аудио
        try {
          waveformData = await this.generateWaveform(filePath)
        } catch (error) {
          console.warn("[Media Metadata] Waveform generation failed:", error)
        }
      }

      // Анализ качества
      const quality = await this.analyzeQuality(metadata)

      return {
        metadata,
        thumbnailPath,
        waveformData,
        scenes,
        quality,
      }
    } catch (error) {
      console.error("[Media Metadata] Media analysis failed:", error)
      throw new Error(`Media analysis failed: ${error}`)
    }
  }

  /**
   * Получение длительности медиа файла
   */
  async getMediaDuration(filePath: string): Promise<number> {
    console.log(`[Media Metadata] Getting duration for: ${filePath}`)

    try {
      const duration = await invoke<number>("get_media_duration", {
        path: filePath,
      })

      console.log(`[Media Metadata] Duration: ${duration}s`)
      return duration
    } catch (error) {
      console.error("[Media Metadata] Failed to get duration:", error)
      throw new Error(`Failed to get media duration: ${error}`)
    }
  }

  /**
   * Детекция сцен в видео
   */
  private async detectScenes(filePath: string): Promise<SceneDetectionResult[]> {
    try {
      const scenes = await invoke<SceneDetectionResult[]>("detect_video_scenes", {
        path: filePath,
      })

      console.log(`[Media Metadata] Detected ${scenes.length} scenes`)
      return scenes
    } catch (error) {
      console.error("[Media Metadata] Scene detection failed:", error)
      return []
    }
  }

  /**
   * Генерация waveform для аудио
   */
  private async generateWaveform(filePath: string): Promise<Float32Array> {
    try {
      const waveformData = await invoke<number[]>("generate_audio_waveform", {
        path: filePath,
      })

      console.log(`[Media Metadata] Generated waveform with ${waveformData.length} samples`)
      return new Float32Array(waveformData)
    } catch (error) {
      console.error("[Media Metadata] Waveform generation failed:", error)
      return new Float32Array(0)
    }
  }

  /**
   * Анализ качества медиа файла
   */
  private async analyzeQuality(metadata: MediaMetadata): Promise<QualityMetrics | undefined> {
    if (metadata.type === "Video") {
      const resolution = `${metadata.width}x${metadata.height}`
      const qualityScore = this.calculateQualityScore(metadata)

      return {
        resolution,
        bitrate: metadata.bitrate || 0,
        fps: metadata.fps || 0,
        codec: metadata.codec || "unknown",
        qualityScore,
      }
    }

    return undefined
  }

  /**
   * Расчет оценки качества видео
   */
  private calculateQualityScore(metadata: MediaMetadata & { type: "Video" }): number {
    let score = 0

    // Resolution score (0-40)
    if (metadata.width && metadata.height) {
      const pixels = metadata.width * metadata.height
      if (pixels >= 3840 * 2160)
        score += 40 // 4K
      else if (pixels >= 1920 * 1080)
        score += 35 // Full HD
      else if (pixels >= 1280 * 720)
        score += 25 // HD
      else if (pixels >= 854 * 480)
        score += 15 // SD
      else score += 5
    }

    // FPS score (0-20)
    if (metadata.fps) {
      if (metadata.fps >= 60) score += 20
      else if (metadata.fps >= 30) score += 15
      else if (metadata.fps >= 24) score += 10
      else score += 5
    }

    // Bitrate score (0-20)
    if (metadata.bitrate) {
      const mbps = metadata.bitrate / 1_000_000
      if (mbps >= 50) score += 20
      else if (mbps >= 20) score += 15
      else if (mbps >= 10) score += 10
      else if (mbps >= 5) score += 5
    }

    // Codec score (0-20)
    if (metadata.codec) {
      const modernCodecs = ["h265", "hevc", "av1", "vp9"]
      const goodCodecs = ["h264", "avc"]

      if (modernCodecs.some((c) => metadata.codec!.toLowerCase().includes(c))) {
        score += 20
      } else if (goodCodecs.some((c) => metadata.codec!.toLowerCase().includes(c))) {
        score += 15
      } else {
        score += 5
      }
    }

    return Math.min(100, score)
  }
}

// Singleton instance
let instance: MediaMetadataServiceImpl | null = null

/**
 * Получить экземпляр сервиса метаданных
 */
export function getMediaMetadataService(): MediaMetadataService {
  if (!instance) {
    instance = new MediaMetadataServiceImpl()
  }
  return instance
}

// Export service type
export type { MediaMetadataService } from "../types"
