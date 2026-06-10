/**
 * HTTP Media Adapter
 *
 * Реализация IMediaService через tRPC для подключения к src-node серверу.
 * Используется в браузерном режиме вместо Tauri IPC.
 */

import { nodeBackendClient } from "@timeline-studio/adapters/node/node-backend-client"
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
  ScanFolderOptions,
  ScannedMediaFile,
  SceneDetectionResult,
  ThumbnailOptions,
  WaveformOptions,
} from "@timeline-studio/core/ports"

export class HttpMediaService implements IMediaService {
  // ============================================================================
  // Metadata
  // ============================================================================

  async getMetadata(filePath: string): Promise<MediaMetadata> {
    return nodeBackendClient.media.getMetadata.query({ filePath })
  }

  async extractMediaMetadata(filePath: string): Promise<MediaMetadata> {
    return this.getMetadata(filePath)
  }

  async getMediaDuration(filePath: string): Promise<number> {
    const meta = await this.getMetadata(filePath)
    if (meta.type === "Video" || meta.type === "Audio") {
      return meta.duration ?? 0
    }
    return 0
  }

  // ============================================================================
  // Scanning
  // ============================================================================

  async scanFolder(folderPath: string, options?: ScanFolderOptions): Promise<ScannedMediaFile[]> {
    return nodeBackendClient.media.scanFolder.mutate({
      folderPath,
      recursive: options?.recursive ?? false,
    })
  }

  async scanFolderWithThumbnails(folderPath: string, width: number, height: number): Promise<ScannedMediaFile[]> {
    return nodeBackendClient.media.scanWithThumbnails.mutate({ folderPath, width, height })
  }

  async getMediaFiles(_directory: string): Promise<string[]> {
    return []
  }

  // ============================================================================
  // Processing
  // ============================================================================

  async processFile(_filePath: string, _options?: ProcessMediaOptions): Promise<ProcessMediaResult> {
    throw new Error("HttpMediaService: processFile not supported — use processFiles")
  }

  async cancelProcessing(_filePath: string): Promise<void> {
    // no-op: src-node queue handles cancellation
  }

  async processFiles(filePaths: string[]): Promise<ScannedMediaFile[]> {
    return nodeBackendClient.media.processFiles.mutate({ filePaths })
  }

  async processFilesWithThumbnails(filePaths: string[], width: number, height: number): Promise<ScannedMediaFile[]> {
    return nodeBackendClient.media.processFiles.mutate({
      filePaths,
      generateThumbnails: true,
      width,
      height,
    })
  }

  async importFiles(paths: string[], options?: MediaImportOptions): Promise<MediaImportResult> {
    return nodeBackendClient.media.importFiles.mutate({
      paths,
      options: {
        generateThumbnails: options?.generateThumbnails,
        copyToProject: options?.copyToProject,
      },
    })
  }

  // ============================================================================
  // Thumbnails
  // ============================================================================

  async generateThumbnail(fileId: string, filePath: string, options?: ThumbnailOptions): Promise<string> {
    return nodeBackendClient.thumbnail.generate.mutate({
      fileId,
      filePath,
      width: options?.width,
      height: options?.height,
      timestamp: options?.timestamp,
    })
  }

  async generateVideoThumbnail(videoPath: string, time: number): Promise<string> {
    const fileId = btoa(videoPath)
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 32)
    return this.generateThumbnail(fileId, videoPath, { timestamp: time })
  }

  async hasCachedThumbnail(fileId: string, width: number, height: number): Promise<boolean> {
    const result = await nodeBackendClient.thumbnail.hasCached.query({ fileId, width, height })
    return result.hasCached
  }

  async getCachedThumbnailPath(fileId: string, width: number, height: number): Promise<string> {
    const result = await nodeBackendClient.thumbnail.getCachedPath.query({ fileId, width, height })
    return result.path
  }

  // ============================================================================
  // Waveform
  // ============================================================================

  async generateAudioWaveform(filePath: string): Promise<number[]> {
    return nodeBackendClient.waveform.generateData.query({ filePath })
  }

  async generateWaveformPreview(_audioPath: string, _outputPath: string, _options?: WaveformOptions): Promise<string> {
    throw new Error("HttpMediaService: generateWaveformPreview not supported")
  }

  // ============================================================================
  // Preview cache — src-node manages its own SQLite cache, stubs here
  // ============================================================================

  async savePreviewData(_path: string): Promise<void> {}

  async loadPreviewData(_path: string): Promise<MediaPreviewData | null> {
    return null
  }

  async getPreviewData(_fileId: string): Promise<MediaPreviewData | null> {
    return null
  }

  async clearPreviewData(_fileId?: string): Promise<void> {}

  async getFilesWithPreviews(): Promise<string[]> {
    return []
  }

  async restorePreviewCache(): Promise<number> {
    return 0
  }

  // ============================================================================
  // Timeline frames — not applicable in web+node mode
  // ============================================================================

  async saveTimelineFrames(_fileId: string, _frames: string[]): Promise<void> {}

  async getTimelineFrames(_fileId: string): Promise<string[]> {
    return []
  }

  // ============================================================================
  // Misc
  // ============================================================================

  async detectVideoScenes(_filePath: string): Promise<SceneDetectionResult[]> {
    return []
  }

  async generateProxy(_sourcePath: string, _options: ProxyGenerationOptions): Promise<ProxyGenerationResult> {
    throw new Error("HttpMediaService: generateProxy not supported in web mode")
  }

  async ejectDevice(_deviceId: string): Promise<void> {}
}
