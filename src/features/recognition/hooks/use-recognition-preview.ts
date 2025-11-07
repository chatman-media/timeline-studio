import { invoke } from "@tauri-apps/api/core"
import { useCallback, useState } from "react"

import { useMediaPreview } from "@/features/media/hooks/use-media-preview"
import type { RecognitionResults } from "@/features/media/types/preview"
import { logError, logInfo } from "@/lib/tauri-logger"

import type { YoloDetection, YoloVideoData } from "../types/yolo"

/**
 * Конвертирует RecognitionResults в YoloVideoData формат
 */
function convertRecognitionResultsToYoloData(
  fileId: string,
  filePath: string,
  recognitionResults: RecognitionResults,
): YoloVideoData {
  return {
    videoId: fileId,
    videoName: filePath.split("/").pop() || fileId,
    videoPath: filePath,
    frames: recognitionResults.objects.flatMap((obj) =>
      obj.timestamps.map((timestamp, index) => ({
        timestamp,
        detections: [
          {
            class: obj.class,
            confidence: obj.confidence,
            bbox: obj.bounding_boxes[index]
              ? {
                  x: obj.bounding_boxes[index].x,
                  y: obj.bounding_boxes[index].y,
                  width: obj.bounding_boxes[index].width,
                  height: obj.bounding_boxes[index].height,
                }
              : { x: 0, y: 0, width: 0, height: 0 },
          },
        ],
      })),
    ),
    metadata: {
      model: "YOLO",
      version: "v11",
      processedAt: recognitionResults.processed_at,
    },
  }
}

export interface UseRecognitionPreviewOptions {
  onRecognitionComplete?: (fileId: string, data: YoloVideoData) => void
  onError?: (error: string) => void
}

/**
 * Хук для интеграции распознавания с Preview Manager
 * Объединяет функциональность распознавания и кэширования превью
 */
export function useRecognitionPreview(options: UseRecognitionPreviewOptions = {}) {
  logInfo("[useRecognitionPreview] Инициализация хука для интеграции распознавания с Preview Manager")

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { getPreviewData } = useMediaPreview()

  /**
   * Запустить распознавание видео с кэшированием результатов
   */
  const processVideoRecognition = useCallback(
    async (
      fileId: string,
      videoPath: string,
      modelPath?: string,
      targetClasses?: string[],
    ): Promise<YoloVideoData | null> => {
      logInfo("[useRecognitionPreview] Запуск распознавания видео", { fileId, videoPath })
      try {
        setIsProcessing(true)
        setError(null)

        // Проверяем кэш Preview Manager
        const cachedData = await getPreviewData(fileId)
        if (cachedData?.recognition_results) {
          logInfo("[useRecognitionPreview] Использованы кэшированные результаты распознавания", { fileId })
          // Конвертируем RecognitionResults в YoloVideoData формат
          const yoloData = convertRecognitionResultsToYoloData(
            fileId,
            cachedData.file_path,
            cachedData.recognition_results,
          )
          options.onRecognitionComplete?.(fileId, yoloData)
          return yoloData
        }

        // Запускаем распознавание
        logInfo("[useRecognitionPreview] Запуск нового распознавания", { fileId, modelPath, targetClasses })
        const result = await invoke<YoloVideoData>("process_video_recognition", {
          videoPath,
          modelPath,
          targetClasses,
        })

        logInfo("[useRecognitionPreview] Распознавание завершено успешно", { fileId })
        options.onRecognitionComplete?.(fileId, result)
        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to process video recognition"
        setError(errorMsg)
        logError("[useRecognitionPreview] Ошибка распознавания видео", err)
        options.onError?.(errorMsg)
        return null
      } finally {
        setIsProcessing(false)
      }
    },
    [getPreviewData, options],
  )

  /**
   * Получить результаты распознавания для конкретного времени
   */
  const getRecognitionAtTimestamp = useCallback(
    async (fileId: string, timestamp: number): Promise<YoloDetection[]> => {
      try {
        // Сначала проверяем кэш
        const previewData = await getPreviewData(fileId)

        if (previewData?.recognition_results) {
          const yoloData = convertRecognitionResultsToYoloData(
            fileId,
            previewData.file_path,
            previewData.recognition_results,
          )

          // Находим ближайший кадр к запрошенному timestamp
          const closestFrame = yoloData.frames.reduce((prev, curr) => {
            return Math.abs(curr.timestamp - timestamp) < Math.abs(prev.timestamp - timestamp) ? curr : prev
          })

          return closestFrame.detections
        }

        return []
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to get recognition at timestamp"
        logError("[useRecognitionPreview] Ошибка получения распознавания по timestamp", err)
        return []
      }
    },
    [getPreviewData],
  )

  /**
   * Получить превью с наложенными результатами распознавания
   */
  const getPreviewWithRecognition = useCallback(
    async (fileId: string): Promise<string | null> => {
      try {
        const data = await invoke<{ preview_with_boxes?: string } | null>("get_preview_data_with_recognition", {
          fileId,
        })

        return data?.preview_with_boxes || null
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to get preview with recognition"
        setError(errorMsg)
        logError("[useRecognitionPreview] Ошибка получения превью с распознаванием", err)
        options.onError?.(errorMsg)
        return null
      }
    },
    [options],
  )

  /**
   * Обработать batch видео для распознавания
   */
  const processBatchRecognition = useCallback(
    async (
      files: Array<{ id: string; path: string }>,
      modelPath?: string,
      targetClasses?: string[],
    ): Promise<Map<string, YoloVideoData>> => {
      logInfo("[useRecognitionPreview] Запуск batch распознавания", { filesCount: files.length })
      try {
        setIsProcessing(true)
        setError(null)

        const results = new Map<string, YoloVideoData>()

        // Обрабатываем файлы параллельно, но с ограничением
        const batchSize = 3
        for (let i = 0; i < files.length; i += batchSize) {
          const batch = files.slice(i, i + batchSize)

          const batchResults = await Promise.all(
            batch.map((file) =>
              processVideoRecognition(file.id, file.path, modelPath, targetClasses).then((data) => ({
                id: file.id,
                data,
              })),
            ),
          )

          batchResults.forEach(({ id, data }) => {
            if (data) {
              results.set(id, data)
            }
          })
        }

        logInfo("[useRecognitionPreview] Batch распознавание завершено", { resultsCount: results.size })
        return results
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to process batch recognition"
        setError(errorMsg)
        logError("[useRecognitionPreview] Ошибка batch распознавания", err)
        options.onError?.(errorMsg)
        return new Map()
      } finally {
        setIsProcessing(false)
      }
    },
    [processVideoRecognition, options],
  )

  /**
   * Очистить результаты распознавания
   */
  const clearRecognitionResults = useCallback(
    async (fileId: string): Promise<boolean> => {
      try {
        await invoke("clear_recognition_results", { fileId })
        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to clear recognition results"
        setError(errorMsg)
        logError("[useRecognitionPreview] Ошибка очистки результатов распознавания", err)
        options.onError?.(errorMsg)
        return false
      }
    },
    [options],
  )

  return {
    processVideoRecognition,
    getRecognitionAtTimestamp,
    getPreviewWithRecognition,
    processBatchRecognition,
    clearRecognitionResults,
    isProcessing,
    error,
  }
}
