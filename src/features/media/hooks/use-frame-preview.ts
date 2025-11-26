import { useCallback, useState } from "react"

import {
  ExtractionPurpose,
  FrameExtractionService,
  type TimelineFrame,
} from "@/domains/video-editing/services/compiler"
import { createLogger } from "@/lib/tauri-logger"

import { useMediaPreview } from "./use-media-preview"

const logger = createLogger("FramePreview")

export interface UseFramePreviewOptions {
  onFramesExtracted?: (frames: TimelineFrame[]) => void
  onError?: (error: string) => void
}

/**
 * Хук для интеграции извлечения кадров с Preview Manager
 * Объединяет функциональность Frame Extraction Service и Preview Manager
 */
export function useFramePreview(options: UseFramePreviewOptions = {}) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { getPreviewData, generateThumbnail, clearPreviewData, saveTimelineFrames } = useMediaPreview()
  const frameExtraction = FrameExtractionService.getInstance()

  /**
   * Извлечь кадры с кэшированием через Preview Manager
   */
  const extractTimelineFrames = useCallback(
    async (
      fileId: string,
      videoPath: string,
      duration: number,
      interval = 1.0,
      maxFrames?: number,
    ): Promise<TimelineFrame[]> => {
      try {
        setIsExtracting(true)
        setError(null)

        // Сначала проверяем IndexedDB кэш
        const indexedDBCached = await frameExtraction.getCachedFrames(videoPath)
        if (indexedDBCached && indexedDBCached.length > 0) {
          logger.infoSync("Using cached frames from IndexedDB", { videoPath, framesCount: indexedDBCached.length })
          options.onFramesExtracted?.(indexedDBCached)
          return indexedDBCached
        }

        // Затем проверяем кэш Preview Manager
        const cachedData = await getPreviewData(fileId)
        if (cachedData?.timeline_previews && cachedData.timeline_previews.length > 0) {
          logger.infoSync("Using cached frames from Preview Manager", {
            fileId,
            framesCount: cachedData.timeline_previews.length,
          })
          const frames = cachedData.timeline_previews.map((frame) => ({
            timestamp: frame.timestamp,
            frameData: frame.base64_data || "",
            isKeyframe: (frame as any).is_keyframe || false,
          }))

          options.onFramesExtracted?.(frames)
          return frames
        }

        // Если нет в кэше, извлекаем кадры через FrameExtractionService
        const extractedFrames = await frameExtraction.extractTimelineFrames(videoPath, duration, interval, maxFrames)

        if (!extractedFrames || extractedFrames.length === 0) {
          return []
        }

        // Преобразуем в нужный формат
        const frames = extractedFrames.map((frame) => ({
          timestamp: frame.timestamp,
          frameData: frame.frameData,
          isKeyframe: frame.isKeyframe,
        }))

        // Сохраняем кадры в Preview Manager
        await saveTimelineFrames(
          fileId,
          frames.map((frame) => ({
            timestamp: frame.timestamp,
            base64_data: frame.frameData,
            is_keyframe: frame.isKeyframe,
          })),
        )

        options.onFramesExtracted?.(frames)
        return frames
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to extract frames"
        setError(errorMsg)
        options.onError?.(errorMsg)
        throw err
      } finally {
        setIsExtracting(false)
      }
    },
    [getPreviewData, generateThumbnail, saveTimelineFrames, frameExtraction, options],
  )

  /**
   * Извлечь кадры для распознавания с кэшированием
   */
  const extractRecognitionFrames = useCallback(
    async (
      fileId: string,
      videoPath: string,
      interval = 1.0,
      purpose: ExtractionPurpose = ExtractionPurpose.ObjectDetection,
    ) => {
      try {
        setIsExtracting(true)
        setError(null)

        // Проверяем кэш для recognition frames
        const cachedData = await getPreviewData(fileId)
        if (cachedData?.recognition_frames && cachedData.recognition_frames.length > 0) {
          logger.infoSync("Using cached recognition frames", {
            fileId,
            framesCount: cachedData.recognition_frames.length,
          })
          return cachedData.recognition_frames
        }

        // Извлекаем кадры для распознавания
        const frames = await frameExtraction.extractRecognitionFrames(videoPath, purpose, interval)

        return frames
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to extract recognition frames"
        setError(errorMsg)
        options.onError?.(errorMsg)
        throw err
      } finally {
        setIsExtracting(false)
      }
    },
    [getPreviewData, frameExtraction, options],
  )

  /**
   * Получить превью для конкретного таймстампа
   */
  const getFrameAtTimestamp = useCallback(
    async (
      fileId: string,
      timestamp: number,
    ): Promise<{ timestamp: number; base64_data: string; is_keyframe: boolean } | null> => {
      try {
        // Проверяем, есть ли сохраненные кадры для этого файла
        const previewData = await getPreviewData(fileId)

        if (!previewData?.timeline_previews || previewData.timeline_previews.length === 0) {
          return null
        }

        // Находим ближайший кадр по временной метке
        let closestFrame = previewData.timeline_previews[0]
        let closestDiff = Math.abs(closestFrame.timestamp - timestamp)

        for (const frame of previewData.timeline_previews) {
          const diff = Math.abs(frame.timestamp - timestamp)
          if (diff < closestDiff) {
            closestDiff = diff
            closestFrame = frame
          }
        }

        return {
          timestamp: closestFrame.timestamp,
          base64_data: closestFrame.base64_data || "",
          is_keyframe: false,
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to get frame at timestamp"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return null
      }
    },
    [getPreviewData, options],
  )

  const clearTimelineFrames = useCallback(
    async (fileId: string): Promise<boolean> => {
      try {
        return await clearPreviewData(fileId)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to clear timeline frames"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return false
      }
    },
    [clearPreviewData, options],
  )

  return {
    extractTimelineFrames,
    extractRecognitionFrames,
    getFrameAtTimestamp,
    clearTimelineFrames,
    isExtracting,
    error,
  }
}
