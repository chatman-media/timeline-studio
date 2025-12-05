/**
 * Tauri Media Adapter
 *
 * Реализация IMediaService для Tauri.
 * Использует invoke() для вызова Rust backend команд.
 */

import { invoke } from "@tauri-apps/api/core"

import type {
  IMediaService,
  MediaImportOptions,
  MediaImportResult,
  MediaMetadata,
  MediaPreviewData,
  ProcessMediaOptions,
  ProcessMediaResult,
  ProxyGenerationOptions,
  ProxyGenerationResult,
  ScannedMediaFile,
  SceneDetectionResult,
  ThumbnailOptions,
  WaveformOptions,
} from "@/core/ports"
import type { MediaFile } from "@/features/media/types/media"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("TauriMediaService")

export class TauriMediaService implements IMediaService {
  // ============================================================================
  // Metadata
  // ============================================================================

  async getMetadata(filePath: string): Promise<MediaMetadata> {
    logger.debugSync("Getting media metadata", { filePath })
    try {
      const result = await invoke<MediaMetadata>("get_media_metadata", { filePath })
      logger.debugSync("Media metadata retrieved", { filePath })
      return result
    } catch (error) {
      logger.errorSync("Failed to get media metadata", { filePath, error })
      throw error
    }
  }

  async getMediaFiles(directory: string): Promise<string[]> {
    logger.debugSync("Getting media files", { directory })
    try {
      const result = await invoke<string[]>("get_media_files", { directory })
      logger.debugSync("Media files retrieved", { count: result.length })
      return result
    } catch (error) {
      logger.errorSync("Failed to get media files", { directory, error })
      throw error
    }
  }

  // ============================================================================
  // Processing
  // ============================================================================

  async processFile(filePath: string, options?: ProcessMediaOptions): Promise<ProcessMediaResult> {
    const generateThumbnail = options?.generateThumbnail ?? true
    const extractAudio = options?.extractAudio ?? false

    logger.infoSync("Processing media file", { filePath, generateThumbnail, extractAudio })
    try {
      const result = await invoke<ProcessMediaResult>("process_media_file_simple", {
        filePath,
        generateThumbnail,
        extractAudio,
      })
      logger.infoSync("Media file processed", { filePath })
      return result
    } catch (error) {
      logger.errorSync("Failed to process media file", { filePath, error })
      throw error
    }
  }

  async cancelProcessing(filePath: string): Promise<void> {
    logger.infoSync("Cancelling media processing", { filePath })
    try {
      await invoke("cancel_media_processing", { filePath })
      logger.infoSync("Media processing cancelled", { filePath })
    } catch (error) {
      logger.errorSync("Failed to cancel media processing", { filePath, error })
      throw error
    }
  }

  // ============================================================================
  // Thumbnails
  // ============================================================================

  async generateThumbnail(fileId: string, filePath: string, options?: ThumbnailOptions): Promise<string> {
    const width = options?.width ?? 320
    const height = options?.height ?? 180
    const timestamp = options?.timestamp ?? 0

    logger.debugSync("Generating media thumbnail", { fileId, width, height, timestamp })
    try {
      const result = await invoke<string>("generate_media_thumbnail", {
        fileId,
        filePath,
        width,
        height,
        timestamp,
      })
      logger.debugSync("Media thumbnail generated", { fileId })
      return result
    } catch (error) {
      logger.errorSync("Failed to generate media thumbnail", { fileId, error })
      throw error
    }
  }

  async hasCachedThumbnail(fileId: string, width: number, height: number): Promise<boolean> {
    logger.debugSync("Checking if cached thumbnail exists", { fileId, width, height })
    try {
      const result = await invoke<boolean>("has_cached_thumbnail", { fileId, width, height })
      return result
    } catch (error) {
      logger.errorSync("Failed to check cached thumbnail", { fileId, width, height, error })
      throw error
    }
  }

  async getCachedThumbnailPath(fileId: string, width: number, height: number): Promise<string> {
    logger.debugSync("Getting cached thumbnail path", { fileId, width, height })
    try {
      const result = await invoke<string>("get_cached_thumbnail_path", { fileId, width, height })
      return result
    } catch (error) {
      logger.errorSync("Failed to get cached thumbnail path", { fileId, width, height, error })
      throw error
    }
  }

  // ============================================================================
  // Preview Data
  // ============================================================================

  async savePreviewData(path: string): Promise<void> {
    logger.debugSync("Saving preview data", { path })
    try {
      await invoke("save_preview_data", { path })
      logger.debugSync("Preview data saved", { path })
    } catch (error) {
      logger.errorSync("Failed to save preview data", { path, error })
      throw error
    }
  }

  async loadPreviewData(path: string): Promise<MediaPreviewData | null> {
    logger.debugSync("Loading preview data", { path })
    try {
      const result = await invoke<MediaPreviewData | null>("load_preview_data", { path })
      logger.debugSync("Preview data loaded", { path })
      return result
    } catch (error) {
      logger.errorSync("Failed to load preview data", { path, error })
      throw error
    }
  }

  async getPreviewData(fileId: string): Promise<MediaPreviewData | null> {
    logger.debugSync("Getting media preview data", { fileId })
    try {
      const result = await invoke<MediaPreviewData | null>("get_media_preview_data", { fileId })
      logger.debugSync("Media preview data retrieved", { fileId })
      return result
    } catch (error) {
      logger.errorSync("Failed to get media preview data", { fileId, error })
      throw error
    }
  }

  async clearPreviewData(fileId?: string): Promise<void> {
    if (fileId) {
      logger.debugSync("Clearing media preview data for file", { fileId })
      try {
        await invoke("clear_media_preview_data", { fileId })
        logger.debugSync("Media preview data cleared for file", { fileId })
      } catch (error) {
        logger.errorSync("Failed to clear media preview data for file", { fileId, error })
        throw error
      }
    } else {
      logger.infoSync("Clearing all media preview data")
      try {
        await invoke("clear_media_preview_data")
        logger.infoSync("Media preview data cleared")
      } catch (error) {
        logger.errorSync("Failed to clear media preview data", { error })
        throw error
      }
    }
  }

  // ============================================================================
  // Timeline Frames
  // ============================================================================

  async saveTimelineFrames(fileId: string, frames: string[]): Promise<void> {
    logger.debugSync("Saving timeline frames for file", { fileId, count: frames.length })
    try {
      await invoke("save_timeline_frames", { fileId, frames })
      logger.debugSync("Timeline frames saved for file", { fileId, count: frames.length })
    } catch (error) {
      logger.errorSync("Failed to save timeline frames for file", { fileId, error })
      throw error
    }
  }

  async getTimelineFrames(fileId: string): Promise<string[]> {
    logger.debugSync("Getting timeline frames for file", { fileId })
    try {
      const result = await invoke<string[]>("get_timeline_frames", { fileId })
      logger.debugSync("Timeline frames retrieved for file", { fileId, count: result.length })
      return result
    } catch (error) {
      logger.errorSync("Failed to get timeline frames for file", { fileId, error })
      throw error
    }
  }

  // ============================================================================
  // Folder Scanning
  // ============================================================================

  async scanFolder(folderPath: string): Promise<ScannedMediaFile[]> {
    logger.infoSync("Scanning folder", { folderPath })
    try {
      const result = await invoke<ScannedMediaFile[]>("scan_media_folder", { folderPath })
      logger.infoSync("Folder scanned successfully", { folderPath, filesCount: result.length })
      return result
    } catch (error) {
      logger.errorSync("Failed to scan folder", { folderPath, error })
      throw error
    }
  }

  async scanFolderWithThumbnails(folderPath: string, width: number, height: number): Promise<ScannedMediaFile[]> {
    logger.infoSync("Scanning folder with thumbnails", { folderPath, width, height })
    try {
      const result = await invoke<ScannedMediaFile[]>("scan_media_folder_with_thumbnails", {
        folderPath,
        width,
        height,
      })
      logger.infoSync("Folder scanned with thumbnails successfully", {
        folderPath,
        filesCount: result.length,
      })
      return result
    } catch (error) {
      logger.errorSync("Failed to scan folder with thumbnails", { folderPath, width, height, error })
      throw error
    }
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  async getFilesWithPreviews(): Promise<string[]> {
    logger.debugSync("Getting files with previews")
    try {
      const result = await invoke<string[]>("get_files_with_previews")
      logger.debugSync("Files with previews retrieved", { count: result.length })
      return result
    } catch (error) {
      logger.errorSync("Failed to get files with previews", { error })
      throw error
    }
  }

  async restorePreviewCache(): Promise<number> {
    logger.debugSync("Restoring preview cache")
    try {
      const result = await invoke<number>("restore_preview_cache")
      logger.debugSync("Preview cache restored", { count: result })
      return result
    } catch (error) {
      logger.errorSync("Failed to restore preview cache", { error })
      throw error
    }
  }

  // ============================================================================
  // Device Operations
  // ============================================================================

  async ejectDevice(deviceId: string): Promise<void> {
    logger.infoSync("Ejecting device", { deviceId })
    try {
      await invoke("eject_device", { deviceId })
      logger.infoSync("Device ejected", { deviceId })
    } catch (error) {
      logger.errorSync("Failed to eject device", { deviceId, error })
      throw error
    }
  }

  // ============================================================================
  // Import Operations
  // ============================================================================

  async importFiles(paths: string[], options?: MediaImportOptions): Promise<MediaImportResult> {
    logger.infoSync("Importing media files", { count: paths.length })
    try {
      const result = await invoke<MediaImportResult>("import_media_files", {
        paths,
        options: {
          copy_to_project: options?.copyToProject ?? true,
          create_proxies: options?.createProxies ?? false,
          analyze_content: options?.analyzeContent ?? true,
          generate_thumbnails: options?.generateThumbnails ?? true,
          preserve_metadata: options?.preserveMetadata ?? true,
        },
      })

      // Ensure result has expected structure
      const safeResult: MediaImportResult = {
        imported: result?.imported ?? [],
        failed: result?.failed ?? [],
      }

      logger.infoSync("Media files imported", {
        imported: safeResult.imported.length,
        failed: safeResult.failed.length,
      })
      return safeResult
    } catch (error) {
      logger.errorSync("Failed to import media files", { error })
      throw error
    }
  }

  // ============================================================================
  // Batch Processing
  // ============================================================================

  async processFiles(filePaths: string[]): Promise<ScannedMediaFile[]> {
    logger.infoSync("Processing media files", { count: filePaths.length })
    try {
      const files = await invoke<MediaFile[]>("process_media_files", { filePaths })
      logger.infoSync("Media files processed", { count: files.length })
      return files as unknown as ScannedMediaFile[]
    } catch (error) {
      logger.errorSync("Failed to process media files", { error })
      throw error
    }
  }

  async processFilesWithThumbnails(filePaths: string[], width: number, height: number): Promise<ScannedMediaFile[]> {
    logger.infoSync("Processing media files with thumbnails", { count: filePaths.length, width, height })
    try {
      const files = await invoke<MediaFile[]>("process_media_files_with_thumbnails", {
        filePaths,
        width,
        height,
      })
      logger.infoSync("Media files processed with thumbnails", { count: files.length })
      return files as unknown as ScannedMediaFile[]
    } catch (error) {
      logger.errorSync("Failed to process media files with thumbnails", { error })
      throw error
    }
  }

  // ============================================================================
  // Audio Analysis
  // ============================================================================

  async generateWaveformPreview(audioPath: string, outputPath: string, options?: WaveformOptions): Promise<string> {
    const width = options?.width ?? 1000
    const height = options?.height ?? 100
    const color = options?.color ?? "#3b82f6"

    logger.infoSync("Generating waveform preview", { audioPath, outputPath, width, height })
    try {
      const resultPath = await invoke<string>("generate_waveform_preview", {
        audioPath,
        outputPath,
        width,
        height,
        color,
      })
      logger.infoSync("Waveform preview generated", { resultPath })
      return resultPath
    } catch (error) {
      logger.errorSync("Failed to generate waveform preview", { audioPath, error })
      throw error
    }
  }

  async generateAudioWaveform(filePath: string): Promise<number[]> {
    logger.infoSync("Generating audio waveform", { filePath })
    try {
      const waveformData = await invoke<number[]>("generate_audio_waveform", {
        path: filePath,
      })
      logger.infoSync("Audio waveform generated", { samplesCount: waveformData.length })
      return waveformData
    } catch (error) {
      logger.errorSync("Failed to generate audio waveform", { filePath, error })
      throw error
    }
  }

  // ============================================================================
  // Video Analysis
  // ============================================================================

  async detectVideoScenes(filePath: string): Promise<SceneDetectionResult[]> {
    logger.infoSync("Detecting video scenes", { filePath })
    try {
      const scenes = await invoke<SceneDetectionResult[]>("detect_video_scenes", {
        path: filePath,
      })
      logger.infoSync("Video scenes detected", { scenesCount: scenes.length })
      return scenes
    } catch (error) {
      logger.errorSync("Failed to detect video scenes", { filePath, error })
      throw error
    }
  }

  async generateVideoThumbnail(videoPath: string, time: number): Promise<string> {
    logger.infoSync("Generating video thumbnail", { videoPath, time })
    try {
      const thumbnailPath = await invoke<string>("generate_video_thumbnail", {
        videoPath,
        time,
      })
      logger.infoSync("Video thumbnail generated", { thumbnailPath })
      return thumbnailPath
    } catch (error) {
      logger.errorSync("Failed to generate video thumbnail", { videoPath, error })
      throw error
    }
  }

  async extractMediaMetadata(filePath: string): Promise<MediaMetadata> {
    logger.infoSync("Extracting media metadata", { filePath })
    try {
      const metadata = await invoke<MediaMetadata>("extract_media_metadata", {
        path: filePath,
      })
      logger.infoSync("Media metadata extracted", { filePath })
      return metadata
    } catch (error) {
      logger.errorSync("Failed to extract media metadata", { filePath, error })
      throw error
    }
  }

  async getMediaDuration(filePath: string): Promise<number> {
    logger.infoSync("Getting media duration", { filePath })
    try {
      const result = await invoke<{
        success: boolean
        data?: number
        error?: string
      }>("execute_command", {
        command: {
          type: "GetMediaDuration",
          params: {
            file_path: filePath,
          },
        },
      })

      if (!result.success || result.data === undefined) {
        throw new Error(result.error || "Failed to get duration")
      }

      logger.infoSync("Media duration retrieved", { duration: result.data })
      return result.data
    } catch (error) {
      logger.errorSync("Failed to get media duration", { filePath, error })
      throw error
    }
  }

  // ============================================================================
  // Proxy Generation
  // ============================================================================

  async generateProxy(sourcePath: string, options: ProxyGenerationOptions): Promise<ProxyGenerationResult> {
    logger.infoSync("Generating proxy", { sourcePath, options })
    try {
      const result = await invoke<ProxyGenerationResult>("generate_proxy_command", {
        sourcePath,
        width: options.width,
        height: options.height,
        codec: options.codec || "h264",
        bitrate: options.bitrate || "3M",
        preserveAudio: options.preserveAudio ?? true,
        fps: options.fps,
      })
      logger.infoSync("Proxy generated", { proxyPath: result.proxyPath })
      return result
    } catch (error) {
      logger.errorSync("Failed to generate proxy", { sourcePath, error })
      throw error
    }
  }
}
