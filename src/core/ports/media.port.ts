/**
 * Media Port Interface
 *
 * Контракт для работы с медиафайлами.
 * Реализации: TauriMediaService, NodeMediaService, MockMediaService
 */

// ============================================================================
// Types
// ============================================================================

export interface MediaMetadata {
  duration: number
  width: number
  height: number
  fps: number
  codec: string
  bitrate: number
  audioCodec?: string
  audioChannels?: number
  audioSampleRate?: number
  fileSize: number
  format: string
}

export interface ProcessMediaOptions {
  generateThumbnail?: boolean
  extractAudio?: boolean
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

export interface MediaPreviewData {
  thumbnailPath?: string
  waveformData?: WaveformData
  timelineFrames?: string[]
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
  generateThumbnail(
    fileId: string,
    filePath: string,
    options?: ThumbnailOptions
  ): Promise<string>

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
    thumbnailHeight: number
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
}
