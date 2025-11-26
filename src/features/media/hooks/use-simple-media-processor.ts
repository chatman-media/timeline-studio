import { convertFileSrc } from "@tauri-apps/api/core"
import { useCallback, useState } from "react"

import { mediaProcessorService } from "@/domains/media-management/services/media-processor-service"
import type { MediaFile } from "@/features/media/types/media"
import { MediaType } from "@/features/media/types/media"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("SimpleMediaProcessor")

interface SimpleMediaMetadata {
  duration?: number
  width?: number
  height?: number
  fps?: number
  bitrate?: number
  video_codec?: string
  audio_codec?: string
  has_audio?: boolean
  has_video?: boolean
}

interface ProcessedMediaFile {
  id: string
  path: string
  name: string
  size: number
  metadata?: SimpleMediaMetadata
  thumbnail_path?: string
  error?: string
}

export interface UseSimpleMediaProcessorOptions {
  onProgress?: (current: number, total: number) => void
  generateThumbnails?: boolean
}

/**
 * Упрощенный хук для обработки медиа файлов
 * - Быстрая базовая проверка файлов
 * - Опциональная генерация превью
 * - Без streaming сервера
 * - Минимальная обработка метаданных
 */
export function useSimpleMediaProcessor(options: UseSimpleMediaProcessorOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const processFiles = useCallback(
    async (filePaths: string[]): Promise<MediaFile[]> => {
      setIsProcessing(true)
      setProgress({ current: 0, total: filePaths.length })

      try {
        const processedFiles: MediaFile[] = []

        for (let i = 0; i < filePaths.length; i++) {
          const filePath = filePaths[i]

          // Обновляем прогресс
          setProgress({ current: i, total: filePaths.length })
          options.onProgress?.(i, filePaths.length)

          try {
            // Вызываем упрощенную команду через domain service
            const processed = (await mediaProcessorService.processFileSimple(
              filePath,
              options.generateThumbnails || false,
            )) as ProcessedMediaFile

            // Определяем тип файла по метаданным
            const isVideo = processed.metadata?.has_video || false
            const isAudio = processed.metadata?.has_audio || false
            const isImage = !isVideo && !isAudio && /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(processed.name)

            // Определяем MediaType
            const mediaType = isVideo
              ? MediaType.Video
              : isAudio
                ? MediaType.Audio
                : isImage
                  ? MediaType.StillImage
                  : MediaType.Unknown

            // Создаем объект MediaFile
            const mediaFile: MediaFile = {
              id: processed.id,
              name: processed.name,
              path: processed.path,
              type: mediaType,
              size: processed.size,
              duration: processed.metadata?.duration,
              isVideo,
              isAudio: isAudio && !isVideo,
              isImage,
              createdAt: new Date(),
              updatedAt: new Date(),
              source: "browser",
              thumbnailPath: processed.thumbnail_path,
              // Не устанавливаем isLoadingMetadata - файл сразу готов к использованию
            }

            // Если есть метаданные видео, добавляем базовую информацию
            if (processed.metadata && (isVideo || isAudio)) {
              mediaFile.probeData = {
                format: {
                  duration: processed.metadata.duration,
                  bit_rate: processed.metadata.bitrate ? Number(processed.metadata.bitrate) : undefined,
                  size: processed.size ? Number(processed.size) : undefined,
                  filename: processed.path,
                },
                streams: [],
              }

              // Добавляем видео поток
              if (isVideo && processed.metadata.width && processed.metadata.height) {
                mediaFile.probeData.streams.push({
                  codec_type: "video",
                  codec_name: processed.metadata.video_codec,
                  width: processed.metadata.width,
                  height: processed.metadata.height,
                  r_frame_rate: processed.metadata.fps ? `${processed.metadata.fps}/1` : undefined,
                  index: 0,
                })
              }

              // Добавляем аудио поток
              if (processed.metadata.has_audio) {
                mediaFile.probeData.streams.push({
                  codec_type: "audio",
                  codec_name: processed.metadata.audio_codec,
                  index: isVideo ? 1 : 0,
                })
              }
            }

            processedFiles.push(mediaFile)
          } catch (error) {
            logger.errorSync("Failed to process file", { filePath, error })

            // Даже при ошибке добавляем файл с базовой информацией
            const fileName = filePath.split("/").pop() || filePath.split("\\").pop() || "Unknown"
            const isVideo = /\.(mp4|avi|mov|mkv|webm)$/i.test(fileName)
            const isAudio = /\.(mp3|wav|ogg|m4a|aac)$/i.test(fileName)
            const isImage = /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(fileName)
            const errorMediaType = isVideo
              ? MediaType.Video
              : isAudio
                ? MediaType.Audio
                : isImage
                  ? MediaType.StillImage
                  : MediaType.Unknown

            processedFiles.push({
              id: `file-${Date.now()}-${i}`,
              name: fileName,
              path: filePath,
              type: errorMediaType,
              size: 0,
              isVideo,
              isAudio,
              isImage,
              createdAt: new Date(),
              updatedAt: new Date(),
              source: "browser",
            })
          }
        }

        // Финальный прогресс
        setProgress({ current: filePaths.length, total: filePaths.length })
        options.onProgress?.(filePaths.length, filePaths.length)

        return processedFiles
      } finally {
        setIsProcessing(false)
      }
    },
    [options],
  )

  /**
   * Получить URL для прямого доступа к файлу через Tauri
   * Вместо streaming сервера используем convertFileSrc
   */
  const getFileUrl = useCallback((filePath: string): string => {
    return convertFileSrc(filePath)
  }, [])

  return {
    processFiles,
    getFileUrl,
    isProcessing,
    progress,
  }
}
