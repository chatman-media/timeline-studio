/**
 * Mock Media Adapter
 *
 * Реализация IMediaService для тестов и разработки без Tauri.
 * Использует in-memory хранилище и mock данные.
 */

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

export class MockMediaService implements IMediaService {
  // In-memory storage for mock data
  private _metadata = new Map<string, MediaMetadata>()
  private _previews = new Map<string, MediaPreviewData>()
  private _thumbnails = new Map<string, string>()
  private _timelineFrames = new Map<string, string[]>()
  private _files = new Map<string, ScannedMediaFile[]>()

  // ============================================================================
  // Metadata
  // ============================================================================

  async getMetadata(filePath: string): Promise<MediaMetadata> {
    // Return stored mock data or generate default
    if (this._metadata.has(filePath)) {
      return this._metadata.get(filePath)!
    }

    // Generate default metadata based on file extension
    const ext = filePath.split(".").pop()?.toLowerCase() || ""
    const isVideo = ["mp4", "mov", "avi", "mkv", "webm"].includes(ext)
    const isAudio = ["mp3", "wav", "ogg", "flac", "aac"].includes(ext)
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)

    if (isVideo) {
      return {
        type: "Video",
        duration: 120.5,
        width: 1920,
        height: 1080,
        fps: 30,
        codec: "h264",
        bitrate: 5000000,
        size: 50000000,
      }
    }

    if (isAudio) {
      return {
        type: "Audio",
        duration: 120.5,
        codec: "aac",
        bitrate: 320000,
        sample_rate: 48000,
        channels: 2,
        size: 5000000,
      }
    }

    if (isImage) {
      return {
        type: "Image",
        width: 1920,
        height: 1080,
        format: ext,
        size: 2000000,
      }
    }

    return { type: "Unknown" }
  }

  async getMediaFiles(directory: string): Promise<string[]> {
    // Return mock file list
    return [`${directory}/video1.mp4`, `${directory}/video2.mov`, `${directory}/audio1.mp3`, `${directory}/image1.jpg`]
  }

  // ============================================================================
  // Processing
  // ============================================================================

  async processFile(filePath: string, options?: ProcessMediaOptions): Promise<ProcessMediaResult> {
    const metadata = await this.getMetadata(filePath)

    return {
      thumbnailPath: options?.generateThumbnail ? `/tmp/thumb_${Date.now()}.jpg` : undefined,
      audioPath: options?.extractAudio ? `/tmp/audio_${Date.now()}.wav` : undefined,
      metadata,
    }
  }

  async cancelProcessing(_filePath: string): Promise<void> {
    // No-op in mock
  }

  // ============================================================================
  // Thumbnails
  // ============================================================================

  async generateThumbnail(fileId: string, _filePath: string, options?: ThumbnailOptions): Promise<string> {
    const key = `${fileId}_${options?.width || 320}_${options?.height || 180}`
    const thumbnailPath = `/tmp/thumbnails/${key}.jpg`
    this._thumbnails.set(key, thumbnailPath)
    return thumbnailPath
  }

  async hasCachedThumbnail(fileId: string, width: number, height: number): Promise<boolean> {
    const key = `${fileId}_${width}_${height}`
    return this._thumbnails.has(key)
  }

  async getCachedThumbnailPath(fileId: string, width: number, height: number): Promise<string> {
    const key = `${fileId}_${width}_${height}`
    return this._thumbnails.get(key) || `/tmp/thumbnails/${key}.jpg`
  }

  // ============================================================================
  // Preview Data
  // ============================================================================

  async savePreviewData(path: string): Promise<void> {
    this._previews.set(path, {
      thumbnailPath: `/tmp/preview_${path.replace(/\//g, "_")}.jpg`,
      waveformData: {
        peaks: Array(100)
          .fill(0)
          .map(() => Math.random()),
        duration: 120.5,
        sampleRate: 48000,
      },
    })
  }

  async loadPreviewData(path: string): Promise<MediaPreviewData | null> {
    return this._previews.get(path) || null
  }

  async getPreviewData(fileId: string): Promise<MediaPreviewData | null> {
    return this._previews.get(fileId) || null
  }

  async clearPreviewData(fileId?: string): Promise<void> {
    if (fileId) {
      this._previews.delete(fileId)
    } else {
      this._previews.clear()
    }
  }

  // ============================================================================
  // Timeline Frames
  // ============================================================================

  async saveTimelineFrames(fileId: string, frames: string[]): Promise<void> {
    this._timelineFrames.set(fileId, frames)
  }

  async getTimelineFrames(fileId: string): Promise<string[]> {
    return this._timelineFrames.get(fileId) || []
  }

  // ============================================================================
  // Folder Scanning
  // ============================================================================

  async scanFolder(folderPath: string): Promise<ScannedMediaFile[]> {
    // Return stored mock data or generate default
    if (this._files.has(folderPath)) {
      return this._files.get(folderPath)!
    }

    // Generate mock files
    return [
      {
        path: `${folderPath}/video1.mp4`,
        name: "video1.mp4",
        size: 50000000,
        modifiedAt: new Date().toISOString(),
        type: "video",
      },
      {
        path: `${folderPath}/video2.mov`,
        name: "video2.mov",
        size: 75000000,
        modifiedAt: new Date().toISOString(),
        type: "video",
      },
      {
        path: `${folderPath}/audio1.mp3`,
        name: "audio1.mp3",
        size: 5000000,
        modifiedAt: new Date().toISOString(),
        type: "audio",
      },
    ]
  }

  async scanFolderWithThumbnails(folderPath: string, _width: number, _height: number): Promise<ScannedMediaFile[]> {
    const files = await this.scanFolder(folderPath)
    return files.map((file) => ({
      ...file,
      thumbnailBase64: "data:image/jpeg;base64,/9j/4AAQ...", // Mock base64
    }))
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  async getFilesWithPreviews(): Promise<string[]> {
    return Array.from(this._previews.keys())
  }

  async restorePreviewCache(): Promise<number> {
    return this._previews.size
  }

  // ============================================================================
  // Device Operations
  // ============================================================================

  async ejectDevice(_deviceId: string): Promise<void> {
    // No-op in mock
  }

  // ============================================================================
  // Import Operations
  // ============================================================================

  async importFiles(paths: string[], _options?: MediaImportOptions): Promise<MediaImportResult> {
    // Mock successful import
    return {
      imported: paths,
      failed: [],
    }
  }

  // ============================================================================
  // Batch Processing
  // ============================================================================

  async processFiles(filePaths: string[]): Promise<ScannedMediaFile[]> {
    // Return mock processed files
    return filePaths.map((path) => {
      const name = path.split("/").pop() || path
      const ext = name.split(".").pop()?.toLowerCase() || ""
      const isVideo = ["mp4", "mov", "avi", "mkv", "webm"].includes(ext)
      const isAudio = ["mp3", "wav", "ogg", "flac", "aac"].includes(ext)

      return {
        path,
        name,
        size: 50000000,
        modifiedAt: new Date().toISOString(),
        type: isVideo ? "video" : isAudio ? "audio" : "image",
      } as ScannedMediaFile
    })
  }

  async processFilesWithThumbnails(filePaths: string[], _width: number, _height: number): Promise<ScannedMediaFile[]> {
    const files = await this.processFiles(filePaths)
    return files.map((file) => ({
      ...file,
      thumbnailBase64: "data:image/jpeg;base64,/9j/4AAQ...", // Mock base64
    }))
  }

  // ============================================================================
  // Audio Analysis
  // ============================================================================

  async generateWaveformPreview(_audioPath: string, outputPath: string, _options?: WaveformOptions): Promise<string> {
    return outputPath
  }

  async generateAudioWaveform(_filePath: string): Promise<number[]> {
    // Return mock waveform data
    return new Array(1000).fill(0).map(() => Math.random())
  }

  // ============================================================================
  // Video Analysis
  // ============================================================================

  async detectVideoScenes(_filePath: string): Promise<SceneDetectionResult[]> {
    // Return mock scenes
    return [
      { startTime: 0, endTime: 5, confidence: 0.95 },
      { startTime: 5, endTime: 12, confidence: 0.87 },
      { startTime: 12, endTime: 20, confidence: 0.92 },
    ]
  }

  async generateVideoThumbnail(_videoPath: string, _time: number): Promise<string> {
    return `/tmp/thumbnail_${Date.now()}.jpg`
  }

  async extractMediaMetadata(filePath: string): Promise<MediaMetadata> {
    return this.getMetadata(filePath)
  }

  async getMediaDuration(_filePath: string): Promise<number> {
    return 120.5 // Mock duration in seconds
  }

  // ============================================================================
  // Proxy Generation
  // ============================================================================

  async generateProxy(sourcePath: string, options: ProxyGenerationOptions): Promise<ProxyGenerationResult> {
    // Mock proxy generation
    return {
      proxyPath: `/tmp/proxy_${Date.now()}.mp4`,
      sourcePath,
      size: 10000000, // Mock size ~10MB
      resolution: { width: options.width, height: options.height },
      generationTime: 5000, // Mock 5 seconds
    }
  }

  // ============================================================================
  // Test Helpers
  // ============================================================================

  /**
   * Set mock metadata for testing
   */
  setMetadata(filePath: string, metadata: MediaMetadata): void {
    this._metadata.set(filePath, metadata)
  }

  /**
   * Set mock preview data for testing
   */
  setPreviewData(fileId: string, preview: MediaPreviewData): void {
    this._previews.set(fileId, preview)
  }

  /**
   * Set mock files for a folder
   */
  setFolderFiles(folderPath: string, files: ScannedMediaFile[]): void {
    this._files.set(folderPath, files)
  }

  /**
   * Reset all mock data
   */
  reset(): void {
    this._metadata.clear()
    this._previews.clear()
    this._thumbnails.clear()
    this._timelineFrames.clear()
    this._files.clear()
  }
}
