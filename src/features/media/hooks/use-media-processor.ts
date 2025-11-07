import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { useCallback, useEffect, useState } from "react"

import type { MediaFile } from "@/features/media/types/media"
import { cacheMediaMetadata, getCachedMetadata } from "@/features/video-compiler/services/metadata-cache-service"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("MediaProcessor")

// Типы событий процессора
export interface DiscoveredFile {
  id: string
  path: string
  name: string
  extension: string
  size: number
}

export interface ProcessorEvent {
  type: "FilesDiscovered" | "MetadataReady" | "ThumbnailReady" | "ProcessingError" | "ScanProgress"
  data: FilesDiscoveredData | MetadataReadyData | ThumbnailReadyData | ProcessingErrorData | ScanProgressData
}

interface FilesDiscoveredData {
  files: DiscoveredFile[]
  total: number
}

interface MetadataReadyData {
  file_id: string
  file_path: string
  metadata: MediaFile
}

interface ThumbnailReadyData {
  file_id: string
  file_path: string
  thumbnail_path: string
  thumbnail_data?: string // Base64
}

interface ProcessingErrorData {
  file_id: string
  file_path: string
  error: string
}

interface ScanProgressData {
  current: number
  total: number
}

export interface UseMediaProcessorOptions {
  onFilesDiscovered?: (files: DiscoveredFile[]) => void
  onMetadataReady?: (fileId: string, metadata: MediaFile) => void
  onThumbnailReady?: (fileId: string, thumbnailPath: string, thumbnailData?: string) => void
  onError?: (fileId: string, error: string) => void
  onProgress?: (current: number, total: number) => void
}

// Helper function to cache metadata
async function cacheMetadataIfValid(metadata: MediaFile) {
  if (metadata.duration && metadata.duration > 0 && metadata.probeData) {
    try {
      // Извлекаем информацию из probeData
      const videoStream = metadata.probeData.streams?.find((s) => s.codec_type === "video")
      const audioStream = metadata.probeData.streams?.find((s) => s.codec_type === "audio")

      await cacheMediaMetadata(metadata.path, {
        file_path: metadata.path,
        file_size: metadata.size || 0,
        modified_time: new Date().toISOString(), // или из metadata если есть
        duration: metadata.duration || 0,
        resolution:
          videoStream && videoStream.width && videoStream.height ? [videoStream.width, videoStream.height] : undefined,
        fps: videoStream?.r_frame_rate ? parseFrameRate(videoStream.r_frame_rate) : undefined,
        bitrate: metadata.probeData.format?.bit_rate ? Number(metadata.probeData.format.bit_rate) : undefined,
        video_codec: videoStream?.codec_name,
        audio_codec: audioStream?.codec_name,
        cached_at: new Date().toISOString(),
      })
    } catch (error) {
      logger.errorSync("Failed to cache metadata", { error })
    }
  }
}

// Вспомогательная функция для парсинга frame rate
function parseFrameRate(frameRate: string): number | undefined {
  if (!frameRate) return undefined
  const [num, denom] = frameRate.split("/")
  if (num && denom) {
    return Number.parseFloat(num) / Number.parseFloat(denom)
  }
  return Number.parseFloat(frameRate) || undefined
}

export function useMediaProcessor(options: UseMediaProcessorOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [errors, setErrors] = useState<Map<string, string>>(new Map())

  // Извлекаем callbacks из options для стабильных ссылок
  const { onFilesDiscovered, onMetadataReady, onThumbnailReady, onError, onProgress } = options

  useEffect(() => {
    // Подписываемся на события процессора
    const unlisten = listen<ProcessorEvent>("media-processor", (event) => {
      const { type, data } = event.payload

      switch (type) {
        case "FilesDiscovered":
          onFilesDiscovered?.((data as FilesDiscoveredData).files)
          break

        case "MetadataReady": {
          const metadataData = data as MetadataReadyData
          // Cache the metadata for future use
          void cacheMetadataIfValid(metadataData.metadata)
          onMetadataReady?.(metadataData.file_id, metadataData.metadata)
          break
        }

        case "ThumbnailReady": {
          const thumbnailData = data as ThumbnailReadyData
          onThumbnailReady?.(thumbnailData.file_id, thumbnailData.thumbnail_path, thumbnailData.thumbnail_data)
          break
        }

        case "ProcessingError": {
          const errorData = data as ProcessingErrorData
          setErrors((prev) => new Map(prev).set(errorData.file_id, errorData.error))
          onError?.(errorData.file_id, errorData.error)
          break
        }

        case "ScanProgress": {
          const progressData = data as ScanProgressData
          setProgress({ current: progressData.current, total: progressData.total })
          onProgress?.(progressData.current, progressData.total)
          break
        }
        default:
          // Неизвестный тип события, игнорируем
          break
      }
    })

    return () => {
      void unlisten.then((fn) => fn())
    }
  }, [onFilesDiscovered, onMetadataReady, onThumbnailReady, onError, onProgress])

  const scanFolder = useCallback(async (folderPath: string): Promise<MediaFile[]> => {
    setIsProcessing(true)
    setErrors(new Map())
    setProgress({ current: 0, total: 0 })

    try {
      const files = await invoke<MediaFile[]>("scan_media_folder", {
        folderPath,
      })
      return files
    } catch (error) {
      logger.errorSync("Failed to scan folder", { folderPath, error })
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const scanFolderWithThumbnails = useCallback(
    async (folderPath: string, width = 320, height = 180): Promise<MediaFile[]> => {
      setIsProcessing(true)
      setErrors(new Map())
      setProgress({ current: 0, total: 0 })

      try {
        const files = await invoke<MediaFile[]>("scan_media_folder_with_thumbnails", {
          folderPath,
          width,
          height,
        })
        return files
      } catch (error) {
        logger.errorSync("Failed to scan folder with thumbnails", { folderPath, width, height, error })
        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [],
  )

  const processFiles = useCallback(async (filePaths: string[]): Promise<MediaFile[]> => {
    setIsProcessing(true)
    setErrors(new Map())
    setProgress({ current: 0, total: filePaths.length })

    try {
      // Проверяем кэш для файлов перед обработкой
      const cachedMetadata = await Promise.all(
        filePaths.map(async (path) => {
          const cached = await getCachedMetadata(path)
          return cached ? { path, cached } : null
        }),
      )

      // Логируем статистику кэша
      const cachedCount = cachedMetadata.filter((m) => m !== null).length
      if (cachedCount > 0) {
        logger.infoSync("Found files in metadata cache", { cachedCount, totalCount: filePaths.length })
      }

      const files = await invoke<MediaFile[]>("process_media_files", {
        filePaths,
      })
      return files
    } catch (error) {
      logger.errorSync("Failed to process files", { filesCount: filePaths.length, error })
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const processFilesWithThumbnails = useCallback(
    async (filePaths: string[], width = 320, height = 180): Promise<MediaFile[]> => {
      setIsProcessing(true)
      setErrors(new Map())
      setProgress({ current: 0, total: filePaths.length })

      try {
        const files = await invoke<MediaFile[]>("process_media_files_with_thumbnails", {
          filePaths,
          width,
          height,
        })
        return files
      } catch (error) {
        logger.errorSync("Failed to process files with thumbnails", {
          filesCount: filePaths.length,
          width,
          height,
          error,
        })
        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [],
  )

  const clearErrors = useCallback(() => {
    setErrors(new Map())
  }, [])

  const cancelProcessing = useCallback(async () => {
    try {
      await invoke("cancel_media_processing")
      setIsProcessing(false)
      setProgress({ current: 0, total: 0 })
    } catch (error) {
      logger.errorSync("Failed to cancel processing", { error })
    }
  }, [])

  return {
    scanFolder,
    scanFolderWithThumbnails,
    processFiles,
    processFilesWithThumbnails,
    isProcessing,
    progress,
    errors,
    clearErrors,
    cancelProcessing,
  }
}
