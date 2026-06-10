/**
 * Media Port Interface
 *
 * Контракт для работы с медиафайлами.
 * Реализации: TauriMediaService, NodeMediaService, MockMediaService
 */

import type { MediaPreviewData } from "../types/media-preview"

export type { MediaPreviewData } from "../types/media-preview"

// ============================================================================
// Types
// ============================================================================

/**
 * Video metadata
 */
export interface VideoMetadataFields {
  duration?: number
  width?: number
  height?: number
  fps?: number
  codec?: string
  bitrate?: number
  size?: number
  creation_time?: string
}

/**
 * Audio metadata
 */
export interface AudioMetadataFields {
  duration?: number
  codec?: string
  bitrate?: number
  sample_rate?: number
  channels?: number
  size?: number
  creation_time?: string
}

/**
 * Image metadata
 */
export interface ImageMetadataFields {
  width?: number
  height?: number
  format?: string
  size?: number
  creation_time?: string
}

/**
 * Discriminated union for media metadata
 * Matches the format returned by Rust backend
 */
export type MediaMetadata =
  | ({ type: "Video" } & VideoMetadataFields)
  | ({ type: "Audio" } & AudioMetadataFields)
  | ({ type: "Image" } & ImageMetadataFields)
  | { type: "Unknown" }

export interface ProcessMediaOptions {
  generateThumbnail?: boolean
  extractAudio?: boolean
}

export interface MediaImportOptions {
  copyToProject?: boolean
  createProxies?: boolean
  analyzeContent?: boolean
  generateThumbnails?: boolean
  preserveMetadata?: boolean
}

export interface MediaImportResult {
  imported: string[]
  failed: Array<{ path: string; error: string }>
}

export interface ProcessMediaResult {
  thumbnailPath?: string
  audioPath?: string
  metadata: MediaMetadata
}

export interface ThumbnailOptions {
  width?: number
  height?: number
  timestamp?: number
}

export interface WaveformData {
  peaks: number[]
  duration: number
  sampleRate: number
}

export interface WaveformOptions {
  width?: number
  height?: number
  color?: string
}

export interface SceneDetectionResult {
  startTime: number
  endTime: number
  confidence: number
}

export interface ProxyGenerationOptions {
  width: number
  height: number
  codec?: string
  bitrate?: string
  preserveAudio?: boolean
  fps?: number
}

export interface ProxyGenerationResult {
  proxyPath: string
  sourcePath: string
  size: number
  resolution: { width: number; height: number }
  generationTime: number
}

export interface ScanFolderOptions {
  recursive?: boolean
  includeHidden?: boolean
}

export interface ScannedMediaFile {
  path: string
  name: string
  size: number
  modifiedAt: string
  type: "video" | "audio" | "image"
  metadata?: MediaMetadata
  thumbnailBase64?: string
}

// ============================================================================
// Interface
// ============================================================================

export interface IMediaService {
  // === Metadata ===

  /**
   * Get metadata for a media file
   */
  getMetadata(filePath: string): Promise<MediaMetadata>

  /**
   * Get list of media files in directory
   */
  getMediaFiles(directory: string): Promise<string[]>

  // === Processing ===

  /**
   * Process media file (thumbnail, audio extraction, etc.)
   */
  processFile(filePath: string, options?: ProcessMediaOptions): Promise<ProcessMediaResult>

  /**
   * Cancel ongoing media processing
   */
  cancelProcessing(filePath: string): Promise<void>

  // === Thumbnails ===

  /**
   * Generate thumbnail for media file
   */
  generateThumbnail(fileId: string, filePath: string, options?: ThumbnailOptions): Promise<string>

  /**
   * Check if cached thumbnail exists
   */
  hasCachedThumbnail(fileId: string, width: number, height: number): Promise<boolean>

  /**
   * Get cached thumbnail path
   */
  getCachedThumbnailPath(fileId: string, width: number, height: number): Promise<string>

  // === Preview Data ===

  /**
   * Save preview data for media file
   */
  savePreviewData(path: string): Promise<void>

  /**
   * Load preview data for media file
   */
  loadPreviewData(path: string): Promise<MediaPreviewData | null>

  /**
   * Get media preview data by file ID
   */
  getPreviewData(fileId: string): Promise<MediaPreviewData | null>

  /**
   * Clear preview data cache
   */
  clearPreviewData(fileId?: string): Promise<void>

  // === Timeline Frames ===

  /**
   * Save timeline frames for a file
   */
  saveTimelineFrames(fileId: string, frames: string[]): Promise<void>

  /**
   * Get timeline frames for a file
   */
  getTimelineFrames(fileId: string): Promise<string[]>

  // === Folder Scanning ===

  /**
   * Scan folder for media files
   */
  scanFolder(folderPath: string, options?: ScanFolderOptions): Promise<ScannedMediaFile[]>

  /**
   * Scan folder with thumbnail generation
   */
  scanFolderWithThumbnails(
    folderPath: string,
    thumbnailWidth: number,
    thumbnailHeight: number,
  ): Promise<ScannedMediaFile[]>

  // === Cache Management ===

  /**
   * Get list of files with cached previews
   */
  getFilesWithPreviews(): Promise<string[]>

  /**
   * Restore preview cache from disk
   */
  restorePreviewCache(): Promise<number>

  // === Device Operations ===

  /**
   * Eject removable device
   */
  ejectDevice(deviceId: string): Promise<void>

  // === Import Operations ===

  /**
   * Import media files into project
   */
  importFiles(paths: string[], options?: MediaImportOptions): Promise<MediaImportResult>

  // === Batch Processing ===

  /**
   * Process multiple media files
   */
  processFiles(filePaths: string[]): Promise<ScannedMediaFile[]>

  /**
   * Process multiple media files with thumbnail generation
   */
  processFilesWithThumbnails(
    filePaths: string[],
    thumbnailWidth: number,
    thumbnailHeight: number,
  ): Promise<ScannedMediaFile[]>

  // === Audio Analysis ===

  /**
   * Generate waveform preview image for audio file
   */
  generateWaveformPreview(audioPath: string, outputPath: string, options?: WaveformOptions): Promise<string>

  /**
   * Generate waveform data for audio file
   */
  generateAudioWaveform(filePath: string): Promise<number[]>

  // === Video Analysis ===

  /**
   * Detect scenes in video file
   */
  detectVideoScenes(filePath: string): Promise<SceneDetectionResult[]>

  /**
   * Generate video thumbnail at specific time
   */
  generateVideoThumbnail(videoPath: string, time: number): Promise<string>

  /**
   * Extract detailed media metadata
   */
  extractMediaMetadata(filePath: string): Promise<MediaMetadata>

  /**
   * Get media duration
   */
  getMediaDuration(filePath: string): Promise<number>

  // === Proxy Generation ===

  /**
   * Generate proxy file for media
   */
  generateProxy(sourcePath: string, options: ProxyGenerationOptions): Promise<ProxyGenerationResult>
}
