import { invoke } from "@tauri-apps/api/core"
import { Subtitle } from "@/domains/video-editing/types/video-compiler"
import { indexedDBCacheService } from "@/features/media/services/indexeddb-cache-service"

/**
 * Цель извлечения кадров
 */
export enum ExtractionPurpose {
  TimelinePreview = "timeline_preview",
  ObjectDetection = "object_detection",
  SceneRecognition = "scene_recognition",
  TextRecognition = "text_recognition",
  SubtitleAnalysis = "subtitle_analysis",
}

/**
 * Результат кадра для timeline
 */
export interface TimelineFrame {
  timestamp: number
  frameData: string // base64
  isKeyframe: boolean
}

/**
 * Кадр для распознавания
 */
export interface RecognitionFrame {
  timestamp: number
  frameData: Uint8Array
  resolution: [number, number]
  sceneChangeScore?: number
  isKeyframe: boolean
}

/**
 * Кадр субтитра
 */
export interface SubtitleFrame {
  subtitleId: string
  subtitleText: string
  timestamp: number
  frameData: Uint8Array
  startTime: number
  endTime: number
}

/**
 * Сервис для извлечения кадров из видео
 */
export class FrameExtractionService {
  private static instance: FrameExtractionService

  static getInstance(): FrameExtractionService {
    if (!FrameExtractionService.instance) {
      FrameExtractionService.instance = new FrameExtractionService()
    }
    return FrameExtractionService.instance
  }

  /**
   * Извлечь кадры для timeline
   */
  async extractTimelineFrames(
    videoPath: string,
    duration: number,
    interval = 1.0,
    maxFrames?: number,
  ): Promise<TimelineFrame[]> {
    try {
      const frames = await invoke<
        Array<{
          timestamp: number
          frame_data: string
          is_keyframe: boolean
        }>
      >("extract_timeline_frames", {
        request: {
          video_path: videoPath,
          duration,
          interval,
          max_frames: maxFrames,
        },
      })

      return frames.map((frame) => ({
        timestamp: frame.timestamp,
        frameData: frame.frame_data,
        isKeyframe: frame.is_keyframe,
      }))
    } catch (error) {
      console.error("Failed to extract timeline frames:", error)
      throw error
    }
  }

  /**
   * Извлечь кадры для распознавания
   */
  async extractRecognitionFrames(
    videoPath: string,
    purpose: ExtractionPurpose,
    interval = 1.0,
  ): Promise<RecognitionFrame[]> {
    try {
      const frames = await invoke<
        Array<{
          timestamp: number
          frame_data: number[]
          resolution: [number, number]
          scene_change_score?: number
          is_keyframe: boolean
        }>
      >("extract_recognition_frames", {
        video_path: videoPath,
        purpose: purpose.toString(),
        interval,
      })

      return frames.map((frame) => ({
        timestamp: frame.timestamp,
        frameData: new Uint8Array(frame.frame_data),
        resolution: frame.resolution,
        sceneChangeScore: frame.scene_change_score,
        isKeyframe: frame.is_keyframe,
      }))
    } catch (error) {
      console.error("Failed to extract recognition frames:", error)
      throw error
    }
  }

  /**
   * Извлечь кадры для субтитров
   */
  async extractSubtitleFrames(videoPath: string, subtitles: Subtitle[]): Promise<SubtitleFrame[]> {
    try {
      const frames = await invoke<
        Array<{
          subtitle_id: string
          subtitle_text: string
          timestamp: number
          frame_data: number[]
          start_time: number
          end_time: number
        }>
      >("extract_subtitle_frames", {
        video_path: videoPath,
        subtitles: subtitles.map((subtitle) => ({
          id: subtitle.id,
          text: subtitle.text,
          start_time: subtitle.start_time,
          end_time: subtitle.end_time,
          position: subtitle.position,
          style: subtitle.style,
          animations: subtitle.animations,
          enabled: subtitle.enabled,
        })),
      })

      return frames.map((frame) => ({
        subtitleId: frame.subtitle_id,
        subtitleText: frame.subtitle_text,
        timestamp: frame.timestamp,
        frameData: new Uint8Array(frame.frame_data),
        startTime: frame.start_time,
        endTime: frame.end_time,
      }))
    } catch (error) {
      console.error("Failed to extract subtitle frames:", error)
      throw error
    }
  }

  /**
   * Создать превью элемент из base64 данных
   */
  createPreviewElement(frameData: string, timestamp: number): HTMLImageElement {
    const img = new Image()
    img.src = `data:image/jpeg;base64,${frameData}`
    img.alt = `Frame at ${timestamp.toFixed(2)}s`
    img.dataset.timestamp = timestamp.toString()
    return img
  }

  /**
   * Создать canvas для отрисовки кадра
   */
  async drawFrameToCanvas(frameData: Uint8Array, canvas: HTMLCanvasElement): Promise<void> {
    const blob = new Blob([frameData.buffer], { type: "image/jpeg" })
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

  /**
   * Генерировать превью для timeline с умным выбором кадров
   */
  async generateSmartTimelinePreviews(
    videoPath: string,
    duration: number,
    containerWidth: number,
    frameWidth = 160,
  ): Promise<TimelineFrame[]> {
    // Вычисляем оптимальное количество кадров
    const maxFrames = Math.floor(containerWidth / frameWidth)
    const interval = duration / maxFrames

    // Извлекаем кадры с оптимальным интервалом
    return this.extractTimelineFrames(
      videoPath,
      duration,
      Math.max(interval, 0.5), // Минимум 0.5 секунды между кадрами
      maxFrames,
    )
  }

  /**
   * Кэшировать кадры в IndexedDB для быстрого доступа
   */
  async cacheFramesInIndexedDB(videoPath: string, frames: TimelineFrame[]): Promise<void> {
    try {
      await indexedDBCacheService.cacheTimelineFrames(videoPath, frames)
      console.log(`Cached ${frames.length} timeline frames for ${videoPath}`)
    } catch (error) {
      console.error("Failed to cache timeline frames:", error)
      // Не прерываем работу при ошибке кэширования
    }
  }

  /**
   * Получить кэшированные кадры из IndexedDB
   */
  async getCachedFrames(videoPath: string): Promise<TimelineFrame[] | null> {
    try {
      const cachedFrames = await indexedDBCacheService.getCachedTimelineFrames(videoPath)
      if (cachedFrames) {
        console.log(`Retrieved ${cachedFrames.length} cached frames for ${videoPath}`)
      }
      return cachedFrames
    } catch (error) {
      console.error("Failed to retrieve cached frames:", error)
      return null
    }
  }

  /**
   * Кэшировать результаты распознавания
   */
  async cacheRecognitionFrames(videoPath: string, frames: RecognitionFrame[]): Promise<void> {
    try {
      await indexedDBCacheService.cacheRecognitionFrames(videoPath, frames)
      console.log(`Cached ${frames.length} recognition frames for ${videoPath}`)
    } catch (error) {
      console.error("Failed to cache recognition frames:", error)
    }
  }

  /**
   * Получить кэшированные результаты распознавания
   */
  async getCachedRecognitionFrames(videoPath: string): Promise<RecognitionFrame[] | null> {
    try {
      const cachedFrames = await indexedDBCacheService.getCachedRecognitionFrames(videoPath)
      if (cachedFrames) {
        console.log(`Retrieved ${cachedFrames.length} cached recognition frames for ${videoPath}`)
      }
      return cachedFrames
    } catch (error) {
      console.error("Failed to retrieve cached recognition frames:", error)
      return null
    }
  }

  /**
   * Кэшировать кадры субтитров
   */
  async cacheSubtitleFrames(videoPath: string, frames: SubtitleFrame[]): Promise<void> {
    try {
      await indexedDBCacheService.cacheSubtitleFrames(videoPath, frames)
      console.log(`Cached ${frames.length} subtitle frames for ${videoPath}`)
    } catch (error) {
      console.error("Failed to cache subtitle frames:", error)
    }
  }

  /**
   * Получить кэшированные кадры субтитров
   */
  async getCachedSubtitleFrames(videoPath: string): Promise<SubtitleFrame[] | null> {
    try {
      const cachedFrames = await indexedDBCacheService.getCachedSubtitleFrames(videoPath)
      if (cachedFrames) {
        console.log(`Retrieved ${cachedFrames.length} cached subtitle frames for ${videoPath}`)
      }
      return cachedFrames
    } catch (error) {
      console.error("Failed to retrieve cached subtitle frames:", error)
      return null
    }
  }

  /**
   * Очистить весь кэш кадров
   */
  async clearFrameCache(): Promise<void> {
    try {
      await indexedDBCacheService.clearFrameCache()
      await indexedDBCacheService.clearRecognitionCache()
      await indexedDBCacheService.clearSubtitleCache()
      console.log("Frame cache cleared")
    } catch (error) {
      console.error("Failed to clear frame cache:", error)
      throw error
    }
  }
}

// Экспорт singleton instance
export const frameExtractionService = FrameExtractionService.getInstance()
